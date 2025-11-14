const db = require('../utils/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { email, password, first_name, last_name, phone, newsletter } = userData;
        
        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (email, password, first_name, last_name, phone, newsletter)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, [email, hashedPassword, first_name, last_name, phone, newsletter], 
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result.insertId);
                }
            );
        });
    }
    
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        
        return new Promise((resolve, reject) => {
            db.query(query, [email], (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });
    }
    
    static async findById(id) {
        const query = 'SELECT id, email, first_name, last_name, phone, newsletter, created_at FROM users WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.query(query, [id], (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });
    }
    
    static async update(id, userData) {
        const { first_name, last_name, phone, newsletter } = userData;
        
        const query = `
            UPDATE users 
            SET first_name = ?, last_name = ?, phone = ?, newsletter = ?
            WHERE id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, [first_name, last_name, phone, newsletter, id], 
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });
    }
}

module.exports = User;
