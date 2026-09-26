// Cena SVG com "reconciliação por chave".
//
// A cada quadro você descreve a cena inteira (como no React): cada forma recebe
// uma chave única. Se a chave já existia, o elemento é reaproveitado e as
// mudanças de posição/cor são animadas via CSS; se é nova, ela aparece com
// fade-in; se sumiu do quadro, some com fade-out. Assim um algoritmo só precisa
// dizer "como o estado está agora" e o movimento entre estados sai de graça.

export const NS = 'http://www.w3.org/2000/svg';

export const COLORS = {
  bg: '#0e1116',
  surface: '#161a21',
  surface2: '#1d222b',
  surface3: '#262c37',
  border: '#2a303b',
  text: '#e6e8eb',
  muted: '#9aa3b0',
  faint: '#5d6673',
  blue: '#58c4dd',
  yellow: '#f4d35e',
  green: '#83c167',
  red: '#fc6255',
  teal: '#5cd0b3',
  purple: '#b189f5',
  orange: '#ff9f43',
  pink: '#f78fb3',
};

// Atributos que vão para `style` (para poderem ser animados por CSS).
const STYLE_PROPS = new Set(['fill', 'stroke', 'opacity', 'fill-opacity', 'stroke-opacity']);

export function svgEl(tag, attrs = {}, parent) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  if (parent) parent.appendChild(el);
  return el;
}

export class Scene {
  constructor(svg, { width = 900, height = 520, layers = ['bg', 'edges', 'nodes', 'labels', 'fx'] } = {}) {
    this.svg = svg;
    this.width = width;
    this.height = height;
    svg.classList.add('scene');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'img');
    this.defs = svgEl('defs', {}, svg);
    this.layers = {};
    for (const name of layers) this.layers[name] = svgEl('g', { 'data-layer': name }, svg);
    this.nodes = new Map();
    this.touched = null;
    this.markers = new Map();
  }

  /** Desenha um quadro: `draw(scene)` descreve tudo o que deve estar visível. */
  frame(draw) {
    this.touched = new Set();
    draw(this);
    for (const [key, el] of this.nodes) {
      if (this.touched.has(key)) continue;
      this.nodes.delete(key);
      el.style.opacity = 0;
      setTimeout(() => el.remove(), this.duration() + 50);
    }
    this.touched = null;
  }

  /** Remove tudo imediatamente (sem animação). */
  clear() {
    for (const el of this.nodes.values()) el.remove();
    this.nodes.clear();
  }

  duration() {
    const v = getComputedStyle(this.svg).getPropertyValue('--dur');
    return parseFloat(v) || 450;
  }

  setAnimated(on) { this.svg.classList.toggle('no-anim', !on); }

  /**
   * Adiciona (ou atualiza) um elemento.
   * @param key   chave única e estável entre quadros
   * @param tag   'rect' | 'circle' | 'text' | 'path' | 'line' | 'g' | ...
   * @param attrs atributos SVG (fill/stroke/opacity viram style para animar)
   * @param opts  { x, y, layer, text, parent }
   */
  add(key, tag, attrs = {}, opts = {}) {
    if (this.touched) this.touched.add(key);
    let el = this.nodes.get(key);
    const isNew = !el || el.tagName !== tag;
    if (isNew) {
      el?.remove();
      el = document.createElementNS(NS, tag);
      el.classList.add('sn');
      el.style.opacity = 0;
      const parent = opts.parent ?? this.layers[opts.layer ?? 'nodes'];
      parent.appendChild(el);
      this.nodes.set(key, el);
    }
    const target = attrs.opacity ?? 1;
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'opacity') continue;
      if (k === 'class') { el.setAttribute('class', v ? `sn ${v}` : 'sn'); continue; }
      if (v == null) { el.removeAttribute(k); el.style.removeProperty(k); continue; }
      if (STYLE_PROPS.has(k)) el.style.setProperty(k, v);
      else el.setAttribute(k, v);
      if (k === 'd') el.style.setProperty('d', `path("${v}")`);
    }
    if (opts.x != null || opts.y != null) {
      el.style.transform = `translate(${opts.x ?? 0}px, ${opts.y ?? 0}px)`;
    }
    if (opts.text != null) el.textContent = opts.text;
    if (isNew) getComputedStyle(el).opacity; // força o estilo inicial (0) para o fade-in acontecer
    el.style.opacity = target;
    return el;
  }

  // ---------- Atalhos de formas ----------

  rect(key, { x = 0, y = 0, w, h, rx = 6, fill = COLORS.surface2, stroke = COLORS.border, sw = 1.5, opacity, dash, layer = 'nodes' }) {
    return this.add(key, 'rect', {
      width: w, height: h, rx, fill, stroke, 'stroke-width': sw, opacity, 'stroke-dasharray': dash,
    }, { x, y, layer });
  }

  circle(key, { x = 0, y = 0, r = 10, fill = COLORS.surface2, stroke = COLORS.border, sw = 1.5, opacity, layer = 'nodes' }) {
    return this.add(key, 'circle', { r, cx: 0, cy: 0, fill, stroke, 'stroke-width': sw, opacity }, { x, y, layer });
  }

  text(key, str, { x = 0, y = 0, size = 16, fill = COLORS.text, anchor = 'middle', weight = 500, mono = false, opacity, layer = 'labels' } = {}) {
    return this.add(key, 'text', {
      'font-size': size, 'text-anchor': anchor, 'font-weight': weight, fill, opacity,
      class: mono ? 'mono' : null,
    }, { x, y, layer, text: String(str) });
  }

  path(key, d, { stroke = COLORS.muted, sw = 2, fill = 'none', arrow = false, dash, opacity, layer = 'edges' } = {}) {
    return this.add(key, 'path', {
      d, stroke, 'stroke-width': sw, fill, opacity, 'stroke-dasharray': dash,
      'stroke-linecap': 'round', 'marker-end': arrow ? `url(#${this.marker(stroke)})` : null,
    }, { layer });
  }

  line(key, x1, y1, x2, y2, opts = {}) {
    return this.path(key, `M ${x1} ${y1} L ${x2} ${y2}`, opts);
  }

  /** Marcador de ponta de seta na cor dada (criado sob demanda). */
  marker(color) {
    if (this.markers.has(color)) return this.markers.get(color);
    const id = `arrow-${this.markers.size}-${Math.random().toString(36).slice(2, 7)}`;
    const m = svgEl('marker', {
      id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse',
    }, this.defs);
    svgEl('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: color }, m);
    this.markers.set(color, id);
    return id;
  }
}

// ---------- Interpolação (para animações contínuas, ex.: GAAL) ----------

export const ease = {
  linear: t => t,
  smooth: t => t * t * (3 - 2 * t),
  inOutCubic: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

/** Anima de 0 a 1 chamando `onUpdate(t)`. Retorna { promise, cancel }. */
export function tween(duration, onUpdate, easing = ease.inOutCubic) {
  let raf;
  let cancelled = false;
  const promise = new Promise(resolve => {
    const start = performance.now();
    const tick = now => {
      if (cancelled) return resolve(false);
      const t = Math.min(1, (now - start) / duration);
      onUpdate(easing(t));
      if (t < 1) raf = requestAnimationFrame(tick);
      else resolve(true);
    };
    raf = requestAnimationFrame(tick);
  });
  return { promise, cancel: () => { cancelled = true; cancelAnimationFrame(raf); } };
}
