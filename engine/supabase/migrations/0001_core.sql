/*
  # Esquema de un directorio

  Una sola migración con todo lo que un directorio necesita para funcionar y
  para no meterse en los agujeros en los que se metió el primero. Cada decisión
  de aquí viene de haber pagado el error antes.

  Entidades:
    categories          los grupos por los que se navega
    listings            las fichas. En el proyecto original eran "tools"
    listing_events      vistas y clics de salida, para saber qué mueve algo
    claim_requests      alguien dice que una ficha es suya
    posts               contenido editorial propio. Un directorio sin contenido
                        propio no tiene de qué tirar en búsqueda

  Lo que NO está aquí y va en su propia migración: Stripe (`0002_billing.sql`)
  y boletín (`0003_newsletter.sql`), para poder montar un directorio sin cobrar
  ni enviar nada.

  ## Las cinco decisiones que importan

  1. **`delisted_at` en vez de borrar.** Una ficha que muere —dominio caducado,
     producto absorbido, web secuestrada— no se borra: se marca, con el motivo.
     Borrar pierde el historial y rompe los enlaces entrantes; marcar deja la
     URL contestando 404 honesto y el dato para el informe.

  2. **La política de lectura filtra las bajas.** Es la línea que evita tener
     que acordarse de `WHERE delisted_at IS NULL` en cada consulta del cliente.
     Lo que va con clave de servicio (sitemap, correos, exportaciones) sí tiene
     que filtrarlo a mano, porque la clave de servicio se salta RLS.

  3. **Los eventos se pueden excluir.** `excluded_at` existe porque el primer
     mes de analítica del proyecto original era 98% rastreadores y no había
     forma de quitarlos del recuento sin borrar la tabla.

  4. **La propiedad de una ficha se verifica.** `verification_token` sostiene
     la comprobación por DNS TXT, que es la única prueba de propiedad que no
     necesita intervención humana.

  5. **`updated_at` se mantiene solo.** Con disparador, no desde la aplicación:
     la mitad de las escrituras llegan desde SQL o desde funciones.
*/

-- ── Utilidades ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── Categorías ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories are public" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

-- ── Fichas ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  image_urls text[] NOT NULL DEFAULT '{}',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',

  -- Eje de segmentación del nicho: precio, comarca, modalidad, lo que sea.
  -- Se llama así de genérico porque cada directorio lo usa para otra cosa, y
  -- es lo que sostiene las páginas /categoria/:slug/:faceta, que son las que
  -- contestan la búsqueda con intención ("gestoría en Valencia", "gratis").
  facet text,

  -- Propiedad y verificación
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_token text,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,

  -- Colocación de pago
  is_boosted boolean NOT NULL DEFAULT false,
  boost_expires_at timestamptz,
  is_featured boolean NOT NULL DEFAULT false,

  -- Señales calculadas (las escribe refresh_listing_trending)
  views_30d integer NOT NULL DEFAULT 0,
  clicks_30d integer NOT NULL DEFAULT 0,
  trending_score numeric NOT NULL DEFAULT 0,

  -- Baja razonada
  delisted_at timestamptz,
  delist_reason text,

  upvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_category_idx ON public.listings (category_id) WHERE delisted_at IS NULL;
CREATE INDEX IF NOT EXISTS listings_facet_idx ON public.listings (category_id, facet) WHERE delisted_at IS NULL;
CREATE INDEX IF NOT EXISTS listings_owner_idx ON public.listings (user_id);
CREATE INDEX IF NOT EXISTS listings_delisted_idx ON public.listings (delisted_at) WHERE delisted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_trending_idx ON public.listings (trending_score DESC) WHERE delisted_at IS NULL;

DROP TRIGGER IF EXISTS listings_touch ON public.listings;
CREATE TRIGGER listings_touch BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

/*
  Lectura pública, menos las bajas — salvo para su dueño, que tiene que poder
  ver y arreglar la suya. Filtrar aquí y no en cada consulta es lo que impide
  que una ficha retirada reaparezca en un listado nuevo dentro de seis meses.
*/
CREATE POLICY "listings are public unless delisted" ON public.listings
  FOR SELECT TO anon, authenticated
  USING (delisted_at IS NULL OR user_id = auth.uid());

