// Two archetype systems, deliberately kept apart:
//   ROLLED  — gifts. Pulled before the skills, they shape what follows.
//   DERIVED — diagnoses. You cannot roll The Chucker. You become one.
// Every build ends with exactly one title.

export const ARCHETYPE_TIERS = [
  { tier: 'None', chance: 0.70, color: '#8b93a1' },
  { tier: 'Common', chance: 0.185, color: '#3fb950' },
  { tier: 'Rare', chance: 0.08, color: '#4c8dff' },
  { tier: 'Epic', chance: 0.03, color: '#a970ff' },
  { tier: 'Legendary', chance: 0.005, color: '#f0b132' },
];

export const TIER_COLOR = Object.fromEntries(ARCHETYPE_TIERS.map((t) => [t.tier, t.color]));

// boost/cost are added to (subtracted from) the EXPECTED value.
// sigmaMult < 1 narrows the curve — the gift becomes reliable, not just large.
// floor is ALWAYS relative to the natural, height-derived expectation.
export const ROLLED_ARCHETYPES = {
  Legendary: [
    {
      title: 'The Executioner',
      flavor: 'Cold. Wants the last shot and expects to make it.',
      boost: { midrange: 26, three: 14, clutch: 30 },
      sigmaMult: { midrange: 0.55 },
      floor: { midrange: 18, ALL: -5 },
      cost: { playmaking: 12 },
      guaranteesDraft: true,
    },
    {
      title: 'Flamethrower',
      flavor: 'Pulls up from the logo.',
      boost: { three: 30, midrange: 12 },
      sigmaMult: { three: 0.55 },
      floor: { three: 20, ALL: -5 },
      cost: { interiorD: 14, rebounding: 10 },
      guaranteesDraft: true,
    },
    {
      title: 'The Colossus',
      flavor: 'The paint belongs to him.',
      boost: { interiorD: 22, rebounding: 22, block: 20, post: 18 },
      sigmaMult: {},
      floor: { ALL: -5 },
      cost: { speed: 16, handles: 14 },
      guaranteesDraft: true,
    },
    {
      title: 'The Architect',
      flavor: 'Builds the offense before the ball crosses half.',
      boost: { playmaking: 28, handles: 18, bballIQ: 30 },
      sigmaMult: { playmaking: 0.6 },
      floor: { playmaking: 20, ALL: -5 },
      cost: { dunk: 12, interiorD: 10 },
      guaranteesDraft: true,
    },
  ],
  Epic: [
    {
      title: 'The Hammer',
      flavor: 'The rim is a personal insult.',
      boost: { dunk: 22, finishing: 18 },
      sigmaMult: {},
      floor: { dunk: 12 },
      cost: { three: 12 },
    },
    {
      title: 'The Warden',
      flavor: 'Picks you up ninety-four feet and never lets go.',
      boost: { perimeterD: 24, speed: 12 },
      sigmaMult: {},
      floor: { perimeterD: 14 },
      cost: { post: 10 },
    },
    {
      title: 'The Anchor',
      flavor: 'The defense is built behind him.',
      boost: { interiorD: 20, rebounding: 18 },
      sigmaMult: {},
      floor: { interiorD: 12 },
      cost: { speed: 10 },
    },
    {
      title: 'Bucket',
      flavor: 'Scores every way there is. Asks about the rest later.',
      boost: { three: 12, midrange: 12, finishing: 12, dunk: 12 },
      sigmaMult: {},
      floor: {},
      cost: { perimeterD: 12, bballIQ: 8 },
    },
  ],
  Rare: [
    {
      title: 'Live Wire',
      flavor: 'Two speeds: fast, and gone.',
      boost: { speed: 18, handles: 14 },
      sigmaMult: {},
      floor: {},
      cost: { post: 10 },
    },
    {
      title: 'Deadeye',
      flavor: 'Same release, every single time.',
      boost: { three: 20 },
      sigmaMult: { three: 0.7 },
      floor: {},
      cost: { rebounding: 8 },
    },
    {
      title: 'The Vacuum',
      flavor: 'The ball comes off the rim and it is already his.',
      boost: { rebounding: 20 },
      sigmaMult: {},
      floor: {},
      cost: { three: 8 },
    },
    {
      title: 'Iron',
      flavor: 'Never misses a night. Never has.',
      boost: { durability: 25, stamina: 20, longevity: 22 },
      sigmaMult: {},
      floor: {},
      cost: {},
      costNote: 'No skill gifts at all.',
    },
  ],
  Common: [
    {
      title: 'Gym Rat',
      flavor: 'First one in. Nobody has ever seen him leave.',
      boost: { workEthic: 28 },
      sigmaMult: {},
      floor: {},
      cost: {},
    },
    {
      title: 'High Motor',
      flavor: 'Runs the floor like the game owes him money.',
      boost: { stamina: 18, speed: 8 },
      sigmaMult: {},
      floor: {},
      cost: {},
    },
    {
      title: 'Soft Touch',
      flavor: 'Everything he throws up there kisses off gently.',
      boost: { finishing: 14, midrange: 8 },
      sigmaMult: {},
      floor: {},
      cost: {},
    },
    {
      title: 'Long Arms',
      flavor: 'Passing lanes close before you see them open.',
      boost: { block: 12, perimeterD: 8 },
      sigmaMult: {},
      floor: {},
      cost: { handles: 6 },
    },
  ],
};

