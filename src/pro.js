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
import {
  newRep, moveRep, repLine, makeRival, stepRival, leagueNews, TROUBLE, paycheck,
  PURCHASES, INVESTMENTS, ADVISORS, MEDIA_ACTIONS,
} from './league.js';

// ---------------------------------------------------------------------------
// The cap
//
// One number that everything else is a percentage of, so the whole economy can
// be moved by editing a single line. Figures are the shape of a modern
// basketball CBA rather than any particular league's published table — this is
// an invented league and the numbers are here because the STRUCTURE is what
// makes the decisions interesting, not the exact dollars.
// ---------------------------------------------------------------------------
export const CAP = 165_000_000;
export const MIN_SALARY = Math.round(CAP * 0.0082);

// Max contract tiers by years of service. The jumps are the whole point: they
// convert an AWARD into MONEY, which is what makes an award worth chasing
// beyond a line in a summary screen.
export const MAX_TIERS = [
  { minYears: 10, pct: 0.35, label: '35% max' },
  { minYears: 7, pct: 0.30, label: '30% max' },
  { minYears: 0, pct: 0.25, label: '25% max' },
];

export const maxFor = (years, bumped) => {
  const tier = MAX_TIERS.find((t) => years >= t.minYears);
  // The two escalators. A player in his first six years jumps a tier by winning
  // something; a seven-to-nine-year player jumps to the top tier the same way
  // but only with the team that drafted him.
  const pct = bumped ? Math.min(0.35, tier.pct + 0.05) : tier.pct;
  return { salary: Math.round(CAP * pct), pct, label: `${Math.round(pct * 100)}% max` };
};

// Award eligibility is gated on games played. This is the mechanic the whole
// health system hangs off: sitting to protect your knee is no longer a free
// decision, because dropping under the threshold costs you the award, and the
// award is what unlocks the higher max tier.
export const GAMES_THRESHOLD = 65;
export const GAMES_INJURY_EXCEPTION = 62;

export function awardEligible(season) {
  if (season.games >= GAMES_THRESHOLD) return true;
  // Season-ending injury after you had already played most of the year.
  return season.games >= GAMES_INJURY_EXCEPTION && season.seasonEnding;
}

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
    draftTeam: draft.team,
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
    // Reputation is five meters, not one. The same action reads completely
    // differently to the people who sign your cheques and the people who buy
    // your shoes, and that split is most of the perceived depth.
    rep: (() => {
      const r = newRep(rng);
      if (draft.drafted && draft.pick <= 14) { r.fans += 12; r.media += 8; }
      return r;
    })(),
    rival: null,
    news: [],
    gamblingStep: 0,
    techs: 0,
    purchases: [],
    investments: [],
    advisor: null,
    burn: 0,
    netWorth: 0,
    banned: false,
    suspendedGames: 0,
    firstCheck: null,

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
    doneMedia: [],
    // How you intend to handle your body this season. This is the decision the
    // 65-game rule exists to make expensive: managing the load protects the
    // knee and can drop you under the award threshold, which costs you the
    // higher max tier, which costs tens of millions.
    loadPolicy: 'balanced',
  };
}

export const LOAD_POLICIES = {
  full: {
    label: 'Play everything',
    blurb: 'Every back-to-back, every road trip. Availability is a skill.',
    games: 1.0, risk: 1.35, wear: 'Highest re-injury risk',
  },
  balanced: {
    label: 'Normal season',
    blurb: 'Sit when the medical staff insists and not before.',
    games: 0.95, risk: 1.0, wear: 'Ordinary risk',
  },
  managed: {
    label: 'Manage the load',
    blurb: 'Rest days, no back-to-backs, protect the body.',
    games: 0.76, risk: 0.62, wear: 'Lowest risk — and it can cost you the 65 games',
  },
};

// ---------------------------------------------------------------------------
// One season
// ---------------------------------------------------------------------------
export function resolveTrouble(pro, id, optionIndex, rng = defaultRng) {
  const t = TROUBLE.find((x) => x.id === id);
  pro.trouble = null;
  const opt = t?.options[optionIndex];
  if (!opt) return null;
  return opt.run(pro, rng) || { kind: 'note', text: opt.label };
}

