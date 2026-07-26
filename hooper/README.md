# Build a Hooper

A basketball build-roller and career simulator. You roll a player one attribute at a
time. Every attribute is scored against what is **expected for that player's height**,
not against 99. Then you simulate their career and find out what the build was worth.

A 6'0" with a 94 dunk is a freak. A 7'1" with a 94 dunk is Tuesday.

Vanilla HTML/CSS/JS, ES modules, no framework, no backend, no dependencies.

## Running it

```sh
npm run dev     # http://localhost:8080
npm run sim     # Monte Carlo harness — the rarity table
```

The dev server exists only because ES modules cannot load over `file://`.

## The harness

Any constant change gets re-verified here. Non-negotiable.

```sh
npm run sim                    # 95+ rate table vs the published run
npm run sim -- --archetypes    # same table with rolled archetypes enabled
npm run sim -- --both          # before/after comparison
npm run sim -- --overall       # overall distribution vs the calibration target
npm run sim -- --careers       # draft, career, award and in-league rate checks
npm run sim -- --chase         # chase-pull odds
npm run sim -- --sample 8      # readable sample builds, careers and verdicts
npm run sim -- --calibrate     # re-emit the empirical constants
npm run sim -- -n 2000000      # roll count
```

`--calibrate` prints `RAW_QUANTILES`, `HYPE_QUANTILES` and `BUILD_RARITY_CUTS` ready to
paste into `src/constants.js`. Those three are measured, not chosen — regenerate them
whenever anything upstream moves, then re-run the other checks.

## Verification status

**95+ rates, 2M rolls, rolled archetypes disabled.** Reproduces the published table;
worst deviation 3.7%, on Block, the rarest column and so the noisiest.

| | Finishing | Speed | Playmaking | Mid-Range | Handles | Three | Perim D | Dunk | Rebounding | Interior D | Post | Block |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| measured | 22 | 45 | 65 | 67 | 68 | 78 | 82 | 206 | 215 | 299 | 301 | 411 |
| published | 22 | 45 | 65 | 67 | 67 | 77 | 83 | 209 | 220 | 298 | 306 | 427 |

**Archetype inflation, 1M rolls each.** Gifts inflate the height-gated stats most and
shooting barely at all, so the asymmetry the design depends on survives.

| | Rebounding | Block | Speed | Dunk | Perim D | Interior D | Finishing | Mid-Range | Handles | Playmaking | Three | Post |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| before | 214 | 413 | 45 | 210 | 82 | 298 | 22 | 67 | 67 | 66 | 78 | 296 |
| after | 161 | 322 | 38 | 179 | 72 | 264 | 20 | 61 | 65 | 65 | 77 | 303 |
| inflation | ×1.33 | ×1.28 | ×1.18 | ×1.17 | ×1.14 | ×1.13 | ×1.11 | ×1.09 | ×1.03 | ×1.01 | ×1.01 | ×0.98 |

Per-attribute rarity tiers did not need retuning — `rarityP` is always evaluated
against the natural expectation and the normal sigma, so a gift shows up as a better
number at the same tier boundaries. The **build**-rarity cuts were recalibrated with
gifts enabled.

**Overall distribution**, 1M rolls, against the Basketball GM shape:

| Band | Measured / season | Target |
|---|---|---|
| 70–79 | 5.5 | ~6 |
| 80–89 | 0.29 | ~1 per 3 seasons |
| 90+ | 0.08 | ~7 per century |

**Career sim**, 200k careers, per player-season against a 450-player league:

| | measured | target |
|---|---|---|
| drafted | 20.4% | — |
| lottery share of drafted | 22.6% | 23% (14 of 60) |
| all-star selection | 5.09% | 5.3% (24 of 450) |
| MVP | 0.198% | 0.22% (1 of 450) |
| championship | 3.30% | 3.3% (15 of 450) |
| Hall of Fame (of those who played) | 0.47% | ~0.5% |
| lottery picks who bust | 35.9% | — |

