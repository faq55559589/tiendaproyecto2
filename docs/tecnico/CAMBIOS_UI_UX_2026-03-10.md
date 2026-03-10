# Cambios UI/UX Aplicados

Fecha de referencia: 2026-03-10

Este documento resume los cambios de interfaz, copy y comportamiento visual aplicados en el frontend durante la etapa de pulido posterior al despliegue inicial.

Objetivo:

- dejar registro claro de que se cambio
- entender por que se cambio
- facilitar futuras correcciones sin perder criterio

## Criterio general aplicado

Se busco mover el proyecto desde un tono de "MVP tecnico" hacia una tienda real:

- menos textos internos o de desarrollo
- mensajes mas honestos con la operacion actual
- mejor consistencia entre home, catalogo, producto y checkout
- menos friccion visual en cards, formularios y panel admin

Tambien se corrigieron varios detalles de UX funcional:

- imagenes de productos en produccion
- carga de destacados en home
- formato de telefono para Uruguay
- resumen de envio sin precio inventado
- panel admin con textos legibles y reglas de borrado mas claras

## Home

Archivos:

- `frontend/home.html`
- `frontend/js/home.js`
- `frontend/css/style.css`

Cambios principales:

- Se reescribio el hero principal con un tono mas comercial y futbolero.
- Se eliminaron textos internos como referencias a MVP o frontend.
- Se actualo la promesa de valor para que refleje mejor la tienda real.
- Se ajustaron las tarjetas de apoyo del hero:
  - envios dentro de Montevideo
  - compra simple
  - encargos por Instagram
- Se agrego CTA a Instagram en el home.
- Se mejoro la presencia visual del hero y el espaciado general.
- Se pulio la seccion de destacados para integrarse mejor con la portada.

Correccion funcional importante:

- Se elimino un script inline que reescribia todo el `body` en `home.html`.
- Ese script provocaba que la seccion de destacados quedara mostrando el spinner aunque la API respondiera bien.
- `frontend/js/home.js` se dejo mas robusto para:
  - inicializar mejor
  - manejar timeout
  - mostrar estados vacios o de error mas claros

## Catalogo

Archivos:

- `frontend/catalogo.html`
- `frontend/js/catalogo.js`
- `frontend/css/style.css`

Cambios principales:

- Se mejoro la cabecera del catalogo para que tenga mas presencia visual.
- Se alineo el selector de orden con la composicion superior.
- Se ajusto el fondo y la separacion entre bloques para que el catalogo no se vea plano.
- Se mejoro el grid general de productos.
- Se acoto la descripcion visible en cards para evitar desbordes.
- Se trabajaron alturas minimas y clamps para:
  - titulos
  - descripciones
  - alineacion de precio y CTA

Resultado buscado:

- cards mas parejas
- mejor lectura de nombres largos
- menor sensacion de "saltos" entre productos

## Producto

Archivos:

- `frontend/producto.html`
- `frontend/js/producto.js`
- `frontend/css/style.css`

Cambios principales:

- Se eliminaron elementos visuales que quedaban falsos o vacios:
  - precio tachado
  - descuento sin uso
  - bloques redundantes de beneficios
- Se reescribieron textos de apoyo para reflejar la operacion real.
- Se ajusto la seccion de relacionados a `Tambien te puede gustar`.
- Se cambio la seccion de reseñas para indicar que estara disponible proximamente.
- Se mejoro la presentacion del bloque derecho y la lectura general de la ficha.

Fallbacks de contenido:

- Cuando un producto no tiene descripcion, ya no aparece texto generico poco natural.
- Se reemplazo por mensajes mas honestos y mejor presentados.
- Tambien se mejoro el tratamiento de `specifications` cuando llega como texto libre con saltos de linea.

## Contacto

Archivos:

- `frontend/contacto.html`
- `frontend/js/main.js`

Cambios principales:

