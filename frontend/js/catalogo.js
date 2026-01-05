// ========================================
// GOLAZOSTORE - JavaScript para Página de Catálogo
// Funcionalidades de carga dinámica y búsqueda
// ========================================

document.addEventListener('DOMContentLoaded', function () {

    // Configuración
    const API_URL = 'http://localhost:3000/api/products';
    let allProducts = []; // Almacenar productos localmente para búsqueda rápida

    // Elementos del DOM
    const productsContainer = document.getElementById('productsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const searchResultsDiv = document.getElementById('searchResults');
    const searchTermSpan = document.getElementById('searchTerm');
    const catalogTitle = document.getElementById('catalogTitle');

    // ====================================
    // CARGAR PRODUCTOS
    // ====================================

    function fetchProducts() {
        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al conectar con el servidor');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    allProducts = data.products;

                    // Verificar búsqueda o categoría
                    const urlParams = new URLSearchParams(window.location.search);
                    const categoryParam = urlParams.get('cat');
                    const searchTerm = localStorage.getItem('searchTerm');

                    if (categoryParam === 'shorts') {
                        filterByCategory('short');
                    } else if (searchTerm) {
                        handleSearch(searchTerm);
                        localStorage.removeItem('searchTerm');
                    } else {
                        renderProducts(allProducts);
                    }
                } else {
                    showError('No se pudieron cargar los productos.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error de conexión. Asegúrate que el backend esté corriendo en el puerto 3000.');
            })
            .finally(() => {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
            });
    }

    // ====================================
    // RENDERIZADO
    // ====================================

    function renderProducts(products) {
        // Limpiar contenedor (manteniendo el spinner oculto si existe)
        productsContainer.innerHTML = '';

        if (products.length === 0) {
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <h4 class="text-muted">No se encontraron productos disponibles.</h4>
                </div>
            `;
            return;
        }

        products.forEach(product => {
            // Preparar datos para el botón de añadir (escapar comillas)
            const productData = JSON.stringify({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url
            }).replace(/"/g, '&quot;');

            const cardHtml = `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4 fade-in-up">
                    <div class="card h-100">
                        <a href="producto.html?id=${product.id}" class="text-decoration-none">
                            <img src="${product.image_url || 'https://placehold.co/300x300/E8E8E8/000000?text=Sin+Imagen'}" class="card-img-top" alt="${product.name}" style="cursor: pointer; object-fit: cover; height: 300px;">
                        </a>
                        <div class="card-body text-center">
                            <a href="producto.html?id=${product.id}" class="text-decoration-none text-dark">
                                <h5 class="card-title text-truncate" title="${product.name}">${product.name}</h5>
                            </a>
                            <p class="card-text fw-bold">$${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}</p>
                            <a href="producto.html?id=${product.id}" class="btn btn-outline-danger btn-sm me-1 mb-2">
                                <i class="fas fa-eye"></i> Ver
                            </a>
                            <button class="btn btn-danger btn-sm mb-2" onclick="addToCartDynamic(this)" data-product="${productData}">
                                <i class="fas fa-cart-plus"></i> Añadir
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productsContainer.insertAdjacentHTML('beforeend', cardHtml);
        });

        // Animar entrada (simple fade-in)
        const cards = document.querySelectorAll('.fade-in-up');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    function showError(message) {
        productsContainer.innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h4>Hubo un problema</h4>
                <p>${message}</p>
            </div>
        `;
    }

    // ====================================
    // BÚSQUEDA
    // ====================================

    function handleSearch(term) {
        const termLower = term.toLowerCase();
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(termLower) ||
            (p.description && p.description.toLowerCase().includes(termLower))
        );

        // UI Updates
        if (searchResultsDiv) {
            searchResultsDiv.style.display = 'block';
            searchTermSpan.textContent = `"${term}"`;

            // Actualizar contador
            const existingCount = searchResultsDiv.querySelector('.results-count');
            if (existingCount) existingCount.remove();

            const countElement = document.createElement('small');
            countElement.className = 'results-count d-block mt-2';
            countElement.innerHTML = `<i class="fas fa-info-circle me-1"></i>Se encontraron ${filtered.length} producto(s)`;
            searchResultsDiv.appendChild(countElement);
        }

        if (catalogTitle) catalogTitle.textContent = 'Resultados de Búsqueda';

        renderProducts(filtered);
    }

    function filterByCategory(keyword) {
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(keyword.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(keyword.toLowerCase()))
        );

        if (catalogTitle) catalogTitle.textContent = keyword === 'short' ? 'Shorts' : 'Filtrado';
        renderProducts(filtered);
    }

    window.clearSearch = function () {
        if (searchResultsDiv) searchResultsDiv.style.display = 'none';
        if (catalogTitle) catalogTitle.textContent = 'Nuestro Catálogo';
        // Limpiar query param sin recargar (opcional, por ahora recargamos todo)
        window.history.pushState({}, document.title, window.location.pathname);
        renderProducts(allProducts);
    };

    // ====================================
    // AUXILIAR: Añadir al carrito dinámico
    // ====================================

    window.addToCartDynamic = function (btnElement) {
        try {
            const productData = JSON.parse(btnElement.getAttribute('data-product'));

            // Lógica similar a main.js para mantener compatibilidad
            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

            // Verificar si ya existe (por defecto talla M por ahora)
            const existingItem = cartItems.find(item => item.id === productData.id && item.size === 'M');

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cartItems.push({
                    id: productData.id,
                    name: productData.name,
                    price: parseFloat(productData.price), // Asegurar número
                    size: 'M', // Default size
                    quantity: 1,
                    image: productData.image
                });
            }

            localStorage.setItem('cartItems', JSON.stringify(cartItems));

            // Disparar evento para que main.js actualice el contador si es que escucha storage
            // O actualizar manualmente si tenemos acceso a la función global
            if (typeof updateCartCount === 'function') {
                updateCartCount(); // Si está en el scope global
            } else {
                // Fallback manual para actualizar badge
                const cartBadge = document.getElementById('cart-count');
                if (cartBadge) {
                    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                    cartBadge.textContent = total;
                }
            }

            // Feedback visual en el botón
            const originalContent = btnElement.innerHTML;
            btnElement.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
            btnElement.classList.replace('btn-danger', 'btn-success');

            setTimeout(() => {
                btnElement.innerHTML = originalContent;
                btnElement.classList.replace('btn-success', 'btn-danger');
            }, 2000);

        } catch (e) {
            console.error('Error añadiendo al carrito:', e);
            alert('Error al añadir producto al carrito');
        }
    };

    // Iniciar
    fetchProducts();
});
