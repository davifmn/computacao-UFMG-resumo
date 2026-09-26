import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parse, show, classify, equivalent, truthTable, canonicalDNF, canonicalCNF, evaluationSteps, randomClassified,
} from '../periodo-01/introducao-a-logica-computacional/visualizacoes/logica.js';

test('parser aceita notações alternativas', () => {
  assert.equal(show(parse('~p & q -> r')), '(¬p ∧ q) → r');
  assert.equal(show(parse('!(p | q) <-> (!p && !q)')), '¬(p ∨ q) ↔ (¬p ∧ ¬q)');
  assert.equal(show(parse('p -> q -> r')), 'p → (q → r)', 'implicação associa à direita');
});

test('parser dá mensagens de erro úteis', () => {
  assert.throws(() => parse('p q'), /Faltou um operador/);
  assert.throws(() => parse('(p & q'), /Esperava "\)"/);
  assert.throws(() => parse('p & $'), /Símbolo inesperado/);
  assert.throws(() => parse(''), /Digite/);
});

test('show(parse(show(f))) é estável', () => {
  for (const s of ['((p → q) ∧ p) → q', 'p ∧ (q ∨ r)', '¬¬p', 'a ∧ b ∧ c', '(p ↔ q) ⊕ r']) {
    const once = show(parse(s));
    assert.equal(show(parse(once)), once);
  }
});

test('classificação', () => {
  assert.equal(classify(parse('p ∨ ¬p')), 'tautologia');
  assert.equal(classify(parse('((p → q) ∧ p) → q')), 'tautologia');
  assert.equal(classify(parse('p ∧ ¬p')), 'contradição');
  assert.equal(classify(parse('p → q')), 'contingência');
});

test('equivalências clássicas', () => {
  assert.ok(equivalent(parse('¬(p ∧ q)'), parse('¬p ∨ ¬q')));
  assert.ok(equivalent(parse('p → q'), parse('¬q → ¬p')));
  assert.ok(equivalent(parse('p → q'), parse('¬p ∨ q')));
  assert.ok(!equivalent(parse('p → q'), parse('q → p')));
});

test('formas normais canônicas são equivalentes à fórmula', () => {
  for (const s of ['p → q', '(p ∨ q) ∧ ¬r', 'p ↔ q', 'p ⊕ q']) {
    const f = parse(s);
    assert.ok(equivalent(f, parse(canonicalDNF(f))), `FND de ${s}`);
    assert.ok(equivalent(f, parse(canonicalCNF(f))), `FNC de ${s}`);
  }
});

test('tabela-verdade tem 2^n linhas, começando por tudo V', () => {
  const { rows, vars } = truthTable(parse('p ∧ q ∧ r'));
  assert.equal(rows.length, 8);
  assert.deepEqual(vars, ['p', 'q', 'r']);
  assert.equal(rows[0].result, true);
  assert.ok(rows.slice(1).every(r => !r.result));
});

test('passos de avaliação cobrem todos os nós em todas as linhas', () => {
  const f = parse('(p → q) ∧ p');
  const steps = evaluationSteps(f);
  assert.equal(steps.length, 4 * 5);
  assert.ok(steps.filter(s => s.done).length === 4);
});

test('gerador de exercícios devolve a classe correta', () => {
  for (let i = 0; i < 200; i++) {
    const { formula, cls } = randomClassified();
    assert.equal(classify(formula), cls);
  }
});
