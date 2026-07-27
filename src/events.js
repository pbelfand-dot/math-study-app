// Things that happen to you.
//
// Two kinds. A PASSIVE event just happens and lands in the year's log: a scout
// turns up, a mixtape catches, your father loses his job. A CHOICE event stops
// the year and asks — take the booster's envelope or don't, play through the
// ankle or sit — and the branches genuinely diverge, including the ones where
// the obviously correct answer costs you something anyway.
//
// Every event carries a `when` so the table reads your actual situation rather
// than firing at random. A recruiting letter needs somebody to have heard of
// you. A transfer pitch needs you to be buried. The academic scandal needs you
// to have been cutting corners. Weight is how often it comes up once it is
// eligible, so the common ones stay common without the rare ones being
// impossible.

import { clamp } from './roll.js';
import { SKILL_KEYS } from './constants.js';
import { peopleIn, personIn, nudge, teamChemistry, coachTrust, makePerson } from './people.js';
import { effectiveCeiling } from './actions.js';

// Prefixed because the bundler flattens every module into one scope and a
// generic private helper name collides with the identical one next door.
const evCash = (n) => `$${Math.round(n).toLocaleString()}`;
const hs = (l) => l.stage === 'highschool';
const col = (l) => l.stage === 'college';

// Nudge hype with the same diminishing return the season uses, so an event can
// never do what a whole year of production cannot.
const hype = (l, n) => { l.meters.hype = clamp(l.meters.hype + n * (1 - l.meters.hype / 115), 0, 100); };
const rep = (l, n) => { l.meters.rep = clamp(l.meters.rep + n, 0, 100); };
const happy = (l, n) => { l.stats.happiness = clamp(l.stats.happiness + n, 0, 100); };
const health = (l, n) => { l.stats.health = clamp(l.stats.health + n, 0, 100); };
const smarts = (l, n) => { l.stats.smarts = clamp(l.stats.smarts + n, 0, 100); };
const grades = (l, n) => { l.meters.grades = clamp(l.meters.grades + n, 0, 100); };
const stock = (l, n) => { l.stock = clamp(l.stock + n, -40, 40); };

// Push an attribute toward its genetic ceiling by a share of what is left, so a
// windfall on a maxed-out skill is correctly worth almost nothing.
function bump(life, keys, share) {
  for (const k of keys) {
    const room = effectiveCeiling(life, k) - life.attrs[k];
    if (room > 0) life.attrs[k] = clamp(life.attrs[k] + room * share, 20, 99);
  }
}
const evStrongest = (l) => [...SKILL_KEYS].sort((a, b) => l.attrs[b] - l.attrs[a])[0];
const evWeakest = (l) => [...SKILL_KEYS].sort((a, b) => (l.build.skills[a] - l.attrs[a]) - (l.build.skills[b] - l.attrs[b])).at(-1);

