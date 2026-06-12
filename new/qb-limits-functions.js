// ===== Math 4H Final Prep — New Questions: Limits, Functions, Polynomials =====
// Same format as questions.js, plus a `simple` field (plain-English one-liner, no LaTeX).

module.exports = [

// ================= LIMITS & CONTINUITY (ids 270-286) =================
{
  id: 270, topic: "limits", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to 2} \\frac{x^2 + 3x - 10}{x - 2}\\)",
  answer: ["7"],
  simple: "Plugging in 2 gives 0/0, so factor the top into (x+5)(x−2), cancel the (x−2), and plug in 2: you get 7.",
  expl: "Direct substitution gives \\(\\frac{0}{0}\\), so factor: \\(\\dfrac{(x+5)(x-2)}{x-2} = x + 5\\) for \\(x \\ne 2\\). The limit is \\(2 + 5 = 7\\). A \\(\\frac{0}{0}\\) form doesn't mean DNE — it means \"do more algebra.\""
},
{
  id: 271, topic: "limits", calc: false, type: "mc",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to -3} \\frac{x^2 + x - 6}{x + 3}\\)",
  choices: ["\\(0\\)", "\\(5\\)", "\\(-5\\)", "does not exist"],
  answer: 2,
  simple: "It's 0/0, so factor the top into (x+3)(x−2), cancel, and plug in −3 to get −3 − 2 = −5.",
  expl: "It's \\(\\frac{0}{0}\\); factor: \\(\\dfrac{(x+3)(x-2)}{x+3} = x - 2\\), so the limit is \\(-3 - 2 = -5\\). Trap: a \\(\\frac{0}{0}\\) form is indeterminate, not automatically DNE — and watch the sign: \\(-3 - 2\\), not \\(3 + 2\\)."
},
{
  id: 272, topic: "limits", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to \\infty} \\frac{6x^3 - x}{2x^3 + 5x^2}\\)",
  answer: ["3"],
  simple: "Top and bottom are both degree 3, so the answer is just the front numbers divided: 6 ÷ 2 = 3.",
  expl: "Degrees are equal (both 3), so the limit is the ratio of leading coefficients: \\(\\dfrac{6}{2} = 3\\). The \\(-x\\) and \\(5x^2\\) terms become irrelevant as \\(x\\) grows."
},
{
  id: 273, topic: "limits", calc: false, type: "mc",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to \\infty} \\frac{4x^2 + 1}{x^3 - 7}\\)",
  choices: ["\\(0\\)", "\\(4\\)", "\\(+\\infty\\)", "\\(-\\dfrac{4}{7}\\)"],
  answer: 0,
  simple: "The bottom's degree (3) beats the top's (2), so the bottom wins the race and the fraction shrinks to 0.",
  expl: "Bottom degree (3) is bigger than top degree (2), so the denominator grows faster and the limit is \\(0\\). Trap: the ratio of leading coefficients (4) only applies when the degrees are EQUAL."
},
{
  id: 274, topic: "limits", calc: false, type: "mc",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to \\infty} \\frac{x^3 + 2x}{5x^2 + 1}\\)",
  choices: ["\\(0\\)", "\\(+\\infty\\)", "\\(\\dfrac{1}{5}\\)", "\\(5\\)"],
  answer: 1,
  simple: "The top's degree (3) beats the bottom's (2), so the fraction just keeps growing without bound: infinity.",
  expl: "Top degree (3) beats bottom degree (2), so the numerator dominates and the limit is \\(+\\infty\\) (everything is positive for large \\(x\\)). Third case of the degree-comparison rule: top bigger → no finite limit."
},
{
  id: 275, topic: "limits", calc: false, type: "mc",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to 3^-} \\frac{1}{x - 3}\\)",
  choices: ["\\(0\\)", "\\(+\\infty\\)", "\\(\\dfrac{1}{3}\\)", "\\(-\\infty\\)"],
  answer: 3,
  simple: "Coming at 3 from the left, x − 3 is a tiny negative number, and 1 divided by tiny-negative blows up to negative infinity.",
  expl: "From the left, \\(x - 3\\) is a small NEGATIVE number, e.g. \\(\\frac{1}{2.99 - 3} = -100\\), so the values plunge to \\(-\\infty\\). Trap: from the right it would be \\(+\\infty\\) — the side determines the sign."
},
{
  id: 276, topic: "limits", calc: false, type: "mc",
  q: "Let \\(f(x) = \\begin{cases} x^2 + 1, & x < 2 \\\\ 3x - 1, & x \\ge 2 \\end{cases}\\). What is \\(\\displaystyle\\lim_{x \\to 2} f(x)\\)?",
  choices: ["\\(5\\)", "does not exist", "\\(4\\)", "\\(7\\)"],
  answer: 0,
  simple: "Both pieces give 5 at x = 2 (2² + 1 = 5 and 3·2 − 1 = 5), so the two sides agree and the limit is 5.",
  expl: "Check both sides of the break: left piece gives \\(2^2 + 1 = 5\\), right piece gives \\(3(2) - 1 = 5\\). They match, so the limit is \\(5\\). Trap: piecewise does NOT automatically mean the limit fails — you must actually compare the sides."
},
{
  id: 277, topic: "limits", calc: false, type: "mc",
  q: "Let \\(g(x) = \\begin{cases} 2x + 1, & x < 1 \\\\ x^2 - 3, & x \\ge 1 \\end{cases}\\). What is \\(\\displaystyle\\lim_{x \\to 1} g(x)\\)?",
  choices: ["\\(3\\)", "\\(-2\\)", "\\(\\dfrac{1}{2}\\)", "does not exist"],
  answer: 3,
  simple: "The left piece heads to 3 but the right piece heads to −2; the sides disagree, so there's no limit.",
  expl: "Left limit: \\(2(1) + 1 = 3\\). Right limit: \\(1^2 - 3 = -2\\). Since \\(3 \\ne -2\\), the two-sided limit does not exist. Trap: you can't average the sides — a limit requires both one-sided limits to be EQUAL."
},
{
  id: 278, topic: "limits", calc: false, type: "input",
  q: "Let \\(h(x) = \\begin{cases} x^2 - 4, & x < 3 \\\\ 2x - 4, & x \\ge 3 \\end{cases}\\). Find \\(\\displaystyle\\lim_{x \\to 3^+} h(x)\\).",
  answer: ["2"],
  simple: "From the right of 3 you're on the 2x − 4 piece, so plug in 3: 2·3 − 4 = 2.",
  expl: "\\(x \\to 3^+\\) means \\(x > 3\\), which uses the \\(2x - 4\\) branch: \\(2(3) - 4 = 2\\). Trap: the LEFT limit is \\(3^2 - 4 = 5\\), so don't grab the wrong piece — the \\(+\\) tells you which side you're on."
},
{
  id: 279, topic: "limits", calc: false, type: "input",
  q: "Let \\(f(x) = \\begin{cases} kx - 1, & x < 4 \\\\ 2x + 7, & x \\ge 4 \\end{cases}\\). Find the value of \\(k\\) that makes \\(f\\) continuous at \\(x = 4\\).",
  answer: ["4"],
  simple: "Make the two pieces meet at x = 4: set 4k − 1 equal to 2·4 + 7 = 15, and solve to get k = 4.",
  expl: "Continuity at the break needs left limit = right limit: \\(4k - 1 = 2(4) + 7 = 15\\), so \\(4k = 16\\) and \\(k = 4\\). Setting the two pieces equal AT the break point is the whole game."
},
{
  id: 280, topic: "limits", calc: false, type: "mc",
  q: "Which statement describes the discontinuities of \\(f(x) = \\dfrac{x - 5}{x^2 - 25}\\)?",
  choices: [
    "vertical asymptotes at both \\(x = 5\\) and \\(x = -5\\)",
    "a hole at \\(x = 5\\) and a vertical asymptote at \\(x = -5\\)",
    "a hole at \\(x = -5\\) and a vertical asymptote at \\(x = 5\\)",
    "holes at both \\(x = 5\\) and \\(x = -5\\)"
  ],
  answer: 1,
  simple: "The (x − 5) on top cancels the one hiding in the bottom, leaving a hole at 5, while x = −5 still kills the bottom and makes an asymptote.",
  expl: "Factor: \\(\\dfrac{x-5}{(x-5)(x+5)} = \\dfrac{1}{x+5}\\) for \\(x \\ne 5\\). The cancelled factor \\(x - 5\\) gives a removable hole at \\(x = 5\\) (height \\(\\frac{1}{10}\\)); the surviving factor gives a vertical asymptote at \\(x = -5\\). Cancels → hole; doesn't cancel → asymptote."
},
{
  id: 281, topic: "limits", calc: false, type: "mc",
  q: "Let \\(g(x) = \\begin{cases} x + 1, & x \\le 1 \\\\ x^2 + 3, & x > 1 \\end{cases}\\). What type of discontinuity does \\(g\\) have at \\(x = 1\\)?",
  choices: [
    "removable (a hole)",
    "infinite (a vertical asymptote)",
    "jump",
    "none — \\(g\\) is continuous at \\(x = 1\\)"
  ],
  answer: 2,
  simple: "The left side lands at 2 and the right side lands at 4, so the graph leaps from one height to another — a jump.",
  expl: "Left limit: \\(1 + 1 = 2\\); right limit: \\(1^2 + 3 = 4\\). Both one-sided limits are finite but unequal, which is exactly a jump discontinuity. (A hole would need the limit to exist; an asymptote would need a side to blow up to \\(\\pm\\infty\\).)"
},
{
  id: 282, topic: "limits", calc: false, type: "mc",
  q: "\\(f\\) is continuous on \\([1, 4]\\) with \\(f(1) = -6\\) and \\(f(4) = 3\\). By the Intermediate Value Theorem, which statement MUST be true?",
  choices: [
    "\\(f(c) = 0\\) for at least one \\(c\\) in \\((1, 4)\\)",
    "\\(f(c) = 0\\) for exactly one \\(c\\) in \\((1, 4)\\)",
    "\\(f\\) is increasing on \\([1, 4]\\)",
    "\\(f(2.5) = -1.5\\)"
  ],
  answer: 0,
  simple: "A continuous graph going from −6 up to 3 has to cross zero somewhere in between — at least once, but maybe more times.",
  expl: "\\(f\\) is continuous and \\(-6 < 0 < 3\\), so the IVT guarantees \\(f(c) = 0\\) for SOME \\(c\\) in \\((1,4)\\). Trap: the IVT never says \"exactly once\" or where — the function could wiggle through zero several times."
},
{
  id: 283, topic: "limits", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to 0} \\frac{\\sin(5x)}{x}\\)",
  answer: ["5"],
  simple: "For tiny x, sin(5x) acts just like 5x, so the fraction acts like 5x/x, which is 5.",
  expl: "Rewrite: \\(\\dfrac{\\sin(5x)}{x} = 5 \\cdot \\dfrac{\\sin(5x)}{5x} \\to 5 \\cdot 1 = 5\\), using \\(\\lim_{u \\to 0}\\frac{\\sin u}{u} = 1\\). Shortcut: \\(\\lim_{x\\to 0}\\frac{\\sin(kx)}{x} = k\\)."
},
{
  id: 284, topic: "limits", calc: true, type: "input",
  q: "Using a calculator in radian mode, estimate \\(\\displaystyle\\lim_{x \\to 0} \\frac{\\sin(6x)}{2x}\\) by evaluating at \\(x = 0.001\\). The limit is what integer?",
  answer: ["3"],
  simple: "Typing sin(0.006)/0.002 gives about 2.99998, so the limit is 3 — which matches the shortcut 6 ÷ 2.",
  expl: "Numerically: \\(\\dfrac{\\sin(0.006)}{0.002} \\approx 2.99998 \\to 3\\). Algebraically: \\(\\dfrac{\\sin(6x)}{2x} = \\dfrac{6}{2}\\cdot\\dfrac{\\sin(6x)}{6x} \\to 3\\). Trap: degree mode wrecks this — the famous limit only works in radians."
},
{
  id: 285, topic: "limits", calc: false, type: "mc",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to -1} \\frac{2x^2 + 5x + 1}{x + 3}\\)",
  choices: ["\\(0\\)", "\\(1\\)", "\\(-1\\)", "does not exist"],
  answer: 2,
  simple: "The bottom isn't zero at x = −1, so just plug in: (2 − 5 + 1)/(−1 + 3) = −2/2 = −1.",
  expl: "Substituting \\(x = -1\\) gives \\(\\dfrac{2 - 5 + 1}{2} = \\dfrac{-2}{2} = -1\\) — no zero denominator, so direct substitution finishes it. Don't factor reflexively: if plugging in works, you're done."
},
{
  id: 286, topic: "limits", calc: false, type: "mc",
  q: "Define \\(f(x) = \\dfrac{x^2 - 1}{x - 1}\\) for \\(x \\ne 1\\), and \\(f(1) = 5\\). What is \\(\\displaystyle\\lim_{x \\to 1} f(x)\\)?",
  choices: ["\\(5\\)", "\\(2\\)", "does not exist", "\\(0\\)"],
  answer: 1,
  simple: "The limit only cares where the graph is heading (x + 1 → 2), not the lonely dot someone stuck at height 5.",
  expl: "Near \\(x = 1\\): \\(\\dfrac{(x-1)(x+1)}{x-1} = x + 1 \\to 2\\). The limit ignores the actual value \\(f(1) = 5\\) — that mismatch just means \\(f\\) is discontinuous there. Classic trap: the limit is about the approach, not the dot."
},

