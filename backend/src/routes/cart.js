const express = require('express');
const CartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', CartController.getCart);
router.post('/', CartController.addItem);
router.put('/:itemId', CartController.updateItem);
router.delete('/:itemId', CartController.removeItem);

module.exports = router;
