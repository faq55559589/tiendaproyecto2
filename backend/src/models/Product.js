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
        const { name, description, price, image_url, stock, sizes, category_id } = productData;

        const query = `
            INSERT INTO products (name, description, price, image_url, stock, sizes, category_id, specifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = db.prepare(query).run(
            name, description, price, image_url, stock, JSON.stringify(sizes), JSON.stringify(category_id), productData.specifications
        );
        return result.lastInsertRowid;
    }

    static update(id, productData) {
        const { name, description, price, image_url, stock, sizes, category_id } = productData;

        const query = `
            UPDATE products 
            SET name = ?, description = ?, price = ?, image_url = ?, stock = ?, sizes = ?, category_id = ?, specifications = ?
            WHERE id = ?
        `;

        return db.prepare(query).run(
            name, description, price, image_url, stock, JSON.stringify(sizes), category_id, productData.specifications, id
        );
    }

    static delete(id) {
        const query = 'DELETE FROM products WHERE id = ?';
        return db.prepare(query).run(id);
    }
}

module.exports = Product;