// ================= FUNCTIONS & TRANSFORMATIONS (ids 290-302) =================
{
  id: 290, topic: "functions", calc: false, type: "mc",
  q: "What is the domain of \\(f(x) = \\dfrac{\\sqrt{2x + 6}}{x - 1}\\)?",
  choices: [
    "\\(x \\ge -3\\)",
    "\\(x \\ge -3\\) and \\(x \\ne 1\\)",
    "\\(x > -3\\) and \\(x \\ne 1\\)",
    "\\(x \\ge 3\\) and \\(x \\ne 1\\)"
  ],
  answer: 1,
  simple: "The square root needs 2x + 6 ≥ 0 (so x ≥ −3), AND the bottom can't be zero (so x ≠ 1) — you need both rules at once.",
  expl: "Two restrictions: radicand \\(2x + 6 \\ge 0 \\Rightarrow x \\ge -3\\), and denominator \\(x - 1 \\ne 0 \\Rightarrow x \\ne 1\\). Trap: \\(x = -3\\) is allowed (\\(\\sqrt{0} = 0\\) on top is fine) — only the denominator gets the strict exclusion."
},
{
  id: 291, topic: "functions", calc: false, type: "mc",
  q: "What is the range of \\(f(x) = -(x - 2)^2 + 3\\)?",
  choices: ["\\(y \\le 3\\)", "\\(y \\ge 3\\)", "\\(y < 3\\)", "all real numbers"],
  answer: 0,
  simple: "It's an upside-down parabola whose peak is at height 3, so the outputs are 3 and everything below it.",
  expl: "Vertex form with a negative leading coefficient: the parabola opens DOWN from vertex \\((2, 3)\\), so the maximum value 3 is achieved (at \\(x = 2\\)) and the range is \\(y \\le 3\\). Trap: it must be \\(\\le\\), not \\(<\\), because the vertex is on the graph."
},
{
  id: 292, topic: "functions", calc: false, type: "input",
  q: "If \\(f(x) = 2x - 1\\) and \\(g(x) = x^2 + 3\\), find \\(g(f(2))\\).",
  answer: ["12"],
  simple: "Work inside-out: f(2) = 3 first, then g(3) = 9 + 3 = 12.",
  expl: "Inside first: \\(f(2) = 2(2) - 1 = 3\\). Then \\(g(3) = 3^2 + 3 = 12\\). Trap: \\(f(g(2)) = f(7) = 13\\) is different — order matters in composition."
},
{
  id: 293, topic: "functions", calc: false, type: "input",
  q: "Let \\(f(x) = \\begin{cases} x^2, & x < 0 \\\\ x + 4, & x \\ge 0 \\end{cases}\\). Find \\(f(f(-3))\\).",
  answer: ["13"],
  simple: "First pass: −3 is negative so square it to get 9; second pass: 9 is positive so add 4 to get 13.",
  expl: "Inner: \\(-3 < 0\\), so \\(f(-3) = (-3)^2 = 9\\). Outer: \\(9 \\ge 0\\), so \\(f(9) = 9 + 4 = 13\\). Trap: re-check which branch applies at EACH step — the input switches sides of the break."
},
{
  id: 294, topic: "functions", calc: false, type: "mc",
  q: "What is the inverse of \\(f(x) = x^3 + 2\\)?",
  choices: [
    "\\(f^{-1}(x) = \\sqrt[3]{x} - 2\\)",
    "\\(f^{-1}(x) = (x - 2)^3\\)",
    "\\(f^{-1}(x) = \\sqrt[3]{x - 2}\\)",
    "\\(f^{-1}(x) = \\dfrac{1}{x^3 + 2}\\)"
  ],
  answer: 2,
  simple: "To undo \"cube, then add 2,\" reverse the steps in reverse order: subtract 2 first, then take the cube root.",
  expl: "Swap and solve: \\(x = y^3 + 2 \\Rightarrow y^3 = x - 2 \\Rightarrow y = \\sqrt[3]{x - 2}\\). Trap: undo operations in REVERSE order (subtract 2 before cube-rooting), and remember \\(f^{-1} \\ne \\frac{1}{f}\\)."
},
{
  id: 295, topic: "functions", calc: false, type: "input",
  q: "If \\(f(x) = \\dfrac{x + 1}{x - 2}\\), find \\(f^{-1}(3)\\).",
  answer: ["7/2", "3.5"],
  simple: "Asking for the inverse at 3 just means: what x makes the function spit out 3? Solve (x+1)/(x−2) = 3 to get x = 7/2.",
  expl: "\\(f^{-1}(3)\\) is the input whose output is 3: \\(\\dfrac{x+1}{x-2} = 3 \\Rightarrow x + 1 = 3x - 6 \\Rightarrow 7 = 2x \\Rightarrow x = \\dfrac{7}{2}\\). Check: \\(f(3.5) = \\frac{4.5}{1.5} = 3\\) ✓. No need to build the whole inverse formula."
},
{
  id: 296, topic: "functions", calc: false, type: "mc",
  q: "Which sequence of transformations turns \\(y = f(x)\\) into \\(y = 2f(x + 1) - 3\\)?",
  choices: [
    "shift right 1, stretch vertically by 2, shift down 3",
    "shift left 1, shift down 3, then stretch vertically by 2",
    "stretch vertically by 2, shift left 1, shift up 3",
    "shift left 1, stretch vertically by 2, then shift down 3"
  ],
  answer: 3,
  simple: "The +1 inside moves it left 1, the 2 out front makes it twice as tall, and only after stretching do you slide it down 3.",
  expl: "Inside: \\(x + 1\\) shifts LEFT 1 (opposite of the sign). Outside: multiply by 2 (vertical stretch) BEFORE subtracting 3 (shift down), because the \\(-3\\) is not inside the multiplication. Trap: stretching after shifting down would also stretch the \\(-3\\) into \\(-6\\)."
},
{
  id: 297, topic: "functions", calc: false, type: "mc",
  q: "Compared to \\(y = f(x)\\), the graph of \\(y = f(2x)\\) is…",
  choices: [
    "compressed horizontally by a factor of \\(\\frac{1}{2}\\) (twice as narrow)",
    "stretched horizontally by a factor of 2 (twice as wide)",
    "stretched vertically by a factor of 2",
    "shifted left 2"
  ],
  answer: 0,
  simple: "Multiplying x inside by 2 makes everything happen twice as fast, squeezing the graph to half its width.",
  expl: "Inside changes act horizontally and INVERSELY: \\(f(2x)\\) reaches each feature at half the \\(x\\)-value, a horizontal compression by \\(\\frac{1}{2}\\). Trap: people expect \"times 2 = wider,\" but inside multipliers shrink."
},
{
  id: 298, topic: "functions", calc: false, type: "mc",
  q: "The function \\(f(x) = x^3 + 1\\) is…",
  choices: ["even", "odd", "neither even nor odd", "both even and odd"],
  answer: 2,
  simple: "The +1 ruins the symmetry: flipping x gives −x³ + 1, which matches neither the original nor its exact opposite.",
  expl: "\\(f(-x) = -x^3 + 1\\). That's not \\(f(x) = x^3 + 1\\) (not even) and not \\(-f(x) = -x^3 - 1\\) (not odd). Trap: \\(x^3\\) alone is odd, but the constant term \\(+1\\) has even degree (\\(1 = x^0\\)), so the mix is neither."
},
{
  id: 299, topic: "functions", calc: false, type: "input",
  q: "Find the average rate of change of \\(f(x) = x^3 - 2x\\) on the interval \\([-1, 2]\\).",
  answer: ["1"],
  simple: "It's just the slope between the two endpoints: the function goes from 1 up to 4 while x goes from −1 to 2, so 3 ÷ 3 = 1.",
  expl: "\\(\\dfrac{f(2) - f(-1)}{2 - (-1)} = \\dfrac{(8 - 4) - (-1 + 2)}{3} = \\dfrac{4 - 1}{3} = 1\\). Watch the signs: \\(f(-1) = -1 + 2 = +1\\), and the denominator is \\(2 - (-1) = 3\\)."
},
{
  id: 300, topic: "functions", calc: true, type: "mc",
  q: "Find the average rate of change of \\(f(x) = \\ln x\\) on \\([1, 5]\\), rounded to three decimals.",
  choices: ["\\(0.175\\)", "\\(0.402\\)", "\\(1.609\\)", "\\(2.485\\)"],
  answer: 1,
  simple: "Slope between endpoints: ln 5 is about 1.609 and ln 1 is 0, so divide 1.609 by the run of 4 to get about 0.402.",
  expl: "\\(\\dfrac{f(5) - f(1)}{5 - 1} = \\dfrac{\\ln 5 - \\ln 1}{4} = \\dfrac{1.6094 - 0}{4} \\approx 0.402\\). Traps: 1.609 is forgetting to divide by 4, and 0.175 is using \\(\\log_{10}\\) instead of \\(\\ln\\)."
},
{
  id: 301, topic: "functions", calc: false, type: "mc",
  q: "Which function is one-to-one on all real numbers (and therefore has an inverse function)?",
  choices: ["\\(f(x) = x^2\\)", "\\(f(x) = |x|\\)", "\\(f(x) = \\cos x\\)", "\\(f(x) = x^3\\)"],
  answer: 3,
  simple: "Only x³ never repeats an output — the others give the same answer for two different inputs (like 2 and −2), failing the horizontal line test.",
  expl: "\\(x^3\\) is strictly increasing, so it passes the horizontal line test. The others fail: \\(x^2\\) and \\(|x|\\) send \\(\\pm 2\\) to the same output, and \\(\\cos x\\) repeats every \\(2\\pi\\). One-to-one = no repeated outputs = invertible."
},
{
  id: 302, topic: "functions", calc: false, type: "input",
  q: "What is the smallest value of \\(x\\) in the domain of \\(f(x) = \\sqrt{3x - 12}\\)?",
  answer: ["4"],
  simple: "The stuff under the root must be at least 0, so solve 3x − 12 ≥ 0 to find the domain starts at x = 4.",
  expl: "Need \\(3x - 12 \\ge 0 \\Rightarrow x \\ge 4\\), so the smallest allowed input is \\(x = 4\\) (where \\(f(4) = \\sqrt{0} = 0\\) is perfectly fine). The endpoint is included — square roots allow zero, just not negatives."
},

