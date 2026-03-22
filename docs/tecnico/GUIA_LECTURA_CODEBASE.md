# Guia de Lectura del Codebase

Esta guia esta pensada para aprender el proyecto siguiendo datos y flujos reales, no carpetas al azar.

## Que ensena este repo

- Arquitectura full stack simple con HTML/CSS/JS.
- Backend Express con SQLite.
- Auth JWT y roles.
- Flujo real de carrito, checkout, pedidos y admin.
- Operacion con migraciones, emails y scripts de soporte.

## Orden de lectura recomendado

### 1. Mapa general

1. [README.md](../../README.md)
2. [docs/PROJECT_STATUS.md](../PROJECT_STATUS.md)
3. [docs/tecnico/ESTRUCTURA_PROYECTO.md](./ESTRUCTURA_PROYECTO.md)

### 2. Modelo de datos

1. [backend/database/schema.sql](../../backend/database/schema.sql)
2. [backend/src/config/database.js](../../backend/src/config/database.js)
3. [backend/src/config/migrations.js](../../backend/src/config/migrations.js)

### 3. Frontend base

1. [frontend/js/store.js](../../frontend/js/store.js)
2. [frontend/js/auth.js](../../frontend/js/auth.js)
3. [frontend/js/shell.js](../../frontend/js/shell.js)
4. [frontend/js/checkout.js](../../frontend/js/checkout.js)

### 4. Flujo de pedidos

1. [backend/src/routes/orders.js](../../backend/src/routes/orders.js)
2. [backend/src/controllers/orderController.js](../../backend/src/controllers/orderController.js)
3. [backend/src/models/Order.js](../../backend/src/models/Order.js)

### 5. Auth y perfil

1. [backend/src/routes/auth.js](../../backend/src/routes/auth.js)
2. [backend/src/controllers/authController.js](../../backend/src/controllers/authController.js)
3. [backend/src/middleware/auth.js](../../backend/src/middleware/auth.js)
4. [backend/src/models/User.js](../../backend/src/models/User.js)
5. Volver a [frontend/js/auth.js](../../frontend/js/auth.js) para cerrar el circuito cliente-servidor.

### 6. Admin

1. [backend/src/routes/admin.js](../../backend/src/routes/admin.js)
2. [backend/src/controllers/productController.js](../../backend/src/controllers/productController.js)
3. [backend/src/controllers/orderController.js](../../backend/src/controllers/orderController.js)
4. [frontend/js/admin.js](../../frontend/js/admin.js)
5. [frontend/js/admin-orders.js](../../frontend/js/admin-orders.js)

## Como leer bien

- Sigue un dato de punta a punta.
- No empieces por CSS o paginas sueltas.
- Empieza por `store.js` y `schema.sql`.
- Luego baja a rutas, controladores y modelos.
- Recien despues mira admin, estilos o scripts.

## Ejercicio recomendado

Lee el flujo `checkout` en este orden:

1. `frontend/js/checkout.js`
2. `frontend/js/store.js`
3. `backend/src/routes/orders.js`
4. `backend/src/controllers/orderController.js`
5. `backend/src/models/Order.js`
6. `backend/database/schema.sql`

## Puntos que vale la pena estudiar

- Como se normalizan productos e imagenes.
- Como se valida sesion y rol.
- Como se reserva, expira y repone stock.
- Como se mantiene el MVP con SQLite sin ORM pesado.

## Lo que conviene dejar para el final

- CSS grande.
- Paginas HTML completas.
- Scripts legacy.
- Ajustes visuales finos sin entender primero el flujo de datos.
