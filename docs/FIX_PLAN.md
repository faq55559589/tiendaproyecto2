# Plan de Reparación Integral - GolazoStore

## Problemas Detectados
1. **Detalle de Producto (`producto.html`):** Está hardcodeado (muestra siempre la de Argentina). No lee el ID de la URL.
2. **Imágenes:** El usuario reporta que no se ven las fotos en algunas vistas. Necesito verificar la ruta de imágenes en el backend.
3. **Navegación (Sidebar):** Inconsistencia. En `catalogo.html` están las opciones correctas ("Todas" y "Shorts"), pero en `index.html` y otras páginas siguen las opciones viejas.
4. **Categorización:** `retros.html` está mostrando todos los productos en lugar de filtrar (o el usuario espera otro comportamiento).

## Pasos de Solución

### 1. Estandarización de Navegación (Sidebar)
- [ ] Editar `index.html`, `retros.html`, `producto.html`, `contacto.html`, `login.html`, `registro.html`, `carrito.html`.
- [ ] Asegurar que el Sidebar ("Categorías") tenga SOLAMENTE: "Todas las Camisetas" y "Shorts".
- [ ] **Acción**: Comentar/Eliminar enlace a `Retros` del menú y del sidebar en TODAS las páginas para cumplir con "los demas comentalos". Solo dejaré "Todas" y "Shorts".

### 2. Hacer Dinámico `producto.html`
- [ ] Eliminar todo el contenido hardcodeado del detalle.
- [ ] Crear/Actualizar `js/producto.js` para:
    - Leer `?id=X` de la URL.
    - Fetch a `/api/products/X`.
    - Rellenar Título, Precio, Descripción, Imagen, Stock.
    - Manejar error si no existe.

### 3. Verificar Imágenes
- [ ] Asegurar que `server.js` sirve `uploads/` correctamente.
- [ ] Verificar rutas guardadas en BD.

### 4. Lógica de Catálogo vs Retro
- [ ] Aclarar la lógica:
    - `catalogo.html` -> Muestra TODO.
    - `retros.html` -> ¿Debería mostrar solo Retro? Por ahora el usuario dijo "comenta los demas". Si quiere Retro, debo filtrar. Si quiere que `retros.html` sea eliminado, debo saberlo. Asumiré que `retros.html` DEBE filtrar por categoría o ser eliminado.
    - **Decisión**: El usuario dijo "como es al principio solamente necesitare el apartado de todas las camisetas y uno de shorts, los demas comentalos". Esto implica que **Retros debería estar comentado/oculto** en el menú.
    - **Acción**: Eliminaré el enlace a `Retros` del menú y del sidebar en TODAS las páginas para cumplir con "los demas comentalos". Solo dejaré "Todas" y "Shorts".

### 5. Verificación Final
- [ ] Navegar todo el flujo como un usuario real.
