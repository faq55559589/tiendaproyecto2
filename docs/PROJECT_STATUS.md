# Estado Actual del Proyecto

Fecha de referencia: 2026-03-07

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
