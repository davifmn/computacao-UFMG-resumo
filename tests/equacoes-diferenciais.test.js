import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../periodo-05/equacoes-diferenciais-c/visualizacoes/edo.js';

test('as soluções exatas satisfazem as equações', () => {
  for (const [nome, eq] of Object.entries(E.EQUATIONS)) {
    if (!eq.exact) continue;
    const t0 = 0, y0 = nome === 'explosao' ? 0.3 : 0.5;
    assert.ok(Math.abs(eq.exact(t0, t0, y0) - y0) < 1e-12, `${nome}: condição inicial`);
    for (let t = 0.1; t < 2; t += 0.1) {
      const h = 1e-5, y = eq.exact(t, t0, y0);
      const d = (eq.exact(t + h, t0, y0) - eq.exact(t - h, t0, y0)) / (2 * h);
      assert.ok(Math.abs(d - eq.f(t, y)) < 1e-6, `${nome} em t = ${t}`);
    }
  }
  assert.equal(E.EQUATIONS.explosao.blowup(0, 0.5), 2);
});

test('ordens de convergência: Euler 1, Heun 2, RK4 4', () => {
  const eq = E.EQUATIONS.linear;
  for (const [m, p] of [['euler', 1], ['heun', 2], ['rk4', 4]]) {
    const c = E.convergence(eq, 0, 2, 2, 0.1, m);
    const obs = Math.log2(c[1].err / c[2].err);
    assert.ok(Math.abs(obs - p) < 0.2, `${m}: ordem observada ${obs}`);
  }
  // Euler com h = 0,5 em y' = y: 2,25 em t = 1
  assert.equal(E.solve((t, y) => y, 0, 1, 0.5, 1, 'euler').at(-1)[1], 2.25);
  // integração para trás também funciona
  const back = E.solve(E.EQUATIONS.linear.f, 2, E.EQUATIONS.linear.exact(2, 0, 2), -0.01, 0, 'rk4').at(-1);
  assert.ok(Math.abs(back[1] - 2) < 1e-8);
});

test('oscilador: RK4 = fórmula fechada nos três regimes', () => {
  for (const [m, c, k, tipo] of [[1, 0.5, 4, 'subamortecido'], [1, 4, 4, 'critico'], [1, 5, 4, 'superamortecido'], [2, 0, 8, 'nao-amortecido']]) {
    assert.equal(E.characteristic(m, c, k).tipo, tipo);
    const y = E.homogeneous(m, c, k, 1, 0.5);
    const err = Math.max(...E.oscillator({ m, c, k, y0: 1, v0: 0.5 }, 10, 2000).map(([t, yy]) => Math.abs(yy - y(t))));
    assert.ok(err < 1e-8, `${tipo}: ${err}`);
  }
  const s = E.oscillator({ m: 1, c: 0.5, k: 4, F0: 1, w: 1.5, y0: 0, v0: 0 }, 80, 8000);
  const amp = Math.max(...s.filter(p => p[0] > 60).map(p => Math.abs(p[1])));
  assert.ok(Math.abs(amp - E.amplitude(1, 0.5, 4, 1, 1.5)) < 1e-3);
  // ressonância sem atrito: y = (t/4) sen 2t
  const r = E.oscillator({ m: 1, c: 0, k: 4, F0: 1, w: 2, y0: 0, v0: 0 }, 20, 4000);
  assert.ok(Math.max(...r.map(([t, y]) => Math.abs(y - (t / 4) * Math.sin(2 * t)))) < 1e-7);
  // pico de ressonância: máximo numérico de A(ω)
  let best = 0, wb = 0;
  for (let w = 0; w < 4; w += 1e-4) { const a = E.amplitude(1, 0.5, 4, 1, w); if (a > best) { best = a; wb = w; } }
  assert.ok(Math.abs(wb - E.resonance(1, 0.5, 4)) < 1e-3);
});

test('sistemas 2×2: autovalores e classificação', () => {
  const want = { sela: 'sela', no: 'no-estavel', espiral: 'espiral-estavel', centro: 'centro', espiralInst: 'espiral-instavel', degenerado: 'no-degenerado', oscilador: 'espiral-estavel' };
  for (const [k, S] of Object.entries(E.SYSTEMS)) assert.equal(E.classify(S.A).tipo, want[k], k);
  assert.equal(E.classify([[2, 0], [0, 2]]).tipo, 'estrela');
  assert.equal(E.classify([[1, -2], [3, -4]]).tipo, 'no-estavel');
  const ev = E.eigen([[1, 1], [4, 1]]);
  assert.deepEqual(ev.values, [3, -1]);
  for (const [k, l] of ev.values.entries()) {
    const v = ev.vectors[k];
    assert.ok(Math.abs(1 * v[0] + 1 * v[1] - l * v[0]) < 1e-12 && Math.abs(4 * v[0] + 1 * v[1] - l * v[1]) < 1e-12, 'Av = λv');
  }
});
