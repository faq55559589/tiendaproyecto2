document.addEventListener('DOMContentLoaded', async function () {
    if (GolazoAuth && GolazoAuth.isLoggedIn()) {
        try {
            await GolazoStore.cart.refresh();
        } catch (error) {
            // El resto de la UI sigue funcionando aunque falle la carga de carrito.
        }
    } else {
        GolazoStore.cart.saveCache([]);
    }

    GolazoStore.ui.bindSearchForms();
    GolazoStore.ui.updateCartBadges();
    setupBackToTop();
    bindContactForm();
});

function setupBackToTop() {
    let button = document.getElementById('backToTop');
    if (!button) {
        button = document.createElement('button');
        button.id = 'backToTop';
        button.type = 'button';
        button.innerHTML = '<i class="fas fa-arrow-up"></i>';
        button.setAttribute('title', 'Volver arriba');
        document.body.appendChild(button);
    }

    window.addEventListener('scroll', function () {
        if (window.scrollY > 320) {
            button.classList.add('show');
        } else {
            button.classList.remove('show');
        }
    });

    button.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function bindContactForm() {
    if (GolazoStore.paths.currentPage() !== 'contacto.html') return;
    const form = document.querySelector('main form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        form.reset();
        GolazoStore.ui.toast('Mensaje enviado. Te responderemos por email.', 'success');
    });
}
