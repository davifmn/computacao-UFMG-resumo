import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Li from '../periodo-03/estruturas-de-dados/visualizacoes/listas.js';
import * as PF from '../periodo-03/estruturas-de-dados/visualizacoes/pilhafila.js';
import * as Ar from '../periodo-03/estruturas-de-dados/visualizacoes/arvores.js';
import { GENERATORS } from '../periodo-03/estruturas-de-dados/visualizacoes/ordenacao2.js';
import * as Hs from '../periodo-03/estruturas-de-dados/visualizacoes/hash.js';

test('lista encadeada: operações e casos-limite', () => {
  let l = Li.fromValues([3, 8, 15]);
  const apply = (op, x) => { const r = Li.run(op, l, x); l = r.list; return r; };
  apply('inicio', 1); apply('fim', 20); apply('ordenado', 10); apply('ordenado', 0); apply('ordenado', 99);
  assert.deepEqual(Li.toValues(l), [0, 1, 3, 8, 10, 15, 20, 99]);
  assert.equal(apply('busca', 15).result, true);
  assert.equal(apply('busca', 7).result, false);
  apply('remove', 0); apply('remove', 99); apply('remove', 10);
  assert.equal(apply('remove', 42).result, null);
  assert.deepEqual(Li.toValues(l), [1, 3, 8, 15, 20]);
  let e = { nodes: [], cabeca: null };
  e = Li.run('fim', e, 5).list;
  assert.deepEqual(Li.toValues(e), [5]);
  for (const s of Li.run('ordenado', l, 9).steps) assert.ok(s.line == null || s.line >= 1);
});

test('pilha e fila circular', () => {
  let s = PF.emptyStack();
  for (const v of [1, 2, 3]) s = PF.stackOp(s, 'push', v).state;
  assert.equal(PF.stackOp(s, 'noop').state.topo, 2);
  const pop = PF.stackOp(s, 'pop');
  assert.equal(pop.out, 3);
  assert.equal(PF.stackOp(PF.emptyStack(), 'pop').error, 'pilha vazia');
  let q = PF.emptyQueue();
  for (let i = 0; i < PF.MAX; i++) q = PF.queueOp(q, 'push', i).state;
  assert.equal(PF.queueOp(q, 'push', 99).error, 'fila cheia');
  for (let i = 0; i < 3; i++) { const r = PF.queueOp(q, 'pop'); assert.equal(r.out, i); q = r.state; }
  q = PF.queueOp(q, 'push', 77).state;
  assert.equal(q.fim, 1, 'fim deu a volta');
  assert.equal(q.items[0].v, 77);
});

test('parênteses balanceados', () => {
  for (const [e, ok] of [['{a[b(c)d]e}(f)', true], ['(()', false], ['([)]', false], ['', true], [')(', false]]) assert.equal(PF.isBalanced(e), ok, e);
});

test('ABB e AVL mantêm as invariantes sob operações aleatórias', () => {
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (const avl of [false, true]) {
    for (let t = 0; t < 60; t++) {
      let T = Ar.emptyTree(); const set = new Set();
      for (let k = 0; k < 40; k++) {
        const x = Math.floor(rnd() * 60);
        if (rnd() < 0.65) { T = Ar.insert(T, x, { avl }).tree; set.add(x); } else { T = Ar.remove(T, x, { avl }).tree; set.delete(x); }
        assert.ok(Ar.check(T, avl));
      }
      assert.deepEqual(Ar.inorderKeys(T), [...set].sort((a, b) => a - b));
    }
  }
  assert.equal(Ar.height(Ar.build([1, 2, 3, 4, 5, 6, 7], { avl: true })), 3);
  assert.equal(Ar.height(Ar.build([1, 2, 3, 4, 5, 6, 7])), 7);
});

test('percursos', () => {
  const T = Ar.build([50, 30, 70, 20, 40, 60, 80]);
  assert.deepEqual(Ar.traversal(T, 'preOrdem').output, [50, 30, 20, 40, 70, 60, 80]);
  assert.deepEqual(Ar.traversal(T, 'emOrdem').output, [20, 30, 40, 50, 60, 70, 80]);
  assert.deepEqual(Ar.traversal(T, 'posOrdem').output, [20, 40, 30, 60, 80, 70, 50]);
  assert.deepEqual(Ar.traversal(T, 'largura').output, [50, 30, 70, 20, 40, 60, 80]);
});

test('merge, quick e heapsort ordenam sem perder elementos', () => {
  for (const [name, gen] of Object.entries(GENERATORS)) {
    for (const v of [[5, 2, 9, 1, 7, 3], [1], [2, 1], [4, 4, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1]]) {
      const steps = gen(v);
      assert.deepEqual(steps.at(-1).items.map(x => x.v), [...v].sort((a, b) => a - b), name);
      for (const s of steps) assert.equal(s.items.filter(Boolean).length + s.aux.length, v.length);
    }
  }
});

test('tabela hash: encadeamento e sondagem linear com remoção', () => {
  for (const st of ['encadeamento', 'linear']) {
    let T = Hs.emptyTable(11, st);
    for (const k of [22, 33, 44, 5, 16, 27]) T = Hs.op(T, 'insere', k).table;
    T = Hs.op(T, 'remove', 33).table;
    assert.equal(Hs.op(T, 'busca', 44).result, true, `${st}: busca passa pela marca de removido`);
    assert.equal(Hs.op(T, 'busca', 33).result, false);
    assert.equal(Hs.count(T), 5);
  }
  let T = Hs.emptyTable(3, 'linear');
  for (const k of [1, 2, 3]) T = Hs.op(T, 'insere', k).table;
  assert.equal(Hs.op(T, 'insere', 4).result, false, 'tabela cheia');
});
