const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting para login (máximo 5 intentos cada 15 minutos)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos
    message: {
        success: false,
        message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiting para registro (máximo 3 por hora)
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 registros
    message: {
        success: false,
        message: 'Demasiados registros desde esta IP. Intenta de nuevo en 1 hora.'
    }
});

// Rate limiting para recuperar contraseña (máximo 3 por hora)
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3,
    message: {
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo en 1 hora.'
    }
});

// Validaciones
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

// Rutas
router.post('/register', registerLimiter, registerValidation, AuthController.register);
router.post('/login', loginLimiter, loginValidation, AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);

// Rutas de recuperación y verificación
router.post('/forgot-password', forgotPasswordLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/verify-email', AuthController.verifyEmail);

module.exports = router;

