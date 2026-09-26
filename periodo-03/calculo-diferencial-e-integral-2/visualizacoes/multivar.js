// Cálculo II: séries de Taylor, funções de duas variáveis, gradiente,
// curvas de nível (marching squares) e descida do gradiente.

// ======================================================================
// Séries de Taylor — derivadas de ordem k conhecidas em forma fechada
// ======================================================================

const fact = k => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };

export const TAYLOR = {
  sin: { nome: 'sen x', tex: '\\sin x', f: Math.sin, d: (k, a) => Math.sin(a + (k * Math.PI) / 2), view: [[-10, 10], [-3, 3]] },
  cos: { nome: 'cos x', tex: '\\cos x', f: Math.cos, d: (k, a) => Math.cos(a + (k * Math.PI) / 2), view: [[-10, 10], [-3, 3]] },
  exp: { nome: 'eˣ', tex: 'e^x', f: Math.exp, d: (k, a) => Math.exp(a), view: [[-5, 4], [-2, 12]] },
  ln: {
    nome: 'ln(1 + x)', tex: '\\ln(1+x)', f: x => (x > -1 ? Math.log(1 + x) : NaN), raio: a => 1 + a,
    d: (k, a) => (k === 0 ? Math.log(1 + a) : ((-1) ** (k - 1) * fact(k - 1)) / (1 + a) ** k), view: [[-2, 4], [-4, 3]],
  },
  geom: {
    nome: '1/(1 − x)', tex: '\\frac{1}{1-x}', f: x => 1 / (1 - x), raio: a => Math.abs(1 - a),
    d: (k, a) => fact(k) / (1 - a) ** (k + 1), view: [[-3, 3], [-4, 8]],
  },
  sqrt: {
    nome: '√(1 + x)', tex: '\\sqrt{1+x}', f: x => (x >= -1 ? Math.sqrt(1 + x) : NaN), raio: a => 1 + a,
    d: (k, a) => { let c = 1; for (let i = 0; i < k; i++) c *= 0.5 - i; return c * (1 + a) ** (0.5 - k); }, view: [[-2, 5], [-1, 3.5]],
  },
};

/** Coeficientes c_k = f⁽ᵏ⁾(a)/k! do polinômio de Taylor de grau n em torno de a. */
export function taylorCoeffs(fn, a, n) {
  return Array.from({ length: n + 1 }, (_, k) => TAYLOR[fn].d(k, a) / fact(k));
}

export function taylorEval(coeffs, a, x) {
  let s = 0;
  for (let k = coeffs.length - 1; k >= 0; k--) s = s * (x - a) + coeffs[k];   // Horner
  return s;
}

// ======================================================================
// Funções de duas variáveis
// ======================================================================

export const SURFACES = {
  paraboloide: { nome: 'Paraboloide', tex: 'x^2 + y^2', f: (x, y) => x * x + y * y, grad: (x, y) => [2 * x, 2 * y], range: 2, zScale: 0.5 },
  sela: { nome: 'Sela', tex: 'x^2 - y^2', f: (x, y) => x * x - y * y, grad: (x, y) => [2 * x, -2 * y], range: 2, zScale: 0.5 },
  ondas: { nome: 'Ondas', tex: '\\sin x \\cos y', f: (x, y) => Math.sin(x) * Math.cos(y), grad: (x, y) => [Math.cos(x) * Math.cos(y), -Math.sin(x) * Math.sin(y)], range: 3.5, zScale: 1.2 },
  sino: { nome: 'Sino', tex: 'e^{-(x^2+y^2)}', f: (x, y) => Math.exp(-(x * x + y * y)), grad: (x, y) => { const e = Math.exp(-(x * x + y * y)); return [-2 * x * e, -2 * y * e]; }, range: 2.2, zScale: 1.8 },
  picos: { nome: 'Pico e vale', tex: 'x\\,e^{-(x^2+y^2)}', f: (x, y) => x * Math.exp(-(x * x + y * y)), grad: (x, y) => { const e = Math.exp(-(x * x + y * y)); return [(1 - 2 * x * x) * e, -2 * x * y * e]; }, range: 2.2, zScale: 3 },
};

