const fs = require('fs');
const path = require('path');
const db = require('./database');

function bootstrapSchemaIfNeeded() {
    if (hasTable('users')) return;

    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
}

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

function ensureUniqueIndex(indexName, table, expression) {
    if (hasIndex(indexName)) return;
    db.prepare(`CREATE UNIQUE INDEX ${indexName} ON ${table} (${expression})`).run();
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
                external_reference TEXT,
                payment_preference_id TEXT,
                expires_at DATETIME,
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
                external_payment_id, external_reference, payment_preference_id, expires_at, contact_channel, customer_name, customer_phone,
                shipping_address, notes, created_at, updated_at
            )
            SELECT
                id, user_id, total, total_amount, status, payment_method, payment_status,
                external_payment_id, external_reference, payment_preference_id, expires_at, contact_channel, customer_name, customer_phone,
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

function ensurePasswordResetTokensTable() {
    if (hasTable('password_reset_tokens')) {
        return;
    }

    db.exec(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
}

function ensureReviewsTables() {
    if (!hasTable('reviews')) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL,
                body TEXT NOT NULL,
                is_hidden INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
    }

    if (!hasTable('review_comments')) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS review_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                review_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                body TEXT NOT NULL,
                is_hidden INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
    }
}

function normalizeCartItemSizes() {
    if (!hasTable('cart_items')) {
        return;
    }

    const transaction = db.transaction(() => {
        db.prepare(`
            UPDATE cart_items
            SET size = 'M'
            WHERE size IS NULL OR TRIM(size) = ''
        `).run();

        const duplicateRows = db.prepare(`
            SELECT user_id, product_id, size, MIN(id) AS keep_id, SUM(quantity) AS total_quantity
            FROM cart_items
            GROUP BY user_id, product_id, size
            HAVING COUNT(*) > 1
        `).all();

        const updateQuantityStmt = db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?');
        const deleteDuplicateStmt = db.prepare(`
            DELETE FROM cart_items
            WHERE user_id = ? AND product_id = ? AND size = ? AND id != ?
        `);

        duplicateRows.forEach((row) => {
            updateQuantityStmt.run(row.total_quantity, row.keep_id);
            deleteDuplicateStmt.run(row.user_id, row.product_id, row.size, row.keep_id);
        });
    });

    transaction();
}

function runMigrations() {
    bootstrapSchemaIfNeeded();

    ensureColumn('users', 'role', "TEXT DEFAULT 'user'");
    ensureColumn('users', 'is_verified', 'INTEGER DEFAULT 0');
    ensureColumn('users', 'verification_token_hash', 'TEXT');
    ensureColumn('users', 'avatar_url', 'TEXT');
    ensureColumn('products', 'specifications', 'TEXT');
    ensureColumn('products', 'image_urls', 'TEXT');
    ensureColumn('products', 'is_active', 'INTEGER DEFAULT 1');
    ensureColumn('cart_items', 'size', "TEXT DEFAULT 'M'");

    ensureColumn('orders', 'total_amount', 'REAL');
    ensureColumn('orders', 'payment_method', "TEXT DEFAULT 'instagram'");
    ensureColumn('orders', 'payment_status', 'TEXT');
    ensureColumn('orders', 'external_payment_id', 'TEXT');
    ensureColumn('orders', 'external_reference', 'TEXT');
    ensureColumn('orders', 'payment_preference_id', 'TEXT');
    ensureColumn('orders', 'expires_at', 'DATETIME');
    ensureColumn('orders', 'contact_channel', "TEXT DEFAULT 'instagram'");
    ensureColumn('orders', 'customer_name', 'TEXT');
    ensureColumn('orders', 'customer_phone', 'TEXT');
    ensureColumn('orders', 'notes', 'TEXT');

    migrateOrdersUserForeignKeyToSetNull();
    ensurePasswordResetTokensTable();
    ensureReviewsTables();
    ensureColumn('password_reset_tokens', 'token_hash', 'TEXT');
    ensureColumn('reviews', 'is_hidden', 'INTEGER DEFAULT 0');
    ensureColumn('review_comments', 'is_hidden', 'INTEGER DEFAULT 0');
    normalizeCartItemSizes();

    ensureIndex('idx_cart_items_user_id', 'cart_items', 'user_id');
    ensureIndex('idx_cart_items_product_id', 'cart_items', 'product_id');
    ensureUniqueIndex('idx_cart_items_unique', 'cart_items', 'user_id, product_id, size');
    ensureIndex('idx_orders_user_id', 'orders', 'user_id');
    ensureIndex('idx_orders_external_reference', 'orders', 'external_reference');
    ensureIndex('idx_orders_external_payment_id', 'orders', 'external_payment_id');
    ensureIndex('idx_order_items_order_id', 'order_items', 'order_id');
    ensureIndex('idx_order_items_product_id', 'order_items', 'product_id');
    ensureIndex('idx_reviews_product_id', 'reviews', 'product_id');
    ensureIndex('idx_reviews_user_id', 'reviews', 'user_id');
    ensureUniqueIndex('idx_reviews_product_user_unique', 'reviews', 'product_id, user_id');
    ensureIndex('idx_review_comments_review_id', 'review_comments', 'review_id');
    ensureIndex('idx_review_comments_user_id', 'review_comments', 'user_id');
    ensureIndex('idx_products_category_id', 'products', 'category_id');
    ensureIndex('idx_password_reset_tokens_user_id', 'password_reset_tokens', 'user_id');
    ensureUniqueIndex('idx_password_reset_tokens_token_hash', 'password_reset_tokens', 'token_hash');
    ensureIndex('idx_users_verification_token_hash', 'users', 'verification_token_hash');
}

module.exports = { runMigrations };
