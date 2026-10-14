// Layout e desenho de árvores (de derivação, sintáticas abstratas) sobre uma Scene.

import { COLORS } from '../../../engine/scene.js';

/**
 * Posiciona uma floresta: folhas em sequência, pais no meio dos filhos.
 * @param roots  ids das raízes, na ordem
 * @param kids   id → ids dos filhos
 * @param box    [x0, y0, x1, y1] em pixels
 */
export function layoutForest(roots, kids, box, { maxDx = 90, maxDy = 64 } = {}) {
  const pos = new Map();
  let leaf = 0, maxD = 0;
  const go = (id, d) => {
    maxD = Math.max(maxD, d);
    const ch = kids(id);
    if (!ch.length) pos.set(id, { x: leaf++, d });
    else {
      ch.forEach(c => go(c, d + 1));
      pos.set(id, { x: (pos.get(ch[0]).x + pos.get(ch.at(-1)).x) / 2, d });
    }
  };
  roots.forEach(r => go(r, 0));
  const [x0, y0, x1, y1] = box;
  const dx = Math.min(maxDx, (x1 - x0) / Math.max(1, leaf - 1)), dy = Math.min(maxDy, (y1 - y0) / Math.max(1, maxD));
  const left = x0 + ((x1 - x0) - dx * (leaf - 1)) / 2;
  for (const p of pos.values()) { p.px = leaf === 1 ? (x0 + x1) / 2 : left + p.x * dx; p.py = y0 + p.d * dy; }
  pos.dx = dx;
  return pos;
}

/** Desenha nós e arestas. style(id) → { fill, stroke, text, sw, sub } */
export function drawTree(s, pos, kids, label, style = () => ({}), { prefix = 't', size = 13 } = {}) {
  for (const [id, p] of pos) for (const c of kids(id)) {
    const q = pos.get(c);
    if (q) s.line(`${prefix}e${c}`, p.px, p.py + 11, q.px, q.py - 11, { stroke: COLORS.faint, sw: 1.5 });
  }
  for (const [id, p] of pos) {
    const st = style(id);
    const txt = label(id);
    const w = Math.max(26, txt.length * size * 0.62 + 12);
    s.rect(`${prefix}n${id}`, { x: p.px - w / 2, y: p.py - 11, w, h: 22, rx: 6, fill: st.fill ?? COLORS.surface2, stroke: st.stroke ?? COLORS.border, sw: st.sw ?? 1.2 });
    s.text(`${prefix}t${id}`, txt, { x: p.px, y: p.py, size, mono: true, weight: 700, fill: st.text ?? COLORS.text });
    if (st.sub != null) s.text(`${prefix}s${id}`, st.sub, { x: p.px, y: p.py + 22, size: 11, mono: true, fill: st.subColor ?? COLORS.muted });
  }
}
