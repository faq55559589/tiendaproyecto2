# Plan de cierre integral de Mercado Pago 2026-03-21

## Objetivo

Cerrar la integracion de `Checkout Pro` de Mercado Pago con criterio de:

- funcionamiento end-to-end en sandbox
- aprendizaje practico de configuraciones disponibles
- endurecimiento de seguridad antes de produccion
- cierre operativo real para GolazoStore

## Estado de partida

Ya esta resuelta la base tecnica:

- creacion de preferencia
- redireccion a `Checkout Pro`
- webhook de pago
- actualizacion real de la orden
- retorno a `confirmacion.html` en local usando backend publico temporal

Limitacion actual conocida:

- en local con `ngrok free` aparece el interstitial visual de `ngrok`
- eso no rompe el pago ni el webhook, pero si ensucia la experiencia de retorno

## Alcance aprobado

El usuario aprobo cubrir no solo el flujo minimo, sino tambien revisar y aprender las configuraciones adicionales de Mercado Pago.

## Fase 1. Matriz de estados reales

Lider: `FORGE`

Objetivo:

- validar manualmente los estados principales pendientes

Casos a probar:

- `APRO`
- `CONT`
- `OTHE`
- reintento de pago
- expiracion de orden pendiente

Resultado esperado:

- matriz corta con comportamiento real de:
  - orden
  - `payment_status`
  - stock
  - reintento

## Fase 2. Configuraciones avanzadas de Checkout Pro

Lider: `FORGE`
Apoyo: `SCRIBE`

Objetivo:

- recorrer una por una las configuraciones relevantes de la preferencia
- aplicar las que tengan valor para el negocio
- documentar para aprendizaje y reentrada futura

Configuraciones a evaluar:

- reembolsos y cancelaciones
- exclusion de medios de pago
- restricciones a usuarios registrados
- preferencia con multiples items
- mostrar valor de envio
- fecha de vencimiento
- descripcion de factura o descripcion visible del cargo
- apariencia del boton de pago
- modo binario
- vigencia de preferencia
- apertura con redirect externo

Para cada una registrar:

- que hace
- como se configura
- si conviene para GolazoStore
- decision tomada

## Fase 3. Seguridad y hardening

Lider: `SENTINEL`
Apoyo: `FORGE`

Objetivo:

- dejar la integracion defendible para produccion

Minimos esperados:

- validar firma oficial del webhook de Mercado Pago
- no depender solo del token por query string
- revisar `BACKEND_URL`, `FRONTEND_URL` y `CORS_ORIGINS`
- verificar separacion clara entre sandbox y produccion
- revisar exposicion de datos de pago en retorno y logs
- rotacion de credenciales si hubo exposicion en pruebas

## Fase 4. Operacion del negocio

Lider: `FORGE`
Apoyo: `NOVA`

Objetivo:

- cerrar el flujo real despues del cobro

Lineas de trabajo:

- notificacion al vendedor cuando un pago pase a `approved`
- mejora de copy post-pago para explicar el siguiente paso de entrega o coordinacion
- visibilidad clara de pagos aprobados en admin y en historial del usuario

## Fase 5. Paso a produccion

Lider: `SENTINEL`
Apoyo: `FORGE`

Objetivo:

- dejar lista la migracion de sandbox a produccion

Checklist minimo:

- credenciales productivas
- dominios reales `https`
- `FRONTEND_URL`
- `BACKEND_URL`
- `CORS_ORIGINS`
- prueba controlada en entorno publico
- confirmacion de persistencia y logs minimos

## Fase 6. Cierre documental

Lider: `SCRIBE`

Objetivo:

- consolidar la documentacion final para no depender del hilo

Entregables:

- guia `sandbox -> produccion`
- tabla de configuraciones evaluadas y decision tomada
- checklist operativo para pedidos pagados
- registro del hardening aplicado

## Orden recomendado

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4
5. Fase 5
6. Fase 6

## Criterio de cierre

Se considerara cerrada esta linea cuando:

- los estados principales hayan sido probados manualmente
- las configuraciones relevantes hayan sido evaluadas y documentadas
- el webhook quede endurecido para produccion
- exista una notificacion operativa para el vendedor
- el paso de sandbox a produccion quede documentado y repetible
