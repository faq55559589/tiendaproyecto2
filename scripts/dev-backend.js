const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const watchedPath = backendDir;
const ignoredSegments = ['node_modules', '.git', 'uploads'];
const ignoredExtensions = ['.db', '.db-shm', '.db-wal', '.log'];

let backendProcess = null;
let restartTimer = null;
let isRestarting = false;
let isShuttingDown = false;

function log(message) {
    console.log(`[backend-dev] ${message}`);
}

function shouldIgnore(filename) {
    const normalized = String(filename || '').replace(/\\/g, '/');
    if (!normalized) return true;
    if (ignoredSegments.some((segment) => normalized.includes(segment))) return true;
    return ignoredExtensions.some((extension) => normalized.endsWith(extension));
}

function startBackend() {
    log('Iniciando backend...');
    backendProcess = spawn(process.execPath, ['server.js'], {
        cwd: backendDir,
        stdio: 'inherit',
        env: process.env
    });

    backendProcess.once('exit', (code, signal) => {
        const wasRestarting = isRestarting;
        backendProcess = null;

        if (isShuttingDown) {
            return;
        }

        if (wasRestarting) {
            isRestarting = false;
            startBackend();
            return;
        }

        log(`Backend detenido (${signal || code || 0}). Esperando cambios...`);
    });

    backendProcess.once('error', (error) => {
        log(`No se pudo iniciar el backend: ${error.message}`);
    });
}

function stopBackend() {
    return new Promise((resolve) => {
        if (!backendProcess) {
            resolve();
            return;
        }

        const processToStop = backendProcess;
        let resolved = false;

        const finish = () => {
            if (resolved) return;
            resolved = true;
            resolve();
        };

        processToStop.once('exit', finish);

        if (process.platform === 'win32') {
            const killer = spawn('taskkill', ['/PID', String(processToStop.pid), '/T', '/F'], {
                stdio: 'ignore'
            });
            killer.once('exit', () => {
                setTimeout(finish, 150);
            });
            killer.once('error', finish);
        } else {
            processToStop.kill('SIGTERM');
            setTimeout(finish, 1500);
        }
    });
}

function scheduleRestart(filename) {
    if (isShuttingDown) return;
    clearTimeout(restartTimer);
    restartTimer = setTimeout(async () => {
        if (isShuttingDown) return;
        log(`Cambio detectado en ${filename}. Reiniciando backend...`);
        isRestarting = true;
        await stopBackend();
    }, 250);
}

function watchBackend() {
    if (!fs.existsSync(watchedPath)) {
        log('No se encontro la carpeta backend para observar cambios.');
        return;
    }

    fs.watch(watchedPath, { recursive: true }, (eventType, filename) => {
        if (!filename || shouldIgnore(filename)) {
            return;
        }

        scheduleRestart(String(filename).replace(/\\/g, '/'));
    });
}

function shutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    clearTimeout(restartTimer);
    stopBackend().finally(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

watchBackend();
startBackend();
