// Álgebra linear para as visualizações de GAAL: frações exatas, eliminação de
// Gauss-Jordan passo a passo e utilitários 2×2 (determinante, autovalores).

import { lineFinder } from '../../../engine/highlight.js';

// ======================================================================
// Frações exatas — evitam o 0,333333 da aritmética de ponto flutuante
// ======================================================================

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

export class Frac {
  constructor(n, d = 1) {
    if (d === 0) throw new RangeError('Divisão por zero');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }
  static of(x) {
    if (x instanceof Frac) return x;
    if (typeof x === 'number') {
      if (Number.isInteger(x)) return new Frac(x);
      const s = String(x);
      const dec = s.split('.')[1]?.length ?? 0;
      return new Frac(Math.round(x * 10 ** dec), 10 ** dec);
    }
    const s = String(x).trim().replace(',', '.');
    if (s.includes('/')) {
      const [a, b] = s.split('/');
      return Frac.of(a).div(Frac.of(b));
    }
    const v = Number(s);
    if (!Number.isFinite(v)) throw new SyntaxError(`Número inválido: "${x}"`);
    return Frac.of(v);
  }
  add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { o = Frac.of(o); return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  isZero() { return this.n === 0; }
  isOne() { return this.n === 1 && this.d === 1; }
  eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
  valueOf() { return this.n / this.d; }
  toString() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }
  toTex() {
    if (this.d === 1) return String(this.n);
    return `${this.n < 0 ? '-' : ''}\\frac{${Math.abs(this.n)}}{${this.d}}`;
  }
}

// ======================================================================
// Eliminação de Gauss-Jordan (forma escalonada reduzida)
// ======================================================================

export const GAUSS_CODE = `def gauss_jordan(M):
    lin, col = len(M), len(M[0])
    r = 0                                   # linha do próximo pivô
    for c in range(col - 1):
        p = achar_pivo(M, r, c)             # 1ª linha >= r com M[i][c] != 0
        if p is None:
            continue                        # coluna sem pivô: variável livre
        M[r], M[p] = M[p], M[r]             # troca de linhas
        M[r] = M[r] / M[r][c]               # pivô vira 1
        for i in range(lin):
            if i != r and M[i][c] != 0:
                M[i] = M[i] - M[i][c] * M[r]  # zera o resto da coluna
        r += 1
        if r == lin:
            break
    return M`;

const SUB = n => String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join('');
const coefStr = f => (f.d === 1 ? String(f.n) : `(${f})`);

/** Lê "1 2 3 | 4" (uma linha por equação) numa matriz aumentada de frações. */
export function parseAugmented(text) {
  const rows = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
    .map(l => l.replace('|', ' ').split(/[\s;,]+/).filter(Boolean).map(Frac.of));
  if (!rows.length) throw new SyntaxError('Digite ao menos uma linha.');
  const w = rows[0].length;
  if (w < 2) throw new SyntaxError('Cada linha precisa de pelo menos um coeficiente e o termo independente.');
  if (rows.some(r => r.length !== w)) throw new SyntaxError('Todas as linhas precisam ter o mesmo número de colunas.');
  return rows;
}

export function gaussSteps(input) {
  const L = lineFinder(GAUSS_CODE);
  const M = input.map((row, id) => ({ id, cells: row.map(Frac.of) }));
  const lin = M.length, col = M[0].cells.length;
  const steps = [];
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, ...extra,
    rows: M.map(r => ({ id: r.id, cells: r.cells.map(String) })),
    vars: { r: extra.r ?? r, ...(extra.c != null ? { c: extra.c } : {}), ...(extra.p != null ? { p: extra.p } : {}) },
  });

  let r = 0;
  snap(L('def gauss_jordan'), `Matriz aumentada ${lin}×${col}. Objetivo: usar <b>operações elementares</b> (trocar linhas, multiplicar por constante ≠ 0, somar múltiplo de outra linha) até chegar à forma escalonada <b>reduzida</b>. Nenhuma delas muda o conjunto solução!`);
  for (let c = 0; c < col - 1 && r < lin; c++) {
    let p = null;
    for (let i = r; i < lin; i++) if (!M[i].cells[c].isZero()) { p = i; break; }
    snap(L('p = achar_pivo'), p == null
      ? `Coluna ${c + 1}: todas as entradas da linha ${r + 1} para baixo são zero.`
      : `Coluna ${c + 1}: procuramos uma entrada não nula a partir da linha ${r + 1}. Achamos na linha <b>${p + 1}</b>.`,
    { c, p, focusCol: c, fromRow: r, pivot: p != null ? [p, c] : null });
    if (p == null) {
      snap(L('continue'), `Não há pivô na coluna ${c + 1}: a variável x${SUB(c + 1)} será <b>livre</b>.`, { c, focusCol: c });
      continue;
    }
    if (p !== r) {
      [M[r], M[p]] = [M[p], M[r]];
      snap(L('M[r], M[p] = M[p], M[r]'), `L${SUB(r + 1)} ↔ L${SUB(p + 1)}: troca de linhas para o pivô ficar na posição certa.`, { c, p, op: `L${SUB(r + 1)} ↔ L${SUB(p + 1)}`, pivot: [r, c], touched: [r, p] });
    }
    const piv = M[r].cells[c];
    if (!piv.isOne()) {
      M[r].cells = M[r].cells.map(x => x.div(piv));
      snap(L('M[r] = M[r] / M[r][c]'), `Divide a linha ${r + 1} por ${piv} para o pivô virar <b>1</b>.`, { c, op: `L${SUB(r + 1)} ← L${SUB(r + 1)} ÷ ${coefStr(piv)}`, pivot: [r, c], touched: [r] });
    } else {
      snap(L('M[r] = M[r] / M[r][c]'), `O pivô já vale 1.`, { c, pivot: [r, c] });
    }
    for (let i = 0; i < lin; i++) {
      if (i === r || M[i].cells[c].isZero()) continue;
      const k = M[i].cells[c];
      M[i].cells = M[i].cells.map((x, j) => x.sub(k.mul(M[r].cells[j])));
      snap(L('M[i] = M[i] - M[i][c] * M[r]'), `Zera a entrada (${i + 1}, ${c + 1}) subtraindo ${k} vezes a linha do pivô.`, { c, op: `L${SUB(i + 1)} ← L${SUB(i + 1)} − ${coefStr(k)}·L${SUB(r + 1)}`, pivot: [r, c], touched: [i] });
    }
    r++;
    snap(L('r += 1'), `Coluna ${c + 1} pronta: pivô 1 e zeros no resto. Próxima linha de pivô: ${r + 1 > lin ? '—' : r + 1}.`, { c, r, doneCol: c });
  }
  const sol = solve(M.map(row => row.cells));
  snap(L('return M'), sol.msg, { done: true, solution: sol });
  return steps;
}

