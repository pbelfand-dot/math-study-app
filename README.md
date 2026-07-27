# Hoop Life

A basketball life simulator, played one year at a time. You start at fourteen with a
set of **genetics you cannot see** — the height you will finish at and a ceiling on
every attribute — and you spend the next eight years deciding what to do about it,
one year at a time. Then the draft finds out what the whole thing was worth.

The roll engine that used to *be* the game is still here in full. It just describes
your genetics now instead of your player: every attribute is scored against what is
**expected for that player's height**, not against 99.

A 6'0" with a 94 dunk is a freak. A 7'1" with a 94 dunk is Tuesday.

Vanilla HTML/CSS/JS, ES modules, no framework, no backend, no dependencies.

## What a year is

Four buttons around the `+`: **Train**, **School**, **People**, **Life**.
Everything can be done once a year and that is the only bookkeeping. There is no
time budget — an abstract "18% of the year" tax on every button turned each
decision into arithmetic. What actually limits a year is the same set of things
that limits a real one: **money**, a **body** that accumulates wear and then
breaks, **grades** that decay while you are in the gym, and **people** who drift
if you never turn up. Doing everything is allowed. It is a good way to blow out
a knee.

**Most of what you can do is hidden until it applies to you.** You do not see
*Beg for extra credit* until your grades are failing, *Rehab the injury* until
you are hurt, *Sign an NIL deal* until enough people know your name, *Try to
patch things up* until a relationship has gone bad, or *Enter the transfer
portal* until you have spent a season on a bench. Finding out an option exists
is part of the game. A single played life surfaces around twenty of them, and
never the same twenty.

### Working one thing

Under Train there is a list of all twelve attributes. Each row shows where the
number is now, where your genetics let it end up, **exactly what one session
adds**, and how many more sessions are worth taking. Those are the only
repeatable actions in the game, and they decay hard: a second session on the
same attribute in the same year is worth **half**, a third a **fifth**, and a
fourth is worth **nothing at all** and says so. Grinding one number is
self-limiting without a rule that says you cannot.

