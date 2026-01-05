const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendWelcomeEmail, sendVerificationEmail } = require('../utils/emailService');

class AuthController {
    // Registro de usuario
    static async register(req, res) {
        try {
            // Verificar errores de validación
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { email, password, first_name, last_name, phone, newsletter } = req.body;

            // Validar que el email no exista
            const existingUser = User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Crear usuario (await porque bcrypt.hash es async)
            const userId = await User.create({
                email,
                password,
                first_name,
                last_name,
                phone,
                newsletter: newsletter || false
            });

            // Generar token de verificación
            const verificationToken = User.generateVerificationToken(email);

            // Enviar email de verificación
            await sendVerificationEmail(email, first_name, verificationToken);

            res.status(201).json({
                success: true,
                message: 'Registro exitoso. Por favor verifica tu email para activar la cuenta.',
                requireVerification: true
            });

        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Login de usuario
    static async login(req, res) {
        try {
            // Verificar errores de validación
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Buscar usuario
            const user = User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Verificar si está verificado
            if (user.is_verified === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Debes verificar tu email antes de iniciar sesión. Revisa tu correo.'
                });
            }

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Generar token
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.json({
                success: true,
                message: 'Login exitoso',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener perfil del usuario
    static getProfile(req, res) {
        try {
            res.json({
                success: true,
                user: req.user
            });
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar perfil del usuario
    static updateProfile(req, res) {
        try {
            const { first_name, last_name, phone, newsletter } = req.body;

            User.update(req.user.id, {
                first_name,
                last_name,
                phone,
                newsletter
            });

            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error actualizando perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Solicitar recuperación de contraseña
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'El email es requerido'
                });
            }

            // Generar token de reset
            const result = User.generateResetToken(email);

            if (!result) {
                // Por seguridad, no revelamos si el email existe o no
                return res.json({
                    success: true,
                    message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña'
                });
            }

            // Enviar email con el link de recuperación
            const { sendPasswordResetEmail } = require('../utils/emailService');
            await sendPasswordResetEmail(email, result.user.first_name, result.token);

            res.json({
                success: true,
                message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña'
            });

        } catch (error) {
            console.error('Error en forgot password:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Resetear contraseña con token
    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Token y nueva contraseña son requeridos'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Resetear contraseña usando el método del modelo
            const result = await User.resetPassword(token, newPassword);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente. Ya podés iniciar sesión.'
            });

        } catch (error) {
            console.error('Error en reset password:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Verificar email
    static async verifyEmail(req, res) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token requerido'
                });
            }

            const result = User.verifyEmail(token);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }

            // Enviar email de bienvenida tras verificar
            if (result.user) {
                await sendWelcomeEmail(result.user.email, result.user.first_name);
            }

            res.json({
                success: true,
                message: 'Email verificado correctamente. Ya puedes iniciar sesión.'
            });

        } catch (error) {
            console.error('Error en verificación:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AuthController;
