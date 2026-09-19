# Censo ROESB: Extremadura, Galicia, Murcia, Navarra, País Vasco, La Rioja, Ceuta y Melilla

19 de septiembre de 2026. Continuación de `ROESB-CENSO.md` (Andalucía, Cataluña,
Comunitat Valenciana, Madrid). Mismo método: abrir el registro, ver qué
actividad distingue, filtrar por esa actividad y no por la inscripción.

Ficheros descargados en
`/tmp/claude-0/-home-user-toolsnocode/5f58734e-5900-5f67-9878-48df5f1027d1/scratchpad/rera/roesb/<territorio>/`.

## Resultado (provisional, se completa según avanza)

| Territorio | Inscripciones totales | **Empresas de legionela** | Criterio | Fecha del listado |
|---|---:|---:|---|---|
| Extremadura | 139 (47 establecimientos + 92 servicios) | **57** | Sufijo `/S/L` o `/L` en el nº ROESP de "servicios" (L = legionela) | 09/05/2025 |
| La Rioja | 71 (42 establecimientos + 29 servicios) | **22** | Etiqueta `(LEG)` en el nombre de la empresa, lista de "Servicios Biocidas" | Servicios: 09/01/2026 · Establecimientos: 05/09/2025 |
| Galicia | pendiente | pendiente | pendiente | pendiente |
| Región de Murcia | pendiente | pendiente | pendiente | pendiente |
| Comunidad Foral de Navarra | pendiente | pendiente | pendiente | pendiente |
| País Vasco | pendiente | pendiente | pendiente | pendiente |
| Ceuta | pendiente | pendiente | pendiente | pendiente |
| Melilla | pendiente | pendiente | pendiente | pendiente |

## Extremadura

**Fuente:** Junta de Extremadura, ROESP (Registro Oficial de Establecimientos y
Servicios Plaguicidas), dos PDF separados: "Establecimientos" y "Servicios".
- Establecimientos: https://www.juntaex.es/documents/77055/621136/ESTABLECIMIENTOS+BIOCIDAS+DDD_ROESP.pdf
- Servicios: https://www.juntaex.es/documents/77055/621136/SERVICIOS+BIOCIDAS+DDD_ROESP.pdf
- Página: https://www.juntaex.es/w/relacion-de-establecimientos-inscritos-en-el-roesp

**Fecha:** actualizado a 9 de mayo de 2025 (ambos ficheros).

**Formato:** PDF con tabla de texto corrido (no columnas SÍ/NO), leído con
`pdfplumber.extract_text()`.

**Total de inscripciones:** 139 — 47 en "Establecimientos" (fabricación,
almacenamiento, venta; no prestan servicio a terceros) + 92 en "Servicios"
(código único tras deduplicar 93 filas, una duplicada).

**Empresas de legionela:** El propio número de registro ROESP de "Servicios"
lleva un sufijo que indica el tipo de servicio: `/S` (servicios DDD sin
legionela), `/S/L` (servicios DDD **con** legionela) o, en un caso, `/L` solo.
De los 92 servicios: 56 con `/S/L` + 1 con `/L` = **57 empresas de servicios
que pueden tratar legionela**. Es el mismo tipo de filtro que Andalucía (marca
explícita), no una inferencia por tipo de biocida.

**Teléfono/correo:** las dos listas traen teléfono; no traen correo
electrónico.

**Ficheros:** `extremadura/establecimientos.pdf`, `extremadura/servicios.pdf`
y sus `.txt` extraídos.

## La Rioja

**Fuente:** Rioja Salud, "Registro de Establecimientos y Servicios Biocidas de
La Rioja (ROESBCAR)", dos PDF separados: "Establecimientos" y "Servicios",
este último con columna "Tipo de biocida" (códigos TP).
- Establecimientos: https://www.riojasalud.es/files/content/salud-publica-consumo/sanidad-ambiental/ROESB_Establecimientos.pdf
- Servicios: https://www.riojasalud.es/files/content/salud-publica-consumo/sanidad-ambiental/ROESB_Servicios.pdf
- Página: https://www.riojasalud.es/salud-publica-consumo/sanidad-ambiental/registro-de-establecimientos-y-servicios-biocidas-de-la-rioja-roesbcar

**Fecha:** Establecimientos actualizado a 5 de septiembre de 2025; Servicios
actualizado a 9 de enero de 2026 (son dos ficheros con fechas distintas).

**Formato:** PDF de texto corrido, leído con `pdfplumber.extract_text()`.

**Total de inscripciones:** 71 — 42 establecimientos (no prestan servicio a
terceros) + 29 servicios (código único, verificado).

**Empresas de legionela:** el nombre de cada empresa de "Servicios" lleva un
sufijo entre paréntesis con las categorías que cubre: `(LEG)`, `(AMB)`,
`(ALI-AMB)`, `(ALI-AMB-LEG)`, etc. Es una marca explícita de actividad, igual
de fuerte que la de Cataluña/Andalucía. De las 29 empresas de servicios, **22
llevan `LEG` en su etiqueta** = empresas que pueden tratar legionela. La
columna "Tipo de biocida" (TP) es coherente con esto: las 22 con LEG incluyen
casi siempre TP 02 y/o TP 11 (agua de refrigeración).

**Teléfono/correo:** ambas listas traen teléfono y correo electrónico.

**Ficheros:** `la-rioja/establecimientos.pdf`, `la-rioja/servicios.pdf` y sus
`.txt` extraídos.
