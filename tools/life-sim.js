// Monte Carlo for the Hoop Life pipeline: high school -> college -> the draft.
//
// The roll engine has had a verification gate since the first commit; the life
// engine needs one for the same reason. Its first pass produced a 31.5%
// five-star rate and a median pro potential of 35 against a draft cutoff of 62,
// and neither of those is visible from playing a few lives by hand.
//
//   npm run sim -- --recruit    emit STAR_CUTS + RECRUIT_CUTS
//   npm run sim -- --pipeline   the full HS -> college -> draft sweep

import { SKILL_KEYS, DRAFT_CUTOFF } from '../src/constants.js';
import { rollCompleteBuild, clamp } from '../src/roll.js';
import { potentialFor, draftOverallFor } from '../src/overall.js';
import { simulateCareer } from '../src/career.js';
import { randomName } from '../src/names.js';
import {
  newLife, advanceYear, overallNow, recruitScore, starRating, buildOffers,
  commit, declare, returnToSchool, proBuildFrom, trainingFor, slotsFor,
  GRAD_AGE, DRAFT_AGE_CAP,
} from '../src/life.js';

// ---------------------------------------------------------------------------
// A stand-in for a competent player.
//
// Deliberately not optimal — it does not know the hidden mentals and it does
// not look ahead. It keeps itself eligible, healthy and seen, and otherwise
// trains whatever it has the most room in. Balance measured against a perfect
// player would be balance nobody experiences.
// ---------------------------------------------------------------------------
const ATTR_SLOTS = ['shooting', 'handles', 'speed', 'post', 'weights', 'strength', 'devcoach'];

function pickPlan(life, rng) {
  const slots = slotsFor(life);
  const avail = trainingFor(life);
  const m = life.meters;
  const plan = [];
  const can = (id) => {
    const t = avail.find((x) => x.id === id);
    if (!t || plan.includes(id)) return false;
    if (t.gated && m.hype < t.gated) return false;
    return t.cost <= life.money - plan.reduce((a, p) => a + (avail.find((x) => x.id === p)?.cost || 0), 0);
  };
  const take = (id) => { if (plan.length < slots && can(id)) plan.push(id); };

  // Triage first: eligibility, then a body that still works.
  if (m.grades < 48) take(life.stage === 'college' ? 'classes' : 'school');
  if (m.energy < 30 || m.health < 55) take('rest');
  // Then be seen. Exposure is the whole recruiting path.
  if (life.stage === 'highschool') {
    if (m.money < 1100 && life.money < 1100) take('job');
    take('camp');
    take('aau');
  } else {
    if (life.age >= DRAFT_AGE_CAP - 1) take('summer');
    take('media');
    take('nil');
  }
  // Then close the biggest gaps to the genetic ceiling.
  const room = (ks) => ks.reduce((a, k) => a + Math.max(0, life.build.skills[k] - life.attrs[k]), 0);
  const byRoom = [
    ['shooting', room(['three', 'midrange'])],
    ['handles', room(['handles', 'playmaking'])],
    ['speed', room(['speed', 'perimeterD'])],
    ['post', room(['post', 'interiorD', 'block'])],
    ['weights', room(['dunk', 'finishing', 'rebounding'])],
    ['strength', room(['dunk', 'finishing', 'rebounding', 'speed'])],
    ['devcoach', 60],
  ].sort((a, b) => b[1] - a[1]);
  for (const [id] of byRoom) take(id);
  // Anything left over goes into things that are free and never wasted.
  for (const id of ['film', 'conditioning', 'rest']) take(id);
  for (const t of avail) take(t.id);
  return plan;
}

const bestOffer = (offers) => {
  const rank = { 'Blue blood': 4, 'High major': 3, 'Mid major': 2, 'Small school': 1, Other: 0, 'Turn pro': -1 };
  return [...offers].sort((a, b) => rank[b.tier] - rank[a.tier])[0];
};

