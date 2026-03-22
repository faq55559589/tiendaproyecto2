# Estado Actual del Proyecto

Fecha de referencia: 2026-03-21

## Fuente de verdad operativa

- Roadmap maestro: [docs/plans/PLAN_CIERRE_MVP.md](./plans/PLAN_CIERRE_MVP.md)
- Orden de ejecucion: [docs/plans/GUIA_EJECUCION_PLANES.md](./plans/GUIA_EJECUCION_PLANES.md)
- Plan complementario de mejoras visuales y tecnicas: [docs/plans/PLAN_MEJORAS_ADMIN_Y_EXPERIENCIA_2026-03-20.md](./plans/PLAN_MEJORAS_ADMIN_Y_EXPERIENCIA_2026-03-20.md)
- Plan de cierre integral de Mercado Pago: [docs/plans/PLAN_CIERRE_INTEGRAL_MERCADO_PAGO_2026-03-21.md](./plans/PLAN_CIERRE_INTEGRAL_MERCADO_PAGO_2026-03-21.md)
- Setup local real: [docs/operacion/GUIA_SETUP_LOCAL.md](./operacion/GUIA_SETUP_LOCAL.md)
- Guia de lectura: [docs/tecnico/GUIA_LECTURA_CODEBASE.md](./tecnico/GUIA_LECTURA_CODEBASE.md)
- Roles permanentes: [AGENTS.md](../AGENTS.md)

## Cambios recientes (2026-03-21) - Sandbox base de Mercado Pago validado y plan integral aprobado

- La integracion base de `Checkout Pro` ya fue validada en sandbox:
  - la tienda crea la orden,
  - crea la preferencia,
  - redirige a Mercado Pago,
  - recibe webhook,
  - actualiza la orden a `confirmed` con `payment_status = approved`,
  - y vuelve a `confirmacion.html`.
- Se agrego un retorno intermedio en backend para compatibilizar el flujo local con frontend en `localhost`.
- Limitacion actual de entorno:
  - el retorno visual sigue pasando por el interstitial de `ngrok free`.
- El usuario aprobo abrir una linea integral para cerrar `Mercado Pago` mas alla del minimo tecnico.
- Nuevo plan activo:
  - `docs/plans/PLAN_CIERRE_INTEGRAL_MERCADO_PAGO_2026-03-21.md`
- Alcance aprobado del nuevo plan:
  - probar estados pendientes otro dia,
  - recorrer configuraciones avanzadas de Mercado Pago para aprenderlas,
  - endurecer seguridad del webhook,
  - cerrar notificacion operativa al vendedor,
  - preparar el paso ordenado de sandbox a produccion.

### Impacto operativo

- `Mercado Pago` deja de estar solo en fase de integracion base y pasa a una linea formal de cierre.
- El siguiente trabajo ya no es "hacer que cobre", sino completar configuracion, seguridad y operacion real.

## Cambios recientes (2026-03-21) - Mercado Pago primera parte operativa

- Se implemento la primera parte aprobada de `Mercado Pago` sobre `Checkout Pro`.
- El backend ahora puede:
  - apoyarse en el SDK oficial `mercadopago` para preferencias y consulta de pagos,
  - crear una preferencia de pago para una orden existente,
  - guardar `external_reference` y `payment_preference_id`,
  - recibir webhook y sincronizar `payment_status` real del pedido.
- El frontend ahora puede:
  - habilitar `Mercado Pago` en checkout,
  - crear la orden local,
  - pedir la preferencia,
  - redirigir al checkout externo,
  - mostrar estados reales de pago en confirmacion, historial y admin.
- Se mantuvo convivencia con el flujo manual por Instagram.
- Si la preferencia falla despues de crear la orden, el usuario ya no pierde contexto:
  - se conserva la orden,
  - se redirige a confirmacion con mensaje claro.

### Impacto operativo

- La tienda ya no trata `Mercado Pago` como placeholder visual.
- Queda resuelta la base de integracion, pero todavia falta validacion real con credenciales y webhook externo.

## Cambios recientes (2026-03-21) - Entorno local SQLite estabilizado

- El watcher de desarrollo del backend ya no reinicia por cambios en archivos auxiliares de SQLite:
  - `-wal`
  - `-shm`
  - `-journal`
