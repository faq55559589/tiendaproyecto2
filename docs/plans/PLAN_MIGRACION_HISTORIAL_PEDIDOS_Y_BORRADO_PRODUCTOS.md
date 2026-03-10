# Plan: Migracion de historial de pedidos y borrado de productos

Fecha de referencia: 2026-03-10

## Resumen

Implementar una migracion de `order_items` para que cada item de pedido guarde un snapshot minimo del producto al momento de compra, desacoplando el historial de la tabla `products`.

Con eso, los productos podran borrarse cuando solo pertenezcan a pedidos `cancelled` o `expired`, sin romper:

- `mis-pedidos`
- `confirmacion`
- `admin-orders`

## Cambios de implementacion

### Base de datos y migracion

- Extender `order_items` con columnas snapshot:
  - `product_name TEXT NOT NULL`
  - `product_image_url TEXT`
  - `product_description TEXT`
- Mantener `product_id`, pero hacerlo nullable en la tabla migrada.
- Cambiar la foreign key de `order_items.product_id` a `REFERENCES products(id) ON DELETE SET NULL`.
- Implementar migracion real por recreacion de tabla en `migrations.js`:
  - crear `order_items_new`
  - copiar datos existentes desde `order_items` haciendo `LEFT JOIN products`
  - poblar snapshot con los datos actuales del producto
  - reemplazar tabla vieja por nueva
  - recrear indice `idx_order_items_product_id`
- Mantener `price`, `quantity` y `size` como hoy; el snapshot nuevo complementa, no reemplaza.

### Backend de pedidos y productos

- Actualizar `Order.createFromCart()` para insertar en `order_items`:
  - `product_id`
  - `product_name`
  - `product_image_url`
  - `product_description`
  - `quantity`
  - `price`
  - `size`
- Cambiar las lecturas de pedidos (`getById`, `getByUser`, `getAll`) para que no dependan de `JOIN products` obligatorio:
  - usar `LEFT JOIN products`
  - priorizar snapshot (`product_name`, `product_image_url`, `product_description`)
  - usar datos de `products` solo como fallback si todavia existe
- Mantener la regla de borrado actualizada:
  - permitir borrar si solo hay pedidos `cancelled`
  - bloquear si hay pedidos `pending_contact`, `confirmed` o `delivered`
- Corregir el chequeo de “bloqueante” para que sea decision-complete:
  - tratar `cancelled` como no bloqueante
  - tratar `expired` via `payment_status = 'expired'` sobre pedidos cancelados como no bloqueante
  - todo lo demas bloquea
- Mantener respuesta `409` clara si el borrado sigue bloqueado por pedidos activos o entregados.

### Frontend e interfaces

- No cambiar la forma publica del pedido consumida por frontend mas de lo necesario:
  - seguir devolviendo `items[].name`
  - seguir devolviendo `items[].image_url`
  - seguir devolviendo `items[].product_id` nullable
- Ajustar frontend para tolerar `product_id = null` sin romper links o render:
  - `mis-pedidos`
  - `confirmacion`
  - `admin-orders`
- Si un producto fue borrado:
  - seguir mostrando nombre e imagen desde snapshot
  - no asumir que existe link navegable al producto
- En admin de productos, mantener la ayuda visual:
  - “solo tiene pedidos cancelados o expirados, asi que puedes borrarlo”
  - “tiene pedidos activos o entregados, no se puede borrar”

## APIs, tipos y contratos

- `order_items` pasa a ser la fuente historica principal del contenido del pedido.
- Nuevas columnas persistidas:
  - `product_name`
  - `product_image_url`
  - `product_description`
- `product_id` deja de ser garantia de existencia de producto vivo.
- Respuesta de pedidos:
  - `items[].name` debe salir del snapshot primero
  - `items[].image_url` debe salir del snapshot primero
  - `items[].product_id` puede venir `null`
- No cambiar endpoints existentes; solo fortalecer su contrato historico.

## Casos de prueba

- Crear pedido nuevo y verificar que `order_items` guarda snapshot aunque el producto siga existiendo.
- Borrar un producto con pedidos solo `cancelled` y confirmar:
  - el `DELETE` funciona
  - `order_items.product_id` queda `NULL`
  - `mis-pedidos` sigue mostrando nombre e imagen
  - `admin-orders` sigue mostrando los items correctamente
- Intentar borrar un producto con pedido `pending_contact`, `confirmed` o `delivered` y validar `409`.
- Verificar que pedidos historicos previos a la migracion se sigan viendo bien tras backfill.
- Verificar expiracion automatica:
  - pedido manual expira
  - pasa a `cancelled` + `expired`
  - el producto luego puede borrarse
- Verificar que carrito, catalogo y ficha de producto no cambian comportamiento.
- Verificar que si falta imagen snapshot, se use placeholder sin romper layout.

## Supuestos y defaults elegidos

- Se usara snapshot por columnas discretas, no JSON, para mantener consultas y render simples.
- Se conservara `product_id` nullable para trazabilidad parcial y compatibilidad.
- Se permitira borrar productos con historial solo cuando todos sus pedidos asociados esten cancelados/expirados.
- El frontend no mostrara enlace al producto cuando `product_id` sea `null`; seguira mostrando el contenido historico.
- No se borraran pedidos ni `order_items`; solo se desacoplaran del producto vivo.
