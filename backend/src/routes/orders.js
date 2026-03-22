const express = require('express');
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/mercado-pago/webhook', OrderController.handleMercadoPagoWebhook);
router.get('/mercado-pago/return', OrderController.handleMercadoPagoReturn);

router.use(authenticateToken);

router.post('/', OrderController.create);
router.get('/', OrderController.getMine);
router.get('/:id', OrderController.getById);
router.post('/:id/mercado-pago-preference', OrderController.createMercadoPagoPreference);

module.exports = router;
