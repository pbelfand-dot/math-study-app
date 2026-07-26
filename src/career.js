import { DRAFT_CUTOFF, SCOUT_NOISE } from './constants.js';
import { clamp } from './roll.js';
import { potentialFor, draftOverallFor, fitFor, positionFor, buildRarityTier, hypeToPercentile } from './overall.js';
import { titleFor } from './archetypes.js';
import { traitsFor, traitEffects } from './traits.js';
import { randomTeam } from './names.js';
import { defaultRng } from './rng.js';

const round1 = (v) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------------------
// Draft
// ---------------------------------------------------------------------------
function runDraft(b, draftOvr, potential, rng) {
  // Scouts weigh projected upside above present ability — which is why a raw
  // nineteen-year-old goes ahead of a finished twenty-two-year-old who is better
  // today, and why the top of a lottery is mostly unfinished players. It is
  // still scouting and not truth, so reaches and steals both happen.
  const hype = draftOvr * 0.35 + potential * 0.65 + rng.gauss(0, SCOUT_NOISE);
  const guaranteed = !!b.archetype?.guaranteesDraft;

  if (hype < DRAFT_CUTOFF && !guaranteed) {
    const signChance = clamp((hype - 46) / 52, 0, 0.42);
    return { drafted: false, pick: null, hype, signed: rng.chance(signChance), guaranteed: false };
  }

  // A pick is a rank inside the class: spread everyone above the cutoff across
  // the 60 picks, by measured hype percentile.
  const q = hypeToPercentile(hype);
  const cutoffQ = hypeToPercentile(DRAFT_CUTOFF);
  const frac = clamp((q - cutoffQ) / (1 - cutoffQ), 0, 1);
  let pick = Math.round(60 - frac * 59);
  if (guaranteed) pick = Math.min(pick, 60);
  pick = clamp(pick, 1, 60);
  return { drafted: true, pick, hype, signed: true, guaranteed };
}

// ---------------------------------------------------------------------------
// Injuries
// ---------------------------------------------------------------------------
const INJURY_KINDS = {
  minor: ['ankle sprain', 'hand contusion', 'sore knee', 'hip pointer', 'strained calf'],
  major: ['stress fracture', 'torn meniscus', 'high ankle sprain', 'shoulder labrum', 'plantar fascia tear'],
  severe: ['torn ACL', 'ruptured achilles', 'micro-fracture surgery', 'compound leg fracture', 'severe back injury'],
};

function injuryRoll(b, state, minutes, eff, rng) {
  const dur = b.physicals.durability;
  // A tall, slight frame carries a body it was not built to carry.
  const mismatch = Math.max(0, (b.height - 78) * 0.015 - (b.frameIndex - 2) * 0.03);
  const p = clamp(
    0.15 *
      (1 + (58 - dur) / 60) *
      (1 + mismatch) *
      (1 + Math.max(0, state.age - 29) * 0.06) *
      (0.55 + (minutes / 34) * 0.6) *
      (1 + 0.3 * state.injuryHistory) *
      eff.injury,
    0.01,
    0.85,
  );
  if (!rng.chance(p)) return null;

  // Severity skews worse for fragile bodies and older legs.
  const bad = clamp(0.10 + (58 - dur) / 220 + Math.max(0, state.age - 30) * 0.012, 0.04, 0.42);
  const r = rng.random();
  let severity;
  if (r < bad * 0.42 * eff.permanent) severity = 'severe';
  else if (r < bad + 0.24) severity = 'major';
  else severity = 'minor';

  const games =
    severity === 'severe'
      ? 52 + rng.int(30)
      : severity === 'major'
        ? 22 + rng.int(30)
        : 4 + rng.int(18);

  return { severity, games, kind: rng.pick(INJURY_KINDS[severity]) };
}

