// Geometria computacional: o teste de orientação (produto vetorial) e duas
// envoltórias convexas, a cadeia monótona de Andrew e o embrulho para presente
// (Jarvis). Coordenadas matemáticas: y cresce para cima.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  andrew: `struct P { long long x, y; bool operator<(P o) const { return x < o.x || (x == o.x && y < o.y); } };

// > 0: o→a→b vira à esquerda; < 0: à direita; 0: colineares
long long cruz(P o, P a, P b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

vector<P> envoltoria(vector<P> p) {
    sort(p.begin(), p.end());                         // por x, depois y
    int n = p.size(), k = 0;
    vector<P> h(2 * n);
    for (int i = 0; i < n; i++) {                     // cadeia de baixo
        while (k >= 2 && cruz(h[k - 2], h[k - 1], p[i]) <= 0) k--;
        h[k++] = p[i];
    }
    for (int i = n - 2, t = k + 1; i >= 0; i--) {     // cadeia de cima
        while (k >= t && cruz(h[k - 2], h[k - 1], p[i]) <= 0) k--;
        h[k++] = p[i];
    }
    h.resize(k - 1);                                  // o 1º ponto apareceu 2 vezes
    return h;
}`,
  jarvis: `vector<P> embrulho(vector<P> p) {
    int n = p.size();
    int ini = min_element(p.begin(), p.end()) - p.begin();  // mais à esquerda
    vector<P> h;
    int a = ini;
    do {
        h.push_back(p[a]);
        int b = (a + 1) % n;                          // candidato inicial
        for (int i = 0; i < n; i++) {
            long long c = cruz(p[a], p[b], p[i]);
            if (c < 0 || (c == 0 && dist2(p[a], p[i]) > dist2(p[a], p[b])))
                b = i;                                // i está à direita de a→b
        }
        a = b;
    } while (a != ini);
    return h;
}`,
};

export const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const lt = (a, b) => a.x < b.x || (a.x === b.x && a.y < b.y);
const turn = c => (c > 0 ? 'esquerda' : c < 0 ? 'direita' : 'colinear');

/** Pontos com id (índice original). */
export function andrewSteps(pts) {
  const L = lineFinder(CODES.andrew);
  const p = pts.map((q, id) => ({ ...q, id })).sort((a, b) => (lt(a, b) ? -1 : lt(b, a) ? 1 : 0));
  const n = p.length, h = [], steps = [];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, order: p.map(q => q.id), hull: h.map(q => q.id), vars: { i: extra.i ?? '—', k: h.length }, ...extra });
  snap(L('sort(p.begin()'), `Ordena os ${n} pontos por x (desempate por y), numerados na ordem. O primeiro e o último estão com certeza na envoltória. A cadeia de baixo vai da esquerda para a direita sempre virando à <b>esquerda</b>.`);
  const chain = (from, to, dir, t, label) => {
    for (let i = from; dir > 0 ? i < to : i >= to; i += dir) {
      while (h.length >= t) {
        const c = cross(h.at(-2), h.at(-1), p[i]);
        if (c > 0) {
          snap(L(label === 'baixo' ? 'cruz(h[k - 2], h[k - 1], p[i]) <= 0) k--;' : 'while (k >= t'), `${h.at(-2).id}→${h.at(-1).id}→${p[i].id} vira à <b>esquerda</b> (cruz = ${c} > 0): o topo fica.`, { i, test: [h.at(-2).id, h.at(-1).id, p[i].id], cross: c, chain: label });
          break;
        }
        snap(L(label === 'baixo' ? 'cruz(h[k - 2], h[k - 1], p[i]) <= 0) k--;' : 'while (k >= t'), `${h.at(-2).id}→${h.at(-1).id}→${p[i].id} vira à <b>${turn(c)}</b> (cruz = ${c}): o ponto ${h.at(-1).id} fica <b>dentro</b> e sai da pilha.`, { i, test: [h.at(-2).id, h.at(-1).id, p[i].id], cross: c, pop: h.at(-1).id, chain: label });
        h.pop();
      }
      h.push(p[i]);
      snap(L('h[k++] = p[i]', label === 'baixo' ? 1 : L('cadeia de cima')), `Empilha o ponto ${p[i].id}.`, { i, chain: label, push: p[i].id });
    }
  };
  chain(0, n, 1, 2, 'baixo');
  const t = h.length + 1;
  snap(L('cadeia de cima'), `Cadeia de baixo pronta (${h.length} pontos). Agora volta da direita para a esquerda montando a de cima, sem desempilhar a de baixo (t = ${t}).`, { chain: 'cima' });
  chain(n - 2, 0, -1, t, 'cima');
  h.pop();
  snap(L('h.resize(k - 1)'), `Envoltória com <b>${h.length}</b> vértices, em sentido anti-horário. Custo: $O(n \\log n)$ da ordenação; cada ponto entra e sai da pilha no máximo uma vez por cadeia, então o resto é $O(n)$.`, { done: true });
  return steps;
}

export function jarvisSteps(pts) {
  const L = lineFinder(CODES.jarvis);
  const p = pts.map((q, id) => ({ ...q, id }));
  const n = p.length, h = [], steps = [];
  let ini = 0;
  for (let i = 1; i < n; i++) if (lt(p[i], p[ini])) ini = i;
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, hull: [...h], vars: { a: extra.a ?? '—', b: extra.b ?? '—', i: extra.i ?? '—', 'h (vértices)': h.length }, ...extra });
  snap(L('int ini = min_element'), `Começa no ponto mais à esquerda (${ini}), que está na envoltória. Como um barbante enrolando os pontos: de cada vértice, o próximo é aquele que deixa <b>todos os outros à esquerda</b>.`, { a: ini });
  let a = ini, guard = 0;
  do {
    h.push(a);
    let b = (a + 1) % n;
    snap(L('int b = (a + 1) % n'), `Vértice ${a} na envoltória. Candidato inicial: ${b}.`, { a, b });
    for (let i = 0; i < n; i++) {
      if (i === a || i === b) continue;
      const c = cross(p[a], p[b], p[i]);
      const better = c < 0 || (c === 0 && dist2(p[a], p[i]) > dist2(p[a], p[b]));
      snap(L('if (c < 0'), better ? `${i} está à <b>direita</b> de ${a}→${b} (cruz = ${c}): ${b} não serve, o novo candidato é ${i}.` : `${i} está à esquerda de ${a}→${b} (cruz = ${c}): o candidato ${b} continua.`, { a, b: better ? i : b, i, test: [a, b, i], cross: c });
      if (better) b = i;
    }
    snap(L('a = b;'), b === ini ? `Voltou ao ponto inicial: fecha o polígono.` : `Nenhum ponto à direita de ${a}→${b}: a aresta ${a}–${b} é da envoltória.`, { a: b, edge: [a, b] });
    a = b;
  } while (a !== ini && ++guard <= n);
  snap(L('return h'), `Envoltória com <b>${h.length}</b> vértices. Cada vértice custou uma passada por todos os n pontos: $O(nh)$. Ótimo quando a envoltória tem poucos vértices (h pequeno); ruim quando quase todos estão nela (pontos num círculo: $O(n^2)$).`, { done: true });
  return steps;
}

export function convexHull(pts) {
  return andrewSteps(pts).at(-1).hull;
}

/** Pontos aleatórios inteiros sem três colineares (com gerador reprodutível opcional). */
export function randomPoints(n, rnd = Math.random, { w = 20, hgt = 12 } = {}) {
  const pts = [];
  let guard = 0;
  while (pts.length < n && guard++ < 10000) {
    const q = { x: 1 + Math.floor(rnd() * (w - 1)), y: 1 + Math.floor(rnd() * (hgt - 1)) };
    if (pts.some(a => a.x === q.x && a.y === q.y)) continue;
    let ok = true;
    for (let i = 0; i < pts.length && ok; i++) for (let j = i + 1; j < pts.length && ok; j++) if (cross(pts[i], pts[j], q) === 0) ok = false;
    if (ok) pts.push(q);
  }
  return pts;
}

/** Dois segmentos se cruzam? (teste de orientação, com casos colineares) */
export function segmentsIntersect(a, b, c, d) {
  const o1 = Math.sign(cross(a, b, c)), o2 = Math.sign(cross(a, b, d)), o3 = Math.sign(cross(c, d, a)), o4 = Math.sign(cross(c, d, b));
  const on = (p, q, r) => Math.min(p.x, q.x) <= r.x && r.x <= Math.max(p.x, q.x) && Math.min(p.y, q.y) <= r.y && r.y <= Math.max(p.y, q.y);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && on(a, b, c)) || (o2 === 0 && on(a, b, d)) || (o3 === 0 && on(c, d, a)) || (o4 === 0 && on(c, d, b));
}
