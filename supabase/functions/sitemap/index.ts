import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders as buildCorsHeaders } from "../_shared/cors.ts";

function getCorsHeaders(req: Request) {
  return buildCorsHeaders(req, "GET, OPTIONS");
}

// Canonical public origin the sitemap advertises. Override with the SITE_URL
// secret when the frontend moves host, so the URLs never point at the old one.
const BASE_URL = Deno.env.get("SITE_URL") ?? "https://toolsnocode.com";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: getCorsHeaders(req) });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    /**
     * Dos motivos por los que el sitemap publicaba 1.030 URLs de 15.157:
     *
     *  1. PostgREST corta la respuesta en 1.000 filas, así que un único select
     *     truncaba el catálogo de tools sin avisar. De ahí la paginación.
     *  2. Se pedía `updated_at` a experts, tutorials y projects, y esa columna
     *     solo existe en `tools`. PostgREST devolvía 400, el código leía
     *     `.data ?? []` sin mirar `.error`, y esas tres secciones desaparecían
     *     en silencio. De ahí el `throw` y el uso de `created_at`.
     */
    async function fetchAll(table: string, dateColumn: string) {
      const PAGE = 1000;
      const rows: Array<{ slug: string; lastmod: string | null }> = [];

      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from(table)
          .select(`slug, ${dateColumn}`)
          .order(dateColumn, { ascending: false })
          .order("slug", { ascending: true })
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

    /**
     * `experts` y `tutorials` no emiten fichas individuales a propósito.
     *
     * Medido sobre una muestra de 1.000 filas de cada tabla: la mediana de la
     * biografía de un experto son 10 palabras, y 999 de cada 1.000 tutoriales
     * tienen la descripción vacía (la tabla ni siquiera tiene campo de cuerpo).
     * Son ~12.000 páginas sin contenido propio, y Google evalúa la calidad a
     * nivel de dominio: publicarlas no suma inventario, arrastra a las 3.075
     * fichas de herramienta que sí pueden competir.
     *
     * Las páginas siguen existiendo y navegables; solo dejan de anunciarse.
     * Cuando tengan contenido real, se vuelven a añadir aquí.
     */
    const [tools, projects, news, categories] = await Promise.all([
      fetchAll("tools", "updated_at"),
      fetchAll("projects", "created_at"),
      fetchAll("news", "published_at"),
      fetchAll("categories", "created_at"),
    ]);

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/tools</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/categories</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/experts</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/tutorials</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/projects</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE_URL}/news</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/pricing</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${BASE_URL}/legal/privacy</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE_URL}/legal/terms</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE_URL}/legal/cookies</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`;

    /**
     * Las fichas de categoría van con prioridad alta a propósito: son las
     * únicas páginas del sitio que tienen texto editorial propio y, a la vez,
     * enlazan al catálogo entero. Sin ellas el sitemap solo ofrecía la home y
     * 3.075 fichas sueltas, sin nada en medio.
     *
     * Con una excepción, que se retira en cuanto se recategoricen sus filas:
     * `three-d` no contiene 3D. Es la segunda categoría con más altas de
     * makers del directorio (33 herramientas, 33 makers), y de las 30 más
     * recientes exactamente una trata de 3D: el resto son estudios de tatuaje,
     * telemedicina, señales de forex, astrología. La causa es que "3D & AR/VR"
     * empieza por un dígito y encabezaba un desplegable ordenado por nombre.
     *
     * Anunciar esa página es pedirle a Google que compare un texto sobre
     * topología de malla con una lista de estudios de tatuaje, justo después
     * de haber sacado del índice 12.000 páginas por ese mismo motivo. Sigue
     * navegable; solo deja de anunciarse.
     */
    const MISCATEGORISED = new Set(["three-d"]);

    for (const category of categories) {
      if (MISCATEGORISED.has(category.slug)) continue;
      xml += `\n  <url><loc>${BASE_URL}/categories/${xmlEscape(category.slug)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }

    for (const tool of tools) {
      const lastmod = tool.lastmod
        ? tool.lastmod.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/tools/${xmlEscape(tool.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }

    for (const project of projects) {
      const lastmod = project.lastmod
        ? project.lastmod.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/projects/${xmlEscape(project.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
    }

    for (const article of news) {
      const lastmod = article.lastmod
        ? article.lastmod.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/news/${xmlEscape(article.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
    }

    xml += "\n</urlset>";

    return new Response(xml, {
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    // Sin este log, un fallo de consulta era indistinguible de un catálogo vacío:
    // así fue como desaparecieron 12.000 URLs sin que nadie se enterara.
    console.error("sitemap generation failed:", err);

    // Y nunca un <urlset> vacío: eso le dice a Google "este sitio no tiene
    // URLs" y puede costar lo ya indexado. Un 500 sin XML le dice "vuelve
    // luego", que es lo que de verdad ocurre.
    return new Response("sitemap temporarily unavailable", {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "text/plain; charset=utf-8" },
    });
  }
});