CREATE POLICY "users insert own listings" ON public.listings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "owners update own listings" ON public.listings
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "owners delete own listings" ON public.listings
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── Recuento de fichas por categoría ─────────────────────────────────────────

CREATE OR REPLACE VIEW public.category_listing_counts
WITH (security_invoker = true) AS
  SELECT c.id, c.name, c.slug, c.icon, c.sort_order,
         count(l.id) FILTER (WHERE l.delisted_at IS NULL) AS listing_count
  FROM public.categories c
  LEFT JOIN public.listings l ON l.category_id = c.id
  GROUP BY c.id, c.name, c.slug, c.icon, c.sort_order;

CREATE OR REPLACE VIEW public.category_facet_counts
WITH (security_invoker = true) AS
  SELECT category_id, facet, count(*) AS listing_count
  FROM public.listings
  WHERE delisted_at IS NULL AND facet IS NOT NULL
  GROUP BY category_id, facet;

-- ── Eventos ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.listing_events (
  id bigserial PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('detail_view', 'outbound_click')),
  is_boosted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Lo que no cuenta: rastreadores, pruebas, el día que alguien recorrió el
  -- catálogo entero. Se marca en vez de borrarse para poder explicar el salto.
  excluded_at timestamptz,
  excluded_reason text
);

CREATE INDEX IF NOT EXISTS listing_events_counted_idx
  ON public.listing_events (listing_id, event_type, created_at)
  WHERE excluded_at IS NULL;

ALTER TABLE public.listing_events ENABLE ROW LEVEL SECURITY;
-- Sin políticas: se escribe desde la función `track-event`, que filtra
-- rastreadores y limita por IP. Nada de escritura directa desde el navegador.

CREATE OR REPLACE FUNCTION public.refresh_listing_trending()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH counts AS (
    SELECT l.id,
      count(*) FILTER (WHERE e.event_type = 'detail_view') AS views,
      count(*) FILTER (WHERE e.event_type = 'outbound_click') AS clicks
    FROM public.listings l
    LEFT JOIN public.listing_events e
      ON e.listing_id = l.id
     AND e.excluded_at IS NULL
     AND e.created_at > now() - interval '30 days'
    GROUP BY l.id
  )
  UPDATE public.listings l
  SET views_30d = c.views,
      clicks_30d = c.clicks,
      -- Un clic de salida es intención; una vista es curiosidad.
      trending_score = c.views + (c.clicks * 3)
  FROM counts c
  WHERE c.id = l.id
    AND (l.views_30d, l.clicks_30d) IS DISTINCT FROM (c.views, c.clicks);
$$;

-- ── Reclamaciones de ficha ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  justification text NOT NULL DEFAULT '',
  contact_proof text NOT NULL DEFAULT '',
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS claim_requests_pending_idx
  ON public.claim_requests (created_at) WHERE status = 'pending';

ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own claims" ON public.claim_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users read own claims" ON public.claim_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

/*
  No hay política de UPDATE a propósito: una reclamación la resuelve la función
  `claims-review` con la clave de servicio. En el proyecto original faltaba esa
  función y las reclamaciones se quedaban en `pending` para siempre, porque
  nada en el sistema podía cambiarles el estado.
*/

-- ── Contenido editorial ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_published_idx ON public.posts (published_at DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts are public" ON public.posts
  FOR SELECT TO anon, authenticated USING (published_at <= now());

-- ── Errores del cliente ──────────────────────────────────────────────────────

/*
  Sin esto, un fallo en producción solo existe si un usuario se molesta en
  contarlo. Con esto se ven los dos de siempre: los trozos de código que
  desaparecen al desplegar, y las URLs del sitio anterior.
*/
CREATE TABLE IF NOT EXISTS public.client_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  stack text,
  component_stack text,
  url text,
  user_agent text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_errors_recent_idx ON public.client_errors (created_at DESC);

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can report an error" ON public.client_errors
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Nadie los lee desde el cliente: se consultan con la clave de servicio.
