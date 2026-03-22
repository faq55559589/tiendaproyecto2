const express = require('express');
const OrderController = require('../controllers/orderController');
const ProductController = require('../controllers/productController');
const UserController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateUploadedImages, removeFiles } = upload;

const router = express.Router();

function handleProductUpload(req, res, next) {
    upload.array('images', 8)(req, res, (error) => {
        if (!error) {
            const validation = validateUploadedImages(req.files || []);
            if (!validation.valid) {
                removeFiles(req.files || []);
                res.status(400).json({
                    success: false,
                    message: validation.message
                });
                return;
            }

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

        removeFiles(req.files || []);
        res.status(400).json({
            success: false,
            message
        });
    });
}

router.use(authenticateToken, requireRole('admin'));

router.get('/products', ProductController.getAllAdmin);
router.post('/products', handleProductUpload, ProductController.create);
router.put('/products/:id', handleProductUpload, ProductController.update);
router.delete('/products/:id', ProductController.delete);
router.get('/orders', OrderController.getAllAdmin);
router.put('/orders/:id/status', OrderController.updateStatusAdmin);
router.get('/users', UserController.getAllAdmin);

module.exports = router;
