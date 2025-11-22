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
        // Inicializar el carrusel si no está inicializado
        let bsCarousel = bootstrap.Carousel.getInstance(carousel);
        if (!bsCarousel) {
            bsCarousel = new bootstrap.Carousel(carousel, {
                interval: 5000,
                wrap: true,
                touch: true
            });
        }
        
        // Pausar el carrusel al pasar el mouse
        carousel.addEventListener('mouseenter', function() {
            if (bsCarousel) {
                bsCarousel.pause();
            }
        });
        
        // Reanudar al quitar el mouse
        carousel.addEventListener('mouseleave', function() {
            if (bsCarousel) {
                bsCarousel.cycle();
            }
        });
        
        // Asegurar que los controles funcionen
        const prevButton = carousel.querySelector('.carousel-control-prev');
        const nextButton = carousel.querySelector('.carousel-control-next');
        const indicators = carousel.querySelectorAll('.carousel-indicators button');
        
        if (prevButton) {
            prevButton.addEventListener('click', function(e) {
                e.preventDefault();
                if (bsCarousel) {
                    bsCarousel.prev();
                }
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', function(e) {
                e.preventDefault();
                if (bsCarousel) {
                    bsCarousel.next();
                }
            });
        }
        
        // Asegurar que los indicadores funcionen
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', function(e) {
                e.preventDefault();
                if (bsCarousel) {
                    bsCarousel.to(index);
                }
            });
        });
        
        // Agregar efectos a los botones del carrusel
        const carouselButtons = carousel.querySelectorAll('.carousel-caption .btn');
        carouselButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Efecto de pulso al hacer click
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
                
                // Efecto de partículas (opcional)
                createButtonParticles(this);
            });
        });
    }
    
    // Función para crear efecto de partículas en botones
    function createButtonParticles(button) {
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 4px;
                height: 4px;
                background: #007bff;
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
            `;
            
            document.body.appendChild(particle);
            
            const angle = (Math.PI * 2 * i) / 6;
            const velocity = 50;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                particle.remove();
            };
        }
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
    // BÚSQUEDA - REDIRIGE AL CATÁLOGO
    // ====================================
    
    const searchForm = document.querySelector('form[role="search"]');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = this.querySelector('input[type="search"]');
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm !== '') {
                // Guardar término de búsqueda en localStorage
                localStorage.setItem('searchTerm', searchTerm);
                
                // Redirigir al catálogo
                window.location.href = 'catalogo.html';
            } else {
                showSearchAlert('Por favor, ingresa un término de búsqueda.', 'warning');
            }
        });
    }
    
    // ====================================
    // FUNCIÓN PARA MOSTRAR ALERTAS DE BÚSQUEDA
    // ====================================
    
    function showSearchAlert(message, type = 'info') {
        // Crear alerta personalizada
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
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
    
    
    // ====================================
    // FUNCIONALIDAD DEL CARRITO
    // ====================================
    
    // Actualizar contador del carrito al cargar la página
    updateCartCount();
    
    console.log('✅ GolazoStore: JavaScript cargado correctamente');
});


// ====================================
// FUNCIONES GLOBALES DEL CARRITO
// ====================================

// Base de datos de productos (simulada)
const productsDB = {
    1: { name: 'Camiseta Selección Local', price: 89.99, image: 'https://placehold.co/300x300/E8E8E8/000000?text=Camiseta+1' },
    2: { name: 'Camiseta Club Visitante', price: 75.50, image: 'https://placehold.co/300x300/E8E8E8/000000?text=Camiseta+2' },
    3: { name: 'Camiseta Retro Histórica', price: 110.00, image: 'https://placehold.co/300x300/E8E8E8/000000?text=Camiseta+3' },
    4: { name: 'Camiseta Edición Especial', price: 95.00, image: 'https://placehold.co/300x300/E8E8E8/000000?text=Camiseta+4' },
    5: { name: 'Camiseta Arquero Neón', price: 85.00, image: 'https://placehold.co/300x300/E8E8E8/000000?text=Camiseta+5' },
    6: { name: 'Camiseta Entrenamiento', price: 60.00, image: 'https://placehold.co/300x300/E8E8E8/000000?text=Camiseta+6' },
    7: { name: 'Camiseta Mujer Local', price: 89.99, image: 'https://placehold.co/300x300/E8E8E8/000000?text=Camiseta+7' },
    8: { name: 'Camiseta Niño 2025', price: 70.00, image: 'https://placehold.co/300x300/E8E8E8/000000?text=Camiseta+8' }
};

// Función para añadir productos al carrito
function addToCart(productId) {
    // Obtener información del producto
    const product = productsDB[productId];
    if (!product) {
        console.error('Producto no encontrado:', productId);
        return;
    }
    
    // Obtener carrito actual
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Verificar si el producto ya existe en el carrito
    const existingItem = cartItems.find(item => item.id === productId && item.size === 'M');
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            id: productId,
            name: product.name,
            price: product.price,
            size: 'M',
            quantity: 1,
            image: product.image
        });
    }
    
    // Guardar carrito actualizado
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // Actualizar contador
    updateCartCount();
    
    // Mostrar notificación bonita
    showCartNotification('¡Producto añadido al carrito!', 'success');
    
    // Efecto de shake en el icono del carrito
    const cartIcon = document.querySelector('.fa-shopping-cart');
    if (cartIcon) {
        cartIcon.parentElement.style.animation = 'none';
        setTimeout(() => {
            cartIcon.parentElement.style.animation = 'shake 0.5s';
        }, 10);
    }
}

// Función para actualizar el contador del carrito
function updateCartCount() {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }
}

// Función para mostrar notificaciones del carrito
function showCartNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 80px; right: 20px; z-index: 9999; max-width: 350px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    notification.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 150);
    }, 3000);
}


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

