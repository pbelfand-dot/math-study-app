// What you can do with a year.
//
// The old design put every option on one screen as a fixed list of slots, which
// made the whole game visible at a glance and therefore solvable at a glance.
// This replaces it with a time budget and a catalogue where most entries are
// CONDITIONAL: an action only appears when your situation calls for it. You do
// not see "Apologise to the coach" until you have a coach who is angry with
// you, or "Take a redshirt" until you are buried on a bench. Finding out that an
// option exists is part of the game, the same way it is in life.
//
// Four categories, matching the four buttons around the + in the UI.
//
// There is no time budget. Every action can be taken once a year and that is the
// only bookkeeping — an abstract "42% of the year" tax on each button turned
// every decision into arithmetic. What actually limits a year is the same set of
// things that limits a real one: money, a body that accumulates wear and then
// breaks, grades that decay while you are in the gym, and people who drift if
// you never turn up. Doing everything is allowed. It is just a good way to blow
// out a knee.

import { SKILL_KEYS, SKILLS } from './constants.js';
import { clamp } from './roll.js';
import { peopleIn, personIn, nudge, makePerson, teamChemistry } from './people.js';

export const CATEGORIES = [
  { id: 'train', name: 'Train', hint: 'The gym. Where the ability comes from.' },
  { id: 'school', name: 'School', hint: 'Eligibility, and the mind the game runs on.' },
  { id: 'people', name: 'People', hint: 'Everyone who decides something about you.' },
  { id: 'life', name: 'Life', hint: 'Money, health, exposure, and being a person.' },
];

// Named for its module. Every module's top level shares one scope once the
// bundler flattens them, so a generic private helper name is a landmine.
const cash = (n) => `$${Math.round(n).toLocaleString()}`;
const isCollege = (l) => l.stage === 'college';
const isHS = (l) => l.stage === 'highschool';

// How much of the remaining gap ONE session closes, before diminishing returns.
// Work ethic and the hidden talent slider both scale it, a trainer or a college
// staff multiplies it, and none of the three are things you can read off the
// screen while you are deciding.
export function trainRate(life, mult = 1) {
  return (
    0.155 *
    (0.55 + life.mentals.workEthic / 110) *
    (0.62 + (life.talent ?? 50) / 130) *
    (life.program?.development ?? 1) *
    (personIn(life, 'trainer') ? 1.22 : 1) *
    mult
  );
}

// The fourth session on the same attribute in the same year is worth nothing.
// This is what stops "train the same number every year" from being the whole
// game, and it is stated in the UI rather than left to be discovered.
export const REPEAT_FALLOFF = [1, 0.5, 0.2, 0];
export const sessionsLeft = (life, key) =>
  Math.max(0, REPEAT_FALLOFF.length - 1 - (life.trainCounts?.[key] || 0));
export const falloffFor = (life, key) =>
  REPEAT_FALLOFF[Math.min(life.trainCounts?.[key] || 0, REPEAT_FALLOFF.length - 1)];

// What a session would actually add, in attribute points, right now. Returned
// so the option can say so before it is taken instead of after.
export function previewGain(life, key, weight = 1, mult = 1) {
  const room = life.build.skills[key] - life.attrs[key];
  if (room <= 0) return 0;
  return room * trainRate(life, mult) * weight * falloffFor(life, key);
}

function trainSkills(life, weights, mult = 1) {
  const moved = [];
  for (const [k, w] of Object.entries(weights)) {
    const gain = previewGain(life, k, w, mult);
    life.trainCounts[k] = (life.trainCounts[k] || 0) + 1;
    if (gain <= 0) continue;
    life.attrs[k] = clamp(life.attrs[k] + gain, 20, 99);
    moved.push(k);
  }
  return moved;
}

const weakest = (life, n) =>
  [...SKILL_KEYS]
    .sort((a, b) => life.build.skills[b] - life.attrs[b] - (life.build.skills[a] - life.attrs[a]))
    .slice(0, n);

