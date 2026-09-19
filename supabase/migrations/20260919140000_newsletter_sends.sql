/*
  # Registro de envíos del boletín

  Una fila por edición y suscriptor. Sirve para dos cosas, y las dos importan
  más que el histórico:

  1. **Que nadie reciba la misma edición dos veces.** El envío va por tandas de
     cien y puede cortarse a la mitad; al reintentarlo, los que ya tienen fila
     quedan fuera. La clave única es la garantía, no el `if` del código.
  2. **Saber qué se envió de verdad.** El identificador que devuelve Resend
     queda aquí, que es por donde se rastrea una entrega concreta.

  Sin políticas de RLS, como la tabla de suscriptores: solo la clave de
  servicio.
*/

CREATE TABLE IF NOT EXISTS public.newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  email_id text,
  error text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_sends_edition_subscriber_key
  ON public.newsletter_sends (news_id, subscriber_id);

CREATE INDEX IF NOT EXISTS newsletter_sends_news_idx
  ON public.newsletter_sends (news_id, sent_at DESC);

ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.newsletter_sends IS
  'Qué edición ha recibido cada suscriptor. El índice único (news_id, subscriber_id) es lo que impide un envío duplicado cuando una tanda se reintenta.';
