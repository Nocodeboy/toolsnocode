import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { secretsMatch } from '../_shared/boost-sync.ts';
import { describeItem as describeItemRow, emailMatchesSite, itemUrl } from '../_shared/claims.ts';
import { button, esc, sendEmail } from '../_shared/email.ts';

/**
 * Revisar las reclamaciones de ficha.
 *
 *   GET  ?status=pending            lo pendiente, con contexto para decidir
 *   POST { id, decision, note? }    "approve" o "reject"
 *   cabecera X-Claims-Secret
 *
 * `claim_requests` tenía políticas de INSERT y SELECT para el propio usuario y
 * ninguna de UPDATE, y no hay panel de administración: una reclamación entraba
 * y no podía salir. El estado se quedaba en `pending` para siempre y el
 * reclamante lo veía así en su cuenta, sin que nadie pudiera hacer nada. Esto
 * es la pieza que faltaba, con la misma forma que el resto de utilidades de
 * operación del proyecto: clave de servicio detrás de un secreto propio.
 *
 * Aprobar pone `user_id` en la ficha, que es lo que da acceso a editarla y a
 * ver sus estadísticas. Por eso se niega si la ficha ya tiene otro dueño: un
 * cambio de propietario no se hace por descuido.
 */
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

/** Las dos piezas de reclamaciones comparten cómo se describe una ficha. */
const describeItem = (itemType: string, itemId: string) => describeItemRow(supabase, itemType, itemId);

Deno.serve(async (req) => {
  const expected = Deno.env.get('CLAIMS_SECRET');
  if (!expected || !(await secretsMatch(req.headers.get('X-Claims-Secret') ?? '', expected))) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (req.method === 'GET') {
    const status = new URL(req.url).searchParams.get('status') ?? 'pending';
    const { data, error } = await supabase
      .from('claim_requests')
      .select('id, item_type, item_id, user_id, status, justification, contact_proof, admin_note, created_at, reviewed_at')
      .eq('status', status)
      .order('created_at', { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const rows = data ?? [];
    const out = [];
    for (const r of rows) {
      const item = await describeItem(r.item_type, r.item_id);
      const { data: claimant } = await supabase.auth.admin.getUserById(r.user_id);
      out.push({
        ...r,
        item,
        claimant_email: claimant?.user?.email ?? null,
        email_matches_site: emailMatchesSite(claimant?.user?.email ?? null, item?.website ?? null),
      });
    }
    return Response.json({ count: out.length, claims: out });
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: { id?: unknown; decision?: unknown; note?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: 'Body must be JSON' }, { status: 400 }); }
  const { id, decision, note } = body;
  if (typeof id !== 'string') return Response.json({ error: 'id is required' }, { status: 400 });
  if (decision !== 'approve' && decision !== 'reject') {
    return Response.json({ error: 'decision must be approve|reject' }, { status: 400 });
  }
  if (note !== undefined && typeof note !== 'string') return Response.json({ error: 'note must be a string' }, { status: 400 });

  const { data: claim } = await supabase.from('claim_requests').select('*').eq('id', id).maybeSingle();
  if (!claim) return Response.json({ error: 'unknown claim' }, { status: 404 });
  if (claim.status !== 'pending') {
    return Response.json({ error: `already ${claim.status}`, reviewed_at: claim.reviewed_at }, { status: 409 });
  }

  const item = await describeItem(claim.item_type, claim.item_id);
  if (decision === 'approve') {
    if (!item) return Response.json({ error: 'the listing no longer exists' }, { status: 409 });
    if (item.owner_id && item.owner_id !== claim.user_id) {
      return Response.json({ error: 'the listing already belongs to someone else', owner_id: item.owner_id }, { status: 409 });
    }
    const { error: ownErr } = await supabase.from(item.table).update({ user_id: claim.user_id }).eq('id', claim.item_id);
    if (ownErr) return Response.json({ error: ownErr.message }, { status: 500 });
  }

  const { data: updated, error } = await supabase
    .from('claim_requests')
    .update({
      status: decision === 'approve' ? 'approved' : 'rejected',
      admin_note: typeof note === 'string' && note.trim() ? note.trim() : null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id, status, admin_note, reviewed_at')
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!updated) return Response.json({ error: 'claim was reviewed by someone else' }, { status: 409 });

  // Decirlo. El formulario prometía "we will contact you by email" y hasta
  // ahora el reclamante solo se enteraba si volvía a su cuenta a mirar.
  const mail = await notifyClaimant(claim.user_id, decision, updated.admin_note, claim.item_type, item);

  return Response.json({ ok: true, claim: updated, listing: item, email: mail });
});


/**
 * El correo al reclamante. No falla la revisión si no sale: la decisión ya
 * está escrita, y un correo perdido se reenvía; una aprobación a medias no se
 * arregla.
 */
async function notifyClaimant(
  userId: string,
  decision: 'approve' | 'reject',
  note: string | null,
  itemType: string,
  item: { title: string | null; slug: string | null } | null,
): Promise<{ ok: boolean; error?: string }> {
  const { data: claimant } = await supabase.auth.admin.getUserById(userId);
  const to = claimant?.user?.email;
  if (!to) return { ok: false, error: 'claimant has no email' };

  const name = item?.title ?? 'your listing';
  const url = itemUrl(itemType, item?.slug ?? null);

  const { ok, error } = decision === 'approve'
    ? await sendEmail({
      to,
      subject: `You now own the ${name} listing on ToolsNoCode`,
      text: [
        `Your claim for "${name}" has been approved.`,
        url ? `The listing is yours to edit: ${url}` : '',
        'You can update the description, pricing, logo and screenshots from the listing page, and you will see its visits and clicks in your account.',
        note ? `\nNote from the review: ${note}` : '',
      ].filter(Boolean).join('\n'),
      html: `<p style="margin:0 0 12px;">Your claim for <strong>${esc(name)}</strong> has been approved. The listing is yours.</p>
<p style="margin:0 0 12px;">You can now edit the description, pricing, logo and screenshots from the listing page, and its visits and clicks appear in your account.</p>
${note ? `<p style="margin:0 0 12px;color:#8a8a8e;">Note from the review: ${esc(note)}</p>` : ''}
${url ? button(url, 'Open your listing') : ''}`,
    })
    : await sendEmail({
      to,
      subject: `About your claim for ${name}`,
      text: [
        `We could not approve your claim for "${name}".`,
        note ? `Reason: ${note}` : 'The evidence provided was not enough to transfer ownership of the listing.',
        '',
        'If you are the owner, the fastest proof is a DNS TXT record on the tool\'s own domain — the listing page walks you through it — or writing from an address at that domain.',
        url ? `Listing: ${url}` : '',
      ].filter(Boolean).join('\n'),
      html: `<p style="margin:0 0 12px;">We could not approve your claim for <strong>${esc(name)}</strong>.</p>
<p style="margin:0 0 12px;">${note ? esc(note) : 'The evidence provided was not enough to transfer ownership of the listing.'}</p>
<p style="margin:0 0 12px;">If you are the owner, the fastest proof is a DNS TXT record on the tool's own domain — the listing page walks you through it — or writing to us from an address at that domain.</p>
${url ? button(url, 'Open the listing') : ''}`,
    });

  return ok ? { ok } : { ok, error };
}