The grouped sessions print the same thing. *Weight room* does not say "strength
and explosion" and leave you to guess — it says `Dunk +2.1 · Finishing +1.3 ·
Interior D +0.9 · Rebounding +0.3`, computed against how much room you actually
have left in each.

### Getting the body back

Recovery is a ladder, not a button, and the free rungs work — you can play a
whole life without spending anything on it. They are just slower and less
certain:

| | | |
|---|---|---|
| Ice it and wait | free | 45% to clear the injury. Otherwise you lost the year as well. |
| The team physio | free | 70%, and it takes most of a season |
| Private physiotherapy | $800 | certain |
| Sports medicine clinic | $3,200 | certain, clears all wear, rebuilds a little speed |
| Fly out to a specialist | $11,000 | certain, and the only thing in the game that gives back what an injury permanently took |

Same shape for staying ahead of it: *Stretch and ice every night* is free and
adds up; a *recovery therapist* is $700; an *offseason at a performance centre*
is $5,500 and zeroes your wear.

Measured over 6,000 lives, that is worth about **four and a half points of draft
rate** between the poorest and richest backgrounds — 17.3% against 21.8% — while
the share of your genetic ceiling you reach is **identical at 91%** across all
four. Money buys reliability and it buys the top rung. It does not buy
development, and the option you cannot afford is shown blocked with its price
rather than hidden, so you can see what you are missing.

## Possessions

Every season you played puts you in a game situation and asks what you do. Each
option is resolved against **the attribute it actually depends on**, so the
numbers you spent four years training are the numbers that decide whether it
goes in:

> **Top of the key** — You catch it with a foot on the line and a defender
> closing hard. Two seconds on the shot clock.
> *Rise and shoot it* (three) · *Pump fake and drive* (handles) · *Swing it to
> the corner* (playmaking)

Eight scenarios, 23 options between them: transition two-on-ones, the last shot
down one, an isolation your coach cleared out for you, guarding their best
player, protecting the rim, two free throws with the game level. Parity is a
coin flip — an attribute exactly equal to the difficulty makes the play half the
time — so the same possession is a different decision for every build.

Measured over 4,000 players facing the same pool:

| how you pick | make rate |
|---|---|
| the flashiest option every time | 45% |
| the safest option every time | 68% |
| the one your attributes are best at | 72% |

Taking off from the dotted line is a real gamble. Knowing what you are actually
good at is the best play in the game, and the only way to know is to have
looked.

## Things happen to you

Two kinds, in `src/events.js`, and both read your situation rather than firing at
random — a recruiting letter needs somebody to have heard of you, a transfer
pitch needs you to be buried, the academic scandal needs you to have been cutting
corners.

**Passive events** land in the year's log: a mixtape catches and hype jumps, a
scout comes to a game and you go 2-for-14, your father loses a job, a teammate
says something to a reporter that was not flattering and not wrong, you get
made captain, you grow into your body, somebody goes through your bag.

**Choice events** stop the year and ask, and there is no way out but answering.
A booster leaves an envelope with $4,000 in it — take it, hand it back, or
report it and watch the locker room decide about you. You roll an ankle in
warmups before the biggest game of the season and it will probably hold. Your
mother is ill and the season is halfway through. None of the branches are free:
the obviously correct answer costs you something too, or it would not be a
choice.

Two to four things happen every year, and roughly two years in three ask you
something. Verified across 2,000 simulated lives: every entry in both tables
fires, and the once-in-a-life beats never repeat.

## The ceiling is a cap, not a stopper

The rolled ceilings used to be a wall: at the number the room hit zero, gains
hit zero, and the attribute was finished forever. That broke this project's own
first rule — *nothing is capped, some things are just absurdly expensive in
luck* — and it left low rolls mathematically dead before they had played a game.

Work above the ceiling now keeps paying, into **headroom you earn**: every
session ever spent on that attribute raises the level it asymptotes toward, and
talent and work ethic set how much is available. There is no free component,
deliberately — a flat bonus on all twelve attributes is not "the cap can be
broken", it is just a higher cap, and when it was tried it inflated the whole
game to 42% of every life reaching a pro league.

Measured across 600 pairs of lives:

| | points above the rolled ceiling |
|---|---|
| ground one attribute all life | median **+2.3**, p90 **+6.9**, max **+12.3** |
| spread across everything | **−9.0** on that attribute |

So breaking a ceiling is real, and it costs you the years you did not spend on
anything else. Once you are past it the row says *Past what you were dealt*,
because "at your genetic ceiling" was a lie the moment the cap stopped being a
wall.

**And nobody is written off.** The undrafted signing chance has a 5% floor — a
camp invite, a two-way, a summer roster somewhere. Below it the maths said a
poor roll had *exactly zero* chance of ever being seen, which is both wrong
about basketball and a dead end to hand someone who just played eight years. By
genetic band, the share of lives that reach a pro league:

| true ceiling | 0-35 | 35-45 | 45-55 | 55-65 | 65-80 | 80+ |
|---|---|---|---|---|---|---|
| made the league | 6.1% | 7.3% | 22.0% | 52.5% | 87.1% | 99.0% |

## The slider nobody sees

Every life rolls a hidden **talent** value that multiplies everything training
ever does. It is never shown, never hinted at, and not in any panel — two
players who make identical decisions for eight years do not arrive in the same
place, and this is why. It is revealed with the four hidden mentals after the
career is over, which is usually the moment the whole arc makes sense.

### Nothing is separable

The systems feed each other on purpose, so there is no one stat to farm:

| | |
|---|---|
| **School → basketball** | Class raises **Smarts**. Smarts is what makes watching film worth anything — a smart player learns twice as much from the same session — and film is what raises basketball IQ, which is in your overall rating. Grades also gate eligibility: fail and you sit the season, and schools stop recruiting you. |
| **Teammates → the box score** | Team chemistry is the average of how your teammates feel about you, and it multiplies your **assists** directly. A locker room that has decided about you does not look for you on the break. |
| **The coach → minutes** | Coach trust moves your minutes more than any other single input. Minutes are what produce stats, stats are what produce hype, and hype is what produces offers. Asking for minutes works if he already rates you and backfires if he does not. |
| **Money → everything** | Trainers, tutors, camps, agents, surgeons. Your family background sets how much you start with and how much arrives each year, so being broke is a real disadvantage — beatable with a job, which is the point. |
| **The body → the limit** | Physical work accumulates wear; wear drives the injury roll; an injury costs speed and dunk permanently and takes a year to rehab. With no time budget this is the thing that stops you doing everything, and options warn you before you cross it rather than after. |

## The shape of a life

| | |
|---|---|
| **14–18, high school** | Train, go to class, work, or get seen. AAU and elite camps cost money you may not have, and exposure is the entire recruiting path. You can be cut, ruled academically ineligible, or blow out a knee. |
| **graduation** | You are rated 1–5 stars against everyone else in your class and the offers that came in are the offers you get. There is always somewhere to go. Four stars or better also unlocks declaring straight out of high school, which almost nobody should take. |
| **18–22, college** | The program's development staff, the minutes you can get, and how often you are on television all come from the school you picked. A whole new locker room to win over. NIL money, media training, an agency, the pre-draft workout circuit, and the transfer portal if it is not working. |
| **every year after the first** | Declare, or go back to school. Leaving early sells development you have not had yet; staying banks ability but you are closer to finished when they draft you. |
| **the draft** | The existing career sim takes it from there — draft, growth, injuries, aging, awards, the Hall. |

**Your potential is never shown to you.** Scouts give you a *grade*, on the same scale
as everything else, and it is a projection that is allowed to be wrong. The four
hidden mentals — work ethic, IQ, clutch, coachability — are revealed only after the
career is over, which is usually when the arc makes sense in hindsight.

## Play it on your phone

`docs/` is an installable, offline-capable web app. Publish it free on GitHub Pages:

1. Push this branch.
2. Repo **Settings → Pages** → Source: *Deploy from a branch* → branch
   `claude/hooper-build-simulator-t1askb`, folder `/docs` → Save.
3. Wait a minute, then open the URL it gives you.

**iPhone** — open the URL in Safari, tap Share → *Add to Home Screen*.
**Android** — Chrome shows an *Install app* prompt, or menu → *Install app*.

It then runs from the home screen with no browser chrome, works with no signal,
and keeps your vault, badges and streak on the device.

**A life in progress survives a reload.** The current life is written to
`localStorage` on every state change and picked back up on boot — a phone dropping
the tab out of memory would otherwise cost eight years of decisions, which on a game
made entirely of decisions is the whole game. A career that has already finished is
not resumed; there is nothing left to decide.

**Offline is verified, not assumed.** Load once with a connection, then cold-start
with the network cut: the game loads, a full career simulates, progress saves, and a
relaunch still has it — zero failed requests, zero errors. The only requirement is
that first online load, which is what installs the cached copy.

**Progress is backed up by hand, because there is nowhere else to put it.** iOS can
clear a site's stored data; home-screen apps are exempt from the aggressive seven-day
rule, but "exempt in normal conditions" is not worth staking a month of pulls on when
there is no server to restore from. The vault has Copy backup / Restore from text:
tested against a full wipe, and a malformed paste is rejected without touching what is
already there. Rebuild it with
`npm run site` after any change; the service worker cache is keyed to a hash of
the page, so a new build replaces the old one instead of leaving people stranded
on a stale copy.

No store, no review, no developer account, no fee.

## What keeps you coming back

- **Career vault** — every simulated career, ranked by a score weighted toward
  MVPs, rings and peak rather than longevity.
- **20 achievements** — weighted toward what the roll teaches: defying your
  height, surviving the draft, and the failure diagnoses you cannot roll.
- **Daily streak** — the daily seed gives everyone the same build; playing it on
  consecutive days builds a streak, and missing two days resets it.

All of it is `localStorage`, so it is per-browser and per-device. There is no
account and no backend, which is stated in the UI rather than discovered when a
cleared cache eats a month of pulls.

## Running it

```sh
npm run dev     # http://localhost:8080
npm run sim     # Monte Carlo harness — the rarity table
npm run bundle  # dist/build-a-hooper.html — one self-contained file
npm run exe     # dist/HoopLife.exe — standalone Windows app
npm run site    # docs/ — installable PWA for GitHub Pages
npm run icons   # regenerate the icon set
```

The dev server exists only because ES modules cannot load over `file://`. If you
would rather not run anything, `npm run bundle` flattens the modules into a single
326 kB HTML file you can double-click straight off disk — same game, no server.

