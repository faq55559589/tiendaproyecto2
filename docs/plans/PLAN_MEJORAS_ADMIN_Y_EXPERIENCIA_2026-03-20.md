# Plan de Mejoras Admin y Experiencia

Fecha: 2026-03-20

## Objetivo

Definir una mejora corta y pragmaticamente ejecutable para el panel admin y la experiencia general del frontend, sin abrir una reescritura del proyecto ni romper el cierre MVP.

## Alcance

- Mejoras visuales con impacto operativo real.
- Mejoras de implementacion para bajar fragilidad, duplicacion y friccion.
- Prioridad alta sobre:
  - admin de productos,
  - admin de pedidos,
  - navegacion y estados compartidos.
- Extensiones aprobadas por usuario para sumar al roadmap:
  - foto de perfil de usuario,
  - reseñas funcionales para usuarios logueados,
  - comentarios asociados a reseñas con formato de hilo acotado.

## Diagnostico actual

### Lo que ya esta bien

- El admin ya esta protegido por rol.
- El flujo operativo principal existe:
  - productos,
  - pedidos,
  - estados de pedido,
  - bloqueo de borrado con historial.
- La QA funcional del admin pasa.

### Huecos visuales detectados

1. El admin de productos y pedidos se siente funcional, pero no todavia como una consola operativa unificada.
   - `frontend/admin-products.html`
   - `frontend/admin-orders.html`

2. Hay varios textos con encoding roto o inestable en vistas admin.
   - aparecen cadenas como `GestiÃ³n`, `imÃ¡genes`, `catÃ¡logo`, `sesion`.

3. La jerarquia visual del admin todavia depende demasiado de cards largas y bloques uniformes.
   - cuesta escanear rapido que esta pendiente, que esta en riesgo y que requiere accion inmediata.

4. Falta una capa de feedback de accion mas clara.
   - hay toast y alerts, pero no estados visibles por boton, ni indicadores de guardado, refresco o accion en progreso.

5. En mobile, el admin mezcla formulario, filtros y listados largos en una misma lectura.
   - operable, pero pesado para trabajo real desde telefono.

### Huecos de implementacion detectados

1. El frontend admin repite logica entre archivos.
   - guard de sesion admin,
   - notices,
   - toasts,
   - fetch + reload completo.
   - `frontend/js/admin.js`
   - `frontend/js/admin-orders.js`

2. Hay inconsistencia de superficie API para admin.
   - listado por `/api/admin/products`
   - create/update/delete por `/api/products`
   - esto funciona, pero hace mas dificil leer y mantener el contrato.
   - estado posterior:
     - el camino recomendado ya pasa a `/api/admin/products` para CRUD completo,
     - las rutas viejas quedan solo por compatibilidad temporal.

3. El admin recarga listas completas despues de casi cualquier accion.
   - es simple, pero genera costo visual y tecnico innecesario.

4. Los scripts QA historicos estaban partidos en bootstrap de dependencias.
   - ya se corrigio para `qa_cierre_mvp` y `qa_fase2_mvp`,
   - conviene consolidar este criterio para no reabrir la misma falla.

5. La capa de UI compartida todavia no abstrae patrones del admin.
   - hoy shell, alerts y helpers existen, pero el admin no tiene una base comun clara.

6. Perfil de usuario aun sin soporte real para avatar.
   - hoy `perfil.html` muestra un icono fijo.
   - backend y esquema `users` no exponen `avatar_url`.

7. Reseñas y comentarios no existen como feature real.
   - la pestaña de reseñas en producto es un placeholder.
   - no hay tablas, rutas ni reglas de moderacion para reviews/comments.

## Principios del plan

1. No reescribir stack.
2. Priorizar mejoras visibles que reduzcan errores operativos.
3. Mover duplicacion a utilidades compartidas solo cuando haya dos o mas usos claros.
4. Mantener compatibilidad con el flujo actual de pedidos por Instagram.
5. No meter features nuevas de negocio antes de ordenar experiencia y estructura.
6. Si se abre social proof, hacerlo con reglas simples y defensibles.

## Plan propuesto

## Fase 1. Higiene visual y coherencia del admin

### Objetivo

Dejar el panel admin legible, consistente y rapido de escanear.

### Cambios

