import { describe, injectHead } from './_lib/seo';

export const config = { runtime: 'edge' };

/**
 * Sirve el SPA con el `<head>` de la ruta ya escrito.
 *
 * `vercel.json` reescribe `/tools/:slug`, `/news/:slug`, `/categories/:slug` y
 * `/categories` hacia aquí con la ruta original en `?p=`. Esta función pide el
 * HTML de siempre a la propia app (con `x-seo-bypass`, que la regla de reescritura
 * exige que falte), lo modifica y lo devuelve.
 *
 * Falla abierto en todos los casos: si Supabase no responde, si la ruta no es
 * de las que conoce, si algo lanza — devuelve el HTML original sin tocar. La
 * única situación en la que cambia el código de estado es cuando la fila no
 * existe: entonces responde 404 con la misma página, porque un SPA que
 * contesta 200 a todo está diciendo a Google que tiene infinitas páginas.
 */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get('p') || '/';

  const upstream = await fetch(new URL(path, url.origin), {
    headers: { 'x-seo-bypass': '1', accept: 'text/html' },
  });

  const contentType = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !contentType.includes('text/html')) return upstream;

  const html = await upstream.text();

  try {
    const meta = await describe(path);
    if (!meta) return new Response(html, { status: 200, headers: htmlHeaders() });
    return new Response(injectHead(html, meta), { status: meta.status ?? 200, headers: htmlHeaders() });
  } catch (err) {
    console.error('seo injection failed, serving plain html:', err);
    return new Response(html, { status: 200, headers: htmlHeaders(true) });
  }
}

function htmlHeaders(uncached = false): HeadersInit {
  return {
    'content-type': 'text/html; charset=utf-8',
    // El edge de Vercel guarda la página 10 min por URL; una ficha no cambia
    // más deprisa, y `stale-while-revalidate` evita que nadie espere.
    'cache-control': uncached ? 'no-store' : 'public, s-maxage=600, stale-while-revalidate=86400',
    'x-seo': uncached ? 'fallback' : 'injected',
  };
}
