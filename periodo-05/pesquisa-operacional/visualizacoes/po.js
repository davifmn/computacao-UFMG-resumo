// Pesquisa operacional: programação linear em 2 variáveis (região viável e
// vértices), o método simplex em tableau, branch and bound para programação
// inteira e fluxo máximo (Edmonds-Karp) com o corte mínimo.

import { lineFinder } from '../../../engine/highlight.js';

const EPS = 1e-9;
const near = (a, b, e = 1e-7) => Math.abs(a - b) < e;
export const fmtNum = v => {
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  // tenta fração com denominador pequeno
  for (let d = 2; d <= 12; d++) if (Math.abs(v * d - Math.round(v * d)) < 1e-9) return `${Math.round(v * d)}/${d}`;
  return v.toFixed(2);
};

// ---------- Geometria da PL em 2D ----------
// restrição: { a: [a1, a2], op: '<=' | '>=' | '=', b }; x, y ≥ 0 implícitas

function clip(poly, a, b, op) {
  // mantém a·p ≤ b (op '<=') ou a·p ≥ b (op '>=')
  const inside = p => (op === '<=' ? a[0] * p[0] + a[1] * p[1] <= b + 1e-9 : a[0] * p[0] + a[1] * p[1] >= b - 1e-9);
  const out = [];
  for (let k = 0; k < poly.length; k++) {
    const P = poly[k], Q = poly[(k + 1) % poly.length];
    const iP = inside(P), iQ = inside(Q);
    if (iP) out.push(P);
    if (iP !== iQ) {
      const fP = a[0] * P[0] + a[1] * P[1] - b, fQ = a[0] * Q[0] + a[1] * Q[1] - b;
      const t = fP / (fP - fQ);
      out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]);
    }
  }
  // remove pontos repetidos (mantendo um: a região pode degenerar num segmento ou num ponto)
  const same = (p, q) => near(p[0], q[0]) && near(p[1], q[1]);
  const res = [];
  for (const p of out) if (!res.length || !same(res.at(-1), p)) res.push(p);
  while (res.length > 1 && same(res[0], res.at(-1))) res.pop();
  return res;
}

export function feasiblePolygon(cons, B = 1000) {
  let poly = [[0, 0], [B, 0], [B, B], [0, B]];
  for (const c of cons) {
    if (c.op === '<=' || c.op === '=') poly = clip(poly, c.a, c.b, '<=');
    if (c.op === '>=' || c.op === '=') poly = clip(poly, c.a, c.b, '>=');
    if (!poly.length) return [];
  }
  return poly;
}

/** Resolve max/min c·x em 2D pelos vértices da região. */
export function solve2D(c, cons, { sense = 'max', B = 1000 } = {}) {
  const poly = feasiblePolygon(cons, B);
  if (!poly.length) return { status: 'inviavel', vertices: [] };
  const sgn = sense === 'max' ? 1 : -1;
  let best = null;
  for (const p of poly) {
    const z = c[0] * p[0] + c[1] * p[1];
    if (!best || sgn * z > sgn * best.z + 1e-9) best = { x: p, z };
  }
  if (best.x[0] > B - 1e-6 || best.x[1] > B - 1e-6) return { status: 'ilimitado', vertices: poly.filter(p => p[0] < B - 1e-6 && p[1] < B - 1e-6) };
  const ties = poly.filter(p => near(c[0] * p[0] + c[1] * p[1], best.z, 1e-7));
  return { status: ties.length > 1 ? 'multiplas' : 'otimo', x: best.x, z: best.z, vertices: poly, ties };
}

// ---------- Simplex em tableau ----------

export const SIMPLEX_CODE = `def simplex(T, base):
    # T: tableau com a linha 0 = z - c·x, colunas = variáveis + [b]
    while True:
        j = min(range(n), key=lambda k: T[0][k])   # mais negativo
        if T[0][j] >= 0:
            return T, base                        # ótimo: nenhum custo reduzido < 0
        razoes = [(T[i][-1] / T[i][j], i) for i in linhas if T[i][j] > 0]
        if not razoes:
            raise Ilimitado                       # a variável cresce para sempre
        _, i = min(razoes)                        # teste da razão
        pivoteia(T, i, j)                         # j entra na base, base[i] sai
        base[i] = j

def pivoteia(T, i, j):
    T[i] = [v / T[i][j] for v in T[i]]            # pivô vira 1
    for r in range(len(T)):
        if r != i:
            f = T[r][j]
            T[r] = [a - f * p for a, p in zip(T[r], T[i])]   # zera a coluna`;

