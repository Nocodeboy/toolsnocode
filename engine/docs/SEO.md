# La capa de SEO, explicada

Es la pieza con más valor del motor y la que más fácil es romper sin darse
cuenta. Esto es lo que hay que saber antes de tocarla.

## El problema

La aplicación es un SPA. Sin esta capa, todas las rutas devuelven el mismo
HTML: un `<div id="root"></div>` vacío y el título por defecto. Google ejecuta
JavaScript —tarde, y gastando presupuesto de rastreo que un sitio nuevo no
tiene—; Bing a medias; X, LinkedIn, Slack y WhatsApp no lo ejecutan nunca, así
que cada enlace compartido enseña el mismo título genérico.

## Cómo funciona

1. `vercel.json` reescribe cada ruta conocida a `/api/page?p=<ruta>`, pero solo
   **si falta la cabecera `x-seo-bypass`**.
2. `api/page.ts` pide el HTML de la propia aplicación **con** esa cabecera, así
   que esa segunda petición no vuelve a entrar aquí.
3. `describe(ruta)` consulta lo que haga falta y devuelve título, descripción,
   canónica, imagen, JSON-LD y un cuerpo HTML mínimo.
4. `injectHead` reescribe el `<head>` y mete ese cuerpo dentro de `#root`.
5. El cliente monta encima: `useSEO` busca por selector los mismos elementos y
   los actualiza en vez de duplicarlos, y `main.tsx` vacía `#root` de una sola
   asignación.

Falla abierto: si la base de datos no responde o la ruta no se reconoce,
devuelve el HTML original sin tocar. Lo único que cambia el código de estado es
que la fila no exista, y entonces contesta un 404 de verdad.

## Las trampas

**Vercel sirve un fichero que exista antes de mirar las reescrituras.** Con
`index.html` en la raíz del build, la portada jamás llega a esta capa y ninguna
regla lo arregla. Por eso el build lo renombra a `app.html`. Si un día la
portada vuelve a enseñar el título genérico, mira esto primero.

**El orden de las reglas manda.** La regla comodín que manda todo a
`/api/page` se queda con cualquier ruta que esté por debajo de ella, incluidas
las que deberían ir a una función.

**El cuerpo inyectado va oculto.** El navegador lo pinta antes de que arranque
la aplicación, y como no lleva clases se ve un fotograma de texto sin estilo en
cada carga. Va con `display:none` desde la cabecera y un `<noscript>` que lo
devuelve a la vista para quien no ejecuta JavaScript, que es para quien se
escribió.

**Un SPA contesta 200 a todo.** Por eso hay lista de rutas conocidas: lo que no
está en ella devuelve 404 de verdad. Sin eso, cada enlace muerto de un sitio
anterior y cada errata es una página más que el buscador cree que existe. En el
proyecto original, las 56 incidencias registradas en producción venían todas de
URLs del sitio anterior contestando 200 con una página de "no encontrado".

## Qué comprobar después de cada cambio

```bash
curl -s https://example.com/listings/<slug> | grep -E '<title>|canonical|og:image'
curl -s -o /dev/null -w '%{http_code}\n' https://example.com/listings/no-existe   # 404
curl -s https://example.com/ | grep -c 'id="seo-fallback"'                        # 1
```

Y una vez por despliegue, con un navegador de verdad: que la aplicación monta,
que el bloque oculto desaparece al montar, y que sin JavaScript se lee el
contenido.