1. Limpiar encoding roto en vistas admin y textos compartidos.
   - `frontend/admin-products.html`
   - `frontend/admin-orders.html`
   - `frontend/js/admin.js`
   - `frontend/js/admin-orders.js`

2. Unificar encabezado de admin.
   - mismo patron visual para:
     - titulo,
     - subtitulo,
     - acciones rapidas,
     - resumen del estado.

3. Reforzar jerarquia de informacion en pedidos.
   - separar visualmente:
     - estado,
     - vencimiento,
     - cliente,
     - accion principal.

4. Reforzar jerarquia de informacion en productos.
   - mostrar mas claro:
     - activo/inactivo,
     - stock,
     - historial bloqueante,
     - cantidad de imagenes.

5. Ajustar mobile del admin.
   - filtros primero,
   - acciones primarias visibles,
   - tarjetas menos densas.

### Resultado esperado

- Menos friccion visual.
- Menos lectura innecesaria para operar.
- Menos percepcion de panel "hecho por partes".

## Fase 2. UX operativa del admin

### Objetivo

Reducir errores de operacion y hacer mas claras las acciones de alto impacto.

### Cambios

1. Agregar estados de carga por accion.
   - guardar producto,
   - actualizar pedido,
   - cancelar,
   - marcar entregado.

2. Bloquear doble submit y clicks repetidos.

3. Mejorar feedback contextual.
   - mensaje de exito ligado a la accion exacta.
   - mensaje de error ligado al bloque afectado.

4. Agregar vacios mas utiles.
   - no solo "no hay datos",
   - tambien sugerencia de siguiente paso.

5. Agregar confirmaciones donde el impacto lo justifica.
   - cancelar pedido,
   - eliminar producto,
   - quitar imagen guardada.

### Resultado esperado

- Menos acciones accidentales.
- Mejor trazabilidad de lo que paso.
- Menos soporte manual para errores de operacion.

## Fase 3. Consolidacion tecnica del frontend admin

### Objetivo

Bajar duplicacion y dejar una base mas mantenible sin refactor masivo.

### Cambios

1. Crear utilidades compartidas para admin.
   - auth guard admin,
   - `showNotice`,
   - `showToast`,
   - helper de fetch autenticado.

2. Extraer componentes renderizables o helpers pequenos.
   - badge de estado,
   - empty states,
   - formateos comunes.

3. Separar mejor responsabilidades en `admin.js`.
   - estado,
   - render,
   - eventos,
   - requests.

4. Hacer lo mismo en `admin-orders.js`.

5. Estandarizar bootstrap de scripts QA que dependen de `backend/node_modules`.

### Resultado esperado

- Menos codigo repetido.
- Menos puntos de fallo al tocar admin.
- Menor costo de agregar mejoras despues.

## Fase 4. Consistencia de contrato admin entre frontend y backend

### Objetivo

Volver el camino admin mas coherente para lectura, mantenimiento y QA.

### Cambios

1. Evaluar mover create/update/delete de productos a superficie admin consistente.
   - por ejemplo:
     - `GET /api/admin/products`
     - `POST /api/admin/products`
     - `PUT /api/admin/products/:id`
     - `DELETE /api/admin/products/:id`

2. Mantener compatibilidad temporal si ya hay frontend consumiendo rutas actuales.

3. Documentar claramente que endpoints son publicos y cuales son admin-only.

4. Ajustar scripts QA para validar ese contrato final.

### Resultado esperado

- API mas obvia.
- Menos sorpresa al leer rutas.
- Mejor alineacion entre frontend, backend y docs.

## Fase 5. Mejora de productividad operativa

### Objetivo

Agregar mejoras chicas que aumenten velocidad real de uso.

### Cambios

1. Busqueda local en admin de productos.
   - por nombre,
   - categoria,
   - estado.

2. Orden rapido en pedidos.
   - mas nuevos,
   - por vencer,
   - confirmados,
   - cancelados.

3. Accesos rapidos visibles.
   - productos sin stock,
   - pedidos pendientes,
   - pedidos expirados.

4. Resumen superior mas ejecutivo.
   - metricas cortas,
   - no dashboard complejo.

### Resultado esperado

- Menos scroll.
- Mejor tiempo de respuesta del operador.
- Mas valor sin cambiar reglas de negocio.

## Fase 6. Perfil con foto de usuario

### Objetivo