/**
 * max c·x s.a. A x ≤ b, x ≥ 0, com b ≥ 0 (a origem é viável).
 * Passos com o tableau, entrando/saindo, razões e a solução básica atual.
 */
export function simplexSteps(c, A, b, { names } = {}) {
  const L = lineFinder(SIMPLEX_CODE);
  const m = A.length, n = c.length;
  const vars = names ?? [...c.map((_, j) => `x${j + 1}`), ...A.map((_, i) => `s${i + 1}`)];
  // linha 0: z - c x = 0
  let T = [[...c.map(v => -v), ...A.map(() => 0), 0], ...A.map((row, i) => [...row, ...A.map((_, k) => (k === i ? 1 : 0)), b[i]])];
  const base = A.map((_, i) => n + i);
  const steps = [];
  const point = () => { const x = Array(n + m).fill(0); base.forEach((j, i) => { x[j] = T[i + 1].at(-1); }); return x; };
  const snap = (line, msg, extra = {}) => {
    const x = point();
    const panel = { z: fmtNum(T[0].at(-1)), ...Object.fromEntries(vars.slice(0, n).map((v, j) => [v, fmtNum(x[j])])), base: base.map(j => vars[j]).join(', ') };
    steps.push({ line, msg, T: T.map(r => [...r]), base: [...base], names: vars, x, z: T[0].at(-1), vars: panel, ...extra });
  };
  snap(L('def simplex'), `Forma padrão: uma folga $s_i$ por restrição transforma "≤" em "=". A base inicial são as folgas: $x = 0$, ou seja, o vértice <b>origem</b>, com $z = 0$. A linha $z$ guarda os <b>custos reduzidos</b>: $-c_j$ para as variáveis fora da base.`);
  for (let it = 0; it < 30; it++) {
    let j = 0;
    for (let k = 1; k < n + m; k++) if (T[0][k] < T[0][j] - EPS) j = k;
    if (T[0][j] >= -EPS) {
      const duals = A.map((_, i) => T[0][n + i]);
      snap(L('return T, base'), `Nenhum custo reduzido negativo: aumentar qualquer variável não-básica <b>pioraria</b> z. Ótimo: <b>z = ${fmtNum(T[0].at(-1))}</b>. Os valores da linha z nas colunas das folgas são os <b>preços-sombra</b> (variáveis duais): ${duals.map((d, i) => `$y_${i + 1} = ${fmtNum(d)}$`).join(', ')}.`, { done: true, duals });
      return steps;
    }
    snap(L('j = min(range(n)'), `Coluna que entra: <b>${vars[j]}</b>, com custo reduzido ${fmtNum(T[0][j])} (o mais negativo). Cada unidade de ${vars[j]} aumenta z em ${fmtNum(-T[0][j])}.`, { enter: j });
    const ratios = [];
    for (let i = 1; i <= m; i++) ratios.push(T[i][j] > EPS ? T[i].at(-1) / T[i][j] : null);
    if (ratios.every(r => r == null)) {
      snap(L('raise Ilimitado'), `Nenhuma linha limita ${vars[j]} (coluna sem entradas positivas): o problema é <b>ilimitado</b>.`, { enter: j, ratios, done: true, unbounded: true });
      return steps;
    }
    let i = -1;
    ratios.forEach((r, k) => { if (r != null && (i < 0 || r < ratios[i] - EPS)) i = k; });
    snap(L('_, i = min(razoes)'), `Teste da razão: ${ratios.map((r, k) => (r == null ? `linha ${k + 1}: —` : `${fmtNum(T[k + 1].at(-1))}/${fmtNum(T[k + 1][j])} = ${fmtNum(r)}`)).join('; ')}. A menor é a da linha ${i + 1}: <b>${vars[base[i]]} sai</b>, pois é a primeira a chegar a zero quando ${vars[j]} cresce.`, { enter: j, ratios, leave: i });
    const pr = i + 1;
    const pv = T[pr][j];
    T[pr] = T[pr].map(v => v / pv);
    for (let r = 0; r <= m; r++) if (r !== pr) { const f = T[r][j]; T[r] = T[r].map((a, k) => a - f * T[pr][k]); }
    T = T.map(r => r.map(v => (Math.abs(v) < 1e-12 ? 0 : v)));
    base[i] = j;
    snap(L('pivoteia(T, i, j)'), `Pivoteamento na linha ${i + 1}, coluna ${vars[j]}: divide a linha pelo pivô (${fmtNum(pv)}) e zera o resto da coluna. Andamos por uma aresta da região viável até um vértice vizinho, com <b>z = ${fmtNum(T[0].at(-1))}</b>.`, { pivot: [i, j] });
  }
  return steps;
}

