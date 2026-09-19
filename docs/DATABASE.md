# Base de datos

Postgres gestionado por Supabase. Todas las tablas de `public.` tienen RLS activado. Las migraciones viven en `supabase/migrations/` y se ejecutan en orden alfabético por timestamp.

## Tablas (schema `public`)

| Tabla | Filas aprox. | Descripción |
|-------|-------------:|-------------|
| `categories` | 33 | Categorías de tools (árbol plano por ahora). |
| `tools` | 3 094 | Herramientas no-code. Entidad principal. Lleva `views_30d`, `clicks_30d`, `trending_score` (recalculados cada hora desde `tool_events`) y el estado de Boost. |
| `experts` | 4 306 | Profesionales / consultores. |
| `expert_tools` | 6 733 | Unión many-to-many experts ↔ tools. |
| `tutorials` | 7 680 | Tutoriales enlazados a tools/categorías. |
| `projects` | 27 | Casos de uso / showcases. |
| `project_tools` | 57 | Unión many-to-many projects ↔ tools. |
| `favorites` | 5 | Favoritos por `user_id`. |
| `votes` | 9 | Upvotes sobre entidades (tool/expert/tutorial/project). |
| `claims` | 2 | Reclamaciones de propiedad resueltas. |
| `claim_requests` | 1 | Peticiones pendientes (fallback manual). |
| `tool_verifications` | 0 | Tokens DNS TXT activos para verificación. |
| `news` | — | Ediciones del boletín semanal (`source = 'ToolsNoCode'`) y restos del pipeline anterior. Ver [NEWSLETTER.md](./NEWSLETTER.md). |
| `stripe_customers` | 3 | Map `user_id` ↔ `stripe_customer_id`. La escribe el checkout de la app, y el webhook cuando resuelve un cliente por email. |
| `stripe_subscriptions` | 6 | Estado de suscripción por cliente (`customer_id` UNIQUE: un Boost por maker). |
| `stripe_orders` | 0 | Pagos one-off. |
| `stripe_webhook_events` | 19 | Idempotencia de webhooks Stripe (PK = `event_id`). |
| `stripe_incidents` | 1 | Boosts que el webhook no pudo entregar, con motivo y email. Abiertas = `resolved_at IS NULL`. Solo service_role. |
| `tool_events` | ~1 800 | `detail_view` / `outbound_click` por tool. Solo inserta `track-event` (service_role); RLS sin políticas. Los crawlers se descartan en la función. |
| `tools_category_backup_20260913` | 54 | Asignación de categoría previa a la recategorización de `three-d`. Solo consulta. |
| `client_errors` | 0 | Errores capturados por el `ErrorBoundary` de React. INSERT abierto; SELECT solo service_role. |

## Convenciones de migraciones

