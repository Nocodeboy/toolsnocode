/*
  # Boletín con doble confirmación y registro de envíos

  Copiado tal cual del proyecto original porque ahí no hay nada que adaptar al
  nicho: una dirección entra como `pending` y no recibe nada hasta que alguien
  abre el enlace que llegó a ese buzón.

  Sin doble confirmación, cualquiera puede suscribir la dirección de otro, y
  esas quejas se pagan con la reputación del dominio de envío — que tarda
  semanas en construirse y un fin de semana en quemarse.

  Ninguna de las dos tablas tiene políticas de RLS: el `token` es la credencial
  de baja y viaja en el correo, así que nada de esto se lee con la clave
  anónima. Todo pasa por la función `newsletter`.
*/

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  last_sent_at timestamptz,
  CONSTRAINT newsletter_subscribers_email_shape CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  CONSTRAINT newsletter_subscribers_email_lower CHECK (email = lower(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key ON public.newsletter_subscribers (email);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_token_key ON public.newsletter_subscribers (token);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_confirmed_idx
  ON public.newsletter_subscribers (created_at) WHERE status = 'confirmed';

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  email_id text,
  error text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- Lo que impide mandar dos veces la misma edición cuando una tanda se corta
-- por la mitad y se reintenta. No es el código: es este índice.
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_sends_edition_subscriber_key
  ON public.newsletter_sends (post_id, subscriber_id);

ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;
