const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateUploadedImages, removeFiles } = upload;

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Demasiados registros desde esta IP. Intenta de nuevo en 1 hora.'
    }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo en 1 hora.'
    }
});

const resendVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Demasiados reenvios. Intenta de nuevo en 1 hora.'
    }
});

const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim()
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

function handleAvatarUpload(req, res, next) {
    upload.single('avatar')(req, res, (error) => {
        if (!error) {
            const files = req.file ? [req.file] : [];
            const validation = validateUploadedImages(files);
            if (!validation.valid) {
                removeFiles(files);
                res.status(400).json({
                    success: false,
                    message: validation.message
                });
                return;
            }

            next();
            return;
        }

        let message = 'No se pudo procesar la foto de perfil';
        if (error.code === 'LIMIT_FILE_SIZE') {
            message = 'La foto de perfil debe pesar menos de 5 MB';
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Se envio un archivo en un formato no esperado';
        } else if (error.message) {
            message = error.message;
        }

        removeFiles(req.file ? [req.file] : []);
        res.status(400).json({
            success: false,
            message
        });
    });
}

router.post('/register', registerLimiter, registerValidation, AuthController.register);
router.post('/login', loginLimiter, loginValidation, AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, handleAvatarUpload, AuthController.updateProfile);
router.post('/forgot-password', forgotPasswordLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, AuthController.resendVerification);

module.exports = router;