- Los scripts operativos `db:summary`, `db:users`, `db:products` y `db:orders` vuelven a funcionar desde la raiz del repo.
- Se aclaro la fuente de verdad local para evitar confusiones con visores SQLite:
  - base activa: `backend/database/golazostore.db`
  - archivo legacy/confuso: `backend/database.sqlite`

### Impacto operativo

- Baja el loop de reinicios al desarrollar con SQLite activa.
- Se reduce la confusion al inspeccionar datos desde VS Code o DB Browser.

## Cambios recientes (2026-03-21) - Mercado Pago listo para webhook local con ngrok

- La redireccion local a `Checkout Pro` ya funciona en sandbox.
- Se ajusto el servicio de Mercado Pago para no enviar `back_urls`, `auto_return` ni `notification_url` invalidas cuando las URLs siguen en `localhost`.
- Queda definido el siguiente tramo operativo de la fase 8:
  - usar `ngrok` para exponer el backend local,
  - setear `BACKEND_URL` temporal publico,
  - validar webhook real y sincronizacion de estados.
- Se agrego guia operativa dedicada:
  - `docs/operacion/GUIA_MERCADO_PAGO_SANDBOX_LOCAL.md`

### Impacto operativo

- La integracion ya supero el bloqueo de redireccion local.
- El siguiente trabajo se concentra en cerrar sandbox end-to-end antes de produccion.

## Cambios recientes (2026-03-21) - Politica operativa de Mercado Pago definida e implementada

- Se cerro la decision operativa para pedidos `mercado_pago` antes de avanzar con validacion real.
- Regla adoptada:
  - el stock no queda reservado indefinidamente para pagos online,
  - la ventana de pago pendiente pasa a ser corta y configurable,
  - el pedido se conserva para trazabilidad aunque el pago no se complete.
- Implementacion aplicada:
  - nueva variable `MP_ORDER_EXPIRATION_MINUTES` con default de `30`,
  - las ordenes `mercado_pago` nacen o se reintentan con vencimiento corto,
  - si el webhook informa `approved`, el pedido pasa a `confirmed`,
  - si informa `rejected`, `cancelled` o `charged_back`, el pedido pasa a `cancelled` y repone stock,
  - si informa `refunded` y el pedido no estaba entregado, tambien se cancela y repone stock,
  - si el pago queda `pending` o `in_process`, mantiene reserva solo hasta el vencimiento configurado,
  - al vencer, la orden pasa a `payment_status = expired`, se cancela y libera stock.
- Reintento de pago:
  - se habilito desde `mis-pedidos`,
  - solo para ordenes `mercado_pago` pendientes y no expiradas,
  - no se permite sobre ordenes cerradas, entregadas o vencidas.
- Ajustes operativos adicionales:
  - `admin-orders` ya no incentiva confirmacion manual de pedidos online pendientes,
  - `confirmacion`, `mis-pedidos` y admin muestran el estado `expired` y el vencimiento de reserva.

### Impacto operativo

- Se evita stock fantasma por pagos online abandonados.
- Queda una politica defendible para pasar despues a sandbox y produccion.
- El siguiente trabajo ya puede concentrarse en credenciales, webhook externo y pruebas end-to-end.

## Cambios recientes (2026-03-21) - Tanda A del plan admin

- Se ejecuto el primer tramo aprobado del plan complementario:
  - fase 1,
  - fase 2,
  - fase 3 acotada.
- El admin de productos y pedidos ahora tiene:
  - encabezados mas claros,
  - mejor jerarquia visual,
  - estados inline de carga y contexto,
  - confirmaciones antes de acciones sensibles,
  - bloqueo de doble click en acciones criticas.
- Se creo una base compartida para frontend admin:
  - `frontend/js/admin-common.js`
- `frontend/js/admin.js` y `frontend/js/admin-orders.js` ahora comparten:
  - guard admin,
  - toasts,
  - notices,
  - request autenticado,
  - manejo de botones ocupados.
- Se limpiaron textos rotos y copy inconsistente en vistas admin:
  - `frontend/admin-products.html`
  - `frontend/admin-orders.html`

### Impacto operativo

- El panel admin queda mas legible y mas dificil de operar por error.
- El frontend admin baja duplicacion sin abrir un refactor grande.
- Queda mejor base para sumar despues avatar, reseñas y comentarios.

## Cambios recientes (2026-03-21) - Fase 6 aprobada

