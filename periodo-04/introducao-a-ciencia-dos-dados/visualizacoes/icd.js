// Ciência dos dados sem bibliotecas: estatísticas, bootstrap, teste de
// permutação, regressão linear (e o paradoxo de Simpson) e k vizinhos mais próximos.

import { rng, normal } from '../../../engine/random.js';

export const sum = xs => xs.reduce((a, b) => a + b, 0);
export const mean = xs => sum(xs) / xs.length;
export function quantile(xs, q) {
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export const median = xs => quantile(xs, 0.5);
export const variance = xs => { const m = mean(xs); return sum(xs.map(x => (x - m) ** 2)) / (xs.length - 1); };
export const std = xs => Math.sqrt(variance(xs));

// ---------- Bootstrap ----------

/** Reamostra com reposição: devolve os índices sorteados. */
export function resampleIdx(n, r) {
  return Array.from({ length: n }, () => Math.floor(r() * n));
}

/** B reamostras de `sample`; devolve a estatística de cada uma. */
export function bootstrap(sample, B, stat = mean, seed = 1) {
  const r = rng(seed);
  return Array.from({ length: B }, () => stat(resampleIdx(sample.length, r).map(i => sample[i])));
}

/** Intervalo de confiança pelo método dos percentis. */
export function percentileCI(stats, level = 0.95) {
  const a = (1 - level) / 2;
  return [quantile(stats, a), quantile(stats, 1 - a)];
}

// ---------- Teste de permutação (teste A/B) ----------

/**
 * H0: os rótulos A/B não importam. Embaralha os rótulos B vezes e mede a diferença
 * das médias. O valor-p é a fração de diferenças pelo menos tão extremas quanto a observada.
 */
export function permutationTest(a, b, B = 2000, seed = 1, { twoSided = true } = {}) {
  const r = rng(seed);
  const all = [...a, ...b];
  const obs = mean(b) - mean(a);
  const diffs = [];
  for (let t = 0; t < B; t++) {
    const p = [...all];
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    diffs.push(mean(p.slice(a.length)) - mean(p.slice(0, a.length)));
  }
  const extreme = diffs.filter(d => (twoSided ? Math.abs(d) >= Math.abs(obs) - 1e-12 : d >= obs - 1e-12)).length;
  return { obs, diffs, p: extreme / B };
}

// ---------- Regressão linear e correlação ----------

export function linreg(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  const slope = sxy / sxx, intercept = my - slope * mx;
  const r = sxy / Math.sqrt(sxx * syy);
  return { slope, intercept, r, r2: r * r };
}

/** Descida do gradiente para a mesma reta, minimizando o erro quadrático médio. */
export function gradientFit(xs, ys, { lr = 0.01, iters = 2000 } = {}) {
  let a = 0, b = 0;
  const n = xs.length, hist = [];
  for (let t = 0; t < iters; t++) {
    let ga = 0, gb = 0;
    for (let i = 0; i < n; i++) { const e = a * xs[i] + b - ys[i]; ga += (2 / n) * e * xs[i]; gb += (2 / n) * e; }
    a -= lr * ga; b -= lr * gb;
    if (t % 50 === 0) hist.push({ a, b, mse: mean(xs.map((x, i) => (a * x + b - ys[i]) ** 2)) });
  }
  return { slope: a, intercept: b, hist };
}

// O quarteto de Anscombe (1973): quatro conjuntos com médias, variâncias, correlação e reta praticamente iguais.
export const ANSCOMBE = [
  { x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5], y: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68] },
  { x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5], y: [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74] },
  { x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5], y: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73] },
  { x: [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8], y: [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.50, 5.56, 7.91, 6.89] },
];

/**
 * Paradoxo de Simpson: em cada faixa etária, mais horas de exercício → colesterol
 * menor; misturando as faixas, a tendência se inverte (os mais velhos se exercitam
 * mais e têm colesterol mais alto).
 */
export function simpsonData(seed = 3) {
  const r = rng(seed);
  const groups = [];
  const names = ['20–29 anos', '30–39 anos', '40–49 anos', '50–59 anos', '60+ anos'];
  names.forEach((nome, g) => {
    const pts = [];
    for (let i = 0; i < 22; i++) {
      const x = 1 + 1.6 * g + r() * 3;                 // horas de exercício por semana
      const y = 150 + 22 * g - 6 * (x - 1.6 * g) + normal(r, 0, 5);  // colesterol
      pts.push({ x, y, g });
    }
    groups.push({ nome, pts });
  });
  return groups;
}

// ---------- k vizinhos mais próximos ----------

/** Duas classes em "meias-luas" entrelaçadas, com ruído. */
export function moons(n, noise = 0.25, seed = 1) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const c = i % 2, t = Math.PI * r();
    const x = c === 0 ? Math.cos(t) : 1 - Math.cos(t);
    const y = c === 0 ? Math.sin(t) : 0.5 - Math.sin(t);
    pts.push({ x: x + normal(r, 0, noise), y: y + normal(r, 0, noise), c });
  }
  return pts;
}

export function knnClassify(train, p, k) {
  const d = train.map(q => ({ q, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 })).sort((a, b) => a.d - b.d).slice(0, k);
  const votes = d.reduce((v, { q }) => { v[q.c] = (v[q.c] ?? 0) + 1; return v; }, {});
  // empate: a classe do vizinho mais próximo
  const best = Math.max(...Object.values(votes));
  const tied = Object.keys(votes).filter(c => votes[c] === best).map(Number);
  return { c: tied.length === 1 ? tied[0] : d.find(({ q }) => tied.includes(q.c)).q.c, neighbors: d.map(x => x.q) };
}

export const accuracy = (train, test, k) => mean(test.map(p => (knnClassify(train, p, k).c === p.c ? 1 : 0)));

/** Divide em treino e teste (embaralhando com semente). */
export function split(pts, frac = 0.7, seed = 7) {
  const r = rng(seed);
  const p = [...pts];
  for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const cut = Math.round(p.length * frac);
  return { train: p.slice(0, cut), test: p.slice(cut) };
}

// ---------- Dados de exemplo ----------

/** Tempos de carregamento de página (s): assimétricos, como dados reais costumam ser. */
export function loadTimes(n = 40, seed = 11) {
  const r = rng(seed);
  return Array.from({ length: n }, () => +(0.8 + -Math.log(1 - r()) * 1.2).toFixed(2));
}

/** Teste A/B: tempo na página (min) com o layout antigo (A) e o novo (B). */
export function abData(effect = 0.6, n = 30, seed = 5) {
  const r = rng(seed);
  const gen = mu => Array.from({ length: n }, () => +Math.max(0.2, normal(r, mu, 1.4)).toFixed(2));
  return { a: gen(4), b: gen(4 + effect) };
}
