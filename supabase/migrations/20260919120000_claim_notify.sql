/*
  # Avisar cuando entra una reclamación de ficha

  Una reclamación se insertaba en `claim_requests` y no la veía nadie: no hay
  panel de administración y nada enviaba correo, así que la única forma de
  enterarse era consultar la tabla a mano. La del 22 de marzo estuvo seis meses
  ahí.

  El disparador llama a la función `claim-notify`, que manda el correo con el
  contexto de la reclamación. La autenticación es el mismo patrón que el cron:
  un secreto guardado en Vault (`claims_notify_secret`) que tiene que coincidir
  con `CLAIMS_NOTIFY_SECRET` en la función. Si el secreto no está, el
  disparador no hace nada — un aviso que no se puede enviar no debe impedir que
  la reclamación se registre.

  `pg_net` se instala en el esquema `extensions`, pero sus funciones viven en
  el esquema `net`: escribir `extensions.net.http_post` lo interpreta Postgres
  como base de datos + esquema y falla con "cross-database references are not
  implemented". El cron de noticias que llevaba meses fallando usaba esa forma.

  `net.http_post` es asíncrono: encola la petición y vuelve. El INSERT no
  espera al correo ni falla con él. Las respuestas quedan en `net._http_response`.
*/

CREATE OR REPLACE FUNCTION public.notify_claim_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
  shared_secret text;
BEGIN
  SELECT decrypted_secret INTO shared_secret
  FROM vault.decrypted_secrets
  WHERE name = 'claims_notify_secret'
  LIMIT 1;

  IF shared_secret IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://exlupbihqexeeyxwmveh.supabase.co/functions/v1/claim-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Claims-Notify-Secret', shared_secret
    ),
    body := jsonb_build_object('id', NEW.id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS claim_requests_notify ON public.claim_requests;

CREATE TRIGGER claim_requests_notify
  AFTER INSERT ON public.claim_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_claim_request();