- El usuario aprobo ejecutar la fase 6 del plan complementario.
- Siguiente foco acordado:
  - avatar real de usuario,
  - integracion visible en perfil y shell compartido.

### Impacto operativo

- La siguiente tanda ya no requiere revalidar prioridad.
- El roadmap inmediato avanza sobre identidad de cuenta antes de reseñas y comentarios.

## Cambios recientes (2026-03-21) - Avatar real de usuario

- Se implemento soporte real para foto de perfil:
  - nueva columna `avatar_url` en `users`,
  - migracion automatica en arranque,
  - update de perfil con upload validado.
- El backend ahora:
  - guarda la URL publica del avatar,
  - expone `avatar_url` en perfil y login,
  - limpia el avatar anterior cuando el usuario lo reemplaza.
- El frontend ahora:
  - permite subir avatar desde `frontend/perfil.html`,
  - muestra avatar o fallback por iniciales en navbar,
  - reutiliza el avatar en `mis-pedidos`.

### Impacto operativo

- La cuenta se siente mas personal y consistente.
- Queda base real de identidad para la futura fase de reseñas y comentarios.

## Cambios recientes (2026-03-21) - Fase 4 aprobada y fase 6 validada

- El usuario aprobo ejecutar la fase 4 del plan complementario:
  - contrato admin consistente entre frontend y backend.
- Tambien confirmo en uso real que la fase 6 funciona correctamente:
  - avatar de perfil operativo.

### Impacto operativo

- La siguiente tanda tecnica ya queda priorizada sin ambiguedad.
- El siguiente objetivo pasa de UX/identidad a coherencia de contrato admin.

## Cambios recientes (2026-03-21) - Contrato admin de productos consistente

- El backend ahora soporta CRUD admin de productos en una sola superficie coherente:
  - `GET /api/admin/products`
  - `POST /api/admin/products`
  - `PUT /api/admin/products/:id`
  - `DELETE /api/admin/products/:id`
- El frontend admin ya consume esa superficie nueva como camino principal.
- Las rutas viejas bajo `/api/products` se mantienen por compatibilidad temporal.
- Los scripts QA del admin ya validan el contrato nuevo.

### Impacto operativo

- El panel admin y la API quedan mas faciles de leer y mantener.
- Baja la confusion entre rutas publicas y admin-only sin romper compatibilidad.

## Cambios recientes (2026-03-21) - Fase 5 aprobada

- El usuario aprobo ejecutar la fase 5 del plan complementario.
- Siguiente foco acordado:
  - productividad operativa del admin,
  - herramientas rapidas de filtrado, busqueda y orden.

### Impacto operativo

- La siguiente tanda queda orientada a velocidad de uso real del panel.
- El foco inmediato se mueve de contrato tecnico a eficiencia operativa.

## Cambios recientes (2026-03-21) - Productividad operativa del admin

- El panel admin de productos ahora suma:
  - busqueda local por nombre, categoria o descripcion,
  - atajos rapidos para `Sin stock`, `Inactivos` y `Activos`.
- El panel admin de pedidos ahora suma:
  - orden rapido por recencia, vencimiento, total o prioridad operativa,
  - atajos rapidos para `Pendientes`, `Confirmados`, `Expirados` y `Todos`.

### Impacto operativo

- Baja el tiempo de scroll y lectura para tareas repetitivas.
- El admin gana herramientas rapidas sin agregar complejidad de backend.

## Cambios recientes (2026-03-21) - Fase de reseñas aprobada

- El usuario aprobo abrir la fase de reseñas como una v1 contenida.
- Regla aprobada:
  - solo usuarios logueados,
  - verificados,
  - y con compra previa del producto
  - pueden dejar reseñas y comentarios.
- Alcance aprobado:
  - una reseña por usuario por producto,
  - comentarios con un solo nivel de hilo,
  - avatar o iniciales visibles en la identidad del autor.

### Impacto operativo

- La fase de social proof arranca con una regla fuerte y defendible.
- Se evita abrir una capa social demasiado amplia antes de tiempo.

## Cambios recientes (2026-03-20) - Plan complementario de mejoras admin y experiencia

- Se agrego un plan corto y ejecutable para ordenar mejoras sin abrir una reescritura del proyecto:
  - `docs/plans/PLAN_MEJORAS_ADMIN_Y_EXPERIENCIA_2026-03-20.md`
