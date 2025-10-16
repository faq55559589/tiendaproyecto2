// ========================================
// FANKIT - JavaScript para Página de Producto
// Funcionalidades específicas del producto
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ====================================
    // VARIABLES GLOBALES
    // ====================================
    let selectedSize = 'M';
    let selectedQuantity = 1;
    let cartCount = 0;
    let stockCount = 15; // Stock inicial

    // ====================================
    // FUNCIONALIDAD DE GALERÍA DE IMÁGENES
    // ====================================
    
    const mainImage = document.getElementById('mainImage');
    const thumbnailImages = document.querySelectorAll('.thumbnail-img');
    const zoomBtn = document.getElementById('zoomBtn');
    const imageZoomModal = new bootstrap.Modal(document.getElementById('imageZoomModal'));
    const zoomedImage = document.getElementById('zoomedImage');

    // Cambiar imagen principal al hacer clic en miniatura
    thumbnailImages.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            const fullSrc = this.getAttribute('data-full-src');
            
            // Actualizar imagen principal
            mainImage.src = fullSrc;
            mainImage.alt = this.alt;
            
            // Actualizar clase activa en miniaturas
            document.querySelectorAll('.thumbnail-item').forEach(item => {
                item.classList.remove('active');
            });
            this.parentElement.classList.add('active');
        });
    });

    // Zoom en imagen principal
    mainImage.addEventListener('click', function() {
        zoomedImage.src = this.src;
        imageZoomModal.show();
    });

    // Botón de zoom
    zoomBtn.addEventListener('click', function() {
        zoomedImage.src = mainImage.src;
        imageZoomModal.show();
    });

    // ====================================
    // SELECTOR DE TALLES
    // ====================================
    
    const sizeButtons = document.querySelectorAll('.size-btn');
    
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase activa de todos los botones
            sizeButtons.forEach(btn => btn.classList.remove('active', 'btn-primary'));
            sizeButtons.forEach(btn => btn.classList.add('btn-outline-secondary'));
            
            // Activar el botón seleccionado
            this.classList.remove('btn-outline-secondary');
            this.classList.add('btn-primary', 'active');
            
            // Guardar talle seleccionado
            selectedSize = this.getAttribute('data-size');
            
            console.log('Talle seleccionado:', selectedSize);
        });
    });

    // ====================================
    // SELECTOR DE CANTIDAD
    // ====================================
    
    const quantityInput = document.getElementById('quantityInput');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    
    // Decrementar cantidad
    decreaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            selectedQuantity = quantityInput.value;
            updateStockDisplay();
        }
    });
    
    // Incrementar cantidad
    increaseBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value);
        const maxAllowed = Math.min(10, stockCount);
        if (currentValue < maxAllowed) {
            quantityInput.value = currentValue + 1;
            selectedQuantity = quantityInput.value;
            updateStockDisplay();
        }
    });
    
    // Validar input manual
    quantityInput.addEventListener('change', function() {
        let value = parseInt(this.value);
        const maxAllowed = Math.min(10, stockCount);
        
        if (value < 1) {
            this.value = 1;
            selectedQuantity = 1;
        } else if (value > maxAllowed) {
            this.value = maxAllowed;
            selectedQuantity = maxAllowed;
            showAlert(`No puedes seleccionar más de ${maxAllowed} unidades. Stock disponible: ${stockCount}`, 'warning');
        } else {
            selectedQuantity = value;
        }
        updateStockDisplay();
    });

    // ====================================
    // BOTONES DE COMPRA
    // ====================================
    
    const addToCartBtn = document.getElementById('addToCartBtn');
    const buyNowBtn = document.getElementById('buyNowBtn');
    
    // Añadir al carrito
    addToCartBtn.addEventListener('click', function() {
        // Verificar que se haya seleccionado un talle
        if (!selectedSize) {
            showAlert('Por favor, selecciona un talle antes de agregar al carrito.', 'warning');
            return;
        }
        
        // Simular agregado al carrito
        addToCart();
        
        // Feedback visual
        this.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
        this.classList.remove('btn-primary');
        this.classList.add('btn-success');
        
        // Volver al estado original después de 2 segundos
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-shopping-cart"></i> Añadir al Carrito';
            this.classList.remove('btn-success');
            this.classList.add('btn-primary');
        }, 2000);
    });
    
    // Comprar ahora
    buyNowBtn.addEventListener('click', function() {
        // Verificar que se haya seleccionado un talle
        if (!selectedSize) {
            showAlert('Por favor, selecciona un talle antes de comprar.', 'warning');
            return;
        }
        
        // Simular compra directa
        showAlert(`¡Redirigiendo al checkout!\n\nProducto: Camiseta Selección Local\nTalle: ${selectedSize}\nCantidad: ${selectedQuantity}\nPrecio: $${(89.99 * selectedQuantity).toFixed(2)}`, 'success');
    });

    // ====================================
    // FUNCIONES AUXILIARES
    // ====================================
    
    function updateStockDisplay() {
        const stockElement = document.getElementById('stockCount');
        if (stockElement) {
            stockElement.textContent = stockCount;
            
            // Cambiar color según stock
            if (stockCount <= 5) {
                stockElement.className = 'fw-bold text-danger';
            } else if (stockCount <= 10) {
                stockElement.className = 'fw-bold text-warning';
            } else {
                stockElement.className = 'fw-bold text-success';
            }
        }
        
        // Actualizar máximo del input
        const maxAllowed = Math.min(10, stockCount);
        quantityInput.max = maxAllowed;
        
        // Deshabilitar botón de incrementar si no hay stock
        if (parseInt(quantityInput.value) >= stockCount) {
            increaseBtn.disabled = true;
            increaseBtn.classList.add('disabled');
        } else {
            increaseBtn.disabled = false;
            increaseBtn.classList.remove('disabled');
        }
    }
    
    function addToCart() {
        // Crear objeto del producto
        const product = {
            name: 'Camiseta Selección Local 2025',
            price: 89.99,
            size: selectedSize,
            quantity: parseInt(selectedQuantity),
            image: 'assets/images/camiseta_seleccion_local.jpg.webp'
        };
        
        // Obtener carrito actual del localStorage
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        
        // Verificar si el producto ya existe en el carrito
        const existingItem = cartItems.find(item => 
            item.name === product.name && item.size === product.size
        );
        
        if (existingItem) {
            existingItem.quantity += product.quantity;
        } else {
            cartItems.push(product);
        }
        
        // Guardar en localStorage
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        
        // Actualizar badge del carrito
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const cartBadge = document.querySelector('.navbar-nav .badge');
        if (cartBadge) {
            cartBadge.textContent = totalItems;
        }
        
        // Efecto de shake en el icono del carrito
        const cartIcon = document.querySelector('.fa-shopping-cart');
        if (cartIcon) {
            cartIcon.parentElement.style.animation = 'none';
            setTimeout(() => {
                cartIcon.parentElement.style.animation = 'shake 0.5s';
            }, 10);
        }
        
        // Simular reducción de stock
        stockCount -= product.quantity;
        updateStockDisplay();
        
        // Mostrar mensaje de confirmación
        showAlert(`¡Producto agregado al carrito!\n\nTalle: ${selectedSize}\nCantidad: ${selectedQuantity}`, 'success');
        
        console.log('Producto agregado al carrito:', product);
    }
    
    function showAlert(message, type = 'info') {
        // Crear alerta personalizada
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
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
    // EFECTOS VISUALES ADICIONALES
    // ====================================
    
    // Efecto hover en la imagen principal
    mainImage.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
    });
    
    mainImage.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    // Efecto en miniaturas
    thumbnailImages.forEach(thumbnail => {
        thumbnail.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.borderColor = '#0d6efd';
        });
        
        thumbnail.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.borderColor = '#dee2e6';
        });
    });
    
    // Animación de entrada para elementos
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
    
    // Observar elementos de la página de producto
    const productElements = document.querySelectorAll('.product-info, .product-gallery, .tab-content');
    productElements.forEach(el => observer.observe(el));

    // ====================================
    // FUNCIONALIDAD DE TABS
    // ====================================
    
    // Mejorar experiencia de tabs
    const tabButtons = document.querySelectorAll('#productTabs button[data-bs-toggle="tab"]');
    
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function(event) {
            // Animar contenido del tab activo
            const targetTab = document.querySelector(event.target.getAttribute('data-bs-target'));
            if (targetTab) {
                targetTab.classList.add('fade-in-up');
            }
        });
    });

    // ====================================
    // PRODUCTOS RELACIONADOS
    // ====================================
    
    // Hacer clickeables las cards de productos relacionados
    const relatedProductCards = document.querySelectorAll('.related-products .card');
    
    relatedProductCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Solo si no se hizo clic en un botón
            if (!e.target.closest('button')) {
                const productTitle = this.querySelector('.card-title').textContent;
                showAlert(`Redirigiendo a: ${productTitle}\n\n(Esta funcionalidad estará disponible cuando se implemente la navegación completa)`, 'info');
            }
        });
    });

    console.log('✅ FanKit Product: JavaScript cargado correctamente');
});

