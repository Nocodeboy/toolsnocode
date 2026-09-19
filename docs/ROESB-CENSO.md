# Cuántas empresas de legionela hay en España

19 de septiembre de 2026. Segundo paso de la validación del nicho superviviente
(`CRIBA-RESULTADO.md`), con el mismo método que se usó con el amianto: abrir el
registro, entender qué cuenta y filtrar por actividad, no por inscripción.

**Diecinueve territorios, dieciséis contados, 1.964 empresas.** El detalle de
cada comunidad está en `ROESB-CENSO-NORTE.md` y `ROESB-CENSO-SUR.md`; aquí va
el mapa completo.

## El censo nacional

| Comunidad | Inscripciones | **Empresas de legionela** | Cómo lo marca su registro | Calidad |
|---|---:|---:|---|---|
| Andalucía | 1.729 | **384** | Casilla `LEG.` en servicios biocidas | media |
| Cataluña | 1.216 | **361** | Actividad propia de legionelosis | alta |
| Comunitat Valenciana | 310 serv. | **286** | Tratamiento a terceros + biocida TP 02 | baja |
| Madrid | 770 | **205** | Servicios a terceros + agua de torres | media |
| Castilla y León | 557 | **104** | Columna `SERV_LEGIONELLA` | media |
| Canarias | 319 | **96** | Actividad propia a terceros | alta |
| Región de Murcia | 202 | **96** | Lista dedicada de legionelosis | alta |
| País Vasco | 259 | **88** | Actividad `Legionella` + campo terceros | alta |
| Castilla-La Mancha | 293 | **74** | Columna `LEGIONELLA` | media |
| Aragón | 235 | **70** | Actividad propia `LG` a terceros | alta |
| Extremadura | 139 | **57** | Sufijo `/L` en el número de registro | media |
| Asturias | 128 | **45** | Columna `LEGIONELLA` en servicios | media |
| Illes Balears | 71 serv. | **45** | Ámbito "prevención y control legionelosis" | alta |
| Cantabria | 102 | **27** | Columna `legionella_TP` | media |
| La Rioja | 71 | **22** | Etiqueta `(LEG)` en el nombre | media |
| Melilla | 5 serv. | **4** | Palabra "Legionella" en actividades | media |
| **16 territorios** | **6.406** | **1.964** | | |
| Galicia | 391 | *sin marca* | No distingue legionela ni tipo de biocida; **techo: 203 servicios** | — |
| Navarra | — | *sin dato* | No se localizó listado público vigente | — |
| Ceuta | — | *sin dato* | Dominio inaccesible durante toda la sesión | — |

En las tres comunidades comparables donde se puede calcular (Asturias,
Extremadura, La Rioja), las empresas de legionela son el **66% de los servicios
a terceros**. Aplicado a los 203 servicios gallegos salen ~133, y sumando una
estimación prudente para Navarra y Ceuta:

> ***Estimación del mercado nacional: unas 2.100-2.200 empresas.***

**Ocho registros marcan la legionela con su propia actividad o columna** —
Cataluña, Aragón, Canarias, Murcia, País Vasco, Balears y, con algo menos de
precisión, Castilla y León y Castilla-La Mancha. Solo la Comunitat Valenciana
obligó a caer al filtro débil (tipo de biocida TP 02, que es más amplio que
legionela), así que su 286 es el número más inflado de la tabla.

Ninguna comunidad usa el mismo criterio que otra. Ocho formas distintas de
marcar lo mismo, repartidas en PDF, Excel, HTML, datos abiertos y cuatro
buscadores con JavaScript. **Ese es exactamente el trabajo que un agregador
ahorra a quien tiene que contratar**, y la razón de que no exista.

## Las cuatro grandes, con el detalle del método

| Comunidad | Inscripciones | **Empresas de legionela** | Cómo se filtra | Fecha |
|---|---:|---:|---|---|
| Andalucía | 1.729 | **384** | Actividad `SB` (servicios biocidas) + columna `LEG.` marcada | 18/05/2023 |
| Cataluña | 1.216 | **361** | Actividad propia: *"Tractaments a tercers per a la prevenció i control de la legionel·losi"* | continuo |
| Comunitat Valenciana | 310 servicios | **286** | Actividad "Tratamiento a terceros" + tipo de biocida TP 02 | continuo |
| Madrid | 770 | **205** | Servicios a terceros + tratamiento de agua de torres | 07/09/2026 |
| **Suma de las cuatro** | | **1.236** | | |

