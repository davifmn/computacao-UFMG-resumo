import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../periodo-07/introducao-a-inteligencia-artificial/visualizacoes/snake.js';

const media = (criar, n = 6, opts = {}) => {
  let s = 0;
  for (let k = 1; k <= n; k++) s += S.jogarPartida(criar, { semente: k, sementeAgente: k, ...opts }).comidos;
  return s / n;
};

test('regras: crescer, cauda, parede, meia-volta e toro', () => {
  const j = S.novoJogo({ w: 8, h: 6, semente: 3 });
  assert.equal(j.corpo.length, 3);
  assert.ok(!j.corpo.includes(j.comidas[0]), 'comida fora do corpo');
  j.comidas = [j.corpo[0] + 1];
  S.passo(j, 1);
  assert.equal(j.corpo.length, 4, 'comeu e cresceu');
  assert.equal(j.comidos, 1);
  assert.equal(j.comidas.length, 1, 'nova comida sorteada');
  S.passo(j, 3);
  assert.equal(j.dir, 1, 'meia-volta é ignorada');
  // andar em quadrado: a cabeça entra onde estava a cauda (que saiu no mesmo passo)
  const q = S.novoJogo({ w: 8, h: 6 });
  q.corpo = [2 * 8 + 3, 2 * 8 + 2, 3 * 8 + 2, 3 * 8 + 3]; q.dir = 3; q.comidas = [0];
  S.passo(q, 2);
  assert.ok(q.vivo, 'entrar na célula da cauda é permitido');
  const p = S.novoJogo({ w: 8, h: 6 }); p.comidas = [0];
  for (let k = 0; k < 4; k++) S.passo(p, 1);
  assert.equal(p.motivo, 'parede');
  const t = S.novoJogo({ w: 8, h: 6, toroidal: true }); t.comidas = [0];
  for (let k = 0; k < 6; k++) S.passo(t, 1);
  assert.ok(t.vivo, 'no toro atravessa a borda');
  assert.equal(t.corpo[0] % 8, (4 + 6) % 8);
  assert.equal(S.distancia(t, 0, 7), 1, 'Manhattan dando a volta');
});

test('busca: BFS e A* acham o caminho mais curto; caminhos válidos', () => {
  const r = S.rng(5);
  for (let it = 0; it < 60; it++) {
    const j = S.novoJogo({ w: 14, h: 10, semente: it + 1, toroidal: it % 3 === 0 });
    const ag = S.porId('astar').criar();
    const passos = Math.floor(r() * 120);
    for (let k = 0; k < passos && j.vivo; k++) S.passo(j, ag.decidir(j).dir);
    if (!j.vivo) continue;
    const idx = S.indiceNoCorpo(j);
    const res = Object.fromEntries(['bfs', 'dfs', 'ucs', 'gulosa', 'astar'].map(t => [t, S.buscar(j, { tipo: t, idx })]));
    assert.equal(!!res.bfs.caminho, !!res.astar.caminho);
    if (!res.bfs.caminho) continue;
    assert.equal(res.astar.caminho.length, res.bfs.caminho.length, 'A* é ótimo');
    assert.ok(res.astar.expandidos.length <= res.bfs.expandidos.length, 'A* expande no máximo o que a BFS expande');
    for (const [t, x] of Object.entries(res)) {
      assert.ok(x.caminho.length >= res.bfs.caminho.length, t);
      let v = j.corpo[0];
      x.caminho.forEach((u, k) => {
        assert.ok([0, 1, 2, 3].some(d => S.vizinho(j, v, d) === u), `${t}: passo contíguo`);
        assert.ok(S.livreEm(idx, j.corpo.length, u, k + 1), `${t}: célula livre`);
        v = u;
      });
      assert.ok(j.comidas.includes(v), `${t}: termina na comida`);
    }
  }
});

