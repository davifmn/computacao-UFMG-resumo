// Grafos: representação, BFS, DFS (com tempos e classificação de arestas),
// ordenação topológica, Dijkstra, Bellman-Ford, Kruskal e Prim.
// Tudo puro: cada função devolve a lista de passos que a página desenha.

import { lineFinder } from '../../../engine/highlight.js';

// ---------- Grafos de exemplo (posições na tela de 900 × 500) ----------

export const PRESETS = {
  // não direcionado, sem pesos: BFS e DFS
  bairro: {
    nome: 'Grafo não direcionado', directed: false,
    names: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    pos: [[80, 90], [230, 60], [210, 220], [380, 150], [80, 330], [270, 380], [470, 300], [560, 120]],
    edges: [[0, 1], [0, 2], [0, 4], [1, 3], [2, 3], [2, 5], [4, 5], [3, 6], [5, 6], [3, 7], [6, 7]],
  },
  // DAG do CLRS: em que ordem se vestir
  roupas: {
    nome: 'Vestir-se (DAG)', directed: true,
    names: ['cueca', 'calça', 'cinto', 'camisa', 'gravata', 'paletó', 'meias', 'sapatos', 'relógio'],
    pos: [[70, 70], [70, 200], [200, 300], [330, 70], [330, 200], [330, 360], [480, 70], [480, 200], [480, 360]],
    edges: [[0, 1], [0, 7], [1, 2], [1, 7], [3, 2], [3, 4], [4, 5], [2, 5], [6, 7]],
  },
  // direcionado com ciclo: aparece aresta de retorno
  ciclo: {
    nome: 'Direcionado com ciclo', directed: true,
    names: ['u', 'v', 'w', 'x', 'y', 'z'],
    pos: [[90, 110], [300, 110], [510, 110], [90, 340], [300, 340], [510, 340]],
    edges: [[0, 1], [0, 3], [1, 4], [2, 4], [2, 5], [3, 1], [4, 3], [5, 5]],
  },
  // ponderado e direcionado: Dijkstra (CLRS, fig. 24.6)
  cidades: {
    nome: 'Rodovias (pesos ≥ 0)', directed: true,
    names: ['s', 't', 'x', 'y', 'z'],
    pos: [[70, 230], [250, 90], [470, 90], [250, 370], [470, 370]],
    edges: [[0, 1, 10], [0, 3, 5], [1, 2, 1], [1, 3, 2], [2, 4, 4], [3, 1, 3], [3, 2, 9], [3, 4, 2], [4, 0, 7], [4, 2, 6]],
  },
  // aresta negativa: Dijkstra erra, Bellman-Ford acerta
  negativa: {
    nome: 'Com aresta negativa', directed: true,
    names: ['A', 'B', 'C', 'D', 'E'],
    pos: [[70, 230], [270, 100], [270, 370], [480, 100], [480, 370]],
    edges: [[0, 1, 2], [0, 2, 5], [2, 1, -4], [1, 3, 1], [3, 4, 3], [2, 4, 6]],
  },
  // ciclo negativo: Bellman-Ford detecta
  cicloNeg: {
    nome: 'Com ciclo negativo', directed: true,
    names: ['A', 'B', 'C', 'D'],
    pos: [[70, 230], [270, 100], [480, 230], [270, 370]],
    edges: [[0, 1, 4], [1, 2, -2], [2, 3, 1], [3, 1, -1], [0, 3, 5]],
  },
  // não direcionado e ponderado: árvore geradora mínima
  rede: {
    nome: 'Rede de fibra (MST)', directed: false,
    names: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
    pos: [[60, 230], [170, 90], [330, 90], [480, 90], [590, 230], [480, 370], [330, 370], [170, 370], [260, 230]],
    edges: [[0, 1, 4], [0, 7, 8], [1, 2, 8], [1, 7, 11], [2, 3, 7], [2, 8, 2], [2, 5, 4], [3, 4, 9], [3, 5, 14], [4, 5, 10], [5, 6, 2], [6, 7, 1], [6, 8, 6], [7, 8, 7]],
  },
};

/** Lista de adjacência; vizinhos em ordem de índice (a ordem que o código percorre). */
export function adjacency(G) {
  const adj = G.names.map(() => []);
  for (const [u, v, w = 1] of G.edges) {
    adj[u].push({ v, w });
    if (!G.directed && u !== v) adj[v].push({ v: u, w });
  }
  for (const l of adj) l.sort((a, b) => a.v - b.v);
  return adj;
}

