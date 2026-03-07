# Guia de Ejecucion (Plan Vigente)

Esta guia define el orden unico para terminar GolazoStore usando solo el plan actual.

## Documento fuente

- [PLAN_CIERRE_MVP.md](./PLAN_CIERRE_MVP.md)

## Orden de ejecucion recomendado

1. **Configuracion y seguridad de entorno**
   - Validar `.env`, `JWT_SECRET`, `EMAIL_*`, `FRONTEND_URL`.
   - Dejar CORS ajustado para staging/produccion.

2. **QA funcional completo**
   - Flujo principal:
     - `home -> catalogo -> producto -> carrito -> checkout -> confirmacion -> mis-pedidos`.
   - Pruebas de errores y permisos (usuario/admin).

3. **Pulido UX final**
   - Estados `loading/error/vacio`.
   - Ajustes responsive en vistas clave.

4. **Salida**
   - Dominio publico + HTTPS.
   - Verificacion de email y reset con URL publica.
   - Checklist final de despliegue.

5. **Infraestructura y roadmap post-MVP**
   - Sin migracion grande de infraestructura antes del cierre MVP.
   - Backend/DB en entorno con persistencia de disco (manteniendo Node + SQLite).
   - `Mercado Pago` queda fuera del MVP y pasa a roadmap post-MVP.

## Criterio de terminado

- Registro/login/verificacion/reset funcionando.
- Carrito y pedidos persistidos en backend.
- Checkout crea pedido y limpia carrito.
- Admin protegido por rol y operativo.
- Documentacion minima actualizada (`docs/README.md` + `docs/PROJECT_STATUS.md`).
- No depende de pagos automáticos para considerarse MVP cerrado.
