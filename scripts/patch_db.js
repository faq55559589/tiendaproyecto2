const db = require('better-sqlite3')('backend/database/golazostore.db');

console.log('Patching DB...');

try {
    db.prepare('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0').run();
    console.log('Added is_verified column.');
} catch (e) {
    console.log('is_verified might already exist or error:', e.message);
}

try {
    db.prepare('ALTER TABLE users ADD COLUMN verification_token TEXT').run();
    console.log('Added verification_token column.');
} catch (e) {
    console.log('verification_token might already exist or error:', e.message);
}

try {
    // También asegurar que exista la tabla de reset tokens
    db.prepare(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    `).run();
    console.log('Ensured password_reset_tokens table exists.');
} catch (e) {
    console.log('Error creating reset tokens table:', e.message);
}

console.log('DB Patch complete.');
