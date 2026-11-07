// Produktiv-Start nach `npm run build`: liefert dist/ aus und beantwortet /api/*.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { behandleApi } from './api.js';

const PORT = process.env.PORT ?? 3000;
const DIST = fileURLToPath(new URL('../dist', import.meta.url));

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

createServer(async (req, res) => {
  try {
    if (await behandleApi(req, res)) return;
    const { pathname } = new URL(req.url, 'http://localhost');
    const datei = join(DIST, normalize(decodeURIComponent(pathname)));
    const gefunden = datei.startsWith(DIST) && existsSync(datei) && statSync(datei).isFile();
    // Unbekannte Pfade (/melden, /rechtliches) gehen an die React-App.
    const ziel = gefunden ? datei : join(DIST, 'index.html');
    res.setHeader('Content-Type', TYPEN[extname(ziel)] ?? 'application/octet-stream');
    createReadStream(ziel).pipe(res);
  } catch (fehler) {
    console.error(fehler);
    res.statusCode = 500;
    res.end();
  }
}).listen(PORT, () => console.log(`Versorgungsmonitor läuft auf http://localhost:${PORT}`));