/** Chave canônica de uma aresta (para colorir na tela). */
export const ek = (G, u, v) => (G.directed || u < v ? `${u}-${v}` : `${v}-${u}`);

const nm = (G, u) => G.names[u];

// ---------- BFS ----------

export const BFS_CODE = `void bfs(int s) {
    vector<int> dist(n, -1), pai(n, -1);
    queue<int> fila;
    dist[s] = 0;
    fila.push(s);
    while (!fila.empty()) {
        int u = fila.front(); fila.pop();
        for (int v : adj[u])
            if (dist[v] == -1) {          // ainda não descoberto
                dist[v] = dist[u] + 1;
                pai[v] = u;
                fila.push(v);
            }
    }
}`;

export function bfsSteps(G, s = 0) {
  const L = lineFinder(BFS_CODE);
  const adj = adjacency(G);
  const n = G.names.length;
  const dist = Array(n).fill(-1), pai = Array(n).fill(-1), cor = Array(n).fill('branco');
  const fila = [], tree = [], steps = [];
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, cor: [...cor], dist: [...dist], pai: [...pai], fila: [...fila], tree: [...tree], ...extra,
    vars: { u: extra.u != null ? nm(G, extra.u) : '—', v: extra.v != null ? nm(G, extra.v) : '—', fila: fila.map(x => nm(G, x)).join(' ') || '∅' },
  });
  snap(L('void bfs'), `Busca em largura a partir de <b>${nm(G, s)}</b>. Ela visita os vértices em "ondas": primeiro os vizinhos de ${nm(G, s)}, depois os vizinhos dos vizinhos...`);
  dist[s] = 0; cor[s] = 'cinza'; fila.push(s);
  snap(L('fila.push(s)'), `${nm(G, s)} está a distância 0 de si mesmo e entra na fila. <b>Cinza</b> = descoberto, mas com vizinhos ainda por examinar.`, { u: s });
  while (fila.length) {
    const u = fila.shift();
    snap(L('int u = fila.front()'), `Tira <b>${nm(G, u)}</b> da frente da fila (FIFO). Quem entrou primeiro está mais perto de ${nm(G, s)}.`, { u });
    for (const { v } of adj[u]) {
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1; pai[v] = u; cor[v] = 'cinza'; fila.push(v); tree.push(ek(G, u, v));
        snap(L('fila.push(v)'), `${nm(G, v)} ainda não tinha sido visto: dist[${nm(G, v)}] = dist[${nm(G, u)}] + 1 = <b>${dist[v]}</b>, pai = ${nm(G, u)}, entra no fim da fila.`, { u, v, edge: ek(G, u, v) });
      } else {
        snap(L('if (dist[v] == -1)'), `${nm(G, v)} já foi descoberto (dist ${dist[v]}): nada a fazer. Por isso a BFS é $O(V + E)$: cada vértice entra na fila uma vez só.`, { u, v, edge: ek(G, u, v), seen: true });
      }
    }
    cor[u] = 'preto';
    snap(L('while (!fila.empty())'), `${nm(G, u)} terminou (<b>preto</b>): todos os vizinhos foram examinados.`, { u });
  }
  snap(null, `Fim. As arestas azuis formam a <b>árvore de BFS</b>: o caminho de ${nm(G, s)} até qualquer vértice nela tem o <b>menor número de arestas</b> possível.`, { done: true });
  return steps;
}

// ---------- DFS ----------

export const DFS_CODE = `int tempo = 0;
void dfs(int u) {
    cor[u] = CINZA;
    d[u] = ++tempo;                   // descoberta
    for (int v : adj[u])
        if (cor[v] == BRANCO) {
            pai[v] = u;
            dfs(v);                   // aresta de árvore
        }
    cor[u] = PRETO;
    f[u] = ++tempo;                   // término
    ordem.push_front(u);              // ordenação topológica
}

void buscaCompleta() {
    for (int u = 0; u < n; u++)
        if (cor[u] == BRANCO) dfs(u);
}`;

export const EDGE_KIND = { arvore: 'árvore', retorno: 'retorno', avanco: 'avanço', cruzamento: 'cruzamento' };

