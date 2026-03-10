document.addEventListener('DOMContentLoaded', async function () {
    const productForm = document.getElementById('productForm');
    const productsList = document.getElementById('productsList');
    const adminNotice = document.getElementById('adminNotice');
    const productIdInput = document.getElementById('productId');
    const productFormTitle = document.getElementById('productFormTitle');
    const productSubmitLabel = document.getElementById('productSubmitLabel');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const currentImageWrap = document.getElementById('currentImageWrap');
    const currentImageCount = document.getElementById('currentImageCount');
    const currentImagePreviewList = document.getElementById('currentImagePreviewList');
    const imageHelpText = document.getElementById('imageHelpText');
    const imageInput = productForm?.querySelector('input[name="images"]');
    const selectedImagesWrap = document.getElementById('selectedImagesWrap');
    const selectedImagesCount = document.getElementById('selectedImagesCount');
    const selectedImagesPreview = document.getElementById('selectedImagesPreview');
    const adminFilterBar = document.getElementById('adminFilterBar');
    const productsSummaryBadge = document.getElementById('productsSummaryBadge');
    const API_URL = `${GolazoStore.config.apiBase}/products`;
    const ADMIN_PRODUCTS_URL = `${GolazoStore.config.apiBase}/admin/products`;

    let productsCache = [];
    let editingImageUrls = [];
    let currentFilter = 'all';

    function showNotice(message) {
        if (!adminNotice) return;
        if (!message) {
            adminNotice.classList.add('d-none');
            adminNotice.textContent = '';
            return;
        }
        adminNotice.classList.remove('d-none');
        adminNotice.innerHTML = `<i class="fas fa-circle-exclamation me-2"></i>${message}`;
    }

    function showToast(message) {
        const toastEl = document.getElementById('liveToast');
        const toastBody = toastEl.querySelector('.toast-body');
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    function getAdminToken() {
        return GolazoAuth.getToken();
    }

    function isEditing() {
        return Boolean(productIdInput && productIdInput.value);
    }

    function resetForm() {
        productForm.reset();
        productIdInput.value = '';
        productFormTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo producto';
        productSubmitLabel.textContent = 'Crear producto';
        cancelEditBtn.classList.add('d-none');
        currentImageWrap.classList.add('d-none');
        currentImageCount.textContent = '';
        currentImagePreviewList.innerHTML = '';
        editingImageUrls = [];
        selectedImagesWrap.classList.add('d-none');
        selectedImagesCount.textContent = '';
        selectedImagesPreview.innerHTML = '';
        imageInput.required = true;
        imageHelpText.textContent = 'Puedes subir una o varias imágenes. Formatos permitidos: JPG, PNG, WEBP.';
        productForm.querySelector('input[name="stock"]').value = '1';
        productForm.querySelector('input[name="sizesText"]').value = 'S,M,L,XL';
        productForm.querySelector('select[name="category_id"]').value = '1';
        showNotice('');
    }

    function getProductImages(product) {
        if (Array.isArray(product?.image_urls) && product.image_urls.length) {
            return product.image_urls.filter(Boolean);
        }
        if (product?.image_url) {
            return [product.image_url];
        }
        return [];
    }

    function canDeleteProduct(product) {
        return !product?.has_blocking_order_references;
    }

    function getProductStateCounts(products) {
        return products.reduce((acc, product) => {
            acc.all += 1;
            if (product.is_active) {
                acc.active += 1;
            } else {
                acc.inactive += 1;
            }
            if (Number(product.stock || 0) < 1) {
                acc['out-of-stock'] += 1;
            }
            return acc;
        }, {
            all: 0,
            active: 0,
            inactive: 0,
            'out-of-stock': 0
        });
    }

    function updateFilterCounters(products) {
        const counts = getProductStateCounts(products);
        const summaryLabel = counts.all === 1 ? '1 producto' : `${counts.all} productos`;
        if (productsSummaryBadge) {
            productsSummaryBadge.textContent = summaryLabel;
        }

        const mappings = {
            all: counts.all,
            active: counts.active,
            inactive: counts.inactive,
            'out-of-stock': counts['out-of-stock']
        };

        Object.entries(mappings).forEach(([filter, count]) => {
            const node = document.getElementById(`count-${filter}`);
            if (node) {
                node.textContent = String(count);
            }
        });
    }

    function getFilteredProducts(products) {
        switch (currentFilter) {
        case 'active':
            return products.filter((product) => product.is_active);
        case 'inactive':
            return products.filter((product) => !product.is_active);
        case 'out-of-stock':
            return products.filter((product) => Number(product.stock || 0) < 1);
        case 'all':
        default:
            return products;
        }
    }

    function setActiveFilterButton() {
        if (!adminFilterBar) return;
        adminFilterBar.querySelectorAll('[data-filter]').forEach((button) => {
            button.classList.toggle('active', button.dataset.filter === currentFilter);
        });
    }

    function renderProductsView() {
        updateFilterCounters(productsCache);
        setActiveFilterButton();
        renderProductsList(getFilteredProducts(productsCache));
    }

    function fillForm(product) {
        productIdInput.value = String(product.id);
        productForm.querySelector('input[name="name"]').value = product.name || '';
        productForm.querySelector('textarea[name="description"]').value = product.description || '';
        productForm.querySelector('input[name="price"]').value = Number(product.price || 0);
        productForm.querySelector('input[name="stock"]').value = Number(product.stock || 0);
        productForm.querySelector('select[name="category_id"]').value = String(product.category_id || 1);
        productForm.querySelector('input[name="sizesText"]').value = Array.isArray(product.sizes)
            ? product.sizes.join(',')
            : 'S,M,L,XL';
        productForm.querySelector('textarea[name="specifications"]').value = product.specifications || '';

        productFormTitle.innerHTML = '<i class="fas fa-pen-to-square me-2"></i>Editar producto';
        productSubmitLabel.textContent = 'Guardar cambios';
        cancelEditBtn.classList.remove('d-none');
        imageInput.required = false;
        imageInput.value = '';
        imageHelpText.textContent = 'Las imágenes son opcionales al editar. Si subes nuevas, se agregan a la galería actual.';

        editingImageUrls = [...getProductImages(product)];
        renderEditingGallery(product.name);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderSelectedImages(files) {
        const list = Array.from(files || []);
        if (!list.length) {
            selectedImagesWrap.classList.add('d-none');
            selectedImagesCount.textContent = '';
            selectedImagesPreview.innerHTML = '';
            return;
        }

        selectedImagesWrap.classList.remove('d-none');
        selectedImagesCount.textContent = `${list.length} imagen(es) seleccionada(s)`;
        selectedImagesPreview.innerHTML = list.map((file) => `
            <span class="badge text-bg-light border">${file.name}</span>
        `).join('');
    }

    function renderEditingGallery(productName) {
        const currentImages = [...editingImageUrls];
        if (!currentImages.length) {
            currentImageCount.textContent = '0 imagen(es) guardada(s)';
            currentImagePreviewList.innerHTML = '<span class="small text-muted">Sin imágenes guardadas.</span>';
            currentImageWrap.classList.remove('d-none');
            return;
        }

        currentImageCount.textContent = `${currentImages.length} imagen(es) guardada(s)`;
        currentImagePreviewList.innerHTML = currentImages.map((imageUrl, index) => `
            <div class="admin-image-card">
                <img
                    src="${imageUrl}"
                    alt="Imagen ${index + 1} de ${productName || 'producto'}"
                    class="admin-image-thumb"
                >
                <button
                    type="button"
                    class="btn btn-sm btn-danger admin-image-remove"
                    data-remove-image-index="${index}"
                    title="Quitar imagen"
                >
                    <i class="fas fa-trash"></i>
                </button>
                <span class="admin-image-label">Imagen ${index + 1}</span>
            </div>
        `).join('');
        currentImageWrap.classList.remove('d-none');
    }

    async function loadProducts() {
        try {
            const response = await fetch(ADMIN_PRODUCTS_URL, {
                headers: {
                    Authorization: `Bearer ${getAdminToken()}`
                }
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error('No se pudieron cargar productos');
            }

            productsCache = data.products || [];
            renderProductsView();
        } catch (error) {
            productsList.innerHTML = '<div class="alert alert-danger">Error cargando productos.</div>';
        }
    }

    function renderProductsList(products) {
        if (!products.length) {
            productsList.innerHTML = `
                <div class="empty-state text-center py-4 px-3">
                    <i class="fas fa-box-open icon-accent fs-2 mb-3"></i>
                    <h3 class="h6 mb-2">No hay productos en esta vista</h3>
                    <p class="text-ui-muted mb-0 small">Cambia el filtro o crea un producto nuevo desde el formulario.</p>
                </div>
            `;
            return;
        }

        productsList.innerHTML = products.map((product) => {
            const historyNotice = product.has_blocking_order_references
                ? '<div class="small text-ui-muted mt-1">No se puede borrar porque este producto forma parte de pedidos activos o entregados. Puedes dejarlo inactivo para ocultarlo del catálogo.</div>'
                : product.has_order_references
                    ? '<div class="small text-ui-muted mt-1">Este producto solo tiene pedidos cancelados o expirados, así que puedes borrarlo si ya no necesitas conservarlo.</div>'
                    : '';

            return `
                <div class="list-group-item admin-product-item d-flex justify-content-between align-items-center gap-3 flex-wrap ${product.is_active ? '' : 'is-inactive'}">
                    <div class="d-flex align-items-center gap-3 flex-grow-1">
                        <img src="${product.image_url || 'https://placehold.co/72x72'}" class="rounded" style="width: 72px; height: 72px; object-fit: cover;" alt="${product.name}">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${product.name}</h6>
                            <div class="d-flex flex-wrap gap-2 mb-2">
                                <span class="badge ${product.is_active ? 'badge-soft-success' : 'badge-soft-danger'}">${product.is_active ? 'Activo' : 'Inactivo'}</span>
                                <span class="badge ${Number(product.stock || 0) > 0 ? 'badge-soft-neutral' : 'badge-soft-brand'}">${Number(product.stock || 0) > 0 ? `Stock ${product.stock}` : 'Sin stock'}</span>
                                <span class="badge badge-soft-neutral">${getProductImages(product).length} imagen(es)</span>
                                ${product.has_order_references ? '<span class="badge badge-soft-warning">Con historial de pedidos</span>' : ''}
                            </div>
                            <div class="small text-ui-muted">${GolazoStore.formatPrice(product.price)}</div>
                            <div class="small text-ui-muted">${product.description || 'Sin descripción cargada.'}</div>
                            ${historyNotice}
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-brand" data-edit-id="${product.id}">
                            <i class="fas fa-pen me-1"></i>Editar
                        </button>
                        <button class="btn btn-sm ${product.is_active ? 'btn-outline-warning' : 'btn-outline-success'}" data-toggle-active-id="${product.id}" data-next-active="${product.is_active ? 'false' : 'true'}">
                            <i class="fas ${product.is_active ? 'fa-eye-slash' : 'fa-eye'} me-1"></i>${product.is_active ? 'Desactivar' : 'Reactivar'}
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-delete-id="${product.id}" ${canDeleteProduct(product) ? '' : 'disabled title="No se puede borrar un producto con pedidos activos o entregados"'}>
                            <i class="fas fa-trash me-1"></i>Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    const user = await GolazoAuth.syncSession();
    if (!user) {
        GolazoStore.ui.toast('Inicia sesión para entrar al panel admin.', 'warning');
        setTimeout(() => {
            window.location.href = GolazoStore.paths.login();
        }, 700);
        return;
    }

    if (user.role !== 'admin') {
        showNotice('Tu sesión está activa, pero tu usuario no tiene rol admin.');
        setTimeout(() => {
            window.location.href = GolazoStore.paths.home();
        }, 1200);
        return;
    }

    resetForm();
    loadProducts();

    adminFilterBar?.addEventListener('click', function (event) {
        const filterButton = event.target.closest('[data-filter]');
        if (!filterButton) return;

        currentFilter = filterButton.dataset.filter || 'all';
        renderProductsView();
    });

    cancelEditBtn?.addEventListener('click', function () {
        resetForm();
    });

    imageInput?.addEventListener('change', function () {
        renderSelectedImages(this.files);
    });

    currentImagePreviewList?.addEventListener('click', function (event) {
        const removeImageButton = event.target.closest('[data-remove-image-index]');
        if (!removeImageButton || !isEditing()) return;

        const index = Number(removeImageButton.dataset.removeImageIndex);
        editingImageUrls = editingImageUrls.filter((_, imageIndex) => imageIndex !== index);
        renderEditingGallery(productForm.querySelector('input[name="name"]').value || 'producto');
    });

    productForm?.addEventListener('submit', async function (event) {
        event.preventDefault();
        showNotice('');

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';

        const specsInput = this.querySelector('textarea[name="specifications"]');
        if (specsInput && specsInput.value.trim().startsWith('{')) {
            try {
                JSON.parse(specsInput.value);
            } catch (error) {
                showNotice('El JSON de especificaciones es inválido.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
        }

        const formData = new FormData(this);
        const sizesText = String(formData.get('sizesText') || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        formData.set('sizes', JSON.stringify(sizesText.length ? sizesText : ['S', 'M', 'L', 'XL']));
        formData.delete('sizesText');

        const editing = isEditing();
        const targetId = productIdInput.value;
        if (editing) {
            formData.set('image_urls', JSON.stringify(editingImageUrls));
        }

        try {
            const response = await fetch(editing ? `${API_URL}/${targetId}` : API_URL, {
                method: editing ? 'PUT' : 'POST',
                headers: {
                    Authorization: `Bearer ${getAdminToken()}`
                },
                body: formData
            });

            const rawResponse = await response.text();
            let data = {};
            try {
                data = rawResponse ? JSON.parse(rawResponse) : {};
            } catch (parseError) {
                data = {};
            }
            if (!response.ok || !data.success) {
                throw new Error(data.message || (editing ? 'No se pudo actualizar el producto' : 'No se pudo crear el producto'));
            }

            showToast(editing ? 'Producto actualizado.' : 'Producto creado exitosamente.');
            resetForm();
            await loadProducts();
        } catch (error) {
            showNotice(error.message || 'No se pudo guardar el producto.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    productsList?.addEventListener('click', async function (event) {
        const editButton = event.target.closest('[data-edit-id]');
        if (editButton) {
            const id = Number(editButton.dataset.editId);
            const product = productsCache.find((item) => Number(item.id) === id);
            if (!product) {
                showNotice('No se encontró el producto para editar.');
                return;
            }
            fillForm(product);
            return;
        }

        const deleteButton = event.target.closest('[data-delete-id]');
        const toggleActiveButton = event.target.closest('[data-toggle-active-id]');
        if (toggleActiveButton) {
            const id = Number(toggleActiveButton.dataset.toggleActiveId);
            const nextActive = String(toggleActiveButton.dataset.nextActive) === 'true';
            const product = productsCache.find((item) => Number(item.id) === id);
            if (!product) {
                showNotice('No se encontró el producto para actualizar estado.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${getAdminToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        stock: product.stock,
                        sizes: product.sizes || ['M'],
                        category_id: product.category_id,
                        specifications: product.specifications || '',
                        image_urls: getProductImages(product),
                        is_active: nextActive
                    })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo actualizar el estado');
                }
                showToast(nextActive ? 'Producto reactivado.' : 'Producto desactivado.');
                if (isEditing() && Number(productIdInput.value) === id) {
                    resetForm();
                }
                await loadProducts();
            } catch (error) {
                showNotice(error.message || 'No se pudo actualizar el estado del producto.');
            }
            return;
        }

        if (!deleteButton) return;

        const id = Number(deleteButton.dataset.deleteId);
        if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${getAdminToken()}`
                }
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudo eliminar');
            }
            showToast('Producto eliminado.');
            if (isEditing() && Number(productIdInput.value) === id) {
                resetForm();
            }
            await loadProducts();
        } catch (error) {
            showNotice(error.message || 'No se pudo eliminar el producto.');
        }
    });
});
