import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { safeFetch } from "../_shared/http-safe.ts";

import { getCorsHeaders as buildCorsHeaders } from "../_shared/cors.ts";

function getCorsHeaders(req: Request) {
  return buildCorsHeaders(req, "GET, POST, OPTIONS");
}

interface RSSItem {
  title: string;
  url: string;
  pubDate: string;
  description: string;
  source: string;
  category: string;
}

const RSS_SOURCES: Array<{ url: string; category: string; source: string }> = [
  { url: "https://techcrunch.com/feed/", source: "TechCrunch", category: "AI Models" },
  { url: "https://www.theverge.com/rss/index.xml", source: "The Verge", category: "AI Models" },
  { url: "https://feeds.arstechnica.com/arstechnica/technology-lab", source: "Ars Technica", category: "Research" },
  { url: "https://venturebeat.com/feed/", source: "VentureBeat", category: "Industry" },
  { url: "https://feeds.feedburner.com/oreilly/radar/atom", source: "O'Reilly Radar", category: "No-Code Tools" },
  { url: "https://www.wired.com/feed/rss", source: "Wired", category: "Policy" },
  { url: "https://rss.slashdot.org/Slashdot/slashAI", source: "Slashdot AI", category: "AI Models" },
  { url: "https://www.infoq.com/ai-ml-data-eng/articles.atom", source: "InfoQ", category: "Research" },
  { url: "https://www.testingcatalog.com/rss/", source: "Testing Catalog", category: "AI Models" },
];

const AI_KEYWORDS = [
  "ai", "artificial intelligence", "machine learning", "llm", "gpt", "claude",
  "gemini", "openai", "anthropic", "google ai", "microsoft ai", "no-code",
  "nocode", "low-code", "automation", "generative", "neural", "deep learning",
  "model", "chatgpt", "copilot", "midjourney", "stable diffusion", "make.com",
  "zapier", "bubble", "webflow", "airtable", "notion ai",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/-$/, "");
}

function isAIRelated(title: string, description: string): boolean {
  const combined = (title + " " + description).toLowerCase();
  return AI_KEYWORDS.some((kw) => combined.includes(kw));
}

function guessCategory(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();
  if (text.match(/regulat|policy|law|government|eu ai|act|ban|ethic/)) return "Policy";
  if (text.match(/research|paper|study|arxiv|benchmark|dataset|training/)) return "Research";
  if (text.match(/fund|invest|acqui|startup|billion|valuation|series/)) return "Industry";
  if (text.match(/no.?code|low.?code|nocode|bubble|webflow|zapier|make\.com|airtable|automation tool/)) return "No-Code Tools";
  return "AI Models";
}

function extractMetaTag(html: string, ...attrs: string[]): string | null {
  for (const attr of attrs) {
    const match =
      html.match(new RegExp(`<meta[^>]+${attr}[^>]+content=["']([^"']+)["']`, "i")) ??
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}`, "i"));
    if (match) return match[1];
  }
  return null;
}

function extractImage(html: string): string | null {
  const og = extractMetaTag(html, 'property="og:image"', "property='og:image'");
  if (og && og.startsWith("http")) return og;
  const tw = extractMetaTag(html, 'name="twitter:image"', "name='twitter:image'");
  if (tw && tw.startsWith("http")) return tw;
  return null;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

function extractMainContent(html: string): string {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) return stripTags(articleMatch[1]);
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) return stripTags(mainMatch[1]);
  return stripTags(html).slice(0, 5000);
}

async function fetchArticleData(url: string): Promise<{ image: string | null; rawContent: string }> {
  try {
    const res = await safeFetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ToolsNoCode/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res || !res.ok) return { image: null, rawContent: "" };
    const html = await res.text();
    return { image: extractImage(html), rawContent: extractMainContent(html) };
  } catch {
    return { image: null, rawContent: "" };
  }
}

async function parseRSSFeed(feedUrl: string): Promise<Array<{ title: string; url: string; pubDate: string; description: string }>> {
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ToolsNoCode/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: Array<{ title: string; url: string; pubDate: string; description: string }> = [];

    const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    for (const match of itemMatches) {
      const item = match[1];
      const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() ?? "";
      const link =
        item.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1]?.trim() ??
        item.match(/<guid[^>]*isPermaLink="true"[^>]*>([^<]+)<\/guid>/i)?.[1]?.trim() ??
        "";
      const pubDate = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1]?.trim() ?? new Date().toISOString();
      const desc =
        item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() ??
        item.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)?.[1]?.trim() ??
        "";

      if (title && link) {
        items.push({ title, url: link, pubDate, description: stripTags(desc).slice(0, 500) });
      }
    }

    const entryMatches = xml.matchAll(/<entry[^>]*>([\s\S]*?)<\/entry>/gi);
    for (const match of entryMatches) {
      const entry = match[1];
      const title = entry.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() ?? "";
      const link = entry.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
      const pubDate =
        entry.match(/<published[^>]*>(.*?)<\/published>/i)?.[1]?.trim() ??
        entry.match(/<updated[^>]*>(.*?)<\/updated>/i)?.[1]?.trim() ??
        new Date().toISOString();
      const desc =
        entry.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i)?.[1]?.trim() ??
        entry.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)?.[1]?.trim() ??
        "";

      if (title && link) {
        items.push({ title, url: link, pubDate, description: stripTags(desc).slice(0, 500) });
      }
    }

    return items.slice(0, 30);
  } catch {
    return [];
  }
}

async function rewriteWithOpenAI(
  title: string,
  summary: string,
  rawContent: string,
  category: string,
  apiKey: string
): Promise<{ rewrittenContent: string; tags: string[] }> {
  const prompt = `You are an editor for ToolsNoCode, a website about AI and no-code tools.
Rewrite the following news article in a clear, engaging, informative style for a tech-savvy but non-developer audience.

Title: ${title}
Category: ${category}
Summary: ${summary}
Raw content: ${rawContent.slice(0, 3000)}

Instructions:
- Write 3-5 solid paragraphs covering the key facts, context, and why it matters
- Do NOT use markdown headers, bullet points, or formatting — plain paragraphs only
- Be factual, concise, and professional
- Do not mention "ToolsNoCode" in the article body
- At the end, after a blank line, write exactly: TAGS: tag1, tag2, tag3, tag4, tag5
  (5 relevant short tags like: OpenAI, GPT-4o, multimodal, AI models, context window)

Write only the article text and the TAGS line, nothing else.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 900,
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenAI API error:", err);
    throw new Error("Content generation failed");
  }

  const data = await res.json();
  const text: string = data.choices[0].message.content.trim();

  const tagsMatch = text.match(/TAGS:\s*(.+)$/im);
  const tags = tagsMatch
    ? tagsMatch[1].split(",").map((t: string) => t.trim()).filter(Boolean).slice(0, 6)
    : [category];

  const content = text.replace(/TAGS:.*$/im, "").trim();
  return { rewrittenContent: content, tags };
}