export function dfsSteps(G) {
  const L = lineFinder(DFS_CODE);
  const adj = adjacency(G);
  const n = G.names.length;
  const cor = Array(n).fill('branco'), d = Array(n).fill(null), f = Array(n).fill(null), pai = Array(n).fill(-1);
  const pilha = [], ordem = [], kinds = {}, steps = [];
  let tempo = 0;
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, cor: [...cor], d: [...d], f: [...f], pilha: [...pilha], ordem: [...ordem], kinds: { ...kinds }, ...extra,
    vars: { u: extra.u != null ? nm(G, extra.u) : '—', v: extra.v != null ? nm(G, extra.v) : '—', tempo, pilha: pilha.map(x => nm(G, x)).join(' → ') || '∅' },
  });
  const visit = u => {
    pilha.push(u);
    cor[u] = 'cinza'; d[u] = ++tempo;
    snap(L('d[u] = ++tempo'), `Entra em <b>${nm(G, u)}</b>: fica cinza e recebe o tempo de descoberta d = ${tempo}. A pilha de chamadas é o caminho atual.`, { u });
    for (const { v } of adj[u]) {
      const key = ek(G, u, v);
      if (!G.directed && kinds[key]) continue;   // a aresta já foi vista pelo outro lado
      if (cor[v] === 'branco') {
        kinds[key] = 'arvore'; pai[v] = u;
        snap(L('dfs(v);'), `${nm(G, v)} é branco: aresta de <b>árvore</b>. Mergulha em ${nm(G, v)} antes de olhar os outros vizinhos de ${nm(G, u)}.`, { u, v, edge: key });
        visit(v);
        snap(L('for (int v : adj[u])'), `De volta em ${nm(G, u)}: continua pelos vizinhos que faltam.`, { u });
      } else {
        let kind, why;
        if (cor[v] === 'cinza') { kind = 'retorno'; why = `${nm(G, v)} está cinza, ou seja, na pilha: a aresta volta para um ancestral. <b>Há um ciclo!</b>`; }
        else if (G.directed && d[u] < d[v]) { kind = 'avanco'; why = `${nm(G, v)} é preto e foi descoberto depois de ${nm(G, u)}: é descendente, aresta de <b>avanço</b>.`; }
        else { kind = 'cruzamento'; why = `${nm(G, v)} é preto e de outro ramo: aresta de <b>cruzamento</b>.`; }
        if (!G.directed && kind === 'retorno' && pai[u] === v) continue; // a própria aresta da árvore, vista de volta
        kinds[key] = kind;
        snap(L('if (cor[v] == BRANCO)'), why, { u, v, edge: key });
      }
    }
    cor[u] = 'preto'; f[u] = ++tempo; ordem.unshift(u); pilha.pop();
    snap(L('f[u] = ++tempo'), `${nm(G, u)} termina (preto, f = ${tempo}) e vai para o <b>início</b> da lista de ordem. Quem termina por último fica na frente.`, { u });
  };
  snap(L('void buscaCompleta'), 'Busca em profundidade: vá o mais fundo possível e só volte quando não houver vizinho novo. Todos começam <b>brancos</b>.');
  for (let u = 0; u < n; u++) {
    if (cor[u] !== 'branco') continue;
    snap(L('if (cor[u] == BRANCO) dfs(u)'), `${nm(G, u)} ainda é branco: começa uma nova árvore da floresta de DFS.`, { u });
    visit(u);
  }
  const cyc = Object.values(kinds).includes('retorno');
  snap(null, G.directed
    ? (cyc ? 'Fim. Apareceu aresta de <b>retorno</b>: o grafo tem ciclo, então <b>não existe</b> ordenação topológica.' : `Fim. Nenhuma aresta de retorno: é um DAG. A lista em ordem decrescente de término é uma <b>ordenação topológica</b>: ${ordem.map(x => nm(G, x)).join(' → ')}.`)
    : `Fim. Num grafo não direcionado só existem arestas de árvore e de retorno.${cyc ? ' Como há aresta de retorno, há ciclo.' : ''}`, { done: true });
  return steps;
}

/** Ordenação topológica pela DFS; null se houver ciclo. */
export function topoOrder(G) {
  const last = dfsSteps(G).at(-1);
  return Object.values(last.kinds).includes('retorno') ? null : last.ordem;
}

// ---------- Dijkstra ----------

export const DIJKSTRA_CODE = `void dijkstra(int s) {
    dist.assign(n, INF);
    dist[s] = 0;
    pq.push({0, s});                  // fila de prioridade (menor dist primeiro)
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (feito[u]) continue;       // entrada velha na fila
        feito[u] = true;              // dist[u] é definitiva
        for (auto [v, w] : adj[u])
            if (!feito[v] && dist[u] + w < dist[v]) {   // relaxamento
                dist[v] = dist[u] + w;
                pai[v] = u;
                pq.push({dist[v], v});
            }
    }
}`;

