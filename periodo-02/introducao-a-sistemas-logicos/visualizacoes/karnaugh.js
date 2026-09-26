// Mapas de Karnaugh e minimização exata (Quine–McCluskey + cobertura mínima).
//
// Mintermo: número cujos bits são os valores das variáveis (A é o mais significativo).
// Implicante: { v, m } — `m` marca as variáveis eliminadas ("don't care" no termo),
// `v` guarda os valores das demais (com os bits de `m` zerados).

export const NAMES = ['A', 'B', 'C', 'D'];
export const GRAY = { 1: [0, 1], 2: [0, 1, 3, 2] };

/** Linhas × colunas do mapa para n variáveis. */
export function layout(n) {
  const rowBits = n >> 1;          // 2→1, 3→1, 4→2
  const colBits = n - rowBits;     // 2→1, 3→2, 4→2
  return {
    n, rowBits, colBits,
    rows: GRAY[rowBits], cols: GRAY[colBits],
    rowVars: NAMES.slice(0, rowBits), colVars: NAMES.slice(rowBits, n),
    minterm: (r, c) => (GRAY[rowBits][r] << colBits) | GRAY[colBits][c],
  };
}

const popcount = x => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
export const literals = (imp, n) => n - popcount(imp.m);

/** Todos os implicantes primos das funções com os mintermos `ones` e irrelevantes `dcs`. */
export function primeImplicants(n, ones, dcs = []) {
  let current = [...new Set([...ones, ...dcs])].map(v => ({ v, m: 0 }));
  const primes = new Map();
  while (current.length) {
    const next = new Map();
    const used = new Set();
    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const a = current[i], b = current[j];
        const diff = a.v ^ b.v;
        if (a.m !== b.m || popcount(diff) !== 1) continue;
        const c = { v: a.v & ~diff, m: a.m | diff };
        next.set(`${c.v}/${c.m}`, c);
        used.add(i); used.add(j);
      }
    }
    current.forEach((imp, i) => { if (!used.has(i)) primes.set(`${imp.v}/${imp.m}`, imp); });
    current = [...next.values()];
  }
  return [...primes.values()];
}

export const covers = (imp, x) => (x & ~imp.m) === imp.v;
export const mintermsOf = (imp, n) => [...Array(2 ** n).keys()].filter(x => covers(imp, x));

/**
 * Soma de produtos mínima: menor número de termos e, no empate, de literais.
 * Retorna { terms: [implicante], primes, essential: Set(chave) }.
 */
export function minimize(n, ones, dcs = []) {
  const primes = primeImplicants(n, ones, dcs).filter(p => ones.some(x => covers(p, x)));
  const key = p => `${p.v}/${p.m}`;
  const essential = new Set();
  for (const x of ones) {
    const cov = primes.filter(p => covers(p, x));
    if (cov.length === 1) essential.add(key(cov[0]));
  }
  // Busca exata (ramificação sobre o mintermo com menos opções) — trivial para n ≤ 4.
  let best = null;
  const cost = sel => [sel.length, sel.reduce((s, p) => s + literals(p, n), 0)];
  const better = (a, b) => !b || a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const search = (sel, remaining) => {
    if (best && sel.length > best.cost[0]) return;
    if (!remaining.length) {
      const c = cost(sel);
      if (better(c, best?.cost)) best = { sel: [...sel], cost: c };
      return;
    }
    let pick = null, options = null;
    for (const x of remaining) {
      const o = primes.filter(p => covers(p, x));
      if (!options || o.length < options.length) { pick = x; options = o; }
    }
    for (const p of options) {
      search([...sel, p], remaining.filter(x => !covers(p, x)));
    }
  };
  const start = primes.filter(p => essential.has(key(p)));
  search(start, ones.filter(x => !start.some(p => covers(p, x))));
  const terms = (best?.sel ?? []).sort((a, b) => literals(a, n) - literals(b, n) || a.v - b.v);
  return { terms, primes, essential, key };
}

/** Termo como texto: A'BC'  (apóstrofo = negação). */
export function termText(imp, n) {
  if (imp.m === 2 ** n - 1) return '1';
  let s = '';
  for (let i = 0; i < n; i++) {
    const bit = 1 << (n - 1 - i);
    if (imp.m & bit) continue;
    s += NAMES[i] + (imp.v & bit ? '' : "'");
  }
  return s;
}

