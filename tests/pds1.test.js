import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENERATORS } from '../periodo-01/programacao-e-desenvolvimento-de-software-1/visualizacoes/ordenacao.js';
import { binariaSteps, sequencialSteps } from '../periodo-01/programacao-e-desenvolvimento-de-software-1/visualizacoes/busca.js';
import { recursionSteps, layoutTree } from '../periodo-01/programacao-e-desenvolvimento-de-software-1/visualizacoes/recursao.js';
import { pointerSteps, CODE } from '../periodo-01/programacao-e-desenvolvimento-de-software-1/visualizacoes/ponteiros.js';

const values = (step) => step.items.map(x => x.v);

test('ordenação: todos os algoritmos terminam com o vetor ordenado', () => {
  const cases = [[5, 2, 9, 1, 7], [1, 2, 3], [3, 2, 1], [4, 4, 1, 4], [42], [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]];
  for (const [name, gen] of Object.entries(GENERATORS)) {
    for (const arr of cases) {
      const steps = gen(arr);
      const last = steps.at(-1);
      assert.deepEqual(values(last), [...arr].sort((a, b) => a - b), `${name} ${arr}`);
      assert.equal(last.sorted.length, arr.length, `${name}: todos marcados como ordenados`);
      for (const s of steps) assert.ok(Number.isInteger(s.line) && s.line > 0, `${name}: linha válida`);
    }
  }
});

test('ordenação: cada elemento mantém id estável (permite animar trocas)', () => {
  const steps = GENERATORS.bubble([3, 1, 2]);
  for (const s of steps) assert.deepEqual(s.items.map(x => x.id).sort(), [0, 1, 2]);
});

test('bubble sort para cedo em vetor ordenado', () => {
  const last = GENERATORS.bubble([1, 2, 3, 4, 5]).at(-1);
  assert.equal(last.vars['comparações'], 4);
});

test('busca binária encontra todos os elementos e rejeita ausentes', () => {
  const v = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  v.forEach((x, i) => assert.equal(binariaSteps(v, x).at(-1).found, i));
  for (const x of [0, 3, 100]) assert.equal(binariaSteps(v, x).at(-1).found, -1);
  v.forEach((x, i) => assert.equal(sequencialSteps(v, x).at(-1).found, i));
});

test('busca binária faz no máximo floor(log2 n) + 1 comparações', () => {
  const v = Array.from({ length: 100 }, (_, i) => i * 2);
  for (let x = -1; x < 202; x++) assert.ok(binariaSteps(v, x).at(-1).vars['comparações'] <= 7);
});

test('recursão: resultados e número de chamadas', () => {
  const fat = recursionSteps('fatorial', 5).at(-1);
  assert.equal(fat.nodes[0].ret, 120);
  assert.equal(fat.nodes.length, 5);
  const fib = recursionSteps('fib', 6).at(-1);
  assert.equal(fib.nodes[0].ret, 8);
  assert.equal(fib.nodes.length, 25);           // C(n) = C(n-1) + C(n-2) + 1
  const memo = recursionSteps('fibMemo', 6).at(-1);
  assert.equal(memo.nodes[0].ret, 8);
  assert.ok(memo.nodes.length < fib.nodes.length);
  assert.equal(fib.stack.length, 0, 'pilha vazia ao final');
});

test('recursão: layout coloca cada pai entre seus filhos', () => {
  const { nodes } = recursionSteps('fib', 4).at(-1);
  const { pos } = layoutTree(nodes);
  for (const n of nodes) {
    const kids = nodes.filter(k => k.parent === n.id).map(k => pos.get(k.id).x);
    if (kids.length) assert.ok(pos.get(n.id).x >= Math.min(...kids) && pos.get(n.id).x <= Math.max(...kids));
  }
});

test('ponteiros: roteiro consistente com o programa', () => {
  const steps = pointerSteps();
  const lines = CODE.split('\n').length;
  for (const s of steps) assert.ok(s.line >= 1 && s.line <= lines);
  const cell = (s, k) => s.cells.find(c => c.key === k);
  const afterDeref = steps.find(s => s.deref === 'p');
  assert.equal(cell(afterDeref, 'x').value, 30);
  const last = steps.at(-1);
  assert.equal(cell(last, 'v1').value, 99);
  assert.equal(cell(last, 'h').value, 'nullptr');
  assert.equal(cell(last, 'heap'), undefined, 'bloco do heap foi liberado');
});