// ---------------------------------------------------------------------------
// The catalogue
//
// cost   — time, out of TIME_PER_YEAR
// price  — money, and the action is hidden rather than disabled when broke, so
//          "I cannot afford this" is something you notice rather than read
// show   — the condition that makes this option exist at all
// once   — cannot be repeated inside one year
// run    — mutates the life, returns a line for the year's log
// ---------------------------------------------------------------------------
export const ACTIONS = [
  // ---- TRAIN --------------------------------------------------------------
  {
    id: 'gym', cat: 'train', name: 'Weight room', blurb: 'Strength and explosion.',
    wear: 14, price: 0, trains: { dunk: 1, finishing: 0.6, interiorD: 0.5, rebounding: 0.5 },
    run: (l) => {
      trainSkills(l, { dunk: 1, finishing: 0.6, interiorD: 0.5, rebounding: 0.5 });
      l.physicals.durability = clamp(l.physicals.durability + 1, 10, 99);
      return { kind: 'note', text: 'Put in a winter in the weight room.' };
    },
  },
  {
    id: 'shoot', cat: 'train', name: 'Shooting reps', blurb: 'A thousand a day, alone.',
    wear: 6, price: 0, trains: { three: 1, midrange: 0.9 },
    run: (l) => {
      trainSkills(l, { three: 1, midrange: 0.9 });
      return { kind: 'note', text: 'Got up shots every morning before school.' };
    },
  },
  {
    id: 'skills', cat: 'train', name: 'Ball-handling work', blurb: 'Handle and creation.',
    wear: 7, price: 0, trains: { handles: 1, playmaking: 0.8 },
    run: (l) => {
      trainSkills(l, { handles: 1, playmaking: 0.8 });
      return { kind: 'note', text: 'Cones, tennis balls, two hours a night.' };
    },
  },
  {
    id: 'agility', cat: 'train', name: 'Speed & agility', blurb: 'First step, lateral slides.',
    wear: 12, price: 0, trains: { speed: 1, perimeterD: 0.6 },
    run: (l) => {
      trainSkills(l, { speed: 1, perimeterD: 0.6 });
      return { kind: 'note', text: 'Ran hills until it stopped being a punishment.' };
    },
  },
  {
    id: 'postwork', cat: 'train', name: 'Post footwork', blurb: 'Work on the block.',
    wear: 8, price: 0, trains: { post: 1, interiorD: 0.5, block: 0.4 },
    show: (l) => l.adultHeight >= 78 || l.attrs.post > 45,
    run: (l) => {
      trainSkills(l, { post: 1, interiorD: 0.5, block: 0.4 });
      return { kind: 'note', text: 'Learned to actually play with your back to the rim.' };
    },
  },
  {
    id: 'film', cat: 'train', name: 'Watch film', blurb: 'Reads, not reps.',
    price: 0,
    run: (l, rng) => {
      // Film is worth what you bring to it — this is where school pays back
      // into basketball, which is the whole reason smarts is a stat.
      const gain = 1.2 + (l.stats.smarts / 100) * 2.6;
      l.mentals.bballIQ = clamp(Math.round(l.mentals.bballIQ + gain), 1, 99);
      return {
        kind: 'note',
        text: l.stats.smarts > 70
          ? 'Broke down film and actually saw things in it.'
          : 'Sat through film. Some of it stuck.',
      };
    },
  },
  {
    id: 'trainer', cat: 'train', name: 'Hire a private trainer', blurb: 'Somebody whose job is you.',
    price: 2200,
    show: (l) => !personIn(l, 'trainer') && l.money >= 2200,
    run: (l, rng) => {
      l.people.push(makePerson(l, 'trainer', rng, { rel: 60 }));
      return { kind: 'good', text: 'Hired a private trainer. Everything in the gym counts for more now.' };
    },
  },
  {
    id: 'rehab', cat: 'train', name: 'Rehab the injury', blurb: 'Slowly, properly, this time.',
    price: 0,
    show: (l) => l.injured,
    run: (l) => {
      l.injured = false;
      l.stats.health = clamp(l.stats.health + 22, 0, 100);
      l.strain = Math.max(0, l.strain - 25);
      return { kind: 'good', text: 'Did the rehab properly. The knee feels like a knee again.' };
    },
  },
  {
    id: 'rest', cat: 'train', name: 'Take the summer off', blurb: 'Nothing heroic. It works.',
    price: 0,
    run: (l) => {
      l.strain = Math.max(0, l.strain - 34);
      l.stats.health = clamp(l.stats.health + 12, 0, 100);
      l.stats.happiness = clamp(l.stats.happiness + 10, 0, 100);
      return { kind: 'note', text: 'Rested. Came back feeling like a person.' };
    },
  },

  // ---- SCHOOL -------------------------------------------------------------
  {
    id: 'study', cat: 'school', name: 'Study', blurb: 'Books, actually opened.',
    price: 0,
    run: (l) => {
      l.meters.grades = clamp(l.meters.grades + 15, 0, 100);
      l.stats.smarts = clamp(l.stats.smarts + 2.2, 0, 100);
      l.stats.happiness = clamp(l.stats.happiness - 3, 0, 100);
      return { kind: 'note', text: 'Put real hours into schoolwork.' };
    },
  },
  {
    id: 'tutor', cat: 'school', name: 'Get a tutor', blurb: 'Because studying alone is not working.',
    price: 700,
    show: (l) => l.meters.grades < 62 && l.money >= 700,
    run: (l) => {
      l.meters.grades = clamp(l.meters.grades + 24, 0, 100);
      l.stats.smarts = clamp(l.stats.smarts + 3.4, 0, 100);
      return { kind: 'good', text: 'A tutor turned the grades around.' };
    },
  },
  {
    id: 'extracredit', cat: 'school', name: 'Beg for extra credit', blurb: 'It is late in the term.',
    price: 0,
    show: (l) => l.meters.grades < 48,
    run: (l, rng) => {
      if (rng.chance(0.55 + l.stats.smarts / 400)) {
        l.meters.grades = clamp(l.meters.grades + 16, 0, 100);
        return { kind: 'good', text: 'A teacher took pity and let you make up the work.' };
      }
      return { kind: 'bad', text: 'Asked for extra credit. Was told the deadline was the deadline.' };
    },
  },
  {
    id: 'skipclass', cat: 'school', name: 'Skip class', blurb: 'There are better uses of a Tuesday.',
    price: 0,
    run: (l) => {
      l.meters.grades = clamp(l.meters.grades - 16, 0, 100);
      l.stats.happiness = clamp(l.stats.happiness + 7, 0, 100);
      l.time += 12; // the whole point is that it buys time back
      return { kind: 'bad', text: 'Skipped enough class that somebody noticed.' };
    },
  },
  {
    id: 'academics', cat: 'school', name: 'Meet with academic support', blurb: 'Compliance is asking.',
    price: 0,
    show: (l) => isCollege(l) && l.meters.grades < 55,
    run: (l) => {
      l.meters.grades = clamp(l.meters.grades + 20, 0, 100);
      return { kind: 'good', text: 'Academic support got you back on track. Barely.' };
    },
  },
  {
    id: 'sat', cat: 'school', name: 'Prep for the entrance exam', blurb: 'Schools have minimums.',
    price: 0,
    show: (l) => isHS(l) && l.age >= 16,
    run: (l) => {
      l.stats.smarts = clamp(l.stats.smarts + 4, 0, 100);
      l.meters.grades = clamp(l.meters.grades + 8, 0, 100);
      return { kind: 'note', text: 'Ground through test prep.' };
    },
  },

  // ---- LIFE ---------------------------------------------------------------
  {
    id: 'job', cat: 'life', name: 'Work a part-time job', blurb: 'Somebody has to pay for the camps.',
    price: 0,
    show: (l) => isHS(l),
    run: (l, rng) => {
      const earned = 1800 + rng.int(1400);
      l.money += earned;
      l.meters.grades = clamp(l.meters.grades - 7, 0, 100);
      l.stats.happiness = clamp(l.stats.happiness - 4, 0, 100);
      return { kind: 'note', text: `Worked after school. Made ${cash(earned)}.` };
    },
  },
  {
    id: 'aau', cat: 'life', name: 'Play the AAU circuit', blurb: 'Play in front of everyone.',
    wear: 16, price: 1100,
    show: (l) => isHS(l) && l.money >= 1100,
    run: (l, rng) => {
      l.meters.hype = clamp(l.meters.hype + 15 * (1 - l.meters.hype / 118), 0, 100);
      trainSkills(l, Object.fromEntries(weakest(l, 2).map((k) => [k, 0.5])));
      return {
        kind: rng.chance(0.3) ? 'good' : 'note',
        text: 'Spent the summer on the circuit. A lot of gyms, a lot of eyes.',
      };
    },
  },
  {
    id: 'camp', cat: 'life', name: 'Elite camp invite', blurb: 'One weekend, every scout there.',
    price: 1700,
    show: (l) => isHS(l) && l.meters.hype >= 42 && l.money >= 1700,
    run: (l) => {
      l.meters.hype = clamp(l.meters.hype + 21 * (1 - l.meters.hype / 118), 0, 100);
      return { kind: 'good', text: 'Got the camp invite and did not embarrass yourself.' };
    },
  },
  {
    id: 'highlights', cat: 'life', name: 'Post your highlights', blurb: 'The tape does not lie. Much.',
    price: 0,
    show: (l) => l.lastStats && l.lastStats.ppg >= 9,
    run: (l, rng) => {
      const pop = rng.chance(0.28);
      l.meters.hype = clamp(l.meters.hype + (pop ? 14 : 5) * (1 - l.meters.hype / 118), 0, 100);
      return pop
        ? { kind: 'good', text: 'A mixtape got picked up. Your phone did not stop for a week.' }
        : { kind: 'note', text: 'Posted a highlight reel. It did fine.' };
    },
  },
  {
    id: 'nil', cat: 'life', name: 'Sign an NIL deal', blurb: 'A dealership wants your face on it.',
    price: 0,
    show: (l) => isCollege(l) && l.meters.hype >= 52,
    run: (l, rng) => {
      // Endorsement money is not linear in fame. It is close to nothing until
      // people outside your own conference know your name, then it moves fast.
      const reach = (l.meters.hype / 100) ** 2;
      const deal = Math.round((500 + 26000 * reach * (0.55 + l.meters.rep / 150)) * (0.6 + rng.random() * 0.8));
      l.money += deal;
      return { kind: 'good', text: `Signed an NIL deal — ${cash(deal)}.` };
    },
  },
  {
    id: 'media', cat: 'life', name: 'Media training', blurb: 'Say the right thing, on camera.',
    price: 400,
    show: (l) => isCollege(l) && l.money >= 400,
    run: (l) => {
      l.meters.rep = clamp(l.meters.rep + 13, 0, 100);
      return { kind: 'good', text: 'Learned how to handle a microphone.' };
    },
  },
  {
    id: 'combine', cat: 'life', name: 'Pro-day circuit', blurb: 'Workouts in front of front offices.',
    wear: 8, price: 900,
    show: (l) => isCollege(l) && l.age >= 19 && l.money >= 900,
    run: (l, rng) => {
      l.stock = clamp(l.stock + 4 + rng.int(5), -40, 40);
      l.meters.hype = clamp(l.meters.hype + 11 * (1 - l.meters.hype / 118), 0, 100);
      return { kind: 'good', text: 'Worked out for front offices. Somebody moved you up a board.' };
    },
  },
  {
    id: 'party', cat: 'life', name: 'Go out', blurb: 'You are eighteen once.',
    price: 120,
    run: (l, rng) => {
      l.stats.happiness = clamp(l.stats.happiness + 13, 0, 100);
      const seen = rng.chance(l.meters.hype > 55 ? 0.30 : 0.08);
      if (seen) {
        l.meters.rep = clamp(l.meters.rep - 12, 0, 100);
        l.stock = clamp(l.stock - 4, -40, 40);
        return { kind: 'bad', text: 'A video of you out got around. It did not look great.' };
      }
      return { kind: 'note', text: 'Went out. Nobody was filming.' };
    },
  },
  {
    id: 'doctor', cat: 'life', name: 'See a specialist', blurb: 'Something is not right.',
    price: 900,
    show: (l) => l.stats.health < 62 && l.money >= 900,
    run: (l) => {
      l.stats.health = clamp(l.stats.health + 18, 0, 100);
      l.strain = Math.max(0, l.strain - 12);
      return { kind: 'good', text: 'Saw a specialist and got the body sorted out.' };
    },
  },
  {
    id: 'agency', cat: 'life', name: 'Sign with an agency', blurb: 'They run your pre-draft process.',
    price: 3500,
    show: (l) => isCollege(l) && !personIn(l, 'agent') && l.money >= 3500,
    run: (l, rng) => {
      l.people.push(makePerson(l, 'agent', rng, { rel: 65 }));
      l.stock = clamp(l.stock + 5, -40, 40);
      return { kind: 'good', text: 'Signed with an agency. Somebody is working the phones for you now.' };
    },
  },
  {
    id: 'transfer', cat: 'life', name: 'Enter the transfer portal', blurb: 'This is not working.',
    price: 0,
    show: (l) => isCollege(l) && l.age >= 19 && l.lastMinutes < 12,
    run: (l, rng) => {
      l.wantsTransfer = true;
      return { kind: 'note', text: 'Put your name in the portal. Somewhere else, then.' };
    },
  },
];

