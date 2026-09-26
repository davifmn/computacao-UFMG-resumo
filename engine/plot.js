// Plano cartesiano sobre uma Scene: eixos, grade e gráficos de funções.
//
//   const plot = new Plot(scene, { x: [-5, 5], y: [-3, 3], box: [40, 20, 860, 500] });
//   scene.frame(s => { plot.axes(s); plot.fn(s, 'f', Math.sin, { stroke: COLORS.blue }); });

import { COLORS } from './scene.js';

export class Plot {
  /**
   * @param scene  Scene onde desenhar
   * @param opts   { x: [xmin, xmax], y: [ymin, ymax], box: [left, top, right, bottom] em pixels }
   */
  constructor(scene, { x = [-5, 5], y = [-3, 3], box } = {}) {
    this.scene = scene;
    this.box = box ?? [40, 20, scene.width - 20, scene.height - 30];
    this.setView(x, y);
  }

  setView(x, y) {
    this.xr = x;
    this.yr = y;
    const [l, t, r, b] = this.box;
    this.sx = (r - l) / (x[1] - x[0]);
    this.sy = (b - t) / (y[1] - y[0]);
  }

  X(x) { return this.box[0] + (x - this.xr[0]) * this.sx; }
  Y(y) { return this.box[3] - (y - this.yr[0]) * this.sy; }
  P([x, y]) { return [this.X(x), this.Y(y)]; }
  invX(px) { return this.xr[0] + (px - this.box[0]) / this.sx; }
  invY(py) { return this.yr[0] + (this.box[3] - py) / this.sy; }

  /** Espaçamento "bonito" (1, 2 ou 5 × 10^k) para ~n marcas. */
  static niceStep(range, n = 10) {
    const raw = range / n;
    const p = 10 ** Math.floor(Math.log10(raw));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }

  axes(s, { grid = true, labels = true, xLabel = 'x', yLabel = 'y', piTicks = false } = {}) {
    const [l, t, r, b] = this.box;
    const sx = piTicks ? Math.PI / 2 : Plot.niceStep(this.xr[1] - this.xr[0], 12);
    const sy = Plot.niceStep(this.yr[1] - this.yr[0], 8);
    const fmtTick = v => {
      if (piTicks) {
        const k = Math.round(v / (Math.PI / 2));
        if (k === 0) return '0';
        const num = k % 2 === 0 ? `${k / 2 === 1 ? '' : k / 2 === -1 ? '−' : k / 2}π` : `${k === 1 ? '' : k === -1 ? '−' : k}π/2`;
        return num.replace('-', '−');
      }
      return String(+v.toFixed(6)).replace('-', '−').replace('.', ',');
    };
    const x0 = Math.min(Math.max(0, this.xr[0]), this.xr[1]);
    const y0 = Math.min(Math.max(0, this.yr[0]), this.yr[1]);
    for (let v = Math.ceil(this.xr[0] / sx) * sx; v <= this.xr[1] + 1e-9; v += sx) {
      const k = Math.round(v / sx);
      if (grid) s.line(`gx${k}`, this.X(v), t, this.X(v), b, { stroke: COLORS.border, sw: 1, layer: 'bg', opacity: 0.6 });
      if (labels && Math.abs(v) > 1e-9) s.text(`lx${k}`, fmtTick(v), { x: this.X(v), y: Math.min(b - 4, this.Y(y0) + 16), size: 11, fill: COLORS.faint, mono: true, layer: 'bg' });
    }
    for (let v = Math.ceil(this.yr[0] / sy) * sy; v <= this.yr[1] + 1e-9; v += sy) {
      const k = Math.round(v / sy);
      if (grid) s.line(`gy${k}`, l, this.Y(v), r, this.Y(v), { stroke: COLORS.border, sw: 1, layer: 'bg', opacity: 0.6 });
      if (labels && Math.abs(v) > 1e-9) s.text(`ly${k}`, fmtTick(v), { x: Math.max(l + 14, this.X(x0) - 8), y: this.Y(v), size: 11, anchor: 'end', fill: COLORS.faint, mono: true, layer: 'bg' });
    }
    s.line('axis-x', l, this.Y(y0), r, this.Y(y0), { stroke: COLORS.muted, sw: 1.5, layer: 'bg' });
    s.line('axis-y', this.X(x0), t, this.X(x0), b, { stroke: COLORS.muted, sw: 1.5, layer: 'bg' });
    if (xLabel) s.text('axis-xl', xLabel, { x: r - 6, y: this.Y(y0) - 12, size: 14, anchor: 'end', fill: COLORS.muted, weight: 600, layer: 'bg' });
    if (yLabel) s.text('axis-yl', yLabel, { x: this.X(x0) + 10, y: t + 10, size: 14, anchor: 'start', fill: COLORS.muted, weight: 600, layer: 'bg' });
  }

  /**
   * Caminho SVG do gráfico de f em [a, b]. Quebra o traço em descontinuidades
   * (valores não finitos ou saltos maiores que a altura da janela).
   */
  fnPath(f, a = this.xr[0], b = this.xr[1], samples = 600) {
    const span = this.yr[1] - this.yr[0];
    let d = '';
    let prev = null;
    for (let i = 0; i <= samples; i++) {
      const x = a + ((b - a) * i) / samples;
      let y;
      try { y = f(x); } catch { y = NaN; }
      if (!Number.isFinite(y) || Math.abs(y) > 1e6) { prev = null; continue; }
      const jump = prev != null && Math.abs(y - prev) > span * 1.5;
      const yc = Math.max(this.yr[0] - span, Math.min(this.yr[1] + span, y));
      d += `${prev == null || jump ? 'M' : 'L'} ${this.X(x).toFixed(2)} ${this.Y(yc).toFixed(2)} `;
      prev = y;
    }
    return d || 'M 0 0';
  }

  fn(s, key, f, { stroke = COLORS.blue, sw = 3, a, b, dash, opacity, layer = 'edges', samples } = {}) {
    return s.path(key, this.fnPath(f, a, b, samples), { stroke, sw, dash, opacity, layer });
  }

  /** Recorta o conteúdo da camada ao retângulo do gráfico. */
  clip(layerNames = ['edges', 'nodes']) {
    const [l, t, r, b] = this.box;
    const id = `clip-${Math.random().toString(36).slice(2, 8)}`;
    const cp = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    cp.id = id;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    Object.entries({ x: l, y: t, width: r - l, height: b - t }).forEach(([k, v]) => rect.setAttribute(k, v));
    cp.appendChild(rect);
    this.scene.defs.appendChild(cp);
    for (const n of layerNames) this.scene.layers[n]?.setAttribute('clip-path', `url(#${id})`);
  }
}
