// HOOP LIFE — the year-by-year engine.
//
// The roll engine still does what it always did, but it now describes GENETICS:
// the height you will finish at and the ceiling on every attribute. At fourteen
// you are nowhere near either. What you do with the next four to eight years
// decides how close you get, and whether anyone offers you anything at the end.
//
// The path is high school (14-18), then college (18-22) with the option to
// declare early, then the pro engine.
//
// A year is a budget of TIME, not a list of slots. You spend it across four
// categories — the gym, school, the people around you, and everything else —
// and most of what you can spend it on is CONDITIONAL, so the menu is different
// for a benchwarmer with failing grades than for a five-star with an agent.
// Nothing here is separable: school raises smarts, smarts is what makes film
// study worth anything, film study raises basketball IQ, IQ raises your rating.
// Teammates who like you feed you the ball. A coach who does not trust you does
// not play you, and minutes are what recruiters see.

import { SKILL_KEYS, SKILLS, RECRUIT_CUTS, STAR_CUTS, DRAFT_CUTOFF } from './constants.js';
import { clamp } from './roll.js';
import { potentialFor, draftOverallFor } from './overall.js';
import { defaultRng } from './rng.js';
import { rollCast, newRoster, teamChemistry, coachTrust, driftRelationships, personIn } from './people.js';
import { rollYearEvents } from './events.js';
import { effectiveCeiling } from './actions.js';

export const START_AGE = 14;
export const GRAD_AGE = 18;
export const DRAFT_AGE_CAP = 22;

// The same age is a different year depending on which building you are in: an
// eighteen-year-old is either a graduating senior or a college freshman, so the
// grade has to be read off the stage and not the age alone.
const HS_GRADE = { 14: 'Freshman', 15: 'Sophomore', 16: 'Junior', 17: 'Senior' };
const COLLEGE_GRADE = { 18: 'Freshman', 19: 'Sophomore', 20: 'Junior', 21: 'Senior' };
export const gradeName = (age, stage = 'highschool') =>
  (stage === 'college' ? COLLEGE_GRADE : HS_GRADE)[age] || 'Senior';

// ---------------------------------------------------------------------------
// Growing up
//
// The rolled height is the ADULT height. A fourteen-year-old is some way short
// of it, and the last of that gap can arrive all at once — which is the whole
// point of a growth spurt, because every expected value in the game is keyed to
// height. Grow four inches and what the game expects of you changes underneath.
// ---------------------------------------------------------------------------
export function heightAt(life, age = life.age) {
  if (age >= 18) return life.adultHeight;
  const remaining = life.adultHeight - life.startHeight;
  const done = { 14: 0, 15: 0.34, 16: 0.63, 17: 0.86, 18: 1 }[Math.min(age, 18)] ?? 1;
  return Math.round(life.startHeight + remaining * done + (life.spurtBonus[age] || 0));
}

// Where you started. Exposure costs money — AAU and camps are what put you in
// front of anyone — so who your family is quietly gates the whole recruiting
// path. It can be beaten with a job and some time, which is the point: it is a
// disadvantage, not a wall.
export const BACKGROUNDS = [
  { id: 'struggling', name: 'Struggling', chance: 0.30, start: 250, yearly: 500,
    note: 'No money for camps. Everything has to be earned.' },
  { id: 'working', name: 'Working class', chance: 0.42, start: 900, yearly: 1500,
    note: 'They will find the money if it matters.' },
  { id: 'comfortable', name: 'Comfortable', chance: 0.22, start: 2400, yearly: 3200,
    note: 'Camps and trainers are not a problem.' },
  { id: 'wealthy', name: 'Wealthy', chance: 0.06, start: 6000, yearly: 7000,
    note: 'Money is never the reason you miss anything.' },
];

function rollBackground(rng) {
  const r = rng.random();
  let acc = 0;
  for (const b of BACKGROUNDS) { acc += b.chance; if (r < acc) return b; }
  return BACKGROUNDS[1];
}

