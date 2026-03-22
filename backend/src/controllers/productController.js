const Product = require('../models/Product');
const { getBackendUrl } = require('../config/env');

function safeParseJson(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        return fallback;
    }
}

function normalizeText(value) {
    return String(value || '').trim();
}

class ProductController {
    static getUploadedImageUrls(req) {
        const baseUrl = getBackendUrl();
        return (req.files || []).map((file) => `${baseUrl}/uploads/${file.filename}`);
    }

    static parseImageUrls(rawValue) {
        if (!rawValue) return [];
        if (Array.isArray(rawValue)) {
            return rawValue.map((item) => normalizeText(item)).filter(Boolean);
        }

        if (typeof rawValue === 'string') {
            const trimmed = rawValue.trim();
            if (!trimmed) return [];

            const parsedValue = safeParseJson(trimmed, null);
            if (Array.isArray(parsedValue)) {
                return parsedValue.map((item) => normalizeText(item)).filter(Boolean);
            }

            return trimmed
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }

        return [];
    }

    static parseSizes(rawValue) {
        if (Array.isArray(rawValue)) {
            return rawValue.map((item) => normalizeText(item)).filter(Boolean);
        }

        if (typeof rawValue === 'string') {
            const trimmed = rawValue.trim();
            if (!trimmed) {
                return [];
            }

            const parsedValue = safeParseJson(trimmed, null);
            if (Array.isArray(parsedValue)) {
                return parsedValue.map((item) => normalizeText(item)).filter(Boolean);
            }

            return trimmed
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }

        return [];
    }

    static normalizeImageUrls(imageUrls) {
        return [...new Set((imageUrls || []).map((item) => normalizeText(item)).filter(Boolean))];
    }

    static formatProduct(product) {
        const imageUrls = ProductController.normalizeImageUrls([
            ...ProductController.parseImageUrls(product.image_urls),
            ...(product.image_url ? [product.image_url] : [])
        ]);

        return {
            ...product,
            sizes: ProductController.parseSizes(product.sizes),
            is_active: Number(product.is_active ?? 1) === 1,
            has_order_references: Number(product.has_order_references || 0) === 1,
            has_blocking_order_references: Number(product.has_blocking_order_references || 0) === 1,
            image_url: imageUrls[0] || null,
            image_urls: imageUrls
        };
    }

    static validateProductPayload(body) {
        const name = normalizeText(body.name);
        const price = Number(body.price);
        const stock = Number(body.stock);
        const categoryIdRaw = normalizeText(body.category_id);
        const categoryId = categoryIdRaw ? Number(categoryIdRaw) : null;
        const sizes = ProductController.parseSizes(body.sizes);

        if (!name) {
            return { valid: false, message: 'El nombre del producto es obligatorio' };
        }

        if (!Number.isFinite(price) || price < 0) {
            return { valid: false, message: 'El precio del producto es invalido' };
        }

        if (!Number.isInteger(stock) || stock < 0) {
            return { valid: false, message: 'El stock del producto es invalido' };
        }

        if (categoryIdRaw && (!Number.isInteger(categoryId) || categoryId < 1)) {
            return { valid: false, message: 'La categoria del producto es invalida' };
        }

        return {
            valid: true,
            payload: {
                name,
                description: normalizeText(body.description),
                price,
                stock,
                sizes: sizes.length ? sizes : ['M'],
                category_id: categoryId,
                specifications: normalizeText(body.specifications) || null
            }
        };
    }

    static getAll(req, res) {
        try {
            const products = Product.getAll();
            res.json({
                success: true,
                products: products.map((product) => ProductController.formatProduct(product))
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
            res.json({
                success: true,
                products: products.map((product) => ProductController.formatProduct(product))
            });
        } catch (error) {
            console.error('Error obteniendo productos admin:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static getById(req, res) {
        try {
            const product = Product.getById(req.params.id);
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

    static search(req, res) {
        try {
            const query = normalizeText(req.query.q);
            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Termino de busqueda requerido'
                });
            }

            const products = Product.search(query);
            res.json({
                success: true,
                products: products.map((product) => ProductController.formatProduct(product)),
                searchTerm: query
            });
        } catch (error) {
            console.error('Error buscando productos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static create(req, res) {
        try {
            const body = req.body || {};
            const validation = ProductController.validateProductPayload(body);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: validation.message
                });
            }

            const uploadedImageUrls = ProductController.getUploadedImageUrls(req);
            const imageUrls = ProductController.normalizeImageUrls(
                uploadedImageUrls.length
                    ? uploadedImageUrls
                    : [
                        ...ProductController.parseImageUrls(body.image_urls),
                        ...(body.image_url ? [body.image_url] : [])
                    ]
            );
            const image_url = imageUrls[0] || null;

            const productId = Product.create({
                ...validation.payload,
                image_url,
                image_urls: imageUrls,
                is_active: true
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

    static update(req, res) {
        try {
            const body = req.body || {};
            const existingProduct = Product.getByIdAdmin(req.params.id);
            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            const validation = ProductController.validateProductPayload(body);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: validation.message
                });
            }

            const existingImageUrls = ProductController.normalizeImageUrls([
                ...ProductController.parseImageUrls(existingProduct.image_urls),
                ...(existingProduct.image_url ? [existingProduct.image_url] : [])
            ]);
            const uploadedImageUrls = ProductController.getUploadedImageUrls(req);
            const hasImageUrlsField = Object.prototype.hasOwnProperty.call(body, 'image_urls');
            const requestedImageUrls = ProductController.parseImageUrls(body.image_urls);
            const baseImageUrls = hasImageUrlsField ? requestedImageUrls : existingImageUrls;
            const nextImageUrls = ProductController.normalizeImageUrls([...baseImageUrls, ...uploadedImageUrls]);
            const isActive = Object.prototype.hasOwnProperty.call(body, 'is_active')
                ? ['true', '1'].includes(String(body.is_active).toLowerCase())
                : Number(existingProduct.is_active ?? 1) === 1;

            Product.update(req.params.id, {
                ...validation.payload,
                image_url: nextImageUrls[0] || null,
                image_urls: nextImageUrls,
                is_active: isActive
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

    static delete(req, res) {
        try {
            const existingProduct = Product.getByIdAdmin(req.params.id);
            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            if (Product.hasBlockingOrderReferences(req.params.id)) {
                return res.status(409).json({
                    success: false,
                    message: 'No puedes eliminar un producto que forma parte de pedidos activos o entregados. Desactivalo para quitarlo del catalogo.'
                });
            }

            Product.delete(req.params.id);
            res.json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error eliminando producto:', error);
            const errorMessage = String(error && error.message ? error.message : '');
            if (
                errorMessage.includes('FOREIGN KEY constraint failed') ||
                errorMessage.includes('SQLITE_CONSTRAINT_FOREIGNKEY')
            ) {
                return res.status(409).json({
                    success: false,
                    message: 'No se pudo eliminar el producto porque todavia tiene referencias en pedidos guardados. Para permitir este borrado habria que limpiar o migrar ese historial primero.'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = ProductController;
