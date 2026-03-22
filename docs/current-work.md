# Trabajo Actual

Documento corto para retomar trabajo sin releer toda la historia del proyecto.

## Ultima actualizacion

- Fecha: 2026-03-20
- Contexto base usado:
  - `docs/PROJECT_STATUS.md`
  - `docs/plans/PLAN_CIERRE_MVP.md`
  - `docs/plans/GUIA_EJECUCION_PLANES.md`
  - `AGENTS.md`

## Estado actual resumido

- El MVP funcional ya corre con backend real.
- El flujo principal de compra existe de punta a punta.
- Admin de productos y pedidos ya esta operativo.
- La documentacion base del repo esta ordenada y usable.

## Foco actual recomendado

1. Ejecutar un cierre corto hacia QA final y deploy, sin abrir nuevos frentes.
2. Validar deploy con configuracion real y flujo completo de compra.
3. Corregir solo lo que bloquee salida o rompa consistencia visible.

## Linea aprobada activa - Mercado Pago integral

- El usuario aprobo abrir una linea complementaria para cerrar `Mercado Pago` mas alla del flujo minimo.
- Objetivo aprobado:
  - completar pruebas de estados otro dia,
  - recorrer y aprender configuraciones avanzadas,
  - endurecer seguridad,
  - cerrar operacion real y paso a produccion.
- Plan activo:
  - `docs/plans/PLAN_CIERRE_INTEGRAL_MERCADO_PAGO_2026-03-21.md`
- Estado de partida ya logrado:
  - sandbox base funcionando,
  - preferencia creada,
  - pago acreditado,
  - webhook actualizando orden,
  - retorno a la tienda operativo en local con limitacion visual propia de `ngrok free`.

## Siguiente secuencia por agentes

1. `ATLAS` + `SENTINEL`: cargar configuracion real de salida y validar entorno/deploy.
2. `FORGE` + `NOVA`: corregir solo bugs o fricciones que aparezcan en el QA final.
3. `SCRIBE`: registrar el estado final de salida y actualizar checklist operativo.

## Proxima tarea recomendada

- Lider: `SENTINEL`
- Objetivo: preparar un pre-deploy real con variables finales, dominios y proveedor de email.
- Archivos probables:
- `backend/.env`
- `backend/.env.example`
- `docs/operacion/GUIA_PRODUCCION.md`
- `docs/operacion/GUIA_DEPLOY_VERCEL_RAILWAY.md`
- Riesgo principal: salir a QA/deploy con dominios, CORS, persistencia o email todavia en modo local.
- Documento a actualizar al cerrar: `docs/current-work.md`

## Proxima tarea recomendada dentro de Mercado Pago

- Lider: `FORGE`
- Objetivo: retomar otro dia la matriz de estados reales de `Checkout Pro`.
- Casos a probar:
  - `APRO`
  - `CONT`
  - `OTHE`
  - reintento
  - expiracion
- Documento a actualizar al cerrar:
  - `docs/current-work.md`
  - `docs/PROJECT_STATUS.md`

## Plan complementario disponible

- Si se abre una tanda de mejoras antes del deploy final, usar:
  - `docs/plans/PLAN_MEJORAS_ADMIN_Y_EXPERIENCIA_2026-03-20.md`
- Lider recomendado segun tramo:
  - `NOVA` para fases 1 y 2
  - `FORGE` para fase 4
  - `SCRIBE` para cierre documental
- Ampliaciones ya pedidas por usuario para ese plan:
  - foto de perfil real,
  - reseñas funcionales para usuarios logueados,
  - comentarios en hilo acotado sobre reseñas.
- Tanda aprobada actualmente:
  - fases 1, 2 y 3 del plan complementario.
  - foco inmediato: pulido visual del admin, UX operativa y consolidacion tecnica acotada del frontend admin.
  - estado:
    - implementada en `admin-products`, `admin-orders` y utilidades compartidas del frontend admin.
- Siguiente fase aprobada:
  - fase 6 del plan complementario.
  - foco inmediato: avatar real de usuario en perfil y shell compartido.
  - estado:
    - implementada en backend auth, perfil y shell compartido.
