const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User {
    static async create(userData) {
        const { email, password, first_name, last_name, phone, newsletter } = userData;

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (email, password, first_name, last_name, phone, newsletter)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const result = db.prepare(query).run(
            email, hashedPassword, first_name, last_name, phone, newsletter ? 1 : 0
        );
        return result.lastInsertRowid;
    }

    static findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        return db.prepare(query).get(email);
    }

    static findById(id) {
        const query = 'SELECT id, email, first_name, last_name, phone, newsletter, created_at FROM users WHERE id = ?';
        return db.prepare(query).get(id);
    }

    static update(id, userData) {
        const { first_name, last_name, phone, newsletter } = userData;

        const query = `
            UPDATE users 
            SET first_name = ?, last_name = ?, phone = ?, newsletter = ?
            WHERE id = ?
        `;

        return db.prepare(query).run(first_name, last_name, phone, newsletter ? 1 : 0, id);
    }

    // ==================== RECUPERACIÓN DE CONTRASEÑA ====================

    // Crear tabla de tokens si no existe
    static initResetTokensTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                used INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        db.exec(query);
    }

    // Generar token de recuperación
    static generateResetToken(email) {
        const user = this.findByEmail(email);
        if (!user) return null;

        // Crear tabla si no existe
        this.initResetTokensTable();

        // Eliminar tokens anteriores del usuario
        db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

        // Generar token aleatorio
        const token = crypto.randomBytes(32).toString('hex');

        // Expira en 1 hora
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        // Guardar token
        db.prepare(`
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `).run(user.id, token, expiresAt);

        return { token, user };
    }

    // Verificar token de recuperación
    static verifyResetToken(token) {
        this.initResetTokensTable();

        const query = `
            SELECT prt.*, u.email, u.first_name 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id
            WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > datetime('now')
        `;
        return db.prepare(query).get(token);
    }

    // Resetear contraseña con token
    static async resetPassword(token, newPassword) {
        const tokenData = this.verifyResetToken(token);
        if (!tokenData) return { success: false, message: 'Token inválido o expirado' };

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, tokenData.user_id);

        // Marcar token como usado
        db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token);

        return { success: true, message: 'Contraseña actualizada correctamente' };
    }
    // ==================== VERIFICACIÓN DE EMAIL ====================

    // Inicializar columnas de verificación si no existen
    static initVerificationColumns() {
        try {
            // Intentar añadir columnas. Si fallan es que ya existen (SQLite no tiene IF NOT EXISTS para columnas)
            try {
                db.prepare('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0').run();
            } catch (e) { }
            try {
                db.prepare('ALTER TABLE users ADD COLUMN verification_token TEXT').run();
            } catch (e) { }
        } catch (error) {
            console.error('Error inicializando columnas de verificación:', error);
        }
    }

    // Generar token de verificación
    static generateVerificationToken(email) {
        const token = crypto.randomBytes(32).toString('hex');
        db.prepare('UPDATE users SET verification_token = ? WHERE email = ?').run(token, email);
        return token;
    }

    // Verificar email
    static verifyEmail(token) {
        const user = db.prepare('SELECT * FROM users WHERE verification_token = ?').get(token);

        if (!user) return { success: false, message: 'Token inválido' };

        // Activar usuario y limpiar token
        db.prepare(`
            UPDATE users 
            SET is_verified = 1, verification_token = NULL 
            WHERE id = ?
        `).run(user.id);

        return { success: true, user };
    }
}

// Inicializar tablas al cargar
User.initResetTokensTable();
User.initVerificationColumns();

module.exports = User;
