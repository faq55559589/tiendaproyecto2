
document.addEventListener('DOMContentLoaded', function () {
    // Obtener ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        // Si no hay ID, redirigir al catálogo
        window.location.href = 'catalogo.html';
        return;
    }

    const API_URL = `http://localhost:3000/api/products/${productId}`;

    // Elementos del DOM
    const dom = {
        title: document.querySelector('.product-title'),
        price: document.querySelector('.current-price'),
        descriptionLead: document.querySelector('.product-description .lead'),
        descriptionFull: document.querySelector('#description p'),
        mainImage: document.getElementById('mainImage'),
        stock: document.getElementById('stockCount'),
        breadcrumbs: document.querySelector('.breadcrumb-item.active'),
        addToCartBtn: document.getElementById('addToCartBtn'),
        quantityInput: document.getElementById('quantityInput'),
        thumbnailsContainer: document.querySelector('.thumbnail-gallery'),
        relatedSection: document.getElementById('relatedProductsSection'),
        relatedContainer: document.getElementById('relatedProductsContainer')
    };

    // Cargar producto
    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error('Producto no encontrado');
            return res.json();
        })
        .then(data => {
            if (data.success) {
                renderProduct(data.product);
                loadRelatedProducts(data.product.id); // Cargar relacionados excluyendo el actual
            } else {
                throw new Error('Error en datos del producto');
            }
        })
        .catch(err => {
            console.error(err);
            document.querySelector('.product-section').innerHTML = `
                <div class="container text-center py-5">
                    <h3 class="text-danger">Producto no encontrado</h3>
                    <a href="catalogo.html" class="btn btn-danger mt-3">Volver al Catálogo</a>
                </div>
            `;
        });

    function renderProduct(product) {
        // Actualizar textos
        dom.title.textContent = product.name;
        dom.price.textContent = `$${parseFloat(product.price).toFixed(2)}`;
        dom.descriptionLead.textContent = product.description;
        dom.descriptionFull.textContent = product.description;

        // Renderizar Especificaciones Dinámicas
        renderSpecifications(product.specifications);
        dom.breadcrumbs.textContent = product.name;
        dom.stock.textContent = product.stock;

        // Actualizar imagen
        if (product.image_url) {
            dom.mainImage.src = product.image_url;

            // Lógica de Miniaturas:
            // Por ahora el backend solo soporta 1 imagen.
            // Si en el futuro hay array de imagenes, iteramos.
            // Si solo hay 1 imagen, ocultamos la galería de miniaturas para evitar duplicados.
            if (dom.thumbnailsContainer) {
                dom.thumbnailsContainer.innerHTML = ''; // Limpiar duplicados hardcodeados

                // Crear miniatura única activa (opcional, o ocultar si es redundant)
                // Decisión: Ocultar si solo hay 1.
                dom.thumbnailsContainer.style.display = 'none';
            }
        }

        // Setup Zoom
        setupZoom(dom.mainImage);

        // Actualizar botón de carrito
        dom.addToCartBtn.onclick = () => {
            addToCartDynamic({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url,
                quantity: parseInt(dom.quantityInput.value) || 1
            });
        };
    }

    function renderSpecifications(specsData) {
        const specsContainer = document.querySelector('.product-specs ul');
        const specsTabContainer = document.querySelector('#specifications .p-4');

        if (!specsData) return;

        let specs = {};
        try {
            specs = JSON.parse(specsData);
        } catch (e) {
            // Si es texto plano
            specs = { "Detalles": specsData };
        }

        // 1. Renderizar en la lista corta (sidebar)
        if (specsContainer) {
            specsContainer.innerHTML = '';
            // Mostrar primeros 5 ítems máximo
            Object.entries(specs).slice(0, 5).forEach(([key, value]) => {
                specsContainer.innerHTML += `
                    <li><i class="fas fa-check text-success"></i> <strong>${key}:</strong> ${value}</li>
                `;
            });
        }

        // 2. Renderizar en la pestaña detallada
        if (specsTabContainer) {
            let htmlContent = '<h5>Especificaciones Técnicas</h5><div class="table-responsive"><table class="table table-striped"><tbody>';

            Object.entries(specs).forEach(([key, value]) => {
                htmlContent += `
                    <tr>
                        <td class="fw-bold">${key}</td>
                        <td>${value}</td>
                    </tr>
                `;
            });

            htmlContent += '</tbody></table></div>';
            specsTabContainer.innerHTML = htmlContent;
        }
    }

    function setupZoom(imageElement) {
        if (!imageElement) return;

        imageElement.style.cursor = 'zoom-in';
        imageElement.addEventListener('click', function () {
            // Simple Lightbox
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '10000';
            modal.style.cursor = 'zoom-out';

            const img = document.createElement('img');
            img.src = this.src;
            img.style.maxHeight = '90%';
            img.style.maxWidth = '90%';
            img.style.borderRadius = '5px';
            img.style.boxShadow = '0 0 20px rgba(255,255,255,0.2)';

            modal.appendChild(img);

            modal.onclick = () => document.body.removeChild(modal);
            document.body.appendChild(modal);
        });
    }

    function loadRelatedProducts(currentId) {
        // Cargar 4 productos aleatorios o recientes
        fetch('http://localhost:3000/api/products')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.products.length > 1) { // Más de 1 para tener relacionados
                    dom.relatedSection.style.display = 'block';
                    dom.relatedContainer.innerHTML = '';

                    // Filtrar actual
                    const others = data.products.filter(p => p.id !== currentId);

                    // Tomar 4
                    const related = others.slice(0, 4);

                    related.forEach(prod => {
                        const html = `
                            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                                <div class="card h-100">
                                    <a href="producto.html?id=${prod.id}">
                                       <img src="${prod.image_url || 'https://placehold.co/300x300'}" class="card-img-top" alt="${prod.name}" style="height: 250px; object-fit: cover;">
                                    </a>
                                    <div class="card-body text-center">
                                        <h5 class="card-title text-truncate">${prod.name}</h5>
                                        <p class="card-text fw-bold">$${parseFloat(prod.price).toFixed(2)}</p>
                                        <a href="producto.html?id=${prod.id}" class="btn btn-outline-danger btn-sm">
                                            <i class="fas fa-eye"></i> Ver
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `;
                        dom.relatedContainer.insertAdjacentHTML('beforeend', html);
                    });
                } else {
                    dom.relatedSection.style.display = 'none';
                }
            })
            .catch(err => console.error('Error loading related:', err));
    }

    // Funcionalidad auxiliar básica (aumentar/disminuir cantidad)
    const incBtn = document.getElementById('increaseQty');
    const decBtn = document.getElementById('decreaseQty');

    if (incBtn) incBtn.onclick = () => {
        let val = parseInt(dom.quantityInput.value);
        if (val < parseInt(dom.stock.textContent || 10)) dom.quantityInput.value = val + 1;
    };

    if (decBtn) decBtn.onclick = () => {
        let val = parseInt(dom.quantityInput.value);
        if (val > 1) dom.quantityInput.value = val - 1;
    };

    // Función local de añadir al carrito
    function addToCartDynamic(product) {
        const activeSize = document.querySelector('.size-btn.active');
        const size = activeSize ? activeSize.getAttribute('data-size') : 'M';

        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const existing = cartItems.find(i => i.id === product.id && i.size === size);

        if (existing) {
            existing.quantity += product.quantity;
        } else {
            cartItems.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                size: size,
                quantity: product.quantity,
                image: product.image
            });
        }

        localStorage.setItem('cartItems', JSON.stringify(cartItems));

        // Actualizar badge
        const badge = document.getElementById('cart-count');
        if (badge) {
            const count = cartItems.reduce((sum, i) => sum + i.quantity, 0);
            badge.textContent = count;
        }

        // Feedback
        const btn = document.getElementById('addToCartBtn');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> ¡Añadido!';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-danger');
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-danger');
        }, 2000);
    }

    // Selector de talle
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

});
