// Álgebra: grupos finitos (Zn, Zn×, diedrais, simétricos), subgrupos, classes
// laterais, permutações em ciclos e o Teorema Chinês do Resto.

export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => (a && b ? Math.abs(a * b) / gcd(a, b) : 0);
export const mod = (a, n) => ((a % n) + n) % n;

export function phi(n) {
  let r = n;
  for (let p = 2; p * p <= n; p++) if (n % p === 0) { while (n % p === 0) n /= p; r -= r / p; }
  if (n > 1) r -= r / n;
  return r;
}

// ---------- Permutações (como vetores: p[i] = imagem de i, base 0) ----------

/** (p ∘ q)(i) = p(q(i)): aplica q primeiro. */
export const compose = (p, q) => q.map(i => p[i]);
export const inverse = p => { const r = Array(p.length); p.forEach((v, i) => { r[v] = i; }); return r; };
export const identity = n => [...Array(n).keys()];
export const permKey = p => p.join(',');

export function cycles(p) {
  const seen = Array(p.length).fill(false), out = [];
  for (let i = 0; i < p.length; i++) {
    if (seen[i]) continue;
    const c = [];
    for (let j = i; !seen[j]; j = p[j]) { seen[j] = true; c.push(j); }
    out.push(c);
  }
  return out;
}

/** Notação de ciclos (base 1), omitindo pontos fixos: [1,2,0] → "(1 2 3)". */
export function cycleString(p, { base = 1 } = {}) {
  const cs = cycles(p).filter(c => c.length > 1);
  return cs.length ? cs.map(c => `(${c.map(x => x + base).join(' ')})`).join('') : 'id';
}

export const permOrder = p => cycles(p).reduce((acc, c) => lcm(acc, c.length), 1);
/** Sinal: (−1)^(n − número de ciclos). Par = produto de um número par de transposições. */
export const sign = p => ((p.length - cycles(p).length) % 2 === 0 ? 1 : -1);

/** Lê "(1 3 2)(4 5)" (base 1) como permutação de n elementos. */
export function parseCycles(str, n) {
  const groups = [...str.matchAll(/\(([^)]*)\)/g)].map(m => m[1].trim().split(/[\s,]+/).filter(Boolean).map(Number));
  if (!groups.length && str.trim() && str.trim() !== 'id') throw new Error('use a notação de ciclos, por exemplo (1 3 2)(4 5)');
  // compõe da direita para a esquerda, como funções
  let result = identity(n);
  for (const g of groups.reverse()) {
    if (g.some(x => !Number.isInteger(x) || x < 1 || x > n)) throw new Error(`os elementos devem estar entre 1 e ${n}`);
    if (new Set(g).size !== g.length) throw new Error('um ciclo não pode repetir elementos');
    const c = identity(n);
    g.forEach((x, i) => { c[x - 1] = g[(i + 1) % g.length] - 1; });
    result = compose(c, result);
  }
  return result;
}

/** Embaralhamento perfeito "de fora" de 2n cartas: a carta da posição i vai para p[i]. */
export function outShuffle(cards) {
  const n = cards / 2;
  return identity(cards).map(i => (i < n ? 2 * i : 2 * (i - n) + 1));
}
export const inShuffle = cards => { const n = cards / 2; return identity(cards).map(i => (i < n ? 2 * i + 1 : 2 * (i - n))); };

// ---------- Grupos finitos ----------
// { nome, n, labels, mul(i, j) → índice de i·j, e: índice do neutro, kind, data }

function fromTable(nome, labels, mul, e, kind, data) {
  const n = labels.length;
  const table = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => mul(i, j)));
  return { nome, n, labels, table, mul: (i, j) => table[i][j], e, kind, data };
}

export function cyclicGroup(n) {
  return fromTable(`ℤ${sub(n)} (soma mod ${n})`, identity(n).map(String), (i, j) => (i + j) % n, 0, 'ciclico', { n, op: '+' });
}

export function unitGroup(n) {
  const els = identity(n).filter(k => gcd(k, n) === 1);
  return fromTable(`ℤ${sub(n)}× (produto mod ${n})`, els.map(String), (i, j) => els.indexOf((els[i] * els[j]) % n), els.indexOf(1), 'unidades', { n, els, op: '·' });
}

/** Diedral Dn: simetrias do n-ágono, como permutações dos vértices. rᵏ: i ↦ i + k; s·rᵏ: i ↦ −(i + k). */
export function dihedralGroup(n) {
  const perms = [], labels = [];
  const sup = k => (k === 1 ? '' : supNum(k));
  for (let k = 0; k < n; k++) { perms.push(identity(n).map(i => mod(i + k, n))); labels.push(k === 0 ? 'e' : `r${sup(k)}`); }
  for (let k = 0; k < n; k++) { perms.push(identity(n).map(i => mod(-(i + k), n))); labels.push(k === 0 ? 's' : `sr${sup(k)}`); }
  const keys = perms.map(permKey);
  return fromTable(`D${sub(n)} (simetrias do ${n}-ágono)`, labels, (i, j) => keys.indexOf(permKey(compose(perms[i], perms[j]))), 0, 'diedral', { n, perms });
}

