# Criba de cuatro candidatos de servicios

19 de septiembre de 2026. Aplica `NICHE-FILTER.md` a cuatro candidatos nuevos
tras el cierre de amianto (`AMIANTO-VEREDICTO.md`). Los cuatro mueren en el
Paso 1 — la posición ya está ocupada — así que no se llega a los pasos 2-5 en
ninguno. Es el resultado esperable si el filtro funciona: la mitad del tiempo
se dedica a matar rápido, y aquí ha bastado con 3-4 búsquedas por candidato.

---

## 1. Servicios de asistencia técnica oficiales (SAT) por marca y provincia

**Veredicto: muerto. Paso 1.**

Busqué "servicio técnico oficial [marca] [ciudad]" para Balay/Murcia,
Vaillant/Sevilla, Bosch/Valencia y Junkers/Zaragoza. En las cuatro, la
posición está ocupada dos veces:

- **El propio fabricante ya publica el dato que el directorio quería agregar.**
  Vaillant tiene un localizador oficial —
  [serviciotecnicooficial.vaillant.es/localice-su-servicio-tecnico-oficial/localizador](https://www.serviciotecnicooficial.vaillant.es/localice-su-servicio-tecnico-oficial/localizador) —
  y Balay/BSH gestiona la asistencia directamente desde
  [balay.es/servicio-al-cliente/solicitar-asistencia-tecnica](https://www.balay.es/servicio-al-cliente/solicitar-asistencia-tecnica).
  El dato no está disperso: cada fabricante ya lo centraliza y lo pone gratis.
- **Ya hay una red de intermediarios multi-marca y multi-ciudad construida.**
  [servicio-tecnico-oficial.com/marcas/balay](https://servicio-tecnico-oficial.com/marcas/balay/)
  y el mismo dominio para Vaillant cubren decenas de marcas con delegaciones en
  Madrid, Barcelona, Valencia, Sevilla, Bilbao, etc. Verificado por fetch: es
  "una red de soporte técnico multi-marca" con delegaciones reales, no una
  ficha estática. Además hay familias enteras de dominios plantilla por
  ciudad —`servicio-autorizado-murcia.es`, `servicio-autorizado-valencia.es`,
  `servicio-autorizado-zaragoza.es`, `sat-murcia.com`, `satvalencia.es`— que
  ya hacen exactamente el SEO programático marca×ciudad que el directorio
  perseguía, y llevan años haciéndolo.

Es el mismo patrón que cerró amianto: la plataforma que se iba a montar ya
está montada, por partida doble (el fabricante como fuente oficial y una
franja de intermediarios locales como agregadores).

---

## 2. Empresas de transporte con autorización ROTT y operadores logísticos

**Veredicto: muerto. Paso 1.**

Busqué "transportista nacional contratar Zaragoza", "operador logístico
España contratar carga completa" y "empresa transporte mercancías Madrid
presupuesto". Las tres consultas las domina el mismo intermediario, y detrás
hay un segundo bloque de plataformas B2B aún más grandes:

- **Clicktrans** ocupa los primeros puestos en las tres búsquedas
  ([clicktrans.es/transporte/zaragoza](https://clicktrans.es/transporte/zaragoza/),
  [clicktrans.es/transporte/mercancias/madrid](https://clicktrans.es/transporte/mercancias/madrid/)).
  Verificado por fetch: es exactamente el modelo que se quería montar —
  "Publica tu envío por 0 €. Solicita presupuestos gratis", "Elige el mejor
  presupuesto", "Acepta el presupuesto" — y declara **36 M€ en trabajos de
  transporte anuales y +143.000 transacciones anuales**. No es un directorio,
  es el intermediario transaccional ya construido y con volumen real.
- **Wtransnet y Timocom** cubren el segmento profesional B2B que el
  directorio también apuntaba (operadores logísticos, carga completa).
  Wtransnet, fundada en 1996 e integrada en el grupo Alpega desde 2018, reúne
  a **más de 85.000 profesionales del transporte y ~350.000 ofertas de carga
  diarias**, con más de 9.000 empresas en su comunidad
  ([wtransnet.com](https://www.wtransnet.com/en-en/carriers/)). Timocom
  aporta hasta un millón de ofertas diarias en toda Europa
  ([timocom.es](https://www.timocom.es/)). Treinta años de ventaja y un
  modelo de suscripción ya asentado.

Otras plataformas secundarias (Hazmeprecio, Transeop, Mercatrans, Proveedores.com)
aparecen también en los mismos resultados, así que ni siquiera es un
duopolio: es un mercado con varios intermediarios ya rentables desde hace
años.

---

## 3. Sociedades de tasación homologadas + peritos judiciales colegiados

**Veredicto: muerto. Paso 1 — y por dos motivos distintos, uno por cada mitad del candidato.**

### Sociedades de tasación

El universo es demasiado pequeño para un directorio local: el Banco de España
homologa **del orden de 30-32 sociedades para toda España**, no miles de
fichas por provincia
([certicalia.com/blog/sociedades-tasacion-homologadas-espana](https://www.certicalia.com/blog/sociedades-tasacion-homologadas-espana),
[rankia.com](https://www.rankia.com/blog/tasacion-vivienda/2559017-tasadoras-homologadas-por-banco-espana)).
Sin fragmentación geográfica real no hay "hueco local que nadie agrega": es
una lista nacional corta que **ya publican varios sitios como ranking
comparativo con precios**: Rankia ("Mejores tasadoras homologadas... ranking,
precios y descuentos"), Arquitasa (con simulador y descuento del 20%),
Certicalia, hipotecas.me y tasvalor.com. Los propios comparadores más grandes
(Arquitasa, Valumre) ya compiten en SEO y ya ofrecen descuentos para captar
directamente al cliente final — es decir, ya gastan en la misma captación que
el directorio querría vender.

### Peritos judiciales colegiados

Aquí el hueco está más ocupado todavía. Búsquedas sobre "buscar perito
judicial por colegio/provincia" devuelven **al menos seis directorios ya
construidos**:

- [GuiaPeritoJudicial.com](https://guiaperitojudicial.com/) — dice reunir
  **2.642 peritos judiciales** de toda España.
- [Blogpericial.com](https://blogpericial.com/) — se presenta como "el mayor
  directorio de peritos de España", "número 1" del sector.
- [Todoperito.es](https://todoperito.es/) — con páginas dedicadas por
  provincia (Madrid, Barcelona, Alicante, Guadalajara...).
- [Tuperito.online](https://www.tuperito.online/) — más de 1.500
  profesionales en 80+ especialidades.
- Asociaciones profesionales con buscador propio: ASPEJURE
  ([aspejure.com/buscador-peritos](https://www.aspejure.com/buscador-peritos)),
  APEJUC en Cataluña.
- Y el propio sistema oficial: **PERIT@**, la aplicación del Ministerio de
  Justicia con la que los colegios y decanatos gestionan las listas de
  peritos designados por los tribunales
  ([administraciondejusticia.gob.es/-/perit-](https://www.administraciondejusticia.gob.es/-/perit-)).

No hace falta llegar al Paso 6 (RGPD de personas físicas) porque el nicho ya
está muerto en el Paso 1: hay competencia genérica, competencia por
especialidad y hasta la fuente oficial ya expone parte del dato a través de
las asociaciones. Si en algún momento se retoma, el aviso del encargo sigue
en pie — los peritos son personas físicas y el tratamiento de sus datos no es
el mismo que el de una empresa.

---

## 4. Escuelas infantiles y centros de educación infantil autorizados

**Veredicto: muerto. Paso 1, y a una escala que no deja margen de duda.**

Busqué "escuela infantil Getafe plazas matrícula" y "guardería privada
Sevilla plazas disponibles precio". En ambas aparecen directorios
nacionales ya construidos, no solo webs de centros individuales:

- **Educoland** — verificado por fetch: se define como "directorio de
  centros educativos en España, gratis para familias, centros y
  profesionales", con **41.759 centros educativos registrados** en todo el
  país y 809 solo en la provincia de Sevilla. Modelo de negocio: gratis para
  familias, gestión y promoción de pago para los centros — exactamente el
  modelo que se iba a montar, ya operando a escala nacional
  ([educoland.com/escuelas-infantiles/sevilla](https://www.educoland.com/escuelas-infantiles/sevilla)).
- **Micole** (Educadvisor S.L.) — verificado por fetch: listados tipo "Las 25
  mejores guarderías privadas de Sevilla ciudad" y "Las 50 mejores... de
  Sevilla" con rating, ubicación y precio por centro, más una opción
  "Anúnciate en Micole" para que los centros paguen por aparecer. Opera
  también en México, Argentina, Chile, Perú y Ecuador
  ([micole.net/sevilla/mejores-guarderias-privadas-de-sevilla](https://www.micole.net/sevilla/mejores-guarderias-privadas-de-sevilla)).
- Refuerzan el mismo hueco: `colesyguardes.es` (con página propia para
  Getafe), `yoopies.es` (marketplace de cuidado infantil con listado y
  precio por ciudad) y `paginasamarillas.es` con categoría específica de
  guardería privada por ciudad.

Con más de 41.000 fichas ya publicadas por un solo competidor y un segundo
operando en cinco países, no queda hueco de "nadie agrega esto". Y aunque no
hiciera falta llegar hasta ahí, el aviso del encargo sigue aplicando: fichas
de centros que atienden a menores y datos que las familias aportan son un
terreno de coste legal más alto (RGPD reforzado, posible tratamiento de
datos de menores), así que aunque el hueco existiera habría que sumar ese
coste antes de construir.

---

## Tabla resumen

| # | Candidato | Veredicto | Muere en | Prueba clave |
|---|---|---|---|---|
| 1 | SAT oficiales electrodomésticos/calderas | **Muerto** | Paso 1 | Fabricante (Vaillant, Balay) ya publica localizador oficial + red de intermediarios multi-marca/multi-ciudad ya montada (`servicio-tecnico-oficial.com` y familia de dominios `servicio-autorizado-*.es`) |
| 2 | Transporte ROTT / operadores logísticos | **Muerto** | Paso 1 | Clicktrans: intermediario con 36 M€/año y 143.000 transacciones/año; Wtransnet (85.000 profesionales, desde 1996) y Timocom cubren el segmento B2B |
| 3 | Tasadoras homologadas + peritos judiciales | **Muerto** | Paso 1 | Tasadoras: universo de ~30 empresas ya rankeado por Rankia/Arquitasa/Certicalia. Peritos: 6+ directorios existentes, uno con 2.642 fichas, otro autoproclamado "el mayor de España" |
| 4 | Escuelas infantiles autorizadas | **Muerto** | Paso 1 | Educoland: 41.759 centros ya en directorio nacional gratis-familia/pago-centro; Micole opera el mismo modelo en 5 países |

Los cuatro mueren en el mismo paso y por el mismo motivo genérico: en los
cuatro sectores ya existe, desde hace años, o bien el intermediario
transaccional que el directorio quería ser, o bien un agregador de fichas a
escala nacional con el modelo gratis-para-el-buscador / pago-para-el-listado
que es precisamente el modelo de negocio de un directorio. Ninguno pasa al
Paso 2.

No hay ningún candidato vivo en esta tanda; no procede segunda vuelta sobre
ninguno de los cuatro tal y como están planteados.
