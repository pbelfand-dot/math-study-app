#!/usr/bin/env node
// Minimal static server. ES modules cannot be loaded over file://, so the app
// needs an origin. No dependencies on purpose.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // Redirect rather than rewrite: serving index.html at "/" would make its
  // relative asset paths resolve against the root instead of /web/.
  if (path === '/') {
    res.writeHead(302, { Location: '/web/' }).end();
    return;
  }
  if (path.endsWith('/')) path += 'index.html';

  // Keep requests inside the project directory.
  const full = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!full.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const body = await readFile(full);
    res.writeHead(200, { 'Content-Type': TYPES[extname(full)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Build a Hooper — http://localhost:${PORT}/`);
});