test('A* ciente do tempo enxerga caminhos que o A* comum julga bloqueados', () => {
  // o corpo cerca a comida em (2,2); a única entrada, (1,2), é o penúltimo segmento:
  // parede para o A* comum, livre a partir do 2º passo para o ciente do tempo
  const j = S.novoJogo({ w: 7, h: 5 });
  const c = (x, y) => y * 7 + x;
  j.corpo = [c(1, 1), c(2, 1), c(3, 1), c(3, 2), c(3, 3), c(2, 3), c(1, 3), c(1, 2), c(0, 2)];
  j.dir = 3; j.comidas = [c(2, 2)];
  const idx = S.indiceNoCorpo(j);
  assert.equal(S.buscar(j, { tipo: 'astar', idx }).caminho, null);
  const tempo = S.buscar(j, { tipo: 'astar', idx, cienteTempo: true });
  assert.deepEqual(tempo.caminho, [c(0, 1), c(0, 2), c(1, 2), c(2, 2)]);
  // e o caminho funciona de verdade no jogo
  for (const v of tempo.caminho) S.passo(j, [0, 1, 2, 3].find(d => S.vizinho(j, j.corpo[0], d) === v));
  assert.ok(j.vivo);
  assert.equal(j.comidos, 1);
});

test('ciclo hamiltoniano: visita tudo uma vez e vence', () => {
  for (const [w, h] of [[4, 4], [6, 4], [5, 4], [4, 5], [12, 8], [18, 12]]) {
    const ciclo = S.cicloHamiltoniano(w, h);
    assert.equal(new Set(ciclo).size, w * h);
    const j = S.novoJogo({ w, h });
    ciclo.forEach((v, i) => assert.equal(S.distancia(j, v, ciclo[(i + 1) % ciclo.length]), 1));
  }
  assert.equal(S.cicloHamiltoniano(5, 5), null);
  const r = S.jogarPartida(S.porId('hamiltoniano').criar, { w: 8, h: 6, semente: 4 });
  assert.ok(r.venceu);
  assert.equal(r.corpo.length, 48);
});

test('determinístico repete a partida; não determinístico depende da semente do agente', () => {
  for (const a of S.ALGORITMOS.deterministicos) {
    const x = S.jogarPartida(a.criar, { w: 12, h: 8, semente: 9, sementeAgente: 1, passosMax: 3000 });
    const y = S.jogarPartida(a.criar, { w: 12, h: 8, semente: 9, sementeAgente: 2, passosMax: 3000 });
    assert.deepEqual([x.comidos, x.passos, x.motivo], [y.comidos, y.passos, y.motivo], a.id);
  }
  for (const id of ['aleatorio', 'subida', 'tempera', 'montecarlo']) {
    const a = S.porId(id);
    const x = S.jogarPartida(a.criar, { w: 12, h: 8, semente: 9, sementeAgente: 1 });
    const y = S.jogarPartida(a.criar, { w: 12, h: 8, semente: 9, sementeAgente: 1 });
    assert.deepEqual([x.comidos, x.passos], [y.comidos, y.passos], `${id}: mesma semente, mesma partida`);
    const outros = [2, 3, 4, 5].map(s => S.jogarPartida(a.criar, { w: 12, h: 8, semente: 9, sementeAgente: s }).passos);
    assert.ok(outros.some(p => p !== x.passos), `${id}: outra semente, outra partida`);
  }
});

test('quem pensa no depois vive mais', () => {
  const aleatorio = media(S.porId('aleatorio').criar);
  assert.ok(aleatorio < 5);
  assert.ok(media(S.porId('astar-seguro').criar, 10) > media(S.porId('astar').criar, 10) + 20, 'A* seguro > A*');
  assert.ok(media(S.porId('montecarlo').criar, 3) > aleatorio + 20);
  assert.ok(media(S.porId('mcts').criar, 2, { w: 12, h: 8 }) > aleatorio + 10);
  assert.ok(media(S.porId('genetico').criar) > 50);
});

test('algoritmo genético reproduz os pesos do campeão', () => {
  let ultima, primeira;
  for (const g of S.evoluir({ semente: 7 })) { primeira ??= g; ultima = g; }
  assert.equal(ultima.geracao, 15);
  assert.ok(ultima.media > primeira.media, 'a população melhora');
  assert.deepEqual(ultima.pesos.map(x => +x.toFixed(2)), S.PESOS_CAMPEAO);
});

test('catálogo: duas famílias com descrição completa', () => {
  assert.equal(S.ALGORITMOS.deterministicos.length, 9);
  assert.equal(S.ALGORITMOS.nao_deterministicos.length, 6);
  for (const a of S.TODOS) for (const k of ['id', 'nome', 'grupo', 'ideia', 'completo', 'otimo', 'morte']) assert.ok(a[k], `${a.id}.${k}`);
});
