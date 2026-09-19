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
| Galicia | 391 (188 establecimientos + 203 servicios) | **null** (techo: 203) | No hay marca de legionela ni TP; techo = todos los "servicios a terceros" (aplicación biocida + instalación fija) | continuo (CSV vivo) |
| Región de Murcia | ≥202 inscripciones-actividad (106 ambiental/alimentaria + 96 legionela; falta madera) | **96** | Lista propia "tratamientos para la prevención y control de la legionelosis" (actividad exacta, como Cataluña) | 26/06/2023 |
| Comunidad Foral de Navarra | **null** | **null** | No se ha podido localizar un listado público vigente (ver nota) | — |
| País Vasco | 259 | **88** (63 confirmadas "a terceros"; 25 sin ese dato) | Actividad `Legionella / Servicio de tratamiento` en la columna T. Servicio, cruzada con T. Actividad (Terceros/Corporativo) | enero 2026 |
| Ceuta | **null** | **null** | No se ha podido acceder a ceuta.es (ver nota) | — |
| Melilla | 5 (sección Servicios) | **4** | Palabra "Legionella" en el campo "Actividades" de cada ficha (actividad exacta) | 26/09/2024 |
| **Suma parcial verificable** | | **267** (57+22+96+88+4; Galicia y Navarra/Ceuta quedan fuera por ser techo/null) | | |

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

## Galicia

**Fuente:** Servizo Galego de Saúde (Sergas), "Listaxe de entidades inscritas
no ROESB da CA de Galicia" — una tabla Datawrapper embebida en la página, con
CSV descargable directamente (sin necesidad de buscador ni de leer PDF).
- CSV: https://datawrapper.dwcdn.net/uWZb7/53/dataset.csv
- Página: https://www.sergas.gal/Saude-publica/Listaxe-ROESB-Galicia (la URL
  "Listado-ROESB-Galicia" con `?idioma=es` redirige a esta, en gallego pero
  con el mismo dato)

**Fecha:** el fichero no trae fecha explícita; la tabla se sirve "en
continuo" desde el propio Sergas (sin PDF versionado).

**Formato:** CSV vía Datawrapper, leído con el módulo `csv` de Python. La
descarga trae 594 líneas, de las cuales 203 son filas de relleno vacías; las
391 filas reales coinciden con el "391 filas" que la propia tabla declara en
pantalla.

**Total de inscripciones:** 391, repartidas en tres tipos de establecimiento
(columna "TIPO DE ESTABLECEMENTO"):
- 188 "Establecemento biocida" (fabricación/almacenamiento/comercialización —
  no prestan servicio a terceros)
- 118 "Servizo aplicación biocida" (servicio de aplicación, con
  desplazamiento a las instalaciones del cliente)
- 85 "Instalación fixa de tratamento" (instalación fija de tratamiento —
  cámaras de fumigación, balsas de inmersión, etc.)

**Empresas de legionela: `null` (no se puede fijar un número exacto).** El
registro gallego **no distingue actividad de legionela, ni tiene columna de
tipo de biocida (TP)**: solo el tipo de establecimiento genérico de arriba.
Ni "Servizo aplicación biocida" ni "Instalación fixa de tratamento" son un
proxy fiable de legionela por sí solos (esta última, según la normativa
general de ROESB, cubre también cámaras de fumigación y balsas de inmersión
de madera, no solo tratamiento de agua). Siguiendo la regla de "contar solo
servicios a terceros y decirlo claramente": el **techo es 203** (118+85, las
dos categorías de servicio combinadas), pero es un techo generoso, no el
dato — probablemente bastantes menos de esas 203 tratan legionela.

**Teléfono/correo:** el CSV **no trae ni teléfono ni correo electrónico**,
solo dirección, municipio, provincia y código postal. Es el único de los ocho
territorios sin ningún dato de contacto en la fuente pública.

**Ficheros:** `galicia/roesb_galicia.csv` (fuente usada), más
`galicia/pagina.html`, `galicia/listado.html` y
`galicia/listado_rendered.html` (rastro de cómo se llegó hasta el CSV).

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

## Región de Murcia

**Fuente:** MurciaSalud, "Registro Oficial de Establecimientos y Servicios
Biocidas (ROESB): empresas inscritas", tres PDF separados por actividad de
servicio (no hay lista de "establecimientos" aparte, solo servicios a
terceros):
- Ambientales e industria alimentaria: https://www.murciasalud.es/archivo.php?id=217867
- **Legionela** (lista dedicada): https://www.murciasalud.es/archivo.php?id=217873
- Madera: https://www.murciasalud.es/archivo.php?id=268180 (no se pudo
  descargar, ver más abajo)
- Página: https://www.murciasalud.es/pagina.php?id=186375&idsec=841

