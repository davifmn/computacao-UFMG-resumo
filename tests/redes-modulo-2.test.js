import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../periodo-07/redes-de-computadores/modulo-2/visualizacoes/redes2.js';

test('Dijkstra no exemplo do livro', () => {
  const G = R.NETWORKS.dijkstra;
  const last = R.dijkstraSteps(G, 0).at(-1);
  assert.deepEqual(last.dist, [0, 2, 9, 10, 4, 6, 5, 8]);
  assert.equal(R.pathTo(last.prev, 3).map(i => G.names[i]).join(''), 'ABEFHD');
  assert.ok(last.perm.every(Boolean));
});

test('vetor de distância converge para as distâncias de Dijkstra', () => {
  for (const G of Object.values(R.NETWORKS)) {
    const T = R.distanceVector(G, { infinity: 1000 }).at(-1);
    for (let s = 0; s < G.names.length; s++) assert.deepEqual(T[s].map(c => c.cost), R.dijkstraSteps(G, s).at(-1).dist);
  }
  const C = R.dvUpdate(['A', 'B', 'C', 'D', 'E', 'F'], { B: [5, 0, 8, 12, 6, 2], D: [16, 12, 6, 0, 9, 10], E: [7, 6, 3, 9, 0, 4] }, { B: 6, D: 3, E: 5 }, 'C');
  assert.deepEqual(C.map(x => `${x.cost}${x.via}`), ['11B', '6B', '0—', '3D', '5E', '8B']);
  assert.deepEqual(R.countToInfinity(5, 4).slice(1).map(r => r.join('')), ['3234', '3434', '5454', '5656']);
});

test('IPv4: CIDR, maior prefixo, alocação, agregação e fragmentação', () => {
  const i = R.cidrInfo('192.168.10.77/20');
  assert.equal(R.ipStr(i.net), '192.168.0.0');
  assert.equal(R.ipStr(i.bcast), '192.168.15.255');
  assert.equal(i.hosts, 4094);
  assert.equal(R.ipStr(parseInt('C22F1582', 16)), '194.47.21.130');
  const tab = [{ prefix: '135.46.56.0/22', hop: 'I0' }, { prefix: '135.46.60.0/22', hop: 'I1' }, { prefix: '192.53.40.0/23', hop: 'R1' }, { prefix: 'default', hop: 'R2' }];
  assert.deepEqual(['135.46.63.10', '135.46.57.14', '135.46.52.2', '192.53.40.7', '192.53.56.7'].map(a => R.longestPrefix(tab, a).best.hop), ['I1', 'I0', 'R2', 'R1', 'R2']);
  const al = R.allocate('198.16.0.0', [{ nome: 'A', n: 4000 }, { nome: 'B', n: 2000 }, { nome: 'C', n: 4000 }, { nome: 'D', n: 8000 }]);
  assert.deepEqual(al.map(b => `${R.ipStr(b.first)}/${b.len}`), ['198.16.0.0/20', '198.16.16.0/21', '198.16.32.0/20', '198.16.64.0/19']);
  assert.equal(R.aggregate(['57.6.96.0/21', '57.6.104.0/21', '57.6.112.0/21', '57.6.120.0/21']), '57.6.96.0/19');
  assert.equal(R.aggregate(['10.0.0.0/24', '10.0.2.0/24']), null);
  const f = R.fragmentPath(920, [1010, 504, 500]);
  assert.deepEqual(f[1], [{ total: 500, data: 480, offset: 0, mf: true }, { total: 460, data: 440, offset: 60, mf: false }]);
  assert.deepEqual(f[2], f[1]);
  // os fragmentos cobrem exatamente os dados originais
  for (let it = 0; it < 100; it++) {
    const data = 100 + it * 37, mtus = [1500, 576, 296];
    for (const fs of R.fragmentPath(data, mtus)) {
      assert.equal(fs.reduce((s, x) => s + x.data, 0), data);
      fs.slice(0, -1).forEach(x => { assert.equal(x.data % 8, 0); assert.ok(x.mf); });
      assert.equal(fs.at(-1).mf, false);
    }
  }
});

test('TCP: congestionamento e RTT', () => {
  const c = R.congestion({ ssthresh: 8, rounds: 12, events: { 6: 'timeout' } });
  assert.deepEqual(c.map(x => x.cwnd), [1, 2, 4, 8, 9, 10, 1, 2, 4, 5, 6, 7]);
  const r = R.congestion({ ssthresh: 8, rounds: 8, events: { 5: '3dup' }, variant: 'reno' });
  assert.deepEqual(r.map(x => x.cwnd), [1, 2, 4, 8, 9, 4, 5, 6]);
  assert.equal(+R.smoothRTT(30, [26, 32, 24]).toFixed(3), 29.256);
  const e = R.rttEstimates([100, 100, 100]);
  assert.equal(e.at(-1).srtt, 100);
  assert.ok(e.at(-1).rto > 100 && e.at(-1).rto < e[0].rto, 'a variância cai com amostras iguais');
});

test('DNS e criptografia', () => {
  assert.equal(R.dnsSteps('iterativa', 'nada').length, 8);
  assert.equal(R.dnsSteps('iterativa', 'tudo').length, 2);
  assert.ok(R.dnsSteps('recursiva', 'nada').length > R.dnsSteps('recursiva', 'tld').length);
  assert.deepEqual(R.diffieHellman(47, 3, 8, 10), { A: 28, B: 17, kA: 4, kB: 4 });
  const k = R.rsaKeys(3, 11, { d: 7 });
  assert.deepEqual([k.n, k.z, k.e], [33, 20, 3]);
  assert.deepEqual([...'SUZANNE'].map(c => R.modpow(c.charCodeAt(0) - 64, 3, 33)), [28, 21, 20, 1, 5, 5, 26]);
  for (let P = 1; P < 33; P++) assert.equal(R.modpow(R.modpow(P, k.e, k.n), k.d, k.n), P);
});
