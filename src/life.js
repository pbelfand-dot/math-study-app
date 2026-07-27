// HOOP LIFE — the year-by-year engine.
//
// The roll engine still does what it always did, but it now describes GENETICS:
// the height you will finish at and the ceiling on every attribute. At fourteen
// you are nowhere near either. What you do with the next four to eight years
// decides how close you get, and whether anyone offers you anything at the end.
//
// The path is high school (14-18), then college (18-22) with the option to
// declare early, then the pro engine. Everything here is deliberately
// survivable-but-losable: you can be cut, you can fail out on grades, you can
// blow a knee, and none of those are dead ends on their own.

import { SKILL_KEYS, SKILLS, RECRUIT_CUTS, STAR_CUTS, DRAFT_CUTOFF } from './constants.js';
import { clamp } from './roll.js';
import { potentialFor, draftOverallFor } from './overall.js';
import { defaultRng } from './rng.js';

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

// Stage descriptors. The year loop is one function; what changes between high
// school and college is how many slots you get, what you can spend them on, and
// how hard it is to get on the floor.
export const STAGES = {
  highschool: { slots: 3, endAge: GRAD_AGE, label: 'High school' },
  college: { slots: 4, endAge: DRAFT_AGE_CAP, label: 'College' },
};
export const slotsFor = (life) => STAGES[life.stage]?.slots ?? 3;

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
  // Fraction of adolescent growth completed by each age.
  const done = { 14: 0, 15: 0.34, 16: 0.63, 17: 0.86, 18: 1 }[Math.min(age, 18)] ?? 1;
  return Math.round(life.startHeight + remaining * done + (life.spurtBonus[age] || 0));
}

// ---------------------------------------------------------------------------
// Training. Heavy management: every slot has a real cost, and the list you can
// spend on changes when you leave high school. AAU stops existing; agents,
// endorsement money and a media apparatus start.
// ---------------------------------------------------------------------------
const BOTH = ['highschool', 'college'];

