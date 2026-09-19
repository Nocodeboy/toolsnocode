# Censo ROESB: Aragón, Asturias, Baleares, Canarias, Cantabria, Castilla y León, Castilla-La Mancha

19 de septiembre de 2026. Segundo lote del censo empezado en `ROESB-CENSO.md`
(Andalucía, Cataluña, Comunitat Valenciana, Madrid). Mismo método: abrir el
registro de cada comunidad, contar el total de inscripciones y quedarse solo
con las que prestan servicios a terceros y pueden tratar legionela, según el
mejor filtro que cada registro deje aplicar.

Ficheros descargados en:
`/tmp/claude-0/-home-user-toolsnocode/5f58734e-5900-5f67-9878-48df5f1027d1/scratchpad/rera/roesb/<comunidad>/`

## Resultado

| Comunidad | Inscripciones | **Empresas de legionela** | Criterio | Fecha | Formato | Teléfono |
|---|---:|---:|---|---|---|---|
| Castilla y León | 557 | **104** | Columna `SERV_LEGIONELLA` marcada (todas también `SERV_TERCEROS`) | 02/09/2026 | PDF, 17 pág. | No |
| Castilla-La Mancha | 293 (297 filas, 4 duplicadas) | **74** | Columna `LEGIONELLA` = SI (todas también `ST` = SI, servicio a terceros) | 03/06/2025 | PDF, 12 pág. | Sí |
| Aragón | 235 | **70** | Actividad propia `LG` = "Servicios biocidas a terceros de tratamiento para la prevención y control de legionella" | 14/09/2026 | PDF, 10 pág. | No |
| Asturias | 128 (60 establecimientos + 68 servicios) | **45** | Columna `LEGIONELLA` marcada, dentro del listado de Servicios | Establec. 02/09/2022, Servicios 03/01/2025 | PDF (2 ficheros) | Sí |
| Illes Balears | 71 (solo servicios, ver aviso) | **45** | Ámbito de actuación "Prevención y control legionelosis" (actividad propia, como Cataluña) | continuo (web) | HTML (3 páginas, una por isla) | Sí |
| Canarias | 319 | **96** | Actividad propia "Servicio Biocida a terceros de prevención y control de la legionelosis" (opción del buscador) | continuo (buscador) | Buscador web (JSF/PrimeFaces) | Sí |
| Cantabria | 102 | **27** | Columna `legionella_TP` marcada (dedicada, no se puede aislar "a terceros" del resto de servicios) | 25/09/2025 | PDF, 6 pág. | Sí (+ correo) |

## Fichas

### Castilla y León

- **Fuente**: Consejería de Sanidad (Sacyl), sección Biocidas —
  https://www.saludcastillayleon.es/es/biocidas — listado PDF actualizado a
  fecha `2026-09-02 ROESB WEB.pdf`
  (https://www.saludcastillayleon.es/es/biocidas.ficheros/3402777-2026-09-02%20ROESB%20WEB.pdf).
- **Formato**: PDF de 17 páginas, tabla con columnas de identidad
  (`N_ROESB`, `NOM_ENTIDAD`, `LOC_ENTIDAD`) y once columnas de actividad
  marcadas con `X`, con las cabeceras impresas en vertical:
  `ESTAB_FABRICACION`, `ESTAB_ENVASADO`, `ESTAB_ALMACENAMIENTO`,
  `ESTAB_COMERCIALIZACION`, `SERV_CORPORATIVO`, `SERV_TERCEROS`,
  `SERV_INSTALAC_FIJAS`, `SERV_USO_AMBI_IND_ALIM`, **`SERV_LEGIONELLA`**,
  `SERV_TRAT_MADERA`, `SERV_OTROS`.
- **Método**: lectura por coordenadas con `pdfplumber` (igual que Andalucía),
  localizando el `x0` de cada cabecera rotada y clasificando cada marca `X`
  de cada fila por la columna más cercana. Script:
  `castilla-y-leon/parse_cyl.py`, datos crudos en `castilla-y-leon/cyl_parsed.json`.
- **Total**: 557 inscripciones con `N_ROESB` identificable (IDs de 0001-CYL a
  0608-CYL, con huecos por bajas).
- **Filtro aplicado**: columna `SERV_LEGIONELLA` marcada con `X` — el mejor
  criterio posible, como en Andalucía. **104 empresas.** Las 104 tienen
  también marcada `SERV_TERCEROS` (ninguna es solo "corporativo"), así que el
  filtro "servicios a terceros + legionela" y "columna legionela" coinciden
  exactamente aquí.
- **Fecha del listado**: 02/09/2026 (pie del propio PDF).
- **Contacto**: el PDF **no** trae teléfono ni correo, solo nombre, localidad
  y actividades. Para llamar habría que cruzar cada razón social con otra
  fuente (registro mercantil, web propia, etc.).

### Aragón

- **Fuente**: Gobierno de Aragón, Salud Pública, sección Biocidas —
  https://www.aragon.es/salud-publica/sanidad-ambiental/biocidas — enlace
  "Empresas ROESB Aragón" (listado maestro, actualizado dinámicamente en la
  misma URL):
  https://www.aragon.es/documents/d/guest/empresas-roesb-aragon-web-pdf
- **Formato**: PDF de 10 páginas, tabla de texto (Empresa, Dirección,
  Localidad, Provincia + 7 columnas de actividad con `x`): `FB`
  (Fabricación), `EN` (Envasado), `AL` (Almacenamiento), `CO`
  (Comercialización), `IF` (Instalaciones fijas de tratamiento),
  **`LG`** — "Servicios biocidas a terceros de tratamiento para la
  prevención y control de legionella" — y `AA` (servicios corporativos o a
  terceros de aplicación ambiental/industria alimentaria). La leyenda con
  esta definición exacta está impresa al pie de cada página del propio PDF.
