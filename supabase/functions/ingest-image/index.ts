import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { secretsMatch } from '../_shared/boost-sync.ts';

/**
 * Trae una imagen externa a nuestro bucket y la cuelga de la ficha.
 *
 *   POST { slug, kind: "logo" | "screenshot", source_url }
 *   cabecera X-Ingest-Secret
 *
 * El 11 % de los logos y el 15 % de las capturas del directorio estaban rotos
 * el 17 de septiembre de 2026: favicons que Google dejó de servir, capturas de
 * un servicio de terceros que caducó, CDNs con protección anti-hotlink. Una
 * imagen que vive en el servidor de otro se rompe cuando ese otro quiere. Una
 * que vive en `uploads/` se rompe cuando queremos nosotros.
 *
 * Valida que lo descargado es una imagen (por tipo y por cabecera de bytes),
 * la limita a 5 MB, la guarda como `tools/<slug>/<kind>-<hash>.<ext>` y
 * actualiza la fila. Idempotente: el mismo origen produce la misma ruta.
 */
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'image/svg+xml': 'svg' };
const BUCKET_TYPES = new Set(['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif']);

function sniff(b: Uint8Array): string | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return 'image/webp';
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return 'image/avif';
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) return 'image/x-icon';
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const expected = Deno.env.get('INGEST_SECRET');
  if (!expected || !(await secretsMatch(req.headers.get('X-Ingest-Secret') ?? '', expected))) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: { slug?: unknown; kind?: unknown; source_url?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: 'Body must be JSON' }, { status: 400 }); }
  const { slug, kind, source_url } = body;
  if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) return Response.json({ error: 'bad slug' }, { status: 400 });
  if (kind !== 'logo' && kind !== 'screenshot') return Response.json({ error: 'kind must be logo|screenshot' }, { status: 400 });
  if (typeof source_url !== 'string' || !/^https?:\/\//.test(source_url)) return Response.json({ error: 'bad source_url' }, { status: 400 });

  const { data: tool } = await supabase.from('tools').select('id').eq('slug', slug).maybeSingle();
  if (!tool) return Response.json({ error: 'unknown tool' }, { status: 404 });

  let res: Response;
  try {
    res = await fetch(source_url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; ToolsNoCodeBot/1.0; +https://toolsnocode.com)', accept: 'image/*,*/*;q=0.5' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  } catch (err) {
    return Response.json({ error: `fetch failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 });
  }
  if (!res.ok) return Response.json({ error: `source returned ${res.status}` }, { status: 502 });

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return Response.json({ error: `size ${buf.byteLength}` }, { status: 422 });

  const declared = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const sniffed = sniff(buf);
  const type = sniffed ?? (declared === 'image/svg+xml' && /<svg[\s>]/i.test(new TextDecoder().decode(buf.subarray(0, 512))) ? 'image/svg+xml' : null);
  if (!type) return Response.json({ error: `not an image (declared ${declared || 'nothing'})` }, { status: 422 });
  // El bucket solo admite raster web. ICO y SVG se rechazan: un favicon .ico
  // de 16 px no es un logo, y un SVG externo puede llevar script.
  if (!BUCKET_TYPES.has(type)) return Response.json({ error: `${type} not accepted` }, { status: 422 });

  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf))).slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
  const path = `tools/${slug}/${kind}-${hash}.${EXT[type]}`;

  const { error: upErr } = await supabase.storage.from('uploads').upload(path, buf, { contentType: type, upsert: true, cacheControl: '31536000' });
  if (upErr) return Response.json({ error: `upload: ${upErr.message}` }, { status: 500 });

  const publicUrl = supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl;
  const patch = kind === 'logo' ? { logo_url: publicUrl } : { screenshot_urls: [publicUrl] };
  const { error: dbErr } = await supabase.from('tools').update(patch).eq('id', tool.id);
  if (dbErr) return Response.json({ error: `db: ${dbErr.message}` }, { status: 500 });

  return Response.json({ ok: true, slug, kind, url: publicUrl, bytes: buf.byteLength, type });
});
