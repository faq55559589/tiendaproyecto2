const db = require('../config/database');
const Cart = require('./Cart');

function toSqliteDate(date) {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

const VALID_STATUSES = new Set(['pending_contact', 'confirmed', 'cancelled', 'delivered']);
const ALLOWED_TRANSITIONS = {
    pending_contact: new Set(['pending_contact', 'confirmed', 'cancelled']),
    confirmed: new Set(['confirmed', 'cancelled', 'delivered']),
    cancelled: new Set(['cancelled']),
    delivered: new Set(['delivered'])
};

function isAllowedTransition(currentStatus, nextStatus) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    return allowed ? allowed.has(nextStatus) : false;
}

function derivePaymentStatus(currentOrder, nextStatus) {
    const paymentMethod = String(currentOrder.payment_method || '').trim().toLowerCase();

    if (nextStatus === 'cancelled') {
        return 'cancelled';
    }

    if (nextStatus === 'confirmed') {
        return paymentMethod === 'mercado_pago' ? 'approved' : 'confirmed';
    }

    if (nextStatus === 'delivered') {
        return paymentMethod === 'mercado_pago' ? 'approved' : 'delivered';
    }

    return undefined;
}

const MERCADO_PAGO_PENDING_STATUSES = new Set(['pending_payment', 'pending', 'in_process']);
const MERCADO_PAGO_FAILED_STATUSES = new Set(['rejected', 'cancelled', 'charged_back']);
const MERCADO_PAGO_REFUND_STATUSES = new Set(['refunded']);

class Order {
    static buildExternalReference(seed) {
        return `GS-ORDER-${Number(seed || Date.now())}-${Date.now()}`;
    }

