const db = require('./database');

function hasColumn(table, column) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    return columns.some((item) => item.name === column);
}

function ensureColumn(table, column, definition) {
    if (hasColumn(table, column)) return;
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
}

function hasIndex(indexName) {
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?").all(indexName);
    return rows.length > 0;
}

function hasTable(tableName) {
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").all(tableName);
    return rows.length > 0;
}

function ensureIndex(indexName, table, expression) {
    if (hasIndex(indexName)) return;
    db.prepare(`CREATE INDEX ${indexName} ON ${table} (${expression})`).run();
}

function ordersUserFkAlreadySetNull() {
    const fkRows = db.prepare('PRAGMA foreign_key_list(orders)').all();
    return fkRows.some(
        (fk) =>
            fk.table === 'users' &&
            fk.from === 'user_id' &&
            String(fk.on_delete || '').toUpperCase() === 'SET NULL'
    );
}

function migrateOrdersUserForeignKeyToSetNull() {
    if (ordersUserFkAlreadySetNull()) return;

    db.pragma('foreign_keys = OFF');
    try {
        db.exec(`
            BEGIN TRANSACTION;

            CREATE TABLE orders_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                total REAL NOT NULL,
                total_amount REAL,
                status TEXT DEFAULT 'pending_contact',
                payment_method TEXT DEFAULT 'instagram',
                payment_status TEXT,
                external_payment_id TEXT,
                contact_channel TEXT DEFAULT 'instagram',
                customer_name TEXT,
                customer_phone TEXT,
                shipping_address TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            INSERT INTO orders_new (
                id, user_id, total, total_amount, status, payment_method, payment_status,
                external_payment_id, contact_channel, customer_name, customer_phone,
                shipping_address, notes, created_at, updated_at
            )
            SELECT
                id, user_id, total, total_amount, status, payment_method, payment_status,
                external_payment_id, contact_channel, customer_name, customer_phone,
                shipping_address, notes, created_at, updated_at
            FROM orders;

            DROP TABLE orders;
            ALTER TABLE orders_new RENAME TO orders;

            COMMIT;
        `);
    } catch (error) {
        try {
            db.exec('ROLLBACK;');
        } catch (_) {
            // nothing
        }
        throw error;
    } finally {
        db.pragma('foreign_keys = ON');
    }
}

function runMigrations() {
    ensureColumn('users', 'role', "TEXT DEFAULT 'user'");
    ensureColumn('users', 'is_verified', 'INTEGER DEFAULT 0');
    ensureColumn('users', 'verification_token', 'TEXT');
    ensureColumn('products', 'specifications', 'TEXT');
    ensureColumn('products', 'image_urls', 'TEXT');

    ensureColumn('orders', 'total_amount', 'REAL');
    ensureColumn('orders', 'payment_method', "TEXT DEFAULT 'instagram'");
    ensureColumn('orders', 'payment_status', 'TEXT');
    ensureColumn('orders', 'external_payment_id', 'TEXT');
    ensureColumn('orders', 'contact_channel', "TEXT DEFAULT 'instagram'");
    ensureColumn('orders', 'customer_name', 'TEXT');
    ensureColumn('orders', 'customer_phone', 'TEXT');
    ensureColumn('orders', 'notes', 'TEXT');

    migrateOrdersUserForeignKeyToSetNull();

    ensureIndex('idx_cart_items_user_id', 'cart_items', 'user_id');
    ensureIndex('idx_cart_items_product_id', 'cart_items', 'product_id');
    ensureIndex('idx_orders_user_id', 'orders', 'user_id');
    ensureIndex('idx_order_items_order_id', 'order_items', 'order_id');
    ensureIndex('idx_order_items_product_id', 'order_items', 'product_id');
    ensureIndex('idx_products_category_id', 'products', 'category_id');
    if (hasTable('password_reset_tokens')) {
        ensureIndex('idx_password_reset_tokens_user_id', 'password_reset_tokens', 'user_id');
    }
}

module.exports = { runMigrations };
