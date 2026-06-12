// ===== Pre-Calc Final Prep — Question Bank =====
// Each question:
//   id        unique number
//   topic     key into TOPICS
//   calc      true = calculator allowed/needed, false = no-calculator
//   type      "mc" (multiple choice) | "input" (type-in, numeric or fraction)
//   q         question text (KaTeX inside \( \))
//   choices   for mc: array of 4 strings
//   answer    for mc: index of correct choice; for input: array of accepted strings
//   hint      for input: short format hint shown under the box
//   expl      worked explanation

const TOPICS = {
  functions: "Functions & Transformations",
  poly:      "Polynomials & Rationals",
  explog:    "Exponentials & Logarithms",
  trig:      "Trig: Unit Circle & Graphs",
  trigid:    "Trig: Identities & Equations",
  triangles: "Triangles & Applications",
  seqser:    "Sequences & Series",
  conics:    "Conic Sections",
  vectors:   "Vectors, Polar & Parametric",
  limits:    "Limits",
};

const QUESTIONS = [

// ================= FUNCTIONS & TRANSFORMATIONS =================
{
  id: 1, topic: "functions", calc: false, type: "mc",
  q: "If \\(f(x) = 2x^2 - 3x + 1\\), what is \\(f(-2)\\)?",
  choices: ["\\(3\\)", "\\(15\\)", "\\(-13\\)", "\\(11\\)"],
  answer: 1,
  expl: "Substitute \\(x=-2\\): \\(f(-2) = 2(-2)^2 - 3(-2) + 1 = 2(4) + 6 + 1 = 8 + 6 + 1 = 15\\). Watch the signs: \\(-3(-2) = +6\\)."
},
{
  id: 2, topic: "functions", calc: false, type: "mc",
  q: "What is the domain of \\(f(x) = \\sqrt{x - 4}\\)?",
  choices: ["\\(x > 4\\)", "\\(x \\ge 4\\)", "\\(x \\le 4\\)", "all real numbers"],
  answer: 1,
  expl: "You can't take the square root of a negative number, so you need \\(x - 4 \\ge 0\\), which gives \\(x \\ge 4\\). Note \\(x = 4\\) is allowed because \\(\\sqrt{0} = 0\\) is fine."
},
{
  id: 3, topic: "functions", calc: false, type: "input",
  q: "If \\(f(x) = x^2 + 1\\) and \\(g(x) = 3x - 2\\), find \\(f(g(1))\\).",
  answer: ["2"],
  expl: "Work inside-out. First \\(g(1) = 3(1) - 2 = 1\\). Then \\(f(1) = 1^2 + 1 = 2\\)."
},
{
  id: 4, topic: "functions", calc: false, type: "mc",
  q: "What is the inverse of \\(f(x) = \\dfrac{2x + 1}{3}\\)?",
  choices: ["\\(f^{-1}(x) = \\dfrac{3x - 1}{2}\\)", "\\(f^{-1}(x) = \\dfrac{3}{2x+1}\\)", "\\(f^{-1}(x) = \\dfrac{2x - 1}{3}\\)", "\\(f^{-1}(x) = \\dfrac{x - 1}{3}\\)"],
  answer: 0,
  expl: "Swap \\(x\\) and \\(y\\), then solve: \\(x = \\dfrac{2y+1}{3} \\Rightarrow 3x = 2y + 1 \\Rightarrow y = \\dfrac{3x-1}{2}\\)."
},
{
  id: 5, topic: "functions", calc: false, type: "mc",
  q: "The graph of \\(y = f(x - 3) + 2\\) is the graph of \\(y = f(x)\\) shifted…",
  choices: ["left 3, up 2", "right 3, up 2", "right 3, down 2", "left 3, down 2"],
  answer: 1,
  expl: "Inside the parentheses moves horizontally and is \\(\\textbf{opposite}\\) of the sign: \\(x - 3\\) shifts \\(\\textbf{right}\\) 3. Outside moves vertically and matches the sign: \\(+2\\) shifts up 2."
},
{
  id: 6, topic: "functions", calc: false, type: "mc",
  q: "The function \\(f(x) = x^3 - 4x\\) is…",
  choices: ["even", "odd", "both even and odd", "neither"],
  answer: 1,
  expl: "Check \\(f(-x) = (-x)^3 - 4(-x) = -x^3 + 4x = -(x^3 - 4x) = -f(x)\\). Since \\(f(-x) = -f(x)\\), it's odd (symmetric about the origin). Every term has an odd power — that's the quick tell."
},
{
  id: 7, topic: "functions", calc: false, type: "mc",
  q: "What is the domain of \\(f(x) = \\dfrac{1}{x^2 - 9}\\)?",
  choices: ["\\(x \\ne 9\\)", "\\(x \\ne 3\\)", "\\(x \\ne 3, x \\ne -3\\)", "\\(x > 3\\)"],
  answer: 2,
  expl: "The denominator can't be zero: \\(x^2 - 9 = 0\\) when \\(x = \\pm 3\\). Don't forget the negative root — \\(x^2 - 9\\) factors as \\((x-3)(x+3)\\)."
},
{
  id: 8, topic: "functions", calc: false, type: "input",
  q: "If \\(f(x) = |x|\\) and \\(g(x) = x - 5\\), find \\((f \\circ g)(2)\\).",
  answer: ["3"],
  expl: "\\((f \\circ g)(2)\\) means \\(f(g(2))\\). First \\(g(2) = 2 - 5 = -3\\), then \\(f(-3) = |-3| = 3\\)."
},
{
  id: 9, topic: "functions", calc: false, type: "input",
  q: "What is the minimum value of \\(f(x) = x^2 - 6x + 11\\)?",
  answer: ["2"],
  expl: "Complete the square: \\(x^2 - 6x + 11 = (x - 3)^2 + 2\\). The squared term is at least 0, so the minimum value is \\(2\\) (it happens at \\(x = 3\\)). Shortcut: vertex at \\(x = -\\frac{b}{2a} = 3\\), then \\(f(3) = 9 - 18 + 11 = 2\\)."
},
{
  id: 10, topic: "functions", calc: false, type: "input",
  q: "If \\(f(x) = 3x - 7\\), find \\(f^{-1}(5)\\).",
  answer: ["4"],
  expl: "\\(f^{-1}(5)\\) asks: what input gives output 5? Solve \\(3x - 7 = 5 \\Rightarrow 3x = 12 \\Rightarrow x = 4\\). No need to find the whole inverse formula."
},
{
  id: 11, topic: "functions", calc: false, type: "mc",
  q: "Compared to \\(y = f(x)\\), the graph of \\(y = -2f(x)\\) is…",
  choices: [
    "stretched vertically by 2 and reflected over the \\(x\\)-axis",
    "compressed vertically by 2 and reflected over the \\(y\\)-axis",
    "stretched horizontally by 2 and reflected over the \\(x\\)-axis",
    "shifted down 2"
  ],
  answer: 0,
  expl: "Multiplying the \\(\\textbf{output}\\) by \\(-2\\) does two things: the 2 stretches it vertically (taller), and the negative flips it over the \\(x\\)-axis."
},
{
  id: 12, topic: "functions", calc: false, type: "mc",
  q: "What is the range of \\(f(x) = x^2 + 4\\)?",
  choices: ["\\(y \\ge 0\\)", "\\(y \\ge 4\\)", "\\(y > 4\\)", "all real numbers"],
  answer: 1,
  expl: "\\(x^2\\) is at least 0, so \\(x^2 + 4\\) is at least 4. The minimum \\(y = 4\\) actually happens (at \\(x = 0\\)), so the range is \\(y \\ge 4\\), including 4."
},
{
  id: 13, topic: "functions", calc: false, type: "input",
  q: "Find the average rate of change of \\(f(x) = x^2\\) on the interval \\([1, 4]\\).",
  answer: ["5"],
  expl: "Average rate of change = slope between endpoints: \\(\\dfrac{f(4) - f(1)}{4 - 1} = \\dfrac{16 - 1}{3} = \\dfrac{15}{3} = 5\\)."
},
{
  id: 14, topic: "functions", calc: false, type: "mc",
  q: "A function has an inverse function if and only if its graph passes the…",
  choices: ["vertical line test", "horizontal line test", "symmetry test", "slope test"],
  answer: 1,
  expl: "To have an inverse, a function must be one-to-one: no two inputs share an output. Graphically, no horizontal line can hit the graph twice — the horizontal line test. (The vertical line test just checks that it's a function at all.)"
},

// ================= POLYNOMIALS & RATIONALS =================
{
  id: 15, topic: "poly", calc: false, type: "mc",
  q: "What are the zeros of \\(f(x) = x^2 - 5x + 6\\)?",
  choices: ["\\(x = -2, -3\\)", "\\(x = 2, 3\\)", "\\(x = 1, 6\\)", "\\(x = -1, 6\\)"],
  answer: 1,
  expl: "Factor: \\(x^2 - 5x + 6 = (x - 2)(x - 3)\\). You need two numbers that multiply to \\(+6\\) and add to \\(-5\\): that's \\(-2\\) and \\(-3\\), so the zeros are \\(x = 2\\) and \\(x = 3\\)."
},
{
  id: 16, topic: "poly", calc: false, type: "mc",
  q: "Describe the end behavior of \\(f(x) = -2x^3 + 5x^2 - 1\\).",
  choices: [
    "as \\(x \\to \\infty, f \\to \\infty\\); as \\(x \\to -\\infty, f \\to -\\infty\\)",
    "as \\(x \\to \\infty, f \\to -\\infty\\); as \\(x \\to -\\infty, f \\to \\infty\\)",
    "both ends go up",
    "both ends go down"
  ],
  answer: 1,
  expl: "Only the leading term \\(-2x^3\\) matters for end behavior. Odd degree means the ends go opposite directions; the negative coefficient flips the usual cubic, so it rises on the left and falls on the right."
},
{
  id: 17, topic: "poly", calc: false, type: "input",
  q: "What is the remainder when \\(f(x) = x^3 - 4x + 6\\) is divided by \\(x - 2\\)?",
  answer: ["6"],
  expl: "Remainder Theorem: the remainder when dividing by \\(x - 2\\) is just \\(f(2) = 8 - 8 + 6 = 6\\). No long division needed."
},
{
  id: 18, topic: "poly", calc: false, type: "mc",
  q: "Which polynomial has zeros \\(1, -2,\\) and \\(3\\) with leading coefficient 1?",
  choices: [
    "\\(x^3 - 2x^2 - 5x + 6\\)",
    "\\(x^3 + 2x^2 - 5x - 6\\)",
    "\\(x^3 - 2x^2 + 5x - 6\\)",
    "\\(x^3 - 6x^2 + 11x - 6\\)"
  ],
  answer: 0,
  expl: "Build from factors: \\((x-1)(x+2)(x-3)\\). First \\((x-1)(x+2) = x^2 + x - 2\\); times \\((x-3)\\): \\(x^3 + x^2 - 2x - 3x^2 - 3x + 6 = x^3 - 2x^2 - 5x + 6\\). Quick check: plug \\(x = 1\\) into each choice — only the right one gives 0."
},
{
  id: 19, topic: "poly", calc: false, type: "mc",
  q: "A polynomial has real coefficients. If \\(2 + i\\) is a zero, which must also be a zero?",
  choices: ["\\(2 - i\\)", "\\(-2 + i\\)", "\\(-2 - i\\)", "\\(i\\)"],
  answer: 0,
  expl: "Complex zeros of polynomials with real coefficients always come in conjugate pairs: if \\(a + bi\\) is a zero, so is \\(a - bi\\). The conjugate of \\(2 + i\\) is \\(2 - i\\)."
},
{
  id: 20, topic: "poly", calc: false, type: "mc",
  q: "Find the vertical asymptote(s) of \\(f(x) = \\dfrac{x + 1}{x^2 - 4}\\).",
  choices: ["\\(x = -1\\)", "\\(x = 2\\) only", "\\(x = 2\\) and \\(x = -2\\)", "\\(x = 4\\)"],
  answer: 2,
  expl: "Vertical asymptotes come from zeros of the denominator that don't cancel. \\(x^2 - 4 = (x-2)(x+2)\\), and neither factor cancels with the numerator \\(x + 1\\), so there are asymptotes at \\(x = 2\\) and \\(x = -2\\)."
},
{
  id: 21, topic: "poly", calc: false, type: "mc",
  q: "What is the horizontal asymptote of \\(f(x) = \\dfrac{3x^2 - 1}{x^2 + 5}\\)?",
  choices: ["\\(y = 0\\)", "\\(y = 3\\)", "\\(y = -\\frac{1}{5}\\)", "there is none"],
  answer: 1,
  expl: "Degrees of top and bottom are equal (both 2), so the horizontal asymptote is the ratio of leading coefficients: \\(y = \\frac{3}{1} = 3\\). (Top degree smaller → \\(y=0\\); top degree bigger → no horizontal asymptote.)"
},
{
  id: 22, topic: "poly", calc: false, type: "input",
  q: "The graph of \\(f(x) = \\dfrac{x^2 - 9}{x - 3}\\) has a hole. What is the \\(y\\)-coordinate of the hole?",
  answer: ["6"],
  expl: "Factor and cancel: \\(\\dfrac{(x-3)(x+3)}{x-3} = x + 3\\) for \\(x \\ne 3\\). The cancelled factor means a hole at \\(x = 3\\), and its height is \\(3 + 3 = 6\\). So the hole is at \\((3, 6)\\)."
},
{
  id: 23, topic: "poly", calc: false, type: "mc",
  q: "Solve \\(x^3 - 9x = 0\\).",
  choices: ["\\(x = 0, 3\\)", "\\(x = 3, -3\\)", "\\(x = 0, 3, -3\\)", "\\(x = 0, 9\\)"],
  answer: 2,
  expl: "Factor out the GCF first: \\(x(x^2 - 9) = x(x-3)(x+3) = 0\\), so \\(x = 0, 3, -3\\). Classic trap: dividing both sides by \\(x\\) loses the \\(x = 0\\) solution."
},
{
  id: 24, topic: "poly", calc: false, type: "mc",
  q: "Which quadratic has vertex \\((2, -3)\\) and opens upward with \\(a = 1\\)?",
  choices: ["\\(y = x^2 + 4x + 1\\)", "\\(y = x^2 - 4x + 1\\)", "\\(y = x^2 - 4x - 3\\)", "\\(y = x^2 + 2x - 3\\)"],
  answer: 1,
  expl: "Vertex form: \\(y = (x - 2)^2 - 3\\). Expand: \\(x^2 - 4x + 4 - 3 = x^2 - 4x + 1\\)."
},
{
  id: 25, topic: "poly", calc: false, type: "mc",
  q: "For \\(f(x) = (x - 1)^2(x + 3)\\), what does the graph do at its \\(x\\)-intercepts?",
  choices: [
    "crosses at both \\(x = 1\\) and \\(x = -3\\)",
    "touches (bounces) at \\(x = 1\\), crosses at \\(x = -3\\)",
    "crosses at \\(x = 1\\), touches at \\(x = -3\\)",
    "touches at both"
  ],
  answer: 1,
  expl: "Even multiplicity → the graph touches and bounces; odd multiplicity → it crosses. \\((x-1)^2\\) has multiplicity 2 (bounce at \\(x=1\\)); \\((x+3)\\) has multiplicity 1 (cross at \\(x=-3\\))."
},
{
  id: 26, topic: "poly", calc: false, type: "mc",
  q: "How many real solutions does \\(2x^2 - 3x + 5 = 0\\) have?",
  choices: ["0", "1", "2", "infinitely many"],
  answer: 0,
  expl: "Check the discriminant: \\(b^2 - 4ac = (-3)^2 - 4(2)(5) = 9 - 40 = -31\\). Negative discriminant → no real solutions (two complex conjugate solutions instead)."
},
{
  id: 27, topic: "poly", calc: false, type: "mc",
  q: "What is the slant (oblique) asymptote of \\(f(x) = \\dfrac{x^2 + 1}{x - 1}\\)?",
  choices: ["\\(y = x\\)", "\\(y = x + 1\\)", "\\(y = x - 1\\)", "\\(y = 1\\)"],
  answer: 1,
  expl: "Top degree is exactly one more than bottom → slant asymptote. Divide: \\(x^2 + 1 = (x-1)(x+1) + 2\\), so \\(f(x) = x + 1 + \\frac{2}{x-1}\\). As \\(x\\) gets huge the \\(\\frac{2}{x-1}\\) vanishes, leaving \\(y = x + 1\\)."
},
{
  id: 28, topic: "poly", calc: false, type: "input",
  q: "Solve for \\(x\\): \\(\\dfrac{x}{x - 2} = 3\\)",
  answer: ["3"],
  expl: "Multiply both sides by \\(x - 2\\): \\(x = 3(x - 2) = 3x - 6\\), so \\(-2x = -6\\) and \\(x = 3\\). Check it doesn't make the denominator zero: \\(3 - 2 = 1\\) ✓."
},
{
  id: 29, topic: "poly", calc: false, type: "mc",
  q: "Solve the inequality \\(x^2 - x - 12 < 0\\).",
  choices: ["\\(x < -3\\) or \\(x > 4\\)", "\\(-3 < x < 4\\)", "\\(-4 < x < 3\\)", "\\(x < 4\\)"],
  answer: 1,
  expl: "Factor: \\((x - 4)(x + 3) < 0\\). The product is negative between the roots, so \\(-3 < x < 4\\). A parabola opening up is below zero between its zeros."
},
{
  id: 30, topic: "poly", calc: false, type: "mc",
  q: "Which of these is a factor of \\(x^3 + 2x^2 - 5x - 6\\)?",
  choices: ["\\(x - 1\\)", "\\(x + 2\\)", "\\(x + 1\\)", "\\(x - 3\\)"],
  answer: 2,
  expl: "Factor Theorem: test each candidate's root. \\(f(-1) = -1 + 2 + 5 - 6 = 0\\), so \\(x + 1\\) is a factor. (Fully factored: \\((x+1)(x-2)(x+3)\\).)"
},
{
  id: 31, topic: "poly", calc: false, type: "input",
  q: "Counting multiplicity, how many complex zeros does a degree-5 polynomial have?",
  answer: ["5"],
  expl: "Fundamental Theorem of Algebra: a degree-\\(n\\) polynomial has exactly \\(n\\) complex zeros, counting multiplicity (real zeros count too — real numbers are complex numbers with imaginary part 0)."
},
{
  id: 32, topic: "poly", calc: false, type: "mc",
  q: "By the Rational Zeros Theorem, which list contains ALL possible rational zeros of \\(f(x) = 2x^3 + 3x - 5\\)?",
  choices: [
    "\\(\\pm 1, \\pm 5\\)",
    "\\(\\pm 1, \\pm 5, \\pm \\frac{1}{2}, \\pm \\frac{5}{2}\\)",
    "\\(\\pm 1, \\pm 2, \\pm 5\\)",
    "\\(\\pm \\frac{1}{5}, \\pm \\frac{2}{5}\\)"
  ],
  answer: 1,
  expl: "Possible rational zeros are \\(\\pm\\frac{p}{q}\\) where \\(p\\) divides the constant (5: so 1, 5) and \\(q\\) divides the leading coefficient (2: so 1, 2). That gives \\(\\pm 1, \\pm 5, \\pm\\frac{1}{2}, \\pm\\frac{5}{2}\\)."
},

// ================= EXPONENTIALS & LOGARITHMS =================
{
  id: 33, topic: "explog", calc: false, type: "input",
  q: "Solve for \\(x\\): \\(2^x = 32\\)",
  answer: ["5"],
  expl: "Write 32 as a power of 2: \\(32 = 2^5\\), so \\(x = 5\\)."
},
{
  id: 34, topic: "explog", calc: false, type: "input",
  q: "Evaluate \\(\\log_3 81\\).",
  answer: ["4"],
  expl: "\\(\\log_3 81\\) asks: 3 to what power gives 81? \\(3^4 = 81\\), so the answer is 4."
},
{
  id: 35, topic: "explog", calc: false, type: "mc",
  q: "Expand: \\(\\log\\!\\left(\\dfrac{x^2 y}{z}\\right)\\)",
  choices: [
    "\\(2\\log x + \\log y - \\log z\\)",
    "\\(2\\log x + \\log y + \\log z\\)",
    "\\(\\frac{2\\log x \\cdot \\log y}{\\log z}\\)",
    "\\(2(\\log x + \\log y - \\log z)\\)"
  ],
  answer: 0,
  expl: "Products become sums, quotients become differences, exponents come down front: \\(\\log\\frac{x^2y}{z} = \\log x^2 + \\log y - \\log z = 2\\log x + \\log y - \\log z\\)."
},
{
  id: 36, topic: "explog", calc: false, type: "mc",
  q: "Solve \\(e^{2x} = 7\\). The exact solution is \\(x =\\)…",
  choices: ["\\(\\ln \\frac{7}{2}\\)", "\\(\\dfrac{\\ln 7}{2}\\)", "\\(2\\ln 7\\)", "\\(\\ln 7 - 2\\)"],
  answer: 1,
  expl: "Take \\(\\ln\\) of both sides: \\(2x = \\ln 7\\), so \\(x = \\frac{\\ln 7}{2} \\approx 0.973\\). Trap: \\(\\frac{\\ln 7}{2} \\ne \\ln\\frac{7}{2}\\)."
},
{
  id: 37, topic: "explog", calc: false, type: "input",
  q: "Evaluate \\(\\ln 1\\).",
  answer: ["0"],
  expl: "\\(\\ln 1\\) asks: \\(e\\) to what power gives 1? Any nonzero base to the 0 power is 1, so \\(\\ln 1 = 0\\). (Likewise \\(\\log_b 1 = 0\\) for every base.)"
},
{
  id: 38, topic: "explog", calc: false, type: "input",
  q: "Solve for \\(x\\): \\(\\log_2(x - 1) = 3\\)",
  answer: ["9"],
  expl: "Rewrite in exponential form: \\(x - 1 = 2^3 = 8\\), so \\(x = 9\\). Check the domain: \\(9 - 1 = 8 > 0\\) ✓."
},
{
  id: 39, topic: "explog", calc: true, type: "mc",
  q: "You invest \\(\\$1000\\) at 6% annual interest, compounded monthly. How much is it worth after 5 years?",
  choices: ["\\(\\$1338.23\\)", "\\(\\$1348.85\\)", "\\(\\$1300.00\\)", "\\(\\$1419.07\\)"],
  answer: 1,
  expl: "Use \\(A = P\\left(1 + \\frac{r}{n}\\right)^{nt} = 1000\\left(1 + \\frac{0.06}{12}\\right)^{12 \\cdot 5} = 1000(1.005)^{60} \\approx \\$1348.85\\). ($1338.23 is the trap — that's compounding annually.)"
},
{
  id: 40, topic: "explog", calc: true, type: "mc",
  q: "\\(\\$500\\) grows with continuous compounding at 4% per year. Its value after 10 years is closest to…",
  choices: ["\\(\\$540.00\\)", "\\(\\$700.00\\)", "\\(\\$745.91\\)", "\\(\\$820.20\\)"],
  answer: 2,
  expl: "Continuous compounding uses \\(A = Pe^{rt} = 500e^{0.04 \\times 10} = 500e^{0.4} \\approx 500(1.4918) \\approx \\$745.91\\)."
},
{
  id: 41, topic: "explog", calc: false, type: "mc",
  q: "Condense into a single logarithm: \\(3\\ln x - \\ln y\\)",
  choices: ["\\(\\ln(x^3 - y)\\)", "\\(\\ln\\dfrac{x^3}{y}\\)", "\\(\\ln(3x - y)\\)", "\\(\\dfrac{\\ln x^3}{\\ln y}\\)"],
  answer: 1,
  expl: "Move the 3 up as an exponent: \\(3\\ln x = \\ln x^3\\). Subtraction of logs = log of the quotient: \\(\\ln x^3 - \\ln y = \\ln\\frac{x^3}{y}\\)."
},
{
  id: 42, topic: "explog", calc: false, type: "input",
  q: "Evaluate \\(\\log 5 + \\log 2\\) (base 10).",
  answer: ["1"],
  expl: "Sum of logs = log of the product: \\(\\log 5 + \\log 2 = \\log 10 = 1\\)."
},
{
  id: 43, topic: "explog", calc: false, type: "input",
  q: "A substance has a half-life of 8 days. If you start with 100 g, how many grams remain after 24 days?",
  answer: ["12.5", "25/2"],
  expl: "24 days is \\(24 \\div 8 = 3\\) half-lives: \\(100 \\to 50 \\to 25 \\to 12.5\\) g. Formula version: \\(100\\left(\\frac{1}{2}\\right)^{24/8} = 100 \\cdot \\frac{1}{8} = 12.5\\)."
},
{
  id: 44, topic: "explog", calc: false, type: "input",
  q: "Solve for \\(x\\): \\(5^{x+1} = 25^x\\)",
  answer: ["1"],
  expl: "Match the bases: \\(25^x = (5^2)^x = 5^{2x}\\). Then \\(x + 1 = 2x\\), so \\(x = 1\\)."
},
{
  id: 45, topic: "explog", calc: false, type: "mc",
  q: "What is the domain of \\(f(x) = \\ln(x + 3)\\)?",
  choices: ["\\(x > 3\\)", "\\(x > -3\\)", "\\(x \\ge -3\\)", "all real numbers"],
  answer: 1,
  expl: "You can only take the log of a positive number: \\(x + 3 > 0\\) gives \\(x > -3\\). Strict inequality — \\(\\ln 0\\) is undefined."
},
{
  id: 46, topic: "explog", calc: true, type: "mc",
  q: "Use the change-of-base formula to evaluate \\(\\log_7 20\\), rounded to three decimals.",
  choices: ["\\(0.650\\)", "\\(1.539\\)", "\\(2.857\\)", "\\(1.301\\)"],
  answer: 1,
  expl: "\\(\\log_7 20 = \\dfrac{\\ln 20}{\\ln 7} = \\dfrac{2.9957}{1.9459} \\approx 1.539\\). Sanity check: \\(7^1 = 7\\) and \\(7^2 = 49\\), so the answer must be between 1 and 2."
},
{
  id: 47, topic: "explog", calc: false, type: "mc",
  q: "The inverse function of \\(f(x) = e^x\\) is…",
  choices: ["\\(f^{-1}(x) = e^{-x}\\)", "\\(f^{-1}(x) = \\ln x\\)", "\\(f^{-1}(x) = \\frac{1}{e^x}\\)", "\\(f^{-1}(x) = x^e\\)"],
  answer: 1,
  expl: "Exponentials and logs with the same base undo each other: \\(\\ln(e^x) = x\\) and \\(e^{\\ln x} = x\\). So the inverse of \\(e^x\\) is \\(\\ln x\\). Their graphs are mirror images across \\(y = x\\)."
},
{
  id: 48, topic: "explog", calc: false, type: "input",
  q: "A population doubles every 12 years. After 36 years, the population is multiplied by what number?",
  answer: ["8"],
  expl: "36 years contains \\(36 \\div 12 = 3\\) doubling periods, so the population is multiplied by \\(2^3 = 8\\)."
},
{
  id: 49, topic: "explog", calc: false, type: "input",
  q: "Solve for \\(x\\): \\(\\ln x + \\ln(x - 3) = \\ln 10\\)",
  answer: ["5"],
  expl: "Combine: \\(\\ln[x(x-3)] = \\ln 10\\), so \\(x^2 - 3x - 10 = 0\\), which factors to \\((x-5)(x+2) = 0\\). \\(x = -2\\) is rejected (you can't take \\(\\ln\\) of a negative), leaving \\(x = 5\\)."
},
{
  id: 50, topic: "explog", calc: false, type: "input",
  q: "Solve for \\(x\\): \\(4^x = 8\\)",
  answer: ["3/2", "1.5"],
  expl: "Use base 2: \\(4^x = (2^2)^x = 2^{2x}\\) and \\(8 = 2^3\\). So \\(2x = 3\\) and \\(x = \\frac{3}{2}\\)."
},

// ================= TRIG: UNIT CIRCLE & GRAPHS =================
{
  id: 51, topic: "trig", calc: false, type: "mc",
  q: "What is the exact value of \\(\\sin\\dfrac{\\pi}{6}\\)?",
  choices: ["\\(\\dfrac{1}{2}\\)", "\\(\\dfrac{\\sqrt{2}}{2}\\)", "\\(\\dfrac{\\sqrt{3}}{2}\\)", "\\(1\\)"],
  answer: 0,
  expl: "\\(\\frac{\\pi}{6} = 30°\\). From the unit circle (or the 30-60-90 triangle), \\(\\sin 30° = \\frac{1}{2}\\). Memory hook: \\(\\sin\\) of \\(30°, 45°, 60°\\) is \\(\\frac{\\sqrt{1}}{2}, \\frac{\\sqrt{2}}{2}, \\frac{\\sqrt{3}}{2}\\)."
},
{
  id: 52, topic: "trig", calc: false, type: "mc",
  q: "What is the exact value of \\(\\cos\\dfrac{3\\pi}{4}\\)?",
  choices: ["\\(\\dfrac{\\sqrt{2}}{2}\\)", "\\(-\\dfrac{\\sqrt{2}}{2}\\)", "\\(-\\dfrac{1}{2}\\)", "\\(-\\dfrac{\\sqrt{3}}{2}\\)"],
  answer: 1,
  expl: "\\(\\frac{3\\pi}{4} = 135°\\) is in Quadrant II, where cosine is negative. The reference angle is \\(45°\\), so \\(\\cos\\frac{3\\pi}{4} = -\\frac{\\sqrt{2}}{2}\\)."
},
{
  id: 53, topic: "trig", calc: false, type: "mc",
  q: "Convert \\(150°\\) to radians.",
  choices: ["\\(\\dfrac{5\\pi}{6}\\)", "\\(\\dfrac{2\\pi}{3}\\)", "\\(\\dfrac{5\\pi}{3}\\)", "\\(\\dfrac{3\\pi}{4}\\)"],
  answer: 0,
  expl: "Multiply by \\(\\frac{\\pi}{180}\\): \\(150 \\times \\frac{\\pi}{180} = \\frac{150\\pi}{180} = \\frac{5\\pi}{6}\\)."
},
{
  id: 54, topic: "trig", calc: false, type: "input",
  q: "Evaluate \\(\\tan\\dfrac{\\pi}{4}\\).",
  answer: ["1"],
  expl: "\\(\\tan\\frac{\\pi}{4} = \\frac{\\sin 45°}{\\cos 45°} = \\frac{\\sqrt{2}/2}{\\sqrt{2}/2} = 1\\)."
},
{
  id: 55, topic: "trig", calc: false, type: "input",
  q: "What is the reference angle of \\(240°\\)? (Answer in degrees.)",
  answer: ["60"],
  expl: "\\(240°\\) is in Quadrant III. The reference angle there is the distance past \\(180°\\): \\(240° - 180° = 60°\\)."
},
{
  id: 56, topic: "trig", calc: false, type: "mc",
  q: "What is the period of \\(y = \\sin(2x)\\)?",
  choices: ["\\(4\\pi\\)", "\\(2\\pi\\)", "\\(\\pi\\)", "\\(\\dfrac{\\pi}{2}\\)"],
  answer: 2,
  expl: "Period of \\(\\sin(Bx)\\) is \\(\\frac{2\\pi}{B} = \\frac{2\\pi}{2} = \\pi\\). The 2 inside makes it cycle twice as fast, so the period is half as long."
},
{
  id: 57, topic: "trig", calc: false, type: "input",
  q: "What is the amplitude of \\(y = -3\\cos x + 1\\)?",
  answer: ["3"],
  expl: "Amplitude is \\(|A| = |-3| = 3\\). The negative just flips the graph, and the \\(+1\\) shifts the midline up — neither changes the amplitude."
},
{
  id: 58, topic: "trig", calc: false, type: "mc",
  q: "If \\(\\sin\\theta = \\dfrac{3}{5}\\) and \\(\\theta\\) is in Quadrant II, what is \\(\\cos\\theta\\)?",
  choices: ["\\(\\dfrac{4}{5}\\)", "\\(-\\dfrac{4}{5}\\)", "\\(\\dfrac{3}{4}\\)", "\\(-\\dfrac{3}{4}\\)"],
  answer: 1,
  expl: "Pythagorean identity: \\(\\cos^2\\theta = 1 - \\sin^2\\theta = 1 - \\frac{9}{25} = \\frac{16}{25}\\), so \\(\\cos\\theta = \\pm\\frac{4}{5}\\). In Quadrant II cosine is negative: \\(\\cos\\theta = -\\frac{4}{5}\\)."
},
{
  id: 59, topic: "trig", calc: false, type: "mc",
  q: "What is the period of \\(y = \\tan x\\)?",
  choices: ["\\(\\dfrac{\\pi}{2}\\)", "\\(\\pi\\)", "\\(2\\pi\\)", "\\(4\\pi\\)"],
  answer: 1,
  expl: "Tangent repeats every \\(\\pi\\), not \\(2\\pi\\) (sine and cosine repeat every \\(2\\pi\\)). That's because \\(\\tan\\theta\\) is the slope of the terminal side, and slope repeats after a half-turn."
},
{
  id: 60, topic: "trig", calc: false, type: "input",
  q: "Evaluate \\(\\csc\\dfrac{\\pi}{2}\\).",
  answer: ["1"],
  expl: "\\(\\csc\\theta = \\frac{1}{\\sin\\theta}\\), and \\(\\sin\\frac{\\pi}{2} = 1\\), so \\(\\csc\\frac{\\pi}{2} = 1\\)."
},
{
  id: 61, topic: "trig", calc: false, type: "mc",
  q: "Describe the phase shift of \\(y = \\sin\\!\\left(x - \\dfrac{\\pi}{3}\\right)\\).",
  choices: ["left \\(\\frac{\\pi}{3}\\)", "right \\(\\frac{\\pi}{3}\\)", "up \\(\\frac{\\pi}{3}\\)", "no shift"],
  answer: 1,
  expl: "Just like \\(f(x - h)\\), subtracting inside shifts the graph \\(\\textbf{right}\\) by \\(\\frac{\\pi}{3}\\)."
},
{
  id: 62, topic: "trig", calc: false, type: "input",
  q: "The midline of \\(y = 2\\sin x + 5\\) is \\(y = \\,?\\)",
  answer: ["5"],
  expl: "The midline is the vertical shift: \\(y = 5\\). The graph oscillates 2 above and 2 below it (between 3 and 7)."
},
{
  id: 63, topic: "trig", calc: false, type: "mc",
  q: "What is the exact value of \\(\\cos\\!\\left(-\\dfrac{\\pi}{3}\\right)\\)?",
  choices: ["\\(-\\dfrac{1}{2}\\)", "\\(\\dfrac{1}{2}\\)", "\\(-\\dfrac{\\sqrt{3}}{2}\\)", "\\(\\dfrac{\\sqrt{3}}{2}\\)"],
  answer: 1,
  expl: "Cosine is an even function: \\(\\cos(-\\theta) = \\cos\\theta\\). So \\(\\cos(-\\frac{\\pi}{3}) = \\cos\\frac{\\pi}{3} = \\frac{1}{2}\\). (Sine is odd: \\(\\sin(-\\theta) = -\\sin\\theta\\).)"
},
{
  id: 64, topic: "trig", calc: false, type: "mc",
  q: "Which angle in \\([0, 2\\pi)\\) is coterminal with \\(\\dfrac{7\\pi}{3}\\)?",
  choices: ["\\(\\dfrac{\\pi}{3}\\)", "\\(\\dfrac{2\\pi}{3}\\)", "\\(\\dfrac{4\\pi}{3}\\)", "\\(\\dfrac{5\\pi}{3}\\)"],
  answer: 0,
  expl: "Subtract a full revolution: \\(\\frac{7\\pi}{3} - 2\\pi = \\frac{7\\pi}{3} - \\frac{6\\pi}{3} = \\frac{\\pi}{3}\\)."
},
{
  id: 65, topic: "trig", calc: false, type: "mc",
  q: "Evaluate \\(\\arctan(1)\\) (the principal value).",
  choices: ["\\(\\dfrac{\\pi}{6}\\)", "\\(\\dfrac{\\pi}{4}\\)", "\\(\\dfrac{\\pi}{3}\\)", "\\(\\dfrac{\\pi}{2}\\)"],
  answer: 1,
  expl: "\\(\\arctan(1)\\) asks: what angle (between \\(-\\frac{\\pi}{2}\\) and \\(\\frac{\\pi}{2}\\)) has tangent 1? That's \\(\\frac{\\pi}{4}\\), where sine and cosine are equal."
},
{
  id: 66, topic: "trig", calc: false, type: "mc",
  q: "For what value(s) of \\(\\theta\\) in \\([0, 2\\pi)\\) does \\(\\sin\\theta = -1\\)?",
  choices: ["\\(\\dfrac{\\pi}{2}\\)", "\\(\\pi\\)", "\\(\\dfrac{3\\pi}{2}\\)", "\\(\\dfrac{\\pi}{2}\\) and \\(\\dfrac{3\\pi}{2}\\)"],
  answer: 2,
  expl: "Sine is the \\(y\\)-coordinate on the unit circle. It equals \\(-1\\) only at the very bottom of the circle: \\(\\theta = \\frac{3\\pi}{2}\\)."
},
{
  id: 67, topic: "trig", calc: false, type: "mc",
  q: "Where does \\(y = \\tan x\\) have vertical asymptotes?",
  choices: [
    "\\(x = k\\pi\\) for integers \\(k\\)",
    "\\(x = \\dfrac{\\pi}{2} + k\\pi\\) for integers \\(k\\)",
    "\\(x = 2k\\pi\\) for integers \\(k\\)",
    "it has none"
  ],
  answer: 1,
  expl: "\\(\\tan x = \\frac{\\sin x}{\\cos x}\\) blows up where \\(\\cos x = 0\\): at \\(x = \\frac{\\pi}{2}, \\frac{3\\pi}{2}, \\ldots\\) — that is, \\(x = \\frac{\\pi}{2} + k\\pi\\)."
},

// ================= TRIG: IDENTITIES & EQUATIONS =================
{
  id: 68, topic: "trigid", calc: false, type: "mc",
  q: "Simplify: \\(\\dfrac{\\sin^2\\theta}{1 - \\cos\\theta}\\)",
  choices: ["\\(1 - \\cos\\theta\\)", "\\(1 + \\cos\\theta\\)", "\\(\\sin\\theta\\)", "\\(\\cos\\theta\\)"],
  answer: 1,
  expl: "Use \\(\\sin^2\\theta = 1 - \\cos^2\\theta = (1-\\cos\\theta)(1+\\cos\\theta)\\). Cancel the \\((1 - \\cos\\theta)\\): you're left with \\(1 + \\cos\\theta\\)."
},
{
  id: 69, topic: "trigid", calc: false, type: "mc",
  q: "Which expression equals \\(1 + \\tan^2\\theta\\)?",
  choices: ["\\(\\sin^2\\theta\\)", "\\(\\csc^2\\theta\\)", "\\(\\sec^2\\theta\\)", "\\(\\cot^2\\theta\\)"],
  answer: 2,
  expl: "Pythagorean identity family: \\(\\sin^2 + \\cos^2 = 1\\); divide everything by \\(\\cos^2\\) to get \\(\\tan^2 + 1 = \\sec^2\\); divide by \\(\\sin^2\\) to get \\(1 + \\cot^2 = \\csc^2\\)."
},
{
  id: 70, topic: "trigid", calc: false, type: "mc",
  q: "If \\(\\sin\\theta = \\dfrac{3}{5}\\) and \\(\\cos\\theta = \\dfrac{4}{5}\\), find \\(\\sin 2\\theta\\).",
  choices: ["\\(\\dfrac{6}{5}\\)", "\\(\\dfrac{12}{25}\\)", "\\(\\dfrac{24}{25}\\)", "\\(\\dfrac{7}{25}\\)"],
  answer: 2,
  expl: "Double-angle: \\(\\sin 2\\theta = 2\\sin\\theta\\cos\\theta = 2 \\cdot \\frac{3}{5} \\cdot \\frac{4}{5} = \\frac{24}{25}\\). Don't forget the 2 out front."
},
{
  id: 71, topic: "trigid", calc: false, type: "mc",
  q: "If \\(\\cos\\theta = \\dfrac{1}{3}\\), find \\(\\cos 2\\theta\\).",
  choices: ["\\(\\dfrac{2}{3}\\)", "\\(-\\dfrac{7}{9}\\)", "\\(\\dfrac{7}{9}\\)", "\\(-\\dfrac{1}{9}\\)"],
  answer: 1,
  expl: "Use \\(\\cos 2\\theta = 2\\cos^2\\theta - 1 = 2\\left(\\frac{1}{9}\\right) - 1 = \\frac{2}{9} - \\frac{9}{9} = -\\frac{7}{9}\\)."
},
{
  id: 72, topic: "trigid", calc: false, type: "mc",
  q: "Solve \\(2\\sin\\theta - 1 = 0\\) on \\([0, 2\\pi)\\).",
  choices: [
    "\\(\\dfrac{\\pi}{6}\\) only",
    "\\(\\dfrac{\\pi}{6}, \\dfrac{5\\pi}{6}\\)",
    "\\(\\dfrac{\\pi}{3}, \\dfrac{2\\pi}{3}\\)",
    "\\(\\dfrac{7\\pi}{6}, \\dfrac{11\\pi}{6}\\)"
  ],
  answer: 1,
  expl: "\\(\\sin\\theta = \\frac{1}{2}\\). Sine is positive in Quadrants I and II, with reference angle \\(\\frac{\\pi}{6}\\): \\(\\theta = \\frac{\\pi}{6}\\) and \\(\\pi - \\frac{\\pi}{6} = \\frac{5\\pi}{6}\\). Always find ALL solutions in the interval."
},
{
  id: 73, topic: "trigid", calc: false, type: "input",
  q: "How many solutions does \\(2\\cos^2\\theta - 1 = 0\\) have on \\([0, 2\\pi)\\)?",
  answer: ["4"],
  expl: "\\(\\cos^2\\theta = \\frac{1}{2}\\) means \\(\\cos\\theta = \\pm\\frac{\\sqrt{2}}{2}\\). That happens at \\(\\frac{\\pi}{4}, \\frac{3\\pi}{4}, \\frac{5\\pi}{4}, \\frac{7\\pi}{4}\\) — 4 solutions, one in each quadrant."
},
{
  id: 74, topic: "trigid", calc: false, type: "mc",
  q: "Use a sum formula: \\(\\sin 75° =\\)…",
  choices: [
    "\\(\\dfrac{\\sqrt{6} + \\sqrt{2}}{4}\\)",
    "\\(\\dfrac{\\sqrt{6} - \\sqrt{2}}{4}\\)",
    "\\(\\dfrac{\\sqrt{3} + 1}{2}\\)",
    "\\(\\dfrac{\\sqrt{2} + 1}{2}\\)"
  ],
  answer: 0,
  expl: "\\(\\sin 75° = \\sin(45° + 30°) = \\sin 45°\\cos 30° + \\cos 45°\\sin 30° = \\frac{\\sqrt2}{2}\\cdot\\frac{\\sqrt3}{2} + \\frac{\\sqrt2}{2}\\cdot\\frac{1}{2} = \\frac{\\sqrt6 + \\sqrt2}{4}\\)."
},
{
  id: 75, topic: "trigid", calc: false, type: "mc",
  q: "Simplify: \\(\\tan\\theta \\cdot \\cos\\theta\\)",
  choices: ["\\(\\sin\\theta\\)", "\\(\\cos\\theta\\)", "\\(\\sec\\theta\\)", "\\(1\\)"],
  answer: 0,
  expl: "\\(\\tan\\theta\\cos\\theta = \\frac{\\sin\\theta}{\\cos\\theta} \\cdot \\cos\\theta = \\sin\\theta\\). Rewriting everything in terms of sine and cosine is almost always the move."
},
{
  id: 76, topic: "trigid", calc: false, type: "mc",
  q: "Solve \\(\\tan\\theta = \\sqrt{3}\\) on \\([0, 2\\pi)\\).",
  choices: [
    "\\(\\dfrac{\\pi}{3}\\) only",
    "\\(\\dfrac{\\pi}{3}, \\dfrac{2\\pi}{3}\\)",
    "\\(\\dfrac{\\pi}{3}, \\dfrac{4\\pi}{3}\\)",
    "\\(\\dfrac{\\pi}{6}, \\dfrac{7\\pi}{6}\\)"
  ],
  answer: 2,
  expl: "Tangent is positive in Quadrants I and III, and has period \\(\\pi\\). Reference angle \\(\\frac{\\pi}{3}\\) gives \\(\\theta = \\frac{\\pi}{3}\\) and \\(\\frac{\\pi}{3} + \\pi = \\frac{4\\pi}{3}\\)."
},
{
  id: 77, topic: "trigid", calc: false, type: "mc",
  q: "Which expression is equal to \\(\\cos 2\\theta\\)?",
  choices: ["\\(1 - 2\\sin^2\\theta\\)", "\\(2\\sin\\theta\\cos\\theta\\)", "\\(1 + 2\\sin^2\\theta\\)", "\\(2\\sin^2\\theta - 1\\)"],
  answer: 0,
  expl: "\\(\\cos 2\\theta\\) has three forms: \\(\\cos^2\\theta - \\sin^2\\theta = 1 - 2\\sin^2\\theta = 2\\cos^2\\theta - 1\\). (Choice B is \\(\\sin 2\\theta\\); choice D has the signs flipped.)"
},
{
  id: 78, topic: "trigid", calc: false, type: "mc",
  q: "How many solutions does \\(2\\sin^2\\theta - \\sin\\theta - 1 = 0\\) have on \\([0, 2\\pi)\\)?",
  choices: ["1", "2", "3", "4"],
  answer: 2,
  expl: "Factor like a quadratic in \\(\\sin\\theta\\): \\((2\\sin\\theta + 1)(\\sin\\theta - 1) = 0\\). So \\(\\sin\\theta = -\\frac{1}{2}\\) (at \\(\\frac{7\\pi}{6}, \\frac{11\\pi}{6}\\)) or \\(\\sin\\theta = 1\\) (at \\(\\frac{\\pi}{2}\\)) — 3 solutions total."
},
{
  id: 79, topic: "trigid", calc: false, type: "mc",
  q: "Simplify: \\(\\sec\\theta - \\sec\\theta\\sin^2\\theta\\)",
  choices: ["\\(\\sin\\theta\\)", "\\(\\cos\\theta\\)", "\\(\\tan\\theta\\)", "\\(\\sec\\theta\\)"],
  answer: 1,
  expl: "Factor: \\(\\sec\\theta(1 - \\sin^2\\theta) = \\sec\\theta\\cos^2\\theta = \\frac{1}{\\cos\\theta}\\cdot\\cos^2\\theta = \\cos\\theta\\)."
},
{
  id: 80, topic: "trigid", calc: false, type: "input",
  q: "If \\(\\tan\\theta = 2\\) and \\(\\theta\\) is in Quadrant III, find \\(\\sin\\theta\\cos\\theta\\).",
  answer: ["2/5", "0.4"],
  expl: "In QIII both sine and cosine are negative: \\(\\sin\\theta = -\\frac{2}{\\sqrt5}\\), \\(\\cos\\theta = -\\frac{1}{\\sqrt5}\\). The product: \\(\\left(-\\frac{2}{\\sqrt5}\\right)\\left(-\\frac{1}{\\sqrt5}\\right) = \\frac{2}{5}\\). (Negative times negative is positive.)"
},
{
  id: 81, topic: "trigid", calc: false, type: "mc",
  q: "The expression \\(\\sin x\\cos y + \\cos x\\sin y\\) equals…",
  choices: ["\\(\\sin(x + y)\\)", "\\(\\sin(x - y)\\)", "\\(\\cos(x + y)\\)", "\\(\\cos(x - y)\\)"],
  answer: 0,
  expl: "That's the sine sum formula: \\(\\sin(x+y) = \\sin x\\cos y + \\cos x\\sin y\\). For sine, the sign in the middle matches; for cosine it flips: \\(\\cos(x+y) = \\cos x\\cos y - \\sin x\\sin y\\)."
},
{
  id: 82, topic: "trigid", calc: false, type: "mc",
  q: "Solve \\(2\\cos\\theta + \\sqrt{3} = 0\\) on \\([0, 2\\pi)\\).",
  choices: [
    "\\(\\dfrac{\\pi}{6}, \\dfrac{11\\pi}{6}\\)",
    "\\(\\dfrac{5\\pi}{6}, \\dfrac{7\\pi}{6}\\)",
    "\\(\\dfrac{2\\pi}{3}, \\dfrac{4\\pi}{3}\\)",
    "\\(\\dfrac{5\\pi}{6}\\) only"
  ],
  answer: 1,
  expl: "\\(\\cos\\theta = -\\frac{\\sqrt3}{2}\\). Cosine is negative in Quadrants II and III, reference angle \\(\\frac{\\pi}{6}\\): \\(\\theta = \\pi - \\frac{\\pi}{6} = \\frac{5\\pi}{6}\\) and \\(\\pi + \\frac{\\pi}{6} = \\frac{7\\pi}{6}\\)."
},

// ================= TRIANGLES & APPLICATIONS =================
{
  id: 83, topic: "triangles", calc: true, type: "mc",
  q: "Two sides of a triangle are 5 and 7, and the included angle is \\(60°\\). Find the third side (round to 2 decimals).",
  choices: ["\\(6.24\\)", "\\(8.60\\)", "\\(5.57\\)", "\\(7.81\\)"],
  answer: 0,
  expl: "Law of Cosines: \\(c^2 = 5^2 + 7^2 - 2(5)(7)\\cos 60° = 25 + 49 - 70(0.5) = 39\\), so \\(c = \\sqrt{39} \\approx 6.24\\)."
},
{
  id: 84, topic: "triangles", calc: true, type: "mc",
  q: "In triangle \\(ABC\\), \\(A = 30°\\), \\(B = 45°\\), and \\(a = 10\\). Find \\(b\\) (round to 2 decimals).",
  choices: ["\\(7.07\\)", "\\(12.25\\)", "\\(14.14\\)", "\\(20.00\\)"],
  answer: 2,
  expl: "Law of Sines: \\(\\frac{b}{\\sin B} = \\frac{a}{\\sin A}\\), so \\(b = \\frac{10\\sin 45°}{\\sin 30°} = \\frac{10(0.7071)}{0.5} \\approx 14.14\\)."
},
{
  id: 85, topic: "triangles", calc: false, type: "input",
  q: "Find the area of a triangle with sides \\(a = 8\\), \\(b = 5\\), and included angle \\(C = 30°\\).",
  answer: ["10"],
  expl: "Area \\(= \\frac{1}{2}ab\\sin C = \\frac{1}{2}(8)(5)\\sin 30° = 20 \\cdot \\frac{1}{2} = 10\\)."
},
{
  id: 86, topic: "triangles", calc: false, type: "mc",
  q: "A triangle has sides 3, 5, and 7. What is the measure of its largest angle?",
  choices: ["\\(60°\\)", "\\(90°\\)", "\\(120°\\)", "\\(150°\\)"],
  answer: 2,
  expl: "The largest angle is opposite the longest side (7). Law of Cosines: \\(\\cos C = \\frac{3^2 + 5^2 - 7^2}{2(3)(5)} = \\frac{9 + 25 - 49}{30} = \\frac{-15}{30} = -\\frac{1}{2}\\), so \\(C = 120°\\)."
},
{
  id: 87, topic: "triangles", calc: false, type: "mc",
  q: "Given \\(A = 30°\\), \\(a = 4\\), \\(b = 10\\) (SSA), how many triangles are possible?",
  choices: ["0", "1", "2", "infinitely many"],
  answer: 0,
  expl: "Compare \\(a\\) to the height \\(h = b\\sin A = 10\\sin 30° = 5\\). Since \\(a = 4 < h = 5\\), side \\(a\\) is too short to reach the base — no triangle exists. (\\(a = h\\): one right triangle; \\(h < a < b\\): two triangles.)"
},
{
  id: 88, topic: "triangles", calc: true, type: "mc",
  q: "From 100 ft away from a building, the angle of elevation to the top is \\(25°\\). How tall is the building (nearest foot)?",
  choices: ["\\(42\\) ft", "\\(47\\) ft", "\\(91\\) ft", "\\(214\\) ft"],
  answer: 1,
  expl: "\\(\\tan 25° = \\frac{\\text{height}}{100}\\), so height \\(= 100\\tan 25° \\approx 100(0.4663) \\approx 47\\) ft. Make sure your calculator is in degree mode!"
},
{
  id: 89, topic: "triangles", calc: false, type: "input",
  q: "In triangle \\(ABC\\), \\(A = 40°\\) and \\(C = 65°\\). Find \\(B\\) (in degrees).",
  answer: ["75"],
  expl: "Angles of a triangle sum to \\(180°\\): \\(B = 180° - 40° - 65° = 75°\\)."
},
{
  id: 90, topic: "triangles", calc: true, type: "mc",
  q: "In triangle \\(ABC\\), \\(a = 12\\), \\(b = 15\\), and \\(C = 80°\\). Find the area (round to 1 decimal).",
  choices: ["\\(88.6\\)", "\\(90.0\\)", "\\(177.3\\)", "\\(44.3\\)"],
  answer: 0,
  expl: "Area \\(= \\frac{1}{2}ab\\sin C = \\frac{1}{2}(12)(15)\\sin 80° = 90(0.9848) \\approx 88.6\\)."
},

// ================= SEQUENCES & SERIES =================
{
  id: 91, topic: "seqser", calc: false, type: "input",
  q: "An arithmetic sequence has \\(a_1 = 3\\) and common difference \\(d = 4\\). Find \\(a_{10}\\).",
  answer: ["39"],
  expl: "\\(a_n = a_1 + (n-1)d\\), so \\(a_{10} = 3 + 9(4) = 39\\). It's \\((n-1)\\) steps, not \\(n\\) — that's the classic off-by-one trap."
},
{
  id: 92, topic: "seqser", calc: false, type: "input",
  q: "A geometric sequence has \\(a_1 = 2\\) and common ratio \\(r = 3\\). Find \\(a_5\\).",
  answer: ["162"],
  expl: "\\(a_n = a_1 r^{n-1}\\), so \\(a_5 = 2 \\cdot 3^4 = 2 \\cdot 81 = 162\\)."
},
{
  id: 93, topic: "seqser", calc: true, type: "mc",
  q: "Find the sum of the first 20 terms of the arithmetic sequence \\(5, 8, 11, \\ldots\\)",
  choices: ["\\(620\\)", "\\(670\\)", "\\(700\\)", "\\(1240\\)"],
  answer: 1,
  expl: "First find \\(a_{20} = 5 + 19(3) = 62\\). Then \\(S_{20} = \\frac{n(a_1 + a_n)}{2} = \\frac{20(5 + 62)}{2} = 10(67) = 670\\)."
},
{
  id: 94, topic: "seqser", calc: false, type: "input",
  q: "Find the sum of the infinite geometric series \\(8 + 4 + 2 + 1 + \\cdots\\)",
  answer: ["16"],
  expl: "Here \\(r = \\frac{1}{2}\\) with \\(|r| < 1\\), so the series converges to \\(S = \\frac{a_1}{1 - r} = \\frac{8}{1 - \\frac{1}{2}} = \\frac{8}{1/2} = 16\\)."
},
{
  id: 95, topic: "seqser", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\sum_{k=1}^{5} (2k + 1)\\)",
  answer: ["35"],
  expl: "Plug in \\(k = 1\\) through \\(5\\): \\(3 + 5 + 7 + 9 + 11 = 35\\). Or split it: \\(2(1+2+3+4+5) + 5 = 2(15) + 5 = 35\\)."
},
{
  id: 96, topic: "seqser", calc: false, type: "input",
  q: "A sequence is defined by \\(a_1 = 2\\) and \\(a_n = 3a_{n-1} - 1\\). Find \\(a_3\\).",
  answer: ["14"],
  expl: "Build term by term: \\(a_2 = 3(2) - 1 = 5\\), then \\(a_3 = 3(5) - 1 = 14\\)."
},
{
  id: 97, topic: "seqser", calc: false, type: "mc",
  q: "Which formula gives the \\(n\\)th term of \\(7, 12, 17, 22, \\ldots\\)?",
  choices: ["\\(a_n = 7n\\)", "\\(a_n = 5n + 2\\)", "\\(a_n = 5n + 7\\)", "\\(a_n = 7 \\cdot 5^{n-1}\\)"],
  answer: 1,
  expl: "Common difference is 5, so \\(a_n = 7 + (n-1)5 = 5n + 2\\). Check: \\(n = 1\\) gives 7 ✓, \\(n = 2\\) gives 12 ✓."
},
{
  id: 98, topic: "seqser", calc: true, type: "mc",
  q: "Find the sum of the first 6 terms of the geometric sequence with \\(a_1 = 3\\) and \\(r = 2\\).",
  choices: ["\\(96\\)", "\\(189\\)", "\\(186\\)", "\\(192\\)"],
  answer: 1,
  expl: "\\(S_6 = a_1\\dfrac{r^6 - 1}{r - 1} = 3 \\cdot \\dfrac{64 - 1}{1} = 3(63) = 189\\). Or just add: \\(3 + 6 + 12 + 24 + 48 + 96 = 189\\)."
},
{
  id: 99, topic: "seqser", calc: false, type: "mc",
  q: "An infinite geometric series converges when…",
  choices: ["\\(r > 0\\)", "\\(|r| < 1\\)", "\\(|r| > 1\\)", "\\(r \\ne 1\\)"],
  answer: 1,
  expl: "The terms must shrink toward zero, which happens exactly when \\(|r| < 1\\). Then the sum is \\(\\frac{a_1}{1-r}\\). If \\(|r| \\ge 1\\), the series diverges."
},
{
  id: 100, topic: "seqser", calc: false, type: "mc",
  q: "What is the coefficient of \\(x^3\\) in the expansion of \\((x + 2)^5\\)?",
  choices: ["\\(10\\)", "\\(20\\)", "\\(40\\)", "\\(80\\)"],
  answer: 2,
  expl: "Binomial theorem: the \\(x^3\\) term is \\(\\binom{5}{2}x^3 \\cdot 2^2 = 10 \\cdot x^3 \\cdot 4 = 40x^3\\). The exponent on 2 plus the exponent on \\(x\\) must total 5."
},

