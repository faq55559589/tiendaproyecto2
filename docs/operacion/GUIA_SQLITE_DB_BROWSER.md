# Guia SQLite, DB Browser y flujo local-produccion

Fecha de referencia: 2026-03-09

## Objetivo

Dejar un flujo claro y repetible para trabajar con SQLite en este proyecto sin perderse entre:

- base local
- base real de produccion en Railway
- DB Browser for SQLite
- scripts operativos
- backups y restores

La idea es trabajar comodo en local y tocar produccion solo cuando haga falta.

## 1. Que bases existen en este proyecto

### Base local de trabajo

Archivo:

- `backend/database/golazostore.db`

Esta es la base que puedes abrir comodamente con `DB Browser for SQLite`.

Importante:

- no confundirse con `backend/database.sqlite`
- ese archivo no es la base activa del backend actual y puede quedar desfasado o vacio
- la base real del proyecto hoy es `backend/database/golazostore.db`

### Base real de produccion

En Railway, la base no vive en el repo. Vive en el volume montado en:

- `/app/data/golazostore.db`

Importante:

- la base local y la base de Railway no son la misma
- editar la local no cambia produccion
- editar produccion no actualiza tu archivo local automaticamente

## 2. Recomendacion operativa

### Regla simple

Usa este criterio:

- `DB Browser` para inspeccion y edicion visual
- `scripts/db-admin.js` para tareas repetitivas locales
- `Railway shell` solo para inspecciones puntuales o emergencias

### Flujo recomendado

1. Mirar o editar en local con `DB Browser`
2. Hacer backup antes de cambios delicados
3. Dejar la base local en el estado correcto
4. Reemplazar o sincronizar produccion solo cuando ya estes seguro

No conviene manejar el dia a dia de produccion con one-liners o edits en caliente sobre Railway.

## 3. Como abrir la base local con DB Browser

1. Abrir `DB Browser for SQLite`
2. `Open Database`
3. Elegir:
   - `backend/database/golazostore.db`
4. Ir a `Browse Data`
5. Elegir tabla:
   - `users`
   - `products`
   - `orders`
   - `order_items`
   - `cart_items`

Cuando termines:

- si hiciste cambios, usar `Write Changes`
- cerrar la base si vas a levantar backend o correr scripts inmediatamente

Si VS Code o una extension te muestra pocos datos o una base vacia:

- confirma que abriste `backend/database/golazostore.db`
- no `backend/database.sqlite`
- recuerda que el backend usa modo `WAL`, asi que conviene cerrar el backend antes de inspeccionar visualmente si la extension no refresca bien los cambios

## 4. Que tareas conviene hacer con script en vez de a mano

`DB Browser` es ideal para mirar datos, pero varias tareas son mas seguras con script.

### Comandos ya disponibles

Desde la raiz del repo:

```powershell
cmd /c npm run db:summary
cmd /c npm run db:users
cmd /c npm run db:products
cmd /c npm run db:orders
```

O directo:

```powershell
node scripts/db-admin.js summary
node scripts/db-admin.js users
node scripts/db-admin.js products
node scripts/db-admin.js orders
```

### Comandos utiles agregados

Ver un usuario puntual:

```powershell
node scripts/db-admin.js user facundonew2003@gmail.com
```

Ver pedidos de un usuario:

```powershell
node scripts/db-admin.js user-orders facundonew2003@gmail.com
```

Promover a admin:

```powershell
node scripts/db-admin.js promote-admin facundonew2003@gmail.com
```

Asignar rol explicitamente:

```powershell
node scripts/db-admin.js set-role facundonew2003@gmail.com admin
node scripts/db-admin.js set-role facundonew2003@gmail.com user
```

Marcar usuario como verificado:

```powershell
node scripts/db-admin.js verify-user facundonew2003@gmail.com
```

Eliminar un usuario:

```powershell
node scripts/db-admin.js delete-user facundonew2003@gmail.com
```

Eliminar varios usuarios:

```powershell
node scripts/db-admin.js delete-users uno@mail.com dos@mail.com tres@mail.com
```

## 5. Cuando usar DB Browser y cuando no

### Si, usar DB Browser para:

- inspeccionar tablas
- revisar relaciones
- editar datos puntuales con contexto visual
- dejar un admin listo en la base local
- limpiar usuarios QA en local

### No es ideal para:

- editar produccion en vivo
- cambios masivos sin backup
- tocar la base mientras el backend esta escribiendo

## 6. Backup y restore local

Antes de hacer cambios delicados sobre la base local:

```powershell
cmd /c npm run ops:backup
```

Restore local:

```powershell
cmd /c npm run ops:restore -- backups/local-state-AAAA-MM-DD_HH-mm-ss
```

Notas:

- el backup incluye SQLite y `backend/uploads`
- el restore local reemplaza ambos
- antes de restore, cerrar backend/frontend

## 7. Como inspeccionar la base real de Railway

Railway no ofrece un explorador visual de archivos del volume como un hosting tradicional.

La base real de produccion esta en:

- `/app/data/golazostore.db`

La forma practica de inspeccionarla es:

1. instalar `railway cli`
2. conectarte por `railway ssh`
3. correr consultas o scripts dentro del contenedor

### Ejemplo: listar usuarios en produccion

Dentro de la shell de Railway:

```bash
node -e "const Database=require('/app/node_modules/better-sqlite3'); const db=new Database('/app/data/golazostore.db'); console.log(db.prepare('SELECT id, email, first_name, last_name, role, is_verified FROM users ORDER BY id DESC').all());"
```

