document.addEventListener('DOMContentLoaded', function () {
    const API_BASE = window.GolazoStore?.config?.apiBase || null;
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (localStorage.getItem('token') && localStorage.getItem('user')) {
        window.location.href = 'home.html';
        return;
    }

    if (!API_BASE) {
        GolazoStore.ui.toast('Falta configurar la API del frontend.', 'danger');
        loginForm?.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');
        return;
    }

    togglePasswordBtn?.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    loginForm?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;

        if (!email || !password) {
            GolazoStore.ui.toast('Completa email y contrasena.', 'warning');
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Ingresando';

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No pudimos iniciar sesión');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (rememberMe) localStorage.setItem('rememberMe', 'true');
            GolazoStore.ui.toast(`Bienvenido ${data.user.first_name}.`, 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 700);
        } catch (error) {
            GolazoStore.ui.toast(error.message, 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});
