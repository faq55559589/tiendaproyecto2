document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const phoneInput = document.getElementById('phone');
    const API_URL = window.GolazoStore?.config?.apiBase || 'http://localhost:3000/api';

    if (localStorage.getItem('token') && localStorage.getItem('user')) {
        window.location.href = 'home.html';
        return;
    }

    togglePasswordBtn?.addEventListener('click', function () {
        togglePasswordVisibility(passwordInput, this);
    });
    toggleConfirmPasswordBtn?.addEventListener('click', function () {
        togglePasswordVisibility(confirmPasswordInput, this);
    });

    function togglePasswordVisibility(input, button) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        const icon = button.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }

    phoneInput?.addEventListener('input', function () {
        let value = this.value.replace(/\D/g, '');
        if (value.startsWith('598')) value = value.slice(3);
        if (value.length >= 8) this.value = `+598 ${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 8)}${value.length > 8 ? ' ' + value.slice(8) : ''}`.trim();
        else if (value.length) this.value = `+598 ${value}`;
    });

    registerForm?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const data = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: phoneInput.value.trim(),
            password: passwordInput.value,
            confirmPassword: confirmPasswordInput.value,
            acceptTerms: document.getElementById('acceptTerms').checked,
            newsletter: document.getElementById('newsletter').checked
        };

        if (!data.firstName || !data.lastName || !data.email || !data.password || !data.confirmPassword) {
            GolazoStore.ui.toast('Completa todos los campos obligatorios.', 'warning');
            return;
        }
        if (!data.acceptTerms) {
            GolazoStore.ui.toast('Debes aceptar los terminos para continuar.', 'warning');
            return;
        }
        if (data.password.length < 6 || !/[a-zA-Z]/.test(data.password) || !/\d/.test(data.password)) {
            GolazoStore.ui.toast('La contrasena debe tener 6 caracteres minimo, letras y numeros.', 'warning');
            return;
        }
        if (data.password !== data.confirmPassword) {
            GolazoStore.ui.toast('Las contrasenas no coinciden.', 'warning');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando cuenta';

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    phone: data.phone,
                    newsletter: data.newsletter
                })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'No pudimos crear la cuenta');
            }
            GolazoStore.ui.toast('Registro enviado. Revisa tu email para verificar la cuenta.', 'success');
            registerForm.reset();
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1200);
        } catch (error) {
            GolazoStore.ui.toast(error.message, 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});
