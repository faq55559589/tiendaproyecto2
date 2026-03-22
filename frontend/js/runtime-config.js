(function configureRuntime() {
    const hostname = window.location.hostname;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    window.GOLAZOSTORE_CONFIG = window.GOLAZOSTORE_CONFIG || {};
    if (!window.GOLAZOSTORE_CONFIG.apiBase && isLocalHost) {
        window.GOLAZOSTORE_CONFIG.apiBase = 'http://localhost:3000/api';
    }

    if (!window.GOLAZOSTORE_CONFIG.apiBase && !isLocalHost) {
        console.warn('GolazoStore: apiBase no configurada. Define window.GOLAZOSTORE_CONFIG.apiBase o meta golazo-api-base.');
    }
})();
