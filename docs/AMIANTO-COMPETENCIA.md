# Investigación competitiva: cómo consiguen clientes hoy las empresas de retirada de amianto en España

Fecha: 2026-09-19. Contexto: evaluación de un directorio nacional de empresas RERA (Registro de Empresas con Riesgo de Amianto). Existen ~7.805 empresas inscritas publicadas y una estimación previa de ~1.300 realmente activas (ver `AMIANTO-DEMANDA.md`). Este documento cubre el lado de la demanda de captación: quién ocupa la búsqueda, qué cobran las plataformas de leads, si existe ya un directorio del sector, cuánto cuesta captar un cliente y qué venden las asociaciones.

**Convención de este documento**: todo dato con enlace es verificado. Todo lo que no se pudo verificar directamente lleva la etiqueta **"estimación:"** delante y explica en qué se apoya.

---

## Nota metodológica importante (leer antes de las tablas)

Se intentó automatizar la consulta real a Google (con Chromium headless vía Playwright, contra `google.com/search`) para las 24 combinaciones provincia×plantilla pedidas. **Google bloqueó todas las peticiones con una página de verificación anti-bot** ("Nuestros sistemas han detectado tráfico inusual..."), tanto para `google.com/search` como (con contenido irrelevante, señal de fallback anti-bot) para `bing.com/search`. No se pudo obtener el HTML real de una SERP de Google desde este entorno, así que **no hay datos verificados de pack de Maps ni de anuncios de Google Ads por consulta y provincia** — eso se marca como no verificable en cada tabla.

Sustitución usada, declarada explícitamente:
1. **Ranking orgánico**: se ejecutaron las 24 consultas reales contra `html.duckduckgo.com/html/` (índice de Bing, sin JavaScript, no bloqueado) con un navegador headless. Esto da una lista real de resultados orgánicos top-5 por consulta, pero **no es el ranking de Google** — el orden y la presencia de sitios puede diferir, y esta versión de DuckDuckGo no muestra anuncios ni pack de mapas. Se usa como proxy razonable de qué dominios tienen fuerza SEO en el nicho, no como sustituto exacto del SERP de Google.
2. **Presencia de anuncios de pago**: en vez de ver el SERP, se consultó el **Google Ads Transparency Center** (`adstransparency.google.com`), que si es accesible sin JS pesado y da datos reales y verificables de qué anunciantes han comprado anuncios de Google apuntando a un dominio determinado, a nivel nacional (no por consulta/provincia exacta). Se consultaron los dominios más recurrentes en el ranking orgánico.
3. **Pack de Maps / Local Pack**: no verificable desde este entorno. Se señala como limitación en cada bloque; no se inventa qué negocios aparecerían.

---

## 1. Quién ocupa la búsqueda, provincia a provincia

### Qué se ve al agregar las 24 consultas

Sobre 24 consultas (8 provincias × 3 plantillas), los dominios que se repiten en el top-5 orgánico de DuckDuckGo con más frecuencia son:

| Dominio | Apariciones en top-5 (de 24 consultas) | Apariciones en el puesto 1-3 | Qué es (verificado visitando el sitio) |
|---|---|---|---|
| `gestiondelamianto.com` (GDA, "La Plataforma del Amianto de España") | 17/24 | 6 | Empresa/operador nacional con página propia por provincia (texto casi idéntico, nombre de provincia intercambiado); en su home ofrece "Solicitar Análisis de Amianto: te encontramos una empresa cercana" — es decir, actúa también como intermediario/broker, no solo como ejecutor. **Compra Google Ads: 9 anuncios activos verificados vía Ads Transparency Center, anunciante "NJM BUSINESS GROUP SLU" (verificado por Google).** |
| `retirada-amianto.es` | 18/24 | 5 | Sitio con página por provincia con **texto plantilla casi idéntico** (mismo copy, solo cambia el nombre de la provincia) para Madrid, Barcelona, Sevilla, A Coruña, Valladolid, Badajoz y Lugo — es decir, una sola operación de páginas doorway programáticas cubriendo toda España, no una empresa local real en cada sitio. **No se encontraron anuncios en Google Ads Transparency Center para este dominio** → parece jugar solo a SEO puro. |
| `amisur-amianto.com` (AMISUR) | 11/24 | 6 | Empresa nacional (base Andalucía/Sur) con páginas por provincia. **Compra Google Ads: 5 anuncios activos verificados, anunciante "Amiantos del Sur SLU" (verificado).** |
| `desamiantado.net` | 9/24 | — | Empresa individual inscrita en RERA (según su propia web), páginas por ciudad. |
| `retiraruralita.com` | 8/24 | 3 | Empresa con sede declarada en Navarra ("Estamos en Navarra") pero páginas doorway por toda España (Madrid, Badajoz, A Coruña, Lugo...); teléfono de contacto en su home aparece como placeholder "900 000 000", indicio de plantilla no completamente configurada. |
| `paxinasgalegas.es` | 8/24 | 3 | Directorio de páginas amarillas gallego generalista (no específico de amianto), solo aparece en consultas de Galicia (A Coruña, Lugo). |
| `lomills.com` | 6/24 | — | Directorio horizontal de profesionales de la construcción (no específico de amianto) con categoría "Retirada de Amianto"; ver sección 3. |
| `construmaex.com` | 6/24 | 3 | Empresa regional de Extremadura, aparece solo en Badajoz. |
| `cronoshare.com` | 5/24 | — | Plataforma de leads horizontal; ver sección 2. |
| `urazero.es` | 6/24 | — | Empresa nacional con páginas por provincia y guías de precios. |
| `toptejados[ciudad].com` (Sevilla, Valladolid, Badajoz, Lugo) | 4 dominios distintos, uno por ciudad | 1 | Red de sitios con el mismo patrón de nombre (`toptejadosevilla.com`, `toptejadosvalladolid.com`, `toptejadosbadajoz.com`, `toptejadoslugo.com`) — programática de un operador de tejados que incluye amianto como uno de sus servicios, replicada ciudad a ciudad. |