// ================= CONICS =================
{
  id: 101, topic: "conics", calc: false, type: "mc",
  q: "Identify the center and radius of \\((x - 2)^2 + (y + 3)^2 = 25\\).",
  choices: [
    "center \\((2, -3)\\), radius 5",
    "center \\((-2, 3)\\), radius 5",
    "center \\((2, -3)\\), radius 25",
    "center \\((-2, 3)\\), radius 25"
  ],
  answer: 0,
  expl: "Standard circle form \\((x-h)^2 + (y-k)^2 = r^2\\): signs flip for the center, so \\((h,k) = (2,-3)\\), and \\(r = \\sqrt{25} = 5\\) (not 25!)."
},
{
  id: 102, topic: "conics", calc: false, type: "mc",
  q: "Find the focus of the parabola \\(y = \\dfrac{1}{8}x^2\\).",
  choices: ["\\((0, 2)\\)", "\\((0, 8)\\)", "\\((2, 0)\\)", "\\((0, \\frac{1}{8})\\)"],
  answer: 0,
  expl: "Rewrite: \\(x^2 = 8y\\), and match to \\(x^2 = 4py\\): \\(4p = 8\\) so \\(p = 2\\). The parabola opens up, so the focus is \\(p\\) above the vertex: \\((0, 2)\\)."
},
{
  id: 103, topic: "conics", calc: false, type: "input",
  q: "What is the length of the major axis of the ellipse \\(\\dfrac{x^2}{25} + \\dfrac{y^2}{9} = 1\\)?",
  answer: ["10"],
  expl: "\\(a^2 = 25\\) (the bigger denominator), so \\(a = 5\\). The major axis has length \\(2a = 10\\). Trap: \\(a\\) alone is the semi-major axis."
},
{
  id: 104, topic: "conics", calc: false, type: "mc",
  q: "Find the foci of the ellipse \\(\\dfrac{x^2}{25} + \\dfrac{y^2}{9} = 1\\).",
  choices: ["\\((\\pm 4, 0)\\)", "\\((0, \\pm 4)\\)", "\\((\\pm 5, 0)\\)", "\\((\\pm \\sqrt{34}, 0)\\)"],
  answer: 0,
  expl: "For an ellipse, \\(c^2 = a^2 - b^2 = 25 - 9 = 16\\), so \\(c = 4\\). The major axis is horizontal (bigger denominator under \\(x^2\\)), so the foci are \\((\\pm 4, 0)\\)."
},
{
  id: 105, topic: "conics", calc: false, type: "mc",
  q: "What are the asymptotes of the hyperbola \\(\\dfrac{x^2}{9} - \\dfrac{y^2}{16} = 1\\)?",
  choices: [
    "\\(y = \\pm\\dfrac{3}{4}x\\)",
    "\\(y = \\pm\\dfrac{4}{3}x\\)",
    "\\(y = \\pm\\dfrac{16}{9}x\\)",
    "\\(y = \\pm\\dfrac{9}{16}x\\)"
  ],
  answer: 1,
  expl: "For \\(\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1\\), asymptotes are \\(y = \\pm\\frac{b}{a}x\\). Here \\(a = 3\\), \\(b = 4\\): \\(y = \\pm\\frac{4}{3}x\\)."
},
{
  id: 106, topic: "conics", calc: false, type: "mc",
  q: "What kind of conic is \\(4x^2 + 4y^2 - 8x + 16y = 0\\)?",
  choices: ["parabola", "circle", "ellipse (not a circle)", "hyperbola"],
  answer: 1,
  expl: "Both squared terms appear with the SAME coefficient (4 and 4) and the same sign → circle. Different positive coefficients → ellipse; opposite signs → hyperbola; only one squared term → parabola."
},
{
  id: 107, topic: "conics", calc: false, type: "input",
  q: "Complete the square to find the radius of the circle \\(x^2 + y^2 - 6x + 4y - 12 = 0\\).",
  answer: ["5"],
  expl: "Group and complete: \\((x^2 - 6x + 9) + (y^2 + 4y + 4) = 12 + 9 + 4\\), giving \\((x-3)^2 + (y+2)^2 = 25\\). So \\(r = \\sqrt{25} = 5\\)."
},
{
  id: 108, topic: "conics", calc: false, type: "mc",
  q: "Find the vertices of the hyperbola \\(\\dfrac{y^2}{4} - \\dfrac{x^2}{9} = 1\\).",
  choices: ["\\((\\pm 2, 0)\\)", "\\((0, \\pm 2)\\)", "\\((0, \\pm 3)\\)", "\\((\\pm 3, 0)\\)"],
  answer: 1,
  expl: "The positive term is \\(\\frac{y^2}{4}\\), so the hyperbola opens up/down and the vertices are on the \\(y\\)-axis: \\((0, \\pm a) = (0, \\pm 2)\\)."
},

