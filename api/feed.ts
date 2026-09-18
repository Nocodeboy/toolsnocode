import { getNewsList } from './_lib/data';
import { BASE_URL, SITE_NAME, esc } from './_lib/seo';

export const config = { runtime: 'edge' };

/**
 * RSS del blog en `/feed.xml` (reescrito aquí por `vercel.json`).
 *
 * Un feed es la forma más barata de que agregadores, lectores y los propios
 * rastreadores descubran una pieza nueva el mismo día que sale, sin esperar
 * al siguiente rastreo del sitemap. Solo lo público: la misma clave `anon`
 * que usa el navegador.
 */
export default async function handler(): Promise<Response> {
  let items;
  try {
    items = await getNewsList(50);
  } catch (err) {
    console.error('feed: supabase unavailable', err);
    return new Response('feed temporarily unavailable', { status: 503, headers: { 'cache-control': 'no-store' } });
  }

  const entries = items.map((n) => {
    const url = `${BASE_URL}/news/${n.slug}`;
    const image = n.image_url && /^https?:\/\//.test(n.image_url) ? n.image_url : `${BASE_URL}/api/og?kind=news&slug=${encodeURIComponent(n.slug)}`;
    return `    <item>
      <title>${esc(n.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${new Date(n.published_at).toUTCString()}</pubDate>
      <description>${esc(n.summary ?? '')}</description>
      <enclosure url="${esc(image)}" type="image/png" length="0" />
${(n.tags ?? []).map((t) => `      <category>${esc(t)}</category>`).join('\n')}
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} — AI &amp; No-Code News and Data Stories</title>
    <link>${BASE_URL}/news</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Data stories from a directory of 3,000 AI and no-code tools, plus the weekly digest of new arrivals.</description>
    <language>en</language>
    <lastBuildDate>${new Date(items[0]?.published_at ?? Date.now()).toUTCString()}</lastBuildDate>
${entries.join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  });
}
