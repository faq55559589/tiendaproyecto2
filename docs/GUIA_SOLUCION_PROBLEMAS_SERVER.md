# 🛠️ Guía Rápida: Solución de Problemas del Servidor

Esta guía contiene los comandos esenciales para administrar y "revivir" el servidor backend cuando las cosas no funcionan.

## 1. 🚀 Iniciar el Servidor

Desde la carpeta principal del proyecto:

**Opción A (Recomendada si tienes el .bat):**
Simplemente doble clic en tu archivo `iniciar_todo.bat` (si lo creamos) o el bat del servidor.

**Opción B (Manual desde terminal):**
```powershell
cd backend
npm start
```
*Si ves "Servidor corriendo en puerto 3000", ¡todo está bien!*

---

## 2. 🛑 Error: "Address already in use :::3000" (Puerto Ocupado)

**Síntoma:** El servidor se cierra inmediatamente al abrirlo, o ves un error `EADDRINUSE` en rojo.
**Causa:** Ya hay otro servidor corriendo "fantasma" en el fondo ocupando el puerto.

**SOLUCIÓN (El "Mataprocesos"):**
Ejecuta este comando en la terminal (PowerShell o CMD) para cerrar todos los Node.js a la fuerza:

```powershell
taskkill /F /IM node.exe
```

*Después de esto, intenta iniciar el servidor de nuevo.*

---

## 3. 📦 Error: "Cannot find module..."

**Síntoma:** El servidor no arranca y dice que falta `express`, `bcryptjs`, `better-sqlite3`, etc.
**Causa:** Faltan descargar las librerías.

**SOLUCIÓN:**
Ve a la carpeta backend e instala:

```powershell
cd backend
npm install
```

---

## 4. 📧 Verificar Correos (Modo Desarrollo)

Si no llegan los correos de recuperación o registro:

1.  Asegúrate de que la ventana del servidor esté abierta y visible.
2.  Busca mensajes que digan **"⚠️ MODO DEV"**.
3.  Ahí verás el **Link** de recuperación/verificación simulado.

---

## 5. 🔍 Comandos Útiles de Base de Datos

Si necesitas verificar usuarios desde la terminal (scripts que creamos):

**Listar usuarios y ver si están verificados:**
```powershell
node scripts/list_users.js
# (Nota: asegúrate de tener el script list_users.js en la raíz o ajusta la ruta)
# Si el script está en backend:
cd backend
node list_users.js
```

**Verificar manualmente a todos los usuarios antiguos:**
```powershell
node scripts/verify_existing_users.js
```

---

### 💡 Tips Extra
*   **Ctrl + C**: Para detener el servidor correctamente si tienes la ventana abierta.
*   **Administrador**: A veces `taskkill` requiere que abras la terminal como Administrador si el proceso es rebelde, pero usualmente no.
