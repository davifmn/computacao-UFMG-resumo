// Matemática Discreta: teoria dos números, relações, contagem e recorrências.
// Funções puras, testadas em tests/discreta.test.js.

import { lineFinder } from '../../../engine/highlight.js';

// ======================================================================
// Teoria dos números
// ======================================================================

export const EUCLID_CODE = `def euclides_estendido(a, b):
    # invariantes: r0 = a·s0 + b·t0  e  r1 = a·s1 + b·t1
    r0, s0, t0 = a, 1, 0
    r1, s1, t1 = b, 0, 1
    while r1 != 0:
        q = r0 // r1
        r0, r1 = r1, r0 - q * r1
        s0, s1 = s1, s0 - q * s1
        t0, t1 = t1, t0 - q * t1
    return r0, s0, t0     # mdc(a, b) = a·s0 + b·t0`;

/** Algoritmo de Euclides estendido, passo a passo. */
export function euclidSteps(a, b) {
  const L = lineFinder(EUCLID_CODE);
  const steps = [];
  const rows = [{ r: a, s: 1, t: 0, q: null }, { r: b, s: 0, t: 1, q: null }];
  const squares = [];            // quadrados removidos do retângulo (interpretação geométrica)
  let [r0, s0, t0, r1, s1, t1] = [a, 1, 0, b, 0, 1];
  let rect = { x: 0, y: 0, w: a, h: b };
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, a, b, rows: rows.map(r => ({ ...r })), squares: squares.map(s => ({ ...s })), rect: { ...rect },
    vars: { r0, r1, s0, s1, t0, t1, ...(extra.q != null ? { q: extra.q } : {}) }, ...extra,
  });
  snap(L('def euclides_estendido'), `Calcular <b>mdc(${a}, ${b})</b> e os coeficientes de Bézout. Geometricamente: ladrilhar um retângulo ${a} × ${b} com os <b>maiores quadrados possíveis</b>. O lado do último quadrado é o mdc.`);
  snap(L('r0, s0, t0 = a, 1, 0'), `Começamos com ${a} = ${a}·1 + ${b}·0 e ${b} = ${a}·0 + ${b}·1: a invariante vale trivialmente.`);
  let k = 0;
  while (r1 !== 0) {
    snap(L('while r1 != 0'), `r1 = ${r1} ≠ 0: continua.`);
    const q = Math.floor(r0 / r1);
    // q quadrados de lado r1 cabem no retângulo atual r0 × r1
    for (let i = 0; i < q; i++) {
      if (rect.w >= rect.h) { squares.push({ x: rect.x + i * r1, y: rect.y, side: r1, step: k }); }
      else { squares.push({ x: rect.x, y: rect.y + i * r1, side: r1, step: k }); }
    }
    if (rect.w >= rect.h) rect = { x: rect.x + q * r1, y: rect.y, w: rect.w - q * r1, h: rect.h };
    else rect = { x: rect.x, y: rect.y + q * r1, w: rect.w, h: rect.h - q * r1 };
    snap(L('q = r0 // r1'), `${r0} = <b>${q}</b> × ${r1} + ${r0 - q * r1}: cabem ${q} quadrado(s) de lado ${r1}.`, { q, hot: k });
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
    [t0, t1] = [t1, t0 - q * t1];
    rows.push({ r: r1, s: s1, t: t1, q });
    snap(L('r0, r1 = r1'), `Troca o par (maior, menor) por (menor, resto) = (${r0}, ${r1}). Isso não muda a resposta, porque <b>mdc(a, b) = mdc(b, a mod b)</b>: todo divisor comum de a e b também divide o resto.`, { q, hot: k });
    snap(L('t0, t1 = t1'), `Atualiza os coeficientes com a mesma conta: ${r1} = ${a}·(${s1}) + ${b}·(${t1}).`, { q, hot: k });
    k++;
  }
  snap(L('while r1 != 0'), 'r1 = 0: o retângulo foi completamente ladrilhado.');
  snap(L('return r0'), `<b>mdc(${a}, ${b}) = ${r0}</b> = ${a}·(${s0}) + ${b}·(${t0}). ${r0 === 1 ? `Como o mdc é 1, ${s0} é o <b>inverso de ${a} módulo ${b}</b> (a menos de somar ${b}).` : ''}`, { done: true, gcd: r0, s: s0, t: t0 });
  return steps;
}

export function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a); }

export function egcd(a, b) {
  let [r0, s0, t0, r1, s1, t1] = [a, 1, 0, b, 0, 1];
  while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; [t0, t1] = [t1, t0 - q * t1]; }
  return { g: r0, s: s0, t: t0 };
}

export const mod = (a, n) => ((a % n) + n) % n;

export function modInverse(a, n) {
  const { g, s } = egcd(mod(a, n), n);
  return g === 1 ? mod(s, n) : null;
}

