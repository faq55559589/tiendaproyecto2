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
        const adminPrimaryLink = isAdmin
            ? `<a class="nav-link ${isActive('admin-products.html') ? 'active' : ''}" href="${GolazoStore.paths.adminProducts()}"><i class="fas fa-shield-halved"></i> Admin</a>`
            : '';
        const userMenu = isLoggedIn() && user
            ? `
                <div class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle me-2"></i>${user.first_name || 'Mi cuenta'}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                        <li><a class="dropdown-item" href="${GolazoStore.paths.profile()}"><i class="fas fa-user me-2 text-danger"></i>Mi perfil</a></li>
                        <li><a class="dropdown-item" href="${GolazoStore.paths.orders()}"><i class="fas fa-box me-2 text-danger"></i>Mis pedidos</a></li>
                        <li><a class="dropdown-item" href="${GolazoStore.paths.cart()}"><i class="fas fa-cart-shopping me-2 text-danger"></i>Carrito</a></li>
                        ${isAdmin ? `<li><a class="dropdown-item" href="${GolazoStore.paths.adminProducts()}"><i class="fas fa-shield-halved me-2 text-danger"></i>Panel admin</a></li>` : ''}
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" data-auth-logout><i class="fas fa-sign-out-alt me-2"></i>Cerrar sesion</a></li>
                    </ul>
                </div>
            `
            : `
                <a class="nav-link ${isActive('login.html') ? 'active' : ''}" href="${GolazoStore.paths.login()}"><i class="fas fa-user"></i> Iniciar sesion</a>
                <a class="nav-link ${isActive('registro.html') ? 'active' : ''}" href="${GolazoStore.paths.register()}"><i class="fas fa-user-plus"></i> Registrarse</a>
            `;

        header.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark fixed-top app-navbar">
                <div class="container-fluid">
                    <a class="navbar-brand d-flex align-items-center" href="${GolazoStore.paths.home()}">
                        <img src="assets/images/logo.png" alt="GolazoStore" height="48" class="me-2">
                        <span class="fw-bold brand-wordmark">GolazoStore</span>
                    </a>
                    <button class="btn btn-outline-danger d-none d-lg-inline-flex me-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasCategories">
                        <i class="fas fa-bars me-2"></i>Categorias
                    </button>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarContent">
                        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                            <li class="nav-item"><a class="nav-link ${isActive('home.html') ? 'active' : ''}" href="${GolazoStore.paths.home()}"><i class="fas fa-house"></i> Inicio</a></li>
                            <li class="nav-item"><a class="nav-link ${isActive('catalogo.html') ? 'active' : ''}" href="${GolazoStore.paths.catalog()}"><i class="fas fa-store"></i> Catalogo</a></li>
                            <li class="nav-item"><a class="nav-link ${window.location.search.includes('cat=shorts') ? 'active' : ''}" href="${GolazoStore.paths.catalog('shorts')}"><i class="fas fa-person-running"></i> Shorts</a></li>
                            <li class="nav-item"><a class="nav-link ${isActive('contacto.html') ? 'active' : ''}" href="${GolazoStore.paths.contact()}"><i class="fas fa-envelope"></i> Contacto</a></li>
                            ${adminPrimaryLink}
                        </ul>
                        <form class="d-flex mx-auto app-search" role="search">
                            <input class="form-control me-2" type="search" placeholder="Buscar camiseta o equipo">
                            <button class="btn btn-outline-danger" type="submit"><i class="fas fa-search"></i></button>
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
                        <h5 class="text-uppercase fw-bold footer-title">GolazoStore</h5>
                        <p class="mb-0">Tienda online de camisetas y coleccionables de futbol con un flujo de compra claro, rapido y responsive.</p>
                    </div>
                    <div class="col-md-4">
                        <h5 class="text-uppercase fw-bold footer-title">Navegacion</h5>
                        <p class="mb-2"><a class="footer-link" href="${GolazoStore.paths.home()}">Inicio</a></p>
                        <p class="mb-2"><a class="footer-link" href="${GolazoStore.paths.catalog()}">Catalogo</a></p>
                        <p class="mb-2"><a class="footer-link" href="${GolazoStore.paths.catalog('shorts')}">Shorts</a></p>
                        <p class="mb-0"><a class="footer-link" href="${GolazoStore.paths.contact()}">Contacto</a></p>
                    </div>
                    <div class="col-md-4">
                        <h5 class="text-uppercase fw-bold footer-title">Compra segura</h5>
                        <p class="mb-2">Envios a todo Uruguay</p>
                        <p class="mb-2">Soporte por email y WhatsApp</p>
                        <p class="mb-0">Coordinacion de pago por Instagram para el MVP</p>
                    </div>
                </div>
                <hr class="my-4 border-secondary">
                <p class="mb-0 text-center small">© 2026 GolazoStore. Frontend alineado al MVP operativo.</p>
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
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item"><a href="${GolazoStore.paths.catalog()}" class="text-decoration-none text-dark"><i class="fas fa-shirt me-2"></i>Todas las camisetas</a></li>
                        <li class="list-group-item"><a href="${GolazoStore.paths.catalog('shorts')}" class="text-decoration-none text-dark"><i class="fas fa-person-running me-2"></i>Shorts</a></li>
                        <li class="list-group-item"><a href="${GolazoStore.paths.cart()}" class="text-decoration-none text-dark"><i class="fas fa-cart-shopping me-2"></i>Mi carrito</a></li>
                        ${getUser() && getUser().role === 'admin' ? `<li class="list-group-item"><a href="${GolazoStore.paths.adminProducts()}" class="text-decoration-none text-dark"><i class="fas fa-shield-halved me-2"></i>Panel admin</a></li>` : ''}
                        <li class="list-group-item"><a href="${GolazoStore.paths.contact()}" class="text-decoration-none text-dark"><i class="fas fa-headset me-2"></i>Hablar con soporte</a></li>
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