// ================= VECTORS, POLAR & PARAMETRIC =================
{
  id: 109, topic: "vectors", calc: false, type: "input",
  q: "Find the magnitude of the vector \\(\\mathbf{u} = \\langle 3, -4 \\rangle\\).",
  answer: ["5"],
  expl: "\\(\\|\\mathbf{u}\\| = \\sqrt{3^2 + (-4)^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5\\). It's just the Pythagorean theorem."
},
{
  id: 110, topic: "vectors", calc: false, type: "mc",
  q: "If \\(\\mathbf{u} = \\langle 1, 2 \\rangle\\) and \\(\\mathbf{v} = \\langle 3, -1 \\rangle\\), find \\(\\mathbf{u} + 2\\mathbf{v}\\).",
  choices: ["\\(\\langle 7, 0 \\rangle\\)", "\\(\\langle 4, 1 \\rangle\\)", "\\(\\langle 5, 3 \\rangle\\)", "\\(\\langle 7, 4 \\rangle\\)"],
  answer: 0,
  expl: "\\(2\\mathbf{v} = \\langle 6, -2 \\rangle\\), then add componentwise: \\(\\langle 1 + 6,\\; 2 - 2 \\rangle = \\langle 7, 0 \\rangle\\)."
},
{
  id: 111, topic: "vectors", calc: false, type: "input",
  q: "Compute the dot product \\(\\langle 2, 5 \\rangle \\cdot \\langle 3, -1 \\rangle\\).",
  answer: ["1"],
  expl: "Multiply matching components and add: \\(2(3) + 5(-1) = 6 - 5 = 1\\). The dot product is a single number, not a vector."
},
{
  id: 112, topic: "vectors", calc: false, type: "mc",
  q: "Which vector is orthogonal (perpendicular) to \\(\\langle 4, 2 \\rangle\\)?",
  choices: ["\\(\\langle 2, 4 \\rangle\\)", "\\(\\langle -1, 2 \\rangle\\)", "\\(\\langle 4, -2 \\rangle\\)", "\\(\\langle 2, 1 \\rangle\\)"],
  answer: 1,
  expl: "Orthogonal means the dot product is zero. \\(\\langle 4,2 \\rangle \\cdot \\langle -1,2 \\rangle = -4 + 4 = 0\\) ✓. Quick trick: swap components and negate one."
},
{
  id: 113, topic: "vectors", calc: false, type: "mc",
  q: "Convert the polar point \\(\\left(4, \\dfrac{\\pi}{3}\\right)\\) to rectangular coordinates.",
  choices: [
    "\\((2, 2\\sqrt{3})\\)",
    "\\((2\\sqrt{3}, 2)\\)",
    "\\((4, \\sqrt{3})\\)",
    "\\((2, 2)\\)"
  ],
  answer: 0,
  expl: "\\(x = r\\cos\\theta = 4\\cos\\frac{\\pi}{3} = 4 \\cdot \\frac{1}{2} = 2\\); \\(y = r\\sin\\theta = 4\\sin\\frac{\\pi}{3} = 4 \\cdot \\frac{\\sqrt3}{2} = 2\\sqrt3\\)."
},
{
  id: 114, topic: "vectors", calc: false, type: "mc",
  q: "Convert the rectangular point \\((-3, 3)\\) to polar form with \\(r > 0\\) and \\(0 \\le \\theta < 2\\pi\\).",
  choices: [
    "\\(\\left(3\\sqrt{2}, \\dfrac{\\pi}{4}\\right)\\)",
    "\\(\\left(3\\sqrt{2}, \\dfrac{3\\pi}{4}\\right)\\)",
    "\\(\\left(\\sqrt{6}, \\dfrac{3\\pi}{4}\\right)\\)",
    "\\(\\left(3\\sqrt{2}, \\dfrac{5\\pi}{4}\\right)\\)"
  ],
  answer: 1,
  expl: "\\(r = \\sqrt{(-3)^2 + 3^2} = \\sqrt{18} = 3\\sqrt2\\). The point is in Quadrant II, and \\(\\tan\\theta = \\frac{3}{-3} = -1\\) gives \\(\\theta = \\frac{3\\pi}{4}\\). Always check the quadrant — don't just trust \\(\\arctan\\)."
},
{
  id: 115, topic: "vectors", calc: false, type: "mc",
  q: "Eliminate the parameter: \\(x = t + 1\\), \\(y = 2t - 3\\).",
  choices: ["\\(y = 2x - 5\\)", "\\(y = 2x - 3\\)", "\\(y = 2x + 1\\)", "\\(y = \\frac{x}{2} - 3\\)"],
  answer: 0,
  expl: "Solve the first equation for \\(t = x - 1\\) and substitute: \\(y = 2(x - 1) - 3 = 2x - 5\\)."
},
{
  id: 116, topic: "vectors", calc: true, type: "mc",
  q: "A vector has magnitude 10 and direction angle \\(60°\\). What is its component form (rounded)?",
  choices: [
    "\\(\\langle 5, 8.66 \\rangle\\)",
    "\\(\\langle 8.66, 5 \\rangle\\)",
    "\\(\\langle 10, 60 \\rangle\\)",
    "\\(\\langle 6, 8 \\rangle\\)"
  ],
  answer: 0,
  expl: "Components are \\(\\langle \\|\\mathbf{v}\\|\\cos\\theta, \\|\\mathbf{v}\\|\\sin\\theta \\rangle = \\langle 10\\cos 60°, 10\\sin 60° \\rangle = \\langle 5, 8.66 \\rangle\\)."
},