// ---------------------------------------------------------------------------
// A new life
// ---------------------------------------------------------------------------
export function newLife(build, name, rng = defaultRng) {
  const background = rollBackground(rng);
  const adultHeight = build.height;
  const startHeight = adultHeight - clamp(Math.round(rng.gauss(7.5, 2.2)), 3, 12);

  const spurtBonus = {};
  if (rng.chance(0.55)) spurtBonus[15 + rng.int(3)] = 1 + rng.int(3);

  const attrs = {};
  for (const k of SKILL_KEYS) {
    attrs[k] = clamp(Math.round(build.skills[k] * (0.42 + rng.random() * 0.14)), 20, 99);
  }

  const life = {
    name,
    age: START_AGE,
    stage: 'highschool',
    pending: null,
    build, // genetics: ceilings, archetype, mentality, hidden mentals
    adultHeight,
    startHeight,
    spurtBonus,
    attrs,
    physicals: { ...build.physicals },
    mentals: { ...build.mentals },

    // The four bars.
    stats: {
      happiness: 60 + rng.int(20),
      health: 84 + rng.int(14),
      smarts: clamp(Math.round(rng.gauss(50, 17)), 8, 96),
    },
    // Basketball-specific, and reputation, which is separate from hype on
    // purpose: hype is how many people know your name, reputation is what they
    // say after it. One sells shoes, the other decides whether a front office
    // spends a lottery pick.
    meters: {
      hype: 4 + rng.int(6),
      rep: 48 + rng.int(8),
      grades: 55 + rng.int(26),
    },

    background,
    money: background.start + rng.int(400),
    nextPersonId: 0,
    people: [],

    // The hidden slider. Rolled once, never shown, and it multiplies everything
    // training does — two players who make identical decisions for eight years
    // do not arrive at the same place, and this is why. Revealed with the other
    // hidden numbers only after the career is over.
    talent: clamp(Math.round(rng.gauss(50, 18)), 5, 99),

    // The year in progress.
    strain: 0,
    doneThisYear: [],
    // Sessions spent on each attribute THIS YEAR. The fourth one is worth
    // nothing, so grinding a single number is self-limiting without needing a
    // rule that says so.
    trainCounts: {},
    gameForm: 0,
    gameLog: [],
    yearLog: [],
    seenEvents: [],
    choices: [],

    program: null,
    stock: 0, // pre-draft process: workouts, interviews, agency
    teamRole: 'JV bench',
    minutes: 0,
    lastMinutes: 0,
    lastStats: null,
    seasonStats: null,
    minutesPitch: false,
    wantsTransfer: false,
    injured: false,
    ineligible: false,
    history: [],
    log: [],
    offers: [],
  };
  life.people = rollCast(life, rng);
  return life;
}

// How many minutes he is going to get. Extracted because game day has to know
// whether he plays BEFORE the season resolves, and two copies of this formula
// would drift apart the first time either was touched.
//
// Judged against the room he is actually in — a freshman is supposed to be worse
// than a senior, and a blue blood's bench is a mid-major's starter, so the bar
// moves with both. The coach decides the minutes and the locker room decides
// what he does with them; both are people you chose whether or not to spend
// time on.
export function projectedMinutes(life) {
  const college = life.stage === 'college';
  const bar = college
    ? life.program.minutesBar - (life.age - 19) * 2
    : 25 + (life.age - 15) * 3;
  const roleScore =
    overallNow(life) +
    (coachTrust(life) - 50) * 0.18 +
    (teamChemistry(life) - 50) * 0.08 +
    (life.minutesPitch ? 3 : 0) -
    (life.ineligible ? 100 : 0) -
    (life.injured ? 14 : 0);
  return clamp(Math.round((roleScore - bar) * 1.2), 0, college ? 34 : 32);
}

// Current overall on the 2K-ish scale, from present ability at present height.
export function overallNow(life) {
  const h = heightAt(life);
  let sum = 0;
  let n = 0;
  for (const k of SKILL_KEYS) {
    const w = Math.abs(SKILLS[k].growth) > 1.5 ? 1.3 : 1;
    sum += life.attrs[k] * w;
    n += w;
  }
  const base = sum / n;
  return clamp(Math.round(base * 1.15 + (h - 72) * 0.7 + life.mentals.bballIQ * 0.05), 10, 99);
}

