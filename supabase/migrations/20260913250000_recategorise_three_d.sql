/*
  # Recategorizar las 32 herramientas mal archivadas en "3D & AR/VR"

  De las 54 filas de `three-d`, 32 no tenían nada que ver con 3D: cuatro
  estudios de tatuaje de Carolina del Norte, una plataforma de telemedicina,
  un copiador de señales de Telegram, astrología védica, un programa de arte
  para niños de Nueva Orleans.

  El reparto entre unas y otras es exacto y dice cuál era la causa: las 32 mal
  archivadas son las 32 que subieron makers por el formulario, y las 22 que sí
  son 3D vienen todas del scraper. "3D & AR/VR" empieza por un dígito, así que
  encabezaba un desplegable ordenado por nombre, y la primera opción de un
  desplegable es el valor por defecto de quien tiene prisa. El formulario ya
  exige elegir categoría y su placeholder es `disabled`.

  La asignación anterior queda en `tools_category_backup_20260913` por si hay
  que revisar alguna decisión: son juicios sobre datos que metió gente, no un
  arreglo mecánico.

  Cuatro de las filas movidas a `other` no son herramientas de IA ni de
  no-code, sino negocios locales. Se archivan donde corresponde en vez de
  borrarlas: eso es una decisión de producto, no de taxonomía.
*/

-- Copia de seguridad de la asignación actual, antes de tocar nada.
CREATE TABLE IF NOT EXISTS public.tools_category_backup_20260913 AS
SELECT t.id, t.slug, t.name, t.category_id, c.slug AS category_slug, now() AS backed_up_at
FROM public.tools t
JOIN public.categories c ON c.id = t.category_id
WHERE c.slug = 'three-d';

WITH mapping(tool_slug, target_slug) AS (VALUES
  -- Negocios locales y publicaciones: no son herramientas, pero existen y se
  -- archivan donde toca en vez de borrarlas.
  ('tattoo-factory-of-charlotte', 'other'),
  ('the-tattoo-factory',          'other'),
  ('tattoo-factory-of-hickory',   'other'),
  ('the-piercing-factory',        'other'),
  ('mess-arts-new-orleans',       'other'),
  ('vedic-astrology',             'other'),
  ('liftoff-directory',           'other'),
  ('thrivexdna',                  'other'),

  ('playciso',                        'cybersecurity'),
  ('cuvo-health',                     'healthcare'),
  ('eggfreezingfacts-org',            'healthcare'),
  ('glypse',                          'finance'),
  ('montezy',                         'finance'),
  ('marketsync',                      'finance'),
  ('nextgen-seller',                  'finance'),
  ('sponsee-app',                     'sales'),
  ('kitful-ai',                       'seo'),
  ('seolutions-pr-guest-post-portal', 'seo'),
  ('bidsurvivor',                     'marketing'),
  ('cards-by-digital-railways',       'marketing'),
  ('best-discord',                    'social-media'),
  ('whizi',                           'chatbots'),
  ('prompticus',                      'coding'),
  ('ping-parrot',                     'coding'),
  ('copythathq',                      'project-management'),
  ('nuet',                            'productivity'),
  ('calcboxer',                       'productivity'),
  ('sermonframer',                    'video-generation'),
  ('videopopy',                       'video-generation'),
  ('seisei-ai',                       'image-generation'),
  ('playbook',                        'image-generation'),
  ('vividoo',                         'real-estate')
)
UPDATE public.tools t
SET category_id = target.id
FROM mapping m
JOIN public.categories target ON target.slug = m.target_slug
WHERE t.slug = m.tool_slug;
