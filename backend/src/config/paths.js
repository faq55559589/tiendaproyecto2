const fs = require('fs');
const path = require('path');

function resolveStoragePath(envValue, fallbackSegments) {
    const customPath = String(envValue || '').trim();
    if (customPath) {
        return path.isAbsolute(customPath)
            ? customPath
            : path.resolve(process.cwd(), customPath);
    }

    return path.join(__dirname, '..', '..', ...fallbackSegments);
}

const dbPath = resolveStoragePath(process.env.SQLITE_DB_PATH, ['database', 'golazostore.db']);
const uploadsDir = resolveStoragePath(process.env.UPLOADS_DIR, ['uploads']);

function ensureParentDir(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

module.exports = {
    dbPath,
    uploadsDir,
    ensureDir,
    ensureParentDir
};
