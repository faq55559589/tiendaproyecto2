const Product = require('../models/Product');

class ProductController {
    // Obtener todos los productos
    static async getAll(req, res) {
        try {
            const products = await Product.getAll();
            const formattedProducts = products.map(product => ({
                ...product,
                sizes: JSON.parse(product.sizes || '[]')
            }));
            res.json({
                success: true,
                products: formattedProducts
            });
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener producto por ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.getById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            product.sizes = JSON.parse(product.sizes || '[]');
            res.json({
                success: true,
                product
            });
        } catch (error) {
            console.error('Error obteniendo producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Buscar productos
    static async search(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda requerido'
                });
            }
            const products = await Product.search(q);
            const formattedProducts = products.map(product => ({
                ...product,
                sizes: JSON.parse(product.sizes || '[]')
            }));
            res.json({
                success: true,
                products: formattedProducts,
                searchTerm: q
            });
        } catch (error) {
            console.error('Error buscando productos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Crear producto (admin)
    static async create(req, res) {
        try {
            const { name, description, price, image_url, stock, sizes, category_id } = req.body;
            const productId = await Product.create({
                name, description, price, image_url, stock, sizes, category_id
            });
            res.status(201).json({
                success: true,
                message: 'Producto creado exitosamente',
                productId
            });
        } catch (error) {
            console.error('Error creando producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar producto (admin)
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, price, image_url, stock, sizes, category_id } = req.body;
            await Product.update(id, {
                name, description, price, image_url, stock, sizes, category_id
            });
            res.json({
                success: true,
                message: 'Producto actualizado exitosamente'
            });
        } catch (error) {
            console.error('Error actualizando producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Eliminar producto (admin)
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await Product.delete(id);
            res.json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error eliminando producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = ProductController;