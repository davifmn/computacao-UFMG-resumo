import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../periodo-07/introducao-a-inteligencia-artificial/visualizacoes/ia.js';

test('busca: A* e custo uniforme são ótimos; BFS só em passos', () => {
  const lama = A.parseGrid(A.MAZES.lama.lines);
  assert.equal(A.search(lama, 'ucs').cost, 25);
  assert.equal(A.search(lama, 'astar').cost, 25);
  assert.equal(A.search(lama, 'bfs').cost, 85, 'a BFS atravessa a lama');
  const r = A.rng(9);
  for (let it = 0; it < 80; it++) {
    const lines = Array.from({ length: 8 }, (_, y) => Array.from({ length: 12 }, (_, x) => (x === 0 && y === 0 ? 'S' : x === 11 && y === 7 ? 'G' : r() < 0.2 ? '#' : r() < 0.15 ? '~' : '.')).join(''));
    const g = A.parseGrid(lines);
    const u = A.search(g, 'ucs'), a = A.search(g, 'astar'), b = A.search(g, 'bfs');
    assert.equal(a.cost, u.cost);
    assert.ok(a.order.length <= u.order.length);
    assert.equal(!!b.path, !!u.path, 'mesma alcançabilidade');
    for (const alg of Object.keys(A.ALGOS)) {
      const s = A.search(g, alg);
      if (s.path) {
        assert.ok(s.cost >= u.cost);
        for (let k = 1; k < s.path.length; k++) assert.equal(A.manhattan(g, s.path[k - 1], s.path[k]), 1, `${alg}: caminho contínuo`);
      }
    }
  }
});

test('minimax e alfa-beta', () => {
  const a = A.minimaxSteps(A.TREES.livro.tree), b = A.minimaxSteps(A.TREES.livro.tree, { prune: false });
  assert.equal(a.value, 3); assert.equal(b.value, 3);
  assert.equal(a.visitedLeaves, 7); assert.equal(b.visitedLeaves, 9);
  const r = A.rng(2);
  const tree = d => (d === 0 ? Math.floor(r() * 19) - 9 : Array.from({ length: 2 + Math.floor(r() * 2) }, () => tree(d - 1)));
  for (let it = 0; it < 100; it++) {
    const t = tree(3);
    assert.equal(A.minimaxSteps(t).value, A.minimaxSteps(t, { prune: false }).value);
  }
  assert.equal(A.ttt(Array(9).fill(null), 'X').v, 0, 'jogo da velha perfeito é empate');
  const b2 = ['X', 'X', null, 'O', 'O', null, null, null, null];
  assert.equal(A.ttt(b2, 'O').move, 5, 'O completa a linha do meio');
});

test('mundo 4×3: utilidades do Russell e Norvig', () => {
  const v = A.valueIteration();
  const want = { '0,0': 0.705, '0,1': 0.762, '0,2': 0.812, '1,0': 0.655, '1,2': 0.868, '2,0': 0.611, '2,1': 0.660, '2,2': 0.918, '3,0': 0.388 };
  for (const [k, u] of Object.entries(want)) assert.ok(Math.abs(v.U[k] - u) < 0.0015, `${k}: ${v.U[k]}`);
  assert.equal(v.policy['2,0'], '←');
  assert.equal(A.valueIteration({ R: -2 }).policy['2,1'], '→', 'com R muito negativo, pula no buraco');
});

test('perceptron e rede neural', () => {
  const lin = A.perceptron(A.makeData('linear'));
  assert.equal(lin.at(-1).errors, 0);
  assert.ok(A.perceptron(A.makeData('xor')).at(-1).errors > 0);
  const xor = A.makeData('xor', 80, 7);
  const m = new A.MLP(6, 3);
  for (let i = 0; i < 1500; i++) m.epoch(xor, 0.5);
  assert.ok(m.accuracy(xor) >= 0.95);
});
