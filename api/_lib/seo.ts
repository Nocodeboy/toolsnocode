import type { CategoryRow, NewsRow, ToolRow } from './data';
import { getCategoriesWithCounts, getCategory, getCategoryPricingCounts, getCategoryToolCount, getCategoryTopTools, getHomeData, getNews, getNewsList, getTool, getToolsHubData } from './data';
import type { ToolCard } from './data';
import { CATEGORY_COPY } from '../../src/data/categoryCopy';
import { INDEX_MIN, PRICING_LABEL, PRICING_SLUGS, isPricingSlug, pricingCopy, type PricingSlug } from '../../src/data/pricingPages';

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
  if (toolSlug && toolSlug !== 'new') {
    const tool = await getTool(toolSlug);
    // Las alternativas son el enlazado interno de la ficha: sin ellas cada
    // herramienta es una hoja suelta para el rastreador.
    const alternatives = tool?.category
      ? (await getCategoryTopTools(tool.category.id, 7)).filter((x) => x.slug !== tool.slug).slice(0, 6)
      : [];
    return toolMeta(toolSlug, tool, alternatives);
  }

  const newsSlug = m(/^\/news\/([a-z0-9-]+)\/?$/);
  if (newsSlug) return newsMeta(newsSlug, await getNews(newsSlug));

  const catPricing = pathname.match(/^\/categories\/([a-z0-9-]+)\/([a-z]+)\/?$/);
  if (catPricing) {
    const [, cslug, pricing] = catPricing;
    if (!isPricingSlug(pricing)) return notFound(pathname);
    const cat = await getCategory(cslug);
    if (!cat) return notFound(pathname);
    const [count, top, variants] = await Promise.all([getCategoryToolCount(cat.id, pricing), getCategoryTopTools(cat.id, 12, pricing), getCategoryPricingCounts(cat.id)]);
    return categoryMeta(cat, count, top, variants, pricing);
  }

  const catSlug = m(/^\/categories\/([a-z0-9-]+)\/?$/);
  if (catSlug) {
    const cat = await getCategory(catSlug);
    if (!cat) return notFound(`/categories/${catSlug}`);
    const [count, top, variants] = await Promise.all([getCategoryToolCount(cat.id), getCategoryTopTools(cat.id), getCategoryPricingCounts(cat.id)]);
    return categoryMeta(cat, count, top, variants);
  }

  if (/^\/categories\/?$/.test(pathname)) return categoriesIndexMeta(await getCategoriesWithCounts());

  if (/^\/news\/?$/.test(pathname)) return newsIndexMeta(await getNewsList(20));

  if (/^\/tools\/?$/.test(pathname)) return toolsHubMeta(await getToolsHubData());

  if (/^\/?$/.test(pathname)) return homeMeta(await getHomeData());

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

function toolMeta(slug: string, t: ToolRow | null, alternatives: { name: string; slug: string; tagline: string | null }[] = []): PageMeta {
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
      ...(alternatives.length > 0 ? [{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${t.name} alternatives`,
        numberOfItems: alternatives.length,
        itemListElement: alternatives.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE_URL}/tools/${a.slug}`, name: a.name })),
      }] : []),
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
${(t.description ?? '').split(/\n\s*\n/).map((x) => plain(x)).filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join('\n')}
<p>${cat ? `Category: <a href="/categories/${esc(cat.slug)}">${esc(cat.name)}</a>. ` : ''}${t.pricing ? `Pricing: ${cat && isPricingSlug(t.pricing) ? `<a href="/categories/${esc(cat.slug)}/${t.pricing}">${esc(t.pricing)}</a>` : esc(t.pricing)}. ` : ''}${t.website ? `<a href="${esc(t.website)}" rel="noopener">Visit website</a>` : ''}</p>
${alternatives.length > 0 ? `<h2>Alternatives to ${esc(t.name)}${cat ? ` in ${esc(cat.name)}` : ''}</h2>
<ul>${alternatives.map((a) => `<li><a href="/tools/${esc(a.slug)}">${esc(a.name)}</a>${a.tagline ? ` — ${esc(clip(plain(a.tagline), 120))}` : ''}</li>`).join('')}</ul>` : ''}
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
      // Lo que escribimos nosotros es un artículo de blog con datos propios;
      // lo que resume prensa ajena sigue siendo NewsArticle.
      '@type': n.source === SITE_NAME ? 'Article' : 'NewsArticle',
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