- **Método**: `pdfplumber`, palabras con coordenadas agrupadas por fila con
  tolerancia de 1pt en el eje vertical (el nombre de la empresa y sus marcas
  de actividad no siempre comparten el mismo `top` exacto cuando el nombre
  envuelve a dos líneas). Se descartan las líneas de pie de página
  ("Empresas autorizadas para ejercer...") que el documento repite en cada
  una de las 10 páginas, y los fragmentos residuales de nombres envueltos a
  tres líneas. Script: `aragon/parse_aragon.py`, datos crudos en
  `aragon/aragon_parsed_clean.json`.
- **Total**: 235 inscripciones (filas empresa+establecimiento; varias razones
  sociales aparecen más de una vez porque tienen más de un establecimiento
  registrado en distinta dirección, p. ej. Carnes Oviaragón con tres plantas).
- **Filtro aplicado**: columna `LG` marcada — **la actividad viene
  definida explícitamente como servicio a terceros para legionela**, el
  mejor criterio posible (igual que Cataluña). **70 empresas.**
- **Fecha del listado**: 14/09/2026 (fecha de creación del PDF, coincide con
  el texto de la página que anuncia "listado actualizado a 14/09/2026").
- **Contacto**: el PDF **no** trae teléfono ni correo, solo empresa,
  dirección, localidad y provincia.

### Principado de Asturias

- **Fuente**: Seguridad Alimentaria y Sanidad Ambiental (SAYSA), sección
  Biocidas — https://saysa.asturias.es/sanidad/biocidas — dos PDF separados,
  uno de Establecimientos y otro de Servicios:
  - Establecimientos: https://saysa.asturias.es/documents/69523/71884/ROESB-ESTABLEC+2-sept-2022.pdf
  - Servicios: https://saysa.asturias.es/documents/69523/71884/ROESB+ASTURIAS+SERVICIOS+2-sept-2022.pdf
- **Formato**: PDF de texto. El de Establecimientos (5 pág.) trae columnas
  Fabricación/Envasado/Almacenamiento/Comercialización. El de Servicios
  (4 pág.) trae columnas **DDD**, **LEGIONELLA** y **Protectores de madera**.
  Las marcas no son texto "X" sino un símbolo vectorial (curva dibujada)
  colocado sobre cada casilla — no aparece al copiar el texto del PDF ni con
  `extract_text()`, solo se ve leyendo los objetos gráficos (`page.curves`)
  del PDF y su coordenada `x0`.