- El foco del plan queda dividido en:
  - higiene visual del admin,
  - UX operativa,
  - consolidacion tecnica del frontend admin,
  - consistencia del contrato admin,
  - mejoras chicas de productividad.
- La recomendacion actual de `ARCHITECT` es:
  - ejecutar primero fases 1 y 2,
  - y despues una version acotada de fase 3.
- El plan tambien quedo ampliado con nuevas lineas pedidas por usuario:
  - foto de perfil real,
  - reseñas funcionales para usuarios logueados,
  - comentarios en hilo acotado.
- El usuario aprobo como primer tramo de ejecucion:
  - fase 1,
  - fase 2,
  - fase 3 acotada.

### Impacto operativo

- La siguiente sesion ya no tiene que redescubrir por donde conviene mejorar el admin.
- El roadmap de cierre MVP sigue vigente, pero ahora tiene un plan complementario concreto para mejoras visuales y de implementacion.
- Tambien queda documentado que reseñas/comentarios deben entrar como tramo contenido y no como feature social abierta.
- Tambien queda definido que el siguiente trabajo aprobado se concentra en mejorar el admin antes de abrir nuevas features de identidad o social proof.

## Cambios recientes (2026-03-20) - Agentes permanentes, hardening y consistencia final

- Se formalizo `AGENTS.md` como catalogo permanente de roles del proyecto y se desactivo el modo multiagente global de Codex.
- Se endurecio produccion en `backend/src/config/env.js`:
  - `FRONTEND_URL` y `BACKEND_URL` no pueden apuntar a `localhost`
  - `FRONTEND_URL`, `BACKEND_URL` y `CORS_ORIGINS` deben usar `https`
  - `EMAIL_REQUIRED=true` exige proveedor real de email configurado
- Se eliminaron fallbacks silenciosos a `localhost` en links de email e imagenes subidas.
- Se valido el entorno local real:
  - backend responde `GET /api/health`
  - `qa:backend` pasa en este entorno
  - en PowerShell de Windows, `npm.cmd` queda como camino operativo estable
- Se corrigio consistencia de pedidos manuales:
  - al confirmar, `payment_status -> confirmed`
  - al entregar, `payment_status -> delivered`
  - cancelacion y expiracion siguen reponiendo stock
- Se pulio el cierre de compra:
  - `mis-pedidos` ahora muestra estado del pedido, estado de pago y metodo por separado
  - `confirmacion` ahora muestra estado y estado de pago
  - se limpiaron textos rotos en checkout y confirmacion

### Impacto operativo

- Produccion ahora falla temprano si la configuracion sensible esta mal armada.
- El flujo local en Windows queda mas claro y reproducible.
- El lifecycle de pedidos queda mas coherente entre backend, admin e historial del usuario.

## Cambios recientes (2026-03-10) - Pulido UI/UX y operacion real

- Se aplico una ronda amplia de pulido visual y de copy en frontend:
  - `home`
  - `catalogo`
  - `producto`
  - `contacto`
  - `carrito`
  - `checkout`
  - `confirmacion`
  - `navbar`
  - `footer`
- Se corrigieron textos tecnicos o poco comerciales para llevar la tienda a un tono mas real.
- Se alinearon mensajes y ayudas con la operacion actual:
  - envios dentro de Montevideo
  - coordinacion por Instagram
  - encargos por consulta
  - envio sin tarifa fija
- Se dejo Mercado Pago comunicado como mejora futura en frontend:
  - checkout
  - panel admin de pedidos
- Se dio una pasada adicional a `mi perfil` y `mis pedidos`:
  - mejor contexto de cuenta
  - historial con estados mas legibles
  - CTA de seguimiento para pedidos pendientes por Instagram
- Se hizo una limpieza final de UX en pedidos:
  - `mis-pedidos` y `admin-orders` sin textos rotos
  - cards de pedidos mas claras
  - feedback del carrito mas compacto y cerrable
- Se unifico el formateo de telefonos para Uruguay en registro, perfil y checkout.
- Se corrigio el bug de destacados en home:
  - un script inline reescribia el `body` y dejaba la seccion cargando aunque la API respondiera.
- Se corrigieron URLs viejas de imagenes que seguian apuntando a `localhost`.
- Se limpio el panel admin:
  - textos con acentos corregidos
  - ayudas de imagenes mas claras
  - explicacion mas precisa de la regla de borrado
