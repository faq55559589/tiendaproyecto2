const express = require('express');
const ProductController = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Rutas publicas
router.get('/', ProductController.getAll);
router.get('/search', ProductController.search);
router.get('/:id', ProductController.getById);

// Rutas protegidas (admin)
router.post('/', authenticateToken, requireRole('admin'), upload.single('image'), ProductController.create);
router.put('/:id', authenticateToken, requireRole('admin'), upload.single('image'), ProductController.update);
router.delete('/:id', authenticateToken, requireRole('admin'), ProductController.delete);

module.exports = router;
