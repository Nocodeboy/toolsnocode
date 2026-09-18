# SEO audit — 16 September 2026

Measured, not assumed. Every finding below comes from a request against
production or a query against the database on the date above, and says what was
done about it.

## 1. What a crawler saw (the finding that outranks the rest)

Fetched with a non-JavaScript user agent, these four URLs returned **the same
705 bytes of visible text, the same `<title>`, the same meta description, the
same generic `og:image`, no canonical and no `<h1>`**:

`/` · `/tools/canva` · `/news/mcp-tooling-layer-2026-09-13` · `/categories/marketing`

The site is a Vite SPA. `useSEO` writes every per-page tag from JavaScript.
Google executes it — in a second wave, days later, with a smaller budget. Bing
partly. X, LinkedIn, Slack, WhatsApp and Telegram never: every shared link
showed the same card.

**Done.** `api/page.ts`, a Vercel Edge Function, now serves `/tools/:slug`,
`/news/:slug`, `/categories/:slug` and `/categories` with the route's title,
description, canonical, OpenGraph, Twitter and JSON-LD written into the head,
and an `<h1>` plus the first paragraphs inside `#root` for crawlers that never
run JavaScript. Category pages serve the editorial copy from
`src/data/categoryCopy.ts`. It fails open (Supabase down, unknown route, any
error → the untouched HTML) and returns a real **404** when the row does not
exist, because a SPA answering 200 to every path is a soft-404 factory.

Verified in production after deploy:

| URL | Before | After |
|-----|-------:|------:|
| `/tools/canva` | 705 B, generic title | 937 B, `Canva — Design stunning visuals…`, canonical, own image |
| `/news/mcp-tooling-layer-2026-09-13` | 705 B, generic title | 1,928 B, article title, `NewsArticle` JSON-LD |
| `/categories/marketing` | 705 B, generic title | 2,846 B, editorial title + intro, `CollectionPage` |
| `/tools/<missing>` | 200 | **404** + `noindex` |

## 2. Social images

News rows had `image_url` for the 20 scraped articles and none for the edition
written in-house. Tools and categories had none at all.

**Done.** `api/og.tsx` (`@vercel/og`, pinned to 0.6.8 — 1.x pulls a Node
builtin the Edge runtime rejects) renders 1200×630 cards on request:
`?kind=news|tool|category&slug=…`, cached a day at the edge, falling back to
`/og-image.png` on any failure. Own editions point `image_url` here, and
`digest` sets it by default for future ones. Verified: 86 KB / 96 KB / 74 KB
PNGs for the three kinds, 302 fallback on an unknown slug.

## 3. Thin content — in progress

| | Tools |
|---|---:|
| Total indexed | 3,094 |
| Description under 200 characters (16 Sep) | 2,150 (69%) |
| Description under 80 characters (16 Sep) | 376 (12%) |
| Under 80 after the first pass (17 Sep) | 270 |

**Decision (17 Sep): rewrite, not deindex.** Written from each tool's own
site, never from imagination:

1. Fetch the homepage of every tool in the set; extract title, meta and
   OpenGraph descriptions, headings and visible text.
2. Writers work from row + site extract under strict rules: only claims
   traceable to the inputs, 110–210 words, banned marketing filler, no
   verbatim site sentences, and **return null when the inputs cannot
   support three true sentences** — a thin page beats a padded one.
3. A validator rejects anything outside the rules (length, banned words,
   URLs, Markdown, missing the tool's name, duplicated openings).
4. Applied with a backup table (`tools_description_backup_20260917`).

First pass on the 376 under 80 characters: 363 had a website; 281
answered; 183 gave enough signal; **106 rewritten and live**, 75 returned
null (Cloudflare blocks, empty SPA shells, parked domains), 1 rejected by
the validator. The pass also surfaced 17 listings whose domain now serves
spam, gambling or a different company and 7 products that have shut down
— see [DELIST-CANDIDATES.md](./DELIST-CANDIDATES.md).

Second pass (80–107 characters, 184 rows): 154 sites answered, 119 gave
signal, **76 rewritten and live**, 43 null.

Third pass (107–121 characters, 121 rows): 114 sites answered, **86
rewritten and live**, 24 null. Fourth pass (121–134 characters, 184 rows):
179 sites answered, **135 rewritten and live**, 38 null.

Fifth pass (134–143 characters, 184 rows): 175 sites answered, **137
rewritten and live**, 34 null.

Sixth pass (143–150 characters, 184 rows): 177 sites answered, **147
rewritten and live**, 22 null.

Seventh pass (150–155 characters, 184 rows): 175 sites answered, **156
rewritten and live**, 17 null.

Eighth pass (155–161 characters, 184 rows): 176 sites answered, **144
rewritten and live**, 28 null.

Cumulative after eight passes: **987 tool pages rewritten**, average
description length 228 → 544 characters. Remaining under 200 characters:
1,164. Same pipeline, ~10 minutes per 180-row batch; from pass seven the
writers run on a smaller model with a stricter prompt (null when the site
is blocked or empty, pricing evidence must be a literal quote) and a
manual pass over every number and proper noun before applying. The passes
also surfaced 94 listings whose product has been renamed, acquired or
shut down, 7 hijacked domains, 2 stored taglines that are gambling spam
and one listing that now links to adult content — see
[DELIST-CANDIDATES.md](./DELIST-CANDIDATES.md).

The same site fetch was used to reconcile the `pricing` field: **293 rows
corrected** where the site contradicted the listed value with explicit
evidence (backup table `tools_pricing_backup_20260917`). `freemium` had
been the scraper's default for 59% of the directory; the corrections were
mostly `freemium → enterprise` for demo-only vendors and `free → paid`
where a trial had been recorded as free.

## 4. Images

Checked all 6,047 logo and screenshot URLs on 17 September: **345 logos
(11%) and 452 screenshots (15%) broken** — 404s from Google's favicon
service, an expired third-party screenshot service, hotlink-protected
CDNs, and 35 rows where an automated client had stored `'h'` as a URL.

Done: a database trigger normalises media and tags on every write; the
tool page hides an image that fails instead of printing its alt text;
`ingest-image` copies external images into our own bucket; and the
broken/missing set is being backfilled from each site's `apple-touch-icon`
and `og:image`. Real screenshots need a browser that can reach the web,
which this environment cannot do with TLS verification on.

## 5. Smaller findings

- **Google Fonts** — done 17 Sep. Inter is self-hosted via `@fontsource`
  (latin, four weights, ~24 KB each, `font-display: swap`) from `/assets`
  with immutable caching; the render-blocking stylesheet and both
  preconnects are gone.
- **`/og-image.png` is 182 KB.** A 1200×630 dark card should be under 60 KB.
  Re-export.
- **`<img alt>`**: checked across all `.tsx` with a multi-line parser. Every
  image has an `alt`; the two empty ones (a logo beside the tool's name, a
  decorative screenshot) are correct.
- **robots.txt, sitemap, canonicals, www→apex, JSON-LD types** were reviewed
  earlier in the same week and are in order. The sitemap deliberately omits
  ~12,000 expert and tutorial pages with no content of their own.
- **Tool `<title>`** is `Name — tagline` and can run past 60 characters. Google
  truncates; the name is always first. Acceptable.

## 6. What cannot be measured from here

**Google Search Console is not set up.** Everything above is what the site
sends; only Search Console shows what Google does with it — indexed pages,
impressions, the queries category pages start appearing for, and the
soft-404s that should now decline. Verify the domain, submit
`https://toolsnocode.com/sitemap.xml`, and read it weekly. It is the only
instrument for the next three months.
