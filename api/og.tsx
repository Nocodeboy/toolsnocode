import { ImageResponse } from '@vercel/og';
import { getCategory, getCategoryToolCount, getNews, getTool } from './_lib/data';

export const config = { runtime: 'edge' };

/**
 * Imagen social (1200×630) generada al vuelo por ruta.
 *
 *   /api/og?kind=news&slug=…       la edición del boletín
 *   /api/og?kind=tool&slug=…       una herramienta, con su logo si lo tiene
 *   /api/og?kind=category&slug=…   una categoría y cuántas herramientas tiene
 *
 * Las noticias escritas en casa no tienen fotografía porque no la necesitan:
 * la tarjeta lleva el título, que es la tesis. Se cachea en el edge un día.
 * Si algo falla, redirige a la imagen genérica en vez de romper la tarjeta.
 */
const BG = '#0a0a0f';
const BRAND = '#22c55e';
const MUTED = '#8b8fa3';

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind');
  const slug = searchParams.get('slug') ?? '';

  try {
    if (kind === 'news') {
      const n = await getNews(slug);
      if (!n) return fallback();
      const date = new Date(n.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return card(
        <div style={frame()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: BRAND, fontSize: 28, fontWeight: 600 }}>
            <span style={{ width: 14, height: 14, borderRadius: 7, background: BRAND, display: 'flex' }} />
            ToolsNoCode · Weekly
          </div>
          <div style={{ display: 'flex', fontSize: n.title.length > 70 ? 54 : 64, fontWeight: 700, color: '#fff', lineHeight: 1.12, letterSpacing: -1.5, maxWidth: 1060 }}>
            {n.title}
          </div>
          <div style={{ display: 'flex', color: MUTED, fontSize: 28 }}>{date} · toolsnocode.com/news</div>
        </div>,
      );
    }

    if (kind === 'tool') {
      const t = await getTool(slug);
      if (!t) return fallback();
      return card(
        <div style={frame()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {t.logo_url ? (
              <img src={t.logo_url} width={112} height={112} style={{ borderRadius: 24, objectFit: 'cover', background: '#16161f' }} />
            ) : (
              <div style={{ width: 112, height: 112, borderRadius: 24, background: '#16161f', color: '#fff', fontSize: 56, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.name.charAt(0)}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, color: '#fff', letterSpacing: -1 }}>{t.name}</div>
              <div style={{ display: 'flex', color: BRAND, fontSize: 26, fontWeight: 600 }}>
                {[t.category?.name, t.pricing].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
          {t.tagline && <div style={{ display: 'flex', color: '#d4d6e0', fontSize: 36, lineHeight: 1.3, maxWidth: 1060 }}>{t.tagline}</div>}
          <div style={{ display: 'flex', color: MUTED, fontSize: 26 }}>toolsnocode.com/tools/{t.slug}</div>
        </div>,
      );
    }

    if (kind === 'category') {
      const c = await getCategory(slug);
      if (!c) return fallback();
      const count = await getCategoryToolCount(c.id);
      return card(
        <div style={frame()}>
          <div style={{ display: 'flex', color: BRAND, fontSize: 28, fontWeight: 600 }}>ToolsNoCode · Category</div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 700, color: '#fff', letterSpacing: -2, lineHeight: 1.1 }}>{c.name} Tools</div>
          <div style={{ display: 'flex', color: '#d4d6e0', fontSize: 36 }}>{count} tools, compared and linked</div>
          <div style={{ display: 'flex', color: MUTED, fontSize: 26 }}>toolsnocode.com/categories/{c.slug}</div>
        </div>,
      );
    }

    return fallback();
  } catch (err) {
    console.error('og render failed:', err);
    return fallback();
  }
}

function frame(): Record<string, string | number> {
  return {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '64px 72px', background: `linear-gradient(135deg, ${BG} 0%, #101422 100%)`, fontFamily: 'sans-serif',
  };
}

function card(node: React.ReactElement) {
  return new ImageResponse(node, {
    width: 1200,
    height: 630,
    headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}

function fallback() {
  return Response.redirect('https://toolsnocode.com/og-image.png', 302);
}
