// Álgebra linear numérica: sistemas (Gauss com pivoteamento parcial),
// mínimos quadrados, método das potências, PageRank e SVD (Jacobi unilateral).

// ---------- Sistemas lineares ----------

/** Resolve A x = b por eliminação de Gauss com pivoteamento parcial. */
export function solve(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;   // maior pivô: menos erro
    if (Math.abs(M[p][c]) < 1e-14) throw new RangeError('Matriz singular');
    [M[c], M[p]] = [M[p], M[c]];
    for (let i = c + 1; i < n; i++) {
      const k = M[i][c] / M[c][c];
      for (let j = c; j <= n; j++) M[i][j] -= k * M[c][j];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

export const matT = A => A[0].map((_, j) => A.map(r => r[j]));
export const matMul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
export const matVec = (A, x) => A.map(r => r.reduce((s, v, k) => s + v * x[k], 0));
export const norm = x => Math.hypot(...x);

// ---------- Mínimos quadrados ----------

/**
 * Ajusta um polinômio de grau d aos pontos pelas equações normais AᵀA c = Aᵀy.
 * Com { scaled: true }, usa t = (x − μ)/s para melhorar o condicionamento
 * (os coeficientes `c` passam a ser na variável t).
 */
export function polyFit(points, d, { scaled = false } = {}) {
  const xs = points.map(p => p[0]);
  const mu = scaled ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const sc = scaled ? Math.max(1e-9, Math.max(...xs.map(x => Math.abs(x - mu)))) : 1;
  const T = x => (x - mu) / sc;
  const A = points.map(([x]) => Array.from({ length: d + 1 }, (_, k) => T(x) ** k));   // matriz de Vandermonde
  const y = points.map(p => p[1]);
  const At = matT(A);
  const c = solve(matMul(At, A), matVec(At, y));
  const pred = x => c.reduce((s, ck, k) => s + ck * T(x) ** k, 0);
  const residuals = points.map(([x, yy]) => yy - pred(x));
  return { c, pred, residuals, sse: residuals.reduce((s, r) => s + r * r, 0), A };
}

// ---------- Método das potências e PageRank ----------

/** Iterações x ← A x / ‖A x‖; devolve os vetores e a estimativa do autovalor dominante. */
export function powerIteration(A, x0, iters = 50) {
  const hist = [];
  let x = [...x0];
  for (let k = 0; k < iters; k++) {
    const y = matVec(A, x);
    const lambda = x.reduce((s, v, i) => s + v * y[i], 0) / x.reduce((s, v) => s + v * v, 0);   // quociente de Rayleigh
    const n = y.reduce((s, v) => s + Math.abs(v), 0);
    x = y.map(v => v / n);
    hist.push({ x: [...x], lambda });
  }
  return hist;
}

/**
 * Matriz do Google: G = d·M + (1−d)/n · 11ᵀ, onde M[i][j] = 1/grau(j) se j → i.
 * Páginas sem links de saída ("becos sem saída") distribuem igualmente para todas.
 */
export function googleMatrix(n, links, d = 0.85) {
  const out = Array(n).fill(0);
  for (const [j] of links) out[j]++;
  const G = Array.from({ length: n }, () => Array(n).fill((1 - d) / n));
  for (let j = 0; j < n; j++) {
    if (out[j] === 0) for (let i = 0; i < n; i++) G[i][j] += d / n;
  }
  for (const [j, i] of links) G[i][j] += d / out[j];
  return G;
}

export function pagerank(n, links, d = 0.85, iters = 60) {
  return powerIteration(googleMatrix(n, links, d), Array(n).fill(1 / n), iters);
}

// ---------- SVD (Jacobi unilateral) ----------

/**
 * SVD de A (m × n, m ≥ n) pelo método de Jacobi unilateral: ortogonaliza as
 * colunas de A com rotações de Givens aplicadas pela direita. Simples e preciso.
 * Retorna { U (m×n), S (n), V (n×n) } com A = U·diag(S)·Vᵀ e S decrescente.
 */
export function svd(A, { tol = 1e-10, maxSweeps = 40 } = {}) {
  const m = A.length, n = A[0].length;
  const U = A.map(r => Float64Array.from(r));
  const V = Array.from({ length: n }, (_, i) => { const r = new Float64Array(n); r[i] = 1; return r; });
  // trabalhamos com colunas: col[j][i] = U[i][j]
  const col = Array.from({ length: n }, (_, j) => Float64Array.from(U, r => r[j]));
  const vcol = Array.from({ length: n }, (_, j) => Float64Array.from(V, r => r[j]));
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      const a = col[p], b = col[q];
      let alpha = 0, beta = 0, gamma = 0;
      for (let i = 0; i < m; i++) { alpha += a[i] * a[i]; beta += b[i] * b[i]; gamma += a[i] * b[i]; }
      if (Math.abs(gamma) <= tol * Math.sqrt(alpha * beta) || gamma === 0) continue;
      off = Math.max(off, Math.abs(gamma) / Math.sqrt(alpha * beta));
      const zeta = (beta - alpha) / (2 * gamma);
      const t = Math.sign(zeta || 1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
      const c = 1 / Math.sqrt(1 + t * t), s = c * t;
      for (let i = 0; i < m; i++) { const x = a[i], y = b[i]; a[i] = c * x - s * y; b[i] = s * x + c * y; }
      const va = vcol[p], vb = vcol[q];
      for (let i = 0; i < n; i++) { const x = va[i], y = vb[i]; va[i] = c * x - s * y; vb[i] = s * x + c * y; }
    }
    if (off < tol) break;
  }
  const S = col.map(c => Math.hypot(...c));
  const order = [...S.keys()].sort((i, j) => S[j] - S[i]);
  return {
    S: order.map(j => S[j]),
    U: order.map(j => col[j].map(v => (S[j] > 1e-300 ? v / S[j] : 0))),     // colunas de U
    V: order.map(j => vcol[j]),                                             // colunas de V
  };
}

/** Reconstrói a matriz usando só os k maiores valores singulares: Aₖ = Σᵢ σᵢ uᵢ vᵢᵀ. */
export function lowRank({ U, S, V }, k, m, n) {
  const out = Array.from({ length: m }, () => new Float64Array(n));
  for (let r = 0; r < k; r++) {
    const s = S[r], u = U[r], v = V[r];
    for (let i = 0; i < m; i++) {
      const su = s * u[i];
      if (su === 0) continue;
      const row = out[i];
      for (let j = 0; j < n; j++) row[j] += su * v[j];
    }
  }
  return out;
}
