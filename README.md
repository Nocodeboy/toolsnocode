# Toolsnocode

Directorio de herramientas no-code, expertos, tutoriales, proyectos y un boletín semanal escrito a partir de los propios datos del directorio. Frontend en Vite + React + TypeScript, backend en Supabase (Postgres + Auth + Storage + Edge Functions), pagos con Stripe.

## Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router 7. SEO por página con `useSEO` (canonical, OpenGraph, JSON-LD).
- **Backend**: Supabase (Postgres con RLS, Auth, Storage `uploads` bucket, Edge Functions en Deno).
- **Integraciones**: Stripe (Checkout, Webhooks, portal de clientes), DNS verification para reclamación de tools. Sin dependencias de APIs de IA externas: el boletín se escribe desde los datos propios.
- **Scraper**: servicio Python aparte (`../scraper/`) que alimenta las tablas `tools`, `experts`, `tutorials`.
- **Deploy**: Vercel (frontend) + Supabase (DB/Functions).

## Quickstart

```bash
npm install
cp .env.example .env   # rellenar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
```

## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo Vite. |
| `npm run build` | Build de producción a `dist/`. |
| `npm run preview` | Sirve el build localmente. |
| `npm run lint` | ESLint sobre todo el repo. |
| `npm run typecheck` | TypeScript check sin emitir. |

## Estructura del repo

```
_frontend/
├── api/                 # 2 Edge Functions de Vercel: <head> por ruta y og:image
├── src/
│   ├── pages/           # 28 páginas (rutas de React Router)
│   ├── components/      # auth/, layout/, ui/
│   ├── hooks/           # useAuth, useFavorites, useSEO
│   ├── contexts/        # AuthContext
│   ├── lib/             # supabase, stripe, video clients
│   └── types/           # tipos TS compartidos
├── supabase/
│   ├── migrations/      # 42 migraciones SQL
│   └── functions/       # 8 Edge Functions (Deno)
└── docs/
    ├── ARCHITECTURE.md  # diseño de sistema y flujos
    ├── DATABASE.md      # tablas, triggers, policies
    ├── DEPLOYMENT.md    # deploy, env vars, toggles manuales
    ├── NEWSLETTER.md    # cómo se escribe la edición semanal
    ├── SEO-AUDIT.md     # auditoría medida y qué se hizo
    └── SCRAPER.md       # servicio Python de ingesta
```

## Documentación

- [Arquitectura](./docs/ARCHITECTURE.md)
- [Base de datos](./docs/DATABASE.md)
- [Despliegue](./docs/DEPLOYMENT.md)
- [Boletín semanal](./docs/NEWSLETTER.md)
- [Auditoría SEO](./docs/SEO-AUDIT.md)
- [Scraper](./docs/SCRAPER.md)
