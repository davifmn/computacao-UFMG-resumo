// Desenho de grafos sobre uma Scene (compartilhado pelas páginas de Algoritmos I).
// Arestas antiparalelas viram curvas, laços viram alças e nomes longos viram "pílulas".

import { COLORS } from '../../../engine/scene.js';
import { ek } from './grafos.js';

export const NODE_R = 24;

/** Meia-largura e meia-altura do vértice u. */
function box(G, u) {
  const long = G.names.some(n => n.length > 2);
  return long ? [Math.max(30, 5 + G.names[u].length * 5), 17] : [NODE_R, NODE_R];
}

/** Ponto onde a semirreta do centro de u na direção (dx, dy) sai do vértice. */
function border(G, u, dx, dy) {
  const [hw, hh] = box(G, u);
  const L = Math.hypot(dx, dy) || 1;
  if (hw === hh) return [(dx / L) * (hw + 3), (dy / L) * (hh + 3)];
  const t = Math.min(Math.abs(dx) > 1e-9 ? hw / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-9 ? hh / Math.abs(dy) : Infinity);
  return [dx * t + (dx / L) * 3, dy * t + (dy / L) * 3];
}

/**
 * @param edgeStyle(key, [u, v, w]) → { stroke, sw, dash, opacity, label }
 * @param nodeStyle(u) → { fill, stroke, sw, text, top, bottom, topColor, bottomColor }
 */
export function drawGraph(s, G, { edgeStyle = () => ({}), nodeStyle = () => ({}), weights = true } = {}) {
  const has = new Set(G.edges.map(([u, v]) => `${u}-${v}`));
  for (const e of G.edges) {
    const [u, v, w] = e;
    const key = ek(G, u, v);
    const st = { stroke: COLORS.faint, sw: 2, ...edgeStyle(key, e) };
    const [x1, y1] = G.pos[u], [x2, y2] = G.pos[v];
    let d, lx, ly;
    if (u === v) {
      const [, hh] = box(G, u);
      d = `M ${x1 - 10} ${y1 - hh} C ${x1 - 40} ${y1 - hh - 55}, ${x1 + 40} ${y1 - hh - 55}, ${x1 + 10} ${y1 - hh - 2}`;
      lx = x1; ly = y1 - hh - 50;
    } else {
      const curved = G.directed && has.has(`${v}-${u}`);
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      const nx = -dy / L, ny = dx / L, bend = curved ? 26 : 0;
      const cx = (x1 + x2) / 2 + nx * bend, cy = (y1 + y2) / 2 + ny * bend;
      const [ax, ay] = border(G, u, cx - x1, cy - y1);
      const [bx, by] = border(G, v, cx - x2, cy - y2);
      d = curved ? `M ${x1 + ax} ${y1 + ay} Q ${cx} ${cy} ${x2 + bx} ${y2 + by}` : `M ${x1 + ax} ${y1 + ay} L ${x2 + bx} ${y2 + by}`;
      lx = (x1 + x2) / 2 + nx * (bend ? bend * 0.6 + 12 : 13);
      ly = (y1 + y2) / 2 + ny * (bend ? bend * 0.6 + 12 : 13);
    }
    s.path(`e${u}-${v}`, d, { stroke: st.stroke, sw: st.sw, dash: st.dash, opacity: st.opacity, arrow: G.directed });
    if (weights && w != null) s.text(`w${u}-${v}`, st.label ?? w, { x: lx, y: ly, size: 14, weight: 700, mono: true, fill: st.stroke === COLORS.faint ? COLORS.muted : st.stroke });
  }
  G.names.forEach((name, u) => {
    const [x, y] = G.pos[u];
    const [hw, hh] = box(G, u);
    const st = { fill: COLORS.surface2, stroke: COLORS.muted, sw: 2, ...nodeStyle(u) };
    if (hw === hh) s.circle(`n${u}`, { x, y, r: NODE_R, fill: st.fill, stroke: st.stroke, sw: st.sw });
    else s.rect(`n${u}`, { x: x - hw, y: y - hh, w: 2 * hw, h: 2 * hh, rx: hh, fill: st.fill, stroke: st.stroke, sw: st.sw });
    s.text(`nt${u}`, st.text ?? name, { x, y, size: hw === hh ? 18 : 13, weight: 700, fill: st.textColor ?? COLORS.text });
    if (st.top != null) s.text(`ntop${u}`, st.top, { x: x + hw * 0.55, y: y - hh - 10, anchor: 'start', size: 13, weight: 700, mono: true, fill: st.topColor ?? COLORS.yellow });
    if (st.bottom != null) s.text(`nbot${u}`, st.bottom, { x, y: y + hh + 13, size: 12, weight: 600, mono: true, fill: st.bottomColor ?? COLORS.muted });
  });
}

/** Fila/pilha desenhada como uma sequência de caixinhas. */
export function drawList(s, key, title, items, { x, y, w = 240, cell = 44, vertical = false, color = COLORS.blue, empty = 'vazia' } = {}) {
  s.text(`${key}-title`, title, { x, y, size: 13, anchor: 'start', weight: 700, fill: COLORS.muted });
  if (!items.length) s.text(`${key}-empty`, empty, { x, y: y + 30, size: 13, anchor: 'start', fill: COLORS.faint });
  items.forEach((it, i) => {
    const label = typeof it === 'object' ? it.label : it;
    const id = typeof it === 'object' ? it.id : `${label}-${i}`;
    const bx = vertical ? x : x + (i % Math.floor(w / cell)) * cell;
    const by = vertical ? y + 16 + i * 34 : y + 16 + Math.floor(i / Math.floor(w / cell)) * 40;
    const bw = vertical ? w : cell - 6;
    s.rect(`${key}-b${id}`, { x: bx, y: by, w: bw, h: 30, rx: 6, fill: '#1c3640', stroke: it.hot ? COLORS.yellow : color, sw: it.hot ? 2.5 : 1.5, opacity: it.dim ? 0.4 : 1 });
    s.text(`${key}-t${id}`, label, { x: bx + bw / 2, y: by + 15, size: 13, weight: 700, mono: true, opacity: it.dim ? 0.5 : 1 });
  });
}
