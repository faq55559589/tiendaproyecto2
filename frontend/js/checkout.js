document.addEventListener('DOMContentLoaded', async function () {
    if (!GolazoAuth.requireAuth()) return;

    const form = document.getElementById('checkoutForm');
    const summaryWrap = document.getElementById('checkoutSummary');
    const emptyState = document.getElementById('checkoutEmpty');
    const pageWrap = document.getElementById('checkoutContent');
    const checkoutLoading = document.getElementById('checkoutLoading');
    const checkoutNotice = document.getElementById('checkoutNotice');

    function setLoading(isLoading) {
        if (checkoutLoading) checkoutLoading.style.display = isLoading ? 'block' : 'none';
        if (isLoading) {
            emptyState.classList.add('d-none');
            pageWrap.classList.add('d-none');
        }
    }

    function showNotice(message) {
        if (!checkoutNotice) return;
        if (!message) {
            checkoutNotice.classList.add('d-none');
            checkoutNotice.textContent = '';
            return;
        }
        checkoutNotice.classList.remove('d-none');
        checkoutNotice.innerHTML = `<i class="fas fa-circle-exclamation me-2"></i>${message}`;
    }

    setLoading(true);
    showNotice('');

    try {
        await GolazoStore.cart.refresh();
    } catch (error) {
        setLoading(false);
        showNotice(error.message || 'No se pudo cargar el carrito.');
        return;
    }

    const summary = GolazoStore.cart.summary();
    if (!summary.items.length) {
        setLoading(false);
        emptyState.classList.remove('d-none');
        pageWrap.classList.add('d-none');
        return;
    }
    setLoading(false);
    pageWrap.classList.remove('d-none');

    const user = GolazoAuth.getCurrentUser();
    const draft = GolazoStore.checkoutDraft.get();

    if (user) {
        document.getElementById('customerName').value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        document.getElementById('customerEmail').value = user.email || '';
        document.getElementById('customerPhone').value = user.phone || '';
    }

    Object.entries(draft).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input && !input.value) input.value = value;
    });

    renderSummary(summary);

    form?.addEventListener('input', function () {
        const formData = Object.fromEntries(new FormData(form).entries());
        GolazoStore.checkoutDraft.save(formData);
    });

    form?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Confirmando';

        try {
            const formData = Object.fromEntries(new FormData(form).entries());
            GolazoStore.checkoutDraft.save(formData);

            const order = await GolazoStore.orders.create({
                items: summary.items,
                subtotal: summary.subtotal,
                shipping: summary.shipping,
                total: summary.total,
                customer: {
                    name: formData.customerName,
                    email: formData.customerEmail,
                    phone: formData.customerPhone,
                    address: formData.customerAddress,
                    city: formData.customerCity,
                    notes: formData.customerNotes,
                    paymentMethod: formData.paymentMethod || 'mercado_pago'
                }
            });

            GolazoStore.checkoutDraft.clear();
            GolazoStore.cart.saveCache([]);
            sessionStorage.setItem('lastOrderId', String(order.id));
            window.location.href = GolazoStore.paths.confirmation();
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo confirmar el pedido.', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    function renderSummary(data) {
        summaryWrap.innerHTML = `
            ${data.items.map((item) => `
                <div class="d-flex align-items-center gap-3 mb-3">
                    <img src="${item.image}" alt="${item.name}" width="56" height="56" class="rounded" style="object-fit: cover;">
                    <div class="flex-grow-1">
                        <div class="fw-semibold">${item.name}</div>
                        <small class="text-muted">Talle ${item.size} · Cantidad ${item.quantity}</small>
                    </div>
                    <strong>${GolazoStore.formatPrice(item.price * item.quantity)}</strong>
                </div>
            `).join('')}
            <hr>
            <div class="d-flex justify-content-between mb-2"><span>Subtotal</span><strong>${GolazoStore.formatPrice(data.subtotal)}</strong></div>
            <div class="d-flex justify-content-between mb-2"><span>Envio</span><strong>${data.shipping === 0 ? 'Gratis' : GolazoStore.formatPrice(data.shipping)}</strong></div>
            <div class="d-flex justify-content-between"><span>Total</span><strong class="text-danger fs-4">${GolazoStore.formatPrice(data.total)}</strong></div>
        `;
    }
});
