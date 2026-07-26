#!/usr/bin/env node
// Monte Carlo harness. Non-negotiable: any constant change gets re-verified here.
//   npm run sim                 -- rarity table, no rolled archetypes
//   npm run sim -- --archetypes -- same table with gifts enabled
//   npm run sim -- --both       -- before/after comparison
//   npm run sim -- --calibrate  -- emit RAW_QUANTILES + BUILD_RARITY_CUTS
//   npm run sim -- --chase      -- the 5'10" chasing 95+ dunk check
//   npm run sim -- --careers    -- career-outcome distribution
//   npm run sim -- -n 2000000   -- roll count

import { SKILL_KEYS, SKILLS, VERIFIED_95_PLUS, UP_CHANCE, UP_SCALE, FREAK_CHANCE, FREAK_MULT, SCOUT_NOISE } from '../src/constants.js';
import { normalTail } from '../src/normal.js';
import { rollCompleteBuild, rollStat, expectedSkill, clamp } from '../src/roll.js';
import { makeRng, mulberry32 } from '../src/rng.js';
import { rawComposite, overallFor, buildRarityScore, positionFor } from '../src/overall.js';
import { simulateCareer } from '../src/career.js';
import { writeVerdict } from '../src/verdict.js';
import { formatHeight } from '../src/roll.js';
import { randomName } from '../src/names.js';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const numArg = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 ? Number(argv[i + 1]) : d;
};

const N = numArg('-n', has('--calibrate') ? 2_000_000 : 1_000_000);
const rng = makeRng(mulberry32(numArg('--seed', 12345)));

const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);

function oneIn(rate) {
  return rate === 0 ? '—' : `1 in ${Math.round(1 / rate).toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// 95+ rate table
// ---------------------------------------------------------------------------
function rateRun(n, opts) {
  const hits = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0]));
  for (let i = 0; i < n; i++) {
    const b = rollCompleteBuild(rng, opts);
    for (const k of SKILL_KEYS) if (b.skills[k] >= 95) hits[k]++;
  }
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, hits[k] / n]));
}

function printRateTable(rates, { compare = true, label = '' } = {}) {
  if (label) console.log(`\n${label}`);
  console.log(pad('ATTRIBUTE', 14) + lpad('95+ RATE', 16) + (compare ? lpad('PUBLISHED', 14) + lpad('DELTA', 10) : ''));
  console.log('-'.repeat(compare ? 54 : 30));
  const sorted = SKILL_KEYS.slice().sort((a, b) => rates[b] - rates[a]);
  let worst = 0;
  for (const k of sorted) {
    const mine = rates[k] === 0 ? Infinity : 1 / rates[k];
    let line = pad(SKILLS[k].label, 14) + lpad(oneIn(rates[k]), 16);
    if (compare) {
      const pub = VERIFIED_95_PLUS[k];
      const delta = (mine - pub) / pub;
      worst = Math.max(worst, Math.abs(delta));
      line += lpad(`1 in ${pub}`, 14) + lpad(`${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`, 10);
    }
    console.log(line);
  }
  if (compare) console.log(`\nworst deviation from published: ${(worst * 100).toFixed(1)}%`);
  return rates;
}

// ---------------------------------------------------------------------------
// Chase-pull check: 5'10" chasing a 95+ dunk
// ---------------------------------------------------------------------------
// Analytic chase odds for one (height, attribute, threshold) triple.
function chaseOdds(height, key, threshold) {
  const expected = expectedSkill(key, height);
  const sigma = SKILLS[key].sigma;
  const d = threshold - 0.5 - expected; // Math.round boundary
  const pNoFreak = UP_CHANCE * 2 * normalTail(d / (sigma * UP_SCALE));
  const pFreak = UP_CHANCE * 2 * normalTail(d / (sigma * FREAK_MULT * UP_SCALE));
  const pGeneHere = FREAK_CHANCE / SKILL_KEYS.length; // freak lands on THIS attribute
  const blended = pGeneHere * pFreak + (1 - pGeneHere) * pNoFreak;
  return { expected, pNoFreak, pFreak, pGeneHere, blended };
}

function chaseCheck() {
  const cases = [
    { label: `5'10" chasing 95+ DUNK`, height: 70, key: 'dunk', threshold: 95,
      published: { without: 558e6, with: 5.8e6 } },
    { label: `5'4" chasing 99 DUNK`, height: 64, key: 'dunk', threshold: 99,
      published: { blended: 6e6 } },
    { label: `7'1" chasing 95+ THREE`, height: 85, key: 'three', threshold: 95 },
  ];

  for (const c of cases) {
    const o = chaseOdds(c.height, c.key, c.threshold);
    console.log(`\nCHASE PULL — ${c.label}   (expected at that height: ${Math.round(o.expected)})`);
    console.log('-'.repeat(66));
    console.log(pad('no freak gene', 34) + lpad(oneIn(o.pNoFreak), 30));
    console.log(pad('freak gene already on this attr', 34) + lpad(oneIn(o.pFreak), 30));
    console.log(pad('blended (a fresh roll at this height)', 34) + lpad(oneIn(o.blended), 30));
    if (c.published) {
      const parts = [];
      if (c.published.without) parts.push(`without 1 in ${c.published.without.toLocaleString()}`);
      if (c.published.with) parts.push(`with 1 in ${c.published.with.toLocaleString()}`);
      if (c.published.blended) parts.push(`blended ~1 in ${c.published.blended.toLocaleString()}`);
      console.log(`published: ${parts.join(' · ')}`);
    }
  }

  console.log(`
NOTE. The roll curve is the magnetic one (half-normal, centred on the expected
value) rather than the spec's sqrt(-ln u) draw — see the note in constants.js for
why that one put the most likely roll 0.7 sigma below the number it labelled
"expected". UP_SCALE was tuned so the 12-row 95+ table still lands on the
published rates, so the chase economy is unchanged even though the bulk moved.

The spec's chase table was never reachable from the spec's own constants either:
its two "with freak gene" figures, 5.8M and 6M, are inconsistent with each other
by the engine's arithmetic. The design intent holds under both curves — without
the gene the pull is effectively impossible, with it, it is real.`);
}

