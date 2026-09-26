import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, evaluate, truthTable } from '../periodo-02/introducao-a-sistemas-logicos/visualizacoes/circuitos.js';
import { minimize, sopText, parseSOP, rectsOf, randomFunction, primeImplicants } from '../periodo-02/introducao-a-sistemas-logicos/visualizacoes/karnaugh.js';
import { srLatch, clock, timing, counterNext, bitsToInt } from '../periodo-02/introducao-a-sistemas-logicos/visualizacoes/sequenciais.js';

test('somador completo: 2·cout + s = a + b + cin', () => {
  for (const r of truthTable(PRESETS.completo).rows) {
    const { A, B, Cin } = r.inputs;
    assert.equal(2 * r.outputs.Cout + r.outputs.S, A + B + Cin);
  }
});

test('somador de 4 bits soma corretamente todas as 512 entradas', () => {
  for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) for (let c = 0; c < 2; c++) {
    const inputs = { C0: c };
    for (let i = 0; i < 4; i++) { inputs[`A${i}`] = (a >> i) & 1; inputs[`B${i}`] = (b >> i) & 1; }
    const { out } = evaluate(PRESETS.ripple, inputs);
    let s = out.get('C4:in') << 4;
    for (let i = 0; i < 4; i++) s |= out.get(`S${i}:in`) << i;
    assert.equal(s, a + b + c);
  }
});

test('NAND universal, mux e decodificador', () => {
  for (const r of truthTable(PRESETS.nand).rows) {
    const { A, B } = r.inputs;
    assert.deepEqual([r.outputs.oNOT, r.outputs.oAND, r.outputs.oOR], [A ^ 1, A & B, A | B]);
  }
  for (const r of truthTable(PRESETS.mux).rows) assert.equal(r.outputs.Y, r.inputs.S ? r.inputs.I1 : r.inputs.I0);
  for (const r of truthTable(PRESETS.decoder).rows) {
    const k = r.inputs.A1 * 2 + r.inputs.A0;
    [0, 1, 2, 3].forEach(j => assert.equal(r.outputs[`Y${j}`], j === k ? 1 : 0));
  }
});

test('todos os circuitos prontos avaliam sem ciclos', () => {
  for (const c of Object.values(PRESETS)) assert.ok(truthTable(c).rows.length > 0);
});

test('Karnaugh: exemplos clássicos', () => {
  assert.equal(sopText(minimize(4, [0, 2, 8, 10]), 4), "B'D'");
  assert.equal(sopText(minimize(3, [1, 3, 5, 7]), 3), 'C');
  assert.equal(sopText(minimize(3, []), 3), '0');
  assert.equal(sopText(minimize(2, [0, 1, 2, 3]), 2), '1');
  const r = minimize(4, [4, 8, 10, 11, 12, 15], [9, 14]);
  assert.equal(r.terms.length, 3);
});

test('Karnaugh: resultado é equivalente e usa só implicantes primos (funções aleatórias)', () => {
  for (let t = 0; t < 300; t++) {
    const n = 2 + (t % 3);
    const cells = randomFunction(n, { dc: true });
    const ones = [], dcs = [];
    cells.forEach((c, i) => (c === 1 ? ones.push(i) : c === 'x' && dcs.push(i)));
    const res = minimize(n, ones, dcs);
    const tab = parseSOP(sopText(res, n), n);
    cells.forEach((c, i) => { if (c !== 'x') assert.equal(tab[i], c); });
    const primes = primeImplicants(n, ones, dcs).map(p => `${p.v}/${p.m}`);
    for (const term of res.terms) assert.ok(primes.includes(`${term.v}/${term.m}`));
  }
});

test('Karnaugh: grupo dos quatro cantos vira quatro retângulos', () => {
  const [term] = minimize(4, [0, 2, 8, 10]).terms;
  assert.equal(rectsOf(term, 4).length, 4);
});

test('parseSOP aceita notações e rejeita lixo', () => {
  assert.deepEqual(parseSOP("~a b + a c'", 3), [0, 0, 1, 1, 1, 0, 1, 0]);
  assert.throws(() => parseSOP('A + E', 3), /não existe|inválido/);
});

test('latch SR guarda o estado', () => {
  let q = srLatch(1, 0, 0).Q;
  assert.equal(q, 1);
  assert.equal(srLatch(0, 0, q).Q, 1, 'mantém após soltar o set');
  assert.equal(srLatch(0, 1, q).Q, 0);
  assert.equal(srLatch(1, 1, 0).state, 'proibido');
});

test('latch D × flip-flop D', () => {
  const clk = clock(16, 8);                  // borda de subida em t = 4 e t = 12
  const d = Array(16).fill(0);
  d[5] = 1;                                  // pulso com o clock alto, sem borda
  const { latch, ff } = timing(clk, d);
  assert.equal(latch[5], 1, 'o latch deixa passar');
  assert.ok(ff.every(v => v === 0), 'o flip-flop não vê o pulso');
});

test('contador síncrono conta módulo 8 nos dois sentidos', () => {
  let q = [0, 0, 0];
  for (let k = 1; k <= 16; k++) { q = counterNext(q).next; assert.equal(bitsToInt(q), k % 8); }
  q = [0, 0, 0];
  q = counterNext(q, { down: true }).next;
  assert.equal(bitsToInt(q), 7);
});