**Fecha:** las tres listas actualizadas a 26/06/2023.

**Formato:** PDF de texto corrido, leído con `pdfplumber.extract_text()`.

**Total de inscripciones:** cada actividad tiene su propia numeración
(`NNNN-MUR-T##` para ambiental/alimentaria, `NNNN-MUR-L##` para legionela), y
una misma empresa puede aparecer en más de una lista con números distintos
(ej. AGROSANITARIO, S.L. está en ambas). Por eso "total de inscripciones" no
es una suma limpia: 106 inscripciones en la lista ambiental/alimentaria + 96
en la de legionela = 202 inscripciones-actividad verificadas, más una tercera
lista (madera) que no se pudo descargar (bloqueada por un captcha de Radware
en `archivo.php?id=268180`, tanto por curl como por navegador headless, en
varios intentos). El total real de empresas distintas del ROESB murciano es
≥202 pero no se puede fijar sin la lista de madera.

**Empresas de legionela:** la propia Consejería de Salud publica una lista
exclusiva llamada *"LISTADO DE INSCRITOS EN LA ACTIVIDAD SERVICIOS BIOCIDAS A
TERCEROS DE TRATAMIENTOS PARA LA PREVENCIÓN Y CONTROL DE LA LEGIONELOSIS"*.
Es el mismo tipo de filtro que Cataluña (actividad exacta, no inferida): 97
filas, **96 códigos de inscripción únicos** (una fila duplicada, mismo código
"1038-MUR-L09" repetido).

**Teléfono/correo:** el 100% de las fichas de las dos listas descargadas traen
teléfono y correo electrónico.

**Ficheros:** `murcia/ambiental_alimentaria.pdf`, `murcia/legionella.pdf`
(+ `.txt` extraídos) y `murcia/madera.pdf` (en realidad HTML de captcha, no
usable).

## Comunidad Foral de Navarra

**Situación: no se ha podido localizar un listado público vigente.** Navarra
regula el "Registro de Establecimientos y Servicios Plaguicidas" (Decreto
Foral y Orden Foral 126/2009 para legionela) y confirma por búsqueda que
existe un registro de empresas que hacen tratamientos de legionela, pero:

- Los enlaces antiguos a los PDF ("ListadoRamaB.pdf", "ListadoRamaC.pdf",
  bajo `www.navarra.es/NR/rdonlyres/...` y `movil.navarra.es/NR/rdonlyres/...`)
  devuelven **502 Bad Gateway** de forma consistente: son URLs del sitio
  antiguo (pre-Liferay) ya retirado.
- Las dos páginas de trámite vigentes —
  https://www.navarra.es/es/tramites/on/-/line/Registro-de-Establecimientos-y-Servicios-Plaguicidas
  y
  https://www.navarra.es/es/tramites/on/-/line/Autorizacion-de-la-inscripcion-en-el-Registro-de-Establecimientos-y-Servicios-Plaguicidas-Ramas-B-y-C-de-la-Seccion-de-Servicios —
  solo enlazan formularios de solicitud/renovación, no un listado de
  inscritos.
- Un enlace indexado por buscadores,
  `https://www.navarra.es/documents/48192/6693540/Listado+de+empresas+registradas.pdf`,
  sí carga (HTTP 200), pero **su contenido no es el ROESB**: es el registro de
  empresas de excavación/obra civil del Decreto Foral 23/2011 (residuos de
  construcción). Se ha guardado igualmente, renombrado
  `navarra/NO_USAR_listado_construccion_no_es_biocidas.pdf`, para dejar
  constancia de que ese ID de documento no sirve.
- El buscador interno de navarra.es (`/es/buscador/...`), probado con varias
  combinaciones de términos, no devuelve ningún PDF de listado de biocidas o
  legionela.

**Siguiente paso recomendado:** pedirlo directamente al Instituto de Salud
Pública y Laboral de Navarra, Sección de Sanidad Ambiental — teléfono 848 423
459, correo ispsanam@navarra.es (dato de contacto público, no de una empresa).

**Total de inscripciones:** `null`. **Empresas de legionela:** `null`.

## País Vasco

**Fuente:** Gobierno Vasco / Euskadi.eus, Excel único "ROESB-CAPV" con las
tres provincias (Araba, Bizkaia, Gipuzkoa) y columnas de actividad — el mejor
dato después de Cataluña.
- Fichero: https://www.euskadi.eus/contenidos/informacion/sanidad_ambiental_quimicos/es_def/adjuntos/ROESB-CAPV-enero-2026.xlsx
- Página: https://www.euskadi.eus/informacion/productos-quimicos-salud-ambiental/web01-a2ingsan/es/

**Fecha:** actualizado a enero de 2026.

**Formato:** Excel (.xlsx), leído con `openpyxl`.

