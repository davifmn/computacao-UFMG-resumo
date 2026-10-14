// Equações diferenciais: campos de direções e métodos numéricos (Euler, Heun,
// Runge-Kutta 4), o oscilador massa-mola-amortecedor forçado e a classificação
// de sistemas lineares 2×2 no plano de fase.

// ---------- EDOs de 1ª ordem ----------

export const EQUATIONS = {
  linear: {
    nome: "y' = t − y",
    tex: "y' = t - y",
    f: (t, y) => t - y,
    exact: (t, t0, y0) => t - 1 + (y0 - t0 + 1) * Math.exp(-(t - t0)),
    win: { t: [-1, 6], y: [-3, 5] },
    nota: 'Linear de 1ª ordem: fator integrante $e^t$. Todas as soluções se aproximam da reta $y = t - 1$, a única que é solução polinomial.',
  },
  logistica: {
    nome: "y' = y(1 − y)",
    tex: "y' = y(1 - y)",
    f: (t, y) => y * (1 - y),
    exact: (t, t0, y0) => (y0 === 0 ? 0 : 1 / (1 + ((1 - y0) / y0) * Math.exp(-(t - t0)))),
    win: { t: [-1, 8], y: [-1, 2.5] },
    nota: 'Autônoma e separável: equilíbrios em $y = 0$ (instável) e $y = 1$ (estável). É o modelo logístico de populações com capacidade de suporte 1.',
  },
  gaussiana: {
    nome: "y' = −2ty",
    tex: "y' = -2ty",
    f: (t, y) => -2 * t * y,
    exact: (t, t0, y0) => y0 * Math.exp(-(t * t - t0 * t0)),
    win: { t: [-3, 3], y: [-2.5, 2.5] },
    nota: 'Separável: $dy/y = -2t\\,dt$ dá $y = Ce^{-t^2}$, gaussianas.',
  },
  explosao: {
    nome: "y' = y²",
    tex: "y' = y^2",
    f: (t, y) => y * y,
    exact: (t, t0, y0) => (y0 === 0 ? 0 : 1 / (1 / y0 - (t - t0))),
    blowup: (t0, y0) => (y0 > 0 ? t0 + 1 / y0 : Infinity),
    win: { t: [-2, 4], y: [-3, 6] },
    nota: 'A solução $y = 1/(C - t)$ explode em tempo finito: o teorema de existência é só <b>local</b>. O método numérico não percebe a assíntota e segue em frente.',
  },
  raiz: {
    nome: "y' = 3y^(2/3)",
    tex: "y' = 3y^{2/3}",
    f: (t, y) => 3 * Math.cbrt(y * y),
    exact: null,
    win: { t: [-1, 3], y: [-1, 4] },
    nota: '$f$ não é Lipschitz em $y = 0$, e a unicidade falha: a partir de $y(0) = 0$, tanto $y = 0$ quanto $y = t^3$ (e infinitas emendas das duas) são soluções.',
  },
  seno: {
    nome: "y' = sen(t) − y/2",
    tex: "y' = \\operatorname{sen} t - y/2",
    f: (t, y) => Math.sin(t) - y / 2,
    exact: (t, t0, y0) => {
      const yp = s => (2 * Math.sin(s) - 4 * Math.cos(s)) / 5;
      return yp(t) + (y0 - yp(t0)) * Math.exp(-(t - t0) / 2);
    },
    win: { t: [0, 12], y: [-2.5, 2.5] },
    nota: 'Forçamento periódico com amortecimento: o transiente $Ce^{-t/2}$ some e todas as soluções convergem para a mesma oscilação permanente.',
  },
};