// ---------- Branch and bound (2 variáveis inteiras) ----------

export const BB_CODE = `def branch_and_bound(no):
    z, x = relaxacao_linear(no)          # PL sem exigir inteiros
    if inviavel:
        return                            # poda por inviabilidade
    if melhor and z <= melhor.z:
        return                            # poda por limite
    if todos_inteiros(x):
        melhor = (z, x)                   # nova incumbente
        return
    j = variavel_fracionaria(x)           # ramifica
    branch_and_bound(no + [x[j] <= floor(x[j])])
    branch_and_bound(no + [x[j] >= ceil(x[j])])`;

export function branchAndBound(c, cons, { sense = 'max' } = {}) {
  const sgn = sense === 'max' ? 1 : -1;
  const nodes = [], steps = [];
  let best = null;
  const isInt = v => Math.abs(v - Math.round(v)) < 1e-7;
  const L = lineFinder(BB_CODE);
  const snap = (node, msg, extra = {}) => steps.push({ node: node?.id ?? null, msg, nodes: nodes.map(n => ({ ...n })), best: best && { ...best }, vars: { nós: nodes.length, incumbente: best ? `z = ${fmtNum(best.z)} em (${best.x.join(', ')})` : '—' }, ...extra });
  function visit(extra, parent, label) {
    const node = { id: nodes.length, parent, label, extra, status: 'aberto' };
    nodes.push(node);
    const r = solve2D(c, [...cons, ...extra], { sense });
    node.lp = r;
    if (r.status === 'inviavel') { node.status = 'inviavel'; snap(node, `Nó ${node.id} (${label || 'raiz'}): a relaxação linear é <b>inviável</b>. Poda.`, { line: L('poda por inviabilidade') }); return; }
    if (r.status === 'ilimitado') { node.status = 'ilimitado'; snap(node, `Relaxação ilimitada: o problema inteiro também pode ser.`); return; }
    node.z = r.z; node.x = r.x;
    const xs = `(${fmtNum(r.x[0])}, ${fmtNum(r.x[1])})`;
    if (best && sgn * r.z <= sgn * best.z + 1e-9) {
      node.status = 'podado';
      snap(node, `Nó ${node.id} (${label}): relaxação dá z = ${fmtNum(r.z)} em ${xs}, que <b>não supera</b> a melhor solução inteira já achada (z = ${fmtNum(best.z)}). Como a relaxação é um limite ${sense === 'max' ? 'superior' : 'inferior'} para tudo abaixo deste nó, <b>poda por limite</b>.`, { line: L('poda por limite') });
      return;
    }
    const frac = [0, 1].find(j => !isInt(r.x[j]));
    if (frac == null) {
      node.status = 'inteiro';
      const xi = r.x.map(Math.round);
      best = { z: c[0] * xi[0] + c[1] * xi[1], x: xi, node: node.id };   // z exato, sem resíduo de ponto flutuante
      snap(node, `Nó ${node.id} (${label || 'raiz'}): a relaxação já é inteira, ${xs}, z = ${fmtNum(r.z)}. <b>Nova incumbente</b>. Não precisa ramificar.`, { line: L('nova incumbente') });
      return;
    }
    node.status = 'ramificado';
    const v = r.x[frac], lo = Math.floor(v), hi = Math.ceil(v), nm = frac ? 'y' : 'x';
    snap(node, `Nó ${node.id} (${label || 'raiz'}): relaxação em ${xs}, z = ${fmtNum(r.z)}, mas ${nm} = ${fmtNum(v)} é fracionário. <b>Ramifica</b>: nenhuma solução inteira tem ${lo} &lt; ${nm} &lt; ${hi}, então dividimos em ${nm} ≤ ${lo} e ${nm} ≥ ${hi}, cortando fora a faixa entre eles.`, { branch: { j: frac, lo, hi }, line: L('# ramifica') });
    const a = frac ? [0, 1] : [1, 0];
    visit([...extra, { a, op: '<=', b: lo }], node.id, `${nm} ≤ ${lo}`);
    visit([...extra, { a, op: '>=', b: hi }], node.id, `${nm} ≥ ${hi}`);
  }
  visit([], null, '');
  snap(null, best ? `Fim: todos os nós foram resolvidos ou podados. Ótimo inteiro: <b>(${best.x.join(', ')})</b>, z = <b>${fmtNum(best.z)}</b>, achado em ${nodes.length} nós.` : 'Fim: o problema inteiro é inviável.', { done: true, line: null });
  return { steps, nodes, best };
}

