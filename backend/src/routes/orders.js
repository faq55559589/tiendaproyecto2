const express = require('express');
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/', OrderController.create);
router.get('/', OrderController.getMine);
router.get('/:id', OrderController.getById);

module.exports = router;