/** Funções para a descida do gradiente (vista de cima, com curvas de nível). */
export const LANDSCAPES = {
  tigela: { nome: 'Tigela', tex: 'x^2 + y^2', f: (x, y) => x * x + y * y, grad: (x, y) => [2 * x, 2 * y], box: [-3, 3, -2, 2], start: [-2.6, 1.6] },
  vale: { nome: 'Vale alongado', tex: 'x^2 + 10y^2', f: (x, y) => x * x + 10 * y * y, grad: (x, y) => [2 * x, 20 * y], box: [-3, 3, -2, 2], start: [-2.6, 1.2] },
  rosenbrock: {
    nome: 'Rosenbrock (banana)', tex: '(1-x)^2 + 100(y-x^2)^2',
    f: (x, y) => (1 - x) ** 2 + 100 * (y - x * x) ** 2,
    grad: (x, y) => [-2 * (1 - x) - 400 * x * (y - x * x), 200 * (y - x * x)], box: [-2, 2, -1, 3], start: [-1.5, 2.5], log: true,
  },
  dois: {
    nome: 'Dois mínimos', tex: '(x^2-1)^2 + y^2 + 0{,}3x',
    f: (x, y) => (x * x - 1) ** 2 + y * y + 0.3 * x,
    grad: (x, y) => [4 * x * (x * x - 1) + 0.3, 2 * y], box: [-2, 2, -1.5, 1.5], start: [0.2, 1.2],
  },
};

export const numGrad = (f, x, y, h = 1e-5) => [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];

/**
 * Descida do gradiente: x ← x − η ∇f(x). Com momento β > 0, acumula uma
 * "velocidade" v ← βv − η∇f e anda x ← x + v (atravessa vales estreitos mais rápido).
 * Para quando o passo fica minúsculo ou diverge.
 */
export function gradientDescent(L, start, eta, steps = 200, beta = 0) {
  const path = [start];
  let [x, y] = start;
  let vx = 0, vy = 0;
  for (let k = 0; k < steps; k++) {
    const [gx, gy] = L.grad(x, y);
    vx = beta * vx - eta * gx; vy = beta * vy - eta * gy;
    const nx = x + vx, ny = y + vy;
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || Math.abs(nx) > 1e6) { path.push([nx, ny]); break; }
    x = nx; y = ny;
    path.push([x, y]);
    if (Math.hypot(vx, vy) < 1e-7) break;
  }
  return path;
}

/**
 * Curvas de nível por marching squares: segmentos onde f = nível,
 * numa grade n × n sobre o retângulo box = [x0, x1, y0, y1].
 */
export function contours(f, box, levels, n = 80) {
  const [x0, x1, y0, y1] = box;
  const dx = (x1 - x0) / n, dy = (y1 - y0) / n;
  const V = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => f(x0 + i * dx, y0 + j * dy)));
  const out = levels.map(() => []);
  const lerp = (a, b, va, vb, c) => a + ((c - va) / (vb - va)) * (b - a);
  levels.forEach((c, li) => {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const xa = x0 + i * dx, xb = xa + dx, ya = y0 + j * dy, yb = ya + dy;
      const v = [V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]];   // cantos: (a,a) (b,a) (b,b) (a,b)
      const pts = [];
      const edge = (p, q, P, Q) => { if ((v[p] - c) * (v[q] - c) < 0) pts.push([lerp(P[0], Q[0], v[p], v[q], c), lerp(P[1], Q[1], v[p], v[q], c)]); };
      const C = [[xa, ya], [xb, ya], [xb, yb], [xa, yb]];
      edge(0, 1, C[0], C[1]); edge(1, 2, C[1], C[2]); edge(2, 3, C[2], C[3]); edge(3, 0, C[3], C[0]);
      if (pts.length === 2) out[li].push(pts);
      if (pts.length === 4) { out[li].push([pts[0], pts[1]]); out[li].push([pts[2], pts[3]]); }
    }
  });
  return out;
}
