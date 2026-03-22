const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const { runMigrations } = require('./src/config/migrations');
const { startOrderExpirationJob } = require('./src/services/orderExpirationService');
const { getAllowedOrigins, getJwtSecret, assertProductionConfig } = require('./src/config/env');
const { uploadsDir, ensureDir } = require('./src/config/paths');

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = getAllowedOrigins();

// Force JWT validation at startup so production never runs with weak defaults.
getJwtSecret();
assertProductionConfig();

// Railway forwards client IPs through a proxy/load balancer.
app.set('trust proxy', 1);

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
ensureDir(uploadsDir);
app.use('/uploads', express.static(uploadsDir, {
    dotfiles: 'deny',
    index: false,
    immutable: true,
    maxAge: '1d',
    setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }
}));
runMigrations();
const expirationJob = startOrderExpirationJob();

// Rutas
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/reviews', require('./src/routes/reviews'));

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
