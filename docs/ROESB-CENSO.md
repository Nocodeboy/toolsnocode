# Cuántas empresas de legionela hay: el censo de las cuatro grandes

19 de septiembre de 2026. Segundo paso de la validación del nicho superviviente
(`CRIBA-RESULTADO.md`), con el mismo método que se usó con el amianto: abrir el
registro, entender qué cuenta y filtrar por actividad, no por inscripción.

## El resultado

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

1. **Completar el censo**: quedan trece comunidades. Con lo aprendido aquí, cada
   una son entre diez minutos (si publica datos abiertos) y una hora (si hay que
   leer un PDF por coordenadas o conducir un buscador).
2. **Medir a `controllegionela.es`**, el operador con SEO programático en 1.796
   municipios. Es el único riesgo serio y es exactamente el patrón que en
   amianto acabó siendo mortal.
3. **Cruzar con los laboratorios**: 228 entidades acreditadas por ENAC para
   legionella. Juntar "quién trata" y "quién analiza" es lo que nadie ha hecho.
4. **Veinte llamadas** a empresas catalanas —que tienen las 361 con teléfono—
   con la pregunta corregida: qué pagan hoy por conseguir un cliente y qué les
   falta de quien se lo trae.