- Fase aprobada actualmente:
  - fase 4 del plan complementario.
  - foco inmediato: contrato admin consistente entre frontend y backend.
- Fase aprobada actualmente:
  - fase 5 del plan complementario.
  - foco inmediato: productividad operativa del admin.
  - estado:
    - implementada en admin de productos y pedidos.
- Fase aprobada actualmente:
  - reseñas v1 contenidas.
  - foco inmediato:
    - reseñas y comentarios solo para usuarios verificados que ya compraron el producto,
    - avatar visible en identidad de autor,
    - hilo acotado de un nivel.
- Validacion de fase 6:
  - usuario confirmo que el avatar ya funciona bien en uso real.

## Tramo final propuesto por ARCHITECT

### Tramo 1. Pre-deploy real

- Cargar `FRONTEND_URL`, `BACKEND_URL`, `CORS_ORIGINS` y proveedor de email reales.
- Confirmar persistencia real para SQLite y `uploads`.
- Validar que produccion arranque sin caer por las nuevas reglas de entorno.

### Tramo 2. QA de cierre

- Recorrer de punta a punta:
  - `home -> catalogo -> producto -> carrito -> checkout -> confirmacion -> mis-pedidos`
- Repetir login, verificacion, reset y panel admin.
- Registrar solo bugs que rompan compra, admin o deploy.

### Tramo 3. Correccion final

- `FORGE`: resolver fallos de negocio o backend detectados.
- `NOVA`: resolver fricciones visibles o textos rotos detectados.
- No abrir mejoras nuevas fuera de ese alcance.

### Tramo 4. Salida controlada

- Ejecutar checklist de deploy con dominio real.
- Hacer backup previo y post-deploy.
- Abrir al publico solo despues de prueba real en entorno publico.

## Avance reciente de SENTINEL

- Se desactivo el modo multiagente global de Codex para evitar hilos colgados.
- Se formalizo `AGENTS.md` como catalogo permanente de roles del proyecto.
- El backend ahora bloquea produccion si:
  - `FRONTEND_URL` o `BACKEND_URL` apuntan a `localhost`
  - `FRONTEND_URL`, `BACKEND_URL` o `CORS_ORIGINS` no usan `https`
  - `EMAIL_REQUIRED=true` pero no hay proveedor real configurado
- Las URLs de emails y de imagenes subidas ya usan validacion central en vez de fallback silencioso a `localhost`.
- Se actualizaron las guias operativas de produccion y deploy con estas reglas.

## Avance reciente de ATLAS

- Se valido arranque corto real de backend con `http://localhost:3000/api/health`.
- Se ejecuto `backend` QA de integridad y paso correctamente.
- Se confirmo que en este entorno Windows `npm` puede fallar en PowerShell por Execution Policy, pero `npm.cmd` funciona.
- Se actualizaron `README.md` y `docs/operacion/GUIA_SETUP_LOCAL.md` para dejar `npm.cmd` como camino operativo claro en Windows.

## Avance reciente de FORGE

- Se normalizo el mapping de `payment_status` cuando admin confirma o entrega pedidos.
- Un pedido `instagram` confirmado ya no queda con `payment_status` viejo; ahora pasa a `confirmed`.
- Un pedido entregado ya no arrastra estado de pago ambiguo; ahora pasa a `delivered`.
- Se amplio `scripts/qa_backend_integrity.js` para cubrir transiciones `confirmed` y `delivered`.
- La QA de backend volvio a pasar despues del cambio.
- Se consolido una base compartida para frontend admin:
  - `frontend/js/admin-common.js`
- `admin.js` y `admin-orders.js` ahora reutilizan:
  - guard admin,
  - notices,
  - toasts,
  - requests autenticados,
  - estados de botones ocupados.
- Se agrego soporte backend para avatar de usuario:
  - columna `avatar_url`,
  - migracion automatica,
  - update de perfil con upload validado,
  - limpieza del avatar anterior cuando se reemplaza.

## Avance reciente de NOVA

