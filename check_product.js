const db = require('better-sqlite3')('./backend/database/golazostore.db');

try {
    const product = db.prepare('SELECT * FROM products WHERE id = 16').get();
    console.log('=== PRODUCTO 16 (Peñarol) ===');
    console.log(JSON.stringify(product, null, 2));
} catch (e) {
    console.error('Error:', e.message);
}
