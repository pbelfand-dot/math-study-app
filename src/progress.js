// Everything that persists between sessions: the vault of finished careers,
// achievements, and the daily-seed streak.
//
// localStorage only — there is no backend and no account. That means progress
// is per-browser and per-device, which is worth being honest about in the UI
// rather than letting someone lose a month of pulls to a cleared cache.

const KEY = 'hooper.progress.v1';
const HISTORY_CAP = 300;

export const todayStamp = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const blank = () => ({
  version: 1,
  builds: 0,
  legendaryPulls: 0,
  bestGrade: 0,
  streak: { last: null, count: 0, best: 0 },
  achievements: {},
  history: [],
});

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!raw || raw.version !== 1) return blank();
    return { ...blank(), ...raw, streak: { ...blank().streak, ...raw.streak } };
  } catch {
    return blank();
  }
}

export function save(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode or full quota — progress is a nicety, not the game */
  }
}

// ---------------------------------------------------------------------------
// Daily streak
// ---------------------------------------------------------------------------
const dayBefore = (stamp) => {
  const d = new Date(`${stamp}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return todayStamp(d);
};

// Called when a daily-seed career is completed. Same day twice does not
// double-count; a gap of two or more days resets to one.
export function bumpStreak(p, stamp = todayStamp()) {
  const s = p.streak;
  if (s.last === stamp) return p;
  s.count = s.last === dayBefore(stamp) ? s.count + 1 : 1;
  s.last = stamp;
  s.best = Math.max(s.best, s.count);
  return p;
}

// A streak is only alive if it was fed today or yesterday.
export function streakAlive(p, stamp = todayStamp()) {
  return p.streak.last === stamp || p.streak.last === dayBefore(stamp);
}

// ---------------------------------------------------------------------------
// Achievements
//
// Each takes the finished context and returns true the moment it is earned.
// Deliberately weighted toward things the roll teaches: chasing a stat against
// height, surviving the draft, and the failure diagnoses you cannot roll.
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS = [
  { id: 'first', name: 'First Whistle', hint: 'Finish a build', test: () => true },
  { id: 'drafted', name: 'Hear Your Name', hint: 'Get drafted', test: (c) => c.drafted },
  { id: 'lottery', name: 'Lottery Pick', hint: 'Go in the top 14', test: (c) => c.pick && c.pick <= 14 },
  { id: 'first-overall', name: 'First Overall', hint: 'Go number one', test: (c) => c.pick === 1 },
  { id: 'freak', name: 'Freak Gene', hint: 'Roll the 1-in-300 gene', test: (c, b) => !!b.freakGene },
  {
    id: 'chase',
    name: 'Defied His Height',
    hint: 'Roll 95+ in a stat your height says you cannot have',
    test: (c, b) =>
      Object.entries(b.skills).some(([k, v]) => v >= 95 && b.skillMeta[k].expectedNatural <= 55),
  },
  { id: 'legendary-arch', name: 'Handed Something', hint: 'Pull a Legendary archetype', test: (c, b) => b.archetype?.tier === 'Legendary' },
  { id: 'mythic', name: 'Mythic Build', hint: 'Roll a Mythic-tier build', test: (c) => c.rarity.name === 'Mythic' },
  { id: 'ninety', name: 'The Ninety Club', hint: 'Roll a build with a 90+ true ceiling', test: (c) => c.potential >= 90 },
  { id: 'franchise', name: 'Franchise Player', hint: 'Peak at 90 overall', test: (c) => c.peakRating >= 90 },
  { id: 'allstar', name: 'All-Star', hint: 'Make an all-star team', test: (c) => c.awards.allStars > 0 },
  { id: 'mvp', name: 'Most Valuable', hint: 'Win an MVP', test: (c) => c.awards.mvps > 0 },
  { id: 'ring', name: 'Ring', hint: 'Win a championship', test: (c) => c.awards.rings > 0 },
  { id: 'dynasty', name: 'Dynasty', hint: 'Win three championships', test: (c) => c.awards.rings >= 3 },
  { id: 'hof', name: 'Enshrined', hint: 'Make the Hall of Fame', test: (c) => c.hof },
  { id: 'ironman', name: 'Iron Man', hint: 'Play 15 seasons', test: (c) => c.seasons.length >= 15 },
  { id: 'maxed', name: 'Reached It', hint: 'Hit your true ceiling exactly', test: (c) => c.peakRating >= c.potential },
  { id: 'chucker', name: 'Diagnosed', hint: 'Become The Chucker or The Ghost', test: (c) => !!c.title.failure },
  { id: 'undrafted-hof', name: 'Told You So', hint: 'Go undrafted and still make the Hall', test: (c) => !c.drafted && c.hof },
  { id: 'streak7', name: 'Every Day', hint: 'Play the daily seed 7 days running', test: (c, b, p) => p.streak.count >= 7 },
];

// Returns the achievements newly unlocked by this career.
export function checkAchievements(p, career, build) {
  const won = [];
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id]) continue;
    let ok = false;
    try {
      ok = a.test(career, build, p);
    } catch {
      ok = false;
    }
    if (ok) {
      p.achievements[a.id] = Date.now();
      won.push(a);
    }
  }
  return won;
}

// ---------------------------------------------------------------------------
// The vault
// ---------------------------------------------------------------------------

// One number to rank careers by, so the vault can be sorted and a personal best
// means something. Weighted toward the things that are hard rather than long.
export function careerScore(c) {
  if (!c.madeLeague) return 0;
  return Math.round(
    c.awards.mvps * 55 +
      c.awards.rings * 28 +
      c.awards.allStars * 12 +
      c.awards.allLeague * 7 +
      (c.hof ? 60 : 0) +
      c.peakRating * 1.6 +
      c.seasons.length * 2 +
      c.careerAverages.points / 900,
  );
}

export function record(p, career, build, meta) {
  p.builds++;
  if (build.archetype?.tier === 'Legendary') p.legendaryPulls++;
  p.bestGrade = Math.max(p.bestGrade, meta.grade);
  p.history.unshift({
    at: Date.now(),
    daily: !!meta.daily,
    name: meta.name,
    pos: meta.pos,
    height: meta.height,
    title: meta.title,
    tier: career.rarity.name,
    draftOvr: career.draftOvr,
    grade: meta.grade,
    ceiling: career.potential,
    peak: career.peakRating,
    pick: career.pick,
    seasons: career.seasons.length,
    allStars: career.awards.allStars,
    mvps: career.awards.mvps,
    rings: career.awards.rings,
    hof: career.hof,
    score: careerScore(career),
  });
  if (p.history.length > HISTORY_CAP) p.history.length = HISTORY_CAP;
  return p;
}

export function bestCareers(p, n = 25) {
  return [...p.history].sort((a, b) => b.score - a.score).slice(0, n);
}

// ---------------------------------------------------------------------------
// Backup and restore
//
// iOS can clear a site's stored data. Home-screen apps are exempt from the
// aggressive seven-day rule, but "exempt in normal conditions" is not a promise
// worth staking a month of pulls on, and there is no server to fall back to.
// Making progress exportable turns an unrecoverable loss into an inconvenience.
// ---------------------------------------------------------------------------
// The `app` tag and the localStorage key both stay at their original values.
// The game was renamed; a backup someone exported before the rename was not,
// and breaking those to match a title would lose real progress for nothing.
export function exportProgress(p) {
  return JSON.stringify({ app: 'build-a-hooper', exported: new Date().toISOString(), data: p });
}

// Returns { ok, progress, error }. Never throws and never partially applies —
// a bad paste has to leave existing progress untouched.
export function importProgress(text) {
  let parsed;
  try {
    parsed = JSON.parse(String(text).trim());
  } catch {
    return { ok: false, error: 'That is not valid backup text.' };
  }
  const d = parsed && parsed.app === 'build-a-hooper' ? parsed.data : parsed;
  if (!d || typeof d !== 'object' || typeof d.builds !== 'number' || !Array.isArray(d.history)) {
    return { ok: false, error: 'That does not look like a Hoop Life backup.' };
  }
  const merged = { ...blank(), ...d, streak: { ...blank().streak, ...(d.streak || {}) } };
  merged.version = 1;
  if (merged.history.length > HISTORY_CAP) merged.history.length = HISTORY_CAP;
  return { ok: true, progress: merged };
}

// ---------------------------------------------------------------------------
// The life in progress
//
// Kept separate from the vault: the vault is a record of finished careers, this
// is one live object that gets overwritten constantly. Without it a phone
// dropping the tab from memory costs you eight years of decisions, which on a
// game built entirely out of decisions is the whole thing.
//
// Stored as-is. Everything in a life is plain data by construction — the engine
// takes the life and the rng as arguments rather than closing over either — so
// a round trip through JSON returns something the engine still accepts.
// ---------------------------------------------------------------------------
const LIFE_KEY = 'hooper.life.v1';

export function saveLife(life) {
  try {
    if (!life) localStorage.removeItem(LIFE_KEY);
    else localStorage.setItem(LIFE_KEY, JSON.stringify(life));
  } catch {
    /* private mode or full quota — the life is still playable in memory */
  }
}

export function loadLife() {
  try {
    const raw = JSON.parse(localStorage.getItem(LIFE_KEY));
    // Anything that fails these is from an older shape and is not worth
    // resurrecting halfway; a fresh life beats a broken one.
    if (!raw || typeof raw.age !== 'number' || !raw.build?.skills || !raw.attrs) return null;
    return raw;
  } catch {
    return null;
  }
}

// Bundled together under one exported name. The bundler flattens modules into a
// single scope, so `import * as P` has no namespace object to bind to and any
// `P.foo` becomes a ReferenceError in the built file while the dev server keeps
// working. Importing this object by its real name survives flattening.
export const Progress = {
  todayStamp, load, save, bumpStreak, streakAlive,
  ACHIEVEMENTS, checkAchievements, careerScore, record, bestCareers,
  exportProgress, importProgress, saveLife, loadLife,
};