### The desktop app (Electron)

```sh
npm install
npm run desktop            # run it in a real window
npm run desktop:win        # dist/HoopLife-1.0.0-portable.exe
npm run desktop:installer  # an NSIS installer instead
```

`electron-main.cjs` loads **`dist/build-a-hooper.html`**, not `web/index.html`. That
matters: Electron's `loadFile` serves over `file://`, and Chromium blocks ES module
imports from `file://` origins, so pointing it at `web/index.html` opens a window with
the chrome painted and no game inside it. The `desktop` scripts run `npm run bundle`
first so the single-file build always exists.

Electron gives a real window with no browser chrome, at roughly 150 MB. The native
launcher below is 379 kB and opens your browser instead — pick whichever trade you
prefer; both play the identical game.

### The executable

`npm run exe` produces a **366 kB** standalone Windows app: a small C launcher
(`tools/launcher.c`) with the game embedded as a byte array, which writes it to the
temp directory and hands it to the default browser. No install, no server, no port.
Building it needs `mingw-w64`; running it needs nothing.

| | native (default) | Node SEA (`npm run exe:node`) |
|---|---|---|
| size | 366 kB | 83 MB |
| how it runs | writes temp file, opens browser | loopback server, opens browser |
| platforms | Windows | Windows, macOS, Linux |
| build needs | mingw-w64 | postject |

