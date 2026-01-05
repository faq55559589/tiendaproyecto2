const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS (restringido a orígenes específicos)
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5501',
        'http://127.0.0.1:5501',
        'http://localhost:8080',
        'http://localhost:8000'
    ],
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

// Rutas
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
// app.use('/api/cart', require('./src/routes/cart'));
// app.use('/api/orders', require('./src/routes/orders'));

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

// Mantener el servidor activo
server.on('error', (err) => {
    console.error('❌ Error del servidor:', err);
});

process.on('SIGINT', () => {
    console.log('\n👋 Cerrando servidor...');
    server.close(() => {
        process.exit(0);
    });
});
