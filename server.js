'use strict';
// Static dev server, zero dependencies. shortcut: no live-reload/caching, refresh manually; fine for a static prototype.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public'); // hanya isi public/ yang disajikan
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end('Bad request'); return; }
  let file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) { res.writeHead(403).end('Forbidden'); return; } // block path traversal
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

let port = PORT;
server.on('error', e => {
  // Port dipakai program lain: coba port berikutnya (maks. 20 kali) kecuali PORT ditetapkan eksplisit.
  if (e.code === 'EADDRINUSE' && !process.env.PORT && port < PORT + 20) { console.log(`Port ${port} sedang dipakai, mencoba ${port + 1}…`); server.listen(++port); return; }
  if (e.code === 'EADDRINUSE') { console.error(`Port ${port} sedang dipakai. Coba: PORT=${port + 1} npm run dev`); process.exit(1); }
  throw e;
});
server.on('listening', () => {
  console.log(`\n  REMBUK siap:\n  Landing  http://localhost:${port}/\n  Aplikasi http://localhost:${port}/app/\n`);
});
server.listen(port);
