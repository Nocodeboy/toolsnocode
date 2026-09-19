/**
 * Shared CORS / origin allow-list for every edge function.
 *
 * The list lives in the `ALLOWED_ORIGINS` secret (comma-separated) so the
 * frontend can move between hosts — Bolt, Vercel preview, custom domain —
 * without editing and redeploying each function:
 *
 *   supabase secrets set ALLOWED_ORIGINS="https://example.com,https://toolsnocode.vercel.app"
 *
 * Matching is exact, by origin. Vercel preview URLs are per-branch and
 * per-deployment, so add the specific branch alias you want to test against
 * rather than a wildcard: these origins also gate the Stripe checkout
 * redirect URLs, and a wildcard there is an open redirect.
 *
 * The first entry is the fallback used when a request carries an origin that
 * is not on the list — keep the canonical production domain first.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  "https://example.com",
  "http://localhost:5173",
  "http://localhost:4173",
];

export function getAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;

  const parsed = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
}

export function resolveOrigin(requestOrigin?: string | null): string {
  const allowed = getAllowedOrigins();
  return requestOrigin && allowed.includes(requestOrigin) ? requestOrigin : allowed[0];
}

export function getCorsHeaders(
  req: Request | string | null | undefined,
  methods = "POST, OPTIONS",
): Record<string, string> {
  const requestOrigin = typeof req === "string" || req == null ? req : req.headers.get("Origin");

  return {
    "Access-Control-Allow-Origin": resolveOrigin(requestOrigin),
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };
}

/** True when `url` points at one of the allowed origins — used to gate Stripe redirect URLs. */
export function isAllowedRedirectUrl(url: string): boolean {
  try {
    return getAllowedOrigins().includes(new URL(url).origin);
  } catch {
    return false;
  }
}
