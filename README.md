# Build a Hooper

A basketball build-roller and career simulator. You roll a player one attribute at a
time. Every attribute is scored against what is **expected for that player's height**,
not against 99. Then you simulate their career and find out what the build was worth.

A 6'0" with a 94 dunk is a freak. A 7'1" with a 94 dunk is Tuesday.

Vanilla HTML/CSS/JS, ES modules, no framework, no backend, no dependencies.

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
npm run exe     # dist/BuildAHooper.exe — standalone Windows app
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
npm run desktop:win        # dist/BuildAHooper-1.0.0-portable.exe
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
npm run sim -- -n 2000000      # roll count
```

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
src/progress.js       vault, achievements, daily streak (localStorage)
web/                UI — scoreboard styling, fonts inlined as data URIs
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

This project now includes an Electron desktop shell. It opens in its own **Build a Hooper** window, works offline, and stores saves locally through the app's local storage.

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
