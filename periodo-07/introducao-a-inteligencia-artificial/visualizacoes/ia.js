// Inteligência artificial: busca em grade (BFS, DFS, custo uniforme, gulosa,
// A*), minimax com poda alfa-beta e jogo da velha, processos de decisão de
// Markov (iteração de valor no mundo 4×3) e aprendizado (perceptron e rede
// neural com retropropagação).

// =====================================================================
// Busca em grade
// =====================================================================
// grid: { w, h, cost: number[] (Infinity = parede), start, goal } com células indexadas y*w + x

export const ALGOS = {
  bfs: 'Largura (BFS)',
  dfs: 'Profundidade (DFS)',
  ucs: 'Custo uniforme',
  greedy: 'Gulosa (só h)',
  astar: 'A* (g + h)',
};

export const manhattan = (g, a, b) => Math.abs((a % g.w) - (b % g.w)) + Math.abs(Math.floor(a / g.w) - Math.floor(b / g.w));

function neighbors(g, v) {
  const x = v % g.w, y = Math.floor(v / g.w), out = [];
  for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
    const u = ny * g.w + nx;
    if (g.cost[u] !== Infinity) out.push(u);
  }
  return out;
}

/** Busca com registro das expansões. Devolve { order, path, cost, frontierSizes, steps }. */
export function search(g, algo, { hWeight = 1 } = {}) {
  const n = g.w * g.h;
  const gcost = Array(n).fill(Infinity), parent = Array(n).fill(-1), closed = Array(n).fill(false);
  const h = v => hWeight * manhattan(g, v, g.goal) * Math.min(...g.cost.filter(c => c !== Infinity));
  const prio = v => (algo === 'ucs' ? gcost[v] : algo === 'greedy' ? h(v) : algo === 'astar' ? gcost[v] + h(v) : 0);
  const frontier = [g.start];
  const inFrontier = new Set([g.start]);
  gcost[g.start] = 0;
  const order = [], steps = [];
  let counter = 0;
  const tie = new Map([[g.start, counter++]]);
  while (frontier.length) {
    let v;
    if (algo === 'bfs') v = frontier.shift();
    else if (algo === 'dfs') v = frontier.pop();
    else {
      let bi = 0;
      for (let i = 1; i < frontier.length; i++) {
        const a = frontier[i], b = frontier[bi];
        if (prio(a) < prio(b) - 1e-9 || (Math.abs(prio(a) - prio(b)) < 1e-9 && (h(a) < h(b) || (h(a) === h(b) && tie.get(a) > tie.get(b))))) bi = i;
      }
      v = frontier.splice(bi, 1)[0];
    }
    inFrontier.delete(v);
    if (closed[v]) continue;
    closed[v] = true;
    order.push(v);
    steps.push({ v, frontier: [...frontier], expanded: order.length });
    if (v === g.goal) break;
    for (const u of neighbors(g, v)) {
      const nc = gcost[v] + g.cost[u];
      if (algo === 'dfs') {
        // pilha com repetições: a cópia empilhada por último é a primeira a sair, e o pai é quem a empilhou
        if (!closed[u]) { gcost[u] = nc; parent[u] = v; frontier.push(u); }
      } else if (algo === 'bfs') {
        if (closed[u] || inFrontier.has(u)) continue;
        gcost[u] = nc; parent[u] = v; frontier.push(u); inFrontier.add(u);
      } else if (!closed[u] && nc < gcost[u]) {
        gcost[u] = nc; parent[u] = v;
        if (!inFrontier.has(u)) { frontier.push(u); inFrontier.add(u); }
        tie.set(u, counter++);
      }
    }
  }
  let path = null;
  if (closed[g.goal]) { path = []; for (let v = g.goal; v !== -1; v = parent[v]) path.unshift(v); }
  const cost = path ? path.slice(1).reduce((s, v) => s + g.cost[v], 0) : Infinity;
  return { order, path, cost, steps };
}

