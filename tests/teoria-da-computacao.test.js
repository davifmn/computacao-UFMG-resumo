import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../periodo-04/fundamentos-da-teoria-da-computacao/visualizacoes/automatos.js';

const P = A.FA_PRESETS;
function* words(alpha, max) {
  for (let n = 0; n <= max; n++) {
    const idx = Array(n).fill(0);
    for (;;) {
      yield idx.map(i => alpha[i]).join('');
      let k = n - 1;
      while (k >= 0 && ++idx[k] === alpha.length) idx[k--] = 0;
      if (k < 0) break;
    }
  }
}

test('simulação dos autômatos de exemplo', () => {
  for (const w of words(['0', '1'], 8)) {
    assert.equal(A.accepts(P.mod3, w), w === '' || parseInt(w, 2) % 3 === 0, `mod3 ${w}`);
    assert.equal(A.accepts(P.termina01, w), w.endsWith('01'), `termina01 ${w}`);
    assert.equal(A.accepts(P.terceiro, w), w.length >= 3 && w.at(-3) === '1', `terceiro ${w}`);
  }
  for (const w of words(['a', 'b'], 8)) {
    const na = [...w].filter(c => c === 'a').length;
    assert.equal(A.accepts(P.par, w), na % 2 === 0 && (w.length - na) % 2 === 0);
  }
  for (const w of words(['a', 'b', 'c'], 5)) assert.equal(A.accepts(P.epsilon, w), /^(a*b*|c)$/.test(w), `epsilon ${w}`);
  for (const [k, M] of Object.entries(P)) assert.ok(A.accepts(M, M.exemplo), `exemplo de ${k}`);
});

test('construção de subconjuntos preserva a linguagem', () => {
  for (const k of ['termina01', 'terceiro', 'epsilon']) {
    const { dfa } = A.subsetConstruction(P[k]);
    assert.ok(A.isDFA(dfa), k);
    for (const w of words(P[k].alphabet, 6)) assert.equal(A.accepts(dfa, w), A.accepts(P[k], w), `${k} ${w}`);
  }
  assert.equal(A.subsetConstruction(P.terceiro).dfa.states.length, 8, '2³ estados');
});

test('minimização', () => {
  const { min } = A.minimize(P.redundante);
  assert.equal(min.states.length, 3);
  for (const w of words(['0', '1'], 7)) assert.equal(A.accepts(min, w), A.accepts(P.redundante, w));
  assert.equal(A.minimize(P.mod3).min.states.length, 3, 'já mínimo');
  assert.equal(A.minimize(A.subsetConstruction(P.terceiro).dfa).min.states.length, 8);
});

test('Thompson bate com RegExp em todas as palavras curtas', () => {
  for (const re of ['(a|b)*abb', 'a*b*', '(ab|c)+', 'a?b', '((a|b)(a|b))*', '(a|bc)*c?', 'ε', 'a(b|ε)c']) {
    const { nfa, layout } = A.thompson(A.parseRegex(re));
    const js = new RegExp(`^(?:${re.replaceAll('ε', '')})$`);
    for (const w of words(['a', 'b', 'c'], 5)) {
      const M = { ...nfa, alphabet: ['a', 'b', 'c'] };
      assert.equal(A.accepts(M, w), js.test(w), `${re} com "${w}"`);
    }
    for (const q of nfa.states) assert.ok(layout[q], `${re}: estado ${q} sem posição`);
  }
  assert.equal(A.regexToString(A.parseRegex('(a|b)*abb')), '(a|b)*abb');
  assert.throws(() => A.parseRegex('(ab'), /falta/);
  assert.throws(() => A.parseRegex('a|*'), /inesperado/);
});

test('autômato de pilha', () => {
  const ok = (k, w) => A.runPDA(A.PDA_PRESETS[k], w).at(-1).result;
  for (const w of words(['a', 'b'], 8)) { const n = w.length / 2; assert.equal(ok('anbn', w), w === 'a'.repeat(n) + 'b'.repeat(n), w); }
  for (const w of words(['(', ')'], 8)) {
    let lvl = 0, bal = true;
    for (const c of w) { lvl += c === '(' ? 1 : -1; if (lvl < 0) bal = false; }
    assert.equal(ok('parenteses', w), bal && lvl === 0, w);
  }
  for (const w of words(['a', 'b', 'c'], 5)) {
    const i = w.indexOf('c');
    const want = i >= 0 && w.indexOf('c', i + 1) < 0 && w.slice(i + 1) === [...w.slice(0, i)].reverse().join('');
    assert.equal(ok('wcw', w), want, w);
  }
});

test('máquinas de Turing', () => {
  const T = A.TM_PRESETS;
  const halt = (k, w) => A.runTM(T[k], w).at(-1).halt;
  for (const w of words(['0', '1'], 7)) {
    assert.equal(halt('palindromo', w), w === [...w].reverse().join('') ? 'aceita' : 'rejeita', w);
    const out = A.tapeString(A.runTM(T.incremento, w).at(-1).tape);
    assert.equal(parseInt(out, 2), (w ? parseInt(w, 2) : 0) + 1, `incremento ${w}`);
  }
  for (const w of words(['a', 'b'], 7)) { const n = w.length / 2; assert.equal(halt('anbn', w), w === 'a'.repeat(n) + 'b'.repeat(n) ? 'aceita' : 'rejeita', w); }
  for (const w of words(['a', 'b', 'c'], 6)) { const n = w.length / 3; assert.equal(halt('anbncn', w), w === 'a'.repeat(n) + 'b'.repeat(n) + 'c'.repeat(n) ? 'aceita' : 'rejeita', w); }
});
