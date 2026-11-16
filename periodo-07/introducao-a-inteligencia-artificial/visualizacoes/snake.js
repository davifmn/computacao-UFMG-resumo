// Snake como laboratório de busca: as regras do jogo (puras, sem DOM), duas
// famílias de agentes e o registro do raciocínio de cada um.
//
//  • Determinísticos: a mesma partida produz sempre as mesmas decisões
//    (BFS, DFS, custo uniforme, gulosa, A* e variações, ciclo hamiltoniano).
//  • Não determinísticos: usam sorteios, então a mesma partida pode terminar
//    diferente (passeio aleatório, subida de encosta estocástica, têmpera
//    simulada, Monte Carlo, MCTS e algoritmo genético).
//
// Com { registrar: true }, cada decisão traz `etapas`: a lista de eventos do
// raciocínio (tirar um nó da fronteira, gerar um vizinho, testar um segmento do
// corpo, uma simulação, uma iteração do MCTS, um sorteio...). `revelar(etapas, i)`
// reconstrói o que o agente "sabia" depois do evento i, e `narrar` explica cada
// evento em português. A página reproduz os eventos aos poucos.
// Espelha o projeto em Python de ../projetos/snake-algoritmos-de-busca/.

import { rng, normal } from '../../../engine/random.js';
export { rng };

// =====================================================================
// Regras do jogo
// =====================================================================

export const DIRS = [
  { dx: 0, dy: -1, nome: 'cima', seta: '↑' },
  { dx: 1, dy: 0, nome: 'direita', seta: '→' },
  { dx: 0, dy: 1, nome: 'baixo', seta: '↓' },
  { dx: -1, dy: 0, nome: 'esquerda', seta: '←' },
];
export const oposta = d => (d + 2) % 4;

export const TAMANHOS = {
  pequeno: { w: 12, h: 8, nome: '12 × 8' },
  medio: { w: 18, h: 12, nome: '18 × 12' },
  grande: { w: 24, h: 16, nome: '24 × 16' },
};

/** Células onde a cobra nasce (e a da frente): nunca podem ter obstáculo. */
export function celulasIniciais(w, h) {
  const cx = w >> 1, cy = h >> 1, c = cy * w + cx;
  return [c + 1, c, c - 1, c - 2];
}

/**
 * Estado inicial: cobra de 3 células no centro, virada para a direita.
 * obstaculos: células bloqueadas; comida: posição da primeira comida (opcional).
 */
export function novoJogo({ w = 18, h = 12, comidas = 1, toroidal = false, semente = 1, obstaculos = [], comida = null } = {}) {
  const ini = celulasIniciais(w, h);
  const obst = new Uint8Array(w * h);
  for (const v of obstaculos) if (!ini.includes(v)) obst[v] = 1;
  let nObst = 0;
  for (const o of obst) nObst += o;
  const j = {
    w, h, toroidal, corpo: ini.slice(1), dir: 1, comidas: [], obst, nObst,
    rngComida: rng(semente), passos: 0, fome: 0, comidos: 0,
    vivo: true, venceu: false, motivo: null, limiteFome: 2 * w * h, simulacao: false,
  };
  if (comida != null && !obst[comida] && !j.corpo.includes(comida)) j.comidas.push(comida);
  while (j.comidas.length < comidas) { const n = j.comidas.length; sortearComida(j); if (j.comidas.length === n) break; }
  return j;
}

/** Cópia para simulação: na simulação, comida comida não reaparece (o futuro é desconhecido). */
export const clonar = j => ({ ...j, corpo: j.corpo.slice(), comidas: j.comidas.slice(), simulacao: true });

function sortearComida(j) {
  const ocupado = new Uint8Array(j.w * j.h);
  for (const v of j.corpo) ocupado[v] = 1;
  for (const v of j.comidas) ocupado[v] = 1;
  const livres = [];
  for (let v = 0; v < ocupado.length; v++) if (!ocupado[v] && !j.obst[v]) livres.push(v);
  if (livres.length) j.comidas.push(livres[Math.floor(j.rngComida() * livres.length)]);
}

/** Destino bruto de um passo: { u, fora } (fora = saiu da grade sem toro). */
function destino(j, v, d) {
  const { w, h } = j;
  let x = (v % w) + DIRS[d].dx, y = Math.floor(v / w) + DIRS[d].dy;
  if (j.toroidal) { x = (x + w) % w; y = (y + h) % h; }
  else if (x < 0 || y < 0 || x >= w || y >= h) return { u: -1, fora: true };
  return { u: y * w + x, fora: false };
}

/** Célula vizinha de v na direção d; −1 se sair da grade ou se for obstáculo. */
export function vizinho(j, v, d) {
  const { u } = destino(j, v, d);
  return u < 0 || j.obst[u] ? -1 : u;
}

/** Distância de Manhattan; no toro, "dando a volta" quando é mais curto. Ignora obstáculos, então nunca superestima: é admissível. */
export function distancia(j, a, b) {
  let dx = Math.abs((a % j.w) - (b % j.w)), dy = Math.abs(Math.floor(a / j.w) - Math.floor(b / j.w));
  if (j.toroidal) { dx = Math.min(dx, j.w - dx); dy = Math.min(dy, j.h - dy); }
  return dx + dy;
}
const distComida = (j, v) => j.comidas.reduce((m, c) => Math.min(m, distancia(j, v, c)), Infinity);

/** Avança um passo. Virar 180° é ignorado (a cobra segue em frente), como no jogo. */
export function passo(j, d) {
  if (!j.vivo) return j;
  if (d == null || d === oposta(j.dir)) d = j.dir;
  j.dir = d;
  j.passos++; j.fome++;
  const { u: nv, fora } = destino(j, j.corpo[0], d);
  if (fora) return morrer(j, 'parede');
  if (j.obst[nv]) return morrer(j, 'obstaculo');
  const k = j.comidas.indexOf(nv);
  // a cauda sai do lugar neste passo, a menos que a cobra coma (aí ela cresce)
  const limite = k >= 0 ? j.corpo.length : j.corpo.length - 1;
  const bate = j.corpo.indexOf(nv);
  if (bate >= 0 && bate < limite) return morrer(j, 'corpo');
  j.corpo.unshift(nv);
  if (k < 0) j.corpo.pop();
  else {
    j.comidos++; j.fome = 0;
    j.comidas.splice(k, 1);
    if (j.corpo.length === j.w * j.h - j.nObst) { j.vivo = false; j.venceu = true; j.motivo = 'venceu'; return j; }
    if (!j.simulacao) sortearComida(j);
  }
  if (j.fome > j.limiteFome) return morrer(j, 'fome');
  return j;
}
function morrer(j, motivo) { j.vivo = false; j.motivo = motivo; return j; }

/** idx[v] = posição de v no corpo (0 = cabeça), −1 se livre. */
export function indiceNoCorpo(j) {
  const idx = new Int32Array(j.w * j.h).fill(-1);
  j.corpo.forEach((v, i) => { if (idx[v] < 0) idx[v] = i; });
  return idx;
}

/**
 * A célula v estará livre quando a cabeça chegar lá no passo k?
 * O segmento i sai do lugar depois de L − i passos. O modelo simples ("corpo é
 * parede") só libera a cauda; o modelo ciente do tempo libera cada segmento na hora certa.
 */
export const livreEm = (idx, L, v, k, cienteTempo = false) =>
  idx[v] < 0 || (cienteTempo ? k >= L - idx[v] : idx[v] === L - 1);

/** Direções que não matam no próximo passo. */
export function seguros(j, idx = indiceNoCorpo(j)) {
  const out = [], L = j.corpo.length;
  for (let d = 0; d < 4; d++) {
    if (L > 1 && d === oposta(j.dir)) continue;
    const nv = vizinho(j, j.corpo[0], d);
    if (nv >= 0 && livreEm(idx, L, nv, 1)) out.push(d);
  }
  return out;
}

/** Inunda a partir da cabeça: quantas células livres ela alcança, e se alcança a cauda. */
export function areaLivre(j, idx = indiceNoCorpo(j)) {
  const L = j.corpo.length, n = j.w * j.h, visto = new Uint8Array(n);
  const pilha = [j.corpo[0]];
  visto[j.corpo[0]] = 1;
  let area = 0;
  while (pilha.length) {
    const v = pilha.pop();
    for (let d = 0; d < 4; d++) {
      const u = vizinho(j, v, d);
      if (u < 0 || visto[u] || !livreEm(idx, L, u, 1)) continue;
      visto[u] = 1; area++; pilha.push(u);
    }
  }
  return { area, cauda: L > 1 && !!visto[j.corpo[L - 1]] };
}

