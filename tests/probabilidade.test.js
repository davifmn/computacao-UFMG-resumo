import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, mean, variance, histogram } from '../engine/random.js';
import { DISTS, defaults, prob, bayesTest, montyHall, BASES, sampleMeans, erf } from '../periodo-03/probabilidade/visualizacoes/prob.js';

const close = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);

test('gerador com semente é reprodutível', () => {
  const a = rng(5), b = rng(5);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
  assert.equal(histogram([0.1, 0.5, 0.9, 1.5], 0, 1, 2).counts.join(), '1,2');
});

test('cada distribuição soma 1 e bate com a simulação', () => {
  const r = rng(1);
  for (const d of Object.keys(DISTS)) {
    const D = DISTS[d], p = defaults(d), [lo, hi] = D.suporte(p);
    close(D.discreta ? prob(d, p, lo, hi + 300) : prob(d, p, lo - 60, hi + 60), 1, 1e-6);
    const xs = Array.from({ length: 20000 }, () => D.amostra(r, p));
    close(mean(xs), D.media(p), 0.05 * Math.max(1, Math.abs(D.media(p))));
    close(variance(xs), D.variancia(p), 0.08 * D.variancia(p));
  }
});

test('normal: regra 68-95-99,7 e erf', () => {
  const p = { mu: 0, sigma: 1 };
  close(prob('normal', p, -1, 1), 0.6827, 1e-3);
  close(prob('normal', p, -2, 2), 0.9545, 1e-3);
  close(erf(0.5), 0.5205, 1e-4);
});

test('Bayes e Monty Hall', () => {
  close(bayesTest({ prevalencia: 0.01, sensibilidade: 0.99, especificidade: 0.95 }).posterior, 1 / 6, 1e-9);
  const m = montyHall(rng(3), 20000);
  close(m.fica, 1 / 3, 0.02);
  close(m.troca, 2 / 3, 0.02);
});

test('TCL: desvio das médias ≈ σ/√n', () => {
  const r = rng(11);
  for (const b of Object.keys(BASES)) {
    const ms = sampleMeans(r, b, 16, 3000);
    close(Math.sqrt(variance(ms)), BASES[b].sd / 4, 0.12 * BASES[b].sd / 4);
  }
});
