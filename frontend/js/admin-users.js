document.addEventListener('DOMContentLoaded', async function () {
    const notice = document.getElementById('adminUsersNotice');
    const stageStatus = document.getElementById('adminUsersStageStatus');
    const listStatus = document.getElementById('adminUsersListStatus');
    const list = document.getElementById('adminUsersList');
    const searchInput = document.getElementById('adminUserSearch');
    const roleFilter = document.getElementById('adminUserRoleFilter');
    const verificationFilter = document.getElementById('adminUserVerificationFilter');
    const summary = document.getElementById('adminUsersSummary');
    const countAll = document.getElementById('countUsersAll');
    const countVerified = document.getElementById('countUsersVerified');
    const countUnverified = document.getElementById('countUsersUnverified');
    const countAdmins = document.getElementById('countUsersAdmins');

    let usersCache = [];

    const adminUser = await GolazoAdmin.requireAdmin({
        noticeNode: notice,
        loginMessage: 'Inicia sesion para entrar al panel de usuarios.'
    });

    if (!adminUser) return;

    const esc = GolazoStore.escapeHtml;

    function formatDate(value) {
        if (!value) return 'Sin fecha';
        const parsed = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(parsed.getTime())) return 'Sin fecha';
        return new Intl.DateTimeFormat('es-UY', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(parsed);
    }

    function getFilteredUsers() {
        const search = String(searchInput?.value || '').trim().toLowerCase();
        const role = roleFilter?.value || 'all';
        const verification = verificationFilter?.value || 'all';

        return usersCache.filter((user) => {
            const haystack = [
                user.first_name,
                user.last_name,
                user.email,
                user.phone
            ].join(' ').toLowerCase();

            const matchesSearch = !search || haystack.includes(search);
            const matchesRole = role === 'all' || String(user.role || 'user') === role;

            let matchesVerification = true;
            if (verification === 'verified') matchesVerification = user.is_verified === true;
            if (verification === 'unverified') matchesVerification = user.is_verified !== true;
            if (verification === 'with-orders') matchesVerification = Number(user.orders_count || 0) > 0;
            if (verification === 'without-orders') matchesVerification = Number(user.orders_count || 0) === 0;

            return matchesSearch && matchesRole && matchesVerification;
        });
    }

    function updateSummary(users) {
        const totals = usersCache.reduce((acc, user) => {
            acc.all += 1;
            if (user.is_verified) acc.verified += 1;
            else acc.unverified += 1;
            if (String(user.role || 'user') === 'admin') acc.admins += 1;
            return acc;
        }, {
            all: 0,
            verified: 0,
            unverified: 0,
            admins: 0
        });

        if (summary) {
            summary.textContent = users.length === 1 ? '1 usuario en vista' : `${users.length} usuarios en vista`;
        }
        if (countAll) countAll.textContent = `${totals.all} total`;
        if (countVerified) countVerified.textContent = `${totals.verified} verificados`;
        if (countUnverified) countUnverified.textContent = `${totals.unverified} sin verificar`;
        if (countAdmins) countAdmins.textContent = `${totals.admins} admins`;
    }

    function renderUsers() {
        const users = getFilteredUsers();
        updateSummary(users);

        if (!users.length) {
            list.innerHTML = `
                <div class="card border-0 shadow-sm admin-panel-card">
                    <div class="card-body p-4 text-center">
                        <i class="fas fa-users-slash fa-2x icon-accent mb-3"></i>
                        <h3 class="h5 mb-2">No hay usuarios en esta vista</h3>
                        <p class="text-ui-muted mb-0">Prueba otro filtro o limpia la busqueda para volver a ver la base completa.</p>
                    </div>
                </div>
            `;
            GolazoAdmin.setStatus(listStatus, 'No hay usuarios que coincidan con esta combinacion de filtros.', 'warning');
            return;
        }

        GolazoAdmin.setStatus(
            listStatus,
            users.length === 1 ? 'Hay 1 usuario visible en esta vista.' : `Hay ${users.length} usuarios visibles en esta vista.`,
            'muted'
        );

        list.innerHTML = `
            <div class="row g-3">
                ${users.map((user) => {
                    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario sin nombre';
                    const isAdminRole = String(user.role || 'user') === 'admin';
                    return `
                        <div class="col-xl-6">
                            <article class="admin-user-card">
                                <div class="admin-user-card__top">
                                    <div class="admin-user-card__identity">
                                        <div class="admin-user-card__avatar">
                                            ${GolazoStore.renderAvatarMarkup(user, {
                                                className: 'admin-user-avatar',
                                                size: 64,
                                                alt: `Avatar de ${fullName}`
                                            })}
                                        </div>
                                        <div class="min-w-0">
                                            <h3 class="admin-user-card__title">${esc(fullName)}</h3>
                                            <p class="admin-user-card__email mb-2">${esc(user.email || 'Sin email')}</p>
                                            <div class="d-flex flex-wrap gap-2">
                                                <span class="badge ${isAdminRole ? 'badge-soft-brand' : 'badge-soft-neutral'}">${isAdminRole ? 'Admin' : 'Usuario'}</span>
                                                <span class="badge ${user.is_verified ? 'badge-soft-success' : 'badge-soft-danger'}">${user.is_verified ? 'Verificado' : 'Sin verificar'}</span>
                                                <span class="badge badge-soft-neutral">${Number(user.orders_count || 0)} pedido(s)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="admin-user-grid mt-3">
                                    <div class="admin-user-grid__item">
                                        <span class="small text-ui-muted d-block mb-1">Telefono</span>
                                        <strong>${esc(user.phone || 'No cargado')}</strong>
                                    </div>
                                    <div class="admin-user-grid__item">
                                        <span class="small text-ui-muted d-block mb-1">Alta</span>
                                        <strong>${esc(formatDate(user.created_at))}</strong>
                                    </div>
                                    <div class="admin-user-grid__item">
                                        <span class="small text-ui-muted d-block mb-1">Ultimo pedido</span>
                                        <strong>${esc(user.last_order_at ? formatDate(user.last_order_at) : 'Sin pedidos')}</strong>
                                    </div>
                                    <div class="admin-user-grid__item">
                                        <span class="small text-ui-muted d-block mb-1">Newsletter</span>
                                        <strong>${user.newsletter ? 'Suscripto' : 'No suscripto'}</strong>
                                    </div>
                                </div>
                            </article>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    async function loadUsers() {
        GolazoAdmin.setNotice(notice, '');
        GolazoAdmin.setStatus(stageStatus, 'Cargando base de usuarios...', 'info');
        try {
            const { response, data } = await GolazoAdmin.authRequest('/admin/users', { method: 'GET' });
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudieron cargar usuarios');
            }

            usersCache = data.users || [];
            renderUsers();
            GolazoAdmin.setStatus(
                stageStatus,
                usersCache.length === 1 ? 'Base actualizada. Hay 1 usuario registrado.' : `Base actualizada. Hay ${usersCache.length} usuarios registrados.`,
                'muted'
            );
        } catch (error) {
            list.innerHTML = '<div class="alert alert-danger mb-0">No se pudieron cargar usuarios.</div>';
            GolazoAdmin.setNotice(notice, error.message || 'No se pudieron cargar usuarios.');
            GolazoAdmin.setStatus(stageStatus, 'La carga de usuarios fallo. Revisa backend o permisos admin.', 'danger');
        }
    }

    document.querySelectorAll('[data-quick-user-filter]').forEach((button) => {
        button.addEventListener('click', function () {
            const value = this.dataset.quickUserFilter;
            if (value === 'admins') {
                roleFilter.value = 'admin';
                verificationFilter.value = 'all';
            } else {
                verificationFilter.value = value;
                roleFilter.value = 'all';
            }
            renderUsers();
        });
    });

    searchInput?.addEventListener('input', renderUsers);
    roleFilter?.addEventListener('change', renderUsers);
    verificationFilter?.addEventListener('change', renderUsers);

    await loadUsers();
});