**Lectura**: la búsqueda no está "abierta" — lleva años ocupada por 3-4 operadores nacionales que han construido páginas por provincia a base de SEO programático (mismo patrón: texto plantilla + nombre de provincia intercambiado), más una cola larga de empresas locales genuinas que solo aparecen en su propia provincia. Al menos dos de esos operadores nacionales (GDA y AMISUR) también compran Google Ads de forma activa y verificada. `retirada-amianto.es`, el dominio más omnipresente en el ranking orgánico (18/24), no compra anuncios — apuesta todo a contenido programático.

### Tablas por provincia y consulta (orgánico, DuckDuckGo, top 5 — ver limitación arriba)

### Madrid

**`retirada de amianto Madrid`**

| # | Dominio | Título |
|---|---|---|
| 1 | gestiondelamianto.com | Retirada de Amianto en Madrid - Tarifa Económica / GDA |
| 2 | retiradamiantomadrid.es | Retirada de Amianto Madrid / Empresa Certificada 100% Garantizada |
| 3 | retirar-amianto.es | Empresa especializada en retirar amianto en Madrid |
| 4 | barsal.es | Retirada de Amianto en Madrid / Empresa Certificada RERA |
| 5 | amisur-amianto.com | Retirada de amianto en Madrid - AMISUR |

**`quitar uralita Madrid`**

| # | Dominio | Título |
|---|---|---|
| 1 | retirada-uralita.com | Empresa retirada de uralita en Madrid / Certificada por RERA |
| 2 | urazero.es | Retirada de Amianto y Uralita en Madrid |
| 3 | retirada-uralita.com | Retirar uralitas de amianto en Madrid / Empresa RERA |
| 4 | retiraruralita.com | Retirar Uralita (Desamiantado) en Madrid |
| 5 | dmol.es | Retirada de uralita en Madrid - dMol España |

**`empresas autorizadas amianto Madrid`**

| # | Dominio | Título |
|---|---|---|
| 1 | sede.comunidad.madrid | Registro de empresas con riesgo amianto / Comunidad de Madrid |
| 2 | tenofransa.com | Retirada de Amianto en Madrid / Empresa Autorizada |
| 3 | barsal.es | Retirada de Amianto en Madrid / Empresa Certificada RERA |
| 4 | amisur-amianto.com | Retirada de amianto en Madrid - AMISUR |
| 5 | madridamianto.es | Retirada de Amianto Uralita Madrid |

Nota: para "empresas autorizadas" el registro oficial de la Comunidad de Madrid entra en el top-1 orgánico — es el único caso de las 24 consultas donde una fuente institucional supera a los operadores comerciales.

### Barcelona

**`retirada de amianto Barcelona`**

| # | Dominio | Título |
|---|---|---|
| 1 | gestiondelamianto.com | Retirada de Amianto en Barcelona - Tarifa Económica / GDA |
| 2 | gcamianto.com | Retirada de amianto en Barcelona (gestionan subvenciones) |
| 3 | catalunyadesamiantats.com | Retirada de amianto en Barcelona |
| 4 | amiantobarcelona.es | Retirada amianto Barcelona - Sistema Servei |
| 5 | retirada-amianto.es | Empresas de retirada de amianto en Barcelona |

**`quitar uralita Barcelona`**

| # | Dominio | Título |
|---|---|---|
| 1 | uralitabarcelona.com | Retirada de Uralita y Amianto en Barcelona |
| 2 | uralitabarcelona.com | Retirada de Uralita en Tejados y Cubiertas |
| 3 | retiradaamiant.cat | Retirada de uralita certificada y legal |
| 4 | siv.cat | Empresa retirada de amianto y uralita en Barcelona |
| 5 | **cronoshare.com** | Retirada de uralita en Barcelona |

**`empresas autorizadas amianto Barcelona`**

| # | Dominio | Título |
|---|---|---|
| 1 | gcamianto.com | Retirada de amianto en Barcelona |
| 2 | amiantobarcelona.es | Amianto Barcelona - Sistema Servei |
| 3 | catalunyadesamiantats.com | Retirada de amianto en Barcelona |
| 4 | retirada-amianto.es | Empresas de retirada de amianto en Barcelona |
| 5 | amiantobarcelona.es | Retirada amianto Barcelona |

### Sevilla

**`retirada de amianto Sevilla`**

