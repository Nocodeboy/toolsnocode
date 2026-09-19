/**
 * Todo lo que cambia entre un directorio y otro, en un sitio.
 *
 * Es lo primero que se toca al arrancar uno nuevo. Nada de lo que hay aquí
 * debería estar escrito a mano en ningún otro fichero: si aparece el nombre
 * del sitio en un componente, es un fallo, no una excepción.
 */
export const site = {
  name: 'Directory',
  /** Sin barra final. Se usa para canónicas, sitemap, correo y JSON-LD. */
  url: 'https://example.com',
  /** Una frase. Sale en la home, en la etiqueta description y en el JSON-LD. */
  tagline: 'The directory of things worth finding',
  description:
    'A directory with the facts checked against the source, so you can compare what matters before you contact anyone.',
  locale: 'es_ES',
  lang: 'es',
  twitter: '@example',
  /** Imagen por defecto de redes sociales, 1200×630, dentro de `public/`. */
  ogImage: '/og-image.png',
} as const;

/**
 * Cómo se llama lo que hay en la ficha, en singular, plural y en la URL.
 *
 * La URL manda: cambiarla después de indexar cuesta una tabla de redirecciones
 * y meses de recuperación. Elegir aquí la palabra que la gente busca —
 * `/gestorias/...` y no `/listings/...` — es gratis el primer día.
 */
export const entity = {
  singular: 'listing',
  plural: 'listings',
  /** Segmento de URL de las fichas: /{path}/{slug} */
  path: 'listings',
  /** Cómo se llama el enlace de salida en los botones. */
  outboundLabel: 'Visit website',
} as const;

/**
 * El segundo eje de navegación, el que crea las páginas de intención.
 *
 * `/categoria/:slug/:faceta` es lo que contesta a "gestoría en Valencia" o
 * "herramientas gratis de vídeo". Son las páginas que mejor convierten porque
 * la búsqueda ya trae la decisión medio tomada.
 *
 * `indexMin` es el número mínimo de fichas para que una de esas páginas se
 * anuncie: por debajo existe, funciona y lleva `noindex`. Una página con dos
 * fichas es contenido pobre, y el buscador lo trata como tal.
 */
export const facets = {
  /** Etiqueta visible por valor. Las claves son lo que va en la URL. */
  labels: {} as Record<string, string>,
  indexMin: 8,
} as const;

/**
 * Rutas que la aplicación conoce. Todo lo que no esté aquí contesta 404 de
 * verdad en vez de devolver 200 con la pantalla de "no encontrado".
 *
 * Un SPA responde 200 a cualquier cosa, y eso le dice a un buscador que el
 * sitio tiene infinitas páginas: en el proyecto original, cada enlace muerto
 * del sitio anterior y cada errata era una página más que indexar.
 */
export const routes = {
  static: [
    '/', '/categories', '/blog', '/pricing', '/login', '/signup', '/account',
    `/${entity.path}`, `/${entity.path}/new`,
    '/legal/privacy', '/legal/terms', '/legal/cookies',
  ],
  dynamic: [
    new RegExp(`^/${entity.path}/[a-z0-9-]+(/edit)?$`),
    /^\/categories\/[a-z0-9-]+(\/[a-z0-9-]+)?$/,
    /^\/blog\/[a-z0-9-]+$/,
  ],
} as const;
