const Order = require('../models/Order');

const VALID_STATUSES = new Set(['pending_contact', 'confirmed', 'cancelled', 'delivered']);
const VALID_PAYMENT_METHODS = new Set(['instagram', 'mercado_pago']);
const DEFAULT_PAYMENT_STATUSES = {
    instagram: 'pending_contact',
    mercado_pago: 'pending_payment'
};
const INSTAGRAM_ORDER_EXPIRATION_HOURS = Math.max(1, Number(process.env.INSTAGRAM_ORDER_EXPIRATION_HOURS || 12));

class OrderController {
    static create(req, res) {
        try {
            Order.expirePendingInstagramOrders();
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
                : null;

            const order = Order.createFromCart(req.user.id, {
                status,
                payment_method: paymentMethod,
                payment_status: paymentStatus,
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
            Order.expirePendingInstagramOrders();
            const orders = Order.getByUser(req.user.id);
            return res.json({ success: true, orders });
        } catch (error) {
            console.error('Error listando pedidos del usuario:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static getById(req, res) {
        try {
            Order.expirePendingInstagramOrders();
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
            Order.expirePendingInstagramOrders();
            const orders = Order.getAll();
            return res.json({ success: true, orders });
        } catch (error) {
            console.error('Error listando pedidos admin:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static updateStatusAdmin(req, res) {
        try {
            const status = req.body.status;
            if (!VALID_STATUSES.has(status)) {
                return res.status(400).json({ success: false, message: 'Estado de pedido invalido' });
            }
            const result = Order.updateStatus(Number(req.params.id), status);
            if (result.changes === 0) {
                return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
            }
            const order = Order.getById(Number(req.params.id));
            return res.json({ success: true, order });
        } catch (error) {
            console.error('Error actualizando estado de pedido:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

module.exports = OrderController;
