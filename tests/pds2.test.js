import { test } from 'node:test';
import assert from 'node:assert/strict';
import { polymorphismSteps, CODE, VTABLES } from '../periodo-02/programacao-e-desenvolvimento-de-software-2/visualizacoes/polimorfismo.js';
import { vectorSteps } from '../periodo-02/programacao-e-desenvolvimento-de-software-2/visualizacoes/vetor.js';

test('polimorfismo: saída e destruição corretas', () => {
  const steps = polymorphismSteps();
  const last = steps.at(-1);
  assert.deepEqual(last.output, ['círculo: 3.14159', 'forma: 6']);
  assert.ok(last.objects.every(o => o.state === 'freed'));
  const lines = CODE.split('\n').length;
  for (const s of steps) assert.ok(s.line >= 1 && s.line <= lines);
});

test('polimorfismo: Retangulo herda nome() de Forma na vtable', () => {
  assert.equal(VTABLES.Retangulo.find(([m]) => m === 'nome')[1], 'Forma::nome');
  assert.equal(VTABLES.Circulo.find(([m]) => m === 'nome')[1], 'Circulo::nome');
});

test('vetor: conteúdo final e capacidade', () => {
  for (const policy of ['dobra', 'soma1']) {
    for (const n of [1, 5, 9, 17]) {
      const last = vectorSteps(n, policy).at(-1);
      assert.equal(last.tam, n);
      assert.equal(last.blocks.length, 1, 'bloco antigo foi liberado');
      assert.deepEqual(last.blocks[0].cells.slice(0, n), Array.from({ length: n }, (_, i) => (i + 1) * 10));
      assert.equal(last.cap, policy === 'dobra' ? 2 ** Math.ceil(Math.log2(n)) : n);
    }
  }
});

test('vetor: dobrar é O(1) amortizado, somar 1 é O(n)', () => {
  const n = 20;
  const dobra = vectorSteps(n, 'dobra').at(-1);
  const soma1 = vectorSteps(n, 'soma1').at(-1);
  assert.ok(dobra.copies < 2 * n);
  assert.equal(soma1.copies, (n * (n - 1)) / 2);
});