// ---------------------------------------------------------------------------
// Production
// ---------------------------------------------------------------------------
function boxScore(b, rating, minutes, eff, fit) {
  const s = b.skills;
  const iq = b.mentals.bballIQ;
  const scoring = (s.three + s.midrange + s.finishing + s.dunk) / 4;

  // Centred so a league-average rotation player lands near 20: five men on the
  // floor have to split 100% of the possessions. The rating term matters as much
  // as the skill term — offenses feed the best player on the floor, and without
  // it an 81 and an 86 post identical lines once both cap out at 38 minutes.
  const usage = clamp(
    19.5 + (rating - 67) * 0.42 + (b.mentality - 50) * 0.13 + (scoring - 66) * 0.14 + fit * 8,
    8,
    36,
  );

  let ts =
    0.50 +
    (s.three + s.midrange + s.finishing - 160) * 0.00055 +
    (iq - 50) * 0.0006 +
    fit * 0.03 -
    Math.max(0, usage - 24) * 0.004;
  ts += (eff.efficiency - 1) * 0.05;
  ts = clamp(ts, 0.40, 0.68);

  const poss = minutes * 2.05;
  const ppg = poss * (usage / 100) * ts * 2;

  const rpg = minutes * (s.rebounding * 0.0032 + Math.max(0, b.height - 78) * 0.006 + 0.015);
  const apg = minutes * (s.playmaking * 0.0034 + Math.max(0, 50 - b.mentality) * 0.0004) * eff.assists;
  const spg = minutes * (s.perimeterD * 0.0012 + 0.002);
  const bpg = minutes * (s.block * 0.0016);
  const topg = minutes * (0.055 - s.handles * 0.00022) * eff.turnovers;

  return {
    usage: round1(usage),
    ts: Math.round(ts * 1000) / 1000,
    ppg: Math.max(0, ppg),
    rpg: Math.max(0, rpg),
    apg: Math.max(0, apg),
    spg: Math.max(0, spg),
    bpg: Math.max(0, bpg),
    topg: Math.max(0.2, topg),
  };
}

