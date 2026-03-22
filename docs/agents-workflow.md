# Flujo documental por agentes

Guia corta para decidir donde documentar cada cambio sin fragmentar el contexto por agente.

## Regla principal

La documentacion del proyecto se organiza por tipo de documento, no por agente.

## Convencion visual opcional para terminal

- Si se quiere distinguir agentes en salida de terminal o logs, usar siempre prefijo en corchetes al inicio de la linea:
  - `[ATLAS]`
  - `[ARCHITECT]`
  - `[NOVA]`
  - `[FORGE]`
  - `[MENTOR]` o `[TUTOR]`
  - `[SENTINEL]`
  - `[SCRIBE]`
  - `[SHIP]`
- El color es solo una ayuda visual local, no una garantia del sistema.
- Wrapper disponible en el repo:
  - `scripts/colorize-agent-prefix.ps1`
- Ejemplos de uso:
  - `algun_comando | .\scripts\colorize-agent-prefix.ps1`
  - `Get-Content .\archivo.log -Wait | .\scripts\colorize-agent-prefix.ps1`

Motivo:

- un mismo cambio puede pasar por varios agentes,
- separar por agente fragmenta el contexto,
- al volver al repo suele importar mas el tipo de informacion que quien la produjo.

## Estructura recomendada

### 1. Estado operativo

Archivos:

- `docs/current-work.md`
- `docs/PROJECT_STATUS.md`

Usar para:

- foco actual,
- ultimo tramo ejecutado,
- siguiente paso recomendado,
- resumen operativo de cambios recientes.

## 2. Decisiones vigentes

Archivo:

- `docs/decisions.md`

Usar para:

- reglas nuevas,
- criterios permanentes,
- decisiones de alcance,
- politicas de trabajo y documentacion.

## 3. Planes aprobados

Carpeta:

- `docs/plans/`

Usar para:

- planes aprobados por el usuario,
- roadmap ejecutable,
- orden de fases y tramos.

## 4. Explicacion tecnica

Carpeta:

- `docs/tecnico/`

Usar para:

- explicar por que se hizo un cambio,
- registrar causas y tradeoffs,
- walkthroughs del codebase,
- documentos pedidos a `TUTOR`.

## 5. Operacion

Carpeta:

- `docs/operacion/`

Usar para:

- setup,
- deploy,
- troubleshooting,
- backups,
- entorno local y produccion.

## 6. QA

Carpeta:

- `docs/qa/`

Usar para:

- validaciones,
- resultados de pruebas,
- scripts QA relevantes,
- cierres funcionales.

## Que documenta cada agente

### ARCHITECT

- Propone el plan.
- Si el usuario no aprueba, no entra a roadmap persistente.
- Si el usuario aprueba, habilita a `SCRIBE` a registrar el plan.
- Si la tanda cruza varias areas, debe repartir explicitamente que agente lidera cada tramo.

### SCRIBE

- Registra planes aprobados.
- Actualiza estado operativo.
- Enlaza documentos nuevos dentro de `docs/README.md`.
- Mantiene alineada la estructura documental con el estado real del repo.

### TUTOR / MENTOR

- Explica implementaciones cuando el usuario lo pide.
- Deja explicacion persistente en `docs/tecnico/`.
- No reemplaza el estado operativo; lo complementa.

### SHIP

- Entra cuando la tanda ya esta para entrega o el usuario pide subir cambios.
- Se ocupa de:
  - revisar diff final,
  - confirmar validaciones o dejar brechas explicitas,
  - verificar faltantes de cierre,
  - preparar rama, commit y push cuando corresponda.
- No reemplaza a `ARCHITECT`; cierra la salida tecnica del trabajo ya decidido.

### FORGE / NOVA / SENTINEL / ATLAS

- Pueden producir contenido tecnico u operativo,
- pero el criterio de ubicacion sigue siendo por tipo de documento, no por agente.

## Regla simple para cambios del dia

Cuando se implementa algo:

1. actualizar `docs/current-work.md`
2. actualizar `docs/PROJECT_STATUS.md`

Si ademas aplica:

3. si cambia una regla, actualizar `docs/decisions.md`
4. si cambia roadmap o fases, actualizar `docs/plans/`
5. si amerita explicacion profunda, crear o actualizar `docs/tecnico/`
6. si hubo validacion concreta, registrar en `docs/qa/`

## Regla simple para cierre de tanda

Si la implementacion ya termino y el usuario quiere dejarla lista para salida tecnica:

1. `SCRIBE` verifica que el estado documental minimo este al dia
2. `TUTOR` explica solo si el usuario lo pide
3. `SHIP` revisa diff, validaciones, faltantes y rama/commit/push si corresponde

## Regla para pedidos de explicacion

Si el usuario dice `dile a tutor que explique`:

- `TUTOR` debe crear o actualizar un documento tecnico en `docs/tecnico/`
- `SCRIBE` debe enlazarlo si mejora la reentrada futura

## Que evitar

- no crear una carpeta por agente como estructura principal,
- no duplicar el mismo contexto en muchos archivos,
- no mezclar changelog operativo con explicacion tecnica profunda,
- no documentar planes no aprobados como si fueran roadmap activo.

## Resumen corto

La pregunta correcta no es `que agente lo hizo`.

La pregunta correcta es:

- `esto es estado, decision, plan, explicacion tecnica, operacion o QA?`

Con eso, la ubicacion documental sale casi sola.
