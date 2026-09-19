/*
  # Recuento de herramientas por categoría y modelo de precio

  Alimenta las páginas `/categories/:slug/:pricing` (free, freemium, paid,
  enterprise): las pastillas con recuento en la página de categoría, el
  umbral de indexación (una variante se anuncia en el sitemap con 8 o más
  herramientas) y el propio sitemap.

  Las dos vistas excluyen las filas dadas de baja de forma explícita. Con
  `security_invoker` la RLS ya las oculta a `anon`, pero el sitemap lee con la
  clave de servicio, que no pasa por RLS, y no debe contar lo que no publica.
*/

CREATE OR REPLACE VIEW public.category_tool_counts
WITH (security_invoker = true) AS
SELECT
  c.id   AS category_id,
  c.slug AS slug,
  count(t.id)::int AS tool_count
FROM public.categories c
LEFT JOIN public.tools t ON t.category_id = c.id AND t.delisted_at IS NULL
GROUP BY c.id, c.slug;

CREATE OR REPLACE VIEW public.category_pricing_counts
WITH (security_invoker = true) AS
SELECT
  c.id   AS category_id,
  c.slug AS slug,
  t.pricing,
  count(t.id)::int AS tool_count
FROM public.categories c
JOIN public.tools t ON t.category_id = c.id AND t.delisted_at IS NULL
WHERE t.pricing IN ('free', 'freemium', 'paid', 'enterprise')
GROUP BY c.id, c.slug, t.pricing;

COMMENT ON VIEW public.category_pricing_counts IS
  'Herramientas por categoría y modelo de precio. Alimenta /categories/:slug/:pricing.';

GRANT SELECT ON public.category_pricing_counts TO anon, authenticated;
