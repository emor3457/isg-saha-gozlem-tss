const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const PORT = 8080;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.woff2': 'font/woff2',
    '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    let filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);

    // SPA fallback: if file doesn't exist, serve index.html
    if (!fs.existsSync(filePath)) {
        filePath = path.join(DIST, 'index.html');
    }

    try {
        const data = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const contentType = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (e) {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('===========================================');
    console.log('  ISG Saha Gozlem - Sunucu Calisiyor!');
    console.log('===========================================');
    console.log('');
    console.log('  Tarayicida su adresi acin:');
    console.log('  http://localhost:' + PORT);
    console.log('');
    console.log('  Kapatmak icin: Ctrl+C');
    console.log('===========================================');
});
