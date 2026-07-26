#!/usr/bin/env node
// Builds a standalone desktop executable using Node's single-executable
// applications format: a Node runtime with the game injected into it as a
// resource. No install, no runtime dependency on the machine it lands on.
//
//   node tools/build-exe.js              -> dist/BuildAHooper.exe   (Windows x64)
//   node tools/build-exe.js --target linux-x64   (or darwin-arm64, darwin-x64…)
//   node tools/build-exe.js --target host        -> build for this machine
//
// Cross-building works because the "compiler" is just the official Node binary
// for the target platform with a blob appended, so the only thing that has to
// run locally is postject. The output is ~110 MB because it contains a whole
// Node runtime; that is the cost of the format, not of the game (326 kB).
//
// The result is UNSIGNED. Windows SmartScreen will warn on first run, and
// macOS Gatekeeper will refuse a downloaded build outright. Code signing needs
// a certificate this build cannot have.

import { execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { chmod, mkdir, copyFile, writeFile, stat, access } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const NODE_VERSION = process.version; // build against the runtime we tested on
const argv = process.argv.slice(2);
const flag = (name, fb) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fb;
};

const TARGETS = {
  'win-x64': { file: 'node.exe', out: 'BuildAHooper.exe', dir: 'win-x64' },
  'linux-x64': { file: 'node', out: 'build-a-hooper', dir: 'linux-x64' },
  'darwin-x64': { file: 'node', out: 'BuildAHooper-mac-x64', dir: 'darwin-x64' },
  'darwin-arm64': { file: 'node', out: 'BuildAHooper-mac-arm64', dir: 'darwin-arm64' },
};

let targetName = flag('--target', 'win-x64');
if (targetName === 'host') {
  targetName = `${process.platform === 'win32' ? 'win' : process.platform}-${process.arch}`;
}
const target = TARGETS[targetName];
if (!target) {
  console.error(`unknown target "${targetName}" — one of: ${Object.keys(TARGETS).join(', ')}, host`);
  process.exit(1);
}

const CACHE = join(ROOT, '.cache');
const DIST = join(ROOT, 'dist');
await mkdir(CACHE, { recursive: true });
await mkdir(DIST, { recursive: true });

const exists = (p) => access(p).then(() => true, () => false);
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });

// 1. The game itself, as one HTML file.
console.log('· bundling the game');
run(process.execPath, ['tools/bundle.js']);

// 2. The target platform's Node runtime.
// Named `runtime-` rather than `node-` so it cannot collide with the
// `node-<ver>-<target>` directory the tarball extracts to.
const runtime = join(CACHE, `runtime-${NODE_VERSION}-${targetName}${targetName.startsWith('win') ? '.exe' : ''}`);
if (await exists(runtime)) {
  console.log(`· runtime cached (${NODE_VERSION} ${targetName})`);
} else {
  // Windows ships a bare node.exe; the others only come inside a tarball, so
  // for those we fetch the archive and pull the one file out of it.
  console.log(`· downloading node ${NODE_VERSION} for ${targetName}`);
  if (targetName.startsWith('win')) {
    const url = `https://nodejs.org/dist/${NODE_VERSION}/${target.dir}/node.exe`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(runtime));
  } else {
    const base = `node-${NODE_VERSION}-${target.dir}`;
    const url = `https://nodejs.org/dist/${NODE_VERSION}/${base}.tar.gz`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    const tgz = join(CACHE, `${base}.tar.gz`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tgz));
    run('tar', ['-xzf', tgz, '-C', CACHE, `${base}/bin/node`]);
    await copyFile(join(CACHE, base, 'bin', 'node'), runtime);
  }
  await chmod(runtime, 0o755);
}

// 3. The SEA blob: entry script plus the game as a named asset.
console.log('· building the SEA blob');
const seaConfig = join(CACHE, 'sea-config.json');
await writeFile(
  seaConfig,
  JSON.stringify(
    {
      main: 'tools/exe-entry.cjs',
      output: join(CACHE, 'sea-prep.blob'),
      disableExperimentalSEAWarning: true,
      assets: { 'game.html': 'dist/build-a-hooper.html' },
    },
    null,
    2,
  ),
);
run(process.execPath, ['--experimental-sea-config', seaConfig]);

// The official node.exe is Authenticode-signed, and appending a resource
// invalidates that signature. Node's docs say to remove it with `signtool
// remove`, which does not exist off Windows — so strip the certificate table
// directly. Leaving a *corrupt* signature is worse than shipping none: Windows
// reports it as tampered rather than merely unknown.
async function stripAuthenticode(file) {
  const { readFile: rf, writeFile: wf } = await import('node:fs/promises');
  const buf = await rf(file);
  const peOff = buf.readUInt32LE(0x3c);
  if (buf.toString('ascii', peOff, peOff + 4) !== 'PE\0\0') return false;

  const optOff = peOff + 24;
  const magic = buf.readUInt16LE(optOff);
  // Data directories sit after the optional header: 112 bytes in for PE32+,
  // 96 for PE32.
  const dirOff = optOff + (magic === 0x20b ? 112 : 96);
  const certOff = dirOff + 4 * 8; // directory entry 4 = Certificate Table
  const certAddr = buf.readUInt32LE(certOff);
  const certSize = buf.readUInt32LE(certOff + 4);
  if (!certAddr || !certSize) return false;

  buf.writeUInt32LE(0, certOff);
  buf.writeUInt32LE(0, certOff + 4);
  buf.writeUInt32LE(0, optOff + 64); // checksum, now meaningless
  // Unlike every other directory, the certificate table is addressed by file
  // offset and always trails the image, so dropping it is a truncation.
  await wf(file, buf.subarray(0, certAddr));
  return true;
}

// 4. Inject it into a copy of the runtime.
const outPath = join(DIST, target.out);
await copyFile(runtime, outPath);
if (targetName.startsWith('win')) {
  const stripped = await stripAuthenticode(outPath);
  console.log(stripped ? '· stripped the now-invalid Authenticode signature' : '· no signature to strip');
}
console.log('· injecting');
const postject = [
  'postject',
  outPath,
  'NODE_SEA_BLOB',
  join(CACHE, 'sea-prep.blob'),
  '--sentinel-fuse',
  'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
];
// macOS binaries need the blob in a named segment; PE and ELF do not.
if (targetName.startsWith('darwin')) postject.push('--macho-segment-name', 'NODE_SEA');
run('npx', ['--yes', ...postject]);
if (!targetName.startsWith('win')) await chmod(outPath, 0o755);

const { size } = await stat(outPath);
console.log(`\n  dist/${target.out} — ${(size / 1024 / 1024).toFixed(0)} MB (${targetName})`);
console.log('  Unsigned: Windows SmartScreen will warn on first run.');
