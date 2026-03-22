# Setup Local Real

Guia corta para dejar GolazoStore corriendo en Windows sin adivinar pasos.

## Requisitos

- `Node.js LTS`
- `npm`
- PowerShell
- Puertos libres `3000` y `8000`

## Orden recomendado

1. Instala Node.js LTS.
2. Verifica que `node -v` responda.
3. En PowerShell de Windows, si `npm` falla por Execution Policy, usa `npm.cmd`.
4. Verifica `npm` con `npm.cmd -v`.
5. Copia `backend/.env.example` a `backend/.env`.
6. Completa `JWT_SECRET` con un valor largo y unico.
7. Para pruebas locales, deja `EMAIL_REQUIRED=false`.
8. Revisa `FRONTEND_URL`, `BACKEND_URL` y `CORS_ORIGINS`.
9. Instala dependencias en `backend/` o ejecuta `npm.cmd run local:setup` desde la raiz.
10. Levanta backend y frontend con `INICIAR_TODO.bat`.

## Comandos utiles

```powershell
npm.cmd run local:setup
```

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

```powershell
cd ..
node scripts/serve-frontend.js
```

```powershell
.\INICIAR_TODO.bat
```

## Notas importantes

- El repo raiz mantiene solo `backend` como workspace para evitar instalaciones inconsistentes.
- El flujo local soportado carga `backend/.env`; `backend/.env.backend` ya no forma parte del bootstrap.
- En esta maquina, `npm` directo en PowerShell puede fallar por Execution Policy; `npm.cmd` funciona y es el camino soportado.
- Si `better-sqlite3` pide build tools, instala las herramientas de C++ de Visual Studio.
- Si ya hay procesos usando `3000` o `8000`, el BAT intenta cerrarlos antes de relanzar.

## Verificacion minima

- Backend responde en `http://localhost:3000/api/health`.
- Frontend abre en `http://localhost:8000/frontend/home.html`.
- Login y catalogo cargan sin errores.
- El panel admin solo debe abrir con usuario con rol `admin`.