// ---------------------------------------------------------------------------
// Calibration: emit the constants that go back into src/constants.js
// ---------------------------------------------------------------------------
function calibrate(n) {
  const raws = new Float64Array(n);
  const rar = new Float64Array(n);
  const hype = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const b = rollCompleteBuild(rng);
    raws[i] = rawComposite(b);
    rar[i] = buildRarityScore(b);
    hype[i] = overallFor(b) + rng.gauss(0, SCOUT_NOISE);
  }
  raws.sort();
  rar.sort();
  hype.sort();
  const q = (arr, p) => arr[clamp(Math.floor(p * (arr.length - 1)), 0, arr.length - 1)];

  const ps = [0, 0.001, 0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9,
    0.95, 0.98, 0.987, 0.995, 0.999, 0.9992, 0.99985, 0.9999, 0.99999, 1].sort((a, b) => a - b);

  console.log('\n// paste into src/constants.js');
  console.log('export const RAW_QUANTILES = [');
  for (const p of ps) console.log(`  [${q(raws, p).toFixed(4)}, ${p}],`);
  console.log('];');

  const hypePs = [0, 0.1, 0.3, 0.5, 0.7, 0.8, 0.85, 0.9, 0.93, 0.95, 0.96, 0.97,
    0.98, 0.985, 0.99, 0.995, 0.998, 0.999, 0.9995, 0.9999, 1];
  console.log('\nexport const HYPE_QUANTILES = [');
  for (const p of hypePs) console.log(`  [${q(hype, p).toFixed(4)}, ${p}],`);
  console.log('];');

  console.log('\nexport const BUILD_RARITY_CUTS = {');
  const cuts = { Uncommon: 0.65, Rare: 0.88, Elite: 0.97, Legendary: 0.995, Mythic: 0.9995 };
  for (const [name, p] of Object.entries(cuts)) {
    console.log(`  ${name}: ${q(rar, p).toFixed(3)},`);
  }
  console.log('};');
  console.log(`\n// raw composite: min ${q(raws, 0).toFixed(1)} median ${q(raws, 0.5).toFixed(1)} max ${q(raws, 1).toFixed(1)}`);
}

// ---------------------------------------------------------------------------
// Overall distribution vs the Basketball GM shape target
// ---------------------------------------------------------------------------
function overallCheck(n) {
  const buckets = { '70s': 0, '80s': 0, '90s': 0 };
  let sum = 0;
  const all = [];
  for (let i = 0; i < n; i++) {
    const b = rollCompleteBuild(rng);
    const ov = overallFor(b);
    sum += ov;
    all.push(ov);
    if (ov >= 90) buckets['90s']++;
    else if (ov >= 80) buckets['80s']++;
    else if (ov >= 70) buckets['70s']++;
  }
  all.sort((a, b) => a - b);
  const LEAGUE = 450; // players in a simulated season
  console.log('\nOVERALL DISTRIBUTION vs CALIBRATION TARGET');
  console.log('-'.repeat(66));
  console.log(pad('BAND', 10) + lpad('SHARE', 12) + lpad('PER SEASON', 14) + lpad('TARGET', 18));
  const rows = [
    ['70-79', buckets['70s'] / n, '~6 / season'],
    ['80-89', buckets['80s'] / n, '~1 per 3 seasons'],
    ['90+', buckets['90s'] / n, '~7 per century'],
  ];
  for (const [band, share, target] of rows) {
    console.log(pad(band, 10) + lpad((share * 100).toFixed(4) + '%', 12) + lpad((share * LEAGUE).toFixed(2), 14) + lpad(target, 18));
  }
  console.log(`\nmean overall ${(sum / n).toFixed(1)} · median ${all[Math.floor(n / 2)]} · p95 ${all[Math.floor(n * 0.95)]} · max ${all[n - 1]}`);
}

