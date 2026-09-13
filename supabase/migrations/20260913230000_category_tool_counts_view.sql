/*
  # Recuento de herramientas por categoría

  La página índice de categorías necesita 33 recuentos. Sin esto la opción era
  lanzar 33 peticiones `HEAD count=exact` desde el navegador, una por categoría:
  33 round-trips para pintar una rejilla.

  `security_invoker = true` es deliberado. Una vista en Supabase se ejecuta por
  defecto con los permisos de quien la creó (postgres), lo que salta la RLS de
  las tablas de debajo — el aviso "security definer view" del linter. Con
  invoker se aplica la política "Anyone can view tools", que es pública para
  SELECT: el recuento sale igual y la vista no se convierte en un agujero por
  el que leer filas que la RLS tapa.
*/

CREATE OR REPLACE VIEW public.category_tool_counts
WITH (security_invoker = true) AS
SELECT
  c.id   AS category_id,
  c.slug AS slug,
  count(t.id)::int AS tool_count
FROM public.categories c
LEFT JOIN public.tools t ON t.category_id = c.id
GROUP BY c.id, c.slug;

COMMENT ON VIEW public.category_tool_counts IS
  'Herramientas por categoría. Alimenta /categories sin 33 peticiones.';

GRANT SELECT ON public.category_tool_counts TO anon, authenticated;
