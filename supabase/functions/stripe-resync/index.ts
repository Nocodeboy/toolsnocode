import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createBoostSync, secretsMatch } from '../_shared/boost-sync.ts';

/**
 * POST { customer_id } con `X-Resync-Secret: <RESYNC_SECRET>` y la clave
 * anónima en `Authorization`, que es lo que exige la pasarela de Supabase
 * antes de entregar la petición. Dos puertas: la pasarela y este secreto.
 *
 * Vuelve a leer las suscripciones del cliente en Stripe y aplica el Boost que
 * corresponda, exactamente como lo haría el webhook. Para cuando el webhook no
 * llegó, no pudo, o llegó antes de que existiera el arreglo que lo hace
 * funcionar — que es cómo un cliente que pagó en junio se activa en septiembre
 * sin pedirle a nadie que toque el panel de Stripe.
 *
 * No hay CORS a propósito: se llama desde una terminal, no desde el navegador.
 */
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { appInfo: { name: 'ToolsNoCode', version: '1.0.0' } });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const { syncCustomerFromStripe } = createBoostSync(stripe, supabase);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const expected = Deno.env.get('RESYNC_SECRET');
  const provided = req.headers.get('X-Resync-Secret') ?? '';
  if (!expected || !(await secretsMatch(provided, expected))) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Body must be JSON' }, { status: 400 });
  }

  // Modo lectura: `{ price_id }` describe un precio; `{ customer_id, inspect: true }`
  // lista las suscripciones del cliente sin tocar la base. Para responder
  // "¿qué es este price_id?" sin abrir el panel ni compartir la clave.
  if (typeof body.price_id === 'string') {
    try {
      const price = await stripe.prices.retrieve(body.price_id, { expand: ['product'] });
      const product = price.product as Stripe.Product;
      return Response.json({
        id: price.id, active: price.active, currency: price.currency,
        unit_amount: price.unit_amount, recurring: price.recurring,
        product: { id: product.id, name: product.name, active: product.active },
        created: new Date(price.created * 1000).toISOString(),
      });
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
    }
  }

  const customerId = body.customer_id;
  if (typeof customerId !== 'string' || !/^cus_[A-Za-z0-9]+$/.test(customerId)) {
    return Response.json({ error: 'customer_id must look like cus_…' }, { status: 400 });
  }

  if (body.inspect === true) {
    const customer = await stripe.customers.retrieve(customerId);
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
    return Response.json({
      customer: customer.deleted ? { deleted: true } : { email: customer.email, name: customer.name, created: new Date(customer.created * 1000).toISOString() },
      subscriptions: subs.data.map((s) => ({
        id: s.id, status: s.status, price_id: s.items.data[0]?.price.id,
        amount: s.items.data[0]?.price.unit_amount, currency: s.currency,
        interval: s.items.data[0]?.price.recurring?.interval,
        created: new Date(s.created * 1000).toISOString(),
        period_end: new Date(s.current_period_end * 1000).toISOString(),
        canceled_at: s.canceled_at ? new Date(s.canceled_at * 1000).toISOString() : null,
        metadata: s.metadata,
      })),
    });
  }

  try {
    const result = await syncCustomerFromStripe(customerId);
    const { data: tools } = await supabase
      .from('tools')
      .select('name, slug, is_boosted, boost_expires_at')
      .in('user_id', (await supabase.from('stripe_customers').select('user_id').eq('customer_id', customerId)).data?.map((r) => r.user_id) ?? []);
    return Response.json({ customer_id: customerId, ...result, tools });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});
