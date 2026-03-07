const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartController {
    static getCart(req, res) {
        try {
            const items = Cart.getByUser(req.user.id);
            res.json({ success: true, items });
        } catch (error) {
            console.error('Error obteniendo carrito:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static addItem(req, res) {
        try {
            const productId = Number(req.body.product_id);
            const quantity = Math.max(1, Number(req.body.quantity || 1));
            const size = String(req.body.size || 'M');

            const product = Product.getById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const currentItem = Cart.findItem(req.user.id, productId, size);
            const nextQuantity = (currentItem ? Number(currentItem.quantity) : 0) + quantity;
            if (Number(product.stock || 0) <= 0 || nextQuantity > Number(product.stock || 0)) {
                return res.status(400).json({ success: false, message: 'Stock insuficiente para este producto' });
            }

            Cart.addOrIncrement(req.user.id, productId, size, quantity);
            const items = Cart.getByUser(req.user.id);
            return res.status(201).json({ success: true, items });
        } catch (error) {
            console.error('Error agregando al carrito:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static updateItem(req, res) {
        try {
            const itemId = Number(req.params.itemId);
            const quantity = Math.max(1, Number(req.body.quantity || 1));
            const cartItem = Cart.getItemById(req.user.id, itemId);

            if (!cartItem) {
                return res.status(404).json({ success: false, message: 'Item no encontrado' });
            }

            if (quantity > Number(cartItem.stock || 0)) {
                return res.status(400).json({ success: false, message: 'Stock insuficiente para este producto' });
            }

            const result = Cart.updateQuantity(req.user.id, itemId, quantity);

            if (result.changes === 0) {
                return res.status(404).json({ success: false, message: 'Item no encontrado' });
            }

            const items = Cart.getByUser(req.user.id);
            return res.json({ success: true, items });
        } catch (error) {
            console.error('Error actualizando carrito:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static removeItem(req, res) {
        try {
            const itemId = Number(req.params.itemId);
            const result = Cart.remove(req.user.id, itemId);

            if (result.changes === 0) {
                return res.status(404).json({ success: false, message: 'Item no encontrado' });
            }

            const items = Cart.getByUser(req.user.id);
            return res.json({ success: true, items });
        } catch (error) {
            console.error('Error eliminando item de carrito:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

module.exports = CartController;
