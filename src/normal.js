// Normal tail probabilities.
//
// The roll curve needs P(Z > t) accurate far out in the tail — a Mythic pull is
// around 1 in a million, and the odds line quotes it — so this needs small
// RELATIVE error at large t, not just small absolute error. The usual
// Abramowitz-Stegun 7.1.26 polynomial is ~1e-7 absolute, which is worthless
// once the true value is 1e-9. This is the Chebyshev erfc from Numerical
// Recipes 3rd ed., which holds relative accuracy across the whole range.

const COF = [
  -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
  -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
  4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
  1.30365583558e-6, 1.5626441722e-8, -8.5238095915e-8,
  6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
  -2.27365122e-10, 9.6467911e-11, 2.394038e-12,
  -6.886027e-12, 8.94487e-13, 3.13092e-13,
  -1.12708e-13, 3.81e-16, 7.106e-15,
];

export function erfc(x) {
  const z = Math.abs(x);
  const t = 2 / (2 + z);
  const ty = 4 * t - 2;
  let d = 0;
  let dd = 0;
  for (let j = COF.length - 1; j > 0; j--) {
    const tmp = d;
    d = ty * d - dd + COF[j];
    dd = tmp;
  }
  const ans = t * Math.exp(-z * z + 0.5 * (COF[0] + ty * d) - dd);
  return x >= 0 ? ans : 2 - ans;
}

// P(Z > t) for standard normal Z.
export const normalTail = (t) => 0.5 * erfc(t / Math.SQRT2);

// Inverse of normalTail: the t with P(Z > t) = p. Newton refinement on top of
// the Acklam-style rational start, so the seeded sampler can be pure inverse
// transform and consume exactly one uniform per magnitude.
export function normalTailInv(p) {
  if (p <= 0) return Infinity;
  if (p >= 1) return -Infinity;
  // Rational approximation for the normal quantile (Wichura-style tails).
  const q = p < 0.5 ? p : 1 - p;
  const r = Math.sqrt(-2 * Math.log(q));
  let t =
    r -
    (2.30753 + 0.27061 * r) / (1 + (0.99229 + 0.04481 * r) * r);
  // Two Newton steps against the accurate tail: plenty for double precision.
  for (let i = 0; i < 3; i++) {
    const err = normalTail(t) - q;
    const pdf = Math.exp(-0.5 * t * t) / Math.sqrt(2 * Math.PI);
    if (pdf < 1e-300) break;
    t += err / pdf;
  }
  return p < 0.5 ? t : -t;
}
