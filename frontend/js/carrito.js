// ========================================
// FANKIT - JavaScript para Página del Carrito
// ========================================

document.addEventListener('DOMContentLoaded', function () {

    // ====================================
    // VARIABLES
    // ====================================
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    // Elementos del DOM
    const emptyCartDiv = document.getElementById('emptyCart');
    const cartWithItemsDiv = document.getElementById('cartWithItems');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartBadge = document.getElementById('cart-count');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const discountElement = document.getElementById('discount');
    const totalElement = document.getElementById('total');
    const discountInfoDiv = document.getElementById('discountInfo');
    const savingsAmountElement = document.getElementById('savingsAmount');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const recommendedSection = document.getElementById('recommendedSection');

    // ====================================
    // INICIALIZACIÓN
    // ====================================

    initCart();

    // ====================================
    // FUNCIONES PRINCIPALES
    // ====================================

    function initCart() {
        updateCartDisplay();
        bindEvents();
    }

    function updateCartDisplay() {
        updateCartBadge();

        if (cartItems.length === 0) {
            showEmptyCart();
        } else {
            showCartWithItems();
            renderCartItems();
            updateTotals();
        }
    }

    function showEmptyCart() {
        emptyCartDiv.style.display = 'block';
        cartWithItemsDiv.style.display = 'none';
        recommendedSection.style.display = 'none';
    }

    function showCartWithItems() {
        emptyCartDiv.style.display = 'none';
        cartWithItemsDiv.style.display = 'block';
        recommendedSection.style.display = 'block';
    }

    function renderCartItems() {
        cartItemsContainer.innerHTML = '';

        cartItems.forEach((item, index) => {
            const cartItemHTML = createCartItemHTML(item, index);
            cartItemsContainer.innerHTML += cartItemHTML;
        });

        // Agregar eventos a los botones
        bindCartItemEvents();
    }

    function createCartItemHTML(item, index) {
        const subtotal = (item.price * item.quantity).toFixed(2);
        // Usar ID si existe, o fallback a nombre (aunque lo ideal es ID)
        const productLink = item.id ? `producto.html?id=${item.id}` : 'catalogo.html';

        return `
            <div class="cart-item border-bottom pb-3 mb-3" data-index="${index}">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <a href="${productLink}">
                            <img src="${item.image}" class="img-fluid rounded" alt="${item.name}" style="max-height: 120px; object-fit: cover; cursor: pointer; transition: transform 0.3s ease;">
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="${productLink}" class="text-decoration-none text-dark">
                            <h6 class="mb-1">${item.name}</h6>
                        </a>
                        <small class="text-muted">Talle: ${item.size}</small>
                    </div>
                    <div class="col-md-2">
                        <span class="fw-bold">$${item.price}</span>
                    </div>
                    <div class="col-md-2">
                        <div class="input-group" style="max-width: 120px;">
                            <button class="btn btn-outline-secondary btn-sm" type="button" data-action="decrease">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="form-control text-center" value="${item.quantity}" min="1" max="10" data-action="update">
                            <button class="btn btn-outline-secondary btn-sm" type="button" data-action="increase">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <span class="fw-bold text-dark">$${subtotal}</span>
                    </div>
                    <div class="col-md-1">
                        <button class="btn btn-outline-danger btn-sm" data-action="remove" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function bindCartItemEvents() {
        // Botones de cantidad
        document.querySelectorAll('[data-action="increase"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const index = this.closest('.cart-item').dataset.index;
                updateQuantity(index, 1);
            });
        });

        document.querySelectorAll('[data-action="decrease"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const index = this.closest('.cart-item').dataset.index;
                updateQuantity(index, -1);
            });
        });

        // Input de cantidad
        document.querySelectorAll('[data-action="update"]').forEach(input => {
            input.addEventListener('change', function () {
                const index = this.closest('.cart-item').dataset.index;
                const newQuantity = parseInt(this.value);
                if (newQuantity >= 1 && newQuantity <= 10) {
                    cartItems[index].quantity = newQuantity;
                    saveCart();
                    updateCartDisplay();
                } else {
                    this.value = cartItems[index].quantity;
                }
            });
        });

        // Botón eliminar
        document.querySelectorAll('[data-action="remove"]').forEach(btn => {
            btn.addEventListener('click', function () {
                const index = this.closest('.cart-item').dataset.index;
                removeItem(index);
            });
        });
    }

    function updateQuantity(index, change) {
        const newQuantity = cartItems[index].quantity + change;

        if (newQuantity >= 1 && newQuantity <= 10) {
            cartItems[index].quantity = newQuantity;
            saveCart();
            updateCartDisplay();
        }
    }

    function removeItem(index) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
            cartItems.splice(index, 1);
            saveCart();
            updateCartDisplay();
            showAlert('Producto eliminado del carrito', 'success');
        }
    }

    function updateTotals() {
        let subtotal = 0;

        cartItems.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        // Calcular envío (gratis si es mayor a $50)
        let shipping = subtotal > 50 ? 0 : 10;

        // Calcular descuento (ejemplo: 10% si el total es mayor a $100)
        let discount = 0;
        if (subtotal > 100) {
            discount = subtotal * 0.1;
        }

        const total = subtotal + shipping - discount;

        // Actualizar elementos del DOM
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = shipping === 0 ? 'GRATIS' : `$${shipping.toFixed(2)}`;
        discountElement.textContent = `-$${discount.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;

        // Mostrar/ocultar información de descuento
        if (discount > 0) {
            discountInfoDiv.style.display = 'block';
            savingsAmountElement.textContent = `$${discount.toFixed(2)}`;
        } else {
            discountInfoDiv.style.display = 'none';
        }
    }

    function updateCartBadge() {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        if (cartBadge) {
            cartBadge.textContent = totalItems;
        }
    }

    function saveCart() {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartBadge();
    }

    // ====================================
    // EVENTOS
    // ====================================

    function bindEvents() {
        // Vaciar carrito
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', function () {
                if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
                    cartItems = [];
                    saveCart();
                    updateCartDisplay();
                    showAlert('Carrito vaciado correctamente', 'info');
                }
            });
        }

        // Proceder al pago
        checkoutBtn.addEventListener('click', function () {
            if (cartItems.length === 0) {
                showAlert('Tu carrito está vacío', 'warning');
                return;
            }

            // Verificar si está logueado
            const isLoggedIn = sessionStorage.getItem('userLoggedIn');
            if (isLoggedIn !== 'true') {
                showAlert('Debes iniciar sesión para continuar con la compra', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                return;
            }

            // Simular proceso de pago
            showAlert('Redirigiendo al proceso de pago...', 'success');
            setTimeout(() => {
                // Aquí irías a la página de checkout
                alert('Funcionalidad de pago estará disponible en el backend');
            }, 1500);
        });

        // Botones de productos recomendados
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const name = this.dataset.name;
                const price = parseFloat(this.dataset.price);

                addToCart(name, price, 'M', 1, 'https://placehold.co/300x300/E8E8E8/000000?text=Producto');

                // Feedback visual
                this.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
                this.classList.remove('btn-primary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-cart-plus"></i> Añadir al Carrito';
                    this.classList.remove('btn-success');
                    this.classList.add('btn-primary');
                }, 2000);
            });
        });
    }

    function addToCart(name, price, size, quantity, image) {
        // Verificar si el producto ya existe en el carrito
        const existingItem = cartItems.find(item =>
            item.name === name && item.size === size
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cartItems.push({
                name: name,
                price: price,
                size: size,
                quantity: quantity,
                image: image
            });
        }

        saveCart();
        updateCartDisplay();
        showAlert('Producto agregado al carrito', 'success');
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
    // FUNCIONES GLOBALES (para usar desde otras páginas)
    // ====================================

    window.addToCartFromProduct = function (name, price, size, quantity) {
        const image = 'assets/images/camiseta_seleccion_local.jpg.webp';
        addToCart(name, price, size, quantity, image);
    };

    window.goToProduct = function (productName) {
        // Guardar información del producto para mostrar en la página de producto
        localStorage.setItem('selectedProduct', productName);
    };

    console.log('✅ FanKit Carrito: JavaScript cargado correctamente');
});
