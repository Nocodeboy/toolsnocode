# Arquitectura

## Vista general

Toolsnocode es una SPA (Vite + React Router) que habla directamente con Supabase desde el cliente para la mayoría de operaciones (lecturas + escrituras sobre tablas con RLS). Las operaciones privilegiadas o con secretos (pagos, DNS, pipeline de noticias, sitemap) viven en Edge Functions de Supabase (Deno runtime).

```
┌──────────────┐       ┌─────────────────────────┐       ┌──────────────┐
│   Browser    │─HTTPS─▶   Supabase (Postgres)   │◀──────│   Scraper    │
│  React SPA   │       │   RLS + Auth + Storage  │       │   (Python)   │
└──────┬───────┘       └──────────┬──────────────┘       └──────────────┘
       │                          │
       │ invoke edge fns          │ writes via service role
       ▼                          │
┌──────────────┐                  │
│  Edge Funcs  │──────────────────┘
│   (Deno)     │
└──────┬───────┘
       │
       ├─▶ Stripe API (checkout / webhooks / portal)
       └─▶ DNS (verificación de dominio)
```

## Rutas del frontend

Definidas en `src/App.tsx`. Todas las rutas autenticadas usan `ProtectedRoute`.

| Ruta | Página | Auth |
|------|--------|------|
| `/` | HomePage | pública |
| `/tools`, `/tools/:slug` | ToolsPage, ToolDetailPage | pública |
| `/categories`, `/categories/:slug` | CategoriesPage, CategoryPage | pública — copy editorial en `src/data/categoryCopy.ts` |
| `/tools/new`, `/tools/:slug/edit` | ToolFormPage | pública (creación libre; edición requiere owner) |
| `/experts`, `/tutorials`, `/projects`, `/news` | listados + detalle | públicas |
| `/account` | AccountPage | **requiere login** |
| `/favorites` | FavoritesPage | **requiere login** |
| `/pricing` | PricingPage | pública |
| `/success` | SuccessPage | **requiere login** (post-Stripe checkout) |
| `/login`, `/signup`, `/auth` | flujos de auth | pública |
| `/legal/{privacy,terms,cookies}` | legal | pública |

## Autenticación

- **Provider**: Supabase Auth (email + password, Google OAuth via `GoogleButton`).
- **Estado**: `AuthContext` (`src/contexts/AuthContext.tsx`) expone `user`, `session` y se suscribe a `onAuthStateChange`.
- **Hook consumidor**: `useAuth()` en `src/hooks/useAuth.ts`.
- **Guardián de rutas**: `src/components/auth/ProtectedRoute.tsx` redirige a `/login` si no hay sesión.
- **Leaked password protection**: se habilita en el dashboard de Supabase (Auth → Providers → Email → "Check against HaveIBeenPwned").

## Integración Stripe

Dos Edge Functions y tres tablas (`stripe_customers`, `stripe_subscriptions`, `stripe_orders`).

**Flujo de checkout** (`supabase/functions/stripe-checkout/index.ts`):
1. Cliente autenticado llama a la función con un `price_id` y `mode` (subscription / payment).
2. Función crea o reutiliza un customer de Stripe vinculado al `user_id` en `stripe_customers`.
3. Crea una Checkout Session y devuelve la URL al frontend, que redirige al usuario.
4. Tras el pago Stripe redirige a `/success`.

**Flujo de webhook** (`supabase/functions/stripe-webhook/index.ts`, lógica en `_shared/boost-sync.ts`):
- Verifica la firma con `STRIPE_WEBHOOK_SECRET` y deduplica por `event_id` en `stripe_webhook_events`.
- Maneja `checkout.session.completed`, `customer.subscription.updated|deleted` e `invoice.payment_failed`.
- Resuelve al usuario por `stripe_customers`; si no hay fila (pago fuera del checkout de la app), por el email del cliente en Stripe vía `user_id_by_email()`, y escribe la fila que faltaba.
- Aplica el Boost a la herramienta de `subscription.metadata.tool_id`; sin `tool_id`, a la única herramienta del usuario si solo tiene una. `past_due` no lo retira (Stripe reintenta durante semanas); `unpaid`, `canceled` e `incomplete_expired` sí.
- Todo lo que no puede entregar queda en `stripe_incidents` con motivo y email. Nunca en un `console.error`.
- `stripe-resync` reprocesa a un cliente con esta misma lógica sin necesitar un evento firmado.
- El frontend lee el estado desde la vista `stripe_user_subscriptions` (filtrada por `auth.uid()`); la pestaña Billing de `/account` abre el portal de Stripe vía `stripe-portal`.

