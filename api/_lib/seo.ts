import type { CategoryRow, NewsRow, ToolRow } from './data';
import { getCategoriesWithCounts, getCategory, getCategoryToolCount, getCategoryTopTools, getNews, getTool } from './data';
import { CATEGORY_COPY } from '../../src/data/categoryCopy';

/**
 * El `<head>` correcto para cada ruta, escrito en el HTML antes de servirlo.
 *
 * El sitio es un SPA: `useSEO` pone título, descripción, canónica y JSON-LD
 * desde JavaScript. Google lo ejecuta (tarde, y con menos presupuesto); Bing a
 * medias; X, LinkedIn, Slack y WhatsApp nunca. Medido el 16 de septiembre de
 * 2026: `/`, `/tools/canva`, `/news/<slug>` y `/categories/marketing` devolvían
 * a un crawler sin JS exactamente los mismos 705 bytes, el mismo título y la
 * misma `og:image` genérica.
 *
 * Esto no sustituye a `useSEO`: escribe los mismos elementos que `useSEO`
 * busca por selector y actualiza, así que React no los duplica al montar.
 */

export const BASE_URL = 'https://toolsnocode.com';
export const SITE_NAME = 'ToolsNoCode';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  image: string;
  type: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: object | object[];
  /** HTML mínimo para el `<div id="root">`: lo que un crawler sin JS debe leer. React lo sustituye al montar. */
  body?: string;
  /** 404 real cuando la fila no existe: un SPA devuelve 200 para todo, y eso es un soft-404. */
  status?: 200 | 404;
}

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');
const plain = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

// ── Qué página es ───────────────────────────────────────────────────────────

export async function describe(pathname: string): Promise<PageMeta | null> {
  const m = (re: RegExp) => pathname.match(re)?.[1];

  const toolSlug = m(/^\/tools\/([a-z0-9-]+)\/?$/);
  if (toolSlug && toolSlug !== 'new') return toolMeta(toolSlug, await getTool(toolSlug));

  const newsSlug = m(/^\/news\/([a-z0-9-]+)\/?$/);
  if (newsSlug) return newsMeta(newsSlug, await getNews(newsSlug));

  const catSlug = m(/^\/categories\/([a-z0-9-]+)\/?$/);
  if (catSlug) {
    const cat = await getCategory(catSlug);
    if (!cat) return notFound(`/categories/${catSlug}`);
    const [count, top] = await Promise.all([getCategoryToolCount(cat.id), getCategoryTopTools(cat.id)]);
    return categoryMeta(cat, count, top);
  }

  if (/^\/categories\/?$/.test(pathname)) return categoriesIndexMeta(await getCategoriesWithCounts());

  return null; // el resto se sirve tal cual
}

function notFound(path: string): PageMeta {
  return {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist or has been moved.',
    canonical: `${BASE_URL}${path}`,
    image: DEFAULT_IMAGE,
    type: 'website',
    noindex: true,
    status: 404,
    body: `<main><h1>Page not found</h1><p><a href="/tools">Browse the directory</a></p></main>`,
  };
}