function newsIndexMeta(items: NewsRow[]): PageMeta {
  const description = 'Data stories from the ToolsNoCode directory: what 3,000 AI and no-code listings say about pricing, churn and what builders actually ship, plus the weekly digest of new tools.';
  return {
    title: 'AI & No-Code News and Data Stories',
    description,
    canonical: `${BASE_URL}/news`,
    image: DEFAULT_IMAGE,
    type: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'AI & No-Code News and Data Stories',
        url: `${BASE_URL}/news`,
        description,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: items.map((n, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE_URL}/news/${n.slug}`, name: n.title })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'News', item: `${BASE_URL}/news` },
        ],
      },
    ],
    body: `<main><h1>AI &amp; No-Code News and Data Stories</h1>
<p>${esc(description)}</p>
<ul>
${items.map((n) => `<li><a href="/news/${esc(n.slug)}">${esc(n.title)}</a> — <time datetime="${esc(n.published_at)}">${esc(n.published_at.slice(0, 10))}</time> · ${esc(n.source)}</li>`).join('\n')}
</ul>
<p><a href="/feed.xml">RSS feed</a> · <a href="/tools">Browse the directory</a></p>
</main>`,
  };
}

function categoryMeta(
  c: CategoryRow,
  count: number,
  top: { name: string; slug: string; tagline: string | null }[],
  variants: Record<string, number>,
  pricing?: PricingSlug,
): PageMeta {
  // El mismo copy que pinta `CategoryPage`: es lo único que distingue esta
  // página de un listado filtrado, y un crawler sin JS tiene que leerlo.
  const authored = CATEGORY_COPY[c.slug];
  const copy = pricing
    ? pricingCopy(pricing, c.name, count)
    : {
        heading: authored?.heading ?? `${c.name} Tools`,
        metaTitle: authored?.metaTitle ?? `${c.name} Tools (${count})`,
        metaDescription: authored?.metaDescription ?? plain(c.description) ?? `Compare ${count} ${c.name.toLowerCase()} tools in the ${SITE_NAME} directory.`,
        intro: authored?.intro ?? '',
      };
  const path = pricing ? `/categories/${c.slug}/${pricing}` : `/categories/${c.slug}`;
  const description = clip(copy.metaDescription, 160);
  const intro = copy.intro.split('\n\n').map((x) => x.trim()).filter(Boolean);
  const pills = PRICING_SLUGS.filter((p) => (variants[p] ?? 0) > 0)
    .map((p) => `<a href="/categories/${esc(c.slug)}/${p}">${PRICING_LABEL[p]} (${variants[p]})</a>`);
  return {
    title: copy.metaTitle,
    description,
    canonical: `${BASE_URL}${path}`,
    image: `${BASE_URL}/api/og?kind=category&slug=${encodeURIComponent(c.slug)}`,
    type: 'website',
    // Una variante con pocas herramientas funciona pero no se indexa.
    noindex: pricing !== undefined && count < INDEX_MIN,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: copy.heading,
        url: `${BASE_URL}${path}`,
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
          ...(pricing ? [{ '@type': 'ListItem', position: 4, name: PRICING_LABEL[pricing], item: `${BASE_URL}${path}` }] : []),
        ],
      },
    ],
    body: `<main>
<h1>${esc(copy.heading)}</h1>
${intro.map((x) => `<p>${esc(x)}</p>`).join('\n') || `<p>${esc(description)}</p>`}
<p>By pricing: <a href="/categories/${esc(c.slug)}">All</a>${pills.length ? ' · ' + pills.join(' · ') : ''}</p>
<h2>${count} ${pricing ? `${pricing} ` : ''}tools in ${esc(c.name)}</h2>
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

// ── Portada y hub de herramientas ────────────────────────────────────────────
//
// Son las dos páginas con más enlaces entrantes del sitio y, sin esto, las dos
// que menos decían a un rastreador: 3 KB de cascarón y un título genérico.

const fmt = (n: number) => n.toLocaleString('en-US');

const toolList = (items: ToolCard[]) =>
  `<ul>\n${items.map((t) => `<li><a href="/tools/${esc(t.slug)}">${esc(t.name)}</a>${t.tagline ? ` — ${esc(clip(plain(t.tagline), 120))}` : ''}</li>`).join('\n')}\n</ul>`;

const categoryList = (cats: { name: string; slug: string; tool_count: number }[]) =>
  `<ul>\n${cats.map((c) => `<li><a href="/categories/${esc(c.slug)}">${esc(c.name)}</a> (${fmt(c.tool_count)})</li>`).join('\n')}\n</ul>`;

const itemList = (items: ToolCard[]) => ({
  '@type': 'ItemList',
  numberOfItems: items.length,
  itemListElement: items.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE_URL}/tools/${t.slug}`, name: t.name })),
});

function homeMeta(d: Awaited<ReturnType<typeof getHomeData>>): PageMeta {
  const total = fmt(d.total);
  const description = `Compare ${total} AI and no-code tools across ${d.categories.length} categories, with pricing checked against each tool's own site. Boosted picks, editor's picks and what builders are opening this week.`;
  const sections: Array<[string, ToolCard[]]> = [
    ['Boosted this week', d.boosted],
    ["Editor's picks", d.picks],
    ['Trending', d.trending],
    ['Recently added', d.recent],
  ];
  return {
    title: `AI & No-Code Tools Directory: ${total} Tools Compared`,
    description: clip(description, 160),
    canonical: `${BASE_URL}/`,
    image: DEFAULT_IMAGE,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${SITE_NAME}: AI & No-Code Tools Directory`,
      url: `${BASE_URL}/`,
      description: clip(description, 160),
      mainEntity: itemList([...d.boosted, ...d.picks, ...d.trending].slice(0, 12)),
    },
    body: `<main>
<h1>Discover the best AI &amp; no-code tools</h1>
<p>${esc(description)}</p>
${sections.filter(([, items]) => items.length > 0).map(([h, items]) => `<h2>${esc(h)}</h2>\n${toolList(items)}`).join('\n')}
<h2>Browse by category</h2>
${categoryList(d.categories)}
<p><a href="/tools">All ${total} tools</a> · <a href="/news">News and data stories</a> · <a href="/pricing">Boost a listing</a></p>
</main>`,
  };
}

function toolsHubMeta(d: Awaited<ReturnType<typeof getToolsHubData>>): PageMeta {
  const total = fmt(d.total);
  const description = `Browse ${total} AI and no-code tools. Filter by category and pricing model (free, freemium, paid, enterprise), each label checked against the tool's own site.`;
  return {
    title: `All AI & No-Code Tools (${total})`,
    description: clip(description, 160),
    canonical: `${BASE_URL}/tools`,
    image: DEFAULT_IMAGE,
    type: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'All AI & No-Code Tools',
        url: `${BASE_URL}/tools`,
        description: clip(description, 160),
        mainEntity: itemList(d.tools),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Tools', item: `${BASE_URL}/tools` },
        ],
      },
    ],
    body: `<main>
<h1>All AI &amp; no-code tools</h1>
<p>${esc(description)}</p>
<h2>Latest additions</h2>
${toolList(d.tools)}
<h2>By category</h2>
${categoryList(d.categories)}
<p><a href="/categories">All categories</a> · <a href="/news">News and data stories</a></p>
</main>`,
  };
}