/** Exponenciação rápida (quadrados sucessivos) com BigInt; devolve também os passos. */
export function modPow(base, exp, n) {
  let b = BigInt(base) % BigInt(n), e = BigInt(exp), r = 1n;
  const N = BigInt(n);
  const steps = [];
  while (e > 0n) {
    const bit = e & 1n;
    if (bit) r = (r * b) % N;
    steps.push({ bit: Number(bit), b: Number(b), r: Number(r) });
    b = (b * b) % N;
    e >>= 1n;
  }
  return { value: Number(r), steps };
}

export function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** Gera as chaves RSA de brinquedo a partir de dois primos. */
export function rsaKeys(p, q, e = null) {
  if (!isPrime(p) || !isPrime(q) || p === q) throw new RangeError('p e q devem ser primos distintos');
  const n = p * q, phi = (p - 1) * (q - 1);
  if (e == null) { e = 3; while (gcd(e, phi) !== 1) e += 2; }
  if (gcd(e, phi) !== 1) throw new RangeError(`e = ${e} não é coprimo com φ(n) = ${phi}`);
  return { p, q, n, phi, e, d: modInverse(e, phi) };
}

// ======================================================================
// Relações binárias sobre {1, …, n}  (matriz booleana M[i][j] = 1 se i R j)
// ======================================================================

export const WARSHALL_CODE = `def fecho_transitivo(M):
    n = len(M)
    for k in range(n):          # permite passar pelo vértice k
        for i in range(n):
            for j in range(n):
                if M[i][k] and M[k][j]:
                    M[i][j] = 1     # i → k → j  ⇒  i → j
    return M`;

export function relationFrom(n, pred) {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (pred(i + 1, j + 1) ? 1 : 0)));
}

export function properties(M) {
  const n = M.length;
  const all = f => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!f(i, j)) return false; return true; };
  const reflexiva = [...Array(n).keys()].every(i => M[i][i]);
  const irreflexiva = [...Array(n).keys()].every(i => !M[i][i]);
  const simetrica = all((i, j) => !M[i][j] || M[j][i]);
  const antissimetrica = all((i, j) => i === j || !(M[i][j] && M[j][i]));
  let transitiva = true;
  for (let i = 0; i < n && transitiva; i++) for (let j = 0; j < n && transitiva; j++) for (let k = 0; k < n; k++) {
    if (M[i][j] && M[j][k] && !M[i][k]) { transitiva = false; break; }
  }
  return {
    reflexiva, irreflexiva, simetrica, antissimetrica, transitiva,
    equivalencia: reflexiva && simetrica && transitiva,
    ordemParcial: reflexiva && antissimetrica && transitiva,
  };
}

/** Um contraexemplo para cada propriedade que falha (para explicar ao aluno). */
export function counterexamples(M) {
  const n = M.length, out = {};
  for (let i = 0; i < n; i++) if (!M[i][i]) { out.reflexiva = `(${i + 1}, ${i + 1}) ∉ R`; break; }
  outer: for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (M[i][j] && !M[j][i]) { out.simetrica = `(${i + 1}, ${j + 1}) ∈ R mas (${j + 1}, ${i + 1}) ∉ R`; break outer; }
  outer2: for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && M[i][j] && M[j][i]) { out.antissimetrica = `(${i + 1}, ${j + 1}) e (${j + 1}, ${i + 1}) ∈ R`; break outer2; }
  outer3: for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
    if (M[i][j] && M[j][k] && !M[i][k]) { out.transitiva = `(${i + 1}, ${j + 1}) e (${j + 1}, ${k + 1}) ∈ R mas (${i + 1}, ${k + 1}) ∉ R`; break outer3; }
  }
  return out;
}

/** Classes de equivalência (só faz sentido se for relação de equivalência). */
export function equivalenceClasses(M) {
  const n = M.length, seen = new Set(), classes = [];
  for (let i = 0; i < n; i++) {
    if (seen.has(i)) continue;
    const cls = [];
    for (let j = 0; j < n; j++) if (M[i][j]) { cls.push(j + 1); seen.add(j); }
    classes.push(cls);
  }
  return classes;
}

