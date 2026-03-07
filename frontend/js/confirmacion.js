document.addEventListener('DOMContentLoaded', async function () {
    if (!GolazoAuth.requireAuth()) return;

    const orderId = sessionStorage.getItem('lastOrderId');
    const emptyState = document.getElementById('confirmationFallback');
    const content = document.getElementById('confirmationContent');

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
});
