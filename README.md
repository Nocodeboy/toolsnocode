# Toolsnocode

Directorio de herramientas no-code, expertos, tutoriales, proyectos y noticias del sector. Frontend en Vite + React + TypeScript, backend en Supabase (Postgres + Auth + Storage + Edge Functions), pagos con Stripe, pipeline de noticias via edge functions programadas por cron.

## Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router 7, `react-helmet-async` para SEO.
- **Backend**: Supabase (Postgres con RLS, Auth, Storage `uploads` bucket, Edge Functions en Deno).
- **Integraciones**: Stripe (Checkout + Webhooks), OpenAI (reescritura de noticias), DNS verification para reclamación de tools.
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
├── src/
│   ├── pages/           # 26 páginas (rutas de React Router)
│   ├── components/      # auth/, layout/, ui/
│   ├── hooks/           # useAuth, useFavorites, useSEO
│   ├── contexts/        # AuthContext
│   ├── lib/             # supabase, stripe, video clients
│   └── types/           # tipos TS compartidos
├── supabase/
│   ├── migrations/      # 31 migraciones SQL
│   └── functions/       # 6 Edge Functions (Deno)
└── docs/
    ├── ARCHITECTURE.md  # diseño de sistema y flujos
    ├── DATABASE.md      # tablas, triggers, policies
    ├── DEPLOYMENT.md    # deploy, env vars, toggles manuales
    └── SCRAPER.md       # servicio Python de ingesta
```

## Documentación

- [Arquitectura](./docs/ARCHITECTURE.md)
- [Base de datos](./docs/DATABASE.md)
- [Despliegue](./docs/DEPLOYMENT.md)
- [Scraper](./docs/SCRAPER.md)