Mean career 7.3 seasons for players who reach the league. The aging mechanic
separates as designed: builds with `dependence >= 1.6` finish at 29.9 on average,
shooting-and-IQ builds at `dependence <= 0.85` finish at 32.6.

## Two places the spec's own numbers do not close

Reported rather than quietly tuned around.

**1. The chase-pull table is not reachable from the spec's constants.** The 12-row 95+
table pins dunk base 8, growth 2.9, sigma 18, `P_UP` 0.30 and `FREAK_MULT` 2.6, and
with those pinned there is no free parameter left. What the stated math actually gives
for a 5'10" chasing a 95+ dunk (expected value 25 at that height):

| | spec | this engine |
|---|---|---|
| without freak gene | 1 in 558,000,000 | 1 in 8,377,338 |
| freak gene already on dunk | 1 in 5,800,000 | 1 in 29 |
| blended, a fresh roll at that height | — | 1 in 104,832 |

The spec's two "with freak gene" figures (5.8M here, ~6M for the 5'4"/99 case in hard
rule 3) are also inconsistent with each other under the engine's arithmetic. The design
*intent* does hold: without the gene the pull is effectively impossible, with it, it is
real. Constants were left exactly as specified. `npm run sim -- --chase`.

**2. Three Common archetypes have no cost.** Section 5A states every rolled archetype
must have one, but the Common table lists "—" for Gym Rat, High Motor and Soft Touch
(and gives Iron's cost as the absence of skill gifts). The tables are the concrete
artifact, so they ship verbatim rather than with invented costs. These are the three
smallest gifts in the game, so the "collapses build variety" risk the rule guards
against is not really in play at that tier.

## Two calibration judgement calls

**What the BBGM target is measured against.** Player-seasons are survivorship-biased —
a 70 plays fifteen seasons and a 62 plays two — so matching that series to the BBGM
snapshot would make a 70 overall a 1-in-2,300 roll, a chase nobody completes. The
target here is instead the **per-build** rate: how often a roller sees a 70/80/90
matches how often those ratings exist in a league season. `--careers` reports the
in-league player-season distribution separately so the difference stays visible.

**Build rarity is spike-weighted.** A flat sum of surprisal across twelve skills lets
broad mediocrity outscore one enormous pull — a 98 playmaking on an otherwise poor
build came out as "Common". The top three surprisals now carry full weight and the rest
are discounted at 0.3, so a chase pull reads as one.

## Layout

```
src/constants.js    the math, and every measured constant
src/rng.js          seedable RNG (daily seed, reproducible harness runs)
src/roll.js         rollStat, rarityP, tiers, the beat plan
src/archetypes.js   rolled gifts (boost/sigmaMult/floor/cost) + derived diagnoses
src/traits.js       hidden-stat traits, each with a real simulation effect
src/overall.js      position weights, percentile calibration, build rarity
src/career.js       draft, growth, seasons, injuries, aging, awards
src/verdict.js      the shareable line
src/names.js        original league, teams and names
tools/sim.js        Monte Carlo harness
tools/serve.js      static dev server
web/                UI
```

## Design notes

- **Roll order is load-bearing.** Height, then body, then the archetype gift, then
  mentality, then the twelve skills shuffled, then the physicals. Mentality lands
  before any skill so that every shooting roll afterwards has stakes.
- **Mentality is an axis, not a quality.** It only means something against the skill
  profile, through `fit`, which feeds peak overall, usage and efficiency.
- **Nothing is capped.** Some things are just absurdly expensive in luck.
- **Aging makes the boring stats valuable.** Decline is driven by `dependence` —
  athleticism over shooting and IQ. Severe injuries permanently cut speed and dunk and
  never touch skills, which is why the shooters last.
- **You roll your way into greatness and only fail your way into a diagnosis.** The
  Chucker and The Ghost cannot be rolled.

The daily-seed leaderboard is `localStorage` only — v1 has no backend, so it is your own
run history on today's seed rather than a global board.

No real player, team or league names are used anywhere, and none of the reference
implementations were copied from.
