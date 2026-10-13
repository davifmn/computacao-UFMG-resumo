import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../periodo-04/algebra-a/visualizacoes/algebra.js';

const groups = () => [A.cyclicGroup(12), A.unitGroup(15), A.unitGroup(8), A.dihedralGroup(4), A.dihedralGroup(6), A.symmetricGroup(3), A.symmetricGroup(4)];

test('axiomas: a tabela de Cayley é um quadrado latino com neutro e associativa', () => {
  for (const G of groups()) {
    for (let i = 0; i < G.n; i++) {
      assert.equal(new Set(G.table[i]).size, G.n, `${G.nome}: linha ${i}`);
      assert.equal(new Set(G.table.map(r => r[i])).size, G.n, `${G.nome}: coluna ${i}`);
      assert.equal(G.mul(G.e, i), i);
      assert.equal(G.mul(i, A.inverseOf(G, i)), G.e);
    }
    for (let a = 0; a < G.n; a++) for (let b = 0; b < G.n; b++) for (let c = 0; c < G.n; c++)
      assert.equal(G.mul(G.mul(a, b), c), G.mul(a, G.mul(b, c)));
  }
});

test('Lagrange, ordens e classes laterais', () => {
  for (const G of groups()) {
    for (const H of A.subgroups(G)) {
      assert.equal(G.n % H.length, 0, `${G.nome}: subgrupo de ordem ${H.length}`);
      const cos = A.leftCosets(G, H);
      assert.equal(cos.length * H.length, G.n);
      assert.equal(new Set(cos.flatMap(c => c.elements)).size, G.n, 'as classes particionam G');
    }
    for (let g = 0; g < G.n; g++) {
      assert.equal(G.n % A.order(G, g), 0);
      assert.equal(A.power(G, g, G.n), G.e, 'g^|G| = e');
      assert.deepEqual(A.generated(G, g).length, A.order(G, g));
    }
  }
  assert.equal(A.subgroups(A.dihedralGroup(4)).length, 10);
  assert.equal(A.subgroups(A.symmetricGroup(4)).length, 30);
});

test('propriedades conhecidas', () => {
  assert.ok(A.isAbelian(A.cyclicGroup(9)) && A.isCyclic(A.cyclicGroup(9)));
  assert.ok(!A.isAbelian(A.dihedralGroup(3)));
  assert.ok(A.isCyclic(A.unitGroup(7)) && !A.isCyclic(A.unitGroup(8)));
  const D4 = A.dihedralGroup(4);
  const r = D4.labels.indexOf('r'), s = D4.labels.indexOf('s');
  assert.equal(D4.labels[D4.mul(s, D4.mul(r, s))], 'r³', 'srs = r⁻¹');
  assert.ok(A.isNormal(D4, A.generated(D4, r)), 'as rotações formam um subgrupo normal');
  assert.ok(!A.isNormal(D4, A.generated(D4, s)), '⟨s⟩ não é normal');
  // D3 e S3 são isomorfos: mesmo multiconjunto de ordens e ambos não abelianos de ordem 6
  const ords = G => [...Array(G.n).keys()].map(g => A.order(G, g)).sort().join();
  assert.equal(ords(A.dihedralGroup(3)), ords(A.symmetricGroup(3)));
  for (let n = 2; n < 60; n++) assert.equal(A.unitGroup(n).n, A.phi(n));
});

test('permutações', () => {
  const p = A.parseCycles('(1 3 2)(4 5)', 5);
  assert.equal(A.cycleString(p), '(1 3 2)(4 5)');
  assert.equal(A.permOrder(p), 6);
  assert.equal(A.sign(p), -1);
  assert.equal(A.cycleString(A.parseCycles('(1 2)(1 3)', 3)), '(1 3 2)', 'compõe da direita para a esquerda');
  assert.deepEqual(A.compose(p, A.inverse(p)), A.identity(5));
  assert.equal(A.permOrder(A.outShuffle(52)), 8);
  assert.equal(A.permOrder(A.inShuffle(52)), 52);
  assert.throws(() => A.parseCycles('(1 1)', 3), /repetir/);
  assert.throws(() => A.parseCycles('(1 9)', 3), /entre 1 e 3/);
});

test('Euclides estendido e Teorema Chinês do Resto', () => {
  for (let a = 1; a < 60; a++) for (let b = 1; b < 60; b++) {
    const { g, x, y } = A.egcd(a, b);
    assert.equal(g, A.gcd(a, b));
    assert.equal(a * x + b * y, g);
  }
  for (let m = 2; m <= 12; m++) for (let n = 2; n <= 12; n++) for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) {
    const r = A.crt(a, m, b, n);
    const brute = [...Array(A.lcm(m, n)).keys()].find(x => x % m === a && x % n === b);
    if (brute == null) assert.equal(r.sol, null);
    else assert.deepEqual(r.sol, { x: brute, M: A.lcm(m, n) });
  }
  assert.deepEqual(A.crtMany([[2, 3], [3, 5], [2, 7]]), { x: 23, M: 105 });
});
