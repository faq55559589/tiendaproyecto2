// ========================================
// GolazoStore - Login
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    const API_BASE = 'http://localhost:3000/api';
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Mostrar/ocultar contraseña
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Formulario de login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe')?.checked || false;
            
            if (!email || !password) {
                showAlert('Por favor, completa todos los campos.', 'warning');
                return;
            }
            
            if (!isValidEmail(email)) {
                showAlert('Por favor, ingresa un email válido.', 'warning');
                return;
            }
            
            await doLogin(email, password, rememberMe);
        });
    }

    // Login real con el backend
    async function doLogin(email, password, rememberMe) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Guardar token y datos del usuario
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }
                
                showAlert(`¡Bienvenido ${data.user.first_name}!`, 'success');
                
                // Redirigir al home después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            } else {
                showAlert(data.message || 'Email o contraseña incorrectos', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }

        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión. Verifica que el servidor esté activo.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Verificar si ya está logueado (solo si no estamos en proceso de login)
    function checkIfLoggedIn() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            window.location.href = 'home.html';
        }
    }
    
    checkIfLoggedIn();

    // Efecto de entrada para la card
    const loginCard = document.querySelector('.card');
    if (loginCard) {
        loginCard.style.opacity = '0';
        loginCard.style.transform = 'translateY(30px)';
    
        setTimeout(() => {
            loginCard.style.transition = 'all 0.6s ease';
            loginCard.style.opacity = '1';
            loginCard.style.transform = 'translateY(0)';
        }, 100);
    }

    console.log('✅ GolazoStore Login: JavaScript cargado correctamente');
});
