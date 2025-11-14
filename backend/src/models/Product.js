const db = require('../utils/database');

class Product {
    static async getAll() {
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
    
    static async getById(id) {
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, [id], (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });
    }
    
    static async search(searchTerm) {
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.name LIKE ? OR p.description LIKE ?
            ORDER BY p.created_at DESC
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
    
    static async create(productData) {
        const { name, description, price, image_url, stock, sizes, category_id } = productData;
        
        const query = `
            INSERT INTO products (name, description, price, image_url, stock, sizes, category_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, [name, description, price, image_url, stock, JSON.stringify(sizes), category_id], 
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result.insertId);
                }
            );
        });
    }
    
    static async update(id, productData) {
        const { name, description, price, image_url, stock, sizes, category_id } = productData;
        
        const query = `
            UPDATE products 
            SET name = ?, description = ?, price = ?, image_url = ?, stock = ?, sizes = ?, category_id = ?
            WHERE id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, [name, description, price, image_url, stock, JSON.stringify(sizes), category_id, id], 
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });
    }
    
    static async delete(id) {
        const query = 'DELETE FROM products WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.query(query, [id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = Product;
