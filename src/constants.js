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
export const DOWN_SCALE = 0.92; // downside spread — still wider than up, but less punishing

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

// ---------------------------------------------------------------------------
// SKILL CORRELATION
//
// Attributes were rolled independently, which produced players who do not
// exist: a 90 three with a 30 mid-range, an elite finisher who cannot dunk.
// Real skills travel together — shooting is one motion, rim pressure is one
// athletic profile, and size does several jobs at once.
//
// Each skill loads onto shared latent factors plus a unique component. Because
// every skill's driver stays a standard normal by construction, the marginal
// distribution of every attribute — and therefore the whole verified 95+ chase
// table — is completely unchanged. Only the joint shape moves.
//
// Implied correlations: three/mid-range 0.60, handles/playmaking 0.53,
// dunk/finishing 0.34, rebounding/interior 0.42, interior/block 0.47.
// ---------------------------------------------------------------------------
export const FACTORS = ['shoot', 'athlete', 'big', 'guard', 'defense'];

export const FACTOR_LOADINGS = {
  three: { shoot: 0.80 },
  midrange: { shoot: 0.75 },
  finishing: { athlete: 0.45, shoot: 0.30 },
  dunk: { athlete: 0.75 },
  speed: { athlete: 0.55, guard: 0.25 },
  handles: { guard: 0.75 },
  playmaking: { guard: 0.70 },
  perimeterD: { defense: 0.55, athlete: 0.25 },
  interiorD: { big: 0.60, defense: 0.40 },
  block: { big: 0.55, defense: 0.35 },
  rebounding: { big: 0.70 },
  post: { big: 0.65 },
};

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
  [22.0700, 0],
  [29.1360, 0.001],
  [33.1225, 0.01],
  [37.5506, 0.05],
  [40.2561, 0.1],
  [43.8050, 0.2],
  [46.5461, 0.3],
  [48.9933, 0.4],
  [51.3545, 0.5],
  [53.7900, 0.6],
  [56.4473, 0.7],
  [59.6175, 0.8],
  [64.1170, 0.9],
  [67.8695, 0.95],
  [72.0775, 0.98],
  [73.8520, 0.987],
  [77.5034, 0.995],
  [82.5105, 0.999],
  [83.0692, 0.9992],
  [87.2036, 0.99985],
  [88.2395, 0.9999],
  [92.6130, 0.99999],
  [98.8430, 1],
];

// Build tier, as percentiles of POTENTIAL.
//
// This used to score how far the twelve attributes strayed from what the height
// expected — which is the soul of the roll, but as a headline it read wrong: a
// short player with freak numbers for his size came out "Legendary" while his
// overall sat in the 50s. Legendary has to mean a legendary player. The
// per-attribute tiers still measure surprise against height; this one measures
// the player.
export const BUILD_TIER_CUTS = [
  [0.9997, 'Mythic'],
  [0.997, 'Legendary'],
  [0.98, 'Elite'],
  [0.9, 'Rare'],
  [0.7, 'Uncommon'],
  [0, 'Common'],
];

export const DRAFT_CUTOFF = 62; // scout hype below this goes undrafted
export const SCOUT_NOISE = 6.5;

// Empirical quantiles of scout hype (= overall + gauss(0, SCOUT_NOISE)), so a
// draft pick can be a rank inside the class rather than an absolute number.
// Hype carries variance the overall anchors do not describe, which is why this
// cannot be derived from OVERALL_ANCHORS. Emitted by `npm run sim -- --calibrate`.
export const HYPE_QUANTILES = [
  [-3.4648, 0],
  [28.5447, 0.1],
  [38.4601, 0.3],
  [46.1087, 0.5],
  [55.7118, 0.7],
  [61.6845, 0.8],
  [64.9803, 0.85],
  [68.7515, 0.9],
  [71.4655, 0.93],
  [73.6925, 0.95],
  [75.0343, 0.96],
  [76.6470, 0.97],
  [78.7602, 0.98],
  [80.1178, 0.985],
  [81.9512, 0.99],
  [84.7726, 0.995],
  [88.0201, 0.998],
  [90.2542, 0.999],
  [92.2493, 0.9995],
  [96.6102, 0.9999],
  [107.2623, 1],
];

// ---------------------------------------------------------------------------
// Recruiting cuts (Hoop Life)
//
// Both tables are MEASURED percentiles of the recruit-score distribution at
// graduation, emitted by `npm run sim -- --recruit`. They are not round
// numbers and they must not be guessed: the first pass keyed star ratings off
// raw hype thresholds and put 31.5% of every graduating class at five stars,
// with 18% holding a blue-blood offer.
//
// Targets: 5-star ~2%, 4-star ~8%, 3-star ~21%, 2-star ~32%, 1-star the rest.
// Offers: blue blood top ~3%, high major top ~12%, mid major top ~34%,
// small school top ~68%.
// ---------------------------------------------------------------------------
export const STAR_CUTS = [46.8, 56.1, 62.7, 68.2]; // >= these read as 2, 3, 4, 5 stars

export const RECRUIT_CUTS = {
  blueBlood: 67.1,
  highMajor: 61.9,
  midMajor: 55.3,
  smallSchool: 44.7,
};
