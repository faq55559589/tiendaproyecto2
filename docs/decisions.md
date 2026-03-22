# Decisiones del Proyecto

Registro corto de decisiones vigentes para no reabrir discusiones ya cerradas en cada sesion.

## Como usar este archivo

- Registrar decisiones activas, no debate historico completo.
- Si una decision cambia, actualizar la entrada existente.
- Enlazar al documento operativo o tecnico que tenga mas detalle.

## Decisiones vigentes

### 1. Arquitectura base

- Decision: mantener `frontend` HTML/CSS/JS + backend `Node.js/Express` + `SQLite`.
- Motivo: ya resuelve el MVP real sin meter una migracion grande.
- Impacto: cualquier mejora debe respetar esta base hasta cerrar MVP.
- Referencia: `docs/plans/PLAN_CIERRE_MVP.md`

### 2. Base de datos y persistencia

- Decision: `SQLite` sigue siendo la fuente principal de verdad del negocio.
- Motivo: simplicidad operativa y bajo costo de cambio para esta etapa.
- Impacto: deploy necesita almacenamiento persistente para DB y `uploads`.
- Referencia: `docs/operacion/GUIA_DEPLOY_VERCEL_RAILWAY.md`

### 3. Alcance del MVP de pagos

- Decision: el MVP cierra con coordinacion manual por Instagram.
- Motivo: permite venta real sin bloquear el cierre por integracion de pagos online.
- Impacto: `Mercado Pago` queda explicitamente fuera del cierre MVP y pasa a roadmap post-MVP.
- Referencia: `docs/plans/PLAN_CIERRE_MVP.md`

### 4. Fuente de verdad del pedido manual

- Decision: primero se crea el pedido en SQLite y luego se abre Instagram.
- Motivo: Instagram es canal de coordinacion, no sistema de registro.
- Impacto: pedidos manuales quedan trazables, expiran y reponen stock si no avanzan.
- Referencia: `docs/PROJECT_STATUS.md`

### 5. Manejo de productos con historial

- Decision: un producto vendido no se elimina fisicamente si romperia trazabilidad.
- Motivo: conservar historial de pedidos y consistencia de negocio.
- Impacto: se prioriza desactivar productos; el borrado fisico queda restringido segun historial.
- Referencia: `docs/PROJECT_STATUS.md`

### 6. Entorno local soportado

- Decision: en Windows, el flujo oficial de arranque es `INICIAR_TODO.bat`.
- Motivo: normaliza puertos, cierre de procesos viejos y arranque reproducible.
- Impacto: cuando algo falle en local, se diagnostica contra ese flujo antes de inventar variantes.
- Referencia: `docs/operacion/GUIA_SETUP_LOCAL.md`

### 7. Watcher de desarrollo backend

- Decision: usar `scripts/dev-backend.js` en lugar de depender de `node --watch` o `nodemon`.
- Motivo: hubo fallos de entorno con `spawn EPERM`.
- Impacto: el flujo de desarrollo debe respetar ese watcher en este entorno.
- Referencia: `README.md`

### 8. Documentacion operativa minima obligatoria

- Decision: la entrada minima de contexto del repo es:
  - `README.md`
  - `docs/PROJECT_STATUS.md`
  - `docs/current-work.md`
  - `docs/decisions.md`
- Complemento estable: `AGENTS.md` define los roles permanentes para repartir trabajo sin reabrir el diseno de agentes en cada sesion.
- Motivo: reducir tiempo de reentrada y evitar contexto implicito.
- Impacto: cualquier handoff o nueva sesion debe actualizar al menos `current-work` si cambia el foco.

### 9. Reparto permanente por agentes

- Decision: mantener un catalogo fijo de agentes del proyecto en `AGENTS.md`.
- Motivo: compactar contexto dentro del repo y evitar depender de hilos temporales de Codex.
- Impacto: las tareas nuevas deben arrancar identificando agente lider, archivos probables, riesgo principal y documento a actualizar.
- Referencia: `AGENTS.md`

### 10. Validacion estricta de produccion

