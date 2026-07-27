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
  'src/normal.js',
  'src/archetypes.js',
  'src/traits.js',
  'src/names.js',
  'src/roll.js',
  'src/overall.js',
  'src/people.js',
  'src/actions.js',
  'src/career.js',
  'src/verdict.js',
  'src/progress.js',
  'src/life.js',
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

// Every local module a file imports must itself be in MODULES, or the bundle
// silently loses those definitions and only breaks at runtime — the dev server
// keeps working, because there the imports are real. Check it here instead.
{
  const listed = new Set(MODULES.map((m) => m.split('/').pop()));
  const missing = [];
  for (const m of MODULES) {
    const src = await read(m);
    for (const [, spec] of src.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const file = spec.split('/').pop();
      if (!listed.has(file)) missing.push(`${m} imports ${spec}`);
    }
  }
  // Namespace imports cannot survive flattening — there is no module object to
  // bind the alias to, so every use of it becomes a ReferenceError at runtime.
  const namespaced = [];
  for (const m of MODULES) {
    const src = await read(m);
    for (const [, alias, spec] of src.matchAll(/import\s+\*\s+as\s+(\w+)\s+from\s+['"](\.[^'"]+)['"]/g)) {
      namespaced.push(`${m}: import * as ${alias} from '${spec}' — import a named export instead`);
    }
  }
  if (namespaced.length) {
    console.error('bundle: namespace imports do not survive flattening:\n  ' + namespaced.join('\n  '));
    process.exit(1);
  }
  if (missing.length) {
    console.error('bundle: these imports are not in MODULES:\n  ' + missing.join('\n  '));
    process.exit(1);
  }
}
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

// Flattening puts every module's top level into ONE scope, so two modules that
// each define a private `const money` helper are a SyntaxError in the bundle
// while both work perfectly on the dev server. Catch the collision here, by
// name and by module, instead of finding out from a blank page.
{
  const seen = new Map();
  const clashes = [];
  const DECL = /^(?:export\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of MODULES) {
    const src = await read(m);
    for (const [, name] of src.matchAll(DECL)) {
      if (seen.has(name) && seen.get(name) !== m) clashes.push(`${name}: ${seen.get(name)} and ${m}`);
      else seen.set(name, m);
    }
  }
  if (clashes.length) {
    console.error(
      'bundle: these top-level names are declared in more than one module '
        + 'and would collide once flattened into a single scope:\n  ' + clashes.join('\n  '),
    );
    process.exit(1);
  }
}

// The strongest check available without a parser dependency: does the thing we
// are about to ship actually parse?
try {
  // eslint-disable-next-line no-new-func
  new Function(js);
} catch (e) {
  console.error(`bundle: the flattened script does not parse — ${e.message}`);
  process.exit(1);
}

// The markup comes out of web/index.html rather than being restated here.
// Keeping a second copy in this file meant every markup change had to be made
// twice, and forgetting the second one produced a bundle that silently ran the
// previous UI while the dev server showed the new one.
const page = await read('web/index.html');
const bodyMatch = page.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) {
  console.error('bundle: could not find <body> in web/index.html');
  process.exit(1);
}
const BODY = `
${bodyMatch[1]
  // The stylesheet links and the module script are replaced by inlined copies.
  .replace(/<script[^>]*type="module"[^>]*><\/script>/gi, '')
  .trim()}
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
<title>Hoop Life</title>
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
