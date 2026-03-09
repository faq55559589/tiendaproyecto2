const API_URL = window.GolazoStore?.config?.apiBase || 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function () {
    const loadingState = document.getElementById('loadingState');
    const invalidTokenState = document.getElementById('invalidTokenState');
    const resetFormState = document.getElementById('resetFormState');
    const successState = document.getElementById('successState');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const formAlert = document.getElementById('formAlert');
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
        showState('invalid');
        return;
    }

    setTimeout(() => showState('form'), 300);

    toggleNewPassword?.addEventListener('click', function () {
        togglePasswordVisibility(newPasswordInput, this);
    });
    toggleConfirmPassword?.addEventListener('click', function () {
        togglePasswordVisibility(confirmPasswordInput, this);
    });

    function togglePasswordVisibility(input, button) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        const icon = button.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }

    resetPasswordForm?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (newPassword.length < 6) {
            showFormAlert('La contrasena debe tener al menos 6 caracteres.', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            showFormAlert('Las contrasenas no coinciden.', 'warning');
            return;
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Guardando...';
        hideFormAlert();

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                if ((data.message || '').toLowerCase().includes('inv')) {
                    showState('invalid');
                    return;
                }
                throw new Error(data.message || 'No pudimos actualizar la contrasena');
            }
            showState('success');
        } catch (error) {
            showFormAlert(error.message, 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    function showState(state) {
        loadingState.style.display = 'none';
        invalidTokenState.style.display = 'none';
        resetFormState.style.display = 'none';
        successState.style.display = 'none';
        if (state === 'invalid') invalidTokenState.style.display = 'block';
        if (state === 'form') resetFormState.style.display = 'block';
        if (state === 'success') successState.style.display = 'block';
    }

    function showFormAlert(message, type) {
        formAlert.className = `alert alert-${type}`;
        formAlert.textContent = message;
        formAlert.classList.remove('d-none');
    }

    function hideFormAlert() {
        formAlert.classList.add('d-none');
    }
});