### Ejemplo: borrar usuarios de prueba en produccion

```bash
node -e "const Database=require('/app/node_modules/better-sqlite3'); const db=new Database('/app/data/golazostore.db'); const emails=['uno@mail.com','dos@mail.com']; const stmt=db.prepare('DELETE FROM users WHERE email = ?'); let total=0; for (const email of emails) total += stmt.run(email).changes; console.log({deleted: total});"
```

## 8. Puedo descargar visualmente la base de produccion

En la practica, no de forma comoda.

Railway sirve muy bien para:

- deploys
- variables
- logs
- networking
- volumes

Pero no esta pensado como gestor visual de SQLite ni como explorador de archivos del volume.

Punto importante:

- `railway ssh` te deja entrar al contenedor
- pero no ofrece `scp` ni `sftp`
- Railway tampoco expone una descarga visual simple del archivo `/app/data/golazostore.db`

Por eso, para este proyecto, el flujo recomendado es:

1. inspeccionar produccion por shell cuando haga falta
2. mantener una copia local editable con `DB Browser`
3. tratar la base local como tu area de trabajo

## 9. Paso a paso real para traer produccion a local

Este es el procedimiento realista hoy si queres abrir la base actual de produccion en tu maquina y verla con `DB Browser`.

### Lo que si puedes hacer comodo

Una vez que el archivo este en tu PC:

1. abrir `DB Browser for SQLite`
2. hacer `Open Database`
3. elegir el archivo `.db`
4. entrar en `Browse Data`
5. revisar o editar tablas visualmente

### Lo que falta resolver hoy

El paso incomodo no es abrir la base local.

El paso incomodo es bajar la copia actual desde Railway, porque Railway no da una descarga directa del archivo del volume.

### Flujo actual minimo viable

1. entrar al proyecto de Railway donde corre el backend
2. verificar que la base activa esta en:
   - `/app/data/golazostore.db`
3. instalar y autenticar `Railway CLI` en tu maquina
4. vincular la carpeta local a ese proyecto o copiar el comando SSH desde el panel de Railway
5. abrir una shell remota con `railway ssh`
6. dentro del contenedor, generar una copia de trabajo de la base
7. sacar esa copia del entorno remoto por un flujo tecnico adicional
8. guardar esa copia en tu maquina, por ejemplo en:
   - `backups/produccion/golazostore-AAAA-MM-DD.db`
9. abrir ese archivo con `DB Browser`

### Honestamente: que significa el paso 7

Ese paso 7 hoy no esta resuelto de forma prolija dentro del proyecto.

Con el stack actual tienes tres caminos:

1. usar un flujo manual de terminal para volcar el archivo
2. montar una herramienta temporal de exportacion
3. agregar al proyecto una descarga protegida para snapshots

### Recomendacion para este proyecto

Si queres evitar depender de comandos para consultar tablas o inspeccionar datos, la mejora correcta no es usar mas shell.

La mejora correcta es agregar una forma de exportar la base actual desde produccion y bajarla a local como archivo.

Ejemplo de mejora razonable:

- endpoint admin protegido que genere snapshot
- descarga del `.db` o `.zip`
- guardado local en `backups/`
- apertura posterior con `DB Browser`

### Conclusión operativa

Hoy:

- abrir la base local con `DB Browser` es facil
- bajar la base actual de Railway no es un flujo visual resuelto
- para trabajo diario, conviene usar la base local como entorno de edicion
- si queres comodidad real para traer produccion a local, hay que agregar una herramienta de exportacion al proyecto

## 10. Flujo recomendado para publicar una base local en Railway

Si ya dejaste tu base local correcta y queres convertirla en la base de produccion:

1. crear backup local
2. exportar o guardar la base final local
3. hacer backup de seguridad de produccion
4. reemplazar `golazostore.db` del volume de Railway
5. reiniciar o redeployar backend
6. validar:
   - login
   - admin
   - productos
   - pedidos
   - imagenes

### Regla operativa

No reemplaces la base de produccion si:

- no hiciste backup
- no validaste primero tu base local
- no tenes claro si produccion ya tiene datos nuevos que quieras conservar

## 11. Estrategia recomendada para este proyecto

Para este stack (`Node + Express + SQLite + Railway volume`) la forma mas sana de trabajar es:

### Desarrollo y limpieza

- usar `backend/database/golazostore.db`
- abrirla con `DB Browser`
- usar `scripts/db-admin.js` para tareas repetitivas

### Produccion

- usar Railway shell solo para inspecciones puntuales
- evitar editar tablas enteras a mano desde shell
- usar el volume como almacenamiento persistente

### Cuando necesites una "foto" de produccion

- primero inspeccionar por shell
- luego decidir si realmente vale la pena bajar la base completa

## 12. Reglas que te ahorran problemas

1. No borres la tabla `users` completa si solo queres sacar cuentas de prueba.
2. No mezcles base local con produccion mentalmente: son copias distintas.
3. No edites SQLite sin backup si el cambio es sensible.
4. No confies en que Git tiene la base: en este proyecto la base no esta versionada.
5. Si tocaste datos a mano, validalos despues con login real o scripts.

## 13. Siguiente mejora sugerida

Para una operacion mas comoda, el siguiente paso tecnico razonable seria agregar una herramienta del proyecto para:

- exportar snapshot de produccion
- importar snapshot validado a Railway
- dejar registro del backup aplicado

Eso seria mejor que depender solo de comandos manuales de shell.
