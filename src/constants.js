// ---------------------------------------------------------------------------
// THE MATH. Validated by tools/sim.js. Change nothing here without re-running
// `npm run sim` and comparing the printed table to VERIFIED_95_PLUS below.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE ROLL CURVE — magnetic, centred on the expected value.
//
// The original curve drew its deviation as sigma*sqrt(-ln u), which is a
// RAYLEIGH magnitude: its density is zero at the expected value and peaks at
// sigma/sqrt(2). Combined with only 30% of deviations pointing up, that put the
// single most likely roll about 0.7 sigma BELOW the number labelled "expected"
// (21 points below, for Three), and landed you under it 70% of the time. The
// label was not describing the distribution.
//
// This curve is a half-normal magnitude with a fair coin for direction, so:
//   - the density PEAKS at the expected value instead of having a hole there,
//   - the expected value is the true median: half above, half below,
//   - probability falls off as exp(-d^2), so drifting a little is cheap and
//     drifting a lot gets expensive fast,
//   - the downward scale is wider than the upward one, so at any given distance
//     the bad side is likelier than the good side — but a genuinely horrible
//     roll is still hard, because that side decays just as fast.
//
// UP_SCALE is tuned so the 95+ chase rates land on the published table: the
// rarity economy is unchanged, only the bulk moved onto the target.
// ---------------------------------------------------------------------------
export const UP_CHANCE = 0.5; // fair coin — "expected" has to mean expected
export const UP_SCALE = 0.80; // upside spread, as a fraction of sigma
export const DOWN_SCALE = 1.01; // downside spread — wider, so bad is likelier

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
  [26.6275, 0],
  [32.6865, 0.001],
  [36.5726, 0.01],
  [40.3273, 0.05],
  [42.4481, 0.1],
  [45.1140, 0.2],
  [47.1090, 0.3],
  [48.8472, 0.4],
  [50.5138, 0.5],
  [52.2109, 0.6],
  [54.0628, 0.7],
  [56.2783, 0.8],
  [59.4177, 0.9],
  [62.0895, 0.95],
  [65.1269, 0.98],
  [66.4260, 0.987],
  [69.0815, 0.995],
  [72.9400, 0.999],
  [73.3975, 0.9992],
  [76.8212, 0.99985],
  [77.4740, 0.9999],
  [81.0721, 0.99999],
  [84.6170, 1],
];

// Build-rarity score cutoffs, emitted by the same calibration pass. The score is
// spike-weighted surprisal (see buildRarityScore), not a flat sum.
export const BUILD_RARITY_CUTS = {
  Uncommon: 9.323,
  Rare: 11.494,
  Elite: 13.631,
  Legendary: 15.953,
  Mythic: 18.545,
};

export const DRAFT_CUTOFF = 62; // scout hype below this goes undrafted
export const SCOUT_NOISE = 6.5;

// Empirical quantiles of scout hype (= overall + gauss(0, SCOUT_NOISE)), so a
// draft pick can be a rank inside the class rather than an absolute number.
// Hype carries variance the overall anchors do not describe, which is why this
// cannot be derived from OVERALL_ANCHORS. Emitted by `npm run sim -- --calibrate`.
export const HYPE_QUANTILES = [
  [-5.3238, 0],
  [30.1124, 0.1],
  [41.4259, 0.3],
  [49.8307, 0.5],
  [57.7877, 0.7],
  [62.0810, 0.8],
  [64.5030, 0.85],
  [67.3386, 0.9],
  [69.4853, 0.93],
  [71.2854, 0.95],
  [72.3844, 0.96],
  [73.7183, 0.97],
  [75.4889, 0.98],
  [76.6711, 0.985],
  [78.2568, 0.99],
  [80.8895, 0.995],
  [84.1440, 0.998],
  [86.6884, 0.999],
  [89.3953, 0.9995],
  [95.7457, 0.9999],
  [113.1957, 1],
];
