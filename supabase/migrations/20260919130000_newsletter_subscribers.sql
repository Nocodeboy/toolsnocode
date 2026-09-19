/*
  # Suscriptores del boletín, con doble confirmación

  El boletín se publica en `/news` desde hace semanas y no había forma de
  recibirlo: ni formulario, ni lista. Cada lector que quería volver tenía que
  acordarse del sitio.

  ## Doble confirmación, no negociable

  Una dirección entra como `pending` y solo pasa a `confirmed` cuando alguien
  abre el enlace que le llega a ese buzón. Sin ese paso, cualquiera puede
  suscribir la dirección de otro, y las quejas por spam que eso genera se
  cobran en la reputación del dominio que acabamos de verificar.

  `token` sirve para confirmar y para darse de baja: es lo que va en el enlace,
  y por eso la tabla no es legible desde el cliente. No hay ninguna política de
  RLS — con RLS activo y sin políticas, PostgREST no devuelve ni una fila con
  la clave anónima. Todo pasa por la función `newsletter`, que usa la clave de
  servicio.

  `email` se guarda en minúsculas y con índice único: suscribirse dos veces no
  crea dos filas ni reenvía correo a quien ya confirmó.
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

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key
  ON public.newsletter_subscribers (email);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_token_key
  ON public.newsletter_subscribers (token);

-- Para la tanda de envío: quién está confirmado, por orden de antigüedad.
CREATE INDEX IF NOT EXISTS newsletter_subscribers_confirmed_idx
  ON public.newsletter_subscribers (created_at)
  WHERE status = 'confirmed';

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.newsletter_subscribers IS
  'Lista del boletín. Doble confirmación: una fila no recibe nada hasta que status = confirmed. Sin políticas de RLS a propósito: solo la clave de servicio, porque token es la credencial de baja.';
