document.addEventListener('DOMContentLoaded', async function () {
    if (!GolazoAuth.requireAuth()) return;

    const user = GolazoAuth.getCurrentUser();
    document.getElementById('profileName').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    document.getElementById('profileEmail').textContent = user.email || '';
    const profileAvatarWrap = document.getElementById('profileAvatarWrap');
    if (profileAvatarWrap) {
        profileAvatarWrap.innerHTML = GolazoStore.renderAvatarMarkup(user, {
            className: 'profile-avatar profile-avatar--sidebar',
            size: 112,
            alt: `Avatar de ${user.first_name || 'usuario'}`
        });
    }

    const emptyOrders = document.getElementById('emptyOrders');
    const ordersList = document.getElementById('ordersList');
    const ordersCount = document.getElementById('ordersCount');
    const ordersNotice = document.getElementById('ordersNotice');
    const esc = GolazoStore.escapeHtml;
    const attr = GolazoStore.escapeAttr;

    let orders = [];

    function canRetryMercadoPago(order) {
        return order.paymentMethod === 'mercado_pago'
            && ['pending_payment', 'pending', 'in_process'].includes(order.paymentStatus)
            && !['cancelled', 'delivered'].includes(order.status)
            && order.paymentStatus !== 'expired';
    }
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
        ordersNotice.innerHTML = '<i class="fas fa-circle-check me-2"></i>Revisa aqui el estado de cada pedido, el avance de coordinacion y la informacion de entrega.';
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
                    <span class="badge ${getPaymentStatusBadge(order.paymentStatus, order.paymentMethod)}">${formatPaymentStatus(order.paymentStatus, order.paymentMethod)}</span>
                    <span class="badge badge-soft-neutral">${GolazoStore.formatPaymentMethod(order.paymentMethod)}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="order-history-items mb-3">
                    ${order.items.map((item) => `
                        <div class="order-history-item d-flex align-items-center gap-3 mb-3">
                            <img src="${attr(item.image)}" alt="${esc(item.name)}" width="56" height="56" class="rounded" style="object-fit: cover;">
                            <div class="flex-grow-1">
                                <div class="fw-semibold">${esc(item.name)}</div>
                                <small class="text-ui-muted">Talle ${esc(item.size)} | Cantidad ${item.quantity}</small>
                            </div>
                            <strong class="text-price-accent">${GolazoStore.formatPrice(item.price * item.quantity)}</strong>
                        </div>
                    `).join('')}
                </div>
                <hr>
                <div class="row g-3 align-items-start">
                    <div class="col-md-8">
                        <div><strong>Entrega:</strong> ${order.shippingAddress && order.shippingAddress !== '-' ? esc(order.shippingAddress) : 'A coordinar'}</div>
                        <div><strong>Pago:</strong> ${GolazoStore.formatPaymentMethod(order.paymentMethod)}</div>
                        <div><strong>Estado de pago:</strong> ${formatPaymentStatus(order.paymentStatus, order.paymentMethod)}</div>
                        ${renderOrderHelp(order)}
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="small text-ui-muted">Total</div>
                        <div class="fs-5 fw-bold text-price-accent">${GolazoStore.formatPrice(order.total)}</div>
                        ${canRetryMercadoPago(order) ? `
                            <button type="button" class="btn btn-outline-brand btn-sm mt-3" data-retry-mp="${order.id}">
                                <i class="fas fa-rotate-right me-2"></i>Reintentar pago
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </article>
    `).join('');

    ordersList.querySelectorAll('[data-retry-mp]').forEach((button) => {
        button.addEventListener('click', async function () {
            const orderId = Number(button.getAttribute('data-retry-mp'));
            if (!orderId) return;

            const originalHtml = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Abriendo pago';

            try {
                const result = await GolazoStore.orders.createMercadoPagoPreference(orderId);
                const checkoutUrl = result.preference.init_point || result.preference.sandbox_init_point;
                if (!checkoutUrl) {
                    throw new Error('No se pudo obtener la URL de pago de Mercado Pago');
                }

                sessionStorage.setItem('lastOrderId', String(orderId));
                window.location.href = checkoutUrl;
            } catch (error) {
                button.disabled = false;
                button.innerHTML = originalHtml;
                GolazoStore.ui.toast(error.message || 'No se pudo reintentar el pago.', 'danger');
            }
        });
    });
});

