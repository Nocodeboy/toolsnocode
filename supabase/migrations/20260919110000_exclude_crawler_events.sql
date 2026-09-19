/*
  # Excluir del recuento los eventos del rastreo previo al filtro

  `track-event` empezó a descartar rastreadores el 16 de septiembre de 2026.
  Lo registrado hasta ese día tiene una firma inconfundible: 1.764 eventos
  repartidos entre casi el mismo número de herramientas distintas (1,05
  eventos por ficha, del 13 al 16), frente a 4-23 diarios desde entonces. Eso
  no es gente leyendo fichas, es alguien recorriendo el catálogo en orden.

  Esos eventos son el 98% de la tabla y alimentan tres cosas visibles:
  `trending_score` (la sección "Trending" de la portada), `views_30d` y
  `clicks_30d` (las estadísticas que ve el dueño de una ficha en su propia
  página) y el brief del boletín. Con ellos dentro, la portada destaca lo que
  un robot visitó primero y a un maker se le enseñan visitas que nunca
  ocurrieron. Eso último importa más que el ranking: es el número con el que
  se le pide dinero.

  No se borran. Se marcan, para que la decisión sea reversible y quede dicho
  por qué. `refresh_tool_trending()` pasa a ignorar lo marcado.
*/

ALTER TABLE public.tool_events
  ADD COLUMN IF NOT EXISTS excluded_at timestamptz,
  ADD COLUMN IF NOT EXISTS excluded_reason text;

CREATE INDEX IF NOT EXISTS tool_events_counted_idx
  ON public.tool_events (tool_id, created_at)
  WHERE excluded_at IS NULL;

UPDATE public.tool_events
SET excluded_at = now(),
    excluded_reason = 'sequential crawl recorded before the crawler filter shipped on 2026-09-16'
WHERE created_at < '2026-09-17'::date
  AND excluded_at IS NULL;

CREATE OR REPLACE FUNCTION public.refresh_tool_trending()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH agg AS (
    SELECT
      tool_id,
      count(*) FILTER (WHERE event_type = 'detail_view')                                               AS views_30d,
      count(*) FILTER (WHERE event_type = 'outbound_click')                                            AS clicks_30d,
      count(*) FILTER (WHERE event_type = 'detail_view'    AND created_at > now() - interval '7 days') AS views_7d,
      count(*) FILTER (WHERE event_type = 'outbound_click' AND created_at > now() - interval '7 days') AS clicks_7d
    FROM public.tool_events
    WHERE created_at > now() - interval '30 days'
      AND excluded_at IS NULL
    GROUP BY tool_id
  )
  UPDATE public.tools t
  SET
    views_30d  = COALESCE(a.views_30d, 0),
    clicks_30d = COALESCE(a.clicks_30d, 0),
    trending_score = CASE
      WHEN COALESCE(a.views_30d, 0) + COALESCE(a.clicks_30d, 0) < 5 THEN 0
      ELSE (COALESCE(a.views_7d, 0) + COALESCE(a.clicks_7d, 0) * 5) * 2
         + ((COALESCE(a.views_30d, 0) - COALESCE(a.views_7d, 0))
            + (COALESCE(a.clicks_30d, 0) - COALESCE(a.clicks_7d, 0)) * 5)
    END
  FROM public.tools src
  LEFT JOIN agg a ON a.tool_id = src.id
  WHERE t.id = src.id;
$function$;

SELECT public.refresh_tool_trending();
