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

// ---------- Treino para as provas ----------
import * as T from '../periodo-05/equacoes-diferenciais-c/visualizacoes/treino.js';
import { rng } from '../engine/random.js';

const H = x => (x >= 0 ? 1 : 0);
const d1 = (f, x, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);
const d2 = (f, x, h = 1e-3) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
const near = (a, b, tol) => Math.abs(a - b) <= tol * (1 + Math.abs(a) + Math.abs(b));
// ∫_0^∞ e^{-st} f(t) dt por Simpson até t = 40 (o integrando já é desprezível)
function laplaceNum(f, s, Tmax = 40, n = 80000) {
  const h = Tmax / n;
  let acc = f(0) + Math.exp(-s * Tmax) * f(Tmax);
  for (let i = 1; i < n; i++) acc += (i % 2 ? 4 : 2) * Math.exp(-s * i * h) * f(i * h);
  return (acc * h) / 3;
}
const pts = ([a, b], n = 7) => Array.from({ length: n }, (_, i) => a + ((b - a) * (i + 0.5)) / n);

test('parser: multiplicação implícita, funções, degrau e expoentes colados', () => {
  const same = (src, f, vars = ['t'], dom = [0.2, 2.7]) => {
    const ast = T.parse(src, vars);
    for (const t of pts(dom)) assert.ok(near(T.evaluate(ast, { [vars[0]]: t, y: 0.7 }), f(t), 1e-12), `${src} em ${t}`);
  };
  same('2e^(3t) - sen(2t)/4', t => 2 * Math.exp(3 * t) - Math.sin(2 * t) / 4);
  same('e^-2t + e^2t', t => Math.exp(-2 * t) + Math.exp(2 * t));
  same('t sin t', t => t * Math.sin(t));
  same('sen 2t cos t', t => Math.sin(2 * t) * Math.cos(t));
  same('sen^2(3t)', t => Math.sin(3 * t) ** 2);
  same('-1/6 sen(2t)', t => -Math.sin(2 * t) / 6);
  same('u_2(t)*(t-2)', t => H(t - 2) * (t - 2));
  same('u(t-pi)sen(t)', t => H(t - Math.PI) * Math.sin(t));
  same('0,5 t^2 e^(-t)', t => 0.5 * t * t * Math.exp(-t));
  same('(1+t)(1-t)', t => 1 - t * t);
  same('cossec(t) + cos(t)', t => 1 / Math.sin(t) + Math.cos(t));
  same('xe^x ln x', x => x * Math.exp(x) * Math.log(x), ['x']);
  same('3/(s^2+9)', s => 3 / (s * s + 9), ['s']);
  same('e^(-2s)/s', s => Math.exp(-2 * s) / s, ['s']);
  // em ψ(x, y), "x^2y" é x²·y, não x^(2y)
  const psi = T.parse('x^2y + xy^2 = C', ['x', 'y']);
  assert.ok(near(T.evaluate(psi, { x: 1.5, y: 0.7 }), 1.5 ** 2 * 0.7 + 1.5 * 0.49, 1e-12));
  assert.throws(() => T.parse('2a + t'), /não é uma variável/);
  assert.throws(() => T.parse('sen(2t'), /parêntese/);
  assert.throws(() => T.parse(''), /vazia/);
});

test('correção: aceita formas equivalentes e recusa erradas', () => {
  const ans = { kind: 'expr', vars: ['t'], f: e => Math.sin(e.t) ** 2, domain: { t: [0, 3] } };
  assert.ok(T.check(ans, '(1 - cos(2t))/2').ok);
  assert.ok(!T.check(ans, '(1 + cos(2t))/2').ok);
  assert.ok(T.check(ans, 'sen(t').error);
  // solução particular: qualquer uma serve (difere por homogênea)
  const ode = { kind: 'ode', vars: ['x'], a: [1, 0, 1], g: x => x, v: 'x', domain: { x: [-1, 1.5] } };
  assert.ok(T.check(ode, 'x').ok && T.check(ode, 'x + 3cos x').ok && !T.check(ode, 'x^2').ok);
  // ψ a menos de constante (e de múltiplo)
  const pot = { kind: 'potential', vars: ['x', 'y'], f: e => e.x * e.x * e.y + e.x * e.y * e.y, domain: { x: [0.2, 1.6], y: [-1, 1] } };
  assert.ok(T.check(pot, 'x^2 y + x y^2 + 7').ok && T.check(pot, '2x^2y + 2xy^2 = C').ok && !T.check(pot, 'x^2y').ok);
  assert.ok(T.check({ kind: 'number', value: Math.E ** 2 / 4 }, 'e^2/4').ok);
  assert.ok(T.check({ kind: 'choice', correct: 1, accept: [2] }, 2).ok);
});

