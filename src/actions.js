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

import { SKILL_KEYS } from './constants.js';
import { clamp } from './roll.js';
import { peopleIn, personIn, nudge, makePerson, teamChemistry } from './people.js';

export const TIME_PER_YEAR = 100;

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

// Close some of the gap between what you can do now and what your body will
// ever let you do. Work ethic sets the rate — the hidden number quietly
// deciding the whole arc — and a trainer or a college staff multiplies it.
function trainSkills(life, weights, mult = 1) {
  const rate =
    0.35 *
    (0.55 + life.mentals.workEthic / 110) *
    (life.program?.development ?? 1) *
    (personIn(life, 'trainer') ? 1.22 : 1) *
    mult;
  const moved = [];
  for (const [k, w] of Object.entries(weights)) {
    const room = life.build.skills[k] - life.attrs[k];
    if (room <= 0) continue;
    life.attrs[k] = clamp(life.attrs[k] + room * rate * w, 20, 99);
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
    cost: 18, price: 0,
    run: (l) => {
      trainSkills(l, { dunk: 1, finishing: 0.6, interiorD: 0.5, rebounding: 0.5 });
      l.strain += 14;
      l.physicals.durability = clamp(l.physicals.durability + 1, 10, 99);
      return { kind: 'note', text: 'Put in a winter in the weight room.' };
    },
  },
  {
    id: 'shoot', cat: 'train', name: 'Shooting reps', blurb: 'A thousand a day, alone.',
    cost: 16, price: 0,
    run: (l) => {
      trainSkills(l, { three: 1, midrange: 0.9 });
      l.strain += 6;
      return { kind: 'note', text: 'Got up shots every morning before school.' };
    },
  },
  {
    id: 'skills', cat: 'train', name: 'Ball-handling work', blurb: 'Handle and creation.',
    cost: 16, price: 0,
    run: (l) => {
      trainSkills(l, { handles: 1, playmaking: 0.8 });
      l.strain += 7;
      return { kind: 'note', text: 'Cones, tennis balls, two hours a night.' };
    },
  },
  {
    id: 'agility', cat: 'train', name: 'Speed & agility', blurb: 'First step, lateral slides.',
    cost: 16, price: 0,
    run: (l) => {
      trainSkills(l, { speed: 1, perimeterD: 0.6 });
      l.strain += 12;
      return { kind: 'note', text: 'Ran hills until it stopped being a punishment.' };
    },
  },
  {
    id: 'postwork', cat: 'train', name: 'Post footwork', blurb: 'Work on the block.',
    cost: 15, price: 0,
    show: (l) => l.adultHeight >= 78 || l.attrs.post > 45,
    run: (l) => {
      trainSkills(l, { post: 1, interiorD: 0.5, block: 0.4 });
      l.strain += 8;
      return { kind: 'note', text: 'Learned to actually play with your back to the rim.' };
    },
  },
  {
    id: 'film', cat: 'train', name: 'Watch film', blurb: 'Reads, not reps.',
    cost: 10, price: 0,
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
    cost: 6, price: 2200, once: true,
    show: (l) => !personIn(l, 'trainer') && l.money >= 2200,
    run: (l, rng) => {
      l.people.push(makePerson(l, 'trainer', rng, { rel: 60 }));
      return { kind: 'good', text: 'Hired a private trainer. Everything in the gym counts for more now.' };
    },
  },
  {
    id: 'rehab', cat: 'train', name: 'Rehab the injury', blurb: 'Slowly, properly, this time.',
    cost: 22, price: 0, once: true,
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
    cost: 14, price: 0, once: true,
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
    cost: 14, price: 0,
    run: (l) => {
      l.meters.grades = clamp(l.meters.grades + 15, 0, 100);
      l.stats.smarts = clamp(l.stats.smarts + 2.2, 0, 100);
      l.stats.happiness = clamp(l.stats.happiness - 3, 0, 100);
      return { kind: 'note', text: 'Put real hours into schoolwork.' };
    },
  },
  {
    id: 'tutor', cat: 'school', name: 'Get a tutor', blurb: 'Because studying alone is not working.',
    cost: 10, price: 700,
    show: (l) => l.meters.grades < 62 && l.money >= 700,
    run: (l) => {
      l.meters.grades = clamp(l.meters.grades + 24, 0, 100);
      l.stats.smarts = clamp(l.stats.smarts + 3.4, 0, 100);
      return { kind: 'good', text: 'A tutor turned the grades around.' };
    },
  },
  {
    id: 'extracredit', cat: 'school', name: 'Beg for extra credit', blurb: 'It is late in the term.',
    cost: 5, price: 0, once: true,
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
    cost: 0, price: 0, once: true,
    run: (l) => {
      l.meters.grades = clamp(l.meters.grades - 16, 0, 100);
      l.stats.happiness = clamp(l.stats.happiness + 7, 0, 100);
      l.time += 12; // the whole point is that it buys time back
      return { kind: 'bad', text: 'Skipped enough class that somebody noticed.' };
    },
  },
  {
    id: 'academics', cat: 'school', name: 'Meet with academic support', blurb: 'Compliance is asking.',
    cost: 12, price: 0, once: true,
    show: (l) => isCollege(l) && l.meters.grades < 55,
    run: (l) => {
      l.meters.grades = clamp(l.meters.grades + 20, 0, 100);
      return { kind: 'good', text: 'Academic support got you back on track. Barely.' };
    },
  },
  {
    id: 'sat', cat: 'school', name: 'Prep for the entrance exam', blurb: 'Schools have minimums.',
    cost: 12, price: 0, once: true,
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
    cost: 22, price: 0,
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
    cost: 24, price: 1100, once: true,
    show: (l) => isHS(l) && l.money >= 1100,
    run: (l, rng) => {
      l.meters.hype = clamp(l.meters.hype + 15 * (1 - l.meters.hype / 118), 0, 100);
      l.strain += 16;
      trainSkills(l, Object.fromEntries(weakest(l, 2).map((k) => [k, 0.5])));
      return {
        kind: rng.chance(0.3) ? 'good' : 'note',
        text: 'Spent the summer on the circuit. A lot of gyms, a lot of eyes.',
      };
    },
  },
  {
    id: 'camp', cat: 'life', name: 'Elite camp invite', blurb: 'One weekend, every scout there.',
    cost: 8, price: 1700, once: true,
    show: (l) => isHS(l) && l.meters.hype >= 42 && l.money >= 1700,
    run: (l) => {
      l.meters.hype = clamp(l.meters.hype + 21 * (1 - l.meters.hype / 118), 0, 100);
      return { kind: 'good', text: 'Got the camp invite and did not embarrass yourself.' };
    },
  },
  {
    id: 'highlights', cat: 'life', name: 'Post your highlights', blurb: 'The tape does not lie. Much.',
    cost: 4, price: 0, once: true,
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
    cost: 6, price: 0, once: true,
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
    cost: 8, price: 400, once: true,
    show: (l) => isCollege(l) && l.money >= 400,
    run: (l) => {
      l.meters.rep = clamp(l.meters.rep + 13, 0, 100);
      return { kind: 'good', text: 'Learned how to handle a microphone.' };
    },
  },
  {
    id: 'combine', cat: 'life', name: 'Pro-day circuit', blurb: 'Workouts in front of front offices.',
    cost: 18, price: 900, once: true,
    show: (l) => isCollege(l) && l.age >= 19 && l.money >= 900,
    run: (l, rng) => {
      l.stock = clamp(l.stock + 4 + rng.int(5), -40, 40);
      l.meters.hype = clamp(l.meters.hype + 11 * (1 - l.meters.hype / 118), 0, 100);
      l.strain += 8;
      return { kind: 'good', text: 'Worked out for front offices. Somebody moved you up a board.' };
    },
  },
  {
    id: 'party', cat: 'life', name: 'Go out', blurb: 'You are eighteen once.',
    cost: 8, price: 120, once: true,
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
    cost: 10, price: 900,
    show: (l) => l.stats.health < 62 && l.money >= 900,
    run: (l) => {
      l.stats.health = clamp(l.stats.health + 18, 0, 100);
      l.strain = Math.max(0, l.strain - 12);
      return { kind: 'good', text: 'Saw a specialist and got the body sorted out.' };
    },
  },
  {
    id: 'agency', cat: 'life', name: 'Sign with an agency', blurb: 'They run your pre-draft process.',
    cost: 6, price: 3500, once: true,
    show: (l) => isCollege(l) && !personIn(l, 'agent') && l.money >= 3500,
    run: (l, rng) => {
      l.people.push(makePerson(l, 'agent', rng, { rel: 65 }));
      l.stock = clamp(l.stock + 5, -40, 40);
      return { kind: 'good', text: 'Signed with an agency. Somebody is working the phones for you now.' };
    },
  },
  {
    id: 'transfer', cat: 'life', name: 'Enter the transfer portal', blurb: 'This is not working.',
    cost: 20, price: 0, once: true,
    show: (l) => isCollege(l) && l.age >= 19 && l.lastMinutes < 12,
    run: (l, rng) => {
      l.wantsTransfer = true;
      return { kind: 'note', text: 'Put your name in the portal. Somewhere else, then.' };
    },
  },
];