- Se corrigio el historial de pedidos para mostrar estado del pedido, estado de pago y metodo de pago por separado.
- La confirmacion ahora muestra tambien estado y estado de pago, no solo el metodo.
- Se limpiaron textos rotos por encoding en checkout y confirmacion.
- Se mejoro el copy del flujo manual por Instagram para que el siguiente paso quede mas claro para el usuario.
- Se ejecuto la Tanda A del plan complementario en admin:
  - nueva jerarquia visual en `admin-products` y `admin-orders`,
  - mejores mensajes de contexto y estados inline,
  - confirmaciones antes de acciones sensibles,
  - bloqueo de doble click en acciones admin.
- Se implemento avatar real de usuario en frontend:
  - `perfil.html` ahora permite subir foto,
  - navbar y resumen de cuenta muestran avatar o fallback por iniciales,
  - `mis-pedidos` reutiliza la misma identidad visual.
- Se ejecuto la fase 5 de productividad operativa en admin:
  - busqueda local en productos,
  - atajos rapidos por estado en productos y pedidos,
  - orden rapido de pedidos por recencia, vencimiento, total y prioridad operativa.

## Avance reciente de SCRIBE

- Se actualizo `docs/PROJECT_STATUS.md` con la ronda de agentes, hardening, entorno validado y consistencia final de pedidos.
- Se reforzo `docs/README.md` para usar `AGENTS.md` como puerta de entrada del flujo documental.
- Se reescribio `docs/decisions.md` en ASCII limpio y se agregaron decisiones sobre validacion estricta de produccion y uso de `npm.cmd` en PowerShell.
- Se actualizo `README.md` para reflejar cambios recientes de contexto, hardening, entorno y UX final.

## Prioridades inmediatas

1. Definir dominios finales y cargar variables reales de produccion.
2. Verificar email y reset fuera de localhost con proveedor real.
3. Ejecutar QA final del flujo completo y del panel admin.
4. Corregir solo hallazgos bloqueantes y salir a deploy.

## No perder tiempo en

- Refactors grandes de arquitectura antes de cerrar MVP.
- Migrar SQLite a otra base sin necesidad de negocio inmediata.
- Integrar pagos online ahora.
- Pulido visual fino sin impacto operativo claro.

## Riesgos abiertos

- Si SMTP falla y `EMAIL_REQUIRED=true`, registro queda bloqueado.
- Persistencia en deploy debe cubrir tanto SQLite como `uploads`.
- El riesgo principal ya no es de arquitectura sino de configuracion final y validacion real en entorno publico.
- Puede haber scripts o flujos legacy fuera del camino productivo principal.

## Archivos de entrada rapida

1. `README.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/plans/PLAN_CIERRE_MVP.md`
4. `docs/tecnico/GUIA_LECTURA_CODEBASE.md`
5. `docs/decisions.md`

## Regla de actualizacion

Actualizar este archivo cuando cambie una de estas cosas:

- prioridad actual,
- riesgo principal,
- alcance del sprint,
- criterio de cierre,
- decision que cambie que conviene tocar y que no.

Ademas, si `ARCHITECT` propone un plan y el usuario lo aprueba, `SCRIBE` debe dejarlo registrado aqui para asegurar reentrada rapida en sesiones futuras.

## Actualizacion 2026-03-21 - Reseñas v1 implementadas

- La fase aprobada de resenas ya fue ejecutada.
- Backend:
  - tablas `reviews` y `review_comments`,
  - migracion automatica,
  - endpoints en `/api/reviews`,
  - regla real de solo compradores verificados con pedido `confirmed` o `delivered`.
- Frontend:
  - `producto.js` ya muestra resumen, reseñas reales, avatar o iniciales y comentarios de un nivel.
- Validacion pendiente util:
  - smoke manual en `producto.html` con un usuario comprador y otro sin compra.

## Actualizacion 2026-03-21 - Tanda de performance frontend

- Se ejecuto una tanda tecnica de fluidez sin tocar el diseno visual.
- Cambios principales:
  - `catalogo.js` ahora renderiza productos en bloque en vez de insertar card por card,
  - `home.js` reutiliza cache local de destacados al agregar al carrito,
  - `main.js` usa `requestAnimationFrame` y listener pasivo para el boton de volver arriba,
  - `style.css` baja costo de animaciones y transiciones globales.
