document.addEventListener('DOMContentLoaded', function () {
    if (!GolazoAuth.requireAuth()) return;

    const user = GolazoAuth.getCurrentUser();
    loadProfile(user);
    toggleAdminPanelLink(user);
    loadOrderCount();

    document.getElementById('profileForm')?.addEventListener('submit', async function (event) {
        event.preventDefault();
        await saveProfile();
    });
});

function loadProfile(user) {
    if (!user) return;
    document.getElementById('profileName').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    document.getElementById('profileEmail').textContent = user.email || '';
    document.getElementById('firstName').value = user.first_name || '';
    document.getElementById('lastName').value = user.last_name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('newsletter').checked = Boolean(user.newsletter);
    document.getElementById('memberSince').textContent = user.created_at
        ? new Date(user.created_at).toLocaleDateString('es-UY')
        : 'Cuenta activa';
}

function toggleAdminPanelLink(user) {
    const adminPanelLink = document.getElementById('adminPanelLink');
    if (!adminPanelLink) return;

    if (user && user.role === 'admin') {
        adminPanelLink.classList.remove('d-none');
    } else {
        adminPanelLink.classList.add('d-none');
    }
}

async function loadOrderCount() {
    const totalOrders = document.getElementById('totalOrders');
    if (!totalOrders) return;
    try {
        const orders = await GolazoStore.orders.all();
        totalOrders.textContent = orders.length;
    } catch (error) {
        totalOrders.textContent = '0';
    }
}

async function saveProfile() {
    const saveBtn = document.getElementById('saveBtn');
    const alert = document.getElementById('profileAlert');
    const original = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando';

    const payload = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        newsletter: document.getElementById('newsletter').checked
    };

    try {
        const response = await GolazoAuth.authFetch('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'No se pudo guardar el perfil');
        }

        const user = { ...GolazoAuth.getCurrentUser(), ...payload };
        localStorage.setItem('user', JSON.stringify(user));
        alert.className = 'alert alert-success';
        alert.textContent = 'Perfil actualizado correctamente.';
        alert.classList.remove('d-none');
        GolazoAuth.updateNavbar();
        loadProfile(user);
        toggleAdminPanelLink(user);
    } catch (error) {
        alert.className = 'alert alert-danger';
        alert.textContent = error.message;
        alert.classList.remove('d-none');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = original;
    }
}