export function dijkstraSteps(G, s = 0) {
  const L = lineFinder(DIJKSTRA_CODE);
  const adj = adjacency(G);
  const n = G.names.length;
  const dist = Array(n).fill(Infinity), pai = Array(n).fill(-1), feito = Array(n).fill(false);
  let pq = [];
  const steps = [];
  const tree = () => pai.map((p, v) => (p >= 0 ? ek(G, p, v) : null)).filter(Boolean);
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, dist: [...dist], pai: [...pai], feito: [...feito], pq: pq.map(e => ({ ...e })), tree: tree(), ...extra,
    vars: { u: extra.u != null ? nm(G, extra.u) : '—', v: extra.v != null ? nm(G, extra.v) : '—', ...(extra.w != null ? { w: extra.w } : {}) },
  });
  const push = (d, u) => { pq.push({ d, u }); pq.sort((a, b) => a.d - b.d || a.u - b.u); };
  snap(L('void dijkstra'), `Dijkstra a partir de <b>${nm(G, s)}</b>: todas as distâncias começam em ∞.`);
  dist[s] = 0; push(0, s);
  snap(L('pq.push({0, s})'), `dist[${nm(G, s)}] = 0. A fila de prioridade sempre entrega o vértice <b>mais próximo</b> ainda não finalizado.`);
  while (pq.length) {
    const { d, u } = pq.shift();
    if (feito[u]) { snap(L('if (feito[u]) continue'), `Saiu (${d}, ${nm(G, u)}), mas ${nm(G, u)} já foi finalizado com ${dist[u]}: entrada velha, ignora.`, { u }); continue; }
    feito[u] = true;
    snap(L('feito[u] = true'), `Extrai <b>${nm(G, u)}</b> com distância ${dist[u]}. Ela é <b>definitiva</b>: qualquer outro caminho passaria por um vértice com distância ≥ ${dist[u]} e (com pesos ≥ 0) só ficaria mais longo.`, { u });
    for (const { v, w } of adj[u]) {
      const key = ek(G, u, v);
      if (feito[v]) { snap(L('if (!feito[v]'), `${nm(G, v)} já está finalizado: a aresta ${nm(G, u)}→${nm(G, v)} (peso ${w}) não é examinada.${dist[u] + w < dist[v] ? ` <b>Atenção:</b> ${dist[u]} + (${w}) = ${dist[u] + w} < ${dist[v]}. Com peso negativo, a distância "definitiva" de ${nm(G, v)} estava errada!` : ''}`, { u, v, w, edge: key, bad: dist[u] + w < dist[v] }); continue; }
      const cand = dist[u] + w;
      if (cand < dist[v]) {
        const old = dist[v];
        dist[v] = cand; pai[v] = u; push(cand, v);
        snap(L('dist[v] = dist[u] + w'), `<b>Relaxa</b> ${nm(G, u)}→${nm(G, v)}: ${dist[u]} + ${w} = ${cand} < ${old === Infinity ? '∞' : old}. Achamos um caminho melhor até ${nm(G, v)}.`, { u, v, w, edge: key, relax: true });
      } else {
        snap(L('if (!feito[v]'), `${nm(G, u)}→${nm(G, v)}: ${dist[u]} + ${w} = ${cand} não melhora ${dist[v]}.`, { u, v, w, edge: key });
      }
    }
  }
  snap(null, `Fim. As arestas azuis formam a <b>árvore de caminhos mínimos</b>. Com fila de prioridade em heap, o custo é $O((V + E)\\log V)$.`, { done: true });
  return steps;
}

// ---------- Bellman-Ford ----------

export const BELLMAN_CODE = `bool bellmanFord(int s) {
    dist.assign(n, INF);
    dist[s] = 0;
    for (int i = 1; i <= n - 1; i++) {
        bool mudou = false;
        for (auto [u, v, w] : arestas)
            if (dist[u] != INF && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pai[v] = u;
                mudou = true;
            }
        if (!mudou) break;            // já convergiu
    }
    for (auto [u, v, w] : arestas)    // uma rodada a mais:
        if (dist[u] != INF && dist[u] + w < dist[v])
            return false;             // ciclo negativo!
    return true;
}`;

