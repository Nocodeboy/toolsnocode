# Fichas: cómo se llenan y cómo se mantienen

Todo lo de aquí sale de haberlo hecho mal primero sobre 3.100 fichas.

## Lo que decide si una ficha vale

**Doscientos caracteres es el suelo, no el objetivo.** En el directorio del que
sale este motor, el 69% de las fichas tenía menos de 200 caracteres de
descripción: una frase copiada de la etiqueta del propio producto. Esas páginas
no compiten por nada, y como el buscador juzga la calidad a nivel de dominio,
además arrastran a las que sí podrían.

Después de reescribir 1.429 fichas la media pasó de 228 a 678 caracteres. Lo
que hizo utilizable el texto no fue la longitud sino de dónde salía: **cada
frase se escribió leyendo la web de la ficha, no de memoria**.

## El pipeline

```bash
# 1. Lista de lo que hay que leer: un TSV de slug y URL
psql -c "\copy (select slug, website from listings where delisted_at is null) to 'sites.tsv'"

# 2. Leerlas con navegador real (atraviesa protecciones que tumban a curl)
node pipeline/render-site.mjs sites.tsv sites.jsonl 5

# 3. Escribir a partir de lo leído, y solo de lo leído
# 4. Aplicar con copia de seguridad previa de la columna que se toca
```

`fetch-site.py` hace lo mismo con `curl` y es diez veces más rápido; sirve para
la mayoría de sitios. El navegador es para el resto: páginas que pintan con
JavaScript y dominios detrás de Cloudflare. En una muestra real, `curl` sacaba
texto aprovechable del 2% de los casos difíciles y el navegador del 25%.

## Las reglas de escritura que hay que imponer

Si el texto lo escribe un modelo, estas reglas no son estilo, son lo que evita
publicar mentiras a escala:

1. **Solo lo que dice la fuente.** Ni una capacidad, ni un precio, ni un
   nombre propio que no esté en la página leída.
2. **Ningún número que no venga de la fuente.** Ni "más de 10.000 clientes" ni
   "un 40% más rápido" salidos de la nada.
3. **Ninguna palabra de folleto.** "Revolucionario", "potente", "líder del
   mercado" son ruido: ocupan la línea donde debería ir lo que hace.
4. **Decir lo que no hace o para quién no es.** Es lo que hace creíble al
   resto y lo que ayuda de verdad a quien compara.
5. **Validar antes de aplicar.** Comprobar que cada cifra y cada nombre propio
   del texto aparece en el material leído. En una tanda real, esa
   comprobación cazó frases que se habían inventado una integración.

## Verificar, no copiar

El campo más valioso de un directorio es el que nadie más se molesta en
comprobar. En el original fue el precio: el 59% de las fichas se declaraba
"freemium" porque era el valor por defecto del importador. Al leer las webs una
a una, **441 etiquetas estaban mal y 302 decían "freemium" sin tener plan
gratuito**.

Elige en tu nicho el campo equivalente —el que decide la compra y nadie
verifica— y compruébalo contra la fuente con fecha. Es lo único que un
competidor no puede copiar en una tarde.

## Mantenimiento

Un catálogo sin mantener se pudre a una velocidad medible: en seis meses,
**una ficha de cada diez** dejó de existir como se anunciaba — dominios
caducados, productos absorbidos, renombrados, o webs que ahora sirven otra
cosa.

```bash
# Barrido de enlaces de salida con navegador
node pipeline/check-links.mjs links.tsv sweep.jsonl 6
```

Al revisar, distingue tres casos y trátalos distinto:

- **404 de una URL profunda** con la raíz viva: casi siempre un enlace de
  campaña o de afiliado caducado. Se arregla apuntando al dominio, no se da
  de baja. En el original, 21 fichas —Zapier, ClickUp, Notion, Apollo— tenían
  el enlace de salida roto por esto.
- **Dominio que ahora sirve otra cosa**: baja, con el motivo escrito.
- **403 o desafío anti-bot**: no es una baja. La web está viva y te está
  bloqueando a ti.

Y la regla que ahorra disgustos: **dar de baja es marcar, no borrar**
(`delisted_at` + `delist_reason`), y siempre con copia previa de las filas que
se tocan.
