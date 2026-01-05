// ========================================
// GolazoStore - Perfil de Usuario
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Verificar autenticación
    if (!GolazoAuth.isLoggedIn()) {
        GolazoAuth.showToast('Debés iniciar sesión para ver tu perfil', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const user = GolazoAuth.getCurrentUser();
    loadProfile(user);
    loadOrdersCount();

    // Formulario de perfil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveProfile();
        });
    }
});

// Cargar datos del perfil
function loadProfile(user) {
    if (!user) return;

    // Sidebar
    document.getElementById('profileName').textContent = `${user.first_name} ${user.last_name || ''}`;
    document.getElementById('profileEmail').textContent = user.email;

    // Formulario
    document.getElementById('firstName').value = user.first_name || '';
    document.getElementById('lastName').value = user.last_name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('newsletter').checked = user.newsletter || false;

    // Info de cuenta
    if (user.created_at) {
        const date = new Date(user.created_at);
        document.getElementById('memberSince').textContent = date.toLocaleDateString('es-UY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else {
        document.getElementById('memberSince').textContent = 'Diciembre 2025';
    }
}

// Cargar cantidad de pedidos
function loadOrdersCount() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    document.getElementById('totalOrders').textContent = orders.length;
}

// Guardar cambios del perfil
async function saveProfile() {
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
    saveBtn.disabled = true;

    const profileData = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        newsletter: document.getElementById('newsletter').checked
    };

    try {
        const response = await GolazoAuth.authFetch('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Actualizar datos en localStorage
            const currentUser = GolazoAuth.getCurrentUser();
            const updatedUser = { ...currentUser, ...profileData };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            showProfileAlert('¡Perfil actualizado correctamente!', 'success');
            GolazoAuth.updateNavbar();
            
            // Actualizar sidebar
            document.getElementById('profileName').textContent = `${profileData.first_name} ${profileData.last_name}`;
        } else {
            showProfileAlert(data.message || 'Error al guardar', 'danger');
        }

    } catch (error) {
        console.error('Error:', error);
        showProfileAlert('Error de conexión', 'danger');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

function showProfileAlert(message, type) {
    const alert = document.getElementById('profileAlert');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>${message}`;
    alert.classList.remove('d-none');
    
    setTimeout(() => alert.classList.add('d-none'), 5000);
}
