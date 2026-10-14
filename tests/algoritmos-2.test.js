import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../periodo-05/algoritmos-2/visualizacoes/cadeias.js';
import * as Z from '../periodo-05/algoritmos-2/visualizacoes/compressao.js';
import * as G from '../periodo-05/algoritmos-2/visualizacoes/geometria.js';
import * as A from '../periodo-05/algoritmos-2/visualizacoes/aproximacao.js';

// gerador reprodutível
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

test('função de falha: exemplos do CLRS', () => {
  assert.deepEqual(C.failure('ABABCABAB'), [0, 0, 1, 2, 0, 1, 2, 3, 4]);
  assert.deepEqual(C.failure('AABAACAABAA'), [0, 1, 0, 1, 2, 0, 1, 2, 3, 4, 5]);
  assert.deepEqual(C.shiftTable('ROMA'), { R: 3, O: 2, M: 1 });
});

test('força bruta, KMP e Horspool acham as mesmas ocorrências', () => {
  const r = rng(3);
  for (let it = 0; it < 400; it++) {
    const sigma = 2 + Math.floor(r() * 2);
    const word = n => Array.from({ length: n }, () => 'ABC'[Math.floor(r() * sigma)]).join('');
    const t = word(1 + Math.floor(r() * 25)), p = word(1 + Math.floor(r() * Math.min(5, t.length)));
    const want = C.occurrences(t, p);
    for (const f of [C.naiveSteps, C.kmpSteps, C.horspoolSteps]) assert.deepEqual(f(t, p).at(-1).found, want, `${f.name}(${t}, ${p})`);
    assert.ok(C.comparisons(C.kmpSteps(t, p)) <= 2 * t.length, 'KMP faz no máximo 2n comparações na busca');
  }
  assert.equal(C.comparisons(C.naiveSteps('AAAAAAAAAA', 'AAAB')), 28);
  assert.equal(C.comparisons(C.kmpSteps('AAAAAAAAAA', 'AAAB')), 17);
});

test('Huffman: ótimo, livre de prefixo e perto da entropia', () => {
  const last = Z.huffmanSteps('ABRACADABRA').at(-1);
  assert.equal(last.bits, 23);
  const clrs = 'A'.repeat(45) + 'B'.repeat(13) + 'C'.repeat(12) + 'D'.repeat(16) + 'E'.repeat(9) + 'F'.repeat(5);
  assert.equal(Z.huffmanSteps(clrs).at(-1).bits, 224);
  for (const s of ['O RATO ROEU A ROUPA DO REI DE ROMA', 'AAAAAB', 'ABCDEFGH', clrs]) {
    const codes = Object.values(Z.huffmanCodes(s));
    for (const a of codes) for (const b of codes) if (a !== b) assert.ok(!b.startsWith(a), `${a} é prefixo de ${b}`);
    const avg = Z.huffmanSteps(s).at(-1).bits / s.length, H = Z.entropy(s);
    assert.ok(H <= avg + 1e-9 && avg < H + 1, `${s}: H = ${H}, média = ${avg}`);
  }
});

test('LZW: exemplo clássico e ida e volta', () => {
  assert.deepEqual(Z.lzwEncode('TOBEORNOTTOBEORTOBEORNOT'), [84, 79, 66, 69, 79, 82, 78, 79, 84, 256, 258, 260, 265, 259, 261, 263]);
  for (const s of ['abababababab', 'aaaaaaaaaaaa', 'O RATO ROEU A ROUPA', 'x', 'ABRACADABRA']) assert.equal(Z.lzwDecode(Z.lzwEncode(s)), s);
});

test('envoltória: Andrew = Jarvis, convexa e contendo todos os pontos', () => {
  const r = rng(11);
  for (let it = 0; it < 150; it++) {
    const pts = G.randomPoints(4 + (it % 15), r).sort((a, b) => a.x - b.x || a.y - b.y);
    const h1 = G.andrewSteps(pts).at(-1).hull, h2 = G.jarvisSteps(pts).at(-1).hull;
    assert.deepEqual(h1, h2);
    const P = h1.map(i => pts[i]);
    for (let k = 0; k < P.length; k++) {
      const [a, b] = [P[k], P[(k + 1) % P.length]];
      for (const q of pts) assert.ok(G.cross(a, b, q) >= 0, 'todo ponto à esquerda de cada aresta');
    }
  }
  assert.ok(G.segmentsIntersect({ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }, { x: 4, y: 0 }));
  assert.ok(!G.segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }));
});

test('aproximações respeitam o fator 2', () => {
  const P = A.PRESETS.cobertura;
  const last = A.vertexCoverSteps(P.n, P.edges).at(-1);
  const C1 = [...Array(P.n).keys()].filter(u => last.inC[u]);
  assert.ok(P.edges.every(([u, v]) => C1.includes(u) || C1.includes(v)), 'é cobertura');
  assert.ok(C1.length <= 2 * last.opt.length);
  const r = rng(5);
  for (let it = 0; it < 40; it++) {
    const pts = Array.from({ length: 5 + (it % 3) }, () => ({ x: Math.floor(r() * 500), y: Math.floor(r() * 400) }));
    const st = A.tspSteps(pts).at(-1);
    assert.equal(new Set(st.rota).size, pts.length, 'rota visita todas as cidades');
    assert.ok(A.tourLength(pts, st.rota) <= 2 * A.optimalTour(pts).len + 1e-9);
  }
});
