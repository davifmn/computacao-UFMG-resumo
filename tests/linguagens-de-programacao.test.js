import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../periodo-05/linguagens-de-programacao/visualizacoes/lambda.js';
import * as T from '../periodo-05/linguagens-de-programacao/visualizacoes/tipos.js';
import * as E from '../periodo-05/linguagens-de-programacao/visualizacoes/escopo.js';
import * as P from '../periodo-05/linguagens-de-programacao/visualizacoes/prolog.js';

const nf = (src, order = 'normal') => L.reduce(L.parse(src), { order, max: 3000 });

test('cálculo lambda: aritmética e lógica de Church', () => {
  for (let a = 0; a <= 3; a++) for (let b = 0; b <= 3; b++) {
    assert.equal(L.toInt(nf(`PLUS ${a} ${b}`).normal), a + b);
    assert.equal(L.toInt(nf(`MULT ${a} ${b}`).normal), a * b);
    assert.equal(L.toInt(nf(`SUB ${a} ${b}`).normal), Math.max(0, a - b));
  }
  assert.equal(L.toInt(nf('POW 2 3').normal), 8);
  assert.equal(L.toInt(nf('POW 0 2').normal), 0, 'λx.λx.x também é o zero');
  assert.equal(L.toInt(nf('FACT 3').normal), 6);
  assert.equal(L.show(nf('NOT TRUE').normal), 'λt.λf.f');
  assert.equal(L.toInt(nf('IF (ISZERO 0) 7 9').normal), 7);
  assert.equal(L.toInt(nf('FST (PAIR 1 2)').normal), 1);
});

test('cálculo lambda: captura, estratégias e parser', () => {
  assert.equal(L.show(nf('(λx.λy.x y) y').normal), "λy'.y y'");
  assert.equal(L.show(nf('(\\x y. y x) a (\\z.z)').normal), 'a');
  assert.equal(L.show(nf('K I OMEGA').normal), 'λx.x');
  assert.equal(nf('K I OMEGA', 'aplicativa').status, 'limite', 'ordem aplicativa não termina');
  assert.equal(L.toInt(nf('PLUS 2 3', 'aplicativa').normal), 5);
  assert.equal(L.show(L.parse('λx.x y z')), 'λx.x y z');
  assert.equal(L.show(L.parse('(f x) (g y)')), 'f x (g y)');
  assert.throws(() => L.parse('λ.x'), /variável/);
  assert.throws(() => L.parse('(x'), /esperava/);
});

test('Hindley-Milner: tipos principais e erros', () => {
  const want = {
    'fn x => x': "'a -> 'a",
    'fn x => fn y => x': "'a -> 'b -> 'a",
    'fn f => fn x => fn y => f y x': "('a -> 'b -> 'c) -> 'b -> 'a -> 'c",
    'fn p => (snd p, fst p)': "'a * 'b -> 'b * 'a",
    'fn l => hd l + 1': 'int list -> int',
  };
  for (const [src, ty] of Object.entries(want)) assert.equal(T.infer(src).type, ty, src);
  const ex = T.EXAMPLES;
  assert.equal(T.infer(ex.identidade).type, 'int * bool');
  assert.equal(T.infer(ex.compose).type, "('a -> 'b) -> ('c -> 'a) -> 'c -> 'b");
  assert.equal(T.infer(ex.map).type, "('a -> 'b) -> 'a list -> 'b list");
  assert.equal(T.infer(ex.soma).type, 'int list -> int');
  assert.equal(T.infer(ex.twice).type, 'int');
  assert.match(T.infer(ex.erro).error, /occurs check/);
  assert.match(T.infer(ex.ramos).error, /int.*bool/);
  assert.match(T.infer(ex.lambdaMono).error, /int.*bool/, 'parâmetro de fn é monomórfico');
  // linhas dos passos existem no programa
  const r = T.infer(ex.map);
  for (const s of r.steps) if (s.line != null) assert.ok(s.line >= 1 && s.line <= 4);
});

test('escopo estático × dinâmico', () => {
  const run = (k, scope, mode = 'valor') => E.run(E.EXAMPLES[k].src, { scope, mode }).output.join(' ');
  assert.equal(run('escopo', 'estatico'), '1 1');
  assert.equal(run('escopo', 'dinamico'), '2 1');
  assert.equal(run('aninhado', 'estatico'), '12 1');
  assert.equal(run('aninhado', 'dinamico'), '12 2');
});

test('passagem de parâmetros', () => {
  const run = (k, mode) => E.run(E.EXAMPLES[k].src, { scope: 'estatico', mode }).output.join(' ');
  assert.equal(run('passagem', 'valor'), '2 10');
  assert.equal(run('passagem', 'referencia'), '20 20');
  assert.equal(run('passagem', 'valor-resultado'), '2 2');
  assert.equal(run('passagem', 'nome'), '20 20');
  assert.equal(run('troca', 'valor'), '0 2 7');
  assert.equal(run('troca', 'referencia'), '2 0 7');
  assert.equal(run('troca', 'nome'), '2 2 0', 'v[i] é reavaliado depois que i mudou');
  const err = E.run('var v[2]\nv[5] = 1', {});
  assert.match(err.error, /fora/);
});

test('Prolog: respostas na ordem do interpretador', () => {
  const ans = k => P.runText(P.EXAMPLES[k].prog, P.EXAMPLES[k].query).answers;
  assert.deepEqual(ans('familia'), [{ Q: 'jaco' }, { Q: 'esau' }]);
  assert.deepEqual(ans('append').map(a => `${a.X}+${a.Y}`), ['[]+[1, 2, 3]', '[1]+[2, 3]', '[1, 2]+[3]', '[1, 2, 3]+[]']);
  assert.deepEqual(ans('fatorial'), [{ F: '6' }]);
  assert.deepEqual(ans('membro'), [{ C: 'verde' }, { C: 'azul' }]);
  const esq = P.runText(P.EXAMPLES.esquerda.prog, P.EXAMPLES.esquerda.query);
  assert.equal(esq.status, 'interrompida');
  assert.deepEqual(P.runText('p(a). p(b).', 'p(c)').answers, []);
});

test('Prolog: unificação', () => {
  const t = s => P.parseQuery(s)[0];
  const u = P.unify(t('f(X, b)'), t('f(a, Y)'), new Map());
  assert.equal(P.show(P.resolve(t('g(X, Y)'), u.s)), 'g(a, b)');
  assert.equal(P.unify(t('f(X)'), t('g(X)'), new Map()), null);
  assert.equal(P.unify(t('X'), t('f(X)'), new Map()), null, 'occurs check');
  const l = P.unify(t('[H | T]'), t('[1, 2, 3]'), new Map());
  assert.equal(P.show(P.resolve(t('p(H, T)'), l.s)), 'p(1, [2, 3])');
});