function toolMeta(slug: string, t: ToolRow | null): PageMeta {
  if (!t) return notFound(`/tools/${slug}`);
  const tagline = plain(t.tagline).replace(/[.!?]+$/, '');
  const desc = plain(t.description);
  // La descripción del scraper suele empezar repitiendo la tagline; no se dice dos veces.
  const description = clip(
    desc.toLowerCase().startsWith(tagline.toLowerCase().slice(0, 40)) ? desc
      : tagline && desc ? `${tagline}. ${desc}` : tagline || desc || `${t.name} on ${SITE_NAME}.`,
    160,
  );
  const image = `${BASE_URL}/api/og?kind=tool&slug=${encodeURIComponent(t.slug)}`;
  const cat = t.category;
  return {
    title: `${t.name}${tagline ? ` — ${clip(tagline, 60)}` : ''}`,
    description,
    canonical: `${BASE_URL}/tools/${t.slug}`,
    image,
    type: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: t.name,
        description: desc || tagline,
        url: t.website || `${BASE_URL}/tools/${t.slug}`,
        applicationCategory: cat?.name || 'WebApplication',
        operatingSystem: 'Web',
        image: t.logo_url || t.screenshot_urls?.[0] || image,
        ...(t.pricing === 'free' ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } } : {}),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Tools', item: `${BASE_URL}/tools` },
          ...(cat ? [{ '@type': 'ListItem', position: 3, name: cat.name, item: `${BASE_URL}/categories/${cat.slug}` }] : []),
          { '@type': 'ListItem', position: cat ? 4 : 3, name: t.name, item: `${BASE_URL}/tools/${t.slug}` },
        ],
      },
    ],
    body: `<main><article>
<h1>${esc(t.name)}</h1>
${tagline ? `<p>${esc(tagline)}</p>` : ''}
${desc ? `<p>${esc(clip(desc, 600))}</p>` : ''}
<p>${cat ? `Category: <a href="/categories/${esc(cat.slug)}">${esc(cat.name)}</a>. ` : ''}${t.pricing ? `Pricing: ${esc(t.pricing)}. ` : ''}${t.website ? `<a href="${esc(t.website)}" rel="noopener">Visit website</a>` : ''}</p>
</article></main>`,
  };
}

function newsMeta(slug: string, n: NewsRow | null): PageMeta {
  if (!n) return notFound(`/news/${slug}`);
  const image = n.image_url && /^https?:\/\//.test(n.image_url)
    ? n.image_url
    : `${BASE_URL}/api/og?kind=news&slug=${encodeURIComponent(n.slug)}`;
  const paragraphs = (n.content ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('#') && !p.startsWith('-'))
    .slice(0, 3);
  // Enlaces Markdown internos → <a>, el resto texto plano escapado.
  const md = (p: string) =>
    esc(p).replace(/\[([^\]]+)\]\((\/[^)\s]+)\)/g, (_m, text, href) => `<a href="${href}">${text}</a>`);
  return {
    title: n.title,
    description: clip(plain(n.summary), 160),
    canonical: `${BASE_URL}/news/${n.slug}`,
    image,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: n.title,
      description: n.summary,
      image: [image],
      datePublished: n.published_at,
      dateModified: n.published_at,
      author: { '@type': 'Organization', name: SITE_NAME, url: BASE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: BASE_URL, logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE } },
      mainEntityOfPage: `${BASE_URL}/news/${n.slug}`,
      keywords: (n.tags ?? []).join(', '),
    },
    body: `<main><article>
<h1>${esc(n.title)}</h1>
<p><time datetime="${esc(n.published_at)}">${esc(n.published_at.slice(0, 10))}</time> · ${esc(n.source)}</p>
<p>${esc(n.summary)}</p>
${paragraphs.map((p) => `<p>${md(p)}</p>`).join('\n')}
<p><a href="/news">More from the newsletter</a> · <a href="/tools">Browse the directory</a></p>
</article></main>`,
  };
}

