import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createBoostSync } from '../_shared/boost-sync.ts';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const { syncCustomerFromStripe, deactivateExpiredBoosts } = createBoostSync(stripe, supabase);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Webhook signature verification failed: ${message}`);
      return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
    }

    const { error: insertError } = await supabase
      .from('stripe_webhook_events')
      .insert({ event_id: event.id, event_type: event.type });

    if (insertError) {
      if (insertError.code === '23505') {
        console.info(`Duplicate webhook event ignored: ${event.id} (${event.type})`);
        return Response.json({ received: true, duplicate: true });
      }
      console.error('Failed to record webhook event:', insertError);
      return Response.json({ error: 'Failed to record event' }, { status: 500 });
    }

    try {
      await handleEvent(event);
    } catch (handlerError) {
      console.error('Webhook handler error:', handlerError);
      await supabase.from('stripe_webhook_events').delete().eq('event_id', event.id);
      return Response.json({ error: 'Handler failed' }, { status: 500 });
    }

    // La barrida de Boosts caducados vive ahora en pg_cron (`expire-stale-boosts`,
    // diaria). Colgarla del webhook significaba que un Boost solo caducaba si
    // OTRO cliente estaba pagando en ese momento — con un único cliente, nunca.
    // Se mantiene aquí como red de seguridad, no como mecanismo.
    EdgeRuntime.waitUntil(
      deactivateExpiredBoosts().catch(err => console.error('Expired boost cleanup error:', err))
    );

    return Response.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing webhook:', error);
    return Response.json({ error: message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  console.info(`Processing webhook event: ${event.type}`);

  switch (event.type) {
    // Checkout completed — handles both subscription and one-time payments
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string | null;

      if (!customerId) {
        console.error('No customer on checkout.session.completed');
        return;
      }

      if (session.mode === 'subscription') {
        console.info(`Subscription checkout completed for customer: ${customerId}`);
        await syncCustomerFromStripe(customerId);
      } else if (session.mode === 'payment' && session.payment_status === 'paid') {
        try {
          const { error: orderError } = await supabase.from('stripe_orders').insert({
            checkout_session_id: session.id,
            payment_intent_id: session.payment_intent,
            customer_id: customerId,
            amount_subtotal: session.amount_subtotal,
            amount_total: session.amount_total,
            currency: session.currency,
            payment_status: session.payment_status,
            status: 'completed',
          });

          if (orderError) {
            console.error('Error inserting order:', orderError);
            return;
          }
          console.info(`One-time payment processed for session: ${session.id}`);
        } catch (error) {
          console.error('Error processing one-time payment:', error);
        }
      }
      break;
    }

    // Subscription renewed, upgraded, downgraded, or payment method changed
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      if (!customerId) {
        console.error('No customer on subscription.updated');
        return;
      }

      console.info(`Subscription updated for customer: ${customerId}, status: ${subscription.status}`);
      await syncCustomerFromStripe(customerId);
      break;
    }

    // Subscription fully canceled (after period end or immediately)
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      if (!customerId) {
        console.error('No customer on subscription.deleted');
        return;
      }

      console.info(`Subscription deleted for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
      break;
    }

    // Payment failed on invoice (renewal failure)
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string | null;

      if (!customerId) {
        console.error('No customer on invoice.payment_failed');
        return;
      }

      console.info(`Invoice payment failed for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
      break;
    }

    // One-time payment succeeded (skip if it has an invoice — that's subscription-related)
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.invoice !== null) {
        return; // subscription invoice, already handled via checkout/subscription events
      }
      // One-time payments are handled via checkout.session.completed
      break;
    }

    default:
      console.info(`Unhandled event type: ${event.type}`);
  }
}
