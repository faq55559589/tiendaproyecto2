// ========================================
// FANKIT - JavaScript para Recuperación de Contraseña
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ====================================
    // VARIABLES
    // ====================================
    const recoveryForm = document.getElementById('recoveryForm');
    const verificationForm = document.getElementById('verificationForm');
    const newPasswordForm = document.getElementById('newPasswordForm');
    const successMessage = document.getElementById('successMessage');
    
    const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
    const toggleConfirmNewPasswordBtn = document.getElementById('toggleConfirmNewPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    
    let currentEmail = '';
    let verificationCode = '';

    // ====================================
    // FUNCIONALIDAD DE MOSTRAR/OCULTAR CONTRASEÑAS
    // ====================================
    
    if (toggleNewPasswordBtn) {
        toggleNewPasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility(newPasswordInput, this);
        });
    }

    if (toggleConfirmNewPasswordBtn) {
        toggleConfirmNewPasswordBtn.addEventListener('click', function() {
            togglePasswordVisibility(confirmNewPasswordInput, this);
        });
    }

    function togglePasswordVisibility(input, button) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        // Cambiar icono
        const icon = button.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }

    // ====================================
    // FORMULARIOS
    // ====================================
    
    // Formulario de solicitud de email
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('recoveryEmail').value.trim();
            
            if (!email) {
                showAlert('Por favor, ingresa tu email.', 'warning');
                return;
            }
            
            if (!isValidEmail(email)) {
                showAlert('Por favor, ingresa un email válido.', 'warning');
                return;
            }
            
            // Simular envío de email
            simulateEmailSent(email);
        });
    }
    
    // Formulario de verificación de código
    if (verificationForm) {
        verificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inputCode = document.getElementById('verificationCode').value.trim();
            
            if (!inputCode) {
                showAlert('Por favor, ingresa el código de verificación.', 'warning');
                return;
            }
            
            if (inputCode !== verificationCode) {
                showAlert('El código de verificación es incorrecto.', 'error');
                return;
            }
            
            // Mostrar formulario de nueva contraseña
            showNewPasswordForm();
        });
    }
    
    // Formulario de nueva contraseña
    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmNewPasswordInput.value;
            
            // Validar contraseñas
            if (!validatePassword(newPassword)) {
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showAlert('Las contraseñas no coinciden.', 'warning');
                return;
            }
            
            // Simular cambio de contraseña
            simulatePasswordChange();
        });
    }

    // ====================================
    // FUNCIONES DE SIMULACIÓN
    // ====================================
    
    function simulateEmailSent(email) {
        currentEmail = email;
        
        // Mostrar loading
        const submitBtn = recoveryForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
        submitBtn.disabled = true;
        
        // Simular delay de envío
        setTimeout(() => {
            // Generar código de verificación (en producción sería enviado por email)
            verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Mostrar formulario de verificación
            showVerificationForm();
            
            // Mostrar mensaje de éxito
            showAlert(`Código de verificación enviado a ${email}\n\nCódigo de prueba: ${verificationCode}`, 'success');
            
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }
    
    function showVerificationForm() {
        recoveryForm.style.display = 'none';
        verificationForm.style.display = 'block';
        newPasswordForm.style.display = 'none';
        successMessage.style.display = 'none';
        
        // Enfocar input de código
        setTimeout(() => {
            document.getElementById('verificationCode').focus();
        }, 100);
    }
    
    function showNewPasswordForm() {
        recoveryForm.style.display = 'none';
        verificationForm.style.display = 'none';
        newPasswordForm.style.display = 'block';
        successMessage.style.display = 'none';
        
        // Enfocar input de nueva contraseña
        setTimeout(() => {
            newPasswordInput.focus();
        }, 100);
    }
    
    function simulatePasswordChange() {
        // Mostrar loading
        const submitBtn = newPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        submitBtn.disabled = true;
        
        // Simular delay de guardado
        setTimeout(() => {
            // Mostrar mensaje de éxito
            recoveryForm.style.display = 'none';
            verificationForm.style.display = 'none';
            newPasswordForm.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Limpiar formularios
            recoveryForm.reset();
            verificationForm.reset();
            newPasswordForm.reset();
            
            showAlert('¡Contraseña restablecida exitosamente!', 'success');
        }, 2000);
    }

    // ====================================
    // FUNCIONES DE VALIDACIÓN
    // ====================================
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function validatePassword(password) {
        const minLength = 6;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        if (password.length < minLength) {
            showAlert('La contraseña debe tener al menos 6 caracteres.', 'warning');
            return false;
        }
        
        if (!hasLetter || !hasNumber) {
            showAlert('La contraseña debe contener al menos una letra y un número.', 'warning');
            return false;
        }
        
        return true;
    }

    // ====================================
    // FUNCIONALIDAD ADICIONAL
    // ====================================
    
    // Reenviar código
    if (resendCodeBtn) {
        resendCodeBtn.addEventListener('click', function() {
            if (currentEmail) {
                // Generar nuevo código
                verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Mostrar loading
                this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-redo me-1"></i>Reenviar código';
                    this.disabled = false;
                    showAlert(`Nuevo código enviado a ${currentEmail}\n\nCódigo de prueba: ${verificationCode}`, 'success');
                }, 1500);
            }
        });
    }
    
    // Auto-formatear código de verificación
    const verificationCodeInput = document.getElementById('verificationCode');
    if (verificationCodeInput) {
        verificationCodeInput.addEventListener('input', function() {
            // Solo permitir números
            this.value = this.value.replace(/\D/g, '');
            
            // Si se completa el código, validar automáticamente
            if (this.value.length === 6) {
                setTimeout(() => {
                    if (this.value === verificationCode) {
                        showNewPasswordForm();
                    }
                }, 500);
            }
        });
        
        // Enfocar automáticamente
        verificationCodeInput.addEventListener('paste', function(e) {
            setTimeout(() => {
                this.value = this.value.replace(/\D/g, '');
            }, 10);
        });
    }

    // ====================================
    // FUNCIONES AUXILIARES
    // ====================================
    
    function showAlert(message, type = 'info') {
        // Crear alerta personalizada
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message.replace(/\n/g, '<br>')}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // ====================================
    // EFECTOS VISUALES
    // ====================================
    
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

    console.log('✅ FanKit Recuperar Contraseña: JavaScript cargado correctamente');
});
