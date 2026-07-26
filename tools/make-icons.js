#!/usr/bin/env node
// Generates the PWA icon set as PNGs, with no image library.
//
// Home-screen icons are the one asset a web app cannot fake: an installed app
// with a missing or letterboxed icon looks broken before it opens. Rather than
// take a dependency for six files, this rasterises the ball directly and writes
// PNG chunks by hand — node has zlib, which is the only hard part.
//
//   node tools/make-icons.js [outDir]

import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT = process.argv[2] || join(ROOT, 'docs', 'icons');

const WOOD = [0x15, 0x0f, 0x0b];
const LED = [0xff, 0xa9, 0x2b];

// --- PNG writing -----------------------------------------------------------
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour with alpha
  // Each scanline is prefixed with a filter byte; 0 = none.
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- the ball --------------------------------------------------------------
// Drawn at 4x and box-filtered down, which is cheaper to write than analytic
// anti-aliasing and indistinguishable at icon sizes.
const SS = 4;

function drawIcon(size, { maskable = false, opaque = false } = {}) {
  const S = size * SS;
  const px = Buffer.alloc(S * S * 4);
  const cx = S / 2;
  const cy = S / 2;
  // Maskable icons get cropped to a circle by the launcher, so the ball has to
  // sit inside the ~80% safe zone or its edges get shaved off.
  const r = (maskable ? S * 0.33 : S * 0.46);
  const seam = Math.max(1, S * 0.018);

  const put = (i, c, a = 255) => {
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = a;
  };

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy);

      if (maskable || opaque) put(i, WOOD, 255);
      if (d > r) continue;

      put(i, LED, 255);

      // Seams: the two straight ones, plus a curved one either side.
      const vertical = Math.abs(dx) < seam;
      const horizontal = Math.abs(dy) < seam;
      // The side arcs are circles centred off to the left and right. Their
      // geometry is solved, not guessed, so that each one crosses the equator
      // at 0.55r and lands exactly on the pole — which is what makes it read as
      // a basketball rather than two curves meeting in a lens.
      //   centre offset  bow = r(1 - k^2) / 2k     for equator crossing k*r
      //   radius         R   = bow + k*r
      const k = 0.55;
      const bow = (r * (1 - k * k)) / (2 * k);
      const R = bow + k * r;
      const left = Math.abs(Math.hypot(dx + bow, dy) - R) < seam;
      const right = Math.abs(Math.hypot(dx - bow, dy) - R) < seam;
      if (vertical || horizontal || left || right) put(i, WOOD, 255);
    }
  }

  // Downsample.
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r0 = 0, g0 = 0, b0 = 0, a0 = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * S + (x * SS + sx)) * 4;
          const a = px[i + 3] / 255;
          r0 += px[i] * a; g0 += px[i + 1] * a; b0 += px[i + 2] * a; a0 += a;
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      // Un-premultiply so partially covered edge pixels keep their colour.
      out[o] = a0 ? Math.round(r0 / a0) : 0;
      out[o + 1] = a0 ? Math.round(g0 / a0) : 0;
      out[o + 2] = a0 ? Math.round(b0 / a0) : 0;
      out[o + 3] = Math.round((a0 / n) * 255);
    }
  }
  return png(size, size, out);
}

await mkdir(OUT, { recursive: true });
const files = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-192-maskable.png', 192, { maskable: true }],
  ['icon-512-maskable.png', 512, { maskable: true }],
  // iOS ignores transparency and composites onto white, so this one is opaque.
  ['apple-touch-icon.png', 180, { opaque: true }],
  ['favicon-32.png', 32, { opaque: true }],
];
for (const [name, size, opts] of files) {
  await writeFile(join(OUT, name), drawIcon(size, opts));
}
console.log(`${OUT} — ${files.length} icons`);