// ================= LIMITS =================
{
  id: 117, topic: "limits", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}\\)",
  answer: ["6"],
  expl: "Direct substitution gives \\(\\frac{0}{0}\\), so factor: \\(\\frac{(x-3)(x+3)}{x-3} = x + 3\\) for \\(x \\ne 3\\). The limit is \\(3 + 3 = 6\\)."
},
{
  id: 118, topic: "limits", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to \\infty} \\frac{3x^2 + 1}{x^2 - 5}\\)",
  answer: ["3"],
  expl: "Equal degrees top and bottom → the limit is the ratio of leading coefficients: \\(\\frac{3}{1} = 3\\). (Same rule as horizontal asymptotes.)"
},
{
  id: 119, topic: "limits", calc: false, type: "input",
  q: "Evaluate the famous limit: \\(\\displaystyle\\lim_{x \\to 0} \\frac{\\sin x}{x}\\)",
  answer: ["1"],
  expl: "This is THE limit to memorize: \\(\\lim_{x\\to 0}\\frac{\\sin x}{x} = 1\\) (with \\(x\\) in radians). For tiny angles, \\(\\sin x \\approx x\\)."
},
{
  id: 120, topic: "limits", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to 2} (x^2 + 1)\\)",
  answer: ["5"],
  expl: "Polynomials are continuous everywhere, so just substitute: \\(2^2 + 1 = 5\\). No tricks when direct substitution gives a real number."
},
{
  id: 121, topic: "limits", calc: false, type: "input",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to \\infty} \\frac{2x + 1}{x^2 + 3}\\)",
  answer: ["0"],
  expl: "The denominator's degree (2) beats the numerator's (1), so the fraction shrinks to 0 as \\(x\\) grows."
},
{
  id: 122, topic: "limits", calc: false, type: "mc",
  q: "What is \\(\\displaystyle\\lim_{x \\to 0^+} \\frac{1}{x}\\)?",
  choices: ["\\(0\\)", "\\(1\\)", "\\(+\\infty\\)", "\\(-\\infty\\)"],
  answer: 2,
  expl: "As \\(x\\) approaches 0 from the right (small positive numbers), \\(\\frac{1}{x}\\) blows up: \\(\\frac{1}{0.01} = 100\\), \\(\\frac{1}{0.0001} = 10000\\), … so the limit is \\(+\\infty\\). From the left it would be \\(-\\infty\\)."
},
{
  id: 123, topic: "limits", calc: false, type: "mc",
  q: "Evaluate: \\(\\displaystyle\\lim_{x \\to 1} \\frac{x^2 - 1}{x^2 + x - 2}\\)",
  choices: ["\\(0\\)", "\\(\\dfrac{2}{3}\\)", "\\(1\\)", "does not exist"],
  answer: 1,
  expl: "It's \\(\\frac{0}{0}\\), so factor: \\(\\frac{(x-1)(x+1)}{(x+2)(x-1)} = \\frac{x+1}{x+2}\\) for \\(x \\ne 1\\). Substitute \\(x = 1\\): \\(\\frac{2}{3}\\)."
},
{
  id: 124, topic: "limits", calc: false, type: "mc",
  q: "The function \\(f(x) = \\dfrac{x^2 - 4}{x - 2}\\) has what kind of discontinuity at \\(x = 2\\)?",
  choices: ["a vertical asymptote", "a removable discontinuity (hole)", "a jump discontinuity", "it is continuous there"],
  answer: 1,
  expl: "The factor \\(x - 2\\) cancels: \\(f(x) = x + 2\\) for \\(x \\ne 2\\). The limit exists (it's 4) but \\(f(2)\\) is undefined — that's a hole, a removable discontinuity. Asymptotes happen when the factor does NOT cancel."
},

