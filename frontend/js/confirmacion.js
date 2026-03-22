document.addEventListener('DOMContentLoaded', async function () {
    if (!GolazoAuth.requireAuth()) return;

    const searchParams = new URLSearchParams(window.location.search);
    const requestedOrderId = String(searchParams.get('order_id') || '').trim();
    const requestedExternalReference = String(searchParams.get('external_reference') || '').trim();
    const returnedPaymentStatus = String(searchParams.get('payment_status') || '').trim();
    const lastOrderId = String(sessionStorage.getItem('lastOrderId') || '').trim();
    const emptyState = document.getElementById('confirmationFallback');
    const content = document.getElementById('confirmationContent');
    const instagramPanel = document.getElementById('confirmationInstagramPanel');
    const instagramLink = document.getElementById('confirmationInstagramLink');
    const instagramMessagePreview = document.getElementById('instagramMessagePreview');
    const copyInstagramMessageBtn = document.getElementById('copyInstagramMessageBtn');
    const confirmationStatusNote = document.getElementById('confirmationStatusNote');
    const mercadoPagoCheckoutError = sessionStorage.getItem('mercadoPagoCheckoutError');

    let order = null;
    try {
        if (requestedOrderId) {
            order = await GolazoStore.orders.getById(requestedOrderId);
        }

        if (!order && lastOrderId && lastOrderId !== requestedOrderId) {
            order = await GolazoStore.orders.getById(lastOrderId);
        }

        if (!order) {
            const orders = await GolazoStore.orders.all();
            order = requestedExternalReference
                ? (orders.find((candidate) => candidate.externalReference === requestedExternalReference) || null)
                : (orders[0] || null);
        }
    } catch (error) {
        order = null;
    }

    if (!order) {
        emptyState.classList.remove('d-none');
        content.classList.add('d-none');
        return;
    }

    document.getElementById('confirmationOrderId').textContent = `#${order.id}`;
    document.getElementById('confirmationEmail').textContent = GolazoAuth.getCurrentUser()?.email || '-';
    document.getElementById('confirmationAddress').textContent = order.shippingAddress || '-';
    document.getElementById('confirmationOrderStatus').textContent = formatOrderStatus(order.status, order.paymentStatus);
    document.getElementById('confirmationPaymentStatus').textContent = formatPaymentStatus(order.paymentStatus, order.paymentMethod);
    document.getElementById('confirmationPayment').textContent = GolazoStore.formatPaymentMethod(order.paymentMethod);
    document.getElementById('confirmationTotal').textContent = GolazoStore.formatPrice(order.total);
    document.getElementById('confirmationItems').innerHTML = order.items.map((item) => `
        <div class="d-flex align-items-center gap-3 mb-3">
            <img src="${GolazoStore.escapeAttr(item.image)}" alt="${GolazoStore.escapeHtml(item.name)}" width="56" height="56" class="rounded" style="object-fit: cover;">
            <div class="flex-grow-1">
                <div class="fw-semibold">${GolazoStore.escapeHtml(item.name)}</div>
                <small class="text-muted">Talle ${GolazoStore.escapeHtml(item.size)} | Cantidad ${item.quantity}</small>
            </div>
            <strong>${GolazoStore.formatPrice(item.price * item.quantity)}</strong>
        </div>
    `).join('');

    const instagramChatUrl = sessionStorage.getItem('instagramChatUrl');
    const instagramOrderMessage = sessionStorage.getItem('instagramOrderMessage');
    const shouldOpenInstagram = sessionStorage.getItem('openInstagramAfterCheckout') === 'true';

    if (order.paymentMethod === 'instagram' && instagramPanel && instagramLink && instagramMessagePreview) {
        instagramPanel.classList.remove('d-none');
        instagramLink.href = instagramChatUrl || GolazoStore.getInstagramChatUrl();
        instagramMessagePreview.textContent = instagramOrderMessage || `Hola, quiero coordinar mi pedido #${order.id}.`;
        const expirationCopy = order.expiresAt
            ? ` La reserva manual vence el ${new Date(order.expiresAt).toLocaleString('es-UY')}.`
            : '';
        confirmationStatusNote.textContent = `Pedido creado correctamente. Ahora seguimos la coordinacion por Instagram.${expirationCopy}`;

        if (shouldOpenInstagram) {
            sessionStorage.removeItem('openInstagramAfterCheckout');
            window.open(instagramLink.href, '_blank', 'noopener');
        }

        copyInstagramMessageBtn?.addEventListener('click', async function () {
            try {
                await navigator.clipboard.writeText(instagramMessagePreview.textContent);
                GolazoStore.ui.toast('Mensaje copiado para Instagram.', 'success');
            } catch (error) {
                GolazoStore.ui.toast('No se pudo copiar el mensaje automaticamente.', 'warning');
            }
        });
        return;
    }

    if (confirmationStatusNote) {
        confirmationStatusNote.innerHTML = renderMercadoPagoStatusNote(order, mercadoPagoCheckoutError, returnedPaymentStatus);
    }

    sessionStorage.removeItem('mercadoPagoCheckoutError');
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

function renderMercadoPagoStatusNote(order, checkoutError, returnedPaymentStatus) {
    if (checkoutError) {
        return `Pedido creado correctamente, pero no pudimos abrir Mercado Pago: ${GolazoStore.escapeHtml(checkoutError)}`;
    }

    if (order.paymentStatus === 'approved') {
        return 'Pedido creado correctamente. Mercado Pago aprobo el pago y tu orden ya quedo confirmada.';
    }

    if (returnedPaymentStatus === 'approved') {
        return 'Mercado Pago informo que el pago fue aprobado. Si todavia ves la orden pendiente, recarga la pagina y validaremos el estado actualizado.';
    }

    if (['rejected', 'cancelled'].includes(order.paymentStatus)) {
        return 'Pedido creado correctamente, pero el pago no se completo. Puedes reintentar o revisar el estado desde mis pedidos.';
    }

    if (order.paymentStatus === 'in_process') {
        return 'Pedido creado correctamente. El pago esta en revision y actualizaremos el estado cuando Mercado Pago lo confirme.';
    }

    if (order.paymentStatus === 'expired') {
        return 'La ventana de pago online vencio y la reserva fue cancelada. Si quieres retomarlo, deberas generar una nueva compra.';
    }

    const expirationCopy = order.expiresAt
        ? ` La reserva vence el ${new Date(order.expiresAt).toLocaleString('es-UY')}.`
        : '';
    return `Pedido creado correctamente. El pago esta pendiente y quedara asociado a esta orden apenas Mercado Pago lo confirme.${expirationCopy}`;
}
