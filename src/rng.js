// Seedable RNG. Everything in the engine draws from an injected `rng` object so
// the daily seed and the Monte Carlo harness are reproducible.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// An RNG handle: .random() plus the derived distributions the engine needs.
export function makeRng(source) {
  const random = source || Math.random;
  let spare = null;
  const api = {
    random,
    // Box-Muller, cached spare.
    gauss(mean = 0, sd = 1) {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return mean + sd * v;
      }
      let u = 0;
      let v = 0;
      let s = 0;
      do {
        u = random() * 2 - 1;
        v = random() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const mul = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * mul;
      return mean + sd * u * mul;
    },
    int(n) {
      return Math.floor(random() * n);
    },
    pick(arr) {
      return arr[Math.floor(random() * arr.length)];
    },
    chance(p) {
      return random() < p;
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
  return api;
}

export function seededRng(seedText) {
  return makeRng(mulberry32(hashString(String(seedText))));
}

export const defaultRng = makeRng(Math.random);
