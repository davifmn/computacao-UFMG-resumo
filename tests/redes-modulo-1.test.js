import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../engine/random.js';
import * as R from '../periodo-07/redes-de-computadores/modulo-1/visualizacoes/redes.js';
import { LAYERS, encapsulationSteps } from '../periodo-07/redes-de-computadores/modulo-1/visualizacoes/encapsulamento.js';

const close = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);
const bits = s => s.split('').map(Number);
const str = a => a.join('');

test('encapsulamento: desce em A, passa pelo roteador e sobe em B', () => {
  const steps = encapsulationSteps();
  assert.equal(LAYERS.length, 5);
  assert.equal(steps[0].where, 'A');
  assert.equal(steps.at(-1).where, 'B');
  assert.ok(steps.some(s => s.where === 'R'));
  // o roteador nunca sobe acima da camada de rede
  for (const s of steps.filter(x => x.where === 'R')) assert.ok(s.layer >= 2);
});

test('cap. 2: Nyquist, Shannon e decibéis (problemas 2.2 a 2.5)', () => {
  assert.equal(Math.round(R.shannon(4000, 30)), 39869);
  assert.equal(R.nyquist(6e6, 4), 24e6);
  assert.equal(Math.min(R.nyquist(3000, 2), R.shannon(3000, 20)), 6000);
  close(R.ratioToDb(2 ** (1544000 / 50000) - 1), 93, 0.1);
  close(R.dbToRatio(30), 1000, 1e-9);
});

test('cap. 2: série de Fourier do "b" converge para o sinal', () => {
  const b = bits('01100010');
  const F = R.fourier(b, 64);
  close(F.c / 2, 3 / 8, 1e-9);                                   // valor médio = fração de 1s
  close(F.at(0.3125), 1, 0.08);                                  // meio do 3º bit (1)
  close(F.at(0.5625), 0, 0.08);                                  // meio do 5º bit (0)
});

test('cap. 2: códigos de linha (convenção do livro para Manchester)', () => {
  assert.deepEqual(R.lineCode([0, 1], 'manchester'), [-1, 1, 1, -1]);   // 0 = baixo→alto, 1 = alto→baixo
  assert.deepEqual(R.lineCode([1, 0, 1], 'nrzi'), [1, 1, 1, 1, -1, -1]);
  assert.deepEqual(R.lineCode([1, 0, 1, 1], 'ami'), [1, 1, 0, 0, -1, -1, 1, 1]);
  assert.equal(str(R.encode4b5b(bits('00001111'))), '1111011101');
  // 4B/5B: nunca mais de 3 zeros seguidos, em qualquer concatenação
  const codes = Object.values(R.FOUR_B_FIVE_B);
  for (const a of codes) for (const b of codes) assert.ok(!/0000/.test(a + b));
  assert.equal(R.constellation('qam16').length, 16);
});

test('cap. 2: CDMA com os chips da Fig. 2-28 (problemas 2.44 e 2.46)', () => {
  const ks = Object.keys(R.CHIPS);
  for (const a of ks) for (const b of ks) assert.equal(R.dot(R.CHIPS[a], R.CHIPS[b]), a === b ? 1 : 0);
  assert.deepEqual(R.cdmaCombine({ A: 0, B: 0, C: 0 }), [3, 1, 1, -1, -3, -1, -1, 1]);
  assert.deepEqual(R.cdmaDecode([-1, 1, -3, 1, -1, -3, 1, 1]), { A: 1, B: -1, C: 0, D: 1 });
});

test('cap. 2: circuitos × pacotes (problema 2.38)', () => {
  const r = R.switchingDelay({ x: 40000, k: 3, s: 2, d: 0.1, p: 8000, b: 10000 });
  close(r.circuit, 6.3, 1e-9);
  close(r.packet, 5.9, 1e-9);
});

