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
   supabase functions deploy stripe-checkout verify-tool-dns sitemap fetch-and-rewrite-news enrich-news
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

## Backend — Supabase

### Migraciones SQL

Se aplican con `supabase db push` desde el CLI, o vía MCP durante ops puntuales. Ver [DATABASE.md](./DATABASE.md#aplicar-migraciones).

### Edge Functions

Desplegar todas:

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy verify-tool-dns
supabase functions deploy fetch-and-rewrite-news
supabase functions deploy enrich-news
supabase functions deploy sitemap
```

Secrets por función (se configuran con `supabase secrets set KEY=value`):

| Función | Secrets requeridos |
|---------|-------------------|
| `stripe-checkout` | `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` |
| `stripe-webhook` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` |
| `verify-tool-dns` | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` |
| `fetch-and-rewrite-news` | `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` |
| `enrich-news` | `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` |
| `sitemap` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (solo lectura) |

Secrets opcionales, compartidos por varias funciones:

| Secret | Efecto |
|--------|--------|
| `ALLOWED_ORIGINS` | Orígenes permitidos para CORS y para las redirecciones de Stripe Checkout, separados por comas. Por defecto, la lista de producción + localhost. |
| `SITE_URL` | Origen público que anuncia el `sitemap`. Por defecto `https://toolsnocode.com`. |

**CORS**: la allow-list es compartida ([`_shared/cors.ts`](../supabase/functions/_shared/cors.ts)) y se configura con el secret `ALLOWED_ORIGINS` (lista separada por comas). Sin el secret, el fallback es `https://toolsnocode.com`, `http://localhost:5173`, `http://localhost:4173`. El primer origen de la lista es el que se devuelve a peticiones de orígenes no permitidos, así que va primero el dominio canónico.

La coincidencia es exacta: los previews de Vercel cambian de URL en cada rama, así que hay que añadir el alias concreto que se quiera probar en vez de un comodín — estos mismos orígenes validan las URLs de redirección de Stripe y un comodín ahí sería un open redirect.

### Stripe

- **Webhook endpoint**: `https://<project>.supabase.co/functions/v1/stripe-webhook`.
- **Eventos suscritos**: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid|payment_failed`.
- Obtener `STRIPE_WEBHOOK_SECRET` al crear el endpoint en Stripe Dashboard.

### Cron jobs

Definidos en migraciones (`pg_cron`). No requieren deploy separado — se crean al aplicar las migraciones correspondientes.

## Configuración manual post-deploy

Estos toggles no están automatizados y hay que activarlos en el dashboard de Supabase:

- **Leaked Password Protection**: `Authentication → Providers → Email → Check passwords against HaveIBeenPwned`. Recomendado.
- **Email templates**: `Authentication → Email Templates`. Personalizar sender + plantillas de confirmación.
- **Auth providers**: si se añade Google/GitHub, configurar credenciales OAuth.

## Notas operativas

- **Divergencia repo ↔ DB**: las migraciones aplicadas vía MCP también quedan en `supabase_migrations.schema_migrations`. Si falta el archivo en el repo, añadirlo después es seguro (Supabase detecta la versión ya aplicada).
- **Rollback de migración**: escribir una migración nueva que revierta el cambio. No se recomienda borrar archivos ya aplicados.
- **Monorepo**: se exploró mover el repo a `apps/web + services/scraper` pero Bolt falló al detectar `package.json`. Con Vercel esto deja de ser un bloqueo: basta con fijar el *Root Directory* del proyecto. Detalles en el commit history de abril 2026.
