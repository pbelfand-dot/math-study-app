// ---------------------------------------------------------------------------
// THE MATH. Validated by tools/sim.js. Change nothing here without re-running
// `npm run sim` and comparing the printed table to VERIFIED_95_PLUS below.
// ---------------------------------------------------------------------------

export const P_UP = 0.30; // only 30% of deviations go up — upside is expensive
export const FREAK_CHANCE = 1 / 300; // one build in 300 gets a freak gene
export const FREAK_MULT = 2.6; // freak gene multiplies SIGMA, not the value

export const STAT_FLOOR = 25;
export const STAT_CEIL = 99;

export const BASE_HEIGHT = 64; // 5'4"

// key -> { label, base, growth (per inch over 5'4"), sigma }
export const SKILLS = {
  dunk: { label: 'Dunk', base: 8, growth: 2.9, sigma: 18 },
  block: { label: 'Block', base: 6, growth: 2.8, sigma: 18 },
  rebounding: { label: 'Rebounding', base: 10, growth: 2.6, sigma: 20 },
  interiorD: { label: 'Interior D', base: 12, growth: 2.4, sigma: 20 },
  post: { label: 'Post', base: 10, growth: 2.5, sigma: 20 },
  speed: { label: 'Speed', base: 84, growth: -2.0, sigma: 22 },
  handles: { label: 'Handles', base: 80, growth: -2.2, sigma: 24 },
  playmaking: { label: 'Playmaking', base: 76, growth: -2.1, sigma: 26 },
  perimeterD: { label: 'Perimeter D', base: 52, growth: -0.3, sigma: 26 },
  three: { label: 'Three', base: 48, growth: -0.5, sigma: 30 },
  midrange: { label: 'Mid-Range', base: 48, growth: -0.4, sigma: 30 },
  finishing: { label: 'Finishing', base: 46, growth: 0.7, sigma: 28 },
};

export const SKILL_KEYS = Object.keys(SKILLS);

// Class B — physical intangibles. Expected values depend on height and frame.
export const PHYSICALS = {
  durability: {
    label: 'Durability',
    sigma: 24,
    expected: (h, f) => 58 - (h - 78) * 1.6 - (f - 2) * 3.5,
    drives: 'Injury frequency and severity',
  },
  stamina: {
    label: 'Stamina',
    sigma: 24,
    expected: (h, f) => 58 - (h - 78) * 1.3 - (f - 2) * 4,
    drives: 'Minutes ceiling, 4th-quarter dropoff',
  },
  longevity: {
    label: 'Longevity',
    sigma: 26,
    expected: (h) => 52 - (h - 78) * 0.5,
    drives: 'Decline rate — independent of durability',
  },
};

export const PHYSICAL_KEYS = Object.keys(PHYSICALS);

// Class C — hidden until after the career sim.
export const MENTALS = {
  workEthic: { label: 'Work Ethic', mean: 50, sd: 20 },
  bballIQ: { label: 'Basketball IQ', mean: 50, sd: 20 },
  clutch: { label: 'Clutch', mean: 50, sd: 20 },
  coachability: { label: 'Coachability', mean: 50, sd: 20 },
};

export const MENTAL_KEYS = Object.keys(MENTALS);

export const FRAMES = ['Slight', 'Lean', 'Solid', 'Broad', 'Heavy'];

// Rarity tiers, keyed on P(this high or higher). First match wins.
export const RARITY_TIERS = [
  { min: 0.35, name: 'Common', color: '#8b93a1' },
  { min: 0.12, name: 'Uncommon', color: '#3fb950' },
  { min: 0.03, name: 'Rare', color: '#4c8dff' },
  { min: 0.005, name: 'Elite', color: '#a970ff' },
  { min: 0.0005, name: 'Legendary', color: '#f0b132' },
  { min: -1, name: 'Mythic', color: '#ff4d4d' },
];

// Published Monte Carlo result (1M+ rolls, no rolled archetypes). `npm run sim`
// re-derives these; a mismatch means the engine is wrong.
export const VERIFIED_95_PLUS = {
  finishing: 22,
  speed: 45,
  playmaking: 65,
  handles: 67,
  midrange: 67,
  three: 77,
  perimeterD: 83,
  dunk: 209,
  rebounding: 220,
  interiorD: 298,
  post: 306,
  block: 427,
};