- Se corrigio el email visible a `golazofutstore@gmail.com`.
- Se agrego Instagram como canal de contacto real.
- Se elimino el numero de telefono por ahora.
- Se ajusto el copy para que coincida con:
  - encargos
  - stock
  - coordinacion dentro de Montevideo

Formulario:

- Antes el formulario simulaba envio pero no mandaba nada real.
- Ahora abre el cliente de correo del usuario mediante `mailto:` con asunto y mensaje precargados.
- Esto deja el flujo honesto mientras no exista un backend de contacto dedicado.

## Carrito

Archivos:

- `frontend/carrito.html`
- `frontend/js/carrito.js`
- `frontend/js/store.js`

Cambios principales:

- Se elimino el costo fijo de envio porque no existe una tarifa cerrada hoy.
- El resumen ahora muestra `A coordinar`.
- El total ya no suma un valor inventado.
- Se agrego copy mas alineado a la operacion real.

Mejora de claridad:

- Se distinguio mejor `Precio unitario` de `Subtotal`.
- Esto evita que se interpreten como dos cobros distintos.

## Checkout

Archivos:

- `frontend/checkout.html`
- `frontend/js/checkout.js`
- `frontend/js/store.js`

Cambios principales:

- Se reescribio el tono general para que refleje una compra coordinada y realista.
- `Ciudad` paso a `Zona / Barrio`.
- El resumen de envio ahora usa `A coordinar`.
- Se agregaron notas sobre coordinacion de entrega en Montevideo.
- Se ajustaron placeholders y ayudas del formulario.
- Se dejo `Mercado Pago` comunicado como mejora futura y no como flujo activo.

Comportamiento:

- El checkout ya no depende de un costo fijo de envio.
- El resumen usa la informacion actual del carrito y deja explicita la coordinacion manual.
- El flujo activo de pago queda centrado en Instagram / coordinacion manual.

## Confirmacion

Archivos:

- `frontend/confirmacion.html`
- `frontend/js/confirmacion.js`

Cambios principales:

- Se ajusto el copy para que no suene tecnico.
- Se alineo el mensaje post-compra con el flujo real de Instagram.
- Se mejoro la explicacion de seguimiento y coordinacion.

## Navbar y footer

Archivos:

- `frontend/js/shell.js`
- `frontend/css/style.css`

Cambios principales:

- Se mejoro el placeholder del buscador.
- Se reviso la presencia de links a Instagram para evitar redundancia.
- Se dejo Instagram en lugares donde aporta:
  - home
  - contacto
  - footer
  - algunos pasos operativos
- Se retiro la redundancia de Instagram en la navbar principal.
- Se reescribio el footer con un tono mas de marca y menos tecnico.
- Se corrigio el texto de envios para dejarlo en Montevideo y no "todo Uruguay".

## Registro, perfil y telefonos

Archivos:

- `frontend/registro.html`
- `frontend/perfil.html`
- `frontend/checkout.html`
- `frontend/js/registro.js`
- `frontend/js/perfil.js`
- `frontend/js/main.js`
- `frontend/js/store.js`

Cambios principales:

- Se unifico el formato de telefono para Uruguay.
- Se evito el formato incorrecto tipo `+598 09 ...`.
- El formateo ahora se comparte entre registro, perfil y checkout.
- Se ajustaron placeholders, `inputmode` y longitud esperada.
- En `mi perfil` se mejoro el contexto visual con:
  - explicacion del email no editable
  - ayuda del telefono para coordinacion
  - resumen de cuenta mas claro
- Se corrigieron textos y mensajes visibles en la vista de perfil.

Formato esperado:

- `099575343` -> `+598 99 575 343`
- `+59899575343` -> `+598 99 575 343`

## Mis pedidos

Archivos:

- `frontend/mis-pedidos.html`
- `frontend/js/mis-pedidos.js`

Cambios principales:

