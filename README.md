# GolazoStore

Tienda online de camisetas de futbol con frontend web y backend Node.js + SQLite.

## Fuente de verdad

- Estado actual: [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
- Trabajo actual: [docs/current-work.md](./docs/current-work.md)
- Decisiones vigentes: [docs/decisions.md](./docs/decisions.md)
- Roles permanentes: [AGENTS.md](./AGENTS.md)
- Plan maestro: [docs/plans/PLAN_CIERRE_MVP.md](./docs/plans/PLAN_CIERRE_MVP.md)
- Orden de ejecucion: [docs/plans/GUIA_EJECUCION_PLANES.md](./docs/plans/GUIA_EJECUCION_PLANES.md)
- Setup local real: [docs/operacion/GUIA_SETUP_LOCAL.md](./docs/operacion/GUIA_SETUP_LOCAL.md)
- Guia de lectura del codebase: [docs/tecnico/GUIA_LECTURA_CODEBASE.md](./docs/tecnico/GUIA_LECTURA_CODEBASE.md)
- Inventario de scripts: [docs/operacion/GUIA_SCRIPTS.md](./docs/operacion/GUIA_SCRIPTS.md)

## Estructura principal

- `backend/`: API, autenticacion, carrito, pedidos, admin, SQLite.
- `frontend/`: paginas HTML, JS por pantalla, estilos y assets.
- `docs/`: documentacion activa y operativa.
- `scripts/`: utilidades de prueba y mantenimiento.

## Levantar en local

Flujo oficial en Windows:

```powershell
.\INICIAR_TODO.bat
```

Ese script:
- cierra procesos viejos en `3000` y `8000`
- levanta backend y frontend en ventanas separadas
- valida que ambos puertos queden activos
- abre `http://localhost:8000/frontend/home.html` solo si el arranque fue correcto

Si todavia no tienes Node instalado, sigue primero la guia de setup:

- [Setup local real](./docs/operacion/GUIA_SETUP_LOCAL.md)
- En PowerShell de Windows, si `npm` falla por Execution Policy, usa `npm.cmd`.

## Backend

```powershell
cd backend
node server.js
```

API: `http://localhost:3000`

## Frontend

```powershell
cd ..
node scripts/serve-frontend.js
```

Frontend: `http://localhost:8000/frontend/home.html`

## Desarrollo con recarga automatica

Backend con autorestart:

```powershell
cd backend
npm.cmd run dev
```

Frontend con live reload:

```powershell
cd ..
node scripts/serve-frontend.js
```

O todo junto con el flujo oficial:

```powershell
.\INICIAR_TODO.bat
```

Notas:
- cambios de `frontend/` se reflejan al guardar y recargar automaticamente
- cambios de backend reinician Node automaticamente con el watcher local de `npm.cmd run dev`
- si cambias dependencias o `.env`, conviene reiniciar el proceso manualmente
- si habia procesos viejos de Node ocupando `3000` o `8000`, el BAT los cierra y relanza limpio

## Cambios recientes relevantes

- Agentes y contexto:
  - `AGENTS.md` define roles permanentes para repartir trabajo sin depender de hilos temporales
- Hardening de produccion:
  - `backend/src/config/env.js` ahora bloquea `localhost` y `http` en URLs criticas de produccion
  - `EMAIL_REQUIRED=true` exige proveedor de email real configurado
- Entorno local:
  - en PowerShell de Windows puede hacer falta `npm.cmd`
  - `qa:backend` y `/api/health` ya se validaron en este entorno
- Consistencia de pedidos:
  - al confirmar un pedido manual, `payment_status` pasa a `confirmed`
  - al entregar un pedido manual, `payment_status` pasa a `delivered`
- UX final de compra:
  - `mis-pedidos` y `confirmacion` muestran estado del pedido y estado de pago por separado
- Entorno local normalizado:
  - `INICIAR_TODO.bat` como entrada oficial en Windows
  - `scripts/dev-backend.js` para autorestart compatible con este entorno
- Operacion minima local:
  - `npm run ops:backup`
  - `npm run ops:restore -- <ruta-del-backup>`
  - `npm run db:summary`
  - `npm run db:users`
  - `npm run db:products`
  - `npm run db:orders`
- Panel admin de productos:
  - crear, editar y eliminar productos
  - multiples imagenes por producto
  - quitar imagenes individuales al editar
  - activar/desactivar productos sin romper historial de pedidos
  - filtros por estado: `Todos`, `Activos`, `Inactivos`, `Sin stock`
- Panel admin de pedidos:
  - listado operativo de pedidos
  - filtros por estado y metodo de pago
  - acciones admin para confirmar, cancelar, entregar y abrir Instagram
- Checkout manual por Instagram:
  - crea el pedido primero en SQLite
  - deja `payment_status = pending_contact`
  - abre el chat de Instagram como paso siguiente de coordinacion
  - si no hay avance, el pedido manual vence automaticamente y repone stock
- Ficha de producto:
  - galeria deslizante de imagenes
  - tabs de descripcion, especificaciones y reseñas con estilo actualizado
- Navegacion:
  - se removio la categoria visible `Shorts`
  - el catalogo funciona como catalogo unico mientras no exista categoria real en base

## Backup y restore local

Crear backup:

```powershell
npm.cmd run ops:backup
```

Restore:

```powershell
npm.cmd run ops:restore -- backups/local-state-AAAA-MM-DD_HH-mm-ss
```

Referencia operativa:
- [Guia de backup y restore local](./docs/operacion/GUIA_BACKUP_RESTORE_LOCAL.md)
- [Guia SQLite y DB Browser](./docs/operacion/GUIA_SQLITE_DB_BROWSER.md)

## Nota de entorno

- Backend unico: `backend/server.js` (sin mock).

## Variables de entorno

Crear `backend/.env` con:

```env
PORT=3000
JWT_SECRET=tu_secreto_largo
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:8000/frontend
CORS_ORIGINS=http://localhost:8000,http://localhost:5500
EMAIL_FROM=tu_correo@gmail.com
EMAIL_REQUIRED=true
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password
INSTAGRAM_ORDER_EXPIRATION_HOURS=12
BACKEND_URL=http://localhost:3000
SQLITE_DB_PATH=
UPLOADS_DIR=
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_TOKEN=
MP_ORDER_EXPIRATION_MINUTES=30
```

Notas:
- `JWT_SECRET` es obligatorio y no puede ser un valor debil/de ejemplo.
- `CORS_ORIGINS` debe contener dominios reales en staging/produccion (separados por coma).
- En desarrollo, si `CORS_ORIGINS` no esta definida, se usan origenes localhost por defecto.
- `INSTAGRAM_ORDER_EXPIRATION_HOURS` define cuantas horas se reserva un pedido manual antes de expirar automaticamente.
- `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` y `MP_WEBHOOK_TOKEN` habilitan la integracion de Mercado Pago.
- `MP_ORDER_EXPIRATION_MINUTES` define cuantos minutos se reserva una orden online pendiente antes de expirar y liberar stock.
- `BACKEND_URL` se usa para construir URLs absolutas de imagenes subidas.
- `SQLITE_DB_PATH` y `UPLOADS_DIR` permiten mover almacenamiento a rutas persistentes en deploy.

## Configuracion del frontend

Archivo clave:

- `frontend/js/runtime-config.js`

En local:

```js
window.GOLAZOSTORE_CONFIG = {
    apiBase: 'http://localhost:3000/api'
};
```

Antes de produccion, cambia `apiBase` a la URL publica real del backend.

## Documentacion util

- [Documentacion central](./docs/README.md)
- [Guia Mercado Pago sandbox local](./docs/operacion/GUIA_MERCADO_PAGO_SANDBOX_LOCAL.md)
- [Guia general de produccion](./docs/operacion/GUIA_PRODUCCION.md)
- [Guia deploy Vercel + Railway](./docs/operacion/GUIA_DEPLOY_VERCEL_RAILWAY.md)
