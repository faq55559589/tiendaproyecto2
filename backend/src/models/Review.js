const db = require('../config/database');

const PURCHASED_STATUSES = ['confirmed', 'delivered'];

function normalizeBody(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
}

function mapReviewRow(row) {
    return {
        id: Number(row.id),
        product_id: Number(row.product_id),
        user_id: Number(row.user_id),
        rating: Number(row.rating),
        body: row.body,
        is_hidden: Number(row.is_hidden || 0) === 1,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author: {
            id: Number(row.user_id),
            first_name: row.first_name,
            last_name: row.last_name,
            avatar_url: row.avatar_url || null
        }
    };
}

function mapCommentRow(row) {
    return {
        id: Number(row.id),
        review_id: Number(row.review_id),
        user_id: Number(row.user_id),
        body: row.body,
        is_hidden: Number(row.is_hidden || 0) === 1,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author: {
            id: Number(row.user_id),
            first_name: row.first_name,
            last_name: row.last_name,
            avatar_url: row.avatar_url || null
        }
    };
}

class Review {
    static getReviewableProduct(productId) {
        return db.prepare('SELECT id, name, is_active FROM products WHERE id = ?').get(productId);
    }

    static hasPurchasedProduct(userId, productId) {
        const row = db.prepare(
            `
            SELECT 1
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.user_id = ?
              AND oi.product_id = ?
              AND o.status IN (${PURCHASED_STATUSES.map(() => '?').join(', ')})
            LIMIT 1
            `
        ).get(userId, productId, ...PURCHASED_STATUSES);

        return Boolean(row);
    }

    static getUserReviewForProduct(productId, userId) {
        const row = db.prepare(
            `
            SELECT
                r.*,
                u.first_name,
                u.last_name,
                u.avatar_url
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.product_id = ? AND r.user_id = ?
            LIMIT 1
            `
        ).get(productId, userId);

        return row ? mapReviewRow(row) : null;
    }

    static getSummaryForProduct(productId) {
        const row = db.prepare(
            `
            SELECT
                COUNT(*) AS total_reviews,
                ROUND(AVG(rating), 1) AS average_rating
            FROM reviews
            WHERE product_id = ?
              AND COALESCE(is_hidden, 0) = 0
            `
        ).get(productId);

        const distributionRows = db.prepare(
            `
            SELECT rating, COUNT(*) AS total
            FROM reviews
            WHERE product_id = ?
              AND COALESCE(is_hidden, 0) = 0
            GROUP BY rating
            ORDER BY rating DESC
            `
        ).all(productId);

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distributionRows.forEach((item) => {
            distribution[Number(item.rating)] = Number(item.total || 0);
        });

        return {
            total_reviews: Number(row?.total_reviews || 0),
            average_rating: Number(row?.average_rating || 0),
            distribution
        };
    }

    static getByProduct(productId) {
        const reviewRows = db.prepare(
            `
            SELECT
                r.*,
                u.first_name,
                u.last_name,
                u.avatar_url
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.product_id = ?
              AND COALESCE(r.is_hidden, 0) = 0
            ORDER BY datetime(r.created_at) DESC, r.id DESC
            `
        ).all(productId);

        const reviews = reviewRows.map(mapReviewRow);
        if (!reviews.length) {
            return reviews;
        }

        const commentsRows = db.prepare(
            `
            SELECT
                rc.*,
                u.first_name,
                u.last_name,
                u.avatar_url
            FROM review_comments rc
            JOIN users u ON u.id = rc.user_id
            WHERE rc.review_id IN (${reviews.map(() => '?').join(', ')})
              AND COALESCE(rc.is_hidden, 0) = 0
            ORDER BY datetime(rc.created_at) ASC, rc.id ASC
            `
        ).all(...reviews.map((review) => review.id));

        const commentsByReviewId = new Map(reviews.map((review) => [review.id, []]));
        commentsRows.forEach((row) => {
            const list = commentsByReviewId.get(Number(row.review_id));
            if (list) {
                list.push(mapCommentRow(row));
            }
        });

        return reviews.map((review) => ({
            ...review,
            comments: commentsByReviewId.get(review.id) || []
        }));
    }

    static create({ productId, userId, rating, body }) {
        const result = db.prepare(
            `
            INSERT INTO reviews (product_id, user_id, rating, body)
            VALUES (?, ?, ?, ?)
            `
        ).run(productId, userId, Number(rating), normalizeBody(body));

        return this.getById(result.lastInsertRowid);
    }

    static update(reviewId, { rating, body }) {
        db.prepare(
            `
            UPDATE reviews
            SET rating = ?, body = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `
        ).run(Number(rating), normalizeBody(body), reviewId);

        return this.getById(reviewId);
    }

    static getById(reviewId) {
        const row = db.prepare(
            `
            SELECT
                r.*,
                u.first_name,
                u.last_name,
                u.avatar_url
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.id = ?
            LIMIT 1
            `
        ).get(reviewId);

        if (!row) return null;
        const review = mapReviewRow(row);
        const comments = db.prepare(
            `
            SELECT
                rc.*,
                u.first_name,
                u.last_name,
                u.avatar_url
            FROM review_comments rc
            JOIN users u ON u.id = rc.user_id
            WHERE rc.review_id = ?
              AND COALESCE(rc.is_hidden, 0) = 0
            ORDER BY datetime(rc.created_at) ASC, rc.id ASC
            `
        ).all(reviewId).map(mapCommentRow);

        return {
            ...review,
            comments
        };
    }

    static delete(reviewId) {
        return db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);
    }

    static setHidden(reviewId, isHidden) {
        db.prepare(
            `
            UPDATE reviews
            SET is_hidden = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `
        ).run(Number(Boolean(isHidden)), reviewId);

        return this.getById(reviewId);
    }

    static createComment({ reviewId, userId, body }) {
        const result = db.prepare(
            `
            INSERT INTO review_comments (review_id, user_id, body)
            VALUES (?, ?, ?)
            `
        ).run(reviewId, userId, normalizeBody(body));

        return this.getCommentById(result.lastInsertRowid);
    }

    static updateComment(commentId, { body }) {
        db.prepare(
            `
            UPDATE review_comments
            SET body = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `
        ).run(normalizeBody(body), commentId);

        return this.getCommentById(commentId);
    }

    static getCommentById(commentId) {
        const row = db.prepare(
            `
            SELECT
                rc.*,
                u.first_name,
                u.last_name,
                u.avatar_url
            FROM review_comments rc
            JOIN users u ON u.id = rc.user_id
            WHERE rc.id = ?
            LIMIT 1
            `
        ).get(commentId);

        return row ? mapCommentRow(row) : null;
    }

    static deleteComment(commentId) {
        return db.prepare('DELETE FROM review_comments WHERE id = ?').run(commentId);
    }

    static setCommentHidden(commentId, isHidden) {
        db.prepare(
            `
            UPDATE review_comments
            SET is_hidden = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `
        ).run(Number(Boolean(isHidden)), commentId);

        return this.getCommentById(commentId);
    }

    static getOwnershipForReview(reviewId) {
        return db.prepare('SELECT id, user_id, product_id FROM reviews WHERE id = ?').get(reviewId);
    }

    static getOwnershipForComment(commentId) {
        return db.prepare(
            `
            SELECT rc.id, rc.user_id, rc.review_id, r.product_id
            FROM review_comments rc
            JOIN reviews r ON r.id = rc.review_id
            WHERE rc.id = ?
            `
        ).get(commentId);
    }
}

module.exports = Review;
