# Puesta en marcha

De repositorio vacío a directorio funcionando. Media hora si las claves están a
mano.

## 1. Supabase

Crea el proyecto y aplica las migraciones en orden:

```bash
supabase link --project-ref <ref>
supabase db push          # o pega el contenido de cada .sql en el editor SQL
```

| Migración | Qué trae | ¿Opcional? |
|---|---|---|
| `0001_core.sql` | Categorías, fichas, eventos, reclamaciones, entradas de blog, errores de cliente | No |
| `0002_billing.sql` | Tablas de Stripe e incidencias | Sí, si no vas a cobrar |
| `0003_newsletter.sql` | Suscriptores y registro de envíos | Sí |
| `0004_cron.sql` | Recalcular señales cada hora y caducar la colocación de pago | Recomendada |

## 2. Variables del cliente

En Vercel y en `.env`:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon>
```

Las dos viajan al navegador y no son secretas: lo que protege los datos es la
RLS, no esconder la clave.

## 3. Funciones

```bash
# Con secreto propio o firma externa: sin verificación de JWT en la pasarela
supabase functions deploy sitemap track-event newsletter claim-notify stripe-webhook verify-listing-dns --no-verify-jwt

# Con JWT de la pasarela (se llaman con la clave anónima en la cabecera)
supabase functions deploy claims-review newsletter-send stripe-checkout stripe-portal
```

| Secreto | Para qué | Cómo se genera |
|---|---|---|
| `SITE_URL` | Origen público que anuncian el sitemap y los correos | — |
| `ENTITY_PATH` | Segmento de URL de las fichas, si no es `listings` | — |
| `ALLOWED_ORIGINS` | Lista blanca de CORS y de redirecciones de pago. Coincidencia exacta: un comodín aquí es un redirector abierto | — |
| `RESEND_API_KEY` | Envío de correo | Panel de Resend, con permiso solo de envío y restringida al dominio |
| `EMAIL_FROM` | Remitente, p. ej. `Directory <hola@example.com>` | — |
| `OPERATOR_EMAIL` | Buzón que recibe los avisos de operación | — |
| `CLAIMS_SECRET` | Autoriza `claims-review` | `openssl rand -hex 32` |
| `CLAIMS_NOTIFY_SECRET` | Autoriza `claim-notify`; el mismo valor va en el secreto de Vault `claims_notify_secret` | `openssl rand -hex 32` |
| `DIGEST_SECRET` | Autoriza el envío del boletín | `openssl rand -hex 32` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Cobro | Panel de Stripe |
| `FACET_INDEX_MIN` | Mínimo de fichas para anunciar una página de faceta (por defecto 8) | — |

```bash
supabase secrets set --project-ref <ref> SITE_URL=https://example.com RESEND_API_KEY=... 
```

## 4. Correo

Verifica el dominio en Resend y publica los registros que te dé: DKIM
(`resend._domainkey`), SPF en TXT y MX bajo `send`, y el CNAME de seguimiento.
Añade además un `_dmarc` en `p=none`. Tarda minutos, no horas.

Para que los correos de acceso (recuperar contraseña, cambio de email) salgan
de tu dominio y no del remitente compartido de Supabase —limitado a unos pocos
envíos por hora y desaconsejado para producción— configura el SMTP propio en
Authentication → SMTP: `smtp.resend.com`, puerto 465, usuario `resend`,
contraseña la misma API key.

## 5. Vercel

Importa el repositorio. Con `framework: vite` y el `vercel.json` incluido no
hay nada más que configurar, salvo sustituir `PROJECT.supabase.co` por tu
proyecto en las dos reglas que apuntan a funciones.

Comprueba después del primer despliegue, y no lo des por hecho:

```bash
curl -s https://example.com/ | grep -c 'id="seo-fallback"'        # 1
curl -s https://example.com/listings/<slug> | grep '<title>'      # el de la ficha
curl -s -o /dev/null -w '%{http_code}\n' https://example.com/no-existe   # 404
curl -s https://example.com/sitemap.xml | grep -c '<url>'         # todas
```

Si la portada devuelve el título genérico, casi siempre es que el build no
renombró `index.html` a `app.html` y Vercel está sirviendo el fichero antes de
mirar las reescrituras.

## 6. Primeras fichas

El motor no trae catálogo. Las opciones, por orden de menos a más trabajo:

1. **Importar** de un registro público o de datos abiertos, y enriquecer con
   `pipeline/render-site.mjs` leyendo la web de cada ficha.
2. **Altas de los propios interesados**, con reclamación por DNS.
3. **A mano**, que para las primeras cincuenta suele ser lo más rápido y lo que
   mejor enseña qué campos hacen falta de verdad.

Antes de publicar a escala, mira `docs/CONTENT.md`: una ficha con dos frases no
solo no posiciona, sino que arrastra al resto del dominio.
