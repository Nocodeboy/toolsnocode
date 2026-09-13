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

    const [toolsRes, expertsRes, tutorialsRes, projectsRes, newsRes] =
      await Promise.all([
        supabase
          .from("tools")
          .select("slug, updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("experts")
          .select("slug, updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("tutorials")
          .select("slug, updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("projects")
          .select("slug, updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("news")
          .select("slug, published_at")
          .order("published_at", { ascending: false }),
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

    for (const tool of toolsRes.data ?? []) {
      const lastmod = tool.updated_at
        ? tool.updated_at.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/tools/${xmlEscape(tool.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }

    for (const expert of expertsRes.data ?? []) {
      const lastmod = expert.updated_at
        ? expert.updated_at.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/experts/${xmlEscape(expert.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    }

    for (const tutorial of tutorialsRes.data ?? []) {
      const lastmod = tutorial.updated_at
        ? tutorial.updated_at.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/tutorials/${xmlEscape(tutorial.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    }

    for (const project of projectsRes.data ?? []) {
      const lastmod = project.updated_at
        ? project.updated_at.split("T")[0]
        : today;
      xml += `\n  <url><loc>${BASE_URL}/projects/${xmlEscape(project.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
    }

    for (const article of newsRes.data ?? []) {
      const lastmod = article.published_at
        ? article.published_at.split("T")[0]
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
  } catch {
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
