document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('featuredProductsContainer');
    if (!container) return;

    try {
        const products = await GolazoStore.getProducts();
        renderFeatured(products.slice(0, 8));
    } catch (error) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-triangle-exclamation fa-3x text-danger mb-3"></i>
                <h4>No pudimos cargar los destacados</h4>
                <p class="text-muted">Verifica que el backend este disponible en el puerto 3000.</p>
                <a href="catalogo.html" class="btn btn-danger">Ir al catalogo</a>
            </div>
        `;
    }

    function renderFeatured(products) {
        container.innerHTML = products.length
            ? products.map(createProductCard).join('')
            : `
                <div class="col-12 text-center py-5">
                    <h4>No hay productos cargados todavia</h4>
                </div>
            `;
    }

    function createProductCard(product) {
        const category = GolazoStore.getCategoryLabel(product);
        const stockBadge = product.stock > 0
            ? `<span class="badge text-bg-light border">Stock ${product.stock}</span>`
            : `<span class="badge text-bg-danger">Sin stock</span>`;

        return `
            <div class="col-lg-3 col-md-6 mb-4">
                <article class="card product-card h-100 border-0 shadow-sm">
                    <a href="${GolazoStore.paths.product(product.id)}" class="position-relative d-block overflow-hidden">
                        <img src="${product.image_url}" class="card-img-top" alt="${product.name}">
                    </a>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <span class="badge text-bg-danger-subtle text-danger-emphasis">${category}</span>
                            ${stockBadge}
                        </div>
                        <h3 class="h6 card-title">${product.name}</h3>
                        <p class="text-muted small flex-grow-1">${(product.description || 'Producto oficial de futbol.').slice(0, 96)}...</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <strong class="text-danger">${GolazoStore.formatPrice(product.price)}</strong>
                            <button class="btn btn-danger btn-sm" data-add-home="${product.id}" ${product.stock < 1 ? 'disabled' : ''}>Agregar</button>
                        </div>
                    </div>
                </article>
            </div>
        `;
    }

    container.addEventListener('click', async function (event) {
        const button = event.target.closest('[data-add-home]');
        if (!button) return;
        const id = Number(button.getAttribute('data-add-home'));
        try {
            const products = await GolazoStore.getProducts();
            const product = products.find((item) => item.id === id);
            if (!product) return;
            await GolazoStore.cart.add(product, 1, product.sizes[0] || 'M');
            GolazoStore.ui.toast('Producto agregado al carrito.', 'success');
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo agregar al carrito.', 'danger');
        }
    });
});
