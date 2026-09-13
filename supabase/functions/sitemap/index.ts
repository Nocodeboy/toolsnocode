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

    const [tools, experts, tutorials, projects, news] = await Promise.all([
      fetchAll("tools", "updated_at"),
      fetchAll("experts", "created_at"),
      fetchAll("tutorials", "created_at"),
      fetchAll("projects", "created_at"),
      fetchAll("news", "published_at"),
    ]);

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/tools</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/experts</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/tutorials</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/projects</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE_URL}/news</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/pricing</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${BASE_URL}/legal/privacy</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE_URL}/legal/terms</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE_URL}/legal/cookies</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`;

    for (const tool of tools) {
      const lastmod = tool.lastmod
        ? tool.lastmod.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/tools/${xmlEscape(tool.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }

    for (const expert of experts) {
      const lastmod = expert.lastmod
        ? expert.lastmod.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/experts/${xmlEscape(expert.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    }

    for (const tutorial of tutorials) {
      const lastmod = tutorial.lastmod
        ? tutorial.lastmod.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/tutorials/${xmlEscape(tutorial.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
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
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/xml; charset=utf-8",
        },
      }
    );
  }
});
