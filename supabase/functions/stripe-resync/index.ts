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

  let customerId: unknown;
  try {
    ({ customer_id: customerId } = await req.json());
  } catch {
    return Response.json({ error: 'Body must be JSON' }, { status: 400 });
  }
  if (typeof customerId !== 'string' || !/^cus_[A-Za-z0-9]+$/.test(customerId)) {
    return Response.json({ error: 'customer_id must look like cus_…' }, { status: 400 });
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
