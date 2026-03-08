const db = require('../config/database');

function toSqliteDate(date) {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

class Order {
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

        const total = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

        const transaction = db.transaction(() => {
            // Revalidar y descontar stock dentro de la transaccion para evitar oversell.
            const stockRows = db
                .prepare(
                    `
                    SELECT ci.product_id, ci.quantity, p.stock, p.name
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
                    expires_at,
                    contact_channel,
                    customer_name,
                    customer_phone,
                    shipping_address,
                    notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
                )
                .run(
                    userId,
                    total,
                    total,
                    payload.status || 'pending_contact',
                    payload.payment_method || 'instagram',
                    payload.payment_status || 'pending_contact',
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

            db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
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

        const transaction = db.transaction(() => {
            let restockedItems = 0;
            const orderItemsStmt = db.prepare(
                `
                SELECT product_id, quantity
                FROM order_items
                WHERE order_id = ?
                `
            );
            const restockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
            const updateOrderStmt = db.prepare(
                `
                UPDATE orders
                SET status = 'cancelled',
                    payment_status = 'expired',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                `
            );

            expiredOrders.forEach((order) => {
                const items = orderItemsStmt.all(order.id);
                items.forEach((item) => {
                    restockStmt.run(item.quantity, item.product_id);
                    restockedItems += Number(item.quantity || 0);
                });
                updateOrderStmt.run(order.id);
            });

            return {
                expiredCount: expiredOrders.length,
                restockedItems
            };
        });

        return transaction();
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
        order.items = db
            .prepare(
                `
                SELECT oi.*, p.name, p.image_url
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = ?
                ORDER BY oi.id ASC
                `
            )
            .all(orderId);
        return order;
    }

    static getByUser(userId) {
        const orders = db
            .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
            .all(userId);
        return orders.map((order) => ({
            ...order,
            items: db
                .prepare(
                    `
                    SELECT oi.*, p.name, p.image_url
                    FROM order_items oi
                    JOIN products p ON p.id = oi.product_id
                    WHERE oi.order_id = ?
                    ORDER BY oi.id ASC
                    `
                )
                .all(order.id)
        }));
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
        return orders.map((order) => ({
            ...order,
            items: db
                .prepare(
                    `
                    SELECT oi.*, p.name, p.image_url
                    FROM order_items oi
                    JOIN products p ON p.id = oi.product_id
                    WHERE oi.order_id = ?
                    ORDER BY oi.id ASC
                    `
                )
                .all(order.id)
        }));
    }

    static updateStatus(orderId, status) {
        return db
            .prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .run(status, orderId);
    }

    static buildExpirationDate(hoursFromNow = 12) {
        const normalizedHours = Math.max(1, Number(hoursFromNow || 12));
        return toSqliteDate(Date.now() + normalizedHours * 60 * 60 * 1000);
    }
}

module.exports = Order;