export function bellmanFordSteps(G, s = 0) {
  const L = lineFinder(BELLMAN_CODE);
  const n = G.names.length;
  const arestas = G.edges.flatMap(([u, v, w]) => (G.directed ? [[u, v, w]] : [[u, v, w], [v, u, w]]));
  const dist = Array(n).fill(Infinity), pai = Array(n).fill(-1);
  const steps = [];
  let rodada = 0;
  const tree = () => pai.map((p, v) => (p >= 0 ? ek(G, p, v) : null)).filter(Boolean);
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, dist: [...dist], pai: [...pai], tree: tree(), rodada, ...extra,
    vars: { i: rodada || '—', ...(extra.e ? { aresta: `${nm(G, extra.e[0])}→${nm(G, extra.e[1])} (${extra.e[2]})` } : {}) },
  });
  dist[s] = 0;
  snap(L('dist[s] = 0'), `Bellman-Ford a partir de <b>${nm(G, s)}</b>. Em vez de escolher o próximo vértice com cuidado, ele relaxa <b>todas</b> as arestas, $V - 1$ vezes.`);
  let negCycle = false;
  for (rodada = 1; rodada <= n - 1; rodada++) {
    let mudou = false;
    snap(L('bool mudou = false'), `Rodada ${rodada}: depois dela, estão certas as distâncias de todos os caminhos mínimos com até ${rodada} aresta(s).`);
    for (const e of arestas) {
      const [u, v, w] = e;
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        const old = dist[v];
        dist[v] = dist[u] + w; pai[v] = u; mudou = true;
        snap(L('dist[v] = dist[u] + w'), `Relaxa ${nm(G, u)}→${nm(G, v)}: ${dist[u]} + (${w}) = <b>${dist[v]}</b> < ${old === Infinity ? '∞' : old}.`, { e, edge: ek(G, u, v), relax: true });
      } else {
        snap(L('if (dist[u] != INF && dist[u] + w < dist[v])'), dist[u] === Infinity ? `${nm(G, u)} ainda está em ∞: a aresta ${nm(G, u)}→${nm(G, v)} não ajuda (por enquanto).` : `${nm(G, u)}→${nm(G, v)}: ${dist[u]} + (${w}) = ${dist[u] + w} não melhora ${dist[v]}.`, { e, edge: ek(G, u, v) });
      }
    }
    if (!mudou) { snap(L('if (!mudou) break'), `Nada mudou na rodada ${rodada}: as distâncias já são finais. Parada antecipada.`); break; }
  }
  rodada = Math.min(rodada, n - 1);
  for (const e of arestas) {
    const [u, v, w] = e;
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
      negCycle = true;
      snap(L('return false'), `Depois de ${n - 1} rodadas ainda dá para melhorar ${nm(G, v)} pela aresta ${nm(G, u)}→${nm(G, v)}. Isso só acontece se existir um <b>ciclo de peso negativo</b>: dá para dar voltas e baixar o custo para sempre.`, { e, edge: ek(G, u, v), bad: true });
      break;
    }
  }
  if (!negCycle) snap(L('return true'), `Rodada extra sem melhoria: <b>não há ciclo negativo</b>. Custo $O(V \\cdot E)$, mais caro que Dijkstra, mas funciona com pesos negativos.`, { done: true });
  steps.at(-1).negCycle = negCycle;
  return steps;
}

// ---------- Árvore geradora mínima ----------

export const KRUSKAL_CODE = `int achar(int x) {                    // representante do conjunto
    return pai[x] == x ? x : pai[x] = achar(pai[x]);
}

vector<Aresta> kruskal() {
    sort(arestas.begin(), arestas.end());     // por peso
    for (int v = 0; v < n; v++) pai[v] = v;   // cada um sozinho
    vector<Aresta> arvore;
    for (auto [w, u, v] : arestas) {
        int a = achar(u), b = achar(v);
        if (a != b) {                         // não forma ciclo
            pai[a] = b;                       // une os conjuntos
            arvore.push_back({w, u, v});
        }
    }
    return arvore;
}`;

