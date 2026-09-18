import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { secretsMatch } from '../_shared/boost-sync.ts';

/**
 * La puerta del boletín. Dos verbos, un secreto (`X-Digest-Secret`):
 *
 *   GET  → los hechos de la semana (`weekly_digest_brief`), en JSON.
 *   POST → publica una edición. O la rechaza.
 *
 * El POST no se fía de quien escribe, aunque quien escribe sea yo. Comprueba
 * que cada enlace interno `/tools/<slug>` y `/categories/<slug>` del cuerpo
 * apunta a una fila real, que el slug de la edición no existe ya, y que las
 * partes tienen la forma que la ficha de noticia espera. Una edición con un
 * enlace roto no se publica: vuelve con la lista de lo que falla.
 *
 * `dry_run: true` hace toda la validación y no inserta. Es lo que la rutina
 * llama antes de la versión final.
 */
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INTERNAL_LINK_RE = /\]\(\/(tools|categories|news)\/([a-z0-9-]+)\)/g;

Deno.serve(async (req) => {
  const expected = Deno.env.get('DIGEST_SECRET');
  const provided = req.headers.get('X-Digest-Secret') ?? '';
  if (!expected || !(await secretsMatch(provided, expected))) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (req.method === 'GET') {
    const days = Number(new URL(req.url).searchParams.get('days') ?? 7);
    const { data, error } = await supabase.rpc('weekly_digest_brief', { p_days: Number.isFinite(days) ? days : 7 });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Body must be JSON' }, { status: 400 });
  }

  const problems: string[] = [];
  const str = (k: string, min: number, max: number) => {
    const v = body[k];
    if (typeof v !== 'string' || v.trim().length < min) problems.push(`${k}: required, at least ${min} characters`);
    else if (v.length > max) problems.push(`${k}: at most ${max} characters (got ${v.length})`);
    return typeof v === 'string' ? v.trim() : '';
  };

  const title = str('title', 20, 120);
  const slug = str('slug', 8, 90);
  const summary = str('summary', 60, 220);
  const content = str('content', 900, 12000);
  const tags = Array.isArray(body.tags) && body.tags.every((t) => typeof t === 'string') ? (body.tags as string[]) : null;
  if (!tags || tags.length < 2 || tags.length > 8) problems.push('tags: 2–8 strings');
  if (slug && !SLUG_RE.test(slug)) problems.push('slug: lowercase letters, digits and hyphens only');

  // Enlaces internos: todos tienen que existir. Es la regla que hace que el
  // boletín sea enlazado interno de verdad y no una lista de 404s.
  const links = [...content.matchAll(INTERNAL_LINK_RE)].map((m) => ({ kind: m[1], slug: m[2] }));
  const bySlug = (kind: string) => [...new Set(links.filter((l) => l.kind === kind).map((l) => l.slug))];
  for (const [kind, table] of [['tools', 'tools'], ['categories', 'categories'], ['news', 'news']] as const) {
    const wanted = bySlug(kind);
    if (wanted.length === 0) continue;
    let q = supabase.from(table).select('slug').in('slug', wanted);
    if (table === 'tools') q = q.is('delisted_at', null); // service role bypasses RLS
    const { data } = await q;
    const found = new Set((data ?? []).map((r) => r.slug as string));
    for (const s of wanted) if (!found.has(s)) problems.push(`link to /${kind}/${s} does not exist`);
  }
  const toolLinks = bySlug('tools').length;
  if (toolLinks < 4) problems.push(`content links to ${toolLinks} tools; an edition links to at least 4`);

  if (slug) {
    const { data: dup } = await supabase.from('news').select('slug').eq('slug', slug).maybeSingle();
    if (dup) problems.push(`slug ${slug} is already published`);
  }

  if (problems.length > 0) return Response.json({ ok: false, problems }, { status: 422 });
  if (body.dry_run === true) return Response.json({ ok: true, dry_run: true, tool_links: toolLinks });

  const { data: row, error } = await supabase
    .from('news')
    .insert({
      title, slug, summary, content, tags,
      // La portada se genera al vuelo en Vercel (/api/og) a partir del título:
      // las ediciones no llevan fotografía porque la tesis es la imagen.
      image_url: `https://toolsnocode.com/api/og?kind=news&slug=${encodeURIComponent(slug)}`,
      url: '', source: 'ToolsNoCode', category: 'No-Code Tools',
      published_at: new Date().toISOString(),
      is_featured: body.featured === true,
    })
    .select('slug, published_at')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, published: row, url: `https://toolsnocode.com/news/${row.slug}` });
});
