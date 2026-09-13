/*
  # El ciclo de vida del Boost: tres cosas que rompen a un cliente de pago

  Nadie ha pagado todavía, así que nada de esto ha dado la cara. Son
  exactamente los fallos que se descubren con el primer cliente, que es el peor
  momento posible para descubrirlos.

  ## 1. Un fallo de cobro borraba el vídeo del cliente

  `enforce_tool_video_url_boost` existía por un motivo correcto: que un dueño
  sin Boost no pueda ponerse un vídeo saltándose la interfaz. Pero lo
  implementaba forzando `video_url := ''` en CADA update donde `is_boosted` es
  falso, no solo cuando alguien intenta ponerlo.

  El resultado: en cuanto el Boost se apaga — una tarjeta caducada, un 3DS sin
  confirmar, una renovación que Stripe recupera tres días después — el vídeo
  que subió el cliente desaparece de la base de datos. Cuando el cobro se
  recupera y el Boost vuelve, el vídeo no vuelve: ya no existe. El cliente paga
  otra vez por algo que tiene que volver a montar.

  Y la regla nunca hizo falta a nivel de dato: la ficha ya condiciona el vídeo
  a `is_boosted` al pintarlo. Basta con impedir que se CAMBIE sin Boost, que es
  lo que de verdad se quería evitar.

  ## 2. La caducidad dependía de que hubiera tráfico de webhooks

  `deactivateExpiredBoosts()` se llamaba desde el webhook de Stripe, en cada
  evento. Es decir: los Boosts caducados se apagan solo si algún OTRO cliente
  está pagando en ese momento. Con un único cliente, su Boost caduca el día que
  decida marcharse, no el día que le toca. Esto va a cron, que es donde vive el
  tiempo.

  ## 3. Un Boost sin fecha de caducidad no caducaba nunca

  `boost_expires_at IS NULL` no cumple `< now()`, así que la limpieza no lo veía.
  La barrida lo deja constar en el log en vez de apagarlo por su cuenta: puede
  ser una cortesía dada a mano, y apagar algo que alguien encendió a propósito
  no es trabajo de una tarea automática.
*/

-- ---------------------------------------------------------------------------
-- 1. El vídeo sobrevive a la caída del Boost
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_tool_video_url_boost()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF COALESCE(NEW.is_boosted, false) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Una herramienta nueva sin Boost no puede nacer con vídeo.
    NEW.video_url := '';
    RETURN NEW;
  END IF;

  -- Sin Boost el vídeo queda congelado: no se puede poner ni cambiar, pero el
  -- que ya estaba guardado no se toca. Lo que decide si se ve es `is_boosted`,
  -- y eso no ha cambiado.
  IF NEW.video_url IS DISTINCT FROM OLD.video_url THEN
    NEW.video_url := OLD.video_url;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_tool_video_url_boost() IS
  'Sin Boost el vídeo no se puede cambiar. Guardado sigue guardado: una renovación fallida no destruye lo que subió el cliente.';

-- ---------------------------------------------------------------------------
-- 2. La caducidad se mide con el reloj, no con el tráfico de Stripe
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_boosts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  expired integer;
  undated integer;
BEGIN
  UPDATE public.tools
  SET is_boosted = false,
      boost_expires_at = null,
      boost_plan = ''
  WHERE is_boosted = true
    AND boost_expires_at IS NOT NULL
    AND boost_expires_at < now();

  GET DIAGNOSTICS expired = ROW_COUNT;

  SELECT count(*) INTO undated
  FROM public.tools
  WHERE is_boosted = true AND boost_expires_at IS NULL;

  IF undated > 0 THEN
    -- Un Boost sin fecha es siempre una de dos cosas: una cortesía dada a mano
    -- o un webhook que no llegó. Ninguna de las dos la arregla un cron a
    -- ciegas, pero las dos merecen quedar escritas en algún sitio.
    RAISE NOTICE 'expire_stale_boosts: % boosted tool(s) have no boost_expires_at', undated;
  END IF;

  RETURN expired;
END;
$fn$;

COMMENT ON FUNCTION public.expire_stale_boosts() IS
  'Apaga los Boosts cuya fecha ya pasó. Diaria, independiente de que haya o no webhooks de Stripe.';

-- SECURITY DEFINER es ejecutable por cualquiera salvo que se revoque, y en
-- Supabase `anon` y `authenticated` reciben EXECUTE por privilegios por defecto
-- del esquema: hay que nombrarlos, no basta con PUBLIC.
REVOKE EXECUTE ON FUNCTION public.expire_stale_boosts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_boosts() TO service_role;

SELECT cron.unschedule('expire-stale-boosts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-boosts');

-- 03:15 UTC: lejos de la hora en punto, donde se amontona todo lo demás.
SELECT cron.schedule(
  'expire-stale-boosts',
  '15 3 * * *',
  $$ SELECT public.expire_stale_boosts(); $$
);

-- ---------------------------------------------------------------------------
-- 3. Retirar el cron de noticias que llevaba 150 ejecuciones fallando igual
-- ---------------------------------------------------------------------------

/*
  `daily-news-fetch` no ha publicado una sola noticia desde que se creó, el
  17 de abril. No porque los feeds cambiaran ni porque se acabara el crédito de
  OpenAI: porque la orden decía `extensions.net.http_post` y la función vive en
  el esquema `net`. Postgres respondía "cross-database references are not
  implemented" y pg_cron lo anotaba en `cron.job_run_details`, donde nadie
  miraba. 150 ejecuciones, 150 fallos, 0 aciertos.

  No se corrige el esquema porque el destino tampoco sigue en pie: la sección
  de noticias se reconstruye desde los datos propios del directorio, sin RSS
  ajenos ni clave de OpenAI.
*/
SELECT cron.unschedule('daily-news-fetch')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-news-fetch');
