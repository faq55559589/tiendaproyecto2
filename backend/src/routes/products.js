const express = require('express');
const ProductController = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

function handleProductUpload(req, res, next) {
    upload.array('images', 8)(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        let message = 'No se pudieron procesar las imagenes del producto';
        if (error.code === 'LIMIT_FILE_SIZE') {
            message = 'Cada imagen debe pesar menos de 5 MB';
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Se enviaron imagenes en un formato no esperado';
        } else if (error.message) {
            message = error.message;
        }

        res.status(400).json({
            success: false,
            message
        });
    });
}

// Rutas publicas
router.get('/', ProductController.getAll);
router.get('/search', ProductController.search);
router.get('/:id', ProductController.getById);

// Rutas protegidas (admin)
router.post('/', authenticateToken, requireRole('admin'), handleProductUpload, ProductController.create);
router.put('/:id', authenticateToken, requireRole('admin'), handleProductUpload, ProductController.update);
router.delete('/:id', authenticateToken, requireRole('admin'), ProductController.delete);

module.exports = router;