| # | Dominio | Título |
|---|---|---|
| 1 | amisur-amianto.com | Retirada de amianto en Sevilla - AMISUR |
| 2 | retiradaamianto.com | Empresa Retirada de Amianto en Sevilla / IRC |
| 3 | ast-amianto.es | Retirada y Gestión del Amianto en Sevilla |
| 4 | gestiondelamianto.com | Retirada de Amianto en Sevilla / GDA |
| 5 | gestionintegraldeamianto.com | Desamiantado y Retirada de Amianto en Sevilla |

**`quitar uralita Sevilla`**

| # | Dominio | Título |
|---|---|---|
| 1 | toptejadosevilla.com | Retirada de Amianto - Uralita en Tejados Sevilla |
| 2 | amisur-amianto.com | Retirada de amianto en Sevilla |
| 3 | gestiondelamianto.com | Lista de Precios de Retirada de Uralita 2026 |
| 4 | grupotorresocana.com | Retirada de uralita Sevilla |
| 5 | retirada-amianto.es | Empresas de retirada de amianto en Sevilla |

**`empresas autorizadas amianto Sevilla`**

| # | Dominio | Título |
|---|---|---|
| 1 | amisur-amianto.com | Retirada de amianto en Sevilla |
| 2 | ast-amianto.es | Retirada y Gestión del Amianto en Sevilla |
| 3 | globalamianto.es | Retirada y gestión del amianto en Sevilla |
| 4 | gestionintegraldeamianto.com | Desamiantado y Retirada de Amianto en Sevilla |
| 5 | grupotorresocana.com | Retirada de amianto en Sevilla |

### A Coruña

**`retirada de amianto A Coruña`**

| # | Dominio | Título |
|---|---|---|
| 1 | alvaradogroup.es | Gestión de amianto - Alvarado Group |
| 2 | gestiondelamianto.com | Retirada de Amianto A Coruña / GDA |
| 3 | retirada-amianto.es | Retirada de amianto en A Coruña |
| 4 | laopinioncoruna.es | (noticia) Trabajos de retirada de amianto en el IES Zalaeta |
| 5 | paxinasgalegas.es | Retirada de amianto, desamiantado en A Coruña |

**`quitar uralita A Coruña`**

| # | Dominio | Título |
|---|---|---|
| 1 | **cronoshare.com** | Retirada de uralita en A Coruña |
| 2 | retiraruralita.com | Retirar Uralita (Desamiantado) en A Coruña |
| 3 | derribos.com.es | Retirar amianto uralita en A Coruña |
| 4 | alvaradogroup.es | Gestión de amianto - Alvarado Group |
| 5 | gestiondelamianto.com | Empresas de Retirada de Uralita en Galicia |

**`empresas autorizadas amianto A Coruña`**

| # | Dominio | Título |
|---|---|---|
| 1 | alvaradogroup.es | Gestión de amianto - Alvarado Group |
| 2 | retirada-amianto.es | Empresas de retirada de amianto en A Coruña |
| 3 | gestiondelamianto.com | Retirada de Amianto A Coruña / GDA |
| 4 | manuelbellorama.es | Retirada de amianto en A Coruña y Santiago |
| 5 | paxinasgalegas.es | Retirada de amianto, desamiantado en A Coruña |

### Valladolid

**`retirada de amianto Valladolid`**

| # | Dominio | Título |
|---|---|---|
| 1 | amiantovalladolid.com | Retirada de amianto en Valladolid |
| 2 | amisur-amianto.com | Retirada de amianto y sustitución de bajantes |
| 3 | visodesamianta.com | Retirada de amianto en Valladolid |
| 4 | gestiondelamianto.com | Retirada de Amianto en Valladolid / GDA |
| 5 | desamiantado.net | Retirada de amianto Valladolid |

**`quitar uralita Valladolid`**

| # | Dominio | Título |
|---|---|---|
| 1 | amiantovalladolid.com | Retirada de Uralita amianto en Valladolid |
| 2 | zeroamiantocubiertas.com | Retirar amianto/uralita en Valladolid |
| 3 | toptejadosvalladolid.com | Retirada de Amianto - Uralita en Valladolid |
| 4 | acecons.es | Retirada de Amianto en Valladolid |
| 5 | gestiondelamianto.com | Retirada de Amianto en Valladolid / GDA |

**`empresas autorizadas amianto Valladolid`**

| # | Dominio | Título |
|---|---|---|
| 1 | amiantovalladolid.com | Retirada de amianto en Valladolid |
| 2 | amiantovalladolid.com | Quiénes somos / Empresa autorizada RERA y REA |
| 3 | amisur-amianto.com | Retirada de amianto y sustitución de bajantes |
| 4 | desamiantado.net | Retirada de amianto Valladolid |
| 5 | retirada-amianto.es | Empresas de retirada de amianto en Valladolid |

### Zaragoza

**`retirada de amianto Zaragoza`**

| # | Dominio | Título |
|---|---|---|
| 1 | ecoamiant.com | Retirada de cubiertas con amianto en Zaragoza |
| 2 | amiantoaragon.com | Retirada de amianto en Zaragoza |
| 3 | amiantozaragoza.es | Retirada de amianto en Zaragoza / Ridal Gestión |
| 4 | lomills.com | Retirada Amianto Zaragoza - LoMills |
| 5 | gestiondelamianto.com | Retirada de Amianto en Zaragoza / GDA |

**`quitar uralita Zaragoza`**