// ================= EXTRAS: mixed reinforcement =================
{
  id: 125, topic: "trig", calc: false, type: "mc",
  q: "What is the exact value of \\(\\sin\\dfrac{7\\pi}{6}\\)?",
  choices: ["\\(\\dfrac{1}{2}\\)", "\\(-\\dfrac{1}{2}\\)", "\\(-\\dfrac{\\sqrt{3}}{2}\\)", "\\(\\dfrac{\\sqrt{3}}{2}\\)"],
  answer: 1,
  expl: "\\(\\frac{7\\pi}{6}\\) is in Quadrant III (just past \\(\\pi\\)), where sine is negative. Reference angle \\(\\frac{\\pi}{6}\\), so \\(\\sin\\frac{7\\pi}{6} = -\\frac{1}{2}\\)."
},
{
  id: 126, topic: "trig", calc: false, type: "mc",
  q: "Evaluate \\(\\arccos\\!\\left(-\\dfrac{1}{2}\\right)\\) (the principal value).",
  choices: ["\\(\\dfrac{\\pi}{3}\\)", "\\(\\dfrac{2\\pi}{3}\\)", "\\(\\dfrac{4\\pi}{3}\\)", "\\(-\\dfrac{\\pi}{3}\\)"],
  answer: 1,
  expl: "\\(\\arccos\\) returns angles in \\([0, \\pi]\\). The angle in that range with cosine \\(-\\frac{1}{2}\\) is \\(\\frac{2\\pi}{3}\\) (Quadrant II, reference angle \\(\\frac{\\pi}{3}\\))."
},
{
  id: 127, topic: "trig", calc: true, type: "mc",
  q: "A Ferris wheel's height is modeled by \\(h(t) = 25\\sin\\!\\left(\\dfrac{\\pi}{15}t\\right) + 30\\) (meters, \\(t\\) in seconds). What are its maximum height and period?",
  choices: [
    "max 55 m, period 30 s",
    "max 25 m, period 15 s",
    "max 55 m, period 15 s",
    "max 30 m, period 30 s"
  ],
  answer: 0,
  expl: "Max = midline + amplitude = \\(30 + 25 = 55\\) m. Period = \\(\\frac{2\\pi}{B} = \\frac{2\\pi}{\\pi/15} = 30\\) s."
},
{
  id: 128, topic: "explog", calc: true, type: "mc",
  q: "A car worth \\(\\$24{,}000\\) depreciates 15% per year. Its value after 4 years is closest to…",
  choices: ["\\(\\$9{,}600\\)", "\\(\\$12{,}528\\)", "\\(\\$14{,}400\\)", "\\(\\$17{,}340\\)"],
  answer: 1,
  expl: "Losing 15% per year means keeping 85%: \\(V = 24000(0.85)^4 = 24000(0.52200625) \\approx \\$12{,}528\\). Trap: don't subtract \\(15\\% \\times 4 = 60\\%\\) — decay is multiplicative."
},
{
  id: 129, topic: "explog", calc: true, type: "mc",
  q: "How long (to the nearest year) does it take an investment to double at 5% compounded continuously?",
  choices: ["10 years", "14 years", "16 years", "20 years"],
  answer: 1,
  expl: "Solve \\(2 = e^{0.05t}\\): \\(t = \\frac{\\ln 2}{0.05} = \\frac{0.6931}{0.05} \\approx 13.9 \\approx 14\\) years. (The 'Rule of 70': \\(70 \\div 5 = 14\\).)"
},
{
  id: 130, topic: "functions", calc: false, type: "mc",
  q: "If \\(f(x) = \\sqrt{x}\\) and \\(g(x) = x - 2\\), what is the domain of \\((f \\circ g)(x) = \\sqrt{x - 2}\\,\\)?",
  choices: ["\\(x \\ge 0\\)", "\\(x \\ge 2\\)", "\\(x > 2\\)", "all real numbers"],
  answer: 1,
  expl: "Need the inside of the root non-negative: \\(x - 2 \\ge 0\\), so \\(x \\ge 2\\). The domain of a composition comes from the \\(\\textbf{final}\\) expression AND any inner restrictions."
},
{
  id: 131, topic: "poly", calc: true, type: "mc",
  q: "A rocket's height is \\(h(t) = -16t^2 + 96t + 5\\) feet after \\(t\\) seconds. What is its maximum height?",
  choices: ["\\(96\\) ft", "\\(149\\) ft", "\\(144\\) ft", "\\(101\\) ft"],
  answer: 1,
  expl: "Vertex at \\(t = -\\frac{b}{2a} = -\\frac{96}{-32} = 3\\) s. Then \\(h(3) = -16(9) + 96(3) + 5 = -144 + 288 + 5 = 149\\) ft."
},
{
  id: 132, topic: "seqser", calc: true, type: "mc",
  q: "A ball is dropped from 27 ft and rebounds to \\(\\frac{2}{3}\\) of its previous height on each bounce. How high is the third rebound?",
  choices: ["\\(18\\) ft", "\\(12\\) ft", "\\(8\\) ft", "\\(6\\) ft"],
  answer: 2,
  expl: "Each rebound multiplies by \\(\\frac{2}{3}\\): first \\(27 \\cdot \\frac{2}{3} = 18\\), second \\(12\\), third \\(8\\) ft. Geometric with \\(r = \\frac{2}{3}\\)."
},
];