// ---------------------------------------------------------------------------
// People actions
//
// Built per person rather than listed, because what you can do with somebody
// depends on who they are and how things currently stand between you.
// ---------------------------------------------------------------------------
export function actionsForPerson(life, p) {
  const out = [];
  const push = (id, name, cost, run, price = 0) => out.push({ id, name, cost, price, run, person: p.id });

  push('talk', 'Spend time together', 5, (l, rng) => {
    nudge(p, 4 + rng.int(5));
    p.met++;
    l.stats.happiness = clamp(l.stats.happiness + 2, 0, 100);
    return { kind: 'note', text: `Spent some time with ${p.name}.` };
  });

  if (p.rel < 45) {
    push('mend', 'Try to patch things up', 9, (l, rng) => {
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
    push('runit', 'Get in the gym together', 12, (l, rng) => {
      p.met++;
      nudge(p, 7 + rng.int(6));
      trainSkills(l, Object.fromEntries(weakest(l, 2).map((k) => [k, 0.45])));
      return { kind: 'note', text: `Worked out with ${p.name}. Both of you got better.` };
    });
    if (p.rel < 35) {
      push('confront', 'Have it out with him', 6, (l, rng) => {
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
    push('minutes', 'Ask for more minutes', 6, (l, rng) => {
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
    push('extra', 'Stay after every practice', 14, (l, rng) => {
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
    push('session', 'Extra sessions all summer', 18, (l) => {
      p.met++;
      nudge(p, 5);
      trainSkills(l, Object.fromEntries(weakest(l, 3).map((k) => [k, 0.8])), 1.15);
      l.strain += 12;
      return { kind: 'good', text: `A summer of extra work with ${p.name}.` };
    }, 900);
  }

  if (p.role === 'agent') {
    push('push', 'Have them work the phones', 8, (l, rng) => {
      p.met++;
      l.stock = clamp(l.stock + 3 + rng.int(4), -40, 40);
      return { kind: 'good', text: `${p.name} spent the spring selling you to front offices.` };
    });
  }

  if (p.role === 'friend' || p.role === 'partner' || p.role === 'sibling') {
    push('lean', 'Lean on them', 6, (l) => {
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
export function availableActions(life, cat) {
  return ACTIONS.filter((a) => {
    if (a.cat !== cat) return false;
    if (a.show && !a.show(life)) return false;
    if (a.once && life.doneThisYear.includes(a.id)) return false;
    return true;
  });
}

// Whether it can be taken right now, and if not, why — the reason is shown, so
// running out of time reads differently from running out of money.
export function blockedReason(life, a) {
  if (a.cost > life.time) return 'No time left this year';
  if ((a.price || 0) > life.money) return `Costs ${cash(a.price)}`;
  return null;
}

export function doAction(life, a, rng) {
  const reason = blockedReason(life, a);
  if (reason) return { kind: 'bad', text: reason, blocked: true };
  life.time -= a.cost;
  life.money -= a.price || 0;
  const entry = a.run(life, rng) || { kind: 'note', text: a.name };
  if (a.once) life.doneThisYear.push(a.id);
  life.yearLog.push(entry);
  return entry;
}
