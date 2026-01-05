const db = require('../backend/src/config/database');

console.log('🔄 Updating database schema...');

try {
    // 1. Add role to users table
    try {
        db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
        console.log('✅ Added role column to users table');
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('ℹ️ Role column already exists');
        } else {
            throw err;
        }
    }

    // 2. Add specifications to products table
    try {
        db.prepare("ALTER TABLE products ADD COLUMN specifications TEXT").run();
        console.log('✅ Added specifications column to products table');
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('ℹ️ Specifications column already exists');
        } else {
            throw err;
        }
    }

    // 3. Set a default admin user (optional, for testing)
    // Update the user with email 'admin@golazostore.com' to be admin if exists, or create one?
    // For now, let's just make sure we can manually update via SQL if needed, 
    // or better yet, update the FIRST user to be admin for convenience if users exist.
    const firstUser = db.prepare("SELECT id FROM users LIMIT 1").get();
    if (firstUser) {
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(firstUser.id);
        console.log(`👑 Updated user ID ${firstUser.id} to admin role`);
    } else {
        console.log('⚠️ No users found to promote to admin');
    }

    console.log('✨ Database update completed successfully!');

} catch (error) {
    console.error('❌ Error updating database:', error);
}
