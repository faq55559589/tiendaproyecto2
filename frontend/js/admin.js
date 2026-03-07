document.addEventListener('DOMContentLoaded', async function () {
    const productForm = document.getElementById('productForm');
    const productsList = document.getElementById('productsList');
    const adminNotice = document.getElementById('adminNotice');
    const productIdInput = document.getElementById('productId');
    const productFormTitle = document.getElementById('productFormTitle');
    const productSubmitLabel = document.getElementById('productSubmitLabel');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const currentImageWrap = document.getElementById('currentImageWrap');
    const currentImagePreview = document.getElementById('currentImagePreview');
    const imageHelpText = document.getElementById('imageHelpText');
    const imageInput = productForm?.querySelector('input[name="image"]');
    const API_URL = `${GolazoStore.config.apiBase}/products`;

    let productsCache = [];

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
        currentImagePreview.src = '';
        imageInput.required = true;
        imageHelpText.textContent = 'Formatos permitidos: JPG, PNG, WEBP.';
        productForm.querySelector('input[name="stock"]').value = '1';
        productForm.querySelector('input[name="sizesText"]').value = 'S,M,L,XL';
        productForm.querySelector('select[name="category_id"]').value = '1';
        showNotice('');
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
        imageHelpText.textContent = 'La imagen es opcional al editar. Si subes una nueva, reemplaza la actual.';

        if (product.image_url) {
            currentImagePreview.src = product.image_url;
            currentImageWrap.classList.remove('d-none');
        } else {
            currentImagePreview.src = '';
            currentImageWrap.classList.add('d-none');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function loadProducts() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error('No se pudieron cargar productos');
            }

            productsCache = data.products || [];
            renderProductsList(productsCache);
        } catch (error) {
            productsList.innerHTML = '<div class="alert alert-danger">Error cargando productos.</div>';
        }
    }

    function renderProductsList(products) {
        if (!products.length) {
            productsList.innerHTML = '<div class="alert alert-info">No hay productos cargados aun.</div>';
            return;
        }

        productsList.innerHTML = products.map((product) => `
            <div class="list-group-item d-flex justify-content-between align-items-center gap-3 flex-wrap">
                <div class="d-flex align-items-center gap-3">
                    <img src="${product.image_url || 'https://placehold.co/72x72'}" class="rounded" style="width: 72px; height: 72px; object-fit: cover;" alt="${product.name}">
                    <div>
                        <h6 class="mb-1">${product.name}</h6>
                        <div class="small text-muted">${GolazoStore.formatPrice(product.price)} | Stock: ${product.stock}</div>
                        <div class="small text-muted">${product.description || 'Sin descripcion'}</div>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-secondary" data-edit-id="${product.id}">
                        <i class="fas fa-pen me-1"></i>Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-delete-id="${product.id}">
                        <i class="fas fa-trash me-1"></i>Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    const user = await GolazoAuth.syncSession();
    if (!user) {
        GolazoStore.ui.toast('Inicia sesion para entrar al panel admin.', 'warning');
        setTimeout(() => {
            window.location.href = GolazoStore.paths.login();
        }, 700);
        return;
    }

    if (user.role !== 'admin') {
        showNotice('Tu sesion esta activa, pero tu usuario no tiene rol admin.');
        setTimeout(() => {
            window.location.href = GolazoStore.paths.home();
        }, 1200);
        return;
    }

    resetForm();
    loadProducts();

    cancelEditBtn?.addEventListener('click', function () {
        resetForm();
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
                showNotice('El JSON de especificaciones es invalido.');
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

        try {
            const response = await fetch(editing ? `${API_URL}/${targetId}` : API_URL, {
                method: editing ? 'PUT' : 'POST',
                headers: {
                    Authorization: `Bearer ${getAdminToken()}`
                },
                body: formData
            });

            const data = await response.json().catch(() => ({}));
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
                showNotice('No se encontro el producto para editar.');
                return;
            }
            fillForm(product);
            return;
        }

        const deleteButton = event.target.closest('[data-delete-id]');
        if (!deleteButton) return;

        const id = Number(deleteButton.dataset.deleteId);
        if (!confirm('Seguro que deseas eliminar este producto?')) return;

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