    static createFromCart(userId, payload) {
        const cartItems = db
            .prepare(
                `
                SELECT ci.product_id, ci.quantity, ci.size, p.price, p.stock, p.name
                FROM cart_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.user_id = ?
                `
            )
            .all(userId);

        if (!cartItems.length) {
            return null;
        }

        const outOfStock = cartItems.find(
            (item) => Number(item.stock || 0) <= 0 || Number(item.quantity) > Number(item.stock || 0)
        );
        if (outOfStock) {
            return {
                error: 'INSUFFICIENT_STOCK',
                message: `Stock insuficiente para ${outOfStock.name}`
            };
        }

        const transaction = db.transaction(() => {
            const stockRows = db
                .prepare(
                    `
                    SELECT ci.product_id, ci.quantity, p.stock, p.price, p.name
                    FROM cart_items ci
                    JOIN products p ON p.id = ci.product_id
                    WHERE ci.user_id = ?
                    `
                )
                .all(userId);

            const stockError = stockRows.find(
                (item) => Number(item.stock || 0) <= 0 || Number(item.quantity) > Number(item.stock || 0)
            );
            if (stockError) {
                throw new Error(`INSUFFICIENT_STOCK:${stockError.name}`);
            }

            const total = stockRows.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

            const paymentMethod = payload.payment_method || 'instagram';
            const paymentStatus = payload.payment_status
                || (paymentMethod === 'mercado_pago' ? 'pending_payment' : 'pending_contact');

            const orderResult = db
                .prepare(
                    `
                    INSERT INTO orders (
                        user_id,
                        total,
                        total_amount,
                        status,
                        payment_method,
                        payment_status,
                        external_reference,
                        expires_at,
                        contact_channel,
                        customer_name,
                        customer_phone,
                        shipping_address,
                        notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
                )
                .run(
                    userId,
                    total,
                    total,
                    payload.status || 'pending_contact',
                    paymentMethod,
                    paymentStatus,
                    payload.external_reference || null,
                    payload.expires_at || null,
                    payload.contact_channel || 'instagram',
                    payload.customer_name || null,
                    payload.customer_phone || null,
                    payload.shipping_address || null,
                    payload.notes || null
                );

            const orderId = orderResult.lastInsertRowid;
            const insertOrderItem = db.prepare(
                `
                INSERT INTO order_items (order_id, product_id, quantity, price, size)
                VALUES (?, ?, ?, ?, ?)
                `
            );

            cartItems.forEach((item) => {
                insertOrderItem.run(orderId, item.product_id, item.quantity, item.price, item.size);
                db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
            });

            Cart.clearByUser(userId);
            return orderId;
        });

        let orderId;
        try {
            orderId = transaction();
        } catch (error) {
            if (String(error.message || '').startsWith('INSUFFICIENT_STOCK:')) {
                return {
                    error: 'INSUFFICIENT_STOCK',
                    message: 'Stock insuficiente para uno o mas productos'
                };
            }
            throw error;
        }

        return this.getById(orderId, userId);
    }

    static assignMercadoPagoPreference(orderId, userId, fields = {}) {
        const order = this.getById(orderId, userId);
        if (!order) {
            return null;
        }

        db.prepare(`
            UPDATE orders
            SET payment_preference_id = ?,
                external_reference = COALESCE(?, external_reference),
                expires_at = COALESCE(?, expires_at),
                payment_status = COALESCE(?, payment_status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            fields.payment_preference_id || null,
            fields.external_reference || null,
            fields.expires_at || null,
            fields.payment_status || null,
            orderId
        );

        return this.getById(orderId, userId);
    }

    static findByExternalReference(externalReference) {
        if (!externalReference) {
            return null;
        }

        const row = db.prepare('SELECT id FROM orders WHERE external_reference = ?').get(String(externalReference));
        return row ? this.getById(row.id) : null;
    }

    static findByExternalPaymentId(paymentId) {
        if (!paymentId) {
            return null;
        }

        const row = db.prepare('SELECT id FROM orders WHERE external_payment_id = ?').get(String(paymentId));
        return row ? this.getById(row.id) : null;
    }

    static updateMercadoPagoPayment(orderId, payload = {}) {
        const order = this.getById(orderId);
        if (!order) {
            return null;
        }

        const paymentStatus = String(payload.payment_status || order.payment_status || 'pending_payment');
        const shouldCancelForFailure = MERCADO_PAGO_FAILED_STATUSES.has(paymentStatus)
            || (MERCADO_PAGO_REFUND_STATUSES.has(paymentStatus) && order.status !== 'delivered');

        db.prepare(`
            UPDATE orders
            SET external_payment_id = COALESCE(?, external_payment_id),
                payment_preference_id = COALESCE(?, payment_preference_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            payload.external_payment_id || null,
            payload.payment_preference_id || null,
            orderId
        );

        if (paymentStatus === 'approved' && order.status === 'pending_contact') {
            this.transitionStatus(orderId, 'confirmed', { paymentStatus: 'approved' });
            return this.getById(orderId);
        }

        if (shouldCancelForFailure && !['cancelled', 'delivered'].includes(order.status)) {
            this.transitionStatus(orderId, 'cancelled', {
                paymentStatus,
                restock: true
            });
            return this.getById(orderId);
        }

        db.prepare(`
            UPDATE orders
            SET payment_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(paymentStatus, orderId);

        return this.getById(orderId);
    }

    static expirePendingInstagramOrders() {
        const expiredOrders = db
            .prepare(
                `
                SELECT id
                FROM orders
                WHERE payment_method = 'instagram'
                  AND status = 'pending_contact'
                  AND payment_status = 'pending_contact'
                  AND expires_at IS NOT NULL
                  AND datetime(expires_at) <= datetime('now')
                ORDER BY id ASC
                `
            )
            .all();

        if (!expiredOrders.length) {
            return { expiredCount: 0, restockedItems: 0 };
        }

        let restockedItems = 0;
        expiredOrders.forEach((order) => {
            const result = this.transitionStatus(Number(order.id), 'cancelled', {
                paymentStatus: 'expired',
                restock: true
            });

            if (result && !result.error) {
                restockedItems += Number(result.restockedItems || 0);
            }
        });

        return {
            expiredCount: expiredOrders.length,
            restockedItems
        };
    }

    static expirePendingMercadoPagoOrders() {
        const expiredOrders = db
            .prepare(
                `
                SELECT id
                FROM orders
                WHERE payment_method = 'mercado_pago'
                  AND status = 'pending_contact'
                  AND payment_status IN ('pending_payment', 'pending', 'in_process')
                  AND expires_at IS NOT NULL
                  AND datetime(expires_at) <= datetime('now')
                ORDER BY id ASC
                `
            )
            .all();

        if (!expiredOrders.length) {
            return { expiredCount: 0, restockedItems: 0 };
        }

        let restockedItems = 0;
        expiredOrders.forEach((order) => {
            const result = this.transitionStatus(Number(order.id), 'cancelled', {
                paymentStatus: 'expired',
                restock: true
            });

            if (result && !result.error) {
                restockedItems += Number(result.restockedItems || 0);
            }
        });

        return {
            expiredCount: expiredOrders.length,
            restockedItems
        };
    }

    static expirePendingOrders() {
        const instagram = this.expirePendingInstagramOrders();
        const mercadoPago = this.expirePendingMercadoPagoOrders();

        return {
            expiredCount: Number(instagram.expiredCount || 0) + Number(mercadoPago.expiredCount || 0),
            restockedItems: Number(instagram.restockedItems || 0) + Number(mercadoPago.restockedItems || 0),
            instagram,
            mercadoPago
        };
    }

    static getById(orderId, userId = null) {
        const baseQuery = `
            SELECT
                o.*,
                u.email,
                COALESCE(u.first_name, o.customer_name) AS first_name,
                u.last_name
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            WHERE o.id = ?
        `;
        const query = userId ? `${baseQuery} AND o.user_id = ?` : baseQuery;
        const order = userId
            ? db.prepare(query).get(orderId, userId)
            : db.prepare(query).get(orderId);
        if (!order) return null;
        return this.attachItemsToOrders([order])[0] || null;
    }

    static getByUser(userId) {
        const orders = db
            .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
            .all(userId);
        return this.attachItemsToOrders(orders);
    }

    static getAll() {
        const orders = db
            .prepare(
                `
                SELECT
                    o.*,
                    u.email,
                    COALESCE(u.first_name, o.customer_name) AS first_name,
                    u.last_name
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                ORDER BY o.created_at DESC
                `
            )
            .all();
        return this.attachItemsToOrders(orders);
    }

    static updateStatus(orderId, status) {
        return this.transitionStatus(orderId, status);
    }

    static transitionStatus(orderId, nextStatus, options = {}) {
        const normalizedStatus = String(nextStatus || '').trim();

        if (!VALID_STATUSES.has(normalizedStatus)) {
            return { error: 'INVALID_STATUS', message: 'Estado de pedido invalido' };
        }

        const currentOrder = this.getById(orderId);
        if (!currentOrder) {
            return null;
        }

        if (!isAllowedTransition(String(currentOrder.status || 'pending_contact'), normalizedStatus)) {
            return {
                error: 'INVALID_TRANSITION',
                message: 'No se puede cambiar el estado de este pedido'
            };
        }

        const explicitPaymentStatus = Object.prototype.hasOwnProperty.call(options, 'paymentStatus')
            ? options.paymentStatus
            : derivePaymentStatus(currentOrder, normalizedStatus);
        const shouldRestock = options.restock === true
            && currentOrder.status !== 'cancelled'
            && currentOrder.status !== 'delivered';

        let restockedItems = 0;
        const transaction = db.transaction(() => {
            if (shouldRestock) {
                const restockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
                currentOrder.items.forEach((item) => {
                    restockStmt.run(item.quantity, item.product_id);
                    restockedItems += Number(item.quantity || 0);
                });
            }

            const fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
            const values = [normalizedStatus];

            if (typeof explicitPaymentStatus !== 'undefined') {
                fields.unshift('payment_status = ?');
                values.unshift(explicitPaymentStatus);
            }

            values.push(orderId);
            db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        });

        transaction();

        return {
            order: this.getById(orderId),
            restockedItems
        };
    }

    static buildExpirationDate(hoursFromNow = 12) {
        const normalizedHours = Math.max(1, Number(hoursFromNow || 12));
        return toSqliteDate(Date.now() + normalizedHours * 60 * 60 * 1000);
    }

    static buildExpirationDateMinutes(minutesFromNow = 30) {
        const normalizedMinutes = Math.max(1, Number(minutesFromNow || 30));
        return toSqliteDate(Date.now() + normalizedMinutes * 60 * 1000);
    }

    static loadItemsForOrders(orderIds) {
        const uniqueOrderIds = [...new Set(orderIds.map((orderId) => Number(orderId)).filter(Boolean))];
        if (!uniqueOrderIds.length) {
            return new Map();
        }

        const placeholders = uniqueOrderIds.map(() => '?').join(', ');
        const rows = db.prepare(
            `
            SELECT oi.*, p.name, p.image_url
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id IN (${placeholders})
            ORDER BY oi.order_id ASC, oi.id ASC
            `
        ).all(...uniqueOrderIds);

        const grouped = new Map(uniqueOrderIds.map((orderId) => [Number(orderId), []]));
        rows.forEach((row) => {
            const orderRows = grouped.get(Number(row.order_id));
            if (orderRows) {
                orderRows.push(row);
            }
        });

        return grouped;
    }

    static attachItemsToOrders(orders) {
        const itemsByOrderId = this.loadItemsForOrders(orders.map((order) => order.id));
        return orders.map((order) => ({
            ...order,
            items: itemsByOrderId.get(Number(order.id)) || []
        }));
    }
}

module.exports = Order;