export function playSeason(pro, rng = defaultRng) {
  // A retired player has career totals that have already been averaged out and
  // written down. Playing one more season past that quietly makes the summary
  // disagree with the seasons above it.
  if (pro.retired) return null;
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

  // A suspension eats games before anything else does, which is exactly how it
  // costs you the 65-game threshold.
  const suspended = pro.suspendedGames || 0;
  pro.suspendedGames = 0;
  const policy = LOAD_POLICIES[pro.loadPolicy] || LOAD_POLICIES.balanced;
  // Load policy scales the injury multiplier the roll already takes, rather
  // than rolling twice and keeping the second — which is what the first pass
  // did, and it silently doubled the injury rate.
  const injury = injuryRoll(b, pro, minutes, { ...eff, injury: eff.injury * policy.risk }, rng);
  // Games missed to rest, before any injury. This is what can put you under 65
  // without a single thing going wrong.
  let games = Math.round(82 * policy.games) - suspended;
  if (suspended) out.push({ kind: 'bad', text: `Suspended ${suspended} games.` });
  let seasonEnding = false;
  if (injury) {
    seasonEnding = injury.games >= 40;
    games = Math.max(0, games - injury.games);
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

  // The 65-game rule. All-Star is a mid-season vote and is not gated; the
  // end-of-season honours are, and those are the ones worth money.
  const eligible = games >= GAMES_THRESHOLD || (games >= GAMES_INJURY_EXCEPTION && seasonEnding);
  let allStar = false;
  let mvp = false;
  let ring = false;
  let allLeague = false;
  if (rating >= 76 && minutes >= 24 && games >= 50) {
    allStar = rng.chance(clamp((rating - 76) / 11, 0.03, 0.96));
  }
  if (allStar) {
    pro.awards.allStars++;
    if (eligible && rating >= 84 && rng.chance(clamp((rating - 82) / 28, 0.03, 0.6))) {
      allLeague = true;
      pro.awards.allLeague++;
    }
  }
  if (allStar && eligible && rating >= 88 && wins >= 52) {
    mvp = rng.chance(clamp((rating - 88) / 7, 0.05, 0.85));
    if (mvp) pro.awards.mvps++;
  }
  if (!eligible && rating >= 82) {
    out.push({
      kind: 'bad',
      text: `${games} games. Under ${GAMES_THRESHOLD} you are not eligible for any end-of-season award, and that is the money.`,
    });
  }
  // What the next contract can be worth. Held on the player so free agency can
  // read it years later.
  if (allLeague || mvp) pro.lastBumpYear = pro.year;
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
    allStar, mvp, ring, allLeague, eligible, seasonEnding,
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
  moveRep(pro, {
    fans: (allStar ? 9 : 0) + (ring ? 12 : 0) + (minutes > 26 ? 3 : -3),
    media: (allStar ? 6 : 0) + (mvp ? 12 : 0) - (games < GAMES_THRESHOLD ? 5 : 0),
    frontOffice: (playoffs ? 4 : -2) + (games >= GAMES_THRESHOLD ? 3 : -6),
    teammates: (ring ? 8 : 0) + (minutes > 30 && !playoffs ? -3 : 1),
    leagueOffice: 2,
  });
  pro.teamStrength = clamp(pro.teamStrength + rng.gauss(0, 6) + (playoffs ? 1 : 3), 15, 78);

  // Technicals accumulate and eventually become a suspension, which is the
  // cheapest recognisable mechanic in the game.
  pro.techs = (pro.techs || 0) + Math.max(0, Math.round(rng.gauss((b.mentality - 45) / 9, 2.5)));
  if (pro.techs >= 16) {
    const extra = 1 + Math.floor((pro.techs - 16) / 2);
    pro.suspendedGames += extra;
    out.push({ kind: 'bad', text: `${pro.techs} technicals — ${extra} game${extra > 1 ? 's' : ''} suspended next season.` });
    pro.techs = 0;
  }

  // Money out. The first cheque is shown in full because almost nobody models
  // what is actually left, and it is a genuinely memorable moment.
  const cheque = paycheck(pro, pro.contract.salary);
  if (!pro.firstCheck) pro.firstCheck = cheque;
  pro.netWorth += cheque.net;
  const upkeep = pro.purchases.reduce((a, x) => a + x.upkeep, 0) + (pro.entourage || 0) * 400_000;
  pro.burn = upkeep;
  pro.netWorth -= upkeep;
  if (upkeep > cheque.net && cheque.net > 0) {
    out.push({ kind: 'bad', text: `You spent ${proMoney(upkeep)} keeping things running and took home ${proMoney(cheque.net)}.` });
  }
  if (pro.netWorth < 0) {
    out.push({ kind: 'bad', text: 'You are underwater. The advisor is not returning calls.' });
  }

  // The world moves without you.
  if (!pro.rival) pro.rival = makeRival(pro, rng);
  for (const line of stepRival(pro.rival, pro, rng)) out.push({ kind: 'note', text: line });
  pro.news = leagueNews(rng, 3);

  pro.lastMinutes = minutes;
  pro.age++;
  pro.year++;
  pro.contractLeft--;
  pro.gameForm = 0;
  pro.games = [];
  pro.doneThisYear = [];

  // What happens next: retire, negotiate, or hit the market.
  // Trouble, if any is eligible. Escalating chains take priority over one-offs
  // because a chain that stalls is not a chain.
  const seen = pro.seenTrouble || (pro.seenTrouble = []);
  const pool = TROUBLE.filter((t) => !seen.includes(t.id) && t.when(pro));
  if (pool.length && rng.chance(0.45)) {
    const chained = pool.filter((t) => t.chain);
    const t = (chained.length ? chained : pool).sort((a, b) => b.weight - a.weight)[0];
    seen.push(t.id);
    pro.trouble = { id: t.id, title: t.title, text: t.text(pro), options: t.options.map((o) => o.label) };
  }

  const done = pro.banned || pro.rating < REPLACEMENT_FLOOR || pro.age > 40;
  if (pro.banned) out.push({ kind: 'bad', text: 'Banned from the league. That is the end of it.' });
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
// Whether the last three seasons contain an end-of-season honour, which is the
// trigger for both escalators. Awards you were ineligible for because you sat
// do not count, which is the entire loop: the health decision was a money
// decision and nobody told you at the time.
export function bumpEligible(pro) {
  return pro.seasons.slice(-3).some((s) => s.eligible && (s.mvp || s.allLeague));
}

// A supermax needs the honour AND the team that drafted you. Leaving costs you
// the tier, which is why real players agonise over it.
export function supermaxEligible(pro) {
  return pro.year >= 7 && pro.year <= 9 && bumpEligible(pro) && pro.team === pro.draftTeam;
}

export function contractCeiling(pro) {
  const bumped =
    (pro.year <= 6 && bumpEligible(pro)) || supermaxEligible(pro);
  return { ...maxFor(pro.year, bumped), bumped };
}

export function marketValue(pro, rng = defaultRng) {
  const r = pro.rating;
  const age = pro.age;
  const base =
    r >= 88 ? 48e6 : r >= 82 ? 38e6 : r >= 77 ? 28e6 : r >= 72 ? 18e6 :
    r >= 68 ? 10e6 : r >= 64 ? 5e6 : r >= 60 ? 2.4e6 : 1.1e6;
  const ageMult = clamp(1.15 - Math.max(0, age - 29) * 0.09, 0.35, 1.15);
  const raw = base * ageMult * (0.9 + rng.random() * 0.2);
  // Nobody is paid above the tier they qualify for, and nobody below the
  // minimum. The ceiling is where an award turns into cash.
  return Math.round(clamp(raw, MIN_SALARY, contractCeiling(pro).salary));
}

// Four offers with genuinely different shapes, so free agency is a decision
// rather than a list sorted by salary.
export function freeAgencyOffers(pro, rng = defaultRng) {
  const value = marketValue(pro, rng);
  const ceiling = contractCeiling(pro);
  const superm = supermaxEligible(pro);
  const cap = (n) => Math.round(Math.min(n, ceiling.salary));
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
  if (pro.rep.fans > 35 || pro.rating >= 70) {
    offers.push({
      team: pro.team, stay: true,
      // Only your own team can offer the top tier at seven-to-nine years, and
      // only the one that drafted you. That is the whole reason to stay.
      salary: superm ? ceiling.salary : cap(value * 1.08),
      years: pro.age < 30 ? 5 : 2,
      strength: pro.teamStrength,
      tier: superm ? ceiling.label : null,
      note: superm
        ? 'Only they can offer you this. One extra year and the top tier — leaving costs you both.'
        : 'They know you here. The extra year is the point.',
    });
  }
  // A contender that cannot pay.
  offers.push({
    team: pickTeam(),
    salary: cap(value * 0.55), years: 2,
    strength: clamp(Math.round(rng.gauss(66, 5)), 55, 78),
    note: 'They win sixty games and they are offering you the taxpayer exception.',
  });
  // A rebuild that will pay anything.
  offers.push({
    team: pickTeam(),
    salary: cap(value * 1.35), years: pro.age < 31 ? 4 : 3,
    strength: clamp(Math.round(rng.gauss(30, 6)), 15, 45),
    note: 'Twenty-two wins and all the money in the world. You would be the whole offence.',
  });
  // The middle.
  offers.push({
    team: pickTeam(),
    salary: cap(value), years: 3,
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
  if (moved) { moveRep(pro, { fans: 50 - pro.rep.fans }); pro.morale = clamp(pro.morale + 4, 0, 100); }
  return pro;
}

export function acceptTrade(pro, rng = defaultRng) {
  let t = randomTeam(rng);
  let guard = 0;
  while (t === pro.team && guard++ < 8) t = randomTeam(rng);
  pro.team = t;
  pro.teamStrength = clamp(Math.round(rng.gauss(48, 13)), 15, 78);
  moveRep(pro, { fans: 48 - pro.rep.fans });
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
  ...Object.entries(LOAD_POLICIES).map(([id, p]) => ({
    id: `load:${id}`,
    name: p.label,
    blurb: `${p.blurb} ${p.wear}.`,
    cost: 0,
    load: id,
    show: (pro) => pro.loadPolicy !== id,
    run: (pro) => {
      pro.loadPolicy = id;
      const est = Math.round(82 * p.games);
      return {
        kind: id === 'managed' ? 'note' : 'good',
        text: `Season plan: ${p.label.toLowerCase()}. About ${est} games${
          est < GAMES_THRESHOLD ? ` — under the ${GAMES_THRESHOLD} you need for any end-of-season award.` : '.'
        }`,
      };
    },
  })),
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
    show: (p) => p.rep.fans > 45,
    run: (p, rng) => {
      const deal = Math.round((p.rep.fans / 100) ** 2 * 26e6 * (0.5 + rng.random()) + 120_000);
      p.earnings += deal;
      p.endorsements = (p.endorsements || 0) + deal;
      return { kind: 'good', text: `Endorsement signed — ${proMoney(deal)}.` };
    },
  },
  {
    id: 'community', name: 'Put your name on something', blurb: 'A gym, a scholarship, a foundation.',
    cost: 400_000,
    run: (p) => {
      moveRep(p, { fans: 11 });
      p.morale = clamp(p.morale + 5, 0, 100);
      return { kind: 'good', text: 'Opened a gym in the neighbourhood you came from.' };
    },
  },
  {
    id: 'trade demand', name: 'Ask to be traded', blurb: 'You are wasting years here.',
    cost: 0,
    show: (p) => p.teamStrength < 42 && p.rating > 70,
    run: (p, rng) => {
      moveRep(p, { fans: -18, frontOffice: -14 });
      p.pending = 'trade';
      return { kind: 'bad', text: 'You asked out. It leaked within the hour.' };
    },
  },
];

// Money out, media, and the things that keep costing. Generated rather than
// listed so the catalogue grows with the tables in league.js.
const spendActions = () => [
  ...PURCHASES.map((x) => ({
    id: `buy:${x.id}`, name: `Buy: ${x.name}`,
    blurb: `${x.blurb} Upkeep ${proMoney(x.upkeep)} a year.`,
    cost: x.price,
    show: (p) => !p.purchases.some((q) => q.id === x.id),
    run: (p) => {
      p.purchases.push({ id: x.id, name: x.name, upkeep: x.upkeep });
      moveRep(p, { fans: x.fans || 0 });
      if (x.joy) p.morale = clamp(p.morale + x.joy, 0, 100);
      return { kind: 'good', text: `Bought ${x.name.toLowerCase()}. ${proMoney(x.upkeep)} a year to keep.` };
    },
  })),
  ...INVESTMENTS.map((x) => ({
    id: `inv:${x.id}`, name: `Invest: ${x.name}`,
    blurb: `${x.blurb} ${proMoney(x.price)} in.`,
    cost: x.price,
    show: (p) => !p.investments.some((q) => q.id === x.id),
    run: (p, rng) => {
      const q = p.advisor?.quality ?? 0.85;
      const mult = Math.max(0, rng.gauss(x.mean * q, x.sd));
      const back = Math.round(x.price * mult);
      p.investments.push({ id: x.id, name: x.name, put: x.price, got: back });
      p.earnings += back;
      return {
        kind: back > x.price ? 'good' : 'bad',
        text: `${x.name}: put in ${proMoney(x.price)}, it came back ${proMoney(back)}.`,
      };
    },
  })),
  ...ADVISORS.map((x) => ({
    id: `adv:${x.id}`, name: `Advisor: ${x.name}`,
    blurb: `${x.blurb} ${x.fee ? `${proMoney(x.fee)} a year.` : ''}`,
    cost: x.fee,
    show: (p) => p.advisor?.id !== x.id,
    run: (p, rng) => {
      p.advisor = x;
      // The cheap one has a real chance of being a fraud. This is ruthless and
      // it is completely true to life.
      if (rng.chance(x.fraud)) {
        const lost = Math.round(p.earnings * 0.6);
        p.earnings -= lost;
        p.netWorth -= lost;
        p.advisor = null;
        return { kind: 'bad', text: `${x.name} was not who he said he was. ${proMoney(lost)} is gone and it is not coming back.` };
      }
      return { kind: 'good', text: `Signed with ${x.name.toLowerCase()}.` };
    },
  })),
  {
    id: 'entourage', name: 'Put friends on payroll',
    blurb: 'People from home, on salary. $400,000 each a year.',
    cost: 0,
    show: (p) => (p.entourage || 0) < 4,
    run: (p) => {
      p.entourage = (p.entourage || 0) + 1;
      p.morale = clamp(p.morale + 7, 0, 100);
      return { kind: 'note', text: `Put another one on the payroll. Burn is now ${proMoney((p.entourage) * 400_000)} a year.` };
    },
  },
  {
    id: 'cutloose', name: 'Cut the payroll',
    blurb: 'The conversation nobody wants to have.',
    cost: 0,
    show: (p) => (p.entourage || 0) > 0,
    run: (p) => {
      p.entourage -= 1;
      p.morale = clamp(p.morale - 9, 0, 100);
      return { kind: 'bad', text: 'You had the conversation. It did not go well and you saved $400,000.' };
    },
  },
  ...MEDIA_ACTIONS.map((m) => ({
    id: `media:${m.id}`, name: m.name, blurb: m.blurb, cost: m.cost || 0,
    media: m,
    show: (p) => !(m.once && p.doneMedia.includes(m.id)),
    run: () => null, // handled through the media sheet, which asks what you say
  })),
];

export const proActions = (pro) =>
  [...PRO_ACTIONS, ...spendActions()].filter(
    (a) => !pro.doneThisYear.includes(a.id) && (!a.show || a.show(pro)),
  );

// Saying something is a two-step: pick the appearance, then pick what you say.
export function resolveMedia(pro, mediaId, optionIndex, rng = defaultRng) {
  const m = MEDIA_ACTIONS.find((x) => x.id === mediaId);
  const opt = m?.options[optionIndex];
  if (!opt) return null;
  moveRep(pro, opt.rep || {});
  if (opt.fine) pro.earnings -= opt.fine;
  if (opt.income) pro.earnings += opt.income;
  if (m.once) pro.doneMedia.push(m.id);
  pro.doneThisYear.push(`media:${m.id}`);
  const rl = repLine(opt.rep || {});
  return { kind: 'note', text: `${opt.text}${rl ? ` (${rl})` : ''}` };
}

export function doProAction(pro, a, rng = defaultRng) {
  if ((a.cost || 0) > pro.earnings) return null;
  pro.earnings -= a.cost || 0;
  const line = a.run(pro, rng) || { kind: 'note', text: a.name };
  pro.doneThisYear.push(a.id);
  pro.log.push(line);
  return line;
}
