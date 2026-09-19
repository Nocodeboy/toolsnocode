import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { secretsMatch } from '../_shared/boost-sync.ts';
import { describeItem, emailMatchesSite, itemUrl } from '../_shared/claims.ts';
import { button, esc, operatorEmail, sendEmail } from '../_shared/email.ts';

/**
 * Avisa de que ha entrado una reclamación de ficha.
 *
 *   POST { id }   cabecera X-Claims-Notify-Secret
 *
 * La llama un disparador de `claim_requests` (ver la migración
 * `20260919_claim_notify.sql`). Hasta ahora una reclamación entraba en la
 * tabla y ahí se quedaba: nadie recibía nada, así que nadie la miraba. El
 * correo lleva el contexto necesario para decidir sin abrir la base de datos,
 * incluido si el reclamante escribe desde el dominio de la herramienta.
 */
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const expected = Deno.env.get('CLAIMS_NOTIFY_SECRET');
  if (!expected || !(await secretsMatch(req.headers.get('X-Claims-Notify-Secret') ?? '', expected))) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: { id?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: 'Body must be JSON' }, { status: 400 }); }
  if (typeof body.id !== 'string') return Response.json({ error: 'id is required' }, { status: 400 });

  const to = operatorEmail();
  if (!to) return Response.json({ error: 'OPERATOR_EMAIL missing' }, { status: 500 });

  const { data: claim } = await supabase
    .from('claim_requests')
    .select('id, item_type, item_id, user_id, status, justification, contact_proof, created_at')
    .eq('id', body.id)
    .maybeSingle();
  if (!claim) return Response.json({ error: 'unknown claim' }, { status: 404 });

  const item = await describeItem(supabase, claim.item_type, claim.item_id);
  const { data: claimant } = await supabase.auth.admin.getUserById(claim.user_id);
  const email = claimant?.user?.email ?? null;
  const match = emailMatchesSite(email, item?.website ?? null);
  const url = itemUrl(claim.item_type, item?.slug ?? null);

  // El dato que decide. Ponerlo en el asunto ahorra abrir el correo para saber
  // si hay que mirarlo con lupa o es trámite.
  const signal = match === true ? 'dominio coincide' : match === false ? 'dominio NO coincide' : 'sin web que comparar';
  const name = item?.title ?? claim.item_type;

  const row = (k: string, v: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#8a8a8e;white-space:nowrap;">${esc(k)}</td><td style="padding:4px 0;">${v}</td></tr>`;

  const result = await sendEmail({
    to,
    subject: `Reclamación de ficha: ${name} (${signal})`,
    replyTo: email ?? undefined,
    text: [
      `Reclamación de "${name}" (${claim.item_type}).`,
      `Reclamante: ${email ?? 'sin email'} — ${signal}.`,
      url ? `Ficha: ${url}` : '',
      item?.website ? `Web: ${item.website}` : '',
      item?.owner_id ? `Atención: la ficha ya tiene dueño (${item.owner_id}).` : '',
      '',
      `Justificación: ${claim.justification ?? '—'}`,
      `Prueba aportada: ${claim.contact_proof ?? '—'}`,
      '',
      `Resolver: claims-review con {"id":"${claim.id}","decision":"approve|reject"}`,
    ].filter(Boolean).join('\n'),
    html: `<p style="margin:0 0 12px;">Alguien reclama la ficha <strong>${esc(name)}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
${row('Tipo', esc(claim.item_type))}
${row('Reclamante', email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : '—')}
${row('Dominio', match === true ? '<strong style="color:#047857;">coincide con la web de la ficha</strong>' : match === false ? '<strong style="color:#b45309;">no coincide con la web de la ficha</strong>' : 'no hay web con la que comparar')}
${item?.website ? row('Web', `<a href="${esc(item.website)}">${esc(item.website)}</a>`) : ''}
${item?.owner_id ? row('Ojo', '<strong style="color:#b91c1c;">la ficha ya tiene dueño</strong>') : ''}
</table>
<p style="margin:16px 0 4px;color:#8a8a8e;">Justificación</p>
<p style="margin:0 0 12px;white-space:pre-line;">${esc(claim.justification ?? '—')}</p>
<p style="margin:16px 0 4px;color:#8a8a8e;">Prueba aportada</p>
<p style="margin:0;white-space:pre-line;">${esc(claim.contact_proof ?? '—')}</p>
${url ? button(url, 'Ver la ficha') : ''}
<p style="margin:16px 0 0;color:#8a8a8e;font-size:13px;">Se resuelve con <code>claims-review</code>: <code>{"id":"${esc(claim.id)}","decision":"approve"}</code> o <code>"reject"</code>.</p>`,
  });

  return Response.json({ ok: result.ok, email_id: result.id ?? null, error: result.error ?? null }, {
    status: result.ok ? 200 : 502,
  });
});
