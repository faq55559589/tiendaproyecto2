const Product = require('../models/Product');

class ProductController {
    // Obtener todos los productos
    static getAll(req, res) {
        try {
            const products = Product.getAll();
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
    static getById(req, res) {
        try {
            const { id } = req.params;
            const product = Product.getById(id);
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
    static search(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda requerido'
                });
            }
            const products = Product.search(q);
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
    static create(req, res) {
        try {
            const { name, description, price, stock, sizes, category_id, specifications } = req.body;
            let image_url = req.body.image_url; // Fallback URL if provided manually

            // If file uploaded, use the file path
            if (req.file) {
                // Construct the full URL for the uploaded file
                // Assuming backend runs on port 3000
                const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
                image_url = `${baseUrl}/${req.file.filename}`;
            }

            const productId = Product.create({
                name,
                description,
                price,
                image_url,
                stock,
                sizes: typeof sizes === 'string' ? JSON.parse(sizes || '[]') : sizes,
                category_id,
                specifications
            });
            res.status(201).json({
                success: true,
                message: 'Producto creado exitosamente',
                productId,
                image_url
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
            const existingProduct = Product.getById(id);

            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            const { name, description, price, image_url, stock, sizes, category_id, specifications } = req.body;
            let finalImageUrl = image_url || existingProduct.image_url;

            if (req.file) {
                const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
                finalImageUrl = `${baseUrl}/${req.file.filename}`;
            }

            await Product.update(id, {
                name,
                description,
                price,
                image_url: finalImageUrl,
                stock,
                sizes: typeof sizes === 'string' ? JSON.parse(sizes || '[]') : sizes,
                category_id,
                specifications
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
