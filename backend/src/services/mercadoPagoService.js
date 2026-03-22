const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { getBackendUrl, getFrontendUrl, getMercadoPagoAccessToken, getMercadoPagoWebhookToken } = require('../config/env');

let cachedAccessToken = null;
let cachedClients = null;

function ensureConfigured() {
    const accessToken = getMercadoPagoAccessToken();
    if (!accessToken) {
        throw new Error('Mercado Pago no esta configurado en el servidor');
    }
    return accessToken;
}

function getClients() {
    const accessToken = ensureConfigured();
    if (cachedClients && cachedAccessToken === accessToken) {
        return cachedClients;
    }

    const client = new MercadoPagoConfig({
        accessToken,
        options: {
            timeout: 5000
        }
    });

    cachedAccessToken = accessToken;
    cachedClients = {
        preference: new Preference(client),
        payment: new Payment(client)
    };

    return cachedClients;
}

function buildErrorMessage(error) {
    const details = Array.isArray(error?.cause) ? error.cause : [];
    const firstDetail = details.find(Boolean) || {};
    const message = firstDetail.description
        || firstDetail.message
        || error?.message
        || 'No se pudo completar la solicitud a Mercado Pago';

    return String(message);
}

function isPublicHttpUrl(value) {
    try {
        const parsed = new URL(String(value || '').trim());
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return false;
        }

        const hostname = String(parsed.hostname || '').toLowerCase();
        return !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
    } catch (error) {
        return false;
    }
}

function buildNotificationUrl() {
    const base = `${getBackendUrl()}/api/orders/mercado-pago/webhook`;
    if (!isPublicHttpUrl(base)) {
        return null;
    }

    const token = getMercadoPagoWebhookToken();
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

function buildFrontendConfirmationUrl() {
    return `${getFrontendUrl()}/confirmacion.html`;
}

function buildReturnUrl(returnStatus) {
    const confirmationUrl = buildFrontendConfirmationUrl();
    if (isPublicHttpUrl(confirmationUrl)) {
        return confirmationUrl;
    }

    const bridgeUrl = `${getBackendUrl()}/api/orders/mercado-pago/return`;
    if (!isPublicHttpUrl(bridgeUrl)) {
        return null;
    }

    const parsed = new URL(bridgeUrl);
    if (returnStatus) {
        parsed.searchParams.set('return_status', String(returnStatus));
    }
    return parsed.toString();
}

function buildBackUrls() {
    const success = buildReturnUrl('approved');
    const pending = buildReturnUrl('pending');
    const failure = buildReturnUrl('failure');

    if (!success || !pending || !failure) {
        return null;
    }

    return {
        success,
        pending,
        failure
    };
}

function normalizeUnitPrice(value) {
    return Number(Number(value || 0).toFixed(2));
}

class MercadoPagoService {
    static isConfigured() {
        return Boolean(String(getMercadoPagoAccessToken() || '').trim());
    }

    static async createPreference({ order, payer }) {
        const items = (order.items || []).map((item) => ({
            id: String(item.product_id || item.id),
            title: item.name || `Producto ${item.product_id || item.id}`,
            quantity: Math.max(1, Number(item.quantity || 1)),
            currency_id: 'UYU',
            unit_price: normalizeUnitPrice(item.price)
        }));

        if (!items.length) {
            throw new Error('La orden no tiene items para enviar a Mercado Pago');
        }

        const notificationUrl = buildNotificationUrl();
        const backUrls = buildBackUrls();
        const payload = {
            items,
            external_reference: String(order.external_reference),
            metadata: {
                order_id: Number(order.id),
                user_id: Number(order.user_id || 0)
            },
            payer: {
                email: payer.email || undefined,
                name: payer.first_name || payer.name || undefined,
                surname: payer.last_name || undefined
            },
            ...(notificationUrl ? { notification_url: notificationUrl } : {}),
            ...(backUrls ? {
                back_urls: backUrls,
                auto_return: 'approved'
            } : {})
        };

        try {
            const { preference } = getClients();
            return await preference.create({
                body: payload,
                requestOptions: {
                    idempotencyKey: `pref-${order.external_reference}`
                }
            });
        } catch (error) {
            throw new Error(buildErrorMessage(error));
        }
    }

    static async getPayment(paymentId) {
        try {
            const { payment } = getClients();
            return await payment.get({
                id: String(paymentId)
            });
        } catch (error) {
            throw new Error(buildErrorMessage(error));
        }
    }
}

module.exports = MercadoPagoService;
