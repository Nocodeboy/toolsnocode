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
| Aragón | *pendiente* | | | | | |
| Asturias | *pendiente* | | | | | |
| Illes Balears | *pendiente* | | | | | |
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
