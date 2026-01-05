const db = require('better-sqlite3')('backend/database/golazostore.db');

console.log('Verifying existing users...');

try {
    const info = db.prepare('UPDATE users SET is_verified = 1 WHERE is_verified = 0 OR is_verified IS NULL').run();
    console.log(`Updated ${info.changes} users to verified status.`);
} catch (e) {
    console.error('Error verifying users:', e);
}
