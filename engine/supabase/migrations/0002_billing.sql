/*
  # Cobro con Stripe

  Lo mínimo para vender colocación en un directorio y que el dinero cobrado
  acabe siempre aplicado a algo. Las tablas son el reflejo local de Stripe;
  Stripe manda, esto sirve para poder enseñar el estado sin llamar a su API en
  cada carga de página.

  ## Lo que aprendió el proyecto original, a base de perder cobros

  - **`stripe_incidents`.** Un pago que no se puede aplicar (el cliente pagó
    por un enlace de pago sin tener cuenta en el sitio, el correo no coincide
    con ningún usuario, la ficha ya no existe) no puede desaparecer en un log.
    Queda aquí con su motivo y se resuelve solo cuando una sincronización
    posterior lo consigue. Tres clientes pagaron durante un año sin recibir
    nada porque esta tabla no existía.

  - **`stripe_webhook_events`.** Stripe reintenta cuando no recibe un 200 a
    tiempo. Sin registrar el `event_id` procesado, cada reintento vuelve a
    aplicar el efecto.

  - **La caducidad no cuelga del webhook.** Un impulso caduca por un cron
    (`0004_cron.sql`), no cuando otro cliente paga. Antes, una colocación
    pagada seguía activa meses después de vencer si nadie más compraba.
*/

CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id bigserial PRIMARY KEY,
  customer_id text NOT NULL UNIQUE,
  subscription_id text,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  status text NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.stripe_orders (
  id bigserial PRIMARY KEY,
  checkout_session_id text NOT NULL UNIQUE,
  payment_intent_id text,
  customer_id text,
  amount_subtotal bigint,
  amount_total bigint,
  currency text,
  payment_status text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.stripe_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text,
  subscription_id text,
  reason text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS stripe_incidents_open_idx
  ON public.stripe_incidents (created_at DESC) WHERE resolved_at IS NULL;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Las escribe el webhook con clave de servicio. Lo único que el usuario puede
-- leer es su propia suscripción, y a través de una vista.
CREATE OR REPLACE VIEW public.my_subscription
WITH (security_invoker = true) AS
  SELECT s.customer_id, s.subscription_id, s.status, s.price_id,
         s.current_period_start, s.current_period_end, s.cancel_at_period_end,
         s.payment_method_brand, s.payment_method_last4
  FROM public.stripe_subscriptions s
  JOIN public.stripe_customers c ON c.customer_id = s.customer_id
  WHERE c.user_id = auth.uid() AND c.deleted_at IS NULL AND s.deleted_at IS NULL;

CREATE POLICY "users read own customer row" ON public.stripe_customers
  FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "users read own subscription" ON public.stripe_subscriptions
  FOR SELECT TO authenticated USING (
    deleted_at IS NULL AND customer_id IN (
      SELECT customer_id FROM public.stripe_customers
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );
