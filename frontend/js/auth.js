const API_URL = `${GolazoStore.config.apiBase}`;

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
        return null;
    }
}

function getToken() {
    return localStorage.getItem('token');
}

function isLoggedIn() {
    return Boolean(getToken() && getCurrentUser());
}

function updateNavbar() {
    if (window.GolazoShell) {
        window.GolazoShell.init();
    }
}

function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    GolazoStore.cart.saveCache([]);
}

function logout(options = {}) {
    const shouldRedirect = options.redirect !== false;
    clearSession();
    GolazoStore.ui.toast('Sesion cerrada.', 'info');

    if (shouldRedirect) {
        setTimeout(() => {
            window.location.href = GolazoStore.paths.home();
        }, 700);
    } else {
        updateNavbar();
    }
}

async function authFetch(endpoint, options = {}) {
    const token = getToken();
    const hasJsonBody = !(options.body instanceof FormData);
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
        }
    });

    if (response.status === 401) {
        logout();
        throw new Error('Sesion expirada');
    }

    return response;
}

function requireAuth() {
    if (!isLoggedIn()) {
        GolazoStore.ui.toast('Debes iniciar sesion para continuar.', 'warning');
        setTimeout(() => {
            window.location.href = GolazoStore.paths.login();
        }, 900);
        return false;
    }
    return true;
}

async function syncSession() {
    if (!getToken()) {
        updateNavbar();
        return null;
    }

    try {
        const response = await authFetch('/auth/profile', { method: 'GET' });
        const data = await response.json();

        if (!response.ok || !data.success || !data.user) {
            throw new Error('Sesion invalida');
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        updateNavbar();
        return data.user;
    } catch (error) {
        clearSession();
        updateNavbar();
        return null;
    }
}

document.addEventListener('click', function (event) {
    const logoutTrigger = event.target.closest('[data-auth-logout]');
    if (!logoutTrigger) return;
    event.preventDefault();
    logout();
});

document.addEventListener('DOMContentLoaded', function () {
    syncSession();
});

window.addEventListener('storage', function () {
    syncSession();
});

window.addEventListener('cart:updated', () => GolazoStore.ui.updateCartBadges());

window.GolazoAuth = {
    getCurrentUser,
    getToken,
    isLoggedIn,
    updateNavbar,
    clearSession,
    logout,
    syncSession,
    authFetch,
    requireAuth,
    showToast: GolazoStore.ui.toast
};
