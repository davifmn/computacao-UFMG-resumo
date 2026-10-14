// Problemas NP-difíceis e algoritmos aproximativos: cobertura por vértices
// (2-aproximação por emparelhamento maximal) e caixeiro viajante métrico
// (2-aproximação pela árvore geradora mínima), comparados com o ótimo por força bruta.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  cobertura: `vector<int> coberturaAprox(int n, vector<pair<int, int>>& arestas) {
    vector<bool> na(n, false);
    vector<int> C;
    for (auto [u, v] : arestas)
        if (!na[u] && !na[v]) {               // aresta ainda descoberta
            na[u] = na[v] = true;             // leva as DUAS pontas
            C.push_back(u); C.push_back(v);
        }
    // as arestas escolhidas não têm ponta em comum (emparelhamento):
    // qualquer cobertura precisa de 1 vértice por aresta => |C| <= 2 * ótimo
    return C;
}`,
  tsp: `vector<int> tspAprox(vector<P>& p) {
    int n = p.size();
    vector<double> d(n, INF);
    vector<int> pai(n, -1);
    vector<bool> na(n, false);
    vector<vector<int>> filhos(n);
    d[0] = 0;
    for (int it = 0; it < n; it++) {          // 1. árvore geradora mínima (Prim)
        int u = -1;
        for (int v = 0; v < n; v++) if (!na[v] && (u < 0 || d[v] < d[u])) u = v;
        na[u] = true;
        if (pai[u] >= 0) filhos[pai[u]].push_back(u);
        for (int v = 0; v < n; v++)
            if (!na[v] && dist(p[u], p[v]) < d[v]) { d[v] = dist(p[u], p[v]); pai[v] = u; }
    }
    vector<int> rota;                         // 2. pré-ordem = passeio com atalhos
    function<void(int)> dfs = [&](int u) {
        rota.push_back(u);
        for (int v : filhos[u]) dfs(v);
    };
    dfs(0);
    return rota;                              // custo <= 2 * MST <= 2 * ótimo
}`,
};

// ---------- Cobertura por vértices ----------

export function vertexCoverSteps(n, edges) {
  const L = lineFinder(CODES.cobertura);
  const inC = Array(n).fill(false), picked = [], steps = [];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, inC: [...inC], picked: [...picked], vars: { '|C|': inC.filter(Boolean).length, ...extra.vars }, ...extra });
  snap(L('vector<bool> na(n, false)'), `Queremos o menor conjunto de vértices que toque <b>todas</b> as arestas. Achar o mínimo é NP-difícil; esta estratégia simples garante no máximo o dobro.`);
  edges.forEach(([u, v], k) => {
    if (!inC[u] && !inC[v]) {
      inC[u] = inC[v] = true;
      picked.push(k);
      snap(L('na[u] = na[v] = true'), `Aresta ${u}–${v} está descoberta: leva <b>${u} e ${v}</b>. Uma das duas pontas tem que estar em qualquer cobertura, mas não sabemos qual, então levamos as duas.`, { edge: k });
    } else {
      snap(L('if (!na[u] && !na[v])'), `Aresta ${u}–${v} já está coberta por ${inC[u] ? u : v}.`, { edge: k });
    }
  });
  const opt = minVertexCover(n, edges);
  snap(L('return C'), `Aproximação: <b>${inC.filter(Boolean).length}</b> vértices. Ótimo (força bruta em $2^{${n}}$ subconjuntos): <b>${opt.length}</b> (${opt.join(', ')}). As ${picked.length} arestas escolhidas (em amarelo) formam um emparelhamento, e o ótimo precisa de pelo menos ${picked.length} vértices: razão ≤ 2.`, { done: true, opt, vars: { ótimo: opt.length } });
  return steps;
}

export function minVertexCover(n, edges) {
  let best = null;
  for (let mask = 0; mask < 1 << n; mask++) {
    const size = popcount(mask);
    if (best && size >= best.size) continue;
    if (edges.every(([u, v]) => (mask >> u) & 1 || (mask >> v) & 1)) best = { mask, size };
  }
  return [...Array(n).keys()].filter(i => (best.mask >> i) & 1);
}
const popcount = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };

// ---------- Caixeiro viajante métrico ----------

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const tourLength = (p, rota) => rota.reduce((s, u, i) => s + dist(p[u], p[rota[(i + 1) % rota.length]]), 0);

export function tspSteps(p) {
  const L = lineFinder(CODES.tsp);
  const n = p.length, d = Array(n).fill(Infinity), pai = Array(n).fill(-1), na = Array(n).fill(false), filhos = Array.from({ length: n }, () => []);
  const tree = [], steps = [];
  let rota = [];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, tree: [...tree], rota: [...rota], na: [...na], ...extra });
  d[0] = 0;
  snap(L('d[0] = 0'), `Fase 1: árvore geradora mínima a partir da cidade 0 (algoritmo de Prim, como em Algoritmos I). A AGM é um limite inferior: tirando uma aresta de qualquer rota, sobra uma árvore geradora, então <b>MST ≤ ótimo</b>.`);
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!na[v] && (u < 0 || d[v] < d[u])) u = v;
    na[u] = true;
    if (pai[u] >= 0) { filhos[pai[u]].push(u); tree.push([pai[u], u]); }
    for (let v = 0; v < n; v++) if (!na[v] && dist(p[u], p[v]) < d[v]) { d[v] = dist(p[u], p[v]); pai[v] = u; }
    snap(L('na[u] = true'), pai[u] >= 0 ? `Cidade ${u} entra pela aresta ${pai[u]}–${u} (${dist(p[pai[u]], p[u]).toFixed(1)}), a mais barata saindo da árvore.` : `Cidade 0 é a raiz.`, { cur: u, vars: { MST: tree.reduce((s, [a, b]) => s + dist(p[a], p[b]), 0).toFixed(1) } });
  }
  const mst = tree.reduce((s, [a, b]) => s + dist(p[a], p[b]), 0);
  const dfs = u => {
    rota.push(u);
    snap(L('rota.push_back(u)'), `Fase 2: percorre a árvore em pré-ordem. Visita ${u}${rota.length > 1 ? `, vindo de ${rota.at(-2)} por um <b>atalho</b> direto (pela desigualdade triangular, nunca mais longo que voltar pela árvore)` : ''}.`, { cur: u, vars: { MST: mst.toFixed(1), rota: rota.join('→') } });
    for (const v of filhos[u]) dfs(v);
  };
  dfs(0);
  const approx = tourLength(p, rota);
  const opt = optimalTour(p);
  snap(L('return rota'), `Rota aproximada: <b>${approx.toFixed(1)}</b>. Ótimo (força bruta em ${n - 1}!/2 rotas): <b>${opt.len.toFixed(1)}</b>, razão ${(approx / opt.len).toFixed(3)}. Garantia: passeio completo pela árvore = 2·MST = ${(2 * mst).toFixed(1)} ≤ 2·ótimo, e os atalhos só encurtam.`, { done: true, opt: opt.rota, vars: { MST: mst.toFixed(1), aprox: approx.toFixed(1), ótimo: opt.len.toFixed(1) } });
  return steps;
}

/** Rota ótima por força bruta (fixa a cidade 0 no começo). */
export function optimalTour(p) {
  const n = p.length;
  let best = { len: Infinity, rota: null };
  const rest = [...Array(n).keys()].slice(1);
  const perm = (arr, k) => {
    if (k === arr.length) {
      const r = [0, ...arr];
      const len = tourLength(p, r);
      if (len < best.len - 1e-9) best = { len, rota: r };
      return;
    }
    for (let i = k; i < arr.length; i++) {
      [arr[k], arr[i]] = [arr[i], arr[k]];
      perm(arr, k + 1);
      [arr[k], arr[i]] = [arr[i], arr[k]];
    }
  };
  perm(rest, 0);
  return best;
}

export const PRESETS = {
  // Ciclo de 7 vértices com um "hub" no meio: a aproximação leva 6, o ótimo usa 4
  cobertura: {
    n: 8,
    pos: [[260, 110], [450, 70], [640, 110], [740, 270], [640, 430], [450, 470], [260, 430], [450, 270]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [7, 1], [7, 3], [7, 5], [0, 7]],
  },
};
