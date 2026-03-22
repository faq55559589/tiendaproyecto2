const DEFAULT_DEV_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:8080',
    'http://localhost:8000'
];

function isProduction() {
    return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function isTruthy(value) {
    return String(value || '').trim().toLowerCase() === 'true';
}

function parseCsv(value) {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseUrlOrThrow(name, value) {
    const normalized = String(value || '').trim().replace(/\/+$/, '');

    if (!normalized) {
        throw new Error(`Falta ${name} en variables de entorno`);
    }

    let parsed;
    try {
        parsed = new URL(normalized);
    } catch (error) {
        throw new Error(`${name} no es una URL valida`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`${name} debe usar http o https`);
    }

    return {
        normalized,
        parsed
    };
}

function assertPublicUrl(name, value) {
    const { normalized, parsed } = parseUrlOrThrow(name, value);
    const hostname = String(parsed.hostname || '').toLowerCase();

    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname)) {
        throw new Error(`${name} no puede apuntar a localhost en produccion`);
    }

    if (parsed.protocol !== 'https:') {
        throw new Error(`${name} debe usar https en produccion`);
    }

    return normalized;
}

function hasEmailProviderConfig() {
    const hasBrevoApiConfig = Boolean(String(process.env.BREVO_API_KEY || '').trim());
    const hasSmtpConfig = Boolean(
        String(process.env.SMTP_HOST || '').trim() &&
        String(process.env.SMTP_PORT || '').trim() &&
        String(process.env.SMTP_USER || '').trim() &&
        String(process.env.SMTP_PASS || '').trim()
    );
    const hasGmailConfig = Boolean(
        String(process.env.EMAIL_USER || '').trim() &&
        String(process.env.EMAIL_PASS || '').replace(/\s+/g, '')
    );

    return hasBrevoApiConfig || hasSmtpConfig || hasGmailConfig;
}

function getAllowedOrigins() {
    const envOrigins = parseCsv(process.env.CORS_ORIGINS);
    if (envOrigins.length > 0) {
        if (isProduction()) {
            envOrigins.forEach((origin) => {
                assertPublicUrl('CORS_ORIGINS', origin);
            });
        }
        return envOrigins;
    }

    if (isProduction()) {
        throw new Error('Falta CORS_ORIGINS en variables de entorno para produccion');
    }

    return DEFAULT_DEV_ORIGINS;
}

function getJwtSecret() {
    const jwtSecret = String(process.env.JWT_SECRET || '').trim();

    if (!jwtSecret) {
        throw new Error('Falta JWT_SECRET en variables de entorno');
    }

    if (jwtSecret === 'dev-jwt-secret-change-me') {
        throw new Error('JWT_SECRET inseguro: cambia el valor por uno robusto');
    }

    return jwtSecret;
}

function assertProductionConfig() {
    if (!isProduction()) {
        return;
    }

    const required = ['FRONTEND_URL', 'BACKEND_URL', 'EMAIL_FROM'];
    const missing = required.filter((name) => !String(process.env[name] || '').trim());

    if (missing.length > 0) {
        throw new Error(`Faltan variables requeridas para produccion: ${missing.join(', ')}`);
    }

    assertPublicUrl('FRONTEND_URL', process.env.FRONTEND_URL);
    assertPublicUrl('BACKEND_URL', process.env.BACKEND_URL);

    if (isTruthy(process.env.EMAIL_REQUIRED) && !hasEmailProviderConfig()) {
        throw new Error('EMAIL_REQUIRED=true exige configurar BREVO_API_KEY o SMTP_* o EMAIL_USER/EMAIL_PASS');
    }
}

function getFrontendUrl() {
    const fallback = 'http://localhost:8000/frontend';
    if (isProduction()) {
        return assertPublicUrl('FRONTEND_URL', process.env.FRONTEND_URL);
    }

    return parseUrlOrThrow('FRONTEND_URL', process.env.FRONTEND_URL || fallback).normalized;
}

function getBackendUrl() {
    const fallback = 'http://localhost:3000';
    if (isProduction()) {
        return assertPublicUrl('BACKEND_URL', process.env.BACKEND_URL);
    }

    return parseUrlOrThrow('BACKEND_URL', process.env.BACKEND_URL || fallback).normalized;
}

function getMercadoPagoAccessToken() {
    return String(process.env.MP_ACCESS_TOKEN || '').trim();
}

function getMercadoPagoPublicKey() {
    return String(process.env.MP_PUBLIC_KEY || '').trim();
}

function getMercadoPagoWebhookToken() {
    return String(process.env.MP_WEBHOOK_TOKEN || '').trim();
}

function getMercadoPagoOrderExpirationMinutes() {
    return Math.max(1, Number(process.env.MP_ORDER_EXPIRATION_MINUTES || 30));
}

function isMercadoPagoConfigured() {
    return Boolean(getMercadoPagoAccessToken());
}

module.exports = {
    getAllowedOrigins,
    getJwtSecret,
    assertProductionConfig,
    getFrontendUrl,
    getBackendUrl,
    hasEmailProviderConfig,
    getMercadoPagoAccessToken,
    getMercadoPagoPublicKey,
    getMercadoPagoWebhookToken,
    getMercadoPagoOrderExpirationMinutes,
    isMercadoPagoConfigured
};