Mejorar identidad de cuenta y confianza sin convertir perfil en una red social.

### Cambios

1. Agregar soporte de avatar en usuario.
   - columna `avatar_url` en `users`.

2. Permitir upload de foto de perfil para usuario autenticado.
   - endpoint de perfil o endpoint dedicado de avatar.

3. Mostrar avatar en:
   - `perfil.html`,
   - header/menu de cuenta,
   - zonas futuras de reseñas y comentarios.

4. Mantener fallback visual fuerte.
   - iniciales del usuario si no hay foto.

5. Reusar la politica de uploads actual.
   - validacion de tipo,
   - nombres seguros,
   - URL absoluta correcta,
   - sin exponer rutas inconsistentes.

### Opinion ARCHITECT

- Esta mejora si conviene meterla pronto.
- Tiene impacto visual alto y costo tecnico controlado.
- Tambien prepara la base para reseñas y comentarios sin inventar identidad despues.

### Resultado esperado

- Perfil mas creible y personal.
- Mejor consistencia visual de cuenta.
- Base reutilizable para features sociales ligeras.

## Fase 7. Reseñas funcionales y comentarios en hilo acotado

### Objetivo

Agregar prueba social y contenido de usuarios sin romper simplicidad operativa del MVP.

### Cambios

1. Crear sistema de reseñas por producto.
   - solo usuarios logueados,
   - idealmente ligado a compra o al menos a cuenta verificada,
   - rating + texto.

2. Reemplazar placeholder de `producto.html`.
   - listado real de reseñas,
   - formulario para usuario logueado,
   - CTA de login si no hay sesion.

3. Agregar comentarios sobre reseñas con hilo acotado.
   - modelo recomendado:
     - comentario raiz sobre reseña,
     - una sola profundidad de respuesta.

4. Agregar reglas basicas de moderacion.
   - editar propio contenido,
   - borrar propio contenido,
   - admin puede ocultar o borrar.

5. Agregar orden y estados.
   - mas recientes,
   - mejor valoradas,
   - sin reseñas aun.

6. Mostrar identidad minima.
   - nombre,
   - avatar o iniciales,
   - fecha.

### Opinion ARCHITECT

- Tiene valor comercial real porque agrega confianza y contenido vivo en ficha.
- Pero no conviene ejecutarlo mezclado con el primer tramo del admin.
- Si se hace, debe ser una version v1 contenida:
  - sin menciones,
  - sin notificaciones,
  - sin likes,
  - sin profundidad infinita,
  - sin feed global.
- Recomendacion tecnica:
  - primero reseñas,
  - despues comentarios,
  - hilo maximo de un nivel.

### Resultado esperado

- Ficha de producto con prueba social real.
- Mejor conversion potencial.
- Menor riesgo de que la feature crezca sin control.

## Fase 8. Mercado Pago con Checkout Pro, SDK oficial y webhook confiable

### Objetivo

Agregar pago online real sin romper el flujo manual actual por Instagram.

### Cambios

1. Integrar `Checkout Pro` de Mercado Pago como primer camino de pago online.

2. Usar el SDK oficial de Mercado Pago en backend para:
   - crear preferencias,
   - consultar pagos,
   - evitar mantener una capa HTTP propia cuando el SDK ya cubre ese contrato.

3. Mantener convivencia clara entre:
   - `instagram`
   - `mercado_pago`

4. Crear preferencia de pago desde backend para una orden ya creada.

5. Confirmar estado real del pago por webhook, no solo por redireccion del navegador.

6. Guardar referencias externas necesarias en `orders`.

7. Reflejar el estado de pago real en:
   - checkout,
   - confirmacion,
   - mis pedidos,
   - admin de pedidos.

### Opinion ARCHITECT

- Conviene arrancar con `Checkout Pro`, no con una integracion embebida mas compleja.
- Conviene apoyar backend en el SDK oficial de Mercado Pago para reducir drift contra su documentacion y simplificar soporte futuro.
- El principal punto tecnico no es abrir el checkout sino cerrar bien consistencia de estado por webhook.
- El flujo manual actual debe quedar vivo como fallback y como canal conviviente.

### Resultado esperado

- Pedido online real con redireccion a Mercado Pago.
- Estado de pago confiable sincronizado en backend.
- Misma entidad `orders` soportando flujo manual y flujo online.

### Decision operativa cerrada

