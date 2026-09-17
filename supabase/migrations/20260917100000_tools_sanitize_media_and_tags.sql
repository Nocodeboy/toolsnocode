/*
  # Validar lo que entra en `tools`, en la base y no en el navegador

  Treinta y cinco fichas desde el 23 de agosto de 2026 llegaron así:

    logo_url        = 'h'
    screenshot_urls = '{h}'
    tags            = '{"[\"AI\"", "\"AI agents\"", "\"SaaS\"]"}'

  Una letra donde iba una URL, y un array JSON troceado por comas donde iban
  etiquetas. Eso no lo produce una persona escribiendo en el formulario: es un
  cliente automatizado enviando JSON donde la app esperaba texto. Y cuatro
  altas cayeron en "3D & AR/VR" después de que el formulario exigiera elegir
  categoría, así que ni siquiera pasan por el formulario.

  Da igual qué cliente sea: la única validación que no se puede saltar es la
  de la base. El trigger normaliza en vez de rechazar — una ficha con el logo
  vacío es mejor que ninguna ficha, y el `<img>` roto era lo que veía el
  visitante.

    - `logo_url` que no sea una URL http(s) → ''.
    - `screenshot_urls`: se quedan solo las que son URL http(s).
    - `tags`: si el conjunto parece un JSON troceado, se reconstruye y se
      parsea; si no, se limpian corchetes y comillas elemento a elemento. Se
      descartan vacíos y se deduplica.
    - `category_id` NULL al insertar → error. Sin categoría la ficha no tiene
      página donde vivir.
*/

CREATE OR REPLACE FUNCTION public.tools_sanitize_media_and_tags()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  joined  text;
  parsed  text[];
BEGIN
  IF TG_OP = 'INSERT' AND NEW.category_id IS NULL THEN
    RAISE EXCEPTION 'tools.category_id is required' USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.logo_url IS NOT NULL AND NEW.logo_url !~* '^https?://[^ ]+\.[^ ]+' THEN
    NEW.logo_url := '';
  END IF;

  IF NEW.screenshot_urls IS NOT NULL THEN
    SELECT coalesce(array_agg(u), '{}')
    INTO NEW.screenshot_urls
    FROM unnest(NEW.screenshot_urls) AS u
    WHERE u ~* '^https?://[^ ]+\.[^ ]+';
  END IF;

  IF NEW.tags IS NOT NULL AND EXISTS (SELECT 1 FROM unnest(NEW.tags) x WHERE x LIKE '[%' OR x LIKE '%]' OR x LIKE '%"%') THEN
    joined := array_to_string(NEW.tags, ',');
    BEGIN
      SELECT array_agg(trim(v)) INTO parsed
      FROM jsonb_array_elements_text(joined::jsonb) AS v
      WHERE trim(v) <> '';
    EXCEPTION WHEN others THEN
      SELECT array_agg(trim(both ' "[]' FROM x)) INTO parsed
      FROM unnest(NEW.tags) AS x
      WHERE trim(both ' "[]' FROM x) <> '';
    END;
    NEW.tags := coalesce(parsed, '{}');
  END IF;

  IF NEW.tags IS NOT NULL THEN
    SELECT coalesce(array_agg(DISTINCT t ORDER BY t), '{}') INTO NEW.tags
    FROM unnest(NEW.tags) AS t WHERE trim(t) <> '';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tools_sanitize_media_and_tags ON public.tools;
CREATE TRIGGER tools_sanitize_media_and_tags
  BEFORE INSERT OR UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.tools_sanitize_media_and_tags();

-- Las filas que ya entraron mal: el mismo saneado, una vez.
UPDATE public.tools
SET logo_url = logo_url
WHERE (logo_url IS NOT NULL AND logo_url !~* '^https?://[^ ]+\.[^ ]+' AND logo_url <> '')
   OR EXISTS (SELECT 1 FROM unnest(screenshot_urls) u WHERE u !~* '^https?://[^ ]+\.[^ ]+')
   OR EXISTS (SELECT 1 FROM unnest(tags) x WHERE x LIKE '[%' OR x LIKE '%]' OR x LIKE '%"%');