/**
 * A cabeça consegue "escapar"? Busca em largura ciente do tempo: chegar a uma célula
 * do corpo depois que aquele segmento saiu de lá significa seguir o rastro da cobra,
 * que nunca acaba (alcançar a cauda é o caso particular do último segmento).
 */
export function escapa(j, idx = indiceNoCorpo(j)) {
  const L = j.corpo.length, prof = new Int32Array(j.w * j.h).fill(-1);
  const fila = [j.corpo[0]];
  prof[j.corpo[0]] = 0;
  for (let i = 0; i < fila.length; i++) {
    const v = fila[i];
    for (let d = 0; d < 4; d++) {
      const u = vizinho(j, v, d);
      if (u < 0 || prof[u] >= 0) continue;
      const k = prof[v] + 1;
      if (idx[u] > 0) { if (k >= L - idx[u]) return true; continue; }
      if (idx[u] === 0) continue;
      prof[u] = k; fila.push(u);
    }
  }
  return false;
}

const dirPara = (j, de, para) => { for (let d = 0; d < 4; d++) if (vizinho(j, de, d) === para) return d; return null; };

// =====================================================================
// Mapas de obstáculos
// =====================================================================

/** Cada mapa devolve { obstaculos, comida? } para uma grade w × h (a área inicial da cobra fica livre). */
export const MAPAS = {
  vazio: { nome: 'sem obstáculos', gerar: () => ({ obstaculos: [] }) },
  pilares: {
    nome: 'pilares',
    gerar: (w, h) => {
      const o = [];
      for (let y = 1; y < h - 1; y += 3) for (let x = 1; x < w - 1; x += 3) o.push(y * w + x);
      return { obstaculos: o };
    },
  },
  corredores: {
    nome: 'corredores',
    gerar: (w, h) => {
      const o = [];
      for (let x = 3, k = 0; x < w - 2; x += 4, k++) for (let y = 0; y < h; y++) {
        const porta = k % 2 ? y >= h - 2 : y <= 1;           // portas alternadas: em cima, embaixo
        if (!porta) o.push(y * w + x);
      }
      return { obstaculos: o };
    },
  },
  armadilha: {
    nome: 'armadilha em U',
    gerar: (w, h) => {
      // um U aberto para a cobra, com a comida atrás do fundo: o exemplo clássico em que a
      // gulosa entra no U (h diminui) e só depois descobre que precisa sair e contornar
      const o = [], x0 = (w >> 1) + 2, cy = h >> 1, alt = Math.max(2, Math.floor(h * 0.3));
      for (let y = cy - alt; y <= cy + alt; y++) o.push(y * w + x0);
      for (let x = x0 - 4; x < x0; x++) { o.push((cy - alt) * w + x); o.push((cy + alt) * w + x); }
      return { obstaculos: o, comida: cy * w + Math.min(w - 1, x0 + 3) };
    },
  },
  sala: {
    nome: 'sala com uma porta',
    gerar: (w, h) => {
      const o = [], x0 = (w >> 1) + 2, x1 = w - 2, y0 = 1, y1 = h - 2, porta = (h >> 1) - 2;
      for (let x = x0; x <= x1; x++) { o.push(y0 * w + x); o.push(y1 * w + x); }
      for (let y = y0; y <= y1; y++) { o.push(y * w + x1); if (y !== porta) o.push(y * w + x0); }
      return { obstaculos: o, comida: ((y0 + y1) >> 1) * w + ((x0 + x1) >> 1) };
    },
  },
  labirinto: {
    nome: 'labirinto',
    gerar: (w, h, semente = 3) => {
      // labirinto perfeito por DFS aleatória (passagens nas coordenadas pares) e depois
      // 20% das paredes derrubadas, para haver ciclos e a cobra ter onde manobrar
      const r = rng(semente), parede = new Uint8Array(w * h).fill(1);
      const W = Math.ceil(w / 2), H = Math.ceil(h / 2), vis = new Uint8Array(W * H);
      const pilha = [[0, 0]]; vis[0] = 1; parede[0] = 0;
      while (pilha.length) {
        const [cx, cy] = pilha[pilha.length - 1];
        const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < W && y < H && !vis[y * W + x]);
        if (!viz.length) { pilha.pop(); continue; }
        const [nx, ny, dx, dy] = viz[Math.floor(r() * viz.length)];
        vis[ny * W + nx] = 1;
        parede[(2 * cy + dy) * w + 2 * cx + dx] = 0; parede[2 * ny * w + 2 * nx] = 0;
        pilha.push([nx, ny]);
      }
      const o = [];
      for (let v = 0; v < w * h; v++) if (parede[v] && !(r() < 0.2)) o.push(v);
      return { obstaculos: o };
    },
  },
  aleatorio: {
    nome: 'aleatório (12%)',
    gerar: (w, h, semente = 5) => {
      const r = rng(semente), o = [];
      for (let v = 0; v < w * h; v++) if (r() < 0.12) o.push(v);
      return { obstaculos: o };
    },
  },
};

// =====================================================================
// Busca genérica na grade (a cabeça é o estado inicial, as comidas, o objetivo)
// =====================================================================

class Heap {
  constructor(menor) { this.a = []; this.menor = menor; }
  get size() { return this.a.length; }
  push(x) {
    const a = this.a; a.push(x);
    for (let i = a.length - 1; i > 0;) { const p = (i - 1) >> 1; if (!this.menor(a[i], a[p])) break; [a[i], a[p]] = [a[p], a[i]]; i = p; }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && this.menor(a[l], a[m])) m = l;
        if (r < a.length && this.menor(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]]; i = m;
      }
    }
    return top;
  }
}

export const ESTRUTURA = { bfs: 'fila', dfs: 'pilha', ucs: 'fila de prioridade (menor g)', gulosa: 'fila de prioridade (menor h)', astar: 'fila de prioridade (menor f = g + h)' };

/**
 * tipo: 'bfs' (fila), 'dfs' (pilha), 'ucs' (menor g), 'gulosa' (menor h), 'astar' (menor g + h).
 * Teste de objetivo na remoção da fronteira, como no livro (garante otimalidade da UCS e do A*).
 * Devolve { caminho (sem a cabeça), expandidos (em ordem), fronteira, custo, etapas? }.
 */
