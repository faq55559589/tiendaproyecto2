document.addEventListener('DOMContentLoaded', async function () {
    if (!GolazoAuth.requireAuth()) return;

    const user = GolazoAuth.getCurrentUser();
    document.getElementById('profileName').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    document.getElementById('profileEmail').textContent = user.email || '';

    const emptyOrders = document.getElementById('emptyOrders');
    const ordersList = document.getElementById('ordersList');
    const ordersCount = document.getElementById('ordersCount');
    const ordersNotice = document.getElementById('ordersNotice');

    let orders = [];
    try {
        orders = await GolazoStore.orders.all();
    } catch (error) {
        if (ordersNotice) {
            ordersNotice.innerHTML = '<i class="fas fa-circle-exclamation me-2"></i>No se pudo cargar el historial de pedidos.';
            ordersNotice.className = 'alert surface-note border-0';
        }
        return;
    }

    if (ordersNotice) {
        ordersNotice.innerHTML = '<i class="fas fa-circle-check me-2"></i>Estos pedidos se leen desde backend real.';
        ordersNotice.className = 'alert surface-note border-0';
    }

    ordersCount.textContent = `${orders.length} pedido(s)`;

    if (!orders.length) {
        emptyOrders.classList.remove('d-none');
        ordersList.classList.add('d-none');
        return;
    }

    emptyOrders.classList.add('d-none');
    ordersList.classList.remove('d-none');
    ordersList.innerHTML = orders.map((order) => `
        <article class="card mb-3 border-0 shadow-sm">
            <div class="card-header card-header-soft d-flex justify-content-between align-items-center">
                <strong>#${order.id}</strong>
                <span class="badge badge-soft-success text-uppercase">${order.status}</span>
            </div>
            <div class="card-body">
                <p class="text-ui-muted small mb-3">${new Date(order.createdAt).toLocaleString('es-UY')}</p>
                ${order.items.map((item) => `
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <img src="${item.image}" alt="${item.name}" width="56" height="56" class="rounded" style="object-fit: cover;">
                        <div class="flex-grow-1">
                            <div class="fw-semibold">${item.name}</div>
                            <small class="text-ui-muted">Talle ${item.size} · Cantidad ${item.quantity}</small>
                        </div>
                        <strong class="text-price-accent">${GolazoStore.formatPrice(item.price * item.quantity)}</strong>
                    </div>
                `).join('')}
                <hr>
                <div class="row g-3">
                    <div class="col-md-8">
                        <div><strong>Entrega:</strong> ${order.shippingAddress}</div>
                        <div><strong>Pago:</strong> ${GolazoStore.formatPaymentMethod(order.paymentMethod)}</div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="small text-ui-muted">Total</div>
                        <div class="fs-5 fw-bold text-price-accent">${GolazoStore.formatPrice(order.total)}</div>
                    </div>
                </div>
            </div>
        </article>
    `).join('');
});
