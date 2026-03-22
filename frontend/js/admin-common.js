(function () {
    function getToastInstance(toastId) {
        const toastEl = document.getElementById(toastId);
        if (!toastEl) return null;
        return {
            element: toastEl,
            body: toastEl.querySelector('.toast-body'),
            title: toastEl.querySelector('[data-admin-toast-title]'),
            instance: new bootstrap.Toast(toastEl)
        };
    }

    function parseJsonResponse(response) {
        return response.text().then((rawText) => {
            if (!rawText) return {};
            try {
                return JSON.parse(rawText);
            } catch (error) {
                return {};
            }
        });
    }

    function setNotice(node, message, level = 'danger') {
        if (!node) return;
        if (!message) {
            node.className = 'alert d-none';
            node.textContent = '';
            return;
        }

        node.className = `alert alert-${level}`;
        node.innerHTML = `<i class="fas fa-circle-exclamation me-2"></i>${GolazoStore.escapeHtml(message)}`;
    }

    function setStatus(node, message, tone = 'muted') {
        if (!node) return;
        if (!message) {
            node.className = 'admin-stage-status d-none';
            node.textContent = '';
            return;
        }

        node.className = `admin-stage-status admin-stage-status--${tone}`;
        node.textContent = message;
    }

    function showToast(toastId, message, title) {
        const toast = getToastInstance(toastId);
        if (!toast) return;
        if (toast.body) {
            toast.body.textContent = message;
        }
        if (toast.title && title) {
            toast.title.textContent = title;
        }
        toast.instance.show();
    }

    function setButtonBusy(button, busy, busyLabel) {
        if (!button) return;

        if (busy) {
            if (!button.dataset.originalHtml) {
                button.dataset.originalHtml = button.innerHTML;
            }
            button.disabled = true;
            button.dataset.busy = 'true';
            button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${GolazoStore.escapeHtml(busyLabel || 'Procesando...')}`;
            return;
        }

        button.disabled = false;
        button.dataset.busy = 'false';
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        }
    }

    async function requireAdmin(options = {}) {
        const user = await GolazoAuth.syncSession();
        if (!user) {
            GolazoStore.ui.toast(options.loginMessage || 'Inicia sesion para entrar al panel admin.', 'warning');
            setTimeout(() => {
                window.location.href = GolazoStore.paths.login();
            }, options.loginDelay || 700);
            return null;
        }

        if (user.role !== 'admin') {
            if (options.noticeNode) {
                setNotice(options.noticeNode, options.deniedMessage || 'Tu sesion esta activa, pero tu usuario no tiene rol admin.');
            }
            setTimeout(() => {
                window.location.href = GolazoStore.paths.home();
            }, options.deniedDelay || 1200);
            return null;
        }

        return user;
    }

    async function authRequest(path, options = {}) {
        const apiBase = GolazoStore.config.apiBase || '';
        const response = await fetch(`${apiBase}${path}`, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${GolazoAuth.getToken()}`
            }
        });
        const data = await parseJsonResponse(response);
        return { response, data };
    }

    window.GolazoAdmin = {
        authRequest,
        parseJsonResponse,
        requireAdmin,
        setButtonBusy,
        setNotice,
        setStatus,
        showToast
    };
})();
