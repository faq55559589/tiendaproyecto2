(function () {
    const STORAGE_KEYS = {
        cart: 'cartItems',
        checkout: 'golazoCheckoutDraft'
    };

    const currency = new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU',
        maximumFractionDigits: 0
    });

    function safeParse(value, fallback) {
        try {
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function normalizeImageUrls(rawValue, primaryImage) {
        const fallback = primaryImage || 'https://placehold.co/600x750/E8E8E8/111111?text=Sin+Imagen';
        let values = [];

        if (Array.isArray(rawValue)) {
            values = rawValue;
        } else if (typeof rawValue === 'string') {
            const trimmed = rawValue.trim();
            if (trimmed) {
                if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
                    const parsed = safeParse(trimmed, []);
                    values = Array.isArray(parsed) ? parsed : [String(parsed)];
                } else {
                    values = trimmed.split(',');
                }
            }
        } else if (rawValue) {
            values = [rawValue];
        }

        const normalized = values
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .filter((url, index, array) => array.indexOf(url) === index);

        if (fallback && !normalized.includes(fallback)) {
            normalized.unshift(fallback);
        }

        return normalized.length ? normalized : [fallback];
    }

    function currentPage() {
        const parts = window.location.pathname.split('/');
        return parts[parts.length - 1] || 'home.html';
    }

    function pagePath(name) {
        return name;
    }

    function normalizeProduct(product) {
        const sizes = Array.isArray(product.sizes)
            ? product.sizes
            : safeParse(product.sizes, []);
        const primaryImage = String(product.image_url || '').trim() || 'https://placehold.co/600x750/E8E8E8/111111?text=Sin+Imagen';
        const normalizedImageUrls = normalizeImageUrls(product.image_urls, primaryImage);

        return {
            ...product,
            price: Number(product.price || 0),
            stock: Number(product.stock || 0),
            sizes: sizes.length ? sizes : ['M'],
            image_url: normalizedImageUrls[0] || primaryImage,
            image_urls: normalizedImageUrls
        };
    }

    function getToken() {
        return localStorage.getItem('token');
    }

    async function fetchJson(url, options) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || 'No se pudo completar la solicitud');
        }
        return data;
    }

    const GolazoStore = {
        config: {
            apiBase: 'http://localhost:3000/api',
            freeShippingThreshold: 12000,
            shippingCost: 1200
        },
        paths: {
            currentPage,
            page: pagePath,
            home: () => pagePath('home.html'),
            catalog: (category) => category ? pagePath(`catalogo.html?cat=${encodeURIComponent(category)}`) : pagePath('catalogo.html'),
            product: (id) => pagePath(`producto.html?id=${id}`),
            cart: () => pagePath('carrito.html'),
            checkout: () => pagePath('checkout.html'),
            confirmation: () => pagePath('confirmacion.html'),
            contact: () => pagePath('contacto.html'),
            login: () => pagePath('login.html'),
            register: () => pagePath('registro.html'),
            profile: () => pagePath('perfil.html'),
            orders: () => pagePath('mis-pedidos.html'),
            adminProducts: () => pagePath('admin-products.html')
        },
        formatPrice(value) {
            return currency.format(Number(value || 0));
        },
        formatPaymentMethod(value) {
            const method = String(value || '').toLowerCase();
            if (method === 'mercado_pago') return 'Mercado Pago';
            if (method === 'instagram') return 'Coordinacion manual';
            return value || 'No definido';
        },
        getCategoryLabel(product) {
            const category = String(product.category_name || '').toLowerCase();
            if (category.includes('retro')) return 'Retro';
            if (category.includes('seleccion')) return 'Selecciones';
            if (category.includes('club')) return 'Clubes';
            return product.category_name || 'Camisetas';
        },
        async api(path, options = {}, requireAuth = false) {
            const token = getToken();
            if (requireAuth && !token) {
                throw new Error('Debes iniciar sesion para continuar');
            }

            const headers = {
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            };

            return fetchJson(`${this.config.apiBase}${path}`, {
                ...options,
                headers
            });
        },
        async getProducts() {
            const data = await this.api('/products');
            return (data.products || []).map(normalizeProduct);
        },
        async getProduct(id) {
            const data = await this.api(`/products/${id}`);
            return normalizeProduct(data.product || {});
        },
        cart: {
            all() {
                return safeParse(localStorage.getItem(STORAGE_KEYS.cart), []);
            },
            saveCache(items) {
                localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(items));
                window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items } }));
            },
            normalizeItems(items) {
                return (items || []).map((item) => ({
                    cart_item_id: Number(item.id),
                    id: Number(item.product_id),
                    name: item.name,
                    price: Number(item.price || 0),
                    quantity: Number(item.quantity || 1),
                    size: item.size || 'M',
                    stock: Number(item.stock || 0),
                    image: item.image_url || 'https://placehold.co/600x750/E8E8E8/111111?text=Sin+Imagen'
                }));
            },
            async refresh() {
                const token = getToken();
                if (!token) {
                    this.saveCache([]);
                    return [];
                }

                const data = await GolazoStore.api('/cart', { method: 'GET' }, true);
                const items = this.normalizeItems(data.items || []);
                this.saveCache(items);
                return items;
            },
            count() {
                return this.all().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            },
            findItem(items, productId, size) {
                return items.find((item) => Number(item.id) === Number(productId) && item.size === size);
            },
            async add(product, quantity, size) {
                const normalizedQuantity = Math.max(1, Number(quantity || 1));
                const normalizedSize = size || 'M';

                const data = await GolazoStore.api('/cart', {
                    method: 'POST',
                    body: JSON.stringify({
                        product_id: Number(product.id),
                        quantity: normalizedQuantity,
                        size: normalizedSize
                    })
                }, true);

                const items = this.normalizeItems(data.items || []);
                this.saveCache(items);
                return items;
            },
            async updateByItemId(itemId, quantity) {
                const data = await GolazoStore.api(`/cart/${itemId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ quantity: Math.max(1, Number(quantity || 1)) })
                }, true);
                const items = this.normalizeItems(data.items || []);
                this.saveCache(items);
                return items;
            },
            async update(productId, size, quantity) {
                const item = this.findItem(this.all(), productId, size);
                if (!item) return this.all();
                return this.updateByItemId(item.cart_item_id, quantity);
            },
            async removeByItemId(itemId) {
                const data = await GolazoStore.api(`/cart/${itemId}`, { method: 'DELETE' }, true);
                const items = this.normalizeItems(data.items || []);
                this.saveCache(items);
                return items;
            },
            async remove(productId, size) {
                const item = this.findItem(this.all(), productId, size);
                if (!item) return this.all();
                return this.removeByItemId(item.cart_item_id);
            },
            async clear() {
                const items = this.all();
                await Promise.all(items.map((item) => this.removeByItemId(item.cart_item_id)));
                this.saveCache([]);
            },
            summary() {
                const items = this.all();
                const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
                const shipping = subtotal === 0 ? 0 : (subtotal >= GolazoStore.config.freeShippingThreshold ? 0 : GolazoStore.config.shippingCost);
                const total = subtotal + shipping;
                return { items, subtotal, shipping, total, count: this.count() };
            }
        },
        orders: {
            normalize(order) {
                const items = (order.items || []).map((item) => ({
                    id: item.id,
                    product_id: item.product_id,
                    name: item.name,
                    image: item.image_url || 'https://placehold.co/600x750/E8E8E8/111111?text=Sin+Imagen',
                    quantity: Number(item.quantity || 0),
                    size: item.size || 'M',
                    price: Number(item.price || 0)
                }));

                return {
                    id: order.id,
                    createdAt: order.created_at || new Date().toISOString(),
                    status: order.status || 'pending_contact',
                    total: Number(order.total_amount || order.total || 0),
                    paymentMethod: order.payment_method || 'instagram',
                    shippingAddress: order.shipping_address || '-',
                    customerName: order.customer_name || '-',
                    customerPhone: order.customer_phone || '-',
                    notes: order.notes || '',
                    items
                };
            },
            async all() {
                const data = await GolazoStore.api('/orders', { method: 'GET' }, true);
                return (data.orders || []).map((order) => this.normalize(order));
            },
            async getById(id) {
                const data = await GolazoStore.api(`/orders/${id}`, { method: 'GET' }, true);
                return this.normalize(data.order || {});
            },
            async create(payload) {
                const customer = payload.customer || {};
                const address = [customer.address, customer.city].filter(Boolean).join(', ');
                const paymentMethod = customer.paymentMethod === 'instagram' ? 'instagram' : 'mercado_pago';
                const contactChannel = paymentMethod === 'instagram' ? 'instagram' : 'mercado_pago';

                const data = await GolazoStore.api('/orders', {
                    method: 'POST',
                    body: JSON.stringify({
                        payment_method: paymentMethod,
                        contact_channel: contactChannel,
                        customer_name: customer.name || null,
                        customer_phone: customer.phone || null,
                        shipping_address: address || null,
                        notes: customer.notes || null
                    })
                }, true);

                return this.normalize(data.order || {});
            }
        },
        checkoutDraft: {
            get() {
                return safeParse(localStorage.getItem(STORAGE_KEYS.checkout), {});
            },
            save(data) {
                localStorage.setItem(STORAGE_KEYS.checkout, JSON.stringify(data));
            },
            clear() {
                localStorage.removeItem(STORAGE_KEYS.checkout);
            }
        },
        ui: {
            toast(message, type) {
                const variant = type || 'info';
                const containerId = 'golazo-toast-container';
                let container = document.getElementById(containerId);
                if (!container) {
                    container = document.createElement('div');
                    container.id = containerId;
                    container.className = 'toast-stack position-fixed top-0 end-0 p-3';
                    container.style.zIndex = '1080';
                    document.body.appendChild(container);
                }

                const toast = document.createElement('div');
                toast.className = `alert alert-${variant} shadow-sm mb-2`;
                toast.innerHTML = message;
                container.appendChild(toast);

                setTimeout(() => {
                    toast.remove();
                }, 3000);
            },
            bindSearchForms() {
                document.querySelectorAll('form[role="search"]').forEach((form) => {
                    if (form.dataset.bound === 'true') return;
                    form.dataset.bound = 'true';
                    form.addEventListener('submit', function (event) {
                        event.preventDefault();
                        const input = this.querySelector('input[type="search"]');
                        const term = input ? input.value.trim() : '';
                        const url = term
                            ? `${GolazoStore.paths.catalog()}?search=${encodeURIComponent(term)}`
                            : GolazoStore.paths.catalog();
                        window.location.href = url;
                    });
                });
            },
            updateCartBadges() {
                const count = GolazoStore.cart.count();
                document.querySelectorAll('[data-cart-count], #cart-count').forEach((badge) => {
                    badge.textContent = count;
                    badge.style.display = count > 0 ? 'inline-flex' : 'none';
                });
            }
        }
    };

    window.GolazoStore = GolazoStore;
})();
