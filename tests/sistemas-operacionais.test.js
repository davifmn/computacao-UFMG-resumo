import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../periodo-06/sistemas-operacionais/visualizacoes/so.js';

test('escalonamento: números do Silberschatz', () => {
  const ps = S.SCHED_EXAMPLES.silberschatz.procs.map(p => ({ ...p, chegada: 0 }));
  const avg = (pol, q = 1) => +S.schedule(ps, pol, q).avg.espera.toFixed(2);
  assert.equal(avg('fcfs'), 9.6);
  assert.equal(avg('sjf'), 3.2);
  assert.equal(avg('prio'), 8.2);
  assert.equal(avg('rr', 1), 5.4);
  const r = S.schedule(S.SCHED_EXAMPLES.srtf.procs, 'srtf');
  assert.equal(r.avg.espera, 6.5);
  assert.deepEqual(r.gantt.map(g => g.p), [0, 1, 3, 0, 2]);
});

test('escalonamento: invariantes em cargas aleatórias', () => {
  let seed = 7;
  const rnd = k => (seed = (seed * 16807) % 2147483647) % k;
  for (let it = 0; it < 150; it++) {
    const procs = Array.from({ length: 2 + rnd(4) }, (_, i) => ({ nome: `P${i}`, chegada: rnd(6), duracao: 1 + rnd(6), prioridade: 1 + rnd(4) }));
    const results = Object.fromEntries(Object.keys(S.POLICIES).map(p => [p, S.schedule(procs, p, 1 + rnd(3))]));
    for (const [pol, r] of Object.entries(results)) {
      const busy = r.gantt.filter(g => g.p != null).reduce((s, g) => s + g.end - g.start, 0);
      assert.equal(busy, procs.reduce((s, p) => s + p.duracao, 0), `${pol}: CPU trabalha exatamente a soma das rajadas`);
      r.metrics.forEach(m => assert.ok(m.espera >= 0 && m.resposta >= 0 && m.resposta <= m.espera));
    }
    // SRTF é ótimo para a espera média entre as políticas
    for (const pol of Object.keys(S.POLICIES)) assert.ok(results.srtf.avg.espera <= results[pol].avg.espera + 1e-9, pol);
  }
});

test('intercalações: corrida, mutex, semáforos e deadlock', () => {
  const race = S.exploreAll(S.PROGRAMS.corrida);
  assert.deepEqual(race.counts.map(c => c[0]), [2, 3, 4]);
  assert.equal(race.total, 924, 'C(12, 6) intercalações');
  assert.deepEqual(S.exploreAll(S.PROGRAMS.mutex).counts, [[4, 6]]);
  const pc = S.exploreAll(S.PROGRAMS.produtor, st => st.consumed.join(','));
  assert.deepEqual(pc.counts.map(c => c[0]), ['1,2,3']);
  assert.equal(pc.dead, 0);
  const dl = S.exploreAll(S.PROGRAMS.deadlock, () => 'ok');
  assert.equal(dl.dead, 2);
  let st = S.initState(S.PROGRAMS.deadlock);
  st = S.step(S.PROGRAMS.deadlock, st, 0); st = S.step(S.PROGRAMS.deadlock, st, 1);
  assert.ok(S.deadlocked(S.PROGRAMS.deadlock, st));
});

test('banqueiro', () => {
  const B = S.BANKER_EXAMPLE;
  assert.ok(S.bankerSafety(B.disp, B.aloc, B.max).seq);
  const g = S.bankerRequest(B.disp, B.aloc, B.max, 1, [1, 0, 2]);
  assert.ok(g.granted);
  assert.deepEqual(g.disp, [2, 3, 0]);
  assert.match(S.bankerRequest(g.disp, g.aloc, B.max, 4, [3, 3, 0]).reason, /disponíveis/);
  assert.match(S.bankerRequest(g.disp, g.aloc, B.max, 0, [0, 2, 0]).reason, /inseguro/);
  assert.match(S.bankerRequest(B.disp, B.aloc, B.max, 0, [8, 0, 0]).reason, /necessidade/);
});

test('substituição de páginas', () => {
  const R = S.REF_EXAMPLES;
  assert.deepEqual(['fifo', 'lru', 'otimo'].map(a => S.faultsOf(R.silberschatz.refs, 3, a)), [15, 12, 9]);
  assert.equal(S.faultsOf(R.belady.refs, 3, 'fifo'), 9);
  assert.equal(S.faultsOf(R.belady.refs, 4, 'fifo'), 10);
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) % 6;
  for (let it = 0; it < 200; it++) {
    const refs = Array.from({ length: 20 }, rnd);
    for (const a of ['lru', 'otimo']) {
      const f = [1, 2, 3, 4, 5].map(n => S.faultsOf(refs, n, a));
      for (let k = 1; k < f.length; k++) assert.ok(f[k] <= f[k - 1], `${a} é algoritmo de pilha`);
    }
    for (const a of ['fifo', 'lru', 'relogio']) assert.ok(S.faultsOf(refs, 3, 'otimo') <= S.faultsOf(refs, 3, a));
  }
});