const TRUSTED_SOURCES = new Set(["Testing Catalog"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: getCorsHeaders(req) });
  }

  try {
    const CRON_SECRET = Deno.env.get("CRON_SECRET");
    if (!CRON_SECRET) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if (req.headers.get("X-Cron-Secret") !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let body: { days_back?: number; max_items?: number } = {};
    try { body = await req.json(); } catch { /* no body */ }

    const daysBack = Math.min(Math.max(body.days_back ?? 3, 1), 30);
    const maxItems = Math.min(Math.max(body.max_items ?? 10, 1), 50);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: { saved: number; skipped: number; errors: string[]; feeds_parsed: number } = {
      saved: 0,
      skipped: 0,
      errors: [],
      feeds_parsed: 0,
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const allArticles: Array<RSSItem> = [];

    for (const feed of RSS_SOURCES) {
      const items = await parseRSSFeed(feed.url);
      if (items.length > 0) results.feeds_parsed++;

      for (const item of items) {
        if (!item.url || !item.title) continue;

        const pubDate = new Date(item.pubDate);
        if (isNaN(pubDate.getTime()) || pubDate < cutoffDate) continue;

        const category = guessCategory(item.title, item.description) || feed.category;

        const isTrusted = TRUSTED_SOURCES.has(feed.source);
        if (!isTrusted && !isAIRelated(item.title, item.description)) continue;

        allArticles.push({
          title: item.title,
          url: item.url,
          pubDate: item.pubDate,
          description: item.description,
          source: feed.source,
          category,
        });
      }
    }

    const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    const toProcess = unique.slice(0, maxItems);

    for (const item of toProcess) {
      try {
        const { data: existing } = await supabase
          .from("news")
          .select("id")
          .eq("url", item.url)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        const { image: scrapedImage, rawContent } = await fetchArticleData(item.url);
        const imageUrl = scrapedImage ?? null;

        const { rewrittenContent, tags } = await rewriteWithOpenAI(
          item.title,
          item.description,
          rawContent || item.description,
          item.category,
          OPENAI_API_KEY
        );

        const baseSlug = slugify(item.title);
        const uniqueSuffix = Date.now().toString(36).slice(-5);
        const slug = `${baseSlug}-${uniqueSuffix}`;

        const publishedAt = !isNaN(new Date(item.pubDate).getTime())
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString();

        const { error: insertError } = await supabase.from("news").insert({
          title: item.title,
          slug,
          summary: item.description,
          content: rewrittenContent,
          url: item.url,
          image_url: imageUrl,
          source: item.source,
          category: item.category,
          tags,
          published_at: publishedAt,
          is_featured: false,
        });

        if (insertError) {
          results.errors.push(`Insert error: ${insertError.message}`);
        } else {
          results.saved++;
        }

        await new Promise((r) => setTimeout(r, 600));
      } catch (e) {
        results.errors.push(`Processing error for "${item.title}": ${String(e)}`);
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("fetch-and-rewrite-news error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
