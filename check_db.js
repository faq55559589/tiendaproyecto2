const db = require('better-sqlite3')('./backend/database/golazostore.db');

try {
    const products = db.prepare('SELECT id, name, price, category_id FROM products LIMIT 10').all();
    console.log('=== PRODUCTOS EN LA BASE DE DATOS ===');
    console.log(products);
    console.log('\nTotal productos:', db.prepare('SELECT COUNT(*) as count FROM products').get().count);
} catch (e) {
    console.error('Error:', e.message);
}