function categoryMeta(c: CategoryRow, count: number, top: { name: string; slug: string; tagline: string | null }[]): PageMeta {
  // El mismo copy que pinta `CategoryPage`: es lo único que distingue esta
  // página de un listado filtrado, y un crawler sin JS tiene que leerlo.
  const copy = CATEGORY_COPY[c.slug];
  const heading = copy?.heading ?? `${c.name} Tools`;
  const description = clip(copy?.metaDescription ?? plain(c.description) ?? `Compare ${count} ${c.name.toLowerCase()} tools in the ${SITE_NAME} directory.`, 160);
  const intro = copy?.intro.split('\n\n').map((x) => x.trim()).filter(Boolean) ?? [];
  return {
    title: copy?.metaTitle ?? `${c.name} Tools (${count})`,
    description,
    canonical: `${BASE_URL}/categories/${c.slug}`,
    image: `${BASE_URL}/api/og?kind=category&slug=${encodeURIComponent(c.slug)}`,
    type: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: heading,
        url: `${BASE_URL}/categories/${c.slug}`,
        description,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: count,
          itemListElement: top.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE_URL}/tools/${t.slug}`, name: t.name })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: `${BASE_URL}/categories` },
          { '@type': 'ListItem', position: 3, name: c.name, item: `${BASE_URL}/categories/${c.slug}` },
        ],
      },
    ],
    body: `<main>
<h1>${esc(heading)}</h1>
${intro.map((x) => `<p>${esc(x)}</p>`).join('\n') || `<p>${esc(description)}</p>`}
<h2>${count} tools in ${esc(c.name)}</h2>
<ul>${top.map((t) => `<li><a href="/tools/${esc(t.slug)}">${esc(t.name)}</a>${t.tagline ? ` — ${esc(clip(plain(t.tagline), 120))}` : ''}</li>`).join('')}</ul>
<p><a href="/categories">All categories</a></p>
</main>`,
  };
}

function categoriesIndexMeta(cats: Array<CategoryRow & { tool_count: number }>): PageMeta {
  return {
    title: 'Tool Categories',
    description: `Every category in the directory, from marketing and automation to 3D and cybersecurity, with the number of tools listed in each.`,
    canonical: `${BASE_URL}/categories`,
    image: DEFAULT_IMAGE,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'AI & No-Code Tool Categories',
      url: `${BASE_URL}/categories`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: cats.length,
        itemListElement: cats.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE_URL}/categories/${c.slug}`, name: c.name })),
      },
    },
    body: `<main><h1>AI &amp; No-Code Tool Categories</h1><ul>${cats.map((c) => `<li><a href="/categories/${esc(c.slug)}">${esc(c.name)}</a> (${c.tool_count})</li>`).join('')}</ul></main>`,
  };
}

// ── Escribirlo en el HTML ───────────────────────────────────────────────────

function setMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const re = new RegExp(`<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+content="[^"]*"\\s*/?>`);
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

export function injectHead(html: string, meta: PageMeta): string {
  const fullTitle = `${meta.title} | ${SITE_NAME}`;
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(fullTitle)}</title>`);

  out = setMeta(out, 'name', 'description', meta.description);
  out = setMeta(out, 'name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow');
  out = setMeta(out, 'property', 'og:type', meta.type);
  out = setMeta(out, 'property', 'og:title', fullTitle);
  out = setMeta(out, 'property', 'og:description', meta.description);
  out = setMeta(out, 'property', 'og:image', meta.image);
  out = setMeta(out, 'property', 'og:image:alt', fullTitle);
  out = setMeta(out, 'property', 'og:url', meta.canonical);
  out = setMeta(out, 'name', 'twitter:title', fullTitle);
  out = setMeta(out, 'name', 'twitter:description', meta.description);
  out = setMeta(out, 'name', 'twitter:image', meta.image);
  out = setMeta(out, 'name', 'twitter:image:alt', fullTitle);

  // Canónica: `useSEO` la busca con `link[rel="canonical"]` y la actualiza, no la duplica.
  out = out.replace(/<link\s+rel="canonical"[^>]*>\n?/g, '');
  out = out.replace('</head>', `    <link rel="canonical" href="${esc(meta.canonical)}" />\n  </head>`);

  // JSON-LD de página, con el mismo `data-jsonld` que usa `useSEO` para que lo reemplace.
  if (meta.jsonLd) {
    const json = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c');
    out = out.replace('</head>', `    <script type="application/ld+json" data-jsonld="page-jsonld">${json}</script>\n  </head>`);
  }

  // Contenido legible sin JS. `createRoot().render()` lo sustituye al montar.
  if (meta.body) {
    out = out.replace(/<div id="root"><\/div>/, `<div id="root">${meta.body}</div>`);
  }

  return out;
}
