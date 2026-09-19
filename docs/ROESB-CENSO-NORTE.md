# Censo ROESB: Aragón, Asturias, Baleares, Canarias, Cantabria, Castilla y León, Castilla-La Mancha

19 de septiembre de 2026. Segundo lote del censo empezado en `ROESB-CENSO.md`
(Andalucía, Cataluña, Comunitat Valenciana, Madrid). Mismo método: abrir el
registro de cada comunidad, contar el total de inscripciones y quedarse solo
con las que prestan servicios a terceros y pueden tratar legionela, según el
mejor filtro que cada registro deje aplicar.

Ficheros descargados en:
`/tmp/claude-0/-home-user-toolsnocode/5f58734e-5900-5f67-9878-48df5f1027d1/scratchpad/rera/roesb/<comunidad>/`

## Resultado (parcial, se completa a medida que se procesa cada comunidad)

| Comunidad | Inscripciones | **Empresas de legionela** | Criterio | Fecha | Formato | Teléfono |
|---|---:|---:|---|---|---|---|
| Castilla y León | 557 | **104** | Columna `SERV_LEGIONELLA` marcada (todas también `SERV_TERCEROS`) | 02/09/2026 | PDF, 17 pág. | No |
| Castilla-La Mancha | 293 (297 filas, 4 duplicadas) | **74** | Columna `LEGIONELLA` = SI (todas también `ST` = SI, servicio a terceros) | 03/06/2025 | PDF, 12 pág. | Sí |
| Aragón | 235 | **70** | Actividad propia `LG` = "Servicios biocidas a terceros de tratamiento para la prevención y control de legionella" | 14/09/2026 | PDF, 10 pág. | No |
| Asturias | 128 (60 establecimientos + 68 servicios) | **45** | Columna `LEGIONELLA` marcada, dentro del listado de Servicios | Establec. 02/09/2022, Servicios 03/01/2025 | PDF (2 ficheros) | Sí |
| Illes Balears | 71 (solo servicios, ver aviso) | **45** | Ámbito de actuación "Prevención y control legionelosis" (actividad propia, como Cataluña) | continuo (web) | HTML (3 páginas, una por isla) | Sí |
| Canarias | *pendiente* | | | | | |
| Cantabria | *pendiente* | | | | | |

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
