import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const dirArg = getArg('--dir', 'dist');
const portArg = Number(getArg('--port', '4203'));
const rootDir = path.resolve(process.cwd(), dirArg);

if (!fs.existsSync(rootDir)) {
  console.error(`[mf:serve] No existe el directorio: ${rootDir}`);
  console.error(`[mf:serve] Primero ejecuta: npm run mf:build`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const rel = decoded.replace(/^\/+/, '');
  const full = path.resolve(base, rel);
  if (!full.startsWith(base)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  try {
    // CORS para que el Shell pueda consumir remoteEntry.json sin pelearse con el navegador.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = safeJoin(rootDir, pathname);

    if (!filePath) {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');

    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(portArg, '127.0.0.1', () => {
  console.log(`[mf:serve] Sirviendo ${rootDir}`);
  console.log(`[mf:serve] http://localhost:${portArg}/`);
  console.log(`[mf:serve] remoteEntry: http://localhost:${portArg}/remoteEntry.json`);
});


