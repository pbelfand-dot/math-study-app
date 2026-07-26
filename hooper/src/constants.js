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
// THE OVR SCALE — read it the way a basketball fan reads one.
//
// This maps a build's percentile onto a rating whose bands mean what people
// expect them to mean:
//
//   < 60   not a pro
//   60-69  end of the bench, two-way, fringe roster
//   70-79  real rotation player up to solid starter
//   80-89  all-star
//   90+    franchise player
//
// This replaced an earlier curve calibrated so that 70+ was the top 1.2% of all
// builds. That was internally consistent, but it made 70 a career ceiling
// instead of a starting point — a rolled build would enter at 62, top out at
// 69, and the number never meant anything a viewer could translate.
//
// What a build rolls is its POTENTIAL: the prime it reaches if it develops.
// Draft-day rating is derived from it (see draftOverallFor) and is always
// lower, by more for the high-upside prospects — which is why a nineteen-year-
// old with a 92 ceiling still enters the league in the mid-70s.
// ---------------------------------------------------------------------------
export const OVERALL_ANCHORS = [
  [0.0, 20],
  [0.1, 32],
  [0.3, 40],
  [0.5, 45],
  [0.7, 57],
  [0.75, 62],
  [0.8, 66],
  [0.85, 70],
  [0.9, 73],
  [0.95, 77],
  [0.98, 83],
  [0.99, 86],
  [0.997, 90],
  [0.9999, 95],
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
  [-7.1341, 0],
  [28.5726, 0.1],
  [38.4620, 0.3],
  [46.1657, 0.5],
  [55.7512, 0.7],
  [61.7156, 0.8],
  [65.0164, 0.85],
  [68.7161, 0.9],
  [71.4467, 0.93],
  [73.6966, 0.95],
  [75.0534, 0.96],
  [76.6616, 0.97],
  [78.7761, 0.98],
  [80.1623, 0.985],
  [81.9601, 0.99],
  [84.7895, 0.995],
  [88.1072, 0.998],
  [90.2917, 0.999],
  [92.3469, 0.9995],
  [96.3443, 0.9999],
  [110.8964, 1],
];
