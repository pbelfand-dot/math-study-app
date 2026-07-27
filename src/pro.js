// THE LEAGUE — the pro career, one season at a time.
//
// Everything before this ran year by year and then handed the whole
// professional career to a single function that played it out in one shot and
// printed a summary. That is the wrong shape for the game this became: the
// years you were most invested in were the ones you had no say over.
//
// This is the same simulation, stepped. It deliberately shares career.js's
// season maths — boxScore, injuryRoll, the growth and decline curves, the award
// thresholds — because those are calibrated against published rates and a second
// hand-written copy would drift from them within a week. What is new is
// everything around a season: a draft night with a board, contracts that run
// out, free agency, trades, a team that is good or bad at basketball
// independently of you, and the decision to walk away.

import { clamp } from './roll.js';
import { defaultRng } from './rng.js';
import { potentialFor, draftOverallFor } from './overall.js';
import { traitsFor, traitEffects } from './traits.js';
import { fitFor, positionFor } from './overall.js';
import { randomTeam, randomName, TEAMS } from './names.js';
import {
  runDraft, boxScore, injuryRoll, REPLACEMENT, REPLACEMENT_FLOOR,
} from './career.js';

// Prefixed: the bundler flattens every module into one scope, so a private
// `round1` or `money` here collides with the identical one two files over.
const pr1 = (v) => Math.round(v * 10) / 10;
export const proMoney = (n) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n).toLocaleString()}`;

// ---------------------------------------------------------------------------
// Draft night
//
// A board, not a number. Sixty picks with names on them and yours somewhere in
// it, because "Pick #34" on its own tells you nothing about the room you walked
// into — who went ahead of you is the part you remember.
// ---------------------------------------------------------------------------
export function draftNight(build, life, rng = defaultRng) {
  const potential = potentialFor(build);
  const draftOvr = draftOverallFor(build);
  const result = runDraft(build, draftOvr, potential, rng);

  // The rest of the class. Ratings taper the way a real board does — a couple
  // of genuine stars at the top and a long flat tail after the lottery.
  const board = [];
  const used = new Set();
  for (let pick = 1; pick <= 60; pick++) {
    if (result.drafted && pick === result.pick) {
      board.push({ pick, you: true, name: life.name, team: null, grade: draftOvr });
      continue;
    }
    let nm = randomName(rng);
    let guard = 0;
    while (used.has(nm) && guard++ < 8) nm = randomName(rng);
    used.add(nm);
    board.push({
      pick, you: false, name: nm, team: null,
      grade: Math.round(clamp(78 - Math.log2(pick) * 6 + rng.gauss(0, 2.5), 40, 90)),
    });
  }
  // Teams pick in reverse order of how good they are, so a high pick lands you
  // somewhere bad. That is the trade at the top of a draft and it should be
  // visible: the worse the team, the more you play, the less you win.
  const order = rng.shuffle(TEAMS).slice(0, 30);
  board.forEach((row, i) => { row.team = order[i % order.length]; });

  const mine = board.find((r) => r.you);
  return {
    ...result,
    board,
    team: mine ? mine.team : randomTeam(rng),
    draftOvr,
    potential,
  };
}

// Rookie money is slotted by pick, the way it is in a real league — and being a
// high pick is worth a fortune before you have played a minute.
function rookieDeal(pick) {
  if (!pick) return { years: 2, salary: 1_100_000, type: 'Two-way' };
  const first = pick <= 30;
  const salary = Math.round(
    first ? 12_000_000 * Math.pow(0.93, pick) + 1_200_000 : 2_100_000 - (pick - 30) * 15_000,
  );
  return { years: first ? 4 : 3, salary, type: first ? 'Rookie scale' : 'Second round' };
}

// ---------------------------------------------------------------------------
// Starting a pro career
// ---------------------------------------------------------------------------
export function newPro(build, life, draft, rng = defaultRng) {
  const traits = traitsFor(build, rng);
  const eff = traitEffects(traits);
  const fit = fitFor(build);
  const we = build.mentals.workEthic;

  // Identical to the one-shot engine: how much of the ceiling actually arrives,
  // when the peak lands, and how fast the fall is once it does.
  const realization = clamp(
    (0.89 + (we - 50) * 0.0055 + fit * 0.12 + rng.gauss(0, 0.08)) * eff.growth,
    0.52, 1.14,
  );
  const realizedPeak = clamp(draft.draftOvr + (draft.potential - draft.draftOvr) * realization, 30, 99);
  const bigMan = build.height >= 82;
  const peakAge = 26 + (build.physicals.longevity - 50) * 0.06 + (bigMan ? 1 : 0) + eff.peakAge;
  const dependence =
    ((build.skills.speed + build.skills.dunk) / 2) /
    ((build.skills.three + build.skills.midrange + build.mentals.bballIQ) / 3);
  const declineRate =
    1.9 * clamp(dependence, 0.55, 2.4) * (1 - (build.physicals.longevity - 50) * 0.007) * eff.decline;

  return {
    name: life.name,
    build,
    traits: traits.map((t) => t.name),
    eff,
    fit,
    pos: positionFor(build.height).short,

    drafted: draft.drafted,
    pick: draft.pick,
    board: draft.board,
    signed: draft.signed,

    team: draft.team,
    // How good the team is at basketball without you. Rebuilt every time you
    // change teams, and it drifts on its own — the roster around you is not
    // something you control and pretending otherwise makes rings meaningless.
    teamStrength: clamp(Math.round(rng.gauss(draft.pick && draft.pick <= 10 ? 38 : 48, 11)), 18, 72),
    contract: rookieDeal(draft.drafted ? draft.pick : null),
    contractLeft: rookieDeal(draft.drafted ? draft.pick : null).years,
    // A signing advance, so the first offseason is not spent being told you
    // cannot afford anything by a team that has just guaranteed you millions.
    earnings: Math.round(rookieDeal(draft.drafted ? draft.pick : null).salary * 0.2),

    age: build.draftAge,
    rating: draft.drafted ? draft.draftOvr : draft.draftOvr - 3,
    realizedPeak,
    peakAge,
    declineRate,
    peak: draft.draftOvr,
    potential: draft.potential,

    injuryHistory: 0,
    speedLoss: 0,
    dunkLoss: 0,
    lastMinutes: 14,
    leaps: 0,
    morale: 60,
    fanLove: draft.drafted && draft.pick <= 14 ? 62 : 48,

    seasons: [],
    awards: { allStars: 0, allLeague: 0, mvps: 0, rings: 0, roty: 0, dpoy: 0 },
    totals: { points: 0, rebounds: 0, assists: 0, games: 0 },
    log: [],
    year: 0,
    pending: draft.drafted || draft.signed ? null : 'undrafted',
    retired: false,
    hof: false,
    offers: [],
    gameForm: 0,
    games: [],
    doneThisYear: [],
  };
}

// ---------------------------------------------------------------------------
// One season
// ---------------------------------------------------------------------------
export function playSeason(pro, rng = defaultRng) {
  const b = pro.build;
  const eff = pro.eff;
  const we = b.mentals.workEthic;
  const out = [];

  const effSpeed = clamp(b.skills.speed - pro.speedLoss, 25, 99);
  const effDunk = clamp(b.skills.dunk - pro.dunkLoss, 25, 99);

  // Growth then decline, gated on last season's minutes — the reason a young
  // player buried on a bench stops developing.
  let leapt = false;
  if (pro.year > 0 && pro.age < pro.peakAge) {
    const room = pro.realizedPeak - pro.rating;
    if (room > 0) {
      const youth = clamp(1.18 - (pro.age - 19) * 0.085, 0.16, 1.18);
      const playingTime = clamp(0.5 + pro.lastMinutes / 24, 0.5, 1.3);
      let gain = room * 0.27 * youth * playingTime * (0.9 + pro.morale / 500);
      if (pro.age <= 25 && rng.chance(0.11 * (0.6 + we / 90))) {
        gain += Math.abs(rng.gauss(2.6, 1.7));
        leapt = true;
        pro.leaps++;
      }
      pro.rating += gain + rng.gauss(0.25, 0.8);
    }
  } else if (pro.year > 0) {
    pro.rating -= pro.declineRate * (0.5 + 0.32 * (pro.age - pro.peakAge));
  }
  pro.rating -= (pro.speedLoss + pro.dunkLoss) * 0.06;
  pro.rating = clamp(pro.rating, 10, 99);
  pro.peak = Math.max(pro.peak, pro.rating);
  if (leapt) out.push({ kind: 'good', text: 'Something clicked over the summer. You came back a different player.' });

  const rating = pro.rating;
  let minutes = clamp((rating - 54) * 1.35 + (b.physicals.stamina - 50) * 0.09, 0, 38);

  const injury = injuryRoll(b, pro, minutes, eff, rng);
  let games = 82;
  if (injury) {
    games = Math.max(0, 82 - injury.games);
    pro.injuryHistory += injury.severity === 'severe' ? 2 : injury.severity === 'major' ? 1 : 0.4;
    if (injury.severity === 'severe') {
      pro.speedLoss += Math.abs(rng.gauss(5, 2.5));
      pro.dunkLoss += Math.abs(rng.gauss(4.5, 2.5));
    }
    minutes *= clamp(0.85 + rng.random() * 0.15, 0, 1);
    out.push({
      kind: injury.severity === 'severe' ? 'bad' : 'note',
      text: `${injury.kind[0].toUpperCase()}${injury.kind.slice(1)} — ${injury.games} games.`,
    });
  }

  // Form from the five games, same bounded band as school.
  const form = clamp(pro.gameForm ?? 0, -1, 1);
  const modBuild = { ...b, skills: { ...b.skills, speed: effSpeed, dunk: effDunk } };
  const box = boxScore(modBuild, rating, minutes, eff, pro.fit);
  box.ppg *= 1 + form * 0.25;
  box.apg *= 1 + form * 0.30;
  box.rpg *= 1 + form * 0.18;

  // The team wins games because of the roster AND you. A great player on a bad
  // team still loses, which is what makes where you sign matter.
  // Anchored on the one-shot engine's curve (41 wins at a league-average
  // player) with the roster term added around it, so a title stays as hard as
  // the published rate says while WHERE you sign finally matters. Built from
  // scratch instead, it produced 1.3% championships against a 3.3% target.
  const wins = clamp(
    Math.round(
      41 +
        (pro.teamStrength - 48) * 0.5 +
        ((rating - 58) * 0.7 + (b.mentals.coachability - 50) * 0.06 + rng.gauss(0, 6)) *
          eff.teamSuccess,
    ),
    9, 73,
  );
  const playoffs = wins >= 43 + rng.int(4);

  let allStar = false;
  let mvp = false;
  let ring = false;
  if (rating >= 76 && minutes >= 24 && games >= 50) {
    allStar = rng.chance(clamp((rating - 76) / 11, 0.03, 0.96));
  }
  if (allStar) {
    pro.awards.allStars++;
    if (rating >= 84 && rng.chance(clamp((rating - 82) / 28, 0.03, 0.6))) pro.awards.allLeague++;
  }
  if (allStar && rating >= 88 && wins >= 52 && games >= 62) {
    mvp = rng.chance(clamp((rating - 88) / 7, 0.05, 0.85));
    if (mvp) pro.awards.mvps++;
  }
  if (playoffs) {
    const strength = clamp((wins - 41) / 32, 0, 1);
    // Higher than the one-shot engine's curve on purpose. There, every team's
    // record was derived from the player's own rating, so good players were
    // always on good teams; here the roster is independent, which spreads
    // players across worse teams and dropped titles to 1.8% against a 3.3%
    // target until this was lifted to compensate.
    ring = rng.chance(clamp(0.018 + strength ** 2 * 0.38, 0, 0.42) * eff.titleOdds);
    if (ring) pro.awards.rings++;
  }
  // Rookie of the year, which the one-shot engine never had.
  if (pro.year === 0 && minutes >= 22 && games >= 55 && rng.chance(clamp((rating - 62) / 26, 0.01, 0.7))) {
    pro.awards.roty++;
    out.push({ kind: 'good', text: 'Rookie of the Year.' });
  }
  if (allStar) out.push({ kind: 'good', text: 'All-Star selection.' });
  if (mvp) out.push({ kind: 'good', text: 'Most Valuable Player.' });
  if (ring) out.push({ kind: 'good', text: `Champions. ${pro.team} win it.` });

  const season = {
    year: pro.year + 1,
    age: pro.age,
    team: pro.team,
    rating: Math.round(rating),
    games,
    mpg: pr1(minutes),
    ppg: pr1(box.ppg),
    rpg: pr1(box.rpg),
    apg: pr1(box.apg),
    spg: pr1(box.spg),
    bpg: pr1(box.bpg),
    ts: box.ts,
    wins,
    playoffs,
    allStar, mvp, ring,
    salary: pro.contract.salary,
    events: out,
  };
  pro.seasons.push(season);
  pro.totals.points += box.ppg * games;
  pro.totals.rebounds += box.rpg * games;
  pro.totals.assists += box.apg * games;
  pro.totals.games += games;
  pro.earnings += pro.contract.salary;

  // Morale, fan love, and the roster drifting around you.
  pro.morale = clamp(pro.morale + (playoffs ? 6 : -4) + (minutes > 24 ? 5 : -6) + (ring ? 15 : 0), 0, 100);
  pro.fanLove = clamp(pro.fanLove + (allStar ? 9 : 0) + (ring ? 12 : 0) + (minutes > 26 ? 3 : -3), 0, 100);
  pro.teamStrength = clamp(pro.teamStrength + rng.gauss(0, 6) + (playoffs ? 1 : 3), 15, 78);

  pro.lastMinutes = minutes;
  pro.age++;
  pro.year++;
  pro.contractLeft--;
  pro.gameForm = 0;
  pro.games = [];
  pro.doneThisYear = [];

  // What happens next: retire, negotiate, or hit the market.
  const done = pro.rating < REPLACEMENT_FLOOR || pro.age > 40;
  if (done) pro.pending = 'retire';
  else if (pro.contractLeft <= 0) pro.pending = 'freeagency';
  else if (rng.chance(0.08 * eff.tradeFreq)) pro.pending = 'trade';
  return season;
}

// ---------------------------------------------------------------------------
// Money
//
// What a team will pay is a function of what you are now and how old you are.
// The max exists so a superstar contract feels like one, and the floor exists
// so a fringe player is choosing between real minimums rather than nothing.
// ---------------------------------------------------------------------------
export function marketValue(pro, rng = defaultRng) {
  const r = pro.rating;
  const age = pro.age;
  const base =
    r >= 88 ? 48e6 : r >= 82 ? 38e6 : r >= 77 ? 28e6 : r >= 72 ? 18e6 :
    r >= 68 ? 10e6 : r >= 64 ? 5e6 : r >= 60 ? 2.4e6 : 1.1e6;
  const ageMult = clamp(1.15 - Math.max(0, age - 29) * 0.09, 0.35, 1.15);
  return Math.round(base * ageMult * (0.9 + rng.random() * 0.2));
}

// Four offers with genuinely different shapes, so free agency is a decision
// rather than a list sorted by salary.
export function freeAgencyOffers(pro, rng = defaultRng) {
  const value = marketValue(pro, rng);
  const offers = [];
  const teamsUsed = new Set([pro.team]);
  const pickTeam = () => {
    let t = randomTeam(rng);
    let guard = 0;
    while (teamsUsed.has(t) && guard++ < 10) t = randomTeam(rng);
    teamsUsed.add(t);
    return t;
  };

  // Your own team, if they want you. They pay a little over the odds for
  // somebody the building already knows.
  if (pro.fanLove > 35 || pro.rating >= 70) {
    offers.push({
      team: pro.team, stay: true,
      salary: Math.round(value * 1.08), years: pro.age < 30 ? 4 : 2,
      strength: pro.teamStrength,
      note: 'They know you here. The extra year is the point.',
    });
  }
  // A contender that cannot pay.
  offers.push({
    team: pickTeam(),
    salary: Math.round(value * 0.55), years: 2,
    strength: clamp(Math.round(rng.gauss(66, 5)), 55, 78),
    note: 'They win sixty games and they are offering you the taxpayer exception.',
  });
  // A rebuild that will pay anything.
  offers.push({
    team: pickTeam(),
    salary: Math.round(value * 1.35), years: pro.age < 31 ? 4 : 3,
    strength: clamp(Math.round(rng.gauss(30, 6)), 15, 45),
    note: 'Twenty-two wins and all the money in the world. You would be the whole offence.',
  });
  // The middle.
  offers.push({
    team: pickTeam(),
    salary: value, years: 3,
    strength: clamp(Math.round(rng.gauss(50, 6)), 35, 62),
    note: 'A playoff team that needs one more piece and thinks it is you.',
  });
  return offers.sort((a, b) => b.salary - a.salary);
}

export function signWith(pro, offer) {
  const moved = offer.team !== pro.team;
  pro.earnings += Math.round(offer.salary * 0.2);
  pro.team = offer.team;
  pro.teamStrength = offer.strength;
  pro.contract = { years: offer.years, salary: offer.salary, type: 'Free agency' };
  pro.contractLeft = offer.years;
  pro.pending = null;
  if (moved) { pro.fanLove = 50; pro.morale = clamp(pro.morale + 4, 0, 100); }
  return pro;
}

export function acceptTrade(pro, rng = defaultRng) {
  let t = randomTeam(rng);
  let guard = 0;
  while (t === pro.team && guard++ < 8) t = randomTeam(rng);
  pro.team = t;
  pro.teamStrength = clamp(Math.round(rng.gauss(48, 13)), 15, 78);
  pro.fanLove = 48;
  pro.morale = clamp(pro.morale - 8, 0, 100);
  pro.pending = null;
  return pro;
}

// ---------------------------------------------------------------------------
// The end
// ---------------------------------------------------------------------------
// Measured, not chosen: the bar that puts roughly one in two hundred players
// who reach the league into the Hall. At 58 it inducted 2.8% of them, which is
// not a Hall of Fame, it is a long list.
const HOF_BAR = 148;
export function retire(pro) {
  pro.retired = true;
  pro.pending = null;
  const a = pro.awards;
  const g = Math.max(1, pro.totals.games);
  pro.careerAverages = {
    ppg: pr1(pro.totals.points / g),
    rpg: pr1(pro.totals.rebounds / g),
    apg: pr1(pro.totals.assists / g),
  };
  // Same shape as the one-shot engine's Hall test: peak, hardware and longevity.
  const score =
    a.mvps * 30 + a.allLeague * 9 + a.allStars * 5 + a.rings * 6 +
    Math.max(0, pro.peak - 78) * 2.2 + pro.seasons.length * 0.7;
  pro.hofScore = Math.round(score);
  pro.hof = score >= HOF_BAR;
  return pro;
}

export const careerLine = (pro) => {
  const g = Math.max(1, pro.totals.games);
  return `${pr1(pro.totals.points / g)} / ${pr1(pro.totals.rebounds / g)} / ${pr1(pro.totals.assists / g)}`;
};

// ---------------------------------------------------------------------------
// The offseason
//
// Short on purpose. A pro's year is not a menu of twelve things — it is a body
// to maintain, a game to sharpen, and a handful of decisions with real money
// attached. Everything here is once a year and most of it costs something.
// ---------------------------------------------------------------------------
export const PRO_ACTIONS = [
  {
    id: 'skillwork', name: 'Add something to your game', blurb: 'A summer on one thing you cannot do.',
    cost: 0,
    show: (p) => p.rating < p.realizedPeak + 3,
    run: (p, rng) => {
      // Nudges the ceiling itself, which is the only thing that beats a decline
      // curve. Small, because at this level nobody adds a jump shot in a summer.
      const add = 0.9 + rng.random() * 1.6;
      p.realizedPeak = clamp(p.realizedPeak + add, 30, 99);
      return { kind: 'good', text: `Spent the summer adding to your game. Ceiling +${add.toFixed(1)}.` };
    },
  },
  {
    id: 'bodywork', name: 'Full offseason programme', blurb: 'Sleep, food, load management, all of it.',
    cost: 250_000,
    run: (p, rng) => {
      p.injuryHistory = Math.max(0, p.injuryHistory - 0.8);
      p.build.physicals.durability = clamp(p.build.physicals.durability + 2, 10, 99);
      p.morale = clamp(p.morale + 6, 0, 100);
      return { kind: 'good', text: 'A proper offseason. The body feels ten years younger than it is.' };
    },
  },
  {
    id: 'surgery', name: 'Get it cleaned up', blurb: 'The thing you have been playing through.',
    cost: 900_000,
    show: (p) => p.injuryHistory > 1.2,
    run: (p) => {
      p.injuryHistory = Math.max(0, p.injuryHistory - 2);
      p.speedLoss = Math.max(0, p.speedLoss - 3);
      return { kind: 'good', text: 'Surgery, then a real rehab. It has stopped catching.' };
    },
  },
  {
    id: 'rest', name: 'Do nothing at all', blurb: 'Free, and underrated.',
    cost: 0,
    run: (p) => {
      p.morale = clamp(p.morale + 10, 0, 100);
      p.injuryHistory = Math.max(0, p.injuryHistory - 0.4);
      return { kind: 'note', text: 'Took the summer off. Came back a person.' };
    },
  },
  {
    id: 'endorse', name: 'Sign an endorsement', blurb: 'A shoe, a drink, a car dealership.',
    cost: 0,
    show: (p) => p.fanLove > 45,
    run: (p, rng) => {
      const deal = Math.round((p.fanLove / 100) ** 2 * 26e6 * (0.5 + rng.random()) + 120_000);
      p.earnings += deal;
      p.endorsements = (p.endorsements || 0) + deal;
      return { kind: 'good', text: `Endorsement signed — ${proMoney(deal)}.` };
    },
  },
  {
    id: 'community', name: 'Put your name on something', blurb: 'A gym, a scholarship, a foundation.',
    cost: 400_000,
    run: (p) => {
      p.fanLove = clamp(p.fanLove + 11, 0, 100);
      p.morale = clamp(p.morale + 5, 0, 100);
      return { kind: 'good', text: 'Opened a gym in the neighbourhood you came from.' };
    },
  },
  {
    id: 'trade demand', name: 'Ask to be traded', blurb: 'You are wasting years here.',
    cost: 0,
    show: (p) => p.teamStrength < 42 && p.rating > 70,
    run: (p, rng) => {
      p.fanLove = clamp(p.fanLove - 18, 0, 100);
      p.pending = 'trade';
      return { kind: 'bad', text: 'You asked out. It leaked within the hour.' };
    },
  },
];

export const proActions = (pro) =>
  PRO_ACTIONS.filter((a) => !pro.doneThisYear.includes(a.id) && (!a.show || a.show(pro)));

export function doProAction(pro, a, rng = defaultRng) {
  if ((a.cost || 0) > pro.earnings) return null;
  pro.earnings -= a.cost || 0;
  const line = a.run(pro, rng) || { kind: 'note', text: a.name };
  pro.doneThisYear.push(a.id);
  pro.log.push(line);
  return line;
}
