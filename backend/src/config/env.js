const DEFAULT_DEV_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:8080',
    'http://localhost:8000'
];

function parseCsv(value) {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function getAllowedOrigins() {
    const envOrigins = parseCsv(process.env.CORS_ORIGINS);
    return envOrigins.length > 0 ? envOrigins : DEFAULT_DEV_ORIGINS;
}

function getJwtSecret() {
    const jwtSecret = String(process.env.JWT_SECRET || '').trim();

    if (!jwtSecret) {
        throw new Error('Falta JWT_SECRET en variables de entorno');
    }

    if (jwtSecret === 'dev-jwt-secret-change-me') {
        throw new Error('JWT_SECRET inseguro: cambia el valor por uno robusto');
    }

    return jwtSecret;
}

module.exports = {
    getAllowedOrigins,
    getJwtSecret
};
