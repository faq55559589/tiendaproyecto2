const Review = require('../models/Review');

function normalizeBody(value) {
    return String(value || '').trim();
}

function getPermissions(user, productId) {
    const isLoggedIn = Boolean(user && user.id);
    const isVerified = isLoggedIn && Number(user.is_verified) === 1;
    const hasPurchased = isVerified ? Review.hasPurchasedProduct(user.id, productId) : false;
    const existingReview = isLoggedIn ? Review.getUserReviewForProduct(productId, user.id) : null;

    let reason = null;
    if (!isLoggedIn) {
        reason = 'Inicia sesion para ver si puedes reseñar.';
    } else if (!isVerified) {
        reason = 'Debes verificar tu email antes de participar.';
    } else if (!hasPurchased) {
        reason = 'Solo quienes ya compraron este producto pueden reseñar o comentar.';
    } else if (existingReview) {
        reason = 'Ya dejaste una reseña. Puedes editarla o comentar en el hilo.';
    }

    return {
        isLoggedIn,
        isVerified,
        hasPurchased,
        canReview: Boolean(isVerified && hasPurchased && !existingReview),
        canComment: Boolean(isVerified && hasPurchased),
        existingReviewId: existingReview ? existingReview.id : null,
        reason
    };
}

function validateReviewPayload(body) {
    const rating = Number(body.rating);
    const reviewBody = normalizeBody(body.body);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return { valid: false, message: 'La puntuacion debe ser un entero entre 1 y 5.' };
    }

    if (reviewBody.length < 12) {
        return { valid: false, message: 'La reseña debe tener al menos 12 caracteres.' };
    }

    if (reviewBody.length > 600) {
        return { valid: false, message: 'La reseña no puede superar los 600 caracteres.' };
    }

    return {
        valid: true,
        payload: {
            rating,
            body: reviewBody
        }
    };
}

function validateCommentPayload(body) {
    const commentBody = normalizeBody(body.body);
    if (commentBody.length < 3) {
        return { valid: false, message: 'El comentario es demasiado corto.' };
    }

    if (commentBody.length > 400) {
        return { valid: false, message: 'El comentario no puede superar los 400 caracteres.' };
    }

    return { valid: true, payload: { body: commentBody } };
}

