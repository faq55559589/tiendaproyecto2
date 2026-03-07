const db = require('../config/database');

class Product {
    static getAll() {
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `;
        return db.prepare(query).all();
    }

    static getById(id) {
        const query = `
            SELECT p.*, c.name as category_name 
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
            WHERE p.name LIKE ? OR p.description LIKE ?
            ORDER BY p.created_at DESC
        `;
        const term = `%${searchTerm}%`;
        return db.prepare(query).all(term, term);
    }

    static create(productData) {
        const { name, description, price, image_url, image_urls, stock, sizes, category_id, specifications } = productData;

        const query = `
            INSERT INTO products (name, description, price, image_url, image_urls, stock, sizes, category_id, specifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = db.prepare(query).run(
            name,
            description,
            price,
            image_url,
            JSON.stringify(image_urls || []),
            stock,
            JSON.stringify(sizes || []),
            category_id,
            specifications || null
        );
        return result.lastInsertRowid;
    }

    static update(id, productData) {
        const { name, description, price, image_url, image_urls, stock, sizes, category_id, specifications } = productData;

        const query = `
            UPDATE products 
            SET name = ?, description = ?, price = ?, image_url = ?, image_urls = ?, stock = ?, sizes = ?, category_id = ?, specifications = ?
            WHERE id = ?
        `;

        return db.prepare(query).run(
            name,
            description,
            price,
            image_url,
            JSON.stringify(image_urls || []),
            stock,
            JSON.stringify(sizes || []),
            category_id,
            specifications || null,
            id
        );
    }

    static delete(id) {
        const query = 'DELETE FROM products WHERE id = ?';
        return db.prepare(query).run(id);
    }
}

module.exports = Product;
