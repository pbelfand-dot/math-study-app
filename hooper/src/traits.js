// Traits come from the hidden stats and are revealed after the career sim.
// Every one of them does something in the simulation — a trait that only
// prints text is wasted.

export const TRAITS = [
  {
    id: 'coldBlooded',
    name: 'Cold Blooded',
    test: (b) => b.mentals.clutch >= 90,
    desc: 'Under the lights he does not miss.',
    effects: { playoffProd: 1.25, titleOdds: 1.6 },
  },
  {
    id: 'shrinks',
    name: 'Shrinks',
    test: (b) => b.mentals.clutch <= 20,
    desc: 'Great regular seasons. Gone in May.',
    effects: { playoffProd: 0.75, titleOdds: 0.5 },
  },
  {
    id: 'obsessive',
    name: 'Obsessive',
    test: (b) => b.mentals.workEthic >= 88,
    desc: 'Growth toward the ceiling never stops.',
    effects: { growth: 1.5, peakAge: 2 },
  },
  {
    id: 'coasted',
    name: 'Coasted',
    test: (b) => b.mentals.workEthic <= 25,
    desc: 'Got there on talent and stopped.',
    effects: { growth: 0.4 },
  },
  {
    id: 'glass',
    name: 'Glass',
    test: (b) => b.physicals.durability <= 30,
    desc: 'Something is always wrong.',
    effects: { injury: 1.8, permanent: 1.5 },
  },
  {
    id: 'ageless',
    name: 'Ageless',
    test: (b) => b.physicals.longevity >= 88,
    desc: 'The body simply refuses to file the paperwork.',
    effects: { decline: 0.5, careerLength: 4 },
  },
  {
    id: 'seesItEarly',
    name: 'Sees It Early',
    test: (b) => b.mentals.bballIQ >= 90,
    desc: 'Reads the play two passes before it happens.',
    effects: { efficiency: 1.2, assists: 1.15, turnovers: 0.7 },
  },
  {
    id: 'uncoachable',
    name: 'Uncoachable',
    test: (b) => b.mentals.coachability <= 22,
    desc: 'Every building runs out of patience eventually.',
    effects: { teamSuccess: 0.7, tradeFreq: 2.5 },
  },
];

const DEFAULTS = {
  playoffProd: 1,
  titleOdds: 1,
  growth: 1,
  peakAge: 0,
  injury: 1,
  permanent: 1,
  decline: 1,
  careerLength: 0,
  efficiency: 1,
  assists: 1,
  turnovers: 1,
  teamSuccess: 1,
  tradeFreq: 1,
};

export function traitsFor(b) {
  return TRAITS.filter((t) => t.test(b));
}

export function traitEffects(traits) {
  const out = { ...DEFAULTS };
  for (const t of traits) {
    for (const [k, v] of Object.entries(t.effects)) {
      if (k === 'peakAge' || k === 'careerLength') out[k] += v;
      else out[k] *= v;
    }
  }
  return out;
}