Esas cuatro comunidades concentran aproximadamente la mitad de la actividad
económica del país. *Estimación: el mercado nacional está entre 2.000 y 2.500
empresas.* Entre dos y tres veces el del amianto (700-1.000), y con una
diferencia que importa más que el tamaño: **aquí se factura todos los años, no
una vez.**

## Lo que cada registro deja hacer, y lo que no

**Cataluña es el mejor dato de España.** Publica el ROESP como datos abiertos
en la API de Socrata, con 1.216 registros que traen actividad, tipos de biocida
(TP2, TP4, TP14, TP18, TP19), comarca, municipio, dirección, teléfono y
**coordenadas**. Y tiene una categoría de actividad dedicada a legionelosis:
361 empresas, las 361 con teléfono, todas con nombre distinto. No hay que
interpretar nada: la administración ya ha hecho la clasificación.

De esas 361, ademas 115 están también inscritas como servicios biocidas
generales y 75 como almacenistas: son empresas de control de plagas que hacen
legionela, no especialistas puros. Eso también se ve en el fichero.

**Andalucía publica un PDF de 65 páginas** con una tabla de trece columnas de
SÍ/NO, una de ellas `LEG.`. Se lee por coordenadas: localizando la `x` de la
cabecera `LEG.` (895-907 puntos) y leyendo qué marca cae debajo en cada fila.
De 1.729 inscripciones, 575 son servicios biocidas y **384 de ellas tienen la
marca de legionela**. El problema es la fecha: el fichero es de mayo de 2023.

**La Comunitat Valenciana solo tiene buscador**, sin fichero. Se deja
interrogar: seleccionando provincia y actividad "Tratamiento a terceros" y
paginando, salen 310 fichas con nombre, dirección, teléfono, correo, número de
ROESB y tipos de biocida. **286 tienen TP 02**, que es el grupo de
desinfectantes de agua bajo el que caen los tratamientos de legionela.

Aviso de comparabilidad: los cuatro criterios no son idénticos. Cataluña marca
la actividad exacta, Andalucía una casilla de legionela, Madrid el tratamiento
de agua de torres y Valencia un tipo de biocida algo más amplio. **El dato
catalán es el más estricto y el valenciano el más laxo**; el orden de magnitud
aguanta, la suma exacta no.

## Por qué esto se parece poco al RERA

| | Amianto (RERA) | Legionela (ROESB) |
|---|---|---|
| Qué cuenta el registro | Empresas *expuestas*, no proveedores | Establecimientos y servicios, **con la actividad distinguida** |
| Inscripciones que trabajan | 17% | La actividad viene marcada en el propio registro |
| Ingreso | Trabajo puntual | **Contrato anual** de 1.200 a 15.000 € |
| A quién obliga la ley | Solo público de mayor riesgo, sin sanción | Instalaciones privadas: torres, agua caliente, spas, hoteles, gimnasios |
| Plazos | 2028, y discutido | Vencidos desde enero de 2023 |
| Datos de contacto | Dispersos, muchos sin web | **Teléfono en el 100% de las fichas catalanas y valencianas** |

## Lo que falta antes de construir

Hechos ya: el censo (este documento), la medición del operador instalado
(`LEGIONELA-COMPETENCIA.md`) y la extracción de las 225 entidades acreditadas
por ENAC para el análisis.

Queda:

1. **Cerrar los tres huecos**: Galicia (pedir a Sanidade si distingue legionela,
   o cruzar sus 203 servicios con otra fuente), Navarra y Ceuta. Son 200
   empresas de 2.100: no bloquean nada, pero conviene no olvidarlos.
2. **Decidir por dónde entra el producto**: verificación ("comprueba a quién
   contratas", con el número de registro de cada ficha) o captación ("pide
   presupuesto"). En lo segundo se compite de frente contra 36.000 páginas bien
   hechas y mantenidas.
3. **Veinte llamadas.** Hay teléfono en las fichas de Cataluña, Comunitat
   Valenciana, Canarias, Balears, Asturias, Cantabria, Murcia, País Vasco,
   Castilla-La Mancha, La Rioja y Melilla. Aragón y Castilla y León no publican
   contacto. La pregunta: *qué pagas hoy por conseguir un cliente y qué te falta
   de quien te lo trae*.
