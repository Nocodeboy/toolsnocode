# Resultado de la criba: doce nichos, dos supervivientes

19 de septiembre de 2026. Aplicando `NICHE-FILTER.md` a doce candidatos, todos
con registro oficial detrás y cliente empresa.

## Los doce

| Candidato | Veredicto | Muere en | Quién ocupa ya la posición |
|---|---|---|---|
| Mantenimiento de protección contra incendios | Muerto | 1 | `proteccioncontraincendioscerca.es`, `proveedores.com` y categoría propia de Habitissimo |
| **Legionela (ROESB/ROESP)** | **Vivo** | — | Nadie. Solo un operador con SEO programático, sin intermediar |
| Control de plagas (ROESB) | Muerto | 1 | `controldeplagas360.com` (+500 empresas, listados de pago) y `plagas-madrid.com` ("reenvía su caso a compañías") |
| Inspección Técnica de Edificios | Muerto | 1 | Certicalia (7.711 solicitudes acumuladas) y Cronoshare |
| Instaladores de gas habilitados | Muerto | 1 | Habitissimo, Cronoshare y Selectra a la vez |
| Organismos de Control Autorizado | Medio vivo | 1 solo en ascensores | Habitissimo ya tiene marketplace de ascensores (13.177 solicitudes). Baja tensión, térmicas y químicos, libres |
| **Laboratorios acreditados ENAC** | **Vivo** | — | Nadie en ninguna de las consultas probadas |
| Formación homologada (PRL, carnés) | Muerto | 1 | Emagister y Educaweb |
| Servicios técnicos oficiales por marca | Muerto | 1 | Los fabricantes publican localizador propio + red de intermediarios multimarca |
| Transporte con autorización ROTT | Muerto | 1 | Clicktrans (36 M€/año, 143.000 transacciones), Wtransnet, Timocom |
| Tasadoras y peritos judiciales | Muerto | 1 | ~30 tasadoras en toda España ya comparadas; seis directorios de peritos y el sistema oficial PERIT@ |
| Escuelas infantiles autorizadas | Muerto | 1 | Educoland: **41.765 centros y 12.781 profesionales** (comprobado) |

**Nueve de doce mueren en la primera pregunta.** No por falta de demanda: en
todos los casos ya existe el agregador nacional con el modelo exacto que se
pensaba montar — gratis para quien busca, de pago para quien se lista. Es la
misma muerte del amianto, repetida nueve veces.

## Lo que sí encontré al abrir el registro de ENAC

Siguiendo la regla de no fiarse del nombre de un registro, abrí el de ENAC en
vez de citarlo. Dos hallazgos:

**1. Es enumerable entero.** El desplegable de "búsqueda por empresa" contiene
las **1.753 entidades acreditadas** de una sola carga de página. No hacen falta
diecisiete registros ni ingesta sucia: se extrae en un minuto.

**2. Repite la trampa del RERA, pero se puede esquivar.** Entre esas 1.753 hay
laboratorios de servicio, organismos de inspección, certificadores,
universidades y **fábricas con laboratorio interno** que no venden nada a
terceros (ACEITES DEL SUR-COOSUR, por ejemplo). Contar entidades sería repetir
el error de contar inscripciones del RERA.

La forma correcta es contar **por servicio**, que además es como busca el
cliente. Interrogando el buscador de ENAC, entidades acreditadas por alcance:

| Servicio buscado | Entidades acreditadas | De ellas, laboratorios de ensayo |
|---|---:|---:|
| Legionella | **228** | 224 |
| Ruido | 87 | 77 (+10 de calibración) |
| Agua de consumo humano | 73 | 73 |
| Hormigón | 36 | 36 |
| Alérgenos | 25 | 25 |
| Amianto | 11 | 8 (+3 organismos de inspección) |

Y el buscador tiene filtro por comunidad autónoma, que es justo el eje que
necesitaría un directorio.

## Los dos supervivientes, y cómo se tocan

**Legionela** es el más fuerte de los doce:

- **Nadie intermedia.** Ni plataforma ni directorio de nicho.
- **Es recurrente**, no puntual como el amianto: contratos anuales de
  mantenimiento de 1.200 a 15.000 €, con un caso público real de 667.000 €.
- **La obligación alcanza a lo privado** —torres de refrigeración, agua caliente
  sanitaria, spas, hoteles, gimnasios— y sus plazos ya vencieron en enero de
  2023. Es exactamente lo contrario del amianto, donde la ley solo apretaba a lo
  público y sin sanción.
- **El registro distingue actividad**: el ROESB de Madrid publica CSV
  actualizado y de sus 770 inscripciones, 420 son servicios contratables por
  terceros y 205 tratan agua de torres.

**Laboratorios ENAC** es el segundo, con un universo más pequeño y un cliente
más sofisticado (empresas que ya tienen comerciales), pero con una fuente de
datos inmejorable: un registro nacional único, enumerable y con filtro por
comunidad.

**Y encajan.** Cumplir con la legionela son dos cosas: **quién trata** (empresa
inscrita en el ROESB) y **quién analiza** (laboratorio acreditado por ENAC, 228
de ellos). Hoy están en registros distintos, de administraciones distintas, y
nadie los ha juntado. Un sitio que conteste "quién puede tratarlo y quién puede
analizarlo en mi provincia, y cada cuánto estoy obligado" cubre la obligación
entera, no media.

## Antes de construir nada

Por orden, y parando en cuanto algo falle:

1. **Contar el mercado real de verdad**, como se hizo con el RERA: abrir los
   ROESB de Cataluña, Andalucía y Comunitat Valenciana y filtrar por actividad
   de servicios a terceros. Madrid ya está: 420.
2. **Medir cuánto absorbe ya** `controllegionela.es`, el operador con SEO
   programático en 1.796 municipios. Si ya se lo lleva todo, esto muere igual
   que el amianto.
3. **Veinte llamadas**, con la pregunta corregida: *"¿qué pagas hoy por
   conseguir un cliente y qué te falta de quien te lo trae?"*.
4. Solo entonces, el motor de `engine/` apuntando aquí.
