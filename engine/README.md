# Motor de directorio

Lo que queda cuando le quitas a un directorio su nicho: el esqueleto que hace
que un catálogo se pueda rastrear, reclamar, cobrar y mantener.

Sale de [toolsnocode.com](https://toolsnocode.com), un directorio de 2.887
fichas donde cada pieza de aquí existe porque su ausencia costó algo concreto.
Los comentarios del código dicen qué costó. **Léelos antes de simplificar
nada**: casi todo lo que parece de más es la cicatriz de un fallo en
producción.

## Qué resuelve

| Pieza | El problema que evita |
|---|---|
| **SEO en el edge** (`api/`) | Un SPA sirve la misma cáscara vacía a todas las rutas. Medido en el proyecto original: portada, ficha, categoría y artículo devolvían a un rastreador sin JavaScript los mismos 705 bytes y el mismo título |
| **Rutas conocidas y 404 de verdad** | Un SPA contesta 200 a cualquier URL. Cada enlace muerto y cada errata le dicen al buscador que el sitio tiene infinitas páginas |
| **Bajas razonadas** (`delisted_at`) | Las fichas mueren. Borrarlas pierde el historial y rompe enlaces; dejarlas mintiendo es peor. Se marcan con motivo y la política de lectura las esconde en un solo sitio |
| **Reclamación de ficha** | Verificación por DNS TXT (instantánea) o revisión manual con aviso por correo y resolución. En el original faltaba la resolución y las reclamaciones se quedaban en `pending` para siempre |
| **Cobro** (`stripe-*`) | Pagos que no se pueden aplicar quedan registrados como incidencia en vez de perderse; los eventos repetidos de Stripe no duplican efectos; la colocación pagada caduca por cron y no por casualidad |
| **Correo** (`_shared/email.ts`) | Una sola plantilla, un remitente, y envío que nunca tumba la operación que lo provocó |
| **Boletín** | Doble confirmación, bajas de un clic y registro de envíos que impide mandar la misma edición dos veces |
| **Analítica honesta** (`track-event`) | Filtro de rastreadores y eventos excluibles. El primer mes del original fue 98% robots y no había forma de descontarlo |
| **Sitemap** | Paginado (PostgREST corta en 1.000 filas), con error que revienta en vez de publicar medio catálogo, y sin anunciar páginas sin contenido |
| **Pipeline** (`pipeline/`) | Leer miles de webs con navegador real, incluso tras protección anti-bot, para construir y mantener las fichas |

## Arrancar uno nuevo

```bash
cp .env.example .env         # y rellena las dos claves de Supabase
npm install
npm run dev
```

1. **`site.config.ts`** — nombre, dominio, cómo se llama la entidad y qué
   segmento de URL lleva. Es lo único que hay que tocar para que el sitio deje
   de llamarse "Directory". Si el nombre del sitio aparece en cualquier otro
   fichero, es un fallo.
2. **Migraciones** — `supabase/migrations/0001_core.sql` y siguientes, en
   orden. `0002` (cobro) y `0003` (boletín) son opcionales; `0004` programa las
   tareas periódicas.
3. **Funciones** — despliega las de `supabase/functions/`. Las que se
   autentican con un secreto propio o con firma van con `--no-verify-jwt`; ver
   `docs/SETUP.md`.
4. **`vercel.json`** — sustituye `PROJECT.supabase.co` por tu proyecto y
   `listings` por tu segmento si lo cambiaste.
5. **Las fichas** — de donde salgan. `pipeline/` lee webs a escala; lo que no
   hace es inventarse el catálogo inicial.

## Lo que no está aquí y vas a necesitar

- **Autenticación y cuenta de usuario.** El esquema ya referencia
  `auth.users` y las políticas están escritas; faltan las pantallas.
- **Alta y edición de ficha desde el sitio.** Las políticas de RLS lo permiten.
- **Imágenes.** Subida a Storage y normalización.
- **El nicho.** Categorías, textos, facetas y criterio editorial.

## Antes de tocar el SEO, tres cosas que se pagan caro

1. **Vercel sirve un fichero que exista en la ruta antes de aplicar las
   reescrituras.** Por eso el build renombra la cáscara del SPA a `app.html`:
   con `index.html` en la raíz, la portada nunca llega a la capa del edge.
2. **El orden de las reglas de `vercel.json` importa.** El comodín que manda
   todo a `/api/page` se queda cualquier ruta que esté por debajo.
3. **`pg_net` se instala en el esquema `extensions` pero sus funciones viven en
   `net`.** `extensions.net.http_post(...)` falla con "cross-database
   references are not implemented" — el error que tuvo un cron fallando 150
   veces seguidas durante cinco meses sin que nadie lo viera.

## Licencia

Código propio. Úsalo, cópialo y véndelo si es tuyo.