// ---------------------------------------------------------------------------
// Passive events
// ---------------------------------------------------------------------------
export const EVENTS = [
  // ---- on the floor -------------------------------------------------------
  {
    id: 'breakout', weight: 10,
    when: (l) => l.lastMinutes >= 14,
    run: (l, rng) => {
      bump(l, [evStrongest(l)], 0.10);
      hype(l, 7);
      happy(l, 6);
      return { kind: 'good', text: `You went off in a game somebody important was at. Thirty-one points and it was not close.` };
    },
  },
  {
    id: 'buzzer', weight: 6,
    when: (l) => l.lastMinutes >= 12,
    run: (l, rng) => {
      const made = rng.chance(0.35 + l.mentals.clutch / 260);
      if (made) {
        hype(l, 6); happy(l, 12); rep(l, 5);
        nudge(personIn(l, 'coach'), 5);
        return { kind: 'good', text: 'The ball was in your hands with four seconds left. You made it.' };
      }
      happy(l, -9);
      return { kind: 'bad', text: 'The ball was in your hands with four seconds left. You missed it, and it is the clip that follows you all year.' };
    },
  },
  {
    id: 'benched', weight: 7,
    when: (l) => coachTrust(l) < 42 && l.lastMinutes > 0,
    run: (l) => {
      nudge(personIn(l, 'coach'), -5);
      happy(l, -8);
      return { kind: 'bad', text: 'You got pulled in the first quarter of a game you should have started, and did not get back in.' };
    },
  },
  {
    id: 'captain', weight: 5,
    when: (l) => teamChemistry(l) > 58 && l.lastMinutes >= 18,
    run: (l) => {
      rep(l, 8); happy(l, 8);
      nudge(personIn(l, 'coach'), 6);
      return { kind: 'good', text: 'They made you a captain. Nobody argued.' };
    },
  },
  {
    id: 'ejected', weight: 4,
    when: (l) => l.build.mentality > 58 && l.lastMinutes > 8,
    run: (l) => {
      rep(l, -9);
      nudge(personIn(l, 'coach'), -7);
      return { kind: 'bad', text: 'Ejected for arguing a call. The second technical was not close.' };
    },
  },
  {
    id: 'lockerroom', weight: 6,
    when: (l) => teamChemistry(l) < 38,
    run: (l, rng) => {
      const mate = rng.pick(peopleIn(l, 'teammate'));
      if (mate) nudge(mate, -8);
      happy(l, -6);
      return { kind: 'bad', text: `${mate ? mate.name : 'Somebody'} said something about you to a reporter. It was not flattering, and it was not wrong.` };
    },
  },

  // ---- exposure -----------------------------------------------------------
  {
    id: 'scoutgame', weight: 8,
    when: (l) => l.meters.hype > 24 && l.lastMinutes >= 10,
    run: (l, rng) => {
      const good = rng.chance(0.55 + l.mentals.clutch / 300);
      if (good) { hype(l, 9); stock(l, 3); return { kind: 'good', text: 'There were four schools in the gym and you played the best game of your life.' }; }
      hype(l, -3);
      return { kind: 'bad', text: 'There were four schools in the gym and you went 2-for-14.' };
    },
  },
  {
    id: 'viral', weight: 5,
    when: (l) => l.attrs.dunk > 62 && l.lastMinutes >= 10,
    run: (l) => {
      hype(l, 14); rep(l, 3);
      return { kind: 'good', text: 'You put somebody on a poster and the clip got two million views by morning.' };
    },
  },
  {
    id: 'ranked', weight: 5,
    when: (l) => hs(l) && l.meters.hype > 58,
    run: (l) => { hype(l, 6); happy(l, 7); return { kind: 'good', text: 'A ranking service put you in the national top hundred.' }; },
  },
  {
    id: 'letters', weight: 6,
    when: (l) => hs(l) && l.meters.hype > 40 && l.age >= 16,
    run: (l) => { happy(l, 5); return { kind: 'good', text: 'Letters are arriving from schools you have only seen on television.' }; },
  },
  {
    id: 'overlooked', weight: 5,
    when: (l) => hs(l) && l.meters.hype < 28 && l.lastMinutes > 16,
    run: (l) => {
      happy(l, -7);
      return { kind: 'bad', text: 'You put up 22 a night and the local paper still spelled your name wrong.' };
    },
  },
  {
    id: 'draftboard', weight: 6,
    when: (l) => col(l) && l.age >= 20,
    run: (l, rng) => {
      const up = rng.chance(0.5);
      stock(l, up ? 5 : -5);
      return up
        ? { kind: 'good', text: 'A mock draft has you going higher than anyone expected.' }
        : { kind: 'bad', text: 'A mock draft dropped you out of the first round entirely.' };
    },
  },

  // ---- the body -----------------------------------------------------------
  {
    id: 'lategrowth', weight: 4,
    when: (l) => l.age <= 17 && l.adultHeight - l.startHeight > 6,
    run: (l) => { health(l, -4); return { kind: 'note', text: 'Knees ache constantly. The doctor says it is just growing.' }; },
  },
  {
    id: 'mono', weight: 4,
    when: (l) => l.stats.health < 88,
    run: (l) => {
      health(l, -14); happy(l, -6);
      return { kind: 'bad', text: 'Came down with something that would not leave. Six weeks of it.' };
    },
  },
  {
    id: 'shape', weight: 5,
    when: (l) => l.strain < 24 && l.age >= 16,
    run: (l) => {
      l.physicals.stamina = clamp(l.physicals.stamina - 3, 10, 99);
      return { kind: 'bad', text: 'You showed up to camp out of shape and everybody could see it.' };
    },
  },
  {
    id: 'lategrowthspurt', weight: 3,
    when: (l) => l.age >= 17 && l.age <= 19 && l.adultHeight >= 76,
    run: (l) => {
      bump(l, ['rebounding', 'interiorD', 'block'], 0.09);
      return { kind: 'good', text: 'You filled out. Same height, forty pounds of it that was not there before.' };
    },
  },

  // ---- school -------------------------------------------------------------
  {
    id: 'teacher', weight: 5,
    when: (l) => l.stats.smarts > 55,
    run: (l) => { smarts(l, 4); grades(l, 8); return { kind: 'good', text: 'A teacher took an interest in you and it stuck.' }; },
  },
  {
    id: 'flunk', weight: 6,
    when: (l) => l.meters.grades < 48,
    run: (l) => { grades(l, -9); return { kind: 'bad', text: 'Failed a class outright. It goes on the transcript.' }; },
  },
  {
    id: 'academic', weight: 3,
    when: (l) => hs(l) && l.stats.smarts > 76 && l.age >= 16,
    run: (l) => {
      l.money += 2500;
      happy(l, 6);
      return { kind: 'good', text: `An academic scholarship came through — ${evCash(2500)}, and nothing to do with basketball.` };
    },
  },

  // ---- family and money ---------------------------------------------------
  {
    id: 'joblost', weight: 5,
    when: (l) => l.background.id === 'struggling' || l.background.id === 'working',
    run: (l) => {
      const p = personIn(l, 'father') || personIn(l, 'mother');
      l.money = Math.max(0, l.money - 400);
      happy(l, -8);
      return { kind: 'bad', text: `${p ? p.name : 'Your family'} lost a job. Things are tight and you can feel it.` };
    },
  },
  {
    id: 'windfall', weight: 4,
    when: (l) => l.background.id === 'comfortable' || l.background.id === 'wealthy',
    run: (l, rng) => {
      const got = 1200 + rng.int(2600);
      l.money += got;
      return { kind: 'good', text: `Family money came your way — ${evCash(got)}.` };
    },
  },
  {
    id: 'moved', weight: 3,
    when: (l) => hs(l) && l.age <= 16,
    run: (l, rng) => {
      for (const p of peopleIn(l, 'teammate')) nudge(p, -12);
      nudge(personIn(l, 'coach'), -10);
      happy(l, -7);
      return { kind: 'bad', text: 'The family moved. New school, new team, nobody knows you.' };
    },
  },
  {
    id: 'stolen', weight: 3,
    when: (l) => l.money > 600,
    run: (l, rng) => {
      const lost = Math.round(l.money * (0.1 + rng.random() * 0.2));
      l.money -= lost;
      return { kind: 'bad', text: `Somebody went through your bag at the gym. ${evCash(lost)} gone.` };
    },
  },

  // ---- people -------------------------------------------------------------
  {
    id: 'newfriend', weight: 5,
    when: (l) => l.stats.happiness > 45 && peopleIn(l, 'friend').length < 2,
    run: (l, rng) => {
      const f = makePerson(l, 'friend', rng, { rel: 58 + rng.int(20) });
      l.people.push(f);
      happy(l, 7);
      return { kind: 'good', text: `You and ${f.name} became close this year.` };
    },
  },
  {
    id: 'partner', weight: 5,
    when: (l) => l.age >= 16 && !personIn(l, 'partner'),
    run: (l, rng) => {
      const p = makePerson(l, 'partner', rng, { rel: 62 + rng.int(24) });
      l.people.push(p);
      happy(l, 14);
      return { kind: 'good', text: `You started seeing ${p.name}.` };
    },
  },
  {
    id: 'breakup', weight: 5,
    when: (l) => !!personIn(l, 'partner') && (personIn(l, 'partner').rel < 48 || l.strain > 60),
    run: (l) => {
      const p = personIn(l, 'partner');
      p.alive = false;
      happy(l, -16);
      return { kind: 'bad', text: `${p.name} ended it. You were never around.` };
    },
  },
  {
    id: 'mentor', weight: 4,
    when: (l) => coachTrust(l) > 70,
    run: (l) => {
      l.mentals.bballIQ = clamp(l.mentals.bballIQ + 4, 1, 99);
      return { kind: 'good', text: 'Your coach started keeping you back to teach you things he does not teach the others.' };
    },
  },
];