class ReviewController {
    static listByProduct(req, res) {
        try {
            const productId = Number(req.params.productId);
            const product = Review.getReviewableProduct(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
            }

            const reviews = Review.getByProduct(productId);
            const summary = Review.getSummaryForProduct(productId);
            const permissions = getPermissions(req.user || null, productId);

            return res.json({
                success: true,
                reviews,
                summary,
                permissions
            });
        } catch (error) {
            console.error('Error listando reseñas:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static create(req, res) {
        try {
            const productId = Number(req.params.productId);
            const product = Review.getReviewableProduct(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
            }

            const permissions = getPermissions(req.user, productId);
            if (!permissions.canReview) {
                return res.status(403).json({ success: false, message: permissions.reason || 'No puedes reseñar este producto.' });
            }

            const validation = validateReviewPayload(req.body || {});
            if (!validation.valid) {
                return res.status(400).json({ success: false, message: validation.message });
            }

            const review = Review.create({
                productId,
                userId: req.user.id,
                ...validation.payload
            });

            return res.status(201).json({ success: true, review });
        } catch (error) {
            if (String(error.message || '').includes('UNIQUE constraint failed')) {
                return res.status(409).json({ success: false, message: 'Ya dejaste una reseña para este producto.' });
            }
            console.error('Error creando reseña:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static update(req, res) {
        try {
            const reviewId = Number(req.params.reviewId);
            const target = Review.getOwnershipForReview(reviewId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Reseña no encontrada.' });
            }

            if (Number(target.user_id) !== Number(req.user.id)) {
                return res.status(403).json({ success: false, message: 'Solo puedes editar tus propias reseñas.' });
            }

            const validation = validateReviewPayload(req.body || {});
            if (!validation.valid) {
                return res.status(400).json({ success: false, message: validation.message });
            }

            const review = Review.update(reviewId, validation.payload);
            return res.json({ success: true, review });
        } catch (error) {
            console.error('Error editando reseña:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static delete(req, res) {
        try {
            const reviewId = Number(req.params.reviewId);
            const target = Review.getOwnershipForReview(reviewId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Reseña no encontrada.' });
            }

            const isAdmin = String(req.user.role || '') === 'admin';
            if (!isAdmin && Number(target.user_id) !== Number(req.user.id)) {
                return res.status(403).json({ success: false, message: 'No puedes borrar esta reseña.' });
            }

            Review.delete(reviewId);
            return res.json({ success: true, message: 'Reseña eliminada.' });
        } catch (error) {
            console.error('Error eliminando reseña:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static createComment(req, res) {
        try {
            const reviewId = Number(req.params.reviewId);
            const reviewTarget = Review.getOwnershipForReview(reviewId);
            if (!reviewTarget) {
                return res.status(404).json({ success: false, message: 'Reseña no encontrada.' });
            }

            const permissions = getPermissions(req.user, Number(reviewTarget.product_id));
            if (!permissions.canComment) {
                return res.status(403).json({ success: false, message: permissions.reason || 'No puedes comentar en este producto.' });
            }

            const validation = validateCommentPayload(req.body || {});
            if (!validation.valid) {
                return res.status(400).json({ success: false, message: validation.message });
            }

            const comment = Review.createComment({
                reviewId,
                userId: req.user.id,
                ...validation.payload
            });

            return res.status(201).json({ success: true, comment });
        } catch (error) {
            console.error('Error creando comentario:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static updateComment(req, res) {
        try {
            const commentId = Number(req.params.commentId);
            const target = Review.getOwnershipForComment(commentId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Comentario no encontrado.' });
            }

            if (Number(target.user_id) !== Number(req.user.id)) {
                return res.status(403).json({ success: false, message: 'Solo puedes editar tus propios comentarios.' });
            }

            const validation = validateCommentPayload(req.body || {});
            if (!validation.valid) {
                return res.status(400).json({ success: false, message: validation.message });
            }

            const comment = Review.updateComment(commentId, validation.payload);
            return res.json({ success: true, comment });
        } catch (error) {
            console.error('Error editando comentario:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static deleteComment(req, res) {
        try {
            const commentId = Number(req.params.commentId);
            const target = Review.getOwnershipForComment(commentId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Comentario no encontrado.' });
            }

            const isAdmin = String(req.user.role || '') === 'admin';
            if (!isAdmin && Number(target.user_id) !== Number(req.user.id)) {
                return res.status(403).json({ success: false, message: 'No puedes borrar este comentario.' });
            }

            Review.deleteComment(commentId);
            return res.json({ success: true, message: 'Comentario eliminado.' });
        } catch (error) {
            console.error('Error eliminando comentario:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static setReviewVisibilityAdmin(req, res) {
        try {
            const reviewId = Number(req.params.reviewId);
            const target = Review.getOwnershipForReview(reviewId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Reseña no encontrada.' });
            }

            const review = Review.setHidden(reviewId, req.body?.is_hidden === true || req.body?.is_hidden === 'true');
            return res.json({ success: true, review });
        } catch (error) {
            console.error('Error cambiando visibilidad de reseña:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static setCommentVisibilityAdmin(req, res) {
        try {
            const commentId = Number(req.params.commentId);
            const target = Review.getOwnershipForComment(commentId);
            if (!target) {
                return res.status(404).json({ success: false, message: 'Comentario no encontrado.' });
            }

            const comment = Review.setCommentHidden(commentId, req.body?.is_hidden === true || req.body?.is_hidden === 'true');
            return res.json({ success: true, comment });
        } catch (error) {
            console.error('Error cambiando visibilidad de comentario:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

module.exports = ReviewController;