export function symmetricGroup(n) {
  const perms = [];
  const gen = (pre, rest) => { if (!rest.length) perms.push(pre); else rest.forEach((x, i) => gen([...pre, x], rest.filter((_, k) => k !== i))); };
  gen([], identity(n));
  perms.sort((a, b) => permOrder(a) - permOrder(b) || sign(b) - sign(a) || permKey(a).localeCompare(permKey(b)));
  const keys = perms.map(permKey);
  return fromTable(`S${sub(n)} (permutações de ${n} elementos)`, perms.map(p => cycleString(p)), (i, j) => keys.indexOf(permKey(compose(perms[i], perms[j]))), 0, 'simetrico', { n, perms });
}

const SUBS = '₀₁₂₃₄₅₆₇₈₉', SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sub = n => String(n).split('').map(d => SUBS[d]).join('');
const supNum = n => String(n).split('').map(d => SUPS[d]).join('');

export function order(G, g) {
  let x = g, k = 1;
  while (x !== G.e) { x = G.mul(x, g); k++; }
  return k;
}

export function power(G, g, k) {
  let x = G.e;
  for (let i = 0; i < k; i++) x = G.mul(x, g);
  return x;
}

/** Subgrupo gerado: ⟨g⟩ = {e, g, g², …}, na ordem das potências. */
export function generated(G, g) {
  const out = [G.e];
  let x = g;
  while (x !== G.e) { out.push(x); x = G.mul(x, g); }
  return out;
}

/** Subgrupo gerado por vários elementos (fecho por produto). */
export function generatedBy(G, gens) {
  const H = new Set([G.e]);
  let frontier = [G.e];
  while (frontier.length) {
    const next = [];
    for (const h of frontier) for (const g of gens) { const x = G.mul(h, g); if (!H.has(x)) { H.add(x); next.push(x); } }
    frontier = next;
  }
  return [...H].sort((a, b) => a - b);
}

/** Classes laterais à esquerda gH. Particionam G em |G|/|H| blocos (Lagrange). */
export function leftCosets(G, H) {
  const seen = new Set(), out = [];
  for (let g = 0; g < G.n; g++) {
    if (seen.has(g)) continue;
    const c = H.map(h => G.mul(g, h));
    c.forEach(x => seen.add(x));
    out.push({ rep: g, elements: c });
  }
  return out;
}

export const isAbelian = G => G.table.every((row, i) => row.every((x, j) => x === G.table[j][i]));
export const isCyclic = G => identity(G.n).some(g => order(G, g) === G.n);
export const isNormal = (G, H) => { const S = new Set(H); return identity(G.n).every(g => H.every(h => S.has(G.mul(G.mul(g, h), inverseOf(G, g))))); };
export const inverseOf = (G, g) => G.table[g].indexOf(G.e);

/** Todos os subgrupos (por geradores de até 2 elementos: basta para os grupos pequenos daqui). */
export function subgroups(G) {
  const found = new Map();
  for (let a = 0; a < G.n; a++) for (let b = a; b < G.n; b++) {
    const H = generatedBy(G, [a, b]);
    found.set(H.join(','), H);
  }
  return [...found.values()].sort((x, y) => x.length - y.length || x.join().localeCompare(y.join()));
}

// ---------- Teorema Chinês do Resto ----------

/** Euclides estendido com a tabela de passos: devolve { g, x, y, rows } com a·x + b·y = g. */
export function egcd(a, b) {
  const rows = [];
  let [r0, r1, s0, s1, t0, t1] = [a, b, 1, 0, 0, 1];
  rows.push({ r: r0, s: s0, t: t0, q: null });
  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    rows.push({ r: r1, s: s1, t: t1, q });
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
    [t0, t1] = [t1, t0 - q * t1];
  }
  return { g: r0, x: s0, y: t0, rows };
}

/**
 * Resolve x ≡ a (mod m), x ≡ b (mod n). Funciona também com m, n não coprimos
 * (há solução sse a ≡ b mod mdc(m, n)). Devolve { x, M } ou null, e os passos.
 */
export function crt(a, m, b, n) {
  const { g, x: u, rows } = egcd(m, n);   // m·u + n·v = g
  const steps = [];
  steps.push(`mdc(${m}, ${n}) = ${g}${g === 1 ? ': módulos coprimos, existe solução única módulo ' + m * n : ''}.`);
  if (mod(b - a, g) !== 0) { steps.push(`${a} e ${b} deixam restos diferentes módulo ${g}: <b>não há solução</b>.`); return { sol: null, steps, rows, g }; }
  const M = lcm(m, n);
  // x = a + m·k, com m·k ≡ b − a (mod n)  ⇒  k ≡ ((b − a)/g)·u (mod n/g)
  const k = mod(((b - a) / g) * u, n / g);
  const x = mod(a + m * k, M);
  steps.push(`Euclides estendido: ${m}·(${u}) + ${n}·(${(g - m * u) / n}) = ${g}, ou seja, ${m}⁻¹ ≡ ${mod(u, n / g)} (mod ${n / g}).`);
  steps.push(`Toda solução da 1ª equação é x = ${a} + ${m}k. Substituindo na 2ª: ${m}k ≡ ${b} − ${a} (mod ${n}), logo k ≡ ${k} (mod ${n / g}).`);
  steps.push(`x = ${a} + ${m}·${k} = ${a + m * k} ≡ <b>${x}</b> (mod ${M}).`);
  return { sol: { x, M }, steps, rows, g };
}

/** Sistema com várias congruências, resolvido de duas em duas. */
export function crtMany(eqs) {
  let [a, m] = eqs[0];
  for (const [b, n] of eqs.slice(1)) {
    const r = crt(a, m, b, n);
    if (!r.sol) return null;
    [a, m] = [r.sol.x, r.sol.M];
  }
  return { x: a, M: m };
}
