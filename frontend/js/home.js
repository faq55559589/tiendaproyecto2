// ========================================
// GolazoStore - Home Page Dynamic Products
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'http://localhost:3000/api/products';
    const container = document.getElementById('featuredProductsContainer');

    // Fetch products from API
    function loadProducts() {
        fetch(API_URL)
            .then(res => {
                if (!res.ok) throw new Error('Error al conectar con el servidor');
                return res.json();
            })
            .then(data => {
                if (data.success && data.products.length > 0) {
                    displayProducts(data.products);
                } else {
                    showEmptyState();
                }
            })
            .catch(err => {
                console.error('Error cargando productos:', err);
                showError(err.message);
            });
    }

    // Display products
    function displayProducts(products) {
        container.innerHTML = '';

        products.forEach(product => {
            const card = createProductCard(product);
            container.insertAdjacentHTML('beforeend', card);
        });
    }

    // Create product card HTML
    function createProductCard(product) {
        const imageUrl = product.image_url || 'https://placehold.co/300x300/E8E8E8/000000?text=Sin+Imagen';

        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card h-100 shadow-sm">
                    <a href="producto.html?id=${product.id}" class="text-decoration-none">
                        <img src="${imageUrl}" 
                             class="card-img-top" 
                             alt="${product.name}"
                             style="object-fit: cover; height: 300px; cursor: pointer;">
                    </a>
                    <div class="card-body text-center">
                        <a href="producto.html?id=${product.id}" class="text-decoration-none text-dark">
                            <h5 class="card-title text-truncate" title="${product.name}">${product.name}</h5>
                        </a>
                        <p class="card-text fw-bold text-danger fs-4">$${parseFloat(product.price).toFixed(2)}</p>
                        
                        <div class="d-flex justify-content-center gap-2">
                            <a href="producto.html?id=${product.id}" class="btn btn-outline-danger btn-sm">
                                <i class="fas fa-eye"></i> Ver
                            </a>
                            <button class="btn btn-danger btn-sm" onclick="addToCartFromHome(${product.id}, '${product.name}', ${product.price}, '${imageUrl}')">
                                <i class="fas fa-cart-plus"></i> Añadir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show empty state
    function showEmptyState() {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
                <h4 class="text-muted">No hay productos disponibles</h4>
                <p>Próximamente nuevos ingresos...</p>
            </div>
        `;
    }

    // Show error
    function showError(message) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
                <h4 class="text-danger">Error al cargar productos</h4>
                <p class="text-muted">${message}</p>
                <button class="btn btn-outline-danger" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    // Load products on page load
    loadProducts();
});

// Add to cart function (global)
function addToCartFromHome(id, name, price, image) {
    try {
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

        // Check if product already exists in cart (default size M)
        const existingItem = cartItems.find(item => item.id === id && item.size === 'M');

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({
                id: id,
                name: name,
                price: parseFloat(price),
                size: 'M',
                quantity: 1,
                image: image
            });
        }

        localStorage.setItem('cartItems', JSON.stringify(cartItems));

        // Update cart badge
        const cartBadge = document.getElementById('cart-count');
        if (cartBadge) {
            const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = total;
        }

        // Show feedback
        alert('¡Producto añadido al carrito!');

    } catch (e) {
        console.error('Error añadiendo al carrito:', e);
        alert('Error al añadir producto');
    }
}

console.log('✅ Home.js cargado correctamente');
