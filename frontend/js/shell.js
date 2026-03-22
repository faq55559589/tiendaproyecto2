(function () {
    function getUser() {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch (error) {
            return null;
        }
    }

    function isLoggedIn() {
        return Boolean(localStorage.getItem('token') && getUser());
    }

    function currentPage() {
        return GolazoStore.paths.currentPage();
    }

    function isActive(pageName) {
        const page = currentPage();
        if (pageName === 'catalogo.html') return page === 'catalogo.html' || page === 'producto.html';
        return page === pageName;
    }

    function renderHeader() {
        const header = document.querySelector('header');
        if (!header) return;
        const user = getUser();
        const isAdmin = Boolean(user && user.role === 'admin');
        const displayName = user ? GolazoStore.escapeHtml(user.first_name || 'Mi cuenta') : '';
        const avatarMarkup = user ? GolazoStore.renderAvatarMarkup(user, {
            className: 'nav-user-avatar',
            size: 38,
            alt: `Avatar de ${user.first_name || 'usuario'}`
        }) : '';
        const adminPrimaryLink = isAdmin
            ? `<a class="nav-link ${(isActive('admin-products.html') || isActive('admin-orders.html') || isActive('admin-users.html')) ? 'active' : ''}" href="${GolazoStore.paths.adminProducts()}"><i class="fas fa-shield-halved"></i> Admin</a>`
            : '';
        const userMenu = isLoggedIn() && user
            ? `
                <div class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" data-bs-toggle="dropdown" aria-expanded="false">
                        <span class="me-2 d-inline-flex">${avatarMarkup}</span>${displayName}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                        <li><a class="dropdown-item account-menu-link" href="${GolazoStore.paths.profile()}"><i class="fas fa-user icon-accent"></i><span>Mi perfil</span></a></li>
                        <li><a class="dropdown-item account-menu-link" href="${GolazoStore.paths.orders()}"><i class="fas fa-box icon-accent"></i><span>Mis pedidos</span></a></li>
                        <li><a class="dropdown-item account-menu-link" href="${GolazoStore.paths.cart()}"><i class="fas fa-cart-shopping icon-accent"></i><span>Carrito</span></a></li>
                        ${isAdmin ? `<li><a class="dropdown-item account-menu-link" href="${GolazoStore.paths.adminProducts()}"><i class="fas fa-shirt icon-accent"></i><span>Admin productos</span></a></li>` : ''}
                        ${isAdmin ? `<li><a class="dropdown-item account-menu-link" href="${GolazoStore.paths.adminOrders()}"><i class="fas fa-receipt icon-accent"></i><span>Admin pedidos</span></a></li>` : ''}
                        ${isAdmin ? `<li><a class="dropdown-item account-menu-link" href="${GolazoStore.paths.adminUsers()}"><i class="fas fa-users icon-accent"></i><span>Admin usuarios</span></a></li>` : ''}
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger account-menu-link" href="#" data-auth-logout><i class="fas fa-sign-out-alt"></i><span>Cerrar sesión</span></a></li>
                    </ul>
                </div>
            `
            : `
                <a class="nav-link ${isActive('login.html') ? 'active' : ''}" href="${GolazoStore.paths.login()}"><i class="fas fa-user"></i> Iniciar sesión</a>
                <a class="nav-link ${isActive('registro.html') ? 'active' : ''}" href="${GolazoStore.paths.register()}"><i class="fas fa-user-plus"></i> Registrarse</a>
            `;

        header.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark fixed-top app-navbar">
                <div class="container-fluid">
                    <a class="navbar-brand d-flex align-items-center" href="${GolazoStore.paths.home()}">
                        <img src="assets/images/logo.png" alt="Golazo FutStore" height="48" class="me-2">
                        <span class="fw-bold brand-wordmark">Golazo FutStore</span>
                    </a>
                    <button class="btn btn-outline-brand me-2 me-lg-3 categories-toggle" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasCategories">
                        <i class="fas fa-bars"></i>Categorías
                    </button>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarContent">
                        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                            <li class="nav-item"><a class="nav-link ${isActive('home.html') ? 'active' : ''}" href="${GolazoStore.paths.home()}"><i class="fas fa-house"></i> Inicio</a></li>
                            <li class="nav-item"><a class="nav-link ${isActive('catalogo.html') ? 'active' : ''}" href="${GolazoStore.paths.catalog()}"><i class="fas fa-store"></i> Catálogo</a></li>
                            <li class="nav-item"><a class="nav-link ${isActive('contacto.html') ? 'active' : ''}" href="${GolazoStore.paths.contact()}"><i class="fas fa-envelope"></i> Contacto</a></li>
                            ${adminPrimaryLink}
                        </ul>
                        <form class="d-flex mx-auto app-search" role="search">
                            <input class="form-control me-2" type="search" placeholder="Buscar club, selección o camiseta">
                            <button class="btn btn-outline-brand" type="submit"><i class="fas fa-search"></i></button>
                        </form>
                        <div class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
                            ${userMenu}
                            <a class="nav-link position-relative ${isActive('carrito.html') || isActive('checkout.html') || isActive('confirmacion.html') ? 'active' : ''}" href="${GolazoStore.paths.cart()}">
                                <i class="fas fa-cart-shopping"></i> Carrito
                                <span class="badge bg-danger rounded-pill" id="cart-count" data-cart-count>0</span>
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        const logout = header.querySelector('[data-auth-logout]');
        if (logout) {
            logout.addEventListener('click', function (event) {
                event.preventDefault();
                if (window.GolazoAuth) {
                    window.GolazoAuth.logout();
                }
            });
        }
    }

    function renderFooter() {
        const footer = document.querySelector('footer');
        if (!footer) return;
        footer.className = 'site-footer bg-dark text-white pt-5 pb-4 mt-5';
        footer.innerHTML = `
            <div class="container text-center text-md-start">
                <div class="row g-4">
                    <div class="col-md-4">
                        <h5 class="text-uppercase fw-bold footer-title">Golazo FutStore</h5>
                        <p class="mb-3">Camisetas de clubes y selecciones para hinchas que quieren comprar con claridad, confianza y estilo.</p>
                        <a class="btn btn-outline-light btn-sm footer-ig-btn" href="${GolazoStore.getInstagramProfileUrl()}" target="_blank" rel="noreferrer">
                            <i class="fab fa-instagram me-2"></i>Seguinos en Instagram
                        </a>
                    </div>
                    <div class="col-md-4">
                        <h5 class="text-uppercase fw-bold footer-title">Navegación</h5>
                        <p class="mb-2"><a class="footer-link" href="${GolazoStore.paths.home()}">Inicio</a></p>
                        <p class="mb-2"><a class="footer-link" href="${GolazoStore.paths.catalog()}">Catálogo</a></p>
                        <p class="mb-0"><a class="footer-link" href="${GolazoStore.paths.contact()}">Contacto</a></p>
                    </div>
                    <div class="col-md-4">
                        <h5 class="text-uppercase fw-bold footer-title">Compra con confianza</h5>
                        <p class="mb-2">Envíos dentro de Montevideo</p>
                        <p class="mb-2">Atención directa para resolver dudas</p>
                        <p class="mb-0">Coordinación simple por Instagram para acompañarte en cada pedido</p>
                    </div>
                </div>
                <hr class="my-4 border-secondary">
                <p class="mb-0 text-center small">© 2026 Golazo FutStore. Futbol, identidad y camisetas para vestir tus colores.</p>
            </div>
        `;
    }

    function renderOffcanvas() {
        let offcanvas = document.getElementById('offcanvasCategories');
        if (!offcanvas) {
            offcanvas = document.createElement('div');
            document.body.appendChild(offcanvas);
        }
        offcanvas.outerHTML = `
            <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasCategories" aria-labelledby="offcanvasCategoriesLabel">
                <div class="offcanvas-header">
                    <h5 class="offcanvas-title" id="offcanvasCategoriesLabel">Explorar tienda</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div class="offcanvas-body">
                    <div class="mb-3">
                        <div class="small text-uppercase text-ui-muted fw-semibold mb-2">Categorias</div>
                        <div class="d-grid gap-2">
                            <a href="${GolazoStore.paths.catalog()}" class="btn btn-outline-brand btn-sm text-start offcanvas-category-link">Todas las camisetas</a>
                            <a href="${GolazoStore.paths.catalog('Retro')}" class="btn btn-outline-brand btn-sm text-start offcanvas-category-link">Retro</a>
                            <a href="${GolazoStore.paths.catalog('Actuales')}" class="btn btn-outline-brand btn-sm text-start offcanvas-category-link">Actuales</a>
                            <a href="${GolazoStore.paths.catalog('Selecciones')}" class="btn btn-outline-brand btn-sm text-start offcanvas-category-link">Selecciones</a>
                            <a href="${GolazoStore.paths.catalog('Clubes')}" class="btn btn-outline-brand btn-sm text-start offcanvas-category-link">Clubes</a>
                        </div>
                    </div>
                    <ul class="list-group list-group-flush offcanvas-categories-list">
                        <li class="list-group-item"><a href="${GolazoStore.paths.cart()}" class="text-decoration-none text-dark offcanvas-category-link"><i class="fas fa-cart-shopping"></i><span>Mi carrito</span></a></li>
                        ${getUser() && getUser().role === 'admin' ? `<li class="list-group-item"><a href="${GolazoStore.paths.adminProducts()}" class="text-decoration-none text-dark offcanvas-category-link"><i class="fas fa-shirt"></i><span>Admin productos</span></a></li>` : ''}
                        ${getUser() && getUser().role === 'admin' ? `<li class="list-group-item"><a href="${GolazoStore.paths.adminOrders()}" class="text-decoration-none text-dark offcanvas-category-link"><i class="fas fa-receipt"></i><span>Admin pedidos</span></a></li>` : ''}
                        ${getUser() && getUser().role === 'admin' ? `<li class="list-group-item"><a href="${GolazoStore.paths.adminUsers()}" class="text-decoration-none text-dark offcanvas-category-link"><i class="fas fa-users"></i><span>Admin usuarios</span></a></li>` : ''}
                        <li class="list-group-item"><a href="${GolazoStore.getInstagramProfileUrl()}" class="text-decoration-none text-dark offcanvas-category-link" target="_blank" rel="noreferrer"><i class="fab fa-instagram"></i><span>Instagram</span></a></li>
                        <li class="list-group-item"><a href="${GolazoStore.paths.contact()}" class="text-decoration-none text-dark offcanvas-category-link"><i class="fas fa-headset"></i><span>Hablar con soporte</span></a></li>
                    </ul>
                </div>
            </div>
        `;
    }

    function normalizeBreadcrumbs() {
        const homeLinks = document.querySelectorAll('.breadcrumb a[href="index.html"], .breadcrumb a[href="home.html"]');
        homeLinks.forEach((link) => {
            link.setAttribute('href', GolazoStore.paths.home());
            if (!link.textContent.trim()) {
                link.textContent = 'Inicio';
            }
        });
    }

    function initShell() {
        renderHeader();
        renderFooter();
        renderOffcanvas();
        normalizeBreadcrumbs();
        GolazoStore.ui.bindSearchForms();
        GolazoStore.ui.updateCartBadges();
    }

    document.addEventListener('DOMContentLoaded', initShell);
    window.addEventListener('cart:updated', () => GolazoStore.ui.updateCartBadges());
    window.GolazoShell = { init: initShell };
})();
