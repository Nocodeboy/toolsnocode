import { entity, facets, routes, site } from '../../site.config';
import type { CategoryRow, ListingCard, ListingRow, PostRow } from './data';
import {
  getCategoriesWithCounts, getCategory, getCategoryListingCount, getCategoryTop,
  getFacetCounts, getHomeData, getIndexData, getListing, getPost, getPostList, getSiblings,
} from './data';

/**
 * El `<head>` —y el cuerpo mínimo— correcto para cada ruta, escrito en el HTML
 * antes de servirlo.
 *
 * Por qué existe: la aplicación es un SPA. El hook `useSEO` pone título,
 * descripción, canónica y JSON-LD desde JavaScript. Google lo ejecuta, tarde y
 * con menos presupuesto de rastreo; Bing a medias; X, LinkedIn, Slack y
 * WhatsApp no lo ejecutan nunca. Sin esta capa, todas las páginas del sitio
 * devuelven los mismos 700 bytes, el mismo título y la misma imagen social.
 *
 * No sustituye a `useSEO`: escribe exactamente los elementos que `useSEO`
 * busca por selector y actualiza, así que al montar React no los duplica.
 *
 * Las dos cosas que hay que entender antes de tocar esto:
 *
 *  1. **Vercel sirve un fichero que exista en la ruta antes de mirar las
 *     reescrituras.** Con `index.html` en la raíz del build, la portada nunca
 *     llega aquí. Por eso el build renombra la cáscara del SPA a `app.html`.
 *
 *  2. **El cuerpo inyectado va oculto.** El navegador pinta el HTML antes de
 *     que arranque el módulo de la aplicación, y este bloque no lleva clases:
 *     se veía un fotograma de texto sin estilo en cada carga. Va con
 *     `display:none` y un `<noscript>` que lo devuelve a la vista para quien
 *     no ejecuta JavaScript, que es justo para quien se escribió.
 */

export const BASE_URL = site.url;
export const SITE_NAME = site.name;
const DEFAULT_IMAGE = `${site.url}${site.ogImage}`;

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  image: string;
  type: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: object | object[];
  /** HTML mínimo para `<div id="root">`: lo que lee un rastreador sin JS. */
  body?: string;
  /** 404 de verdad cuando la fila no existe. Un SPA contesta 200 a todo. */
  status?: 200 | 404;
  /** Redirección 301, para el mapa de URLs de un sitio anterior. */
  redirect?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');
const plain = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
const fmt = (n: number) => n.toLocaleString(site.lang);

const listPath = `/${entity.path}`;

// ── Qué página es ────────────────────────────────────────────────────────────

export async function describe(pathname: string): Promise<PageMeta | null> {
  const m = (re: RegExp) => pathname.match(re)?.[1];

  const slug = m(new RegExp(`^${listPath}/([a-z0-9-]+)/?$`));
  if (slug && slug !== 'new') {
    const row = await getListing(slug);
    const siblings = row?.category ? await getSiblings(row.category.id, slug) : [];
    return listingMeta(slug, row, siblings);
  }

  const postSlug = m(/^\/blog\/([a-z0-9-]+)\/?$/);
  if (postSlug) return postMeta(postSlug, await getPost(postSlug));

  const facetMatch = pathname.match(/^\/categories\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/);
  if (facetMatch) {
    const [, cslug, facet] = facetMatch;
    const cat = await getCategory(cslug);
    if (!cat) return notFound(pathname);
    const [n, top, variants] = await Promise.all([
      getCategoryListingCount(cat.id, facet), getCategoryTop(cat.id, 12, facet), getFacetCounts(cat.id),
    ]);
    if (n === 0) return notFound(pathname);
    return categoryMeta(cat, n, top, variants, facet);
  }

  const catSlug = m(/^\/categories\/([a-z0-9-]+)\/?$/);
  if (catSlug) {
    const cat = await getCategory(catSlug);
    if (!cat) return notFound(pathname);
    const [n, top, variants] = await Promise.all([
      getCategoryListingCount(cat.id), getCategoryTop(cat.id), getFacetCounts(cat.id),
    ]);
    return categoryMeta(cat, n, top, variants);
  }

  if (/^\/categories\/?$/.test(pathname)) return categoriesMeta(await getCategoriesWithCounts());
  if (/^\/blog\/?$/.test(pathname)) return blogMeta(await getPostList(20));
  if (new RegExp(`^${listPath}/?$`).test(pathname)) return indexMeta(await getIndexData());
  if (/^\/?$/.test(pathname)) return homeMeta(await getHomeData());

  // Todo lo que no sea ruta de la aplicación es un 404 de verdad. Lo que sí es
  // ruta conocida pero no se resuelve aquí (cuenta, legales) sale intacto.
  if (!isKnownRoute(pathname)) return notFound(pathname);
  return null;
}