- `mercado_pago` no reserva stock indefinidamente.
- La ventana de pago online debe ser corta:
  - referencia aprobada: `30 minutos`,
  - implementada via `MP_ORDER_EXPIRATION_MINUTES`.
- Si el pago queda `approved`:
  - el pedido pasa a `confirmed`,
  - el stock permanece descontado.
- Si el pago queda `pending` o `in_process`:
  - la orden mantiene reserva solo hasta su vencimiento corto.
- Si el pago queda `rejected`, `cancelled` o `charged_back`:
  - la orden pasa a `cancelled`,
  - el stock se repone.
- Si el pago queda `refunded` y el pedido no estaba `delivered`:
  - la orden tambien se cancela y repone stock.
- Si la reserva vence sin confirmacion:
  - `payment_status -> expired`,
  - la orden se cancela,
  - el stock se libera.
- Reintento aprobado:
  - se habilita solo sobre la misma orden,
  - solo mientras siga pendiente y no vencida,
  - no sobre ordenes ya cerradas.

## Orden recomendado de ejecucion

1. Fase 1. Higiene visual y coherencia del admin
2. Fase 2. UX operativa del admin
3. Fase 3. Consolidacion tecnica del frontend admin
4. Fase 4. Consistencia de contrato admin entre frontend y backend
5. Fase 5. Mejora de productividad operativa
6. Fase 6. Perfil con foto de usuario
7. Fase 7. Reseñas funcionales y comentarios en hilo acotado

## Archivos probables a tocar

### Frontend

- `frontend/admin-products.html`
- `frontend/admin-orders.html`
- `frontend/js/admin.js`
- `frontend/js/admin-orders.js`
- `frontend/js/store.js`
- `frontend/js/shell.js`
- `frontend/css/style.css`

### Backend

- `backend/src/routes/admin.js`
- `backend/src/routes/products.js`
- `backend/src/routes/auth.js`
- `backend/src/controllers/productController.js`
- `backend/src/controllers/orderController.js`
- `backend/src/controllers/authController.js`
- `backend/src/models/User.js`
- `backend/database/schema.sql`
- `backend/src/config/migrations.js`

### Nuevas piezas probables si se ejecuta fase 7

- `backend/src/routes/reviews.js`
- `backend/src/controllers/reviewController.js`
- `backend/src/models/Review.js`
- `backend/src/models/Comment.js`
- nuevas tablas SQLite para `reviews` y `review_comments`

### QA y docs

- `scripts/qa_fase2_mvp.js`
- `scripts/qa_cierre_mvp.js`
- `docs/PROJECT_STATUS.md`
- `docs/current-work.md`
- `docs/README.md`

## Riesgos a vigilar

1. Mezclar pulido visual con cambios de negocio en el mismo tramo.
2. Romper QA del admin por mover rutas sin compatibilidad temporal.
3. Sobredisenar el panel antes de terminar deploy y salida publica.
4. Meter dashboard complejo cuando el problema real todavia es claridad operativa.
5. Abrir comentarios con demasiada complejidad y terminar creando deuda de moderacion.
6. Acoplar avatar, reseñas y comentarios en una sola tanda y volverla demasiado grande para verificar bien.

## Criterio de terminado

- Admin sin textos rotos.
- Estados y acciones principales legibles en desktop y mobile.
- Acciones admin con feedback y bloqueo de doble envio.
- Menos duplicacion en frontend admin.
- Contrato admin mas claro o al menos documentado.
- QA admin pasando despues de los cambios.
- Si se ejecuta fase 6:
  - perfil con avatar real y fallback correcto.
- Si se ejecuta fase 7:
  - reseñas reales visibles en producto,
  - comentarios acotados operativos,
  - permisos basicos cubiertos por QA.

## Recomendacion ARCHITECT

Si hay que elegir solo un tramo ahora, ejecutar:

1. Fase 1
2. Fase 2
3. una version acotada de Fase 3

Ese combo da la mejor relacion entre impacto visible, menor riesgo y menor tiempo de implementacion.

Si el usuario quiere ampliar alcance antes de ejecutar:

1. sumar fase 6 en la misma tanda es razonable,
2. dejar fase 7 como tramo aparte es la opcion mas sana,
3. si igual se combina, hacer primero reseñas y dejar comentarios para una segunda pasada.
