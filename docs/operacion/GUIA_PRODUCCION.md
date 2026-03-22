# Guia de paso a produccion

Fecha de referencia: 2026-03-08

Esta guia esta pensada para este proyecto:

- frontend estatico en `frontend/`
- backend Node.js + Express en `backend/`
- base SQLite en `backend/database/golazostore.db`
- archivos subidos en `backend/uploads/`

Objetivo:

- pasar de un entorno local funcional a un entorno publico estable
- evitar los errores mas comunes al publicar por primera vez
- tener un checklist concreto antes de abrir la tienda a usuarios reales

## 1. Definir como vas a publicar

Antes de tocar codigo, define estas 3 cosas:

1. Donde va a vivir el frontend.
2. Donde va a vivir el backend.
3. Donde se va a guardar la base SQLite y la carpeta `uploads`.

Configuracion minima recomendada:

- frontend en un hosting estatico
- backend en un servidor Node dedicado o VPS
- SQLite y `uploads` en disco persistente del servidor

Importante:

- no publiques SQLite en un filesystem temporal
- no publiques `uploads` en una carpeta que se borre al reiniciar el servidor

## 2. Preparar variables de entorno reales

Archivo a revisar:

- `backend/.env`
- `backend/.env.example`

Variables clave para produccion:

```env
PORT=3000
JWT_SECRET=un_secreto_largo_unico_y_privado
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tu-dominio.com/frontend
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
EMAIL_FROM=tu-correo@tu-dominio.com
EMAIL_REQUIRED=true
EMAIL_USER=tu-correo@tu-dominio.com
EMAIL_PASS=tu-password-o-app-password
INSTAGRAM_ORDER_EXPIRATION_HOURS=12
```

Reglas:

- `JWT_SECRET` no puede ser corto ni reciclado.
- `FRONTEND_URL` y `BACKEND_URL` tienen que apuntar a URLs publicas reales.
- en produccion, `FRONTEND_URL`, `BACKEND_URL` y cada origen de `CORS_ORIGINS` deben usar `https` y no pueden apuntar a `localhost`.
- `CORS_ORIGINS` tiene que contener solo dominios reales.
- si el email es obligatorio, tiene que existir un proveedor real configurado: `BREVO_API_KEY` o `SMTP_*` o `EMAIL_USER/EMAIL_PASS`.

## 3. Definir URLs publicas finales

Tienes que decidir tus URLs finales antes de probar emails:

- frontend: `https://tu-dominio.com/frontend/home.html`
- backend: `https://api.tu-dominio.com` o similar

Que revisar:

- links de verificacion de email
- links de reset de contraseña
- origenes permitidos por CORS
- cualquier URL absoluta armada desde backend

Si esto no queda bien:

- los usuarios no van a poder verificar email
- los links de recuperacion pueden quedar apuntando a localhost
- las URLs de imagenes subidas pueden quedar apuntando a localhost

## 4. Hacer backup antes de tocar datos reales

Antes de migrar o limpiar la base:

```powershell
npm run ops:backup
```

Recomendacion:

- crea un backup antes del deploy
- crea otro backup justo antes de abrir la tienda al publico
- define una rutina diaria o semanal de backup

## 5. Limpiar datos de QA y pruebas

Hoy el proyecto ya tuvo corridas de QA automaticas.

Antes de producir:

- eliminar usuarios de prueba
- eliminar pedidos de prueba
- eliminar productos QA
- revisar `uploads` viejos o basura de pruebas

Verificacion rapida:

```powershell
npm run db:summary
npm run db:users
npm run db:products
npm run db:orders
```

Haz esta limpieza con mucho cuidado y siempre con backup previo.

## 6. Validar backend en modo produccion

Checklist:

- el backend inicia sin errores
- `JWT_SECRET` real cargado
- CORS permite solo el frontend real
- el login funciona
- el registro funciona
- el email de verificacion llega
- el reset de contraseña llega
- los uploads guardan bien
- el admin funciona

Prueba minima:

1. Registrar usuario nuevo.
2. Verificar email.
3. Iniciar sesion.
4. Agregar producto al carrito.
5. Crear pedido.
6. Ver pedido en historial.
7. Operar pedido desde admin.

## 7. Revisar SQLite para produccion

SQLite puede servir si:

- el trafico es bajo o moderado
- el proyecto lo va a manejar una sola app backend
- tienes backups claros

SQLite empieza a ser un problema si:

- vas a tener mucho trafico concurrente
- vas a escalar a multiples instancias del backend
- quieres administrar datos remotamente con mas comodidad

Para una primera salida controlada, puedes usar SQLite.

