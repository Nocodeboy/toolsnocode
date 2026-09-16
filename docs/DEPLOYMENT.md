# Despliegue

## Frontend — Vercel

El repo `nocodeboy/toolsnocode` está conectado a Vercel (team `nocodeboys-projects`). Deploy de producción automático al pushear a `main`; cada rama y PR genera un preview.

La configuración vive en [`vercel.json`](../vercel.json) — Vercel **ignora** `public/_redirects`, que es formato Netlify/Bolt:

| Ajuste | Valor |
|--------|-------|
| Framework | `vite` |
| Build command | `npm run build` |
| Output directory | `dist/` |
| Install command | `npm install` |
| Rewrite `/sitemap.xml` | → `https://<project>.supabase.co/functions/v1/sitemap` |
| Rewrite `/(.*)` | → `/index.html` (fallback SPA de React Router) |

Los rewrites se evalúan **después** del sistema de ficheros, así que `/assets/*`, `/robots.txt` y `/favicon.svg` se siguen sirviendo como estáticos.

Variables de entorno en Vercel (Settings → Environment Variables, marcar Production **y** Preview; **no** se commitean):

| Variable | Dónde se usa |
|----------|--------------|
| `VITE_SUPABASE_URL` | Cliente (`src/lib/supabase.ts`). |
| `VITE_SUPABASE_ANON_KEY` | Cliente (`src/lib/supabase.ts`). |

Faltan las dos y el build compila igual, pero la app revienta en el primer render (`Missing Supabase environment variables`).

### Migración desde Bolt.new — runbook

El dominio `toolsnocode.com` lo sirve Bolt.new, que despliega sobre Netlify (de ahí `public/_redirects`, en formato Netlify). Orden recomendado para no romper pagos ni login:

1. **Vercel**: importar el repo, añadir las dos variables `VITE_*`, desplegar y comprobar el preview en `*.vercel.app`.
2. **Supabase — orígenes permitidos**: añadir el dominio de Vercel a la allow-list mientras convivan los dos hosts:
   ```bash
   supabase secrets set ALLOWED_ORIGINS="https://toolsnocode.com,https://<proyecto>.vercel.app"
   supabase functions deploy stripe-checkout stripe-webhook stripe-resync stripe-portal verify-tool-dns sitemap track-event digest
   ```
   Sin esto el checkout responde `400 Invalid redirect URL` y CORS bloquea `verify-tool-dns` desde el dominio nuevo.
3. **Supabase — Auth**: `Authentication → URL Configuration` → añadir la URL de Vercel a *Redirect URLs* (si no, el login con Google y la confirmación por email rebotan) y actualizar *Site URL* tras el corte.
4. **DNS**: se gestiona en **Hostinger** (los nameservers del dominio son `ns1.dns-parking.com` / `ns2.dns-parking.com`), no en Bolt ni en Netlify. Estado de partida y destino:

   | Registro | Hoy | Tras la migración |
   |----------|-----|-------------------|
   | `toolsnocode.com` (A) | `75.2.60.5` (Netlify, donde despliega Bolt) | `76.76.21.21` (Vercel) |
   | `www` (CNAME) | `site-dns.bolt.host` | `cname.vercel-dns.com` |

   Añadir primero el dominio en Vercel (Settings → Domains) para que verifique, y confirmar en el dashboard los valores por si Vercel pide otros distintos. Bajar el TTL unas horas antes reduce la ventana de propagación.
5. **Post-corte**: quitar el dominio de Bolt, devolver `ALLOWED_ORIGINS` a la lista mínima (`https://toolsnocode.com` + localhost) y redesplegar las funciones. `public/_redirects` puede borrarse; se mantiene de momento como vía de vuelta a Bolt/Netlify.
6. **Verificar**: `/sitemap.xml` devuelve XML, una ruta profunda (`/tools/<slug>`) carga sin 404, login con Google, y un checkout de prueba en Stripe.

Stripe no necesita cambios: el webhook apunta a Supabase, no al frontend.

### Edge Functions de Vercel (`api/`)

Dos funciones en el edge de Vercel, desplegadas con el frontend. Leen
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del entorno del proyecto en
tiempo de ejecución (las mismas variables que usa la build).