Los ítems "boosted" en `tools` (`is_boosted = true`) son los que tienen suscripción activa. Un trigger impide **cambiar** `video_url` sin Boost, pero no borra el que ya estaba: una renovación fallida no destruye el vídeo del cliente. La caducidad la barre `expire-stale-boosts` a diario (ver [DATABASE.md](./DATABASE.md)).

## Boletín semanal (`/news`)

No hay fuentes externas ni APIs de IA. El directorio tiene el único dato que nadie más tiene — un año de altas, categorías reales y, desde septiembre de 2026, visitas y clics reales — y la edición semanal es donde ese dato se convierte en una observación.

1. **`weekly_digest_brief()`** (SQL) reúne los hechos de la semana en un JSON: altas con marca `presentable`, reparto por categoría junto a la cuota de esa categoría en todo el directorio, altas mensuales, precios, lo más visto si algo supera 10 visitas, ediciones anteriores.
2. **Una rutina de Claude Code** abre una sesión cada lunes a las 08:00 UTC, pide el brief a la Edge Function `digest`, escribe la edición desde cero siguiendo [NEWSLETTER.md](./NEWSLETTER.md), comprueba cada cifra contra el JSON y la publica.
3. **`digest` (POST)** valida antes de insertar: resuelve cada enlace interno `/tools/`, `/categories/`, `/news/` contra la base y rechaza la edición si alguno no existe; exige al menos cuatro enlaces a herramientas; rechaza slugs repetidos.

`NewsDetailPage` renderiza el contenido en Markdown restringido (`##`, listas, enlaces inline a rutas internas o `https://`).

## Verificación de tools (claim ownership)

Un usuario puede reclamar ser dueño de una tool demostrando control sobre su dominio:

1. `ToolDetailPage` → botón `VerifyToolButton` llama a la edge function `verify-tool-dns`.
2. La función (`supabase/functions/verify-tool-dns/index.ts`) genera un token, lo guarda en `tool_verifications` y pide al usuario añadir un registro TXT DNS.
3. Al re-invocar la función, resuelve el DNS del dominio y si encuentra el token, marca la tool como verificada y transfiere `owner_id`.
4. Existe además un flujo de `claim_requests` manual como fallback (usuario rellena formulario, admin revisa).

## Sitemap

`supabase/functions/sitemap/index.ts` genera un sitemap XML dinámico paginando PostgREST (que corta en 1.000 filas por consulta): tools, projects, news y — con `CATEGORY_PAGES_LIVE=true` — las 33 páginas de categoría. `experts` y `tutorials` no se anuncian a propósito: ~12.000 fichas sin contenido propio arrastrarían al resto del dominio. Ante un fallo devuelve 500, nunca un `<urlset>` vacío.

## Storage

Único bucket: `uploads` (público, CDN). Estructura: `uploads/{type}/{userId}/{filename}.webp`. Subida desde `ImageUploader` (`src/components/ui/ImageUploader.tsx`), que espera imágenes ya convertidas a WebP por el cliente. Tamaño máx: 5 MB. Ver [DATABASE.md](./DATABASE.md) para las políticas de storage.

## SEO

`useSEO` (`src/hooks/useSEO.ts`) escribe directamente en `document.head`: `<title>`, meta description, canonical (siempre la propia ruta, nunca la home), OpenGraph, Twitter y JSON-LD por página. Las páginas de categoría (`/categories/:slug`) llevan copy editorial propio en `src/data/categoryCopy.ts` y `CollectionPage` + `ItemList` + `BreadcrumbList`.
