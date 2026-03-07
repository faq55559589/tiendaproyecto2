document.addEventListener('DOMContentLoaded', async function () {
    const productsContainer = document.getElementById('productsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const searchResultsDiv = document.getElementById('searchResults');
    const searchTermSpan = document.getElementById('searchTerm');
    const catalogTitle = document.getElementById('catalogTitle');
    const sortSelect = document.getElementById('sortSelect');
    const filterInfo = document.getElementById('filterInfo');

    if (!productsContainer) return;

    let allProducts = [];
    let visibleProducts = [];

    try {
        allProducts = await GolazoStore.getProducts();
        applyFilters();
    } catch (error) {
        productsContainer.innerHTML = `
            <div class="col-12">
                <div class="state-panel text-center py-5 text-danger">
                <i class="fas fa-plug-circle-xmark fa-3x mb-3"></i>
                <h4>No pudimos cargar el catalogo</h4>
                <p class="text-muted">Revisa el backend y vuelve a intentar.</p>
                <button type="button" class="btn btn-outline-danger mt-2" onclick="window.location.reload()">Reintentar</button>
                </div>
            </div>
        `;
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }

    function applyFilters() {
        const params = new URLSearchParams(window.location.search);
        const categoryParam = (params.get('cat') || '').toLowerCase();
        const search = (params.get('search') || '').trim().toLowerCase();
        const sort = sortSelect ? sortSelect.value : 'recent';

        visibleProducts = allProducts.filter((product) => {
            const haystack = `${product.name} ${product.description || ''} ${product.category_name || ''}`.toLowerCase();
            const matchesSearch = !search || haystack.includes(search);
            const matchesCategory = !categoryParam
                || (categoryParam === 'shorts'
                    ? haystack.includes('short')
                    : String(product.category_name || '').toLowerCase().includes(categoryParam));
            return matchesSearch && matchesCategory;
        });

        visibleProducts = visibleProducts.sort((a, b) => {
            if (sort === 'price-asc') return a.price - b.price;
            if (sort === 'price-desc') return b.price - a.price;
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

        if (catalogTitle) {
            catalogTitle.textContent = categoryParam === 'shorts' ? 'Shorts de futbol' : 'Catalogo completo';
        }

        if (filterInfo) {
            filterInfo.textContent = visibleProducts.length
                ? `${visibleProducts.length} producto(s) encontrados`
                : (categoryParam === 'shorts' ? 'No hay shorts cargados en este momento.' : 'No encontramos productos para este filtro.');
        }

        if (searchResultsDiv) {
            searchResultsDiv.style.display = search ? 'block' : 'none';
            if (searchTermSpan) searchTermSpan.textContent = search;
        }

        renderProducts(visibleProducts);
    }

    function renderProducts(products) {
        productsContainer.innerHTML = '';
        if (!products.length) {
            productsContainer.innerHTML = `
                <div class="col-12">
                    <div class="state-panel text-center py-5">
                    <i class="fas fa-shirt fa-3x text-muted mb-3"></i>
                    <h4>No hay productos disponibles con este criterio</h4>
                    <p class="text-muted">Prueba otra busqueda o vuelve al catalogo completo.</p>
                    <a class="btn btn-outline-danger" href="catalogo.html">Ver todo</a>
                    </div>
                </div>
            `;
            return;
        }

        products.forEach((product) => {
            const stockText = product.stock > 0 ? `Stock ${product.stock}` : 'Sin stock';
            const disabled = product.stock > 0 ? '' : 'disabled';
            productsContainer.insertAdjacentHTML('beforeend', `
                <div class="col-lg-4 col-md-6 mb-4">
                    <article class="card product-card h-100 border-0 shadow-sm">
                        <a href="${GolazoStore.paths.product(product.id)}" class="position-relative d-block overflow-hidden">
                            <img src="${product.image_url}" class="card-img-top" alt="${product.name}">
                        </a>
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-center mb-2 gap-2">
                                <span class="badge bg-danger-subtle text-danger-emphasis">${GolazoStore.getCategoryLabel(product)}</span>
                                <span class="badge ${product.stock > 0 ? 'text-bg-light border' : 'text-bg-danger'}">${stockText}</span>
                            </div>
                            <h3 class="h5 mb-2">${product.name}</h3>
                            <p class="text-muted small flex-grow-1">${product.description || 'Producto de futbol sin descripcion adicional.'}</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <strong class="text-danger fs-5">${GolazoStore.formatPrice(product.price)}</strong>
                                <div class="d-flex gap-2">
                                    <a href="${GolazoStore.paths.product(product.id)}" class="btn btn-outline-danger btn-sm">Ver</a>
                                    <button class="btn btn-danger btn-sm" data-add-product="${product.id}" ${disabled}>Agregar</button>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            `);
        });
    }

    window.clearSearch = function () {
        const params = new URLSearchParams(window.location.search);
        params.delete('search');
        const query = params.toString();
        window.history.replaceState({}, document.title, query ? `catalogo.html?${query}` : 'catalogo.html');
        applyFilters();
    };

    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }

    productsContainer.addEventListener('click', async function (event) {
        const button = event.target.closest('[data-add-product]');
        if (!button) return;
        try {
            const product = allProducts.find((item) => item.id === Number(button.dataset.addProduct));
            if (!product) return;
            await GolazoStore.cart.add(product, 1, product.sizes[0] || 'M');
            GolazoStore.ui.toast('Producto agregado al carrito.', 'success');
        } catch (error) {
            GolazoStore.ui.toast(error.message || 'No se pudo agregar al carrito.', 'danger');
        }
    });
});