/** Grade a partir de linhas de texto: '#' parede, '~' lama (custo 5), 'S' início, 'G' objetivo, '.' livre. */
export function parseGrid(lines) {
  const h = lines.length, w = Math.max(...lines.map(l => l.length));
  const cost = [];
  let start = 0, goal = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = lines[y][x] ?? '.';
    cost.push(c === '#' ? Infinity : c === '~' ? 5 : 1);
    if (c === 'S') start = y * w + x;
    if (c === 'G') goal = y * w + x;
  }
  return { w, h, cost, start, goal };
}

export const MAZES = {
  sala: { nome: 'Sala com parede', lines: [
    '......................',
    '......................',
    '.........#............',
    '.........#............',
    '..S......#.......G....',
    '.........#............',
    '.........#............',
    '.....#####............',
    '......................',
    '......................',
  ] },
  lama: { nome: 'Atalho pela lama', lines: [
    '......................',
    '.####################.',
    '.#..................#.',
    '.#.~~~~~~~~~~~~~~~~.#.',
    'S..~~~~~~~~~~~~~~~~..G',
    '.#.~~~~~~~~~~~~~~~~.#.',
    '.#..................#.',
    '.####################.',
    '......................',
    '......................',
  ] },
  labirinto: { nome: 'Labirinto', lines: [
    'S.#...........#.......',
    '.##.#########.#.#####.',
    '....#.......#...#...#.',
    '#####.#####.#####.#.#.',
    '......#...#.......#.#.',
    '.######.#.#########.#.',
    '.#......#.........#.#.',
    '.#.##############.#.#.',
    '.#................#..G',
    '.###################..',
  ] },
};

// =====================================================================
// Minimax e alfa-beta
// =====================================================================
// Árvore: número (folha) ou array de filhos. A raiz é MAX.

export function minimaxSteps(tree, { prune = true } = {}) {
  const steps = [];
  let id = 0;
  const nodes = [];
  const build = (t, depth, parent) => {
    const node = { id: id++, depth, parent, leaf: typeof t === 'number', value: typeof t === 'number' ? t : null, kids: [] };
    nodes.push(node);
    if (!node.leaf) node.kids = t.map(c => build(c, depth + 1, node.id).id);
    return node;
  };
  build(tree, 0, null);
  const state = nodes.map(() => ({ v: null, alpha: null, beta: null, pruned: false, visited: false }));
  const snap = (cur, msg) => steps.push({ cur, msg, state: state.map(s => ({ ...s })) });
  const fmt = x => (x === Infinity ? '+∞' : x === -Infinity ? '−∞' : x);
  let visitedLeaves = 0;
  const rec = (nid, alpha, beta) => {
    const nd = nodes[nid], st = state[nid];
    st.visited = true; st.alpha = alpha; st.beta = beta;
    if (nd.leaf) {
      visitedLeaves++;
      st.v = nd.value;
      snap(nid, `Folha: utilidade <b>${nd.value}</b>.`);
      return nd.value;
    }
    const max = nd.depth % 2 === 0;
    let v = max ? -Infinity : Infinity;
    st.v = v;
    snap(nid, `Nó ${max ? 'MAX' : 'MIN'} com janela [α, β] = [${fmt(alpha)}, ${fmt(beta)}].`);
    for (let k = 0; k < nd.kids.length; k++) {
      const c = nd.kids[k];
      const cv = rec(c, alpha, beta);
      v = max ? Math.max(v, cv) : Math.min(v, cv);
      st.v = v;
      if (max) alpha = Math.max(alpha, v); else beta = Math.min(beta, v);
      st.alpha = alpha; st.beta = beta;
      if (prune && alpha >= beta && k < nd.kids.length - 1) {
        const rest = nd.kids.slice(k + 1);
        const markPruned = x => { state[x].pruned = true; nodes[x].kids.forEach(markPruned); };
        rest.forEach(markPruned);
        snap(nid, `${max ? 'MAX' : 'MIN'} já tem ${v}, e α = ${fmt(alpha)} ≥ β = ${fmt(beta)}: ${max ? 'o MIN acima nunca deixaria o jogo chegar aqui' : 'o MAX acima já tem uma opção melhor (α)'}. <b>Poda</b> ${rest.length === 1 ? 'do último filho' : `dos ${rest.length} filhos restantes`}.`);
        return v;
      }
      snap(nid, `${max ? 'MAX' : 'MIN'} atualiza para ${v} (${max ? 'α' : 'β'} = ${fmt(max ? alpha : beta)}).`);
    }
    return v;
  };
  const value = rec(0, -Infinity, Infinity);
  const leaves = nodes.filter(n => n.leaf).length;
  steps.push({ cur: 0, msg: `Valor minimax da raiz: <b>${value}</b>. Folhas avaliadas: ${visitedLeaves} de ${leaves}${prune ? ` (${leaves - visitedLeaves} podadas)` : ''}.`, state: state.map(s => ({ ...s })), done: true });
  return { steps, nodes, value, visitedLeaves, leaves };
}