// What the ranking services are reacting to: production, at a level they can
// see. Hype alone let anyone who bought enough camps into the top hundred;
// ability alone ignored that nobody has heard of you.
export function recruitScore(life) {
  return overallNow(life) * 0.58 + life.meters.hype * 0.42;
}

// Star rating is a RANK, not a score — five-stars are the couple-dozen best
// players in a country, so the cuts are measured percentiles of the recruit
// population, not round numbers.
export function starRating(life) {
  const s = recruitScore(life);
  for (let i = STAR_CUTS.length - 1; i >= 0; i--) if (s >= STAR_CUTS[i]) return i + 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Events. Written to fire off state rather than at random, so they read as
// consequences of how the year was actually spent.
// ---------------------------------------------------------------------------
function rollEvents(life, rng, out) {
  const m = life.meters;
  const st = life.stats;
  const college = life.stage === 'college';

  if (life.spurtBonus[life.age]) {
    out.push({ kind: 'good', text: `Growth spurt — ${life.spurtBonus[life.age]}" over the summer. Nothing fits.` });
  }
  if (life.strain > 70 && rng.chance(0.5)) {
    out.push({ kind: 'bad', text: 'Ran yourself into the ground. Everything hurts and none of it is helping.' });
    st.health = clamp(st.health - 12, 0, 100);
  }
  if (st.happiness < 25 && rng.chance(0.45)) {
    out.push({ kind: 'bad', text: 'Stopped enjoying any of it. Turning up became the hard part.' });
    life.mentals.workEthic = clamp(life.mentals.workEthic - 3, 1, 99);
  }
  if (m.grades < 40) {
    out.push({
      kind: 'bad',
      text: `Grades at ${Math.round(m.grades)}. The ${college ? 'compliance office' : 'athletic director'} has started using the word "ineligible".`,
    });
    if (m.grades < 28) {
      life.ineligible = true;
      out.push({ kind: 'bad', text: 'Academically ineligible. You sit the season out.' });
    }
  }

  // Injury risk rises with accumulated strain and falls with health.
  const injRisk = clamp(0.05 + life.strain / 380 + (72 - st.health) / 340, 0.02, 0.45);
  if (rng.chance(injRisk)) {
    if (rng.chance(0.22)) {
      out.push({ kind: 'bad', text: 'Tore something in the knee. Surgery, then a year of rebuilding.' });
      st.health = clamp(st.health - 30, 0, 100);
      life.injured = true;
      life.attrs.speed = clamp(life.attrs.speed - 4, 20, 99);
      life.attrs.dunk = clamp(life.attrs.dunk - 4, 20, 99);
      life.stock = clamp(life.stock - 8, -40, 40);
    } else {
      out.push({ kind: 'bad', text: 'Rolled an ankle. Missed a chunk of the season.' });
      st.health = clamp(st.health - 10, 0, 100);
    }
  }

  const chem = teamChemistry(life);
  if (chem < 30 && rng.chance(0.45)) {
    out.push({ kind: 'bad', text: 'The locker room has decided about you. Nobody is looking for you on the break.' });
  } else if (chem > 74 && rng.chance(0.3)) {
    out.push({ kind: 'good', text: 'This group actually likes each other. It shows.' });
  }
  if (coachTrust(life) < 25 && rng.chance(0.4)) {
    out.push({ kind: 'bad', text: 'You and the coach are not speaking. That is not a fight you win.' });
  }

  if (!college && m.hype > 70 && rng.chance(0.25)) {
    out.push({ kind: 'good', text: 'Letters are arriving from schools you have only seen on television.' });
  }
  if (college) {
    if (m.hype > 55 && m.rep < 42 && rng.chance(0.26)) {
      out.push({ kind: 'bad', text: 'A sideline blow-up runs on every highlight show. Scouts start asking about your character.' });
      m.rep = clamp(m.rep - 8, 0, 100);
      life.stock = clamp(life.stock - 6, -40, 40);
    }
    if (m.rep > 72 && rng.chance(0.3)) {
      out.push({ kind: 'good', text: 'You handle a bad loss well on camera. Two front offices note it.' });
      life.stock = clamp(life.stock + 4, -40, 40);
    }
  }
}

// ---------------------------------------------------------------------------
// Play one year
//
// Everything the player chose has already been applied through doAction; this
// runs the consequences: drift, the body, the season, and the events.
// ---------------------------------------------------------------------------
export function advanceYear(life, rng = defaultRng) {
  const stageAtStart = life.stage;
  const playedGrade = gradeName(life.age, stageAtStart);
  const college = stageAtStart === 'college';
  const m = life.meters;
  const st = life.stats;
  const prog = life.program;
  const out = [...life.yearLog];

  // 1. Everyone drifts a little without being told to — you improve just by
  //    being fifteen and playing, and less so every year after that.
  const drift = clamp(0.052 - (life.age - 14) * 0.003, 0.02, 0.052) * (college ? prog.development : 1);
  for (const k of SKILL_KEYS) {
    const room = life.build.skills[k] - life.attrs[k];
    if (room > 0) life.attrs[k] = clamp(life.attrs[k] + room * drift, 20, 99);
  }
  // School pays back into basketball. A year of classes makes the film sessions
  // worth more, and the mind is the part of the game that never declines.
  life.mentals.bballIQ = clamp(
    Math.round(life.mentals.bballIQ + (st.smarts - 45) * 0.03 + 0.4),
    1, 99,
  );

  // 2. The body and the books both decay if left alone.
  life.money += college ? Math.round(life.background.yearly * 0.4) : life.background.yearly;
  m.grades = clamp(m.grades - (college ? 10 : 8), 0, 100);
  life.strain = Math.max(0, life.strain - 26);
  st.health = clamp(st.health + 5 - life.strain / 22, 0, 100);
  st.happiness = clamp(st.happiness - 4, 0, 100);

  // 3. Grow.
  const before = heightAt(life);
  life.age++;
  const after = heightAt(life);
  if (after > before && !life.spurtBonus[life.age]) {
    out.push({ kind: 'note', text: `Grew ${after - before}" — now ${Math.floor(after / 12)}'${after % 12}".` });
  }

  // 4. The season.
  const ovr = overallNow(life);
  const chem = teamChemistry(life);
  life.minutes = projectedMinutes(life);

  if (life.ineligible) {
    life.seasonStats = null;
    life.teamRole = 'Ineligible';
    out.push({ kind: 'bad', text: 'You did not play a minute this year.' });
    life.ineligible = false;
  } else if (life.minutes < 4) {
    life.seasonStats = null;
    life.teamRole = college ? 'Redshirted — buried on the bench' : 'Cut from the team';
    out.push({
      kind: 'bad',
      text: college ? 'You never got off the bench. A wasted year.' : 'Cut. You are not on the roster this year.',
    });
    m.hype = clamp(m.hype - 8, 0, 100);
  } else {
    const [star, starter, rot] = college ? [30, 22, 12] : [28, 21, 12];
    life.teamRole =
      life.minutes >= star ? 'Star' : life.minutes >= starter ? 'Starter'
      : life.minutes >= rot ? 'Rotation' : 'Deep bench';
    const scoring = (life.attrs.three + life.attrs.midrange + life.attrs.finishing + life.attrs.dunk) / 4;
    // Wide on purpose, and usage-weighted. Two problems with the old line: the
    // efficiency factor only ran from 0.77 to 1.14 across the entire attribute
    // range, and nothing accounted for the fact that better players get the
    // ball more. Between them, minutes decided your scoring and ability barely
    // did — a 57 overall and a 75 overall put up the same eleven points, so
    // PPG told you nothing about whether you were any good, and a genuinely
    // good player in a smaller role looked like a bad one.
    // How the five games you actually played went, as a number between -1 and
    // +1. Deliberately bounded: your rating and your minutes decide the size of
    // the season, and form moves you around inside it. A 99 finishing does not
    // turn ten points into twenty because you tapped well — it turns ten into
    // about twelve and a half, and tapping badly turns it into seven and a half.
    const form = clamp(life.gameForm ?? 0, -1, 1);
    const usage = clamp(0.75 + (ovr - 52) / 80, 0.6, 1.35);
    const ppg = Math.max(
      0,
      life.minutes * 0.42 * (0.25 + scoring / 70) * usage * (1 + form * 0.25) + rng.gauss(0, 1.4),
    );
    const rpg = Math.max(0, life.minutes * (life.attrs.rebounding / 900 + Math.max(0, after - 72) * 0.008) * (1 + form * 0.18));
    // A team that likes you passes to you. This is the assist line, and it is
    // the clearest place the locker room shows up in a box score.
    const apg = Math.max(0, life.minutes * (life.attrs.playmaking / 1100) * (0.6 + chem / 125) * (1 + form * 0.30));
    life.seasonStats = {
      ppg: Math.round(ppg * 10) / 10,
      rpg: Math.round(rpg * 10) / 10,
      apg: Math.round(apg * 10) / 10,
      mpg: life.minutes,
    };
    const produced = ppg * 1.5 + rpg * 0.8 + apg * 1.1;
    const exposure = college ? prog.exposure : 1;
    // Diminishing returns: the gap between the best player in the country and
    // the fiftieth is not something one good season closes.
    m.hype = clamp(m.hype + produced * 0.30 * exposure * (1 - m.hype / 112) - 3, 0, 100);
    st.happiness = clamp(st.happiness + (life.minutes > 20 ? 6 : 0), 0, 100);
    if (college) life.stock = clamp(life.stock + (produced - 26) * 0.22, -40, 40);
  }

  // 5. Events. The situational ones above are conditions of the simulation —
  //    ineligibility, injury, the locker room — and fire every year they apply.
  //    The table in events.js is the rest of a life happening to you.
  rollEvents(life, rng, out);
  const rolled = rollYearEvents(life, rng);
  out.push(...rolled.passive);
  life.choices = rolled.queue;
  driftRelationships(life, rng);

  const entry = {
    age: life.age,
    stage: stageAtStart,
    grade: playedGrade,
    school: college ? prog.school : null,
    height: after,
    ovr: overallNow(life),
    stars: starRating(life),
    role: life.teamRole,
    stats: life.seasonStats,
    events: out,
  };
  life.log.push(entry);
  life.history.push({ age: life.age, ovr: entry.ovr, hype: Math.round(m.hype) });

  // 6. Reset the year and decide what comes next.
  life.lastMinutes = life.minutes;
  life.lastStats = life.seasonStats;
  life.doneThisYear = [];
  life.trainCounts = {};
  life.gameForm = 0;
  life.gameLog = [];
  life.yearLog = [];
  life.minutesPitch = false;

  if (stageAtStart === 'highschool' && life.age >= GRAD_AGE) {
    life.offers = buildOffers(life, rng);
    life.pending = 'decision';
  } else if (college) {
    if (life.wantsTransfer && life.age < DRAFT_AGE_CAP) {
      life.wantsTransfer = false;
      life.offers = buildOffers(life, rng, { transfer: true });
      life.pending = 'transfer';
    } else {
      // Every college year after the first ends with the same question, and at
      // twenty-two it is answered for you.
      life.pending = life.age >= DRAFT_AGE_CAP ? 'forced' : 'declare';
    }
  }
  return entry;
}

// ---------------------------------------------------------------------------
// Recruiting
//
// Offers key off exposure AND production AND grades. A five-star with failing
// grades gets prep-school offers; a two-star who can actually play gets small
// schools willing to take a chance.
//
// The `min` values are measured percentiles of the recruit-score distribution,
// not round numbers — before they were measured, eighteen percent of every
// class was getting a blue-blood offer.
// ---------------------------------------------------------------------------
const PROGRAMS = [
  { tier: 'Blue blood', names: ['Kingsmere', 'Ashford State', 'Vance University'],
    min: RECRUIT_CUTS.blueBlood, dev: 1.30, minutesBar: 54, exposure: 1.6,
    note: 'You would be the fourth-best player in your own recruiting class.' },
  { tier: 'High major', names: ['Northgate A&M', 'Loomis Tech', 'St. Brannon'],
    min: RECRUIT_CUTS.highMajor, dev: 1.18, minutesBar: 49, exposure: 1.25,
    note: 'You will have to earn it, but the staff develops people.' },
  { tier: 'Mid major', names: ['Cedar Falls', 'Harlow College', 'Pinehurst'],
    min: RECRUIT_CUTS.midMajor, dev: 1.05, minutesBar: 44, exposure: 0.85,
    note: 'A real role as a freshman, and the ball in your hands.' },
  { tier: 'Small school', names: ['Delta Poly', 'Ironwood College', 'Junction State'],
    min: RECRUIT_CUTS.smallSchool, dev: 0.92, minutesBar: 38, exposure: 0.5,
    note: 'They promise the ball from day one. Nobody is watching.' },
];

export function buildOffers(life, rng = defaultRng, { transfer = false } = {}) {
  const m = life.meters;
  const score = recruitScore(life) + (m.grades - 50) * 0.12;
  const offers = [];

  for (const p of PROGRAMS) {
    if (score < p.min) continue;
    if (m.grades < 35 && p.tier !== 'Small school') continue; // schools have standards
    if (transfer && life.program && p.tier === life.program.tier && rng.chance(0.5)) continue;
    offers.push({
      tier: p.tier,
      school: rng.pick(p.names),
      development: p.dev,
      minutesBar: p.minutesBar,
      exposure: p.exposure,
      note: p.note,
    });
  }

  // There is always somewhere to go, even if nobody wanted you.
  offers.push({
    tier: 'Other',
    school: transfer ? 'Drop down a level' : 'Prep year / overseas',
    development: 1.02, minutesBar: transfer ? 34 : 42, exposure: 0.45,
    note: transfer ? 'Somewhere you will definitely play.' : 'Nobody offered. You go and make them wrong.',
  });

  // The other door: skip it entirely. Almost nobody should take this and get
  // away with it, which is exactly why it is on the menu.
  if (!transfer && starRating(life) >= 4) {
    offers.push({
      tier: 'Turn pro', school: 'Declare out of high school', development: 1, minutesBar: 0, exposure: 1,
      pro: true,
      note: 'Eighteen years old and into the draft. No safety net, and four years of development you never got.',
    });
  }
  return offers;
}

export function commit(life, offer, rng = defaultRng) {
  life.program = offer;
  life.stage = 'college';
  life.pending = null;
  life.teamRole = 'Freshman — unproven';
  life.minutes = 0;
  life.offers = [];
  // A new school is a new locker room. That is the cost of transferring, and
  // the reason a good one is worth staying in.
  life.people = newRoster(life, rng);
  return life;
}

// Leave school. Everything after this belongs to the pro engine.
export function declare(life) {
  life.stage = 'pro';
  life.pending = null;
  return life;
}

// Stay another year. The only thing it clears is the question.
export function returnToSchool(life) {
  life.pending = null;
  return life;
}

// ---------------------------------------------------------------------------
// The handoff to the pro engine
//
// The build the draft sees is neither raw genetics (which would make school
// pointless) nor present ability (which would make everyone a bust): it is
// where this path projects him to top out.
//
// The share of the remaining genetic gap that pro development closes is larger
// the younger he declares, because a nineteen-year-old has more years of it
// ahead than a twenty-two-year-old who is close to finished. That is the real
// trade: stay and bank ability, or leave early and sell the runway.
// ---------------------------------------------------------------------------
// What you have actually DONE, against what your rating says you should have
// done, at the level you did it. Zero is exactly as expected; +1 is a player
// whose tape is better than his measurements.
//
// This exists because the draft could not see production at all. A player could
// average fifteen a game and go undrafted while a quieter one with a better
// hidden composite went in the second round, and from the outside that reads as
// the game ignoring everything you did.
export function productionScore(life) {
  const seasons = life.log.filter((y) => y.stats).slice(-2);
  if (!seasons.length) return -0.35; // two years without a box score is its own signal
  const per =
    seasons.reduce((a, y) => a + y.stats.ppg + y.stats.rpg * 0.7 + y.stats.apg, 0) / seasons.length;
  // Numbers at a blue blood count for more than the same numbers nobody saw.
  const level = Math.sqrt(life.program?.exposure ?? 0.8);
  const expected = 11 + (overallNow(life) - 55) * 0.32;
  return clamp((per * level - expected) / 11, -1, 1);
}

export function proBuildFrom(life) {
  const declareAge = clamp(life.age, 18, 23);
  const runway = clamp((24 - declareAge) / 5, 0.2, 1);
  const share = clamp((0.30 + runway * 0.38) * (0.72 + life.mentals.workEthic / 130), 0.2, 0.88);

  const skills = Object.fromEntries(
    SKILL_KEYS.map((k) => {
      const now = life.attrs[k];
      // The soft ceiling, not the rolled one. A player who has already trained
      // past his genetics keeps every point of it, and still has somewhere to
      // go in the pro years.
      const ceiling = effectiveCeiling(life, k);
      return [k, clamp(Math.round(now + Math.max(0, ceiling - now) * share), 25, 99)];
    }),
  );

  const b = {
    ...life.build,
    height: life.adultHeight,
    skills,
    physicals: { ...life.physicals },
    mentals: { ...life.mentals },
    draftAge: declareAge,
  };
  // What the scouts actually saw. Exposure, the pre-draft process and how you
  // came across all move the draft, not the player.
  b.rawness =
    (life.build.rawness ?? 0) -
    (life.meters.hype - 50) * 0.035 -
    (life.meters.rep - 50) * 0.03 -
    life.stock * 0.12;
  // Attached rather than folded in, so the draft can weigh it separately and
  // the raw-build harness (which has no seasons) is unaffected.
  b.production = productionScore(life);
  return b;
}

// A coarse, deliberately imprecise read on where he would go if he declared
// now, AND what is holding him back.
//
// The diagnosis is the important half. Before it existed the screen said
// "Nobody has you on a board" and stopped, so a player could go a whole life
// without ever learning that the thing costing him the draft was minutes, or
// grades, or a coach who had stopped picking him — and reasonably conclude the
// game was ignoring everything he did.
export function draftProjection(life) {
  const b = proBuildFrom(life);
  const ovr = overallNow(life);
  const prod = b.production ?? 0;
  const hype =
    draftOverallFor(b) * 0.35 + potentialFor(b) * 0.65 + prod * 9 +
    (life.build.scoutNoise ?? 0) * 2.5;

  const gaps = [];
  if (ovr < 62) gaps.push({ k: 'Ability', why: 'You are not good enough yet. The gym is the only fix.' });
  if (life.lastMinutes < 18) gaps.push({ k: 'Minutes', why: 'You are not on the floor enough for anyone to judge. Coach trust decides that.' });
  if (prod < -0.05) gaps.push({ k: 'Production', why: 'Your numbers are behind what a player of your rating should put up.' });
  if (life.meters.hype < 45) gaps.push({ k: 'Exposure', why: 'Nobody has seen you. Camps, the circuit and highlights are what fix that.' });
  if (life.meters.grades < 45) gaps.push({ k: 'Eligibility', why: 'Your grades are a problem before your game is.' });
  if (life.stats.health < 55) gaps.push({ k: 'Health', why: 'Scouts do not spend picks on a body that keeps breaking.' });

  const band = (label, tone) => ({ label, tone, gaps, hype: Math.round(hype) });
  if (hype >= DRAFT_CUTOFF + 16) return band('Projected lottery pick', 'good');
  if (hype >= DRAFT_CUTOFF + 8) return band('Projected first round', 'good');
  if (hype >= DRAFT_CUTOFF) return band('Projected second round', 'note');
  if (hype >= DRAFT_CUTOFF - 7) return band('On the fringe — could go undrafted', 'note');
  return band('Nobody has you on a board', 'bad');
}
