// The verdict is the shareable artifact. Broadcaster, not database. Short,
// specific, a little cruel.

import { formatHeight } from './roll.js';
import { defaultRng } from './rng.js';

function pickSlot(c) {
  if (!c.drafted) return 'undrafted';
  if (c.pick === 1) return 'first overall';
  if (c.pick <= 5) return `top-five pick`;
  if (c.pick <= 14) return 'lottery pick';
  if (c.pick <= 30) return 'first-rounder';
  return 'second-rounder';
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// --- opening: how they arrived ---------------------------------------------
function opening(c, b, rng) {
  const h = formatHeight(b.height);
  const slot = pickSlot(c);
  if (!c.madeLeague) {
    return rng.pick([
      `Nobody called. A ${h} frame and a workout list that ran out of gyms.`,
      `The phone stayed quiet through both rounds and every camp after it.`,
      `Never got a number in this league. Not every build does.`,
    ]);
  }
  if (!c.drafted) {
    return rng.pick([
      `Went undrafted, signed for the minimum, and made somebody look stupid for a while.`,
      `Undrafted. Trained in an empty gym in August and talked his way onto a roster.`,
      `Sixty names came off the board. His was not one of them.`,
    ]);
  }
  if (c.guaranteedByArchetype) {
    return `Went ${ordinal(c.pick)} — the tape was never really in question.`;
  }
  if (c.hype > c.overall + 7) {
    return `Went ${ordinal(c.pick)}, which the room loved and the numbers never did.`;
  }
  if (c.hype < c.overall - 7) {
    return rng.pick([
      `Slid to ${ordinal(c.pick)}. Twenty-nine front offices are still explaining that one.`,
      `Fell to ${ordinal(c.pick)} as a ${slot}, which turned out to be the steal of the night.`,
    ]);
  }
  return `Went ${ordinal(c.pick)}.`;
}

// --- middle: what the career actually was -----------------------------------
function middle(c, b, rng) {
  const a = c.careerAverages;
  const yrs = c.seasons.length;
  if (!c.madeLeague) return '';

  const line = `${a.ppg}/${a.rpg}/${a.apg} across ${yrs} ${yrs === 1 ? 'season' : 'seasons'}`;

  if (c.awards.mvps > 0) {
    return `${line}, ${c.awards.allStars} all-star nods and ${c.awards.mvps} ${c.awards.mvps === 1 ? 'MVP' : 'MVPs'} on the mantel.`;
  }
  if (c.awards.allStars >= 5) {
    return `${line}. Five-plus trips to the all-star weekend and a peak of ${c.peakRating}.`;
  }
  if (c.awards.allStars > 0) {
    return `${line}, with ${c.awards.allStars} all-star ${c.awards.allStars === 1 ? 'appearance' : 'appearances'}.`;
  }
  if (yrs <= 2) {
    return `${line}. Gone before anyone learned the jersey number.`;
  }
  return `${line}.`;
}

// --- closing: the cruel part ------------------------------------------------
function closing(c, b, rng) {
  const title = c.title.title;
  const traitIds = new Set(c.traits.map((t) => t.id));
  const m = b.mentals;

  if (!c.madeLeague) {
    if (m.workEthic <= 25) return `The talent was arguable. The work ethic — ${m.workEthic} — was not.`;
    if (c.overall >= 60) return `Good enough to belong somewhere. This was not somewhere.`;
    return `Every league needs somebody to be better than.`;
  }

  if (c.hof) {
    return rng.pick([
      `They will retire the number and get the speech wrong anyway.`,
      `First ballot. Nobody had to argue about it.`,
      `The kind of career the next one gets measured against.`,
    ]);
  }
  if (c.bust) {
    if (traitIds.has('coasted')) return `Work ethic came back ${m.workEthic}. That is the whole autopsy.`;
    if (traitIds.has('glass')) return `The body filed for divorce in year three.`;
    return `A lottery pick is a promise. This one went unpaid.`;
  }
  if (title === 'The Chucker') {
    return `Mentality ${b.mentality} with nothing behind it. Took every shot and made the case against himself.`;
  }
  if (title === 'The Ghost') {
    return `Mentality ${b.mentality}. Had the whole bag and kept it zipped.`;
  }
  if (c.fit <= -0.25) {
    return `The build and the mentality never agreed on what he was. Neither did the coaches.`;
  }
  if (traitIds.has('shrinks') && c.awards.allStars > 0) {
    return `Eighty-two games of proof, then four in May that undid all of it.`;
  }
  if (traitIds.has('coldBlooded')) {
    return `Whatever the regular season said, the tape from the spring said more.`;
  }
  if (c.seasonsLostToInjury >= 2) {
    return `Lost ${c.seasonsLostToInjury} seasons to the training room. The good version of this was worth watching.`;
  }
  if (traitIds.has('ageless')) {
    return `Still going at ${c.seasons[c.seasons.length - 1].age}, which nobody planned for.`;
  }
  if (c.dependence >= 1.5) {
    return `Lived on the legs. The legs sent notice at ${Math.round(c.peakAge) + 3}.`;
  }
  if (c.awards.rings > 0) {
    return `Has ${c.awards.rings === 1 ? 'a ring' : `${c.awards.rings} rings`}, and that ends most arguments.`;
  }
  if (c.seasons.length >= 12) {
    return `Twelve-plus years of showing up. That is its own kind of rare.`;
  }
  return rng.pick([
    `Useful. Replaceable. Both of those are true at once.`,
    `A career. Not a story.`,
    `Somebody's favorite player. Nobody's franchise.`,
  ]);
}

export function titleLine(c) {
  const t = c.traits.map((x) => x.name);
  return t.length ? `${c.title.title} — ${t.join(', ')}` : c.title.title;
}

export function writeVerdict(c, b, rng = defaultRng) {
  const parts = [opening(c, b, rng), middle(c, b, rng), closing(c, b, rng)].filter(Boolean);
  return { headline: titleLine(c), body: parts.join(' ') };
}
