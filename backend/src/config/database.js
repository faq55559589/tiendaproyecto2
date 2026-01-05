// Configuración de conexión a SQLite
const Database = require('better-sqlite3');
const path = require('path');

// Ruta de la base de datos
const DB_PATH = path.join(__dirname, '..', '..', 'database', 'golazostore.db');

// Crear conexión (solo mostrar queries en desarrollo)
const db = new Database(DB_PATH, { 
    verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Configurar para mejor rendimiento
db.pragma('journal_mode = WAL');

console.log(`✅ Conectado a SQLite: ${DB_PATH}`);

module.exports = db;
