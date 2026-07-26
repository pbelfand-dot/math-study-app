import {
  UP_CHANCE,
  UP_SCALE,
  DOWN_SCALE,
  FREAK_CHANCE,
  FREAK_MULT,
  STAT_FLOOR,
  STAT_CEIL,
  BASE_HEIGHT,
  SKILLS,
  SKILL_KEYS,
  PHYSICALS,
  PHYSICAL_KEYS,
  MENTALS,
  MENTAL_KEYS,
  FRAMES,
  RARITY_TIERS,
} from './constants.js';
import { defaultRng } from './rng.js';
import { normalTail, normalTailInv } from './normal.js';
import { rollArchetype, applyGift } from './archetypes.js';

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Half-normal magnitude by inverse transform, fair coin for direction, with a
// wider scale downward than upward. See the note in constants.js for why this
// replaced the original sqrt(-ln u) draw.
export function rollStat(expected, sigma, rng = defaultRng, floorRel = null) {
  const up = rng.random() < UP_CHANCE;
  const u = rng.random() || 1e-12;
  // P(|Z| > t) = u  =>  t = normalTailInv(u/2), which is distributed as |Z|.
  const mag = normalTailInv(u / 2) * sigma * (up ? UP_SCALE : DOWN_SCALE);
  let d = up ? mag : -mag;
  if (floorRel !== null && d < floorRel) d = floorRel;
  return clamp(Math.round(expected + d), STAT_FLOOR, STAT_CEIL);
}

// P(rolling this high or higher), always against the NORMAL sigma — that is
// what makes a freak-gene pull read as absurd rather than merely lucky.
// Exactly at the expected value this returns 0.5, which is the point: the
// number on screen is the median, not a target you usually miss.
export function rarityP(v, expected, sigma) {
  const d = v - expected;
  if (d >= 0) return UP_CHANCE * 2 * normalTail(d / (sigma * UP_SCALE));
  return 1 - (1 - UP_CHANCE) * 2 * normalTail(-d / (sigma * DOWN_SCALE));
}

export function tierFor(p) {
  return RARITY_TIERS.find((t) => p > t.min) || RARITY_TIERS[RARITY_TIERS.length - 1];
}

export function expectedSkill(key, heightInches, boost = 0) {
  const s = SKILLS[key];
  return s.base + (heightInches - BASE_HEIGHT) * s.growth + boost;
}

export function formatHeight(inches) {
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

export function oddsText(p) {
  if (p >= 0.5) return `${Math.round(p * 100)}% or better`;
  const one = 1 / p;
  if (one < 1000) return `1 in ${Math.round(one)}`;
  if (one < 1e6) return `1 in ${Math.round(one / 100) / 10}k`;
  if (one < 1e9) return `1 in ${Math.round(one / 1e5) / 10}M`;
  return `1 in ${Math.round(one / 1e8) / 10}B`;
}

// ---------------------------------------------------------------------------
// Build construction. The UI walks this one beat at a time; the Monte Carlo
// harness calls rollCompleteBuild().
// ---------------------------------------------------------------------------

export function startBuild(rng = defaultRng, opts = {}) {
  const height = clamp(Math.round(rng.gauss(78, 3.6)), 64, 90);
  const wingspan = height + Math.round(rng.gauss(2.5, 2.6));
  const frameIndex = clamp(Math.round(rng.gauss(2, 1)), 0, 4);
  const freak = opts.noFreak ? null : rng.chance(FREAK_CHANCE) ? rng.pick(SKILL_KEYS) : null;
  // Draft age and rawness are rolled here, not in the sim, so the build sheet
  // and the career agree on what draft night looked like.
  const draftAge = 19 + rng.int(4);
  const rawness = rng.gauss(0, 1.8);

  return {
    rng,
    height,
    wingspan,
    frameIndex,
    frame: FRAMES[frameIndex],
    draftAge,
    rawness,
    freakGene: freak,
    archetype: null, // filled by beat 3
    mentality: null, // filled by beat 4
    skills: {},
    skillMeta: {},
    physicals: {},
    physicalMeta: {},
    mentals: {},
    order: rng.shuffle(SKILL_KEYS),
    rerollsLeft: opts.rerolls ?? 3,
  };
}

export function rollArchetypeBeat(b) {
  b.archetype = rollArchetype(b.rng);
  return b.archetype;
}

export function rollMentalityBeat(b) {
  b.mentality = clamp(Math.round(b.rng.gauss(50, 21)), 0, 100);
  return b.mentality;
}

// Everything a gift can touch, resolved for one attribute.
function giftFor(b, key) {
  return applyGift(b.archetype, key);
}

export function rollSkillBeat(b, key) {
  const s = SKILLS[key];
  const g = giftFor(b, key);
  const expectedNatural = expectedSkill(key, b.height);
  const expectedGifted = expectedNatural + g.boost;
  let sigma = s.sigma * g.sigmaMult;
  if (b.freakGene === key) sigma *= FREAK_MULT;

  const value = rollStat(expectedGifted, sigma, b.rng, g.floor);
  b.skills[key] = value;
  b.skillMeta[key] = {
    expectedNatural: Math.round(expectedNatural),
    expectedGifted: Math.round(expectedGifted),
    // Rarity is always judged against the natural expectation and normal sigma.
    p: rarityP(value, expectedNatural, s.sigma),
    freak: b.freakGene === key,
    gifted: g.boost !== 0 || g.sigmaMult !== 1 || g.floor !== null,
  };
  b.skillMeta[key].tier = tierFor(b.skillMeta[key].p);
  return b.skillMeta[key];
}

export function rollPhysicalBeat(b, key) {
  const p = PHYSICALS[key];
  const g = giftFor(b, key);
  const expectedNatural = p.expected(b.height, b.frameIndex);
  const expectedGifted = expectedNatural + g.boost;
  const value = rollStat(expectedGifted, p.sigma * g.sigmaMult, b.rng, g.floor);
  b.physicals[key] = value;
  b.physicalMeta[key] = {
    expectedNatural: Math.round(expectedNatural),
    expectedGifted: Math.round(expectedGifted),
    p: rarityP(value, expectedNatural, p.sigma),
  };
  b.physicalMeta[key].tier = tierFor(b.physicalMeta[key].p);
  return b.physicalMeta[key];
}

export function rollMentals(b) {
  for (const key of MENTAL_KEYS) {
    const m = MENTALS[key];
    const g = giftFor(b, key);
    b.mentals[key] = clamp(Math.round(b.rng.gauss(m.mean + g.boost, m.sd * g.sigmaMult)), 1, 99);
  }
  return b.mentals;
}

// The full ordered beat list the sequential UI walks.
export function beatPlan(b) {
  return [
    { kind: 'height' },
    { kind: 'body' },
    { kind: 'archetype' },
    { kind: 'mentality' },
    ...b.order.map((key) => ({ kind: 'skill', key })),
    ...PHYSICAL_KEYS.map((key) => ({ kind: 'physical', key })),
  ];
}

export function rollCompleteBuild(rng = defaultRng, opts = {}) {
  const b = startBuild(rng, opts);
  if (opts.noArchetypes) b.archetype = null;
  else rollArchetypeBeat(b);
  rollMentalityBeat(b);
  for (const key of b.order) rollSkillBeat(b, key);
  for (const key of PHYSICAL_KEYS) rollPhysicalBeat(b, key);
  rollMentals(b);
  return b;
}