/** Força bruta nos pontos inteiros (para conferir o branch and bound). */
export function bruteInteger(c, cons, { sense = 'max', R = 60 } = {}) {
  const sgn = sense === 'max' ? 1 : -1;
  let best = null;
  for (let x = 0; x <= R; x++) for (let y = 0; y <= R; y++) {
    const ok = cons.every(k => { const v = k.a[0] * x + k.a[1] * y; return k.op === '<=' ? v <= k.b + 1e-9 : k.op === '>=' ? v >= k.b - 1e-9 : near(v, k.b); });
    if (!ok) continue;
    const z = c[0] * x + c[1] * y;
    if (!best || sgn * z > sgn * best.z + 1e-9) best = { x: [x, y], z };
  }
  return best;
}

// ---------- Fluxo máximo (Edmonds-Karp) ----------

export const FLOW_CODE = `def edmonds_karp(cap, s, t):
    fluxo = 0
    while True:
        pai = bfs_residual(cap, s, t)       # caminho com menos arestas
        if pai[t] is None:
            return fluxo                    # sem caminho aumentante: máximo
        gargalo, v = INF, t
        while v != s:                       # menor capacidade residual
            gargalo = min(gargalo, cap[pai[v]][v]); v = pai[v]
        v = t
        while v != s:                       # empurra o gargalo
            u = pai[v]
            cap[u][v] -= gargalo            # resta menos para frente
            cap[v][u] += gargalo            # e dá para "desfazer" depois
            v = u
        fluxo += gargalo`;

/** G = { names, pos, edges: [[u, v, cap]] } (dirigido). */
export function maxFlowSteps(G, s, t) {
  const L = lineFinder(FLOW_CODE);
  const n = G.names.length;
  const cap = Array.from({ length: n }, () => Array(n).fill(0));
  for (const [u, v, c] of G.edges) cap[u][v] += c;
  const orig = cap.map(r => [...r]);
  const flowOn = (u, v) => Math.max(0, orig[u][v] - cap[u][v]);
  const steps = [];
  let total = 0;
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, flow: G.edges.map(([u, v]) => flowOn(u, v)), total, vars: { fluxo: total, ...extra.vars }, ...extra });
  snap(L('fluxo = 0'), `Fluxo zero. Cada aresta mostra <b>fluxo/capacidade</b>. Procuramos um <b>caminho aumentante</b> de ${G.names[s]} a ${G.names[t]} no grafo residual: arestas com folga para frente, ou com fluxo que pode ser devolvido para trás.`);
  for (let it = 0; it < 100; it++) {
    const pai = Array(n).fill(null);
    pai[s] = s;
    const q = [s];
    while (q.length && pai[t] == null) {
      const u = q.shift();
      for (let v = 0; v < n; v++) if (pai[v] == null && cap[u][v] > 0) { pai[v] = u; q.push(v); }
    }
    if (pai[t] == null) {
      const S = pai.map(p => p != null);
      const cut = G.edges.filter(([u, v]) => S[u] && !S[v]);
      const cutCap = cut.reduce((acc, e) => acc + e[2], 0);
      snap(L('return fluxo'), `Não há mais caminho aumentante: fluxo máximo = <b>${total}</b>. Os vértices alcançáveis de ${G.names[s]} no residual (verdes) formam o lado S do <b>corte mínimo</b>; as arestas que saem de S estão saturadas e somam ${cut.map(e => e[2]).join(' + ')} = <b>${cutCap}</b>. É o teorema do fluxo máximo / corte mínimo.`, { done: true, S, cut: cut.map(([u, v]) => `${u}-${v}`), cutCap });
      return steps;
    }
    const path = [];
    for (let v = t; v !== s; v = pai[v]) path.unshift([pai[v], v]);
    let gargalo = Infinity;
    for (const [u, v] of path) gargalo = Math.min(gargalo, cap[u][v]);
    const back = path.filter(([u, v]) => orig[u][v] === 0);   // só existe no residual: devolve fluxo de v→u
    const names = path.map(([u]) => G.names[u]).concat(G.names[t]).join(' → ');
    snap(L('pai = bfs_residual'), `BFS no residual acha ${names} (${path.length} arestas). Gargalo: <b>${gargalo}</b>.${back.length ? ` Atenção: o caminho usa ${back.map(([u, v]) => `${G.names[u]}→${G.names[v]}`).join(', ')} <b>ao contrário</b>, cancelando fluxo que tinha sido mandado antes.` : ''}`, { path: path.map(([u, v]) => `${u}-${v}`), back: back.map(([u, v]) => `${v}-${u}`), gargalo, vars: { gargalo } });
    for (const [u, v] of path) { cap[u][v] -= gargalo; cap[v][u] += gargalo; }
    total += gargalo;
    snap(L('fluxo += gargalo'), `Empurra ${gargalo} unidade(s) pelo caminho. Fluxo total: <b>${total}</b>.`, { path: path.map(([u, v]) => `${u}-${v}`), vars: { gargalo } });
  }
  return steps;
}

