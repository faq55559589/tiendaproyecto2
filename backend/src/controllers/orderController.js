const path = require('path');
const Order = require('../models/Order');
const MercadoPagoService = require('../services/mercadoPagoService');
const { getFrontendUrl, getMercadoPagoWebhookToken, getMercadoPagoOrderExpirationMinutes } = require('../config/env');

const VALID_STATUSES = new Set(['pending_contact', 'confirmed', 'cancelled', 'delivered']);
const VALID_PAYMENT_METHODS = new Set(['instagram', 'mercado_pago']);
const DEFAULT_PAYMENT_STATUSES = {
    instagram: 'pending_contact',
    mercado_pago: 'pending_payment'
};
const INSTAGRAM_ORDER_EXPIRATION_HOURS = Math.max(1, Number(process.env.INSTAGRAM_ORDER_EXPIRATION_HOURS || 12));
const MERCADO_PAGO_ORDER_EXPIRATION_MINUTES = getMercadoPagoOrderExpirationMinutes();

function buildFrontendPageUrl(pageName) {
    const frontendBase = new URL(getFrontendUrl());
    const currentPath = String(frontendBase.pathname || '/');
    const basePath = /\/[^/]+\.html$/i.test(currentPath)
        ? currentPath.replace(/\/[^/]+\.html$/i, '/')
        : `${currentPath.replace(/\/+$/, '')}/`;

    frontendBase.pathname = path.posix.join(basePath, pageName);
    frontendBase.search = '';
    frontendBase.hash = '';
    return frontendBase;
}

function expirePendingOrders() {
    return Order.expirePendingOrders();
}

