/*
  # Tool events — la analítica mínima que el Boost necesita para ser vendible

  El plan Boost vende visibilidad, pero hasta ahora no existía forma de medir
  ni una impresión ni un clic: ni el maker podía ver qué recibía por su dinero,
  ni el operador podía defender el precio. Esta tabla registra los dos únicos
  eventos que importan para eso:

    - `detail_view`    : alguien abrió la ficha de la herramienta
    - `outbound_click` : alguien pulsó el enlace a la web de la herramienta

  El segundo es el entregable real del producto. El primero es su denominador.

  ## Por qué NO hay policy de INSERT

  La anon key es pública por diseño (viaja en el bundle del cliente), así que
  una policy `WITH CHECK (true)` permitiría a cualquiera insertar eventos
  fabricados para cualquier tool, con `is_boosted` falseado, y hacer crecer la
  tabla sin límite. Unas métricas con las que se va a justificar un precio no
  pueden ser escribibles por el mundo entero.

  Los eventos entran solo por la edge function `track-event`, que usa la
  service role key (y por tanto se salta RLS): allí se limita el ritmo por IP,
  se comprueba que la tool existe y se deriva `is_boosted` del servidor en vez
  de aceptarlo del cliente.

  Tampoco hay policy de SELECT: los datos de una herramienta no son públicos y
  se leen con service_role (dashboard, o el panel del maker cuando exista).
*/

CREATE TABLE IF NOT EXISTS public.tool_events (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('detail_view', 'outbound_click')),
  is_boosted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Las consultas siempre son "eventos de esta tool, de tipo X, en los últimos N días".
CREATE INDEX IF NOT EXISTS idx_tool_events_tool_type_created
  ON public.tool_events (tool_id, event_type, created_at DESC);

-- Para los totales del sitio ("visitas del directorio el mes pasado").
CREATE INDEX IF NOT EXISTS idx_tool_events_created_at
  ON public.tool_events (created_at DESC);

-- RLS activo y sin ninguna policy: nadie escribe ni lee salvo service_role.
ALTER TABLE public.tool_events ENABLE ROW LEVEL SECURITY;
