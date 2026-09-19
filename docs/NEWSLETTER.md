# The weekly edition — how it is written

One edition a week, Monday morning UTC, on `/news`. Written from scratch every
time from that week's facts. This file is the whole brief for whoever writes it,
human or not.

## What it is for

Two things, in this order:

1. **A reader who builds things learns one true thing about the AI/no-code tool
   market that they could not have learned anywhere else.** The directory has a
   year of intake, real categories, and (from September 2026) real visit and
   click counts. Nobody else has that data. The edition is the place it becomes
   an observation.
2. **Internal links.** Every tool mentioned is linked to its page. Every category
   named is linked. This is the single largest source of links into the catalog.

## What it is not

- **Not a template.** The first version of this newsletter was a SQL function
  that wrote *"N new tools joined the directory this week. The busiest
  categories were X (a), Y (b)…"*. It was retired the day it was written.
  If two consecutive editions could swap their numbers and still read the same,
  the edition failed.
- **Not a press release.** No "exciting", no "game-changing", no "we're thrilled".
- **Not a ranking of what nobody looked at.** Below 10 views in 30 days a tool
  has not been "popular"; it has been indexed. Say nothing rather than that.

## The procedure

1. **Fetch the brief.** `GET /functions/v1/digest` with `X-Digest-Secret`. It
   returns the week's new tools (with a `presentable` flag), intake by category
   with each category's share of the directory, monthly intake, pricing split,
   the most-viewed tools when any clears the threshold, and the last editions.
2. **Read all of it before writing a word.** Look for the thing that is
   *disproportionate*: a category taking 20% of the week's intake when it holds
   3% of the directory; a cluster of tools solving the same problem that did not
   exist a year ago; a pricing shape that shifted. That is the thesis. If there
   is no thesis, the edition is shorter and says what came in — it does not
   invent one.
3. **Write it.** English. 600–1,000 words. Structure that has worked:
   - Open on the observation, not on the count.
   - One paragraph that says plainly what the data does *not* support ("four
     rows is four rows"). This is what makes the rest believable.
   - A short list of the week's arrivals worth a reader's time — only tools
     marked `presentable`, each with one sentence that says what it actually
     does, not its tagline.
   - Close with where to go next: the directory, a category page.
4. **Check every number against the brief.** Every figure in the text has to
   be in the JSON or computed from it in the text itself. The first hand-written
   edition had two wrong numbers in its first draft because they were written
   from memory. Do not write from memory.
5. **Dry run.** `POST` with `dry_run: true`. The endpoint verifies every
   internal link exists and every field has the right shape. Fix what it lists.
6. **Publish.** Same `POST` without `dry_run`. Report the URL.
7. **Send it.** `POST /functions/v1/newsletter-send` with the same
   `X-Digest-Secret`. Order: `{"test_to": "…"}` to read it once in a real
   inbox, then `{"dry_run": true}` to see how many it would reach, then `{}`.
   Without a `slug` it takes the edition just published. Nobody gets the same
   edition twice — `newsletter_sends` has a unique index on
   `(news_id, subscriber_id)` — so a send that failed halfway is safe to repeat.

Until September 2026 there was no seventh step: the edition was published on
the site and that was the whole distribution. The list exists now (double
opt-in, `newsletter_subscribers`), and an edition that is written and not sent
is the work without its readers.

## Style, briefly

- Short sentences. Concrete nouns. A number, then what it means.
- Link inline: `[MCPhq](/tools/mcphq)`, `[coding tools](/categories/coding)`.
- Say "this directory", not "we" or "our platform".
- When something is uncertain, say it is uncertain in the same sentence.
- The title is the thesis, not the count: *"Half the MCP tools in this
  directory arrived in the last 60 days"*, not *"24 new tools this week"*.

## What the edition may claim

Only what the brief contains. The brief is the edition's entire world. It has
no access to the web, other newsletters, or the tools' own sites, and it does
not need them — the point of the edition is the one dataset nobody else has.
