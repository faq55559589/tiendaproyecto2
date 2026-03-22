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

    document.getElementById('avatar')?.addEventListener('change', function () {
        const file = this.files && this.files[0] ? this.files[0] : null;
        if (!file) {
            renderProfileAvatars(GolazoAuth.getCurrentUser());
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        renderProfileAvatars({
            ...GolazoAuth.getCurrentUser(),
            avatar_url: previewUrl
        });
    });
});

function renderProfileAvatars(user) {
    const sidebarWrap = document.getElementById('profileAvatarWrap');
    const previewWrap = document.getElementById('profileAvatarPreview');
    const sidebarMarkup = GolazoStore.renderAvatarMarkup(user, {
        className: 'profile-avatar profile-avatar--sidebar',
        size: 112,
        alt: `Avatar de ${user?.first_name || 'usuario'}`
    });
    const previewMarkup = GolazoStore.renderAvatarMarkup(user, {
        className: 'profile-avatar profile-avatar--preview',
        size: 88,
        alt: `Avatar de ${user?.first_name || 'usuario'}`
    });

    if (sidebarWrap) sidebarWrap.innerHTML = sidebarMarkup;
    if (previewWrap) previewWrap.innerHTML = previewMarkup;
}

function loadProfile(user) {
    if (!user) return;
    document.getElementById('profileName').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    document.getElementById('profileEmail').textContent = user.email || '';
    document.getElementById('firstName').value = user.first_name || '';
    document.getElementById('lastName').value = user.last_name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = GolazoStore.formatUyPhone(user.phone || '');
    document.getElementById('newsletter').checked = Boolean(user.newsletter);
    document.getElementById('memberSince').textContent = user.created_at
        ? new Date(user.created_at).toLocaleDateString('es-UY')
        : 'Cuenta activa';
    renderProfileAvatars(user);
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
    const avatarInput = document.getElementById('avatar');
    const original = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando';

    const formData = new FormData();
    formData.set('first_name', document.getElementById('firstName').value.trim());
    formData.set('last_name', document.getElementById('lastName').value.trim());
    formData.set('phone', GolazoStore.formatUyPhone(document.getElementById('phone').value.trim()));
    formData.set('newsletter', String(document.getElementById('newsletter').checked));
    if (avatarInput?.files && avatarInput.files[0]) {
        formData.set('avatar', avatarInput.files[0]);
    }

    try {
        const response = await GolazoAuth.authFetch('/auth/profile', {
            method: 'PUT',
            body: formData
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'No se pudo guardar el perfil');
        }

        const user = data.user || { ...GolazoAuth.getCurrentUser() };
        localStorage.setItem('user', JSON.stringify(user));
        alert.className = 'alert alert-success';
        alert.textContent = 'Perfil actualizado correctamente. Tu cuenta ya quedo lista con foto y datos de contacto.';
        alert.classList.remove('d-none');
        GolazoAuth.updateNavbar();
        loadProfile(user);
        toggleAdminPanelLink(user);
        if (avatarInput) {
            avatarInput.value = '';
        }
    } catch (error) {
        alert.className = 'alert alert-danger';
        alert.textContent = error.message;
        alert.classList.remove('d-none');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = original;
    }
}
