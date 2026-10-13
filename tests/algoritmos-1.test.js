import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Gr from '../periodo-04/algoritmos-1/visualizacoes/grafos.js';
import * as PD from '../periodo-04/algoritmos-1/visualizacoes/pd.js';

const { PRESETS: P } = Gr;

// Grafo aleatório reprodutível
function randomGraph(seed, n, m, { directed = true, minW = 0, maxW = 9 } = {}) {
  let s = seed;
  const r = k => (s = (s * 1103515245 + 12345) % 2147483648) % k;
  const edges = [];
  for (let k = 0; k < m; k++) edges.push([r(n), r(n), minW + r(maxW - minW + 1)]);
  return { names: [...Array(n).keys()].map(String), pos: Array(n).fill([0, 0]), edges, directed };
}

test('BFS: distâncias em número de arestas', () => {
  const s = Gr.bfsSteps(P.bairro, 0);
  assert.deepEqual(s.at(-1).dist, [0, 1, 1, 2, 1, 2, 3, 3]);
  assert.equal(s.at(-1).tree.length, 7, 'árvore de BFS tem V − 1 arestas');
  assert.ok(s.at(-1).cor.every(c => c === 'preto'));
});

test('DFS: tempos e classificação do CLRS (fig. 22.4)', () => {
  const last = Gr.dfsSteps(P.ciclo).at(-1);
  assert.deepEqual(last.d, [1, 2, 9, 4, 3, 10]);
  assert.deepEqual(last.f, [8, 7, 12, 5, 6, 11]);
  assert.equal(last.kinds['3-1'], 'retorno');
  assert.equal(last.kinds['0-3'], 'avanco');
  assert.equal(last.kinds['2-4'], 'cruzamento');
  assert.equal(last.kinds['5-5'], 'retorno', 'laço é aresta de retorno');
  // teorema dos parênteses
  for (let u = 0; u < 6; u++) for (let v = 0; v < 6; v++) {
    const [a, b, c, d] = [last.d[u], last.f[u], last.d[v], last.f[v]];
    assert.ok(b < c || d < a || (a <= c && d <= b) || (c <= a && b <= d));
  }
});

test('ordenação topológica respeita todas as arestas; ciclo dá null', () => {
  const ord = Gr.topoOrder(P.roupas);
  const pos = new Map(ord.map((v, i) => [v, i]));
  for (const [u, v] of P.roupas.edges) assert.ok(pos.get(u) < pos.get(v));
  assert.equal(Gr.topoOrder(P.ciclo), null);
  const undirectedKinds = Object.values(Gr.dfsSteps(P.bairro).at(-1).kinds);
  assert.ok(undirectedKinds.every(k => k === 'arvore' || k === 'retorno'), 'não direcionado: só árvore e retorno');
});

test('Dijkstra = Bellman-Ford com pesos ≥ 0', () => {
  assert.deepEqual(Gr.dijkstraSteps(P.cidades).at(-1).dist, [0, 8, 9, 5, 7]);
  for (let seed = 1; seed <= 150; seed++) {
    const G = randomGraph(seed, 2 + (seed % 9), 3 * (2 + (seed % 9)));
    assert.deepEqual(Gr.dijkstraSteps(G).at(-1).dist, Gr.bellmanFordSteps(G).at(-1).dist, `semente ${seed}`);
  }
});

test('aresta negativa: Dijkstra erra, Bellman-Ford acerta; ciclo negativo é detectado', () => {
  const dj = Gr.dijkstraSteps(P.negativa);
  assert.deepEqual(dj.at(-1).dist, [0, 2, 5, 3, 6]);
  assert.ok(dj.some(s => s.bad), 'a página aponta o momento do erro');
  const bf = Gr.bellmanFordSteps(P.negativa).at(-1);
  assert.deepEqual(bf.dist, [0, 1, 5, 2, 5]);
  assert.equal(bf.negCycle, false);
  assert.equal(Gr.bellmanFordSteps(P.cicloNeg).at(-1).negCycle, true);
});

test('Kruskal e Prim: mesma árvore de peso mínimo', () => {
  const k = Gr.kruskalSteps(P.rede).at(-1), p = Gr.primSteps(P.rede).at(-1);
  assert.equal(k.total, 37);
  assert.equal(p.total, 37);
  assert.equal(k.tree.length, 8);
  assert.equal(Gr.weightOf(P.rede, k.tree), 37);
  for (let seed = 1; seed <= 100; seed++) {
    const n = 2 + (seed % 10);
    const G = randomGraph(seed, n, 2 * n, { directed: false, minW: 1, maxW: 30 });
    for (let v = 1; v < n; v++) G.edges.push([v - 1, v, 31 + v]);   // garante conexo
    G.edges = G.edges.filter(([u, v]) => u !== v);
    assert.equal(Gr.kruskalSteps(G).at(-1).total, Gr.primSteps(G, seed % n).at(-1).total, `semente ${seed}`);
  }
});

test('mochila 0/1, LCS e distância de edição', () => {
  const items = [{ nome: 'A', p: 1, v: 1 }, { nome: 'B', p: 3, v: 4 }, { nome: 'C', p: 4, v: 5 }, { nome: 'D', p: 5, v: 7 }];
  const k = PD.knapsackSteps(items, 7).at(-1);
  assert.equal(k.T[4][7], 9);
  assert.deepEqual(k.chosen, [1, 2]);
  // força bruta
  for (let W = 0; W <= 12; W++) {
    let best = 0;
    for (let m = 0; m < 16; m++) {
      const sel = items.filter((_, i) => m >> i & 1);
      if (sel.reduce((s, it) => s + it.p, 0) <= W) best = Math.max(best, sel.reduce((s, it) => s + it.v, 0));
    }
    const last = PD.knapsackSteps(items, W).at(-1);
    assert.equal(last.T[4][W], best);
    assert.ok(last.chosen.reduce((s, i) => s + items[i].p, 0) <= W);
  }
  const l = PD.lcsSteps('ABCBDAB', 'BDCABA').at(-1);
  assert.equal(l.result.length, 4);
  assert.equal(PD.editSteps('kitten', 'sitting').at(-1).T[6][7], 3);
  assert.equal(PD.editSteps('GATO', 'PATOS').at(-1).ops.length, 2);
  assert.equal(PD.editSteps('', 'abc').at(-1).T[0][3], 3);
});

test('teorema mestre', () => {
  const cases = [[1, 2, 0, 2, '\\log n'], [2, 2, 1, 2, 'n \\log n'], [8, 2, 2, 1, 'n^{3}'], [2, 2, 2, 3, 'n^{2}'], [3, 2, 1, 1, 'n^{1{,}58}'], [4, 2, 2, 2, 'n^{2} \\log n']];
  for (const [a, b, c, caso, theta] of cases) {
    const m = PD.master(a, b, c);
    assert.equal(m.caso, caso, `${a},${b},${c}`);
    assert.equal(m.theta, theta);
  }
  const m = PD.master(2, 2, 1, 1024);
  assert.equal(m.levels.length, 11);
  assert.ok(m.levels.every(l => l.cost === 1024), 'caso 2: todos os níveis custam n');
});
