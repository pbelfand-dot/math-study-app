# 📐 Pre-Calc Final Prep

A Blue Book–style study app for your pre-calculus final. No installs, no build step — it's a single static page.

## How to use it

**Option 1 (easiest):** download/clone this repo and double-click `index.html`. It opens in your browser and just works.

**Option 2 (study from your phone):** turn on GitHub Pages for this repo
(Settings → Pages → Deploy from branch → pick this branch, root folder) and
you'll get a link you can open anywhere.

> The app needs internet access the first time so it can load the math-rendering
> library (KaTeX) from a CDN — after that your browser usually caches it.

## What's inside

- **132 questions** across 10 topics: functions & transformations, polynomials &
  rationals, exponentials & logs, unit circle & trig graphs, trig identities &
  equations, triangles (law of sines/cosines), sequences & series, conics,
  vectors/polar/parametric, and limits.
- **Practice Mode 🎯** — pick topics, get instant feedback with a full worked
  explanation after every question, and build a streak 🔥.
- **Full Test Mode ⏱️** — timed No-Calculator (20 Q / 30 min) and Calculator
  (20 Q / 40 min) sections with flagging, a question palette, a review screen
  before submitting, and a score report broken down by topic. Questions are
  drawn fresh each time, so retakes stay interesting.
- **Fix My Mistakes 🩹** — every question you miss anywhere gets collected so
  you can redo exactly the ones that hurt you. Answer one correctly and it
  leaves the pile.
- **Cheat Sheet 📜** — unit circle values, every identity, log rules, sequence
  formulas, and conic forms on one page.
- **Mixed answer styles** — multiple choice plus type-in answers (fractions
  like `3/4` and rounded decimals are both accepted), just like grid-ins.

Progress, streaks, and test history are saved in your browser
(`localStorage`), so closing the tab won't lose anything. "Reset all progress"
on the home screen wipes it if you want a fresh start.

## Study plan for the next 4 days

1. **Day 1–2:** Practice Mode by topic. Hit every topic at least once; read the
   explanation on every miss (that's where the learning happens).
2. **Day 3:** Take both timed sections cold. Then grind "Fix My Mistakes" until
   it's empty.
3. **Day 4 (day before):** One more pair of timed sections + skim the Cheat
   Sheet. Sleep. Seriously.

## Adding questions from your teacher's review

The whole bank lives in `questions.js` — each question is a small object with
the prompt, choices/answer, and an explanation. Paste your review packet into a
Claude session and ask it to add matching questions to the bank.
