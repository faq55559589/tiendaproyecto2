const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const databaseDir = path.join(backendDir, 'database');
const uploadsDir = path.join(backendDir, 'uploads');
const databaseBaseName = 'golazostore.db';
const { createBackup } = require('./backup-local-state');

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function resolveBackupPath(inputPath) {
    if (!inputPath) return null;
    return path.isAbsolute(inputPath)
        ? inputPath
        : path.join(rootDir, inputPath);
}

function removeIfExists(targetPath) {
    if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
    }
}

function copyDbFileIfExists(sourcePath, targetPath) {
    if (!fs.existsSync(sourcePath)) return false;
    fs.copyFileSync(sourcePath, targetPath);
    return true;
}

function printUsage() {
    console.log('Uso: node scripts/restore-local-state.js <ruta-del-backup>');
    console.log('Ejemplo: node scripts/restore-local-state.js backups/local-state-2026-03-07_12-00-00');
}

function main() {
    const inputPath = process.argv[2];
    if (!inputPath) {
        printUsage();
        process.exit(1);
    }

    const backupDir = resolveBackupPath(inputPath);
    const backupDbDir = path.join(backupDir, 'database');
    const backupUploadsDir = path.join(backupDir, 'uploads');

    if (!fs.existsSync(backupDir)) {
        throw new Error(`No existe el backup indicado: ${backupDir}`);
    }

    if (!fs.existsSync(path.join(backupDbDir, databaseBaseName))) {
        throw new Error(`El backup no contiene ${databaseBaseName}`);
    }

    console.log('Antes del restore, asegúrate de cerrar backend/frontend.');
    console.log('Creando backup de seguridad del estado actual...');
    createBackup();

    ensureDir(databaseDir);
    ensureDir(uploadsDir);

    [
        databaseBaseName,
        `${databaseBaseName}-wal`,
        `${databaseBaseName}-shm`,
        `${databaseBaseName}-journal`
    ].forEach((fileName) => {
        removeIfExists(path.join(databaseDir, fileName));
    });

    const restoredDbFiles = [
        databaseBaseName,
        `${databaseBaseName}-wal`,
        `${databaseBaseName}-shm`,
        `${databaseBaseName}-journal`
    ].filter((fileName) => copyDbFileIfExists(
        path.join(backupDbDir, fileName),
        path.join(databaseDir, fileName)
    ));

    removeIfExists(uploadsDir);
    if (fs.existsSync(backupUploadsDir)) {
        fs.cpSync(backupUploadsDir, uploadsDir, { recursive: true, force: true });
    } else {
        ensureDir(uploadsDir);
    }

    console.log(`Restore completado desde: ${backupDir}`);
    console.log(`Base restaurada: ${restoredDbFiles.join(', ')}`);
    console.log(`Uploads restaurados: ${fs.existsSync(backupUploadsDir) ? 'si' : 'no'}`);
}

try {
    main();
} catch (error) {
    console.error(`Error en restore: ${error.message}`);
    process.exit(1);
}
