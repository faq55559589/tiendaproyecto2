# Guia de Ejecucion

Esta guia define el orden recomendado para terminar GolazoStore usando el plan maestro y el estado actual.

## Documento fuente

- [PLAN_CIERRE_MVP.md](./PLAN_CIERRE_MVP.md)
- [PROJECT_STATUS.md](../PROJECT_STATUS.md)

## Orden de ejecucion recomendado

1. **Preparar entorno local**
   - Instalar Node.js y dependencias.
   - Validar `.env`, `JWT_SECRET`, `EMAIL_*`, `FRONTEND_URL`.
   - Confirmar arranque reproducible en `3000` y `8000`.

2. **Cerrar backend critico**
   - Corregir fechas y expiracion de reset.
   - Alinear cancelacion/expiracion de pedidos con stock.
   - Unificar validaciones y migraciones del esquema.

3. **Cerrar seguridad de alto impacto**
   - Hash de tokens sensibles.
   - Endurecer uploads y renders inseguros del frontend.
   - Ajustar CORS y config de despliegue.

4. **QA funcional completo**
   - Flujo principal:
     - `home -> catalogo -> producto -> carrito -> checkout -> confirmacion -> mis-pedidos`.
   - Pruebas de errores y permisos (usuario/admin).

5. **Pulido UX final**
   - Estados `loading/error/vacio`.
   - Ajustes responsive en vistas clave.

6. **Salida**
   - Dominio publico + HTTPS.
   - Verificacion de email y reset con URL publica.
   - Checklist final de despliegue.

7. **Infraestructura y roadmap post-MVP**
   - Sin migracion grande de infraestructura antes del cierre MVP.
   - Backend/DB en entorno con persistencia de disco (manteniendo Node + SQLite).
   - `Mercado Pago` queda fuera del MVP y pasa a roadmap post-MVP.

## Criterio de terminado

- Registro/login/verificacion/reset funcionando.
- Carrito y pedidos persistidos en backend.
- Checkout crea pedido y limpia carrito.
- Admin protegido por rol y operativo.
- Documentacion minima actualizada (`docs/README.md` + `docs/PROJECT_STATUS.md` + guias operativas).
- No depende de pagos automaticos para considerarse MVP cerrado.
