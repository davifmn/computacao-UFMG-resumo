import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESCOLAS, ENFASES, randomQuestion } from '../periodo-02/administracao-tga/tutoriais/escolas.js';

test('dados das escolas são consistentes', () => {
  const ids = new Set();
  for (const e of ESCOLAS) {
    assert.ok(!ids.has(e.id)); ids.add(e.id);
    assert.ok(e.inicio < e.fim && e.inicio >= 1900 && e.fim <= 1990);
    assert.ok(e.autores.length && e.ideias.length >= 3 && e.criticas && e.computacao);
    for (const k of e.enfase) assert.ok(k in ENFASES);
  }
});

test('perguntas geradas têm 4 alternativas distintas e a correta na posição 0', () => {
  for (let i = 0; i < 100; i++) {
    const q = randomQuestion();
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.equal(q.options[0], ESCOLAS.find(e => e.id === q.escola).nome);
  }
});
