document.addEventListener('DOMContentLoaded', async function () {
    const productForm = document.getElementById('productForm');
    const productsList = document.getElementById('productsList');
    const adminNotice = document.getElementById('adminNotice');
    const stageStatus = document.getElementById('adminProductsStageStatus');
    const formStatus = document.getElementById('adminProductFormStatus');
    const listStatus = document.getElementById('adminProductsListStatus');
    const productIdInput = document.getElementById('productId');
    const productFormTitle = document.getElementById('productFormTitle');
    const productFormHint = document.getElementById('adminProductFormHint');
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
    const productSearch = document.getElementById('adminProductSearch');
    const esc = GolazoStore.escapeHtml;
    const attr = GolazoStore.escapeAttr;

    let productsCache = [];
    let editingImageUrls = [];
    let currentFilter = 'all';
    let currentSearch = '';
    let listLoading = false;

    if (!GolazoStore.config.apiBase) {
        GolazoAdmin.setNotice(adminNotice, 'Falta configurar la API del frontend.');
        return;
    }

    const user = await GolazoAdmin.requireAdmin({ noticeNode: adminNotice });
    if (!user) return;

    const adminProductsPath = '/admin/products';

    function isEditing() {
        return Boolean(productIdInput && productIdInput.value);
    }

    function setFormStatus(message, tone = 'muted') {
        GolazoAdmin.setStatus(formStatus, message, tone);
    }

    function setListStatus(message, tone = 'muted') {
        GolazoAdmin.setStatus(listStatus, message, tone);
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
            if (product.is_active) acc.active += 1;
            else acc.inactive += 1;
            if (Number(product.stock || 0) < 1) acc['out-of-stock'] += 1;
            return acc;
        }, { all: 0, active: 0, inactive: 0, 'out-of-stock': 0 });
    }

    function updateFilterCounters(products) {
        const counts = getProductStateCounts(products);
        if (productsSummaryBadge) {
            productsSummaryBadge.textContent = counts.all === 1 ? '1 producto' : `${counts.all} productos`;
        }

        ['all', 'active', 'inactive', 'out-of-stock'].forEach((filter) => {
            const node = document.getElementById(`count-${filter}`);
            if (node) node.textContent = String(counts[filter]);
        });
    }

    function getFilteredProducts(products) {
        let filtered = products;

        switch (currentFilter) {
        case 'active':
            filtered = filtered.filter((product) => product.is_active);
            break;
        case 'inactive':
            filtered = filtered.filter((product) => !product.is_active);
            break;
        case 'out-of-stock':
            filtered = filtered.filter((product) => Number(product.stock || 0) < 1);
            break;
        default:
            break;
        }

        if (!currentSearch) return filtered;

        const search = currentSearch.toLowerCase();
        return filtered.filter((product) => {
            const haystack = [
                product.name,
                product.description,
                product.category_name,
                product.specifications
            ].join(' ').toLowerCase();
            return haystack.includes(search);
        });
    }

    function setActiveFilterButton() {
        adminFilterBar?.querySelectorAll('[data-filter]').forEach((button) => {
            button.classList.toggle('active', button.dataset.filter === currentFilter);
        });
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
        selectedImagesCount.textContent = `${list.length} archivo(s) listo(s) para subir`;
        selectedImagesPreview.innerHTML = list.map((file) => `
            <span class="badge text-bg-light border">${esc(file.name)}</span>
        `).join('');
    }

    function renderEditingGallery(productName) {
        const currentImages = [...editingImageUrls];
        currentImageWrap.classList.remove('d-none');

        if (!currentImages.length) {
            currentImageCount.textContent = 'No hay imagenes guardadas';
            currentImagePreviewList.innerHTML = '<span class="small text-muted">Sube nuevas imagenes o guarda sin galeria adicional.</span>';
            return;
        }

        currentImageCount.textContent = `${currentImages.length} imagen(es) guardada(s)`;
        currentImagePreviewList.innerHTML = currentImages.map((imageUrl, index) => `
            <div class="admin-image-card">
                <img src="${attr(imageUrl)}" alt="Imagen ${index + 1} de ${esc(productName || 'producto')}" class="admin-image-thumb">
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
    }

    function resetForm() {
        productForm.reset();
        productIdInput.value = '';
        productFormTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo producto';
        productFormHint.textContent = 'Completa datos, stock y galeria desde un solo formulario.';
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
        imageInput.value = '';
        imageHelpText.textContent = 'Puedes subir una o varias imagenes. Formatos permitidos: JPG, PNG, WEBP.';
        productForm.querySelector('input[name="stock"]').value = '1';
        productForm.querySelector('input[name="sizesText"]').value = 'S,M,L,XL';
        productForm.querySelector('select[name="category_id"]').value = '1';
        GolazoAdmin.setNotice(adminNotice, '');
        setFormStatus('Completa el formulario y guarda cuando el producto este listo.');
    }

    function fillForm(product) {
        productIdInput.value = String(product.id);
        productForm.querySelector('input[name="name"]').value = product.name || '';
        productForm.querySelector('textarea[name="description"]').value = product.description || '';
        productForm.querySelector('input[name="price"]').value = Number(product.price || 0);
        productForm.querySelector('input[name="stock"]').value = Number(product.stock || 0);
        productForm.querySelector('select[name="category_id"]').value = String(product.category_id || 1);
        productForm.querySelector('input[name="sizesText"]').value = Array.isArray(product.sizes) ? product.sizes.join(',') : 'S,M,L,XL';
        productForm.querySelector('textarea[name="specifications"]').value = product.specifications || '';

        productFormTitle.innerHTML = '<i class="fas fa-pen-to-square me-2"></i>Editar producto';
        productFormHint.textContent = 'Puedes ajustar datos, mantener galeria actual y subir imagenes adicionales.';
        productSubmitLabel.textContent = 'Guardar cambios';
        cancelEditBtn.classList.remove('d-none');
        imageInput.required = false;
        imageHelpText.textContent = 'Las imagenes nuevas se agregan a la galeria actual. Tambien puedes quitar guardadas antes de actualizar.';
        editingImageUrls = [...getProductImages(product)];
        renderEditingGallery(product.name);
        setFormStatus(`Editando "${product.name}". Revisa datos y guarda cuando termines.`, 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function productHistoryNotice(product) {
        if (product.has_blocking_order_references) {
            return '<div class="small text-ui-muted mt-2">Tiene pedidos activos o entregados. Puedes dejarlo inactivo, pero no eliminarlo.</div>';
        }
        if (product.has_order_references) {
            return '<div class="small text-ui-muted mt-2">Solo tiene pedidos cancelados o expirados. Puedes eliminarlo si ya no necesitas conservarlo.</div>';
        }
        return '';
    }

    function renderProductsList(products) {
        if (!products.length) {
            productsList.innerHTML = `
                <div class="empty-state text-center py-4 px-3">
                    <i class="fas fa-box-open icon-accent fs-2 mb-3"></i>
                    <h3 class="h6 mb-2">No hay productos en esta vista</h3>
                    <p class="text-ui-muted mb-0 small">Prueba otro filtro o crea un producto nuevo desde el formulario.</p>
                </div>
            `;
            return;
        }

        productsList.innerHTML = products.map((product) => `
            <article class="admin-product-item ${product.is_active ? '' : 'is-inactive'}">
                <div class="admin-product-item__top">
                    <div class="admin-product-item__identity">
                        <img src="${attr(product.image_url || 'https://placehold.co/72x72')}" class="admin-product-item__image" alt="${esc(product.name)}">
                        <div>
                            <h3 class="admin-product-item__title">${esc(product.name)}</h3>
                            <div class="small text-ui-muted">${GolazoStore.formatPrice(product.price)}</div>
                        </div>
                    </div>
                    <div class="admin-product-item__actions">
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
                <div class="admin-product-item__meta">
                    <span class="badge ${product.is_active ? 'badge-soft-success' : 'badge-soft-danger'}">${product.is_active ? 'Activo' : 'Inactivo'}</span>
                    <span class="badge ${Number(product.stock || 0) > 0 ? 'badge-soft-neutral' : 'badge-soft-brand'}">${Number(product.stock || 0) > 0 ? `Stock ${product.stock}` : 'Sin stock'}</span>
                    <span class="badge badge-soft-neutral">${getProductImages(product).length} imagen(es)</span>
                    ${product.has_order_references ? '<span class="badge badge-soft-warning">Con historial</span>' : ''}
                </div>
                <p class="admin-product-item__description">${esc(product.description || 'Sin descripcion cargada.')}</p>
                ${productHistoryNotice(product)}
            </article>
        `).join('');
    }

    function renderProductsView() {
        updateFilterCounters(productsCache);
        setActiveFilterButton();
        renderProductsList(getFilteredProducts(productsCache));
    }

    async function loadProducts(reason) {
        if (listLoading) return;

        listLoading = true;
        if (reason) {
            setListStatus(reason, 'info');
            GolazoAdmin.setStatus(stageStatus, reason, 'info');
        }

        try {
            const { response, data } = await GolazoAdmin.authRequest(adminProductsPath, { method: 'GET' });
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudieron cargar productos');
            }

            productsCache = data.products || [];
            renderProductsView();
            setListStatus(`Vista actualizada. ${productsCache.length === 1 ? 'Hay 1 producto en base.' : `Hay ${productsCache.length} productos en base.`}`);
            GolazoAdmin.setStatus(stageStatus, '');
        } catch (error) {
            productsList.innerHTML = '<div class="alert alert-danger mb-0">No se pudieron cargar productos.</div>';
            GolazoAdmin.setNotice(adminNotice, error.message || 'No se pudieron cargar productos.');
            setListStatus('No se pudo refrescar el listado.', 'danger');
        } finally {
            listLoading = false;
        }
    }

    function parseSizesText(formData) {
        const sizes = String(formData.get('sizesText') || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        formData.set('sizes', JSON.stringify(sizes.length ? sizes : ['S', 'M', 'L', 'XL']));
        formData.delete('sizesText');
    }

    function validateSpecifications(specsText) {
        if (!specsText.trim().startsWith('{')) return true;
        try {
            JSON.parse(specsText);
            return true;
        } catch (error) {
            return false;
        }
    }

    resetForm();
    await loadProducts('Cargando catalogo admin...');

    adminFilterBar?.addEventListener('click', function (event) {
        const filterButton = event.target.closest('[data-filter]');
        if (!filterButton) return;
        currentFilter = filterButton.dataset.filter || 'all';
        renderProductsView();
        setListStatus(`Filtro activo: ${filterButton.textContent.trim()}.`);
    });

    document.addEventListener('click', function (event) {
        const quickFilterButton = event.target.closest('[data-quick-filter]');
        if (!quickFilterButton) return;
        currentFilter = quickFilterButton.dataset.quickFilter || 'all';
        renderProductsView();
        setListStatus(`Atajo aplicado: ${quickFilterButton.textContent.trim()}.`);
    });

    productSearch?.addEventListener('input', function () {
        currentSearch = String(this.value || '').trim();
        renderProductsView();
        if (currentSearch) {
            setListStatus(`Busqueda activa: "${currentSearch}".`);
        } else {
            setListStatus('Busqueda limpia. Vista completa restaurada.');
        }
    });

    cancelEditBtn?.addEventListener('click', function () {
        resetForm();
    });

    imageInput?.addEventListener('change', function () {
        renderSelectedImages(this.files);
        if (this.files?.length) {
            setFormStatus(`${this.files.length} archivo(s) listo(s) para subir.`, 'info');
        }
    });

    currentImagePreviewList?.addEventListener('click', function (event) {
        const removeImageButton = event.target.closest('[data-remove-image-index]');
        if (!removeImageButton || !isEditing()) return;
        const index = Number(removeImageButton.dataset.removeImageIndex);
        editingImageUrls = editingImageUrls.filter((_, imageIndex) => imageIndex !== index);
        renderEditingGallery(productForm.querySelector('input[name="name"]').value || 'producto');
        setFormStatus('Galeria actual ajustada. Guarda para confirmar cambios.', 'warning');
    });

    productForm?.addEventListener('submit', async function (event) {
        event.preventDefault();
        GolazoAdmin.setNotice(adminNotice, '');

        const submitBtn = this.querySelector('button[type="submit"]');
        if (!submitBtn || submitBtn.dataset.busy === 'true') return;

        const specsInput = this.querySelector('textarea[name="specifications"]');
        if (specsInput && !validateSpecifications(specsInput.value)) {
            GolazoAdmin.setNotice(adminNotice, 'El JSON de especificaciones es invalido.');
            setFormStatus('Corrige el bloque JSON antes de guardar.', 'danger');
            return;
        }

        GolazoAdmin.setButtonBusy(submitBtn, true, 'Guardando...');
        setFormStatus(isEditing() ? 'Actualizando producto...' : 'Creando producto...', 'info');

        const formData = new FormData(this);
        parseSizesText(formData);

        const editing = isEditing();
        const targetId = productIdInput.value;
        if (editing) {
            formData.set('image_urls', JSON.stringify(editingImageUrls));
        }

        try {
            const { response, data } = await GolazoAdmin.authRequest(editing ? `${adminProductsPath}/${targetId}` : adminProductsPath, {
                method: editing ? 'PUT' : 'POST',
                body: formData
            });

            if (!response.ok || !data.success) {
                throw new Error(data.message || (editing ? 'No se pudo actualizar el producto.' : 'No se pudo crear el producto.'));
            }

            GolazoAdmin.showToast('liveToast', editing ? 'Producto actualizado.' : 'Producto creado correctamente.');
            resetForm();
            await loadProducts('Refrescando listado despues del guardado...');
        } catch (error) {
            GolazoAdmin.setNotice(adminNotice, error.message || 'No se pudo guardar el producto.');
            setFormStatus('La accion no pudo completarse. Revisa el mensaje y vuelve a intentar.', 'danger');
        } finally {
            GolazoAdmin.setButtonBusy(submitBtn, false);
        }
    });

    productsList?.addEventListener('click', async function (event) {
        const editButton = event.target.closest('[data-edit-id]');
        if (editButton) {
            const id = Number(editButton.dataset.editId);
            const product = productsCache.find((item) => Number(item.id) === id);
            if (!product) {
                GolazoAdmin.setNotice(adminNotice, 'No se encontro el producto para editar.');
                return;
            }
            fillForm(product);
            return;
        }

        const toggleActiveButton = event.target.closest('[data-toggle-active-id]');
        if (toggleActiveButton) {
            if (toggleActiveButton.dataset.busy === 'true') return;

            const id = Number(toggleActiveButton.dataset.toggleActiveId);
            const nextActive = String(toggleActiveButton.dataset.nextActive) === 'true';
            const product = productsCache.find((item) => Number(item.id) === id);
            if (!product) {
                GolazoAdmin.setNotice(adminNotice, 'No se encontro el producto para actualizar estado.');
                return;
            }

            const confirmed = window.confirm(nextActive
                ? `Vas a reactivar "${product.name}".`
                : `Vas a desactivar "${product.name}" y dejarlo fuera del catalogo publico.`);
            if (!confirmed) return;

            GolazoAdmin.setButtonBusy(toggleActiveButton, true, nextActive ? 'Reactivando...' : 'Desactivando...');
            setListStatus(`Actualizando estado comercial de "${product.name}"...`, 'info');

            try {
                const { response, data } = await GolazoAdmin.authRequest(`${adminProductsPath}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
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

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo actualizar el estado.');
                }

                GolazoAdmin.showToast('liveToast', nextActive ? 'Producto reactivado.' : 'Producto desactivado.');
                if (isEditing() && Number(productIdInput.value) === id) {
                    resetForm();
                }
                await loadProducts('Refrescando listado despues del cambio de estado...');
            } catch (error) {
                GolazoAdmin.setNotice(adminNotice, error.message || 'No se pudo actualizar el estado del producto.');
                setListStatus('La accion no pudo completarse.', 'danger');
            } finally {
                GolazoAdmin.setButtonBusy(toggleActiveButton, false);
            }
            return;
        }

        const deleteButton = event.target.closest('[data-delete-id]');
        if (!deleteButton) return;
        if (deleteButton.dataset.busy === 'true') return;

        const id = Number(deleteButton.dataset.deleteId);
        const product = productsCache.find((item) => Number(item.id) === id);
        if (!product) {
            GolazoAdmin.setNotice(adminNotice, 'No se encontro el producto para eliminar.');
            return;
        }

        const confirmed = window.confirm(`Vas a eliminar "${product.name}". Esta accion no se puede deshacer.`);
        if (!confirmed) return;

        GolazoAdmin.setButtonBusy(deleteButton, true, 'Eliminando...');
        setListStatus(`Eliminando "${product.name}"...`, 'warning');

        try {
            const { response, data } = await GolazoAdmin.authRequest(`${adminProductsPath}/${id}`, { method: 'DELETE' });
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudo eliminar el producto.');
            }

            GolazoAdmin.showToast('liveToast', 'Producto eliminado.');
            if (isEditing() && Number(productIdInput.value) === id) {
                resetForm();
            }
            await loadProducts('Refrescando listado despues de la eliminacion...');
        } catch (error) {
            GolazoAdmin.setNotice(adminNotice, error.message || 'No se pudo eliminar el producto.');
            setListStatus('La eliminacion no pudo completarse.', 'danger');
        } finally {
            GolazoAdmin.setButtonBusy(deleteButton, false);
        }
    });
});