// When to leave. A player declares once the projection says he is a first-round
// pick, and otherwise stays for the development. This is the decision the UI
// puts in front of the user, so the sweep has to make it the same way.
function shouldDeclare(life) {
  const b = proBuildFrom(life);
  const hype = draftOverallFor(b) * 0.35 + potentialFor(b) * 0.65;
  return hype >= DRAFT_CUTOFF + 8;
}

// ---------------------------------------------------------------------------
// Play one life all the way through
// ---------------------------------------------------------------------------
export function playLife(rng, { stopAt = 'draft', offerPolicy = bestOffer } = {}) {
  const build = rollCompleteBuild(rng);
  const life = newLife(build, randomName(rng), rng);

  let cutSeasons = 0;
  while (life.age < GRAD_AGE) {
    advanceYear(life, pickPlan(life, rng), rng);
    if (!life.seasonStats) cutSeasons++;
  }

  const grad = {
    ovr: overallNow(life),
    score: recruitScore(life),
    stars: starRating(life),
    hype: life.meters.hype,
    offers: life.offers,
    bestTier: bestOffer(life.offers).tier,
    cutSeasons,
    background: life.background.id,
  };
  if (stopAt === 'graduation') return { life, grad, pro: null };

  const offer = offerPolicy(life.offers);
  if (offer.pro) {
    declare(life); // straight to the draft out of high school
  } else {
    commit(life, offer);
    while (life.stage === 'college') {
      advanceYear(life, pickPlan(life, rng), rng);
      if (life.pending === 'forced' || shouldDeclare(life)) declare(life);
      else returnToSchool(life);
    }
  }

  const b = proBuildFrom(life);
  return {
    life,
    grad,
    pro: {
      build: b,
      declareAge: life.age,
      school: offer.school,
      tier: offer.tier,
      potential: potentialFor(b),
      draftOvr: draftOverallFor(b),
      collegeOvr: overallNow(life),
      // How much of the genetic ceiling the whole path actually realised.
      realised:
        SKILL_KEYS.reduce((a, k) => a + life.attrs[k] / Math.max(1, build.skills[k]), 0) / SKILL_KEYS.length,
    },
  };
}

const q = (arr, p) => arr[clamp(Math.floor(p * (arr.length - 1)), 0, arr.length - 1)];
const pct = (n, d) => `${((n / d) * 100).toFixed(1)}%`;

// ---------------------------------------------------------------------------
// --recruit : emit the measured cuts
// ---------------------------------------------------------------------------
export function recruitCalibrate(n, rng) {
  const scores = [];
  for (let i = 0; i < n; i++) scores.push(playLife(rng, { stopAt: 'graduation' }).grad.score);
  scores.sort((a, b) => a - b);

  // Star targets: 5-star ~2%, 4-star ~8%, 3-star ~21%, 2-star ~32%.
  const stars = [1 - 0.63, 1 - 0.31, 1 - 0.10, 1 - 0.02].map((p) => q(scores, p));
  const cuts = {
    blueBlood: q(scores, 1 - 0.03),
    highMajor: q(scores, 1 - 0.12),
    midMajor: q(scores, 1 - 0.34),
    smallSchool: q(scores, 1 - 0.68),
  };

  console.log(`\nrecruit score over ${n.toLocaleString()} lives:` +
    ` p10 ${q(scores, 0.1).toFixed(1)} · median ${q(scores, 0.5).toFixed(1)} · p90 ${q(scores, 0.9).toFixed(1)} · max ${q(scores, 1).toFixed(1)}`);
  console.log('\n// paste into src/constants.js');
  console.log(`export const STAR_CUTS = [${stars.map((v) => v.toFixed(1)).join(', ')}];`);
  console.log('\nexport const RECRUIT_CUTS = {');
  for (const [k, v] of Object.entries(cuts)) console.log(`  ${k}: ${v.toFixed(1)},`);
  console.log('};');
}