- **Método**: `pdfplumber`, agrupando filas por `Nº ROESB` (patrón
  `NNN-PA-SB` o `NNN-PA-EB`) y clasificando cada curva de marca por su `x0`
  (tres columnas: `DDD`≈643, `LEGIONELLA`≈692, `MADERA`≈768) y por la fila
  más cercana en el eje vertical. Script:
  `asturias/parse_asturias_servicios.py`, datos crudos en
  `asturias/asturias_servicios_parsed.json`.
- **Total**: 128 inscripciones = 60 establecimientos (fabricación,
  envasado, almacenamiento, comercialización — no hacen tratamientos, no
  entran en el filtro de legionela) + 68 servicios (corporativo, a terceros
  o instalación fija de tratamiento, mezclados sin columna que los
  distinga).
- **Filtro aplicado**: dentro del listado de Servicios, columna
  `LEGIONELLA` marcada. **45 empresas.** Aviso: el PDF de Servicios no
  distingue dentro de sí mismo entre servicio *corporativo* (uso propio, no
  vendible) y servicio *a terceros*; las 45 son las que tienen marcada la
  casilla de legionela dentro del universo "empresas de servicios
  biocidas", que es el filtro de mejor calidad disponible aquí (nivel
  Andalucía), pero no se puede aislar con certeza absoluta la porción
  puramente corporativa dentro de esas 45.
- **Fecha del listado**: el de Establecimientos está fechado 02/09/2022
  (visiblemente desactualizado); el de Servicios —del que sale el filtro de
  legionela— está fechado 03/01/2025 en su pie de página.
- **Contacto**: ambos PDF traen **teléfono**, además de domicilio,
  población y municipio. No traen correo electrónico.

### Illes Balears

- **Fuente**: Govern de les Illes Balears, Salut Ambiental — listado
  publicado como tabla HTML directamente en la web, una página por isla:
  - Mallorca: https://www.caib.es/sites/salutambiental/es/mallorca-33681/
  - Menorca: https://www.caib.es/sites/salutambiental/es/menorca-33089/
  - Ibiza y Formentera: https://www.caib.es/sites/salutambiental/es/ibiza_y_formentera-33090/
