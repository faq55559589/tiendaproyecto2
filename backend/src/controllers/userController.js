const User = require('../models/User');

class UserController {
    static getAllAdmin(req, res) {
        try {
            const users = User.getAllAdmin().map((user) => ({
                ...user,
                is_verified: Number(user.is_verified || 0) === 1,
                newsletter: Number(user.newsletter || 0) === 1,
                orders_count: Number(user.orders_count || 0)
            }));

            return res.json({
                success: true,
                users
            });
        } catch (error) {
            console.error('Error listando usuarios admin:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = UserController;
