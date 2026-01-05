// ========================================
// GolazoStore - Autenticación Frontend
// ========================================

const API_URL = 'http://localhost:3000/api';

// Detectar si estamos en la raíz o en /frontend/
function getBasePath() {
    const path = window.location.pathname;
    // Si estamos en la raíz (index.html o /)
    if (path === '/' || path.endsWith('/index.html') && !path.includes('/frontend/')) {
        return 'frontend/';
    }
    // Si estamos dentro de /frontend/
    return '';
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    initAuth();
});

// Inicializar autenticación
function initAuth() {
    updateNavbar();
}

// Obtener usuario actual del localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Obtener token
function getToken() {
    return localStorage.getItem('token');
}

// Verificar si está logueado
function isLoggedIn() {
    return !!getToken() && !!getCurrentUser();
}

// Actualizar navbar según estado de login
function updateNavbar() {
    const user = getCurrentUser();
    const navbarNav = document.querySelector('.navbar-nav.ms-auto');
    const basePath = getBasePath();

    if (!navbarNav) return;

    if (isLoggedIn() && user) {
        // Usuario logueado - mostrar menú de usuario
        navbarNav.innerHTML = `
            <div class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user-circle fa-lg me-2"></i>
                    <span class="d-none d-md-inline">${user.first_name}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown" style="background-color: #2d1810; border: 1px solid #5c3a2e;">
                    <li>
                        <span class="dropdown-item-text" style="color: #ffc107;">
                            <i class="fas fa-envelope me-2"></i>${user.email}
                        </span>
                    </li>
                    <li><hr class="dropdown-divider" style="border-color: #5c3a2e;"></li>
                    ${user.role === 'admin' ? `
                    <li>
                        <a class="dropdown-item text-white" href="${basePath}admin-products.html" style="background-color: transparent;">
                            <i class="fas fa-cogs me-2 text-warning"></i>Panel Admin
                        </a>
                    </li>
                    ` : ''}
                    <li>
                        <a class="dropdown-item text-white" href="${basePath}perfil.html" style="background-color: transparent;">
                            <i class="fas fa-user me-2 text-danger"></i>Mi Perfil
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item text-white" href="${basePath}mis-pedidos.html" style="background-color: transparent;">
                            <i class="fas fa-box me-2 text-danger"></i>Mis Pedidos
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item text-white" href="${basePath}carrito.html" style="background-color: transparent;">
                            <i class="fas fa-shopping-cart me-2 text-danger"></i>Mi Carrito
                        </a>
                    </li>
                    <li><hr class="dropdown-divider" style="border-color: #5c3a2e;"></li>
                    <li>
                        <a class="dropdown-item text-danger" href="#" onclick="logout(); return false;" style="background-color: transparent;">
                            <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                        </a>
                    </li>
                </ul>
            </div>
            <a class="nav-link position-relative" href="${basePath}carrito.html">
                <i class="fas fa-shopping-cart"></i>
                <span class="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill" id="cart-count">0</span>
            </a>
        `;
    } else {
        // Usuario no logueado - mostrar links de login/registro
        navbarNav.innerHTML = `
            <a class="nav-link" href="${basePath}login.html">
                <i class="fas fa-user"></i> Iniciar Sesión
            </a>
            <a class="nav-link" href="${basePath}registro.html">
                <i class="fas fa-user-plus"></i> Registrarse
            </a>
            <a class="nav-link position-relative" href="${basePath}carrito.html">
                <i class="fas fa-shopping-cart"></i>
                <span class="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill" id="cart-count">0</span>
            </a>
        `;
    }

    // Actualizar contador del carrito
    updateCartCount();
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');

    // Mostrar mensaje
    showToast('¡Hasta pronto! Has cerrado sesión.', 'info');

    // Redirigir al index principal después de un momento
    const basePath = getBasePath();
    const redirectUrl = basePath ? 'index.html' : '../index.html';
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 1000);
}

// Actualizar contador del carrito
function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCountEl.textContent = totalItems;

        // Ocultar si está vacío
        if (totalItems === 0) {
            cartCountEl.style.display = 'none';
        } else {
            cartCountEl.style.display = 'inline-block';
        }
    }
}

// Mostrar toast/notificación
function showToast(message, type = 'info') {
    // Remover toasts anteriores
    const existingToasts = document.querySelectorAll('.auth-toast');
    existingToasts.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `auth-toast alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    toast.style.cssText = 'top: 80px; right: 20px; z-index: 9999; max-width: 350px; animation: slideIn 0.3s ease;';

    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(toast);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// Hacer peticiones autenticadas al API
async function authFetch(endpoint, options = {}) {
    const token = getToken();

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    // Si el token expiró, cerrar sesión
    if (response.status === 401) {
        logout();
        throw new Error('Sesión expirada');
    }

    return response;
}

// Verificar si el usuario está en una página protegida
function requireAuth() {
    if (!isLoggedIn()) {
        showToast('Debés iniciar sesión para acceder', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }
    return true;
}

// Exportar funciones para uso global
window.GolazoAuth = {
    getCurrentUser,
    getToken,
    isLoggedIn,
    logout,
    updateNavbar,
    updateCartCount,
    showToast,
    authFetch,
    requireAuth
};
