const express = require('express');
const OrderController = require('../controllers/orderController');
const ProductController = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireRole('admin'));

router.get('/products', ProductController.getAllAdmin);
router.get('/orders', OrderController.getAllAdmin);
router.put('/orders/:id/status', OrderController.updateStatusAdmin);

module.exports = router;
