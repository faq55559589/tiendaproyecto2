document.addEventListener('DOMContentLoaded', async function () {
    if (!GolazoAuth.requireAuth()) return;

    const orderId = sessionStorage.getItem('lastOrderId');
    const emptyState = document.getElementById('confirmationFallback');
    const content = document.getElementById('confirmationContent');
    const instagramPanel = document.getElementById('confirmationInstagramPanel');
    const instagramLink = document.getElementById('confirmationInstagramLink');
    const instagramMessagePreview = document.getElementById('instagramMessagePreview');
    const copyInstagramMessageBtn = document.getElementById('copyInstagramMessageBtn');
    const confirmationStatusNote = document.getElementById('confirmationStatusNote');

    let order = null;
    try {
        if (orderId) {
            order = await GolazoStore.orders.getById(orderId);
        } else {
            const orders = await GolazoStore.orders.all();
            order = orders[0] || null;
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
    document.getElementById('confirmationPayment').textContent = GolazoStore.formatPaymentMethod(order.paymentMethod);
    document.getElementById('confirmationTotal').textContent = GolazoStore.formatPrice(order.total);
    document.getElementById('confirmationItems').innerHTML = order.items.map((item) => `
        <div class="d-flex align-items-center gap-3 mb-3">
            <img src="${item.image}" alt="${item.name}" width="56" height="56" class="rounded" style="object-fit: cover;">
            <div class="flex-grow-1">
                <div class="fw-semibold">${item.name}</div>
                <small class="text-muted">Talle ${item.size} · Cantidad ${item.quantity}</small>
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
        confirmationStatusNote.textContent = `Pedido creado correctamente. El estado de pago quedó pendiente de contacto por Instagram.${expirationCopy}`;

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
        confirmationStatusNote.textContent = 'Pedido creado correctamente. El seguimiento del pago quedará asociado a esta orden.';
    }
});