export function termTex(imp, n) {
  if (imp.m === 2 ** n - 1) return '1';
  let s = '';
  for (let i = 0; i < n; i++) {
    const bit = 1 << (n - 1 - i);
    if (imp.m & bit) continue;
    s += imp.v & bit ? NAMES[i] : `\\overline{${NAMES[i]}}`;
  }
  return s;
}

export function sopText(result, n) {
  if (!result.terms.length) return '0';
  return result.terms.map(t => termText(t, n)).join(' + ');
}

/**
 * Retângulos (em células) que desenham um implicante no mapa, tratando a volta
 * nas bordas (o mapa é um toro: a 1ª e a última coluna são vizinhas).
 */
export function rectsOf(imp, n) {
  const L = layout(n);
  const cells = new Set(mintermsOf(imp, n));
  const runs = (count, pred) => {
    const idx = [...Array(count).keys()].filter(pred);
    if (idx.length === count) return [[0, count - 1]];
    const out = [];
    for (const i of idx) {
      const last = out[out.length - 1];
      if (last && last[1] === i - 1) last[1] = i; else out.push([i, i]);
    }
    // Um grupo que "dá a volta" (ex.: 1ª e última coluna) vira dois pedaços, um em cada borda.
    return out;
  };
  const rowOk = r => [...Array(L.cols.length).keys()].some(c => cells.has(L.minterm(r, c)));
  const colOk = c => [...Array(L.rows.length).keys()].some(r => cells.has(L.minterm(r, c)));
  const rr = runs(L.rows.length, rowOk), cc = runs(L.cols.length, colOk);
  const rects = [];
  for (const [r0, r1] of rr) for (const [c0, c1] of cc) rects.push({ r0, r1, c0, c1 });
  return rects;
}

/**
 * Lê uma soma de produtos digitada ("A'B + AC", "¬A·B + A C", "~a b + c")
 * e devolve a tabela-verdade (array de 0/1 com 2^n posições).
 */
export function parseSOP(src, n) {
  const text = src.replace(/\s+/g, '').replace(/[·*&.]/g, '').replace(/[¬~!]([A-Da-d])/g, "$1'").toUpperCase();
  if (!text) throw new SyntaxError('Digite uma expressão');
  if (text === '0') return Array(2 ** n).fill(0);
  const terms = text.split(/[+|∨]/);
  const table = Array(2 ** n).fill(0);
  const imps = terms.map(t => {
    if (t === '1') return { v: 0, m: 2 ** n - 1 };
    if (!/^([A-D]'*)+$/.test(t)) throw new SyntaxError(`Termo inválido: "${t}"`);
    let v = 0, fixed = 0;
    for (const [, name, primes] of t.matchAll(/([A-D])('*)/g)) {
      const i = NAMES.indexOf(name);
      if (i >= n) throw new SyntaxError(`A variável ${name} não existe com ${n} variáveis`);
      const bit = 1 << (n - 1 - i);
      const val = primes.length % 2 === 0 ? bit : 0;
      if (fixed & bit && (v & bit) !== val) return null;   // x·x' = 0: termo vazio
      fixed |= bit;
      v = (v & ~bit) | val;
    }
    return { v, m: (2 ** n - 1) & ~fixed };
  });
  for (const imp of imps) if (imp) for (const x of mintermsOf(imp, n)) table[x] = 1;
  return table;
}

/** Custo (termos, literais) de uma soma de produtos digitada, para checar se é mínima. */
export function sopCost(src, n) {
  const terms = src.replace(/\s+/g, '').split(/[+|∨]/).filter(Boolean);
  const lits = terms.reduce((s, t) => s + (t.match(/[A-Da-d]/g)?.length ?? 0), 0);
  return [terms.length, lits];
}

/** Função aleatória "interessante" (nem constante, com alguns don't cares opcionais). */
export function randomFunction(n, { dc = false } = {}) {
  const size = 2 ** n;
  for (;;) {
    const cells = Array.from({ length: size }, () => {
      const r = Math.random();
      return dc && r < 0.12 ? 'x' : r < 0.5 ? 1 : 0;
    });
    const ones = cells.filter(c => c === 1).length;
    if (ones >= 2 && ones <= size - 2) return cells;
  }
}