// ---------------------------------------------------------------------------
// The sim
// ---------------------------------------------------------------------------
export function simulateCareer(b, rng = defaultRng) {
  const potential = potentialFor(b);
  const draftOvr = draftOverallFor(b);
  const overall = potential; // headline number for the build = its ceiling
  const fit = fitFor(b);
  const traits = traitsFor(b);
  const eff = traitEffects(traits);
  const title = titleFor(b);
  const pos = positionFor(b.height);
  const draft = runDraft(b, draftOvr, potential, rng);

  const result = {
    overall,
    potential,
    draftOvr,
    fit: Math.round(fit * 100) / 100,
    position: pos,
    title,
    traits,
    rarity: buildRarityTier(b),
    drafted: draft.drafted,
    pick: draft.pick,
    hype: Math.round(draft.hype * 10) / 10,
    guaranteedByArchetype: draft.guaranteed,
    seasons: [],
    awards: { allStars: 0, mvps: 0, rings: 0, allLeague: 0 },
    seasonsLostToInjury: 0,
    teams: [],
    permanentLoss: { speed: 0, dunk: 0 },
    careerAverages: { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, mpg: 0, games: 0, points: 0 },
    peakRating: 0,
    hof: false,
    bust: false,
    madeLeague: false,
  };

  if (!draft.drafted && !draft.signed) {
    result.outcome = 'never-played';
    return result;
  }
  result.madeLeague = true;

  // -------------------------------------------------------------------------
  // DEVELOPMENT
  //
  // A career is the story of closing the gap between draft-day ability and
  // potential. How much of it closes is the interesting part: work ethic, fit,
  // and — the one people forget — playing time. A prospect who never gets
  // minutes does not develop, however high his ceiling was.
  // -------------------------------------------------------------------------
  const we = b.mentals.workEthic;

  // Share of the draft-to-potential gap this player actually converts. Around
  // 0.85 typical; a grinder overshoots his projection, a coaster never arrives.
  const realization = clamp(
    (0.89 + (we - 50) * 0.0055 + fit * 0.12 + rng.gauss(0, 0.08)) * eff.growth,
    0.52,
    1.14,
  );
  const realizedPeak = clamp(draftOvr + (potential - draftOvr) * realization, 30, 99);

  const bigMan = b.height >= 82;
  const peakAge = 26 + (b.physicals.longevity - 50) * 0.06 + (bigMan ? 1 : 0) + eff.peakAge;

  // Skills the build leans on. High dependence falls off a cliff.
  const dependence =
    ((b.skills.speed + b.skills.dunk) / 2) /
    ((b.skills.three + b.skills.midrange + b.mentals.bballIQ) / 3);
  const declineRate =
    1.9 * clamp(dependence, 0.55, 2.4) * (1 - (b.physicals.longevity - 50) * 0.007) * eff.decline;

  const state = {
    age: b.draftAge,
    rating: draft.drafted ? draftOvr : draftOvr - 3,
    injuryHistory: 0,
    speedLoss: 0,
    dunkLoss: 0,
    peak: 0,
    leaps: 0,
    // Last season's minutes gate this season's development.
    lastMinutes: 14,
  };

  let team = randomTeam(rng);
  result.teams.push(team);
  const maxAge = 40 + eff.careerLength;
  const tradeChance = 0.09 * eff.tradeFreq;

  // Roster economics. REPLACEMENT is where a spot starts being contested;
  // REPLACEMENT_FLOOR is where there is no spot at any price.
  const REPLACEMENT = 66;
  const REPLACEMENT_FLOOR = 57;

  let totals = { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, mpg: 0, games: 0, points: 0 };

  for (let year = 0; year < 26; year++) {
    // Athletic attrition from past severe injuries is permanent.
    const effSpeed = clamp(b.skills.speed - state.speedLoss, 25, 99);
    const effDunk = clamp(b.skills.dunk - state.dunkLoss, 25, 99);

    // Growth then decline. Gains are front-loaded — the second and third years
    // are where a prospect either arrives or stops — and gated on playing time,
    // which is why the previous season's minutes feed into this.
    let leapt = false;
    if (year > 0 && state.age < peakAge) {
      const room = realizedPeak - state.rating;
      if (room > 0) {
        const youth = clamp(1.18 - (state.age - 19) * 0.085, 0.16, 1.18);
        const playingTime = clamp(0.50 + state.lastMinutes / 24, 0.50, 1.30);
        let gain = room * 0.27 * youth * playingTime;
        // The offseason leap: a real thing, and the reason people watch young
        // players. Rare, weighted to the years where it actually happens.
        if (state.age <= 25 && rng.chance(0.11 * (0.6 + we / 90))) {
          gain += Math.abs(rng.gauss(2.6, 1.7));
          leapt = true;
          state.leaps++;
        }
        state.rating += gain + rng.gauss(0.25, 0.8);
      }
    } else {
      const past = state.age - peakAge;
      state.rating -= declineRate * (0.5 + 0.32 * past);
    }
    // Permanent athletic loss drags the rating with it.
    state.rating -= (state.speedLoss + state.dunkLoss) * 0.06;
    state.rating = clamp(state.rating, 10, 99);
    state.peak = Math.max(state.peak, state.rating);
    // Checked before the season is recorded — otherwise the log shows a year
    // played at a rating nobody would have been on a roster for.
    if (year > 0 && state.rating < REPLACEMENT_FLOOR) break;

    const rating = state.rating;
    const stamina = b.physicals.stamina;
    // On this scale: 62 is a 12-minute end-of-bench piece, 70 a starter at ~22,
    // 80 a 35-minute focal point, 85+ plays until the coach takes him out.
    let minutes = clamp((rating - 54) * 1.35 + (stamina - 50) * 0.09, 0, 38);

    const injury = injuryRoll(b, state, minutes, eff, rng);
    let games = 82;
    if (injury) {
      games = Math.max(0, 82 - injury.games);
      state.injuryHistory += injury.severity === 'severe' ? 2 : injury.severity === 'major' ? 1 : 0.4;
      if (injury.severity === 'severe') {
        const sl = Math.abs(rng.gauss(5, 2.5));
        const dl = Math.abs(rng.gauss(4.5, 2.5));
        state.speedLoss += sl;
        state.dunkLoss += dl;
        result.permanentLoss.speed = Math.round(state.speedLoss);
        result.permanentLoss.dunk = Math.round(state.dunkLoss);
      }
      if (injury.games >= 45) result.seasonsLostToInjury++;
      minutes *= clamp(0.85 + rng.random() * 0.15, 0, 1);
    }

    const modBuild = {
      ...b,
      skills: { ...b.skills, speed: effSpeed, dunk: effDunk },
    };
    const box = boxScore(modBuild, rating, minutes, eff, fit);

    // Team results.
    const wins = clamp(
      Math.round(
        41 +
          ((rating - 58) * 0.75 + (b.mentals.coachability - 50) * 0.06 + rng.gauss(0, 8)) *
            eff.teamSuccess,
      ),
      9,
      73,
    );
    const playoffs = wins >= 43 + rng.int(4);

    // Awards.
    let allStar = false;
    let mvp = false;
    let ring = false;
    // All-stars live in the 80s on this scale; 24 of 450 get picked.
    if (rating >= 76 && minutes >= 24 && games >= 50) {
      allStar = rng.chance(clamp((rating - 76) / 11, 0.03, 0.96));
    }
    if (allStar) {
      result.awards.allStars++;
      if (rating >= 84 && rng.chance(clamp((rating - 82) / 28, 0.03, 0.6))) result.awards.allLeague++;
    }
    if (allStar && rating >= 88 && wins >= 52 && games >= 62) {
      mvp = rng.chance(clamp((rating - 88) / 7, 0.05, 0.85));
      if (mvp) result.awards.mvps++;
    }
    if (playoffs) {
      // League-wide, one roster in thirty wins it: ~3% of player-seasons.
      const playoffStrength = clamp((wins - 41) / 32, 0, 1);
      const p = clamp(0.010 + playoffStrength ** 2 * 0.22, 0, 0.35) * eff.titleOdds;
      ring = rng.chance(p);
      if (ring) result.awards.rings++;
    }

    const season = {
      age: state.age,
      team,
      rating: Math.round(rating),
      games,
      minutes: round1(minutes),
      ppg: round1(box.ppg),
      rpg: round1(box.rpg),
      apg: round1(box.apg),
      spg: round1(box.spg),
      bpg: round1(box.bpg),
      topg: round1(box.topg),
      usage: box.usage,
      ts: box.ts,
      wins,
      playoffs,
      playoffPpg: playoffs ? round1(box.ppg * eff.playoffProd) : null,
      allStar,
      mvp,
      ring,
      injury,
      leapt,
    };
    result.seasons.push(season);
    state.lastMinutes = minutes;

    totals.games += games;
    totals.points += box.ppg * games;
    totals.ppg += box.ppg * games;
    totals.rpg += box.rpg * games;
    totals.apg += box.apg * games;
    totals.spg += box.spg * games;
    totals.bpg += box.bpg * games;
    totals.mpg += minutes * games;

    // Trades.
    if (rng.chance(tradeChance)) {
      let next = randomTeam(rng);
      let guard = 0;
      while (next === team && guard++ < 5) next = randomTeam(rng);
      team = next;
      if (!result.teams.includes(team)) result.teams.push(team);
    }

    state.age++;

    // Careers end two ways. A few players decline until they are finished; far
    // more are simply better than nobody and get replaced by next year's rookie.

    if (state.age > maxAge) break;

    // A single replacement level cannot do this job alone: set it low enough
    // that a slow-declining shooter can hang on to 38 and fringe rookies stop
    // churning; set it high enough to churn them and the shooter retires at 31
    // with the aging mechanic invisible. Pedigree splits the two — a team keeps
    // a declining former star far longer than a 24-year-old who was never good.
    if (state.rating < REPLACEMENT) {
      let stayP = clamp(1 - (REPLACEMENT - state.rating) / 11, 0.03, 0.93);
      const nearEnough = clamp(1 - (REPLACEMENT - state.rating) / 12, 0, 1);
      stayP += Math.min(0.34, Math.max(0, (state.peak - 66) * 0.028)) * nearEnough;
      if (!draft.drafted) stayP *= 0.6; // no guaranteed money, no rope
      if (draft.pick && draft.pick <= 14) stayP += 0.22; // teams sit on lottery picks
      if (draft.drafted && state.age <= 22) stayP += 0.18;
      if (state.age > 33) stayP *= 0.72;
      if (!rng.chance(clamp(stayP, 0.02, 0.97))) break;
    }
  }

  const g = Math.max(totals.games, 1);
  result.careerAverages = {
    ppg: round1(totals.ppg / g),
    rpg: round1(totals.rpg / g),
    apg: round1(totals.apg / g),
    spg: round1(totals.spg / g),
    bpg: round1(totals.bpg / g),
    mpg: round1(totals.mpg / g),
    games: totals.games,
    points: Math.round(totals.points),
  };

  // Hall of fame.
  const hofScore =
    result.awards.mvps * 30 +
    result.awards.allStars * 8 +
    result.awards.allLeague * 5 +
    result.awards.rings * 10 +
    result.seasons.length * 1.2 +
    (result.careerAverages.points / 1000) * 2.2;
  result.hofScore = Math.round(hofScore);
  result.hof = hofScore >= 215;

  result.peakRating = result.seasons.reduce((m, s) => Math.max(m, s.rating), 0);
  result.peakAge = Math.round(peakAge * 10) / 10;
  result.realizedPeak = Math.round(realizedPeak);
  result.leaps = state.leaps;
  result.rookieRating = result.seasons.length ? result.seasons[0].rating : null;
  result.ceiling = Math.round(realizedPeak);
  result.dependence = Math.round(dependence * 100) / 100;
  // A bust is a promise the league paid for and did not get.
  result.bust =
    draft.drafted &&
    draft.pick <= 14 &&
    result.awards.allStars === 0 &&
    (result.seasons.length < 6 || result.peakRating < 75);

  return result;
}