// ---------------------------------------------------------------------------
// OVERALL CALIBRATION
//
// Overall is a percentile rank of the rolled-build population, mapped through
// anchor points chosen to match the Basketball GM rating shape cited in the
// spec: ~6 players/season in the 70s, one in the 80s every three years, ~7 in
// the 90s per simulated century (~450 league players/season).
//   P(>=70) ~ 1.3%   P(>=80) ~ 0.08%   P(>=90) ~ 0.015%
// The p=0.80 -> 62 anchor is what makes the spec's "below ~62 goes undrafted"
// land at roughly one build in five getting drafted.
//
// WHAT IS BEING CALIBRATED, because there are two defensible readings and they
// differ by ~9x. The BBGM figures are a snapshot of one league season. Matching
// them against simulated PLAYER-SEASONS is the wrong target: a 70 plays fifteen
// seasons and a 62 plays two, so survivorship counts good players many times
// over, and forcing that series onto the BBGM shape would make a 70 overall a
// 1-in-2,300 roll — a chase nobody ever completes.
//
// So the target here is the PER-BUILD rate: how often someone rolling builds
// sees a 70, an 80, a 90 should match how often those ratings exist in a league
// season. ~1.3% / ~0.08% / ~0.015%, i.e. one 70 per ~80 builds, one 80 per
// ~1,250, one 90 per ~6,700. The richer in-league distribution that falls out of
// this is survivorship, not inflation, and `--careers` reports it separately.
//
// Anchors sit on the bucket BOUNDARY (69.5, not 70) because overall is rounded
// for display, and Math.round(69.6) would otherwise smuggle an extra ~1% of
// builds into the 70s.
export const OVERALL_ANCHORS = [
  [0.0, 18],
  [0.02, 25],
  [0.15, 35],
  [0.3, 42],
  [0.5, 50],
  [0.8, 61.5], // draft cutoff sits here — do not move without re-checking draft rate
  [0.987, 69.5],
  [0.9992, 79.5],
  [0.99985, 89.5],
  [1.0, 99],
];

// Empirical quantiles of the raw composite, emitted by `npm run sim --calibrate`.
// [percentile, rawValue] ascending. Regenerate whenever a constant changes.
export const RAW_QUANTILES = [
  [23.5775, 0],
  [27.6425, 0.001],
  [30.4555, 0.01],
  [33.7105, 0.05],
  [35.7172, 0.1],
  [38.3744, 0.2],
  [40.4238, 0.3],
  [42.2626, 0.4],
  [44.0556, 0.5],
  [45.9081, 0.6],
  [47.9481, 0.7],
  [50.4107, 0.8],
  [53.9462, 0.9],
  [56.9513, 0.95],
  [60.4250, 0.98],
  [61.9113, 0.987],
  [64.9485, 0.995],
  [69.5217, 0.999],
  [70.1388, 0.9992],
  [74.2137, 0.99985],
  [75.0437, 0.9999],
  [79.7450, 0.99999],
  [86.5018, 1],
];

// Build-rarity score cutoffs, emitted by the same calibration pass. The score is
// spike-weighted surprisal (see buildRarityScore), not a flat sum.
export const BUILD_RARITY_CUTS = {
  Uncommon: 8.533,
  Rare: 10.805,
  Elite: 13.028,
  Legendary: 15.440,
  Mythic: 18.339,
};

export const DRAFT_CUTOFF = 62; // scout hype below this goes undrafted
export const SCOUT_NOISE = 6.5;

// Empirical quantiles of scout hype (= overall + gauss(0, SCOUT_NOISE)), so a
// draft pick can be a rank inside the class rather than an absolute number.
// Hype carries variance the overall anchors do not describe, which is why this
// cannot be derived from OVERALL_ANCHORS. Emitted by `npm run sim -- --calibrate`.
export const HYPE_QUANTILES = [
  [-4.9707, 0],
  [30.1221, 0.1],
  [41.4395, 0.3],
  [49.8326, 0.5],
  [57.7594, 0.7],
  [62.0259, 0.8],
  [64.4536, 0.85],
  [67.3107, 0.9],
  [69.4519, 0.93],
  [71.2676, 0.95],
  [72.3665, 0.96],
  [73.6991, 0.97],
  [75.4474, 0.98],
  [76.6309, 0.985],
  [78.2391, 0.99],
  [80.8311, 0.995],
  [84.1331, 0.998],
  [86.6154, 0.999],
  [89.2246, 0.9995],
  [95.5944, 0.9999],
  [117.4974, 1],
];