/** Interpreta a matriz reduzida: SPD, SPI ou SI. */
export function solve(R) {
  const lin = R.length, n = R[0].length - 1;
  for (const row of R) {
    if (row.slice(0, n).every(x => x.isZero()) && !row[n].isZero()) {
      return { type: 'SI', msg: `Uma linha virou <b>0 = ${row[n]}</b>: absurdo! Sistema <b>impossível</b> (SI), sem solução. Geometricamente, os planos/retas não têm ponto em comum.` };
    }
  }
  const pivots = []; // coluna do pivô de cada linha
  for (const row of R) {
    const c = row.findIndex((x, j) => j < n && !x.isZero());
    if (c >= 0) pivots.push({ row, c });
  }
  const pivotCols = new Set(pivots.map(p => p.c));
  const free = [...Array(n).keys()].filter(j => !pivotCols.has(j));
  const x = j => `x${SUB(j + 1)}`;
  if (!free.length) {
    const vals = Array(n);
    for (const { row, c } of pivots) vals[c] = row[n];
    return { type: 'SPD', values: vals.map(String), msg: `Todas as variáveis têm pivô: sistema <b>possível e determinado</b> (SPD), com solução única: ${vals.map((v, j) => `${x(j)} = <b>${v}</b>`).join(', ')}.` };
  }
  const exprs = pivots.map(({ row, c }) => {
    let s = row[n].isZero() ? '' : String(row[n]);
    for (const j of free) {
      const k = row[j];
      if (k.isZero()) continue;
      const mag = k.n < 0 ? k.neg() : k;
      s += `${s ? (k.n < 0 ? ' + ' : ' − ') : k.n < 0 ? '' : '−'}${mag.isOne() ? '' : mag}${x(j)}`;
    }
    return `${x(c)} = ${s || '0'}`;
  });
  return {
    type: 'SPI', free: free.map(x), exprs,
    msg: `Posto ${pivots.length} &lt; ${n} incógnitas: sistema <b>possível e indeterminado</b> (SPI), com infinitas soluções. Livre(s): ${free.map(x).join(', ')}. ${exprs.join('; ')}.`,
  };
}

// ======================================================================
// Transformações 2×2  —  M = [[a, b], [c, d]] age como (x, y) ↦ (ax + by, cx + dy)
// ======================================================================

export const apply = ([[a, b], [c, d]], [x, y]) => [a * x + b * y, c * x + d * y];
export const det2 = ([[a, b], [c, d]]) => a * d - b * c;
export const lerpMatrix = (M, t) => M.map((row, i) => row.map((v, j) => (1 - t) * (i === j ? 1 : 0) + t * v));
export const mul2 = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];

/** Autovalores reais e autovetores unitários de uma matriz 2×2. */
export function eigen2(M) {
  const [[a, b], [c, d]] = M;
  const tr = a + d, dt = det2(M);
  const disc = tr * tr - 4 * dt;
  if (disc < -1e-12) return { real: false, values: [], vectors: [] };
  const s = Math.sqrt(Math.max(0, disc));
  const lams = s < 1e-12 ? [tr / 2] : [(tr + s) / 2, (tr - s) / 2];
  const out = { real: true, values: [], vectors: [] };
  for (const l of lams) {
    // (M − λI)v = 0  →  pega uma linha não nula de M − λI
    let v;
    if (Math.abs(b) > 1e-12) v = [b, l - a];
    else if (Math.abs(c) > 1e-12) v = [l - d, c];
    else v = Math.abs(a - l) < 1e-12 ? [1, 0] : [0, 1];
    const n = Math.hypot(...v);
    out.values.push(l);
    out.vectors.push([v[0] / n, v[1] / n]);
    // Matriz escalar (λI): todo vetor é autovetor — mostramos os dois eixos.
    if (s < 1e-12 && Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12) {
      out.values.push(l);
      out.vectors.push([0, 1]);
    }
  }
  return out;
}
