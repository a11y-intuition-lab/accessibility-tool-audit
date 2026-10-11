// Static server for the blinded build (D-026): serves testing-kit/.site/ only, on 127.0.0.1. No dependencies, so an
// agent in the closed testing-kit workspace can start it inside its sandbox.
//
// Usage:  node serve.mjs                    (from testing-kit/, port 8090)
//         npm run blind:serve [-- --port=9000]   (from the repository root)
//
// Only regular files below testing-kit/.site are served (the key lives in .blind/ at the repository root). No directory listings;
// anything else is 404. HTTP Range requests are supported, so audio and video can seek.

import { createReadStream, existsSync, realpathSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = join(dirname(fileURLToPath(import.meta.url)), '.site');
const port = Number(process.argv.find((a) => a.startsWith('--port='))?.slice(7) ?? 8090);
if (!Number.isInteger(port) || port < 0 || port > 65535) { console.error('Invalid --port'); process.exit(1); }
if (!existsSync(siteDir)) { console.error('testing-kit/.site not found. Run `npm run blind:build` from the repository root first.'); process.exit(1); }
const realSite = realpathSync(siteDir);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.webm': 'video/webm',
  '.mp4': 'video/mp4', '.ogv': 'video/ogg', '.vtt': 'text/vtt; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.pdf': 'application/pdf',
};

const notFound = (res) => { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found'); };

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { notFound(res); return; }
  if (p.includes('\0') || p.includes('\\')) { notFound(res); return; }
  const file = normalize(join(realSite, p));
  if (!file.startsWith(realSite + sep)) { notFound(res); return; }
  let st;
  try {
    if (!realpathSync(file).startsWith(realSite + sep)) { notFound(res); return; } // no symlinks out of the site
    st = statSync(file);
  } catch { notFound(res); return; }
  if (!st.isFile()) { notFound(res); return; }

  const headers = {
    'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  const size = st.size;
  let start = 0;
  let end = size - 1;
  let status = 200;
  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m && (m[1] || m[2])) {
      if (m[1]) { start = Number(m[1]); end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1; }
      else { start = Math.max(0, size - Number(m[2])); }
      if (start > end || start >= size) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
        return;
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    }
  }
  headers['Content-Length'] = size === 0 ? 0 : end - start + 1;
  res.writeHead(status, headers);
  if (req.method === 'HEAD' || size === 0) { res.end(); return; }
  createReadStream(file, { start, end }).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving the blinded build on http://127.0.0.1:${server.address().port}/ (test-page URLs: .blind/urls.txt)`);
});
