// Script para inicializar la base de datos SQLite
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Rutas
const DB_PATH = path.join(__dirname, '..', 'database', 'golazostore.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');

console.log('🔧 Inicializando base de datos GolazoStore...\n');

// Eliminar base de datos existente si existe
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️  Base de datos antigua eliminada');
}

// Crear directorio database si no existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Crear base de datos
const db = new Database(DB_PATH);
console.log('✅ Base de datos creada en:', DB_PATH);

// Leer y ejecutar schema SQL
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

// Separar por statements (SQLite ejecuta uno a la vez)
const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

statements.forEach((statement, index) => {
    try {
        db.exec(statement);
        console.log(`✅ Statement ${index + 1}/${statements.length} ejecutado`);
    } catch (error) {
        console.error(`❌ Error en statement ${index + 1}:`, error.message);
    }
});

// Verificar datos
const categories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
const products = db.prepare('SELECT COUNT(*) as count FROM products').get();

console.log('\n📊 Resumen:');
console.log(`   - Categorías: ${categories.count}`);
console.log(`   - Productos: ${products.count}`);
console.log('\n🎉 ¡Base de datos inicializada correctamente!\n');

db.close();
