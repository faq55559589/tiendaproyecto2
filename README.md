# GolazoStore

Tienda online de camisetas de futbol con frontend web y backend Node.js + SQLite.

## Estado actual

- Flujo MVP operativo con backend real:
  - catalogo,
  - detalle de producto,
  - carrito,
  - checkout,
  - confirmacion,
  - mis pedidos.
- Autenticacion JWT con verificacion de email.
- Endpoints admin protegidos por rol.

## Estructura principal

- `backend/`: API, autenticacion, carrito, pedidos, admin, SQLite.
- `frontend/`: paginas HTML, JS por pantalla, estilos y assets.
- `docs/`: documentacion activa (estado, plan vigente, tecnico y operacion).
- `scripts/`: utilidades de prueba y mantenimiento.

Ver detalle en:
- [Documentacion central](./docs/README.md)
- [Estado actual](./docs/PROJECT_STATUS.md)
- [Guia de ejecucion de planes](./docs/plans/GUIA_EJECUCION_PLANES.md)

## Levantar en local

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
node --watch server.js
```

Frontend con live reload:

```powershell
cd ..
node scripts/serve-frontend.js
```

O todo junto:

```powershell
INICIAR_TODO.bat
```

Notas:
- cambios de `frontend/` se reflejan al guardar y recargar automaticamente
- cambios de backend reinician Node automaticamente con `node --watch`
- si cambias dependencias o `.env`, conviene reiniciar el proceso manualmente

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
```

Notas:
- `JWT_SECRET` es obligatorio y no puede ser un valor debil/de ejemplo.
- `CORS_ORIGINS` debe contener dominios reales en staging/produccion (separados por coma).
- En desarrollo, si `CORS_ORIGINS` no esta definida, se usan origenes localhost por defecto.

## Planes de trabajo

- [Plan cierre MVP](./docs/plans/PLAN_CIERRE_MVP.md)
- [Guia de ejecucion](./docs/plans/GUIA_EJECUCION_PLANES.md)
