#!/usr/bin/env node
// Flattens the ES modules into one self-contained HTML file, so the game can be
// opened straight off disk with no server (file:// blocks module imports) or
// pasted somewhere that only accepts a single page.
//
//   node tools/bundle.js              -> dist/build-a-hooper.html (standalone)
//   node tools/bundle.js --fragment   -> body content only, no <html>/<head>
//
// Module order is dependency order, hand-maintained. There are no cycles; if
// you add one, this breaks loudly rather than silently.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const MODULES = [
  'src/constants.js',
  'src/rng.js',
  'src/archetypes.js',
  'src/traits.js',
  'src/names.js',
  'src/roll.js',
  'src/overall.js',
  'src/career.js',
  'src/verdict.js',
  'web/main.js',
];

// `[\s\S]*?` so multi-line import lists collapse too.
const IMPORT_RE = /^import\s[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm;
const EXPORT_RE = /^export\s+(const|function|let|class)\b/gm;

const strip = (src) => src.replace(IMPORT_RE, '').replace(EXPORT_RE, '$1');

const read = (p) => readFile(join(ROOT, p), 'utf8');

// Fonts first: the @font-face data URIs have to be declared before the rules
// that use the families.
const css = (await read('web/fonts.css')) + '\n' + (await read('web/styles.css'));
const parts = [];
for (const m of MODULES) {
  const src = strip(await read(m));
  parts.push(`/* ===== ${m} ===== */\n${src.trim()}`);
}
const js = parts.join('\n\n');

if (js.includes('import ') && /^import\s/m.test(js)) {
  console.error('bundle: an import survived stripping — check MODULES order and syntax');
  process.exit(1);
}

const BODY = `
<div class="wrap">
  <header>
    <h1>Build a Hooper<span>archetype build</span></h1>
    <div class="counter">
      BUILDS <b id="cnt">0</b><br />
      BEST OVR <b id="best">&mdash;</b><br />
      LEGENDARY <b id="lg">0</b>
    </div>
  </header>
  <div class="modes">
    <button class="chip" id="quick" type="button" aria-pressed="false">Quick roll</button>
    <button class="chip" id="daily" type="button" aria-pressed="false">Daily seed</button>
    <span class="chip plain">Height sets the target &mdash; read every number against it</span>
  </div>
  <div class="prog" id="prog"></div>
  <div id="freakSlot"></div>
  <div class="stage" id="stage"></div>
  <div class="actions">
    <button class="b-roll" id="roll" type="button">Roll height</button>
    <button class="b-alt" id="rr" type="button" disabled>Reroll <span class="rr-count" id="rrn"></span></button>
  </div>
  <div class="stats" id="stats"></div>
  <div id="ovrSlot"></div>
  <div id="car"></div>
</div>
<style>
${css}
</style>
<script>
${js}
</script>
`.trim();

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23ffa92b'/%3E%3Cpath d='M2 16h28M16 2v28M6 6c8 5 8 15 0 20M26 6c-8 5-8 15 0 20' stroke='%23150f0b' stroke-width='2' fill='none'/%3E%3C/svg%3E";

const fragment = process.argv.includes('--fragment');
const out = fragment
  ? BODY
  : `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Build a Hooper</title>
<link rel="icon" href="${FAVICON}" />
</head>
<body>
${BODY}
</body>
</html>`;

const target = process.argv.includes('-o')
  ? process.argv[process.argv.indexOf('-o') + 1]
  : 'dist/build-a-hooper.html';

const outPath = isAbsolute(target) ? target : join(ROOT, target);
await mkdir(join(outPath, '..'), { recursive: true });
await writeFile(outPath, out);
console.log(`${target} — ${(out.length / 1024).toFixed(0)} kB, ${MODULES.length} modules inlined`);