- Se actualizo la regla de borrado de productos:
  - si el producto solo aparece en pedidos cancelados o expirados, se puede borrar
  - si aparece en pedidos activos o entregados, sigue bloqueado
- Se documento esta ronda de cambios en:
  - `docs/tecnico/CAMBIOS_UI_UX_2026-03-10.md`

Fecha de referencia anterior: 2026-03-08

## Cambios recientes (2026-03-08) - Preparacion deploy Railway + Vercel

- Backend preparado para rutas configurables de almacenamiento:
  - `backend/src/config/paths.js`
  - `backend/src/config/database.js`
  - `backend/src/middleware/upload.js`
  - `backend/server.js`
- Nuevas variables soportadas:
  - `BACKEND_URL`
  - `SQLITE_DB_PATH`
  - `UPLOADS_DIR`
- Frontend preparado para `apiBase` configurable sin editar la logica principal:
  - `frontend/js/runtime-config.js`
  - `frontend/js/store.js`
- Se agrego documentacion operativa de salida a produccion:
  - `docs/operacion/GUIA_PRODUCCION.md`
  - `docs/operacion/GUIA_DEPLOY_VERCEL_RAILWAY.md`

### Impacto operativo

- Railway ya puede usar un volume persistente para SQLite y `uploads`.
- Vercel ya puede apuntar al backend publico ajustando `frontend/js/runtime-config.js`.
- El proyecto queda mejor preparado para separar frontend y backend por entorno.

## Cambios recientes (2026-03-08) - Regla de borrado y UX admin

- Se corrigio la regresion de borrado de productos vendidos:
  - si un producto ya forma parte de pedidos, el backend responde `409`.
- El panel admin ahora deja mas claro por que ciertos productos no se pueden borrar:
  - muestra si el producto tiene historial de pedidos.
  - deshabilita la accion de eliminar cuando corresponde.
- Validacion ejecutada en instancia limpia:
  - `scripts/qa_cierre_mvp.js`: `16/16 PASS`

## Cambios recientes (2026-03-07) - Fase 1 hardening

- Se elimino el fallback inseguro de `JWT_SECRET` en auth:
  - `backend/src/middleware/auth.js`
  - `backend/src/controllers/authController.js`
- Se agrego validacion centralizada de entorno:
  - `backend/src/config/env.js`
  - valida `JWT_SECRET` obligatorio y bloquea valor inseguro.
  - parsea `CORS_ORIGINS` por CSV.
- Se endurecio CORS en `backend/server.js`:
  - ya no usa lista fija hardcodeada.
  - usa origenes permitidos desde `CORS_ORIGINS`.
  - conserva defaults de localhost para desarrollo si la variable no esta definida.
- Se actualizo `backend/.env.example`:
  - `JWT_SECRET` con placeholder robusto.
  - nueva variable `CORS_ORIGINS`.

### Impacto operativo

- Si `JWT_SECRET` falta o es inseguro, el backend no inicia.
- Para staging/produccion, definir `CORS_ORIGINS` con dominios reales separados por coma.
- El flujo local sigue funcionando con defaults de localhost.

## Cambios recientes (2026-03-07) - Fase 2 QA funcional

- Se agrego script de validacion integral:
  - `scripts/qa_fase2_mvp.js`
- Se ejecuto QA de flujo principal, errores y permisos admin:
  - resultado final: `21/21` casos PASS.
- Se detecto y corrigio un gap de negocio:
  - antes se podia comprar con `stock=0`.
  - ahora se bloquea en carrito/checkout y se descuenta stock al confirmar pedido.
- Reporte de ejecucion:
  - `docs/qa/QA_FASE2_MVP_2026-03-07.md`

## Cambios recientes (2026-03-07) - Fase 3 pulido UX

- `catalogo`:
  - estado vacio y error encapsulados en panel visual consistente.
  - boton de reintento cuando falla carga.
- `carrito`:
  - estado de carga inicial visible.
  - alerta inline de error de carga de carrito.
  - texto de resumen actualizado a medio de pago generico.
- `checkout`:
  - estado de carga inicial visible.
  - alerta inline de error de carga de carrito.
  - textos unificados a "medio de pago".
  - selector con `Mercado Pago` y `Coordinacion manual`.
- consistencia de pago en post-compra:
  - formateo legible en confirmacion e historial (`Mercado Pago` / `Coordinacion manual`).

