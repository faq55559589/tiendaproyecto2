# Guia Rapida: Solucion de Problemas del Servidor

Esta guia contiene los comandos esenciales para administrar y recuperar el backend cuando algo falla.

## 1. Iniciar el servidor

Desde la carpeta principal del proyecto:

Opcion A:
- usar `INICIAR_TODO.bat`

Opcion B:

```powershell
cd backend
node server.js
```

Si ves `Servidor corriendo en puerto 3000`, el backend esta activo.

---

## 2. Error: puerto 3000 ocupado

Sintoma:
- el servidor se cierra al iniciar
- aparece `EADDRINUSE`

Solucion:

```powershell
taskkill /F /IM node.exe
```

Luego vuelve a iniciar el backend.

---

## 3. Error: faltan modulos

Sintoma:
- errores tipo `Cannot find module 'express'`

Solucion:

```powershell
cd backend
npm install
```

---

## 4. Verificar correos en desarrollo

Si no llegan correos de recuperacion o verificacion:
- revisa la consola del backend
- busca mensajes de modo desarrollo
- valida el link que se imprime en consola

---

## 5. Comandos utiles de base de datos

Para verificar usuarios o mantenimiento puntual:

```powershell
node scripts/verify_existing_users.js
```

---

## 6. Error al crear producto con foto en panel admin

Sintoma:
- el panel admin no deja crear productos con imagen
- el backend falla al subir archivo

Causa detectada y corregida:
- faltaba la carpeta `backend/uploads`
- el middleware de subida no la creaba automaticamente

Estado actual implementado:
- `backend/src/middleware/upload.js` ya crea `backend/uploads` automaticamente
- usa ruta absoluta para guardar archivos

Si el cambio no se refleja, reinicia backend:

```powershell
taskkill /F /IM node.exe
cd backend
node server.js
```

Verificacion rapida:
- confirmar que existe `backend/uploads`
- volver a probar alta de producto desde `frontend/admin-products.html`

---

## Tips extra

- `Ctrl + C` detiene el servidor si la ventana sigue abierta
- si `taskkill` falla, abre la terminal como administrador
