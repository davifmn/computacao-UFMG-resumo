import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as F from '../periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/visualizacoes/fspd.js';

test('Amdahl e Gustafson', () => {
  assert.equal(+F.amdahl(0.2, 8).toFixed(4), 3.3333);
  assert.ok(Math.abs(F.amdahl(0.05, 1e9) - 20) < 1e-6);
  assert.equal(F.gustafson(0.1, 10), 9.1);
  assert.equal(F.amdahl(0, 16), 16);
});

test('trabalho, caminho crítico e Brent', () => {
  const red = F.reductionDAG(16);
  const ws = F.workSpan(red);
  assert.deepEqual([ws.work, ws.span], [31, 5], '16 folhas + 15 somas, profundidade log2 16 + 1');
  for (const dag of [red, F.reductionDAG(10), F.forkJoinDAG(3, 6, 4), F.forkJoinDAG(1, 5, 7)]) {
    const w = F.workSpan(dag);
    for (let p = 1; p <= 8; p++) {
      const T = F.greedySchedule(dag, p).T;
      assert.ok(T >= Math.max(Math.ceil(w.work / p), w.span), `limite inferior p=${p}`);
      assert.ok(T <= w.work / p + w.span, `Brent p=${p}`);
    }
    assert.equal(F.greedySchedule(dag, 1).T, w.work);
    assert.equal(F.greedySchedule(dag, 1000).T, w.span);
  }
});

test('relógios: Lamport respeita a causalidade e vetores a caracterizam', () => {
  for (const ex of Object.values(F.CLOCK_EXAMPLES)) {
    const c = F.clocks(ex.n, ex.events);
    for (const a of c) for (const b of c) if (F.relation(a.vector, b.vector) === '→') assert.ok(a.lamport < b.lamport);
  }
  const c = F.clocks(3, F.CLOCK_EXAMPLES.concorrencia.events);
  assert.equal(F.relation(c[3].vector, c[7].vector), '∥');
  assert.ok(c[3].lamport > c[7].lamport, 'Lamport diferente, mas concorrentes');
  assert.equal(F.relation([1, 0, 0], [2, 1, 0]), '→');
  assert.equal(F.relation([3, 1, 0], [2, 2, 1]), '∥');
});

test('eleições', () => {
  const b = F.bullySteps(6, new Set([6]), 2).at(-1);
  assert.deepEqual([b.winner, b.count], [5, 20]);
  assert.equal(F.bullySteps(6, new Set([6]), 5).at(-1).count, 5);
  assert.equal(F.bullySteps(5, new Set([5]), 1).at(-1).count, 19);
  const r = F.ringSteps(6, new Set([6]), 2).at(-1);
  assert.deepEqual([r.winner, r.count], [5, 10]);
  assert.equal(F.ringSteps(6, new Set([6, 3]), 4).at(-1).winner, 5);
});

test('MapReduce conta como o sequencial', () => {
  const txt = 'o rato roeu a roupa do rei de roma e o rei riu do rato';
  for (const [m, r] of [[1, 1], [2, 3], [4, 2]]) {
    const res = F.mapReduce(txt, m, r);
    const all = Object.fromEntries(res.reduced.flat());
    assert.equal(all.rato, 2); assert.equal(all.rei, 2); assert.equal(all.o, 2); assert.equal(all.roma, 1);
    const keys = res.reduced.flat().map(x => x[0]);
    assert.equal(new Set(keys).size, keys.length, 'cada chave em um só redutor');
  }
});
