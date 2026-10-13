// Desenho de diagramas de estados sobre uma Scene: estados (círculo duplo nos
// finais), seta de início, transições agrupadas por par de estados, laços e
// curvas para transições nos dois sentidos.

import { COLORS } from '../../../engine/scene.js';

/** Arestas [de, para, rótulo] a partir do δ de um autômato finito. */
export function faEdges(A) {
  const out = [];
  for (const q of A.states) for (const [a, ts] of Object.entries(A.delta[q] ?? {})) for (const t of ts) out.push([q, t, a]);
  return out;
}

/**
 * @param M      { states, start, accept, pos: { q: [x, y] } }
 * @param edges  [[de, para, rótulo], ...]
 * @param opts   { r, scale, dx, dy, nodeStyle(q), edgeStyle(de, para, rótulos), prefix, label(q) }
 */
export function drawAutomaton(s, M, edges, { r = 26, scale = 1, dx = 0, dy = 0, nodeStyle = () => ({}), edgeStyle = () => ({}), prefix = 'a', label = q => q, fontSize = 15 } = {}) {
  const P = q => [dx + M.pos[q][0] * scale, dy + M.pos[q][1] * scale];
  const groups = new Map();
  for (const [a, b, l] of edges) {
    const k = `${a}→${b}`;
    if (!groups.has(k)) groups.set(k, { a, b, labels: [] });
    groups.get(k).labels.push(l);
  }
  for (const { a, b, labels } of groups.values()) {
    if (!M.pos[a] || !M.pos[b]) continue;
    const st = { stroke: COLORS.faint, sw: 1.8, ...edgeStyle(a, b, labels) };
    const txt = labels.join(', ');
    const [x1, y1] = P(a), [x2, y2] = P(b);
    let d, lx, ly;
    if (a === b) {
      d = `M ${x1 - 10} ${y1 - r + 2} C ${x1 - 34} ${y1 - r - 48}, ${x1 + 34} ${y1 - r - 48}, ${x1 + 10} ${y1 - r + 2}`;
      lx = x1; ly = y1 - r - 44;
    } else if (st.curve) {
      // curva explícita (em pixels; positivo = para baixo)
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 2 * st.curve;
      const t1 = Math.hypot(mx - x1, my - y1), t2 = Math.hypot(mx - x2, my - y2);
      d = `M ${x1 + (mx - x1) / t1 * r} ${y1 + (my - y1) / t1 * r} Q ${mx} ${my} ${x2 + (mx - x2) / t2 * (r + 3)} ${y2 + (my - y2) / t2 * (r + 3)}`;
      lx = mx; ly = (y1 + y2) / 2 + st.curve + Math.sign(st.curve) * 10;
    } else {
      const both = groups.has(`${b}→${a}`);
      const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux;
      const bend = both ? 22 : 0;
      const cx = (x1 + x2) / 2 + nx * bend * 1.6, cy = (y1 + y2) / 2 + ny * bend * 1.6;
      const sx = x1 + ux * r + nx * (both ? 8 : 0), sy = y1 + uy * r + ny * (both ? 8 : 0);
      const ex = x2 - ux * (r + 3) + nx * (both ? 8 : 0), ey = y2 - uy * (r + 3) + ny * (both ? 8 : 0);
      d = both ? `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}` : `M ${sx} ${sy} L ${ex} ${ey}`;
      lx = (x1 + x2) / 2 + nx * (both ? bend + 12 : 12);
      ly = (y1 + y2) / 2 + ny * (both ? bend + 12 : 12);
    }
    s.path(`${prefix}-e-${a}-${b}`, d, { stroke: st.stroke, sw: st.sw, arrow: true, opacity: st.opacity });
    s.text(`${prefix}-l-${a}-${b}`, txt, { x: lx, y: ly, size: 13, weight: 700, mono: true, fill: st.stroke === COLORS.faint ? COLORS.muted : st.stroke, opacity: st.opacity });
  }
  for (const q of M.states) {
    if (!M.pos[q]) continue;
    const [x, y] = P(q);
    const st = { fill: COLORS.surface2, stroke: COLORS.muted, sw: 2, ...nodeStyle(q) };
    s.circle(`${prefix}-n-${q}`, { x, y, r, fill: st.fill, stroke: st.stroke, sw: st.sw, opacity: st.opacity });
    if (M.accept.includes(q)) s.circle(`${prefix}-n2-${q}`, { x, y, r: r - 5, fill: 'none', stroke: st.stroke, sw: 1.5, opacity: st.opacity });
    s.text(`${prefix}-t-${q}`, label(q), { x, y, size: fontSize, weight: 700, mono: true, fill: st.text ?? COLORS.text, opacity: st.opacity });
    if (q === M.start) s.line(`${prefix}-start`, x - r - 34, y, x - r - 3, y, { stroke: COLORS.muted, sw: 2, arrow: true });
  }
}

/** Fita de símbolos com um marcador de posição. */
export function drawTape(s, key, symbols, { x = 20, y = 20, cell = 40, head = null, done = 0, color = COLORS.yellow, from = 0, count = symbols.length } = {}) {
  for (let i = 0; i < count; i++) {
    const k = from + i;
    const c = symbols[k] ?? '';
    const cx = x + i * cell;
    s.rect(`${key}-c${k}`, { x: cx, y, w: cell - 4, h: cell - 4, rx: 5, fill: k < done ? COLORS.surface : COLORS.surface2, stroke: k === head ? color : COLORS.border, sw: k === head ? 2.5 : 1 });
    s.text(`${key}-t${k}`, c, { x: cx + (cell - 4) / 2, y: y + (cell - 4) / 2, size: 18, weight: 700, mono: true, fill: k < done ? COLORS.faint : COLORS.text });
  }
  if (head != null && head >= from && head <= from + count) s.path(`${key}-head`, `M ${x + (head - from) * cell + (cell - 4) / 2} ${y - 6} l -7 -12 l 14 0 z`, { stroke: color, fill: color, sw: 1 });
}
