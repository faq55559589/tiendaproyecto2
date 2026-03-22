# Inventario Breve de Scripts

Resumen corto de los scripts mas utiles del repo.

## Arranque y desarrollo

- `scripts/serve-frontend.js`: servidor estatico para el frontend.
- `scripts/dev-backend.js`: recarga local para el backend.
- `INICIAR_TODO.bat`: arranque completo de backend y frontend en Windows.

## Base de datos y operacion

- `scripts/db-admin.js`: resumen, usuarios, productos y pedidos de SQLite.
- `scripts/backup-local-state.js`: backup de SQLite y uploads.
- `scripts/restore-local-state.js`: restore de estado local.
- `scripts/patch_db.js`: ajustes puntuales sobre la base.
- `scripts/update_db.js`: actualizaciones manuales de datos.

## QA y validacion

- `scripts/qa_fase2_mvp.js`: validacion del flujo MVP.
- `scripts/qa_cierre_mvp.js`: QA de cierre.
- `scripts/test_api.js`: pruebas sobre la API.
- `scripts/test_forgot.js`: validacion de recuperacion de contrasena.
- `scripts/simulate_flow.js`: simulacion de flujo completo.

## Mantenimiento

- `scripts/ensure_user.js`: asegura usuarios utiles para pruebas.
- `scripts/verify_existing_users.js`: revisa usuarios ya creados.

## Legacy

- `scripts/legacy/`: utilidades historicas o reemplazadas.
- `backend/scripts/legacy/`: material legado interno del backend.

## Regla practica

- Si el script opera en produccion o datos reales, debe quedar documentado aqui o en una guia operativa mas especifica.
- Si el script es legacy, no debe confundirse con el flujo oficial.