class OrderController {
    static create(req, res) {
        try {
            expirePendingOrders();
            const body = req.body || {};
            const status = body.status || 'pending_contact';

            if (!VALID_STATUSES.has(status)) {
                return res.status(400).json({ success: false, message: 'Estado de pedido invalido' });
            }

            const paymentMethod = body.payment_method || 'instagram';
            if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
                return res.status(400).json({ success: false, message: 'Metodo de pago invalido' });
            }

            const paymentStatus = body.payment_status || DEFAULT_PAYMENT_STATUSES[paymentMethod];
            const expiresAt = paymentMethod === 'instagram'
                ? Order.buildExpirationDate(INSTAGRAM_ORDER_EXPIRATION_HOURS)
                : Order.buildExpirationDateMinutes(MERCADO_PAGO_ORDER_EXPIRATION_MINUTES);
            const externalReference = paymentMethod === 'mercado_pago'
                ? Order.buildExternalReference(req.user.id)
                : null;

            const order = Order.createFromCart(req.user.id, {
                status,
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                external_reference: externalReference,
                expires_at: expiresAt,
                contact_channel: body.contact_channel || 'instagram',
                customer_name: body.customer_name || null,
                customer_phone: body.customer_phone || null,
                shipping_address: body.shipping_address || null,
                notes: body.notes || null
            });

            if (!order) {
                return res.status(400).json({ success: false, message: 'El carrito esta vacio' });
            }

            if (order && order.error === 'INSUFFICIENT_STOCK') {
                return res.status(400).json({
                    success: false,
                    message: order.message || 'Stock insuficiente para uno o mas productos'
                });
            }

            return res.status(201).json({ success: true, order });
        } catch (error) {
            console.error('Error creando pedido:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static getMine(req, res) {
        try {
            expirePendingOrders();
            const orders = Order.getByUser(req.user.id);
            return res.json({ success: true, orders });
        } catch (error) {
            console.error('Error listando pedidos del usuario:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static getById(req, res) {
        try {
            expirePendingOrders();
            const order = Order.getById(Number(req.params.id), req.user.id);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
            }
            return res.json({ success: true, order });
        } catch (error) {
            console.error('Error obteniendo pedido:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static getAllAdmin(req, res) {
        try {
            expirePendingOrders();
            const orders = Order.getAll();
            return res.json({ success: true, orders });
        } catch (error) {
            console.error('Error listando pedidos admin:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static updateStatusAdmin(req, res) {
        try {
            const body = req.body || {};
            const status = body.status;
            if (!VALID_STATUSES.has(status)) {
                return res.status(400).json({ success: false, message: 'Estado de pedido invalido' });
            }

            const result = Order.transitionStatus(Number(req.params.id), status, {
                paymentStatus: status === 'cancelled' ? 'cancelled' : undefined,
                restock: status === 'cancelled'
            });

            if (!result) {
                return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
            }

            if (result.error) {
                return res.status(409).json({ success: false, message: result.message });
            }

            return res.json({ success: true, order: result.order });
        } catch (error) {
            console.error('Error actualizando estado de pedido:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async createMercadoPagoPreference(req, res) {
        try {
            expirePendingOrders();
            if (!MercadoPagoService.isConfigured()) {
                return res.status(503).json({
                    success: false,
                    message: 'Mercado Pago no esta configurado todavia'
                });
            }

            const orderId = Number(req.params.id);
            const order = Order.getById(orderId, req.user.id);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
            }

            if (order.payment_method !== 'mercado_pago') {
                return res.status(400).json({ success: false, message: 'Este pedido no usa Mercado Pago' });
            }

            if (order.payment_status === 'approved') {
                return res.status(409).json({ success: false, message: 'Este pedido ya fue aprobado' });
            }

            if (['cancelled', 'delivered'].includes(order.status) || order.payment_status === 'expired') {
                return res.status(409).json({
                    success: false,
                    message: 'Esta orden ya no admite un nuevo intento de pago'
                });
            }

            const externalReference = order.external_reference || Order.buildExternalReference(order.id);
            const preference = await MercadoPagoService.createPreference({
                order: {
                    ...order,
                    external_reference: externalReference
                },
                payer: req.user
            });

            const updatedOrder = Order.assignMercadoPagoPreference(order.id, req.user.id, {
                payment_preference_id: preference.id,
                external_reference: externalReference,
                expires_at: Order.buildExpirationDateMinutes(MERCADO_PAGO_ORDER_EXPIRATION_MINUTES),
                payment_status: 'pending_payment'
            });

            return res.json({
                success: true,
                order: updatedOrder,
                preference: {
                    id: preference.id,
                    init_point: preference.init_point,
                    sandbox_init_point: preference.sandbox_init_point || null
                }
            });
        } catch (error) {
            console.error('Error creando preferencia de Mercado Pago:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'No se pudo iniciar el pago con Mercado Pago'
            });
        }
    }

    static async handleMercadoPagoWebhook(req, res) {
        try {
            const expectedToken = getMercadoPagoWebhookToken();
            if (expectedToken && req.query.token !== expectedToken) {
                return res.status(401).json({ success: false, message: 'Webhook no autorizado' });
            }

            const body = req.body || {};
            const paymentId = body.data?.id || body.id || req.query['data.id'] || req.query.id;
            const topic = String(body.type || body.topic || req.query.type || req.query.topic || '').toLowerCase();

            if (!paymentId || (topic && topic !== 'payment')) {
                return res.status(200).json({ success: true, ignored: true });
            }

            const payment = await MercadoPagoService.getPayment(paymentId);
            const externalReference = payment.external_reference || payment.metadata?.external_reference || null;
            const order = Order.findByExternalReference(externalReference) || Order.findByExternalPaymentId(payment.id);

            if (!order) {
                return res.status(404).json({ success: false, message: 'Orden asociada no encontrada' });
            }

            const updatedOrder = Order.updateMercadoPagoPayment(order.id, {
                payment_status: String(payment.status || 'pending'),
                external_payment_id: String(payment.id || ''),
                payment_preference_id: order.payment_preference_id
            });

            return res.status(200).json({ success: true, order: updatedOrder });
        } catch (error) {
            console.error('Error procesando webhook de Mercado Pago:', error);
            return res.status(500).json({ success: false, message: 'No se pudo procesar el webhook' });
        }
    }

    static handleMercadoPagoReturn(req, res) {
        try {
            const target = buildFrontendPageUrl('confirmacion.html');
            const externalReference = String(req.query.external_reference || '').trim();
            const paymentStatus = String(
                req.query.status
                || req.query.collection_status
                || req.query.return_status
                || ''
            ).trim();
            const paymentId = String(req.query.payment_id || req.query.collection_id || '').trim();
            const preferenceId = String(req.query.preference_id || '').trim();

            const order = Order.findByExternalReference(externalReference);

            if (order?.id) {
                target.searchParams.set('order_id', String(order.id));
            }

            if (externalReference) {
                target.searchParams.set('external_reference', externalReference);
            }

            if (paymentStatus) {
                target.searchParams.set('payment_status', paymentStatus);
            }

            if (paymentId) {
                target.searchParams.set('payment_id', paymentId);
            }

            if (preferenceId) {
                target.searchParams.set('preference_id', preferenceId);
            }

            return res.redirect(302, target.toString());
        } catch (error) {
            console.error('Error retornando desde Mercado Pago:', error);
            return res.status(500).send('No se pudo redirigir a la confirmacion de compra');
        }
    }
}

module.exports = OrderController;