// ---------------------------------------------------------------------------
// Focused training
//
// The grouped sessions above are what a team does with you. This is what you do
// on your own: pick one attribute and work it. Repeatable, unlike everything
// else, because the limit here is the falloff rather than a once-a-year rule —
// a second session on the same number is worth half, a third a fifth, and a
// fourth is worth nothing at all.
// ---------------------------------------------------------------------------
export function focusActions(life) {
  return SKILL_KEYS.map((k) => {
    const left = sessionsLeft(life, k);
    const room = life.build.skills[k] - life.attrs[k];
    return {
      id: `focus:${k}`,
      cat: 'train',
      key: k,
      name: SKILLS[k].label,
      wear: 7,
      price: 0,
      trains: { [k]: 1 },
      focus: true,
      now: Math.round(life.attrs[k]),
      gain: previewGain(life, k, 1),
      left,
      maxed: room <= 0.5,
      run: (l) => {
        const before = l.attrs[k];
        trainSkills(l, { [k]: 1 });
        const moved = l.attrs[k] - before;
        if (moved < 0.05) {
          return { kind: 'note', text: `Another session on ${SKILLS[k].label.toLowerCase()}. Nothing left in it this year.` };
        }
        return { kind: 'note', text: `Worked ${SKILLS[k].label.toLowerCase()} on your own. +${moved.toFixed(1)}.` };
      },
    };
  });
}

