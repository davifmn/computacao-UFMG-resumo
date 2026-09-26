import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  euclidSteps, egcd, gcd, modInverse, modPow, rsaKeys, relationFrom, properties, equivalenceClasses,
  warshallSteps, enumerate, countFormula, binom, hanoiSteps, hanoiMoves,
} from '../periodo-02/matematica-discreta/visualizacoes/discreta.js';

test('Euclides estendido: Bézout e ladrilhamento', () => {
  for (const [a, b] of [[240, 46], [21, 13], [1071, 462], [17, 3120], [7, 7]]) {
    const [x, y] = a >= b ? [a, b] : [b, a];
    const last = euclidSteps(x, y).at(-1);
    assert.equal(last.gcd, gcd(x, y));
    assert.equal(x * last.s + y * last.t, last.gcd);
    const area = last.squares.reduce((s, q) => s + q.side ** 2, 0);
    assert.equal(area, x * y, 'os quadrados cobrem o retângulo');
  }
});

test('inverso modular e potência', () => {
  assert.equal(modInverse(3, 11), 4);
  assert.equal(modInverse(4, 8), null);
  for (let n = 2; n < 30; n++) for (let a = 1; a < n; a++) {
    const inv = modInverse(a, n);
    if (gcd(a, n) === 1) assert.equal((a * inv) % n, 1); else assert.equal(inv, null);
  }
  assert.equal(modPow(4, 13, 497).value, 445);
  assert.equal(egcd(240, 46).g, 2);
});

test('RSA cifra e decifra', () => {
  const k = rsaKeys(61, 53, 17);
  assert.deepEqual([k.n, k.phi, k.d], [3233, 3120, 2753]);
  for (const m of [0, 1, 65, 255, 3232]) assert.equal(modPow(modPow(m, k.e, k.n).value, k.d, k.n).value, m);
  assert.throws(() => rsaKeys(4, 7));
});

test('propriedades de relações', () => {
  const div = properties(relationFrom(6, (a, b) => b % a === 0));
  assert.ok(div.ordemParcial && !div.equivalencia);
  const mod3 = relationFrom(6, (a, b) => (a - b) % 3 === 0);
  assert.ok(properties(mod3).equivalencia);
  assert.deepEqual(equivalenceClasses(mod3), [[1, 4], [2, 5], [3, 6]]);
  const empty = properties(relationFrom(3, () => false));
  assert.ok(empty.simetrica && empty.antissimetrica && empty.transitiva && !empty.reflexiva);
});

test('Warshall produz a menor relação transitiva que contém R', () => {
  const succ = relationFrom(5, (a, b) => b === a + 1);
  const closed = warshallSteps(succ).at(-1).M;
  assert.deepEqual(closed, relationFrom(5, (a, b) => b > a));
  assert.ok(properties(closed).transitiva);
});

test('as quatro formas de contar batem com a enumeração', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  for (const order of [true, false]) for (const repeat of [true, false]) for (let k = 0; k <= 3; k++) {
    assert.equal(enumerate(items, k, { order, repeat }).length, countFormula(5, k, { order, repeat }).value);
  }
  assert.equal(binom(10, 3), 120);
  for (let n = 0; n < 12; n++) assert.equal([...Array(n + 1).keys()].reduce((s, k) => s + binom(n, k), 0), 2 ** n);
});

test('Hanói: 2^n − 1 movimentos, sempre legais', () => {
  for (let n = 1; n <= 7; n++) {
    const steps = hanoiSteps(n);
    assert.equal(steps.at(-1).moves, 2 ** n - 1);
    assert.deepEqual(steps.at(-1).pegs[2], [...Array(n).keys()].map(i => n - i));
    for (const s of steps) for (const peg of s.pegs) for (let i = 1; i < peg.length; i++) assert.ok(peg[i] < peg[i - 1]);
  }
  assert.equal(hanoiMoves(12).length, 4095);
});
