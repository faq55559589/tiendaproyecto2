const express = require('express');
const ReviewController = require('../controllers/reviewController');
const { authenticateToken, attachOptionalUser, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/product/:productId', attachOptionalUser, ReviewController.listByProduct);
router.post('/product/:productId', authenticateToken, ReviewController.create);
router.put('/:reviewId', authenticateToken, ReviewController.update);
router.delete('/:reviewId', authenticateToken, ReviewController.delete);
router.post('/:reviewId/comments', authenticateToken, ReviewController.createComment);
router.put('/comments/:commentId', authenticateToken, ReviewController.updateComment);
router.delete('/comments/:commentId', authenticateToken, ReviewController.deleteComment);

router.patch('/:reviewId/visibility', authenticateToken, requireRole('admin'), ReviewController.setReviewVisibilityAdmin);
router.patch('/comments/:commentId/visibility', authenticateToken, requireRole('admin'), ReviewController.setCommentVisibilityAdmin);

module.exports = router;
