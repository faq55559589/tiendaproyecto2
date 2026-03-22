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
    const mark = passed ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${name} - ${detail}`);
}

async function request(url, options = {}) {
    const response = await fetch(url, options);
    let body = null;
    try {
        body = await response.json();
    } catch (_) {
        body = null;
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

    const inserted = db
        .prepare(
            `INSERT INTO users (email, password, first_name, last_name, role, is_verified)
             VALUES (?, ?, ?, ?, ?, 1)`
        )
        .run(user.email, hash, user.firstName, user.lastName, user.role);
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

async function run() {
    if (!JWT_SECRET) {
        throw new Error('Falta JWT_SECRET en entorno para ejecutar QA (necesario para token expirado)');
    }

    const db = new Database(DB_PATH);
    upsertUser(db, qaUser);
    upsertUser(db, qaAdmin);
    db.close();

    const unauthorizedCart = await request(`${API_BASE}/cart`);
    addResult(
        'Ruta privada sin login',
        unauthorizedCart.response.status === 401,
        `status=${unauthorizedCart.response.status}`
    );

    const invalidTokenCart = await request(`${API_BASE}/cart`, {
        headers: { Authorization: 'Bearer token-invalido' }
    });
    addResult(
        'Token invalido',
        invalidTokenCart.response.status === 403,
        `status=${invalidTokenCart.response.status}`
    );

    const expiredToken = jwt.sign({ userId: 999999 }, JWT_SECRET, { expiresIn: -1 });
    const expiredTokenCart = await request(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
    });
    addResult(
        'Token expirado',
        expiredTokenCart.response.status === 403,
        `status=${expiredTokenCart.response.status}`
    );

    const productsList = await request(`${API_BASE}/products`);
    const products = productsList.body && productsList.body.products ? productsList.body.products : [];
    addResult(
        'Home/Catalogo lista productos',
        productsList.response.status === 200 && products.length > 0,
        `status=${productsList.response.status}, products=${products.length}`
    );
    const firstProduct = products[0];

    const productDetail = await request(`${API_BASE}/products/${firstProduct.id}`);
    addResult(
        'Producto detalle por ID',
        productDetail.response.status === 200 && !!(productDetail.body && productDetail.body.product),
        `status=${productDetail.response.status}, id=${firstProduct.id}`
    );

    const userLogin = await login(qaUser.email, qaUser.password);
    addResult(
        'Login usuario QA',
        userLogin.status === 200 && !!(userLogin.body && userLogin.body.token),
        `status=${userLogin.status}`
    );
    const userToken = userLogin.body && userLogin.body.token ? userLogin.body.token : '';

    const emptyOrder = await request(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_method: 'instagram' })
    });
    addResult(
        'Checkout con carrito vacio',
        emptyOrder.response.status === 400,
        `status=${emptyOrder.response.status}`
    );

    const addToCart = await request(`${API_BASE}/cart`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: firstProduct.id, quantity: 1, size: 'M' })
    });
    addResult(
        'Agregar producto al carrito',
        addToCart.response.status === 201,
        `status=${addToCart.response.status}`
    );

    const cartAfterAdd = await request(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    const cartItemsAfterAdd =
        cartAfterAdd.body && Array.isArray(cartAfterAdd.body.items) ? cartAfterAdd.body.items.length : 0;
    addResult(
        'Carrito persistente por usuario',
        cartAfterAdd.response.status === 200 && cartItemsAfterAdd > 0,
        `status=${cartAfterAdd.response.status}, items=${cartItemsAfterAdd}`
    );

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
    const createdOrderId =
        createOrder.body && createOrder.body.order ? Number(createOrder.body.order.id) : null;
    addResult(
        'Checkout crea pedido',
        createOrder.response.status === 201 && !!createdOrderId,
        `status=${createOrder.response.status}, orderId=${createdOrderId}`
    );

    const cartAfterOrder = await request(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    const cartItemsAfterOrder =
        cartAfterOrder.body && Array.isArray(cartAfterOrder.body.items) ? cartAfterOrder.body.items.length : -1;
    addResult(
        'Checkout limpia carrito',
        cartAfterOrder.response.status === 200 && cartItemsAfterOrder === 0,
        `status=${cartAfterOrder.response.status}, items=${cartItemsAfterOrder}`
    );

    const myOrders = await request(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    const myOrdersCount = myOrders.body && Array.isArray(myOrders.body.orders) ? myOrders.body.orders.length : 0;
    addResult(
        'Mis pedidos muestra historial',
        myOrders.response.status === 200 && myOrdersCount > 0,
        `status=${myOrders.response.status}, orders=${myOrdersCount}`
    );

    const getOrderById = await request(`${API_BASE}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    addResult(
        'Detalle de pedido propio',
        getOrderById.response.status === 200,
        `status=${getOrderById.response.status}, orderId=${createdOrderId}`
    );

    const adminLogin = await login(qaAdmin.email, qaAdmin.password);
    addResult(
        'Login admin QA',
        adminLogin.status === 200 && !!(adminLogin.body && adminLogin.body.token),
        `status=${adminLogin.status}`
    );
    const adminToken = adminLogin.body && adminLogin.body.token ? adminLogin.body.token : '';

    const nonAdminCreateProduct = await request(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: `QA nonadmin ${qaTag}`,
            description: 'Debe fallar por permisos',
            price: 1000,
            image_url: 'https://example.com/nonadmin.jpg',
            stock: 1,
            sizes: ['M'],
            category_id: 1
        })
    });
    addResult(
        'Admin protegido: alta bloqueada a usuario comun',
        nonAdminCreateProduct.response.status === 403,
        `status=${nonAdminCreateProduct.response.status}`
    );

    const adminCreateProduct = await request(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: `QA product ${qaTag}`,
            description: 'Producto temporal QA',
            price: 1234,
            image_url: 'https://example.com/qa.jpg',
            stock: 2,
            sizes: ['M', 'L'],
            category_id: 1
        })
    });
    const adminProductId = adminCreateProduct.body ? Number(adminCreateProduct.body.productId) : null;
    if (adminProductId) createdProductIds.push(adminProductId);
    addResult(
        'Admin alta producto',
        adminCreateProduct.response.status === 201 && !!adminProductId,
        `status=${adminCreateProduct.response.status}, productId=${adminProductId}`
    );

    const adminUpdateProduct = await request(`${API_BASE}/admin/products/${adminProductId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: `QA product ${qaTag} updated`,
            description: 'Producto temporal QA actualizado',
            price: 1500,
            image_url: 'https://example.com/qa-updated.jpg',
            stock: 2,
            sizes: ['M', 'L'],
            category_id: 1
        })
    });
    addResult(
        'Admin edicion producto',
        adminUpdateProduct.response.status === 200,
        `status=${adminUpdateProduct.response.status}`
    );

    const adminOrders = await request(`${API_BASE}/admin/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    addResult(
        'Admin listado pedidos',
        adminOrders.response.status === 200,
        `status=${adminOrders.response.status}`
    );

    const nonAdminOrders = await request(`${API_BASE}/admin/orders`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    addResult(
        'Admin protegido: listado bloqueado a usuario comun',
        nonAdminOrders.response.status === 403,
        `status=${nonAdminOrders.response.status}`
    );

    const adminDeleteProduct = await request(`${API_BASE}/admin/products/${adminProductId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    addResult(
        'Admin baja producto',
        adminDeleteProduct.response.status === 200,
        `status=${adminDeleteProduct.response.status}`
    );

    // Caso "producto sin stock" (esperado por plan de QA)
    const stockZeroCreate = await request(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: `QA sin stock ${qaTag}`,
            description: 'Producto de prueba sin stock',
            price: 1000,
            image_url: 'https://example.com/no-stock.jpg',
            stock: 0,
            sizes: ['M'],
            category_id: 1
        })
    });
    const stockZeroProductId = stockZeroCreate.body ? Number(stockZeroCreate.body.productId) : null;
    if (stockZeroProductId) createdProductIds.push(stockZeroProductId);

    const addNoStockToCart = await request(`${API_BASE}/cart`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: stockZeroProductId, quantity: 1, size: 'M' })
    });

    const noStockBlocked = addNoStockToCart.response.status >= 400;
    addResult(
        'Producto sin stock bloqueado',
        noStockBlocked,
        `status=${addNoStockToCart.response.status}`
    );

    for (const id of createdProductIds) {
        await request(`${API_BASE}/admin/products/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    console.log('\n=== RESUMEN QA FASE 2 ===');
    console.log(`Total: ${results.length}`);
    console.log(`PASS: ${passed}`);
    console.log(`FAIL: ${failed}`);

    if (failed > 0) {
        process.exitCode = 1;
    }
}

run().catch((error) => {
    console.error('Error ejecutando QA fase 2:', error.message);
    process.exit(1);
});