export function kruskalSteps(G) {
  const L = lineFinder(KRUSKAL_CODE);
  const n = G.names.length;
  const pai = [...Array(n).keys()];
  const achar = x => (pai[x] === x ? x : (pai[x] = achar(pai[x])));
  const sorted = G.edges.map(([u, v, w], i) => ({ u, v, w, i })).sort((a, b) => a.w - b.w || a.i - b.i);
  const tree = [], rejected = [], steps = [];
  let total = 0;
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, comp: G.names.map((_, v) => achar(v)), tree: [...tree], rejected: [...rejected], total, sorted, ...extra,
    vars: { 'arestas na árvore': `${tree.length} / ${n - 1}`, 'peso total': total, ...(extra.cur ? { aresta: `${nm(G, extra.cur.u)}–${nm(G, extra.cur.v)} (${extra.cur.w})` } : {}) },
  });
  snap(L('sort(arestas.begin()'), 'Kruskal: ordena as arestas por peso e tenta usá-las da mais leve para a mais pesada. Cada vértice começa no próprio conjunto (cor).');
  for (const e of sorted) {
    const a = achar(e.u), b = achar(e.v);
    if (a !== b) {
      pai[a] = b; tree.push(ek(G, e.u, e.v)); total += e.w;
      snap(L('pai[a] = b'), `${nm(G, e.u)}–${nm(G, e.v)} (peso ${e.w}) liga dois conjuntos diferentes: <b>entra</b> na árvore e os conjuntos se unem.`, { cur: e, edge: ek(G, e.u, e.v) });
      if (tree.length === n - 1) break;
    } else {
      rejected.push(ek(G, e.u, e.v));
      snap(L('if (a != b)'), `${nm(G, e.u)} e ${nm(G, e.v)} já estão no mesmo conjunto: a aresta (peso ${e.w}) fecharia um <b>ciclo</b>. Descartada.`, { cur: e, edge: ek(G, e.u, e.v), reject: true });
    }
  }
  snap(L('return arvore'), `Árvore geradora mínima com ${tree.length} arestas e peso total <b>${total}</b>. Custo: $O(E \\log E)$ pela ordenação; a união-busca é quase $O(1)$.`, { done: true });
  return steps;
}

export const PRIM_CODE = `int prim(int s) {
    vector<bool> naArvore(n, false);
    pq.push({0, s, -1});              // {peso, vértice, de onde veio}
    int total = 0;
    while (!pq.empty()) {
        auto [w, u, p] = pq.top(); pq.pop();
        if (naArvore[u]) continue;
        naArvore[u] = true;           // aresta mais leve que sai da árvore
        total += w;
        for (auto [v, peso] : adj[u])
            if (!naArvore[v]) pq.push({peso, v, u});
    }
    return total;
}`;

export function primSteps(G, s = 0) {
  const L = lineFinder(PRIM_CODE);
  const adj = adjacency(G);
  const n = G.names.length;
  const naArvore = Array(n).fill(false);
  let pq = [];
  const tree = [], steps = [];
  let total = 0;
  const push = e => { pq.push(e); pq.sort((a, b) => a.w - b.w || a.u - b.u); };
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, naArvore: [...naArvore], tree: [...tree], pq: pq.map(e => ({ ...e })), total, ...extra,
    vars: { 'arestas na árvore': `${tree.length} / ${n - 1}`, 'peso total': total },
  });
  push({ w: 0, u: s, p: -1 });
  snap(L('pq.push({0, s, -1})'), `Prim: cresce <b>uma única árvore</b> a partir de ${nm(G, s)}, sempre pela aresta mais leve que sai dela.`);
  while (pq.length) {
    const { w, u, p } = pq.shift();
    if (naArvore[u]) { snap(L('if (naArvore[u]) continue'), `${nm(G, p)}–${nm(G, u)} (${w}): ${nm(G, u)} já está na árvore, a aresta fecharia um ciclo.`, { edge: ek(G, p, u), reject: true }); continue; }
    naArvore[u] = true; total += w;
    if (p >= 0) tree.push(ek(G, p, u));
    snap(L('naArvore[u] = true'), p < 0 ? `${nm(G, u)} é a raiz.` : `A aresta mais leve saindo da árvore é ${nm(G, p)}–${nm(G, u)} (peso ${w}): <b>entra</b>. (Propriedade do corte: ela está em alguma MST.)`, { edge: p >= 0 ? ek(G, p, u) : null, u });
    const added = [];
    for (const { v, w: peso } of adj[u]) if (!naArvore[v]) { push({ w: peso, u: v, p: u }); added.push(`${nm(G, v)} (${peso})`); }
    if (added.length) snap(L('if (!naArvore[v]) pq.push'), `As arestas de ${nm(G, u)} para fora da árvore entram na fila: ${added.join(', ')}.`, { u });
  }
  snap(L('return total'), `Peso total <b>${total}</b>, igual ao de Kruskal: a MST pode não ser única, mas o peso mínimo é.`, { done: true });
  return steps;
}

/** Peso de uma lista de chaves de aresta. */
export function weightOf(G, keys) {
  const W = new Map(G.edges.map(([u, v, w]) => [ek(G, u, v), w]));
  return keys.reduce((s, k) => s + W.get(k), 0);
}
