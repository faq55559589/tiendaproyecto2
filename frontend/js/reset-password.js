// ========================================
// GolazoStore - Reset de Contraseña
// ========================================

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    
    // Estados
    const loadingState = document.getElementById('loadingState');
    const invalidTokenState = document.getElementById('invalidTokenState');
    const resetFormState = document.getElementById('resetFormState');
    const successState = document.getElementById('successState');
    
    // Elementos del formulario
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const formAlert = document.getElementById('formAlert');

    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Inicializar
    init();

    async function init() {
        // Si no hay token, mostrar error
        if (!token) {
            showState('invalid');
            return;
        }

        // Por ahora, simplemente mostramos el formulario
        // En un escenario ideal, verificaríamos el token primero
        // Pero como el backend valida al resetear, es suficiente
        setTimeout(() => {
            showState('form');
        }, 500);
    }

    // Mostrar/ocultar contraseña
    if (toggleNewPassword) {
        toggleNewPassword.addEventListener('click', function() {
            togglePasswordVisibility(newPasswordInput, this);
        });
    }

    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            togglePasswordVisibility(confirmPasswordInput, this);
        });
    }

    function togglePasswordVisibility(input, button) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        const icon = button.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }

    // Formulario de reset
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Validaciones
            if (newPassword.length < 6) {
                showFormAlert('La contraseña debe tener al menos 6 caracteres', 'warning');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showFormAlert('Las contraseñas no coinciden', 'warning');
                return;
            }
            
            await resetPassword(newPassword);
        });
    }

    // Enviar reset al backend
    async function resetPassword(newPassword) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        submitBtn.disabled = true;
        hideFormAlert();

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    token: token,
                    newPassword: newPassword 
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showState('success');
            } else {
                if (data.message && data.message.includes('inválido')) {
                    showState('invalid');
                } else {
                    showFormAlert(data.message || 'Error al actualizar la contraseña', 'danger');
                }
            }

        } catch (error) {
            console.error('Error:', error);
            showFormAlert('Error de conexión. Verifica que el servidor esté activo.', 'danger');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Cambiar estado visible
    function showState(state) {
        loadingState.style.display = 'none';
        invalidTokenState.style.display = 'none';
        resetFormState.style.display = 'none';
        successState.style.display = 'none';

        switch(state) {
            case 'loading':
                loadingState.style.display = 'block';
                break;
            case 'invalid':
                invalidTokenState.style.display = 'block';
                break;
            case 'form':
                resetFormState.style.display = 'block';
                newPasswordInput.focus();
                break;
            case 'success':
                successState.style.display = 'block';
                break;
        }
    }

    // Mostrar alerta en el formulario
    function showFormAlert(message, type) {
        formAlert.className = `alert alert-${type}`;
        formAlert.innerHTML = `<i class="fas fa-${type === 'danger' ? 'exclamation-circle' : 'info-circle'} me-2"></i>${message}`;
        formAlert.classList.remove('d-none');
    }

    // Ocultar alerta
    function hideFormAlert() {
        formAlert.classList.add('d-none');
    }

    // Efecto de entrada para la card
    const card = document.querySelector('.card');
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    }

    console.log('✅ GolazoStore Reset Password: JavaScript cargado');
});
