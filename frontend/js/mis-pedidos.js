// ========================================
// GolazoStore - Mis Pedidos
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Verificar autenticación
    if (!GolazoAuth.isLoggedIn()) {
        GolazoAuth.showToast('Debés iniciar sesión para ver tus pedidos', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const user = GolazoAuth.getCurrentUser();
    loadUserInfo(user);
    loadOrders();
});

// Cargar info del usuario en sidebar
function loadUserInfo(user) {
    if (!user) return;
    document.getElementById('profileName').textContent = `${user.first_name} ${user.last_name || ''}`;
    document.getElementById('profileEmail').textContent = user.email;
}

// Cargar pedidos del usuario
async function loadOrders() {
    // Por ahora mostramos pedidos de ejemplo desde localStorage
    // Cuando se implemente el backend de pedidos, se cargarán desde la API
    
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Si no hay pedidos, crear uno de demostración
    if (orders.length === 0) {
        orders = [
            {
                id: 1001,
                date: '2025-12-05T14:30:00',
                status: 'entregado',
                items: [
                    {
                        name: 'Argentina 1986 Retro - Maradona',
                        price: 4500,
                        quantity: 1,
                        size: 'M',
                        image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&h=100&fit=crop'
                    }
                ],
                total: 4500,
                address: 'Av. 18 de Julio 1234, Montevideo'
            },
            {
                id: 1002,
                date: '2025-12-08T10:15:00',
                status: 'enviado',
                trackingCode: 'UY-2025-78432',
                items: [
                    {
                        name: 'Real Madrid 2024/25 Local',
                        price: 5200,
                        quantity: 1,
                        size: 'L',
                        image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=100&h=100&fit=crop'
                    },
                    {
                        name: 'Barcelona 2024/25 Visitante',
                        price: 5200,
                        quantity: 1,
                        size: 'M',
                        image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=100&h=100&fit=crop'
                    }
                ],
                total: 10400,
                address: 'Rambla República de México 5678, Montevideo'
            },
            {
                id: 1003,
                date: new Date().toISOString(),
                status: 'pendiente',
                items: [
                    {
                        name: 'Uruguay 2024 Copa América',
                        price: 4800,
                        quantity: 2,
                        size: 'S',
                        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&h=100&fit=crop'
                    }
                ],
                total: 9600,
                address: 'Bulevar Artigas 1456, Montevideo'
            }
        ];
        localStorage.setItem('orders', JSON.stringify(orders));
    }
    
    const emptyOrders = document.getElementById('emptyOrders');
    const ordersList = document.getElementById('ordersList');
    const ordersCount = document.getElementById('ordersCount');
    
    if (orders.length === 0) {
        emptyOrders.classList.remove('d-none');
        ordersList.classList.add('d-none');
        ordersCount.textContent = '0 pedidos';
        return;
    }
    
    emptyOrders.classList.add('d-none');
    ordersList.classList.remove('d-none');
    ordersCount.textContent = `${orders.length} pedido${orders.length > 1 ? 's' : ''}`;
    
    // Renderizar pedidos
    ordersList.innerHTML = orders.map(order => renderOrder(order)).join('');
}

// Renderizar un pedido
function renderOrder(order) {
    const statusColors = {
        'pendiente': 'warning',
        'pagado': 'info',
        'enviado': 'primary',
        'entregado': 'success',
        'cancelado': 'danger'
    };
    
    const statusIcons = {
        'pendiente': 'clock',
        'pagado': 'credit-card',
        'enviado': 'truck',
        'entregado': 'check-circle',
        'cancelado': 'times-circle'
    };
    
    const statusColor = statusColors[order.status] || 'secondary';
    const statusIcon = statusIcons[order.status] || 'question-circle';
    
    const orderDate = new Date(order.date).toLocaleDateString('es-UY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const itemsHtml = order.items.map(item => `
        <div class="d-flex align-items-center mb-2">
            <img src="${item.image || 'assets/images/placeholder.jpg'}" 
                 alt="${item.name}" 
                 class="rounded me-3" 
                 style="width: 50px; height: 50px; object-fit: cover;">
            <div class="flex-grow-1">
                <p class="mb-0 fw-bold">${item.name}</p>
                <small class="text-muted">Talle: ${item.size || 'M'} | Cantidad: ${item.quantity}</small>
            </div>
            <span class="fw-bold">$${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join('');
    
    return `
        <div class="card mb-3 border-${statusColor}">
            <div class="card-header bg-${statusColor} bg-opacity-10 d-flex justify-content-between align-items-center">
                <div>
                    <strong>Pedido #${order.id}</strong>
                    <span class="text-muted ms-3">${orderDate}</span>
                </div>
                <span class="badge bg-${statusColor}">
                    <i class="fas fa-${statusIcon} me-1"></i>
                    ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
            </div>
            <div class="card-body">
                ${itemsHtml}
                <hr>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="text-muted">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${order.address || 'Dirección no especificada'}
                        </small>
                    </div>
                    <div class="text-end">
                        <span class="text-muted">Total:</span>
                        <span class="fs-5 fw-bold text-danger ms-2">$${order.total.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            ${order.status === 'enviado' ? `
                <div class="card-footer bg-transparent">
                    <small class="text-muted">
                        <i class="fas fa-truck me-1"></i>
                        Código de seguimiento: <strong>${order.trackingCode || 'No disponible'}</strong>
                    </small>
                </div>
            ` : ''}
        </div>
    `;
}

// Función para crear un pedido de prueba (solo para desarrollo)
function createTestOrder() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    const newOrder = {
        id: 1000 + orders.length + 1,
        date: new Date().toISOString(),
        status: 'pendiente',
        items: [
            {
                name: 'Argentina 1986 Retro',
                price: 4500,
                quantity: 1,
                size: 'M',
                image: 'assets/images/products/argentina-86.jpg'
            }
        ],
        total: 4500,
        address: 'Montevideo, Uruguay'
    };
    
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    loadOrders();
    GolazoAuth.showToast('Pedido de prueba creado', 'success');
}

// Exportar para uso en consola durante desarrollo
window.createTestOrder = createTestOrder;
