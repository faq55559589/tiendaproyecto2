document.addEventListener('DOMContentLoaded', async function () {
    const notice = document.getElementById('adminOrdersNotice');
    const list = document.getElementById('adminOrdersList');
    const statusFilter = document.getElementById('orderStatusFilter');
    const paymentFilter = document.getElementById('orderPaymentFilter');
    const summary = document.getElementById('adminOrdersSummary');
    const countPending = document.getElementById('countPending');
    const countConfirmed = document.getElementById('countConfirmed');
    const countExpired = document.getElementById('countExpired');
    const API_URL = `${GolazoStore.config.apiBase}/admin/orders`;

    let ordersCache = [];

    function showNotice(message) {
        if (!notice) return;
        if (!message) {
            notice.classList.add('d-none');
            notice.textContent = '';
            return;
        }
        notice.classList.remove('d-none');
        notice.innerHTML = `<i class="fas fa-circle-exclamation me-2"></i>${message}`;
    }

    function showToast(message) {
        const toastEl = document.getElementById('adminOrdersToast');
        toastEl.querySelector('.toast-body').textContent = message;
        new bootstrap.Toast(toastEl).show();
    }

    function getAdminToken() {
        return GolazoAuth.getToken();
    }

    function formatOrderStatus(status) {
        const map = {
            pending_contact: 'Pendiente',
            confirmed: 'Confirmado',
            cancelled: 'Cancelado',
            delivered: 'Entregado'
        };
        return map[status] || status || 'Sin estado';
    }

    function getOrderStatusBadge(status, paymentStatus) {
        if (paymentStatus === 'expired') return 'badge-soft-danger';
        if (status === 'confirmed') return 'badge-soft-success';
        if (status === 'delivered') return 'badge-soft-success';
        if (status === 'cancelled') return 'badge-soft-danger';
        return 'badge-soft-brand';
    }

    function formatPaymentStatus(paymentStatus) {
        const map = {
            pending_contact: 'Pendiente de contacto',
            pending_payment: 'Pendiente de pago',
            approved: 'Aprobado',
            rejected: 'Rechazado',
            expired: 'Expirado'
        };
        return map[paymentStatus] || paymentStatus || 'Sin estado';
    }

    function getFilteredOrders() {
        const selectedStatus = statusFilter?.value || 'all';
        const selectedPayment = paymentFilter?.value || 'all';

        return ordersCache.filter((order) => {
            const matchesPayment = selectedPayment === 'all' || order.payment_method === selectedPayment;
            if (!matchesPayment) return false;

            if (selectedStatus === 'all') return true;
            if (selectedStatus === 'expired') return order.payment_status === 'expired';
            return order.status === selectedStatus;
        });
    }

    function updateCounters() {
        const counts = ordersCache.reduce((acc, order) => {
            acc.total += 1;
            if (order.payment_status === 'expired') {
                acc.expired += 1;
            } else if (order.status === 'confirmed') {
                acc.confirmed += 1;
            } else if (order.status === 'pending_contact') {
                acc.pending += 1;
            }
            return acc;
        }, { total: 0, pending: 0, confirmed: 0, expired: 0 });

        if (summary) {
            summary.textContent = counts.total === 1 ? '1 pedido' : `${counts.total} pedidos`;
        }
        if (countPending) countPending.textContent = `${counts.pending} pendientes`;
        if (countConfirmed) countConfirmed.textContent = `${counts.confirmed} confirmados`;
        if (countExpired) countExpired.textContent = `${counts.expired} expirados`;
    }

    function buildInstagramMessage(order) {
        const lines = [
            `Hola, seguimos con el pedido #${order.id}.`,
            `Cliente: ${order.customer_name || order.email || '-'}`,
            `Total: ${GolazoStore.formatPrice(order.total_amount || order.total || 0)}`
        ];
        return lines.join('\n');
    }

    function renderOrders() {
        const orders = getFilteredOrders();
        updateCounters();

        if (!orders.length) {
            list.innerHTML = `
                <div class="empty-state text-center py-5">
                    <i class="fas fa-receipt icon-accent fs-1 mb-3"></i>
                    <h2 class="h5 mb-2">No hay pedidos en esta vista</h2>
                    <p class="text-ui-muted mb-0">Cambia los filtros para ver otros pedidos.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = orders.map((order) => {
            const total = Number(order.total_amount || order.total || 0);
            const expiresAt = order.expires_at
                ? new Date(order.expires_at).toLocaleString('es-UY')
                : 'Sin vencimiento';
            const canConfirm = order.status === 'pending_contact' && order.payment_status !== 'expired';
            const canDeliver = order.status === 'confirmed';
            const canCancel = !['cancelled', 'delivered'].includes(order.status);

            return `
                <article class="card border-0 shadow-sm mb-4 admin-order-card">
                    <div class="card-header card-header-soft d-flex justify-content-between align-items-start flex-wrap gap-3">
                        <div>
                            <div class="small text-ui-muted">Pedido #${order.id}</div>
                            <div class="fw-bold">${order.customer_name || order.first_name || 'Cliente sin nombre'}</div>
                            <div class="small text-ui-muted">${order.email || 'Sin email'} · ${order.customer_phone || 'Sin teléfono'}</div>
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                            <span class="badge ${getOrderStatusBadge(order.status, order.payment_status)}">${formatOrderStatus(order.status)}</span>
                            <span class="badge ${order.payment_status === 'expired' ? 'badge-soft-danger' : 'badge-soft-neutral'}">${formatPaymentStatus(order.payment_status)}</span>
                            <span class="badge badge-soft-neutral">${GolazoStore.formatPaymentMethod(order.payment_method)}</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-4 mb-4">
                            <div class="col-lg-8">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="small text-ui-muted">Creado</div>
                                        <div class="fw-semibold">${new Date(order.created_at).toLocaleString('es-UY')}</div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="small text-ui-muted">Vence</div>
                                        <div class="fw-semibold">${expiresAt}</div>
                                    </div>
                                    <div class="col-12">
                                        <div class="small text-ui-muted">Entrega</div>
                                        <div class="fw-semibold">${order.shipping_address || 'Sin dirección'}</div>
                                    </div>
                                    <div class="col-12">
                                        <div class="small text-ui-muted">Notas</div>
                                        <div>${order.notes || '<span class="text-ui-muted">Sin observaciones</span>'}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4">
                                <div class="surface-note p-3 h-100">
                                    <div class="small text-ui-muted mb-1">Total</div>
                                    <div class="fs-4 fw-bold text-price-accent mb-3">${GolazoStore.formatPrice(total)}</div>
                                    <div class="d-grid gap-2">
                                        ${canConfirm ? `<button type="button" class="btn btn-dark btn-sm" data-order-id="${order.id}" data-next-status="confirmed">Confirmar pedido</button>` : ''}
                                        ${canDeliver ? `<button type="button" class="btn btn-outline-brand btn-sm" data-order-id="${order.id}" data-next-status="delivered">Marcar entregado</button>` : ''}
                                        ${canCancel ? `<button type="button" class="btn btn-outline-danger btn-sm" data-order-id="${order.id}" data-next-status="cancelled">Cancelar</button>` : ''}
                                        ${order.payment_method === 'instagram' ? `<button type="button" class="btn btn-outline-brand btn-sm" data-instagram-order="${order.id}"><i class="fab fa-instagram me-2"></i>Abrir Instagram</button>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="admin-order-items">
                            ${(order.items || []).map((item) => `
                                <div class="d-flex align-items-center gap-3 py-2 border-top">
                                    <img src="${item.image_url || item.image || 'https://placehold.co/72x72'}" alt="${item.name}" width="56" height="56" class="rounded" style="object-fit: cover;">
                                    <div class="flex-grow-1">
                                        <div class="fw-semibold">${item.name}</div>
                                        <div class="small text-ui-muted">Talle ${item.size || 'M'} · Cantidad ${item.quantity}</div>
                                    </div>
                                    <div class="fw-semibold text-price-accent">${GolazoStore.formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    async function loadOrders() {
        showNotice('');
        try {
            const response = await fetch(API_URL, {
                headers: {
                    Authorization: `Bearer ${getAdminToken()}`
                }
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudieron cargar pedidos');
            }
            ordersCache = data.orders || [];
            renderOrders();
        } catch (error) {
            list.innerHTML = '<div class="alert alert-danger">No se pudieron cargar pedidos.</div>';
            showNotice(error.message || 'No se pudieron cargar pedidos.');
        }
    }

    const user = await GolazoAuth.syncSession();
    if (!user) {
        GolazoStore.ui.toast('Inicia sesión para entrar al panel admin.', 'warning');
        setTimeout(() => {
            window.location.href = GolazoStore.paths.login();
        }, 700);
        return;
    }

    if (user.role !== 'admin') {
        showNotice('Tu sesión está activa, pero tu usuario no tiene rol admin.');
        setTimeout(() => {
            window.location.href = GolazoStore.paths.home();
        }, 1200);
        return;
    }

    await loadOrders();

    statusFilter?.addEventListener('change', renderOrders);
    paymentFilter?.addEventListener('change', renderOrders);

    list?.addEventListener('click', async function (event) {
        const statusButton = event.target.closest('[data-next-status]');
        if (statusButton) {
            const orderId = Number(statusButton.dataset.orderId);
            const nextStatus = statusButton.dataset.nextStatus;

            try {
                const response = await fetch(`${API_URL}/${orderId}/status`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${getAdminToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: nextStatus })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo actualizar el pedido');
                }
                showToast(`Pedido #${orderId} actualizado.`);
                await loadOrders();
            } catch (error) {
                showNotice(error.message || 'No se pudo actualizar el pedido.');
            }
            return;
        }

        const instagramButton = event.target.closest('[data-instagram-order]');
        if (!instagramButton) return;

        const orderId = Number(instagramButton.dataset.instagramOrder);
        const order = ordersCache.find((item) => Number(item.id) === orderId);
        if (!order) {
            showNotice('No se encontró el pedido para abrir Instagram.');
            return;
        }

        try {
            await navigator.clipboard.writeText(buildInstagramMessage(order));
            GolazoStore.ui.toast('Mensaje de seguimiento copiado.', 'success');
        } catch (error) {
            GolazoStore.ui.toast('No se pudo copiar el mensaje automáticamente.', 'warning');
        }

        window.open(GolazoStore.getInstagramChatUrl(), '_blank', 'noopener');
    });
});
