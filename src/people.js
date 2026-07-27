// The people in a life, and what they are worth to you.
//
// Relationships are not flavour here. Teammates who like you feed you the ball;
// a coach who does not trust you does not play you; parents with money are the
// difference between going to the camp and hearing about it. Each one is a
// number between 0 and 100 that other systems read, so time spent on a person
// is time not spent in a gym and the trade has to be real in both directions.

import { clamp } from './roll.js';
import { randomName } from './names.js';

// Roles, and roughly what each one controls.
export const ROLES = {
  father: { label: 'Father', group: 'Family' },
  mother: { label: 'Mother', group: 'Family' },
  sibling: { label: 'Sibling', group: 'Family' },
  coach: { label: 'Coach', group: 'Basketball' },
  teammate: { label: 'Teammate', group: 'Basketball' },
  trainer: { label: 'Trainer', group: 'Basketball' },
  friend: { label: 'Best friend', group: 'Social' },
  partner: { label: 'Partner', group: 'Social' },
  agent: { label: 'Agent', group: 'Business' },
};

// Ids are handed out from a counter on the life itself. A module-level counter
// would restart at zero on page load and collide with the ids already inside a
// life restored from storage.
export function makePerson(life, role, rng, over = {}) {
  life.nextPersonId = (life.nextPersonId || 0) + 1;
  return {
    id: `p${life.nextPersonId}`,
    role,
    name: randomName(rng),
    rel: clamp(Math.round(rng.gauss(52, 14)), 5, 95),
    alive: true,
    met: 0,
    ...over,
  };
}

// Starting cast. Not everyone gets everyone — a life where both parents are
// around and have money is a different game from one where neither is, and the
// point of rolling it is that you do not choose.
export function rollCast(life, rng) {
  const people = [];
  const surname = life.name.split(' ').slice(1).join(' ');
  const family = (role) => {
    const p = makePerson(life, role, rng);
    p.name = `${p.name.split(' ')[0]} ${surname}`;
    return p;
  };

  if (rng.chance(0.94)) people.push(family('mother'));
  if (rng.chance(0.71)) people.push(family('father'));
  if (rng.chance(0.55)) people.push(family('sibling'));
  if (rng.chance(0.8)) people.push(makePerson(life, 'friend', rng));

  people.push(makePerson(life, 'coach', rng, { rel: clamp(Math.round(rng.gauss(46, 12)), 10, 85) }));
  for (let i = 0; i < 3; i++) {
    people.push(makePerson(life, 'teammate', rng, { rel: clamp(Math.round(rng.gauss(50, 16)), 5, 95) }));
  }
  return people;
}

// A new school means a new locker room. Family, friends and anyone you pay to
// be there come with you; the coach and every teammate do not.
export function newRoster(life, rng) {
  const kept = life.people.filter((p) => p.role !== 'coach' && p.role !== 'teammate');
  const fresh = [makePerson(life, 'coach', rng, { rel: clamp(Math.round(rng.gauss(44, 12)), 10, 85) })];
  for (let i = 0; i < 4; i++) {
    fresh.push(makePerson(life, 'teammate', rng, { rel: clamp(Math.round(rng.gauss(46, 15)), 5, 95) }));
  }
  return [...kept, ...fresh];
}

export const peopleIn = (life, role) => life.people.filter((p) => p.role === role && p.alive);
export const personIn = (life, role) => peopleIn(life, role)[0] || null;
export const personById = (life, id) => life.people.find((p) => p.id === id) || null;

// How the locker room reads you. This is the number the season uses: a team
// that likes you gets you the ball, and one that does not leaves you standing
// in the corner regardless of how good you are.
export function teamChemistry(life) {
  const mates = peopleIn(life, 'teammate');
  if (!mates.length) return 50;
  return mates.reduce((a, p) => a + p.rel, 0) / mates.length;
}

export const coachTrust = (life) => personIn(life, 'coach')?.rel ?? 50;

export function nudge(person, amount) {
  if (!person) return person;
  person.rel = clamp(Math.round(person.rel + amount), 0, 100);
  return person;
}

// Relationships decay if you never spend anything on them. Not fast — this is
// a year passing, not a week — but enough that a locker room you have ignored
// for four years is not the one you walked into.
export function driftRelationships(life, rng) {
  for (const p of life.people) {
    if (!p.alive) continue;
    const touched = p.met > 0;
    p.met = 0;
    const pull = touched ? 1.5 : -4;
    nudge(p, pull + rng.gauss(0, 2.5));
  }
}
