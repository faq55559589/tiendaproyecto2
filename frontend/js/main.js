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
    bindPhoneInputs();
    setupBackToTop();
    bindContactForm();
});

function bindPhoneInputs() {
    document.querySelectorAll('input[type="tel"]').forEach((input) => {
        if (input.dataset.phoneBound === 'true') return;
        input.dataset.phoneBound = 'true';

        const applyFormat = () => {
            input.value = GolazoStore.formatUyPhone(input.value);
        };

        input.addEventListener('input', applyFormat);
        input.addEventListener('blur', applyFormat);
        applyFormat();
    });
}

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

    let ticking = false;
    let isVisible = false;
    const toggleButton = () => {
        const shouldShow = window.scrollY > 320;
        if (shouldShow !== isVisible) {
            button.classList.toggle('show', shouldShow);
            isVisible = shouldShow;
        }
        ticking = false;
    };

    window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(toggleButton);
    }, { passive: true });

    toggleButton();

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
        const name = document.getElementById('contactName')?.value.trim() || '';
        const email = document.getElementById('contactEmail')?.value.trim() || '';
        const subject = document.getElementById('contactSubject')?.value.trim() || 'Consulta desde GolazoStore';
        const message = document.getElementById('contactMessage')?.value.trim() || '';

        const body = [
            `Nombre: ${name || '-'}`,
            `Email: ${email || '-'}`,
            '',
            message
        ].join('\n');

        const mailtoUrl = `mailto:golazofutstore@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
        GolazoStore.ui.toast('Se abrio tu aplicacion de correo para enviar el mensaje.', 'info');
    });
}
