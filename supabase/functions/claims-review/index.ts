import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { secretsMatch } from '../_shared/boost-sync.ts';

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

const ITEM_TABLES: Record<string, string> = {
  tools: 'tools',
  experts: 'experts',
  tutorials: 'tutorials',
  projects: 'projects',
};

/** El nombre de cada tipo de ficha vive en una columna distinta. */
const TITLE_COLUMN: Record<string, string> = {
  tools: 'name',
  experts: 'name',
  tutorials: 'title',
  projects: 'title',
};

async function describeItem(itemType: string, itemId: string) {
  const table = ITEM_TABLES[itemType];
  if (!table) return null;
  const title = TITLE_COLUMN[itemType];
  const cols = `id, slug, user_id, ${title}` + (itemType === 'tools' ? ', website' : '');
  const { data } = await supabase.from(table).select(cols).eq('id', itemId).maybeSingle();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    table,
    title: row[title] as string | null,
    slug: row.slug as string | null,
    owner_id: row.user_id as string | null,
    website: (row.website as string | null) ?? null,
  };
}

/** El dominio de un correo y el de una web, sin `www.` ni subdominios de cortesía. */
function domainOf(value: string | null): string | null {
  if (!value) return null;
  const raw = value.includes('@') ? value.split('@').pop()! : value.replace(/^https?:\/\//, '').split('/')[0];
  const host = raw.toLowerCase().replace(/^www\./, '').trim();
  return host || null;
}

/**
 * La prueba que se sostiene sola: el reclamante escribe desde el dominio de la
 * herramienta. No es suficiente para aprobar a ciegas (un correo de Gmail no
 * significa impostura, y un dominio propio no significa que sea quien dice),
 * pero es lo primero que hay que mirar y no estaba a la vista en ningún sitio.
 */
function emailMatchesSite(email: string | null, website: string | null): boolean | null {
  const e = domainOf(email), w = domainOf(website);
  if (!e || !w) return null;
  return e === w || w.endsWith(`.${e}`) || e.endsWith(`.${w}`);
}

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

  return Response.json({ ok: true, claim: updated, listing: item });
});
