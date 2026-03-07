# QA Cierre MVP - 2026-03-07

Resultado final: `16/16 PASS`

## Cobertura ejecutada

- backend disponible
- token expirado bloqueado
- catalogo responde y devuelve productos
- detalle de producto operativo
- login usuario QA
- login admin QA
- alta admin de producto con galeria inicial
- actualizacion admin de `image_urls`
- API devuelve galeria normalizada
- base persiste `image_urls`
- usuario agrega producto al carrito
- checkout crea pedido real
- checkout limpia carrito
- mis pedidos devuelve historial
- producto vendido no se elimina desde admin

## Hallazgo corregido durante la pasada

- Antes:
  - eliminar un producto ya referenciado por `order_items` devolvia `500`.
- Ahora:
  - el backend responde `409` con mensaje claro:
    - `No puedes eliminar un producto que ya forma parte de pedidos.`

## Estado

- Cierre funcional del MVP local: consistente
- Regla de negocio validada:
  - productos vendidos no deben borrarse fisicamente
