import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve, polyFit, powerIteration, pagerank, googleMatrix, svd, lowRank } from '../periodo-03/algebra-linear-computacional/visualizacoes/numerico.js';

const close = (a, b, tol = 1e-8) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);

test('Gauss com pivoteamento', () => {
  solve([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3]).forEach((v, i) => close(v, [2, 3, -1][i]));
  solve([[0, 1], [1, 0]], [2, 3]).forEach((v, i) => close(v, [3, 2][i]));   // pivô zero na diagonal
  assert.throws(() => solve([[1, 2], [2, 4]], [1, 2]));
});

test('mínimos quadrados', () => {
  polyFit([[0, 1], [1, 3], [2, 7], [3, 13]], 2).c.forEach(v => close(v, 1));
  const lin = polyFit([[0, 0], [1, 1], [2, 1], [3, 3]], 1);
  close(lin.c[0], -0.1); close(lin.c[1], 0.9); close(lin.sse, 0.7);
  // resíduos ortogonais às colunas de A (condição das equações normais)
  for (let k = 0; k < 2; k++) close(lin.A.reduce((s, row, i) => s + row[k] * lin.residuals[i], 0), 0);
  const pts = Array.from({ length: 12 }, (_, i) => [0.5 + i * 0.8, Math.sin(i)]);
  assert.ok(polyFit(pts, 11, { scaled: true }).sse < 1e-12, 'grau n−1 interpola');
});

test('método das potências e PageRank', () => {
  close(powerIteration([[2, 1], [1, 2]], [1, 0], 60).at(-1).lambda, 3);
  const links = [[0, 1], [0, 2], [1, 2], [2, 0], [3, 2]];
  const G = googleMatrix(4, links);
  for (let j = 0; j < 4; j++) close(G.reduce((s, r) => s + r[j], 0), 1);   // colunas somam 1
  const x = pagerank(4, links).at(-1).x;
  close(x.reduce((a, b) => a + b, 0), 1);
  const Gx = G.map(r => r.reduce((s, v, k) => s + v * x[k], 0));
  Gx.forEach((v, i) => close(v, x[i], 1e-6));                            // G x = x
});

test('SVD reconstrói a matriz e ordena os valores singulares', () => {
  const A = Array.from({ length: 9 }, (_, i) => Array.from({ length: 6 }, (_, j) => Math.sin(i * 1.3 + j * 0.7) + ((i * j) % 3)));
  const D = svd(A);
  for (let k = 1; k < D.S.length; k++) assert.ok(D.S[k] <= D.S[k - 1]);
  const R = lowRank(D, 6, 9, 6);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) close(R[i][j], A[i][j], 1e-9);
  assert.deepEqual(svd([[3, 0], [0, 4], [0, 0]]).S.map(v => +v.toFixed(9)), [4, 3]);
  // Eckart–Young: erro de posto k = raiz da soma dos σ² descartados
  const R2 = lowRank(D, 2, 9, 6);
  let err = 0; for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) err += (R2[i][j] - A[i][j]) ** 2;
  close(Math.sqrt(err), Math.sqrt(D.S.slice(2).reduce((s, v) => s + v * v, 0)), 1e-9);
});
