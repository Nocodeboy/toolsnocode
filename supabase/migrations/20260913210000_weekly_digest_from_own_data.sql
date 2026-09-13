/*
  # Boletín semanal generado desde los propios datos del directorio

  Sustituye al pipeline de noticias que reescribía titulares de TechCrunch y The
  Verge con OpenAI. Aquel enfoque tenía dos problemas de fondo:

    1. Competía contra TechCrunch por la noticia de TechCrunch. Contenido
       derivado que no iba a posicionar nunca, y no posicionó.
    2. Dependía de feeds RSS ajenos, de una clave de OpenAI y de secretos en
       Vault. Llevaba seis meses sin publicar nada y nadie se enteró, porque el
       cron estaba escrito para no quejarse.

  Esto es lo contrario: SQL puro sobre datos que solo tiene este directorio. No
  hay HTTP, no hay claves, no hay feeds que cambien de formato. Si falla, falla
  ruidosamente en `cron.job_run_details`.

  Cada entrega enlaza a las fichas que menciona, que es además el enlazado
  interno que le falta al sitio: hoy solo unas 24 herramientas son alcanzables
  con un enlace desde la home.

  ## Por qué semanal y no diario

  Entran unas 4 herramientas al día. Una entrega diaria serían cuatro líneas —
  exactamente el contenido fino que se acaba de sacar del índice. Semanal junta
  ~30 y da para un artículo de verdad.
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
  new_count     integer;
  cat_summary   text;
  highlights    text;
  most_viewed   text;
  body          text;
BEGIN
  SELECT count(*) INTO new_count
  FROM public.tools
  WHERE created_at >= period_start;

  -- Una entrega sin material es peor que ninguna entrega.
  IF new_count < 5 THEN
    RAISE NOTICE 'weekly digest skipped: only % new tools', new_count;
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.news WHERE slug = digest_slug) THEN
    RETURN NULL;
  END IF;

  SELECT string_agg(label, ', ' ORDER BY n DESC)
  INTO cat_summary
  FROM (
    SELECT c.name || ' (' || count(*) || ')' AS label, count(*) AS n
    FROM public.tools t
    JOIN public.categories c ON c.id = t.category_id
    WHERE t.created_at >= period_start
    GROUP BY c.name
    ORDER BY count(*) DESC
    LIMIT 3
  ) top_cats;

  -- Cada mención es un enlace real a la ficha: es el objetivo, no el adorno.
  SELECT string_agg(
           '- [' || t.name || '](/tools/' || t.slug || ')'
           || COALESCE(' — ' || nullif(trim(t.tagline), ''), ''),
           E'\n' ORDER BY t.created_at DESC
         )
  INTO highlights
  FROM (
    SELECT name, slug, tagline, created_at
    FROM public.tools
    WHERE created_at >= period_start
    ORDER BY created_at DESC
    LIMIT 12
  ) t;

  -- Solo aparece cuando hay comportamiento real que contar. Un umbral de 10
  -- visitas y al menos 3 herramientas: con 1 o 2 visitas esto no es "lo que la
  -- gente está abriendo", es ruido presentado como señal — el mismo vicio que
  -- tenían los upvotes sembrados que se acaban de retirar del sitio.
  SELECT string_agg('- [' || name || '](/tools/' || slug || ') — ' || views_30d || ' views',
                    E'\n' ORDER BY views_30d DESC)
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
    new_count || ' new tools joined the directory in the past week.' ||
    CASE WHEN cat_summary IS NOT NULL
         THEN ' The busiest categories were ' || cat_summary || '.'
         ELSE '' END ||
    E'\n\n## This week''s additions\n\n' || highlights ||
    CASE WHEN most_viewed IS NOT NULL
         THEN E'\n\n## What people are opening\n\n' || most_viewed
         ELSE '' END ||
    E'\n\nBrowse everything in the [tools directory](/tools), or [add your own](/tools/new) if it is missing.';

  INSERT INTO public.news (title, slug, summary, content, url, source, category, tags, published_at, is_featured)
  VALUES (
    new_count || ' new AI and no-code tools this week',
    digest_slug,
    new_count || ' tools joined the directory this week'
      || COALESCE(', led by ' || split_part(cat_summary, ',', 1), '') || '.',
    body,
    '',                       -- sin fuente externa: se escribe en casa
    'ToolsNoCode',
    'No-Code Tools',
    ARRAY['new tools', 'weekly', 'no-code', 'AI tools'],
    now(),
    false
  );

  RETURN digest_slug;
END;
$fn$;

COMMENT ON FUNCTION public.publish_weekly_digest() IS
  'Publica en `news` el resumen semanal de altas del directorio. Solo datos propios.';

-- SECURITY DEFINER es ejecutable por cualquiera salvo que se revoque, y en
-- Supabase `anon` y `authenticated` reciben EXECUTE por privilegios por defecto
-- del esquema: hay que nombrarlos, no basta con PUBLIC.
REVOKE EXECUTE ON FUNCTION public.publish_weekly_digest() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_weekly_digest() TO service_role;

SELECT cron.unschedule('publish-weekly-digest')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-weekly-digest');

-- Lunes a las 08:00 UTC.
SELECT cron.schedule(
  'publish-weekly-digest',
  '0 8 * * 1',
  $$ SELECT public.publish_weekly_digest(); $$
);
