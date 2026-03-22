document.addEventListener('DOMContentLoaded', function () {
    if (!GolazoAuth.requireAuth()) return;

    const emptyCartDiv = document.getElementById('emptyCart');
    const cartWithItemsDiv = document.getElementById('cartWithItems');
    const cartItemsContainer = document.getElementById('cartItems');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const totalElement = document.getElementById('total');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const discountRow = document.getElementById('discountRow');
    const recommendedSection = document.getElementById('recommendedSection');
    const cartLoading = document.getElementById('cartLoading');
    const cartNotice = document.getElementById('cartNotice');
    const esc = GolazoStore.escapeHtml;
    const attr = GolazoStore.escapeAttr;

    function setLoading(isLoading) {
        if (cartLoading) cartLoading.style.display = isLoading ? 'block' : 'none';
        if (cartWithItemsDiv) cartWithItemsDiv.style.display = isLoading ? 'none' : cartWithItemsDiv.style.display;
        if (emptyCartDiv) emptyCartDiv.style.display = isLoading ? 'none' : emptyCartDiv.style.display;
    }

    function showNotice(message) {
        if (!cartNotice) return;
        if (!message) {
            cartNotice.classList.add('d-none');
            cartNotice.textContent = '';
            return;
        }
        cartNotice.classList.remove('d-none');
        cartNotice.innerHTML = `<i class="fas fa-circle-exclamation me-2"></i>${esc(message)}`;
    }

    function renderRecommendations(summary) {
        if (!recommendedSection) return;
        const currentIds = new Set(summary.items.map((item) => Number(item.id)));

        GolazoStore.getProducts()
            .then((products) => {
                const recommended = products
                    .filter((product) => !currentIds.has(Number(product.id)) && Number(product.stock) > 0)
                    .slice(0, 3);

                if (!recommended.length) {
                    recommendedSection.style.display = 'none';
                    recommendedSection.innerHTML = '';
                    return;
                }

                recommendedSection.style.display = 'block';
                recommendedSection.innerHTML = `
                    <section class="cart-stage__recommended">
                        <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-4">
                            <div>
                                <p class="eyebrow mb-2">Para completar el pedido</p>
                                <h2 class="mb-1">Tambien te puede interesar</h2>
                            </div>
                            <a href="catalogo.html" class="btn btn-outline-brand">Seguir explorando</a>
                        </div>
                        <div class="row g-4">
                            ${recommended.map((product) => createRecommendationCard(product)).join('')}
                        </div>
                    </section>
                `;
            })
            .catch(() => {
                recommendedSection.style.display = 'none';
                recommendedSection.innerHTML = '';
            });
    }

    function createRecommendationCard(product) {
        const sizes = Array.isArray(product.sizes) && product.sizes.length
            ? product.sizes.slice(0, 3).join(' / ')
            : 'Talles a confirmar';
        const urgency = Number(product.stock) <= 3 ? 'Stock corto' : 'Stock disponible';

        return `
            <div class="col-lg-4">
                <article class="card product-card product-card--related h-100 border-0 shadow-sm">
                    <a href="${GolazoStore.paths.product(product.id)}" class="position-relative d-block overflow-hidden">
                        <img src="${attr(product.image_url)}" class="card-img-top" alt="${esc(product.name)}">
                    </a>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                            <span class="badge badge-soft-brand">${esc(GolazoStore.getCategoryLabel(product))}</span>
                            <span class="badge badge-soft-neutral">Stock ${product.stock}</span>
                        </div>
                        <h3 class="h5 mb-2">${esc(product.name)}</h3>
                        <p class="text-ui-muted small flex-grow-1">${esc((product.description || 'Camiseta de futbol lista para entrar en el mismo pedido.').slice(0, 110))}...</p>
                        <div class="product-card__footer-meta d-flex justify-content-between align-items-center gap-2 small text-ui-muted mb-3">
                            <span><i class="fas fa-ruler-combined me-1"></i>${esc(sizes)}</span>
                            <span><i class="fas fa-fire me-1"></i>${urgency}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <strong class="text-price-accent">${GolazoStore.formatPrice(product.price)}</strong>
                            <button class="btn btn-outline-brand btn-sm" type="button" data-add-recommended="${product.id}">Agregar</button>
                        </div>
                    </div>
                </article>
            </div>
        `;
    }

    function renderCart() {
        const summary = GolazoStore.cart.summary();
        setLoading(false);
        showNotice('');

        if (!summary.items.length) {
            emptyCartDiv.style.display = 'block';
            cartWithItemsDiv.style.display = 'none';
            if (recommendedSection) recommendedSection.style.display = 'none';
            return;
        }

        emptyCartDiv.style.display = 'none';
        cartWithItemsDiv.style.display = 'flex';

        cartItemsContainer.innerHTML = summary.items.map((item) => {
            const stockLabel = Number(item.stock) > 0 ? `Stock ${item.stock}` : 'Stock a confirmar';
            const quantityLabel = item.quantity > 1 ? `${item.quantity} unidades en este pedido` : '1 unidad en este pedido';

            return `
                <div class="cart-item border-bottom pb-3 mb-3" data-product-id="${item.id}" data-size="${attr(item.size)}">
                    <div class="row align-items-center g-3">
                        <div class="col-md-2">
                            <a href="${GolazoStore.paths.product(item.id)}" class="d-block">
                                <img src="${attr(item.image)}" class="img-fluid rounded cart-item__image" alt="${esc(item.name)}">
                            </a>
                        </div>
                        <div class="col-md-5">
                            <div class="d-flex flex-wrap gap-2 mb-2">
                                <span class="badge badge-soft-brand">Talle ${esc(item.size)}</span>
                                <span class="badge badge-soft-neutral">${stockLabel}</span>
                            </div>
                            <a href="${GolazoStore.paths.product(item.id)}" class="text-decoration-none text-dark">
                                <h6 class="mb-1">${esc(item.name)}</h6>
                            </a>
                            <small class="text-ui-muted d-block">${quantityLabel}</small>
                            <small class="text-ui-muted d-block mt-2">Precio unitario: <strong>${GolazoStore.formatPrice(item.price)}</strong></small>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-ui-muted mb-2">Cantidad</label>
                            <div class="input-group cart-item__quantity">
                                <button class="btn btn-outline-secondary btn-sm" type="button" data-action="decrease">-</button>
                                <input type="number" class="form-control text-center" value="${item.quantity}" min="1" max="${item.stock || 99}" data-action="update">
                                <button class="btn btn-outline-secondary btn-sm" type="button" data-action="increase">+</button>
                            </div>
                        </div>
                        <div class="col-md-2 text-md-end">
                            <small class="text-ui-muted d-block mb-1">Subtotal</small>
                            <span class="fw-bold text-price-accent price-inline d-inline-block">${GolazoStore.formatPrice(item.price * item.quantity)}</span>
                        </div>
                        <div class="col-md-1 text-end">
                            <button class="btn btn-outline-brand btn-sm" type="button" data-action="remove" aria-label="Eliminar producto del carrito"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        subtotalElement.textContent = GolazoStore.formatPrice(summary.subtotal);
        shippingElement.textContent = summary.shippingLabel || 'A coordinar';
        totalElement.textContent = GolazoStore.formatPrice(summary.total);
        if (discountRow) discountRow.remove();
        renderRecommendations(summary);
    }

    cartItemsContainer?.addEventListener('click', async function (event) {
        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) return;
        const itemElement = actionButton.closest('.cart-item');
        const productId = Number(itemElement.dataset.productId);
        const size = itemElement.dataset.size;
        const input = itemElement.querySelector('input[data-action="update"]');
        const currentQuantity = Number(input.value || 1);

        try {
            if (actionButton.dataset.action === 'increase') {
                await GolazoStore.cart.update(productId, size, currentQuantity + 1);
            }
            if (actionButton.dataset.action === 'decrease' && currentQuantity > 1) {
                await GolazoStore.cart.update(productId, size, currentQuantity - 1);
            }
            if (actionButton.dataset.action === 'remove') {
                await GolazoStore.cart.remove(productId, size);
                GolazoStore.ui.toast('Producto eliminado del carrito.', 'info');
            }
            renderCart();
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo actualizar el carrito.', 'danger');
        }
    });

    recommendedSection?.addEventListener('click', async function (event) {
        const button = event.target.closest('[data-add-recommended]');
        if (!button) return;
        const productId = Number(button.getAttribute('data-add-recommended'));

        try {
            const products = await GolazoStore.getProducts();
            const product = products.find((item) => Number(item.id) === productId);
            if (!product) return;
            await GolazoStore.cart.add(product, 1, product.sizes?.[0] || 'M');
            GolazoStore.ui.toast('Producto agregado al carrito.', 'success');
            renderCart();
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo agregar el producto.', 'danger');
        }
    });

    cartItemsContainer?.addEventListener('change', async function (event) {
        const input = event.target.closest('input[data-action="update"]');
        if (!input) return;
        const itemElement = input.closest('.cart-item');
        try {
            await GolazoStore.cart.update(Number(itemElement.dataset.productId), itemElement.dataset.size, Number(input.value || 1));
            renderCart();
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo actualizar el carrito.', 'danger');
        }
    });

    clearCartBtn?.addEventListener('click', async function () {
        try {
            await GolazoStore.cart.clear();
            GolazoStore.ui.toast('Carrito vaciado.', 'info');
            renderCart();
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo vaciar el carrito.', 'danger');
        }
    });

    checkoutBtn?.addEventListener('click', function () {
        const summary = GolazoStore.cart.summary();
        if (!summary.items.length) {
            GolazoStore.ui.toast('Tu carrito esta vacio.', 'warning');
            return;
        }
        window.location.href = GolazoStore.paths.checkout();
    });

    GolazoStore.cart.refresh()
        .then(() => {
            renderCart();
        })
        .catch((error) => {
            setLoading(false);
            showNotice(error.message || 'No se pudo cargar el carrito.');
            renderCart();
        });

    setLoading(true);
    window.addEventListener('cart:updated', renderCart);
});
