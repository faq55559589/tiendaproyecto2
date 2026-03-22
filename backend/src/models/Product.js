const db = require('../config/database');

function normalizeArrayInput(value, fallback = []) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || '').trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return fallback;
        }

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item || '').trim()).filter(Boolean);
            }
        } catch (error) {
            return trimmed
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }

    if (value === null || typeof value === 'undefined') {
        return fallback;
    }

    return [String(value).trim()].filter(Boolean);
}

class Product {
    static getAll() {
        const query = `
            SELECT
                p.*,
                c.name as category_name,
                EXISTS(SELECT 1 FROM order_items oi WHERE oi.product_id = p.id) as has_order_references,
                EXISTS(
                    SELECT 1
                    FROM order_items oi
                    LEFT JOIN orders o ON o.id = oi.order_id
                    WHERE oi.product_id = p.id
                      AND (o.id IS NULL OR o.status != 'cancelled')
                ) as has_blocking_order_references
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE COALESCE(p.is_active, 1) = 1
            ORDER BY p.created_at DESC
        `;
        return db.prepare(query).all();
    }

    static getAllAdmin() {
        const query = `
            SELECT
                p.*,
                c.name as category_name,
                EXISTS(SELECT 1 FROM order_items oi WHERE oi.product_id = p.id) as has_order_references,
                EXISTS(
                    SELECT 1
                    FROM order_items oi
                    LEFT JOIN orders o ON o.id = oi.order_id
                    WHERE oi.product_id = p.id
                      AND (o.id IS NULL OR o.status != 'cancelled')
                ) as has_blocking_order_references
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `;
        return db.prepare(query).all();
    }

    static getById(id) {
        const query = `
            SELECT
                p.*,
                c.name as category_name,
                EXISTS(SELECT 1 FROM order_items oi WHERE oi.product_id = p.id) as has_order_references,
                EXISTS(
                    SELECT 1
                    FROM order_items oi
                    LEFT JOIN orders o ON o.id = oi.order_id
                    WHERE oi.product_id = p.id
                      AND (o.id IS NULL OR o.status != 'cancelled')
                ) as has_blocking_order_references
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND COALESCE(p.is_active, 1) = 1
        `;
        return db.prepare(query).get(id);
    }

    static getByIdAdmin(id) {
        const query = `
            SELECT
                p.*,
                c.name as category_name,
                EXISTS(SELECT 1 FROM order_items oi WHERE oi.product_id = p.id) as has_order_references,
                EXISTS(
                    SELECT 1
                    FROM order_items oi
                    LEFT JOIN orders o ON o.id = oi.order_id
                    WHERE oi.product_id = p.id
                      AND (o.id IS NULL OR o.status != 'cancelled')
                ) as has_blocking_order_references
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `;
        return db.prepare(query).get(id);
    }

    static search(searchTerm) {
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE COALESCE(p.is_active, 1) = 1
              AND (p.name LIKE ? OR p.description LIKE ?)
            ORDER BY p.created_at DESC
        `;
        const term = `%${searchTerm}%`;
        return db.prepare(query).all(term, term);
    }

    static create(productData) {
        const { name, description, price, image_url, image_urls, is_active, stock, sizes, category_id, specifications } = productData;

        const query = `
            INSERT INTO products (name, description, price, image_url, image_urls, is_active, stock, sizes, category_id, specifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = db.prepare(query).run(
            name,
            description,
            price,
            image_url,
            JSON.stringify(normalizeArrayInput(image_urls, [])),
            Number(is_active !== false),
            stock,
            JSON.stringify(normalizeArrayInput(sizes, [])),
            category_id,
            specifications || null
        );
        return result.lastInsertRowid;
    }

    static update(id, productData) {
        const { name, description, price, image_url, image_urls, is_active, stock, sizes, category_id, specifications } = productData;

        const query = `
            UPDATE products 
            SET name = ?, description = ?, price = ?, image_url = ?, image_urls = ?, is_active = ?, stock = ?, sizes = ?, category_id = ?, specifications = ?
            WHERE id = ?
        `;

        return db.prepare(query).run(
            name,
            description,
            price,
            image_url,
            JSON.stringify(normalizeArrayInput(image_urls, [])),
            Number(is_active !== false),
            stock,
            JSON.stringify(normalizeArrayInput(sizes, [])),
            category_id,
            specifications || null,
            id
        );
    }

    static setActiveState(id, isActive) {
        const query = `
            UPDATE products
            SET is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return db.prepare(query).run(Number(Boolean(isActive)), id);
    }

    static delete(id) {
        const query = 'DELETE FROM products WHERE id = ?';
        return db.prepare(query).run(id);
    }

    static hasOrderReferences(id) {
        const query = 'SELECT COUNT(*) as total FROM order_items WHERE product_id = ?';
        const result = db.prepare(query).get(id);
        return Number(result && result.total) > 0;
    }

    static hasBlockingOrderReferences(id) {
        const query = `
            SELECT COUNT(*) as total
            FROM order_items oi
            LEFT JOIN orders o ON o.id = oi.order_id
            WHERE oi.product_id = ?
              AND (o.id IS NULL OR o.status != 'cancelled')
        `;
        const result = db.prepare(query).get(id);
        return Number(result && result.total) > 0;
    }
}

module.exports = Product;
