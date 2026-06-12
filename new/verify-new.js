// Verification for qb-limits-functions.js — structural + numerical checks.
const Q = require("./qb-limits-functions.js");
let fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const approx = (a, b, tol = 1e-3) => Math.abs(a - b) < tol;

// ---------- Structural checks ----------
const ranges = { limits: [270, 286], functions: [290, 302], poly: [310, 317] };
const counts = { limits: 0, functions: 0, poly: 0 };
const ids = new Set();
const numRe = /^-?\d+(\.\d+)?$|^-?\d+\/\d+$/; // integer, decimal, simple fraction

for (const q of Q) {
  const tag = `id ${q.id}`;
  ok(!ids.has(q.id), `${tag}: duplicate id`);
  ids.add(q.id);
  ok(ranges[q.topic], `${tag}: bad topic ${q.topic}`);
  if (ranges[q.topic]) {
    const [lo, hi] = ranges[q.topic];
    ok(q.id >= lo && q.id <= hi, `${tag}: id out of range for ${q.topic}`);
    counts[q.topic]++;
  }
  ok(typeof q.calc === "boolean", `${tag}: calc not boolean`);
  for (const f of ["q", "simple", "expl"])
    ok(typeof q[f] === "string" && q[f].length > 0, `${tag}: missing ${f}`);
  ok(!/\\\(|\\\)/.test(q.simple || ""), `${tag}: simple contains LaTeX`);
  if (q.type === "mc") {
    ok(Array.isArray(q.choices) && q.choices.length === 4, `${tag}: mc needs 4 choices`);
    ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${tag}: mc answer index bad`);
    ok(new Set(q.choices).size === 4, `${tag}: duplicate choices`);
  } else if (q.type === "input") {
    ok(Array.isArray(q.answer) && q.answer.length > 0, `${tag}: input answer array empty`);
    for (const a of q.answer) ok(numRe.test(a), `${tag}: answer "${a}" not parseable number/fraction`);
  } else fails.push(`${tag}: bad type ${q.type}`);
}
ok(counts.limits === 17, `limits count ${counts.limits} != 17`);
ok(counts.functions === 13, `functions count ${counts.functions} != 13`);
ok(counts.poly === 8, `poly count ${counts.poly} != 8`);

// MC correct-index distribution
const dist = [0, 0, 0, 0];
Q.filter(q => q.type === "mc").forEach(q => dist[q.answer]++);
console.log("MC correct-index distribution [0,1,2,3]:", dist);

// Also confirm no id collisions with the main bank
const fs = require("fs");
const main = fs.readFileSync(__dirname + "/../questions.js", "utf8");
for (const id of ids)
  ok(!new RegExp(`^\\s*id: ${id},`, "m").test(main), `id ${id} already exists in questions.js`);

// ---------- Numerical checks ----------
const lim2 = (f, a, exp, tol = 1e-3) => { // two-sided limit
  const h = 1e-6, L = f(a - h), R = f(a + h);
  return approx(L, exp, tol) && approx(R, exp, tol);
};
const limInf = (f, exp, sign = 1, tol = 1e-3) => approx(f(sign * 1e8), exp, tol);

// 270: lim x->2 (x^2+3x-10)/(x-2) = 7
ok(lim2(x => (x*x + 3*x - 10)/(x - 2), 2, 7), "270 limit != 7");
// 271: lim x->-3 (x^2+x-6)/(x+3) = -5
ok(lim2(x => (x*x + x - 6)/(x + 3), -3, -5), "271 limit != -5");
// 272: lim x->inf (6x^3-x)/(2x^3+5x^2) = 3
ok(limInf(x => (6*x**3 - x)/(2*x**3 + 5*x*x), 3), "272 limit != 3");
// 273: lim x->inf (4x^2+1)/(x^3-7) = 0 (and distractor 4 wrong)
ok(limInf(x => (4*x*x + 1)/(x**3 - 7), 0), "273 limit != 0");
// 274: lim x->inf (x^3+2x)/(5x^2+1) = +inf
ok((x => (x**3 + 2*x)/(5*x*x + 1))(1e8) > 1e6, "274 not +inf");
// 275: lim x->3- 1/(x-3) = -inf
ok(1/(3 - 1e-9 - 3) < -1e8, "275 not -inf");
// 276: piecewise both sides -> 5
{ const f = x => x < 2 ? x*x + 1 : 3*x - 1;
  ok(approx(f(2 - 1e-9), 5, 1e-6) && approx(f(2 + 1e-9), 5, 1e-6), "276 sides != 5"); }
// 277: left 3, right -2 (DNE)
{ const g = x => x < 1 ? 2*x + 1 : x*x - 3;
  ok(approx(g(1 - 1e-9), 3, 1e-6) && approx(g(1 + 1e-9), -2, 1e-6), "277 sides wrong"); }
// 278: right limit of h at 3 is 2 (left is 5, distinct)
{ const h = x => x < 3 ? x*x - 4 : 2*x - 4;
  ok(approx(h(3 + 1e-9), 2, 1e-6), "278 right limit != 2");
  ok(approx(h(3 - 1e-9), 5, 1e-6), "278 left limit != 5 (jump check)"); }
// 279: k=4 makes pieces meet at x=4 (both 15); k=3 (a wrong k) does not
{ const f = (k, x) => x < 4 ? k*x - 1 : 2*x + 7;
  ok(approx(f(4, 4 - 1e-9), f(4, 4), 1e-6), "279 k=4 not continuous");
  ok(!approx(f(3, 4 - 1e-9), f(3, 4), 1e-3), "279 k=3 should NOT work"); }
// 280: f=(x-5)/(x^2-25): finite limit (hole) at 5 = 1/10; blows up at -5
{ const f = x => (x - 5)/(x*x - 25);
  ok(lim2(f, 5, 0.1), "280 hole value at 5 != 1/10");
  ok(Math.abs(f(-5 + 1e-9)) > 1e6, "280 no asymptote at -5"); }
// 281: jump: left 2, right 4
{ const g = x => x <= 1 ? x + 1 : x*x + 3;
  ok(approx(g(1 - 1e-9), 2, 1e-6) && approx(g(1 + 1e-9), 4, 1e-6), "281 not a jump 2->4"); }
// 282: IVT premise: -6 < 0 < 3
ok(-6 < 0 && 0 < 3, "282 IVT premise");
// 283: lim sin(5x)/x = 5
ok(lim2(x => Math.sin(5*x)/x, 0, 5), "283 limit != 5");
// 284: lim sin(6x)/(2x) = 3, and the quoted estimate at x=0.001
ok(lim2(x => Math.sin(6*x)/(2*x), 0, 3), "284 limit != 3");
ok(approx(Math.sin(0.006)/0.002, 2.99998, 1e-4), "284 quoted estimate 2.99998 wrong");
// 285: direct substitution = -1
ok(lim2(x => (2*x*x + 5*x + 1)/(x + 3), -1, -1), "285 limit != -1");
// 286: limit of (x^2-1)/(x-1) at 1 is 2 (not 5)
ok(lim2(x => (x*x - 1)/(x - 1), 1, 2), "286 limit != 2");

// 290: domain: sqrt(2x+6)/(x-1): valid at x=-3 and x=0; invalid at x=-3.01 and x=1
{ const f = x => Math.sqrt(2*x + 6)/(x - 1);
  ok(isFinite(f(-3)) && isFinite(f(0)), "290 should be defined at -3, 0");
  ok(isNaN(f(-3.01)) && !isFinite(f(1)), "290 should fail at -3.01 and 1"); }
// 291: max of -(x-2)^2+3 is 3, attained
{ const f = x => -((x - 2)**2) + 3;
  let m = -Infinity; for (let x = -10; x <= 10; x += 0.001) m = Math.max(m, f(x));
  ok(approx(m, 3, 1e-5) && f(2) === 3, "291 max != 3 attained"); }
// 292: g(f(2)) = 12 (and f(g(2)) = 13 is the trap, distinct)
{ const f = x => 2*x - 1, g = x => x*x + 3;
  ok(g(f(2)) === 12, "292 g(f(2)) != 12");
  ok(f(g(2)) === 13 && 13 !== 12, "292 trap check"); }
// 293: f(f(-3)) = 13
{ const f = x => x < 0 ? x*x : x + 4;
  ok(f(f(-3)) === 13, "293 f(f(-3)) != 13"); }
// 294: inverse of x^3+2 is cbrt(x-2): round trips
{ const f = x => x**3 + 2, inv = x => Math.cbrt(x - 2);
  for (const t of [-2.3, 0, 1.7, 4]) ok(approx(inv(f(t)), t, 1e-9), `294 roundtrip fail at ${t}`);
  // distractors are NOT inverses:
  ok(!approx(Math.cbrt(f(1.7)) - 2, 1.7, 1e-3), "294 distractor A is also an inverse");
  ok(!approx((f(1.7) - 2)**3, 1.7, 1e-3), "294 distractor B is also an inverse"); }
// 295: f(7/2) = 3 where f=(x+1)/(x-2)
ok(approx((3.5 + 1)/(3.5 - 2), 3, 1e-12), "295 f(7/2) != 3");
// 298: x^3+1 neither even nor odd
{ const f = x => x**3 + 1;
  ok(f(-2) !== f(2) && f(-2) !== -f(2), "298 should be neither"); }
// 299: ARC of x^3-2x on [-1,2] = 1
{ const f = x => x**3 - 2*x;
  ok(approx((f(2) - f(-1))/3, 1, 1e-12), "299 ARC != 1"); }
// 300: ARC of ln on [1,5] = 0.402; distractors wrong
{ const arc = (Math.log(5) - Math.log(1))/4;
  ok(approx(arc, 0.402, 5e-4), "300 ARC != 0.402");
  for (const d of [0.175, 1.609, 2.485]) ok(!approx(arc, d, 5e-4), `300 distractor ${d} also correct`);
  ok(approx(Math.log10(5)/4, 0.175, 5e-4), "300 distractor 0.175 not the log10 mistake"); }
// 301: x^3 one-to-one (strictly increasing); others fail
{ ok(2**3 !== (-2)**3, "301 x^3 repeats?");
  ok((-2)**2 === 2**2 && Math.abs(-2) === Math.abs(2) && approx(Math.cos(1), Math.cos(-1), 1e-12),
     "301 distractors should fail one-to-one"); }
// 302: 3x-12 >= 0 exactly when x >= 4
ok(3*4 - 12 === 0 && 3*3.99 - 12 < 0, "302 boundary != 4");

// 310: (x^2-4)(x+2) == (x-2)(x+2)^2 — multiplicity 2 at -2
{ const p = x => (x*x - 4)*(x + 2);
  for (const t of [-3, -1, 0, 2.5]) ok(approx(p(t), (t - 2)*(t + 2)**2, 1e-9), `310 factorization fail at ${t}`);
  const c = p(-2 + 1e-4)/(1e-4)**2; // p/(x+2)^2 near -2 -> -4 (finite, nonzero)
  ok(approx(c, -4, 1e-2), "310 multiplicity at -2 is not exactly 2"); }
// 311: 3x^4-x^3+2 both ends up
{ const p = x => 3*x**4 - x**3 + 2;
  ok(p(-1e3) > 1e9 && p(1e3) > 1e9, "311 end behavior wrong"); }
// 312: f(-1) = -15
{ const f = x => 2*x**3 - 5*x*x + x - 7;
  ok(f(-1) === -15, "312 remainder != -15"); }
// 313: (x-3)(x-2i)(x+2i) = (x-3)(x^2+4): zeros 3, ±2i; -2i is a zero, distractors are not
{ const p = x => (x - 3)*(x*x + 4); // real-coefficient cubic with zeros 3, 2i, -2i
  // check -2i is a zero: ((-2i)^2 + 4) = (-4 + 4) = 0  -> verified symbolically:
  ok((-2)*(-2)*(-1) + 4 === 0, "313 (-2i)^2+4 != 0");
  ok(p(-3) !== 0 && p(-2) !== 0, "313 distractors -3/-2 should not be zeros"); }
// 314: g=(2x^2+2x-12)/(x^2-4): hole (2, 5/2), VA x=-2, HA y=2
{ const g = x => (2*x*x + 2*x - 12)/(x*x - 4);
  ok(lim2(g, 2, 2.5), "314 hole height != 5/2");
  ok(Math.abs(g(-2 + 1e-9)) > 1e6, "314 no VA at -2");
  ok(limInf(g, 2) && limInf(g, 2, -1), "314 HA != 2");
  ok(!lim2(g, -2, 2.5, 1) , "314 distractor: hole at -2 should be false"); }
// 315: denominator zeros exactly 4 and -2; defined at -4
{ const d = x => x*x - 2*x - 8;
  ok(d(4) === 0 && d(-2) === 0 && d(-4) !== 0, "315 domain exclusions wrong"); }
// 316: f - (x-4) -> 0 at ±inf; f - (x-3) does not
{ const f = x => (x*x - 3*x + 5)/(x + 1);
  ok(approx(f(1e8) - (1e8 - 4), 0, 1e-3) && approx(f(-1e8) - (-1e8 - 4), 0, 1e-3), "316 slant != x-4");
  ok(!approx(f(1e8) - (1e8 - 3), 0, 0.5), "316 distractor x-3 also fits");
  ok(approx((1e0 + 1)*(1e0 - 4) + 9, 1 - 3 + 5, 1e-12), "316 division identity check"); }
// 317: x^3-4x >= 0 on [-2,0] U [2,inf): sample tests
{ const p = x => x**3 - 4*x;
  ok(p(-3) < 0 && p(-1) > 0 && p(1) < 0 && p(3) > 0, "317 sign chart wrong");
  ok(p(-2) === 0 && p(0) === 0 && p(2) === 0, "317 endpoints not zeros"); }

// ---------- Report ----------
if (fails.length) {
  console.error("FAILURES:\n" + fails.map(f => "  - " + f).join("\n"));
  process.exit(1);
}
console.log(`ALL CHECKS PASSED: ${Q.length} questions (limits ${counts.limits}, functions ${counts.functions}, poly ${counts.poly})`);
console.log(`input: ${Q.filter(q => q.type === "input").length}, mc: ${Q.filter(q => q.type === "mc").length}, calc: ${Q.filter(q => q.calc).length}`);