export const TRAINING = [
  { id: 'weights', name: 'Weight room', blurb: 'Strength and explosion.', stages: BOTH,
    attrs: { dunk: 1.0, finishing: 0.6, interiorD: 0.5, rebounding: 0.5 },
    energy: -18, health: -4, cost: 0 },
  { id: 'shooting', name: 'Shooting coach', blurb: 'Reps on the jumper.', stages: BOTH,
    attrs: { three: 1.0, midrange: 0.9 }, energy: -10, cost: 600 },
  { id: 'handles', name: 'Skills trainer', blurb: 'Handle and creation.', stages: BOTH,
    attrs: { handles: 1.0, playmaking: 0.8 }, energy: -12, cost: 700 },
  { id: 'speed', name: 'Speed & agility', blurb: 'First step and lateral slides.', stages: BOTH,
    attrs: { speed: 1.0, perimeterD: 0.6 }, energy: -16, health: -3, cost: 450 },
  { id: 'post', name: 'Post work', blurb: 'Footwork on the block.', stages: BOTH,
    attrs: { post: 1.0, interiorD: 0.5, block: 0.4 }, energy: -12, cost: 300 },
  { id: 'film', name: 'Film study', blurb: 'Reads, not reps.', stages: BOTH,
    attrs: {}, mentals: { bballIQ: 2.2 }, energy: -4, cost: 0 },
  { id: 'conditioning', name: 'Conditioning', blurb: 'Lungs and durability.', stages: BOTH,
    attrs: {}, physicals: { stamina: 2.4, durability: 1.4 }, energy: -14, cost: 0 },
  { id: 'rest', name: 'Rest & recover', blurb: 'Nothing heroic. It works.', stages: BOTH,
    attrs: {}, health: 16, energy: 30, cost: 0 },

  // High school only.
  { id: 'school', name: 'Hit the books', blurb: 'Eligibility is not optional.', stages: ['highschool'],
    attrs: {}, grades: 14, energy: -8, cost: 0 },
  { id: 'aau', name: 'AAU circuit', blurb: 'Play in front of everyone.', stages: ['highschool'],
    attrs: {}, hype: 15, energy: -20, health: -5, cost: 1100, exposure: true },
  { id: 'camp', name: 'Elite camp', blurb: 'One weekend, every scout there.', stages: ['highschool'],
    attrs: {}, hype: 20, energy: -8, cost: 1700, exposure: true, gated: 45 },
  { id: 'job', name: 'Part-time job', blurb: 'Somebody has to pay for the camps.', stages: ['highschool'],
    attrs: {}, money: 2400, energy: -16, grades: -6, cost: 0 },

  // College only.
  { id: 'strength', name: 'Program S&C staff', blurb: 'Real facilities, for once.', stages: ['college'],
    attrs: { dunk: 0.7, finishing: 0.5, interiorD: 0.4, rebounding: 0.4, speed: 0.4 },
    physicals: { durability: 1.8, stamina: 1.8 }, energy: -16, cost: 0 },
  { id: 'devcoach', name: 'Player development', blurb: 'The staff works your three worst things.', stages: ['college'],
    attrs: {}, weakest: 3, energy: -12, cost: 0 },
  { id: 'classes', name: 'Go to class', blurb: 'Ineligible players do not get drafted.', stages: ['college'],
    attrs: {}, grades: 16, energy: -8, cost: 0 },
  { id: 'media', name: 'Media training', blurb: 'Say the right thing, on camera.', stages: ['college'],
    attrs: {}, rep: 12, hype: 4, energy: -4, cost: 400 },
  { id: 'nil', name: 'Sign an NIL deal', blurb: 'A local dealership wants your face on it.', stages: ['college'],
    attrs: {}, nil: true, hype: 5, energy: -6, cost: 0, gated: 55 },
  { id: 'agent', name: 'Hire an agency', blurb: 'They will run your pre-draft process.', stages: ['college'],
    attrs: {}, rep: 9, stock: 5, energy: -2, cost: 3500 },
  { id: 'summer', name: 'Pro-day circuit', blurb: 'Workouts in front of front offices.', stages: ['college'],
    attrs: {}, hype: 12, stock: 4, energy: -14, cost: 900, exposure: true },
];

export const trainingById = (id) => TRAINING.find((t) => t.id === id);
export const trainingFor = (life) => TRAINING.filter((t) => t.stages.includes(life.stage));

// Where you started. Exposure costs money — AAU and camps are what put you in
// front of anyone — so who your family is quietly gates the whole recruiting
// path. It can be beaten with a job and a slot, which is the point: it is a
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
  // Fourteen-year-olds are 6-11 inches short of where they finish.
  const startHeight = adultHeight - clamp(Math.round(rng.gauss(7.5, 2.2)), 3, 12);

  // A spurt lands in one of the middle years, and it is worth real inches.
  const spurtBonus = {};
  if (rng.chance(0.55)) {
    const at = 15 + rng.int(3);
    spurtBonus[at] = 1 + rng.int(3);
  }

  // Current ability starts well short of the genetic ceiling.
  const attrs = {};
  for (const k of SKILL_KEYS) {
    attrs[k] = clamp(Math.round(build.skills[k] * (0.42 + rng.random() * 0.14)), 20, 99);
  }

  return {
    name,
    age: START_AGE,
    stage: 'highschool',
    build, // genetics: ceilings, archetype, mentality, hidden mentals
    adultHeight,
    startHeight,
    spurtBonus,
    attrs,
    physicals: { ...build.physicals },
    mentals: { ...build.mentals },
    meters: {
      health: 88 + rng.int(10),
      energy: 100,
      hype: 4 + rng.int(6),
      grades: 58 + rng.int(24),
      chemistry: 55 + rng.int(20),
      rep: 48 + rng.int(8),
    },
    background,
    money: background.start + rng.int(400),
    program: null,
    stock: 0, // pre-draft process: workouts, interviews, agency
    teamRole: 'JV bench',
    minutes: 0,
    seasonStats: null,
    history: [],
    log: [],
    offers: [],
    // The stage is WHERE HE IS; the pending decision is a separate field. They
    // were one field, and because the end of every college year set the stage
    // to 'declare', the next year was then played under the high-school rules —
    // wrong minutes bar, no program exposure, no draft stock.
    pending: null,
    cut: false,
    ineligible: false,
    over: false,
  };
}

