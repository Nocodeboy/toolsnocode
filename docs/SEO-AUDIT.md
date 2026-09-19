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

Ninth pass (161–171 characters, 184 rows): 175 sites answered, **135
rewritten and live**, 32 null.

Tenth pass (171–183 characters, 184 rows): 176 sites answered, **147
rewritten and live**, 26 null. Eleventh pass (183–199 characters, 180
rows): 174 sites answered, **145 rewritten and live**, 24 null.

**Result after twelve passes: 1,429 tool pages rewritten**, average
description length 228 → 672 characters, and 2,361 of 3,098 tools (76%)
now carry a description of 200 characters or more, up from 31% on 16
September. The pass set is exhausted: every page under 200 characters
with a reachable website has been attempted. The 737 still under 200 are
414 delist candidates, 308 whose site was bot-blocked or too thin to write
from, and 15 with no website on file — see the closing section of
[DELIST-CANDIDATES.md](./DELIST-CANDIDATES.md). Same pipeline throughout,
~10 minutes per 180-row batch; from pass seven the writers ran on a
smaller model with a stricter prompt (null when the site is blocked or
empty, pricing evidence must be a literal quote) and a manual pass over
every number and proper noun before applying. The passes also surfaced
152 listings whose product has been renamed, acquired or shut down, 8
hijacked domains, 2 stored taglines that are gambling spam and 2 listings
that now link to adult content. **On 18–19 September 213 of them were
delisted** (hijacked, renamed, acquired, shut down, not a tool); the
listed directory is now 2,887 tools, 82.3% of them with a description of 200
characters or more. The "unreachable" group was re-fetched and held back:
27 answer today and most of the rest fail only at this environment's proxy.

The same site fetch was used to reconcile the `pricing` field: **441 rows
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

## 7. News and blog (18 September)

What `news` actually held on 18 September: 21 rows. Twenty were
paraphrases of TechCrunch, The Verge and Ars Technica pieces from one week
in March 2026, written by the (since unscheduled) daily news cron, with
titles containing raw HTML entities and slugs like
`amazon8217s-trainium-lab…-plf98`. One was the weekly digest. Paraphrased
third-party news is not an asset for search: it is dated, derivative and
competes with the originals it links to. The entities in titles were
decoded in place; the slugs were left alone to keep the URLs stable.

The opportunity is the opposite kind of content: pieces written from data
only this directory has. Done today:

- **`/news` is server-rendered** through the same edge layer as tool and
  category pages: title, description, CollectionPage/ItemList JSON-LD and a
  crawlable list of the latest 20 pieces. Before, it was the generic SPA
  shell.
- **RSS at `/feed.xml`** (edge function, 50 latest items, advertised with
  `<link rel="alternate">` in the document head). New pieces are
  discoverable the day they are published instead of on the next sitemap
  crawl.
- **Our own pieces carry `Article` schema**; third-party summaries keep
  `NewsArticle`.
- **Two data stories published**, both validated by the digest endpoint
  (every internal link exists, at least four tool links each):
  [AI tool churn: 2,000 sites checked, one listing in ten gone](https://toolsnocode.com/news/ai-tool-churn-2000-websites-checked-2026-09)
  and
  [Half the AI tools that called themselves freemium were not](https://toolsnocode.com/news/freemium-ai-tools-pricing-reality-2026-09).
  Every number in them comes from the delisting and pricing passes
  documented above.

What to keep doing: one data story a month from the directory (intake by
category, pricing shifts, who is acquiring whom, what claimed listings do
differently), plus the Monday digest. Each piece should link to at least
four listed tools and two categories, which the publish endpoint enforces.
The twenty March paraphrases are a product decision: they add nothing and
could be delisted the same way tools were, but they are harmless enough to
leave while the section fills with original work.

## 8. Homepage, tools hub and pricing pages (19 September)

- **`/` and `/tools` are server-rendered.** They were the two most-linked
  pages and returned a 3 KB shell with a generic title to anything without
  JavaScript. Vercel serves an existing file before it applies rewrites, so
  the SPA shell is now built as `app.html`; `/` reaches the edge layer and
  answers 9 KB with the live tool count in the title, the four homepage
  lists as links and all 33 categories with counts.
- **Pricing-filtered category pages** at `/categories/:slug/:pricing`
  (free, freemium, paid, enterprise). 120 variants exist; 77 hold at least
  eight tools and are indexable and in the sitemap, the rest work but carry
  `noindex`. Each states what the label means (the labels were checked
  against every tool's own site in September), shows pricing pills with
  counts, and links back to the category. They exist because "free AI
  video tools" is a buying-intent query the mixed category page could not
  answer honestly until the pricing pass.
- `robots.txt` now names the sitemap.

## 9. Tool pages as a mesh, and honest analytics (19 September)

- **Tool pages render their full description and up to six alternatives**
  from the same category, with `ItemList` schema. A listing used to be a
  dead end for a crawler without JavaScript: one clipped paragraph and a
  category link. It is now 9 KB with six internal links, which is what
  turns 2,887 leaves into a mesh. With the pricing variants added the day
  before, every listing now links to six siblings, its category and its
  pricing page.
- **The analytics were 98% crawler.** 1,764 of 1,807 recorded events were a
  sequential crawl from before the user-agent filter shipped on 16
  September. They are now marked as excluded and `refresh_tool_trending()`
  ignores them. Real numbers for the last 30 days: 40 views across 29
  listings and 3 outbound clicks. The homepage "Trending" row now needs at
  least three qualifying tools before it renders, so it stays hidden until
  there is real behaviour to show.
- A check of category editorial copy found all 33 categories already
  covered; no gap there.
- **Project pages are server-rendered too.** 63 showcase pages (525-character
  average description, a screenshot, the stack linked to real listings) were
  in the sitemap and served as the bare shell. They now carry CreativeWork
  schema and link every tool in their stack, adding 78 internal links into
  the catalogue. The 23 under 200 characters are noindex and out of the
  sitemap, which took the advertised projects from 63 to 40.
- Images are already WebP and between 1 and 45 KB, so there is nothing to
  win by resizing them.

### Verified in production, 19 September

A sample of 35 sitemap URLs across every page shape returns 200, with the
SEO layer injecting on every route that has one and no fallbacks. A missing
tool, news, category, pricing variant or project answers a real 404.

### Open, and not a code problem

The homepage has one boosted listing and **zero editor's picks**: no row in
the directory carries `is_featured` without also being boosted. With the
crawler events excluded there is also not enough behaviour to fill a
Trending row. So the only curation the homepage shows today is one paid
placement and "Recently added". Picking editor's picks is an editorial call,
not something to derive from the data, and it is the cheapest remaining
improvement to the page with the most inbound links.