| # | Dominio | Título |
|---|---|---|
| 1 | residuosruiz.es | Retirada de Uralita y Amianto en Zaragoza |
| 2 | kovareformas.es | Retirada de uralita en Zaragoza: normativa y precio |
| 3 | lacarte.es | Retirada de Uralita en Zaragoza |
| 4 | instalacioneslopez.com | Retirada de uralita - Instalaciones López |
| 5 | **cronoshare.com** | Retirada de uralita en Zaragoza |

**`empresas autorizadas amianto Zaragoza`**

| # | Dominio | Título |
|---|---|---|
| 1 | aragon.es | Riesgo de Amianto - Gobierno de Aragón |
| 2 | ecoamiant.com | Retirada de cubiertas con amianto en Zaragoza |
| 3 | retiradadeamiantoenzaragoza.com | Retirada de uralita y amianto en Zaragoza |
| 4 | itrainstalaciones.com | Retirada de amianto Zaragoza |
| 5 | lomills.com | Retirada Amianto Zaragoza - LoMills |

Nota: aquí también entra el registro autonómico oficial (`aragon.es`) en el puesto 1, como en Madrid.

### Badajoz

**`retirada de amianto Badajoz`**

| # | Dominio | Título |
|---|---|---|
| 1 | retirada-amianto.es | Empresas de retirada de amianto en Badajoz |
| 2 | construmaex.com | Retirada de Amianto/Uralita en Extremadura |
| 3 | industriasveca.net | Empresa de retirada de amianto en Badajoz |
| 4 | gestiondelamianto.com | Retirada de Amianto en Badajoz |
| 5 | industriasveca.net | Retirada de amianto en Badajoz, Extremadura |

**`quitar uralita Badajoz`**

| # | Dominio | Título |
|---|---|---|
| 1 | retiraruralita.com | Retirar Uralita (Desamiantado) en Badajoz |
| 2 | construmaex.com | Retirada de amianto en Extremadura |
| 3 | retirada-amianto.es | Empresas de retirada de amianto en Badajoz |
| 4 | toptejadosbadajoz.com | Retirada de Amianto - Uralita en Tejados Badajoz |
| 5 | construmaex.com | Retirada de Amianto/Uralita en Extremadura |

**`empresas autorizadas amianto Badajoz`**

| # | Dominio | Título |
|---|---|---|
| 1 | retirada-amianto.es | Empresas de retirada de amianto en Badajoz |
| 2 | amisur-amianto.com | AMISUR - Líderes en retirada y gestión de amianto |
| 3 | construmaex.com | Retirada de Amianto/Uralita en Extremadura |
| 4 | industriasveca.net | Empresa de retirada de amianto en Badajoz |
| 5 | industriasveca.net | Retirada de amianto en Badajoz, Extremadura |

### Lugo

**`retirada de amianto Lugo`**

| # | Dominio | Título |
|---|---|---|
| 1 | paxinasgalegas.es | Retirada de amianto, desamiantado en Lugo |
| 2 | gestiondelamianto.com | Retirada de Amianto en Lugo / GDA |
| 3 | toptejadoslugo.com | Retirada de Amianto en Tejados Lugo |
| 4 | retiradadeamianto.es | Retirar amianto en Lugo |
| 5 | branaybello.com | Retirada de amianto en Lugo |

**`quitar uralita Lugo`**

| # | Dominio | Título |
|---|---|---|
| 1 | paxinasgalegas.es | Retirada de amianto, desamiantado en Lugo |
| 2 | retiraruralita.com | Retirar Uralita (Desamiantado) en Lugo |
| 3 | toptejadoslugo.com | Retirada de Amianto en Tejados Lugo |
| 4 | retirada-amianto.es | Empresas de retirada de amianto en Lugo |
| 5 | pinturasfidalgo.com | Retirada y transporte de amianto en Lugo |

**`empresas autorizadas amianto Lugo`**

| # | Dominio | Título |
|---|---|---|
| 1 | paxinasgalegas.es | Retirada de amianto, desamiantado en Lugo |
| 2 | toptejadoslugo.com | Retirada de Amianto en Tejados Lugo |
| 3 | pinturasfidalgo.com | Retirada y transporte de amianto en Lugo |
| 4 | gestiondelamianto.com | Retirada de Amianto en Lugo / GDA |
| 5 | retirada-amianto.es | Empresas de retirada de amianto en Lugo |

### Anuncios de pago (verificado vía Google Ads Transparency Center, no por consulta sino a nivel de dominio/España)

