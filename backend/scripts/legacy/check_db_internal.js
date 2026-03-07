const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database/golazostore.db');
const db = new Database(dbPath, { verbose: console.log });

const stmt = db.prepare('SELECT id, name, image_url, category_id FROM products');
const rows = stmt.all();

console.log('--- PRODUCTS IN DB ---');
rows.forEach((row) => {
    console.log(row);
});
