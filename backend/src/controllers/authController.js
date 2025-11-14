const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
    // Registro de usuario
    static async register(req, res) {
        try {
            const { email, password, first_name, last_name, phone, newsletter } = req.body;
            
            // Validar que el email no exista
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }
            
            // Crear usuario
            const userId = await User.create({
                email,
                password,
                first_name,
                last_name,
                phone,
                newsletter: newsletter || false
            });
            
            // Generar token
            const token = jwt.sign(
                { userId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                token,
                user: {
                    id: userId,
                    email,
                    first_name,
                    last_name
                }
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
            const { email, password } = req.body;
            
            // Buscar usuario
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
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
                    last_name: user.last_name
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
    static async getProfile(req, res) {
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
    static async updateProfile(req, res) {
        try {
            const { first_name, last_name, phone, newsletter } = req.body;
            
            await User.update(req.user.id, {
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
}

module.exports = AuthController;