// Current overall on the 2K-ish scale, from present ability at present height.
export function overallNow(life) {
  const h = heightAt(life);
  let sum = 0;
  let n = 0;
  for (const k of SKILL_KEYS) {
    // Weight by how much that skill matters at this height.
    const w = Math.abs(SKILLS[k].growth) > 1.5 ? 1.3 : 1;
    sum += life.attrs[k] * w;
    n += w;
  }
  const base = sum / n;
  // Scaled so a teenager reads on the same 2K-ish scale the pro game uses: a
  // weak freshman around 25, a stud freshman in the 40s, a developed senior in
  // the 70s. The first pass multiplied down instead of up and produced
  // fourteen-year-olds rated 16, who were then cut for it.
  return clamp(Math.round(base * 1.15 + (h - 72) * 0.7 + life.mentals.bballIQ * 0.05), 10, 99);
}

// What the ranking services are actually reacting to: production, at a level
// they can see. Hype alone let anyone who bought enough camps into the top
// hundred; ability alone ignored that nobody has heard of you.
export function recruitScore(life) {
  return overallNow(life) * 0.58 + life.meters.hype * 0.42;
}

// Star rating is a RANK, not a score — five-stars are the couple-dozen best
// players in a country, so the cuts are measured percentiles of the recruit
// population, not round numbers. Keying it straight off hype put a third of
// every graduating class at five stars.
export function starRating(life) {
  const s = recruitScore(life);
  for (let i = STAR_CUTS.length - 1; i >= 0; i--) if (s >= STAR_CUTS[i]) return i + 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Events. Written to fire off the state rather than at random, so they read as
// consequences of how the year was actually spent.
// ---------------------------------------------------------------------------
function rollEvents(life, plan, rng, out) {
  const m = life.meters;
  const trained = new Set(plan);
  const college = life.stage === 'college';

  if (life.spurtBonus[life.age]) {
    out.push({ kind: 'good', text: `Growth spurt — ${life.spurtBonus[life.age]}" over the summer. Nothing fits.` });
  }
  if (m.energy < 25 && rng.chance(0.45)) {
    out.push({ kind: 'bad', text: 'Ran yourself into the ground. Everything hurts and none of it is helping.' });
    m.health = clamp(m.health - 10, 0, 100);
  }
  if (m.grades < 40) {
    out.push({ kind: 'bad', text: `Grades at ${Math.round(m.grades)}. The ${college ? 'compliance office' : 'AD'} has started using the word "ineligible".` });
    if (m.grades < 28) {
      life.ineligible = true;
      out.push({ kind: 'bad', text: 'Academically ineligible. You sit the season out.' });
    }
  }
  if (trained.has('aau') && rng.chance(0.30)) {
    out.push({ kind: 'good', text: 'A clip from the circuit gets picked up. Your phone does not stop.' });
    m.hype = clamp(m.hype + 7, 0, 100);
  }
  if (m.chemistry < 30 && rng.chance(0.4)) {
    out.push({ kind: 'bad', text: 'The coach and you are not speaking. Minutes suffer.' });
    life.minutes = Math.max(0, life.minutes - 6);
  }
  // Injury risk rises with low health and heavy load.
  const injRisk = clamp(0.06 + (70 - m.health) / 280 + (trained.has('weights') ? 0.03 : 0), 0.02, 0.5);
  if (rng.chance(injRisk)) {
    const bad = rng.chance(0.22);
    if (bad) {
      out.push({ kind: 'bad', text: 'Torn something in the knee. Surgery, then a year of rebuilding.' });
      m.health = clamp(m.health - 30, 0, 100);
      life.attrs.speed = clamp(life.attrs.speed - 4, 20, 99);
      life.attrs.dunk = clamp(life.attrs.dunk - 4, 20, 99);
      life.stock = clamp(life.stock - 8, -40, 40);
    } else {
      out.push({ kind: 'bad', text: 'Rolled an ankle. Missed a chunk of the season.' });
      m.health = clamp(m.health - 10, 0, 100);
    }
  }
  if (!college && m.hype > 70 && rng.chance(0.25)) {
    out.push({ kind: 'good', text: 'Letters are arriving from schools you have only seen on television.' });
  }

  // The media layer. Reputation is separate from hype on purpose: hype is how
  // many people know your name, reputation is what they say after it. One sells
  // shoes, the other decides whether a front office spends a lottery pick.
  if (college) {
    if (m.hype > 55 && m.rep < 42 && rng.chance(0.28)) {
      out.push({ kind: 'bad', text: 'A sideline blow-up runs on every highlight show. Scouts start asking about your character.' });
      m.rep = clamp(m.rep - 8, 0, 100);
      life.stock = clamp(life.stock - 6, -40, 40);
    }
    if (m.rep > 72 && rng.chance(0.30)) {
      out.push({ kind: 'good', text: 'You handle a bad loss well on camera. Two front offices note it.' });
      life.stock = clamp(life.stock + 4, -40, 40);
    }
    if (trained.has('nil')) {
      // Endorsement money is not linear in fame — it is close to nothing until
      // people outside your own conference know who you are, and then it moves
      // fast. Linear in hype paid a player nobody was scouting $400,000.
      const reach = (m.hype / 100) ** 2;
      const deal = Math.round((500 + 26000 * reach * (0.55 + m.rep / 150)) * (0.6 + rng.random() * 0.8));
      life.money += deal;
      out.push({ kind: 'good', text: `NIL deal signed — ${'$' + deal.toLocaleString()}.` });
    }
    if (trained.has('summer') && rng.chance(0.35)) {
      out.push({ kind: 'good', text: 'You tested well at a workout. Somebody moved you up a board.' });
      life.stock = clamp(life.stock + 5, -40, 40);
    }
  }
}

// ---------------------------------------------------------------------------
// Play one year
// ---------------------------------------------------------------------------
export function advanceYear(life, plan, rng = defaultRng) {
  const out = [];
  // The grade he is playing AS, captured before the birthday below — otherwise
  // the freshman season gets filed under sophomore year.
  const stageAtStart = life.stage;
  const playedGrade = gradeName(life.age, stageAtStart);
  const college = stageAtStart === 'college';
  const m = life.meters;
  const we = life.mentals.workEthic;
  const prog = life.program;

  // A college program's development staff is the single biggest reason to pick
  // one school over another, so it multiplies everything training does.
  const devMult = college ? prog.development : 1;

  // 1. Apply the training plan.
  const rate = 0.34 * (0.55 + we / 110) * devMult;
  const applyGain = (k, weight) => {
    const ceiling = life.build.skills[k];
    const room = ceiling - life.attrs[k];
    if (room > 0) life.attrs[k] = clamp(life.attrs[k] + room * rate * weight, 20, 99);
  };

  for (const id of plan) {
    const t = trainingById(id);
    if (!t) continue;
    if (t.cost > life.money) {
      out.push({ kind: 'bad', text: `Could not afford ${t.name}. The slot went to waste.` });
      continue;
    }
    life.money -= t.cost;

    // Gains close the gap to the genetic ceiling. Work ethic sets the rate, so
    // the hidden number you cannot see is quietly deciding your whole arc.
    for (const [k, weight] of Object.entries(t.attrs || {})) applyGain(k, weight);
    // The development staff picks for you: whatever you are worst at, relative
    // to what your body says you should be able to do.
    if (t.weakest) {
      const worst = [...SKILL_KEYS]
        .sort((a, b) => (life.build.skills[b] - life.attrs[b]) - (life.build.skills[a] - life.attrs[a]))
        .slice(0, t.weakest);
      for (const k of worst) applyGain(k, 0.9);
    }
    for (const [k, v] of Object.entries(t.physicals || {})) {
      life.physicals[k] = clamp(Math.round(life.physicals[k] + v), 10, 99);
    }
    for (const [k, v] of Object.entries(t.mentals || {})) {
      life.mentals[k] = clamp(Math.round(life.mentals[k] + v), 1, 99);
    }
    if (t.grades) m.grades = clamp(m.grades + t.grades, 0, 100);
    if (t.rep) m.rep = clamp(m.rep + t.rep, 0, 100);
    if (t.stock) life.stock = clamp(life.stock + t.stock, -40, 40);
    // Hype has diminishing returns: buying exposure gets you known, it does not
    // make you the best player in the country. Without this the same two slots
    // bought a five-star rating every time.
    if (t.hype) m.hype = clamp(m.hype + t.hype * (1 - m.hype / 118), 0, 100);
    if (t.health) m.health = clamp(m.health + t.health, 0, 100);
    if (t.money) life.money += t.money;
    m.energy = clamp(m.energy + (t.energy || 0), 0, 100);
  }

  // 2. Everyone drifts a little without being told to — you improve just by
  // being fifteen and playing, and less so every year after that.
  const drift = clamp(0.10 - (life.age - 14) * 0.006, 0.04, 0.10) * devMult;
  for (const k of SKILL_KEYS) {
    const room = life.build.skills[k] - life.attrs[k];
    if (room > 0) life.attrs[k] = clamp(life.attrs[k] + room * drift, 20, 99);
  }
  life.money += college ? Math.round(life.background.yearly * 0.4) : life.background.yearly;
  m.grades = clamp(m.grades - (college ? 8 : 6), 0, 100);
  m.energy = clamp(m.energy + 34, 0, 100);
  m.health = clamp(m.health + 6, 0, 100);

  // 3. Grow.
  const before = heightAt(life);
  life.age++;
  const after = heightAt(life);
  if (after > before && !life.spurtBonus[life.age]) {
    out.push({ kind: 'note', text: `Grew ${after - before}" — now ${Math.floor(after / 12)}'${after % 12}".` });
  }

  // 4. The season.
  const ovr = overallNow(life);
  // Judged against the room you are actually in. A freshman is supposed to be
  // worse than a senior, and a blue blood's bench is a mid-major's starter, so
  // the bar moves with both. Holding every year to one number made
  // fourteen-year-olds get cut for being fourteen.
  const bar = college
    ? prog.minutesBar - (life.age - 19) * 2
    : 25 + (life.age - 15) * 3;
  // The coach's trust is a real feedback loop — minutes buy chemistry and
  // chemistry buys minutes — but at a quarter-point per point it was worth a
  // dozen rating points on its own and turned every started season into a star
  // one.
  const roleScore = ovr + (m.chemistry - 50) * 0.16 - (life.ineligible ? 100 : 0);
  // A shallow slope on purpose. At 1.5 minutes per point of rating the whole
  // range from benchwarmer to star was fourteen points wide, and three quarters
  // of every high-school season came back "Star".
  life.minutes = clamp(Math.round((roleScore - bar) * 1.2), 0, college ? 34 : 32);

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
      text: college
        ? 'You never got off the bench. A wasted year.'
        : 'Cut. You are not on the roster this year.',
    });
    m.hype = clamp(m.hype - 8, 0, 100);
  } else {
    // Thresholds are per stage because the games are not the same length — 26
    // minutes is a workhorse starter in high school and a rotation piece in a
    // forty-minute college game.
    const [star, starter, rot] = college ? [30, 22, 12] : [28, 21, 12];
    life.teamRole =
      life.minutes >= star ? 'Star' : life.minutes >= starter ? 'Starter'
      : life.minutes >= rot ? 'Rotation' : 'Deep bench';
    const scoring = (life.attrs.three + life.attrs.midrange + life.attrs.finishing + life.attrs.dunk) / 4;
    const ppg = Math.max(0, (life.minutes * 0.42) * (0.5 + scoring / 110) + rng.gauss(0, 1.6));
    const rpg = Math.max(0, life.minutes * (life.attrs.rebounding / 900 + Math.max(0, after - 72) * 0.008));
    const apg = Math.max(0, life.minutes * (life.attrs.playmaking / 1100));
    life.seasonStats = {
      ppg: Math.round(ppg * 10) / 10,
      rpg: Math.round(rpg * 10) / 10,
      apg: Math.round(apg * 10) / 10,
      mpg: life.minutes,
    };
    // Production is what actually moves a ranking; exposure only amplifies it.
    // Diminishing returns again — the gap between the best player in the country
    // and the fiftieth is not something one good season closes.
    const produced = ppg * 1.5 + rpg * 0.8 + apg * 1.1;
    const exposure = college ? prog.exposure : 1;
    m.hype = clamp(m.hype + (produced * 0.30 * exposure) * (1 - m.hype / 112) - 3, 0, 100);
    m.chemistry = clamp(m.chemistry + (life.minutes > 20 ? 3 : -2), 0, 100);
    if (college) life.stock = clamp(life.stock + (produced - 26) * 0.22, -40, 40);
  }

  // 5. Events, then write the year into the log.
  rollEvents(life, plan, rng, out);

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

  // 6. What happens next.
  if (stageAtStart === 'highschool' && life.age >= GRAD_AGE) {
    life.offers = buildOffers(life, rng);
    life.pending = 'decision';
  } else if (college) {
    // Every college year after the first ends with the same question, and at
    // twenty-two it is answered for you.
    life.pending = life.age >= DRAFT_AGE_CAP ? 'forced' : 'declare';
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

export function buildOffers(life, rng = defaultRng) {
  const m = life.meters;
  const score = recruitScore(life) + (m.grades - 50) * 0.12;
  const offers = [];

  for (const p of PROGRAMS) {
    if (score < p.min) continue;
    if (m.grades < 35 && p.tier !== 'Small school') continue; // schools have standards
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
    tier: 'Other', school: 'Prep year / overseas', development: 1.02, minutesBar: 42, exposure: 0.45,
    note: 'Nobody offered. You go and make them wrong.',
  });

  // The other door: skip it entirely. Almost nobody should take this and get
  // away with it, which is exactly why it is on the menu.
  if (starRating(life) >= 4) {
    offers.push({
      tier: 'Turn pro', school: 'Declare out of high school', development: 1, minutesBar: 0, exposure: 1,
      pro: true,
      note: 'Eighteen years old and into the draft. No safety net, and four years of development you never got.',
    });
  }
  return offers;
}

