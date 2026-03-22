const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/env');

const JWT_SECRET = getJwtSecret();

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de acceso requerido' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
};

const attachOptionalUser = async (req, _res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
            req.user = user;
        }
    } catch (error) {
        // Public route: invalid token should not block anonymous access.
    }

    next();
};

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        const role = req.user && req.user.role ? req.user.role : 'user';
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para esta accion'
            });
        }
        return next();
    };
};

module.exports = { authenticateToken, attachOptionalUser, requireRole };
