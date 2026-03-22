const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { uploadsDir, ensureDir } = require('../config/paths');

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

if (!fs.existsSync(uploadsDir)) {
    ensureDir(uploadsDir);
}

function detectImageType(filePath) {
    const buffer = fs.readFileSync(filePath);

    if (buffer.length >= 3 && buffer.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
        return 'image/jpeg';
    }

    if (
        buffer.length >= 8 &&
        buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
        return 'image/png';
    }

    if (
        buffer.length >= 12 &&
        buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
        buffer.slice(8, 12).toString('ascii') === 'WEBP'
    ) {
        return 'image/webp';
    }

    return null;
}

function removeFiles(files) {
    (files || []).forEach((file) => {
        if (!file || !file.path) {
            return;
        }

        try {
            fs.unlinkSync(file.path);
        } catch (error) {
            // Ignore cleanup errors because the request is already failing.
        }
    });
}

function validateUploadedImages(files) {
    const safeFiles = Array.isArray(files) ? files : [];
    for (const file of safeFiles) {
        const extension = path.extname(file.originalname || '').toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.has(extension) || !ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
            return {
                valid: false,
                message: 'Solo se permiten imagenes JPG, PNG o WEBP'
            };
        }

        const detectedType = detectImageType(file.path);
        if (!detectedType || detectedType !== file.mimetype) {
            return {
                valid: false,
                message: 'La imagen subida no coincide con su tipo declarado'
            };
        }
    }

    return { valid: true };
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (ALLOWED_IMAGE_EXTENSIONS.has(extension) && ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imagenes JPG, PNG o WEBP'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = upload;
module.exports.validateUploadedImages = validateUploadedImages;
module.exports.removeFiles = removeFiles;
