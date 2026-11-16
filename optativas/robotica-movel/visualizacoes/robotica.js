// Mapeamento com grade de ocupação (occupancy grid) e modelo inverso do sensor laser.
// Mesma lógica do TP3 (optativas/robotica-movel/trabalhos/tp3-mapa-de-ocupacao):
// log-odds por célula, l_occ = ln(0,85/0,15), l_free = −l_occ, saturação em ±5 e
// Bresenham para as células atravessadas pelo feixe. Funções puras, testadas em
// tests/robotica-movel.test.js.

import { lineFinder } from '../../../engine/highlight.js';
import { normal } from '../../../engine/random.js';

export const L_OCC = Math.log(0.85 / 0.15);
export const L_FREE = Math.log(0.15 / 0.85);
export const L_MAX = 5, L_MIN = -5;

export const CODE = `def update(self, robot_pose, laser_readings):
    rx, ry, r_theta = robot_pose
    robot_i, robot_j = self.to_grid_coords(rx, ry)
    for point_x, point_y in laser_readings:
        end_i, end_j = self.to_grid_coords(point_x, point_y)
        # célula onde o feixe bateu: mais provável estar ocupada
        self.grid[end_i, end_j] = min(self.l_max, self.grid[end_i, end_j] + self.l_occ)
        # células atravessadas pelo feixe: mais provável estarem livres
        self.bresenham_line(robot_i, robot_j, end_i, end_j)

def bresenham_line(self, x0, y0, x1, y1):
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        if x0 == x1 and y0 == y1:
            break                      # não "limpa" a célula do obstáculo
        self.grid[x0, y0] = max(self.l_min, self.grid[x0, y0] + self.l_free)
        e2 = 2 * err
        if e2 >= dy: err += dy; x0 += sx
        if e2 <= dx: err += dx; y0 += sy

def get_probability_map(self):
    return 1 - 1 / (1 + np.exp(self.grid))`;

/** Sala de 12 m × 8 m com paredes internas e obstáculos (segmentos [x1, y1, x2, y2]). */
export const MUNDO = (() => {
  const W = 12, H = 8, segs = [];
  const caixa = (x, y, w, h) => segs.push([x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]);
  caixa(0, 0, W, H);                       // paredes externas
  segs.push([4, 0, 4, 3], [4, 5, 4, 8]);   // parede com porta (y de 3 a 5)
  segs.push([8, 8, 8, 5.2]);               // meia parede
  caixa(1.2, 5.6, 1.4, 1.2);               // mesa
  caixa(9.2, 1.0, 1.6, 0.9);               // armário
  const cx = 6.6, cy = 4, rp = 0.45;       // pilar (octógono)
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4, b = ((k + 1) * Math.PI) / 4;
    segs.push([cx + rp * Math.cos(a), cy + rp * Math.sin(a), cx + rp * Math.cos(b), cy + rp * Math.sin(b)]);
  }
  return { W, H, segs };
})();

/** Distância até a primeira parede ao longo do raio (ou null se passar de `max`). */
export function raycast(x, y, ang, segs, max) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let best = Infinity;
  for (const [x1, y1, x2, y2] of segs) {
    const ex = x2 - x1, ey = y2 - y1;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) continue;            // paralelos
    const t = ((x1 - x) * ey - (y1 - y) * ex) / den;  // distância ao longo do raio
    const u = ((x1 - x) * dy - (y1 - y) * dx) / den;  // posição no segmento [0, 1]
    if (t > 1e-9 && u >= 0 && u <= 1 && t < best) best = t;
  }
  return best <= max ? best : null;
}

/** Bresenham: células de (x0, y0) até (x1, y1). Com incluiFim = false, para antes do fim. */
export function bresenham(x0, y0, x1, y1, incluiFim = false) {
  const out = [];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    if (x0 === x1 && y0 === y1) { if (incluiFim) out.push([x0, y0]); break; }
    out.push([x0, y0]);
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return out;
}

export function novaGrade(mundo, res) {
  const nx = Math.ceil(mundo.W / res), ny = Math.ceil(mundo.H / res);
  return { nx, ny, res, l: new Float64Array(nx * ny) };
}

export const celula = (g, x, y) => [Math.floor(x / g.res), Math.floor(y / g.res)];
export const dentro = (g, i, j) => i >= 0 && j >= 0 && i < g.nx && j < g.ny;
export const prob = l => 1 - 1 / (1 + Math.exp(l));

/**
 * Atualiza a grade com uma varredura. `leituras`: [{ ang, d }] com d = null quando o
 * feixe não bate em nada até o alcance máximo (aí só marca células livres).
 * `corrigido = false` reproduz a versão original do TP (a célula final também era limpa).
 */
export function atualiza(g, pose, leituras, { alcance, corrigido = true }) {
  const [ri, rj] = celula(g, pose.x, pose.y);
  for (const { ang, d } of leituras) {
    const dist = d ?? alcance;
    const a = pose.th + ang;
    const [ei, ej] = celula(g, pose.x + dist * Math.cos(a), pose.y + dist * Math.sin(a));
    if (d != null && dentro(g, ei, ej)) g.l[ej * g.nx + ei] = Math.min(L_MAX, g.l[ej * g.nx + ei] + L_OCC);
    for (const [i, j] of bresenham(ri, rj, ei, ej, !corrigido || d == null)) {
      if (dentro(g, i, j)) g.l[j * g.nx + i] = Math.max(L_MIN, g.l[j * g.nx + i] + L_FREE);
    }
  }
}

