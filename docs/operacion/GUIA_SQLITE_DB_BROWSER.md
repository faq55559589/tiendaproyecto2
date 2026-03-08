# Guia SQLite y DB Browser

Fecha de referencia: 2026-03-08

## Objetivo

Definir un flujo confiable para inspeccionar y operar la base local `SQLite` sin depender de cambios manuales inseguros.

## Base real del proyecto

La base usada por el backend es:

- `backend/database/golazostore.db`

No trabajes sobre copias ni otros archivos `.sqlite` viejos.

## Flujo recomendado

### Para inspeccionar datos

Usar `DB Browser for SQLite`:

1. Abrir `backend/database/golazostore.db`
2. Revisar tablas y consultas en modo lectura
3. Si hiciste cambios manuales:
   - ejecutar `Write Changes`
   - cerrar y volver a abrir si dudas del estado real

### Para cambios rutinarios

Preferir scripts del proyecto antes que editar a mano:

```powershell
cmd /c npm run db:summary
cmd /c npm run db:users
cmd /c npm run db:products
cmd /c npm run db:orders
```

Tambien puedes usar directo:

```powershell
node scripts/db-admin.js user-orders facundonew2003@gmail.com
node scripts/db-admin.js promote-admin facundonew2003@gmail.com
```

## Regla operativa importante

Si vas a hacer cambios manuales en `DB Browser`:

1. Crear backup antes:

```powershell
cmd /c npm run ops:backup
```

2. Si el cambio es delicado:
   - cerrar backend
   - aplicar el cambio
   - guardar con `Write Changes`
   - volver a levantar backend

Esto evita:

- vistas cacheadas
- cambios no persistidos
- conflictos con el archivo SQLite en uso

## Comandos disponibles

### Resumen general

```powershell
cmd /c npm run db:summary
```

### Usuarios recientes

```powershell
cmd /c npm run db:users
```

### Productos recientes

```powershell
cmd /c npm run db:products
```

### Pedidos recientes

```powershell
cmd /c npm run db:orders
```

### Pedidos por usuario

```powershell
node scripts/db-admin.js user-orders facundonew2003@gmail.com
```

### Promover usuario a admin

```powershell
node scripts/db-admin.js promote-admin facundonew2003@gmail.com
```

## Cuándo usar GUI y cuándo usar scripts

Usa `DB Browser` para:

- mirar tablas
- revisar relaciones
- correr consultas exploratorias

Usa scripts para:

- verificar estado real rapido
- promover admin
- revisar pedidos por usuario
- tareas repetitivas que no conviene hacer a mano

## Limitaciones

- `DB Browser` puede mostrar cambios en grilla que no impactan hasta `Write Changes`
- si el backend esta corriendo, la percepcion visual del archivo puede confundirte
- para acciones destructivas o limpiezas, haz backup primero