| Dominio | Anuncios activos detectados | Anunciante verificado | Fuente |
|---|---|---|---|
| gestiondelamianto.com | 9 | NJM BUSINESS GROUP SLU (verificado por Google) | [adstransparency.google.com](https://adstransparency.google.com/?region=ES&domain=gestiondelamianto.com) |
| amisur-amianto.com | 5 | Amiantos del Sur SLU (verificado por Google) | [adstransparency.google.com](https://adstransparency.google.com/?region=ES&domain=amisur-amianto.com) |
| habitissimo.es | 30 | Habitissimo S.L. + al menos un partner ("Impermeabilizaciones y Proyectados Lufeza S.L.") anunciando hacia el dominio de Habitissimo | [adstransparency.google.com](https://adstransparency.google.com/?region=ES&domain=habitissimo.es) |
| retirada-amianto.es | 0 anuncios detectados | — | [adstransparency.google.com](https://adstransparency.google.com/?region=ES&domain=retirada-amianto.es) |
| urazero.es, cronoshare.com | No verificado — la consulta al Ads Transparency Center devolvió error 429 (límite de peticiones) tras varias consultas seguidas | — | — |

**Lectura**: al menos dos competidores directos (GDA y AMISUR) pagan Google Ads de forma activa y verificable a día de hoy, sobre el propio nombre del sector. El dominio con más presencia orgánica (`retirada-amianto.es`) no aparece comprando anuncios — juega su partida entera en SEO programático. Esto sugiere que el hueco de pago (CPC) probablemente no está saturado en la misma medida que el orgánico, pero no se puede confirmar el nivel de puja sin acceso al SERP real.

### Pack de Maps / Local Pack

**No verificable desde este entorno** (Google bloqueó el acceso automatizado con CAPTCHA). No se ofrece una estimación de qué negocios ocuparían el pack de mapas por prudencia metodológica — sería inventar un ranking, que el encargo pide explícitamente evitar. Como referencia indirecta: ninguno de los operadores nacionales de páginas-plantilla por provincia (`retirada-amianto.es`, `retiraruralita.com`, `retiradadeamianto.es`) declara una dirección física verificable en las páginas revisadas, lo que hace pensar que compiten peor en el pack de Maps (que exige una ficha de Google Business Profile local) que en el orgánico o en Ads — pero es una inferencia razonada, no un dato verificado, y se marca como tal.

---

## 2. Plataformas de leads: ¿cubren la categoría y qué cobran?

| Plataforma | ¿Cubre amianto/desamiantado? | Cómo se confirmó | Modelo de cobro al profesional | Precio documentado | Fuente |
|---|---|---|---|---|---|
| **Habitissimo** | **Sí.** Categoría dedicada "Retirar amianto - uralita", con página nacional y páginas por ciudad (Barcelona, Madrid...) | Entrado directamente: [habitissimo.es/empresas/retirar-amianto-uralita](https://www.habitissimo.es/empresas/retirar-amianto-uralita) muestra 499 profesionales listados en la categoría | Pago por lead ("solicitud de presupuesto"), no cobra comisión sobre el trabajo | Precio medio de la plataforma (no desglosado por categoría): **~12 €/contacto** de media, variable según categoría, zona y "Precios Dinámicos"; rango citado en fuentes secundarias de 10-50 €/contacto según tipo de trabajo. **No se encontró un precio específico publicado para la categoría amianto** — Habitissimo no lo desglosa públicamente por categoría en su centro de ayuda | [Centro de ayuda: ¿Cuánto cuesta cada solicitud de presupuesto?](https://soporte.habitissimo.com/hc/es/articles/203978696) |
| **Cronoshare** | **Sí.** Categoría dedicada "Retirada de uralita" / "Retirar tejado de uralita", con páginas por ciudad; apareció orgánicamente en 3 de las 24 consultas province (Barcelona, A Coruña, Zaragoza) | Entrado directamente: [cronoshare.com/servicios/retirada-de-uralita](https://www.cronoshare.com/servicios/retirada-de-uralita) | Sistema de créditos ("cronos"): el profesional paga por contactar, no por publicarse; sin cuotas fijas | Coste de contacto = **2%-15% del presupuesto estimado del trabajo**, ajustado por un "índice de calidad de la solicitud" (algoritmo interno, sin tabla pública de precios). No publica un precio fijo en euros por categoría | [Centro de ayuda: Precios de las solicitudes](https://soporte.cronoshare.com/hc/es/articles/360019653700-Precios-de-las-solicitudes) |
| **Zaask** | **Sí** (categoría propia: "Retirar tejados de uralita con amianto" e "Inspección de amianto") | Encontrado en búsqueda: [zaask.es/cuanto-cuesta/retirar-tejados-de-uralita-con-amianto](https://www.zaask.es/cuanto-cuesta/retirar-tejados-de-uralita-con-amianto), [zaask.es/inspeccion-de-amianto](https://www.zaask.es/inspeccion-de-amianto/cataluna/barcelona) | Marketplace de leads, modelo similar a Cronoshare (créditos por contacto) | No se localizó el precio exacto por lead en la categoría amianto; no estaba en el alcance original de la pregunta pero se documenta como cuarta plataforma activa en la categoría, no solicitada explícitamente | — |
| **Wolly** (Wolly Home) | **No.** Comprobado directamente entrando en el sitio: no existe categoría ni servicio de amianto/uralita; su catálogo cubre fontanería, electricidad, carpintería, pintura, albañilería, climatización, tejados (genérico, sin mención de amianto), jardinería, piscinas, mudanzas y limpieza | [wollyhome.com](https://www.wollyhome.com/) (fetch directo del sitio, búsqueda interna sin resultados de amianto) | — | — | — |
| **Certicalia** | **No como marketplace de empresas.** Funciona sobre todo como portal informativo/de trámites (proyectos de reforma, legalización de naves, demolición, eficiencia energética); menciona amianto en contenido de blog y en ayudas de rehabilitación (hasta 1.000 €/vivienda o 12.000 €/edificio), pero no se localizó una categoría de "empresas de amianto" con listado y sistema de leads como Habitissimo/Cronoshare | Búsqueda en certicalia.com; el acceso directo al buscador interno devolvió 403 | — | — | — |

### Comparación con el dato de referencia de Habitissimo

El encargo pedía localizar el equivalente al dato publicado por Habitissimo de que "el trabajo medio cuesta 12 €". Ese 12 € es una **cifra general de toda la plataforma**, no desglosada por categoría — no existe (o no está publicado) un "12 €" específico para amianto. Lo más cercano a un proxy calculable:

- **estimación**: usando la propia regla de Cronoshare (2%-15% del presupuesto del trabajo) sobre presupuestos de retirada de amianto que la misma búsqueda documentó (trabajos de tejado de uralita entre 900 € y 10.000 €, con ejemplos típicos de 4.200 €-6.000 € para una cubierta de 100-200 m²), el coste de un contacto en esa categoría rondaría aproximadamente entre **20 € y 900 €**, con un punto medio plausible en el entorno de **85-300 €** para un trabajo residencial típico de unos pocos miles de euros. Es un cálculo derivado combinando dos datos publicados (la regla % y los presupuestos medios), no un precio que Cronoshare publique directamente — tratarlo como orientativo, no como tarifa confirmada.
- Esto es coherente con la intuición del sector: un lead de amianto vale mucho más que un lead de "arreglar un grifo" (categoría que sí puede rondar los 12 € de media de Habitissimo) porque el ticket medio del trabajo es varias veces mayor.

---

## 3. ¿Existe ya un directorio de amianto?

| Sitio | Quién lo tiene | Fichas / alcance | ¿Cobra por aparecer? | ¿Mantenido? | Notas |
|---|---|---|---|---|---|
| **retirada-amianto.es** | Operador único no identificado en el sitio (sin "quiénes somos" visible; footer genérico) | Páginas idénticas por provincia (confirmado en Madrid, Barcelona, Sevilla, A Coruña, Valladolid, Badajoz, Lugo — mismo texto exacto, solo cambia el nombre de la provincia) | No es un directorio real: es un generador de leads que se presenta como si fuera una red de empresas locales, pero funciona como una única captación centralizada. No cobra por listar terceros porque no lista terceros | Sí, muy activo en SEO (18/24 en el ranking orgánico de esta investigación, el dominio más omnipresente de todos) | Es el precedente más peligroso a copiar/vigilar: demuestra que el patrón "una página por provincia con copy plantilla" funciona hoy en Google/Bing para este nicho |
| **gestiondelamianto.com (GDA)** | Empresa/operador nacional (anunciante verificado "NJM BUSINESS GROUP SLU") | Igual patrón de páginas por provincia + un flujo de "te buscamos una empresa cercana" que sugiere que también deriva trabajo a terceros como intermediario | Modelo híbrido: parece ejecutar directamente y también intermediar; no hay evidencia pública de que cobre a otras empresas por aparecer (no hay señal de que sea un marketplace abierto) | Sí, muy activo (17/24 en orgánico, 6 en top-3, 9 anuncios activos en Google Ads) | Es el competidor más fuerte identificado en esta investigación combinando SEO + SEM |
| **LoMills** | Empresa de terceros no vinculada al sector amianto — es un directorio horizontal de la construcción ("El Portal de los Profesionales de la Construcción"), con secciones de fontanería, pintura, trabajos verticales, etc. | Tiene categoría propia "Retirada de Amianto" con fichas por ciudad (confirmado Zaragoza), botón "Añadir Empresa" y sección "Cursos" y "Guía de Precios" | Existe flujo de alta de empresa ("Añadir Empresa"/"Entrar"), pero **no se pudo confirmar el precio de la ficha** — la página de precios devolvió 404 y no se localizó una tarifa pública para profesionales | Parece activo (aparece en 6/24 consultas orgánicas, incluida Zaragoza en top-4/5) | Es el directorio genérico más cercano a lo que se plantea, pero no es específico de amianto ni parece tener foco/autoridad temática en el nicho |
| **europages.es** | Europages (B2B mayorista paneuropeo, empresa de terceros) | Categorías "Desamiantado España", "Retirada de amianto España", "Descontaminación de amianto España", "Fibrocemento España" — varias decenas de empresas listadas entre categorías (no se pudo obtener un recuento único fiable) | Modelo freemium con listados PRO de pago conocido en la industria (no verificado específicamente para esta categoría) | Sí, plataforma activa y de gran escala, pero genérica — no es un directorio especializado ni pensado para el consumidor final buscando una empresa de amianto | Es un directorio B2B mayorista, no un comparador de cara al consumidor particular/comunidad de vecinos |
| **empresite.eleconomista.es** | El Economista (medio de comunicación) | Listado con categoría de actividad "RERA-AMIANTO", generado a partir de datos públicos/registrales, con subpáginas por provincia (ej. Valencia) | No, es contenido programático de un medio, no un directorio comercial con alta paga | Parece mantenido a nivel de plataforma general (El Economista), pero sin curaduría ni verificación específica del sector | Réplica automática de datos públicos, sin valor añadido de verificación de actividad real |
| **agmagalicia.com/directorio-rera** | AGM Galicia (empresa de amianto activa, competidora) | Página de contenido que enlaza a los registros oficiales de RERA de cada comunidad autónoma | No es un directorio de empresas, es una guía de enlaces a registros oficiales, con fin de posicionamiento SEO de una empresa del sector | — | Confirma que ni siquiera los propios competidores han construido un directorio neutral — solo agregan enlaces a los registros públicos como contenido |
| **Registros oficiales RERA por comunidad autónoma** | Administraciones públicas (Comunidad de Madrid, Junta de Andalucía, Junta de Extremadura, Castilla y León...) | Listados oficiales completos por CCAA, alcance total pero **sin ningún filtro de actividad real, sin fichas, sin contacto directo ni comparación** | No aplica (público) | Sí, son los registros base | Es la fuente de la que todo el mundo (incluido este proyecto) parte — pero no compite como experiencia de usuario, es un simple listado administrativo por comunidad, fragmentado en 17 sitios distintos |

**Conclusión de esta sección**: no existe hoy un directorio o comparador **neutral y específico de amianto** con enfoque de consumidor (tipo "busca tu empresa RERA, compara, contacta"). Lo que existe es: (a) 3-4 operadores que se disfrazan de "red nacional" mediante páginas-plantilla por provincia mientras en realidad son una única empresa/embudo de leads, y (b) un directorio horizontal de la construcción (LoMills) que incluye amianto como una categoría más entre decenas, sin foco. El hueco de "directorio vertical, neutral, centrado solo en amianto/RERA" parece real y no ocupado — pero el hueco de "SEO en la palabra amianto+provincia" ya está tomado por GDA y `retirada-amianto.es` desde hace tiempo, y habrá que competir contra ellos, no llegar a un campo vacío.

---

## 4. Cuánto cuesta captar un cliente aquí

No se localizó ningún estudio publicado específico de CPC o coste por lead para el sector "retirada de amianto" / "desamiantado" en España (agencias SEO/SEM, casos de éxito, informes sectoriales). Búsquedas dirigidas a casos de éxito de agencias con clientes de este nicho tampoco devolvieron resultados relevantes.

Datos de referencia que sí están publicados y pueden usarse como marco (todos explícitamente marcados como generales, no específicos del sector):

| Referencia | Dato | Fuente |
|---|---|---|
| CPC medio en Google Ads en España, todos los sectores | 0,40 €-4 € de media; hasta 8-50 € en sectores de alto valor por conversión (legal, seguros) | Búsqueda agregada sobre guías de CPC en España (fuentes genéricas de marketing, sin desglose por sector construcción) |
| Habitissimo, coste medio por lead (toda la plataforma) | ~12 €/contacto de media, hasta 50 € en categorías de mayor ticket | [Centro de ayuda Habitissimo](https://soporte.habitissimo.com/hc/es/articles/203978696) |
| Cronoshare, regla de precio por contacto | 2%-15% del presupuesto estimado del trabajo | [Centro de ayuda Cronoshare](https://soporte.cronoshare.com/hc/es/articles/360019653700-Precios-de-las-solicitudes) |
| **estimación**: coste de lead de amianto derivado combinando la regla de Cronoshare con presupuestos medios de retirada de amianto (900 €-10.000 €, típico 4.200 €-6.000 € para 100-200 m²) | orden de magnitud de **20 €-900 €** por contacto, con un punto medio plausible en **85-300 €** | Cálculo propio a partir de las dos fuentes anteriores — no es un precio publicado por nadie, es una inferencia razonada |

**Lectura para el veredicto**: dado que el ticket medio de un trabajo de amianto (varios miles de euros) es 5-20 veces mayor que el de una reparación doméstica típica (que ronda los 12 € de lead en Habitissimo), es razonable esperar que un lead cualificado en esta categoría valga considerablemente más que la media de la plataforma — probablemente en el rango de decenas a un par de cientos de euros, no de unidades de euros. Esto es una estimación razonada a partir de datos publicados por las propias plataformas, no un precio verificado directamente para esta categoría.

---

## 5. Qué venden las asociaciones

| Entidad | Tipo | ¿Publica listado de empresas? | ¿Cobra cuota? | Notas |
|---|---|---|---|---|
| **ANEDES** (Asociación [Nacional] de Empresas de Desamiantado) | Asociación profesional de empresas del sector amianto (retirada friable y no friable, transportistas autorizados, gestores finales de residuo, laboratorios de análisis, inspección/diagnóstico, proveedores, consultoras) | Tiene una sección pública "Asociados" (`anedes.org/junta/asociados/`) con nombre, representante, teléfono y email de cada empresa socia — pero **no se pudo verificar el número exacto de empresas listadas**: la petición fue bloqueada con error 429 ("Too many requests", retry-after 1h) en el momento de esta investigación | No publicada online; hay un formulario "Hazte socio" sin importe visible | Ofrece formación (certificación UNE 171370-2:2021 para inspectores de amianto), recertificación bienal, guías técnicas de censo, y hace incidencia legislativa. Es la entidad "más natural" para asociarse o para pedirles enlace, pero no está montada como directorio de cara al consumidor — es un gremio |
| **AEDED** (Asociación Española de Demolición, Descontaminación, Corte y Reciclaje) | Asociación más amplia (demolición + descontaminación de residuos peligrosos, no exclusiva de amianto) | Tiene sección "Miembros" (`aeded.org/miembros`), pero no se verificó el contenido completo en esta investigación | No publicada online; hay CTA "¡Hazte miembro!" sin importe visible | Incluye empresas de descontaminación vinculadas a amianto entre sus socios, pero el foco es más amplio (demolición y reciclaje en general) |
| **Asociaciones de víctimas del amianto** (AVIDA-Madrid, AVIDALID-Valladolid, ASVIAMIE-Euskadi y otras autonómicas) | Asociaciones de afectados/víctimas, no de empresas | **No.** Son entidades de apoyo, asesoramiento legal/sanitario y divulgación a personas afectadas — no listan empresas de retirada, y no tendría sentido que lo hicieran (su misión es la contraria: exponer el problema, no vender el servicio) | No aplica a este análisis (no es su función) | No se encontró ninguna asociación llamada literalmente "ANDEVA" en la búsqueda; existen múltiples asociaciones autonómicas de víctimas con nombres distintos. GDA (competidor comercial) mantiene una página de contenido (`gestiondelamianto.com/asociaciones-asbestos/`) que enlaza a estas asociaciones — otra pista de que los propios competidores usan el tema institucional como contenido SEO, no que las asociaciones vendan nada |
| Colegios profesionales, clústeres regionales | — | No se encontró en esta búsqueda ninguna entidad de este tipo específica del sector amianto (a diferencia de arquitectura o ingeniería, donde sí existen colegios con listados oficiales) | — | Ausencia notable: no hay un "colegio profesional del desamiantador" equivalente a un colegio de arquitectos. Esto refuerza que el vacío institucional de un listado de referencia con autoridad es real |

**Lectura**: ninguna asociación identificada vende hoy un listado público, buscable y orientado al consumidor final. ANEDES es la más cercana a lo que sería un "sello de autoridad" (publica listado de socios, ofrece formación certificada, hace incidencia legislativa), pero opera como gremio B2B/institucional, no como herramienta de captación de clientes para sus miembros — es decir, no compite directamente por el tráfico de búsqueda que sí se disputan GDA, AMISUR, retirada-amianto.es y las plataformas de leads horizontales.

---

## Fuentes principales citadas

- Registro RERA por comunidad: [Comunidad de Madrid](https://sede.comunidad.madrid/inscripciones-registro/registro-empresas-riesgo-amianto), [Junta de Andalucía](https://www.juntadeandalucia.es/organismos/empleoempresaytrabajoautonomo/areas/seguridad-salud/tramites-registros/paginas/registro-rera.html), [Junta de Extremadura](https://www.juntaex.es/w/registro-de-empresas-con-riesgo-por-amianto-de-extremadura), [Castilla y León](https://trabajoyprevencion.jcyl.es/web/es/registros/registro-empresas-riesgo-amianto.html), [Gobierno de Aragón](https://www.aragon.es/-/riesgo-de-amianto)
- [Habitissimo — categoría amianto/uralita (499 profesionales)](https://www.habitissimo.es/empresas/retirar-amianto-uralita)
- [Habitissimo — centro de ayuda, cálculo de precio por solicitud](https://soporte.habitissimo.com/hc/es/articles/203978696)
- [Cronoshare — servicio retirada de uralita](https://www.cronoshare.com/servicios/retirada-de-uralita)
- [Cronoshare — centro de ayuda, precios de las solicitudes](https://soporte.cronoshare.com/hc/es/articles/360019653700-Precios-de-las-solicitudes)
- [Zaask — retirar tejados de uralita con amianto](https://www.zaask.es/cuanto-cuesta/retirar-tejados-de-uralita-con-amianto)
- [Wolly Home](https://www.wollyhome.com/) (sin categoría de amianto, comprobado)
- [Certicalia — proyectos de demolición](https://www.certicalia.com/proyecto-de-demolicion)
- [gestiondelamianto.com (GDA)](https://gestiondelamianto.com/)
- [retirada-amianto.es](https://www.retirada-amianto.es/)
- [LoMills — profesionales de amianto](https://www.lomills.com/profesionales/retirada-amianto/)
- [Europages — desamiantado España](https://www.europages.es/empresas/espa%C3%B1a/desamiantado.html)
- [ANEDES](https://anedes.org/) y [asociados](https://anedes.org/junta/asociados/)
- [AEDED](https://www.aeded.org/asociacion/presentacion)
- Google Ads Transparency Center: [gestiondelamianto.com](https://adstransparency.google.com/?region=ES&domain=gestiondelamianto.com), [amisur-amianto.com](https://adstransparency.google.com/?region=ES&domain=amisur-amianto.com), [habitissimo.es](https://adstransparency.google.com/?region=ES&domain=habitissimo.es), [retirada-amianto.es](https://adstransparency.google.com/?region=ES&domain=retirada-amianto.es)

## Datos brutos

Los resultados crudos de las 24 consultas a DuckDuckGo (JSON) y las capturas de las páginas comprobadas están en `/tmp/claude-0/-home-user-toolsnocode/5f58734e-5900-5f67-9878-48df5f1027d1/scratchpad/rera/competencia/` (`results.jsonl`, `check1.jsonl`, `check2.jsonl`, `ads-transparency.jsonl`) — directorio de scratchpad, no persistente en el repositorio.
