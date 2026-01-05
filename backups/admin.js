document.addEventListener('DOMContentLoaded', function () {

    const productForm = document.getElementById('productForm');
    const productsList = document.getElementById('productsList');
    const API_URL = 'http://localhost:3000/api/products';

    // Cargar productos al iniciar
    loadProducts();

    // Manejar envío del formulario
    productForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subiendo...';

        // Validar JSON de especificaciones si existe
        const specsInput = this.querySelector('textarea[name="specifications"]');
        if (specsInput && specsInput.value.trim().startsWith('{')) {
            try {
                JSON.parse(specsInput.value);
            } catch (e) {
                alert('El formato JSON de especificaciones es inválido. Por favor corrígelo o usa texto plano.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
        }

        const formData = new FormData(this);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData // Fetch maneja automáticamente el Content-Type para FormData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast('Producto creado exitosamente');
                productForm.reset();
                loadProducts(); // Recargar lista
            } else {
                throw new Error(data.message || 'Error al subir producto');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // Función para cargar productos
    async function loadProducts() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            if (data.success) {
                renderProductsList(data.products);
            }
        } catch (error) {
            console.error('Error cargando lista:', error);
            productsList.innerHTML = '<div class="alert alert-danger">Error cargando productos</div>';
        }
    }

    function renderProductsList(products) {
        if (products.length === 0) {
            productsList.innerHTML = '<div class="alert alert-info">No hay productos cargados aún.</div>';
            return;
        }

        productsList.innerHTML = '';
        products.forEach(p => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${p.image_url || 'https://placehold.co/50'}" class="rounded me-3" style="width: 50px; height: 50px; object-fit: cover;">
                    <div>
                        <h6 class="mb-0">${p.name}</h6>
                        <small class="text-muted">$${p.price} | Stock: ${p.stock}</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            productsList.appendChild(item);
        });
    }

    // Función global para eliminar (simple)
    window.deleteProduct = async function (id) {
        if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                loadProducts();
            } else {
                alert('Error al eliminar');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    };

    function showToast(message) {
        const toastEl = document.getElementById('liveToast');
        const toastBody = toastEl.querySelector('.toast-body');
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

});
