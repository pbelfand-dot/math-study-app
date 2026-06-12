// ===== Math 4H Final Prep — New Calculus Questions =====
// Topics: deriv (200–217), derivapp (220–239), integ (240–263)
// Same object format as questions.js, plus a `simple` plain-English field.

module.exports = [

// ================= DERIVATIVES: RULES (200–217) =================
{
  id: 200, topic: "deriv", calc: false, type: "mc",
  q: "Find \\(\\dfrac{d}{dx}\\,\\dfrac{1}{x^2}\\).",
  choices: ["\\(\\dfrac{2}{x^3}\\)", "\\(-\\dfrac{2}{x}\\)", "\\(-\\dfrac{2}{x^3}\\)", "\\(\\dfrac{1}{2x}\\)"],
  answer: 2,
  simple: "Rewrite 1/x² as x to the −2 power, then bring the −2 down and drop the power to −3, giving −2/x³.",
  expl: "Rewrite first: \\(\\frac{1}{x^2} = x^{-2}\\). Power rule: \\(-2x^{-3} = -\\frac{2}{x^3}\\). Trap: the exponent goes DOWN to \\(-3\\) (one less than \\(-2\\)), and don't drop the negative sign."
},
{
  id: 201, topic: "deriv", calc: false, type: "mc",
  q: "Find \\(\\dfrac{d}{dx}\\,\\sqrt{x}\\).",
  choices: ["\\(\\dfrac{1}{2\\sqrt{x}}\\)", "\\(\\dfrac{2}{\\sqrt{x}}\\)", "\\(\\dfrac{\\sqrt{x}}{2}\\)", "\\(-\\dfrac{1}{2\\sqrt{x}}\\)"],
  answer: 0,
  simple: "√x is x to the ½ power, so the derivative is ½ times x to the −½, which is 1 over 2√x.",
  expl: "Rewrite \\(\\sqrt{x} = x^{1/2}\\), then power rule: \\(\\frac{1}{2}x^{-1/2} = \\frac{1}{2\\sqrt{x}}\\). Memorize this one — it shows up constantly."
},
{
  id: 202, topic: "deriv", calc: false, type: "input",
  q: "If \\(f(x) = x^4 - 2x^3 + 5x\\), find \\(f'(1)\\).",
  answer: ["3"],
  simple: "Take the derivative term by term with the power rule, then plug in 1: you get 4 − 6 + 5 = 3.",
  expl: "Power rule on each term: \\(f'(x) = 4x^3 - 6x^2 + 5\\). At \\(x = 1\\): \\(4 - 6 + 5 = 3\\)."
},
{
  id: 203, topic: "deriv", calc: false, type: "mc",
  q: "Find \\(\\dfrac{d}{dx}\\,x^{2/3}\\).",
  choices: ["\\(\\dfrac{3}{2}x^{1/3}\\)", "\\(\\dfrac{2}{3}x^{-1/3}\\)", "\\(\\dfrac{2}{3}x^{1/3}\\)", "\\(x^{-1/3}\\)"],
  answer: 1,
  simple: "Bring the ⅔ down front and subtract 1 from the exponent: ⅔ minus 1 is −⅓.",
  expl: "Power rule works for fractions too: \\(\\frac{d}{dx}x^{2/3} = \\frac{2}{3}x^{2/3 - 1} = \\frac{2}{3}x^{-1/3}\\). Trap: \\(\\frac{2}{3} - 1 = -\\frac{1}{3}\\), not \\(+\\frac{1}{3}\\)."
},
{
  id: 204, topic: "deriv", calc: false, type: "mc",
  q: "If \\(f(x) = x^2 e^x\\), find \\(f'(x)\\).",
  choices: ["\\(2xe^x\\)", "\\(2xe^{x-1}\\)", "\\(x^2 e^x\\)", "\\(e^x(x^2 + 2x)\\)"],
  answer: 3,
  simple: "Product rule: first times derivative of second plus second times derivative of first, then factor out eˣ.",
  expl: "Product rule: \\(f'(x) = x^2 \\cdot e^x + e^x \\cdot 2x = e^x(x^2 + 2x)\\). Trap: \\(2xe^x\\) alone means you differentiated each factor separately — that's not how products work."
},
{
  id: 205, topic: "deriv", calc: false, type: "mc",
  q: "Find \\(\\dfrac{d}{dx}\\,(x\\sin x)\\).",
  choices: ["\\(\\sin x + x\\cos x\\)", "\\(\\cos x\\)", "\\(x\\cos x\\)", "\\(\\sin x - x\\cos x\\)"],
  answer: 0,
  simple: "Product rule: keep x times the derivative of sin (which is cos), plus sin times the derivative of x (which is 1).",
  expl: "Product rule: \\(\\frac{d}{dx}(x\\sin x) = 1 \\cdot \\sin x + x \\cdot \\cos x = \\sin x + x\\cos x\\). Choice \\(\\cos x\\) is the trap of multiplying the two derivatives."
},
{
  id: 206, topic: "deriv", calc: false, type: "mc",
  q: "If \\(f(x) = \\dfrac{3x + 1}{x - 2}\\), find \\(f'(x)\\).",
  choices: ["\\(3\\)", "\\(\\dfrac{7}{(x - 2)^2}\\)", "\\(-\\dfrac{7}{(x - 2)^2}\\)", "\\(\\dfrac{6x - 5}{(x - 2)^2}\\)"],
  answer: 2,
  simple: "Quotient rule: bottom times derivative of top minus top times derivative of bottom, all over the bottom squared — the numerator collapses to −7.",
  expl: "Quotient rule: \\(f'(x) = \\dfrac{(x-2)(3) - (3x+1)(1)}{(x-2)^2} = \\dfrac{3x - 6 - 3x - 1}{(x-2)^2} = \\dfrac{-7}{(x-2)^2}\\). Trap: the order matters — flipping the subtraction gives \\(+7\\)."
},
{
  id: 207, topic: "deriv", calc: false, type: "input",
  q: "If \\(f(x) = \\dfrac{x^2}{x + 1}\\), find \\(f'(1)\\). Express as a fraction or decimal.",
  answer: ["3/4", "0.75"],
  simple: "Quotient rule gives (x² + 2x) over (x+1)², and plugging in 1 gives 3 over 4.",
  expl: "Quotient rule: \\(f'(x) = \\dfrac{(x+1)(2x) - x^2(1)}{(x+1)^2} = \\dfrac{x^2 + 2x}{(x+1)^2}\\). At \\(x = 1\\): \\(\\dfrac{1 + 2}{4} = \\dfrac{3}{4}\\)."
},
{
  id: 208, topic: "deriv", calc: false, type: "mc",
  q: "Find \\(\\dfrac{d}{dx}\\,(2x^3 + 1)^5\\).",
  choices: [
    "\\(5(2x^3 + 1)^4\\)",
    "\\(30x^2(2x^3 + 1)^4\\)",
    "\\(6x^2(2x^3 + 1)^4\\)",
    "\\((6x^2)^5\\)"
  ],
  answer: 1,
  simple: "Bring the 5 down, drop the power to 4, then multiply by the derivative of the inside, 6x², to get 30x² out front.",
  expl: "Chain rule: \\(5(2x^3+1)^4 \\cdot \\frac{d}{dx}(2x^3+1) = 5(2x^3+1)^4 \\cdot 6x^2 = 30x^2(2x^3+1)^4\\). Forgetting the inside derivative gives choice A — the classic chain-rule miss."
},
{
  id: 209, topic: "deriv", calc: false, type: "mc",
  q: "Find \\(\\dfrac{d}{dx}\\,\\cos(4x)\\).",
  choices: ["\\(-4\\sin(4x)\\)", "\\(4\\sin(4x)\\)", "\\(-\\sin(4x)\\)", "\\(-4\\cos(4x)\\)"],
  answer: 0,
  simple: "Cos turns into negative sin, and the chain rule multiplies by the 4 from inside.",
  expl: "Chain rule: \\(\\frac{d}{dx}\\cos(4x) = -\\sin(4x) \\cdot 4 = -4\\sin(4x)\\). Two traps in one: don't lose the negative from \\(\\cos \\to -\\sin\\), and don't forget the inner derivative 4."
},
{
  id: 210, topic: "deriv", calc: false, type: "mc",
  q: "Find \\(\\dfrac{d}{dx}\\,e^{x^2}\\).",
  choices: ["\\(e^{x^2}\\)", "\\(x^2 e^{x^2 - 1}\\)", "\\(2xe^{x^2}\\)", "\\(2xe^{2x}\\)"],
  answer: 2,
  simple: "e to the something keeps itself and gets multiplied by the derivative of the something, which is 2x.",
  expl: "Chain rule: \\(\\frac{d}{dx}e^{u} = e^{u} \\cdot u'\\) with \\(u = x^2\\), so the answer is \\(e^{x^2} \\cdot 2x\\). Trap: \\(x^2 e^{x^2-1}\\) is the power rule wrongly applied to an exponential."
},
{
  id: 211, topic: "deriv", calc: false, type: "mc",
  q: "Find \\(\\dfrac{d}{dx}\\,\\sec x\\).",
  choices: ["\\(\\sec^2 x\\)", "\\(\\sec x\\tan x\\)", "\\(-\\csc x\\cot x\\)", "\\(\\tan x\\)"],
  answer: 1,
  simple: "The derivative of sec is sec times tan — it's on the formula sheet, but know it cold.",
  expl: "\\(\\frac{d}{dx}\\sec x = \\sec x\\tan x\\). Don't mix it up: \\(\\sec^2 x\\) is the derivative of \\(\\tan x\\), and \\(-\\csc x\\cot x\\) is the derivative of \\(\\csc x\\)."
},
{
  id: 212, topic: "deriv", calc: false, type: "mc",
  q: "Find \\(\\dfrac{d}{dx}\\,\\tan(3x)\\).",
  choices: [
    "\\(\\sec^2(3x)\\)",
    "\\(3\\sec(3x)\\tan(3x)\\)",
    "\\(-3\\csc^2(3x)\\)",
    "\\(3\\sec^2(3x)\\)"
  ],
  answer: 3,
  simple: "Tan becomes sec squared, then the chain rule tacks on a 3 from the inside.",
  expl: "Chain rule: \\(\\frac{d}{dx}\\tan(3x) = \\sec^2(3x) \\cdot 3 = 3\\sec^2(3x)\\). Choice A forgot the chain rule's factor of 3."
},
{
  id: 213, topic: "deriv", calc: false, type: "input",
  q: "If \\(g(x) = e^{2x}\\), find \\(g'(0)\\).",
  answer: ["2"],
  simple: "e to the 2x differentiates to 2 times itself, and e⁰ is 1, so you get 2.",
  expl: "\\(g'(x) = 2e^{2x}\\) (the chain rule brings down the 2). At \\(x = 0\\): \\(2e^0 = 2(1) = 2\\)."
},
{
  id: 214, topic: "deriv", calc: false, type: "input",
  q: "If \\(f(x) = \\ln x + x^2\\), find \\(f'(1)\\).",
  answer: ["3"],
  simple: "The derivative of ln x is 1/x and the derivative of x² is 2x, so at x = 1 you get 1 + 2 = 3.",
  expl: "\\(f'(x) = \\frac{1}{x} + 2x\\). At \\(x = 1\\): \\(1 + 2 = 3\\)."
},
{
  id: 215, topic: "deriv", calc: false, type: "input",
  q: "Let \\(h(x) = f(x)\\,g(x)\\). A table gives \\(f(2) = 3\\), \\(f'(2) = -1\\), \\(g(2) = 4\\), \\(g'(2) = 5\\). Find \\(h'(2)\\).",
  answer: ["11"],
  simple: "Product rule with the table numbers: (−1)(4) + (3)(5) = −4 + 15 = 11.",
  expl: "Product rule: \\(h'(2) = f'(2)g(2) + f(2)g'(2) = (-1)(4) + (3)(5) = -4 + 15 = 11\\). Trap: \\(f'(2)g'(2)\\) (multiplying the derivatives) is wrong."
},
{
  id: 216, topic: "deriv", calc: false, type: "mc",
  q: "If \\(y = 5\\sin x - 2\\cos x\\), find \\(\\dfrac{dy}{dx}\\).",
  choices: [
    "\\(5\\cos x + 2\\sin x\\)",
    "\\(5\\cos x - 2\\sin x\\)",
    "\\(-5\\cos x - 2\\sin x\\)",
    "\\(5\\sin x + 2\\cos x\\)"
  ],
  answer: 0,
  simple: "Sin becomes cos, and cos becomes negative sin — so the minus in front of cos flips to a plus.",
  expl: "\\(\\frac{d}{dx}\\sin x = \\cos x\\) and \\(\\frac{d}{dx}\\cos x = -\\sin x\\), so \\(y' = 5\\cos x - 2(-\\sin x) = 5\\cos x + 2\\sin x\\). The double negative is the whole trap."
},
{
  id: 217, topic: "deriv", calc: false, type: "input",
  q: "If \\(f(x) = \\dfrac{1}{x}\\), find \\(f'(2)\\). Express as a fraction or decimal.",
  answer: ["-1/4", "-0.25"],
  simple: "1/x is x to the −1, so the derivative is −1/x², and plugging in 2 gives −1/4.",
  expl: "Rewrite \\(\\frac{1}{x} = x^{-1}\\), so \\(f'(x) = -x^{-2} = -\\frac{1}{x^2}\\). At \\(x = 2\\): \\(-\\frac{1}{4}\\). Don't lose the negative sign."
},

// ============ TANGENT LINES & MOTION (220–239) ============
{
  id: 220, topic: "derivapp", calc: false, type: "mc",
  q: "Write the equation of the line tangent to \\(f(x) = x^3 - 2x\\) at \\(x = 2\\).",
  choices: ["\\(y = 4x - 4\\)", "\\(y = 10x - 16\\)", "\\(y = 12x - 20\\)", "\\(y = 10x + 4\\)"],
  answer: 1,
  simple: "The point is (2, 4) and the slope is f′(2) = 10, so the line is y − 4 = 10(x − 2), which is y = 10x − 16.",
  expl: "Point: \\(f(2) = 8 - 4 = 4\\). Slope: \\(f'(x) = 3x^2 - 2\\), so \\(f'(2) = 10\\). Tangent: \\(y - 4 = 10(x - 2) \\Rightarrow y = 10x - 16\\). Trap: \\(y = 4x - 4\\) uses \\(f(2)\\) as the slope."
},
{
  id: 221, topic: "derivapp", calc: false, type: "input",
  q: "Find the slope of the line tangent to \\(f(x) = x^2 - 3x\\) at \\(x = 4\\).",
  answer: ["5"],
  simple: "The slope of the tangent is the derivative at the point: 2(4) − 3 = 5.",
  expl: "Tangent slope = derivative value: \\(f'(x) = 2x - 3\\), so \\(f'(4) = 8 - 3 = 5\\)."
},
{
  id: 222, topic: "derivapp", calc: false, type: "mc",
  q: "Write the equation of the line tangent to \\(f(x) = e^x\\) at \\(x = 0\\).",
  choices: ["\\(y = x + 1\\)", "\\(y = x\\)", "\\(y = ex + 1\\)", "\\(y = x - 1\\)"],
  answer: 0,
  simple: "At x = 0 the curve passes through (0, 1) with slope e⁰ = 1, so the tangent is y = x + 1.",
  expl: "\\(f(0) = e^0 = 1\\) and \\(f'(x) = e^x\\) gives slope \\(f'(0) = 1\\). Tangent: \\(y - 1 = 1(x - 0)\\), i.e. \\(y = x + 1\\)."
},
{
  id: 223, topic: "derivapp", calc: false, type: "input",
  q: "Find the average rate of change of \\(f(x) = x^3\\) on the interval \\([1, 3]\\).",
  answer: ["13"],
  simple: "Average rate of change is just the slope between the endpoints: (27 − 1) over (3 − 1) = 13.",
  expl: "Average rate of change = \\(\\dfrac{f(3) - f(1)}{3 - 1} = \\dfrac{27 - 1}{2} = 13\\). No derivative needed — it's the secant slope."
},
{
  id: 224, topic: "derivapp", calc: false, type: "mc",
  q: "The average rate of change of \\(f\\) on \\([a, b]\\) is given by…",
  choices: [
    "\\(f'(a)\\)",
    "\\(f'(b) - f'(a)\\)",
    "\\(\\dfrac{f(b) - f(a)}{b - a}\\)",
    "\\(\\dfrac{f(b) + f(a)}{2}\\)"
  ],
  answer: 2,
  simple: "Average rate of change is the slope of the line between the two endpoints — change in output over change in input.",
  expl: "Average rate of change is the secant slope \\(\\dfrac{f(b)-f(a)}{b-a}\\). The \\(\\textbf{instantaneous}\\) rate at a single point is the derivative \\(f'(a)\\) — don't mix them up."
},
{
  id: 225, topic: "derivapp", calc: false, type: "mc",
  q: "A car's position is \\(s(t) = t^2 + 3t\\) miles after \\(t\\) hours. What is its instantaneous velocity at \\(t = 2\\)?",
  choices: ["\\(4\\) mph", "\\(10\\) mph", "\\(5\\) mph", "\\(7\\) mph"],
  answer: 3,
  simple: "Instantaneous velocity is the derivative: 2t + 3 at t = 2 gives 7.",
  expl: "Instantaneous velocity = \\(s'(t) = 2t + 3\\), so \\(s'(2) = 7\\). Trap: \\(s(2) = 10\\) is the position, and \\(\\frac{s(2)-s(0)}{2} = 5\\) is the average velocity — the question asks for instantaneous."
},
{
  id: 226, topic: "derivapp", calc: false, type: "mc",
  q: "On what interval is \\(f(x) = x^3 - 27x\\) decreasing?",
  choices: [
    "\\((-3, 3)\\)",
    "\\((-\\infty, -3) \\cup (3, \\infty)\\)",
    "\\((0, 3)\\)",
    "\\((-\\infty, 3)\\)"
  ],
  answer: 0,
  simple: "Take the derivative, find where it's negative — between its zeros at −3 and 3 — and that's where f goes downhill.",
  expl: "\\(f'(x) = 3x^2 - 27 = 3(x-3)(x+3)\\). Sign chart: \\(f' < 0\\) between the zeros, so \\(f\\) is decreasing on \\((-3, 3)\\). An upward parabola is negative between its roots."
},
{
  id: 227, topic: "derivapp", calc: false, type: "mc",
  q: "Given \\(f'(x) = x(x - 4)\\), on what interval is \\(f\\) decreasing?",
  choices: ["\\((-\\infty, 0)\\)", "\\((0, 4)\\)", "\\((4, \\infty)\\)", "\\((-\\infty, 0) \\cup (4, \\infty)\\)"],
  answer: 1,
  simple: "You're handed the derivative; it's negative between its zeros 0 and 4, so f decreases there.",
  expl: "You already have \\(f'\\) — just sign-chart it. \\(x(x-4) < 0\\) between the zeros \\(0\\) and \\(4\\), so \\(f\\) is decreasing on \\((0, 4)\\)."
},
{
  id: 228, topic: "derivapp", calc: false, type: "mc",
  q: "Given \\(f'(x) = (x - 2)^2(x + 1)\\), at which \\(x\\)-value(s) does \\(f\\) have a relative extremum?",
  choices: [
    "\\(x = 2\\) only",
    "\\(x = -1\\) and \\(x = 2\\)",
    "\\(x = -1\\) only",
    "none"
  ],
  answer: 2,
  simple: "The squared factor never flips the sign of f′, so only x = −1 (where the sign actually changes) gives a real low point.",
  expl: "Extrema require \\(f'\\) to change sign. \\((x-2)^2 \\ge 0\\) always, so \\(f'\\) does NOT change sign at \\(x = 2\\). At \\(x = -1\\), \\(f'\\) goes from negative to positive → relative minimum. Squared factors are the classic trap."
},
{
  id: 229, topic: "derivapp", calc: false, type: "mc",
  q: "Given \\(f'(x) = (x - 3)(x + 2)\\), at which \\(x\\)-value does \\(f\\) have a relative MAXIMUM?",
  choices: ["\\(x = -2\\)", "\\(x = 3\\)", "\\(x = \\frac{1}{2}\\)", "\\(f\\) has no relative maximum"],
  answer: 0,
  simple: "f′ switches from positive to negative at x = −2, so the graph peaks there; at x = 3 it bottoms out instead.",
  expl: "Sign chart of \\(f'\\): positive for \\(x < -2\\), negative on \\((-2, 3)\\), positive for \\(x > 3\\). A \\(+\\to-\\) change is a max (at \\(x = -2\\)); \\(-\\to+\\) is a min (at \\(x = 3\\))."
},
{
  id: 230, topic: "derivapp", calc: false, type: "input",
  q: "At what \\(x\\)-value does \\(f(x) = x^2 - 8x + 1\\) have its relative minimum?",
  answer: ["4"],
  simple: "Set the derivative 2x − 8 equal to zero and you land at x = 4, the bottom of the parabola.",
  expl: "\\(f'(x) = 2x - 8 = 0\\) at \\(x = 4\\), and \\(f'\\) changes from negative to positive there → relative minimum. (Matches the vertex shortcut \\(x = -\\frac{b}{2a} = 4\\).)"
},
{
  id: 231, topic: "derivapp", calc: false, type: "input",
  q: "A particle's position is \\(s(t) = t^3 - 9t^2 + 24t\\) for \\(t \\ge 0\\). Find the FIRST time \\(t\\) at which the particle is at rest.",
  answer: ["2"],
  simple: "At rest means velocity zero: the velocity factors as 3(t − 2)(t − 4), so the first stop is at t = 2.",
  expl: "At rest \\(\\Leftrightarrow v(t) = s'(t) = 0\\): \\(3t^2 - 18t + 24 = 3(t-2)(t-4) = 0\\) at \\(t = 2\\) and \\(t = 4\\). The first is \\(t = 2\\)."
},
{
  id: 232, topic: "derivapp", calc: false, type: "mc",
  q: "A particle moves with velocity \\(v(t) = t^2 - 6t + 8\\). On what interval is the particle moving to the LEFT?",
  choices: ["\\((-\\infty, 2)\\)", "\\((2, 4)\\)", "\\((4, \\infty)\\)", "\\((2, 8)\\)"],
  answer: 1,
  simple: "Moving left means negative velocity, and v factors as (t − 2)(t − 4), which is negative between 2 and 4.",
  expl: "Moving left \\(\\Leftrightarrow v(t) < 0\\). Factor: \\((t-2)(t-4) < 0\\) between the zeros, so on \\((2, 4)\\). Sign chart the velocity, not the position."
},
{
  id: 233, topic: "derivapp", calc: false, type: "mc",
  q: "A particle's position is \\(s(t) = 2t^3 - 5t^2 + 7\\). Find its velocity at \\(t = 2\\).",
  choices: ["\\(14\\)", "\\(3\\)", "\\(24\\)", "\\(4\\)"],
  answer: 3,
  simple: "Velocity is the derivative of position: 6t² − 10t at t = 2 gives 24 − 20 = 4.",
  expl: "\\(v(t) = s'(t) = 6t^2 - 10t\\), so \\(v(2) = 24 - 20 = 4\\). Trap: \\(s(2) = 3\\) is the position and \\(s''(2) = 14\\) is the acceleration."
},
{
  id: 234, topic: "derivapp", calc: false, type: "input",
  q: "A particle's position is \\(s(t) = t^4 - 3t^2\\). Find its acceleration at \\(t = 1\\).",
  answer: ["6"],
  simple: "Take the derivative twice — velocity then acceleration — and plug in 1 to get 12 − 6 = 6.",
  expl: "Acceleration is the second derivative: \\(v(t) = 4t^3 - 6t\\), so \\(a(t) = 12t^2 - 6\\) and \\(a(1) = 12 - 6 = 6\\)."
},
{
  id: 235, topic: "derivapp", calc: false, type: "mc",
  q: "At \\(t = 2\\), a particle has velocity \\(v(2) = -6\\) and acceleration \\(a(2) = -3\\). At that moment its speed is…",
  choices: [
    "increasing, because \\(v\\) and \\(a\\) have the same sign",
    "decreasing, because both values are negative",
    "decreasing, because \\(a\\) is closer to zero than \\(v\\)",
    "neither, because the particle is moving left"
  ],
  answer: 0,
  simple: "Velocity and acceleration are both negative — same sign — so the particle is getting faster (in the leftward direction).",
  expl: "Speed increases when \\(v\\) and \\(a\\) have the SAME sign (the push is in the direction of motion). Both are negative here, so speed is increasing even though the particle moves left. Negative velocity does not mean slowing down."
},
{
  id: 236, topic: "derivapp", calc: false, type: "mc",
  q: "At some instant, \\(v = 5\\) and \\(a = -2\\). Is the particle's speed increasing or decreasing?",
  choices: [
    "increasing, because \\(v > 0\\)",
    "decreasing, because \\(v\\) and \\(a\\) have opposite signs",
    "increasing, because \\(v + a > 0\\)",
    "cannot be determined"
  ],
  answer: 1,
  simple: "The particle moves right but is being pushed left — opposite signs — so it's slowing down.",
  expl: "Opposite signs of \\(v\\) and \\(a\\) mean the acceleration opposes the motion → speed decreasing. Justify with the signs; that's the sentence your teacher wants on the free response."
},
{
  id: 237, topic: "derivapp", calc: true, type: "mc",
  q: "Write the equation of the line tangent to \\(f(x) = \\ln x\\) at \\(x = 2\\). (Decimals rounded to the nearest thousandth.)",
  choices: [
    "\\(y = 0.5x + 0.693\\)",
    "\\(y = 0.693x + 0.5\\)",
    "\\(y = 0.5x - 0.307\\)",
    "\\(y = 0.5x\\)"
  ],
  answer: 2,
  simple: "The point is (2, ln 2 ≈ 0.693) and the slope is ½, so the line works out to y = 0.5x − 0.307.",
  expl: "Point: \\(f(2) = \\ln 2 \\approx 0.693\\). Slope: \\(f'(x) = \\frac{1}{x}\\), so \\(f'(2) = 0.5\\). Then \\(y - 0.693 = 0.5(x - 2)\\) gives \\(y = 0.5x - 0.307\\). Trap: \\(y = 0.5x + 0.693\\) forgets to distribute the \\(0.5(x-2)\\)."
},
{
  id: 238, topic: "derivapp", calc: true, type: "input",
  q: "Find the instantaneous rate of change of \\(f(x) = e^x\\) at \\(x = 1\\), rounded to two decimal places.",
  answer: ["2.72"],
  simple: "The derivative of eˣ is itself, so the rate at x = 1 is e ≈ 2.72.",
  expl: "\\(f'(x) = e^x\\), so the instantaneous rate at \\(x = 1\\) is \\(e^1 = e \\approx 2.72\\). (On the calculator section, evaluate \\(\\frac{d}{dx}e^x\\big|_{x=1}\\) directly.)"
},
{
  id: 239, topic: "derivapp", calc: true, type: "input",
  q: "A particle's position is \\(s(t) = t^3 - 4t^2 + 2\\). Find the POSITIVE time \\(t\\) at which the particle is at rest. (Exact fraction, or round to the nearest thousandth.)",
  answer: ["8/3", "2.667"],
  simple: "Set the velocity 3t² − 8t equal to zero; besides t = 0 you get t = 8/3, about 2.667.",
  expl: "\\(v(t) = s'(t) = 3t^2 - 8t = t(3t - 8) = 0\\) at \\(t = 0\\) and \\(t = \\frac{8}{3} \\approx 2.667\\). The positive time is \\(\\frac{8}{3}\\)."
},

// ============ INTEGRALS & RIEMANN SUMS (240–263) ============
{
  id: 240, topic: "integ", calc: false, type: "mc",
  q: "Find the general antiderivative: \\(\\displaystyle\\int x^4\\,dx\\)",
  choices: ["\\(4x^3 + C\\)", "\\(\\dfrac{x^5}{5} + C\\)", "\\(x^5 + C\\)", "\\(5x^5 + C\\)"],
  answer: 1,
  simple: "Reverse the power rule: raise the power to 5, then divide by the new power.",
  expl: "Reverse power rule: \\(\\int x^n dx = \\frac{x^{n+1}}{n+1} + C\\), so \\(\\int x^4 dx = \\frac{x^5}{5} + C\\). Trap: \\(4x^3\\) is the derivative, the opposite operation."
},
{
  id: 241, topic: "integ", calc: false, type: "mc",
  q: "Find the general antiderivative: \\(\\displaystyle\\int (6x^2 - 4x)\\,dx\\)",
  choices: [
    "\\(2x^3 - 2x^2 + C\\)",
    "\\(12x - 4 + C\\)",
    "\\(6x^3 - 4x^2 + C\\)",
    "\\(3x^3 - 2x^2 + C\\)"
  ],
  answer: 0,
  simple: "Bump each power up one and divide by the new power: 6x² becomes 2x³ and 4x becomes 2x².",
  expl: "Term by term: \\(\\int 6x^2 dx = \\frac{6x^3}{3} = 2x^3\\) and \\(\\int 4x\\,dx = 2x^2\\), giving \\(2x^3 - 2x^2 + C\\). Trap: forgetting to divide by the new exponent gives \\(6x^3 - 4x^2\\)."
},
{
  id: 242, topic: "integ", calc: false, type: "mc",
  q: "Find the general antiderivative: \\(\\displaystyle\\int \\frac{1}{x^3}\\,dx\\)",
  choices: [
    "\\(\\dfrac{1}{2x^2} + C\\)",
    "\\(-\\dfrac{3}{x^4} + C\\)",
    "\\(-\\dfrac{1}{2x^2} + C\\)",
    "\\(\\ln(x^3) + C\\)"
  ],
  answer: 2,
  simple: "Rewrite as x to the −3, raise the power to −2 and divide by −2, giving −1 over 2x².",
  expl: "Rewrite: \\(\\int x^{-3} dx = \\frac{x^{-2}}{-2} + C = -\\frac{1}{2x^2} + C\\). The exponent goes UP from \\(-3\\) to \\(-2\\), and dividing by \\(-2\\) brings the minus sign — both classic slip-ups."
},
{
  id: 243, topic: "integ", calc: false, type: "mc",
  q: "Find the general antiderivative: \\(\\displaystyle\\int \\sqrt{x}\\,dx\\)",
  choices: [
    "\\(\\dfrac{3}{2}x^{3/2} + C\\)",
    "\\(\\dfrac{1}{2\\sqrt{x}} + C\\)",
    "\\(\\dfrac{2}{3}x^{1/2} + C\\)",
    "\\(\\dfrac{2}{3}x^{3/2} + C\\)"
  ],
  answer: 3,
  simple: "√x is x to the ½; raising the power to 3/2 and dividing by 3/2 means multiplying by ⅔.",
  expl: "\\(\\int x^{1/2} dx = \\frac{x^{3/2}}{3/2} + C = \\frac{2}{3}x^{3/2} + C\\). Dividing by \\(\\frac{3}{2}\\) flips it to \\(\\frac{2}{3}\\). Choice B is the derivative of \\(\\sqrt{x}\\) — the wrong direction."
},
{
  id: 244, topic: "integ", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\int_0^3 x^2\\,dx\\)",
  answer: ["9"],
  simple: "The antiderivative is x³/3; plug in 3 and 0 and subtract to get 27/3 = 9.",
  expl: "\\(\\int_0^3 x^2 dx = \\left[\\frac{x^3}{3}\\right]_0^3 = \\frac{27}{3} - 0 = 9\\)."
},
{
  id: 245, topic: "integ", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\int_1^2 4x^3\\,dx\\)",
  answer: ["15"],
  simple: "The antiderivative of 4x³ is x⁴, so it's 16 minus 1, which is 15.",
  expl: "\\(\\int_1^2 4x^3 dx = \\left[x^4\\right]_1^2 = 16 - 1 = 15\\)."
},
{
  id: 246, topic: "integ", calc: false, type: "mc",
  q: "Evaluate: \\(\\displaystyle\\int_0^2 (3x^2 - 2x + 1)\\,dx\\)",
  choices: ["\\(6\\)", "\\(4\\)", "\\(9\\)", "\\(14\\)"],
  answer: 0,
  simple: "Antidifferentiate to x³ − x² + x, then plug in 2: 8 − 4 + 2 = 6.",
  expl: "\\(\\left[x^3 - x^2 + x\\right]_0^2 = 8 - 4 + 2 = 6\\). Trap: \\(9\\) is what you get by plugging \\(x=2\\) into the integrand instead of the antiderivative."
},
{
  id: 247, topic: "integ", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\int_1^2 \\frac{3}{x^4}\\,dx\\). Express as a fraction or decimal.",
  answer: ["7/8", "0.875"],
  simple: "Rewrite as 3x to the −4; the antiderivative is −1/x³, and 1 minus 1/8 is 7/8.",
  expl: "\\(\\int_1^2 3x^{-4} dx = \\left[\\frac{3x^{-3}}{-3}\\right]_1^2 = \\left[-\\frac{1}{x^3}\\right]_1^2 = -\\frac{1}{8} - (-1) = \\frac{7}{8}\\). Raise the exponent from \\(-4\\) up to \\(-3\\)."
},
{
  id: 248, topic: "integ", calc: false, type: "mc",
  q: "Evaluate: \\(\\displaystyle\\int_1^4 \\sqrt{x}\\,dx\\)",
  choices: ["\\(7\\)", "\\(\\dfrac{14}{3}\\)", "\\(\\dfrac{21}{2}\\)", "\\(\\dfrac{16}{3}\\)"],
  answer: 1,
  simple: "The antiderivative is ⅔ x to the 3/2; at 4 that's ⅔·8 and at 1 it's ⅔·1, so ⅔·7 = 14/3.",
  expl: "\\(\\int_1^4 x^{1/2} dx = \\left[\\frac{2}{3}x^{3/2}\\right]_1^4 = \\frac{2}{3}(8 - 1) = \\frac{14}{3}\\). (Note \\(4^{3/2} = (\\sqrt4)^3 = 8\\).) Trap: \\(\\frac{21}{2}\\) comes from multiplying by \\(\\frac{3}{2}\\) instead of \\(\\frac{2}{3}\\)."
},
{
  id: 249, topic: "integ", calc: false, type: "mc",
  q: "Using the area interpretation, evaluate \\(\\displaystyle\\int_2^5 2\\,dx\\).",
  choices: ["\\(10\\)", "\\(3\\)", "\\(6\\)", "\\(7\\)"],
  answer: 2,
  simple: "It's just a rectangle 3 wide and 2 tall, so the area is 6.",
  expl: "The region under \\(y = 2\\) from \\(x = 2\\) to \\(x = 5\\) is a rectangle: width \\(5 - 2 = 3\\), height 2, area \\(6\\). No antiderivative gymnastics needed."
},
{
  id: 250, topic: "integ", calc: false, type: "mc",
  q: "Using the area interpretation, evaluate \\(\\displaystyle\\int_0^6 x\\,dx\\).",
  choices: ["\\(18\\)", "\\(36\\)", "\\(6\\)", "\\(12\\)"],
  answer: 0,
  simple: "The region under y = x from 0 to 6 is a triangle with base 6 and height 6: half of 36 is 18.",
  expl: "The region is a right triangle with base 6 and height 6: area \\(\\frac{1}{2}(6)(6) = 18\\). Check with the antiderivative: \\(\\left[\\frac{x^2}{2}\\right]_0^6 = 18\\). Trap: 36 forgets the \\(\\frac{1}{2}\\)."
},
{
  id: 251, topic: "integ", calc: false, type: "input",
  q: "A continuous function has table values: \\(f(0) = 4\\), \\(f(2) = 7\\), \\(f(5) = 11\\), \\(f(6) = 10\\). Using the subintervals \\([0,2]\\), \\([2,5]\\), \\([5,6]\\), find the LEFT Riemann sum approximation of \\(\\displaystyle\\int_0^6 f(x)\\,dx\\).",
  answer: ["40"],
  simple: "Each rectangle uses the height from its left edge: 2·4 + 3·7 + 1·11 = 8 + 21 + 11 = 40.",
  expl: "Left sum = (width)(left height) on each piece: \\(2(4) + 3(7) + 1(11) = 8 + 21 + 11 = 40\\). The widths are NOT equal — read them off the table."
},
{
  id: 252, topic: "integ", calc: false, type: "mc",
  q: "Using the same table — \\(f(0) = 4\\), \\(f(2) = 7\\), \\(f(5) = 11\\), \\(f(6) = 10\\) and subintervals \\([0,2]\\), \\([2,5]\\), \\([5,6]\\) — find the RIGHT Riemann sum approximation of \\(\\displaystyle\\int_0^6 f(x)\\,dx\\).",
  choices: ["\\(40\\)", "\\(32\\)", "\\(48.5\\)", "\\(57\\)"],
  answer: 3,
  simple: "Now each rectangle uses the height from its right edge: 2·7 + 3·11 + 1·10 = 14 + 33 + 10 = 57.",
  expl: "Right sum = (width)(right height): \\(2(7) + 3(11) + 1(10) = 14 + 33 + 10 = 57\\). Trap: 40 is the LEFT sum, and 32 is just adding the \\(f\\) values with no widths."
},
{
  id: 253, topic: "integ", calc: false, type: "input",
  q: "Table: \\(f(0) = 3\\), \\(f(1) = 5\\), \\(f(2) = 8\\), \\(f(3) = 4\\), \\(f(4) = 6\\). Using four subintervals of width 1, find the LEFT Riemann sum approximation of \\(\\displaystyle\\int_0^4 f(x)\\,dx\\).",
  answer: ["20"],
  simple: "With width 1 you just add the first four values: 3 + 5 + 8 + 4 = 20.",
  expl: "Left sum uses \\(x = 0, 1, 2, 3\\): \\(1(3) + 1(5) + 1(8) + 1(4) = 20\\). The last value \\(f(4) = 6\\) is never used in a left sum."
},
{
  id: 254, topic: "integ", calc: false, type: "mc",
  q: "Same table: \\(f(0) = 3\\), \\(f(1) = 5\\), \\(f(2) = 8\\), \\(f(3) = 4\\), \\(f(4) = 6\\), four subintervals of width 1. The RIGHT Riemann sum approximation of \\(\\displaystyle\\int_0^4 f(x)\\,dx\\) is…",
  choices: ["\\(20\\)", "\\(23\\)", "\\(26\\)", "\\(21.5\\)"],
  answer: 1,
  simple: "Right sum skips the first value and adds the last four: 5 + 8 + 4 + 6 = 23.",
  expl: "Right sum uses \\(x = 1, 2, 3, 4\\): \\(5 + 8 + 4 + 6 = 23\\). Trap: 26 adds all five table values — a Riemann sum with \\(n\\) rectangles only uses \\(n\\) heights."
},
{
  id: 255, topic: "integ", calc: false, type: "input",
  q: "Table: \\(f(0) = 3\\), \\(f(1) = 5\\), \\(f(2) = 8\\), \\(f(3) = 4\\), \\(f(4) = 6\\). Using TWO subintervals of width 2 (\\([0,2]\\) and \\([2,4]\\)), find the MIDPOINT Riemann sum approximation of \\(\\displaystyle\\int_0^4 f(x)\\,dx\\).",
  answer: ["18"],
  simple: "The midpoints of the two strips are x = 1 and x = 3, so the sum is 2·5 + 2·4 = 18.",
  expl: "Midpoint sum: each rectangle's height comes from the middle of its subinterval — \\(x = 1\\) for \\([0,2]\\) and \\(x = 3\\) for \\([2,4]\\): \\(2(5) + 2(4) = 18\\)."
},
{
  id: 256, topic: "integ", calc: false, type: "mc",
  q: "To compute a MIDPOINT Riemann sum for \\(\\displaystyle\\int_0^4 f(x)\\,dx\\) with two equal subintervals, you evaluate \\(f\\) at which \\(x\\)-values?",
  choices: [
    "\\(x = 1\\) and \\(x = 3\\)",
    "\\(x = 0\\) and \\(x = 2\\)",
    "\\(x = 2\\) and \\(x = 4\\)",
    "\\(x = 0\\) and \\(x = 4\\)"
  ],
  answer: 0,
  simple: "Split [0, 4] into [0, 2] and [2, 4]; the middles of those strips are 1 and 3.",
  expl: "The subintervals are \\([0,2]\\) and \\([2,4]\\); their midpoints are \\(x = 1\\) and \\(x = 3\\). Choices B and C are the left and right endpoint lists."
},
{
  id: 257, topic: "integ", calc: false, type: "mc",
  q: "If \\(f\\) is increasing on \\([a, b]\\), a RIGHT Riemann sum for \\(\\displaystyle\\int_a^b f(x)\\,dx\\) is…",
  choices: ["an underestimate", "exact", "an overestimate", "impossible to compare"],
  answer: 2,
  simple: "When the graph climbs, the right edge of each strip is its tallest point, so the rectangles poke above the curve.",
  expl: "For an increasing function the right endpoint is the highest value on each subinterval, so every rectangle sticks above the curve → overestimate. (Left sums underestimate; both flip for decreasing functions.)"
},
{
  id: 258, topic: "integ", calc: false, type: "mc",
  q: "If \\(f\\) is DECREASING on \\([a, b]\\), a LEFT Riemann sum for \\(\\displaystyle\\int_a^b f(x)\\,dx\\) is…",
  choices: ["an underestimate", "an overestimate", "exact", "zero"],
  answer: 1,
  simple: "When the graph falls, the left edge of each strip is the tallest point, so the rectangles overshoot the area.",
  expl: "For a decreasing function the left endpoint is the highest value on each subinterval, so the rectangles rise above the curve → overestimate. It's the mirror image of the increasing case."
},
{
  id: 259, topic: "integ", calc: false, type: "mc",
  q: "Let \\(L\\) and \\(R\\) be the left and right Riemann sums for \\(\\displaystyle\\int_a^b f(x)\\,dx\\). If \\(f\\) is increasing on \\([a, b]\\), which ordering is correct?",
  choices: [
    "\\(L \\le \\displaystyle\\int_a^b f(x)\\,dx \\le R\\)",
    "\\(R \\le \\displaystyle\\int_a^b f(x)\\,dx \\le L\\)",
    "\\(\\displaystyle\\int_a^b f(x)\\,dx \\le L \\le R\\)",
    "\\(L = R\\) always"
  ],
  answer: 0,
  simple: "Going uphill, left rectangles are too short and right rectangles are too tall, so the true area sits between them.",
  expl: "Increasing \\(f\\): left endpoints are the minimum heights (undershoot) and right endpoints the maximum (overshoot), so \\(L \\le \\int_a^b f \\le R\\). For decreasing \\(f\\) the inequality reverses."
},
{
  id: 260, topic: "integ", calc: false, type: "input",
  q: "A continuous function has table values: \\(f(1) = 5\\), \\(f(4) = 3\\), \\(f(6) = 8\\), \\(f(10) = 2\\). Using the subintervals \\([1,4]\\), \\([4,6]\\), \\([6,10]\\), find the LEFT Riemann sum approximation of \\(\\displaystyle\\int_1^{10} f(x)\\,dx\\).",
  answer: ["53"],
  simple: "Width times left height for each strip: 3·5 + 2·3 + 4·8 = 15 + 6 + 32 = 53.",
  expl: "Widths are \\(3, 2, 4\\); left heights are \\(5, 3, 8\\): \\(3(5) + 2(3) + 4(8) = 15 + 6 + 32 = 53\\). Don't assume equal widths — subtract the \\(x\\)-values."
},
{
  id: 261, topic: "integ", calc: false, type: "mc",
  q: "Same table: \\(f(1) = 5\\), \\(f(4) = 3\\), \\(f(6) = 8\\), \\(f(10) = 2\\), subintervals \\([1,4]\\), \\([4,6]\\), \\([6,10]\\). The RIGHT Riemann sum approximation of \\(\\displaystyle\\int_1^{10} f(x)\\,dx\\) is…",
  choices: ["\\(53\\)", "\\(18\\)", "\\(33\\)", "\\(43\\)"],
  answer: 2,
  simple: "Width times right height: 3·3 + 2·8 + 4·2 = 9 + 16 + 8 = 33.",
  expl: "Right heights are \\(3, 8, 2\\) with widths \\(3, 2, 4\\): \\(3(3) + 2(8) + 4(2) = 9 + 16 + 8 = 33\\). Trap: 53 is the left sum and 18 is the heights added without widths."
},
{
  id: 262, topic: "integ", calc: true, type: "input",
  q: "Evaluate \\(\\displaystyle\\int_0^2 e^x\\,dx\\), rounded to the nearest thousandth.",
  answer: ["6.389"],
  simple: "The antiderivative of eˣ is itself, so the answer is e² − 1 ≈ 6.389.",
  expl: "\\(\\int_0^2 e^x dx = \\left[e^x\\right]_0^2 = e^2 - e^0 = e^2 - 1 \\approx 7.389 - 1 = 6.389\\). Don't forget to subtract \\(e^0 = 1\\), not 0."
},
{
  id: 263, topic: "integ", calc: true, type: "mc",
  q: "Using a calculator, \\(\\displaystyle\\int_1^3 \\ln x\\,dx\\) is closest to…",
  choices: ["\\(2.197\\)", "\\(1.099\\)", "\\(3.296\\)", "\\(1.296\\)"],
  answer: 3,
  simple: "Punch the definite integral into the calculator: the area under ln x from 1 to 3 is about 1.296.",
  expl: "On the calculator section, evaluate \\(\\int_1^3 \\ln x\\,dx\\) directly: \\(\\approx 1.296\\) (exactly \\(3\\ln 3 - 2\\)). Trap: \\(1.099\\) is just \\(\\ln 3\\), the height at the endpoint, not the area."
},

];