function isKnownRoute(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  return (routes.static as readonly string[]).includes(p) || routes.dynamic.some((re) => re.test(p));
}

// ── Metadatos por tipo de página ─────────────────────────────────────────────

function notFound(pathname: string): PageMeta {
  return {
    title: 'Page not found',
    description: 'That page does not exist.',
    canonical: `${BASE_URL}${pathname}`,
    image: DEFAULT_IMAGE,
    type: 'website',
    noindex: true,
    status: 404,
    body: `<main><h1>Page not found</h1><p><a href="${listPath}">Browse the directory</a></p></main>`,
  };
}

const cardList = (items: ListingCard[]) =>
  `<ul>\n${items.map((i) => `<li><a href="${listPath}/${esc(i.slug)}">${esc(i.name)}</a>${i.tagline ? ` — ${esc(clip(plain(i.tagline), 120))}` : ''}</li>`).join('\n')}\n</ul>`;

const categoryList = (cats: { name: string; slug: string; listing_count: number }[]) =>
  `<ul>\n${cats.map((c) => `<li><a href="/categories/${esc(c.slug)}">${esc(c.name)}</a> (${fmt(c.listing_count)})</li>`).join('\n')}\n</ul>`;

function homeMeta(d: Awaited<ReturnType<typeof getHomeData>>): PageMeta {
  return {
    title: `${site.tagline} — ${fmt(d.total)} ${entity.plural}`,
    description: clip(site.description, 160),
    canonical: `${BASE_URL}/`,
    image: DEFAULT_IMAGE,
    type: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: BASE_URL,
        description: site.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}${listPath}?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
    body: `<main><h1>${esc(site.tagline)}</h1><p>${esc(site.description)}</p>
${d.boosted.length ? `<h2>Featured</h2>${cardList(d.boosted)}` : ''}
<h2>Recently added</h2>${cardList(d.recent)}
<h2>Browse by category</h2>${categoryList(d.categories)}</main>`,
  };
}

function indexMeta(d: Awaited<ReturnType<typeof getIndexData>>): PageMeta {
  return {
    title: `All ${entity.plural} — ${fmt(d.total)} listed`,
    description: clip(`${fmt(d.total)} ${entity.plural} across ${d.categories.length} categories. ${site.description}`, 160),
    canonical: `${BASE_URL}${listPath}`,
    image: DEFAULT_IMAGE,
    type: 'website',
    jsonLd: [breadcrumbs([[entity.plural, listPath]])],
    body: `<main><h1>All ${esc(entity.plural)}</h1><p>${fmt(d.total)} listed across ${d.categories.length} categories.</p>
${cardList(d.top)}
<h2>Browse by category</h2>${categoryList(d.categories)}</main>`,
  };
}