export function buscar(j, { tipo = 'astar', alvos = j.comidas, cienteTempo = false, custo = null, idx = indiceNoCorpo(j), registrar = false } = {}) {
  const n = j.w * j.h, L = j.corpo.length, cabeca = j.corpo[0];
  const alvo = new Uint8Array(n);
  for (const a of alvos) alvo[a] = 1;
  const h = v => alvos.reduce((m, a) => Math.min(m, distancia(j, v, a)), Infinity);
  const usaH = tipo === 'gulosa' || tipo === 'astar';
  const g = new Float64Array(n).fill(Infinity), pai = new Int32Array(n).fill(-1), fechado = new Uint8Array(n);
  const expandidos = [], etapas = registrar ? [] : null;
  let seq = 0;
  // entrada da fronteira: [célula, pai, g, profundidade (passos), prioridade, desempate, ordem, h]
  const entrada = (v, p, gv, k) => {
    const hv = usaH ? h(v) : 0;
    const pr = tipo === 'ucs' ? gv : tipo === 'gulosa' ? hv : tipo === 'astar' ? gv + hv : gv;
    return [v, p, gv, k, pr, tipo === 'astar' ? hv : 0, seq++, hv];
  };
  const fr = tipo === 'bfs' || tipo === 'dfs' ? [] : new Heap((a, b) => (a[4] - b[4] || a[5] - b[5] || a[6] - b[6]) < 0);
  let cabecaFila = 0;                                     // a BFS usa o array como fila
  const vazio = () => (fr instanceof Heap ? fr.size === 0 : tipo === 'bfs' ? cabecaFila >= fr.length : fr.length === 0);
  const tirar = () => (fr instanceof Heap ? fr.pop() : tipo === 'bfs' ? fr[cabecaFila++] : fr.pop());
  const visto = new Uint8Array(n);                        // BFS: não enfileira duas vezes
  const e0 = entrada(cabeca, -1, 0, 0);
  fr.push(e0); visto[cabeca] = 1;
  etapas?.push({ t: 'inicio', tipo, v: cabeca, h: e0[7], cienteTempo, estrutura: ESTRUTURA[tipo] });
  let achou = -1;
  while (!vazio()) {
    const [v, p, gv, k, , , , hv] = tirar();
    if (fechado[v]) continue;                             // cópia velha (já saiu com g menor)
    fechado[v] = 1; pai[v] = p; g[v] = gv;
    expandidos.push(v);
    etapas?.push({ t: 'expande', v, pai: p, g: gv, h: hv, k, n: expandidos.length, usaH, tipo });
    if (alvo[v] && v !== cabeca) { achou = v; etapas?.push({ t: 'objetivo', v, g: gv, n: expandidos.length }); break; }
    const filhos = [];
    for (let d = 0; d < 4; d++) {
      const u = vizinho(j, v, d);
      if (u < 0 || fechado[u]) continue;
      if (idx[u] >= 0) {
        const livre = livreEm(idx, L, u, k + 1, cienteTempo);
        etapas?.push({ t: 'corpo', v: u, seg: idx[u], k: k + 1, L, livre, cienteTempo });
        if (!livre) continue;
      }
      if (tipo === 'bfs') { if (visto[u]) continue; visto[u] = 1; }
      const gu = gv + (custo ? custo(u) : 1);
      if (fr instanceof Heap) {
        if (gu >= g[u]) continue;
        g[u] = gu;
      }
      filhos.push(entrada(u, v, gu, k + 1));
    }
    // DFS: empilha ao contrário para tentar primeiro ↑, depois →, ↓, ←
    if (tipo === 'dfs') filhos.reverse();
    for (const f of filhos) {
      if (tipo === 'dfs') f[6] = seq++;                   // na pilha, a ordem que vale é a de empilhamento
      fr.push(f);
      etapas?.push({ t: 'gera', v: f[0], pai: v, g: f[2], h: f[7], pr: f[4], seq: f[6], usaH, tipo });
    }
  }
  const resto = fr instanceof Heap ? fr.a : tipo === 'bfs' ? fr.slice(cabecaFila) : fr;
  const fronteira = [...new Set(resto.map(e => e[0]).filter(v => !fechado[v]))];
  if (achou < 0) {
    etapas?.push({ t: 'falhou', n: expandidos.length });
    return { caminho: null, expandidos, fronteira, custo: Infinity, etapas };
  }
  const caminho = [];
  for (let v = achou; v !== cabeca; v = pai[v]) { caminho.unshift(v); etapas?.push({ t: 'reconstroi', v }); }
  etapas?.push({ t: 'definido', caminho: caminho.slice(), custo: g[achou], n: expandidos.length });
  return { caminho, expandidos, fronteira, custo: g[achou], etapas };
}

/** Custo de "risco": entrar numa célula colada em parede, obstáculo ou corpo custa mais. */
export function custoRisco(j, idx) {
  const L = j.corpo.length;
  return v => {
    let b = 0;
    for (let d = 0; d < 4; d++) { const u = vizinho(j, v, d); if (u < 0 || (idx[u] >= 0 && idx[u] < L - 1)) b++; }
    return 1 + 2 * b;
  };
}

/** Quando não há caminho: vai para o lado com mais espaço livre (adiar a morte). */
export function sobreviver(j, etapas = null) {
  let melhor = null;
  for (const d of seguros(j)) {
    const s = clonar(j); passo(s, d);
    if (!s.vivo && !s.venceu) continue;
    const { area } = areaLivre(s);
    etapas?.push({ t: 'avalia', dir: d, valor: area, rotulo: `${area} células livres depois` });
    if (!melhor || area > melhor.area) melhor = { dir: d, area };
  }
  const r = melhor ?? { dir: j.dir, area: 0 };
  etapas?.push({ t: 'escolhe', dir: r.dir, texto: melhor ? `Sem caminho até a comida: vou para ${DIRS[r.dir].seta}, o lado com mais espaço (${r.area} células), para adiar a morte.` : 'Sem saída: qualquer movimento mata.' });
  return r;
}

// =====================================================================
// Agentes determinísticos
// =====================================================================
// Todo agente é criado por criar(rng, { registrar }) e expõe decidir(jogo) → { dir, pensamento }.
// pensamento: { texto, nos, etapas?, expandidos?, fronteira?, caminho?, fantasma?, cauda?,
//              rollouts?, candidatos?, temperatura?, ciclo?, replanejou? }

/** Planeja um caminho até a comida e o segue; replaneja quando o plano acaba ou fica inválido. */
function planejador(planejar, rotulo) {
  return (_r, { registrar = false } = {}) => {
    let plano = [], ultima = null;
    return {
      decidir(j) {
        const idx = indiceNoCorpo(j), L = j.corpo.length, cab = j.corpo[0];
        const valido = plano.length && dirPara(j, cab, plano[0]) != null && livreEm(idx, L, plano[0], 1)
          && j.comidas.includes(plano[plano.length - 1]);
        let nos = 0;
        if (!valido) { ultima = planejar(j, idx, registrar); plano = ultima.caminho ? ultima.caminho.slice() : []; nos = ultima.expandidos.length; }
        const base = { expandidos: ultima.expandidos, fronteira: ultima.fronteira, nos, replanejou: !valido, etapas: valido ? null : ultima.etapas };
        if (!plano.length) {
          const s = sobreviver(j, base.etapas);
          return { dir: s.dir, pensamento: { ...base, caminho: null, texto: `${rotulo}: não há caminho até a comida. Vou para o lado com mais espaço (${s.area} células).` } };
        }
        const prox = plano.shift();
        const texto = valido ? `${rotulo}: seguindo o plano (faltam ${plano.length + 1} passos). Nada a pensar até ele acabar ou ser bloqueado.`
          : `${rotulo}: expandi ${nos} células e achei um caminho de ${plano.length + 1} passos.`;
        return { dir: dirPara(j, cab, prox), pensamento: { ...base, caminho: [prox, ...plano], texto } };
      },
    };
  };
}

/** A* com várias comidas: testa todas as ordens de visita (caixeiro viajante) com custos dados pelo A*. */
export function planoCaixeiro(j, idx, registrar = false) {
  if (j.comidas.length <= 1) return buscar(j, { tipo: 'astar', idx, registrar });
  const perms = a => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p])));
  const cabeca = j.corpo[0];
  const cache = new Map(), expandidos = [], etapas = registrar ? [] : null;
  const trecho = (de, para) => {
    const k = de + ',' + para;
    if (!cache.has(k)) {
      // trechos depois da 1ª comida: o corpo de agora como obstáculo (aproximação do projeto original)
      const s = de === cabeca ? j : { ...j, corpo: [de, ...j.corpo.slice(1)] };
      etapas?.push({ t: 'busca', de, para });
      const r = buscar(s, { tipo: 'astar', alvos: [para], idx, registrar });
      expandidos.push(...r.expandidos);
      if (etapas) { etapas.push(...r.etapas.filter(e => e.t !== 'reconstroi' && e.t !== 'definido')); etapas.push({ t: 'trecho', de, para, passos: r.caminho ? r.caminho.length : Infinity }); }
      cache.set(k, r);
    }
    return cache.get(k);
  };
  let melhor = null;
  const ordens = [];
  for (const ordem of perms(j.comidas)) {
    let total = 0, de = cabeca, primeiro = null;
    for (const c of ordem) {
      const r = trecho(de, c);
      if (!r.caminho) { total = Infinity; break; }
      if (!primeiro) primeiro = r;
      total += r.caminho.length; de = c;
    }
    ordens.push({ ordem, total });
    if (total < (melhor?.total ?? Infinity)) melhor = { total, primeiro, ordem };
  }
  etapas?.push({ t: 'ordem', ordens, melhor: melhor?.ordem ?? null, total: melhor?.total ?? Infinity });
  if (!melhor) { etapas?.push({ t: 'falhou', n: expandidos.length }); return { caminho: null, expandidos, fronteira: [], custo: Infinity, etapas }; }
  etapas?.push({ t: 'definido', caminho: melhor.primeiro.caminho.slice(), custo: melhor.primeiro.custo, n: expandidos.length });
  return { ...melhor.primeiro, expandidos, ordem: melhor.ordem, total: melhor.total, etapas };
}

