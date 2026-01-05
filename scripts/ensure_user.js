const db = require('better-sqlite3')('backend/database/tienda.sqlite');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    const email = 'test@test.com';
    const password = 'password123';

    // Check if exists
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (user) {
        console.log('User already exists:', user.id);
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const info = db.prepare(`
        INSERT INTO users (email, password, first_name, last_name, phone, newsletter, is_verified)
        VALUES (?, ?, 'Test', 'User', '12345678', 0, 1)
    `).run(email, hashedPassword);

    console.log('Created test user:', info.lastInsertRowid);
}

createTestUser();