- Ajustes CSS aplicados:
  - se removio la animacion global de entrada de cards,
  - se reemplazaron varios `transition: all` por transiciones mas especificas,
  - se quito blur de fondo en cards grandes del flujo de compra,
  - en punteros tactiles se desactiva scroll suave y transforms hover costosos.
- Validacion ejecutada:
  - `node --check` OK en `home.js`, `catalogo.js` y `main.js`.
- Explicacion tecnica persistente:
  - `docs/tecnico/PERFORMANCE_FRONTEND_2026-03-21.md`

## Actualizacion 2026-03-21 - Politica documental por tipo de documento

- Se aprobo no separar `docs/` por agente como estructura principal.
- Criterio vigente:
  - documentar por tipo de informacion,
  - no por quien produjo el cambio.
- Nuevo mapa operativo:
  - `docs/agents-workflow.md`
- Uso esperado:
  - `SCRIBE` mantiene estado, decisiones y roadmap,
  - `TUTOR` deja explicaciones tecnicas en `docs/tecnico/`,
  - el resto de agentes documenta segun tipo de contenido.

## Actualizacion 2026-03-21 - Mercado Pago primera parte implementada

- Quedo lista la base tecnica inicial de `Mercado Pago` con `Checkout Pro`.
- Backend:
  - nuevo servicio `backend/src/services/mercadoPagoService.js`,
  - dependencia oficial `mercadopago` instalada en backend,
  - el servicio ya usa el SDK oficial para crear preferencias y consultar pagos,
  - nuevas variables `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_TOKEN`,
  - nuevas columnas en `orders`:
    - `external_reference`,
    - `payment_preference_id`,
    - junto con indices para trazabilidad,
  - nuevo endpoint autenticado:
    - `POST /api/orders/:id/mercado-pago-preference`,
  - nuevo webhook publico:
    - `POST /api/orders/mercado-pago/webhook`.
- Frontend:
  - `checkout` ya habilita la opcion `Mercado Pago`,
  - si se elige ese metodo:
    - crea la orden,
    - pide la preferencia al backend,
    - redirige al checkout externo,
  - `confirmacion`, `mis-pedidos` y `admin-orders` ya muestran estados reales de pago en vez de placeholder.
- Validacion ejecutada:
  - `node --check` OK en backend y frontend tocados,
  - `npm.cmd --prefix backend run qa:backend` OK.
- Pendiente inmediato para la siguiente sesion:
  - probar con credenciales reales o sandbox,
  - validar webhook contra Mercado Pago real,
  - decidir si se agrega reintento de pago desde `mis-pedidos`.

## Actualizacion 2026-03-21 - Politica operativa de Mercado Pago aplicada

- Se documento y ejecuto la politica acordada para pedidos online con `Mercado Pago`.
- Backend:
  - nueva variable `MP_ORDER_EXPIRATION_MINUTES` con default `30`,
  - nuevo vencimiento corto para ordenes `mercado_pago`,
  - sweep unificado de expiracion para pedidos manuales y online,
  - cancelacion con reposicion de stock cuando el webhook marca:
    - `rejected`,
    - `cancelled`,
    - `charged_back`,
    - `refunded` si el pedido no fue entregado,
  - bloqueo de reintento para ordenes ya:
    - expiradas,
    - canceladas,
    - entregadas,
    - o aprobadas.
- Frontend:
  - `mis-pedidos` ahora muestra boton `Reintentar pago` solo para ordenes pendientes y vigentes,
  - `confirmacion` muestra vencimiento de reserva y estado `Pago expirado`,
  - `admin-orders` deja mas claro cuando una orden online esta vencida o sigue pendiente de webhook.
- Validacion ejecutada despues del cambio:
  - `node --check` OK en archivos backend/frontend tocados,
  - `npm.cmd --prefix backend run qa:backend` OK.
- Pendiente inmediato para la siguiente sesion:
  - configurar credenciales reales o sandbox,
  - validar webhook externo con Mercado Pago real,
  - probar manualmente casos:
    - `approved`,
    - `pending` / `in_process`,
    - `rejected` / `cancelled`.