export const TREES = {
  livro: { nome: 'Exemplo do livro (3 × 3)', tree: [[3, 12, 8], [2, 4, 6], [14, 5, 2]] },
  profunda: { nome: 'Três níveis', tree: [[[5, 6], [7, 4, 5]], [[3]], [[6], [6, 9]], [[7], [5]], [[9, 8], [6]]] },
  ordem: { nome: 'Boa ordenação (melhores primeiro)', tree: [[14, 12, 15], [5, 2, 8], [3, 4, 6]] },
};

/** Jogo da velha: tabuleiro de 9 posições com 'X', 'O' ou null. */
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export function winner(b) {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'empate' : null;
}
const memo = new Map();
/** Valor minimax para X (+1 vitória de X, −1 de O, 0 empate) e o número de nós visitados. */
export function ttt(b, player) {
  const key = b.map(x => x ?? '.').join('') + player;
  if (memo.has(key)) return memo.get(key);
  const w = winner(b);
  let res;
  if (w) res = { v: w === 'X' ? 1 : w === 'O' ? -1 : 0, move: null };
  else {
    let best = null;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = player;
      const r = ttt(b, player === 'X' ? 'O' : 'X');
      b[i] = null;
      // prefere vitórias rápidas e derrotas lentas
      const v = r.v * 0.99;
      if (!best || (player === 'X' ? v > best.v : v < best.v)) best = { v, move: i };
    }
    res = best;
  }
  memo.set(key, res);
  return res;
}

// =====================================================================
// MDP: iteração de valor no mundo 4×3
// =====================================================================

export const GRID43 = { w: 4, h: 3, wall: [1, 1], terminals: { '3,2': 1, '3,1': -1 } };   // (x, y) com y para cima

export function valueIteration({ R = -0.04, gamma = 1, pMain = 0.8, iters = 100, eps = 1e-9 } = {}) {
  const { w, h, wall, terminals } = GRID43;
  const states = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (!(x === wall[0] && y === wall[1])) states.push([x, y]);
  const key = (x, y) => `${x},${y}`;
  const isWall = (x, y) => x === wall[0] && y === wall[1];
  const move = ([x, y], [dx, dy]) => { const nx = x + dx, ny = y + dy; return nx < 0 || ny < 0 || nx >= w || ny >= h || isWall(nx, ny) ? [x, y] : [nx, ny]; };
  const ACTS = { '↑': [0, 1], '↓': [0, -1], '←': [-1, 0], '→': [1, 0] };
  const perp = ([dx, dy]) => [[dy, dx], [-dy, -dx]];
  let U = Object.fromEntries(states.map(([x, y]) => [key(x, y), 0]));
  const history = [U];
  for (let k = 0; k < iters; k++) {
    const N = {};
    let delta = 0;
    for (const s of states) {
      const ks = key(...s);
      if (ks in terminals) { N[ks] = terminals[ks]; continue; }
      let best = -Infinity;
      for (const a of Object.values(ACTS)) {
        const [p1, p2] = perp(a);
        const q = pMain * U[key(...move(s, a))] + ((1 - pMain) / 2) * (U[key(...move(s, p1))] + U[key(...move(s, p2))]);
        best = Math.max(best, q);
      }
      N[ks] = R + gamma * best;
      delta = Math.max(delta, Math.abs(N[ks] - U[ks]));
    }
    U = N;
    history.push(U);
    if (delta < eps) break;
  }
  const policy = {};
  for (const s of states) {
    const ks = key(...s);
    if (ks in terminals) continue;
    let best = null;
    for (const [nm, a] of Object.entries(ACTS)) {
      const [p1, p2] = perp(a);
      const q = pMain * U[key(...move(s, a))] + ((1 - pMain) / 2) * (U[key(...move(s, p1))] + U[key(...move(s, p2))]);
      if (!best || q > best.q + 1e-12) best = { q, nm };
    }
    policy[ks] = best.nm;
  }
  return { U, history, policy, iterations: history.length - 1 };
}

