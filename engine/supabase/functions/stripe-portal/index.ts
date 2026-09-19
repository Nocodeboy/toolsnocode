import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { getCorsHeaders, isAllowedRedirectUrl } from '../_shared/cors.ts';

/**
 * Abre el portal de facturación de Stripe para el usuario autenticado.
 *
 * Hasta ahora "Manage Subscription" llevaba a /account, que no sabe nada de
 * pagos. Un cliente no podía cancelar, cambiar de tarjeta ni descargar una
 * factura desde el sitio: tenía que escribir. El portal lo hace todo y lo
 * mantiene Stripe.
 *
 * Requiere haber activado el portal una vez en el panel de Stripe
 * (Settings → Billing → Customer portal); sin eso, Stripe rechaza la sesión.
 */
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { appInfo: { name: 'Directory', version: '1.0.0' } });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req, 'POST, OPTIONS');
  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Missing Authorization header' }, 401);

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return json({ error: 'Not authenticated' }, 401);

  let returnUrl: unknown;
  try {
    ({ return_url: returnUrl } = await req.json());
  } catch {
    returnUrl = undefined;
  }
  if (typeof returnUrl !== 'string' || !isAllowedRedirectUrl(returnUrl)) {
    return json({ error: 'return_url must be on an allowed origin' }, 400);
  }

  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('customer_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!customer) return json({ error: 'No billing account for this user yet' }, 404);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.customer_id,
      return_url: returnUrl,
    });
    return json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Portal session failed:', message);
    return json({ error: message }, 502);
  }
});
