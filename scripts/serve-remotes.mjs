import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'remotes-dist');
const port = Number(process.env.REMOTES_SERVER_PORT || 4100);

const contentTypes = {
  '.json': 'application/json',
  '.js': 'application/javascript',
  '.bundle': 'application/javascript',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url?.split('?')[0] || '/');
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(distDir, safePath === '/' ? 'remote-registry.json' : safePath);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      });
      res.end('Not found');
      console.log(`[404] ${req.method} ${urlPath}`);
      return;
    }

    const ext = path.extname(filePath);
    const assetType = urlPath.includes('mf-manifest.json')
      ? 'manifest'
      : urlPath.includes('.container.js.bundle')
        ? 'container'
        : 'asset';

    console.log(`[200] ${req.method} ${urlPath} (${assetType})`);

    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(data);
  });
});

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

server.listen(port, () => {
  console.log(`Serving remotes from ${distDir}`);
  console.log(`Remote registry: http://localhost:${port}/remote-registry.json`);
  console.log(`Bundle server listening on http://localhost:${port}`);
});
