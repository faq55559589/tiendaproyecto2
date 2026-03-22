# Guia paso a paso: Vercel + Railway

Fecha de referencia: 2026-03-08

Esta guia esta hecha para este proyecto:

- frontend estatico en `frontend/`
- backend Node.js + Express en `backend/`
- base SQLite en `backend/database/golazostore.db`
- uploads en `backend/uploads/`

Objetivo:

- publicar el frontend en Vercel
- publicar el backend en Railway
- conservar SQLite y `uploads` en almacenamiento persistente

## 0. Resultado final esperado

Al terminar, deberias tener algo asi:

- frontend publico en Vercel:
  - `https://tu-dominio.com/frontend/home.html`
- backend publico en Railway:
  - `https://tu-backend.railway.app`

Y estas variables conectadas entre si:

- `frontend/js/store.js` apuntando al backend publico
- `backend/.env` con `FRONTEND_URL` publico
- `backend/.env` con `CORS_ORIGINS` publico
- `backend/.env` con `BACKEND_URL` publico real, sin localhost

## 1. Crear backup antes de empezar

Desde la raiz del proyecto:

```powershell
npm run ops:backup
```

No sigas sin backup.

## 2. Limpiar datos QA

Antes de publicar, revisa que no queden datos de pruebas:

```powershell
npm run db:summary
npm run db:users
npm run db:products
npm run db:orders
```

Checklist:

- eliminar usuarios QA
- eliminar pedidos QA
- eliminar productos QA
- revisar `backend/uploads/`

Hazlo solo despues del backup.

## 3. Crear cuenta en Railway

Entra a:

- https://railway.com/

Pasos:

1. Crear cuenta.
2. Crear un nuevo proyecto.
3. Elegir deploy desde GitHub o repo conectado.
4. Seleccionar este proyecto.

## 4. Crear el servicio del backend en Railway

Railway tiene que ejecutar el backend, no la raiz completa.

Tu backend esta en:

- `backend/`

Checklist en Railway:

1. Crear servicio nuevo desde el repo.
2. Configurar el servicio para usar `backend/` como root o source dir.
3. Confirmar que el start command sea:

```bash
node server.js
```

Si Railway te pide install command:

```bash
npm install
```

## 5. Crear un Volume en Railway

Esto es obligatorio para tu caso.

Necesitas persistencia para:

- `database/golazostore.db`
- `uploads/`

Pasos:

1. En Railway, abrir el servicio backend.
2. Ir a `Volumes`.
3. Crear un volume.
4. Montarlo en una ruta persistente.

Recomendacion simple:

- mount path: `/app/data`

Despues adapta el backend para que la base y uploads vivan ahi.

## 6. Ajustar rutas persistentes del backend

Tu proyecto hoy trabaja localmente con:

- `backend/database/`
- `backend/uploads/`

Para Railway conviene parametrizar esto con variables de entorno.

Necesitas dejar configurable:

- ruta de SQLite
- ruta de uploads

Recomendacion:

- `SQLITE_DB_PATH=/app/data/golazostore.db`
- `UPLOADS_DIR=/app/data/uploads`

Si hoy el codigo aun no usa esas variables, este es un paso tecnico pendiente antes del deploy final.

## 7. Configurar variables de entorno en Railway

En el servicio backend, carga estas variables:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=un_secreto_muy_largo_y_privado
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tu-dominio.com/frontend
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
EMAIL_FROM=tu-correo@tu-dominio.com
EMAIL_REQUIRED=true
EMAIL_USER=tu-correo@tu-dominio.com
EMAIL_PASS=tu-app-password
INSTAGRAM_ORDER_EXPIRATION_HOURS=12
SQLITE_DB_PATH=/app/data/golazostore.db
UPLOADS_DIR=/app/data/uploads
BACKEND_URL=https://tu-backend.railway.app
```

Notas:

- `JWT_SECRET` tiene que ser unico.
- `FRONTEND_URL` tiene que ser la URL real del frontend.
- `CORS_ORIGINS` solo debe incluir dominios reales.
- `FRONTEND_URL`, `BACKEND_URL` y `CORS_ORIGINS` deben usar `https` en produccion.
- `BACKEND_URL` se usa para construir URLs absolutas de imagenes y no puede quedar en localhost.

## 8. Verificar que Railway exponga el backend

Una vez deployado, prueba:

- `https://tu-backend.railway.app/api/health`

Debe responder algo asi:

```json
{"status":"ok","timestamp":"..."}
```

Si eso falla, no sigas con Vercel todavia.

## 9. Crear cuenta en Vercel

Entra a:

- https://vercel.com/

Pasos:

1. Crear cuenta.
2. Importar repo desde GitHub.
3. Seleccionar este proyecto.

## 10. Configurar el frontend en Vercel

