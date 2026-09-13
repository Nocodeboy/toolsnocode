/*
  # Boletín semanal, versión editorial

  La v1 publicaba un volcado de base de datos: título sin fecha ni búsqueda
  real detrás, sin entradilla, sin imagen, y listando las 12 altas más
  recientes fueran lo que fueran — incluidas fichas sin logo ni descripción.

  Cambios:
    - El título lleva la fecha y la categoría dominante. 52 entregas al año con
      títulos casi idénticos compiten entre sí en Google; la fecha y el tema las
      separan.
    - Entradilla que dice de qué va la semana, en vez de empezar con una lista.
    - Curación: una ficha entra si tiene logo y una tagline de al menos 20
      caracteres que no sea el nombre de su propia categoría. En la primera
      entrega se coló "Song Finder — Audio & Music", que no dice nada.
    - Imagen social, para que la entrega se pueda compartir.

  Lo que una plantilla SQL no puede hacer, y conviene tener presente: distinguir
  una descripción real de un eslogan de marketing. "Stop Surviving. Start
  Thriving." pasa todos los filtros. Para eso hace falta un paso humano.
*/

CREATE OR REPLACE FUNCTION public.publish_weekly_digest()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  period_start  timestamptz := date_trunc('day', now()) - interval '7 days';
  digest_slug   text        := 'new-tools-week-' || to_char(now(), 'YYYY-MM-DD');
  week_label    text        := to_char(now(), 'FMMonth FMDD, YYYY');
  new_count     integer;
  shown_count   integer;
  lead_category text;
  cat_summary   text;
  highlights    text;
  most_viewed   text;
  body          text;
BEGIN
  SELECT count(*) INTO new_count
  FROM public.tools
  WHERE created_at >= period_start;

  IF new_count < 5 THEN
    RAISE NOTICE 'weekly digest skipped: only % new tools', new_count;
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.news WHERE slug = digest_slug) THEN
    RETURN NULL;
  END IF;

  SELECT string_agg(label, ', ' ORDER BY n DESC), max(name_first)
  INTO cat_summary, lead_category
  FROM (
    SELECT c.name || ' (' || count(*) || ')' AS label,
           count(*) AS n,
           first_value(c.name) OVER (ORDER BY count(*) DESC) AS name_first
    FROM public.tools t
    JOIN public.categories c ON c.id = t.category_id
    WHERE t.created_at >= period_start
    GROUP BY c.name
    ORDER BY count(*) DESC
    LIMIT 3
  ) top_cats;

  -- Curación. Sin logo o sin tagline no hay nada que enseñar; pero además se
  -- descartan dos casos que se colaron en la primera entrega: taglines de menos
  -- de 20 caracteres, y las que solo repiten el nombre de su categoría
  -- ("Song Finder — Audio & Music", que no dice absolutamente nada).
  WITH picked AS (
    SELECT t.name, t.slug, t.tagline
    FROM public.tools t
    LEFT JOIN public.categories c ON c.id = t.category_id
    WHERE t.created_at >= period_start
      AND nullif(trim(t.logo_url), '') IS NOT NULL
      AND length(trim(coalesce(t.tagline, ''))) >= 20
      AND lower(trim(t.tagline)) IS DISTINCT FROM lower(trim(coalesce(c.name, '')))
    ORDER BY t.created_at DESC
    LIMIT 12
  )
  SELECT string_agg('- [' || name || '](/tools/' || slug || ') — ' || tagline, E'\n'),
         count(*)
  INTO highlights, shown_count
  FROM picked;

  IF shown_count IS NULL OR shown_count < 3 THEN
    RAISE NOTICE 'weekly digest skipped: only % presentable tools', coalesce(shown_count, 0);
    RETURN NULL;
  END IF;

  SELECT string_agg('- [' || name || '](/tools/' || slug || ') — ' || views_30d || ' views', E'\n' ORDER BY views_30d DESC)
  INTO most_viewed
  FROM (
    SELECT name, slug, views_30d
    FROM public.tools
    WHERE views_30d >= 10
    ORDER BY views_30d DESC
    LIMIT 5
  ) v
  HAVING count(*) >= 3;

  body :=
    'The directory grew by ' || new_count || ' tools in the week to ' || week_label || '.' ||
    CASE WHEN cat_summary IS NOT NULL
         THEN ' Most of them landed in ' || cat_summary || '.'
         ELSE '' END ||
    ' Below are ' || shown_count || ' worth a look, each with a line on what it actually does.' ||
    E'\n\n## This week''s additions\n\n' || highlights ||
    CASE WHEN most_viewed IS NOT NULL
         THEN E'\n\n## What people opened most\n\nThese are the pages visitors actually clicked into over the past month, not an editorial pick:\n\n' || most_viewed
         ELSE '' END ||
    E'\n\nEverything lives in the [tools directory](/tools). If yours is missing, [add it](/tools/new) — listings are free.';

  INSERT INTO public.news (title, slug, summary, content, url, source, category, tags, image_url, published_at, is_featured)
  VALUES (
    new_count || ' new AI and no-code tools — week of ' || week_label,
    digest_slug,
    new_count || ' tools joined the directory in the week to ' || week_label
      || COALESCE(', led by ' || lead_category, '') || '.',
    body,
    '',
    'ToolsNoCode',
    'No-Code Tools',
    ARRAY['new tools', 'weekly roundup', 'no-code', 'AI tools'],
    'https://toolsnocode.com/og-image.png',
    now(),
    false
  );

  RETURN digest_slug;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.publish_weekly_digest() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_weekly_digest() TO service_role;
