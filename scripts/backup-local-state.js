const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const databaseDir = path.join(backendDir, 'database');
const uploadsDir = path.join(backendDir, 'uploads');
const backupsRootDir = path.join(rootDir, 'backups');
const databaseBaseName = 'golazostore.db';

function timestamp() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate())
    ].join('-') + '_' + [
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds())
    ].join('-');
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function copyIfExists(sourcePath, targetPath) {
    if (!fs.existsSync(sourcePath)) return false;
    fs.copyFileSync(sourcePath, targetPath);
    return true;
}

function copyDirectory(sourceDir, targetDir) {
    ensureDir(targetDir);
    if (!fs.existsSync(sourceDir)) return;
    fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
}

function buildManifest(copiedFiles, backupDirName) {
    return {
        created_at: new Date().toISOString(),
        backup_dir: backupDirName,
        database_files: copiedFiles,
        uploads_included: fs.existsSync(uploadsDir),
        notes: [
            'Si el backend estaba corriendo durante el backup, detenerlo antes de restore.',
            'Para restore local, usar scripts/restore-local-state.js con la ruta del backup.'
        ]
    };
}

function createBackup() {
    ensureDir(backupsRootDir);

    const backupDirName = `local-state-${timestamp()}`;
    const backupDir = path.join(backupsRootDir, backupDirName);
    const backupDbDir = path.join(backupDir, 'database');
    const backupUploadsDir = path.join(backupDir, 'uploads');
    ensureDir(backupDbDir);

    const dbFiles = [
        databaseBaseName,
        `${databaseBaseName}-wal`,
        `${databaseBaseName}-shm`,
        `${databaseBaseName}-journal`
    ];

    const copiedFiles = dbFiles.filter((fileName) => copyIfExists(
        path.join(databaseDir, fileName),
        path.join(backupDbDir, fileName)
    ));

    if (!copiedFiles.length) {
        throw new Error(`No se encontro la base ${databaseBaseName} en ${databaseDir}`);
    }

    copyDirectory(uploadsDir, backupUploadsDir);

    const manifest = buildManifest(copiedFiles, backupDirName);
    fs.writeFileSync(
        path.join(backupDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8'
    );

    console.log(`Backup creado: ${backupDir}`);
    console.log(`Base incluida: ${copiedFiles.join(', ')}`);
    console.log(`Uploads incluidos: ${fs.existsSync(uploadsDir) ? 'si' : 'no'}`);
    return backupDir;
}

module.exports = {
    createBackup
};

if (require.main === module) {
    try {
        createBackup();
    } catch (error) {
        console.error(`Error creando backup: ${error.message}`);
        process.exit(1);
    }
}