**Total de inscripciones:** 259 filas (empresas/establecimientos).

**Empresas de legionela:** el Excel trae una columna "T. Servicio" con
actividades combinadas (p. ej. "Legionella / Servicio de tratamiento", o esa
misma combinada con "Uso ambiental o industria alimentaria", fabricación,
etc.) y otra columna "T. Actividad" con los valores `Terceros`, `Corporativo`
o `Terceros y corporativo` — el filtro que la propia hoja hace del
mandato "quedarse solo con las que prestan servicios a terceros". Cruzando
ambas:
- **88 filas** tienen "Legionella" dentro de "T. Servicio" (actividad
  específica, no inferida por tipo de biocida).
- De esas 88, **63 tienen T. Actividad = Terceros o Terceros y corporativo**
  (confirmado a terceros) y **0 son solo "Corporativo"** (ninguna se
  excluiría por ser exclusivamente uso interno).
- Las **25 restantes no tienen dato en T. Actividad** (campo vacío en la
  fuente, no un valor "Corporativo"), así que no se pueden confirmar ni
  descartar con la información publicada.

Por eso se reporta como **88 empresas con actividad de legionela** (el dato
más parecido al criterio de Cataluña/Murcia), señalando que **63 de ellas
están además confirmadas como "a terceros"** en el propio Excel y las otras
25 quedan sin ese dato adicional.

**Teléfono/correo:** el fichero trae teléfono, fax y correo electrónico para
la práctica totalidad de las filas.

**Fichero:** `pais-vasco/roesb-capv.xlsx`.

## Ceuta

**Situación: no se ha podido acceder al sitio.** El dominio `ceuta.es`
—donde plausiblemente estaría el listado, siguiendo el mismo patrón que
Melilla (ver más abajo)— **rechazó la conexión de forma sistemática** durante
toda la sesión: `curl` devuelve `Recv failure: Connection reset by peer` en
todos los intentos (varias páginas, con y sin user-agent) y `WebFetch`
devuelve `503 Service Unavailable`; un navegador headless (Playwright) a
través del proxy de la sesión también falla ("upstream request failed"). No
es un bloqueo de user-agent puntual: es el dominio entero.

Por búsqueda no se ha encontrado ningún PDF, Excel o página de terceros que
reproduzca un listado ROESB de Ceuta, ni una norma local (BOCCE) que cree
explícitamente el registro, a diferencia de Melilla.

**Total de inscripciones:** `null`. **Empresas de legionela:** `null`.
**Siguiente paso recomendado:** reintentar el acceso a `ceuta.es` desde otra
red/sesión, o llamar directamente a la Consejería de Sanidad y Consumo de la
Ciudad Autónoma de Ceuta.

## Melilla

**Fuente:** Ciudad Autónoma de Melilla, página "Empresas inscritas en el
Registro Oficial de Establecimientos y Servicios Biocidas de la Ciudad
Autónoma de Melilla" — es la ciudad, no el Estado, quien lo gestiona y
publica, igual que en las comunidades autónomas.
- URL: https://www.melilla.es/melillaportal/contenedor.jsp?seccion=s_fdes_d4_v1.jsp&contenido=12483&nivel=1400&tipo=6

**Fecha:** actualizado a 26 de septiembre de 2024.

**Formato:** página HTML (fichas de texto, sin PDF ni Excel).

**Total de inscripciones:** 5 empresas en la "Sección Servicios" (no se ha
encontrado una sección separada de "establecimientos"; puede que no exista o
que esté en otra pestaña no localizada).

**Empresas de legionela:** cada ficha trae un campo "Actividades" en texto
libre que dice explícitamente qué trata la empresa. **4 de las 5** mencionan
"Legionella" de forma expresa:
- ALMAPE CONTROL AMBIENTAL, S.L. — "Tratamientos a terceros de DDD y
  Legionella" (ROESB 0012-052-SDL)
- HIGICONTROL MELILLA, S.L. — "Tratamientos a terceros de DDD y Legionella"
  (ROESB 0009-052-SD)
- PLAGUIMEL, S.L. — "Tratamientos a terceros DDD y Legionella" (ROESB
  0010-052-SDL)
- MENOS PLAGAS MELILLA — "Tratamientos a terceros de DDD, Legionella y
  tratamientos para Madera" (ROESB 014-052-SDL)

La quinta, TECNOBIO MELILLA, solo declara "Tratamientos a terceros de
Desinfección" (ROESB 0013-052-STD), sin mención de legionela, y se excluye.

**Teléfono/correo:** las 5 fichas traen teléfono; 2 de las 5 traen correo
electrónico (PLAGUIMEL y MENOS PLAGAS MELILLA).

**Fichero:** `melilla/pagina.html` (y extracto en `melilla/servicios.txt`).
