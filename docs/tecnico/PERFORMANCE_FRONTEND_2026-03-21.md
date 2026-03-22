# Performance frontend 2026-03-21

Documento explicativo de la tanda tecnica aplicada para mejorar fluidez al scrollear sin cambiar el diseno visual.

## Contexto

El usuario reporto que la pagina se sentia poco fluida al hacer scroll.

La consigna fue clara:

- mejorar rendimiento,
- no tocar el diseno,
- mantener la experiencia visual actual.

## Sintoma observado

La tienda no estaba rota, pero si tenia varios costos acumulados de render:

- scroll con sensacion pesada,
- repaint costoso en listados,
- hover y animaciones globales sobre muchas cards,
- algunos efectos caros en paginas largas.

No era un problema de una sola linea. Era una suma de pequenos costos en CSS y renderizado del frontend.

## Causas principales detectadas

### 1. CSS caro durante scroll

Habia varios patrones que encarecen pintura o compositing:

- `transition: all` en muchos componentes,
- animacion global de entrada sobre `.card`,
- sombras grandes repetidas en superficies abundantes,
- `backdrop-filter` en cards grandes del flujo de compra,
- `scroll-behavior: smooth` y `hover transforms` que en tactil aportan poco y cuestan mas.

Esto importa porque el navegador tiene que recalcular y repintar mas superficie cuando scroll, hover y animaciones conviven en muchas cards.

### 2. Render incremental innecesario en catalogo

En `frontend/js/catalogo.js` el listado se armaba con `insertAdjacentHTML` dentro de un loop.

Eso implica:

- mas operaciones DOM,
- mas trabajo intermedio del browser,
- peor costo cuando el grid tiene varias cards.

No cambia el look, pero si el tiempo que tarda en quedar estable el layout.

### 3. Trabajo repetido en home

En `frontend/js/home.js`, al agregar desde destacados, se volvian a pedir productos completos al backend para encontrar el item.

Eso mete:

- una llamada de red innecesaria,
- mas espera,
- mas trabajo que no aporta nada si los destacados ya estaban cargados.

### 4. Listener de scroll basico

En `frontend/js/main.js` el boton `backToTop` reaccionaba a cada evento de scroll de forma directa.

Eso no siempre rompe nada, pero suma ruido en una ruta muy sensible como el scroll.

## Cambios aplicados

## 1. Render por bloque en catalogo

Archivo:

- `frontend/js/catalogo.js`

Cambio:

- se reemplazo el armado card por card por un `map(...).join('')` y un solo `innerHTML`.

Por que mejora:

- menos escrituras al DOM,
- menos trabajo incremental,
- layout mas barato de construir.

## 2. Cache local de destacados en home

Archivo:

- `frontend/js/home.js`

Cambio:

- se guarda el listado ya cargado en `featuredProductsCache`,
- al agregar al carrito se busca ahi en vez de volver a pedir productos.

Por que mejora:

- evita una request redundante,
- baja latencia percibida,
- reduce trabajo innecesario del frontend y backend.

## 3. Scroll listener mas liviano

Archivo:

- `frontend/js/main.js`

Cambio:

- el toggle del boton `backToTop` paso a `requestAnimationFrame`,
- el listener se registro como `passive`.

Por que mejora:

- el browser puede optimizar mejor el scroll,
- se evita pelear contra el pipeline de rendering,
- baja el costo por evento.

## 4. Limpieza de efectos costosos sin tocar el look

Archivo:

- `frontend/css/style.css`

Cambios principales:

- se removio la animacion global de entrada en `.card`,
- se reemplazaron varios `transition: all` por transiciones puntuales,
- se saco `backdrop-filter` de cards grandes del flujo de compra,
- en dispositivos tactiles se desactivo:
  - `scroll-behavior: smooth`,
  - transforms hover costosos que no aportan tanto en ese contexto.

Por que mejora:

- menos propiedades a animar,
- menos repaint/compositing innecesario,
- menos costo en mobile o equipos mas justos,
- mismo lenguaje visual general.

## Que no se cambio

Para respetar la consigna, esta tanda no toco:

- estructura visual de las paginas,
- paleta,
- tipografia,
- layout general,
- jerarquia de informacion.

La idea fue optimizar implementacion, no redisenar.

## Tradeoff aceptado

La principal concesion fue sacar animaciones globales de entrada y algunos efectos pesados en contextos tactiles.

Eso significa:

- un poco menos de movimiento decorativo,
- bastante menos costo acumulado en scroll y render.

Es un tradeoff correcto porque el objetivo era fluidez, no sumar mas espectacularidad visual.

## Archivos tocados

- `frontend/js/home.js`
- `frontend/js/catalogo.js`
- `frontend/js/main.js`
- `frontend/css/style.css`

## Verificacion ejecutada

- `node --check frontend/js/home.js`
- `node --check frontend/js/catalogo.js`
- `node --check frontend/js/main.js`

## Verificacion manual recomendada

Probar scroll real en:

1. `home.html`
2. `catalogo.html`
3. `producto.html`

Mirar especialmente:

- fluidez en notebook media,
- fluidez en tactil,
- tiempo de respuesta del listado,
- sensacion de peso al bajar y subir varias veces.

## Criterio para siguientes mejoras de performance

Si todavia se siente pesada despues de esta tanda, el siguiente orden logico seria:

1. perfilar con DevTools Performance,
2. revisar sombras y blur restantes en superficies largas,
3. evaluar lazy rendering o virtualizacion parcial si el catalogo crece mucho,
4. optimizar carga de imagenes visibles y no visibles.

## Resumen corto

El problema no era una sola funcion lenta. Era acumulacion de efectos y renders caros.

La solucion aplicada fue:

- menos trabajo DOM,
- menos trabajo repetido,
- menos CSS costoso en scroll,
- misma apariencia general.