- Decision: el backend debe fallar temprano si la configuracion de produccion es insegura o inconsistente.
- Motivo: evitar deploys que parezcan sanos pero publiquen links locales, CORS mal armado o email obligatorio sin proveedor real.
- Impacto: en produccion, `FRONTEND_URL`, `BACKEND_URL` y `CORS_ORIGINS` deben usar `https`; `FRONTEND_URL` y `BACKEND_URL` no pueden apuntar a `localhost`; `EMAIL_REQUIRED=true` exige proveedor de email configurado.
- Referencia: `backend/src/config/env.js`

### 11. Flujo operativo de npm en Windows PowerShell

- Decision: en este entorno Windows, el camino operativo documentado usa `npm.cmd` cuando PowerShell bloquea `npm` por Execution Policy.
- Motivo: evitar falsas fallas de setup en sesiones nuevas o handoffs.
- Impacto: la documentacion operativa y los ejemplos de arranque local deben contemplar `npm.cmd` como variante soportada.
- Referencia: `docs/operacion/GUIA_SETUP_LOCAL.md`

### 12. Documentacion obligatoria de planes aprobados

- Decision: cuando `ARCHITECT` proponga un plan o una ampliacion relevante, primero debe pedir aprobacion explicita del usuario. Solo despues de esa aprobacion, `SCRIBE` debe documentarlo aunque todavia no se haya ejecutado.
- Motivo: evitar perder contexto entre sesiones sin convertir cada idea o borrador en roadmap persistente antes de validarlo con el usuario.
- Impacto:
  - no se documentan como roadmap activo los planes no aprobados,
  - el plan debe quedar en `docs/plans/` o en el documento tecnico correspondiente,
  - debe enlazarse desde `docs/README.md`,
  - debe mencionarse en `docs/current-work.md`,
  - y debe registrarse en `docs/PROJECT_STATUS.md` si altera el roadmap activo o abre una linea aprobada de trabajo.
- Referencia: `AGENTS.md`

### 13. Explicacion persistente de implementaciones cuando el usuario la pida

- Decision: si el usuario pide explicitamente `dile a tutor que explique` despues de una implementacion, `MENTOR/TUTOR` debe dejar una explicacion persistente dentro de `docs/`.
- Motivo: capturar no solo el `que` del cambio sino tambien el `por que`, el problema original y los tradeoffs, para no perder contexto tecnico entre sesiones.
- Impacto:
  - la explicacion debe vivir en un documento tecnico adecuado, normalmente dentro de `docs/tecnico/`,
  - `SCRIBE` debe enlazar o registrar esa referencia si mejora la reentrada futura,
  - no hace falta esperar a un nuevo plan; aplica a implementaciones ya ejecutadas cuando el usuario lo pida.
- Referencia: `AGENTS.md`

### 14. La estructura documental principal se organiza por tipo de documento, no por agente

- Decision: no crear carpetas principales separadas por agente. La documentacion se organiza por funcion:
  - estado,
  - decisiones,
  - planes,
  - tecnico,
  - operacion,
  - QA.
- Motivo: un mismo cambio suele cruzar varios agentes y separar por agente fragmenta el contexto.
- Impacto:
  - `SCRIBE` y `TUTOR` documentan en el lugar correspondiente segun tipo de informacion,
  - si hace falta una guia de reparto documental, debe vivir como indice o workflow, no como arbol por agente.
- Referencia: `docs/agents-workflow.md`

### 15. ARCHITECT reparte la tanda y SHIP cierra la entrega tecnica

- Decision: `ARCHITECT` debe delegar explicitamente por agente cuando una tanda cruce varias areas, y `SHIP` debe encargarse del cierre tecnico cuando la tanda llega a estado de entrega.
- Motivo: evitar que la orquestacion, la implementacion, la documentacion y la salida tecnica queden mezcladas en un solo rol.
- Impacto:
  - `ARCHITECT` planifica y reparte,
  - `FORGE` y `NOVA` implementan segun area,
  - `SCRIBE` documenta,
  - `TUTOR` explica cuando el usuario lo pide,
  - `SHIP` revisa diff, validaciones, faltantes y push cuando corresponda.
- Referencia: `AGENTS.md`

## Criterio para abrir una nueva decision

Agregar una nueva entrada solo si cambia una de estas cosas:

- arquitectura,
- infraestructura,
- fuente de verdad de un flujo,
- alcance del MVP,
- reglas de negocio que afectan datos o operacion.
