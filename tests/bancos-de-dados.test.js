import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { joinSteps } from '../periodo-03/introducao-a-bancos-de-dados/visualizacoes/joins.js';

test('tipos de JOIN produzem as linhas certas', () => {
  const kinds = t => joinSteps(t).at(-1).result.map(r => r.kind);
  assert.deepEqual(kinds('INNER'), ['match', 'match', 'match', 'match']);
  assert.deepEqual(kinds('LEFT').filter(k => k === 'leftonly').length, 1);
  assert.deepEqual(kinds('RIGHT').filter(k => k === 'rightonly').length, 1);
  assert.equal(kinds('FULL').length, 6);
});

test('exercícios de SQL estão bem formados', () => {
  const ex = JSON.parse(readFileSync('periodo-03/introducao-a-bancos-de-dados/tutoriais/exercicios-sql.json', 'utf8'));
  const ids = new Set();
  for (const e of ex) {
    assert.ok(!ids.has(e.id)); ids.add(e.id);
    assert.match(e.resposta, /^SELECT/i);
    assert.equal(typeof e.ordenado, 'boolean');
  }
});