function formatOrderStatus(status, paymentStatus) {
    if (paymentStatus === 'expired') return 'Expirado';
    if (['pending_payment', 'pending', 'in_process'].includes(paymentStatus)) return 'Pendiente de pago';
    if (paymentStatus === 'approved') return 'Confirmado';
    if (['rejected', 'cancelled', 'charged_back'].includes(paymentStatus) && status === 'pending_contact') return 'Pago no completado';

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
    if (paymentStatus === 'approved') return 'badge-soft-success';
    if (['rejected', 'cancelled', 'charged_back'].includes(paymentStatus) && status === 'pending_contact') return 'badge-soft-danger';
    if (['pending_payment', 'pending', 'in_process'].includes(paymentStatus)) return 'badge-soft-warning';
    if (status === 'confirmed' || status === 'delivered') return 'badge-soft-success';
    if (status === 'cancelled') return 'badge-soft-danger';
    return 'badge-soft-brand';
}

function formatPaymentStatus(paymentStatus, paymentMethod) {
    if (paymentMethod === 'mercado_pago') {
        const map = {
            expired: 'Pago expirado',
            pending_payment: 'Pendiente de pago',
            pending: 'Pendiente de pago',
            in_process: 'Pago en proceso',
            approved: 'Pago aprobado',
            rejected: 'Pago rechazado',
            cancelled: 'Pago cancelado',
            refunded: 'Pago reembolsado',
            charged_back: 'Contracargo'
        };

        return map[paymentStatus] || 'Pendiente de pago';
    }

    const map = {
        pending_contact: 'Coordinacion pendiente',
        confirmed: 'Coordinado',
        delivered: 'Cerrado',
        cancelled: 'Cancelado',
        expired: 'Expirado'
    };

    return map[paymentStatus] || 'Sin estado';
}

function getPaymentStatusBadge(paymentStatus, paymentMethod) {
    if (paymentMethod === 'mercado_pago') {
        if (paymentStatus === 'approved') return 'badge-soft-success';
        if (paymentStatus === 'expired') return 'badge-soft-danger';
        if (['rejected', 'cancelled', 'charged_back'].includes(paymentStatus)) return 'badge-soft-danger';
        return 'badge-soft-warning';
    }
    if (paymentStatus === 'expired' || paymentStatus === 'cancelled') return 'badge-soft-danger';
    if (paymentStatus === 'confirmed' || paymentStatus === 'delivered') return 'badge-soft-success';
    return 'badge-soft-neutral';
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
            <div class="small text-ui-muted mt-2">Tu pedido quedo pendiente de coordinacion. Si todavia no hablaste con nosotros, puedes seguir por Instagram con el numero de pedido a mano.</div>
            <div class="mt-2">
                <a href="${GolazoStore.getInstagramChatUrl()}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-brand">
                    <i class="fab fa-instagram me-2"></i>Continuar por Instagram
                </a>
            </div>
        `;
    }

    if (order.paymentMethod === 'mercado_pago') {
        if (order.paymentStatus === 'expired') {
            return '<div class="small text-ui-muted mt-2">La ventana de pago online vencio y el stock ya fue liberado. Para volver a comprar, agrega nuevamente el producto al carrito.</div>';
        }

        if (order.paymentStatus === 'approved') {
            return '<div class="small text-ui-muted mt-2">Mercado Pago confirmo el pago y tu pedido ya quedo validado para seguimiento y entrega.</div>';
        }

        if (['rejected', 'cancelled'].includes(order.paymentStatus)) {
            return '<div class="small text-ui-muted mt-2">El pago no se completo. Conservamos la orden en tu historial para referencia.</div>';
        }

        if (order.paymentStatus === 'in_process') {
            return '<div class="small text-ui-muted mt-2">El pago esta en revision. Apenas Mercado Pago lo confirme, actualizaremos el estado automaticamente.</div>';
        }

        const expirationCopy = order.expiresAt
            ? ` La reserva vence el ${new Date(order.expiresAt).toLocaleString('es-UY')}.`
            : '';
        return `<div class="small text-ui-muted mt-2">El pago sigue pendiente. Mercado Pago actualizara esta orden automaticamente cuando reciba una novedad.${expirationCopy}</div>`;
    }

    if (order.status === 'confirmed') {
        return '<div class="small text-ui-muted mt-2">Tu pedido ya fue confirmado. Solo falta cerrar la entrega final contigo.</div>';
    }

    if (order.status === 'delivered') {
        return '<div class="small text-ui-muted mt-2">Pedido entregado. Se conserva en tu historial como referencia.</div>';
    }

    return '';
}