// ---------------------------------------------------------------------------
// Career outcomes
// ---------------------------------------------------------------------------
function careerCheck(n) {
  let drafted = 0, lottery = 0, madeLeague = 0, allStars = 0, mvps = 0, rings = 0, hof = 0;
  let seasons = 0, ppgSum = 0, busts = 0, injuriesLost = 0;
  const careerLens = [];
  const archetypeCount = {};
  const seasonRatings = { total: 0, s70: 0, s80: 0, s90: 0 };
  const ratingSamples = [];
  for (let i = 0; i < n; i++) {
    const b = rollCompleteBuild(rng);
    const c = simulateCareer(b, rng);
    for (const s of c.seasons) {
      seasonRatings.total++;
      if (s.rating >= 90) seasonRatings.s90++;
      else if (s.rating >= 80) seasonRatings.s80++;
      else if (s.rating >= 70) seasonRatings.s70++;
      if (ratingSamples.length < 400000) ratingSamples.push(s.rating);
    }
    if (c.drafted) drafted++;
    if (c.pick && c.pick <= 14) lottery++;
    if (c.seasons.length > 0) madeLeague++;
    allStars += c.awards.allStars;
    mvps += c.awards.mvps;
    rings += c.awards.rings;
    if (c.hof) hof++;
    if (c.bust) busts++;
    seasons += c.seasons.length;
    if (c.madeLeague) careerLens.push(c.seasons.length);
    ppgSum += c.careerAverages.ppg;
    injuriesLost += c.seasonsLostToInjury;
    const t = c.title.title;
    archetypeCount[t] = (archetypeCount[t] || 0) + 1;
  }
  console.log('\nCAREER OUTCOMES');
  console.log('-'.repeat(70));
  const row = (k, v, target = '') => console.log(pad(k, 34) + lpad(v, 14) + lpad(target, 22));
  row('drafted', `${((drafted / n) * 100).toFixed(1)}%`);
  row('lottery pick, share of drafted', `${((lottery / Math.max(drafted, 1)) * 100).toFixed(1)}%`, '23% (14 of 60)');
  row('played at least one season', `${((madeLeague / n) * 100).toFixed(1)}%`);
  careerLens.sort((a, b) => a - b);
  row('mean seasons (of those who played)', (seasons / Math.max(madeLeague, 1)).toFixed(1));
  row('median seasons', String(careerLens[Math.floor(careerLens.length / 2)] ?? 0), 'NBA median ~5');
  row('avg career ppg (played)', (ppgSum / Math.max(madeLeague, 1)).toFixed(1));
  row('seasons lost to injury per career', (injuriesLost / Math.max(madeLeague, 1)).toFixed(2));
  row('busted (lottery pick, no impact)', `${((busts / Math.max(lottery, 1)) * 100).toFixed(1)}%`, 'of lottery picks');

  // Award rates only mean something per player-season, against a 450-player league.
  console.log('\nAWARD RATES — per player-season, vs a 450-player league');
  console.log('-'.repeat(70));
  const ps = Math.max(seasons, 1);
  row('all-star selection', `${((allStars / ps) * 100).toFixed(2)}%`, '5.3% (24 of 450)');
  row('MVP', `${((mvps / ps) * 100).toFixed(3)}%`, '0.22% (1 of 450)');
  row('championship', `${((rings / ps) * 100).toFixed(2)}%`, '3.3% (15 of 450)');
  row('hall of fame (of those who played)', `${((hof / Math.max(madeLeague, 1)) * 100).toFixed(2)}%`, '~0.5%');

  // The BBGM calibration target describes ratings of players ON A ROSTER, so it
  // has to be measured over player-seasons, not over rolled builds.
  console.log('\nIN-LEAGUE RATING DISTRIBUTION — per player-season');
  console.log('-'.repeat(70));
  const tot = Math.max(seasonRatings.total, 1);
  row('rated 70-79', `${((seasonRatings.s70 / tot) * 100).toFixed(3)}%`, '1.33% (6 of 450)');
  row('rated 80-89', `${((seasonRatings.s80 / tot) * 100).toFixed(4)}%`, '0.074% (1 per 3y)');
  row('rated 90+', `${((seasonRatings.s90 / tot) * 100).toFixed(4)}%`, '0.016% (7 per 100y)');
  ratingSamples.sort((a, b) => a - b);
  const rq = (p) => ratingSamples[Math.floor(p * (ratingSamples.length - 1))] ?? 0;
  console.log(
    `\nin-league rating percentiles  p25 ${rq(0.25)} · p50 ${rq(0.5)} · p75 ${rq(0.75)} · ` +
      `p947 ${rq(0.947)} (all-star line) · p99 ${rq(0.99)} · p998 ${rq(0.998)} (MVP line) · max ${rq(1)}`,
  );

  console.log('\nTITLE DISTRIBUTION');
  console.log('-'.repeat(52));
  for (const [k, v] of Object.entries(archetypeCount).sort((a, b) => b[1] - a[1])) {
    console.log(pad(k, 30) + lpad(`${((v / n) * 100).toFixed(2)}%`, 22));
  }
}

