const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'backend', 'database', 'golazostore.db');
const db = new Database(DB_PATH, { readonly: false });
db.pragma('foreign_keys = ON');

function printUsage() {
    console.log(`
Uso:
  node scripts/db-admin.js summary
  node scripts/db-admin.js users
  node scripts/db-admin.js user <email>
  node scripts/db-admin.js products
  node scripts/db-admin.js orders
  node scripts/db-admin.js user-orders <email>
  node scripts/db-admin.js promote-admin <email>
  node scripts/db-admin.js set-role <email> <role>
  node scripts/db-admin.js verify-user <email>
  node scripts/db-admin.js delete-user <email>
  node scripts/db-admin.js delete-users <email1> <email2> [...]
`);
}

function printRows(rows) {
    if (!rows.length) {
        console.log('Sin resultados.');
        return;
    }
    console.table(rows);
}

function summary() {
    const result = {
        users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
        products: db.prepare('SELECT COUNT(*) AS count FROM products').get().count,
        active_products: db.prepare("SELECT COUNT(*) AS count FROM products WHERE COALESCE(is_active, 1) = 1").get().count,
        cart_items: db.prepare('SELECT COUNT(*) AS count FROM cart_items').get().count,
        orders: db.prepare('SELECT COUNT(*) AS count FROM orders').get().count,
        order_items: db.prepare('SELECT COUNT(*) AS count FROM order_items').get().count
    };
    console.table([result]);
}

function users() {
    const rows = db.prepare(`
        SELECT id, email, first_name, last_name, role, is_verified, created_at
        FROM users
        ORDER BY id DESC
        LIMIT 30
    `).all();
    printRows(rows);
}

function userByEmail(email) {
    if (!email) {
        throw new Error('Debes indicar un email. Ej: node scripts/db-admin.js user facundonew2003@gmail.com');
    }

    const row = db.prepare(`
        SELECT id, email, first_name, last_name, phone, newsletter, role, is_verified, created_at
        FROM users
        WHERE email = ?
    `).get(email);

    if (!row) {
        console.log(`No se encontro usuario con email: ${email}`);
        return;
    }

    console.table([row]);
}

function products() {
    const rows = db.prepare(`
        SELECT id, name, price, stock, COALESCE(is_active, 1) AS is_active, created_at
        FROM products
        ORDER BY id DESC
        LIMIT 50
    `).all();
    printRows(rows);
}

function orders() {
    const rows = db.prepare(`
        SELECT
            o.id,
            u.email,
            o.status,
            o.payment_method,
            o.payment_status,
            o.total_amount,
            o.expires_at,
            o.created_at
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.id DESC
        LIMIT 50
    `).all();
    printRows(rows);
}

function userOrders(email) {
    if (!email) {
        throw new Error('Debes indicar un email. Ej: node scripts/db-admin.js user-orders facundonew2003@gmail.com');
    }
    const rows = db.prepare(`
        SELECT
            o.id,
            o.status,
            o.payment_method,
            o.payment_status,
            o.total_amount,
            o.expires_at,
            o.created_at
        FROM orders o
        JOIN users u ON u.id = o.user_id
        WHERE u.email = ?
        ORDER BY o.id DESC
    `).all(email);
    printRows(rows);
}

function promoteAdmin(email) {
    if (!email) {
        throw new Error('Debes indicar un email. Ej: node scripts/db-admin.js promote-admin facundonew2003@gmail.com');
    }
    const result = db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
    if (result.changes === 0) {
        console.log(`No se encontro usuario con email: ${email}`);
        return;
    }
    console.log(`Usuario promovido a admin: ${email}`);
}

function setRole(email, role) {
    if (!email || !role) {
        throw new Error('Debes indicar email y rol. Ej: node scripts/db-admin.js set-role facundonew2003@gmail.com admin');
    }

    const allowedRoles = new Set(['user', 'admin']);
    if (!allowedRoles.has(role)) {
        throw new Error(`Rol no valido: ${role}. Roles permitidos: ${Array.from(allowedRoles).join(', ')}`);
    }

    const result = db.prepare('UPDATE users SET role = ? WHERE email = ?').run(role, email);
    if (result.changes === 0) {
        console.log(`No se encontro usuario con email: ${email}`);
        return;
    }

    console.log(`Rol actualizado: ${email} -> ${role}`);
}

function verifyUser(email) {
    if (!email) {
        throw new Error('Debes indicar un email. Ej: node scripts/db-admin.js verify-user facundonew2003@gmail.com');
    }

    const result = db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?').run(email);
    if (result.changes === 0) {
        console.log(`No se encontro usuario con email: ${email}`);
        return;
    }

    console.log(`Usuario marcado como verificado: ${email}`);
}

function deleteUser(email) {
    if (!email) {
        throw new Error('Debes indicar un email. Ej: node scripts/db-admin.js delete-user facundonew2003@gmail.com');
    }

    const result = db.prepare('DELETE FROM users WHERE email = ?').run(email);
    if (result.changes === 0) {
        console.log(`No se encontro usuario con email: ${email}`);
        return;
    }

    console.log(`Usuario eliminado: ${email}`);
}

function deleteUsers(emails) {
    if (!emails.length) {
        throw new Error('Debes indicar al menos un email. Ej: node scripts/db-admin.js delete-users uno@mail.com dos@mail.com');
    }

    const stmt = db.prepare('DELETE FROM users WHERE email = ?');
    let total = 0;
    for (const email of emails) {
        total += stmt.run(email).changes;
    }

    console.log(`Usuarios eliminados: ${total}`);
}

const command = process.argv[2];
const arg = process.argv[3];
const arg2 = process.argv[4];

try {
    switch (command) {
    case 'summary':
        summary();
        break;
    case 'users':
        users();
        break;
    case 'user':
        userByEmail(arg);
        break;
    case 'products':
        products();
        break;
    case 'orders':
        orders();
        break;
    case 'user-orders':
        userOrders(arg);
        break;
    case 'promote-admin':
        promoteAdmin(arg);
        break;
    case 'set-role':
        setRole(arg, arg2);
        break;
    case 'verify-user':
        verifyUser(arg);
        break;
    case 'delete-user':
        deleteUser(arg);
        break;
    case 'delete-users':
        deleteUsers(process.argv.slice(3));
        break;
    default:
        printUsage();
        process.exitCode = 1;
    }
} finally {
    db.close();
}
