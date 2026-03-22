/* eslint-disable no-console */
const path = require('path');
process.env.NODE_PATH = [
    path.join(__dirname, '..', 'backend', 'node_modules'),
    process.env.NODE_PATH || ''
].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();

const bcrypt = require('bcryptjs');
const { runMigrations } = require('../backend/src/config/migrations');
const db = require('../backend/src/config/database');
const User = require('../backend/src/models/User');
const Product = require('../backend/src/models/Product');
const Cart = require('../backend/src/models/Cart');
const Order = require('../backend/src/models/Order');
const Review = require('../backend/src/models/Review');

const qaTag = Date.now();
const results = [];
const cleanupProductIds = [];
const cleanupEmails = [];
const cleanupOrderIds = [];

function addResult(name, passed, detail) {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} - ${detail}`);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function seedUser({ email, password, firstName, lastName, role = 'user', isVerified = 0 }) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    const hashedPassword = bcrypt.hashSync(password, 10);

    if (existing) {
        db.prepare(
            `
            UPDATE users
            SET password = ?,
                first_name = ?,
                last_name = ?,
                role = ?,
                is_verified = ?,
                verification_token_hash = NULL
            WHERE email = ?
            `
        ).run(hashedPassword, firstName, lastName, role, isVerified, email);
        return existing.id;
    }

    const result = db.prepare(
        `
        INSERT INTO users (email, password, first_name, last_name, role, is_verified)
        VALUES (?, ?, ?, ?, ?, ?)
        `
    ).run(email, hashedPassword, firstName, lastName, role, isVerified);

    return Number(result.lastInsertRowid);
}

function createProduct({ name, stock }) {
    const productId = Product.create({
        name,
        description: 'QA integrity product',
        price: 1500,
        image_url: 'https://example.com/product.jpg',
        image_urls: ['https://example.com/product.jpg'],
        is_active: true,
        stock,
        sizes: ['M', 'L'],
        category_id: 1,
        specifications: 'QA specs'
    });

    cleanupProductIds.push(productId);
    return productId;
}

function cleanup() {
    cleanupOrderIds.forEach((orderId) => {
        try {
            db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
            db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
        } catch (error) {
            // ignore
        }
    });

    cleanupProductIds.forEach((productId) => {
        try {
            db.prepare('DELETE FROM products WHERE id = ?').run(productId);
        } catch (error) {
            // ignore
        }
    });

    cleanupEmails.forEach((email) => {
        try {
            db.prepare('DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email = ?)').run(email);
            db.prepare('DELETE FROM users WHERE email = ?').run(email);
        } catch (error) {
            // ignore
        }
    });
}

async function run() {
    runMigrations();

    const userEmail = `qa-integrity-user-${qaTag}@golazostore.local`;
    const adminEmail = `qa-integrity-admin-${qaTag}@golazostore.local`;
    cleanupEmails.push(userEmail, adminEmail);

    const userId = seedUser({
        email: userEmail,
        password: 'QaPass!123',
        firstName: 'QA',
        lastName: 'User',
        role: 'user',
        isVerified: 0
    });
    const adminId = seedUser({
        email: adminEmail,
        password: 'QaPass!123',
        firstName: 'QA',
        lastName: 'Admin',
        role: 'admin',
        isVerified: 1
    });

    const productId = createProduct({
        name: `QA integrity ${qaTag}`,
        stock: 10
    });

    try {
        const verificationToken = User.generateVerificationToken(userEmail);
        const verificationRow = db.prepare(
            `
            SELECT verification_token_hash, is_verified
            FROM users
            WHERE email = ?
            `
        ).get(userEmail);
        assert(Boolean(verificationRow && verificationRow.verification_token_hash), 'verification_token_hash missing');
        assert(verificationRow.verification_token_hash !== verificationToken, 'verification token stored in clear');

        const verificationResult = User.verifyEmail(verificationToken);
        assert(Boolean(verificationResult && verificationResult.success), 'verification flow failed');

        const resetToken = User.generateResetToken(userEmail);
        const resetRow = db.prepare(
            `
            SELECT token_hash, used
            FROM password_reset_tokens
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
            `
        ).get(userId);
        assert(Boolean(resetRow && resetRow.token_hash), 'reset token hash missing');
        assert(resetRow.token_hash !== resetToken.token, 'reset token stored in clear');

        const resetResult = await User.resetPassword(resetToken.token, 'QaPass!456');
        assert(Boolean(resetResult && resetResult.success), 'reset password failed');
        const updatedUser = db.prepare('SELECT password FROM users WHERE email = ?').get(userEmail);
        assert(bcrypt.compareSync('QaPass!456', updatedUser.password), 'password was not updated');

        Cart.addOrIncrement(userId, productId, 'M', 1);
        Cart.addOrIncrement(userId, productId, 'M', 2);
        const cartRow = db.prepare(
            `
            SELECT COUNT(*) AS rowsCount, SUM(quantity) AS totalQuantity
            FROM cart_items
            WHERE user_id = ? AND product_id = ? AND size = 'M'
            `
        ).get(userId, productId);
        assert(Number(cartRow.rowsCount) === 1, 'cart items were duplicated');
        assert(Number(cartRow.totalQuantity) === 3, 'cart quantity did not merge');

        const order = Order.createFromCart(userId, {
            status: 'pending_contact',
            payment_method: 'instagram',
            payment_status: 'pending_contact',
            expires_at: Order.buildExpirationDate(12),
            contact_channel: 'instagram',
            customer_name: 'QA User',
            customer_phone: '000000000',
            shipping_address: 'QA Street 123'
        });
        assert(Boolean(order && order.id), 'order creation failed');
        cleanupOrderIds.push(order.id);

        const stockAfterOrder = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
        assert(Number(stockAfterOrder.stock) === 7, 'stock was not decremented after checkout');

        const cancelResult = Order.transitionStatus(order.id, 'cancelled', {
            paymentStatus: 'cancelled',
            restock: true
        });
        assert(Boolean(cancelResult && cancelResult.order), 'cancel transition failed');
        const stockAfterCancel = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
        assert(Number(stockAfterCancel.stock) === 10, 'stock was not restored after cancel');
        assert(cancelResult.order.status === 'cancelled', 'cancelled order status not persisted');
        assert(cancelResult.order.payment_status === 'cancelled', 'cancelled order payment_status not persisted');

        Cart.addOrIncrement(userId, productId, 'L', 1);
        const lifecycleOrder = Order.createFromCart(userId, {
            status: 'pending_contact',
            payment_method: 'instagram',
            payment_status: 'pending_contact',
            expires_at: Order.buildExpirationDate(12),
            contact_channel: 'instagram',
            customer_name: 'QA User',
            customer_phone: '000000000',
            shipping_address: 'QA Street 123'
        });
        assert(Boolean(lifecycleOrder && lifecycleOrder.id), 'lifecycle order creation failed');
        cleanupOrderIds.push(lifecycleOrder.id);

        const confirmedResult = Order.transitionStatus(lifecycleOrder.id, 'confirmed');
        assert(Boolean(confirmedResult && confirmedResult.order), 'confirm transition failed');
        assert(confirmedResult.order.status === 'confirmed', 'confirmed order status not persisted');
        assert(confirmedResult.order.payment_status === 'confirmed', 'confirmed order payment_status not persisted');

        const deliveredResult = Order.transitionStatus(lifecycleOrder.id, 'delivered');
        assert(Boolean(deliveredResult && deliveredResult.order), 'deliver transition failed');
        assert(deliveredResult.order.status === 'delivered', 'delivered order status not persisted');
        assert(deliveredResult.order.payment_status === 'delivered', 'delivered order payment_status not persisted');
        const stockAfterDelivered = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
        assert(Number(stockAfterDelivered.stock) === 9, 'stock should remain consumed after delivery');

        Cart.addOrIncrement(userId, productId, 'M', 1);
        const expiringOrder = Order.createFromCart(userId, {
            status: 'pending_contact',
            payment_method: 'instagram',
            payment_status: 'pending_contact',
            expires_at: Order.buildExpirationDate(12),
            contact_channel: 'instagram',
            customer_name: 'QA User',
            customer_phone: '000000000',
            shipping_address: 'QA Street 123'
        });
        assert(Boolean(expiringOrder && expiringOrder.id), 'second order creation failed');
        cleanupOrderIds.push(expiringOrder.id);

        db.prepare(
            `
            UPDATE orders
            SET expires_at = datetime('now', '-1 hour'),
                status = 'pending_contact',
                payment_status = 'pending_contact'
            WHERE id = ?
            `
        ).run(expiringOrder.id);

        const expirationResult = Order.expirePendingInstagramOrders();
        assert(Number(expirationResult.expiredCount) >= 1, 'expiration sweep did not find expired orders');

        const expiredOrder = Order.getById(expiringOrder.id);
        const stockAfterExpire = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
        assert(expiredOrder.status === 'cancelled', 'expired order status not updated');
        assert(expiredOrder.payment_status === 'expired', 'expired order payment_status not updated');
        assert(Number(stockAfterExpire.stock) === 9, 'stock was not restored after expiration');

        const orderItems = db.prepare('SELECT COUNT(*) AS total FROM order_items WHERE order_id = ?').get(order.id);
        assert(Number(orderItems.total) > 0, 'order items not stored');

        const canReview = Review.hasPurchasedProduct(userId, productId);
        assert(canReview === true, 'confirmed or delivered purchase should unlock reviews');

        const createdReview = Review.create({
            productId,
            userId,
            rating: 5,
            body: 'Excelente compra QA, talle correcto y buen estado.'
        });
        assert(Boolean(createdReview && createdReview.id), 'review creation failed');

        const duplicateReview = db.prepare('SELECT COUNT(*) AS total FROM reviews WHERE product_id = ? AND user_id = ?').get(productId, userId);
        assert(Number(duplicateReview.total) === 1, 'review uniqueness broken');

        const createdComment = Review.createComment({
            reviewId: createdReview.id,
            userId: adminId,
            body: 'Comentario QA para validar hilo acotado.'
        });
        assert(Boolean(createdComment && createdComment.id), 'review comment creation failed');

        const reviewWithComments = Review.getById(createdReview.id);
        assert(Array.isArray(reviewWithComments.comments) && reviewWithComments.comments.length === 1, 'review comments not attached');

        addResult('Backend integrity checks', true, 'tokens, cart, lifecycle, expiration and reviews are consistent');
    } finally {
        cleanup();
    }

    const passed = results.filter((result) => result.passed).length;
    const failed = results.length - passed;

    console.log('\n=== RESUMEN QA BACKEND INTEGRITY ===');
    console.log(`Total: ${results.length}`);
    console.log(`PASS: ${passed}`);
    console.log(`FAIL: ${failed}`);

    if (failed > 0) {
        process.exitCode = 1;
    }
}

run().catch((error) => {
    console.error('Error ejecutando QA backend integrity:', error.message);
    process.exit(1);
});
