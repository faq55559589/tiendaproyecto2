const express = require('express');
const ProductController = require('../controllers/productController');

const router = express.Router();

// Rutas públicas
router.get('/', ProductController.getAll);
router.get('/search', ProductController.search);
router.get('/:id', ProductController.getById);

// Rutas protegidas (admin) - agregar middleware de admin más adelante
// Rutas protegidas (admin) - TODO: agregar middleware de autenticación real
router.post('/', require('../middleware/upload').single('image'), ProductController.create);
router.put('/:id', require('../middleware/upload').single('image'), ProductController.update);
router.delete('/:id', ProductController.delete);

module.exports = router;