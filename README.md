# 📐 Math 4H Final Prep

A Blue Book–style study app matched to the Math 4H (pre-calc honors + intro
calculus) final, built from the teacher's review packets (transcribed in
`review/`). No installs, no build step — it's a single static page.

## How to use it

The layout is fully responsive — it works on a computer and on an iPhone.

**On a computer:** download/clone this repo and double-click `index.html`
(or open `Math4H-Final-Prep.html`, the single-file version). It just works.

**On an iPhone (recommended — study anywhere):** turn on GitHub Pages for this
repo (Settings → Pages → Deploy from branch → pick this branch, root folder) to
get a link. Open that link in Safari, tap the **Share** button, then **Add to
Home Screen** — it launches full-screen like a real app, and your progress is
saved on the phone. (You can also AirDrop `Math4H-Final-Prep.html` to the phone
and open it in Safari.)

> The app needs internet access the first time so it can load the math-rendering
> library (KaTeX) from a CDN — after that your browser usually caches it.

## What's inside

- **455 questions** across 13 topics (35 per topic), each rated Easy/Medium/Hard, weighted toward what's actually on the
  final: derivative rules (product/quotient/chain), tangent lines & particle
  motion, limits & continuity (incl. IVT), integrals & Riemann sums, unit
  circle & trig graphs, trig identities & equations, exponentials & logs,
  polynomials & rationals, functions & transformations, conics, and
  vectors/polar/parametric. (Sequences and law of sines/cosines stay available
  in practice but are excluded from test mode since they're not on this final.)
- **56 of those questions are modeled directly on the review packets** —
  same setups, same traps, sometimes the exact problem.
- **Practice Mode 🎯** — pick topics, get instant feedback with a full worked
  explanation after every question, and build a streak 🔥.
- **Full Test Mode ⏱️** — timed No-Calculator (20 Q / 35 min) and Calculator
  (15 Q / 35 min) sections with flagging, a question palette, a review screen
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