// ---------------------------------------------------------------------------
// --pipeline : does a played life actually reach the pro game
// ---------------------------------------------------------------------------
export function pipelineCheck(n, rng) {
  const stars = {};
  const tiers = {};
  const declareAges = {};
  const pots = [];
  const realised = [];
  let cutSeasons = 0;
  let drafted = 0;
  let lottery = 0;
  let played = 0;
  let allStars = 0;
  let ninety = 0;
  let hof = 0;

  // The question the whole engine exists to answer: if the genetics were
  // there, did playing the life actually cash them in? A pipeline that loses
  // gifted players is worse than one that is merely stingy.
  const gifted = { n: 0, drafted: 0, played: 0, allStars: 0, pot: [] };

  for (let i = 0; i < n; i++) {
    const { grad, pro, life } = playLife(rng);
    const genetic = potentialFor(life.build);
    stars[grad.stars] = (stars[grad.stars] || 0) + 1;
    tiers[grad.bestTier] = (tiers[grad.bestTier] || 0) + 1;
    cutSeasons += grad.cutSeasons;
    declareAges[pro.declareAge] = (declareAges[pro.declareAge] || 0) + 1;
    pots.push(pro.potential);
    realised.push(pro.realised);

    const c = simulateCareer(pro.build, rng);
    if (c.drafted) drafted++;
    if (c.pick && c.pick <= 14) lottery++;
    if (c.madeLeague) played++;
    allStars += c.awards.allStars;
    if (c.peakRating >= 90) ninety++;
    if (c.hof) hof++;

    if (genetic >= 80) {
      gifted.n++;
      gifted.pot.push(pro.potential);
      if (c.drafted) gifted.drafted++;
      if (c.madeLeague) gifted.played++;
      gifted.allStars += c.awards.allStars;
    }
  }
  gifted.pot.sort((a, b) => a - b);

  pots.sort((a, b) => a - b);
  realised.sort((a, b) => a - b);
  const starPct = Object.fromEntries(
    Object.entries(stars).sort().map(([k, v]) => [`${k}★`, pct(v, n)]),
  );
  const tierPct = Object.fromEntries(Object.entries(tiers).map(([k, v]) => [k, pct(v, n)]));
  const agePct = Object.fromEntries(Object.entries(declareAges).sort().map(([k, v]) => [k, pct(v, n)]));

  console.log(`\nHOOP LIFE PIPELINE — ${n.toLocaleString()} lives, played competently`);
  console.log('-'.repeat(72));
  console.log('stars at graduation  ', starPct);
  console.log('best offer in hand   ', tierPct);
  console.log('age when he declares ', agePct);
  console.log(`cut/lost seasons in HS: ${(cutSeasons / n).toFixed(2)} of 4`);
  console.log(
    `\ngenetic ceiling realised: p25 ${(q(realised, 0.25) * 100).toFixed(0)}% · ` +
    `median ${(q(realised, 0.5) * 100).toFixed(0)}% · p90 ${(q(realised, 0.9) * 100).toFixed(0)}%`,
  );
  console.log(
    `pro potential at declare: p10 ${q(pots, 0.1)} · p25 ${q(pots, 0.25)} · median ${q(pots, 0.5)} · ` +
    `p75 ${q(pots, 0.75)} · p90 ${q(pots, 0.9)} · max ${q(pots, 1)}`,
  );
  console.log(
    `\ndrafted ${pct(drafted, n)} · lottery ${pct(lottery, n)} · made the league ${pct(played, n)}`,
  );
  console.log(
    `all-star selections per life ${(allStars / n).toFixed(2)} · ` +
    `peaked 90+ ${pct(ninety, n)} · hall of fame ${pct(hof, n)}`,
  );
  if (gifted.n) {
    console.log(
      `\ngenetically gifted lives (true ceiling 80+), ${pct(gifted.n, n)} of all:\n` +
      `  drafted ${pct(gifted.drafted, gifted.n)} · made the league ${pct(gifted.played, gifted.n)} · ` +
      `${(gifted.allStars / gifted.n).toFixed(1)} all-star selections each\n` +
      `  potential reaching the draft: p25 ${q(gifted.pot, 0.25)} · median ${q(gifted.pot, 0.5)} · p90 ${q(gifted.pot, 0.9)}`,
    );
  }
}