/** A* seguro: só vai à comida se, depois de comer, a cabeça ainda tem rota de fuga. */
function aEstrelaSeguro(_r, { registrar = false } = {}) {
  return {
    decidir(j) {
      const idx = indiceNoCorpo(j);
      const r = buscar(j, { tipo: 'astar', idx, registrar });
      const etapas = r.etapas;
      let nos = r.expandidos.length;
      if (r.caminho) {
        const s = clonar(j);
        for (const v of r.caminho) passo(s, dirPara(s, s.corpo[0], v));
        const ok = s.venceu || (s.vivo && escapa(s));
        etapas?.push({ t: 'fantasma', corpo: s.corpo.slice(), ok, passos: r.caminho.length });
        if (ok) {
          etapas?.push({ t: 'escolhe', dir: dirPara(j, j.corpo[0], r.caminho[0]), texto: 'O caminho é seguro: sigo o primeiro passo dele.' });
          return { dir: dirPara(j, j.corpo[0], r.caminho[0]), pensamento: { ...r, nos, fantasma: s.corpo, texto: `A* seguro: o caminho de ${r.caminho.length} passos é seguro: depois de comer, o fantasma ainda tem rota de fuga (alcança o rastro do próprio corpo).` } };
        }
      }
      // Plano B: entre os movimentos depois dos quais ainda há rota de fuga, o que mais
      // se aproxima da comida (com fome demais, num laço seguro, o de maior espaço livre).
      let melhor = null;
      for (const d of seguros(j, idx)) {
        const s = clonar(j); passo(s, d);
        if (!s.vivo && !s.venceu) continue;
        const a = areaLivre(s);
        nos++;
        const fuga = escapa(s);
        const dist = distComida(j, s.corpo[0]);
        etapas?.push({ t: 'avalia', dir: d, valor: fuga ? -dist : -Infinity, ruim: !fuga, rotulo: fuga ? `rota de fuga ✓, distância ${dist}` : 'sem rota de fuga ✗' });
        if (!fuga) continue;
        const chave = j.fome > j.w * j.h / 2 ? [-a.area, dist] : [dist, -a.area];
        if (!melhor || chave[0] < melhor.chave[0] || (chave[0] === melhor.chave[0] && chave[1] < melhor.chave[1])) melhor = { dir: d, chave, cabeca: s.corpo[0] };
      }
      if (melhor) {
        const L = j.corpo.length, cauda = [melhor.cabeca];
        const rc = buscar({ ...j, corpo: [melhor.cabeca, ...j.corpo.slice(0, L - 1)] }, { tipo: 'bfs', alvos: [j.corpo[L - 2]] });
        if (rc.caminho) cauda.push(...rc.caminho);
        etapas?.push({ t: 'escolhe', dir: melhor.dir, texto: `Vou para ${DIRS[melhor.dir].seta}: mantém a rota de fuga e me aproxima da comida. Tento de novo no próximo passo.` });
        return { dir: melhor.dir, pensamento: { expandidos: r.expandidos, fronteira: r.fronteira, caminho: r.caminho, perigo: true, cauda, nos, etapas, texto: r.caminho ? 'A* seguro: ir à comida agora me encurralaria (o fantasma ficaria sem rota de fuga). Dou um passo que mantém uma rota de fuga e me aproxima da comida.' : 'A* seguro: a comida está inalcançável agora; dou um passo que mantém uma rota de fuga.' } };
      }
      const s = sobreviver(j, etapas);
      return { dir: s.dir, pensamento: { expandidos: r.expandidos, nos, etapas, texto: 'A* seguro: nenhum movimento mantém rota de fuga; vou para o lado com mais espaço.' } };
    },
  };
}

/** Ciclo que passa por todas as células uma vez (existe se w ou h é par e não há obstáculos). */
export function cicloHamiltoniano(w, h) {
  const monta = (W, H, cel) => {
    const s = [];
    for (let x = 0; x < W; x++) s.push(cel(x, 0));
    for (let y = 1; y < H; y++) {
      if (y % 2) for (let x = W - 1; x >= 1; x--) s.push(cel(x, y));
      else for (let x = 1; x < W; x++) s.push(cel(x, y));
    }
    for (let y = H - 1; y >= 1; y--) s.push(cel(0, y));
    return s;
  };
  if (h % 2 === 0 && w >= 2) return monta(w, h, (x, y) => y * w + x);
  if (w % 2 === 0 && h >= 2) return monta(h, w, (x, y) => x * w + y);
  return null;
}

function hamiltoniano(_r, { registrar = false } = {}) {
  let suc = null, ciclo = null, alvo = null;
  return {
    decidir(j) {
      if (!suc) {
        ciclo = j.nObst ? null : cicloHamiltoniano(j.w, j.h);
        if (!ciclo) {
          const etapas = registrar ? [] : null;
          etapas?.push({ t: 'nota', texto: j.nObst ? 'Com obstáculos, este ciclo simples não existe, e achar um ciclo hamiltoniano numa grade qualquer é NP-difícil. Desisto do ciclo e só tento sobreviver.' : 'Grade com os dois lados ímpares: não existe ciclo hamiltoniano.' });
          const s = sobreviver(j, etapas);
          return { dir: s.dir, pensamento: { nos: 0, etapas, texto: j.nObst ? 'Ciclo hamiltoniano: com obstáculos não há ciclo pronto (achar um é NP-difícil). Só sobrevivo.' : 'Grade com lados ímpares: não existe ciclo hamiltoniano.' } };
        }
        const n = ciclo.length;
        suc = new Int32Array(j.w * j.h);
        ciclo.forEach((v, i) => { suc[v] = ciclo[(i + 1) % n]; });
        // percorre no sentido em que o próximo passo não é o pescoço
        if (j.corpo.length > 1 && suc[j.corpo[0]] === j.corpo[1]) { ciclo.reverse(); ciclo.forEach((v, i) => { suc[v] = ciclo[(i + 1) % n]; }); }
      }
      const caminho = [];
      for (let v = suc[j.corpo[0]]; caminho.length < ciclo.length; v = suc[v]) { caminho.push(v); if (j.comidas.includes(v)) break; }
      const nova = caminho[caminho.length - 1] !== alvo;
      alvo = caminho[caminho.length - 1];
      let etapas = null;
      if (registrar && nova) {
        etapas = [{ t: 'ciclo', ciclo }];
        for (const v of caminho) etapas.push({ t: 'segue', v });
        etapas.push({ t: 'definido', caminho: caminho.slice(), custo: caminho.length, n: 0 });
      }
      return { dir: dirPara(j, j.corpo[0], caminho[0]), pensamento: { caminho, ciclo, nos: 0, etapas, replanejou: nova, texto: `Ciclo hamiltoniano: nenhuma busca, só o próximo passo do ciclo. A comida está a ${caminho.length} passos por ele.` } };
    },
  };
}

// =====================================================================
// Agentes não determinísticos
// =====================================================================

const valorPos = (j, v) => -distComida(j, v);   // a "altitude" da busca local: quanto mais perto da comida, mais alto

/** Avalia os 3 movimentos possíveis (não seguros entram como "mata"), para o registro. */
function registrarInseguros(j, ms, etapas) {
  if (!etapas) return;
  for (let d = 0; d < 4; d++) if (!(j.corpo.length > 1 && d === oposta(j.dir)) && !ms.includes(d)) etapas.push({ t: 'avalia', dir: d, valor: -Infinity, ruim: true, rotulo: 'mata (parede, obstáculo ou corpo)' });
}