- Se cambio el foco de la pantalla desde `Pedidos confirmados` a `Historial de pedidos`.
- Se elimino un mensaje demasiado tecnico sobre backend real.
- Se mejoro el bloque superior para que funcione como vista de seguimiento.
- Se hicieron mas legibles los estados del pedido:
  - pendiente de contacto
  - confirmado
  - cancelado
  - entregado
  - expirado
- Se corrigieron textos rotos en los items del pedido.
- Se agrego ayuda contextual segun el estado del pedido.
- Para pedidos pendientes por Instagram se agrego CTA para continuar la coordinacion.
- Se ajusto la lectura de entrega para mostrar `A coordinar` cuando no hay direccion cargada.
- Se hizo una pasada final para eliminar caracteres rotos y dejar la vista en texto limpio.
- Se mejoro un poco la jerarquia visual de las cards del historial para que fecha, estado, items y total respiren mejor.

## Imagenes de productos en produccion

Archivos:

- `frontend/js/store.js`

Cambios principales:

- Se agrego normalizacion de URLs de imagen para resolver referencias viejas a `localhost`.
- El frontend ahora reescribe esas URLs al origen real del backend cuando corresponde.

Hallazgo operativo importante:

- Parte del problema de imagenes no estaba solo en frontend.
- Tambien se detecto que algunas imagenes no existian fisicamente en Railway dentro de `uploads`.
- Esto quedo como aprendizaje operativo para futuros deploys.

## Panel admin

Archivos:

- `frontend/admin-products.html`
- `frontend/admin-orders.html`
- `frontend/js/admin.js`
- `frontend/js/admin-orders.js`

Cambios principales:

- Se limpiaron textos rotos o con acentos incorrectos.
- Se mejoro el tono general del panel para que sea mas claro.
- Se corrigieron mensajes de ayuda de:
  - imagenes
  - galeria actual
  - productos sin descripcion
- Se ajusto la explicacion visible de por que un producto puede o no puede borrarse.
- En `admin-orders` se hizo una pasada adicional para:
  - mejorar lectura de estados
  - mostrar mejor entrega, vencimiento y notas
  - reforzar el flujo manual actual
  - dejar Mercado Pago como desarrollo futuro
- Se hizo una limpieza final de encoding en `admin-orders` para evitar textos con caracteres raros.
- Tambien se ajusto la composicion visual de las cards de pedido para que el bloque de resumen y acciones quede mas parejo.

## Toasts y feedback de carrito

Archivos:

- `frontend/js/store.js`
- `frontend/css/style.css`

Cambios principales:

- Se redujo el impacto visual del aviso al agregar productos al carrito.
- El toast ahora ocupa menos ancho y deja mas aire respecto al borde derecho.
- Se agrego cierre manual con boton `x`.
- Se mantuvo el autocierre para no exigir interaccion del usuario.

Regla de borrado actualizada:

- Antes: si existia cualquier referencia en `order_items`, no se podia borrar.
- Ahora:
  - si solo tiene pedidos cancelados o expirados, se puede borrar
  - si tiene pedidos activos o entregados, no se puede borrar

Esto se refleja tanto en backend como en el panel admin.

## Cambios de criterio comercial

Tambien se ajustaron varios textos para alinearlos a la operacion real:

- no prometer envios a todo Uruguay si hoy no estan definidos
- no mostrar costos de envio que no existen
- no simular formularios que no envian nada
- no usar textos tipo "MVP", "frontend alineado" o similares en la parte publica
- dar mas espacio a Instagram como canal real de coordinacion y encargos

## Lo que todavia conviene mejorar

Aunque el pulido fue grande, quedan oportunidades claras:

- revisar consistencia visual del admin
- mejorar historiales y estados post-compra
- sumar mejor snapshot historico de productos en pedidos
- revisar responsive fino en celular
- seguir puliendo mensajes vacios y de error

## Recomendacion de uso de este documento

Usar esta guia como referencia cuando:

- se quiera entender por que se cambio cierto texto o bloque
- se revise una regresion visual
- se decida la siguiente ronda de pulido UX
- se quiera separar cambios de producto real frente a cambios solo tecnicos
