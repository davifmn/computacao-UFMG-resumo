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

test('obstáculos: bloqueiam, matam e não recebem comida', () => {
  const { w, h } = S.TAMANHOS.medio;
  const j = S.novoJogo({ w, h, obstaculos: [6 * w + 10, 0, 1, 2] });
  assert.equal(j.nObst, 3, 'a célula à frente da cobra nunca vira obstáculo');
  assert.equal(S.vizinho(j, 1 * w + 1, 0), -1, 'vizinho de obstáculo é −1');
  for (let s = 1; s < 30; s++) {
    const k = S.novoJogo({ w, h, semente: s, ...S.MAPAS.aleatorio.gerar(w, h) });
    assert.ok(!k.obst[k.comidas[0]], 'comida fora de obstáculo');
  }
  const m = S.novoJogo({ w, h, obstaculos: [6 * w + 12] });
  m.comidas = [0];
  S.passo(m, 1); S.passo(m, 1);
  assert.ok(m.vivo);
  S.passo(m, 1);
  assert.equal(m.motivo, 'obstaculo');
  for (const [k, mp] of Object.entries(S.MAPAS)) for (const t of Object.values(S.TAMANHOS)) {
    const g = mp.gerar(t.w, t.h), jj = S.novoJogo({ w: t.w, h: t.h, ...g });
    assert.ok(S.buscar(jj, { tipo: 'bfs' }).caminho, `${k} ${t.nome}: comida alcançável`);
    if (g.comida != null) assert.equal(jj.comidas[0], g.comida);
  }
  // caminhos nunca passam por obstáculos; o ciclo hamiltoniano desiste
  const lab = S.novoJogo({ w, h, ...S.MAPAS.labirinto.gerar(w, h) });
  for (const tipo of ['bfs', 'dfs', 'ucs', 'gulosa', 'astar']) for (const v of S.buscar(lab, { tipo }).caminho) assert.ok(!lab.obst[v], tipo);
  const r = S.jogarPartida(S.porId('hamiltoniano').criar, { w: 8, h: 6, obstaculos: [0], passosMax: 500 });
  assert.ok(!r.venceu);
});

test('registrar o raciocínio não muda as decisões', () => {
  const { w, h } = S.TAMANHOS.pequeno;
  for (const a of S.TODOS) {
    const opts = { w, h, semente: 4, ...S.MAPAS.pilares.gerar(w, h) };
    const j1 = S.novoJogo(opts), j2 = S.novoJogo(opts);
    const a1 = a.criar(S.rng(3)), a2 = a.criar(S.rng(3), { registrar: true });
    for (let k = 0; k < 40 && j1.vivo; k++) {
      const d1 = a1.decidir(j1), d2 = a2.decidir(j2);
      assert.equal(d1.dir, d2.dir, `${a.id}, passo ${k}`);
      assert.equal(d1.pensamento.etapas ?? null, null, 'sem registro, sem etapas');
      S.passo(j1, d1.dir); S.passo(j2, d2.dir);
    }
  }
});

test('reprodução do raciocínio: revelar, ordem da fronteira e narração', () => {
  const { w, h } = S.TAMANHOS.medio;
  const j = S.novoJogo({ w, h, ...S.MAPAS.armadilha.gerar(w, h) });
  for (const tipo of ['bfs', 'dfs', 'ucs', 'gulosa', 'astar']) {
    const r = S.buscar(j, { tipo, registrar: true }), et = r.etapas;
    assert.equal(et[0].t, 'inicio');
    const fim = S.revelar(et, et.length - 1);
    assert.equal(fim.expandidos.size, r.expandidos.length);
    assert.deepEqual(fim.caminho, r.caminho);
    assert.ok(fim.definido);
    // o caminho só é definido quando a comida SAI da fronteira, e só depois é reconstruído
    const iObj = et.findIndex(e => e.t === 'objetivo');
    assert.equal(et[iObj].v, j.comidas[0]);
    assert.ok(!S.revelar(et, iObj - 1).definido);
    assert.ok(et.slice(iObj + 1).every(e => e.t === 'reconstroi' || e.t === 'definido'));
    // em cada momento, o próximo a sair da fronteira (pela ordem exibida) é quem é expandido
    for (let i = 0; i < et.length - 1; i++) {
      if (et[i + 1].t !== 'expande') continue;
      const ordem = S.ordemFronteira(S.revelar(et, i));
      assert.equal(ordem[0].v, et[i + 1].v, `${tipo}: evento ${i + 1}`);
    }
    for (const e of et) assert.ok(S.narrar(j, e).length > 5, e.t);
  }
  // não determinísticos também narram tudo
  for (const id of ['aleatorio', 'subida', 'tempera', 'montecarlo', 'mcts', 'genetico', 'astar-seguro', 'caixeiro', 'hamiltoniano']) {
    const jj = S.novoJogo({ w: 12, h: 8, comidas: id === 'caixeiro' ? 3 : 1 });
    const d = S.porId(id).criar(S.rng(1), { registrar: true }).decidir(jj);
    const et = d.pensamento.etapas;
    assert.ok(et.length > 0, id);
    for (const e of et) assert.ok(S.narrar(jj, e).length > 5, `${id}: ${e.t}`);
    const fim = S.revelar(et, et.length - 1);
    if (!['caixeiro', 'hamiltoniano'].includes(id)) assert.equal(fim.escolhido, d.dir, id);
  }
  const mc = S.porId('montecarlo').criar(S.rng(1), { registrar: true }).decidir(S.novoJogo({ w: 12, h: 8 }));
  assert.equal(mc.pensamento.etapas.filter(e => e.t === 'rollout').length, 3 * 20, '20 simulações por movimento');
});
