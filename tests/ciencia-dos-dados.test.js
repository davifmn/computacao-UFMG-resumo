import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as I from '../periodo-04/introducao-a-ciencia-dos-dados/visualizacoes/icd.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} ≈ ${b}`);

test('estatísticas descritivas', () => {
  assert.equal(I.mean([1, 2, 3, 4]), 2.5);
  assert.equal(I.median([5, 1, 3]), 3);
  assert.equal(I.median([4, 1, 3, 2]), 2.5);
  assert.equal(I.quantile([1, 2, 3, 4, 5], 0.25), 2);
  close(I.variance([2, 4, 4, 4, 5, 5, 7, 9]), 32 / 7, 1e-12);
});

test('bootstrap: erro padrão da média ≈ s/√n', () => {
  const s = I.loadTimes(40);
  const b = I.bootstrap(s, 3000, I.mean, 4);
  const se = I.std(s) / Math.sqrt(s.length);
  close(I.std(b), se, 0.1 * se, 'erro padrão');
  const [lo, hi] = I.percentileCI(b);
  assert.ok(lo < I.mean(s) && I.mean(s) < hi);
  assert.equal(I.bootstrap(s, 10, I.mean, 1).join(), I.bootstrap(s, 10, I.mean, 1).join(), 'reprodutível com a semente');
});

test('teste de permutação', () => {
  const same = I.permutationTest([1, 2, 3, 4], [1, 2, 3, 4], 500);
  assert.equal(same.obs, 0);
  assert.equal(same.p, 1);
  const far = I.permutationTest([1, 2, 3, 4, 5, 6], [11, 12, 13, 14, 15, 16], 2000);
  assert.ok(far.p < 0.01);
  // sob H0, cerca de 5% de rejeições
  let rej = 0;
  for (let s = 1; s <= 200; s++) { const d = I.abData(0, 20, s); if (I.permutationTest(d.a, d.b, 300, s).p < 0.05) rej++; }
  assert.ok(rej / 200 < 0.11, `taxa de erro tipo I ${rej / 200}`);
});

test('regressão: Anscombe e descida do gradiente', () => {
  for (const q of I.ANSCOMBE) {
    const l = I.linreg(q.x, q.y);
    close(l.slope, 0.5, 0.01); close(l.intercept, 3, 0.01); close(l.r, 0.816, 0.003);
  }
  const g = I.gradientFit(I.ANSCOMBE[0].x, I.ANSCOMBE[0].y, { lr: 0.01, iters: 20000 });
  close(g.slope, 0.5, 0.005); close(g.intercept, 3, 0.05);
});

test('paradoxo de Simpson: a tendência se inverte', () => {
  const groups = I.simpsonData();
  const all = groups.flatMap(g => g.pts);
  assert.ok(I.linreg(all.map(p => p.x), all.map(p => p.y)).slope > 0, 'juntos: sobe');
  for (const g of groups) assert.ok(I.linreg(g.pts.map(p => p.x), g.pts.map(p => p.y)).slope < 0, `${g.nome}: desce`);
});

test('k-NN: k = 1 decora o treino, k intermediário generaliza melhor', () => {
  const { train, test } = I.split(I.moons(300, 0.3, 1), 0.7, 7);
  assert.equal(train.length, 210);
  assert.equal(I.accuracy(train, train, 1), 1);
  const te = k => I.accuracy(train, test, k);
  assert.ok(te(9) > te(1) + 0.05, 'sobreajuste com k = 1');
  assert.ok(te(9) > te(139), 'subajuste com k enorme');
  assert.equal(I.knnClassify(train, { x: -1, y: 0.2 }, 5).c, 0);
  assert.equal(I.knnClassify(train, { x: 2, y: 0.2 }, 5).c, 1);
});
