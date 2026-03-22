/* eslint-disable no-console */
const path = require('path');
process.env.NODE_PATH = [
    path.join(__dirname, '..', 'backend', 'node_modules'),
    process.env.NODE_PATH || ''
].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
require('dotenv').config({
    path: path.join(__dirname, '..', 'backend', '.env')
});

const API_BASE = process.env.QA_API_BASE || 'http://localhost:3000/api';
const DB_PATH = path.join(__dirname, '..', 'backend', 'database', 'golazostore.db');
const JWT_SECRET = String(process.env.JWT_SECRET || '').trim();

const qaTag = Date.now();
const qaUser = {
    email: `qa-user-${qaTag}@golazostore.local`,
    password: 'QaPass!123',
    firstName: 'QA',
    lastName: 'User',
    role: 'user'
};
const qaAdmin = {
    email: `qa-admin-${qaTag}@golazostore.local`,
    password: 'QaPass!123',
    firstName: 'QA',
    lastName: 'Admin',
    role: 'admin'
};

const createdProductIds = [];
const results = [];

function addResult(name, passed, detail) {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} - ${detail}`);
}

async function request(url, options = {}) {
    const response = await fetch(url, options);
    const rawText = await response.text();
    let body = null;
    try {
        body = rawText ? JSON.parse(rawText) : null;
    } catch (_) {
        body = rawText;
    }
    return { response, body };
}

function upsertUser(db, user) {
    const hash = bcrypt.hashSync(user.password, 10);
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
    if (existing) {
         db.prepare(
             `UPDATE users
             SET password = ?, first_name = ?, last_name = ?, role = ?, is_verified = 1, verification_token_hash = NULL
             WHERE email = ?`
        ).run(hash, user.firstName, user.lastName, user.role, user.email);
        return existing.id;
    }

    const inserted = db.prepare(
        `INSERT INTO users (email, password, first_name, last_name, role, is_verified)
         VALUES (?, ?, ?, ?, ?, 1)`
    ).run(user.email, hash, user.firstName, user.lastName, user.role);

    return Number(inserted.lastInsertRowid);
}

async function login(email, password) {
    const { response, body } = await request(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return { status: response.status, body };
}

function getProductFromDb(id) {
    const db = new Database(DB_PATH);
    const product = db.prepare('SELECT id, name, image_url, image_urls, stock FROM products WHERE id = ?').get(id);
    db.close();
    return product;
}

async function run() {
    if (!JWT_SECRET) {
        throw new Error('Falta JWT_SECRET en entorno para ejecutar QA de cierre');
    }

    const db = new Database(DB_PATH);
    upsertUser(db, qaUser);
    upsertUser(db, qaAdmin);
    db.close();

    const health = await request(`${API_BASE.replace(/\/api$/, '')}/api/health`);
    addResult('Backend disponible', health.response.status === 200, `status=${health.response.status}`);

    const expiredToken = jwt.sign({ userId: 999999 }, JWT_SECRET, { expiresIn: -1 });
    const expiredTokenCart = await request(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
    });
    addResult('Token expirado bloqueado', expiredTokenCart.response.status === 403, `status=${expiredTokenCart.response.status}`);

    const productsList = await request(`${API_BASE}/products`);
    const products = productsList.body && productsList.body.products ? productsList.body.products : [];
    addResult('Catalogo responde', productsList.response.status === 200, `status=${productsList.response.status}`);
    addResult('Catalogo con productos', products.length > 0, `products=${products.length}`);

    const firstProduct = products[0];
    const productDetail = await request(`${API_BASE}/products/${firstProduct.id}`);
    addResult('Detalle de producto responde', productDetail.response.status === 200, `status=${productDetail.response.status}`);

    const userLogin = await login(qaUser.email, qaUser.password);
    const userToken = userLogin.body && userLogin.body.token ? userLogin.body.token : '';
    addResult('Login usuario QA', userLogin.status === 200 && !!userToken, `status=${userLogin.status}`);

    const adminLogin = await login(qaAdmin.email, qaAdmin.password);
    const adminToken = adminLogin.body && adminLogin.body.token ? adminLogin.body.token : '';
    addResult('Login admin QA', adminLogin.status === 200 && !!adminToken, `status=${adminLogin.status}`);

    const createProduct = await request(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: `QA cierre ${qaTag}`,
            description: 'Producto QA cierre MVP',
            price: 2500,
            image_url: 'https://example.com/qa-main.jpg',
            image_urls: [
                'https://example.com/qa-main.jpg',
                'https://example.com/qa-second.jpg'
            ],
            stock: 3,
            sizes: ['M', 'L'],
            category_id: 1
        })
    });
    const productId = createProduct.body ? Number(createProduct.body.productId) : null;
    if (productId) createdProductIds.push(productId);
    addResult('Admin crea producto con galeria inicial', createProduct.response.status === 201 && !!productId, `status=${createProduct.response.status}, productId=${productId}`);

    const updateProduct = await request(`${API_BASE}/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: `QA cierre ${qaTag} updated`,
            description: 'Producto QA cierre MVP actualizado',
            price: 2700,
            image_urls: [
                'https://example.com/qa-second.jpg',
                'https://example.com/qa-third.jpg'
            ],
            stock: 3,
            sizes: ['M', 'L'],
            category_id: 1
        })
    });
    addResult('Admin actualiza galeria por API', updateProduct.response.status === 200, `status=${updateProduct.response.status}`);

    const productAfterUpdate = await request(`${API_BASE}/products/${productId}`);
    const updatedImages = productAfterUpdate.body && productAfterUpdate.body.product
        ? productAfterUpdate.body.product.image_urls || []
        : [];
    addResult(
        'API devuelve galeria normalizada',
        Array.isArray(updatedImages) && updatedImages.length === 2 && updatedImages[0].includes('qa-second'),
        `imageCount=${Array.isArray(updatedImages) ? updatedImages.length : 0}`
    );

    const dbProduct = getProductFromDb(productId);
    addResult(
        'Base persiste image_urls en producto admin',
        !!(dbProduct && dbProduct.image_urls && String(dbProduct.image_urls).includes('qa-third')),
        `dbImageUrls=${dbProduct ? dbProduct.image_urls : 'null'}`
    );

    const addToCart = await request(`${API_BASE}/cart`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId, quantity: 1, size: 'M' })
    });
    addResult('Usuario agrega producto al carrito', addToCart.response.status === 201, `status=${addToCart.response.status}`);

    const createOrder = await request(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            payment_method: 'instagram',
            customer_name: 'QA User',
            customer_phone: '000000000',
            shipping_address: 'QA Street 123'
        })
    });
    const orderId = createOrder.body && createOrder.body.order ? Number(createOrder.body.order.id) : null;
    addResult('Checkout crea pedido real', createOrder.response.status === 201 && !!orderId, `status=${createOrder.response.status}, orderId=${orderId}`);

    const cartAfterOrder = await request(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    const cartItems = cartAfterOrder.body && Array.isArray(cartAfterOrder.body.items) ? cartAfterOrder.body.items.length : -1;
    addResult('Checkout limpia carrito', cartAfterOrder.response.status === 200 && cartItems === 0, `items=${cartItems}`);

    const myOrders = await request(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    const myOrdersCount = myOrders.body && Array.isArray(myOrders.body.orders) ? myOrders.body.orders.length : 0;
    addResult('Mis pedidos responde con historial', myOrders.response.status === 200 && myOrdersCount > 0, `orders=${myOrdersCount}`);

    const deleteProduct = await request(`${API_BASE}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    addResult(
        'Admin no elimina producto ya vendido',
        deleteProduct.response.status === 409,
        `status=${deleteProduct.response.status}`
    );

    const passed = results.filter((result) => result.passed).length;
    const failed = results.length - passed;

    console.log('\n=== RESUMEN QA CIERRE MVP ===');
    console.log(`Total: ${results.length}`);
    console.log(`PASS: ${passed}`);
    console.log(`FAIL: ${failed}`);

    if (failed > 0) {
        process.exitCode = 1;
    }
}

run().catch((error) => {
    console.error('Error ejecutando QA cierre MVP:', error.message);
    process.exit(1);
});
