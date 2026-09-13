import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { isAllowedRedirectUrl, resolveOrigin } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const ALLOWED_PRICES: Record<string, { mode: 'subscription' | 'payment' }> = {
  price_1PrIksIs6L3hD9y66zoxwAX9: { mode: 'subscription' },
};

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200, requestOrigin?: string) {
  const origin = resolveOrigin(requestOrigin);
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  };

  // For 204 No Content, don't include Content-Type or body
  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  const reqOrigin = req.headers.get('Origin') ?? undefined;
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204, reqOrigin);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405, reqOrigin);
    }

    const { price_id, success_url, cancel_url, mode, tool_id } = await req.json();

    const error = validateParameters(
      { price_id, success_url, cancel_url, mode },
      {
        cancel_url: 'string',
        price_id: 'string',
        success_url: 'string',
        mode: { values: ['payment', 'subscription'] },
      },
    );

    if (error) {
      return corsResponse({ error }, 400, reqOrigin);
    }

    const allowedPrice = ALLOWED_PRICES[price_id];
    if (!allowedPrice) {
      return corsResponse({ error: 'Invalid price_id' }, 400, reqOrigin);
    }
    if (allowedPrice.mode !== mode) {
      return corsResponse({ error: `price_id ${price_id} requires mode ${allowedPrice.mode}` }, 400, reqOrigin);
    }


    // Validate redirect URLs to prevent open redirect attacks
    for (const url of [success_url, cancel_url]) {
      try {
        new URL(url);
      } catch {
        return corsResponse({ error: `Malformed URL: ${url}` }, 400, reqOrigin);
      }
      if (!isAllowedRedirectUrl(url)) {
        return corsResponse({ error: `Invalid redirect URL: ${url}` }, 400, reqOrigin);
      }
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return corsResponse({ error: 'Missing or invalid Authorization header' }, 401, reqOrigin);
    }
    const token = authHeader.slice(7);
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401, reqOrigin);
    }

    if (!user) {
      return corsResponse({ error: 'User not found' }, 404, reqOrigin);
    }

    /**
     * El Boost impulsa una herramienta concreta, y `tool_id` es lo que el
     * webhook lee de los metadatos para activarlo. Dos formas de cobrar sin
     * activar nada, ambas silenciosas para quien paga:
     *
     *  - sin `tool_id`: la suscripción se crea y el webhook no tiene a qué
     *    aplicarla;
     *  - con el `tool_id` de otro: `activateBoost` filtra por `user_id`, así
     *    que el update no toca ninguna fila y el cobro se queda sin efecto.
     *
     * Las dos se cierran aquí, antes de cobrar, donde todavía se puede
     * devolver un error que el cliente vea.
     */
    if (!tool_id || typeof tool_id !== 'string') {
      return corsResponse({ error: 'tool_id is required: a boost has to point at a tool' }, 400, reqOrigin);
    }

    const { data: ownedTool, error: toolLookupError } = await supabase
      .from('tools')
      .select('id')
      .eq('id', tool_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (toolLookupError) {
      console.error('Failed to verify tool ownership:', toolLookupError);
      return corsResponse({ error: 'Could not verify the tool' }, 500, reqOrigin);
    }

    if (!ownedTool) {
      return corsResponse({ error: 'That tool does not exist or is not yours' }, 403, reqOrigin);
    }

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError) {
      console.error('Failed to fetch customer information from the database', getCustomerError);

      return corsResponse({ error: 'Failed to fetch customer information' }, 500, reqOrigin);
    }

    let customerId;

    /**
     * In case we don't have a mapping yet, the customer does not exist and we need to create one.
     */
    if (!customer || !customer.customer_id) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      console.log(`Created new Stripe customer ${newCustomer.id} for user ${user.id}`);

      const { error: createCustomerError } = await supabase.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: newCustomer.id,
      });

      if (createCustomerError) {
        console.error('Failed to save customer information in the database', createCustomerError);

        // Try to clean up both the Stripe customer and subscription record
        try {
          await stripe.customers.del(newCustomer.id);
          await supabase.from('stripe_subscriptions').delete().eq('customer_id', newCustomer.id);
        } catch (deleteError) {
          console.error('Failed to clean up after customer mapping error:', deleteError);
        }

        return corsResponse({ error: 'Failed to create customer mapping' }, 500, reqOrigin);
      }

      if (mode === 'subscription') {
        const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
          customer_id: newCustomer.id,
          status: 'not_started',
        });

        if (createSubscriptionError) {
          console.error('Failed to save subscription in the database', createSubscriptionError);

          // Try to clean up the Stripe customer since we couldn't create the subscription
          try {
            await stripe.customers.del(newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to delete Stripe customer after subscription creation error:', deleteError);
          }

          return corsResponse({ error: 'Unable to save the subscription in the database' }, 500, reqOrigin);
        }
      }

      customerId = newCustomer.id;

      console.log(`Successfully set up new customer ${customerId} with subscription record`);
    } else {
      customerId = customer.customer_id;

      if (mode === 'subscription') {
        // Verify subscription exists for existing customer
        const { data: subscription, error: getSubscriptionError } = await supabase
          .from('stripe_subscriptions')
          .select('status')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (getSubscriptionError) {
          console.error('Failed to fetch subscription information from the database', getSubscriptionError);

          return corsResponse({ error: 'Failed to fetch subscription information' }, 500, reqOrigin);
        }

        if (!subscription) {
          // Create subscription record for existing customer if missing
          const { error: createSubscriptionError } = await supabase.from('stripe_subscriptions').insert({
            customer_id: customerId,
            status: 'not_started',
          });

          if (createSubscriptionError) {
            console.error('Failed to create subscription record for existing customer', createSubscriptionError);

            return corsResponse({ error: 'Failed to create subscription record for existing customer' }, 500, reqOrigin);
          }
        }
      }
    }

    // Prevent duplicate subscriptions
    if (mode === 'subscription') {
      const { data: existingSub } = await supabase
        .from('stripe_subscriptions')
        .select('status')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (existingSub?.status === 'active') {
        return corsResponse(
          { error: 'You already have an active subscription. Manage it from your account page.' },
          400,
          reqOrigin,
        );
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url,
      cancel_url,
    };

    sessionParams.metadata = { tool_id };
    if (mode === 'subscription') {
      sessionParams.subscription_data = { metadata: { tool_id } };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`Created checkout session ${session.id} for customer ${customerId}`);

    return corsResponse({ sessionId: session.id, url: session.url }, 200, reqOrigin);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Checkout error: ${message}`);
    return corsResponse({ error: message }, 500, reqOrigin);
  }
});

type ExpectedType = 'string' | { values: string[] };
type Expectations<T> = { [K in keyof T]: ExpectedType };

function validateParameters<T extends Record<string, unknown>>(values: T, expected: Expectations<T>): string | undefined {
  for (const parameter in values) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }

  return undefined;
}