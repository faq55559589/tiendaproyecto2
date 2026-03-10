# Estado Actual del Proyecto

Fecha de referencia: 2026-03-10

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
- El admin ya permite gestionar productos activos/inactivos sin perder trazabilidad de ventas.
- Falta el bloque final de hardening + despliegue publico.

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
2. Endurecer CORS para dominios reales.
3. Checklist de operacion:
   - backup/restore SQLite,
   - logs/monitoring basico,
   - validacion final de secretos.
4. Pulido visual/UX final (loading/error/vacio/responsive).
5. Actualizar URLs publicas de verificacion/reset y probar email fuera de localhost.

## Riesgos actuales

- En local, los links de verificacion apuntan a `localhost`.
- Si el proveedor SMTP rechaza credenciales, registro queda bloqueado cuando `EMAIL_REQUIRED=true`.
- Hay scripts legacy que no forman parte del flujo productivo (ya movidos a `legacy`/`archive`).
