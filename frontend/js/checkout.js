document.addEventListener('DOMContentLoaded', async function () {
    if (!GolazoAuth.requireAuth()) return;

    const form = document.getElementById('checkoutForm');
    const summaryWrap = document.getElementById('checkoutSummary');
    const emptyState = document.getElementById('checkoutEmpty');
    const pageWrap = document.getElementById('checkoutContent');
    const checkoutLoading = document.getElementById('checkoutLoading');
    const checkoutNotice = document.getElementById('checkoutNotice');
    const paymentMethodInput = document.getElementById('paymentMethod');
    const paymentMethodHelp = document.getElementById('paymentMethodHelp');

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
        checkoutNotice.innerHTML = `<i class="fas fa-circle-exclamation me-2"></i>${GolazoStore.escapeHtml(message)}`;
    }

    function setSubmitState(button, isLoading, label) {
        if (!button) return;

        if (!button.dataset.originalLabel) {
            button.dataset.originalLabel = button.innerHTML;
        }

        button.disabled = isLoading;
        button.innerHTML = isLoading
            ? `<i class="fas fa-spinner fa-spin me-2"></i>${GolazoStore.escapeHtml(label || 'Procesando')}`
            : button.dataset.originalLabel;
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
        document.getElementById('customerPhone').value = GolazoStore.formatUyPhone(user.phone || '');
    }

    Object.entries(draft).forEach(([key, value]) => {
        const input = document.getElementById(key);
        const shouldPopulate = input && (!input.value || input.tagName === 'SELECT');
        if (shouldPopulate) {
            input.value = input.type === 'tel' ? GolazoStore.formatUyPhone(value) : value;
        }
    });

    renderSummary(summary);
    syncPaymentMethodHelp();

    form?.addEventListener('input', function () {
        const formData = Object.fromEntries(new FormData(form).entries());
        GolazoStore.checkoutDraft.save(formData);
    });

    paymentMethodInput?.addEventListener('change', syncPaymentMethodHelp);

    form?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const selectedPaymentMethod = paymentMethodInput?.value || 'instagram';
        setSubmitState(
            submitBtn,
            true,
            selectedPaymentMethod === 'mercado_pago' ? 'Iniciando pago' : 'Confirmando'
        );

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
                    phone: GolazoStore.formatUyPhone(formData.customerPhone),
                    address: formData.customerAddress,
                    city: formData.customerCity,
                    notes: formData.customerNotes,
                    paymentMethod: formData.paymentMethod || 'instagram'
                }
            });

            sessionStorage.setItem('lastOrderId', String(order.id));
            GolazoStore.cart.saveCache([]);

            if (order.paymentMethod === 'instagram') {
                const instagramMessage = GolazoStore.buildInstagramOrderMessage({
                    order,
                    customer: {
                        name: formData.customerName,
                        email: formData.customerEmail,
                        phone: GolazoStore.formatUyPhone(formData.customerPhone),
                        address: formData.customerAddress,
                        city: formData.customerCity,
                        notes: formData.customerNotes
                    },
                    summary
                });

                sessionStorage.setItem('instagramChatUrl', GolazoStore.getInstagramChatUrl());
                sessionStorage.setItem('instagramOrderMessage', instagramMessage);
                sessionStorage.setItem('openInstagramAfterCheckout', 'true');
            } else {
                sessionStorage.removeItem('instagramChatUrl');
                sessionStorage.removeItem('instagramOrderMessage');
                sessionStorage.removeItem('openInstagramAfterCheckout');

                const preferenceResult = await GolazoStore.orders.createMercadoPagoPreference(order.id);
                const checkoutUrl = preferenceResult.preference.init_point || preferenceResult.preference.sandbox_init_point;
                if (!checkoutUrl) {
                    throw new Error('No se pudo obtener la URL de pago de Mercado Pago');
                }

                GolazoStore.checkoutDraft.clear();
                window.location.href = checkoutUrl;
                return;
            }

            GolazoStore.checkoutDraft.clear();
            window.location.href = GolazoStore.paths.confirmation();
        } catch (error) {
            if (selectedPaymentMethod === 'mercado_pago' && sessionStorage.getItem('lastOrderId')) {
                sessionStorage.setItem('mercadoPagoCheckoutError', error.message || 'No se pudo iniciar el pago online.');
                window.location.href = GolazoStore.paths.confirmation();
                return;
            }

            GolazoStore.ui.toast(error.message || 'No se pudo confirmar el pedido.', 'danger');
            setSubmitState(submitBtn, false);
        }
    });

    function renderSummary(data) {
        summaryWrap.innerHTML = `
            ${data.items.map((item) => `
                <div class="d-flex align-items-center gap-3 mb-3">
                    <img src="${GolazoStore.escapeAttr(item.image)}" alt="${GolazoStore.escapeHtml(item.name)}" width="56" height="56" class="rounded" style="object-fit: cover;">
                    <div class="flex-grow-1">
                        <div class="fw-semibold">${GolazoStore.escapeHtml(item.name)}</div>
                        <small class="text-ui-muted">Talle ${GolazoStore.escapeHtml(item.size)} | Cantidad ${item.quantity}</small>
                    </div>
                    <strong>${GolazoStore.formatPrice(item.price * item.quantity)}</strong>
                </div>
            `).join('')}
            <hr>
            <div class="d-flex justify-content-between mb-2"><span>Subtotal</span><strong>${GolazoStore.formatPrice(data.subtotal)}</strong></div>
            <div class="d-flex justify-content-between mb-2"><span>Envio</span><strong>${data.shippingLabel || 'A coordinar'}</strong></div>
            <div class="d-flex justify-content-between"><span>Total</span><strong class="text-price-accent fs-4">${GolazoStore.formatPrice(data.total)}</strong></div>
        `;
    }

    function syncPaymentMethodHelp() {
        if (!paymentMethodHelp || !paymentMethodInput) return;
        if (paymentMethodInput.value === 'mercado_pago') {
            paymentMethodHelp.textContent = 'Te redirigiremos a Mercado Pago para completar el pago online. La orden queda asociada a tu cuenta y luego veras el estado actualizado.';
            return;
        }

        paymentMethodHelp.textContent = 'Tu pedido se reserva y luego seguimos la coordinacion manual por Instagram con el numero de pedido ya generado.';
    }
});
