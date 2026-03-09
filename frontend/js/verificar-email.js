document.addEventListener('DOMContentLoaded', async function () {
    const loadingState = document.getElementById('loadingState');
    const successState = document.getElementById('successState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showError('No se encontró el token de verificación.');
        return;
    }

    try {
        const API_URL = window.GolazoStore?.config?.apiBase || 'http://localhost:3000/api';
        const response = await fetch(`${API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showSuccess();
        } else {
            showError(data.message || 'El enlace ha expirado o es inválido.');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Hubo un error de conexión al servidor.');
    }

    function showSuccess() {
        loadingState.style.display = 'none';
        errorState.style.display = 'none';
        successState.style.display = 'block';
    }

    function showError(msg) {
        loadingState.style.display = 'none';
        successState.style.display = 'none';
        errorState.style.display = 'block';
        if (msg) errorMessage.textContent = msg;
    }
});
