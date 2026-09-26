// Gerador de números aleatórios com semente (reprodutível) e amostradores.
// Math.random() não aceita semente; para simulações e testes precisamos repetir resultados.

/** mulberry32: gerador simples, rápido e com boa qualidade para simulações didáticas. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normal padrão pelo método de Box–Muller. */
export function normal(r, mu = 0, sigma = 1) {
  let u = 0;
  while (u === 0) u = r();
  const v = r();
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const exponential = (r, lambda = 1) => -Math.log(1 - r()) / lambda;
export const uniformInt = (r, a, b) => a + Math.floor(r() * (b - a + 1));
export const bernoulli = (r, p) => (r() < p ? 1 : 0);

/** Contagem em `bins` intervalos iguais de [lo, hi). */
export function histogram(values, lo, hi, bins) {
  const counts = Array(bins).fill(0);
  const w = (hi - lo) / bins;
  for (const v of values) {
    const k = Math.floor((v - lo) / w);
    if (k >= 0 && k < bins) counts[k]++;
  }
  return { counts, width: w, lo, hi };
}

export const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
export const variance = xs => { const m = mean(xs); return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1); };
