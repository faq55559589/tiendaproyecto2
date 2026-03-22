const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateSecureToken, hashToken } = require('../utils/token');

function toSqliteDate(date) {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

function normalizeBooleanFlag(value) {
    return value === true || value === 'true' || value === 1 || value === '1';
}

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
            email, hashedPassword, first_name, last_name, phone, normalizeBooleanFlag(newsletter) ? 1 : 0
        );
        return result.lastInsertRowid;
    }

    static deleteById(id) {
        return db.prepare('DELETE FROM users WHERE id = ?').run(id);
    }

    static findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        return db.prepare(query).get(email);
    }

    static findById(id) {
        const query = 'SELECT id, email, first_name, last_name, role, phone, avatar_url, newsletter, is_verified, created_at FROM users WHERE id = ?';
        return db.prepare(query).get(id);
    }

    static getAllAdmin() {
        const query = `
            SELECT
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.role,
                u.phone,
                u.avatar_url,
                u.newsletter,
                u.is_verified,
                u.created_at,
                COUNT(o.id) AS orders_count,
                MAX(o.created_at) AS last_order_at
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            GROUP BY
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.role,
                u.phone,
                u.avatar_url,
                u.newsletter,
                u.is_verified,
                u.created_at
            ORDER BY datetime(u.created_at) DESC, u.id DESC
        `;

        return db.prepare(query).all();
    }

    static update(id, userData) {
        const { first_name, last_name, phone, newsletter, avatar_url } = userData;

        const query = `
            UPDATE users 
            SET first_name = ?, last_name = ?, phone = ?, newsletter = ?, avatar_url = COALESCE(?, avatar_url)
            WHERE id = ?
        `;

        return db.prepare(query).run(
            first_name,
            last_name,
            phone,
            normalizeBooleanFlag(newsletter) ? 1 : 0,
            avatar_url ?? null,
            id
        );
    }

    static generateResetToken(email) {
        const user = this.findByEmail(email);
        if (!user) return null;

        db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

        const token = generateSecureToken(32);
        const tokenHash = hashToken(token);
        const expiresAt = toSqliteDate(Date.now() + 60 * 60 * 1000);

        db.prepare(`
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)
            VALUES (?, ?, ?, 0)
        `).run(user.id, tokenHash, expiresAt);

        return { token, user };
    }

    static verifyResetToken(token) {
        const tokenHash = hashToken(token);

        const query = `
            SELECT prt.*, u.email, u.first_name 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id
            WHERE prt.token_hash = ? AND prt.used = 0 AND datetime(prt.expires_at) > datetime('now')
        `;
        return db.prepare(query).get(tokenHash);
    }

    static async resetPassword(token, newPassword) {
        const tokenData = this.verifyResetToken(token);
        if (!tokenData) return { success: false, message: 'Token inválido o expirado' };

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, tokenData.user_id);

        db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token_hash = ?').run(hashToken(token));

        return { success: true, message: 'Contraseña actualizada correctamente' };
    }

    static generateVerificationToken(email) {
        const token = generateSecureToken(32);
        db.prepare(`
            UPDATE users
            SET verification_token_hash = ?
            WHERE email = ?
        `).run(hashToken(token), email);
        return token;
    }

    static verifyEmail(token) {
        const user = db.prepare('SELECT * FROM users WHERE verification_token_hash = ?').get(hashToken(token));

        if (!user) return { success: false, message: 'Token inválido' };

        db.prepare(`
            UPDATE users 
            SET is_verified = 1,
                verification_token_hash = NULL
            WHERE id = ?
        `).run(user.id);

        return { success: true, user };
    }
}

module.exports = User;
