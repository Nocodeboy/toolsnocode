import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders as buildCorsHeaders } from "../_shared/cors.ts";
import { safeFetch } from "../_shared/http-safe.ts";

function getCorsHeaders(req: Request) {
  return buildCorsHeaders(req, "POST, OPTIONS");
}

/**
 * Amplía la descripción de las fichas de herramienta.
 *
 * La regla que gobierna todo lo demás: **el texto sale de la web de la propia
 * herramienta, nunca del conocimiento previo del modelo**. Si no se puede leer
 * esa web, la tool se queda como está. Generar 200 palabras verosímiles sobre
 * un producto que el modelo no conoce es peor que las 23 honestas que ya hay:
 * son 3.000 páginas de ficción plausible, y el directorio vive de que se pueda
 * confiar en lo que dice.
 */

function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

async function readWebsite(url: string): Promise<string> {
  try {
    const res = await safeFetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ToolsNoCode/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res || !res.ok) return "";

    const html = await res.text();
    const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    return stripTags(main ? main[1] : html).slice(0, 4000);
  } catch {
    return "";
  }
}

async function writeDescription(
  name: string,
  tagline: string,
  category: string,
  siteText: string,
  apiKey: string,
): Promise<string | null> {
  const prompt = `You are writing a directory entry for ToolsNoCode, a directory of AI and no-code tools.

Tool: ${name}
Tagline: ${tagline}
Category: ${category}

Text taken from the tool's own website:
"""
${siteText}
"""

Write a 150-250 word description of this tool for someone deciding whether it fits their needs.

Rules:
- Use ONLY facts present in the website text above. Never add capabilities, pricing, integrations or claims that are not there.
- If the website text is too vague to describe the tool honestly, reply with exactly: INSUFFICIENT
- Cover what it does, who it is for, and what stands out — in that order
- Plain paragraphs. No markdown, no headers, no bullet points, no marketing superlatives
- Do not mention ToolsNoCode`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    console.error("OpenAI error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";

  // El modelo avisa cuando la web no daba para escribir nada honesto.
  if (!text || text.includes("INSUFFICIENT") || text.split(/\s+/).length < 60) return null;

  return text;
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    const CRON_SECRET = Deno.env.get("CRON_SECRET");
    if (!CRON_SECRET || req.headers.get("X-Cron-Secret") !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let body: { limit?: number } = {};
    try { body = await req.json(); } catch { /* sin cuerpo */ }

    // Tope duro: cada tool cuesta una llamada a OpenAI y el gasto es del dueño
    // del proyecto. Mejor muchas invocaciones pequeñas que una sorpresa.
    const limit = Math.min(Math.max(body.limit ?? 20, 1), 50);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Las reclamadas primero: son las de los 265 makers registrados, las únicas
    // con alguien detrás a quien le importa cómo se ve su ficha. Ordenar por
    // `user_id` con los nulos al final las pone delante sin necesidad de dos
    // consultas (y sin reasignar la cadena, que desborda el tipo del builder).
    const { data: tools, error } = await supabase
      .from("tools")
      .select("id, name, tagline, website, description, category:categories(name)")
      .is("enriched_at", null)
      .not("website", "is", null)
      .order("user_id", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("enrich-tools: query failed:", error);
      return new Response(JSON.stringify({ error: "Query failed" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const result = { processed: 0, enriched: 0, skipped: 0, errors: [] as string[] };

    for (const tool of tools ?? []) {
      result.processed++;
      try {
        const siteText = await readWebsite(tool.website as string);

        if (siteText.length < 200) {
          // Se marca igualmente para no reintentar en bucle una web ilegible.
          await supabase.from("tools").update({ enriched_at: new Date().toISOString() }).eq("id", tool.id);
          result.skipped++;
          continue;
        }

        const category = (tool.category as { name?: string } | null)?.name ?? "AI & no-code";
        const description = await writeDescription(
          tool.name as string,
          (tool.tagline as string) ?? "",
          category,
          siteText,
          OPENAI_API_KEY,
        );

        await supabase
          .from("tools")
          .update({
            ...(description ? { description_long: description } : {}),
            enriched_at: new Date().toISOString(),
          })
          .eq("id", tool.id);

        if (description) result.enriched++; else result.skipped++;

        await new Promise((r) => setTimeout(r, 400));
      } catch (e) {
        result.errors.push(`${tool.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("enrich-tools error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
