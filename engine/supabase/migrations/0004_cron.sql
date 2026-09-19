/*
  # Tareas periódicas

  Dos, y las dos existen porque su ausencia costó dinero o credibilidad en el
  proyecto original:

  1. **Recalcular las señales.** Sin esto, "lo que más se está mirando" es un
     campo que nadie escribe y el listado enseña el orden de hace meses.

  2. **Caducar la colocación pagada.** Antes esto colgaba del webhook de
     Stripe: una colocación solo caducaba si otro cliente compraba en ese
     momento, así que había fichas destacadas con la suscripción vencida desde
     hacía medio año.

  Vigilar con:
    select jobname, status, return_message, start_time
    from cron.job_run_details order by start_time desc limit 20;

  El cron de noticias del proyecto original falló 150 veces seguidas durante
  cinco meses sin que nadie mirara esa tabla.

  Cuidado con `pg_net`: la extensión se instala en el esquema `extensions`,
  pero sus funciones viven en `net`. Escribir `extensions.net.http_post(...)`
  falla con "cross-database references are not implemented". Se escribe
  `net.http_post(...)`.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'refresh-listing-trending',
  '7 * * * *',
  $$ SELECT public.refresh_listing_trending(); $$
);

SELECT cron.schedule(
  'expire-stale-boosts',
  '15 3 * * *',
  $$
  UPDATE public.listings
  SET is_boosted = false
  WHERE is_boosted = true
    AND boost_expires_at IS NOT NULL
    AND boost_expires_at < now();
  $$
);