test('cada questão gerada tem a resposta certa para o próprio enunciado', () => {
  const r = rng(2026);
  const counts = {};
  for (const sk of T.SKILLS) {
    for (let i = 0; i < 120; i++) {
      const q = T.generate(sk.id, r);
      assert.equal(q.skill, sk.id);
      assert.ok(q.steps.length >= 2, `${sk.id}: passos`);
      if (q.ans.kind === 'choice') {
        assert.ok(q.ans.correct >= 0 && q.ans.correct < q.ans.options.length, `${sk.id}: alternativa correta existe`);
        assert.equal(new Set(q.ans.options).size, q.ans.options.length, `${sk.id}: alternativas repetidas em ${q.q}`);
      }
      const s = q.spec;
      if (!s) continue;
      counts[s.type] = (counts[s.type] ?? 0) + 1;
      const dom = q.ans.domain && Object.values(q.ans.domain)[0];
      if (s.type === 'ode1') {
        assert.ok(near(s.sol(s.x0), s.y0, 1e-9), `${sk.id}: condição inicial em ${q.eq}`);
        for (const x of pts(dom)) assert.ok(near(d1(s.sol, x), s.f(x, s.sol(x)), 1e-6), `${sk.id}: ${q.eq} em x = ${x}`);
      } else if (s.type === 'ode2') {
        const [a2, a1, a0] = s.a, y = s.sol;
        const fk = s.forcing;
        const g = fk ? (fk.kind === 'degrau' ? t => fk.A * H(t - fk.k) : () => 0) : s.g;
        assert.ok(near(y(0), s.ic[0], 1e-9), `${sk.id}: y(0) em ${q.eq}`);
        assert.ok(near(d1(y, fk ? 0.5 : 0), fk ? 0 : s.ic[1], 1e-6), `${sk.id}: y'(0) em ${q.eq}`);
        for (const t of pts(dom, 9)) {
          if (fk && Math.abs(t - fk.k) < 0.05) continue;
          const terms = [a2 * d2(y, t), a1 * d1(y, t), a0 * y(t)];
          const scale = 1 + terms.reduce((acc, x) => acc + Math.abs(x), 0);
          assert.ok(Math.abs(terms[0] + terms[1] + terms[2] - g(t)) < 1e-5 * scale, `${sk.id}: ${q.eq} em t = ${t}`);
        }
        if (fk?.kind === 'delta') {
          // impulso: y contínua e y' salta A/a2 em t = k
          const h = 1e-6, k = fk.k;
          assert.ok(Math.abs(y(k + h) - y(k - h)) < 1e-4);
          const jump = (y(k + 2 * h) - y(k + h)) / h - (y(k - h) - y(k - 2 * h)) / h;
          assert.ok(near(jump, fk.A / a2, 1e-3), `${sk.id}: salto de y' em ${q.eq}`);
        }
      } else if (s.type === 'particular') {
        const [a2, a1, a0] = s.a;
        for (const x of pts(s.domain ?? dom)) {
          const terms = [a2 * d2(s.yp, x), a1 * d1(s.yp, x), a0 * s.yp(x)];
          const scale = 1 + terms.reduce((acc, v) => acc + Math.abs(v), 0);
          assert.ok(Math.abs(terms[0] + terms[1] + terms[2] - s.g(x)) < 1e-5 * scale, `${sk.id}: ${q.eq} em x = ${x}`);
        }
      } else if (s.type === 'exact') {
        for (const x of [0.3, 0.9, 1.4]) for (const yy of [-0.8, 0.4, 1.1]) {
          assert.ok(near(d1(u => s.psi(u, yy), x), s.M(x, yy), 1e-6), `${sk.id}: ψ_x = M em ${q.eq}`);
          assert.ok(near(d1(u => s.psi(x, u), yy), s.N(x, yy), 1e-6), `${sk.id}: ψ_y = N em ${q.eq}`);
        }
      } else if (s.type === 'wronskian') {
        for (const x of pts(dom)) assert.ok(near(s.f1(x) * d1(s.f2, x) - d1(s.f1, x) * s.f2(x), s.W(x), 1e-6), `${sk.id}: W de ${q.eq}`);
      } else if (s.type === 'laplace' && i % 4 === 0) {
        if (s.pieces.some(p => !p.f)) continue; // δ não tem f(t) pontual
        const sv = s.a + 2;
        assert.ok(near(laplaceNum(t => s.pieces[0].f(t) + s.pieces[1].f(t), sv), s.F(sv), 1e-4), `${sk.id}: L{${q.eq}}`);
      } else if (s.type === 'inverse' && i % 4 === 0) {
        const sv = s.a + 2;
        assert.ok(near(laplaceNum(s.f, sv), s.F(sv), 1e-4), `${sk.id}: ${q.eq}`);
      } else if (s.type === 'conv' && i % 4 === 0) {
        for (const t of [0.7, 1.9]) {
          const n = 2000, h = t / n;
          let acc = 0;
          for (let j = 0; j <= n; j++) acc += (j === 0 || j === n ? 1 : j % 2 ? 4 : 2) * s.g1(j * h) * s.g2(t - j * h);
          assert.ok(near((acc * h) / 3, s.f(t), 1e-7), `${sk.id}: convolução de ${q.eq}`);
        }
        assert.ok(near(laplaceNum(s.f, 4.5), s.F(4.5), 1e-4), `${sk.id}: L{f} de ${q.eq}`);
      }
    }
  }
  for (const k of ['ode1', 'ode2', 'particular', 'exact', 'wronskian', 'laplace', 'inverse', 'conv']) assert.ok(counts[k] > 20, `poucos testes do tipo ${k}`);
});

