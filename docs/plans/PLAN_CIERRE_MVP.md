# Plan de Cierre MVP - GolazoStore

Fecha: 2026-03-07

## Objetivo

Cerrar el MVP con flujo real de compra, documentacion ordenada y base lista para despliegue.

## Estado actual resumido

- Backend real funcionando con `auth`, `products`, `cart`, `orders`, `admin`.
- Frontend conectado a API real para carrito y pedidos.
- Emails de verificacion y recuperacion activos por SMTP/Gmail.
- Limpieza principal de rutas heredadas completada.

## Fases de cierre

## 1) Configuracion y seguridad de entorno

- Mantener `backend/.env` fuera de Git.
- Regenerar `backend/.env.example` sin secretos.
- Revisar `JWT_SECRET`, `EMAIL_*` y `FRONTEND_URL`.
- Restringir CORS a dominios reales al pasar a staging/produccion.

## 2) QA funcional completo

- Flujo principal:
  - `home -> catalogo -> producto -> carrito -> checkout -> confirmacion -> mis-pedidos`.
- Casos de error:
  - usuario no logueado en rutas privadas,
  - carrito vacio,
  - token expirado o invalido,
  - producto sin stock.
- Validar panel admin:
  - alta, edicion y baja de productos con token admin.

## 3) Pulido UX final

- Unificar textos de checkout/pago (Instagram).
- Revisar estados loading/error/vacio en todas las paginas clave.
- Ajustes responsive en mobile para `catalogo`, `carrito`, `checkout`.

## 4) Salida a staging/produccion

- Definir URL publica de frontend y backend.
- Actualizar `FRONTEND_URL` para enlaces de email.
- Confirmar HTTPS activo.
- Ejecutar checklist final de deploy.

## 5) Decision cerrada de infraestructura y pagos

### Infraestructura (enfoque pragmatico, sin cambios grandes)

- Evitar migraciones grandes de plataforma antes de cerrar MVP.
- Mantener arquitectura actual `Node + SQLite` y desplegar en proveedor con persistencia de disco.
- `Vercel` queda como opcion futura solo para frontend estatico si no implica refactor relevante.
- No usar backend serverless con SQLite sin almacenamiento persistente.
- Mantener backups automaticos del archivo SQLite.

### Pagos online

- Pasarela elegida para MVP: `Mercado Pago Checkout` (pasarela unica).
- `Stripe` se mantiene como alternativa futura, fuera del alcance de cierre MVP.
- Implementacion requerida:
  - crear `preference` en backend,
  - redirigir a checkout de Mercado Pago,
  - confirmar pago por `webhook`,
  - actualizar estado del pedido en DB,
  - guardar `provider_payment_id`.

## Checklist de salida

- [ ] Backend levantando en entorno real sin mock.
- [ ] Registro/login/verificacion/reset funcionando con email real.
- [ ] Carrito persistente por usuario.
- [ ] Checkout crea pedido y limpia carrito.
- [ ] Mis pedidos muestra historial real.
- [ ] Rutas admin protegidas por rol.
- [ ] Documentacion actualizada y accesible desde `docs/README.md`.
- [ ] Decision de despliegue cerrada sin migracion mayor de arquitectura.
- [ ] Integracion de `Mercado Pago` activa en sandbox con `webhooks`.