export function warshallSteps(M0) {
  const L = lineFinder(WARSHALL_CODE);
  const M = M0.map(r => [...r]);
  const n = M.length;
  const steps = [];
  const added = [];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, M: M.map(r => [...r]), added: [...added], ...extra, vars: { ...(extra.vars ?? {}) } });
  snap(L('def fecho_transitivo'), 'O <b>fecho transitivo</b> acrescenta o mínimo de pares para a relação ficar transitiva: <b>i alcança j por algum caminho ⇒ i → j</b>. Algoritmo de Warshall: O(n³).');
  for (let k = 0; k < n; k++) {
    snap(L('for k in range(n)'), `k = ${k + 1}: agora caminhos podem passar pelo vértice <b>${k + 1}</b>. Quem chega em ${k + 1} passa a alcançar tudo que ${k + 1} alcança.`, { k, vars: { k: k + 1 } });
    for (let i = 0; i < n; i++) {
      if (!M[i][k]) continue;
      for (let j = 0; j < n; j++) {
        if (M[k][j] && !M[i][j]) {
          M[i][j] = 1;
          added.push([i, j]);
          snap(L('M[i][j] = 1'), `${i + 1} → ${k + 1} e ${k + 1} → ${j + 1}, então acrescenta <b>${i + 1} → ${j + 1}</b>.`, { k, i, j, via: [i, k, j], vars: { k: k + 1, i: i + 1, j: j + 1 } });
        }
      }
    }
  }
  snap(L('return M'), `Pronto: ${added.length} par(es) acrescentado(s). Agora R⁺ é transitiva.`, { done: true });
  return steps;
}

// ======================================================================
// Contagem
// ======================================================================

export function binom(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

export const factorial = n => (n <= 1 ? 1 : n * factorial(n - 1));

/** Lista todos os arranjos/combinações de k elementos de `items`. */
export function enumerate(items, k, { order = true, repeat = false } = {}) {
  const out = [];
  const rec = (start, cur, used) => {
    if (cur.length === k) { out.push([...cur]); return; }
    for (let i = order ? 0 : start; i < items.length; i++) {
      if (!repeat && used.has(i)) continue;   // sem repetição: cada item uma vez só
      cur.push(items[i]);
      if (!repeat) used.add(i);
      rec(repeat ? i : i + 1, cur, used);      // sem ordem: só índices crescentes (evita duplicatas)
      cur.pop();
      used.delete(i);
    }
  };
  rec(0, [], new Set());
  return out;
}

/** Fórmula de cada caso: n elementos, k escolhas. */
export function countFormula(n, k, { order, repeat }) {
  if (order && repeat) return { value: n ** k, tex: `n^k = ${n}^{${k}}` };
  if (order && !repeat) return { value: factorial(n) / factorial(n - k), tex: `\\frac{n!}{(n-k)!} = \\frac{${n}!}{${n - k}!}` };
  if (!order && !repeat) return { value: binom(n, k), tex: `\\binom{n}{k} = \\binom{${n}}{${k}}` };
  return { value: binom(n + k - 1, k), tex: `\\binom{n+k-1}{k} = \\binom{${n + k - 1}}{${k}}` };
}

// ======================================================================
// Recorrências: Torre de Hanói
// ======================================================================

export const HANOI_CODE = `def hanoi(n, origem, destino, aux):
    if n == 0:
        return                          # caso base: nada a mover
    hanoi(n - 1, origem, aux, destino)  # tira os n-1 de cima
    move(n, origem, destino)            # move o maior disco
    hanoi(n - 1, aux, destino, origem)  # recoloca os n-1 por cima`;

export function hanoiSteps(n) {
  const L = lineFinder(HANOI_CODE);
  const pegs = [[...Array(n).keys()].map(i => n - i), [], []];
  const names = ['A', 'B', 'C'];
  const steps = [];
  const stack = [];
  let moves = 0;
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, pegs: pegs.map(p => [...p]), moves, n, stack: stack.map(f => ({ ...f })), ...extra,
    vars: { movimentos: moves, 'profundidade': stack.length, ...(stack.length ? { n: stack[stack.length - 1].n } : {}) },
  });
  const rec = (k, from, to, aux) => {
    stack.push({ n: k, from: names[from], to: names[to] });
    if (k === 0) { snap(L('return'), 'n = 0: nada a fazer.'); stack.pop(); return; }
    snap(L('hanoi(n - 1, origem, aux'), `Para mover ${k} disco(s) de ${names[from]} para ${names[to]}: primeiro tira os ${k - 1} de cima, levando-os para ${names[aux]}.`);
    rec(k - 1, from, aux, to);
    const disk = pegs[from].pop();
    pegs[to].push(disk);
    moves++;
    snap(L('move(n, origem, destino)'), `Move o disco <b>${disk}</b> de ${names[from]} para ${names[to]}.`, { moved: disk });
    rec(k - 1, aux, to, from);
    stack.pop();
  };
  snap(L('def hanoi'), `Mover ${n} discos de A para C, um por vez, sem nunca pôr um disco maior sobre um menor.`);
  rec(n, 0, 2, 1);
  snap(null, `Terminado em <b>${moves}</b> movimentos = 2^${n} − 1. Recorrência: T(n) = 2·T(n−1) + 1, T(0) = 0.`, { done: true });
  return steps;
}

/** Só a lista de movimentos (para testes e para n grande). */
export function hanoiMoves(n, from = 0, to = 2, aux = 1, out = []) {
  if (n === 0) return out;
  hanoiMoves(n - 1, from, aux, to, out);
  out.push([from, to]);
  hanoiMoves(n - 1, aux, to, from, out);
  return out;
}