test('a própria resposta (como função) passa na correção', () => {
  const r = rng(7);
  for (const sk of T.SKILLS) {
    for (let i = 0; i < 40; i++) {
      const q = T.generate(sk.id, r);
      if (q.ans.kind === 'expr') assert.ok(T.sameFunction(q.ans.f, q.ans.f, q.ans.domain, { avoid: q.ans.avoid }), `${sk.id}: ${q.eq}`);
      if (q.ans.kind === 'ode') assert.ok(T.satisfiesOde(e => q.spec.yp(e[q.ans.v]), q.ans), `${sk.id}: ${q.eq}`);
    }
  }
});

test('domínio: níveis no estilo Khan, simulado e revisão espaçada', () => {
  assert.equal(T.levelAfterPractice(0, 5), 3);          // 100% → Proficiente
  assert.equal(T.levelAfterPractice(0, 4), 2);          // 80% → Familiar
  assert.equal(T.levelAfterPractice(3, 3), 1);          // 60% → Tentado (cai)
  assert.equal(T.levelAfterPractice(4, 5), 4);          // Dominado se mantém com 100%
  assert.equal(T.levelAfterTest(3, true), 4);           // acertar no simulado sendo Proficiente → Dominado
  assert.equal(T.levelAfterTest(2, true), 3);
  assert.equal(T.levelAfterTest(4, false), 3);
  assert.equal(T.levelAfterTest(0, false), 1);
  assert.equal(T.levelAfterTest(0, true), 2);           // acerto no teste: Tentado/Não iniciado → Familiar
  const now = Date.UTC(2026, 9, 20);
  const day = 864e5;
  const state = { skills: { a: { level: 1, last: now - day }, b: { level: 4, last: now - 3 * day }, c: { level: 0 } } };
  assert.deepEqual(T.dueSkills(state, now), ['a']);
  assert.deepEqual(T.dueSkills(state, now + 6 * day), ['a', 'b']);
  // intercalado: nunca a mesma habilidade duas vezes seguidas
  const seq = T.interleave(['x', 'y', 'z'], 30, rng(3));
  for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1]);
  assert.equal(new Set(T.SKILLS.map(s => s.id)).size, T.SKILLS.length);
});
