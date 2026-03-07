const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function () {
    const recoveryForm = document.getElementById('recoveryForm');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.getElementById('submitBtn');
    const formAlert = document.getElementById('formAlert');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const sentToEmail = document.getElementById('sentToEmail');

    recoveryForm?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = document.getElementById('recoveryEmail').value.trim();
        if (!email) {
            showFormAlert('Ingresa tu email.', 'warning');
            return;
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando';
        hideFormAlert();

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (!response.ok && data.message) {
                throw new Error(data.message);
            }
            recoveryForm.style.display = 'none';
            successMessage.style.display = 'block';
            sentToEmail.textContent = email;
        } catch (error) {
            showFormAlert(error.message || 'No pudimos enviar el email.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    tryAgainBtn?.addEventListener('click', function () {
        successMessage.style.display = 'none';
        recoveryForm.style.display = 'block';
        recoveryForm.reset();
        hideFormAlert();
    });

    function showFormAlert(message, type) {
        formAlert.className = `alert alert-${type}`;
        formAlert.textContent = message;
        formAlert.classList.remove('d-none');
    }

    function hideFormAlert() {
        formAlert.classList.add('d-none');
    }
});
