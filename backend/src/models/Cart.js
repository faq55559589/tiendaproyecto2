const db = require('../config/database');

class Cart {
    static getByUser(userId) {
        const query = `
            SELECT
                ci.id,
                ci.product_id,
                ci.quantity,
                ci.size,
                p.name,
                p.price,
                p.image_url,
                p.stock
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.user_id = ?
            ORDER BY ci.id DESC
        `;
        return db.prepare(query).all(userId);
    }

    static findItem(userId, productId, size) {
        const query = `
            SELECT *
            FROM cart_items
            WHERE user_id = ? AND product_id = ? AND size = ?
            LIMIT 1
        `;
        return db.prepare(query).get(userId, productId, size);
    }

    static addOrIncrement(userId, productId, size, quantity) {
        const existing = this.findItem(userId, productId, size);
        if (existing) {
            db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
            return existing.id;
        }
        const result = db
            .prepare('INSERT INTO cart_items (user_id, product_id, quantity, size) VALUES (?, ?, ?, ?)')
            .run(userId, productId, quantity, size);
        return result.lastInsertRowid;
    }

    static updateQuantity(userId, itemId, quantity) {
        return db
            .prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?')
            .run(quantity, itemId, userId);
    }

    static getItemById(userId, itemId) {
        return db
            .prepare(
                `
                SELECT ci.*, p.stock
                FROM cart_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.user_id = ? AND ci.id = ?
                LIMIT 1
                `
            )
            .get(userId, itemId);
    }

    static remove(userId, itemId) {
        return db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(itemId, userId);
    }

    static clearByUser(userId) {
        return db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    }
}

module.exports = Cart;
