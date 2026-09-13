/*
  # Descripción larga para las fichas de herramienta

  Medido sobre 1.000 tools: la mediana de `description` son **23 palabras** y el
  94% baja de 100. Son las páginas que hay que monetizar y no tienen material suficiente
  para competir por nada.

  `description_long` guarda una versión ampliada **sin tocar el original**: si el
  resultado no convence, se borra la columna y todo vuelve a estar como estaba.

  La ampliación se genera en la edge function `enrich-tools` a partir del texto
  real de la web de cada herramienta, nunca del conocimiento previo del modelo.
  Una tool sobre la que no se puede leer nada se queda sin ampliar: 23 palabras
  honestas valen más que 200 inventadas.
*/

ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS description_long text;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS enriched_at timestamptz;

-- La función de enriquecimiento busca siempre "las que faltan por procesar".
CREATE INDEX IF NOT EXISTS idx_tools_pending_enrichment
  ON public.tools (created_at DESC)
  WHERE enriched_at IS NULL;