export function rollArchetype(rng) {
  const r = rng.random();
  let acc = 0;
  for (const t of ARCHETYPE_TIERS) {
    acc += t.chance;
    if (r < acc) {
      if (t.tier === 'None') return null;
      const a = rng.pick(ROLLED_ARCHETYPES[t.tier]);
      return { ...a, tier: t.tier, color: t.color };
    }
  }
  return null;
}

// Resolve every gift mechanism for one attribute key.
// Returned `floor` is relative to the GIFTED expectation, because that is what
// rollStat is handed — the spec's floor is relative to the natural one.
export function applyGift(archetype, key) {
  if (!archetype) return { boost: 0, sigmaMult: 1, floor: null };
  const boost = (archetype.boost?.[key] || 0) - (archetype.cost?.[key] || 0);
  const sigmaMult = archetype.sigmaMult?.[key] ?? 1;

  const specific = archetype.floor?.[key];
  const all = archetype.floor?.ALL;
  let floorNatural = null;
  if (specific !== undefined && all !== undefined) floorNatural = Math.max(specific, all);
  else if (specific !== undefined) floorNatural = specific;
  else if (all !== undefined) floorNatural = all;

  return {
    boost,
    sigmaMult,
    floor: floorNatural === null ? null : floorNatural - boost,
  };
}

// ---------------------------------------------------------------------------
// 5B — DERIVED ARCHETYPES, for the 70% who rolled nothing.
// ---------------------------------------------------------------------------

// Thresholds are percentiles of the rolled population, not round numbers.
// Measured medians: scoring 42, passing 41, defense 40, IQ 50. Anything phrased
// as "weak scoring" has to sit below 42 to mean weak, and a minimum-skill test
// can never fire at all, because the 25 floor puts a 25 on almost every build.
export function deriveArchetype(b) {
  const s = b.skills;
  const m = b.mentals;
  const scoring = (s.three + s.midrange + s.finishing + s.dunk) / 4;
  const passing = (s.playmaking + s.handles) / 2;
  const defense = (s.perimeterD + s.interiorD + s.block) / 3;
  const skillVals = Object.values(s).sort((x, y) => x - y);
  const best = skillVals[skillVals.length - 1];
  // "No weak spots" needs two tests, not one. The single worst skill tests
  // nothing but the 25 floor, and the fourth-worst alone still lets a build with
  // three floored skills through. Genuinely hole-free is rare here (~1% of
  // balanced high-IQ builds) and The Engine should be rare to match.
  const fourthLowest = skillVals[3];
  const weakSpots = skillVals.filter((v) => v < 35).length;

  // Failure states first — a diagnosis outranks a description.
  if (b.mentality >= 64 && scoring <= 38) {
    return {
      title: 'The Chucker',
      tier: 'Derived',
      failure: true,
      color: '#ff6b6b',
      flavor: 'Wanted every shot. Could not make them.',
    };
  }
  if (b.mentality <= 36 && scoring >= 58) {
    return {
      title: 'The Ghost',
      tier: 'Derived',
      failure: true,
      color: '#ff6b6b',
      flavor: 'Had it the whole time and would not use it.',
    };
  }
  if (b.mentality <= 45 && passing >= 58) {
    return {
      title: 'The Conductor',
      tier: 'Derived',
      color: '#4c8dff',
      flavor: 'The offense runs through him and it hums.',
    };
  }
  if (defense >= 55 && scoring <= 45) {
    return {
      title: 'Glue',
      tier: 'Derived',
      color: '#3fb950',
      flavor: 'Does the parts of the job nobody claps for.',
    };
  }
  if (b.mentality >= 40 && b.mentality <= 62 && m.bballIQ >= 58 && fourthLowest >= 36 && weakSpots <= 3) {
    return {
      title: 'The Engine',
      tier: 'Derived',
      color: '#3fb950',
      flavor: 'Nothing to attack, nothing to scheme against. Never off the floor.',
    };
  }
  if (best < 75) {
    return {
      title: 'Rotation Guy',
      tier: 'Derived',
      color: '#8b93a1',
      flavor: 'Eight to twelve honest minutes a night.',
    };
  }
  return {
    title: 'Rotation Guy',
    tier: 'Derived',
    color: '#8b93a1',
    flavor: 'Useful. Never the reason you bought a ticket.',
  };
}

export function titleFor(b) {
  return b.archetype ? b.archetype : deriveArchetype(b);
}
