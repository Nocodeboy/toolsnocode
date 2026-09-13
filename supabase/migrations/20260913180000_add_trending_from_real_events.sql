/*
  # Trending basado en comportamiento real, no en datos sembrados

  Hasta ahora el orden de las listas salía de tres señales que no miden nada:

    - `upvotes`: 60 tools con valores sembrados el 2026-03-08 (Canva 19.800,
      Figma 16.400); las otras 3.015 a cero. Ordenar por esto significa
      "primero las 60 filas de ejemplo, después todo lo real en orden
      arbitrario" — una herramienta recién subida por un maker aparece
      estructuralmente la última.
    - `is_trending`: 188 flags puestos el mismo día y nunca recalculados.
    - `rating`: 0 de 200 tools de makers tiene valor.

  Desde hoy existe `tool_events` con visitas y clics salientes reales. Estas
  columnas resumen esa señal para que PostgREST pueda ordenar por un campo
  indexado, sin exponer los eventos individuales (la tabla sigue sin policies).

  ## El peso de cada señal

  Un clic saliente vale 5 veces una visita: es intención real, y además es
  exactamente el entregable que vende el plan Boost. Lo ocurrido en los últimos
  7 días cuenta el doble que el resto del mes, para que el ranking se mueva.

  Se exige un mínimo de 5 eventos para puntuar: con poco tráfico, sin ese
  umbral una herramienta con un solo clic de suerte encabezaría la lista, que
  es justo el tipo de ranking falso que esto viene a sustituir.
*/

ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS views_30d integer NOT NULL DEFAULT 0;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS clicks_30d integer NOT NULL DEFAULT 0;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS trending_score numeric NOT NULL DEFAULT 0;

-- Índice parcial: solo interesan las que puntúan, que serán una minoría.
CREATE INDEX IF NOT EXISTS idx_tools_trending_score
  ON public.tools (trending_score DESC)
  WHERE trending_score > 0;

CREATE OR REPLACE FUNCTION public.refresh_tool_trending()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      tool_id,
      count(*) FILTER (WHERE event_type = 'detail_view')                                               AS views_30d,
      count(*) FILTER (WHERE event_type = 'outbound_click')                                            AS clicks_30d,
      count(*) FILTER (WHERE event_type = 'detail_view'    AND created_at > now() - interval '7 days') AS views_7d,
      count(*) FILTER (WHERE event_type = 'outbound_click' AND created_at > now() - interval '7 days') AS clicks_7d
    FROM public.tool_events
    WHERE created_at > now() - interval '30 days'
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
$$;

COMMENT ON FUNCTION public.refresh_tool_trending() IS
  'Recalcula views_30d, clicks_30d y trending_score de tools a partir de tool_events.';

-- Una función SECURITY DEFINER es ejecutable por cualquiera salvo que se
-- revoque: sin esto, cualquiera con la anon key podría dispararla por RPC en
-- bucle y forzar un UPDATE de las 3.075 filas una y otra vez.
--
-- Revocar solo de PUBLIC no basta: Supabase concede EXECUTE a `anon` y
-- `authenticated` de forma explícita mediante privilegios por defecto del
-- esquema, así que hay que nombrarlos.
REVOKE EXECUTE ON FUNCTION public.refresh_tool_trending() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_tool_trending() TO service_role;

-- Cada hora, en SQL puro: sin secretos, sin HTTP, sin nada que pueda fallar en
-- silencio como le pasó al cron de noticias.
SELECT cron.unschedule('refresh-tool-trending')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-tool-trending');

SELECT cron.schedule(
  'refresh-tool-trending',
  '7 * * * *',
  $$ SELECT public.refresh_tool_trending(); $$
);