The SEA path exists for macOS and Linux (`npm run exe:mac`, `npm run exe:linux`),
where mingw cannot help. It is 83 MB because it carries an entire JavaScript runtime
whose only job is to serve one 326 kB file — which is exactly why the native launcher
is the default. That path also **strips the Authenticode signature** from `node.exe`
before injecting, since appending a resource invalidates it and Windows treats a
corrupt signature worse than a missing one.

Both are **unsigned**, so SmartScreen shows "Windows protected your PC" on first run
(More info → Run anyway). Signing needs a certificate this build cannot have.

Both builds were verified by running the actual `.exe` under Wine: each delivers the
browser content byte-identical to `dist/build-a-hooper.html`, and that page plays
through to a career with no console errors.

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
npm run sim -- --recruit       # re-emit STAR_CUTS and RECRUIT_CUTS
npm run sim -- --pipeline      # high school -> college -> draft, end to end
npm run sim -- -n 2000000      # roll count
```

The life engine gets the same gate the roll engine has always had, for the same
reason: its first pass produced a **31.5% five-star rate** and a median pro potential
of **35** against a draft cutoff of 62, and neither of those is visible from playing a
few lives by hand. `tools/life-sim.js` plays lives with a stand-in for a competent
player — deliberately not an optimal one; it cannot see the hidden mentals and it does
not look ahead — because balance measured against a perfect player is balance nobody
experiences.

`--calibrate` prints `RAW_QUANTILES`, `HYPE_QUANTILES` and `BUILD_RARITY_CUTS` ready to
paste into `src/constants.js`. Those three are measured, not chosen — regenerate them
whenever anything upstream moves, then re-run the other checks.

## The roll curve is magnetic

The original draw was `sigma * sqrt(-ln u)` with 30% of deviations pointing up.
That magnitude is **Rayleigh distributed**: its density is *zero* at the expected
value and peaks at `sigma/sqrt(2)`. So the number labelled "expected" was the one
outcome you could essentially never roll, the single most likely result sat about
0.7 sigma below it (21 points below, for Three), and you landed under it 70% of the
time. The label was not describing the distribution.

The curve now draws a **half-normal magnitude with a fair coin for direction**, and a
wider scale downward than upward:

| | old | new |
|---|---|---|
| lands at or above expected | 30.6% | **51.0%** |
| lands within 5 of expected | 7.2% | **22.2%** |
| pinned at the 25 floor | 30.8% | **19.0%** |
| median deviation | −11 | **0** |

Falloff is Gaussian, so drifting a little is cheap and drifting a lot gets expensive
fast — and the two sides diverge as you go out, which is the point:

| distance from expected | that far below | that far above | bad is likelier by |
|---|---|---|---|
| 0.5σ | 31.0% | 26.6% | 1.2× |
| 1.0σ | 16.1% | 10.6% | 1.5× |
| 2.0σ | 2.4% | 1 in 161 | 3.8× |
| 3.0σ | 1 in 672 | 1 in 11,310 | 16.8× |
| 3.5σ | 1 in 3,777 | 1 in 164,701 | 43.6× |

Near the average the sides are nearly even. Far out, a horrible roll is 44× likelier
than a brilliant one — while still being 1 in 3,777, so genuinely bad players stay
hard to get too.

## Verification status

**95+ rates, 2M rolls, rolled archetypes disabled.** `UP_SCALE` is tuned so the chase
economy survives the curve change: the ordering is identical and every rate lands
within 8% of the originally published table, so rare pulls are exactly as rare as
before — only the bulk moved onto the target.

| | Finishing | Speed | Playmaking | Mid-Range | Handles | Three | Perim D | Dunk | Rebounding | Interior D | Post | Block |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| measured | 23 | 46 | 65 | 66 | 68 | 76 | 80 | 201 | 208 | 279 | 282 | 396 |
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

**The life pipeline**, 12,000 lives played competently, high school through the draft:

| | measured | note |
|---|---|---|
| five-star recruits | 2.2% | cuts are measured percentiles, not round numbers |
| four-star | 8.3% | |
| blue-blood offer in hand | 6.6% | |
| no offer at all | 24.3% | prep year / overseas is always there |
| genetic ceiling realised by 22 | 93% median | |
| drafted | 26.2% | 21.9% for the raw genetics, unplayed |
| made the league | 33.3% | 29.0% raw |
| all-star selections per life | 0.17 | |

The number that matters most is the conditional one. **Of lives whose genetics were
actually there — a true ceiling of 80 or better — 97% get drafted and each averages
3.8 all-star selections.** A played life now beats the raw unplayed build, which
is the whole point of a ceiling you can train past. A pipeline that loses gifted players is worse than one that
is merely stingy, and before the college stage existed this engine lost nearly all of
them: four years of high school closed too little of the genetic gap, so the median
build reaching the draft projected to a **35** and essentially nobody turned pro.

The harness plays with a stand-in for a competent player that makes the same
choices the UI offers: triage eligibility and health first, buy exposure, tend
the coach and the locker room, then spend what is left in the gym. Three knobs
do the work, and all three are load-bearing:

- **Star ratings are a rank, not a score.** Five-stars are the couple-dozen best
  players in a country. Keying the rating off raw hype thresholds let anyone who could
  afford enough camps buy one.
- **How much of the remaining gap the pros close scales with how young you declare.**
  A nineteen-year-old has more development runway ahead than a twenty-two-year-old who
  is nearly finished. Without that term, staying four years was strictly dominant and
  the one-and-done path made no sense.
- **The training rate has to be re-measured every time the constraint changes.**
  Three fixed slots, then a time budget, then no budget at all: each move
  changed how many sessions a year holds, and each one moved the
  ceiling-realised figure by eight to seventeen points before the rate was
  retuned. Removing the budget alone took it from 89% to 97% — everything
  became affordable — and the rate came down from 0.35 to 0.155 to put it back.

## Two places the spec's own numbers do not close

Reported rather than quietly tuned around.

**1. The chase-pull table is not reachable from the spec's constants.** Its two "with
freak gene" figures — 1 in 5,800,000 for the 5'10"/95 dunk, ~1 in 6,000,000 for the
5'4"/99 dunk in hard rule 3 — are inconsistent with each other under the engine's own
arithmetic, and were not reachable under the original curve either. For a 5'10"
chasing a 95+ dunk (expected 25 at that height):

| | spec | old curve | magnetic curve |
|---|---|---|---|
| without freak gene | 1 in 558,000,000 | 1 in 8,377,338 | 1 in 1,251,802 |
| freak gene already on dunk | 1 in 5,800,000 | 1 in 29 | 1 in 31 |
| blended, a fresh roll at that height | — | 1 in 104,832 | 1 in 101,842 |

The design *intent* holds under both: without the gene the pull is effectively
impossible, with it, it is real. `npm run sim -- --chase`.

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
tools/bundle.js     flattens the modules into one HTML file
tools/build-exe.js  standalone executable (Node SEA)
tools/fetch-fonts.js  regenerates web/fonts.css
tools/build-site.js   docs/ — PWA, manifest, service worker
tools/make-icons.js   the icon set, rasterised with no dependencies
src/progress.js       vault, achievements, daily streak, the saved life (localStorage)
src/life.js         the year-by-year engine: growth, seasons, recruiting, college,
                    the declare decision, and the handoff to the draft
src/actions.js      the catalogue — what a year can be spent on, and the
                    conditions that make each option exist at all
src/events.js       what happens to you: passive events and the questions
src/people.js       the cast, their relationships, and what each one controls
tools/life-sim.js   Monte Carlo for the life pipeline
web/                UI — the year feed, the + button, fonts inlined as data URIs
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


## Standalone desktop app

This project now includes an Electron desktop shell. It opens in its own **Hoop Life** window, works offline, and stores saves locally through the app's local storage.

```bash
npm install
npm run desktop
```

Build a portable Windows executable:

```bash
npm run desktop:win
```

Build a Windows installer:

```bash
npm run desktop:installer
```

Output is written to `dist/`. The executable is unsigned, so Windows SmartScreen may show a warning until the app is code-signed.

## Career progression model

Career simulation now separates:

- **Draft OVR** — the player's rating when entering the league.
- **Potential** — the development ceiling influenced by work ethic, basketball IQ, coachability, fit, traits, and randomness.
- **Peak OVR** — the highest rating actually reached.

Players develop fastest from ages 19–22, improve more slowly near their potential, and can experience breakouts, stalled seasons, injuries, and age-based decline. The season table includes the OVR change for every year.
