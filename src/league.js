// THE LEAGUE AROUND YOU — reputation, trouble, media, money out, and the world.
//
// Everything here exists to make one principle true, which is the principle the
// design document opens with: every choice should cost something that matters
// somewhere else. A presser that only moves "reputation" is a menu. A presser
// that moves Fans up, Front Office down and Teammates either way depending on
// whether they agreed with you is a decision.
//
// Five reputation meters, not one. That split alone is most of the perceived
// depth — the same action reads completely differently to the people who sign
// your cheques and the people who buy your shoes.

import { clamp } from './roll.js';
import { defaultRng } from './rng.js';
import { randomName, randomTeam } from './names.js';

const lgCash = (n) =>
  Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n).toLocaleString()}`;

// ---------------------------------------------------------------------------
// Reputation
// ---------------------------------------------------------------------------
export const REP_METERS = [
  ['fans', 'Fans', 'Ticket sales, jersey sales, All-Star votes.'],
  ['teammates', 'Teammates', 'Whether the locker room is with you.'],
  ['frontOffice', 'Front Office', 'Whether they extend you or move you.'],
  ['media', 'Media', 'Award votes, and how a bad night gets written.'],
  ['leagueOffice', 'League Office', 'Fines, suspensions, and how long they last.'],
];

export const newRep = (rng = defaultRng) => ({
  fans: 50 + rng.int(10),
  teammates: 50 + rng.int(10),
  frontOffice: 52 + rng.int(8),
  media: 48 + rng.int(10),
  leagueOffice: 62 + rng.int(10),
});

export function moveRep(pro, deltas) {
  pro.rep = pro.rep || newRep();
  for (const [k, v] of Object.entries(deltas)) {
    pro.rep[k] = clamp(pro.rep[k] + v, 0, 100);
  }
  return pro.rep;
}

// A short readable summary of a rep change, so the log says who noticed.
export function repLine(deltas) {
  const names = Object.fromEntries(REP_METERS.map(([k, label]) => [k, label]));
  return Object.entries(deltas)
    .filter(([, v]) => v)
    .map(([k, v]) => `${names[k]} ${v > 0 ? '+' : ''}${v}`)
    .join(', ');
}

// ---------------------------------------------------------------------------
// Money out — where careers actually die
//
// Everybody models the salary. Almost nobody models what is left. The first
// paycheck breakdown is a genuinely memorable moment and it costs nothing to
// build, and after that the burn rate is a live number that can end you.
// ---------------------------------------------------------------------------
export const TAX = {
  federal: 0.37,
  escrow: 0.10,
  agent: 0.03,
  union: 0.0025,
};

// State tax varies wildly by market, which is the point: the same offer is
// worth meaningfully different amounts in two different cities, so free agency
// gains a financial dimension and the player learns something true.
const STATE_TAX = {
  'Miami Swelter': 0, 'Dallas Wranglers': 0, 'Houston Launch': 0, 'Memphis Kodiaks': 0,
  'Orlando Illusion': 0, 'Seattle Rainmakers': 0, 'Salt Lake Ragtime': 0.0465,
  'Los Angeles Schooners': 0.133, 'Los Angeles Lagoons': 0.133, 'Sacramento Regents': 0.133,
  'Golden Gate Guardians': 0.133, 'New York Bricklayers': 0.109, 'Brooklyn Baskets': 0.109,
  'Portland Trailhead': 0.099, 'Minnesota Timber': 0.0985, 'New Orleans Herons': 0.0425,
};
export const stateTaxFor = (team) => STATE_TAX[team] ?? 0.05;

export function paycheck(pro, gross) {
  const state = stateTaxFor(pro.team);
  const rows = [
    ['Gross salary', gross],
    ['Federal income tax', -gross * TAX.federal],
    [`State tax (${(state * 100).toFixed(1)}%)`, -gross * state],
    ['Escrow withheld', -gross * TAX.escrow],
    ['Agent fee', -gross * TAX.agent],
    ['Union dues', -gross * TAX.union],
  ];
  const net = rows.reduce((a, [, v]) => a + v, 0);
  return { rows, net: Math.round(net), rate: 1 - net / gross };
}

// Things you buy that keep costing. Upkeep is the number that kills people.
export const PURCHASES = [
  { id: 'car', name: 'A car worth talking about', price: 320_000, upkeep: 26_000, fans: 2,
    blurb: 'Insurance on it costs more than most people earn.' },
  { id: 'house', name: 'A house for your mother', price: 1_600_000, upkeep: 70_000, fans: 6, joy: 14,
    blurb: 'The one purchase nobody ever regrets.' },
  { id: 'mansion', name: 'Somewhere with a gate', price: 8_500_000, upkeep: 420_000, fans: 4,
    blurb: 'Property tax, staff, and a pool nobody swims in.' },
  { id: 'jewelry', name: 'Jewellery', price: 900_000, upkeep: 18_000, fans: 3,
    blurb: 'Depreciates the moment it leaves the case.' },
  { id: 'jet', name: 'A jet', price: 22_000_000, upkeep: 2_400_000, fans: 2,
    blurb: 'The single fastest way anyone has ever gone broke.' },
];

export const INVESTMENTS = [
  { id: 'restaurant', name: 'A restaurant', price: 1_200_000, mean: 0.82, sd: 0.55,
    blurb: 'Everyone does this. Almost nobody makes money.' },
  { id: 'carwash', name: 'Car wash chain', price: 900_000, mean: 1.14, sd: 0.28,
    blurb: 'Boring, unglamorous, quietly works.' },
  { id: 'realestate', name: 'Commercial property', price: 4_000_000, mean: 1.22, sd: 0.4,
    blurb: 'Slow, dull, and the thing rich people actually do.' },
  { id: 'startup', name: 'A tech startup', price: 2_000_000, mean: 0.95, sd: 1.9,
    blurb: 'Your cousin knows a guy. It is either nothing or everything.' },
  { id: 'crypto', name: 'Whatever your barber recommended', price: 1_500_000, mean: 0.72, sd: 2.4,
    blurb: 'You already know how this ends. You are going to do it anyway.' },
  { id: 'friend', name: "A friend's business", price: 600_000, mean: 0.55, sd: 0.5,
    blurb: 'This is not an investment and you know it.' },
];

// Three tiers of advisor. The cheap one has a real chance of being a fraud,
// which is ruthless and completely true to life.
export const ADVISORS = [
  { id: 'cousin', name: 'Your cousin, who did a course', fee: 0, quality: 0.72, fraud: 0.16,
    blurb: 'Free. There is a reason it is free.' },
  { id: 'boutique', name: 'A boutique firm', fee: 180_000, quality: 1.0, fraud: 0.03,
    blurb: 'Competent, attentive, expensive enough to notice.' },
  { id: 'bank', name: 'A private bank', fee: 600_000, quality: 1.18, fraud: 0.002,
    blurb: 'They have managed money for a hundred years. They will not lose yours.' },
];

// ---------------------------------------------------------------------------
// Trouble
//
// The doc is right that this is where the drama per line of code is highest.
// Consequences are severe and asymmetric on purpose: the upside of the bad
// choice is real money and the downside can end the career outright.
// ---------------------------------------------------------------------------
export const TROUBLE = [
  {
    id: 'gamble1', chain: 'gambling', step: 1, weight: 8,
    when: (p) => p.year >= 1,
    title: 'A question from home',
    text: (p) => `A friend from home asks how the ankle really feels. Not concerned — specific. He asks twice.`,
    options: [
      { label: 'Tell him the truth', run: (p, rng) => { p.gamblingStep = 1; return { kind: 'note', text: 'You told him. It felt like nothing at the time.' }; } },
      { label: 'Say you are fine', run: () => ({ kind: 'note', text: 'You said you were fine and changed the subject.' }) },
      { label: 'Ask why he wants to know', run: (p) => { moveRep(p, { teammates: 2 }); return { kind: 'good', text: 'You asked why. He laughed it off and did not ask again.' }; } },
    ],
  },
  {
    id: 'gamble2', chain: 'gambling', step: 2, weight: 9,
    when: (p) => p.gamblingStep >= 1,
    title: 'An offer',
    text: () => 'Somebody offers you $50,000 for advance word on whether you are playing tomorrow. Just that. Nothing about the game itself.',
    options: [
      { label: 'Take the money', run: (p, rng) => { p.gamblingStep = 2; p.earnings += 50_000; return { kind: 'bad', text: 'You took $50,000 for a text message. It was the easiest money you have ever made.' }; } },
      { label: 'Refuse', run: (p) => { p.gamblingStep = 0; moveRep(p, { leagueOffice: 4 }); return { kind: 'good', text: 'You said no, and you stopped answering that number.' }; } },
      { label: 'Report it', run: (p) => { p.gamblingStep = 0; moveRep(p, { leagueOffice: 15, fans: 4, teammates: -6 }); return { kind: 'good', text: 'You reported it. The league was delighted. The locker room thought it was a lot.' }; } },
    ],
  },
  {
    id: 'gamble3', chain: 'gambling', step: 3, weight: 10,
    when: (p) => p.gamblingStep >= 2,
    title: 'The room upstairs',
    text: () => 'The private game is in a hotel suite and the buy-in is more than most people earn in a year. Two people in the room you recognise from television.',
    options: [
      { label: 'Sit down', run: (p, rng) => {
        p.gamblingStep = 3;
        const won = rng.chance(0.42);
        const amt = Math.round(180_000 * (0.5 + rng.random() * 1.5));
        p.earnings += won ? amt : -amt;
        return { kind: won ? 'good' : 'bad', text: won ? `You won ${lgCash(amt)}. You will be back.` : `You lost ${lgCash(amt)} in one night, and you will be back anyway.` };
      } },
      { label: 'Go home', run: (p) => { p.gamblingStep = 1; return { kind: 'note', text: 'You went home. Somebody made a joke about it that was not really a joke.' }; } },
    ],
  },
  {
    id: 'gamble4', chain: 'gambling', step: 4, weight: 12,
    when: (p) => p.gamblingStep >= 3,
    title: 'Come out early',
    text: () => 'You are asked — carefully, by somebody who is not asking — to come out of tomorrow\'s game in the third quarter. There is a number attached and it has six figures in it.',
    options: [
      { label: 'Do it', run: (p, rng) => {
        p.earnings += 400_000;
        p.gamblingStep = 4;
        // The end of the line. A real investigation, and a real chance the
        // career simply stops here.
        if (rng.chance(0.45)) {
          p.banned = true;
          moveRep(p, { leagueOffice: -100, fans: -60, media: -50, frontOffice: -70 });
          return { kind: 'bad', text: 'You came out early. Eleven months later the league banned you for life. That is the whole story now.' };
        }
        moveRep(p, { leagueOffice: -25 });
        return { kind: 'bad', text: 'You came out early and took the money. Nobody has said anything yet. Yet.' };
      } },
      { label: 'Refuse and say nothing', run: (p) => { p.gamblingStep = 2; return { kind: 'note', text: 'You refused. You also did not tell anybody, which you will think about later.' }; } },
      { label: 'Report the whole thing', run: (p, rng) => {
        p.gamblingStep = 0;
        const exposed = rng.chance(0.5);
        moveRep(p, { leagueOffice: 20, media: exposed ? -10 : 5, fans: exposed ? -8 : 6 });
        return { kind: exposed ? 'bad' : 'good', text: exposed
          ? 'You reported it, and the investigation found what you had already taken. It was survivable. Barely.'
          : 'You reported it and cooperated fully. The league remembered.' };
      } },
    ],
  },
  {
    id: 'techs', weight: 8,
    when: (p) => (p.techs || 0) >= 12,
    title: 'Sixteen',
    text: (p) => `That is your sixteenth technical foul. One more game suspension, and another every two after it.`,
    options: [
      { label: 'Rein it in', run: (p) => { p.techs = 8; moveRep(p, { leagueOffice: 6, media: -2 }); return { kind: 'note', text: 'You stopped arguing. It cost you something on the floor and you know it.' }; } },
      { label: 'This is who I am', run: (p) => { moveRep(p, { fans: 6, leagueOffice: -10 }); return { kind: 'bad', text: 'You did not change a thing. The fines became a line item.' }; } },
    ],
  },
  {
    id: 'supplement', weight: 6,
    when: (p) => p.year >= 2,
    title: 'The supplement',
    text: () => 'Your trainer swears it is clean. It is not on any list he has seen. He has been right about everything else.',
    options: [
      { label: 'Take it', run: (p, rng) => {
        if (rng.chance(0.18)) {
          p.suspendedGames = 25;
          moveRep(p, { leagueOffice: -30, media: -18, fans: -12 });
          return { kind: 'bad', text: 'Twenty-five games. The appeal went nowhere and the word follows you for the rest of it.' };
        }
        p.morale = clamp(p.morale + 8, 0, 100);
        return { kind: 'good', text: 'You felt better than you have in two years, and nothing ever came of it.' };
      } },
      { label: 'Have it tested first', run: (p) => { moveRep(p, { leagueOffice: 3 }); return { kind: 'note', text: 'You had it tested. It came back clean and you had already missed the window.' }; } },
      { label: 'Do not touch it', run: () => ({ kind: 'note', text: 'You left it in the box.' }) },
    ],
  },
  {
    id: 'legal', weight: 6,
    when: (p) => p.year >= 1 && (p.rep?.leagueOffice ?? 60) < 70,
    title: 'Three in the morning',
    text: () => 'You are stopped on the way home from somewhere you should have left three hours earlier.',
    options: [
      { label: 'Cooperate completely', run: (p, rng) => {
        const charged = rng.chance(0.35);
        moveRep(p, { fans: charged ? -14 : -4, media: charged ? -12 : -3, leagueOffice: charged ? -18 : -5, frontOffice: charged ? -12 : -3 });
        if (charged) p.lostEndorsement = true;
        return { kind: 'bad', text: charged
          ? 'Charged. Two sponsors terminated inside a week and the league is deciding what to do.'
          : 'No charges. It still ran everywhere for a day and a half.' };
      } },
      { label: 'Say nothing without a lawyer', run: (p, rng) => {
        moveRep(p, { fans: -8, media: -10, leagueOffice: -4 });
        return { kind: 'note', text: 'You said nothing. It looked worse and cost you less.' };
      } },
    ],
  },
  {
    id: 'holdout', weight: 5,
    when: (p) => p.contractLeft >= 1 && p.rating >= 76 && (p.rep?.frontOffice ?? 50) < 60,
    title: 'Camp starts Monday',
    text: () => 'Your agent thinks the deal you are on is two years and thirty million light. He thinks you should not get on the plane.',
    options: [
      { label: 'Hold out', run: (p, rng) => {
        const worked = rng.chance(0.4);
        moveRep(p, { frontOffice: worked ? -6 : -20, teammates: -10, fans: -8 });
        if (worked) { p.contract.salary = Math.round(p.contract.salary * 1.35); return { kind: 'good', text: 'Eleven days of fines and they reworked it. Your agent was right.' }; }
        p.earnings -= 900_000;
        return { kind: 'bad', text: 'You missed camp, paid the fines, and signed the same deal you already had.' };
      } },
      { label: 'Report to camp', run: (p) => { moveRep(p, { frontOffice: 8, teammates: 6 }); return { kind: 'note', text: 'You turned up. The building noticed that too.' }; } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------
export const MEDIA_ACTIONS = [
  {
    id: 'presser', name: 'Postgame presser', blurb: 'Cameras, and a question you do not like.', cost: 0,
    options: [
      { label: 'Take the blame', rep: { teammates: 8, media: 5, fans: 2 }, text: 'You took it all yourself. The room went quiet.' },
      { label: 'Credit your teammates', rep: { teammates: 6, fans: 3 }, text: 'You gave it all to them and meant it.' },
      { label: 'Call out the coach', rep: { fans: 6, media: 9, frontOffice: -14, teammates: -4 }, text: 'You said it on camera. It led every show for two days.' },
      { label: 'Blame the officiating', rep: { fans: 4, leagueOffice: -12, media: -3 }, text: 'A $35,000 fine arrived before you got home.', fine: 35_000 },
      { label: 'One-word answers', rep: { media: -8, fans: -2 }, text: 'You gave them nothing. They wrote about that instead.' },
    ],
  },
  {
    id: 'social', name: 'Post something', blurb: 'You have the app open and a thought.', cost: 0,
    options: [
      { label: 'A cryptic emoji', rep: { fans: 5, media: 6, frontOffice: -3 }, text: 'Four hundred thousand people decided what it meant by lunchtime.' },
      { label: 'Subtweet a teammate', rep: { fans: 3, media: 8, teammates: -16 }, text: 'Everyone knew who it was about, including him.' },
      { label: 'Unfollow the team account', rep: { fans: 7, media: 12, frontOffice: -16 }, text: 'A beat writer noticed within nine minutes.' },
      { label: 'Like a post about a rival team', rep: { media: 10, fans: 2, frontOffice: -9 }, text: 'The classic. You claimed it was an accident. Nobody believed you.' },
      { label: 'Post nothing at all', rep: {}, text: 'You closed the app. Nothing happened, which was the idea.' },
    ],
  },
  {
    id: 'podcast', name: 'Start a podcast', blurb: 'Your own show, your own words.', cost: 60_000, once: true,
    options: [
      { label: 'Talk basketball', rep: { fans: 8, media: 7 }, text: 'It is good. People listen.', income: 900_000 },
      { label: 'Say the quiet part', rep: { fans: 14, media: 16, frontOffice: -18, leagueOffice: -6 }, text: 'You said something you cannot take back and the numbers tripled.', income: 2_400_000 },
    ],
  },
  {
    id: 'debate', name: 'Go on the debate show', blurb: 'They want you to say something.', cost: 0,
    options: [
      { label: 'Give them the quote', rep: { fans: 7, media: 11, teammates: -5, frontOffice: -6 }, text: 'They ran the clip for a week.' },
      { label: 'Be diplomatic', rep: { media: -4, frontOffice: 4 }, text: 'You said nothing memorable, which was the whole plan.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// The living league
// ---------------------------------------------------------------------------
export function makeRival(pro, rng = defaultRng) {
  return {
    name: randomName(rng),
    team: randomTeam(rng),
    // Drafted alongside you, and his career runs parallel to yours forever.
    rating: clamp(Math.round((pro.rating || 65) + rng.gauss(2, 4)), 45, 92),
    awards: { allStars: 0, mvps: 0, rings: 0 },
  };
}

export function stepRival(rival, pro, rng = defaultRng) {
  const peak = 27;
  rival.rating = clamp(
    rival.rating + (pro.age < peak ? rng.gauss(1.6, 1.2) : rng.gauss(-1.4, 1.1)),
    35, 99,
  );
  const lines = [];
  if (rival.rating >= 78 && rng.chance(0.45)) { rival.awards.allStars++; lines.push(`${rival.name} made another All-Star team.`); }
  if (rival.rating >= 88 && rng.chance(0.12)) { rival.awards.mvps++; lines.push(`${rival.name} won MVP.`); }
  if (rng.chance(0.06)) { rival.awards.rings++; lines.push(`${rival.name} won a championship. You watched it.`); }
  return lines;
}

const NEWS = [
  (rng) => `${randomTeam(rng)} fire their head coach after a 4-14 start.`,
  (rng) => `${randomName(rng)} requests a trade from the ${randomTeam(rng)}.`,
  (rng) => `${randomTeam(rng)} and ${randomTeam(rng)} complete a three-team deal nobody understands.`,
  (rng) => `${randomName(rng)} tears an achilles. He is 29.`,
  (rng) => `The ${randomTeam(rng)} are over the second apron and cannot add a player.`,
  (rng) => `${randomName(rng)} signs the largest deal in league history.`,
  (rng) => `${randomTeam(rng)} announce a new arena and a relocation study.`,
  (rng) => `${randomName(rng)} is suspended 25 games under the substance policy.`,
  (rng) => `${randomName(rng)} retires at 34 after twelve seasons.`,
  (rng) => `A ${randomTeam(rng)} assistant is hired away as a head coach.`,
  (rng) => `${randomName(rng)} drops 61 and the league cannot stop talking about it.`,
  (rng) => `The ${randomTeam(rng)} owner sells to a group nobody has heard of.`,
  (rng) => `${randomName(rng)} is fined for public criticism of the officiating.`,
  (rng) => `Expansion talks are reported. Two cities are named and neither is yours.`,
  (rng) => `${randomTeam(rng)} win 19 in a row and everybody has an opinion about why.`,
];

export const leagueNews = (rng, n = 3) =>
  rng.shuffle(NEWS).slice(0, n).map((f) => f(rng));

// ---------------------------------------------------------------------------
// After it ends
// ---------------------------------------------------------------------------
export const POST_CAREER = [
  { id: 'analyst', name: 'Television analyst', pay: 2_200_000,
    need: (p) => (p.rep?.media ?? 50) >= 55, blurb: 'They liked you on camera and they are still paying for it.' },
  { id: 'assistant', name: 'Assistant coach', pay: 900_000,
    need: (p) => (p.rep?.teammates ?? 50) >= 55, blurb: 'Four in the morning, film, and a whistle.' },
  { id: 'frontoffice', name: 'Front office', pay: 1_400_000,
    need: (p) => (p.rep?.frontOffice ?? 50) >= 60, blurb: 'The other side of the table, finally.' },
  { id: 'agent', name: 'Become an agent', pay: 1_800_000,
    need: (p) => (p.rep?.frontOffice ?? 50) >= 45, blurb: 'You know exactly how this works now.' },
  { id: 'owner', name: 'Buy into a team', pay: 4_500_000,
    need: (p) => p.earnings >= 120e6, blurb: 'A minority stake and a seat nobody can take.' },
  { id: 'aau', name: 'Run an AAU programme', pay: 220_000,
    need: () => true, blurb: 'Back where it started, on the other side of it.' },
  { id: 'podcast', name: 'Podcast full time', pay: 1_100_000,
    need: (p) => (p.rep?.fans ?? 50) >= 55, blurb: 'Three hours a week and nobody to answer to.' },
  { id: 'nothing', name: 'Nothing at all', pay: 0,
    need: () => true, blurb: 'You have enough. You have earned the quiet.' },
];

export const postCareerFor = (pro) => POST_CAREER.filter((p) => p.need(pro));

// The offseason, month by month. Same code pattern as one screen, six times the
// content — which is the cheapest depth in the whole document.
export const CALENDAR = [
  { id: 'exit', month: 'April', label: 'Exit interview', blurb: 'The coach asks how you think it went.' },
  { id: 'draft', month: 'June', label: 'Draft night', blurb: 'Your team picks somebody who plays where you play.' },
  { id: 'fa', month: 'July 1', label: 'Free agency opens', blurb: 'Phones start at midnight.' },
  { id: 'summer', month: 'July', label: 'Summer', blurb: 'Recruiting, summer league, the player movement feed.' },
  { id: 'training', month: 'August', label: 'Training block', blurb: 'The work that decides next season.' },
  { id: 'mediaday', month: 'September', label: 'Media day', blurb: 'Cameras, and the extension window.' },
];
