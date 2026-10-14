import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../periodo-05/pesquisa-operacional/visualizacoes/po.js';

const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const asCons = (A, b) => A.map((a, i) => ({ a, op: '<=', b: b[i] }));

test('região viável e solução gráfica', () => {
  const W = P.LP_EXAMPLES.wyndor;
  const g = P.solve2D(W.c, asCons(W.A, W.b));
  assert.equal(g.status, 'otimo');
  assert.deepEqual(g.x.map(v => Math.round(v * 1e6) / 1e6), [2, 6]);
  assert.equal(Math.round(g.z), 36);
  assert.equal(P.feasiblePolygon(asCons(W.A, W.b)).length, 5);
  assert.equal(P.solve2D([1, 1], [{ a: [1, 1], op: '<=', b: 1 }, { a: [1, 1], op: '>=', b: 2 }]).status, 'inviavel');
  assert.equal(P.solve2D([1, 1], [{ a: [1, -1], op: '<=', b: 1 }]).status, 'ilimitado');
  assert.equal(P.solve2D([1, 1], [{ a: [1, 1], op: '<=', b: 4 }]).status, 'multiplas');
  assert.equal(P.feasiblePolygon([{ a: [1, 0], op: '>=', b: 4 }, { a: [1, 0], op: '<=', b: 4 }, { a: [0, 1], op: '<=', b: 0 }]).length, 1, 'região degenerada num ponto');
});

test('simplex: mesmo ótimo que a geometria e preços-sombra corretos', () => {
  const W = P.LP_EXAMPLES.wyndor;
  const last = P.simplexSteps(W.c, W.A, W.b).at(-1);
  assert.ok(last.done);
  assert.equal(last.z, 36);
  assert.deepEqual(last.duals.map(P.fmtNum), ['0', '3/2', '1']);
  const r = rng(9);
  for (let it = 0; it < 200; it++) {
    const c = [1 + Math.floor(r() * 9), 1 + Math.floor(r() * 9)];
    const A = [0, 1, 2].map(() => [Math.floor(r() * 6), Math.floor(r() * 6)]).filter(a => a[0] || a[1]);
    const b = A.map(() => 1 + Math.floor(r() * 30));
    const st = P.simplexSteps(c, A, b).at(-1);
    const g = P.solve2D(c, asCons(A, b));
    if (g.status === 'ilimitado') { assert.ok(st.unbounded, 'simplex detecta ilimitado'); continue; }
    assert.ok(Math.abs(st.z - g.z) < 1e-7, `simplex ${st.z} × gráfico ${g.z}`);
    // dualidade forte: b·y = z
    assert.ok(Math.abs(st.duals.reduce((s, y, i) => s + y * b[i], 0) - st.z) < 1e-7);
  }
});

test('branch and bound = força bruta nos pontos inteiros', () => {
  for (const e of Object.values(P.IP_EXAMPLES)) {
    const r = P.branchAndBound(e.c, e.cons);
    assert.equal(r.best.z, P.bruteInteger(e.c, e.cons).z);
  }
  assert.deepEqual(P.branchAndBound([5, 4], P.IP_EXAMPLES.mochila.cons).best.x, [4, 0]);
  const r = rng(3);
  for (let it = 0; it < 200; it++) {
    const c = [1 + Math.floor(r() * 9), 1 + Math.floor(r() * 9)];
    const cons = [0, 1].map(() => ({ a: [1 + Math.floor(r() * 9), 1 + Math.floor(r() * 9)], op: '<=', b: 5 + Math.floor(r() * 40) }));
    assert.equal(P.branchAndBound(c, cons).best.z, P.bruteInteger(c, cons).z);
  }
});

test('fluxo máximo = corte mínimo', () => {
  assert.equal(P.maxFlow(P.FLOW_EXAMPLES.clrs, 0, 5), 23);
  const can = P.maxFlowSteps(P.FLOW_EXAMPLES.cancela, 0, 7);
  assert.equal(can.at(-1).total, 2);
  assert.ok(can.some(s => s.back?.length), 'o 2º caminho usa uma aresta ao contrário');
  const r = rng(21);
  for (let it = 0; it < 150; it++) {
    const n = 4 + Math.floor(r() * 4);
    const edges = [];
    for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) if (u !== v && r() < 0.4) edges.push([u, v, 1 + Math.floor(r() * 9)]);
    const G = { names: [...Array(n).keys()].map(String), pos: [], edges };
    const last = P.maxFlowSteps(G, 0, n - 1).at(-1);
    let best = Infinity;
    for (let mask = 0; mask < 1 << (n - 2); mask++) {
      const S = new Set([0]);
      for (let k = 0; k < n - 2; k++) if ((mask >> k) & 1) S.add(k + 1);
      best = Math.min(best, edges.filter(([u, v]) => S.has(u) && !S.has(v)).reduce((s, e) => s + e[2], 0));
    }
    assert.equal(last.total, best);
    assert.equal(last.cutCap, best);
  }
});
