# Estructura del Proyecto

## Raiz

- `backend/`: API y base de datos SQLite.
- `frontend/`: aplicacion web.
- `docs/`: documentacion tecnica y operativa.
- `scripts/`: utilidades de soporte y pruebas.
- `backups/`: respaldos y archivos historicos.

## Backend

- `backend/server.js`: entrypoint del servidor.
- `backend/database/`: `golazostore.db` y `schema.sql`.
- `backend/src/config/`: conexion DB y migraciones.
- `backend/src/controllers/`: logica de negocio.
- `backend/src/models/`: acceso a datos.
- `backend/src/routes/`: definicion de endpoints.
- `backend/src/middleware/`: auth, upload y seguridad.
- `backend/src/utils/`: email y utilidades.

## Frontend

- `frontend/*.html`: paginas del flujo principal y cuenta.
- `frontend/js/store.js`: capa central de cliente/API.
- `frontend/js/shell.js`: navbar/footer/offcanvas compartidos.
- `frontend/js/*.js`: modulos por pantalla.
- `frontend/css/style.css`: estilos base.
- `frontend/assets/images/`: imagenes y branding.

## Flujo MVP

1. `frontend/home.html`
2. `frontend/catalogo.html`
3. `frontend/producto.html`
4. `frontend/carrito.html`
5. `frontend/checkout.html`
6. `frontend/confirmacion.html`
7. `frontend/mis-pedidos.html`