| Función | Qué hace |
|---------|----------|
| `api/page.ts` | `vercel.json` reescribe `/tools/:slug`, `/news/:slug`, `/categories/:slug` y `/categories` hacia aquí con la ruta en `?p=`. Pide el HTML del SPA a la propia app (cabecera `x-seo-bypass`, que la regla exige que falte), escribe el `<head>` de la ruta y un `<h1>` con los primeros párrafos en `#root`, y responde 404 si la fila no existe. Falla abierto: cualquier error devuelve el HTML sin tocar. Cabecera `x-seo: injected|fallback` para diagnosticar. |
| `api/og.tsx` | Imágenes sociales 1200×630 (`?kind=news\|tool\|category&slug=…`) con `@vercel/og@0.6.8` — la 1.x no despliega en el edge. Cache de un día; ante error redirige a `/og-image.png`. |

Ver [SEO-AUDIT.md](./SEO-AUDIT.md) para el porqué.

## Backend — Supabase

### Migraciones SQL

Se aplican con `supabase db push` desde el CLI, o vía MCP durante ops puntuales. Ver [DATABASE.md](./DATABASE.md#aplicar-migraciones).

### Edge Functions

Ocho funciones. Tres (`stripe-webhook`, `stripe-checkout`, `sitemap`, `digest`)
se despliegan sin verificación de JWT en la pasarela porque su autenticación es
otra — la firma de Stripe, o un secreto propio en tiempo constante:

```bash
supabase functions deploy stripe-checkout stripe-webhook verify-tool-dns sitemap digest --no-verify-jwt
supabase functions deploy stripe-resync stripe-portal track-event
```

| Función | Qué hace | Secrets que lee |
|---------|----------|-----------------|
| `stripe-checkout` | Crea la sesión de Checkout del Boost. Exige `tool_id` y que la herramienta sea del usuario: sin eso Stripe cobraba y el webhook no tenía a qué aplicarlo. | `STRIPE_SECRET_KEY`, `ALLOWED_ORIGINS` |
| `stripe-webhook` | Recibe eventos de Stripe y aplica/retira el Boost (lógica en `_shared/boost-sync.ts`). Resuelve al usuario por `stripe_customers` y, si no hay fila, por el email que Stripe conoce. Lo que no puede entregar va a `stripe_incidents`. | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `stripe-resync` | `POST {customer_id}` reprocesa a un cliente desde Stripe con la misma lógica que el webhook; `{customer_id, inspect:true}` y `{price_id}` son solo lectura. Cabecera `X-Resync-Secret`. | `STRIPE_SECRET_KEY`, `RESYNC_SECRET` |
| `stripe-portal` | Abre el portal de facturación de Stripe para el usuario autenticado (cancelar, tarjeta, facturas). Requiere el portal activado en el panel de Stripe. | `STRIPE_SECRET_KEY`, `ALLOWED_ORIGINS` |
| `verify-tool-dns` | Verificación de propiedad por registro DNS. | — |
| `sitemap` | Genera `/sitemap.xml` paginando PostgREST. Las 33 páginas de categoría se anuncian solo con `CATEGORY_PAGES_LIVE=true`. | `SITE_URL`, `CATEGORY_PAGES_LIVE` |
| `track-event` | Registra `detail_view` / `outbound_click` en `tool_events`. Descarta crawlers por User-Agent y limita por IP. | — |
| `digest` | `GET` devuelve los hechos de la semana (`weekly_digest_brief`); `POST` publica una edición del boletín o la rechaza si algún enlace interno no existe. Cabecera `X-Digest-Secret`. | `DIGEST_SECRET` |

Todas leen además `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, que Supabase inyecta.

Secrets compartidos u opcionales:

| Secret | Efecto |
|--------|--------|
| `ALLOWED_ORIGINS` | Orígenes permitidos para CORS y para las redirecciones de Stripe, separados por comas. Sin él, la lista de producción + localhost. |
| `SITE_URL` | Origen público que anuncia el `sitemap`. Por defecto `https://toolsnocode.com`. |
| `CATEGORY_PAGES_LIVE` | `true` cuando la build con `/categories` está en producción. Evita anunciar en el sitemap páginas que el SPA aún resuelve con su 404. |
| `RESYNC_SECRET` | Autoriza `stripe-resync`. Generar con `openssl rand -hex 32`. |
| `DIGEST_SECRET` | Autoriza `digest`. El mismo valor va en el entorno de Claude Code que ejecuta la rutina del boletín. |

**CORS**: la allow-list es compartida ([`_shared/cors.ts`](../supabase/functions/_shared/cors.ts)) y se configura con `ALLOWED_ORIGINS`. La coincidencia es exacta: los previews de Vercel cambian de URL en cada rama, así que hay que añadir el alias concreto en vez de un comodín — estos mismos orígenes validan las URLs de redirección de Stripe y un comodín ahí sería un open redirect.

### Stripe

- **Webhook endpoint**: `https://<project>.supabase.co/functions/v1/stripe-webhook`. Eventos: `checkout.session.completed`, `customer.subscription.updated|deleted`, `invoice.payment_failed`.
- **Portal de clientes**: activar una vez en `Settings → Billing → Customer portal`. Sin ese clic `stripe-portal` devuelve error.
- **Payment Links**: desactivados. Los tres clientes que pagaron entre 2025 y 2026 entraron por Payment Link sin cuenta en el sitio, y ninguno recibió el Boost. El checkout de la app es la única puerta.
- **Incidencias**: `select * from stripe_incidents where resolved_at is null` — cada Boost que el webhook no pudo entregar, con el motivo y el email del cliente. Se resuelven solas cuando una sincronización posterior lo consigue.
- **Reprocesar un cliente**:
  ```bash
  curl -X POST https://<project>.supabase.co/functions/v1/stripe-resync \
    -H "apikey: <anon>" -H "Authorization: Bearer <anon>" \
    -H "X-Resync-Secret: $RESYNC_SECRET" -H "Content-Type: application/json" \
    -d '{"customer_id":"cus_…"}'
  ```
  (con `"inspect": true` no modifica nada; con `{"price_id":"price_…"}` describe un precio).

### Cron jobs

Definidos en migraciones (`pg_cron`); se crean al aplicarlas. Los que existen:

| Job | Cuándo | Qué hace |
|-----|--------|----------|
| `refresh-tool-trending` | cada hora, minuto 7 | Recalcula `views_30d`, `clicks_30d` y `trending_score` desde `tool_events`. |
| `expire-stale-boosts` | 03:15 UTC | Apaga los Boosts cuya fecha pasó. Antes esto colgaba del webhook y un Boost solo caducaba si otro cliente pagaba en ese momento. |

Vigilar: `select jobname, status, return_message, start_time from cron.job_run_details order by start_time desc limit 20;`. El cron de noticias anterior falló 150 veces seguidas durante cinco meses sin que nadie mirara esta tabla.

### Boletín semanal

No es un cron: es una rutina de Claude Code que cada lunes a las 08:00 UTC abre una sesión, lee los hechos de la semana por `digest`, escribe la edición desde cero y la publica. La guía editorial y el procedimiento están en [NEWSLETTER.md](./NEWSLETTER.md). Requiere `DIGEST_SECRET` en dos sitios: secrets de Supabase y variables del entorno de Claude Code. Si falta en el entorno, la rutina se para y avisa; no publica a ciegas.

## Configuración manual post-deploy

- **Stripe → Customer portal**: activado (ver arriba).
- **Leaked Password Protection**: `Authentication → Providers → Email → Check passwords against HaveIBeenPwned`. Recomendado.
- **Email templates**: `Authentication → Email Templates`. Personalizar sender + plantillas de confirmación.
- **Auth providers**: si se añade Google/GitHub, configurar credenciales OAuth.

## Notas operativas

- **Divergencia repo ↔ DB**: las migraciones aplicadas vía MCP también quedan en `supabase_migrations.schema_migrations`. Si falta el archivo en el repo, añadirlo después es seguro (Supabase detecta la versión ya aplicada).
- **Rollback de migración**: escribir una migración nueva que revierta el cambio. No se recomienda borrar archivos ya aplicados.
- **Monorepo**: se exploró mover el repo a `apps/web + services/scraper` pero Bolt falló al detectar `package.json`. Con Vercel esto deja de ser un bloqueo: basta con fijar el *Root Directory* del proyecto. Detalles en el commit history de abril 2026.
