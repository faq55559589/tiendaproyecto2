const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { uploadsDir } = require('../config/paths');
const {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
} = require('../utils/emailService');
const { getJwtSecret, getBackendUrl } = require('../config/env');

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthController {
    static getUploadedAvatarUrl(req) {
        if (!req.file) return null;
        return `${getBackendUrl()}/uploads/${req.file.filename}`;
    }

    static removePreviousAvatar(previousUrl) {
        const rawValue = String(previousUrl || '').trim();
        if (!rawValue) return;

        let fileName = '';
        try {
            const parsed = new URL(rawValue);
            if (parsed.pathname.startsWith('/uploads/')) {
                fileName = path.basename(parsed.pathname);
            }
        } catch (error) {
            if (rawValue.startsWith('/uploads/')) {
                fileName = path.basename(rawValue);
            }
        }

        if (!fileName) return;

        const absolutePath = path.join(uploadsDir, fileName);
        if (!fs.existsSync(absolutePath)) return;

        try {
            fs.unlinkSync(absolutePath);
        } catch (error) {
            // Best effort cleanup. Profile update should not fail after DB success.
        }
    }

    static async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos invalidos',
                    errors: errors.array()
                });
            }

            const { email, password, first_name, last_name, phone, newsletter } = req.body;
            const existingUser = User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya esta registrado'
                });
            }

            const userId = await User.create({
                email,
                password,
                first_name,
                last_name,
                phone,
                newsletter: newsletter === true || newsletter === 'true' || newsletter === 1 || newsletter === '1'
            });

            const verificationToken = User.generateVerificationToken(email);

            try {
                await sendVerificationEmail(email, first_name, verificationToken);
            } catch (mailError) {
                console.error('Error enviando email de verificacion:', mailError.message);
                User.deleteById(userId);
                return res.status(500).json({
                    success: false,
                    message: 'Registro creado, pero no pudimos enviar el email de verificacion. Configura SMTP y solicita reenvio.'
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Registro exitoso. Por favor verifica tu email para activar la cuenta.',
                requireVerification: true
            });
        } catch (error) {
            console.error('Error en registro:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos invalidos',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;
            const user = User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales invalidas'
                });
            }

            if (Number(user.is_verified) === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Debes verificar tu email antes de iniciar sesion. Revisa tu correo.'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales invalidas'
                });
            }

            const token = jwt.sign(
                { userId: user.id },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return res.json({
                success: true,
                message: 'Login exitoso',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    is_verified: Number(user.is_verified) === 1,
                    avatar_url: user.avatar_url || null
                }
            });
        } catch (error) {
            console.error('Error en login:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static getProfile(req, res) {
        try {
            return res.json({
                success: true,
                user: req.user
            });
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static updateProfile(req, res) {
        try {
            const { first_name, last_name, phone, newsletter } = req.body;
            const nextAvatarUrl = AuthController.getUploadedAvatarUrl(req);
            const previousAvatarUrl = req.user && req.user.avatar_url ? req.user.avatar_url : null;

            User.update(req.user.id, {
                first_name,
                last_name,
                phone,
                newsletter,
                avatar_url: nextAvatarUrl
            });

            if (nextAvatarUrl && previousAvatarUrl && previousAvatarUrl !== nextAvatarUrl) {
                AuthController.removePreviousAvatar(previousAvatarUrl);
            }

            const updatedUser = User.findById(req.user.id);

            return res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                user: updatedUser
            });
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'El email es requerido'
                });
            }

            const result = User.generateResetToken(email);
            if (!result) {
                return res.json({
                    success: true,
                    message: 'Si el email esta registrado, recibiras instrucciones para recuperar tu contrasena'
                });
            }

            await sendPasswordResetEmail(email, result.user.first_name, result.token);

            return res.json({
                success: true,
                message: 'Si el email esta registrado, recibiras instrucciones para recuperar tu contrasena'
            });
        } catch (error) {
            console.error('Error en forgot password:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Token y nueva contrasena son requeridos'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contrasena debe tener al menos 6 caracteres'
                });
            }

            const result = await User.resetPassword(token, newPassword);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }

            return res.json({
                success: true,
                message: 'Contrasena actualizada exitosamente. Ya puedes iniciar sesion.'
            });
        } catch (error) {
            console.error('Error en reset password:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

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

            if (result.user) {
                try {
                    await sendWelcomeEmail(result.user.email, result.user.first_name);
                } catch (mailError) {
                    console.warn('No se pudo enviar email de bienvenida:', mailError.message);
                }
            }

            return res.json({
                success: true,
                message: 'Email verificado correctamente. Ya puedes iniciar sesion.'
            });
        } catch (error) {
            console.error('Error en verificacion:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static async resendVerification(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'El email es requerido'
                });
            }

            const user = User.findByEmail(email);
            if (!user) {
                return res.json({
                    success: true,
                    message: 'Si el email existe, enviaremos una nueva verificacion'
                });
            }

            if (Number(user.is_verified) === 1) {
                return res.json({
                    success: true,
                    message: 'La cuenta ya se encuentra verificada'
                });
            }

            const verificationToken = User.generateVerificationToken(email);
            await sendVerificationEmail(email, user.first_name, verificationToken);

            return res.json({
                success: true,
                message: 'Te enviamos un nuevo email de verificacion'
            });
        } catch (error) {
            console.error('Error reenviando verificacion:', error);
            return res.status(500).json({
                success: false,
                message: 'No se pudo reenviar la verificacion'
            });
        }
    }
}

module.exports = AuthController;
