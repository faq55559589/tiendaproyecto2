const Database = require('better-sqlite3');
const { dbPath, ensureParentDir } = require('./paths');

ensureParentDir(dbPath);

const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

console.log(`SQLite conectado: ${dbPath}`);

module.exports = db;