// ---------------------------------------------------------------------------
// People actions
//
// Built per person rather than listed, because what you can do with somebody
// depends on who they are and how things currently stand between you.
// ---------------------------------------------------------------------------
export function actionsForPerson(life, p) {
  const out = [];
  const push = (id, name, run, price = 0) => out.push({ id, name, price, run, person: p.id });

  push('talk', 'Spend time together', (l, rng) => {
    nudge(p, 4 + rng.int(5));
    p.met++;
    l.stats.happiness = clamp(l.stats.happiness + 2, 0, 100);
    return { kind: 'note', text: `Spent some time with ${p.name}.` };
  });

  if (p.rel < 45) {
    push('mend', 'Try to patch things up', (l, rng) => {
      p.met++;
      if (rng.chance(0.62)) {
        nudge(p, 12 + rng.int(9));
        return { kind: 'good', text: `Cleared the air with ${p.name}.` };
      }
      nudge(p, -4);
      return { kind: 'bad', text: `Tried to talk to ${p.name}. It went badly.` };
    });
  }

  if (p.role === 'teammate') {
    push('runit', 'Get in the gym together', (l, rng) => {
      p.met++;
      nudge(p, 7 + rng.int(6));
      trainSkills(l, Object.fromEntries(weakest(l, 2).map((k) => [k, 0.45])));
      return { kind: 'note', text: `Worked out with ${p.name}. Both of you got better.` };
    });
    if (p.rel < 35) {
      push('confront', 'Have it out with him', (l, rng) => {
        p.met++;
        if (rng.chance(0.4)) {
          nudge(p, 18);
          return { kind: 'good', text: `You and ${p.name} finally said it out loud. It helped.` };
        }
        nudge(p, -14);
        l.meters.rep = clamp(l.meters.rep - 4, 0, 100);
        return { kind: 'bad', text: `It got heard outside the locker room. That was a mistake.` };
      });
    }
  }

  if (p.role === 'coach') {
    push('minutes', 'Ask for more minutes', (l, rng) => {
      p.met++;
      // Asking works when he already rates you and backfires when he does not,
      // which is the entire lesson about asking for things.
      if (rng.chance(0.25 + p.rel / 220)) {
        l.minutesPitch = true;
        nudge(p, 3);
        return { kind: 'good', text: 'The coach heard you out and said he would look at it.' };
      }
      nudge(p, -9);
      return { kind: 'bad', text: 'You asked for minutes. He did not take it well.' };
    });
    push('extra', 'Stay after every practice', (l, rng) => {
      p.met++;
      nudge(p, 9 + rng.int(6));
      trainSkills(l, Object.fromEntries(weakest(l, 3).map((k) => [k, 0.4])));
      return { kind: 'good', text: 'Last one out of the gym, all year. He noticed.' };
    });
  }

  if (p.role === 'mother' || p.role === 'father') {
    const pot = Math.round(300 + life.background.yearly * 0.6);
    push('askmoney', `Ask for money`, 3, (l, rng) => {
      p.met++;
      if (rng.chance(0.35 + p.rel / 200)) {
        const got = Math.round(pot * (0.5 + rng.random()));
        l.money += got;
        nudge(p, -3);
        return { kind: 'good', text: `${p.name} gave you ${cash(got)}.` };
      }
      return { kind: 'bad', text: `Asked ${p.name} for money. There is not any.` };
    });
  }

  if (p.role === 'trainer') {
    push('session', 'Extra sessions all summer', (l) => {
      p.met++;
      nudge(p, 5);
      trainSkills(l, Object.fromEntries(weakest(l, 3).map((k) => [k, 0.8])), 1.15);
      l.strain += 12;  // declared inline: person actions are built, not listed
      return { kind: 'good', text: `A summer of extra work with ${p.name}.` };
    }, 900);
  }

  if (p.role === 'agent') {
    push('push', 'Have them work the phones', (l, rng) => {
      p.met++;
      l.stock = clamp(l.stock + 3 + rng.int(4), -40, 40);
      return { kind: 'good', text: `${p.name} spent the spring selling you to front offices.` };
    });
  }

  if (p.role === 'friend' || p.role === 'partner' || p.role === 'sibling') {
    push('lean', 'Lean on them', (l) => {
      p.met++;
      nudge(p, 5);
      l.stats.happiness = clamp(l.stats.happiness + 9, 0, 100);
      return { kind: 'good', text: `Talked to ${p.name} when it was heavy. It helped.` };
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Availability and execution
// ---------------------------------------------------------------------------
// Everything is once a year. `once` is gone as a flag because it is now the
// rule; an already-taken action disappears from the list rather than sitting
// there greyed out.
export function availableActions(life, cat) {
  return ACTIONS.filter((a) => {
    if (a.cat !== cat) return false;
    if (life.doneThisYear.includes(a.id)) return false;
    if (a.show && !a.show(life)) return false;
    return true;
  });
}

// Whether it can be taken right now, and if not, why. Money is the only hard
// block left; wear is a consequence, not a gate, so the game lets you do the
// stupid thing and then charges you for it.
export function blockedReason(life, a) {
  if ((a.price || 0) > life.money) return `Costs ${cash(a.price)}`;
  return null;
}

// A warning, not a refusal. Shown on anything physical once the body has had
// enough, so the cost of a sixth session in one year is legible before you take
// it rather than after the knee goes.
export function strainWarning(life, a) {
  if (!a.wear) return null;
  if (life.strain + a.wear > 78) return 'Your body has had enough';
  if (life.strain + a.wear > 55) return 'Getting worn down';
  return null;
}

export function doAction(life, a, rng) {
  if (blockedReason(life, a)) return null;
  life.money -= a.price || 0;
  life.strain += a.wear || 0;
  const entry = a.run(life, rng) || { kind: 'note', text: a.name };
  life.doneThisYear.push(a.id);
  life.yearLog.push(entry);
  return entry;
}
