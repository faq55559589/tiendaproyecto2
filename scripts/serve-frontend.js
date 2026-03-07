const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8000);

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

function resolvePath(urlPath) {
    const cleanPath = decodeURIComponent((urlPath || '/').split('?')[0]);
    const requested = cleanPath === '/' ? '/index.html' : cleanPath;
    const fullPath = path.normalize(path.join(rootDir, requested));

    if (!fullPath.startsWith(rootDir)) {
        return null;
    }

    return fullPath;
}

const server = http.createServer((req, res) => {
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

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                Pragma: 'no-cache',
                Expires: '0'
            });
            res.end(data);
        });
    });
});

server.listen(port, () => {
    console.log(`Frontend disponible en http://localhost:${port}`);
});