function aleatorio(r, { registrar = false } = {}) {
  return {
    decidir(j) {
      const ms = seguros(j), etapas = registrar ? [] : null;
      if (!ms.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      registrarInseguros(j, ms, etapas);
      for (const m of ms) etapas?.push({ t: 'avalia', dir: m, valor: 1 / ms.length, rotulo: `não mata: chance 1/${ms.length}` });
      const x = r(), d = ms[Math.floor(x * ms.length)];
      etapas?.push({ t: 'sorteio', x, dir: d, de: ms.length });
      etapas?.push({ t: 'escolhe', dir: d, texto: `Vou para ${DIRS[d].seta}. Não olhei para a comida.` });
      return { dir: d, pensamento: { nos: 0, etapas, candidatos: ms.map(m => ({ dir: m, valor: 1 / ms.length, rotulo: `p = ${(1 / ms.length).toFixed(2)}` })), escolhido: d, texto: `Passeio aleatório: sorteei ${DIRS[d].seta} entre ${ms.length} movimentos que não matam agora.` } };
    },
  };
}

function subidaEncosta(r, { registrar = false } = {}) {
  return {
    decidir(j) {
      const ms = seguros(j), etapas = registrar ? [] : null;
      if (!ms.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      const atual = valorPos(j, j.corpo[0]);
      registrarInseguros(j, ms, etapas);
      const cands = ms.map(d => ({ dir: d, valor: valorPos(j, vizinho(j, j.corpo[0], d)) }));
      for (const c of cands) { c.rotulo = `h = ${-c.valor}${c.valor > atual ? ' (sobe ✓)' : ''}`; etapas?.push({ t: 'avalia', dir: c.dir, valor: c.valor, rotulo: c.rotulo }); }
      const sobe = cands.filter(c => c.valor > atual);
      etapas?.push({ t: 'filtra', dirs: sobe.map(c => c.dir), texto: sobe.length ? `Estou a h = ${-atual}. ${sobe.length} vizinho(s) sobem (chegam mais perto).` : `Estou a h = ${-atual} e nenhum vizinho sobe: ótimo local.` });
      const pool = sobe.length ? sobe : cands, x = r(), d = pool[Math.floor(x * pool.length)].dir;
      etapas?.push({ t: 'sorteio', x, dir: d, de: pool.length });
      etapas?.push({ t: 'escolhe', dir: d, texto: sobe.length ? `Subo por ${DIRS[d].seta}.` : `Passo aleatório por ${DIRS[d].seta} para sair do ótimo local.` });
      return { dir: d, pensamento: { nos: 0, etapas, candidatos: cands, escolhido: d, texto: sobe.length
        ? `Subida de encosta: ${sobe.length} vizinho(s) chegam mais perto da comida; sorteei um deles.`
        : 'Subida de encosta: nenhum vizinho melhora (ótimo local). Dou um passo aleatório para sair dele.' } };
    },
  };
}

function temperaSimulada(r, { T0 = 1, alfa = 0.85, registrar = false } = {}) {
  return {
    decidir(j) {
      const ms = seguros(j), etapas = registrar ? [] : null;
      if (!ms.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      const T = T0 * alfa ** j.fome;                  // esfria a cada passo sem comer; reaquece ao comer
      const atual = valorPos(j, j.corpo[0]);
      etapas?.push({ t: 'nota', texto: `Temperatura T = ${T0} × ${alfa}^${j.fome} = ${T.toFixed(3)} (${j.fome} passos sem comer).` });
      registrarInseguros(j, ms, etapas);
      const cands = ms.map(d => { const delta = valorPos(j, vizinho(j, j.corpo[0], d)) - atual; return { dir: d, delta, p: delta > 0 ? 1 : Math.exp(delta / T) }; });
      for (const c of cands) { c.valor = c.p; c.rotulo = `Δ = ${c.delta > 0 ? '+' : ''}${c.delta}, p = ${c.p.toFixed(2)}`; etapas?.push({ t: 'avalia', dir: c.dir, valor: c.p, rotulo: c.rotulo }); }
      const ordem = cands.slice().sort(() => r() - 0.5);
      let esc = null;
      for (const c of ordem) {
        const x = r(), aceita = x < c.p;
        etapas?.push({ t: 'tenta', dir: c.dir, x, p: c.p, aceita, delta: c.delta });
        if (aceita) { esc = c; break; }
      }
      if (!esc) { esc = cands.reduce((a, b) => (b.delta > a.delta ? b : a)); etapas?.push({ t: 'nota', texto: `Todos rejeitados: fico com o melhor, ${DIRS[esc.dir].seta}.` }); }
      etapas?.push({ t: 'escolhe', dir: esc.dir, texto: esc.delta > 0 ? `Aceitei uma melhora: ${DIRS[esc.dir].seta}.` : `Aceitei uma piora (${DIRS[esc.dir].seta}): é assim que a têmpera escapa de ótimos locais.` });
      return { dir: esc.dir, pensamento: { nos: 0, etapas, candidatos: cands, escolhido: esc.dir, temperatura: T, texto: `Têmpera simulada (T = ${T.toFixed(2)}): sorteio um vizinho; se piora, aceito com probabilidade e^(Δ/T). ${esc.delta > 0 ? 'Aceitei uma melhora.' : 'Aceitei uma piora!'}` } };
    },
  };
}

/** Joga aleatoriamente (só movimentos que não matam já) por até `prof` passos. Recompensa: +1 por comida, −1 na morte, descontada. */
export function simular(s, r, prof, gama = 0.95, rastro = null) {
  let ret = 0, desc = 1;
  for (let t = 0; t < prof && s.vivo; t++) {
    const ms = seguros(s);
    if (!ms.length) { ret -= desc; s.vivo = false; break; }
    const antes = s.comidos;
    passo(s, ms[Math.floor(r() * ms.length)]);
    if (rastro) rastro.push(s.corpo[0]);
    if (s.comidos > antes) ret += desc;
    desc *= gama;
    if (!s.comidas.length) break;
  }
  if (s.vivo && s.comidas.length) ret += desc * 0.5 * (1 - distComida(s, s.corpo[0]) / (s.w + s.h));
  return ret;
}

function monteCarlo(r, { K = 20, prof = 30, registrar = false } = {}) {
  return {
    decidir(j) {
      const ms = seguros(j), etapas = registrar ? [] : null;
      if (!ms.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      registrarInseguros(j, ms, etapas);
      const cands = [], rollouts = [];
      let nos = 0;
      for (const d of ms) {
        let soma = 0;
        for (let k = 0; k < K; k++) {
          const s = clonar(j), antes = s.comidos;
          passo(s, d);
          const rastro = registrar || k < 6 ? [s.corpo[0]] : null;
          const comeu = s.comidos > antes ? 1 : 0;
          const v = comeu + 0.95 * simular(s, r, prof, 0.95, rastro);
          nos += s.passos - j.passos;
          soma += v;
          if (rastro && k < 6) rollouts.push({ dir: d, celulas: rastro });
          etapas?.push({ t: 'rollout', dir: d, celulas: rastro, valor: v, morreu: !s.vivo && !s.venceu, comeu: s.comidos - antes, k: k + 1, K });
        }
        cands.push({ dir: d, valor: soma / K, rotulo: `média ${(soma / K).toFixed(2)}` });
      }
      const best = cands.reduce((a, b) => (b.valor > a.valor ? b : a));
      etapas?.push({ t: 'escolhe', dir: best.dir, texto: `${DIRS[best.dir].seta} teve a maior média (${best.valor.toFixed(2)}) em ${K} simulações.` });
      return { dir: best.dir, pensamento: { nos, etapas, candidatos: cands, escolhido: best.dir, rollouts, texto: `Monte Carlo: para cada movimento, ${K} partidas aleatórias de ${prof} passos. ${DIRS[best.dir].seta} teve a melhor média.` } };
    },
  };
}

function mcts(r, { iteracoes = 250, prof = 20, c = 1.2, gama = 0.95, registrar = false } = {}) {
  const novo = (s, recompensa) => ({ s, recompensa, filhos: new Map(), resta: s.vivo ? seguros(s) : [], N: 0, Q: 0 });
  return {
    decidir(j) {
      const raiz = novo(clonar(j), 0);
      if (!raiz.resta.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      const etapas = registrar ? [] : null;
      let nos = 0, sel = null, sim = null, expandiu = false;
      const iterar = no => {
        let G;
        if (no.resta.length) {                                   // expansão: um filho novo, sorteado
          const i = Math.floor(r() * no.resta.length), d = no.resta.splice(i, 1)[0];
          const s = clonar(no.s), antes = s.comidos;
          passo(s, d);
          const f = novo(s, s.comidos > antes ? 1 : s.vivo ? 0 : -1);
          if (!s.vivo || !s.comidas.length) { f.resta = []; f.terminal = true; }
          no.filhos.set(d, f);
          sel?.push(s.corpo[0]); expandiu = true;
          const sm = clonar(s);
          if (registrar) sim = [];
          G = f.recompensa + (f.terminal ? 0 : gama * simular(sm, r, prof, gama, sim));
          nos += sm.passos - no.s.passos;
          f.N++; f.Q += G;
        } else if (no.filhos.size) {                            // seleção pela UCB1
          let melhor = null, mv = -Infinity;
          for (const f of no.filhos.values()) {
            const u = f.Q / f.N + c * Math.sqrt(Math.log(no.N + 1) / f.N);
            if (u > mv) { mv = u; melhor = f; }
          }
          sel?.push(melhor.s.corpo[0]);
          G = melhor.terminal ? melhor.recompensa : melhor.recompensa + gama * iterar(melhor);
          melhor.N++; melhor.Q += G;
          return G;
        } else G = no.terminal ? 0 : -1;                         // beco sem saída
        return G;
      };
      for (let it = 0; it < iteracoes; it++) {
        if (registrar) { sel = []; sim = null; expandiu = false; }
        const G = iterar(raiz); raiz.N++; raiz.Q += G;
        etapas?.push({ t: 'iteracao', it: it + 1, total: iteracoes, sel, sim, G, expandiu, raiz: [...raiz.filhos].map(([d, f]) => ({ dir: d, N: f.N, Q: f.Q / f.N })) });
      }
      const cands = [...raiz.filhos].map(([d, f]) => ({ dir: d, valor: f.N, rotulo: `${f.N} visitas, Q = ${(f.Q / f.N).toFixed(2)}` }));
      const best = cands.reduce((a, b) => (b.valor > a.valor ? b : a));
      // variação principal: o caminho mais visitado
      const pv = [];
      for (let no = raiz.filhos.get(best.dir); no && pv.length < 40;) {
        pv.push(no.s.corpo[0]);
        let m = null;
        for (const f of no.filhos.values()) if (!m || f.N > m.N) m = f;
        no = m;
      }
      let tam = 0; const conta = no => { tam++; for (const f of no.filhos.values()) conta(f); }; conta(raiz);
      etapas?.push({ t: 'pv', caminho: pv });
      etapas?.push({ t: 'escolhe', dir: best.dir, texto: `Jogo o movimento mais visitado: ${DIRS[best.dir].seta} (${best.valor} de ${iteracoes} visitas). A linha verde é a variação principal: a jogada mais visitada em cada nível.` });
      return { dir: best.dir, pensamento: { nos, etapas, candidatos: cands, escolhido: best.dir, caminho: pv, texto: `MCTS: ${iteracoes} iterações (seleção pela UCB1, expansão, simulação aleatória, retropropagação) construíram uma árvore de ${tam} nós. Jogo o mais visitado: ${DIRS[best.dir].seta}.` } };
    },
  };
}

// --- algoritmo genético: evolui os pesos de uma função de avaliação ---

export const CARACTERISTICAS = ['morre', 'distância à comida', 'espaço livre', 'alcança a cauda', 'aperto'];

/** Características de um movimento, todas em [0, 1]. */
export function caracteristicas(j, d) {
  const nv = vizinho(j, j.corpo[0], d);
  const idx = indiceNoCorpo(j);
  if (d === oposta(j.dir) || nv < 0 || !livreEm(idx, j.corpo.length, nv, 1)) return [1, 0, 0, 0, 0];
  const dist = distComida(j, nv) / (j.w + j.h);
  const s = clonar(j); passo(s, d);
  if (s.venceu) return [0, 0, 1, 1, 0];
  const sidx = indiceNoCorpo(s), { area, cauda } = areaLivre(s, sidx);
  const livres = Math.max(1, s.w * s.h - s.nObst - s.corpo.length);
  let aperto = 0;
  for (let k = 0; k < 4; k++) { const u = vizinho(s, nv, k); if (u < 0 || !livreEm(sidx, s.corpo.length, u, 1)) aperto++; }
  return [0, Number.isFinite(dist) ? dist : 0, area / livres, cauda ? 1 : 0, aperto / 4];
}

/** Pesos encontrados por evoluir({ semente: 7 }) em 12 × 8 (veja o teste); servem para qualquer tamanho de grade. */
export const PESOS_CAMPEAO = [-2.26, -1.2, 0.92, 0.64, 0.16];

export function agenteGenetico(pesos) {
  return (_r, { registrar = false } = {}) => ({
    decidir(j) {
      const cands = [], etapas = registrar ? [] : null;
      for (let d = 0; d < 4; d++) {
        if (j.corpo.length > 1 && d === oposta(j.dir)) continue;
        const f = caracteristicas(j, d);
        const valor = f.reduce((s, x, i) => s + x * pesos[i], 0);
        cands.push({ dir: d, valor, rotulo: `nota ${valor.toFixed(2)}`, f });
        etapas?.push({ t: 'avalia', dir: d, valor, ruim: f[0] === 1, rotulo: `nota ${valor.toFixed(2)}`, f, pesos });
      }
      const best = cands.reduce((a, b) => (b.valor > a.valor ? b : a));
      etapas?.push({ t: 'escolhe', dir: best.dir, texto: `${DIRS[best.dir].seta} tem a maior nota (${best.valor.toFixed(2)}). Jogar é determinístico; o sorteio ficou no treino.` });
      return { dir: best.dir, pensamento: { nos: cands.length, etapas, candidatos: cands, escolhido: best.dir, texto: `Genético: a nota de cada movimento é Σ peso × característica, com pesos evoluídos. ${DIRS[best.dir].seta} teve a maior nota. (Jogar é determinístico; o sorteio está no treino.)` } };
    },
  });
}

/** Joga uma partida inteira sem desenhar. */
export function jogarPartida(criar, { w = 18, h = 12, comidas = 1, toroidal = false, semente = 1, sementeAgente = 1, passosMax = 50000, obstaculos = [], comida = null } = {}) {
  const j = novoJogo({ w, h, comidas, toroidal, semente, obstaculos, comida });
  const ag = criar(rng(sementeAgente));
  let nos = 0, decisoes = 0;
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  while (j.vivo && j.passos < passosMax) {
    const { dir, pensamento } = ag.decidir(j);
    nos += pensamento?.nos ?? 0; decisoes++;
    passo(j, dir);
  }
  const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
  return { comidos: j.comidos, passos: j.passos, motivo: j.vivo ? 'limite' : j.motivo, venceu: j.venceu, nos, decisoes, ms, corpo: j.corpo.slice() };
}

/** Algoritmo genético (gerador: uma geração por next()). Aptidão = 100 por comida + 0,05 por passo vivo. */
export function* evoluir({ pop = 24, geracoes = 15, jogos = 2, semente = 7, w = 12, h = 8, passosMax = 1500 } = {}) {
  const r = rng(semente), nf = CARACTERISTICAS.length;
  let popu = Array.from({ length: pop }, () => Array.from({ length: nf }, () => normal(r)));
  for (let ger = 1; ger <= geracoes; ger++) {
    const sementes = Array.from({ length: jogos }, (_, k) => 1000 * ger + k + 1);
    const apt = popu.map(p => {
      let s = 0;
      for (const sem of sementes) { const res = jogarPartida(agenteGenetico(p), { w, h, semente: sem, passosMax }); s += 100 * res.comidos + 0.05 * res.passos; }
      return s / jogos;
    });
    const ordem = apt.map((a, i) => i).sort((a, b) => apt[b] - apt[a]);
    yield { geracao: ger, melhor: apt[ordem[0]], media: apt.reduce((a, b) => a + b, 0) / pop, pesos: popu[ordem[0]].slice(), aptidoes: ordem.map(i => apt[i]) };
    const torneio = () => { let b = Math.floor(r() * pop); for (let k = 0; k < 2; k++) { const c = Math.floor(r() * pop); if (apt[c] > apt[b]) b = c; } return popu[b]; };
    const nova = [popu[ordem[0]].slice(), popu[ordem[1]].slice()];           // elitismo
    while (nova.length < pop) {
      const a = torneio(), b = torneio();
      nova.push(a.map((x, i) => (r() < 0.5 ? x : b[i]) + (r() < 0.3 ? 0.4 * normal(r) : 0)));   // cruzamento uniforme + mutação gaussiana
    }
    popu = nova;
  }
}

// =====================================================================
// Reprodução do raciocínio
// =====================================================================

export const celulaTxt = (j, v) => `(${v % j.w}, ${Math.floor(v / j.w)})`;

/** O que o agente "sabe" depois do evento i (inclusive). Função pura: a página pode voltar e avançar. */
export function revelar(etapas, i) {
  const s = {
    tipo: null, estrutura: null, expandidos: new Map(), fronteira: new Map(), atual: null, gerados: [], checados: [],
    caminho: [], definido: false, falhou: false, rollouts: [], medias: new Map(), visitas: new Map(), sel: null, sim: null,
    raiz: null, candidatos: new Map(), filtrados: null, fantasma: null, fantasmaOk: null, escolhido: null, trechos: [],
    ordens: null, ciclo: null, iteracao: 0, sorteio: null, evento: null,
  };
  for (let k = 0; k <= i && k < etapas.length; k++) {
    const e = etapas[k];
    s.evento = e;
    switch (e.t) {
      case 'inicio': s.tipo = e.tipo; s.estrutura = e.estrutura; s.fronteira.set(e.v, { g: 0, h: e.h, pr: e.tipo === 'gulosa' || e.tipo === 'astar' ? e.h : 0, seq: -1 }); break;
      case 'busca': s.expandidos = new Map(); s.fronteira = new Map(); s.atual = null; s.gerados = []; s.checados = []; s.caminho = []; break;
      case 'expande': s.expandidos.set(e.v, { ordem: s.expandidos.size + 1, g: e.g, h: e.h, pai: e.pai });s.fronteira.delete(e.v); s.atual = e.v; s.gerados = []; s.checados = []; break;
      case 'corpo': s.checados.push(e); break;
      case 'gera': s.fronteira.set(e.v, { g: e.g, h: e.h, pr: e.pr, seq: e.seq }); s.gerados.push(e.v); break;
      case 'objetivo': s.atual = e.v; s.gerados = []; s.checados = []; break;
      case 'reconstroi': s.caminho.unshift(e.v); break;
      case 'definido': s.caminho = e.caminho.slice(); s.definido = true; break;
      case 'falhou': s.falhou = true; break;
      case 'trecho': s.trechos.push(e); break;
      case 'ordem': s.ordens = e; break;
      case 'fantasma': s.fantasma = e.corpo; s.fantasmaOk = e.ok; break;
      case 'avalia': s.candidatos.set(e.dir, { ...e }); break;
      case 'filtra': s.filtrados = e.dirs; break;
      case 'sorteio': s.sorteio = e; break;
      case 'tenta': { const c = s.candidatos.get(e.dir); if (c) { c.x = e.x; c.aceita = e.aceita; } break; }
      case 'rollout': {
        s.rollouts.push(e);
        const m = s.medias.get(e.dir) ?? { soma: 0, n: 0 };
        m.soma += e.valor; m.n++; s.medias.set(e.dir, m);
        break;
      }
      case 'iteracao':
        s.iteracao = e.it; s.sel = e.sel; s.sim = e.sim; s.raiz = e.raiz;
        for (const v of e.sel ?? []) s.visitas.set(v, (s.visitas.get(v) ?? 0) + 1);
        break;
      case 'pv': s.caminho = e.caminho.slice(); s.definido = true; break;
      case 'ciclo': s.ciclo = e.ciclo; break;
      case 'segue': s.caminho.push(e.v); break;
      case 'escolhe': s.escolhido = e.dir; break;
      default: break;
    }
  }
  return s;
}

/** A fronteira na ordem em que o algoritmo a esvaziaria (fila: mais antigo; pilha: mais novo; prioridade: menor chave). */
export function ordemFronteira(estado) {
  const itens = [...estado.fronteira].map(([v, x]) => ({ v, ...x }));
  if (estado.tipo === 'bfs') itens.sort((a, b) => a.seq - b.seq);
  else if (estado.tipo === 'dfs') itens.sort((a, b) => b.seq - a.seq);
  else itens.sort((a, b) => a.pr - b.pr || (estado.tipo === 'astar' ? a.h - b.h : 0) || a.seq - b.seq);
  return itens;
}

const fmtNum = x => (Number.isInteger(x) ? String(x) : x.toFixed(2)).replace('.', ',');
/** Os valores que importam para cada estratégia: a chave de prioridade em destaque. */
function chaves(e) {
  switch (e.tipo) {
    case 'astar': return `g = ${fmtNum(e.g)}, h = ${e.h}, f = g + h = ${fmtNum(e.g + e.h)}`;
    case 'gulosa': return `h = ${e.h} (a gulosa só olha h; g = ${fmtNum(e.g)} é ignorado)`;
    case 'ucs': return `g = ${fmtNum(e.g)} (custo acumulado, a chave da fila)`;
    default: return `profundidade ${fmtNum(e.g)}`;
  }
}

/** Explica um evento em português. */
export function narrar(j, e) {
  const c = v => celulaTxt(j, v), seta = d => DIRS[d].seta;
  switch (e.t) {
    case 'inicio': return `Começo pela cabeça ${c(e.v)}: ela é o único nó da fronteira, que é uma ${e.estrutura}.${e.cienteTempo ? ' Vou checar, para cada segmento do corpo, se ele já terá saído quando eu chegar.' : ' O corpo é parede (só a cauda sai do lugar).'}`;
    case 'busca': return `Nova busca: de ${c(e.de)} até a comida em ${c(e.para)} (um trecho do caixeiro viajante).`;
    case 'expande': return `Tiro ${c(e.v)} da fronteira (${e.n}º expandido): ${chaves(e)}. Não é comida; gero os vizinhos.`;
    case 'corpo': return e.seg === e.L - 1 && !e.cienteTempo
      ? `${c(e.v)} é a cauda: ela sai do lugar no próximo passo, então está livre.`
      : e.cienteTempo
        ? `${c(e.v)} é o segmento ${e.seg} de ${e.L}: sai do lugar em ${e.L - e.seg} passos; eu chegaria no passo ${e.k}. ${e.livre ? 'Livre ✓' : 'Ainda ocupado ✗'}`
        : `${c(e.v)} é o segmento ${e.seg} do corpo: parede.`;
    case 'gera': return `${c(e.v)} entra na fronteira: ${chaves(e)} (pai ${c(e.pai)}).`;
    case 'objetivo': return `A comida ${c(e.v)} saiu da fronteira: o caminho está DEFINIDO (custo ${fmtNum(e.g)}, depois de ${e.n} expansões). Antes disso, nada garantia que não havia um melhor.`;
    case 'reconstroi': return `Reconstruo o caminho seguindo os pais, da comida até a cabeça: ${c(e.v)}.`;
    case 'definido': return `Caminho de ${e.caminho.length} passos, custo ${fmtNum(e.custo)}. Agora é só segui-lo.`;
    case 'falhou': return `A fronteira esvaziou depois de ${e.n} expansões: não há caminho até a comida neste modelo.`;
    case 'trecho': return `Trecho ${c(e.de)} → ${c(e.para)}: ${Number.isFinite(e.passos) ? `${e.passos} passos` : 'sem caminho'}.`;
    case 'ordem': return `Comparo as ${e.ordens.length} ordens de visita: ${e.ordens.map(o => `${o.ordem.map(c).join('→')} = ${Number.isFinite(o.total) ? o.total : '∞'}`).join('; ')}. A melhor tem ${e.total} passos.`;
    case 'fantasma': return e.ok ? `Simulo a cobra seguindo o caminho e comendo (fantasma tracejado). Depois de comer, ela ainda tem rota de fuga ✓.` : `Simulo a cobra seguindo o caminho e comendo (fantasma tracejado). Depois de comer, ela fica SEM rota de fuga ✗: o caminho é uma armadilha.`;
    case 'avalia': return `${seta(e.dir)}: ${e.rotulo}${e.f ? ` (características ${e.f.map(x => x.toFixed(2)).join(', ')})` : ''}.`;
    case 'filtra': return e.texto;
    case 'sorteio': return `Sorteio: x = ${e.x.toFixed(3)} entre ${e.de} opção(ões) → ${seta(e.dir)}.`;
    case 'tenta': return `Sorteei ${seta(e.dir)} (Δ = ${e.delta > 0 ? '+' : ''}${e.delta}). x = ${e.x.toFixed(3)} ${e.aceita ? '<' : '≥'} p = ${e.p.toFixed(3)} → ${e.aceita ? 'aceito' : 'rejeito'}.`;
    case 'rollout': return `Simulação ${e.k}/${e.K} começando por ${seta(e.dir)}: ${e.celulas.length - 1} passos ao acaso, ${e.morreu ? 'morreu' : 'sobreviveu'}${e.comeu ? ', comeu' : ''}; valor ${e.valor.toFixed(2)}.`;
    case 'iteracao': return `Iteração ${e.it}/${e.total}: desço pela árvore escolhendo pela UCB1 (${e.sel.length} nível(is)), ${e.expandiu ? 'expando um nó novo e simulo ao acaso' : 'chego a um nó terminal'}; resultado ${e.G.toFixed(2)} sobe de volta até a raiz.`;
    case 'pv': return 'Variação principal: a jogada mais visitada em cada nível da árvore.';
    case 'ciclo': return 'O ciclo hamiltoniano está pronto desde o início (cinza). Não há busca: só sigo o ciclo até a comida.';
    case 'segue': return `O ciclo passa por ${c(e.v)}.`;
    case 'nota': return e.texto;
    case 'escolhe': return `Decisão: ${seta(e.dir)}. ${e.texto ?? ''}`;
    default: return '';
  }
}

// =====================================================================
// Catálogo
// =====================================================================

const plan = (tipo, rotulo, extra = {}) => planejador((j, idx, registrar) => buscar(j, { tipo, idx, registrar, ...extra }), rotulo);

export const ALGORITMOS = {
  deterministicos: [
    { id: 'bfs', nome: 'Largura (BFS)', grupo: 'Busca cega', criar: plan('bfs', 'BFS'),
      ideia: 'Expande em ondas a partir da cabeça (fila). A primeira comida tirada da fila está no menor número de passos.',
      completo: 'sim', otimo: 'sim (custos iguais)', morte: 'Trata o corpo como parede fixa e só olha até a comida: come e fica sem saída.' },
    { id: 'dfs', nome: 'Profundidade (DFS)', grupo: 'Busca cega', criar: plan('dfs', 'DFS'),
      ideia: 'Mergulha sempre no primeiro vizinho (↑, →, ↓, ←) e só volta quando trava (pilha). Acha um caminho, raramente o curto.',
      completo: 'sim, em grade finita', otimo: 'não', morte: 'Caminhos enormes e sinuosos: a cobra se enrola em si mesma.' },
    { id: 'ucs', nome: 'Custo uniforme (com risco)', grupo: 'Busca cega', criar: planejador((j, idx, registrar) => buscar(j, { tipo: 'ucs', idx, registrar, custo: custoRisco(j, idx) }), 'Custo uniforme'),
      ideia: 'Expande o menor custo acumulado g. Aqui cada célula custa 1 + 2 por vizinho bloqueado: o caminho mais barato foge de paredes, obstáculos e do corpo.',
      completo: 'sim', otimo: 'sim, no custo de risco', morte: 'Vive mais que a BFS em espaços abertos, mas também não pensa no depois.' },
    { id: 'gulosa', nome: 'Gulosa (só h)', grupo: 'Busca informada', criar: plan('gulosa', 'Gulosa'),
      ideia: 'Expande quem parece mais perto da comida pela distância de Manhattan h, ignorando o custo até ali.',
      completo: 'sim, em grade finita', otimo: 'não', morte: 'Poucas expansões; obstáculos em U a enganam (veja o mapa "armadilha em U").' },
    { id: 'astar', nome: 'A* (g + h)', grupo: 'Busca informada', criar: plan('astar', 'A*'),
      ideia: 'Expande o menor f = g + h. Com h admissível (Manhattan nunca superestima), acha o caminho mais curto expandindo menos que a BFS.',
      completo: 'sim', otimo: 'sim', morte: 'O mesmo da BFS: o caminho ótimo até a comida pode ser uma armadilha.' },
    { id: 'caixeiro', nome: 'A* + caixeiro viajante', grupo: 'A* adaptado à cobra', criar: planejador(planoCaixeiro, 'A* + caixeiro'),
      ideia: 'Com várias comidas, testa todas as ordens de visita (3! = 6 com três) e segue o 1º trecho da melhor. Ideia do projeto original. Com uma comida, é o A*.',
      completo: 'sim', otimo: 'na ordem de visita, aproximado nos trechos', morte: 'Mais eficiente com 3 comidas, mas tão míope quanto o A*.' },
    { id: 'astar-tempo', nome: 'A* ciente do tempo', grupo: 'A* adaptado à cobra', criar: plan('astar', 'A* ciente do tempo', { cienteTempo: true }),
      ideia: 'Um segmento a k posições da cauda sai do lugar em k passos. Se a cabeça chega depois disso, a célula não é obstáculo: acha caminhos que o A* comum julga bloqueados.',
      completo: 'sim', otimo: 'sim, no modelo com tempo', morte: 'Modelo melhor do presente, mas continua sem olhar para depois da comida.' },
    { id: 'astar-seguro', nome: 'A* seguro (com fantasma)', grupo: 'A* adaptado à cobra', criar: aEstrelaSeguro,
      ideia: 'Antes de ir, simula a cobra comendo (o fantasma). Se depois ela não tem rota de fuga (chegar ao rastro do próprio corpo, que vai se liberando), não vai: dá um passo seguro e tenta de novo.',
      completo: '—', otimo: 'não, prefere sobreviver', morte: 'Vive bem mais que o A*; às vezes fica girando em segurança até morrer de fome.' },
    { id: 'hamiltoniano', nome: 'Ciclo hamiltoniano', grupo: 'Sem busca', criar: hamiltoniano,
      ideia: 'Percorre sempre o mesmo ciclo que passa por todas as células. Não planeja nada e mesmo assim nunca morre: a cauda está sempre à frente.',
      completo: 'vence sempre (sem obstáculos)', otimo: 'não, muito lento', morte: 'Sem obstáculos, não morre. Com obstáculos, o ciclo pronto não existe (achar um é NP-difícil).' },
  ],
  nao_deterministicos: [
    { id: 'aleatorio', nome: 'Passeio aleatório', grupo: 'Linha de base', criar: aleatorio,
      ideia: 'Sorteia entre os movimentos que não matam no próximo passo. A referência mínima: tudo deve ser melhor que isto.',
      completo: 'não', otimo: 'não', morte: 'Morre de fome ou se fecha num beco.' },
    { id: 'subida', nome: 'Subida de encosta estocástica', grupo: 'Busca local', criar: subidaEncosta,
      ideia: 'Só olha os vizinhos: sorteia entre os que chegam mais perto da comida. Sem memória e sem plano.',
      completo: 'não', otimo: 'não', morte: 'Ótimos locais: atrás de um obstáculo, nenhum vizinho "sobe".' },
    { id: 'tempera', nome: 'Têmpera simulada', grupo: 'Busca local', criar: temperaSimulada,
      ideia: 'Sorteia um vizinho; melhora é aceita, piora é aceita com probabilidade e^(Δ/T). A temperatura cai a cada passo sem comer: começa explorando e termina gulosa.',
      completo: 'não', otimo: 'não', morte: 'Aqui a aleatoriedade quase não ajuda: o perigo não é um ótimo local, é o próprio corpo. Compare com a subida de encosta na corrida.' },
    { id: 'montecarlo', nome: 'Monte Carlo', grupo: 'Simulação', criar: monteCarlo,
      ideia: 'Para cada movimento, joga 20 partidas aleatórias de 30 passos e fica com a melhor média. O futuro é estimado por amostragem.',
      completo: 'não', otimo: 'converge com mais amostras', morte: 'Evita becos que as simulações revelam; perde comida longe.' },
    { id: 'mcts', nome: 'MCTS (UCT)', grupo: 'Simulação', criar: mcts,
      ideia: 'Constrói uma árvore de jogadas guiada pela UCB1: explora o promissor sem esquecer o pouco testado. É o algoritmo por trás do AlphaGo.',
      completo: 'não', otimo: 'converge com mais iterações', morte: 'Mais cuidadoso que o Monte Carlo simples; caro por decisão.' },
    { id: 'genetico', nome: 'Algoritmo genético', grupo: 'Evolução', criar: agenteGenetico(PESOS_CAMPEAO),
      ideia: 'Uma população de pesos evolui por seleção, cruzamento e mutação. Cada movimento recebe uma nota (morre? distância? espaço livre? alcança a cauda?).',
      completo: 'não', otimo: 'não', morte: 'Depende da evolução: bons pesos aprendem a valorizar espaço livre.' },
  ],
};
export const TODOS = [...ALGORITMOS.deterministicos, ...ALGORITMOS.nao_deterministicos];
export const porId = id => TODOS.find(a => a.id === id);
