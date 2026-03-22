document.addEventListener('DOMContentLoaded', async function () {
    const notice = document.getElementById('adminOrdersNotice');
    const stageStatus = document.getElementById('adminOrdersStageStatus');
    const listStatus = document.getElementById('adminOrdersListStatus');
    const list = document.getElementById('adminOrdersList');
    const statusFilter = document.getElementById('orderStatusFilter');
    const paymentFilter = document.getElementById('orderPaymentFilter');
    const orderSort = document.getElementById('orderSort');
    const summary = document.getElementById('adminOrdersSummary');
    const countPending = document.getElementById('countPending');
    const countConfirmed = document.getElementById('countConfirmed');
    const countExpired = document.getElementById('countExpired');
    const esc = GolazoStore.escapeHtml;
    const attr = GolazoStore.escapeAttr;

    let ordersCache = [];
    let loadingOrders = false;

    if (!GolazoStore.config.apiBase) {
        GolazoAdmin.setNotice(notice, 'Falta configurar la API del frontend.');
        return;
    }

    const user = await GolazoAdmin.requireAdmin({ noticeNode: notice });
    if (!user) return;

    const ordersPath = '/admin/orders';

    function setListStatus(message, tone = 'muted') {
        GolazoAdmin.setStatus(listStatus, message, tone);
    }

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

        return map[status] || 'Sin estado';
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
                expired: 'Expirado',
                pending_payment: 'Pendiente de pago',
                pending: 'Pendiente de pago',
                in_process: 'En revision',
                approved: 'Aprobado',
                rejected: 'Rechazado',
                cancelled: 'Cancelado',
                refunded: 'Reembolsado',
                charged_back: 'Contracargo'
            };

            return map[paymentStatus] || 'Pendiente de pago';
        }

        const map = {
            pending_contact: 'Coordinacion pendiente',
            expired: 'Expirado',
            confirmed: 'Confirmado',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
        };

        return map[paymentStatus] || 'Sin estado';
    }

    function getFilteredOrders() {
        const selectedStatus = statusFilter?.value || 'all';
        const selectedPayment = paymentFilter?.value || 'all';
        const selectedSort = orderSort?.value || 'recent';

        const filtered = ordersCache.filter((order) => {
            const matchesPayment = selectedPayment === 'all' || order.payment_method === selectedPayment;
            if (!matchesPayment) return false;
            if (selectedStatus === 'all') return true;
            if (selectedStatus === 'expired') return order.payment_status === 'expired';
            return order.status === selectedStatus;
        });

        return filtered.sort((a, b) => {
            if (selectedSort === 'total-desc') {
                return Number(b.total_amount || b.total || 0) - Number(a.total_amount || a.total || 0);
            }

            if (selectedSort === 'pending-first') {
                const score = (order) => {
                    if (order.payment_status === 'expired') return 3;
                    if (order.status === 'pending_contact') return 0;
                    if (order.status === 'confirmed') return 1;
                    return 2;
                };
                return score(a) - score(b) || new Date(b.created_at) - new Date(a.created_at);
            }

            if (selectedSort === 'expiring') {
                const expiresA = a.expires_at ? new Date(a.expires_at).getTime() : Number.MAX_SAFE_INTEGER;
                const expiresB = b.expires_at ? new Date(b.expires_at).getTime() : Number.MAX_SAFE_INTEGER;
                return expiresA - expiresB;
            }

            return new Date(b.created_at) - new Date(a.created_at);
        });
    }

    function updateCounters() {
        const counts = ordersCache.reduce((acc, order) => {
            acc.total += 1;
            if (order.payment_status === 'expired') acc.expired += 1;
            else if (order.status === 'confirmed') acc.confirmed += 1;
            else if (order.status === 'pending_contact') acc.pending += 1;
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
        return [
            `Hola, seguimos con el pedido #${order.id}.`,
            `Cliente: ${order.customer_name || order.email || '-'}`,
            `Total: ${GolazoStore.formatPrice(order.total_amount || order.total || 0)}`
        ].join('\n');
    }

    function renderOrderOperationalNote(order) {
        if (order.payment_status === 'expired') {
            return '<div class="small text-ui-muted admin-order-note">La ventana de pago online vencio y el stock ya fue liberado.</div>';
        }

        if (order.payment_method === 'mercado_pago') {
            if (order.payment_status === 'approved') {
                return '<div class="small text-ui-muted admin-order-note">Mercado Pago aprobo el pago. El pedido ya puede seguir su circuito normal de entrega.</div>';
            }
            if (['rejected', 'cancelled', 'charged_back'].includes(order.payment_status)) {
                return '<div class="small text-ui-muted admin-order-note">El pago online no se completo. Revisa con el cliente si corresponde reintentar o cerrar la orden.</div>';
            }
            if (order.payment_status === 'in_process') {
                return '<div class="small text-ui-muted admin-order-note">Mercado Pago marco el pago en revision. Conviene esperar el webhook final antes de actuar.</div>';
            }
            return '<div class="small text-ui-muted admin-order-note">Pedido con pago online pendiente. El webhook de Mercado Pago actualizara el estado automaticamente.</div>';
        }
        if (order.status === 'pending_contact') {
            return '<div class="small text-ui-muted admin-order-note">Sigue pendiente de contacto. Si ya hablaste con el cliente, puedes confirmarlo o cancelarlo desde aqui.</div>';
        }
        if (order.status === 'confirmed') {
            return '<div class="small text-ui-muted admin-order-note">Pedido confirmado. El siguiente paso es coordinar la entrega y marcarlo como entregado cuando corresponda.</div>';
        }
        if (order.status === 'delivered') {
            return '<div class="small text-ui-muted admin-order-note">Pedido cerrado como entregado. Queda disponible para referencia operativa.</div>';
        }
        return '<div class="small text-ui-muted admin-order-note">Pedido guardado en historial para referencia operativa.</div>';
    }

    function renderOrders() {
        const orders = getFilteredOrders();
        updateCounters();

        if (!orders.length) {
            list.innerHTML = `
                <div class="empty-state text-center py-5">
                    <i class="fas fa-receipt icon-accent fs-1 mb-3"></i>
                    <h2 class="h5 mb-2">No hay pedidos en esta vista</h2>
                    <p class="text-ui-muted mb-0">Cambia filtros para revisar todo el historial o vuelve a la vista completa.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = orders.map((order) => {
            const total = Number(order.total_amount || order.total || 0);
            const expiresAt = order.expires_at ? new Date(order.expires_at).toLocaleString('es-UY') : 'Sin vencimiento';
            const canConfirm = order.payment_method === 'instagram'
                && order.status === 'pending_contact'
                && order.payment_status !== 'expired';
            const canDeliver = order.status === 'confirmed';
            const canCancel = !['cancelled', 'delivered'].includes(order.status);

            return `
                <article class="card border-0 shadow-sm mb-4 admin-order-card">
                    <div class="card-header card-header-soft">
                        <div class="admin-order-card__header">
                            <div>
                                <div class="small text-ui-muted">Pedido #${order.id}</div>
                                <div class="fw-bold">${esc(order.customer_name || order.first_name || 'Cliente sin nombre')}</div>
                                <div class="small text-ui-muted">${esc(order.email || 'Sin email')} | ${esc(order.customer_phone || 'Sin telefono')}</div>
                            </div>
                            <div class="d-flex flex-wrap gap-2">
                                <span class="badge ${getOrderStatusBadge(order.status, order.payment_status)}">${formatOrderStatus(order.status, order.payment_status)}</span>
                                <span class="badge ${order.payment_status === 'expired' ? 'badge-soft-danger' : 'badge-soft-neutral'}">${formatPaymentStatus(order.payment_status, order.payment_method)}</span>
                                <span class="badge badge-soft-neutral">${GolazoStore.formatPaymentMethod(order.payment_method)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-4 mb-4">
                            <div class="col-lg-8">
                                <div class="admin-order-grid">
                                    <div class="admin-order-grid__item">
                                        <div class="small text-ui-muted">Creado</div>
                                        <div class="fw-semibold">${new Date(order.created_at).toLocaleString('es-UY')}</div>
                                    </div>
                                    <div class="admin-order-grid__item">
                                        <div class="small text-ui-muted">Vence</div>
                                        <div class="fw-semibold">${expiresAt}</div>
                                    </div>
                                    <div class="admin-order-grid__item admin-order-grid__item--wide">
                                        <div class="small text-ui-muted">Entrega</div>
                                        <div class="fw-semibold">${esc(order.shipping_address || 'A coordinar')}</div>
                                    </div>
                                    <div class="admin-order-grid__item admin-order-grid__item--wide">
                                        <div class="small text-ui-muted">Notas</div>
                                        <div>${order.notes ? esc(order.notes) : '<span class="text-ui-muted">Sin observaciones</span>'}</div>
                                    </div>
                                    <div class="admin-order-grid__item admin-order-grid__item--wide">
                                        ${renderOrderOperationalNote(order)}
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4">
                                <div class="surface-note admin-order-summary p-3 h-100">
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
                                <div class="admin-order-item-row d-flex align-items-center gap-3 py-3 border-top">
                                    <img src="${attr(item.image_url || item.image || 'https://placehold.co/72x72')}" alt="${esc(item.name)}" width="56" height="56" class="rounded" style="object-fit: cover;">
                                    <div class="flex-grow-1">
                                        <div class="fw-semibold">${esc(item.name)}</div>
                                        <div class="small text-ui-muted">Talle ${esc(item.size || 'M')} | Cantidad ${item.quantity}</div>
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

    async function loadOrders(reason) {
        if (loadingOrders) return;
        loadingOrders = true;
        GolazoAdmin.setNotice(notice, '');
        if (reason) {
            GolazoAdmin.setStatus(stageStatus, reason, 'info');
            setListStatus(reason, 'info');
        }

        try {
            const { response, data } = await GolazoAdmin.authRequest(ordersPath, { method: 'GET' });
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudieron cargar pedidos');
            }
            ordersCache = data.orders || [];
            renderOrders();
            GolazoAdmin.setStatus(stageStatus, '');
            setListStatus(`Vista actualizada. ${ordersCache.length === 1 ? 'Hay 1 pedido en base.' : `Hay ${ordersCache.length} pedidos en base.`}`);
        } catch (error) {
            list.innerHTML = '<div class="alert alert-danger mb-0">No se pudieron cargar pedidos.</div>';
            GolazoAdmin.setNotice(notice, error.message || 'No se pudieron cargar pedidos.');
            setListStatus('No se pudo refrescar el listado.', 'danger');
        } finally {
            loadingOrders = false;
        }
    }

    function getStatusActionText(nextStatus, orderId) {
        if (nextStatus === 'confirmed') return `Confirmando pedido #${orderId}...`;
        if (nextStatus === 'delivered') return `Marcando pedido #${orderId} como entregado...`;
        return `Cancelando pedido #${orderId}...`;
    }

    function getStatusConfirmationText(nextStatus, orderId) {
        if (nextStatus === 'confirmed') return `Vas a confirmar el pedido #${orderId}.`;
        if (nextStatus === 'delivered') return `Vas a marcar el pedido #${orderId} como entregado.`;
        return `Vas a cancelar el pedido #${orderId}. Esta accion puede reponer stock si corresponde.`;
    }

    await loadOrders('Cargando pedidos del panel admin...');

    statusFilter?.addEventListener('change', function () {
        renderOrders();
        setListStatus(`Filtro de estado activo: ${statusFilter.options[statusFilter.selectedIndex].text}.`);
    });

    paymentFilter?.addEventListener('change', function () {
        renderOrders();
        setListStatus(`Filtro de pago activo: ${paymentFilter.options[paymentFilter.selectedIndex].text}.`);
    });

    orderSort?.addEventListener('change', function () {
        renderOrders();
        setListStatus(`Orden activo: ${orderSort.options[orderSort.selectedIndex].text}.`);
    });

    document.addEventListener('click', function (event) {
        const quickFilterButton = event.target.closest('[data-quick-order-filter]');
        if (!quickFilterButton) return;
        const value = quickFilterButton.dataset.quickOrderFilter || 'all';
        if (statusFilter) {
            statusFilter.value = value;
        }
        renderOrders();
        setListStatus(`Atajo aplicado: ${quickFilterButton.textContent.trim()}.`);
    });

    list?.addEventListener('click', async function (event) {
        const statusButton = event.target.closest('[data-next-status]');
        if (statusButton) {
            if (statusButton.dataset.busy === 'true') return;

            const orderId = Number(statusButton.dataset.orderId);
            const nextStatus = statusButton.dataset.nextStatus;
            if (!window.confirm(getStatusConfirmationText(nextStatus, orderId))) return;

            GolazoAdmin.setButtonBusy(statusButton, true, nextStatus === 'cancelled' ? 'Cancelando...' : 'Actualizando...');
            setListStatus(getStatusActionText(nextStatus, orderId), nextStatus === 'cancelled' ? 'warning' : 'info');

            try {
                const { response, data } = await GolazoAdmin.authRequest(`${ordersPath}/${orderId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: nextStatus })
                });

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo actualizar el pedido');
                }

                GolazoAdmin.showToast('adminOrdersToast', `Pedido #${orderId} actualizado.`);
                await loadOrders('Refrescando pedidos despues de la actualizacion...');
            } catch (error) {
                GolazoAdmin.setNotice(notice, error.message || 'No se pudo actualizar el pedido.');
                setListStatus('La actualizacion no pudo completarse.', 'danger');
            } finally {
                GolazoAdmin.setButtonBusy(statusButton, false);
            }
            return;
        }

        const instagramButton = event.target.closest('[data-instagram-order]');
        if (!instagramButton) return;
        if (instagramButton.dataset.busy === 'true') return;

        const orderId = Number(instagramButton.dataset.instagramOrder);
        const order = ordersCache.find((item) => Number(item.id) === orderId);
        if (!order) {
            GolazoAdmin.setNotice(notice, 'No se encontro el pedido para abrir Instagram.');
            return;
        }

        GolazoAdmin.setButtonBusy(instagramButton, true, 'Preparando...');
        setListStatus(`Preparando seguimiento de Instagram para el pedido #${orderId}...`, 'info');

        try {
            await navigator.clipboard.writeText(buildInstagramMessage(order));
            GolazoStore.ui.toast('Mensaje de seguimiento copiado.', 'success');
        } catch (error) {
            GolazoStore.ui.toast('No se pudo copiar el mensaje automaticamente.', 'warning');
        } finally {
            GolazoAdmin.setButtonBusy(instagramButton, false);
        }

        window.open(GolazoStore.getInstagramChatUrl(), '_blank', 'noopener');
        setListStatus(`Seguimiento abierto para el pedido #${orderId}.`);
    });
});
