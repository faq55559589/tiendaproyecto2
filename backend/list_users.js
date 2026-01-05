const db = require('better-sqlite3')('database/golazostore.db');

try {
    const users = db.prepare('SELECT id, email, is_verified FROM users').all();
    console.log('Users found:', users);

    try {
        const tokens = db.prepare('SELECT * FROM password_reset_tokens').all();
        console.log('Reset tokens:', tokens);
    } catch (e) {
        console.log('No password_reset_tokens table found (or empty).');
    }

} catch (e) {
    console.error('Error listing info:', e);
}

