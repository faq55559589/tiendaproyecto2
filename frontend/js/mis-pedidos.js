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
            ordersNotice.className = 'alert surface-note border-0 orders-summary-alert';
        }
        return;
    }

    if (ordersNotice) {
        ordersNotice.innerHTML = '<i class="fas fa-circle-check me-2"></i>Revisa aqui el estado de cada pedido, la forma de pago y la informacion de entrega.';
        ordersNotice.className = 'alert surface-note border-0 orders-summary-alert';
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
        <article class="card mb-3 border-0 shadow-sm order-history-card">
            <div class="card-header card-header-soft d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <strong>Pedido #${order.id}</strong>
                    <div class="small text-ui-muted">${new Date(order.createdAt).toLocaleString('es-UY')}</div>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                    <span class="badge ${getOrderStatusBadge(order.status, order.paymentStatus)}">${formatOrderStatus(order.status, order.paymentStatus)}</span>
                    <span class="badge badge-soft-neutral">${GolazoStore.formatPaymentMethod(order.paymentMethod)}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="order-history-items mb-3">
                    ${order.items.map((item) => `
                        <div class="order-history-item d-flex align-items-center gap-3 mb-3">
                            <img src="${item.image}" alt="${item.name}" width="56" height="56" class="rounded" style="object-fit: cover;">
                            <div class="flex-grow-1">
                                <div class="fw-semibold">${item.name}</div>
                                <small class="text-ui-muted">Talle ${item.size} | Cantidad ${item.quantity}</small>
                            </div>
                            <strong class="text-price-accent">${GolazoStore.formatPrice(item.price * item.quantity)}</strong>
                        </div>
                    `).join('')}
                </div>
                <hr>
                <div class="row g-3 align-items-start">
                    <div class="col-md-8">
                        <div><strong>Entrega:</strong> ${order.shippingAddress && order.shippingAddress !== '-' ? order.shippingAddress : 'A coordinar'}</div>
                        <div><strong>Pago:</strong> ${GolazoStore.formatPaymentMethod(order.paymentMethod)}</div>
                        ${renderOrderHelp(order)}
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

function formatOrderStatus(status, paymentStatus) {
    if (paymentStatus === 'expired') return 'Expirado';

    const map = {
        pending_contact: 'Pendiente de contacto',
        confirmed: 'Confirmado',
        cancelled: 'Cancelado',
        delivered: 'Entregado'
    };

    return map[status] || 'En proceso';
}

function getOrderStatusBadge(status, paymentStatus) {
    if (paymentStatus === 'expired') return 'badge-soft-danger';
    if (status === 'confirmed' || status === 'delivered') return 'badge-soft-success';
    if (status === 'cancelled') return 'badge-soft-danger';
    return 'badge-soft-brand';
}

function renderOrderHelp(order) {
    if (order.paymentStatus === 'expired') {
        return '<div class="small text-ui-muted mt-2">Este pedido vencio por falta de confirmacion y ya no reserva stock.</div>';
    }

    if (order.status === 'cancelled') {
        return '<div class="small text-ui-muted mt-2">Este pedido fue cancelado y quedo guardado como referencia en tu historial.</div>';
    }

    if (order.paymentMethod === 'instagram' && order.status === 'pending_contact') {
        return `
            <div class="small text-ui-muted mt-2">Tu pedido quedo pendiente de coordinacion. Si todavia no hablaste con nosotros, puedes seguir por Instagram.</div>
            <div class="mt-2">
                <a href="${GolazoStore.getInstagramChatUrl()}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-brand">
                    <i class="fab fa-instagram me-2"></i>Continuar por Instagram
                </a>
            </div>
        `;
    }

    if (order.status === 'confirmed') {
        return '<div class="small text-ui-muted mt-2">Tu pedido ya fue confirmado. Nos falta coordinar la entrega final contigo.</div>';
    }

    if (order.status === 'delivered') {
        return '<div class="small text-ui-muted mt-2">Pedido entregado. Se conserva en tu historial como referencia.</div>';
    }

    return '';
}
