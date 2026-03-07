const Product = require('../models/Product');

class ProductController {
    static getUploadedImageUrls(req) {
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        return (req.files || []).map((file) => `${baseUrl}/${file.filename}`);
    }

    static parseImageUrls(rawValue) {
        if (!rawValue) return [];
        if (Array.isArray(rawValue)) {
            return rawValue.map((item) => String(item || '').trim()).filter(Boolean);
        }

        try {
            const parsedValue = JSON.parse(rawValue);
            if (Array.isArray(parsedValue)) {
                return parsedValue.map((item) => String(item || '').trim()).filter(Boolean);
            }
        } catch (error) {
            return String(rawValue)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }

        return [];
    }

    static normalizeImageUrls(imageUrls) {
        return [...new Set((imageUrls || []).map((item) => String(item || '').trim()).filter(Boolean))];
    }

    static formatProduct(product) {
        const imageUrls = ProductController.normalizeImageUrls([
            ...ProductController.parseImageUrls(product.image_urls),
            ...(product.image_url ? [product.image_url] : [])
        ]);

        return {
            ...product,
            sizes: JSON.parse(product.sizes || '[]'),
            is_active: Number(product.is_active ?? 1) === 1,
            image_url: imageUrls[0] || null,
            image_urls: imageUrls
        };
    }

    // Obtener todos los productos
    static getAll(req, res) {
        try {
            const products = Product.getAll();
            const formattedProducts = products.map((product) => ProductController.formatProduct(product));
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

    static getAllAdmin(req, res) {
        try {
            const products = Product.getAllAdmin();
            const formattedProducts = products.map((product) => ProductController.formatProduct(product));
            res.json({
                success: true,
                products: formattedProducts
            });
        } catch (error) {
            console.error('Error obteniendo productos admin:', error);
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
            res.json({
                success: true,
                product: ProductController.formatProduct(product)
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
            const formattedProducts = products.map((product) => ProductController.formatProduct(product));
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
            const uploadedImageUrls = ProductController.getUploadedImageUrls(req);
            const imageUrls = ProductController.normalizeImageUrls(
                uploadedImageUrls.length
                    ? uploadedImageUrls
                    : [
                        ...ProductController.parseImageUrls(req.body.image_urls),
                        ...(req.body.image_url ? [req.body.image_url] : [])
                    ]
            );
            const image_url = imageUrls[0] || null;

            const productId = Product.create({
                name,
                description,
                price,
                image_url,
                image_urls: imageUrls,
                is_active: true,
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
            const existingProduct = Product.getByIdAdmin(id);

            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            const { name, description, price, image_url, stock, sizes, category_id, specifications } = req.body;
            const existingImageUrls = ProductController.normalizeImageUrls([
                ...ProductController.parseImageUrls(existingProduct.image_urls),
                ...(existingProduct.image_url ? [existingProduct.image_url] : [])
            ]);
            const uploadedImageUrls = ProductController.getUploadedImageUrls(req);
            const hasImageUrlsField = Object.prototype.hasOwnProperty.call(req.body, 'image_urls');
            const isActive = Object.prototype.hasOwnProperty.call(req.body, 'is_active')
                ? String(req.body.is_active) === 'true' || String(req.body.is_active) === '1'
                : Number(existingProduct.is_active ?? 1) === 1;
            const requestedImageUrls = ProductController.parseImageUrls(req.body.image_urls);
            const baseImageUrls = hasImageUrlsField ? requestedImageUrls : existingImageUrls;
            const nextImageUrls = ProductController.normalizeImageUrls([...baseImageUrls, ...uploadedImageUrls]);
            const finalImageUrl = nextImageUrls[0] || null;

            await Product.update(id, {
                name,
                description,
                price,
                image_url: finalImageUrl,
                image_urls: nextImageUrls,
                is_active: isActive,
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
            const existingProduct = Product.getByIdAdmin(id);
            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            if (Product.hasOrderReferences(id)) {
                Product.setActiveState(id, false);
                return res.json({
                    success: true,
                    message: 'Producto desactivado porque ya forma parte de pedidos.',
                    deactivated: true
                });
            }

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
