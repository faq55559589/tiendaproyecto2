let homeInitialized = false;

async function initHomePage() {
    if (homeInitialized) return;
    homeInitialized = true;

    const container = document.getElementById('featuredProductsContainer');
    if (!container) return;

    const loadingTimeout = window.setTimeout(() => {
        if (container.dataset.loaded === 'true') return;
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-clock fa-3x icon-accent mb-3"></i>
                <h4>Los destacados están tardando más de lo esperado</h4>
                <p class="text-ui-muted">Puedes seguir navegando por el catálogo mientras terminamos de cargar esta sección.</p>
                <a href="catalogo.html" class="btn btn-outline-brand">Ver catálogo completo</a>
            </div>
        `;
    }, 8000);

    try {
        const products = await GolazoStore.getProducts();
        renderFeatured(products.slice(0, 8));
        container.dataset.loaded = 'true';
    } catch (error) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-triangle-exclamation fa-3x icon-accent mb-3"></i>
                <h4>No pudimos cargar las camisetas destacadas</h4>
                <p class="text-ui-muted">Intenta de nuevo en unos segundos o entra directo al catálogo completo.</p>
                <a href="catalogo.html" class="btn btn-danger">Ir al catálogo</a>
            </div>
        `;
    } finally {
        window.clearTimeout(loadingTimeout);
    }

    function renderFeatured(products) {
        container.innerHTML = products.length
            ? products.map(createProductCard).join('')
            : `
                <div class="col-12 text-center py-5">
                    <h4>Pronto vas a ver camisetas destacadas aquí</h4>
                    <p class="text-ui-muted mb-0">Mientras tanto, puedes explorar todo el catálogo disponible.</p>
                </div>
            `;
    }

    function createProductCard(product) {
        const category = GolazoStore.getCategoryLabel(product);
        const stockBadge = product.stock > 0
            ? `<span class="badge badge-soft-neutral">Stock ${product.stock}</span>`
            : `<span class="badge badge-soft-danger">Sin stock</span>`;

        return `
            <div class="col-lg-3 col-md-6 mb-4">
                <article class="card product-card h-100 border-0 shadow-sm">
                    <a href="${GolazoStore.paths.product(product.id)}" class="position-relative d-block overflow-hidden">
                        <img src="${product.image_url}" class="card-img-top" alt="${product.name}">
                    </a>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <span class="badge badge-soft-brand">${category}</span>
                            ${stockBadge}
                        </div>
                        <h3 class="h6 card-title">${product.name}</h3>
                        <p class="text-ui-muted small flex-grow-1">${(product.description || 'Producto oficial de fútbol.').slice(0, 96)}...</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <strong class="text-price-accent">${GolazoStore.formatPrice(product.price)}</strong>
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}