## Cambios recientes (2026-03-07) - Panel admin y uploads

- Se habilito acceso visible al panel admin desde frontend:
  - link principal `Admin` en navbar para usuarios con rol `admin`.
  - acceso adicional desde `Mi perfil`.
  - pagina operativa: `frontend/admin-products.html`.
- Se corrigio la validacion de sesion frontend para refrescar el rol real desde backend:
  - `frontend/js/auth.js` ahora sincroniza usuario desde `/api/auth/profile`.
- Se corrigio el fallo de alta de producto con foto:
  - `backend/src/middleware/upload.js` ahora crea automaticamente `backend/uploads`.
  - usa ruta absoluta para evitar errores por directorio de trabajo.
- Se amplio el panel admin de productos:
  - permite editar nombre, descripcion, precio, stock, talles, categoria y especificaciones.
  - permite reemplazar la foto en edicion.
  - mantiene eliminacion desde el mismo panel.

### Impacto operativo

- Si cambias el rol en SQLite, el frontend no debe confiar en cache local; se resincroniza contra backend al cargar.
- Si cambias middleware/backend, hay que reiniciar el servidor Node para tomar el cambio.
- La subida de imagen requiere que el backend corra con el middleware actualizado.

## Cambios recientes (2026-03-07) - Entorno local y catalogo final

- Se normalizo el arranque local:
  - `INICIAR_TODO.bat` es ahora el punto de entrada oficial en Windows.
  - cierra procesos viejos en `3000` y `8000`.
  - levanta backend y frontend en ventanas separadas.
  - valida puertos antes de abrir el navegador.
- Se reemplazo `node --watch` por un watcher propio para backend:
  - `scripts/dev-backend.js`
  - motivo: en este entorno `node --watch` y `nodemon` fallaban con `spawn EPERM`.
- Se alinearon puertos y documentacion:
  - backend local `3000`
  - frontend local `8000`
- Se agrego operacion minima local:
  - `scripts/backup-local-state.js`
  - `scripts/restore-local-state.js`
  - respaldan SQLite + `uploads`
  - restauran estado local desde `backups/`

## Cambios recientes (2026-03-07) - Galeria de producto y admin

- Productos ahora soportan multiples imagenes:
  - `image_urls` persiste la galeria completa.
  - `image_url` queda como imagen principal.
- El panel admin ahora:
  - muestra toda la galeria real del producto al editar.
  - permite agregar nuevas imagenes sin reemplazar las existentes.
  - permite quitar imagenes individuales antes de guardar.
- La API de productos normaliza `sizes`, `image_url` e `image_urls` al responder:
  - evita inconsistencias entre catalogo, ficha y panel admin.
- La baja admin de productos vendidos ya no cae en error interno:
  - si el producto forma parte de `order_items`, responde `409` con mensaje claro.

## Cambios recientes (2026-03-07) - Estado comercial de productos

- Se agrego `is_active` en productos para manejar catalogo sin romper historial.
- La logica admin ahora diferencia:
  - `Activos`
  - `Inactivos`
  - `Sin stock`
- Si un producto ya fue vendido:
  - no se elimina fisicamente,
  - se desactiva y sale del catalogo publico,
  - se conserva para pedidos historicos.
- El panel admin ahora muestra todos los productos y permite filtrarlos por estado:
  - `Todos`
  - `Activos`
  - `Inactivos`
  - `Sin stock`
- El panel admin permite:
  - editar,
  - activar/desactivar,
  - eliminar fisicamente solo si el producto no tiene pedidos asociados.

## Cambios recientes (2026-03-08) - Checkout manual por Instagram

- Se implemento el flujo `Instagram / Coordinacion manual` sobre la misma entidad `orders`.
- La regla de negocio ahora es:
  - primero se crea el pedido en la base,
  - luego se abre el chat de Instagram como siguiente paso operativo.
- Para pedidos manuales:
  - `payment_method = instagram`
  - `payment_status = pending_contact`
  - `status = pending_contact`
- El checkout ahora:
  - muestra ayuda contextual segun metodo elegido,
  - guarda el pedido,
  - redirige a confirmacion,
  - abre el chat de Instagram en una nueva pestaña.
- La confirmacion ahora muestra:
  - boton para abrir Instagram,
  - mensaje sugerido para copiar,
  - estado pendiente de contacto asociado al pedido.

### Impacto operativo