export function maxFlow(G, s, t) {
  return maxFlowSteps(G, s, t).at(-1).total;
}

// ---------- Exemplos ----------

export const LP_EXAMPLES = {
  wyndor: {
    nome: 'Wyndor Glass (Hillier)',
    texto: 'Uma fábrica produz portas (x₁) e janelas (x₂). Lucro de 3 e 5 por lote. As fábricas 1, 2 e 3 têm 4, 12 e 18 horas livres.',
    c: [3, 5], A: [[1, 0], [0, 2], [3, 2]], b: [4, 12, 18],
  },
  mesas: {
    nome: 'Mesas e cadeiras',
    texto: 'Mesa dá lucro 7, cadeira 5. Uma mesa usa 4 h de marcenaria e 2 de pintura; uma cadeira, 3 e 1. Há 240 h de marcenaria e 100 de pintura.',
    c: [7, 5], A: [[4, 3], [2, 1]], b: [240, 100],
  },
  dieta: {
    nome: 'Três restrições, ótimo num canto',
    texto: 'max 2x₁ + 3x₂ com x₁ + x₂ ≤ 4, x₁ + 3x₂ ≤ 6, x₁ ≤ 3.',
    c: [2, 3], A: [[1, 1], [1, 3], [1, 0]], b: [4, 6, 3],
  },
};

export const IP_EXAMPLES = {
  mochila: { nome: 'max 5x + 4y', c: [5, 4], cons: [{ a: [6, 4], op: '<=', b: 24 }, { a: [1, 2], op: '<=', b: 6 }] },
  arredonda: { nome: 'Arredondar não funciona', c: [1, 5], cons: [{ a: [1, 10], op: '<=', b: 20 }, { a: [1, 0], op: '<=', b: 2 }] },
  livro: { nome: 'max 8x + 5y (Taha)', c: [8, 5], cons: [{ a: [1, 1], op: '<=', b: 6 }, { a: [9, 5], op: '<=', b: 45 }] },
  classico: { nome: 'Região estreita: árvore profunda', c: [1, 1], cons: [{ a: [-2, 2], op: '<=', b: 1 }, { a: [16, -14], op: '<=', b: 7 }] },
};

export const FLOW_EXAMPLES = {
  clrs: {
    nome: 'CLRS, fig. 26.1',
    names: ['s', 'v1', 'v2', 'v3', 'v4', 't'],
    pos: [[70, 250], [280, 110], [280, 390], [560, 110], [560, 390], [790, 250]],
    edges: [[0, 1, 16], [0, 2, 13], [2, 1, 4], [1, 3, 12], [3, 2, 9], [2, 4, 14], [4, 3, 7], [3, 5, 20], [4, 5, 4]],
  },
  cancela: {
    nome: 'Caminho que cancela fluxo',
    // o caminho mais curto s-a-b-t bloqueia os outros dois; o 2º caminho devolve o fluxo de a→b
    names: ['s', 'a', 'b', 'c', 'd', 'e', 'f', 't'],
    pos: [[70, 260], [250, 120], [470, 250], [470, 60], [690, 120], [250, 410], [470, 430], [820, 260]],
    edges: [[0, 1, 1], [1, 2, 1], [2, 7, 1], [1, 3, 1], [3, 4, 1], [4, 7, 1], [0, 5, 1], [5, 6, 1], [6, 2, 1]],
  },
  rede: {
    nome: 'Rede de distribuição',
    names: ['fábrica', 'A', 'B', 'C', 'D', 'loja'],
    pos: [[80, 250], [300, 100], [300, 400], [560, 100], [560, 400], [800, 250]],
    edges: [[0, 1, 10], [0, 2, 10], [1, 2, 2], [1, 3, 4], [1, 4, 8], [2, 4, 9], [4, 3, 6], [3, 5, 10], [4, 5, 10]],
  },
};
