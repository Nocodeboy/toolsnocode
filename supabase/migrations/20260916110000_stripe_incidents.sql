/*
  # Incidencias de pago que no pueden morir en un console.error

  Un cliente pagó un Boost anual el 18 de junio de 2026 y no lo recibió. El
  webhook lo supo — escribió "No user found for customer" en el log de la
  función — y nadie lo leyó en tres meses, porque nadie lee logs de funciones
  que no fallan.

  Esta tabla es el sitio donde ese mensaje tiene que ir. Cada camino del
  webhook que decide "no puedo entregar esto" escribe una fila, y una fila en
  una tabla se consulta, se cuenta y se resuelve. Un log no.

  Solo escribe `service_role`; RLS sin políticas.
*/

CREATE TABLE IF NOT EXISTS public.stripe_incidents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     text NOT NULL,
  subscription_id text,
  reason          text NOT NULL,
  detail          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);

CREATE INDEX IF NOT EXISTS stripe_incidents_open_idx
  ON public.stripe_incidents (created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.stripe_incidents ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.stripe_incidents IS
  'Pagos que el webhook no pudo convertir en un Boost. Abiertas = resolved_at IS NULL.';