function listingMeta(slug: string, row: ListingRow | null, siblings: ListingCard[]): PageMeta {
  if (!row) return notFound(`${listPath}/${slug}`);
  const tagline = plain(row.tagline).replace(/[.!?]+$/, '');
  const desc = plain(row.description);
  // La descripción suele empezar repitiendo la tagline; no se dice dos veces.
  const description = clip(
    desc.toLowerCase().startsWith(tagline.toLowerCase().slice(0, 40)) ? desc
      : tagline && desc ? `${tagline}. ${desc}` : tagline || desc || `${row.name}.`,
    160,
  );
  const cat = row.category;
  return {
    title: `${row.name}${tagline ? ` — ${clip(tagline, 60)}` : ''}`,
    description,
    canonical: `${BASE_URL}${listPath}/${row.slug}`,
    image: row.logo_url || row.image_urls?.[0] || DEFAULT_IMAGE,
    type: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org', '@type': 'Thing', name: row.name,
        description: desc || tagline, url: row.website || `${BASE_URL}${listPath}/${row.slug}`,
        image: row.logo_url || row.image_urls?.[0] || DEFAULT_IMAGE,
      },
      ...(siblings.length ? [{
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: `Alternatives to ${row.name}`, numberOfItems: siblings.length,
        itemListElement: siblings.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE_URL}${listPath}/${s.slug}`, name: s.name })),
      }] : []),
      breadcrumbs([[entity.plural, listPath], ...(cat ? [[cat.name, `/categories/${cat.slug}`] as [string, string]] : []), [row.name, `${listPath}/${row.slug}`]]),
    ],
    body: `<main><article>
<h1>${esc(row.name)}</h1>
${tagline ? `<p>${esc(tagline)}</p>` : ''}
${desc ? `<p>${esc(desc)}</p>` : ''}
${cat ? `<p>Category: <a href="/categories/${esc(cat.slug)}">${esc(cat.name)}</a></p>` : ''}
${row.facet ? `<p><a href="/categories/${esc(cat?.slug ?? '')}/${esc(row.facet)}">${esc(facets.labels[row.facet] ?? row.facet)}</a></p>` : ''}
${row.website ? `<p><a href="${esc(row.website)}" rel="nofollow">${esc(entity.outboundLabel)}</a></p>` : ''}
${siblings.length ? `<h2>Alternatives to ${esc(row.name)}</h2>${cardList(siblings)}` : ''}
</article></main>`,
  };
}

function categoryMeta(
  cat: CategoryRow,
  n: number,
  top: ListingCard[],
  variants: { facet: string; listing_count: number }[],
  facet?: string,
): PageMeta {
  const label = facet ? facets.labels[facet] ?? facet : null;
  const title = facet ? `${label} ${cat.name} — ${fmt(n)} ${entity.plural}` : `${cat.name} — ${fmt(n)} ${entity.plural}`;
  const path = facet ? `/categories/${cat.slug}/${facet}` : `/categories/${cat.slug}`;
  return {
    title,
    description: clip(plain(cat.description) || `${fmt(n)} ${entity.plural} in ${cat.name}.`, 160),
    canonical: `${BASE_URL}${path}`,
    image: DEFAULT_IMAGE,
    type: 'website',
    // Una página con cuatro fichas es contenido pobre. Existe y funciona, pero
    // no se anuncia: que la indexen es peor que no tenerla.
    noindex: Boolean(facet) && n < facets.indexMin,
    jsonLd: [
      breadcrumbs([
        [entity.plural, listPath],
        [cat.name, `/categories/${cat.slug}`],
        ...(facet ? [[label as string, path] as [string, string]] : []),
      ]),
      {
        '@context': 'https://schema.org', '@type': 'ItemList', name: title, numberOfItems: top.length,
        itemListElement: top.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE_URL}${listPath}/${t.slug}`, name: t.name })),
      },
    ],
    body: `<main><h1>${esc(title)}</h1>
${cat.description ? `<p>${esc(plain(cat.description))}</p>` : ''}
${cardList(top)}
${variants.length ? `<h2>Narrow it down</h2><ul>${variants
      .map((v) => `<li><a href="/categories/${esc(cat.slug)}/${esc(v.facet)}">${esc(facets.labels[v.facet] ?? v.facet)}</a> (${fmt(v.listing_count)})</li>`)
      .join('')}</ul>` : ''}
<p><a href="/categories">All categories</a></p></main>`,
  };
}

