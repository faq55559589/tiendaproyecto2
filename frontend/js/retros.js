// ========================================
// GOLAZOSTORE - JavaScript para Camisetas Retro
// ========================================

document.addEventListener('DOMContentLoaded', function () {

    // Fetch all for now, but will filter in render
    const API_URL = 'http://localhost:3000/api/products';

    const container = document.getElementById('retrosContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');

    function fetchProducts() {
        if (loadingSpinner) loadingSpinner.style.display = 'block';

        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                if (container) container.innerHTML = '';

                if (data.success && data.products.length > 0) {

                    // Filtrar productos que sean retro
                    const retros = data.products.filter(p =>
                        p.name.toLowerCase().includes('retro') ||
                        (p.description && p.description.toLowerCase().includes('retro'))
                    );

                    if (retros.length === 0) {
                        container.innerHTML = '<div class="col-12 text-center"><h4>Próximamente...</h4></div>';
                        return;
                    }

                    retros.forEach(p => {
                        const productData = JSON.stringify({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image: p.image_url
                        }).replace(/"/g, '&quot;');

                        const html = `
                             <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                                <div class="card h-100">
                                    <a href="producto.html?id=${p.id}" class="text-decoration-none">
                                        <img src="${p.image_url || 'https://placehold.co/300x300/E8E8E8/000000?text=Sin+Imagen'}" class="card-img-top" alt="${p.name}" style="height: 300px; object-fit: cover;">
                                    </a>
                                    <div class="card-body text-center">
                                        <h5 class="card-title">${p.name}</h5>
                                        <p class="card-text fw-bold">$${parseFloat(p.price).toFixed(2)}</p>
                                        <a href="producto.html?id=${p.id}" class="btn btn-outline-danger btn-sm me-1">Ver</a>
                                        <button class="btn btn-danger btn-sm" onclick="addToCartDynamic(this)" data-product="${productData}">Añadir</button>
                                    </div>
                                </div>
                            </div>
                        `;
                        container.insertAdjacentHTML('beforeend', html);
                    });
                } else {
                    if (container) container.innerHTML = '<div class="col-12 text-center"><h4>No hay productos disponibles.</h4></div>';
                }
            })
            .catch(err => {
                console.error(err);
                if (container) container.innerHTML = '<div class="col-12 text-center text-danger">Error cargando productos.</div>';
            })
            .finally(() => {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
            });
    }

    // Auxiliar para carrito (duplicado de catalogo.js por si acaso)
    window.addToCartDynamic = function (btnElement) {
        try {
            const productData = JSON.parse(btnElement.getAttribute('data-product'));
            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            const existingItem = cartItems.find(item => item.id === productData.id && item.size === 'M');

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cartItems.push({
                    id: productData.id,
                    name: productData.name,
                    price: parseFloat(productData.price),
                    size: 'M',
                    quantity: 1,
                    image: productData.image
                });
            }
            localStorage.setItem('cartItems', JSON.stringify(cartItems));

            // Intentar actualizar badge si existe la funcion global
            if (typeof updateCartCount === 'function') updateCartCount();

            const originalContent = btnElement.innerHTML;
            btnElement.innerHTML = '<i class="fas fa-check"></i>';
            btnElement.classList.replace('btn-danger', 'btn-success');
            setTimeout(() => {
                btnElement.innerHTML = originalContent;
                btnElement.classList.replace('btn-success', 'btn-danger');
            }, 2000);

        } catch (e) {
            console.error(e);
        }
    };

    fetchProducts();
});
