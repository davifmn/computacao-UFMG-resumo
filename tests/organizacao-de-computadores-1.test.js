import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../periodo-04/organizacao-de-computadores-1/visualizacoes/riscv.js';

test('codificação bate com o manual do RISC-V', () => {
  const cases = {
    'addi x1, x0, 5': 0x00500093, 'add x3, x1, x2': 0x002081b3, 'lw x5, 8(x2)': 0x00812283, 'sw x5, 8(x2)': 0x00512423,
    'beq x1, x2, 8': 0x00208463, 'jal x1, 16': 0x010000ef, 'lui x5, 0x12345': 0x123452b7, 'sub x1, x2, x3': 0x403100b3,
    'srai x1, x1, 3': 0x4030d093, 'bne x1, x2, -4': 0xfe209ee3, 'jalr x0, 0(x1)': 0x00008067,
  };
  for (const [asm, w] of Object.entries(cases)) assert.equal(R.encode(R.assemble(asm).instrs[0]), w, asm);
  // os campos desenhados remontam a palavra
  for (const asm of Object.keys(cases)) {
    const ins = R.assemble(asm).instrs[0];
    assert.equal(parseInt(R.fields(ins).map(f => f.bin).join(''), 2), R.encode(ins), asm);
  }
});

test('montador: rótulos, pseudoinstruções e erros', () => {
  const p = R.assemble('.data\nv: .word 1, 2\n.text\n  la t0, v\nloop: j loop\n  ret');
  assert.equal(p.instrs[0].text, `addi t0, zero, ${R.DATA_BASE}`);
  assert.equal(p.instrs[1].op, 'jal');
  assert.equal(p.instrs[1].imm, 0);
  assert.equal(p.instrs[2].text, 'jalr zero, 0(ra)');
  assert.throws(() => R.assemble('addi t0, t0, 5000'), /fora do alcance/);
  assert.throws(() => R.assemble('foo t0, t1'), /desconhecida/);
  assert.throws(() => R.assemble('add t0, t1, q9'), /registrador inválido/);
});

test('programas de exemplo dão o resultado esperado', () => {
  const soma = R.run(R.PROGRAMS.soma.src);
  assert.equal(soma.regs[10], 14);
  assert.equal(soma.mem.get(soma.prog.labels.get('soma')), 14);
  const fib = R.run(R.PROGRAMS.fib.src);
  const base = fib.prog.labels.get('fib');
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map(k => fib.mem.get(base + 4 * k)), [0, 1, 1, 2, 3, 5, 8, 13]);
  assert.equal(R.run(R.PROGRAMS.max.src).regs[10], 19);
  const f = R.run(R.PROGRAMS.funcao.src);
  assert.equal(f.mem.get(R.STACK_TOP - 4), 15);
  assert.equal(f.regs[0], 0, 'x0 continua zero');
  for (const { src } of Object.values(R.PROGRAMS)) assert.ok(R.run(src).steps.at(-1).done, 'termina');
});

test('controle e caminho de dados por classe', () => {
  const { steps } = R.run(R.PROGRAMS.soma.src);
  const lw = steps.find(s => s.ins?.op === 'lw');
  assert.deepEqual(lw.control, R.CONTROL.load);
  assert.ok(lw.path.includes('dm-wb') && !lw.path.includes('alu-wb'));
  const sw = steps.find(s => s.ins?.op === 'sw');
  assert.equal(sw.control.MemWrite, 1);
  assert.ok(!sw.path.includes('wb-reg'), 'store não escreve registrador');
  const taken = steps.find(s => s.kind === 'branch' && s.taken), notTaken = steps.find(s => s.kind === 'branch' && !s.taken);
  assert.ok(taken.path.includes('badd-mux') && notTaken.path.includes('add4-mux'));
});

test('pipeline: adiantamento, load-use e desvios', () => {
  const sched = (k, forwarding) => { const r = R.run(R.PIPE_PROGRAMS[k].src); return R.pipeline(r.trace, { forwarding, instrs: r.prog.instrs }); };
  const dep = sched('dependencias', true);
  assert.equal(dep.cycles, 6 + 4, 'sem bolhas: k + n − 1');
  assert.equal(dep.stalls, 0);
  assert.equal(sched('dependencias', false).stalls, 8);
  const lu = sched('loaduse', true);
  assert.equal(lu.stalls, 1, 'só o load-use para');
  assert.equal(lu.rows[2].hazards[0].load, true);
  const laco = sched('laco', true);
  assert.equal(laco.flushes, 2, 'um desvio tomado descarta 2 instruções');
  assert.equal(laco.cycles, 9 + 4 + 2);
  // nenhum ciclo tem dois estágios iguais ocupados por instruções reais
  for (const s of [dep, lu, laco, sched('laco', false), sched('loaduse', false)]) {
    for (let c = 1; c <= s.cycles; c++) {
      const st = s.rows.filter(r => !r.flushed).map(r => R.stageAt(r, c)).filter(Boolean).map(x => x.replace('*', ''));
      assert.equal(new Set(st).size, st.length, `ciclo ${c}`);
    }
  }
});

test('cache: localidade espacial, conflito e os 3 Cs', () => {
  const seq = Array.from({ length: 16 }, (_, i) => 4 * i);
  assert.equal(R.cacheSim(seq, { lines: 8, blockBytes: 16 }).hits, 12);
  const conf = [0, 128, 0, 128, 0, 128, 256, 0];
  assert.deepEqual(R.cacheSim(conf, { lines: 8, blockBytes: 16, ways: 1 }).counts, { compulsoria: 3, capacidade: 0, conflito: 5 });
  assert.equal(R.cacheSim(conf, { lines: 8, blockBytes: 16, ways: 8 }).counts.conflito, 0, 'totalmente associativa não tem conflito');
  const big = []; for (let k = 0; k < 2; k++) for (let i = 0; i < 40; i++) big.push(4 * i);
  assert.ok(R.cacheSim(big, { lines: 8, blockBytes: 16, ways: 8 }).counts.capacidade > 0);
  const s = R.cacheSim([1234], { lines: 8, blockBytes: 16, ways: 2 }).steps[1];
  assert.equal(s.off, 1234 % 16);
  assert.equal(s.idx, Math.floor(1234 / 16) % 4);
  assert.equal(s.tag, Math.floor(1234 / 64));
  assert.equal(s.tagBits + s.idxBits + s.offBits, 12);
});
