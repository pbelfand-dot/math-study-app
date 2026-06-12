# Math 4H Final Review #6 — Answer Key Transcript

**Summary**
- Source PDF: `112817ec-Answer_key_Final_Rev_6_2.pdf` (5 pages, not 57 — the actual file contains 5 pages).
- Total numbered questions: **15** (several are multi-part: Q10 has 2 parts, Q13 has 5 parts, Q15 has 4 parts).
- Topic distribution: derivatives/particle-motion 3 (Q3, Q4, Q13), polar 3 (Q9, Q10, Q12), tangent-line 1 (Q2), riemann-sums 1 (Q5), limits 1 (Q6), rationals/domain 1 (Q7), logs 1 (Q8), trig-equations 1 (Q14), parametric 1 (Q15), algebra 1 (Q1), piecewise-composition 1 (Q11).
- Style: entirely **free response** (no multiple choice); show-your-work answer key with handwritten solutions on every problem.
- The header is marked **"Calculator"** — this is the calculator-allowed section of the final review (Q8, Q12, Q14 require a calculator for decimal answers).
- Two problems require sketching graphs (Q9 polar graph, Q15a parametric graph); one uses a data table (Q5).

---

### Q1 (page 1)
TOPIC: algebra
QUESTION: Solve for $y$: $y^{-2} = x^5 + x^4$
ANSWER: $y = \pm\sqrt{\dfrac{1}{x^5 + x^4}}$
NOTES: Negative-exponent manipulation.

