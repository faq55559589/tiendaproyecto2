// ========================================
// FANKIT - JavaScript Interactivo
// Fase 3: Funcionalidades Avanzadas
// ========================================

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // ====================================
    // BOTÓN "VOLVER ARRIBA" (Back to Top)
    // ====================================
    
    // Crear el botón si no existe
    if (!document.getElementById('backToTop')) {
        const backToTopBtn = document.createElement('button');
        backToTopBtn.id = 'backToTop';
        backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        backToTopBtn.setAttribute('title', 'Volver arriba');
        document.body.appendChild(backToTopBtn);
    }
    
    const backToTopButton = document.getElementById('backToTop');
    
    // Mostrar/ocultar botón según el scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });
    
    // Volver arriba al hacer click
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    
    // ====================================
    // ANIMACIONES AL HACER SCROLL
    // ====================================
    
    // Animar elementos cuando entran en la vista
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observar todas las secciones y cards
    const elementsToAnimate = document.querySelectorAll('section, .products-section .card');
    elementsToAnimate.forEach(el => observer.observe(el));
    
    
    // ====================================
    // MEJORAR EXPERIENCIA DEL CARRUSEL
    // ====================================
    
    const carousel = document.querySelector('#heroCarousel');
    if (carousel) {
        // Pausar el carrusel al pasar el mouse
        carousel.addEventListener('mouseenter', function() {
            const bsCarousel = bootstrap.Carousel.getInstance(carousel);
            if (bsCarousel) {
                bsCarousel.pause();
            }
        });
        
        // Reanudar al quitar el mouse
        carousel.addEventListener('mouseleave', function() {
            const bsCarousel = bootstrap.Carousel.getInstance(carousel);
            if (bsCarousel) {
                bsCarousel.cycle();
            }
        });
    }
    
    
    // ====================================
    // CONTADOR DE CARRITO (simulado)
    // ====================================
    
    // Por ahora solo visual, en el futuro se conectará con el backend
    const addToCartButtons = document.querySelectorAll('.btn-primary');
    let cartCount = 0;
    
    addToCartButtons.forEach(button => {
        if (button.textContent.includes('Añadir al Carrito')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Incrementar contador
                cartCount++;
                const cartBadge = document.querySelector('.navbar-nav .badge');
                if (cartBadge) {
                    cartBadge.textContent = cartCount;
                }
                
                // Feedback visual
                button.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
                button.classList.remove('btn-primary');
                button.classList.add('btn-success');
                
                // Volver al estado original después de 2 segundos
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-cart-plus"></i> Añadir al Carrito';
                    button.classList.remove('btn-success');
                    button.classList.add('btn-primary');
                }, 2000);
                
                // Efecto de shake en el icono del carrito
                const cartIcon = document.querySelector('.fa-shopping-cart');
                if (cartIcon) {
                    cartIcon.parentElement.style.animation = 'none';
                    setTimeout(() => {
                        cartIcon.parentElement.style.animation = 'shake 0.5s';
                    }, 10);
                }
            });
        }
    });
    
    
    // ====================================
    // VALIDACIÓN BÁSICA DEL FORMULARIO DE CONTACTO
    // ====================================
    
    const contactForm = document.querySelector('form');
    if (contactForm && window.location.pathname.includes('contacto')) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validación simple
            const name = document.getElementById('contactName');
            const email = document.getElementById('contactEmail');
            const message = document.getElementById('contactMessage');
            
            if (name.value.trim() === '' || email.value.trim() === '' || message.value.trim() === '') {
                alert('Por favor, completa todos los campos obligatorios.');
                return;
            }
            
            // Simular envío exitoso
            alert('¡Mensaje enviado! Te responderemos pronto.');
            contactForm.reset();
        });
    }
    
    
    // ====================================
    // BÚSQUEDA (preparado para futuro)
    // ====================================
    
    const searchForm = document.querySelector('form[role="search"]');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = this.querySelector('input[type="search"]');
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm !== '') {
                // Por ahora solo mostramos una alerta
                // En el futuro, esto redirigirá a una página de resultados
                alert(`Búsqueda: "${searchTerm}"\n\nEsta funcionalidad estará disponible cuando conectemos el backend.`);
            }
        });
    }
    
    
    // ====================================
    // EFECTO DE CARGA INICIAL
    // ====================================
    
    // Ocultar cualquier overlay de carga después de 500ms
    setTimeout(() => {
        const spinner = document.querySelector('.spinner-overlay');
        if (spinner) {
            spinner.classList.remove('active');
        }
    }, 500);
    
    
    console.log('✅ FanKit: JavaScript cargado correctamente');
});


// ====================================
// ANIMACIÓN DE SHAKE PARA EL CARRITO
// ====================================
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

