# Guia Mercado Pago Sandbox Local

Fecha de referencia: 2026-03-21

## Objetivo

Cerrar la validacion local de `Checkout Pro` con:

- redireccion a Mercado Pago desde localhost
- webhook real contra una URL publica temporal
- pruebas sandbox sin tocar produccion

## Estado actual del proyecto

La tienda ya puede:

- crear la orden local
- crear la preferencia de Mercado Pago
- redirigir al checkout externo
- guardar `external_reference`
- esperar actualizacion real por webhook

Pendiente de este tramo:

- exponer el webhook local con `ngrok`
- validar estados reales de pago de punta a punta

## Requisitos previos

1. Backend levantado en `http://localhost:3000`
2. Frontend levantado en `http://localhost:8000/frontend`
3. Credenciales de prueba cargadas en `backend/.env`
4. `MP_WEBHOOK_TOKEN` definido
5. `ngrok` instalado y autenticado en tu maquina

## Variables de entorno relevantes

En local, para sandbox, deja:

```env
FRONTEND_URL=http://localhost:8000/frontend
BACKEND_URL=http://localhost:3000
MP_ACCESS_TOKEN=TEST-...
MP_PUBLIC_KEY=TEST-...
MP_WEBHOOK_TOKEN=tu_token_largo
MP_ORDER_EXPIRATION_MINUTES=30
SQLITE_DB_PATH=./database/golazostore.db
```

## Como abrir una URL publica con ngrok

Abre una terminal nueva y corre:

```powershell
ngrok http 3000
```

Vas a obtener una URL publica parecida a:

```text
https://abc123.ngrok-free.app
```

## Como usar esa URL en el backend

Mientras estes probando webhook real en local:

1. copia la URL publica de `ngrok`
2. actualiza temporalmente `BACKEND_URL` en `backend/.env`
3. reinicia el backend

Ejemplo:

```env
BACKEND_URL=https://abc123.ngrok-free.app
```

Importante:

- `FRONTEND_URL` puede seguir en `http://localhost:8000/frontend`
- en local ya no enviamos `back_urls` a Mercado Pago si apuntan a `localhost`
- eso permite abrir el checkout aunque el retorno automatico no sea publico todavia

## URL real del webhook

Con `BACKEND_URL` publico y token definido, la URL esperada por el backend queda:

```text
https://abc123.ngrok-free.app/api/orders/mercado-pago/webhook?token=TU_TOKEN
```

## Como conectar el webhook

Tienes dos caminos validos para sandbox:

### Camino A. Dejar que la preferencia lo mande

La preferencia ya incluye `notification_url` cuando `BACKEND_URL` es publico.

Resultado:

- al crear una nueva preferencia con `BACKEND_URL` en `ngrok`
- Mercado Pago ya recibe la URL del webhook en esa preferencia

### Camino B. Cargar webhook desde el panel

Si quieres dejarlo visible tambien en el panel de Mercado Pago:

1. abre la seccion `Webhooks`
2. pega la URL publica del webhook
3. usa el mismo `token` que ya esta en `MP_WEBHOOK_TOKEN`

## Flujo recomendado de prueba

1. levantar backend y frontend
2. abrir `ngrok http 3000`
3. copiar la URL publica
4. poner esa URL en `BACKEND_URL`
5. reiniciar backend
6. agregar producto al carrito
7. entrar a checkout
8. elegir `Mercado Pago`
9. confirmar pedido
10. completar un pago sandbox con cuenta o tarjeta de prueba
11. revisar si el webhook actualiza la orden

## Que deberias verificar

### En la base o admin

- `payment_preference_id` ya no queda `null`
- `external_reference` queda asociado a la orden
- `payment_status` cambia cuando Mercado Pago envia la notificacion

### En estados reales

- `approved`:
  - pedido `confirmed`
  - `payment_status = approved`
- `pending` o `in_process`:
  - pedido sigue pendiente
  - mantiene reserva hasta vencimiento
- `rejected` o `cancelled`:
  - pedido `cancelled`
  - stock repuesto

## Limitaciones esperables en local

- sin `ngrok`, no hay webhook real desde Mercado Pago hacia tu maquina
- sin dominio publico de frontend, no cierres todavia el retorno final como comportamiento definitivo
- mientras uses localhost, este tramo es solo sandbox operativo, no validacion de produccion

## Criterio de terminado de este tramo

Este tramo queda razonablemente cerrado cuando:

1. la tienda redirige bien a Mercado Pago
2. el webhook entra por `ngrok`
3. una orden sandbox cambia sola de `pending_payment` a `approved` o al estado correspondiente
4. `mis-pedidos`, `confirmacion` y admin reflejan ese cambio
