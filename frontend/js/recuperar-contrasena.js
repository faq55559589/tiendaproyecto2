// ========================================
// GolazoStore - Recuperación de Contraseña
// ========================================

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    
    const recoveryForm = document.getElementById('recoveryForm');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.getElementById('submitBtn');
    const formAlert = document.getElementById('formAlert');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const sentToEmail = document.getElementById('sentToEmail');

    // Formulario de solicitud de recuperación
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('recoveryEmail').value.trim();
            
            if (!email) {
                showFormAlert('Por favor, ingresa tu email.', 'warning');
                return;
            }
            
            if (!isValidEmail(email)) {
                showFormAlert('Por favor, ingresa un email válido.', 'warning');
                return;
            }
            
            await sendRecoveryEmail(email);
        });
    }

    // Botón "Intentar con otro email"
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            successMessage.style.display = 'none';
            recoveryForm.style.display = 'block';
            recoveryForm.reset();
            hideFormAlert();
        });
    }

    // Enviar solicitud de recuperación al backend
    async function sendRecoveryEmail(email) {
        // Mostrar loading
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
        submitBtn.disabled = true;
        hideFormAlert();

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                // Mostrar mensaje de éxito
                recoveryForm.style.display = 'none';
                successMessage.style.display = 'block';
                sentToEmail.textContent = email;
            } else {
                showFormAlert(data.message || 'Error al enviar el email', 'danger');
            }

        } catch (error) {
            console.error('Error:', error);
            showFormAlert('Error de conexión. Verifica que el servidor esté activo.', 'danger');
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
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

    // Validar formato de email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Efecto de entrada para la card
    const recoveryCard = document.querySelector('.card');
    if (recoveryCard) {
        recoveryCard.style.opacity = '0';
        recoveryCard.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            recoveryCard.style.transition = 'all 0.6s ease';
            recoveryCard.style.opacity = '1';
            recoveryCard.style.transform = 'translateY(0)';
        }, 100);
    }

    console.log('✅ GolazoStore Recuperar Contraseña: JavaScript cargado');
});
