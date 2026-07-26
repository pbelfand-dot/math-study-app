import {
  OVERALL_ANCHORS,
  RAW_QUANTILES,
  HYPE_QUANTILES,
  BUILD_TIER_CUTS,
  RARITY_TIERS,
} from './constants.js';
import { clamp } from './roll.js';

// Position is read off height. It only decides which skills the composite cares
// about — it is not a rating.
export const POSITIONS = [
  { name: 'Point Guard', short: 'PG', maxHeight: 73 },
  { name: 'Shooting Guard', short: 'SG', maxHeight: 77 },
  { name: 'Wing', short: 'WING', maxHeight: 80 },
  { name: 'Forward', short: 'FWD', maxHeight: 83 },
  { name: 'Center', short: 'C', maxHeight: 999 },
];

export function positionFor(height) {
  return POSITIONS.find((p) => height <= p.maxHeight);
}

// Unnormalised weights, normalised at use. Concentrated rather than flat: a
// point guard's rating should live and die on playmaking, handles and shooting,
// and a centre's on interior defence and rebounding. Spreading weight evenly
// across twelve attributes makes every position rate the same player the same
// way, which is how a 7-footer's handle ends up mattering as much as his rim
// protection.
const WEIGHTS = {
  PG: { playmaking: 22, handles: 18, three: 14, speed: 13, perimeterD: 9, midrange: 8, finishing: 8, rebounding: 4, dunk: 2, interiorD: 2, post: 1, block: 1 },
  SG: { three: 20, midrange: 13, handles: 11, speed: 11, perimeterD: 11, finishing: 10, playmaking: 9, dunk: 6, rebounding: 5, interiorD: 2, block: 1, post: 1 },
  WING: { three: 16, finishing: 13, perimeterD: 13, midrange: 11, speed: 9, dunk: 8, rebounding: 8, handles: 8, playmaking: 7, interiorD: 4, block: 2, post: 1 },
  FWD: { rebounding: 15, interiorD: 14, finishing: 13, three: 11, post: 10, dunk: 10, block: 9, midrange: 7, perimeterD: 6, speed: 3, playmaking: 1, handles: 1 },
  C: { interiorD: 19, rebounding: 18, block: 15, finishing: 13, post: 12, dunk: 9, midrange: 5, three: 4, perimeterD: 3, speed: 1, playmaking: 1, handles: 0 },
};

export function fitFor(b) {
  const s = b.skills;
  const scoring = (s.three + s.midrange + s.finishing + s.dunk) / 4;
  const passing = (s.playmaking + s.handles) / 2;
  return ((b.mentality - 50) / 50) * ((scoring - passing) / 40);
}

// Raw composite, before calibration. Deliberately small wingspan contribution —
// the old build let it push everyone into the 70s.
export function rawComposite(b) {
  const pos = positionFor(b.height);
  const w = WEIGHTS[pos.short];
  let sum = 0;
  let total = 0;
  for (const [k, weight] of Object.entries(w)) {
    sum += b.skills[k] * weight;
    total += weight;
  }
  let raw = sum / total;

  const wingDiff = b.wingspan - b.height;
  raw += clamp(wingDiff - 2.5, -4, 6) * 0.35;

  // Physicals matter, but a little.
  raw += (b.physicals.stamina - 50) * 0.04;
  raw += (b.physicals.durability - 50) * 0.02;

  // Fit feeds peak overall.
  raw += fitFor(b) * 7;

  return raw;
}

// Empirical raw -> percentile, then percentile -> overall through the anchors.
function interp(table, x) {
  if (x <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i];
    const [x0, y0] = table[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return last[1];
}

export function rawToPercentile(raw) {
  return interp(RAW_QUANTILES, raw);
}

export function percentileToOverall(p) {
  return interp(OVERALL_ANCHORS, p);
}

// Inverse of the anchor curve: where a rating sits in the build population.
export function overallToPercentile(ov) {
  const flipped = OVERALL_ANCHORS.map(([p, o]) => [o, p]);
  return interp(flipped, ov);
}

// Where a scout-hype number sits in the class. Measured, not derived — hype
// carries SCOUT_NOISE variance on top of overall, so the overall anchors do not
// describe it and using them packs everyone into the lottery.
export function hypeToPercentile(h) {
  return interp(HYPE_QUANTILES, h);
}

// What the build is worth at its PRIME, if it develops. This is the number the
// rolled attributes describe.
export function potentialFor(b) {
  const raw = rawComposite(b);
  const p = rawToPercentile(raw);
  return clamp(Math.round(percentileToOverall(p)), 10, 99);
}

// What he is on draft night. Always below potential, and further below it the
// higher the ceiling — a nineteen-year-old with star tools is further from
// using them than a twenty-two-year-old who is already what he will be. That
// gap is the whole reason draft classes are a gamble.
export function draftOverallFor(b) {
  const pot = potentialFor(b);
  const gap = clamp((pot - 50) * 0.45 + (21 - b.draftAge) * 1.8 + b.rawness, 1, 28);
  return clamp(Math.round(pot - gap), 20, 99);
}

// What the scouts put on the report: a potential GRADE on the attribute scale,
// not the ceiling itself. It tracks the true ceiling but is neither equal to it
// nor certain — scouting is a projection, and the number you are shown is the
// projection, so a build's real prime stays a question until it is played out.
export function potentialGrade(b) {
  const pot = potentialFor(b);
  const scouted = 35 + (pot - 45) * 1.35 + (b.scoutNoise ?? 0) * 4;
  return clamp(Math.round(scouted), 25, 99);
}

// Kept as the build's headline number = its ceiling.
export const overallFor = potentialFor;

// ---------------------------------------------------------------------------
// Build rarity. Multiplying every above-expectation probability swung wildly;
// this sums surprisal across the 12 skills and buckets it into a named tier.
// ---------------------------------------------------------------------------
// Surprisal, weighted toward the spikes. A flat sum across all twelve skills
// lets a broadly mediocre build outscore one with a genuine Elite pull, because
// eleven slightly-above-expectation rolls add up faster than one enormous one —
// which is how a 98 playmaking ends up labelled a Common build. The top three
// carry full weight and the rest are discounted, so a chase pull reads as one.
export function buildRarityScore(b) {
  const s = Object.keys(b.skills)
    .map((key) => -Math.log(Math.max(b.skillMeta[key].p, 1e-12)))
    .sort((x, y) => y - x);
  const top = s.slice(0, 3).reduce((a, v) => a + v, 0);
  const rest = s.slice(3).reduce((a, v) => a + v, 0);
  return top + rest * 0.3;
}

export function buildRarityTier(b) {
  const q = rawToPercentile(rawComposite(b));
  const name = BUILD_TIER_CUTS.find(([cut]) => q >= cut)[1];
  return { name, score: q, color: RARITY_TIERS.find((t) => t.name === name).color };
}
