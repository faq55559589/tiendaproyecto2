// ========================================
// FANKIT - JavaScript para Página de Login
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ====================================
    // VARIABLES
    // ====================================
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // ====================================
    // FUNCIONALIDAD DE MOSTRAR/OCULTAR CONTRASEÑA
    // ====================================
    
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Cambiar icono
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // ====================================
    // VALIDACIÓN Y ENVÍO DEL FORMULARIO
    // ====================================
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener datos del formulario
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validación básica
        if (!email || !password) {
            showAlert('Por favor, completa todos los campos.', 'warning');
            return;
        }
        
        // Validación de email
        if (!isValidEmail(email)) {
            showAlert('Por favor, ingresa un email válido.', 'warning');
            return;
        }
        
        // Validación de contraseña (mínimo 6 caracteres)
        if (password.length < 6) {
            showAlert('La contraseña debe tener al menos 6 caracteres.', 'warning');
            return;
        }
        
        // Simular inicio de sesión
        simulateLogin(email, password, rememberMe);
    });

    // ====================================
    // FUNCIONES AUXILIARES
    // ====================================
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function simulateLogin(email, password, rememberMe) {
        // Mostrar loading
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
        submitBtn.disabled = true;
        
        // Simular delay de autenticación
        setTimeout(() => {
            // Simular éxito (en el backend real aquí validarías las credenciales)
            if (email === 'admin@fankit.com' && password === '123456') {
                // Guardar en localStorage si "recordarme" está marcado
                if (rememberMe) {
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('rememberMe', 'true');
                }
                
                // Guardar sesión
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userEmail', email);
                
                showAlert('¡Bienvenido! Has iniciado sesión correctamente.', 'success');
                
                // Redirigir después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showAlert('Email o contraseña incorrectos. Intenta nuevamente.', 'error');
                
                // Restaurar botón
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }, 2000);
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
        const isLoggedIn = sessionStorage.getItem('userLoggedIn');
        if (isLoggedIn === 'true') {
            // Si ya está logueado, redirigir al inicio
            window.location.href = 'index.html';
        }
    }
    
    // Verificar al cargar la página
    checkIfLoggedIn();

    // ====================================
    // EFECTOS VISUALES
    // ====================================
    
    // Efecto de entrada para la card
    const loginCard = document.querySelector('.card');
    loginCard.style.opacity = '0';
    loginCard.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        loginCard.style.transition = 'all 0.6s ease';
        loginCard.style.opacity = '1';
        loginCard.style.transform = 'translateY(0)';
    }, 100);

    console.log('✅ FanKit Login: JavaScript cargado correctamente');
});
