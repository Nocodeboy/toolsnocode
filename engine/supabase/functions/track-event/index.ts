import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders as buildCorsHeaders } from "../_shared/cors.ts";

function getCorsHeaders(req: Request) {
  return buildCorsHeaders(req, "POST, OPTIONS");
}

const EVENT_TYPES = new Set(["detail_view", "outbound_click"]);

/**
 * Los crawlers ejecutan JavaScript. Googlebot abrió 1.226 fichas distintas en
 * tres días, una por hora, día y noche, y de ahí salieron 1.750 "vistas" y 6
 * clics — un 0,3 % de conversión, que es la firma de una máquina recorriendo
 * un sitemap. Sin este filtro el `trending_score` mide el ritmo de indexación
 * de Google y las analíticas del maker le enseñan bots.
 *
 * Se responde 204 igualmente: el navegador no tiene por qué saber que el
 * evento no se guardó, y un bot tampoco.
 */
const CRAWLER_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|pinterest|headlesschrome|phantomjs|lighthouse|pagespeed|gtmetrix|prerender|python-requests|curl\/|wget\/|go-http-client|okhttp|java\/|libwww|httpclient|scrapy/i;

function looksLikeCrawler(ua: string | null): boolean {
  if (!ua || ua.length < 20) return true; // sin UA, o uno de juguete: no es un navegador
  return CRAWLER_UA.test(ua);
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Límite de ritmo por IP, en memoria de la instancia.
 *
 * No es infalible —las instancias se reciclan y el atacante decidido rota IPs—
 * pero corta el caso que importa: un script insertando miles de eventos para
 * inflar las métricas de una tool. La alternativa (una tabla de contadores)
 * multiplicaría las escrituras que precisamente queremos acotar.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Poda perezosa para que el Map no crezca sin control entre reciclados.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many events" }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (looksLikeCrawler(req.headers.get("user-agent"))) {
      return new Response(null, { status: 204, headers: cors });
    }

    const { listing_id, event_type } = await req.json().catch(() => ({}));

    if (typeof listing_id !== "string" || !UUID_RE.test(listing_id)) {
      return new Response(JSON.stringify({ error: "Invalid listing_id" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (typeof event_type !== "string" || !EVENT_TYPES.has(event_type)) {
      return new Response(JSON.stringify({ error: "Invalid event_type" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // `is_boosted` se lee de la base, nunca del cliente: es el campo que separa
    // "métrica de un cliente que paga" de "métrica de cualquiera".
    const { data: tool, error: toolError } = await supabase
      .from("listings")
      .select("id, is_boosted")
      .eq("id", listing_id)
      .maybeSingle();

    if (toolError) {
      console.error("track-event: tool lookup failed:", toolError);
      return new Response(JSON.stringify({ error: "Lookup failed" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!tool) {
      return new Response(JSON.stringify({ error: "Unknown tool" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { error: insertError } = await supabase.from("listing_events").insert({
      listing_id: tool.id,
      event_type,
      is_boosted: tool.is_boosted ?? false,
    });

    if (insertError) {
      console.error("track-event: insert failed:", insertError);
      return new Response(JSON.stringify({ error: "Insert failed" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204, headers: cors });
  } catch (err) {
    console.error("track-event error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