## Actualizacion 2026-03-21 - Delegacion de ARCHITECT y cierre con SHIP

- Se formalizo que `ARCHITECT` no debe absorber tandas mixtas como un solo bloque.
- Regla vigente:
  - `ARCHITECT` reparte,
  - `FORGE` y `NOVA` implementan,
  - `SCRIBE` documenta,
  - `TUTOR` explica si el usuario lo pide,
  - `SHIP` entra al cierre tecnico cuando hay que revisar entrega, rama, commit o push.

## Actualizacion 2026-03-21 - Fase aprobada de Mercado Pago

- El usuario aprobo abrir la fase de `Mercado Pago`.
- Criterio aprobado:
  - integrar `Checkout Pro`,
  - usar el SDK oficial de Mercado Pago en backend para preferencias y consulta de pagos,
  - mantener convivencia con el flujo manual por Instagram,
  - confirmar estado real por webhook.
- Siguiente paso inmediato:
  - adaptar la capa backend actual al SDK oficial sin cambiar el contrato del checkout ni de `orders`.

## Actualizacion 2026-03-21 - Entorno local SQLite estabilizado

- Se corrigio el watcher de desarrollo del backend para ignorar archivos auxiliares de SQLite:
  - `*.db-wal`
  - `*.db-shm`
  - `*.sqlite-wal`
  - `*.sqlite-shm`
- Se corrigio `scripts/db-admin.js` para que funcione desde la raiz reutilizando la dependencia `better-sqlite3` del workspace backend.
- Se dejo mas explicito en la guia operativa que la base activa del proyecto es:
  - `backend/database/golazostore.db`
  - y no `backend/database.sqlite`

## Actualizacion 2026-03-21 - Mercado Pago listo para tramo ngrok

- La redireccion local a `Checkout Pro` ya funciona desde la tienda.
- Se ajusto backend para no enviar `back_urls` ni `notification_url` invalidas cuando siguen apuntando a `localhost`.
- Se agrego un retorno intermedio publico en backend para que, aun con frontend local, Mercado Pago pueda volver a `confirmacion.html` despues del pago.
- Siguiente tramo aprobado y documentado:
  - exponer webhook local con `ngrok`,
  - probar pago sandbox real,
  - validar cambio de estado por webhook.
- Guia operativa nueva:
  - `docs/operacion/GUIA_MERCADO_PAGO_SANDBOX_LOCAL.md`

## Actualizacion 2026-03-21 - Sandbox base de Mercado Pago validado

- Ya se valido en sandbox el flujo base de `Checkout Pro`:
  - crear orden,
  - crear preferencia,
  - pagar en Mercado Pago,
  - recibir webhook,
  - actualizar la orden a `approved`,
  - volver a `confirmacion.html`.
- Limitacion conocida de entorno local:
  - con `ngrok free` aparece una pantalla intermedia antes del retorno final.
- Nueva linea aprobada por usuario:
  - cierre integral de Mercado Pago con configuraciones avanzadas, seguridad y paso a produccion.
- Plan activo:
  - `docs/plans/PLAN_CIERRE_INTEGRAL_MERCADO_PAGO_2026-03-21.md`

## Actualizacion 2026-03-21 - Admin de usuarios implementado

- Se agrego un panel admin de usuarios como vista operativa acotada.
- Backend:
  - nuevo endpoint `GET /api/admin/users`,
  - listado con rol, verificacion, avatar, newsletter, cantidad de pedidos y ultima actividad de pedido.
- Frontend:
  - nueva vista `frontend/admin-users.html`,
  - nuevo script `frontend/js/admin-users.js`,
  - acceso desde navbar, dropdown de cuenta y offcanvas para admin.
- Alcance real:
  - solo lectura,
  - busqueda local,
  - filtros por rol, verificacion y actividad,
  - sin convertirlo en CRM complejo.
- Validacion ejecutada:
  - `node --check` OK en archivos nuevos,
  - `npm.cmd --prefix backend run qa:backend` OK.