- Formato de nombre: `YYYYMMDDHHMMSS_<snake_case>.sql`.
- Cabecera con bloque `/* ... */` que documenta qué hace y por qué.
- Crean o alteran objetos de forma idempotente (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`).
- Las seeds iniciales viven en migraciones con prefijo `seed_` (`seed_tools_data.sql`, etc.).

## RLS — patrones comunes

- **Lectura pública**: la mayoría de catálogos (`tools`, `experts`, `tutorials`, `projects`, `news`, `categories`) tienen `SELECT` abierto a `anon` y `authenticated`.
- **Escritura por propietario**: `INSERT`/`UPDATE`/`DELETE` se restringen con `USING (auth.uid() = user_id)` o equivalente (p. ej. `owner_id` en `tools`).
- **Tablas Stripe**: `SELECT` limitado a filas cuyo `user_id = auth.uid()`; escrituras solo desde service role (edge functions).
- **Favorites / votes**: política per-user clásica.
- **`client_errors`**: solo tiene policy de `INSERT` (anon+authenticated). Sin `SELECT` — lecturas se hacen por dashboard o scripts con `service_role`.

## Triggers destacados

### `enforce_tool_video_url_boost`

Archivo: `20260409165012_enforce_video_url_requires_boost.sql`, endurecido en `20260414122202_fix_security_advisor_warnings.sql` (revertido brevemente por `20260414183522_revert_security_advisor_warnings.sql` y re-aplicado por `20260414185612_fix_security_advisor_warnings.sql`).

Reescrito en `20260913240000_boost_lifecycle_fixes.sql`. Al insertar sin Boost, `video_url = ''`. Al actualizar sin Boost, **conserva el valor anterior** en vez de borrarlo: la versión original vaciaba el campo en cada update sin Boost, así que una renovación fallida destruía el vídeo del cliente y no volvía cuando el cobro se recuperaba. La ficha decide si el vídeo se ve por `is_boosted`; el trigger solo impide ponerlo o cambiarlo sin pagar.

### Slug autogenerado en `news`

Migración: `20260322110514_add_slug_to_news.sql`. Genera slug desde el título usando `regexp_replace` + deduplicación con sufijo incremental.

## Vistas

| Vista | Para qué |
|-------|----------|
| `category_tool_counts` | Herramientas por categoría en una consulta (`security_invoker`). Alimenta `/categories` y la tira de la home. |
| `stripe_user_subscriptions`, `stripe_user_orders` | Estado de facturación del usuario autenticado (`auth.uid()`). |

## Funciones y cron

Todas `SECURITY DEFINER` con `EXECUTE` revocado a `PUBLIC`, `anon` y `authenticated` — en Supabase esos dos roles reciben EXECUTE por privilegios por defecto del esquema, así que nombrarlos no es opcional.

| Función | Quién la llama | Qué hace |
|---------|----------------|----------|
| `refresh_tool_trending()` | cron `refresh-tool-trending`, cada hora | Recalcula `views_30d`, `clicks_30d`, `trending_score` (clic = 5× vista, últimos 7 días ×2, mínimo 5 eventos). |
| `expire_stale_boosts()` | cron `expire-stale-boosts`, 03:15 UTC | Apaga los Boosts con `boost_expires_at` pasado. Los que no tienen fecha los deja y avisa. |
| `weekly_digest_brief(days)` | Edge Function `digest` | Los hechos de la semana en JSON para escribir el boletín. No redacta. |
| `user_id_by_email(text)` | Edge Function `stripe-webhook` | Resuelve un pago hecho fuera del checkout de la app. |

## Extensiones habilitadas

- `pg_cron` — cron jobs a nivel de base de datos (pipeline de noticias).
- `pg_net` — HTTP requests desde SQL (el cron invoca edge functions vía `net.http_post`).

Habilitadas en `20260322111757_enable_cron_and_net_extensions.sql`.

## Storage — bucket `uploads`

- **Público**: `public = true`, objetos servidos por CDN.
- **Límite**: 5 MB por archivo.
- **MIME permitidos**: `image/webp`, `image/jpeg`, `image/png`, `image/gif`, `image/avif`.
- **Estructura**: `uploads/{type}/{userId}/{filename}`. Ejemplo: `uploads/logos/abc-123/tool-name.webp`.

**Policies activas** (sobre `storage.objects`):
- `Authenticated users can upload` — INSERT si el `userId` del path coincide con `auth.uid()`.
- `Users can update own uploads` — UPDATE sobre propias.
- `Users can delete own uploads` — DELETE sobre propias.
- ~~`Public read access on uploads`~~ — **eliminada** en `20260414185612_fix_security_advisor_warnings.sql` (previamente eliminada en `20260414122202_...`, re-creada por `20260414183522_revert_...`, y finalmente eliminada de nuevo). El listing público del bucket era innecesario porque las URLs se resuelven por CDN sin pasar por `storage.objects` SELECT.

## Aplicar migraciones

```bash
# via Supabase CLI (recomendado)
supabase db push

# o vía MCP / dashboard si el cambio es urgente
```

Las migraciones se registran en `supabase_migrations.schema_migrations`. Si el archivo y la tabla divergen (p. ej. un fix aplicado solo vía MCP), se resuelve añadiendo el archivo al repo y re-pusheando — Supabase detecta la versión ya aplicada y la salta.

## Delisting a tool

`tools.delisted_at` (timestamptz) and `tools.delist_reason` (text) mark a
listing as withdrawn without deleting the row. The SELECT policy on `tools`
is `delisted_at IS NULL OR user_id = auth.uid()`, so anonymous and
signed-in readers never see a delisted row while its owner still can. That
single rule covers the SPA, PostgREST, `category_tool_counts` (security
invoker) and the Vercel head-injection layer, which 404s on a missing row.
Two code paths use the service role and filter by hand: the sitemap edge
function and the digest edge function's link check; `weekly_digest_brief()`
filters inside its SQL. Delist with
`UPDATE tools SET delisted_at = now(), delist_reason = '…' WHERE slug = '…'`;
relist by setting `delisted_at` to NULL. The first delisting pass (207 rows,
18 September 2026) is backed up in `tools_delisted_backup_20260918`.

## Analytics: what counts as a view

`tool_events` records `detail_view` and `outbound_click` from the browser
through the `track-event` edge function, which drops known crawler user
agents. Rows carry `excluded_at` and `excluded_reason` for events that
should not count; `refresh_tool_trending()` ignores them when it computes
`views_30d`, `clicks_30d` and `trending_score`.

The first 1,764 rows in the table (13–16 September 2026, before the crawler
filter shipped) were marked this way: they are a sequential crawl, 1.05
events per tool across nearly the whole catalogue, against 4–23 a day since.
They were 98% of the table and fed both the homepage "Trending" row and the
per-listing stats a maker sees on their own page, which is the number the
boost is sold against. Marking rather than deleting keeps the decision
reversible: set `excluded_at` back to NULL to count them again.

## What `is_featured` means

`is_featured` marks an editor's pick: it puts a "Featured" badge on the card
and the tool page, fills the homepage row and drives the Featured sort on
`/tools`. A boosted listing is excluded from that row, so a pick is never
something bought.

The standard for adding one, applied on 19 September 2026 to the first
twelve: the listing is complete (logo, screenshot and a description written
from the tool's own site), the pricing label was verified against that site
in the September pass, the product is live under the name we list it, the
category is right, there is at most one pick per category, and the outbound
link is not an affiliate link, so a pick cannot be a commission in disguise.

The first twelve: Ahrefs, Cursor, DeepL, Deepgram, Figma, Intercom, Linear,
Ollama, Raycast, Recraft, Supabase and VEED.IO. The homepage has six slots
and `src/data/featured.ts` rotates the set weekly, deterministically, so the
server-injected HTML and what React renders agree and every pick gets its
turn.