function categoriesMeta(cats: { name: string; slug: string; listing_count: number }[]): PageMeta {
  return {
    title: 'All categories',
    description: clip(`${cats.length} categories. ${site.description}`, 160),
    canonical: `${BASE_URL}/categories`,
    image: DEFAULT_IMAGE,
    type: 'website',
    jsonLd: [breadcrumbs([['Categories', '/categories']])],
    body: `<main><h1>All categories</h1>${categoryList(cats)}</main>`,
  };
}

function blogMeta(posts: PostRow[]): PageMeta {
  return {
    title: 'Blog',
    description: clip(`Writing from ${site.name}: what the data says, and what changed this month.`, 160),
    canonical: `${BASE_URL}/blog`,
    image: DEFAULT_IMAGE,
    type: 'website',
    jsonLd: [breadcrumbs([['Blog', '/blog']])],
    body: `<main><h1>Blog</h1><ul>${posts
      .map((p) => `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a> — ${esc(clip(plain(p.summary), 140))}</li>`)
      .join('')}</ul></main>`,
  };
}

function postMeta(slug: string, post: PostRow | null): PageMeta {
  if (!post) return notFound(`/blog/${slug}`);
  const body = plain(post.content).slice(0, 4000);
  return {
    title: post.title,
    description: clip(plain(post.summary) || body, 160),
    canonical: `${BASE_URL}/blog/${post.slug}`,
    image: post.image_url || DEFAULT_IMAGE,
    type: 'article',
    jsonLd: [
      {
        '@context': 'https://schema.org', '@type': 'Article', headline: post.title,
        description: plain(post.summary), datePublished: post.published_at,
        image: post.image_url || DEFAULT_IMAGE,
        publisher: { '@type': 'Organization', name: site.name, url: BASE_URL },
        mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
      },
      breadcrumbs([['Blog', '/blog'], [post.title, `/blog/${post.slug}`]]),
    ],
    body: `<main><article><h1>${esc(post.title)}</h1>
${post.summary ? `<p>${esc(plain(post.summary))}</p>` : ''}
${plain(post.content).split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}
</article></main>`,
  };
}

function breadcrumbs(items: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem', position: i + 1, name, item: `${BASE_URL}${path}`,
    })),
  };
}

// ── Inyección ────────────────────────────────────────────────────────────────

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
  out = setMeta(out, 'property', 'og:url', meta.canonical);
  out = setMeta(out, 'name', 'twitter:title', fullTitle);
  out = setMeta(out, 'name', 'twitter:description', meta.description);
  out = setMeta(out, 'name', 'twitter:image', meta.image);

  // La canónica: el hook del cliente la busca por selector y la actualiza, no
  // la duplica. Se quita la que venga en la cáscara y se pone la de la ruta.
  out = out.replace(/<link\s+rel="canonical"[^>]*>\n?/g, '');
  out = out.replace('</head>', `    <link rel="canonical" href="${esc(meta.canonical)}" />\n  </head>`);

  if (meta.jsonLd) {
    const json = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c');
    out = out.replace('</head>', `    <script type="application/ld+json" data-jsonld="page-jsonld">${json}</script>\n  </head>`);
  }

  if (meta.body) {
    out = out.replace(
      '</head>',
      '    <style>#seo-fallback{display:none}</style>\n' +
      '    <noscript><style>#seo-fallback{display:block}</style></noscript>\n  </head>',
    );
    out = out.replace(/<div id="root"><\/div>/, `<div id="root"><div id="seo-fallback">${meta.body}</div></div>`);
  }

  return out;
}