// ---------------------------------------------------------------------------

console.log(`BUILD A HOOPER — Monte Carlo   n=${N.toLocaleString()}`);

function sampleCareers(k) {
  for (let i = 0; i < k; i++) {
    const b = rollCompleteBuild(rng);
    const c = simulateCareer(b, rng);
    const v = writeVerdict(c, b, rng);
    const a = c.careerAverages;
    console.log('\n' + '='.repeat(72));
    console.log(`${randomName(rng)}  ${formatHeight(b.height)} (+${b.wingspan - b.height}") ${b.frame}  ${c.position.short}  OVR ${c.overall}  MENT ${b.mentality}  FIT ${c.fit}`);
    console.log(`${v.headline}   [build rarity: ${c.rarity.name}]`);
    if (b.freakGene) console.log(`freak gene: ${b.freakGene} (${b.skills[b.freakGene]})`);
    console.log(Object.entries(b.skills).map(([k2, v2]) => `${k2} ${v2}`).join(' · '));
    console.log(`dur ${b.physicals.durability} sta ${b.physicals.stamina} lon ${b.physicals.longevity} | ` +
      `we ${b.mentals.workEthic} iq ${b.mentals.bballIQ} clu ${b.mentals.clutch} coa ${b.mentals.coachability}`);
    console.log(`${c.madeLeague ? `${c.seasons.length} seasons · ${a.ppg}/${a.rpg}/${a.apg} · ${a.mpg} mpg · peak ${c.peakRating} at ~${c.peakAge} · AS ${c.awards.allStars} MVP ${c.awards.mvps} RING ${c.awards.rings}${c.hof ? ' · HOF' : ''}` : 'never played'}`);
    console.log(`VERDICT: ${v.body}`);
  }
}

if (has('--sample')) {
  sampleCareers(numArg('--sample', 8) || 8);
} else if (has('--chase')) {
  chaseCheck();
} else if (has('--calibrate')) {
  calibrate(N);
} else if (has('--overall')) {
  overallCheck(N);
} else if (has('--careers')) {
  careerCheck(N);
} else if (has('--both')) {
  const before = rateRun(N, { noArchetypes: true });
  printRateTable(before, { label: 'BEFORE — rolled archetypes DISABLED' });
  const after = rateRun(N, {});
  printRateTable(after, { compare: false, label: 'AFTER — rolled archetypes ENABLED' });
  console.log('\n' + pad('ATTRIBUTE', 14) + lpad('BEFORE', 14) + lpad('AFTER', 14) + lpad('INFLATION', 14));
  console.log('-'.repeat(56));
  for (const k of SKILL_KEYS.slice().sort((a, b) => after[b] - after[a])) {
    const infl = before[k] > 0 ? after[k] / before[k] : Infinity;
    console.log(pad(SKILLS[k].label, 14) + lpad(oneIn(before[k]), 14) + lpad(oneIn(after[k]), 14) + lpad(`x${infl.toFixed(2)}`, 14));
  }
} else {
  const opts = has('--archetypes') ? {} : { noArchetypes: true };
  printRateTable(rateRun(N, opts), {
    label: has('--archetypes') ? 'ROLLED ARCHETYPES ENABLED' : 'ROLLED ARCHETYPES DISABLED (matches published run)',
  });
}