// ====================================
// ESTILOS ADICIONALES PARA LA PÁGINA DE PRODUCTO
// ====================================
const productStyles = document.createElement('style');
productStyles.textContent = `
    /* Estilos para la galería de imágenes */
    .product-gallery .main-image-container {
        position: relative;
        overflow: hidden;
        border-radius: 10px;
    }
    
    .thumbnail-item.active .thumbnail-img {
        border-color: #0d6efd !important;
        border-width: 2px !important;
    }
    
    .thumbnail-img {
        transition: all 0.3s ease;
        border: 2px solid #dee2e6;
    }
    
    /* Estilos para el selector de talles */
    .size-btn {
        min-width: 50px;
        transition: all 0.3s ease;
    }
    
    .size-btn:hover {
        transform: scale(1.05);
    }
    
    .size-btn.active {
        background-color: #0d6efd;
        border-color: #0d6efd;
        color: white;
    }
    
    /* Estilos para el selector de cantidad */
    .quantity-selector .input-group {
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
    }
    
    .quantity-selector .btn {
        border-radius: 0;
    }
    
    .quantity-selector input {
        border-left: none;
        border-right: none;
        border-top: 1px solid #ced4da;
        border-bottom: 1px solid #ced4da;
    }
    
    /* Efectos en botones de acción */
    .action-buttons .btn {
        min-width: 180px;
        transition: all 0.3s ease;
    }
    
    .action-buttons .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    /* Estilos para las tabs */
    .nav-tabs .nav-link {
        border-radius: 8px 8px 0 0;
        margin-right: 5px;
        transition: all 0.3s ease;
    }
    
    .nav-tabs .nav-link.active {
        background-color: #0d6efd;
        border-color: #0d6efd;
        color: white;
    }
    
    .nav-tabs .nav-link:hover:not(.active) {
        background-color: #f8f9fa;
    }
    
    /* Estilos para las reseñas */
    .review-item {
        transition: all 0.3s ease;
    }
    
    .review-item:hover {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
    }
    
    /* Rating bars */
    .rating-bars .progress {
        background-color: #e9ecef;
    }
    
    .rating-bars .progress-bar {
        background-color: #ffc107;
    }
    
    /* Efectos en productos relacionados */
    .related-products .card {
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .related-products .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    /* Información de envío */
    .shipping-info .col-md-4 {
        padding: 20px;
        border-radius: 10px;
        transition: all 0.3s ease;
    }
    
    .shipping-info .col-md-4:hover {
        background-color: #f8f9fa;
        transform: translateY(-2px);
    }
    
    /* Animación de shake para el carrito */
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .thumbnail-gallery {
            justify-content: center;
        }
        
        .action-buttons .btn {
            min-width: 150px;
            margin-bottom: 10px;
        }
        
        .size-options {
            justify-content: center;
        }
    }
`;

document.head.appendChild(productStyles);
