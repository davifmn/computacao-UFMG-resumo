import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../periodo-06/compiladores-1/visualizacoes/comp.js';

test('léxico: maior casamento e palavras reservadas', () => {
  const t = C.tokenize('if(x>=10)y=y+1; // fim');
  assert.deepEqual(t.map(x => x.tipo), ['PALAVRA', 'PONT', 'ID', 'OP', 'NUM', 'PONT', 'ID', 'ATRIB', 'ID', 'OP', 'NUM', 'PONT']);
  assert.equal(C.tokenize('iffy')[0].tipo, 'ID');
  assert.equal(C.tokenize('a==b').length, 3);
  assert.equal(C.tokenize('x # y').find(x => x.tipo === 'ERRO').lexema, '#');
});

test('FIRST e FOLLOW do livro do Dragão', () => {
  const G = C.parseGrammar(C.GRAMMARS.expr_ll.text);
  const T = C.llTable(G);
  const set = s => [...s].sort();
  assert.deepEqual(set(T.F.E), ['(', 'id']);
  assert.deepEqual(set(T.F["E'"]), ['+', 'ε']);
  assert.deepEqual(set(T.FO.E), ['$', ')']);
  assert.deepEqual(set(T.FO.T), ['$', ')', '+']);
  assert.deepEqual(set(T.FO.F), ['$', ')', '*', '+']);
  assert.equal(T.conflicts.length, 0);
  assert.equal(C.llTable(C.parseGrammar(C.GRAMMARS.expr_lr.text)).conflicts.length > 0, true, 'recursão à esquerda não é LL(1)');
});

test('LL(1) e SLR aceitam e rejeitam as mesmas frases', () => {
  const Gll = C.parseGrammar(C.GRAMMARS.expr_ll.text), Glr = C.parseGrammar(C.GRAMMARS.expr_lr.text);
  for (const [s, ok] of [['a + b * c', true], ['( a + b ) * c', true], ['a', true], ['a + * b', false], ['( a', false], ['a b', false], ['', false]]) {
    assert.equal(!C.llSteps(Gll, s).at(-1).error, ok, `LL: "${s}"`);
    assert.equal(C.slrSteps(Glr, s).at(-1).act === 'acc', ok, `SLR: "${s}"`);
  }
  const T = C.slrTable(Glr);
  assert.equal(T.states.length, 12);
  assert.equal(T.conflicts.length, 0);
});

test('else pendente gera conflitos; parênteses balanceados não', () => {
  const G = C.parseGrammar(C.GRAMMARS.stmt.text);
  assert.ok(C.llTable(G).conflicts.length > 0);
  assert.ok(C.slrTable(G).conflicts.length > 0);
  const P = C.parseGrammar(C.GRAMMARS.parenteses.text);
  assert.equal(C.llTable(P).conflicts.length, 0);
  assert.equal(C.slrTable(P).conflicts.length, 0);
  assert.ok(!C.llSteps(P, '( ( ) ) ( )').at(-1).error);
  assert.ok(C.llSteps(P, '( ( )').at(-1).error);
});

test('código de três endereços se comporta como a árvore', () => {
  for (const p of Object.values(C.PROGRAMS)) {
    const ast = C.parseProgram(p.src);
    const want = C.evalAST(ast, p.env);
    for (const a of [ast, C.fold(ast)]) {
      const got = C.runTAC(C.tacSteps(a).code, p.env);
      assert.deepEqual(got.out, want.out);
      for (const k of Object.keys(want.vars)) assert.equal(got.vars[k], want.vars[k]);
    }
  }
  assert.equal(C.evalAST(C.parseProgram(C.PROGRAMS.expr.src), C.PROGRAMS.expr.env).vars.x, 43);
  assert.deepEqual(C.evalAST(C.parseProgram(C.PROGRAMS.mdc.src), C.PROGRAMS.mdc.env).out, [12]);
  assert.deepEqual(C.tacSteps(C.fold(C.parseProgram('y = 2 * 3 + x;'))).code, ['t1 = 6 + x', 'y = t1']);
  assert.throws(() => C.parseProgram('x = ;'), /não esperava/);
});
