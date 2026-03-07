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
        cartNotice.innerHTML = `<i class="fas fa-circle-exclamation me-2"></i>${message}`;
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
        cartWithItemsDiv.style.display = 'block';
        if (recommendedSection) recommendedSection.style.display = 'none';

        cartItemsContainer.innerHTML = summary.items.map((item) => `
            <div class="cart-item border-bottom pb-3 mb-3" data-product-id="${item.id}" data-size="${item.size}">
                <div class="row align-items-center g-3">
                    <div class="col-md-2">
                        <a href="${GolazoStore.paths.product(item.id)}">
                            <img src="${item.image}" class="img-fluid rounded" alt="${item.name}" style="max-height: 120px; object-fit: cover;">
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="${GolazoStore.paths.product(item.id)}" class="text-decoration-none text-dark">
                            <h6 class="mb-1">${item.name}</h6>
                        </a>
                        <small class="text-ui-muted d-block">Talle: ${item.size}</small>
                        <small class="text-ui-muted">Stock: ${item.stock || 'sin dato'}</small>
                    </div>
                    <div class="col-md-2">
                        <span class="fw-bold">${GolazoStore.formatPrice(item.price)}</span>
                    </div>
                    <div class="col-md-2">
                        <div class="input-group" style="max-width: 130px;">
                            <button class="btn btn-outline-secondary btn-sm" type="button" data-action="decrease">-</button>
                            <input type="number" class="form-control text-center" value="${item.quantity}" min="1" max="${item.stock || 99}" data-action="update">
                            <button class="btn btn-outline-secondary btn-sm" type="button" data-action="increase">+</button>
                        </div>
                    </div>
                    <div class="col-md-2 text-md-end">
                        <span class="fw-bold text-price-accent price-inline d-inline-block">${GolazoStore.formatPrice(item.price * item.quantity)}</span>
                    </div>
                    <div class="col-md-1 text-end">
                        <button class="btn btn-outline-brand btn-sm" type="button" data-action="remove"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

        subtotalElement.textContent = GolazoStore.formatPrice(summary.subtotal);
        shippingElement.textContent = summary.shipping === 0 ? 'Gratis' : GolazoStore.formatPrice(summary.shipping);
        totalElement.textContent = GolazoStore.formatPrice(summary.total);
        if (discountRow) discountRow.remove();
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
