-- Delisting: a tool page can be taken down without deleting the row.
--
-- Why a flag and not DELETE: the row keeps its events, boosts and history,
-- the change is reversible, and public reads are cut off in one place (RLS)
-- rather than in the ~20 queries spread across the SPA, the edge functions
-- and the Vercel head-injection layer. Anonymous and signed-in readers only
-- see rows where delisted_at IS NULL; the owner of a tool keeps seeing their
-- own row so they can fix it. /tools/<slug> for a delisted row becomes a 404
-- through the normal "row not found" path, which is what search engines need.
--
-- Service-role code paths do not go through RLS, so the sitemap and the
-- digest brief filter explicitly (see the edge functions and the function
-- below).

ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS delisted_at timestamptz,
  ADD COLUMN IF NOT EXISTS delist_reason text;

CREATE INDEX IF NOT EXISTS tools_delisted_at_idx ON public.tools (delisted_at) WHERE delisted_at IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can view tools" ON public.tools;
CREATE POLICY "Anyone can view listed tools"
  ON public.tools FOR SELECT
  USING (delisted_at IS NULL OR user_id = (SELECT auth.uid()));

-- The digest brief runs as SECURITY DEFINER and must not count or feature
-- delisted rows.
CREATE OR REPLACE FUNCTION public.weekly_digest_brief(p_days integer DEFAULT 7)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH period AS (
  SELECT now() - make_interval(days => p_days) AS since
),
fresh AS (
  SELECT t.id, t.name, t.slug, t.tagline, t.pricing, t.created_at,
         c.name AS category, c.slug AS category_slug,
         nullif(trim(t.logo_url), '') IS NOT NULL AS has_logo,
         length(trim(coalesce(t.tagline, ''))) >= 20
           AND lower(trim(t.tagline)) IS DISTINCT FROM lower(trim(coalesce(c.name, ''))) AS presentable,
         t.description
  FROM public.tools t
  LEFT JOIN public.categories c ON c.id = t.category_id, period
  WHERE t.created_at >= period.since AND t.delisted_at IS NULL
),
by_category AS (
  SELECT category, category_slug, count(*) AS n
  FROM fresh GROUP BY 1, 2 ORDER BY n DESC
),
category_baseline AS (
  SELECT c.slug, count(t.id) AS total
  FROM public.categories c LEFT JOIN public.tools t ON t.category_id = c.id AND t.delisted_at IS NULL
  GROUP BY c.slug
),
monthly AS (
  SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, count(*) AS n
  FROM public.tools
  WHERE created_at >= date_trunc('month', now()) - interval '5 months' AND delisted_at IS NULL
  GROUP BY 1 ORDER BY 1 DESC
),
attention AS (
  -- Solo aparece cuando hay comportamiento real que contar. Con menos de 10
  -- visitas en 30 días esto no es "lo que la gente abre", es ruido.
  SELECT name, slug, views_30d, clicks_30d
  FROM public.tools
  WHERE views_30d >= 10 AND delisted_at IS NULL
  ORDER BY views_30d DESC LIMIT 8
),
previous AS (
  SELECT slug, title, published_at::date AS published
  FROM public.news
  WHERE source = 'ToolsNoCode'
  ORDER BY published_at DESC LIMIT 6
)
SELECT jsonb_build_object(
  'generated_at', now(),
  'period_days', p_days,
  'totals', jsonb_build_object(
     'tools', (SELECT count(*) FROM public.tools WHERE delisted_at IS NULL),
     'new_this_period', (SELECT count(*) FROM fresh),
     'presentable_this_period', (SELECT count(*) FROM fresh WHERE has_logo AND presentable),
     'events_recorded_30d', (SELECT count(*) FROM public.tool_events WHERE created_at >= now() - interval '30 days')
  ),
  'monthly_intake', (SELECT jsonb_agg(jsonb_build_object('month', month, 'tools', n)) FROM monthly),
  'new_tools', (
     SELECT jsonb_agg(jsonb_build_object(
       'name', name, 'slug', slug, 'tagline', tagline, 'pricing', pricing,
       'category', category, 'category_slug', category_slug,
       'added', created_at::date, 'has_logo', has_logo, 'presentable', presentable,
       'description', left(description, 400)
     ) ORDER BY created_at DESC)
     FROM fresh
  ),
  'new_by_category', (
     SELECT jsonb_agg(jsonb_build_object(
       'category', b.category, 'slug', b.category_slug, 'new', b.n,
       'category_total', cb.total,
       'share_of_intake_pct', round(100.0 * b.n / nullif((SELECT count(*) FROM fresh), 0), 1),
       'share_of_directory_pct', round(100.0 * cb.total / nullif((SELECT count(*) FROM public.tools WHERE delisted_at IS NULL), 0), 1)
     ) ORDER BY b.n DESC)
     FROM by_category b LEFT JOIN category_baseline cb ON cb.slug = b.category_slug
  ),
  'pricing_split', (SELECT jsonb_object_agg(pricing, n) FROM (SELECT pricing, count(*) AS n FROM fresh GROUP BY 1) p),
  'most_viewed_30d', (SELECT coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb) FROM attention a),
  'previous_editions', (SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) FROM previous p)
);
$function$
;