export const METHODS = {
  euler: { nome: 'Euler', ordem: 1, step: (f, t, y, h) => y + h * f(t, y) },
  heun: {
    nome: 'Heun (Euler melhorado)', ordem: 2,
    step: (f, t, y, h) => { const k1 = f(t, y), k2 = f(t + h, y + h * k1); return y + (h / 2) * (k1 + k2); },
  },
  rk4: {
    nome: 'Runge-Kutta 4', ordem: 4,
    step: (f, t, y, h) => {
      const k1 = f(t, y), k2 = f(t + h / 2, y + (h / 2) * k1), k3 = f(t + h / 2, y + (h / 2) * k2), k4 = f(t + h, y + h * k3);
      return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    },
  },
};

/** Pontos [t, y] da solução numérica de t0 até t1 (h pode ser negativo). */
export function solve(f, t0, y0, h, t1, method = 'rk4') {
  const step = METHODS[method].step;
  const pts = [[t0, y0]];
  const n = Math.round(Math.abs(t1 - t0) / Math.abs(h));
  const hh = (t1 - t0) / Math.max(1, n);
  let t = t0, y = y0;
  for (let k = 0; k < n; k++) {
    y = step(f, t, y, hh);
    t = t0 + (k + 1) * hh;
    if (!Number.isFinite(y) || Math.abs(y) > 1e6) break;
    pts.push([t, y]);
  }
  return pts;
}

/** Erro global em t1 para h, h/2, h/4: a razão entre erros sucessivos ≈ 2^ordem. */
export function convergence(eq, t0, y0, t1, h, method) {
  return [h, h / 2, h / 4].map(hh => {
    const y = solve(eq.f, t0, y0, hh, t1, method).at(-1)[1];
    return { h: hh, y, err: Math.abs(y - eq.exact(t1, t0, y0)) };
  });
}

// ---------- Sistemas: RK4 vetorial ----------

