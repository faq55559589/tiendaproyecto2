const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const port = Number(process.env.PORT || 8000);
const liveReloadClients = new Set();

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const liveReloadScript = `
<script>
(() => {
    if (window.__golazoLiveReload) return;
    window.__golazoLiveReload = true;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const source = new EventSource(protocol + '//' + window.location.host + '/__livereload');
    source.onmessage = (event) => {
        if (event.data === 'reload') {
            window.location.reload();
        }
    };
})();
</script>`;

function resolvePath(urlPath) {
    const rawPath = decodeURIComponent((urlPath || '/').split('?')[0]);
    const cleanPath = rawPath.replace(/\/[^/]+\.html\/([^/]+\.html)$/i, '/$1');
    const requested = cleanPath === '/' ? '/index.html' : cleanPath;
    const fullPath = path.normalize(path.join(rootDir, requested));

    if (!fullPath.startsWith(rootDir)) {
        return null;
    }

    return fullPath;
}

function sendReload() {
    for (const client of liveReloadClients) {
        client.write('data: reload\n\n');
    }
}

function watchPath(targetPath) {
    if (!fs.existsSync(targetPath)) return;

    fs.watch(targetPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const normalized = String(filename).replace(/\\/g, '/');
        if (normalized.includes('node_modules') || normalized.includes('.git')) return;
        sendReload();
    });
}

const server = http.createServer((req, res) => {
    if ((req.url || '').startsWith('/__livereload')) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Connection: 'keep-alive'
        });
        res.write('\n');
        liveReloadClients.add(res);
        req.on('close', () => {
            liveReloadClients.delete(res);
        });
        return;
    }

    const filePath = resolvePath(req.url);

    if (!filePath) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (statError, stats) => {
        if (statError) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        const finalPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
        const ext = path.extname(finalPath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        fs.readFile(finalPath, (readError, data) => {
            if (readError) {
                res.writeHead(500);
                res.end('Internal server error');
                return;
            }

            let body = data;
            if (ext === '.html') {
                const html = data.toString('utf8');
                body = html.includes('</body>')
                    ? html.replace('</body>', `${liveReloadScript}\n</body>`)
                    : `${html}\n${liveReloadScript}`;
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                Pragma: 'no-cache',
                Expires: '0'
            });
            res.end(body);
        });
    });
});

watchPath(frontendDir);
watchPath(path.join(rootDir, 'index.html'));

server.listen(port, () => {
    console.log(`Frontend disponible en http://localhost:${port}/frontend/home.html`);
});
