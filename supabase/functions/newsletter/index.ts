import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { getCorsHeaders } from '../_shared/cors.ts';
import { button, esc, sendEmail } from '../_shared/email.ts';

/**
 * Alta, confirmación y baja del boletín.
 *
 *   POST {email, source?}            pide el alta y manda el correo de confirmación
 *   GET  ?action=confirm&token=…     confirma
 *   GET  ?action=unsubscribe&token=… se da de baja
 *
 * Doble confirmación: una dirección no recibe nada hasta que alguien abre el
 * enlace que llegó a ese buzón. Sin eso cualquiera puede apuntar la dirección
 * de otro, y esas quejas se pagan con la reputación del dominio.
 *
 * El POST contesta siempre lo mismo, exista o no la dirección: decir "ya
 * estabas suscrito" convierte el formulario en un comprobador de quién está
 * en la lista.
 *
 * Es pública a propósito (desplegada con --no-verify-jwt): la llama el
 * formulario del sitio y la abren los enlaces del correo.
 */
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const SITE = 'https://toolsnocode.com';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** Un reenvío por dirección cada diez minutos: ni bucles ni buzones inundados. */
const RESEND_AFTER_MS = 10 * 60 * 1000;

const linkFor = (action: 'confirm' | 'unsubscribe', token: string) =>
  `${SITE}/newsletter/${action}?token=${token}`;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);

  if (req.method === 'GET') {
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token') ?? '';
    if (action !== 'confirm' && action !== 'unsubscribe') return page(400, 'Link not recognised', 'That link is missing something. Open the one in the email exactly as it arrived.');
    if (!/^[0-9a-f-]{36}$/i.test(token)) return page(400, 'Link not recognised', 'That link is missing something. Open the one in the email exactly as it arrived.');
    return action === 'confirm' ? await confirm(token) : await unsubscribe(token);
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

  let body: { email?: unknown; source?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: 'Body must be JSON' }, { status: 400, headers: cors }); }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const source = typeof body.source === 'string' ? body.source.slice(0, 60) : null;
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'That does not look like an email address.' }, { status: 400, headers: cors });
  }

  // La misma respuesta pase lo que pase por debajo.
  const done = Response.json(
    { ok: true, message: 'Check your inbox — there is a link to confirm.' },
    { headers: cors },
  );

  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, status, token, last_sent_at')
    .eq('email', email)
    .maybeSingle();

  if (existing?.status === 'confirmed') return done;

  if (existing) {
    const last = existing.last_sent_at ? Date.parse(existing.last_sent_at) : 0;
    if (Date.now() - last < RESEND_AFTER_MS) return done;

    // Quien se dio de baja y vuelve estrena token: el viejo estuvo en un
    // correo que ya no controlamos.
    const token = existing.status === 'unsubscribed' ? crypto.randomUUID() : existing.token;
    await supabase.from('newsletter_subscribers')
      .update({ status: 'pending', token, unsubscribed_at: null, last_sent_at: new Date().toISOString() })
      .eq('id', existing.id);
    await sendConfirmation(email, token);
    return done;
  }

  const token = crypto.randomUUID();
  const { error } = await supabase.from('newsletter_subscribers')
    .insert({ email, token, source, last_sent_at: new Date().toISOString() });
  if (error) {
    console.error('newsletter: no se pudo dar de alta:', error.message);
    return done; // Una carrera con otra alta de la misma dirección no es asunto del lector.
  }
  await sendConfirmation(email, token);
  return done;
});

async function sendConfirmation(email: string, token: string) {
  await sendEmail({
    to: email,
    subject: 'Confirm your ToolsNoCode subscription',
    headers: { 'List-Unsubscribe': `<${linkFor('unsubscribe', token)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    text: [
      'One click and you are on the list.',
      '',
      linkFor('confirm', token),
      '',
      'One edition a week, on Mondays: what actually came into the directory and what it says about where AI and no-code tooling is going. Written from the data, not from press releases.',
      '',
      'If you did not ask for this, ignore this email — nothing is sent until you confirm.',
    ].join('\n'),
    html: `<p style="margin:0 0 12px;">One click and you are on the list.</p>
${button(linkFor('confirm', token), 'Confirm subscription')}
<p style="margin:0 0 12px;">One edition a week, on Mondays: what actually came into the directory and what it says about where AI and no-code tooling is going. Written from the data, not from press releases.</p>
<p style="margin:0;color:#8a8a8e;font-size:13px;">If you did not ask for this, ignore this email — nothing is sent until you confirm.</p>`,
  });
}

async function confirm(token: string): Promise<Response> {
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('token', token)
    .maybeSingle();
  if (!data) return page(404, 'Link not recognised', 'This link has been replaced by a newer one. Ask for the email again from the site.');
  if (data.status === 'confirmed') return page(200, 'You are already on the list', 'Nothing else to do — the next edition goes out on Monday.');

  const { error } = await supabase.from('newsletter_subscribers')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), unsubscribed_at: null })
    .eq('id', data.id);
  if (error) return page(500, 'Something went wrong', 'Try the link again in a minute.');

  return page(200, 'You are on the list', 'One edition a week, on Mondays. Every one of them has an unsubscribe link at the bottom.');
}

async function unsubscribe(token: string): Promise<Response> {
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('token', token)
    .maybeSingle();
  if (!data) return page(404, 'Link not recognised', 'This link is no longer valid. If you are still receiving the newsletter, use the link at the bottom of the latest one.');
  if (data.status !== 'unsubscribed') {
    await supabase.from('newsletter_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('id', data.id);
  }
  return page(200, 'Unsubscribed', 'You will not get the newsletter again. The directory stays where it is if you want to come back.');
}

/**
 * La página que ve quien abre el enlace. Se sirve entera desde aquí, sin pasar
 * por la aplicación: un enlace de correo tiene que funcionar aunque el resto
 * del sitio esté caído, y con JavaScript desactivado.
 */
function page(status: number, title: string, body: string): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(title)} — ToolsNoCode</title>
<style>
 :root{color-scheme:dark}
 body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0f;color:#e5e5ea;
      font:400 16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px}
 .card{max-width:420px;text-align:center}
 h1{font-size:22px;margin:0 0 10px;color:#fff}
 p{margin:0 0 24px;color:#a1a1aa}
 a{display:inline-block;padding:10px 18px;border-radius:10px;background:#10b981;color:#052e1f;text-decoration:none;font-weight:600;font-size:14px}
</style></head>
<body><div class="card"><h1>${esc(title)}</h1><p>${esc(body)}</p>
<a href="${SITE}/news">Read the latest edition</a></div></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
}