- Instagram pasa a ser un canal de coordinacion, no la fuente de verdad del pedido.
- El control del pedido sigue centralizado en SQLite.
- `Mercado Pago` permanece como camino separado y futuro para pago online, sin reemplazar la tabla `orders`.

## Cambios recientes (2026-03-08) - Expiracion automatica de pedidos manuales

- Se agrego `expires_at` en `orders`.
- Los pedidos `instagram` ahora se crean con una ventana de vigencia automatica.
- Regla actual:
  - si `payment_method = instagram`
  - y `status = pending_contact`
  - y `payment_status = pending_contact`
  - y `expires_at` ya vencio,
  - el backend expira el pedido automaticamente.
- Al expirar:
  - `status -> cancelled`
  - `payment_status -> expired`
  - se repone stock de todos los `order_items`
  - el pedido se conserva en la base para trazabilidad
- La expiracion corre:
  - al arrancar el backend
  - y periodicamente mientras el servidor esta activo

### Impacto operativo

- Se evita bloquear stock por pedidos manuales muertos.
- Ya no hace falta borrar registros para "limpiar basura".
- La limpieza correcta del negocio ahora es por expiracion, no por `DELETE`.

## Cambios recientes (2026-03-08) - Panel admin de pedidos

- Se agrego vista admin para operar pedidos:
  - `frontend/admin-orders.html`
  - `frontend/js/admin-orders.js`
- El panel permite:
  - listar todos los pedidos,
  - filtrar por estado y metodo de pago,
  - ver cliente, items, total, vencimiento y notas,
  - cambiar estado a `confirmed`, `cancelled` o `delivered`,
  - abrir Instagram para seguimiento de pedidos manuales.
- Se agregaron accesos desde la navegacion admin:
  - `Admin productos`
  - `Admin pedidos`

## Cambios recientes (2026-03-08) - Toolbox SQLite local

- Se agrego script operativo:
  - `scripts/db-admin.js`
- Comandos utiles incorporados:
  - `db:summary`
  - `db:users`
  - `db:products`
  - `db:orders`
- Se documento flujo recomendado para trabajar con `DB Browser for SQLite` sin perder cambios ni tocar una copia equivocada.
- Se formalizo la regla:
  - GUI para inspeccion,
  - scripts para operaciones rutinarias y verificables.

## Cambios recientes (2026-03-07) - Ficha de producto y navegacion

- Se mejoro la ficha de producto:
  - galeria con multiples imagenes y navegacion lateral.
  - tabs de `Descripcion`, `Especificaciones` y `Reseñas` con mejor contraste visual.
  - textos con acentos corregidos.
- Se elimino la navegacion visible de `Shorts`:
  - navbar, footer, offcanvas y home ya no muestran una categoria separada.
  - catalogo vuelve a operar como catalogo unico.
- Se limpio la logica residual de `shorts` en frontend:
  - ya no se infiere categoria por texto en nombre o descripcion.

## Resumen ejecutivo

- El MVP de compra ya corre con backend real.
- Registro/login/verificacion/reset estan implementados.
- Carrito y pedidos ya no dependen de localStorage como fuente principal.
- `Mercado Pago` queda definido como mejora post-MVP.
- QA de cierre MVP ejecutado con `16/16 PASS`.
- QA de integridad de backend valida tokens, carrito y lifecycle de pedidos.
- El admin ya permite gestionar productos activos/inactivos sin perder trazabilidad de ventas.
- El hardening principal de produccion ya quedo aplicado.
- Falta consolidar docs finales, QA de cierre y despliegue publico.

## Lo que ya esta cerrado

## Backend

- API real activa:
  - `/api/auth`
  - `/api/products`
  - `/api/cart`
  - `/api/orders`
  - `/api/admin`
- Migraciones automaticas en arranque.
- Roles y autorizacion admin para rutas sensibles.
- Esquema de `orders` alineado a MVP (instagram + estados base).

## Frontend

- Flujo MVP:
  - `home -> catalogo -> producto -> carrito -> checkout -> confirmacion -> mis-pedidos`.
- Integracion real de carrito/pedidos con API.
- Limpieza principal de rutas heredadas y scripts legacy.

## Email/Auth

- Verificacion por email implementada.
- Recuperacion de contrasena implementada.
- Reenvio de verificacion implementado (`/api/auth/resend-verification`).