Pero deja esta decision explicitada:

- si el proyecto crece, migrar a Postgres

## 8. Revisar la carpeta uploads

Ruta relevante:

- `backend/uploads/`

Checklist:

- existe en el servidor
- el proceso Node tiene permisos de escritura
- los archivos quedan persistidos
- tienes backup de esa carpeta

Si `uploads` se pierde:

- las imagenes de productos subidas desde admin se rompen

## 9. Configurar proceso del backend

No conviene dejar el backend levantado manualmente en una consola.

Necesitas:

- proceso manejado por PM2, NSSM, Docker o servicio del sistema
- reinicio automatico si el proceso cae
- logs de salida y error

Objetivo minimo:

- si el backend se cae, vuelve solo
- si falla, sabes donde mirar el error

## 10. Revisar rate limit y seguridad

Archivo a revisar:

- `backend/src/routes/auth.js`

El rate limit esta bien para produccion, pero debes confirmar:

- no bloquea usuarios reales demasiado facil
- no rompe tus pruebas finales por IP compartida

Tambien revisar:

- `helmet`
- `cors`
- JWT real
- cuentas admin reales

## 11. Revisar cuentas admin

Antes de abrir:

- confirmar que existe un admin real
- verificar email del admin
- probar login admin
- probar alta, edicion, desactivacion y baja de productos
- probar panel de pedidos

No uses en produccion usuarios QA ni credenciales de prueba.

## 12. Revisar frontend completo

Pantallas a probar una por una:

- `frontend/home.html`
- `frontend/catalogo.html`
- `frontend/producto.html`
- `frontend/carrito.html`
- `frontend/checkout.html`
- `frontend/confirmacion.html`
- `frontend/login.html`
- `frontend/registro.html`
- `frontend/perfil.html`
- `frontend/mis-pedidos.html`
- `frontend/admin-products.html`
- `frontend/admin-orders.html`

Que mirar:

- textos visibles
- errores de acentos o copy
- botones rotos
- carga de imagenes
- responsive en celular
- estados vacios
- errores de API

## 13. Hacer una prueba end to end real

No alcanza con mirar pantallas.

Haz una compra real de punta a punta:

1. Crear usuario nuevo.
2. Verificar email real.
3. Entrar al catalogo.
4. Abrir un producto.
5. Agregar al carrito.
6. Ir a checkout.
7. Crear pedido por Instagram.
8. Ver confirmacion.
9. Ver el pedido en historial.
10. Entrar como admin y operar ese pedido.

Si puedes, hazlo tambien desde celular.

## 14. Checklist final antes de abrir

- dominio listo
- HTTPS activo
- frontend publicado
- backend publicado
- `.env` real cargado
- CORS restringido
- email funcionando
- backup hecho
- datos QA limpiados
- admin validado
- flujo de compra probado
- logs accesibles
- `uploads` persistente

## 15. Riesgos que todavia debes aceptar conscientemente

Si sales hoy con esta arquitectura, los riesgos principales son:

- dependencia de SQLite
- dependencia de SMTP correcto
- dependencia de `uploads` local persistente
- flujo de pago manual por Instagram

Ninguno de esos bloquea una primera salida controlada, pero debes saberlo.

## 16. Orden recomendado para ejecutar

Orden practico:

1. Backup local actual.
2. Limpiar datos QA.
3. Definir dominio y URLs finales.
4. Cargar `.env` real de produccion.
5. Publicar backend.
6. Publicar frontend.
7. Probar registro, login, email y compra completa.
8. Probar admin.
9. Hacer backup post-deploy.
10. Abrir la tienda al publico.

## 17. Recomendacion concreta para tu caso

Para este proyecto, yo haria esto:

1. Salir primero con un deploy simple y controlado.
2. Mantener SQLite en esta primera version si el trafico esperado es bajo.
3. Salir solo con flujo manual por Instagram bien probado.
4. Dejar Mercado Pago como siguiente hito, no como condicion para publicar.
5. Preparar migracion futura a Postgres si el proyecto empieza a moverse en serio.

## 18. Despues del deploy

En las primeras 24 a 72 horas:

- revisar logs
- revisar registros de usuarios
- revisar pedidos creados
- confirmar que no haya errores de CORS
- confirmar que los emails sigan saliendo
- hacer backup de seguridad

---

Si quieres, el siguiente paso util es armar una segunda guia mas concreta:

- `GUIA_DEPLOY_WINDOWS_VPS.md`
- o `GUIA_DEPLOY_FRONTEND_BACKEND.md`

segun donde vayas a publicarlo.
