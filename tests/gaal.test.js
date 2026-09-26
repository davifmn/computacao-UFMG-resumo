import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Frac, gaussSteps, parseAugmented, eigen2, apply, det2, mul2 } from '../periodo-01/geometria-analitica-e-algebra-linear/visualizacoes/linalg.js';

test('frações exatas', () => {
  assert.equal(String(Frac.of('1/3').add('1/6')), '1/2');
  assert.equal(String(Frac.of(0.25).mul(4)), '1');
  assert.equal(String(new Frac(2, -4)), '-1/2');
  assert.throws(() => Frac.of(1).div(0));
});

test('Gauss-Jordan: SPD, SPI e SI', () => {
  const solve = t => gaussSteps(parseAugmented(t)).at(-1).solution;
  assert.deepEqual(solve('2 1 -1 | 8\n-3 -1 2 | -11\n-2 1 2 | -3').values, ['2', '3', '-1']);
  assert.deepEqual(solve('0 2 | 4\n3 1 | 5').values, ['1', '2']);
  assert.equal(solve('1 2 3 | 4\n2 4 6 | 8').type, 'SPI');
  assert.equal(solve('1 1 1 | 2\n1 -1 2 | 1\n2 0 3 | 5').type, 'SI');
  assert.deepEqual(solve('1/2 1/3 | 1\n1 -1 | 0').values, ['6/5', '6/5']);
});

test('Gauss-Jordan: forma final é reduzida (pivôs 1 e zeros na coluna)', () => {
  const last = gaussSteps(parseAugmented('1 2 1 | 4\n3 8 1 | 12\n0 4 1 | 2')).at(-1);
  const R = last.rows.map(r => r.cells);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) assert.equal(R[i][j], i === j ? '1' : '0');
});

test('parseAugmented valida o formato', () => {
  assert.throws(() => parseAugmented('1 2 | 3\n4 | 5'), /mesmo número/);
  assert.throws(() => parseAugmented(''), /ao menos/);
});

test('transformações 2×2', () => {
  const R = [[0, -1], [1, 0]];
  assert.deepEqual(apply(R, [1, 0]), [0, 1]);
  assert.equal(det2(R), 1);
  assert.deepEqual(mul2(R, R).flat().map(x => x + 0), [-1, 0, 0, -1]);  // + 0 normaliza −0
  assert.equal(eigen2(R).real, false);
  const M = [[3, 1], [0, 2]];
  const e = eigen2(M);
  e.vectors.forEach((v, i) => {
    const Mv = apply(M, v);
    assert.ok(Math.abs(Mv[0] - e.values[i] * v[0]) < 1e-9 && Math.abs(Mv[1] - e.values[i] * v[1]) < 1e-9);
  });
});