export function rk4System(F, t0, Y0, h, n) {
  const out = [[t0, ...Y0]];
  let t = t0, Y = [...Y0];
  const add = (A, B, s) => A.map((a, i) => a + s * B[i]);
  for (let k = 0; k < n; k++) {
    const k1 = F(t, Y), k2 = F(t + h / 2, add(Y, k1, h / 2)), k3 = F(t + h / 2, add(Y, k2, h / 2)), k4 = F(t + h, add(Y, k3, h));
    Y = Y.map((y, i) => y + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    t += h;
    out.push([t, ...Y]);
  }
  return out;
}

// ---------- Oscilador m y'' + c y' + k y = F0 cos(ω t) ----------

export function oscillator({ m, c, k, F0 = 0, w = 0, y0, v0 }, T, n = 1200) {
  const F = (t, [y, v]) => [v, (F0 * Math.cos(w * t) - c * v - k * y) / m];
  return rk4System(F, 0, [y0, v0], T / n, n);
}

/** Raízes da equação característica m r² + c r + k = 0 e o regime. */
export function characteristic(m, c, k) {
  const disc = c * c - 4 * m * k;
  if (Math.abs(disc) < 1e-12) return { tipo: c === 0 ? 'nao-amortecido' : 'critico', roots: [{ re: -c / (2 * m), im: 0 }, { re: -c / (2 * m), im: 0 }], disc: 0 };
  if (disc > 0) { const s = Math.sqrt(disc); return { tipo: 'superamortecido', roots: [{ re: (-c + s) / (2 * m), im: 0 }, { re: (-c - s) / (2 * m), im: 0 }], disc }; }
  const s = Math.sqrt(-disc) / (2 * m);
  return { tipo: c === 0 ? 'nao-amortecido' : 'subamortecido', roots: [{ re: -c / (2 * m), im: s }, { re: -c / (2 * m), im: -s }], disc };
}

/** Solução exata do caso homogêneo (F0 = 0), para conferir o RK4. */
export function homogeneous(m, c, k, y0, v0) {
  const ch = characteristic(m, c, k);
  const [r1, r2] = ch.roots;
  if (ch.disc > 0) {
    // y = A e^{r1 t} + B e^{r2 t}
    const B = (v0 - r1.re * y0) / (r2.re - r1.re), A = y0 - B;
    return t => A * Math.exp(r1.re * t) + B * Math.exp(r2.re * t);
  }
  if (ch.disc === 0) {
    const r = r1.re;
    return t => (y0 + (v0 - r * y0) * t) * Math.exp(r * t);
  }
  const a = r1.re, b = r1.im;
  return t => Math.exp(a * t) * (y0 * Math.cos(b * t) + ((v0 - a * y0) / b) * Math.sin(b * t));
}

/** Amplitude do regime permanente: F0 / √((k − mω²)² + (cω)²). */
export const amplitude = (m, c, k, F0, w) => F0 / Math.hypot(k - m * w * w, c * w);
/** Frequência de ressonância de amplitude (existe se c² < 2mk). */
export const resonance = (m, c, k) => (c * c < 2 * m * k ? Math.sqrt(k / m - (c * c) / (2 * m * m)) : 0);

// ---------- Sistemas lineares 2×2 ----------

export function eigen([[a, b], [c, d]]) {
  const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
  if (disc >= 0) {
    const s = Math.sqrt(disc), l1 = (tr + s) / 2, l2 = (tr - s) / 2;
    const vec = l => {
      // (A − λI) v = 0
      if (Math.abs(b) > 1e-12) return norm([b, l - a]);
      if (Math.abs(c) > 1e-12) return norm([l - d, c]);
      return Math.abs(l - a) < 1e-12 ? [1, 0] : [0, 1];
    };
    return { tr, det, disc, real: true, values: [l1, l2], vectors: [vec(l1), vec(l2)] };
  }
  return { tr, det, disc, real: false, values: [{ re: tr / 2, im: Math.sqrt(-disc) / 2 }, { re: tr / 2, im: -Math.sqrt(-disc) / 2 }] };
}
const norm = v => { const L = Math.hypot(...v); return v.map(x => x / L); };

/** Classificação do ponto de equilíbrio na origem pelo traço e determinante. */
export function classify(A) {
  const { tr, det, disc } = eigen(A);
  const e = 1e-9;
  if (Math.abs(det) < e) return { tipo: 'degenerado', nome: 'Degenerado (det = 0): uma reta de equilíbrios' };
  if (det < 0) return { tipo: 'sela', nome: 'Ponto de sela (instável)' };
  if (Math.abs(tr) < e) return { tipo: 'centro', nome: 'Centro (órbitas fechadas, estável mas não assintoticamente)' };
  const est = tr < 0 ? 'estável' : 'instável';
  if (disc < -e) return { tipo: tr < 0 ? 'espiral-estavel' : 'espiral-instavel', nome: `Foco (espiral) ${est}` };
  if (Math.abs(disc) < e) {
    const [[a, b], [c, d]] = A;
    const star = Math.abs(b) < e && Math.abs(c) < e && Math.abs(a - d) < e;
    return { tipo: star ? 'estrela' : 'no-degenerado', nome: star ? `Nó próprio (estrela) ${est}` : `Nó impróprio (degenerado) ${est}` };
  }
  return { tipo: tr < 0 ? 'no-estavel' : 'no-instavel', nome: `Nó ${est}` };
}

export const SYSTEMS = {
  sela: { nome: 'Sela', A: [[1, 1], [4, 1]] },
  no: { nome: 'Nó estável', A: [[-3, 1], [1, -3]] },
  espiral: { nome: 'Espiral estável', A: [[-0.5, -2], [2, -0.5]] },
  centro: { nome: 'Centro', A: [[0, 1], [-4, 0]] },
  espiralInst: { nome: 'Espiral instável', A: [[0.3, -1], [1, 0.3]] },
  degenerado: { nome: 'Nó degenerado', A: [[-2, 1], [0, -2]] },
  oscilador: { nome: "Oscilador y'' + 0,5y' + 4y = 0", A: [[0, 1], [-4, -0.5]] },
};
