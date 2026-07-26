// Entry point for the single-file executable build (tools/build-exe.js).
//
// CommonJS on purpose: Node's single-executable format runs the main script
// through the CJS loader, so `import` syntax would fail at startup.
//
// The whole game is one HTML file embedded as a SEA asset. This serves it on a
// loopback port and opens the default browser, because a browser is a better
// renderer than anything worth shipping a GUI toolkit for.

const { createServer } = require('node:http');
const { spawn } = require('node:child_process');

let html;
try {
  html = require('node:sea').getAsset('game.html', 'utf8');
} catch (err) {
  // Running the entry script directly rather than from inside the executable.
  html = require('node:fs').readFileSync(
    require('node:path').join(__dirname, '..', 'dist', 'build-a-hooper.html'),
    'utf8',
  );
}

const server = createServer((req, res) => {
  if (req.url === '/favicon.ico') {
    res.writeHead(204).end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    // The page keeps its session counters in localStorage, which is keyed by
    // origin. A fixed port would be nicer for that, but a busy port is worse
    // than a reset counter, so take whatever we can bind.
    'Cache-Control': 'no-store',
  });
  res.end(html);
});

server.on('error', (err) => {
  console.error(`\n  Could not start: ${err.message}\n`);
  process.exit(1);
});

// Port 0 lets the OS pick a free one.
server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/`;

  console.log('');
  console.log('  BUILD A HOOPER');
  console.log('  ' + '-'.repeat(46));
  console.log(`  Running at ${url}`);
  console.log('  Close this window when you are done.');
  console.log('');

  const open =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]];

  // spawn reports a missing binary through an async 'error' event, not a throw,
  // so a try/catch here would miss it and the unhandled event would take the
  // whole process down — on exactly the machines that have no browser handler.
  try {
    const child = spawn(open[0], open[1], { detached: true, stdio: 'ignore' });
    child.on('error', () => {
      console.log('  Could not open a browser automatically — paste the address above.');
    });
    child.unref();
  } catch {
    console.log('  Could not open a browser automatically — paste the address above.');
  }
});
