document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get('id'));

    if (!productId) {
        window.location.href = GolazoStore.paths.catalog();
        return;
    }

    const dom = {
        section: document.querySelector('.product-section'),
        title: document.querySelector('.product-title'),
        price: document.querySelector('.current-price'),
        originalPrice: document.querySelector('.original-price'),
        discountBadge: document.querySelector('.discount-badge'),
        rating: document.querySelector('.product-rating'),
        lead: document.querySelector('.product-description .lead'),
        bodyText: document.querySelector('#description p'),
        mainImage: document.getElementById('mainImage'),
        breadcrumbs: document.querySelector('.breadcrumb-item.active'),
        stock: document.getElementById('stockCount'),
        quantityInput: document.getElementById('quantityInput'),
        addButton: document.getElementById('addToCartBtn'),
        buyButton: document.getElementById('buyNowBtn'),
        sizesWrap: document.querySelector('.size-options'),
        specsList: document.querySelector('.product-specs ul'),
        specsTab: document.querySelector('#specifications .p-4'),
        relatedSection: document.getElementById('relatedProductsSection'),
        relatedContainer: document.getElementById('relatedProductsContainer'),
        reviewsTabBtn: document.getElementById('reviews-tab'),
        reviewsPane: document.getElementById('reviews')
    };

    let product;

    try {
        product = await GolazoStore.getProduct(productId);
        renderProduct(product);
        loadRelated(product.id);
    } catch (error) {
        dom.section.innerHTML = `
            <div class="container text-center py-5">
                <i class="fas fa-circle-xmark fa-3x text-danger mb-3"></i>
                <h3>Producto no encontrado</h3>
                <a href="catalogo.html" class="btn btn-danger mt-3">Volver al catalogo</a>
            </div>
        `;
    }

    function renderProduct(product) {
        dom.title.textContent = product.name;
        dom.price.textContent = GolazoStore.formatPrice(product.price);
        dom.lead.textContent = product.description || 'Producto oficial de futbol listo para tu carrito.';
        dom.bodyText.textContent = product.description || 'Sin descripcion adicional cargada.';
        dom.mainImage.src = product.image_url;
        dom.mainImage.alt = product.name;
        dom.breadcrumbs.textContent = product.name;
        dom.stock.textContent = product.stock;
        document.title = `${product.name} - GolazoStore`;

        if (dom.originalPrice) dom.originalPrice.remove();
        if (dom.discountBadge) dom.discountBadge.remove();
        if (dom.rating) {
            dom.rating.innerHTML = '<span class="text-muted small"><i class="fas fa-circle-info me-2"></i>Sin resenas publicadas por ahora.</span>';
        }
        if (dom.reviewsTabBtn) {
            dom.reviewsTabBtn.textContent = 'Resenas';
        }
        if (dom.reviewsPane) {
            dom.reviewsPane.innerHTML = `
                <div class="p-4 text-center">
                    <i class="fas fa-comment-slash fa-2x text-muted mb-3"></i>
                    <p class="mb-0 text-muted">Este MVP todavia no publica resenas. La ficha muestra solo datos reales del producto.</p>
                </div>
            `;
        }

        renderSizes(product.sizes);
        renderSpecifications(product);

        const thumbnails = document.querySelector('.thumbnail-gallery');
        if (thumbnails) {
            thumbnails.innerHTML = `
                <div class="thumbnail-item active">
                    <img src="${product.image_url}" class="img-thumbnail thumbnail-img" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;">
                </div>
            `;
        }

        dom.addButton.disabled = product.stock < 1;
        dom.buyButton.disabled = product.stock < 1;
        if (product.stock < 1) {
            dom.addButton.textContent = 'Sin stock';
            dom.buyButton.textContent = 'No disponible';
        }
    }

    function renderSizes(sizes) {
        if (!dom.sizesWrap) return;
        dom.sizesWrap.innerHTML = sizes.map((size, index) => `
            <button class="btn btn-outline-secondary size-btn ${index === 0 ? 'active' : ''}" data-size="${size}">${size}</button>
        `).join('');

        dom.sizesWrap.querySelectorAll('.size-btn').forEach((button) => {
            button.addEventListener('click', function () {
                dom.sizesWrap.querySelectorAll('.size-btn').forEach((item) => item.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    function renderSpecifications(product) {
        const specs = [];
        specs.push(['Categoria', GolazoStore.getCategoryLabel(product)]);
        specs.push(['Stock', String(product.stock)]);
        specs.push(['Talles', product.sizes.join(', ')]);
        if (product.specifications) {
            try {
                const parsed = JSON.parse(product.specifications);
                Object.entries(parsed).forEach(([key, value]) => specs.push([key, String(value)]));
            } catch (error) {
                specs.push(['Detalles', String(product.specifications)]);
            }
        }

        if (dom.specsList) {
            dom.specsList.innerHTML = specs.slice(0, 5).map(([key, value]) => `
                <li><i class="fas fa-check text-success"></i> <strong>${key}:</strong> ${value}</li>
            `).join('');
        }

        if (dom.specsTab) {
            dom.specsTab.innerHTML = `
                <h5>Especificaciones reales</h5>
                <div class="table-responsive">
                    <table class="table table-striped mb-0">
                        <tbody>
                            ${specs.map(([key, value]) => `<tr><td class="fw-bold">${key}</td><td>${value}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    async function loadRelated(currentId) {
        try {
            const products = await GolazoStore.getProducts();
            const related = products.filter((item) => item.id !== currentId).slice(0, 4);
            if (!related.length) {
                dom.relatedSection.style.display = 'none';
                return;
            }
            dom.relatedSection.style.display = 'block';
            dom.relatedContainer.innerHTML = related.map((item) => `
                <div class="col-lg-3 col-md-6 mb-4">
                    <article class="card h-100 border-0 shadow-sm">
                        <a href="${GolazoStore.paths.product(item.id)}"><img src="${item.image_url}" class="card-img-top" alt="${item.name}" style="height: 240px; object-fit: cover;"></a>
                        <div class="card-body text-center">
                            <h3 class="h6">${item.name}</h3>
                            <p class="fw-bold text-danger">${GolazoStore.formatPrice(item.price)}</p>
                            <a class="btn btn-outline-danger btn-sm" href="${GolazoStore.paths.product(item.id)}">Ver producto</a>
                        </div>
                    </article>
                </div>
            `).join('');
        } catch (error) {
            dom.relatedSection.style.display = 'none';
        }
    }

    document.getElementById('increaseQty')?.addEventListener('click', function () {
        const current = Number(dom.quantityInput.value || 1);
        if (current < product.stock) dom.quantityInput.value = current + 1;
    });

    document.getElementById('decreaseQty')?.addEventListener('click', function () {
        const current = Number(dom.quantityInput.value || 1);
        if (current > 1) dom.quantityInput.value = current - 1;
    });

    dom.addButton?.addEventListener('click', async function () {
        const size = document.querySelector('.size-btn.active')?.dataset.size || product.sizes[0] || 'M';
        const quantity = Math.min(Number(dom.quantityInput.value || 1), product.stock || 1);
        try {
            await GolazoStore.cart.add(product, quantity, size);
            GolazoStore.ui.toast('Producto agregado al carrito.', 'success');
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo agregar al carrito.', 'danger');
        }
    });

    dom.buyButton?.addEventListener('click', async function () {
        const size = document.querySelector('.size-btn.active')?.dataset.size || product.sizes[0] || 'M';
        const quantity = Math.min(Number(dom.quantityInput.value || 1), product.stock || 1);
        try {
            await GolazoStore.cart.add(product, quantity, size);
            window.location.href = GolazoStore.paths.checkout();
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo iniciar la compra.', 'danger');
        }
    });
});
