# Guia de Backup y Restore Local

Fecha de referencia: 2026-03-07

## Objetivo

Dejar una forma simple de respaldar y recuperar el estado local del MVP:

- base SQLite
- imagenes subidas en `backend/uploads`

## Alcance

Estos comandos operan sobre:

- `backend/database/golazostore.db`
- archivos auxiliares SQLite (`-wal`, `-shm`, `-journal`) si existen
- `backend/uploads`

Los backups se guardan en:

- `backups/`

## Comandos

Crear backup:

```powershell
npm run ops:backup
```

Restore desde un backup:

```powershell
npm run ops:restore -- backups/local-state-AAAA-MM-DD_HH-mm-ss
```

Tambien puedes ejecutar directo:

```powershell
node scripts/restore-local-state.js backups/local-state-AAAA-MM-DD_HH-mm-ss
```

## Flujo recomendado

### Backup

1. De preferencia, detener backend si estas haciendo un respaldo critico.
2. Ejecutar `npm run ops:backup`.
3. Verificar la carpeta generada en `backups/`.

### Restore

1. Cerrar backend y frontend.
2. Ejecutar restore con la ruta del backup.
3. El script crea primero un backup de seguridad del estado actual.
4. Levantar nuevamente el proyecto con `INICIAR_TODO.bat`.
5. Verificar:
   - login
   - productos
   - imagenes
   - pedidos

## Que valida el restore

- reemplaza la base activa por la del backup
- reemplaza `backend/uploads` por la carpeta del backup
- conserva un backup de seguridad previo al restore

## Cuándo usarlo

- antes de tocar datos sensibles en SQLite
- antes de limpiezas masivas de productos
- antes de pruebas destructivas
- para volver a un estado funcional conocido

## Limitaciones

- no resuelve conflictos de datos si el backend sigue escribiendo durante el restore
- si el backup fue hecho con el servidor muy activo, el respaldo puede no ser ideal
- es una solucion operativa local de MVP, no un sistema de backup productivo