### Q2 (page 1)
TOPIC: tangent-line
QUESTION: Write the equation of the line tangent to the graph of $f(x) = 6\sqrt{x} + x^2 - x + 2$ at $x = 1$.
ANSWER: $y - 8 = 4(x - 1)$ (slope $f'(1) = \frac{3}{\sqrt{1}} + 2(1) - 1 = 4$, point $f(1) = 8$)
NOTES: Handwritten margin note: "Calc Section so you could type $\frac{d}{dx}(6\sqrt{x}+x^2-x+2)\big|_{x=1}$ in calculator."

### Q3 (page 1)
TOPIC: derivatives
QUESTION: Given $f(x) = \frac{x^3}{3} - \frac{3x^2}{2} - 10x - 1$, what are the values for which $f$ is decreasing?
ANSWER: $(-2, 5)$ (from $f'(x) = x^2 - 3x - 10 = (x-5)(x+2)$, sign chart $-$ between $-2$ and $5$)
NOTES: First-derivative test with sign chart.

### Q4 (page 1)
TOPIC: derivatives
QUESTION: If $y = \tan x - \cos x$, find $\frac{dy}{dx}$.
ANSWER: $\frac{dy}{dx} = \sec^2 x - (-\sin x) = \sec^2 x + \sin x$
NOTES: Handwritten note "Formula Sheet" (trig derivative formulas given).

### Q5 (page 1)
TOPIC: riemann-sums
QUESTION: The function $f$ is continuous on the closed interval $[2, 8]$ and has values that are given in the table above. Using the subintervals $[3, 6]$, $[6, 8]$, and $[8, 9]$, what is the left Riemann approximation of $\int_3^9 f(x)\,dx$? Table: $x$: 3, 6, 8, 9; $f(x)$: 11, 29, 41, 19.
ANSWER: $132$ ($A_1 = 3 \times 11 = 33$, $A_2 = 2 \times 29 = 58$, $A_3 = 1 \times 41 = 41$; $33+58+41 = 132$)
NOTES: Has data table; the printed interval "[2, 8]" appears to be a typo for the table's $[3, 9]$. Handwritten rectangle sketch included.

### Q6 (page 2)
TOPIC: limits
QUESTION: Evaluate the following: $\lim\limits_{x \to -5} \dfrac{x^2 - 25}{4x + 20}$
ANSWER: $-\dfrac{5}{2}$ (factor: $\frac{(x+5)(x-5)}{4(x+5)} \to \frac{-5-5}{4} = \frac{-10}{4}$)
NOTES: 0/0 form resolved by factoring.

### Q7 (page 2)
TOPIC: rationals
QUESTION: Determine the domain (in interval notation) of the following function: $f(x) = \dfrac{2x+1}{x^2 + 7x - 30}$
ANSWER: $(-\infty, -10) \cup (-10, 3) \cup (3, \infty)$ (denominator $(x-3)(x+10) = 0$ at $x = 3,\ x = -10$)
NOTES: Handwritten note: "Fractions undefined when denom = 0."

### Q8 (page 2)
TOPIC: logs
QUESTION: Express the value of $x$ to the nearest thousandth: $-2 + \ln(3 - x) = 7$
ANSWER: $x = 3 - e^9 \approx -8{,}100.084$
NOTES: Requires calculator; work shows $\ln(3-x) = 9 \Rightarrow 3 - x = e^9$.

### Q9 (page 2)
TOPIC: polar
QUESTION: Graph: $r = 6\sin\theta$. (Complete the table for $\theta = 0, \frac{\pi}{6}, \frac{\pi}{3}, \frac{\pi}{2}, \frac{2\pi}{3}, \frac{5\pi}{6}, \pi$ and graph on the polar grid.)
ANSWER: Table values $r = 0,\ 3,\ 5.2,\ 6,\ 5.2,\ 3,\ 0$; graph is a circle of diameter 6 sitting on the pole (centered at $(0,3)$ in rectangular terms).
NOTES: Has figure (polar grid graph required).

### Q10 (page 2)
TOPIC: polar
QUESTION: Given $r = 8 - \cos\theta$, complete the following. (a) Determine the average rate of change of $r$ with respect to $\theta$ on the interval $[\frac{\pi}{2}, \pi]$. Leave your answer in terms of $\pi$. (b) Determine whether the distance between the graph and the origin is increasing or decreasing on the interval.
ANSWER: (a) $\dfrac{f(\pi) - f(\frac{\pi}{2})}{\pi - \frac{\pi}{2}} = \dfrac{9 - 8}{\frac{\pi}{2}} = \dfrac{2}{\pi}$; (b) Increasing (note: $\frac{2}{\pi} > 0$, so $r$ goes from 8 circles out to 9 circles out)
NOTES: Multi-part (a, b).

### Q11 (page 3)
TOPIC: piecewise-composition
QUESTION: Given the following functions $f(x) = \begin{cases} e^x, & x > 0 \\ 2^{3x}, & x \le 0 \end{cases}$ and $g(x) = \begin{cases} \ln\frac{x}{4}, & x \ge 4 \\ x + 1, & x < 4 \end{cases}$, find $f(g(4))$.
ANSWER: $1$ ($g(4) = \ln\frac{4}{4} = \ln 1 = 0$, then $f(0) = 2^{3(0)} = 2^0 = 1$)
NOTES: Piecewise function composition. UNCLEAR on exact form of g's first branch argument (best guess $\ln\frac{x}{4}$, consistent with the handwritten $\ln\frac{4}{4}$ work).

### Q12 (page 3)
TOPIC: polar
QUESTION: A particle moves along the polar curve $r = \cos\theta$ such that at time $t$ seconds, $\theta = t$. Find the position vector at time $t = 3$. Round your answer to the nearest tenth.
ANSWER: $\langle 1.0, -0.1 \rangle$ ($x(3) = \cos 3 \cdot \cos 3 \approx 0.9800$, $y(3) = \cos 3 \cdot \sin 3 \approx -0.1397$)
NOTES: Requires calculator (radian mode). UNCLEAR on exact printed wording of the curve/time relation (partially obscured by handwriting); best guess $r = \cos\theta$, $\theta = t$, which matches the work shown. Note: $x(3) \approx 0.98$ rounds to $1.0$.

### Q13 (page 3)
TOPIC: derivatives
QUESTION: Two particles move along the x-axis from $0 \le t \le 8$. The position of particle A is defined by the equation $f(t) = 4t^2 - 16t + 6$, and the position of particle B is defined by the equation $g(t) = \frac{t^3}{3} + 2t^2 - 12t + 1$. (a) Write an equation for the velocity of each particle. (b) Determine the interval(s) when particle A is moving to the left. (c) Find the velocity of particle B at $t = 3$. (d) Find the acceleration of particle B at $t = 3$. (e) Is the speed of particle B increasing, decreasing or neither at $t = 3$? Explain your reasoning.
ANSWER: (a) $f'(t) = 8t - 16$; $g'(t) = t^2 + 4t - 12$. (b) $[0, 2)$ (velocity negative until $t = 2$). (c) $g'(3) = 9 + 12 - 12 = 9$. (d) $g''(t) = 2t + 4$, so $g''(3) = 10$. (e) Increasing — velocity (9) and acceleration (10) have the same sign.
NOTES: Multi-part (a–e), particle motion.

### Q14 (page 4)
TOPIC: trig-equations
QUESTION: Solve for all values of $x$ in the interval $0 \le x < 2\pi$ for the following equation: $e^x\tan^2 x - e^x\tan x - 12e^x = 0$. Values of $x$ should be rounded to the nearest thousandth.
ANSWER: $\{1.326,\ 4.467,\ 1.893,\ 5.034\}$ — factor $e^x(\tan x - 4)(\tan x + 3) = 0$; $e^x = 0$ has no solution; $\tan x = 4$: ref angle $1.3258$ gives $1.326$ and $\pi + 1.3258 = 4.467$; $\tan x = -3$: ref angle $1.2490$ gives $\pi - 1.2490 = 1.893$ and $2\pi - 1.2490 = 5.034$.
ANSWER NOTE: side work shows the analogue $x^2 - x - 12 = (x-4)(x+3)$.
NOTES: Requires calculator (inverse tan, radian mode). UNCLEAR whether the printed middle term reads $-xe^x\tan x$ or $-e^x\tan x$; the handwritten factoring confirms coefficient $-1$ (i.e., $-e^x\tan x$). Handwritten tips: "Don't type $-$ symbol" for reference angle, ASTC quadrant chart used.

### Q15 (page 5)
TOPIC: parametric
QUESTION: A particle moves along a curve according to the given parametric equations for $t$ in the interval $[-2, 2]$: $x(t) = 2t^2 - 1$ and $y(t) = t + 8$. (a) Sketch the graph of the parametric equations, indicating the direction. (b) Determine the zeroes of the parametric curve. Show an algebraic solution for complete credit. (c) Describe the direction of the particle on the time interval $0.25 \le t \le 0.75$. (d) Write a rectangular equation for the given parametric equations by eliminating the parameter.
ANSWER: (a) Points $(7,6), (1,7), (-1,8), (1,9), (7,10)$ for $t = -2 \dots 2$; sideways parabola traced upward/rightward — "Don't forget arrows!" (b) Set $y(t) = 0$: $t = -8$, $x(-8) = 2(-8)^2 - 1 = 127$, zero at $(127, 0)$. (c) From $(-0.875, 8.25)$ to $(0.125, 8.75)$: up and to the right. (d) $x = 2(y-8)^2 - 1$ (equivalently $y = \sqrt{\frac{x+1}{2}} + 8$ with $\pm$ branches).
NOTES: Multi-part (a–d); has figure (graph grid). Part (a) requires sketch with direction arrows.
