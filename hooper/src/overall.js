import {
  OVERALL_ANCHORS,
  RAW_QUANTILES,
  HYPE_QUANTILES,
  BUILD_RARITY_CUTS,
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

// Unnormalised weights; normalised at use.
const WEIGHTS = {
  PG: { playmaking: 18, handles: 16, speed: 12, three: 12, midrange: 9, finishing: 9, perimeterD: 10, dunk: 3, post: 1, interiorD: 2, block: 1, rebounding: 7 },
  SG: { playmaking: 11, handles: 12, speed: 11, three: 15, midrange: 11, finishing: 10, perimeterD: 11, dunk: 6, post: 2, interiorD: 3, block: 2, rebounding: 6 },
  WING: { playmaking: 9, handles: 9, speed: 10, three: 13, midrange: 10, finishing: 11, perimeterD: 12, dunk: 7, post: 4, interiorD: 6, block: 3, rebounding: 6 },
  FWD: { playmaking: 6, handles: 6, speed: 8, three: 10, midrange: 8, finishing: 12, perimeterD: 9, dunk: 8, post: 8, interiorD: 11, block: 7, rebounding: 7 },
  C: { playmaking: 4, handles: 3, speed: 5, three: 6, midrange: 6, finishing: 12, perimeterD: 5, dunk: 9, post: 11, interiorD: 15, block: 12, rebounding: 12 },
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

export function overallFor(b) {
  const raw = rawComposite(b);
  const p = rawToPercentile(raw);
  return clamp(Math.round(percentileToOverall(p)), 10, 99);
}

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
  const score = buildRarityScore(b);
  const order = ['Mythic', 'Legendary', 'Elite', 'Rare', 'Uncommon'];
  for (const name of order) {
    if (score >= BUILD_RARITY_CUTS[name]) {
      return { name, score, color: RARITY_TIERS.find((t) => t.name === name).color };
    }
  }
  return { name: 'Common', score, color: RARITY_TIERS[0].color };
}