// ---------------------------------------------------------------------------
// Choice events
//
// These stop the year and ask. Written so no option is free — the safe branch
// costs something too, because a choice where one answer is strictly correct is
// not a choice.
// ---------------------------------------------------------------------------
export const CHOICES = [
  {
    id: 'booster', weight: 7,
    when: (l) => l.meters.hype > 45 && (hs(l) || col(l)),
    title: 'An envelope',
    text: (l) => `A booster from a school recruiting you leaves an envelope in your locker. There is ${evCash(4000)} in it and no note.`,
    options: [
      {
        label: 'Take it',
        run: (l, rng) => {
          l.money += 4000;
          if (rng.chance(0.3)) {
            rep(l, -18); stock(l, -7);
            return { kind: 'bad', text: 'You took the money, and eight months later somebody talked. It follows you.' };
          }
          return { kind: 'good', text: `You took the money. Nobody ever mentioned it again.` };
        },
      },
      {
        label: 'Hand it back',
        run: (l) => {
          rep(l, 10);
          return { kind: 'good', text: 'You handed it back. The story got around, and it got around the right way.' };
        },
      },
      {
        label: 'Report it',
        run: (l, rng) => {
          rep(l, 16);
          for (const p of peopleIn(l, 'teammate')) nudge(p, -9);
          return { kind: 'note', text: 'You reported it. The adults were delighted. The locker room was not.' };
        },
      },
    ],
  },
  {
    id: 'playthrough', weight: 9,
    when: (l) => l.lastMinutes >= 12,
    title: 'The ankle',
    text: () => 'You roll it badly in warmups before the biggest game of your season. It will hold if you tape it. Probably.',
    options: [
      {
        label: 'Play',
        run: (l, rng) => {
          if (rng.chance(0.45)) {
            health(l, -22); l.injured = true;
            bump(l, ['speed'], -0.06);
            return { kind: 'bad', text: 'You played, and it went in the second quarter. That one takes a year.' };
          }
          hype(l, 8); rep(l, 7);
          nudge(personIn(l, 'coach'), 8);
          return { kind: 'good', text: 'You played, and everybody in the building knew what it cost you.' };
        },
      },
      {
        label: 'Sit it out',
        run: (l) => {
          health(l, 10);
          nudge(personIn(l, 'coach'), -6);
          hype(l, -4);
          return { kind: 'note', text: 'You sat. It healed clean, and one or two people decided something about you.' };
        },
      },
    ],
  },
  {
    id: 'transferpitch', weight: 7,
    when: (l) => col(l) && l.lastMinutes < 14 && l.age >= 19,
    title: 'A phone call',
    text: () => 'An assistant from another program calls. They say you would start there from day one, and they are not wrong.',
    options: [
      {
        label: 'Put your name in the portal',
        run: (l) => {
          l.wantsTransfer = true;
          for (const p of peopleIn(l, 'teammate')) nudge(p, -10);
          nudge(personIn(l, 'coach'), -20);
          return { kind: 'note', text: 'Word got out that you were listening before you had decided anything.' };
        },
      },
      {
        label: 'Stay and fight for it',
        run: (l, rng) => {
          nudge(personIn(l, 'coach'), 12);
          if (rng.chance(0.5)) { l.minutesPitch = true; return { kind: 'good', text: 'You told your coach about the call. He moved you up the rotation.' }; }
          return { kind: 'note', text: 'You stayed. Nothing changed, but you can live with the decision.' };
        },
      },
    ],
  },
  {
    id: 'party', weight: 8,
    when: (l) => l.age >= 16,
    title: 'The night before',
    text: () => 'There is a party the night before a game everybody is watching. Half the team is going.',
    options: [
      {
        label: 'Go',
        run: (l, rng) => {
          happy(l, 12);
          for (const p of peopleIn(l, 'teammate')) nudge(p, 6);
          if (rng.chance(0.35)) {
            rep(l, -12); nudge(personIn(l, 'coach'), -12);
            return { kind: 'bad', text: 'You went, somebody filmed it, and your coach saw it before you woke up.' };
          }
          return { kind: 'good', text: 'You went. Nobody found out and you played fine anyway.' };
        },
      },
      {
        label: 'Stay in',
        run: (l) => {
          happy(l, -5);
          for (const p of peopleIn(l, 'teammate')) nudge(p, -4);
          nudge(personIn(l, 'coach'), 5);
          return { kind: 'note', text: 'You stayed in. The right call, and the team noticed you were not there.' };
        },
      },
    ],
  },
  {
    id: 'cheat', weight: 7,
    when: (l) => l.meters.grades < 52 && l.stats.smarts < 70,
    title: 'The exam',
    text: () => 'You are going to fail an exam that decides whether you are eligible. Somebody offers you the answers.',
    options: [
      {
        label: 'Take the answers',
        run: (l, rng) => {
          grades(l, 20);
          if (rng.chance(0.28)) {
            grades(l, -40); rep(l, -14);
            l.ineligible = true;
            return { kind: 'bad', text: 'You were caught. Suspended, ineligible, and everybody knows why.' };
          }
          return { kind: 'note', text: 'You passed. Nobody looked into it.' };
        },
      },
      {
        label: 'Fail it honestly',
        run: (l) => {
          grades(l, -12); rep(l, 4);
          return { kind: 'bad', text: 'You failed it. It is a hole you now have to dig out of.' };
        },
      },
      {
        label: 'Beg for a retake',
        run: (l, rng) => {
          if (rng.chance(0.4 + l.stats.smarts / 300)) { grades(l, 12); return { kind: 'good', text: 'They let you sit it again. You scraped through.' }; }
          grades(l, -10);
          return { kind: 'bad', text: 'They said no. You knew they would.' };
        },
      },
    ],
  },
  {
    id: 'positionswitch', weight: 6,
    when: (l) => l.lastMinutes >= 10 && l.age >= 16,
    title: 'A new position',
    text: (l) => `Your coach wants to move you. It is not where you see yourself, and he is not asking.`,
    options: [
      {
        label: 'Buy in',
        run: (l) => {
          bump(l, [evWeakest(l)], 0.22);
          nudge(personIn(l, 'coach'), 12);
          return { kind: 'good', text: 'You bought in. It was uncomfortable for a season and it made you a different player.' };
        },
      },
      {
        label: 'Refuse',
        run: (l) => {
          bump(l, [evStrongest(l)], 0.10);
          nudge(personIn(l, 'coach'), -16);
          return { kind: 'note', text: 'You refused. You kept doing what you are good at, and he stopped going out of his way for you.' };
        },
      },
    ],
  },
  {
    id: 'agentgift', weight: 6,
    when: (l) => col(l) && l.meters.hype > 55,
    title: 'A favour',
    text: () => 'An agency wants to sign you. They offer to fly your family out to every game this season, starting now.',
    options: [
      {
        label: 'Accept',
        run: (l, rng) => {
          happy(l, 10);
          for (const p of [personIn(l, 'mother'), personIn(l, 'father')]) nudge(p, 12);
          if (!personIn(l, 'agent')) l.people.push(makePerson(l, 'agent', rng, { rel: 70 }));
          stock(l, 4);
          if (rng.chance(0.22)) { rep(l, -14); return { kind: 'bad', text: 'You accepted. The compliance office found out what it was worth.' }; }
          return { kind: 'good', text: 'You accepted. Your family saw every game you played.' };
        },
      },
      {
        label: 'Decline',
        run: (l) => { rep(l, 6); return { kind: 'note', text: 'You declined. Clean, and your mother watched the season on a laptop.' }; },
      },
    ],
  },
  {
    id: 'sickparent', weight: 5,
    when: (l) => !!(personIn(l, 'mother') || personIn(l, 'father')),
    title: 'Home',
    text: (l) => {
      const p = personIn(l, 'mother') || personIn(l, 'father');
      return `${p.name} is ill. It is serious enough that somebody has to be there, and the season is halfway through.`;
    },
    options: [
      {
        label: 'Go home',
        run: (l) => {
          const p = personIn(l, 'mother') || personIn(l, 'father');
          nudge(p, 22);
          happy(l, 8);
          l.minutes = Math.max(0, l.minutes - 8);
          nudge(personIn(l, 'coach'), -5);
          hype(l, -6);
          return { kind: 'note', text: `You went home and missed a third of the season. ${p.name} got better.` };
        },
      },
      {
        label: 'Stay and play',
        run: (l) => {
          const p = personIn(l, 'mother') || personIn(l, 'father');
          nudge(p, -14);
          happy(l, -14);
          hype(l, 4);
          return { kind: 'bad', text: `You stayed. You had the best month of your career and could not enjoy a minute of it.` };
        },
      },
    ],
  },
  {
    id: 'reporter', weight: 6,
    when: (l) => l.meters.hype > 38,
    title: 'The interview',
    text: () => 'A reporter asks you, on camera, whether you are the best player in your conference.',
    options: [
      {
        label: 'Say yes',
        run: (l, rng) => {
          hype(l, 10);
          if (rng.chance(0.5)) { rep(l, -8); return { kind: 'bad', text: 'It ran everywhere. Every team you played after that had it printed in the locker room.' }; }
          rep(l, 4);
          return { kind: 'good', text: 'It ran everywhere, and you spent the rest of the season backing it up.' };
        },
      },
      {
        label: 'Deflect',
        run: (l) => { rep(l, 7); hype(l, 2); return { kind: 'note', text: 'You gave the boring answer. The boring answer is usually right.' }; },
      },
    ],
  },
  {
    id: 'quitmoment', weight: 5,
    when: (l) => l.stats.happiness < 42 || l.strain > 70,
    title: 'Enough',
    text: () => 'You wake up one morning and genuinely consider not doing this any more. Nobody would be that surprised.',
    options: [
      {
        label: 'Take a season away',
        run: (l) => {
          happy(l, 26); health(l, 14);
          l.strain = 0;
          l.minutes = 0;
          l.tookYearOff = true;
          hype(l, -14);
          return { kind: 'note', text: 'You stepped away for a year. It cost you a season and it probably saved the rest.' };
        },
      },
      {
        label: 'Push through it',
        run: (l, rng) => {
          if (rng.chance(0.45)) {
            happy(l, -12);
            l.mentals.workEthic = clamp(l.mentals.workEthic - 4, 1, 99);
            return { kind: 'bad', text: 'You pushed through and something went out of it. You are still playing. You are not still enjoying it.' };
          }
          happy(l, 10);
          l.mentals.workEthic = clamp(l.mentals.workEthic + 3, 1, 99);
          return { kind: 'good', text: 'You pushed through and came out the other side harder than you went in.' };
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// In-game moments
//
// The other tables are about a life. These are about a possession: you have the
// ball, here is the situation, what do you do. Each option is resolved against
// the attribute it actually depends on, so the numbers you spent four years
// training are the numbers that decide whether it goes in — which is the only
// way an attribute ever feels like anything rather than reading like a
// spreadsheet cell.
//
// `diff` is what the attribute is measured against, and PARITY IS A COIN FLIP:
// an attribute exactly equal to the difficulty makes the play half the time.
// The first pass set difficulties against pro-level numbers and measured a 24%
// make rate for a player choosing his own best option, which is not a decision,
// it is a punishment. Difficulties are keyed to what a teenager actually has.
// ---------------------------------------------------------------------------
function attempt(life, key, diff, rng) {
  const p = clamp(0.5 + (life.attrs[key] - diff) / 70, 0.05, 0.93);
  return rng.chance(p);
}

// A made play is worth a little of everything a good game is worth. A miss
// costs the coach's patience more than anything else, because he is the one
// deciding whether you get the ball again.
function playOutcome(life, key, made, rng, madeText, missText) {
  if (made) {
    bump(life, [key], 0.05);
    hype(life, 5); happy(life, 7);
    nudge(personIn(life, 'coach'), 4);
    life.playsMade = (life.playsMade || 0) + 1;
    return { kind: 'good', text: madeText };
  }
  happy(life, -5);
  nudge(personIn(life, 'coach'), -4);
  life.playsMissed = (life.playsMissed || 0) + 1;
  return { kind: 'bad', text: missText };
}

const played = (l) => l.lastMinutes >= 8;

export const PLAYS = [
  {
    id: 'topofkey', weight: 10, when: played,
    title: 'Top of the key',
    text: () => 'You catch it with a foot on the line and a defender closing hard. Two seconds on the shot clock.',
    options: [
      { label: 'Rise and shoot it', key: 'three', diff: 42,
        made: 'You shot it over the closeout. Nothing but net, and the bench lost it.',
        miss: 'You shot it over the closeout. Front rim, and the break went the other way.' },
      { label: 'Pump fake and drive', key: 'handles', diff: 39,
        made: 'You put the ball on the floor, got by him, and finished through contact.',
        miss: 'You put the ball on the floor and he stripped it clean.' },
      { label: 'Swing it to the corner', key: 'playmaking', diff: 27,
        made: 'You made the extra pass. Corner three, and the assist was the best part of it.',
        miss: 'You made the extra pass a beat late and it went out of bounds off his hands.' },
    ],
  },
  {
    id: 'transition', weight: 10, when: played,
    title: 'Two on one',
    text: () => 'Long rebound, you are gone, and there is one defender back with your teammate filling the lane.',
    options: [
      { label: 'Take off from the dotted line', key: 'dunk', diff: 45,
        made: 'You went from the dotted line and put it through him. The gym stopped.',
        miss: 'You went from the dotted line and caught the back of the rim. Everyone saw it.' },
      { label: 'Lay it in', key: 'finishing', diff: 25,
        made: 'You took the two that was there. Nobody writes about it and it counts the same.',
        miss: 'You took the easy one and rushed it off the glass.' },
      { label: 'Drop it off', key: 'playmaking', diff: 31,
        made: 'You froze the last man and dropped it off. Easiest two he will ever get.',
        miss: 'You waited a half-second too long and the pass went into his feet.' },
    ],
  },
  {
    id: 'postup', weight: 8, when: (l) => played(l) && (l.adultHeight >= 77 || l.attrs.post > 45),
    title: 'On the block',
    text: () => 'You have got him sealed on the left block and the entry pass is coming.',
    options: [
      { label: 'Turn and face', key: 'midrange', diff: 39,
        made: 'You turned, faced, and shot it over him before he was set.',
        miss: 'You turned into a double team you did not see.' },
      { label: 'Back him down', key: 'post', diff: 37,
        made: 'You backed him under the rim and went right through his chest.',
        miss: 'You backed him down into nothing and threw up a prayer.' },
      { label: 'Kick it back out', key: 'playmaking', diff: 23,
        made: 'You drew the double and found the open man. Good basketball.',
        miss: 'You forced it back out and it got picked off at the arc.' },
    ],
  },
  {
    id: 'lastshot', weight: 9, when: played,
    title: 'Down one, six seconds',
    text: () => 'The play is drawn up for you. Everyone in the gym knows it is drawn up for you.',
    options: [
      { label: 'Pull up from three to win it', key: 'three', diff: 51,
        made: 'You pulled up from four feet behind the line and won it outright.',
        miss: 'You pulled up from four feet behind the line and it never had a chance.' },
      { label: 'Get to the rim to tie it', key: 'finishing', diff: 39,
        made: 'You got downhill, drew the foul, and made them both. Overtime.',
        miss: 'You got downhill into three bodies and it got blocked out of bounds.' },
      { label: 'Give it up to the open man', key: 'playmaking', diff: 33,
        made: 'You gave it up. He made it. You have never been happier about a pass.',
        miss: 'You gave it up and he missed. Everyone remembered who passed.' },
    ],
  },
  {
    id: 'iso', weight: 7, when: (l) => played(l) && l.build.mentality >= 48,
    title: 'Cleared out',
    text: () => 'Coach clears the side for you. It is you and him and thirty feet of nothing.',
    options: [
      { label: 'Cross him over', key: 'handles', diff: 45,
        made: 'You took him left, came back right, and he sat down. The bench cleared.',
        miss: 'You took him left, he stayed, and you dribbled it off your own foot.' },
      { label: 'Rise over him', key: 'midrange', diff: 42,
        made: 'You did not need to beat him. You just shot it over him.',
        miss: 'You settled for a contested two and it was ugly.' },
      { label: 'Give it up and cut', key: 'playmaking', diff: 29,
        made: 'You gave it up, cut behind him, and got it back at the rim.',
        miss: 'You gave it up and stood there. The possession died.' },
    ],
  },
  {
    id: 'defense', weight: 8, when: played,
    title: 'Their best player',
    text: () => 'Coach puts you on their best player for the last four minutes. He has 28.',
    options: [
      { label: 'Pressure him full court', key: 'perimeterD', diff: 45,
        made: 'You picked him up full court and he did not touch it again.',
        miss: 'You picked him up full court and he went by you twice.' },
      { label: 'Sit back and contest', key: 'perimeterD', diff: 31,
        made: 'You gave him the first step and took away everything after it.',
        miss: 'You gave him space and he made you pay from three.' },
      { label: 'Go for the steal', key: 'speed', diff: 49,
        made: 'You jumped the passing lane and took it the other way.',
        miss: 'You gambled, missed, and gave up a layup nobody had to work for.' },
    ],
  },
  {
    id: 'rimprotect', weight: 7, when: (l) => played(l) && l.adultHeight >= 76,
    title: 'He is coming down the lane',
    text: () => 'Their guard has beaten his man and there is nothing between him and the rim except you.',
    options: [
      { label: 'Meet him at the top', key: 'block', diff: 45,
        made: 'You met him at the top and put it into the third row.',
        miss: 'You met him at the top, missed it entirely, and fouled him hard.' },
      { label: 'Stand your ground', key: 'interiorD', diff: 37,
        made: 'You stood there, took the contact, and drew the charge.',
        miss: 'You stood there and he went straight over you.' },
      { label: 'Get out of the way', key: 'rebounding', diff: 21,
        made: 'You conceded the two and got the rebound out clean. Not heroic. Correct.',
        miss: 'You conceded the two and did not even get the ball back.' },
    ],
  },
  {
    id: 'freethrows', weight: 6, when: played,
    title: 'Two shots, tie game',
    text: () => 'You get fouled with the game level and one second left. The gym is very loud.',
    options: [
      { label: 'Same routine as always', key: 'midrange', diff: 33,
        made: 'Same routine. Both of them. You did not hear a thing.',
        miss: 'Same routine, and the first one was short. You knew immediately.' },
      { label: 'Step off and reset', key: 'midrange', diff: 39,
        made: 'You stepped off, breathed, stepped back on, and buried them.',
        miss: 'You stepped off, thought about it too long, and short-armed it.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Rolling a year
// ---------------------------------------------------------------------------
function pickWeighted(pool, rng) {
  const total = pool.reduce((a, e) => a + e.weight, 0);
  let r = rng.random() * total;
  for (const e of pool) { r -= e.weight; if (r <= 0) return e; }
  return pool[pool.length - 1];
}

// Two to four things happen in a year. On top of that a year can ask you up to
// two questions — one about the life, one about a possession — so they come
// back as a QUEUE rather than a single slot. A year where you played and also
// had something happen off the floor should present both, in order, instead of
// silently dropping one.
export function rollYearEvents(life, rng) {
  const passive = [];
  const seen = life.seenEvents || (life.seenEvents = []);
  const ONCE = new Set(['partner', 'newfriend', 'moved', 'academic']);

  let pool = EVENTS.filter((e) => (!ONCE.has(e.id) || !seen.includes(e.id)) && e.when(life));
  const n = 2 + (rng.chance(0.45) ? 1 : 0) + (rng.chance(0.18) ? 1 : 0);
  for (let i = 0; i < n && pool.length; i++) {
    const e = pickWeighted(pool, rng);
    pool = pool.filter((x) => x.id !== e.id);
    seen.push(e.id);
    const line = e.run(life, rng);
    if (line) passive.push(line);
  }

  const queue = [];

  // A possession first — it belongs to the season that just finished.
  if (rng.chance(0.78)) {
    const ppool = PLAYS.filter((p) => p.when(life));
    if (ppool.length) {
      const p = pickWeighted(ppool, rng);
      queue.push({
        kind: 'play', id: p.id, title: p.title, text: p.text(life),
        options: p.options.map((o) => o.label),
      });
    }
  }

  // Then the life, if it has something to ask.
  if (rng.chance(0.55)) {
    const cpool = CHOICES.filter((c) => !seen.includes(c.id) && c.when(life));
    if (cpool.length) {
      const c = pickWeighted(cpool, rng);
      seen.push(c.id);
      queue.push({ kind: 'life', id: c.id, title: c.title, text: c.text(life), options: c.options.map((o) => o.label) });
    }
  }
  return { passive, queue };
}

export function resolveChoice(life, kind, id, optionIndex, rng) {
  if (kind === 'play') {
    const p = PLAYS.find((x) => x.id === id);
    const opt = p?.options[optionIndex];
    if (!opt) return null;
    const made = attempt(life, opt.key, opt.diff, rng);
    return playOutcome(life, opt.key, made, rng, opt.made, opt.miss);
  }
  const c = CHOICES.find((x) => x.id === id);
  const opt = c?.options[optionIndex];
  if (!opt) return null;
  return opt.run(life, rng) || { kind: 'note', text: opt.label };
}