Tu frontend es estatico.

Carpeta relevante:

- `frontend/`

Lo ideal es publicar el sitio estatico apuntando a esa carpeta.

Configuracion recomendada en Vercel:

- Framework preset: `Other`
- Root directory: raiz del repo o `frontend`, segun como lo cargues
- Build command: vacio, o ninguno
- Output directory: `frontend`

Si Vercel no te deja publicarlo limpio desde la UI, crea un `vercel.json` despues. Para una primera pasada, intenta publicar `frontend/` como salida estatica.

## 11. Cambiar la URL del backend en el frontend

Archivo clave:

- `frontend/js/runtime-config.js`

Hoy tienes:

```js
window.GOLAZOSTORE_CONFIG = {
    apiBase: 'http://localhost:3000/api'
};
```

Antes de publicar, debes cambiarlo por tu backend publico:

```js
window.GOLAZOSTORE_CONFIG = {
    apiBase: 'https://tu-backend.railway.app/api'
};
```

Si no haces esto:

- el frontend desplegado seguira queriendo hablar con localhost

## 12. Publicar el frontend

Una vez corregido `apiBase`:

1. subir cambios al repo
2. dejar que Vercel redeploye
3. abrir la URL publica
4. probar `home`, `catalogo`, `producto`, `login`

## 13. Conectar dominio real

Cuando todo funcione en URLs temporales:

1. comprar o usar tu dominio
2. conectarlo a Vercel
3. opcionalmente conectar subdominio para backend en Railway

Ejemplo:

- frontend: `https://golazostore.com`
- backend: `https://api.golazostore.com`

Luego actualizar:

- `FRONTEND_URL`
- `CORS_ORIGINS`
- `BACKEND_URL`
- `frontend/js/store.js`

## 14. Probar flujo real completo

Con frontend y backend ya publicos:

1. abrir home
2. abrir catalogo
3. abrir producto
4. agregar al carrito
5. registrarte con un email real
6. verificar email
7. iniciar sesion
8. hacer checkout
9. ver confirmacion
10. revisar historial
11. entrar como admin
12. revisar productos
13. revisar pedidos

Hazlo desde desktop y celular.

## 15. Probar email real

Pruebas obligatorias:

1. registro con verificacion
2. reenvio de verificacion
3. recuperar contraseña
4. resetear contraseña

Si cualquier link del email apunta a localhost, frena y corrige.

## 16. Probar admin real

Con una cuenta admin real:

1. login
2. crear producto
3. editar producto
4. desactivar producto
5. intentar eliminar producto vendido
6. revisar panel de pedidos
7. cambiar estado de pedido

## 17. Configurar backups en Railway

Aunque uses SQLite, necesitas rutina de backup.

Minimo:

- guardar copia del volume
- exportar SQLite periodicamente
- respaldar `uploads`

Tu objetivo:

- poder reconstruir la tienda si Railway reinicia o si rompes datos

## 18. Checklist final antes de abrir al publico

- backend responde `/api/health`
- frontend carga sin errores
- `apiBase` apunta al backend real
- CORS restringido
- email funciona
- cuenta admin validada
- compra real validada
- historial validado
- panel admin validado
- backup hecho
- dominio conectado
- HTTPS activo

## 19. Problemas comunes

### El frontend carga pero login no funciona

Revisar:

- `frontend/js/store.js`
- `CORS_ORIGINS`
- consola del navegador
- logs del backend

### Las imagenes no cargan

Revisar:

- `BACKEND_URL`
- `uploads` persistente
- permisos de escritura

### El email llega con links malos

Revisar:

- `FRONTEND_URL`

### Todo andaba y despues se perdio la base

Revisar:

- volume montado correctamente
- ruta real de SQLite
- si el backend sigue escribiendo dentro del contenedor y no dentro del volume

## 20. Lo que yo haria en tu lugar

Orden real:

1. Backup.
2. Limpiar QA.
3. Parametrizar ruta de SQLite y uploads.
4. Deploy backend en Railway.
5. Confirmar `/api/health`.
6. Cambiar `apiBase` del frontend al backend publico.
7. Deploy frontend en Vercel.
8. Probar auth y compra real.
9. Conectar dominio.
10. Hacer prueba final end to end.
11. Abrir la tienda.

## 21. Paso siguiente recomendable

Antes de que deployes, conviene hacer una ultima preparacion del codigo:

- mover `apiBase` a variable configurable
- mover ruta de SQLite a variable configurable
- mover ruta de uploads a variable configurable

Eso te evita deploys fragiles.

Si quieres, el siguiente paso lo puedo hacer yo:

1. dejar el proyecto listo para `Vercel + Railway`
2. agregarte las variables configurables
3. dejarte el `vercel.json` y la configuracion recomendada