// ================= POLYNOMIALS & RATIONALS (ids 310-317) =================
{
  id: 310, topic: "poly", calc: false, type: "input",
  q: "For \\(f(x) = (x^2 - 4)(x + 2)\\), what is the multiplicity of the zero \\(x = -2\\)?",
  answer: ["2"],
  simple: "Factor x² − 4 into (x−2)(x+2) first — then you can see (x+2) shows up twice, so the multiplicity is 2.",
  expl: "Fully factor: \\((x^2 - 4)(x + 2) = (x - 2)(x + 2)(x + 2) = (x-2)(x+2)^2\\). The factor \\(x + 2\\) appears twice, so \\(x = -2\\) has multiplicity 2 (the graph bounces there). Trap: a hidden factor inside \\(x^2 - 4\\) — always factor completely before counting."
},
{
  id: 311, topic: "poly", calc: false, type: "mc",
  q: "Describe the end behavior of \\(f(x) = 3x^4 - x^3 + 2\\).",
  choices: [
    "both ends go up",
    "both ends go down",
    "left end down, right end up",
    "left end up, right end down"
  ],
  answer: 0,
  simple: "Even power with a positive front number means both tails point up, like a smile.",
  expl: "Only the leading term \\(3x^4\\) matters: even degree means both ends go the same way, and the positive coefficient sends them UP — as \\(x \\to \\pm\\infty\\), \\(f \\to +\\infty\\). The \\(-x^3\\) can't compete for large \\(|x|\\)."
},
{
  id: 312, topic: "poly", calc: false, type: "input",
  q: "What is the remainder when \\(f(x) = 2x^3 - 5x^2 + x - 7\\) is divided by \\(x + 1\\)?",
  answer: ["-15"],
  simple: "Dividing by x + 1 means plug in −1 (not +1!): −2 − 5 − 1 − 7 = −15.",
  expl: "Remainder Theorem: dividing by \\(x + 1 = x - (-1)\\) gives remainder \\(f(-1) = -2 - 5 - 1 - 7 = -15\\). Trap: evaluate at \\(-1\\), not \\(+1\\). Since the remainder isn't 0, the Factor Theorem says \\(x + 1\\) is NOT a factor."
},
{
  id: 313, topic: "poly", calc: false, type: "mc",
  q: "A cubic polynomial with real coefficients has zeros \\(3\\) and \\(2i\\). What is the third zero?",
  choices: ["\\(-3\\)", "\\(3 - 2i\\)", "\\(-2i\\)", "\\(-2\\)"],
  answer: 2,
  simple: "Imaginary zeros always travel in mirror pairs, so 2i's partner −2i must also be a zero.",
  expl: "Real coefficients force complex zeros into conjugate pairs: \\(2i = 0 + 2i\\) pairs with \\(0 - 2i = -2i\\). A cubic has exactly 3 zeros, so they are \\(3, 2i, -2i\\). Trap: the conjugate of \\(2i\\) is \\(-2i\\), not \\(3 - 2i\\) — don't mix it with the real zero."
},
{
  id: 314, topic: "poly", calc: false, type: "mc",
  q: "For \\(g(x) = \\dfrac{2x^2 + 2x - 12}{x^2 - 4}\\), which statement is true?",
  choices: [
    "vertical asymptotes at \\(x = 2\\) and \\(x = -2\\); horizontal asymptote \\(y = 2\\)",
    "hole at \\(\\left(2, \\frac{5}{2}\\right)\\); vertical asymptote \\(x = -2\\); horizontal asymptote \\(y = 2\\)",
    "hole at \\(\\left(-2, \\frac{5}{2}\\right)\\); vertical asymptote \\(x = 2\\); horizontal asymptote \\(y = 2\\)",
    "hole at \\(\\left(2, \\frac{5}{2}\\right)\\); vertical asymptote \\(x = -2\\); horizontal asymptote \\(y = 0\\)"
  ],
  answer: 1,
  simple: "Factoring lets (x − 2) cancel, leaving a hole at x = 2 of height 5/2, an asymptote at x = −2, and equal degrees give the flat line y = 2.",
  expl: "Factor: \\(\\dfrac{2(x+3)(x-2)}{(x-2)(x+2)} = \\dfrac{2(x+3)}{x+2}\\) for \\(x \\ne 2\\). Cancelled factor → hole at \\(x = 2\\) with height \\(\\frac{2(5)}{4} = \\frac{5}{2}\\); surviving factor → vertical asymptote \\(x = -2\\); equal degrees → horizontal asymptote \\(y = \\frac{2}{1} = 2\\)."
},
{
  id: 315, topic: "poly", calc: false, type: "mc",
  q: "Determine the domain, in interval notation, of \\(f(x) = \\dfrac{x + 4}{x^2 - 2x - 8}\\).",
  choices: [
    "\\((-\\infty, -4) \\cup (-4, \\infty)\\)",
    "\\((-\\infty, -4) \\cup (-4, 2) \\cup (2, \\infty)\\)",
    "\\([-2, 4]\\)",
    "\\((-\\infty, -2) \\cup (-2, 4) \\cup (4, \\infty)\\)"
  ],
  answer: 3,
  simple: "Only the bottom matters for domain: x² − 2x − 8 factors into (x−4)(x+2), so kick out x = 4 and x = −2 and keep everything else.",
  expl: "Set the denominator \\(\\ne 0\\): \\(x^2 - 2x - 8 = (x - 4)(x + 2) = 0\\) at \\(x = 4, -2\\), so the domain is \\((-\\infty, -2) \\cup (-2, 4) \\cup (4, \\infty)\\). Trap: the numerator's zero \\(x = -4\\) is perfectly legal — only denominator zeros leave the domain."
},
{
  id: 316, topic: "poly", calc: false, type: "mc",
  q: "What is the slant (oblique) asymptote of \\(f(x) = \\dfrac{x^2 - 3x + 5}{x + 1}\\)?",
  choices: ["\\(y = x - 4\\)", "\\(y = x - 3\\)", "\\(y = x\\)", "there is no slant asymptote"],
  answer: 0,
  simple: "Long-divide the top by the bottom: you get x − 4 with a leftover that fades away, so the graph hugs the line y = x − 4.",
  expl: "Top degree is exactly one more than bottom → slant asymptote. Divide: \\(x^2 - 3x + 5 = (x+1)(x - 4) + 9\\), so \\(f(x) = x - 4 + \\dfrac{9}{x+1}\\); the fraction vanishes for large \\(x\\), leaving \\(y = x - 4\\). Trap: don't just match the \\(x\\)-terms — the division produces \\(-4\\), not \\(-3\\)."
},
{
  id: 317, topic: "poly", calc: false, type: "mc",
  q: "Solve the inequality \\(x^3 - 4x \\ge 0\\).",
  choices: [
    "\\(x \\ge 2\\)",
    "\\((-2, 0) \\cup (2, \\infty)\\)",
    "\\([-2, 0] \\cup [2, \\infty)\\)",
    "\\((-\\infty, -2] \\cup [0, 2]\\)"
  ],
  answer: 2,
  simple: "Factor into x(x−2)(x+2), test a point in each of the four sections, and keep the positive ones — including the endpoints since ≥ allows equality.",
  expl: "Factor: \\(x(x - 2)(x + 2) \\ge 0\\) with zeros \\(-2, 0, 2\\). Sign chart: negative, positive, negative, positive on the four intervals, so keep \\([-2, 0]\\) and \\([2, \\infty)\\). Trap: \\(\\ge\\) means brackets — include the zeros, and don't forget the middle interval \\([-2, 0]\\)."
},

];