// =====================================================================
// Aprendizado: perceptron e rede neural
// =====================================================================

export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

export function makeData(kind, n = 80, seed = 1) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < n; i++) {
    const x = r() * 2 - 1, y = r() * 2 - 1;
    let c;
    if (kind === 'linear') c = y > 0.4 * x - 0.1 ? 1 : 0;
    else if (kind === 'xor') c = (x > 0) !== (y > 0) ? 1 : 0;
    else c = x * x + y * y < 0.42 ? 1 : 0;
    pts.push({ x, y, c });
  }
  return pts;
}

/** Perceptron de Rosenblatt; devolve os pesos após cada época. */
export function perceptron(data, { epochs = 200, lr = 0.1 } = {}) {
  let w = [0, 0, 0];  // [w1, w2, b]
  const hist = [{ w: [...w], errors: data.length }];
  for (let e = 0; e < epochs; e++) {
    let errors = 0;
    for (const p of data) {
      const out = w[0] * p.x + w[1] * p.y + w[2] > 0 ? 1 : 0;
      const err = p.c - out;
      if (err) { errors++; w = [w[0] + lr * err * p.x, w[1] + lr * err * p.y, w[2] + lr * err]; }
    }
    hist.push({ w: [...w], errors });
    if (!errors) break;
  }
  return hist;
}

const sig = z => 1 / (1 + Math.exp(-z));

/** Rede 2 → H (tanh) → 1 (sigmoide), treinada por gradiente com entropia cruzada. */
export class MLP {
  constructor(hidden = 6, seed = 3) {
    const r = rng(seed);
    this.H = hidden;
    this.W1 = Array.from({ length: hidden }, () => [r() * 2 - 1, r() * 2 - 1]);
    this.b1 = Array.from({ length: hidden }, () => (r() * 2 - 1) * 0.5);
    this.W2 = Array.from({ length: hidden }, () => r() * 2 - 1);
    this.b2 = 0;
  }
  forward(x, y) {
    const h = this.W1.map((w, k) => Math.tanh(w[0] * x + w[1] * y + this.b1[k]));
    return { h, out: sig(h.reduce((s, v, k) => s + v * this.W2[k], this.b2)) };
  }
  predict(x, y) { return this.forward(x, y).out; }
  /** Uma época de descida do gradiente em lote; devolve a perda média. */
  epoch(data, lr = 0.5) {
    const gW1 = this.W1.map(() => [0, 0]), gb1 = Array(this.H).fill(0), gW2 = Array(this.H).fill(0);
    let gb2 = 0, loss = 0;
    for (const p of data) {
      const { h, out } = this.forward(p.x, p.y);
      loss -= p.c * Math.log(out + 1e-12) + (1 - p.c) * Math.log(1 - out + 1e-12);
      const d = out - p.c;                     // derivada da entropia cruzada com sigmoide
      gb2 += d;
      for (let k = 0; k < this.H; k++) {
        gW2[k] += d * h[k];
        const dh = d * this.W2[k] * (1 - h[k] * h[k]);
        gW1[k][0] += dh * p.x; gW1[k][1] += dh * p.y; gb1[k] += dh;
      }
    }
    const n = data.length;
    this.b2 -= lr * gb2 / n;
    for (let k = 0; k < this.H; k++) {
      this.W2[k] -= lr * gW2[k] / n;
      this.W1[k][0] -= lr * gW1[k][0] / n; this.W1[k][1] -= lr * gW1[k][1] / n; this.b1[k] -= lr * gb1[k] / n;
    }
    return loss / n;
  }
  accuracy(data) { return data.filter(p => (this.predict(p.x, p.y) > 0.5 ? 1 : 0) === p.c).length / data.length; }
}