test('cap. 3: enquadramento (problemas 3.3 e 3.6, Fig. 3-5)', () => {
  assert.deepEqual(R.byteCount([[1, 2, 3, 4], [6, 7, 8, 9]]), [5, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const toks = 'A B ESC C ESC FLAG FLAG D'.split(' ');
  const st = R.byteStuff(toks);
  assert.equal(st.out.slice(1, -1).join(' '), 'A B ESC ESC C ESC ESC ESC FLAG ESC FLAG D');
  assert.deepEqual(R.byteUnstuff(st.out), toks);
  assert.equal(str(R.bitStuff(bits('0111101111101111110')).out), '011110111110011111010');
  const fig = R.bitStuff(bits('011011111111111111110010'));
  assert.equal(str(fig.out), '011011111011111011111010010');
  assert.equal(str(R.bitUnstuff(fig.out)), '011011111111111111110010');
  const r = rng(3);
  for (let k = 0; k < 200; k++) {
    const b = Array.from({ length: 40 }, () => (r() < 0.8 ? 1 : 0));
    const out = R.bitStuff(b).out;
    assert.ok(!/111111/.test(str(out)));
    assert.deepEqual(R.bitUnstuff(out), b);
  }
});

test('cap. 3: Hamming (Fig. 3-6, problemas 3.9 e 3.10)', () => {
  assert.equal(R.hammingCheckBits(7), 4);
  assert.equal(R.hammingCheckBits(16), 5);
  assert.equal(R.hammingCheckBits(1000), 10);
  const A = R.hammingEncode(bits('1000001'));
  assert.equal(str(A.word), '00100001001');
  const err = [...A.word]; err[4] ^= 1;
  const d = R.hammingDecode(err);
  assert.equal(d.syndrome, 5);
  assert.equal(str(d.data), '1000001');
  assert.equal(str(R.hammingEncode(bits('1101001100110101')).word), '011110110011001110101');
  const e4f = R.hammingDecode(bits((0xe4f).toString(2)));
  assert.equal(parseInt(str(e4f.data), 2), 0xaf);
  // qualquer erro simples é corrigido
  const r = rng(9);
  for (let k = 0; k < 100; k++) {
    const data = Array.from({ length: 11 }, () => (r() < 0.5 ? 1 : 0));
    const w = R.hammingEncode(data).word;
    const pos = Math.floor(r() * w.length);
    const rx = w.map((b, i) => (i === pos ? b ^ 1 : b));
    assert.deepEqual(R.hammingDecode(rx).data, data);
  }
});

test('cap. 3: CRC (Fig. 3-9, problemas 3.16 e 3.17) e checksum (3.15)', () => {
  const f = R.crc(bits('1101011111'), bits('10011'));
  assert.equal(str(f.remainder), '0010');
  assert.equal(str(f.transmitted), '11010111110010');
  assert.equal(str(R.crcCheck(f.transmitted, bits('10011'))), '0000');
  assert.equal(str(R.crc(bits('10100001'), bits('1001')).remainder), '111');
  assert.equal(R.bitsToPoly(bits('111')), 'x^2 + x + 1');
  const t = R.crc(bits('10011101'), bits('1001')).transmitted;
  assert.equal(str(t), '10011101100');
  const e = [...t]; e[2] ^= 1;
  assert.notEqual(str(R.crcCheck(e, bits('1001'))), '000');
  // rajadas de até r bits são sempre detectadas (G = x^4 + x + 1, r = 4)
  const G = bits('10011');
  for (let start = 0; start < f.transmitted.length - 3; start++) for (let pat = 1; pat < 16; pat++) {
    if (!(pat & 8) || !(pat & 1)) continue;           // rajada: primeiro e último bits invertidos
    const rx = [...f.transmitted];
    for (let j = 0; j < 4; j++) if ((pat >> (3 - j)) & 1) rx[start + j] ^= 1;
    assert.notEqual(str(R.crcCheck(rx, G)), '0000');
  }
  assert.deepEqual(R.polyToBits([4, 1, 0]), G);
  assert.equal(R.internetChecksum([0b1001, 0b1100, 0b1010, 0b0011], 4).checksum, 0b1011);
  const p = R.parity2d([[1, 0], [1, 1]]);
  assert.deepEqual([p.rowP, p.colP, p.corner], [[1, 0], [0, 1], 1]);
});

test('cap. 3: produto banda-atraso (exemplo do livro, 3.22, 3.27, 3.28)', () => {
  assert.equal(R.windowFor100({ frameBits: 1000, rate: 50e3, prop: 0.25 }), 26);
  close(R.utilization({ W: 1, frameBits: 1000, rate: 50e3, prop: 0.25 }), 1 / 26, 1e-12);
  assert.equal(R.windowFor100({ frameBits: 512, rate: 1.544e6, prop: 0.018 }), 110);
  close(R.utilization({ W: 1, frameBits: 32 * 1024 * 8, rate: 64e6, prop: 300 }), 6.83e-6, 1e-7);
  assert.equal(R.windowFor100({ frameBits: 32 * 1024 * 8, rate: 64e6, prop: 300 }), 146486);
});

test('cap. 3: simulador de ARQ', () => {
  // sem perdas, parar-e-esperar leva 1 + 2D por quadro
  const sw = R.simulateArq({ proto: 'sw', N: 5, D: 2 });
  assert.equal(sw.finish, 25);
  assert.equal(sw.retransmissions, 0);
  // Go-Back-N: perder o quadro 2 faz reenviar 2..7; o receptor descarta os fora de ordem
  const gbn = R.simulateArq({ proto: 'gbn', N: 8, W: 7, D: 2, timeout: 8, lostData: [2] });
  assert.deepEqual(gbn.deliveries.map(d => d.i), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(gbn.retransmissions, 6);
  assert.deepEqual(gbn.discards.map(d => d.i), [3, 4, 5, 6, 7]);
  // Repetição seletiva: só o perdido é reenviado
  const sr = R.simulateArq({ proto: 'sr', N: 8, W: 4, D: 2, timeout: 8, lostData: [2] });
  assert.deepEqual(sr.deliveries.map(d => d.i), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(sr.retransmissions, 1);
  // ACK cumulativo cobre um ACK perdido no Go-Back-N
  assert.equal(R.simulateArq({ proto: 'gbn', N: 8, W: 7, D: 2, lostAck: [3] }).retransmissions, 0);
  // parar-e-esperar com ACK perdido: retransmite e o receptor descarta a duplicata
  const dup = R.simulateArq({ proto: 'sw', N: 3, D: 1, timeout: 5, lostAck: [1] });
  assert.equal(dup.retransmissions, 1);
  assert.ok(dup.discards.some(d => d.dup));
  assert.deepEqual(dup.deliveries.map(d => d.i), [0, 1, 2]);
});

test('cap. 4: ALOHA, CSMA e disputa', () => {
  close(R.alohaPure(0.5), 1 / (2 * Math.E), 1e-12);
  close(R.alohaSlotted(1), 1 / Math.E, 1e-12);
  let best = 0; for (let G = 0.01; G < 60; G += 0.01) best = Math.max(best, R.csmaNonPersistent(G, 0.01));
  assert.ok(best > 0.8 && best < 1);
  close(R.slottedAlohaTheory(1000, 1 / 1000), 1 / Math.E, 0.001);
  const sim = R.slottedAlohaSim(rng(2), 20, 0.05, 20000);
  close(sim.filter(s => s.result === 'sucesso').length / 20000, R.slottedAlohaTheory(20, 0.05), 0.02);
  const bc = R.binaryCountdown([0b0010, 0b0100, 0b1001, 0b1010], 4);        // Fig. 4-8
  assert.equal(bc.winner, 0b1010);
  const tw = R.treeWalk([2, 3, 5, 7, 11, 13], 16);                          // problema 4.9
  assert.equal(tw.length, 11);
  assert.equal(tw.filter(s => s.result === 'sucesso').length, 6);
  const bo = R.binaryBackoff(rng(4), 2);
  assert.ok(bo.at(-1).done);
  bo.forEach(r => assert.ok(r.picks.every(p => p >= 0 && p < r.range)));
});

test('cap. 4: Ethernet e sem fio', () => {
  assert.equal(R.ethernetFrame(20).pad, 26);
  assert.equal(R.ethernetFrame(20).total, 64);
  assert.equal(R.ethernetFrame(60).pad, 0);                                // problema 4.17
  assert.equal(R.ethernetFrame(1500).total, 1518);
  close(R.minFrameBits({ length: 2500, velocity: 2e8, rate: 10e6 }), 250, 1e-9);
  // terminal oculto: A → B e C → B colidem em B
  const hid = R.wirelessOutcome([0, 1, 2], 1, [[0, 1], [2, 1]]);
  assert.ok(hid.every(o => !o.ok));
  // terminal exposto: B → A e C → D podem ocorrer juntas
  const exp = R.wirelessOutcome([0, 1, 2, 3], 1, [[1, 0], [2, 3]]);
  assert.ok(exp.every(o => o.ok));
});

test('cap. 4: pontes com aprendizado (problema 4.38, Fig. 4-41b)', () => {
  const topo = { bridges: { B1: { 1: 'LA', 2: 'LB', 3: 'LC', 4: 'L12' }, B2: { 4: 'L12', 1: 'LD', 2: 'H1', 3: 'LG' } }, hosts: { A: 'LA', B: 'LB', C: 'LC', D: 'LD', E: 'H1', F: 'H1', G: 'LG' } };
  const t = {};
  const run = (s, d) => R.bridgeSend(topo, t, s, d).hops.map(h => `${h.bridge}:${h.action}:${h.out.join('')}`).join(' ');
  assert.equal(run('A', 'C'), 'B1:inunda:234 B2:inunda:123');
  assert.equal(run('E', 'F'), 'B2:inunda:134 B1:inunda:123');
  assert.equal(run('F', 'E'), 'B2:descarta:');
  assert.equal(run('G', 'E'), 'B2:encaminha:2');
  assert.equal(run('D', 'A'), 'B2:encaminha:4 B1:encaminha:1');
  assert.equal(run('B', 'F'), 'B1:inunda:134 B2:encaminha:2');
});

test('cap. 4: árvore geradora', () => {
  const t = R.spanningTree({ 1: ['L1', 'L2'], 2: ['L1', 'L3'], 3: ['L2', 'L3', 'L4'], 4: ['L3', 'L5'], 5: ['L4', 'L5'] });
  assert.equal(t.root, 1);
  // árvore: (pontes − 1) portas raiz, sem laços, todas as LANs com designada
  assert.equal(Object.keys(t.rootPort).length, 4);
  assert.deepEqual(t.blocked, [[3, 'L3'], [5, 'L5']]);
  assert.equal(Object.keys(t.designated).length, 5);
  // duas pontes em paralelo: a de ID maior não encaminha nada (problema 4.40)
  const p = R.spanningTree({ 1: ['X', 'Y'], 2: ['X', 'Y'] });
  assert.deepEqual(p.designated, { X: 1, Y: 1 });
});

test('sockets: servidor faz socket → bind → listen → accept; accept cria socket novo', async () => {
  const { CODE, socketSteps } = await import('../periodo-07/redes-de-computadores/modulo-1/visualizacoes/sockets.js');
  const steps = socketSteps();
  const lines = CODE.split('\n');
  const order = steps.slice(0, 4).map(s => lines[s.line - 1]);
  assert.ok(/SOCKET/.test(order[0]) && /BIND/.test(order[1]) && /LISTEN/.test(order[2]) && /accept/.test(order[3]));
  assert.ok(steps.some(s => s.sockets.includes('c')));
  assert.deepEqual(steps.find(s => s.seg.length === 3).seg.map(g => g.txt), ['SYN', 'SYN + ACK', 'ACK']);
});

test('malhas: Omega, Batcher-Banyan, HOL, Clos e TSI', async () => {
  const M = await import('../periodo-07/redes-de-computadores/modulo-1/visualizacoes/malhas.js');
  for (let s = 0; s < 16; s++) for (let d = 0; d < 16; d++) assert.equal(M.omegaRoute(s, d, 4).at(-1).out, d);
  assert.deepEqual(M.omegaRoute(5, 2, 3).map(h => h.bit), [0, 1, 0]);
  const ident = [0, 1, 2, 3, 4, 5, 6, 7].map(i => [i, i]);
  assert.ok(M.omegaRouteAll(ident, 3).every(r => r.blockedAt == null));
  assert.ok(M.omegaRouteAll([[0, 0], [4, 1]], 3).some(r => r.blockedAt === 0));     // disputam o mesmo comutador/saída
  const r = rng(11);
  let omegaBlocked = 0;
  for (let t = 0; t < 500; t++) {
    const p = [0, 1, 2, 3, 4, 5, 6, 7];
    for (let i = 7; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    const pairs = p.map((d, i) => [i, d]);
    assert.ok(M.batcherThenBanyan(pairs, 3).every(x => x.blockedAt == null));
    if (M.omegaRouteAll(pairs, 3).some(x => x.blockedAt != null)) omegaBlocked++;
  }
  close(omegaBlocked / 500, 1 - 4096 / 40320, 0.05);        // a Omega 8×8 realiza só 2^12 das 8! permutações
  close(M.holThroughput(rng(1), 2, 20000), 0.75, 0.01);
  close(M.holThroughput(rng(2), 8, 20000), M.HOL_TABLE[8], 0.01);
  assert.equal(M.crossbarPoints(1000), 1e6);
  assert.equal(M.closPoints(1000, 50, 99), 237600);
  assert.ok(M.closNonBlocking(10, 19) && !M.closNonBlocking(10, 18));
  assert.deepEqual(M.tsi(['a', 'b', 'c', 'd'], [2, 0, 3, 1]), ['c', 'a', 'd', 'b']);
});
