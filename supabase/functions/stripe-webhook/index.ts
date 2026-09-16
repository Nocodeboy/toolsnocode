import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

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

async function syncCustomerFromStripe(customerId: string) {
  try {
    // `limit: 1` cogía la suscripción más reciente, que no es necesariamente la
    // que está pagando: un cliente que cancela y vuelve deja una cancelada por
    // delante. Se piden varias y se elige por estado.
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }

      await deactivateBoostForCustomer(customerId);
      return;
    }

    const LIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];
    const subscription =
      subscriptions.data.find((sub) => LIVE_STATUSES.includes(sub.status)) ?? subscriptions.data[0];

    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }

    const toolId = subscription.metadata?.tool_id;

    if (['active', 'trialing'].includes(subscription.status)) {
      await activateBoost(customerId, toolId, subscription.current_period_end);
    } else if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
      // `past_due` ya no entra aquí. Stripe reintenta un cobro fallido durante
      // semanas antes de rendirse y pasar a `unpaid`; apagar el Boost al primer
      // fallo le quitaba al cliente lo que ha pagado por una tarjeta que casi
      // siempre acaba pasando. `unpaid` y `canceled` sí son el final del camino.
      await deactivateBoostForCustomer(customerId, toolId);
    } else if (subscription.status === 'past_due') {
      console.info(`Customer ${customerId} is past_due; boost kept while Stripe retries`);
    }

    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}

/**
 * Quién es el cliente, con red de seguridad.
 *
 * `stripe_customers` solo tiene filas de quien pasó por el checkout de la app.
 * Un pago por Payment Link o desde el panel de Stripe crea el cliente en
 * Stripe y nada aquí, y el webhook se quedaba sin usuario al que aplicar el
 * Boost. Así estuvo tres meses una suscripción anual pagada y activa.
 *
 * Stripe sí conoce el email. Con el email se llega al usuario, y de paso se
 * escribe la fila que faltaba para que la próxima vez no haga falta.
 */
async function resolveUserId(customerId: string): Promise<string | null> {
  const { data: mapped } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (mapped?.user_id) return mapped.user_id;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !customer.email) {
    console.error(`Customer ${customerId} has no email in Stripe; cannot resolve a user`);
    return null;
  }

  const { data: userId, error } = await supabase.rpc('user_id_by_email', { p_email: customer.email });
  if (error || !userId) {
    console.error(`No ToolsNoCode user with email ${customer.email} for Stripe customer ${customerId}`);
    return null;
  }

  const { error: insertError } = await supabase
    .from('stripe_customers')
    .insert({ user_id: userId, customer_id: customerId });
  if (insertError) {
    console.error(`Resolved ${customerId} by email but could not store the mapping:`, insertError);
  } else {
    console.info(`Stripe customer ${customerId} mapped to user ${userId} by email (paid outside the app checkout)`);
  }

  return userId;
}

async function activateBoost(customerId: string, toolId: string | undefined, periodEnd: number) {
  try {
    const userId = await resolveUserId(customerId);
    if (!userId) return;

    // Sin `tool_id` en los metadatos (Payment Link, panel de Stripe) solo hay
    // una lectura segura: si el maker tiene una única herramienta, es esa. Con
    // varias no se adivina; se deja escrito y lo decide una persona.
    let targetToolId = toolId;
    if (!targetToolId) {
      const { data: owned } = await supabase.from('tools').select('id, name').eq('user_id', userId).limit(2);
      if (owned?.length === 1) {
        targetToolId = owned[0].id;
        console.info(`No tool_id on subscription; user ${userId} owns exactly one tool (${owned[0].name}), boosting it`);
      } else {
        console.error(`No tool_id on subscription and user ${userId} owns ${owned?.length ?? 0} tools; boost NOT applied — needs a human`);
        return;
      }
    }

    const expiresAt = new Date(periodEnd * 1000).toISOString();

    const { error, count } = await supabase
      .from('tools')
      .update({
        is_boosted: true,
        boost_expires_at: expiresAt,
        boost_plan: 'boost',
      }, { count: 'exact' })
      .eq('id', targetToolId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error activating boost:', error);
    } else if (!count) {
      console.error(`Boost update matched no row: tool ${targetToolId} is not owned by user ${userId}`);
    } else {
      console.info(`Boost activated for tool ${targetToolId} until ${expiresAt}`);
    }
  } catch (error) {
    console.error('Error in activateBoost:', error);
  }
}

async function deactivateBoostForCustomer(customerId: string, toolId?: string) {
  try {
    const userId = await resolveUserId(customerId);
    if (!userId) return;

    let query = supabase
      .from('tools')
      .update({
        is_boosted: false,
        boost_expires_at: null,
        boost_plan: '',
      })
      .eq('user_id', userId)
      .eq('is_boosted', true);

    if (toolId) {
      query = query.eq('id', toolId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deactivating boost:', error);
    } else {
      console.info(`Boost deactivated for customer ${customerId}${toolId ? ` tool ${toolId}` : ' (all tools)'}`);
    }
  } catch (error) {
    console.error('Error in deactivateBoostForCustomer:', error);
  }
}

/**
 * Deactivate all expired boosts across the platform.
 * Called on every webhook to catch any tools whose boost_expires_at has passed
 * without a corresponding webhook event (e.g., network failures).
 */
async function deactivateExpiredBoosts() {
  try {
    const { error, count } = await supabase
      .from('tools')
      .update({
        is_boosted: false,
        boost_expires_at: null,
        boost_plan: '',
      })
      .eq('is_boosted', true)
      .lt('boost_expires_at', new Date().toISOString());

    if (error) {
      console.error('Error deactivating expired boosts:', error);
    } else if (count && count > 0) {
      console.info(`Deactivated ${count} expired boosts`);
    }
  } catch (error) {
    console.error('Error in deactivateExpiredBoosts:', error);
  }
}