// ========================================
// FANKIT - JavaScript para Página de Registro
// ========================================

document.addEventListener('DOMContentLoaded', function () {

    // ====================================
    // VARIABLES
    // ====================================
    const registerForm = document.getElementById('registerForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // ====================================
    // FUNCIONALIDAD DE MOSTRAR/OCULTAR CONTRASEÑAS
    // ====================================

    togglePasswordBtn.addEventListener('click', function () {
        togglePasswordVisibility(passwordInput, this);
    });

    toggleConfirmPasswordBtn.addEventListener('click', function () {
        togglePasswordVisibility(confirmPasswordInput, this);
    });

    function togglePasswordVisibility(input, button) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);

        // Cambiar icono
        const icon = button.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }

    // ====================================
    // VALIDACIÓN EN TIEMPO REAL
    // ====================================

    // Validación de contraseña mientras se escribe
    passwordInput.addEventListener('input', function () {
        validatePasswordStrength(this.value);
    });

    // Validación de confirmación de contraseña
    confirmPasswordInput.addEventListener('input', function () {
        validatePasswordMatch();
    });

    // ====================================
    // ENVÍO DEL FORMULARIO
    // ====================================

    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Obtener datos del formulario
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: passwordInput.value,
            confirmPassword: confirmPasswordInput.value,
            acceptTerms: document.getElementById('acceptTerms').checked,
            newsletter: document.getElementById('newsletter').checked
        };

        // Validar formulario
        if (!validateForm(formData)) {
            return;
        }

        // Simular registro
        simulateRegistration(formData);
    });

    // ====================================
    // FUNCIONES DE VALIDACIÓN
    // ====================================

    function validateForm(data) {
        // Validar campos obligatorios
        if (!data.firstName || !data.lastName || !data.email || !data.password || !data.confirmPassword) {
            showAlert('Por favor, completa todos los campos obligatorios.', 'warning');
            return false;
        }

        // Validar email
        if (!isValidEmail(data.email)) {
            showAlert('Por favor, ingresa un email válido.', 'warning');
            return false;
        }

        // Validar contraseña
        if (!validatePasswordStrength(data.password)) {
            return false;
        }

        // Validar confirmación de contraseña
        if (data.password !== data.confirmPassword) {
            showAlert('Las contraseñas no coinciden.', 'warning');
            return false;
        }

        // Validar términos y condiciones
        if (!data.acceptTerms) {
            showAlert('Debes aceptar los términos y condiciones para continuar.', 'warning');
            return false;
        }

        return true;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePasswordStrength(password) {
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

    function validatePasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden');
            confirmPasswordInput.classList.add('is-invalid');
        } else {
            confirmPasswordInput.setCustomValidity('');
            confirmPasswordInput.classList.remove('is-invalid');
            confirmPasswordInput.classList.add('is-valid');
        }
    }

    // ====================================
    // REGISTRO REAL CON BACKEND
    // ====================================

    const API_URL = 'http://localhost:3000/api';

    async function simulateRegistration(data) {
        // Mostrar loading
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando cuenta...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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

            if (response.ok && result.success) {
                // Éxito: Mostrar mensaje de verificación
                showAlert('¡Registro casi listo! Te enviamos un email para verificar tu cuenta.', 'success');

                // Limpiar formulario y restaurar botón
                registerForm.reset();
                submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>¡Enviado!';

                // Redirigir al login después de un momento para que ingresen tras verificar
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 4000);
            } else {
                // Error del servidor
                showAlert(result.message || 'Error al crear la cuenta. Intentá de nuevo.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error en registro:', error);
            showAlert('Error de conexión. Verificá que el servidor esté corriendo.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    function showAlert(message, type = 'info') {
        // Crear alerta personalizada
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
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
    // VERIFICAR SI YA ESTÁ LOGEADO
    // ====================================

    function checkIfLoggedIn() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            // Si ya está logueado, redirigir al inicio
            window.location.href = '../index.html';
        }
    }

    // Verificar al cargar la página
    checkIfLoggedIn();

    // ====================================
    // EFECTOS VISUALES
    // ====================================

    // Efecto de entrada para la card
    const registerCard = document.querySelector('.card');
    registerCard.style.opacity = '0';
    registerCard.style.transform = 'translateY(30px)';

    setTimeout(() => {
        registerCard.style.transition = 'all 0.6s ease';
        registerCard.style.opacity = '1';
        registerCard.style.transform = 'translateY(0)';
    }, 100);

    // ====================================
    // VALIDACIÓN DE TELÉFONO (OPCIONAL)
    // ====================================

    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function () {
        // Formatear número de teléfono uruguayo
        let value = this.value.replace(/\D/g, ''); // Solo números

        if (value.length > 0) {
            if (value.startsWith('598')) {
                value = value.substring(3);
            }
            if (value.length >= 8) {
                value = `+598 ${value.substring(0, 2)} ${value.substring(2, 5)} ${value.substring(5)}`;
            } else if (value.length >= 5) {
                value = `+598 ${value.substring(0, 2)} ${value.substring(2)}`;
            } else if (value.length >= 2) {
                value = `+598 ${value}`;
            } else {
                value = `+598 ${value}`;
            }
        }

        this.value = value;
    });

    console.log('✅ FanKit Registro: JavaScript cargado correctamente');
});
