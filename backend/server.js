const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { runMigrations } = require('./src/config/migrations');
const { startOrderExpirationJob } = require('./src/services/orderExpirationService');
const { getAllowedOrigins, getJwtSecret } = require('./src/config/env');

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = getAllowedOrigins();

// Force JWT validation at startup so production never runs with weak defaults.
getJwtSecret();

// Configuracion CORS (restringido a origenes definidos)
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('uploads'));
runMigrations();
const expirationJob = startOrderExpirationJob();

// Rutas
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/admin', require('./src/routes/admin'));

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Mantener el servidor activo
server.on('error', (err) => {
    console.error('Error del servidor:', err);
});

process.on('SIGINT', () => {
    console.log('\nCerrando servidor...');
    clearInterval(expirationJob);
    server.close(() => {
        process.exit(0);
    });
});
