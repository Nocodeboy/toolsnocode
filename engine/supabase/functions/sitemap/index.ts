import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

/**
 * El sitemap, construido desde la base de datos en cada petición.
 *
 * Tres cosas que costaron caro en el proyecto del que sale esto, y que aquí
 * están resueltas desde el primer día:
 *
 *  1. **PostgREST corta la respuesta en 1.000 filas.** Un `select` sin
 *     paginar truncaba el catálogo sin avisar: el sitemap anunciaba 1.030 URLs
 *     de 15.157 y nadie lo notó en meses. De ahí `fetchAll`.
 *
 *  2. **Un error de PostgREST leído como lista vacía es una sección que
 *     desaparece en silencio.** Se pedía una columna que no existía en una
 *     tabla, devolvía 400, el código hacía `data ?? []` y esa sección dejaba
 *     de anunciarse. De ahí el `throw`.
 *
 *  3. **La clave de servicio se salta RLS.** La política que esconde las
 *     fichas dadas de baja no se aplica aquí, así que el filtro va a mano. Sin
 *     él, el sitemap anuncia las páginas que acaban de pasar a contestar 404.
 *
 * Y una regla de producto: **no se anuncia lo que no tiene contenido propio.**
 * El buscador evalúa la calidad a nivel de dominio, así que publicar miles de
 * páginas vacías no suma inventario: arrastra a las que sí podían competir.
 */

const BASE_URL = Deno.env.get('SITE_URL') ?? 'https://example.com';
const ENTITY_PATH = Deno.env.get('ENTITY_PATH') ?? 'listings';
/** Mínimo de fichas para anunciar una página de faceta. Por debajo, existe pero no se anuncia. */
const FACET_MIN = Number(Deno.env.get('FACET_INDEX_MIN') ?? '8');

const xmlEscape = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

interface Row { slug: string; lastmod: string | null }

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    async function fetchAll(table: string, dateColumn: string, onlyListed = false): Promise<Row[]> {
      const PAGE = 1000;
      const rows: Row[] = [];
      for (let from = 0; ; from += PAGE) {
        let query = supabase.from(table).select(`slug, ${dateColumn}`);
        if (onlyListed) query = query.is('delisted_at', null);
        const { data, error } = await query
          .order(dateColumn, { ascending: false })
          .order('slug', { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw new Error(`sitemap: ${table}.${dateColumn} -> ${error.message}`);
        if (!data || data.length === 0) break;
        for (const row of data as unknown as Record<string, string | null>[]) {
          if (row.slug) rows.push({ slug: row.slug, lastmod: row[dateColumn] ?? null });
        }
        if (data.length < PAGE) break;
      }
      return rows;
    }

    const [listings, posts, categories, facetCounts] = await Promise.all([
      fetchAll('listings', 'updated_at', true),
      fetchAll('posts', 'published_at'),
      fetchAll('categories', 'created_at'),
      supabase.from('category_facet_counts').select('category_id, facet, listing_count')
        .then(({ data, error }) => {
          if (error) throw new Error(`sitemap: category_facet_counts -> ${error.message}`);
          return data ?? [];
        }),
    ]);

    const categorySlugById = new Map<string, string>();
    const { data: cats, error: catError } = await supabase.from('categories').select('id, slug');
    if (catError) throw new Error(`sitemap: categories -> ${catError.message}`);
    for (const c of cats ?? []) categorySlugById.set(c.id as string, c.slug as string);

    const today = new Date().toISOString().split('T')[0];
    const url = (loc: string, lastmod: string | null, freq: string, priority: string) =>
      `\n  <url><loc>${BASE_URL}${loc}</loc>${lastmod ? `<lastmod>${lastmod.split('T')[0]}</lastmod>` : ''}<changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    xml += url('/', today, 'daily', '1.0');
    xml += url(`/${ENTITY_PATH}`, today, 'daily', '0.9');
    xml += url('/categories', today, 'weekly', '0.8');
    xml += url('/blog', today, 'weekly', '0.8');
    xml += url('/pricing', null, 'monthly', '0.5');
    for (const p of ['/legal/privacy', '/legal/terms', '/legal/cookies']) xml += url(p, null, 'yearly', '0.3');

    // Las categorías van con prioridad alta: son las únicas páginas con texto
    // propio que además enlazan al catálogo entero.
    for (const c of categories) xml += url(`/categories/${xmlEscape(c.slug)}`, today, 'weekly', '0.8');

    for (const f of facetCounts as { category_id: string; facet: string; listing_count: number }[]) {
      if (f.listing_count < FACET_MIN) continue;
      const slug = categorySlugById.get(f.category_id);
      if (slug) xml += url(`/categories/${xmlEscape(slug)}/${xmlEscape(f.facet)}`, today, 'weekly', '0.7');
    }

    for (const l of listings) xml += url(`/${ENTITY_PATH}/${xmlEscape(l.slug)}`, l.lastmod, 'weekly', '0.7');
    for (const p of posts) xml += url(`/blog/${xmlEscape(p.slug)}`, p.lastmod, 'monthly', '0.6');

    xml += '\n</urlset>';

    return new Response(xml, {
      headers: { ...cors, 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
    });
  } catch (err) {
    console.error(err);
    // 500 y no un sitemap a medias: medio sitemap le dice al buscador que el
    // resto de páginas ya no existe.
    return new Response('sitemap unavailable', { status: 500, headers: cors });
  }
});
