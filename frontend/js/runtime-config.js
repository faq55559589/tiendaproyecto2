(function configureRuntime() {
    const hostname = window.location.hostname;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const defaultApiBase = isLocalHost
        ? 'http://localhost:3000/api'
        : 'https://api.golazofutstore.com/api';

    window.GOLAZOSTORE_CONFIG = window.GOLAZOSTORE_CONFIG || {};
    if (!window.GOLAZOSTORE_CONFIG.apiBase) {
        window.GOLAZOSTORE_CONFIG.apiBase = defaultApiBase;
    }
})();