export function commit(life, offer) {
  life.program = offer;
  life.stage = 'college';
  life.pending = null;
  life.teamRole = 'Freshman — unproven';
  life.minutes = 0;
  life.meters.chemistry = 50;
  life.offers = [];
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
export function proBuildFrom(life) {
  const declareAge = clamp(life.age, 18, 23);
  const runway = clamp((24 - declareAge) / 5, 0.2, 1);
  const share = clamp((0.30 + runway * 0.38) * (0.72 + life.mentals.workEthic / 130), 0.2, 0.88);

  const skills = Object.fromEntries(
    SKILL_KEYS.map((k) => {
      const now = life.attrs[k];
      const ceiling = life.build.skills[k];
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
  return b;
}

// A coarse, deliberately imprecise read on where he would go if he declared
// now. It is a projection and it is allowed to be wrong — the exact ceiling
// stays hidden, which is the whole point.
export function draftProjection(life) {
  const b = proBuildFrom(life);
  const hype = draftOverallFor(b) * 0.35 + potentialFor(b) * 0.65 + (life.build.scoutNoise ?? 0) * 2.5;
  if (hype >= DRAFT_CUTOFF + 16) return { label: 'Projected lottery pick', tone: 'good' };
  if (hype >= DRAFT_CUTOFF + 8) return { label: 'Projected first round', tone: 'good' };
  if (hype >= DRAFT_CUTOFF) return { label: 'Projected second round', tone: 'note' };
  if (hype >= DRAFT_CUTOFF - 7) return { label: 'On the fringe — could go undrafted', tone: 'note' };
  return { label: 'Nobody has you on a board', tone: 'bad' };
}
