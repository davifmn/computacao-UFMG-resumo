import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TAYLOR, taylorCoeffs, taylorEval, SURFACES, LANDSCAPES, numGrad, gradientDescent, contours } from '../periodo-03/calculo-diferencial-e-integral-2/visualizacoes/multivar.js';

test('polinômios de Taylor convergem dentro do raio', () => {
  for (const k of Object.keys(TAYLOR)) {
    const a = 0, x = 0.3;
    assert.ok(Math.abs(TAYLOR[k].f(x) - taylorEval(taylorCoeffs(k, a, 14), a, x)) < 1e-6, k);
  }
  assert.deepEqual(taylorCoeffs('exp', 0, 3).map(v => +v.toFixed(6)), [1, 1, 0.5, 0.166667]);
  // fora do raio a série diverge: 1/(1−x) em x = 2
  const c = taylorCoeffs('geom', 0, 20);
  assert.ok(Math.abs(taylorEval(c, 0, 2)) > 1e5);
});

test('gradientes analíticos batem com os numéricos', () => {
  for (const S of [...Object.values(SURFACES), ...Object.values(LANDSCAPES)]) {
    for (const [x, y] of [[0.3, 0.7], [-1.1, 0.4]]) {
      const g = S.grad(x, y), n = numGrad(S.f, x, y);
      assert.ok(Math.hypot(g[0] - n[0], g[1] - n[1]) < 1e-3, S.nome);
    }
  }
});

test('descida do gradiente: converge, diverge e momento', () => {
  const T = LANDSCAPES.tigela;
  const ok = gradientDescent(T, [2, 1], 0.1);
  assert.ok(Math.hypot(...ok.at(-1)) < 1e-4);
  const bad = gradientDescent(T, [2, 1], 1.1, 60);
  assert.ok(Math.hypot(...bad.at(-1)) > 100, 'η > 1 diverge na tigela');
  const mom = gradientDescent(LANDSCAPES.vale, [-2.6, 1.2], 0.02, 1000, 0.9);
  assert.ok(Math.hypot(...mom.at(-1)) < 1e-3);
});

test('curvas de nível de x² + y² são círculos', () => {
  const [segs] = contours((x, y) => x * x + y * y, [-2, 2, -2, 2], [1], 60);
  assert.ok(segs.length > 20);
  for (const [[x, y]] of segs) assert.ok(Math.abs(Math.hypot(x, y) - 1) < 0.02);
});
