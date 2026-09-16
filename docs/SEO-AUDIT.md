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

## 3. Thin content — open

| | Tools |
|---|---:|
| Total indexed | 3,094 |
| Description under 200 characters | 2,150 (69%) |
| Description under 80 characters | 376 (12%) |
| Median description | ~228 characters |

Seven in ten tool pages are a name, a tagline and two sentences. The head
injection makes each one *correct*; it does not make it *substantial*.

Options, in order of honesty:

1. **Deindex the 376 under 80 characters** the way experts and tutorials were
   deindexed (sitemap exclusion + `noindex` from the edge function when
   `length(description) < 80`). Same reasoning: pages with nothing to say
   drag the domain, and they stay navigable.
2. **Let owners fix their own.** The owner stats card on the tool page already
   exists; a line there — "Your description is 64 characters. Pages under 200
   rarely rank." — costs nothing and targets the only people who can write
   it well.
3. Generating descriptions is off the table: no external AI APIs, by
   decision.

Recommendation: 1 and 2 together.

## 4. Smaller findings

- **Google Fonts** (`Inter`, 4 weights) load render-blocking from
  `fonts.googleapis.com`. Self-hosting the two weights actually used, or
  `font-display: swap` plus a system-font first paint, removes a third-party
  round trip from every page. Low effort, measurable on mobile.
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

## 5. What cannot be measured from here

**Google Search Console is not set up.** Everything above is what the site
sends; only Search Console shows what Google does with it — indexed pages,
impressions, the queries category pages start appearing for, and the
soft-404s that should now decline. Verify the domain, submit
`https://toolsnocode.com/sitemap.xml`, and read it weekly. It is the only
instrument for the next three months.