## Pendiente para considerarlo listo de produccion

1. Definir dominio publico (frontend/backend) y actualizar `FRONTEND_URL`.
2. Cargar variables reales de produccion y validar deploy con dominios definitivos.
3. Cerrar QA final manual del flujo completo en frontend y admin.
4. Checklist de operacion:
   - backup/restore SQLite,
   - logs/monitoring basico,
   - validacion final de secretos.
5. Probar email y reset fuera de localhost con proveedor real.
6. Validar persistencia real de SQLite y `uploads` en deploy.

## Riesgos actuales

- Si el proveedor SMTP rechaza credenciales con `EMAIL_REQUIRED=true`, registro queda bloqueado por diseno.
- El deploy sigue dependiendo de configurar bien `FRONTEND_URL`, `BACKEND_URL`, `CORS_ORIGINS`, persistencia y secretos.
- Hay scripts legacy que no forman parte del flujo productivo (ya movidos a `legacy`/`archive`).

## Cambios recientes (2026-03-21) - Reseñas y comentarios v1 implementados

- Se implemento backend real para reseñas y comentarios:
  - tablas `reviews` y `review_comments`,
  - migracion automatica,
  - endpoints publicos y autenticados bajo `/api/reviews`.
- Regla aplicada en backend:
  - solo usuarios verificados,
  - con compra previa confirmada o entregada del producto,
  - pueden reseñar y comentar.
- La ficha de producto ahora reemplaza el placeholder de reseñas por una UI real:
  - resumen de promedio y cantidad,
  - reseñas con avatar o iniciales,
  - formulario de reseña,
  - comentarios de un solo nivel.
- El QA de integridad backend ahora tambien cubre:
  - compra habilitante para reseñar,
  - unicidad de una reseña por usuario y producto,
  - comentario asociado a reseña.

### Impacto operativo

- La identidad de usuario ahora se conecta con social proof real.
- La regla de "solo compradores" queda defendida por backend, no por UI.

## Cambios recientes (2026-03-21) - Tanda de performance frontend

- Se aplico una ronda de performance sin cambiar el lenguaje visual de la tienda.
- Frontend:
  - `catalogo.js` ahora construye el grid completo en un solo render,
  - `home.js` evita volver a pedir productos al agregar desde destacados,
  - `main.js` hace mas liviano el listener de scroll del boton `backToTop`.
- CSS:
  - se removio la animacion global de entrada sobre `.card`,
  - se cambiaron varios `transition: all` por transiciones puntuales,
  - se saco `backdrop-filter` de cards grandes del flujo de compra,
  - en dispositivos tactiles se evita scroll suave y hover transforms pesados.

### Impacto operativo

- Mejora la fluidez percibida al scrollear, especialmente en listados y equipos tactiles.
- Se conserva el look actual, pero con menos costo de repaint y compositing.
- Queda documento tecnico de soporte para futuras sesiones:
  - `docs/tecnico/PERFORMANCE_FRONTEND_2026-03-21.md`

## Cambios recientes (2026-03-21) - Fase de Mercado Pago aprobada

- El usuario aprobo abrir la integracion de `Mercado Pago`.
- Direccion acordada:
  - usar `Checkout Pro`,
  - mover backend a SDK oficial de Mercado Pago en vez de mantener capa HTTP propia,
  - mantener el flujo manual por Instagram,
  - usar webhook como fuente principal para confirmar pagos.

### Impacto operativo

- `Mercado Pago` deja de ser solo roadmap futuro y pasa a fase aprobada.
- El siguiente trabajo tecnico debe concentrarse en checkout, orders, webhook y reflejo de estados.

## Cambios recientes (2026-03-21) - Admin de usuarios implementado

- Se agrego un panel admin de usuarios con foco operativo y alcance acotado.
- Backend:
  - nuevo endpoint `GET /api/admin/users`,
  - expone avatar, rol, verificacion, newsletter, cantidad de pedidos y ultima actividad.
- Frontend:
  - nueva pagina `admin-users.html`,
  - filtros locales por rol, verificacion y actividad,
  - busqueda por nombre, email o telefono,
  - accesos visibles desde navegacion admin.

### Impacto operativo

- El admin ya no necesita abrir SQLite para revisar usuarios basicos de la tienda.
- Queda mejor base para soporte, moderacion futura y lectura de actividad de cuenta sin sobredisenar el panel.