- **Formato**: no es PDF ni buscador con JavaScript — es una tabla HTML
  estática embebida en la propia página, con columnas Núm. inscripción,
  Nombre comercial, Razón Social, Dirección (incluye teléfono), **Tipo
  actividad** ("Servicio a terceros", "Instalación fija de tratamiento", "
  Servicio biocidas a terceros") y **Ámbito de actuación**, una lista de
  actividades concretas por empresa (p. ej. "DDD", "Prevención y control
  legionelosis", "Desratización"...).
- **Método**: descarga directa del HTML (`curl`) y parseo con
  BeautifulSoup de la tabla. Script: `baleares/parse_baleares.py`, datos
  crudos en `baleares/baleares_parsed.json`.
- **Total**: 71 filas (54 Mallorca + 7 Menorca + 10 Ibiza y Formentera),
  todas con "Tipo actividad" de servicio (a terceros o instalación fija) —
  **no aparece ninguna entrada de fabricación/envasado/almacenamiento/
  comercialización pura**, así que es posible que este listado publicado
  cubra solo la parte de "servicios" del ROESB balear y no el registro
  completo (no hay enlace visible a un listado separado de
  establecimientos). Se cuenta como el total disponible.
- **Filtro aplicado**: ítem "Prevención y control legionelosis" dentro de
  "Ámbito de actuación" — **la actividad viene definida explícitamente**,
  igual de bien que en Cataluña. **45 empresas.** Las 45 tienen además
  "Tipo actividad" = servicio a terceros (ninguna es solo instalación fija
  sin ámbito de terceros), así que el filtro por actividad y por "a
  terceros" coinciden.
- **Fecha del listado**: no viene fechado en la propia página (contenido
  vivo, sin sello de "actualizado a..."); consultado el 19/09/2026.
- **Contacto**: la columna Dirección incluye **teléfono** de cada empresa.
  No trae correo electrónico.

### Canarias

- **Fuente**: buscador "RoesbWeb" del Servicio Canario de la Salud —
  https://www3.gobiernodecanarias.org/sanidad/scs/Roesb/ — sin descarga en
  PDF/Excel, solo formulario de búsqueda (JSF/PrimeFaces) con filtros de
  Provincia (obligatorio), Isla, Municipio y Actividad, más una casilla
  "Todos los registros" que ignora los filtros y devuelve el registro
  completo.
- **Formato**: buscador con JavaScript (`ui-selectonemenu` de PrimeFaces).
  El desplegable de Actividad incluye, como opción propia y explícita,
  **"Servicio Biocida a terceros de prevención y control de la
  legionelosis"** — distinta de "Servicio Biocida a terceros de
  desinfección, desinsectación y desratización" (DDD) y de su variante "...
  de carácter corporativo". Cada ficha trae Razón Social, Actividad,
  Dirección, Teléfono, Provincia, Isla, Municipio y los grupos/tipos de
  biocida (TP).
- **Método**: Chromium headless (Playwright) fijando los `<select>` de
  Provincia y Actividad por JavaScript (los desplegables reales están
  ocultos bajo el widget de PrimeFaces) y dejando disparar el evento
  `change`; se pulsa "Buscar" y se lee el número en "Centros encontrados"
  del resumen de resultados — no hizo falta paginar registro a registro
  porque ese resumen ya da el total exacto de cada consulta. Guion:
  `canarias/resultado.json` documenta los cuatro números obtenidos y el
  método.
- **Total**: **319** inscripciones (con la casilla "Todos los registros",
  que ignora cualquier filtro de provincia — se comprobó también sumando
  Las Palmas (187) + Santa Cruz de Tenerife (131) = 318, un registro de
  diferencia probablemente sin provincia asignada). Esta cifra mezcla
  establecimientos (fabricación/envasado/almacenamiento/comercialización) y
  servicios.
- **Filtro aplicado**: Provincia + Actividad = "Servicio Biocida a terceros
  de prevención y control de la legionelosis" (la provincia es obligatoria
  en el buscador, así que se consultó una vez por provincia y se sumó):
  Las Palmas 65 + Santa Cruz de Tenerife 31 = **96 empresas.** Es el
  criterio de mejor calidad posible, actividad propia y explícita de
  legionela a terceros, igual que Cataluña, Aragón y Baleares.
- **Fecha del listado**: buscador en vivo, sin fecha de corte publicada;
  consultado el 19/09/2026.
- **Contacto**: cada ficha trae **teléfono** (y a veces fax). No trae
  correo electrónico.

### Cantabria

- **Aviso de red**: el encargo advertía que Cantabria bloquea la red de
  salida de este entorno. **No fue así**: tanto `scsalud.es` como la
  descarga directa del PDF respondieron con normalidad por `curl` y
  `WebFetch`, sin necesidad de proxy adicional ni navegador headless.
- **Fuente**: Servicio Cántabro de Salud —
  https://www.scsalud.es/registro-oficial-de-establecimientos-y-servicios-biocidas-de-cantabria
  — listado único (no separa establecimientos y servicios en dos ficheros):
  https://www.scsalud.es/documents/20117/0/ESTABLECIMIENTOS%20Y%20SERVICIOS%20BIOCIDAS%20SEPTIEMBRE%202025.pdf
- **Formato**: PDF de 6 páginas, columnas `n_ROESB`, `titular`, `telefono`,
  `correo_electronico`, `municipio` y cuatro columnas de actividad: `DD`,
  `TP`, **`legionella_TP`** y `tratamiento madera`. Las marcas no son texto
  ni rectángulos rellenos, sino un check dibujado con dos trazos vectoriales
  cortos (`page.lines`) sobre cada casilla — invisibles al copiar el texto,
  solo se detectan leyendo los objetos gráficos del PDF.
- **Método**: `pdfplumber`, identificando filas por el patrón de
  `n_ROESB` (algo irregular: mezcla `0001-CTB-181`, `102-CTB-500` sin ceros
  a la izquierda y algún `127-CTB451` sin guión) y agrupando los trazos de
  cada checkmark por proximidad, clasificándolos por su `x0` en una de las
  cuatro columnas. Script: `cantabria/parse_cantabria.py`, datos crudos en
  `cantabria/cantabria_parsed.json`.
- **Total**: 102 inscripciones. De ellas, 13 no tienen ninguna de las
  cuatro columnas de actividad marcada (probablemente establecimientos
  puros: fabricantes, envasadores, distribuidores) y 89 tienen al menos una
  actividad de servicio marcada.
- **Filtro aplicado**: columna `legionella_TP` marcada. **27 empresas.**
  El documento no distingue dentro de sus columnas de servicio entre
  "corporativo" y "a terceros" (a diferencia de Aragón o Canarias, que sí
  tienen esa actividad nombrada explícitamente), así que 27 es el número de
  empresas con la casilla de legionela activada — el mejor filtro
  disponible aquí (nivel Andalucía/Castilla y León), pero sin garantía de
  que las 27 sean *todas* estrictamente "a terceros" y no alguna en uso
  corporativo interno.
- **Fecha del listado**: 25/09/2025 (pie de página del PDF, pese a que el
  nombre del fichero dice "septiembre 2025").
- **Contacto**: trae **teléfono** en el 100% de las fichas y **correo
  electrónico** en la mayoría.

### Castilla-La Mancha

- **Fuente**: Portal de Datos Abiertos de Castilla-La Mancha, dataset ROESB —
  https://datosabiertos.castillalamancha.es/dataset/registro-oficial-de-establecimientos-y-servicios-biocidas-roesb
  — recurso PDF más reciente:
  https://datosabiertos.castillalamancha.es/sites/datosabiertos.castillalamancha.es/files/roesb_clm_0.pdf
- **Formato**: PDF de 12 páginas, texto plano tabulado (no hace falta leer
  por coordenadas de trazo, pero sí alinear columnas por `x0` porque las
  cabeceras `PREVENCIÓN LEGIONELLA` / `TRATAMIENTO MADERA` están descentradas
  respecto a sus valores). Columnas de actividad: `F` (Fabricación), `E`
  (Envasado), `A` (Almacenamiento), `C` (Comercialización), `IF`
  (Instalación fija), `ST` (Servicio a terceros), `SC` (Servicio
  corporativo), una columna sin leyenda visible, y dos columnas específicas:
  **`LEGIONELLA`** (Prevención) y `MADERA` (Tratamiento).
- **Método**: `pdfplumber` extrayendo palabras con coordenadas, agrupando por
  fila (mismo `top`) y clasificando cada `SI`/`NO` por la columna más
  cercana. Script: `castilla-la-mancha/parse_clm.py`, datos crudos en
  `castilla-la-mancha/clm_parsed.json`.
- **Total**: el PDF lista 297 filas, pero 4 empresas están duplicadas
  literalmente (mismo Nº REG, misma fila, repetida dos veces en el propio
  documento: XPO Supply Chain Spain, Xportquimoil, Yonatan Maimran Lirio,
  Zoopigan). **293 empresas únicas** por número de registro.
- **Filtro aplicado**: columna `LEGIONELLA` = SI. **74 empresas.** Coincide
  exactamente con la intersección `ST=SI` (servicio a terceros) ∩
  `LEGIONELLA=SI`: las 74 con legionela marcada tienen también `ST=SI`. Hay
  144 empresas con `ST=SI` en total (servicios a terceros de cualquier tipo),
  pero solo 74 tratan legionela.
- **Fecha del listado**: 03/06/2025 (portada del PDF).
- **Contacto**: el PDF trae **teléfono** de cada empresa (columna
  `TELÉFONO`), además de domicilio, localidad y provincia. No trae correo
  electrónico.

## Aviso de comparabilidad

Como en el primer lote, los siete criterios no son idénticos entre sí:

- **Actividad propia de legionela a terceros** (el más estricto, no
  confunde corporativo con comercial): Aragón (`LG`), Illes Balears (ámbito
  "Prevención y control legionelosis") y Canarias (opción del buscador).
- **Columna/casilla de legionela dedicada, sin distinguir corporativo de a
  terceros dentro de "servicios"**: Castilla y León (`SERV_LEGIONELLA`,
  aunque aquí coincide al 100% con `SERV_TERCEROS`), Castilla-La Mancha
  (columna `LEGIONELLA`, coincide al 100% con `ST`), Asturias (columna
  `LEGIONELLA` dentro del PDF de Servicios) y Cantabria (`legionella_TP`).

Ningún registro de este lote obligó a caer al nivel más débil (TP 02 o solo
"servicios a terceros" sin filtro de legionela) — los siete tenían algún
tipo de columna o actividad de legionela dedicada, mejor situación que la
Comunitat Valenciana en el primer lote.

No se suman los totales de las siete comunidades aquí: eso corresponde al
censo nacional conjunto.