/** Percurso fechado pela sala: poses { x, y, th } igualmente espaçadas. */
export function trajetoria(n) {
  const pts = [[1.6, 1.4], [3.2, 2.2], [3.4, 4.0], [5.4, 4.2], [5.6, 6.6], [7.2, 6.8], [7.4, 2.6], [10.4, 3.2], [10.6, 6.4], [9.0, 4.4], [6.2, 2.4], [3.0, 4.2], [2.2, 4.6], [1.2, 3.0]];
  const segs = pts.map((p, k) => [p, pts[(k + 1) % pts.length]]);
  const len = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = len.reduce((a, b) => a + b, 0);
  const poses = [];
  for (let k = 0; k < n; k++) {
    let s = (k / n) * total, q = 0;
    while (s > len[q]) s -= len[q++];
    const [[x1, y1], [x2, y2]] = segs[q];
    const t = s / len[q];
    poses.push({ x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1), th: Math.atan2(y2 - y1, x2 - x1) });
  }
  return poses;
}

/** Leituras de um laser com `feixes` raios espalhados em `fov` radianos (ruído gaussiano opcional). */
export function varrer(pose, { feixes, fov, alcance, ruido = 0, r }) {
  const out = [];
  for (let k = 0; k < feixes; k++) {
    const ang = -fov / 2 + (fov * k) / (feixes - 1);
    let d = raycast(pose.x, pose.y, pose.th + ang, MUNDO.segs, alcance);
    if (d != null && ruido > 0) d = Math.max(0.05, d + normal(r) * ruido);
    out.push({ ang: ruido > 0 ? ang + normal(r) * (ruido / 10) : ang, d });
  }
  return out;
}

/** Células que contêm parede de verdade (para medir a qualidade do mapa). */
export function celulasDeParede(g) {
  const occ = new Set();
  for (const [x1, y1, x2, y2] of MUNDO.segs) {
    const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / (g.res / 4));
    for (let k = 0; k <= n; k++) {
      const [i, j] = celula(g, x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n);
      if (dentro(g, i, j)) occ.add(j * g.nx + i);
    }
  }
  return occ;
}

/** Quantas células foram classificadas como ocupadas (p > 0,65) e livres (p < 0,35). */
export function resumo(g) {
  let ocup = 0, livre = 0;
  for (const l of g.l) { const p = prob(l); if (p > 0.65) ocup++; else if (p < 0.35) livre++; }
  return { ocup, livre, desconhecido: g.l.length - ocup - livre };
}

/** Passos do player: a cada pose, o robô lê o laser e a grade é atualizada. */
export function passosMapeamento({ res = 0.3, nPoses = 40, feixes = 25, fov = (3 * Math.PI) / 2, alcance = 5, ruido = 0, corrigido = true, r }) {
  const Lf = lineFinder(CODE);
  const g = novaGrade(MUNDO, res);
  const paredes = celulasDeParede(g);
  const passos = [];
  const acerto = () => {
    let vistas = 0;
    for (const c of paredes) if (prob(g.l[c]) > 0.65) vistas++;
    return vistas / paredes.size;
  };
  const snap = (line, msg, extra) => {
    const rs = resumo(g);
    passos.push({ line, msg, l: Float64Array.from(g.l), nx: g.nx, ny: g.ny, res, ...extra,
      vars: { pose: extra.pose ? `(${extra.pose.x.toFixed(1)}, ${extra.pose.y.toFixed(1)}, ${((extra.pose.th * 180) / Math.PI).toFixed(0)}°)` : '—', ocupadas: rs.ocup, livres: rs.livre, 'paredes achadas': `${(100 * acerto()).toFixed(0)}%` } });
  };
  snap(Lf('def update'), `Grade de ${g.nx}×${g.ny} células de ${res} m. Toda célula começa com log-odds 0, ou seja, probabilidade 0,5: <b>desconhecida</b>.`, {});
  const poses = trajetoria(nPoses);
  poses.forEach((pose, k) => {
    const leituras = varrer(pose, { feixes, fov, alcance, ruido, r });
    const batidas = leituras.filter(x => x.d != null).length;
    if (k < 3 || k % 4 === 0) {
      snap(Lf('for point_x, point_y in laser_readings'), `Pose ${k + 1}/${nPoses}: o laser dispara ${feixes} feixes; ${batidas} batem em algo antes de ${alcance} m. Cada ponto é levado do referencial do robô para o do mundo: $(x, y) + R(\\theta)\\,(d\\cos\\alpha,\\ d\\sin\\alpha)$.`, { pose, leituras });
    }
    atualiza(g, pose, leituras, { alcance, corrigido });
    const msgFim = corrigido
      ? `Atualização: cada célula atravessada soma $l_{free} = ${L_FREE.toFixed(2)}$ e cada célula atingida soma $l_{occ} = +${L_OCC.toFixed(2)}$. Somar log-odds é aplicar Bayes supondo células independentes.`
      : `<b>Versão original do TP:</b> a célula atingida soma $l_{occ}$ e logo depois o Bresenham a "limpa" com $l_{free} = -l_{occ}$. O saldo é zero, e as paredes nunca ficam escuras.`;
    snap(corrigido ? Lf('self.grid[x0, y0] = max') : Lf('self.bresenham_line(robot_i'), `Pose ${k + 1}/${nPoses}. ${msgFim}`, { pose, leituras });
  });
  const rs = resumo(g);
  snap(Lf('def get_probability_map'), `Fim do percurso: ${rs.ocup} células ocupadas, ${rs.livre} livres e ${rs.desconhecido} nunca observadas (atrás de obstáculos ou fora do alcance). Probabilidade de cada célula: $p = 1 - 1/(1 + e^{l})$.`, { fim: true, pose: poses.at(-1) });
  return passos;
}
