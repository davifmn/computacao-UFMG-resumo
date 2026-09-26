// Player passo a passo: cena animada + código com a linha atual + variáveis +
// narração. Um algoritmo é descrito como uma lista de "passos" (fotografias do
// estado) e o player permite ir para frente, voltar, pular e reproduzir.
//
// Formato de um passo:
//   {
//     line: 3 | [3, 4],        // linha(s) do código em execução (1-based)
//     msg: 'texto <b>html</b>', // explicação do que acontece
//     vars: { i: 0, n: 5 },     // painel de variáveis (opcional)
//     ...qualquer estado que o `render` precise
//   }

import { Scene } from './scene.js';
import { highlightLine, escapeHtml } from './highlight.js';

const ICONS = {
  first: '<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M18 5v14L7 12z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M6 5v14l11-7z"/></svg>',
  last: '<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
};

const BASE_DELAY = 1100; // ms por passo em velocidade 1x

export class StepPlayer {
  /**
   * @param root   elemento onde o player será montado
   * @param opts   { code, lang, width, height, render(step, scene, player), codeTitle, showVars }
   */
  constructor(root, opts) {
    this.opts = { lang: 'cpp', width: 900, height: 520, codeTitle: 'Código', showVars: true, ...opts };
    this.steps = [];
    this.index = 0;
    this.speed = 1;
    this.timer = null;
    this.#build(root);
    this.scene = new Scene(this.svg, { width: this.opts.width, height: this.opts.height, layers: this.opts.layers });
    this.setSpeed(1);
    if (this.opts.code) this.setCode(this.opts.code, this.opts.lang);
    StepPlayer.active = this;
    root.addEventListener('pointerdown', () => { StepPlayer.active = this; });
  }

  #build(root) {
    root.classList.add('player');
    root.innerHTML = `
      <div class="player-main">
        <div class="stage"><svg aria-label="Animação"></svg></div>
        <div class="controls">
          <button class="icon-btn" data-act="first" title="Início (Home)" aria-label="Início">${ICONS.first}</button>
          <button class="icon-btn" data-act="prev" title="Passo anterior (←)" aria-label="Passo anterior">${ICONS.prev}</button>
          <button class="icon-btn play" data-act="play" title="Reproduzir/pausar (espaço)" aria-label="Reproduzir">${ICONS.play}</button>
          <button class="icon-btn" data-act="next" title="Próximo passo (→)" aria-label="Próximo passo">${ICONS.next}</button>
          <button class="icon-btn" data-act="last" title="Fim (End)" aria-label="Fim">${ICONS.last}</button>
          <input class="scrub" type="range" min="0" max="0" value="0" aria-label="Linha do tempo">
          <span class="counter">0 / 0</span>
          <select class="speed" aria-label="Velocidade">
            <option value="0.5">0.5×</option><option value="1" selected>1×</option>
            <option value="2">2×</option><option value="4">4×</option><option value="10">10×</option>
          </select>
        </div>
      </div>
      <aside class="player-side">
        <div class="panel code-panel">
          <div class="panel-title">${escapeHtml(this.opts.codeTitle)}</div>
          <pre class="code"></pre>
        </div>
        <div class="panel narration">
          <div class="panel-title">O que está acontecendo <span class="step-no"></span></div>
          <div class="msg"></div>
        </div>
        <div class="panel vars-panel" ${this.opts.showVars ? '' : 'hidden'}>
          <div class="panel-title">Variáveis</div>
          <table class="vars"></table>
        </div>
      </aside>`;
    this.root = root;
    this.svg = root.querySelector('svg');
    this.codeEl = root.querySelector('.code');
    this.msgEl = root.querySelector('.msg');
    this.stepNoEl = root.querySelector('.step-no');
    this.varsEl = root.querySelector('.vars');
    this.scrub = root.querySelector('.scrub');
    this.counter = root.querySelector('.counter');
    this.playBtn = root.querySelector('[data-act=play]');

    root.querySelector('.controls').addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'play') this.toggle();
      else { this.pause(); this[act](); }
    });
    this.scrub.addEventListener('input', () => { this.pause(); this.go(+this.scrub.value); });
    root.querySelector('.speed').addEventListener('change', e => this.setSpeed(+e.target.value));
  }

  setCode(code, lang = this.opts.lang) {
    this.opts.lang = lang;
    this.codeEl.innerHTML = code.replace(/\s+$/, '').split('\n')
      .map(l => `<span class="ln">${highlightLine(l, lang) || ' '}</span>`).join('');
    this.lineEls = [...this.codeEl.children];
  }

  /** Carrega uma nova lista de passos e mostra o primeiro. */
  load(steps) {
    this.pause();
    this.steps = steps;
    this.scrub.max = Math.max(0, steps.length - 1);
    this.scene.clear();
    this.go(0);
  }

  go(i) {
    if (!this.steps.length) return;
    this.index = Math.max(0, Math.min(this.steps.length - 1, i));
    const step = this.steps[this.index];
    const prev = this.steps[this.index - 1];
    this.scene.frame(scene => this.opts.render(step, scene, this));

    // Código
    const lines = step.line == null ? [] : [].concat(step.line);
    this.lineEls?.forEach((el, k) => el.classList.toggle('active', lines.includes(k + 1)));
    const first = this.lineEls?.[lines[0] - 1];
    if (first) {
      const box = this.codeEl;
      const top = first.offsetTop - box.clientHeight / 2 + first.clientHeight / 2;
      box.scrollTo({ top, behavior: 'smooth' });
    }

    // Narração e variáveis
    this.msgEl.innerHTML = step.msg ?? '';
    this.stepNoEl.textContent = `· passo ${this.index + 1}/${this.steps.length}`;
    this.#renderVars(step.vars, prev?.vars);

    this.scrub.value = this.index;
    this.counter.textContent = `${this.index + 1} / ${this.steps.length}`;
    this.opts.onStep?.(step, this.index, this);
  }

  #renderVars(vars, prevVars) {
    if (!vars || !Object.keys(vars).length) {
      this.varsEl.innerHTML = '<tr><td class="empty" colspan="2">—</td></tr>';
      return;
    }
    this.varsEl.innerHTML = Object.entries(vars).map(([k, v]) => {
      const changed = prevVars && prevVars[k] !== v ? ' class="changed"' : '';
      return `<tr><td>${escapeHtml(k)}</td><td${changed}>${escapeHtml(v)}</td></tr>`;
    }).join('');
  }

  next() { this.go(this.index + 1); }
  prev() { this.go(this.index - 1); }
  first() { this.go(0); }
  last() { this.go(this.steps.length - 1); }

  play() {
    if (this.index >= this.steps.length - 1) this.go(0);
    this.playing = true;
    this.playBtn.innerHTML = ICONS.pause;
    this.playBtn.setAttribute('aria-label', 'Pausar');
    const tick = () => {
      if (!this.playing) return;
      if (this.index >= this.steps.length - 1) return this.pause();
      this.next();
      this.timer = setTimeout(tick, BASE_DELAY / this.speed);
    };
    this.timer = setTimeout(tick, BASE_DELAY / this.speed / 2);
  }

  pause() {
    this.playing = false;
    clearTimeout(this.timer);
    this.playBtn.innerHTML = ICONS.play;
    this.playBtn.setAttribute('aria-label', 'Reproduzir');
  }

  toggle() { this.playing ? this.pause() : this.play(); }

  setSpeed(s) {
    this.speed = s;
    const dur = Math.round(Math.min(450, (BASE_DELAY / s) * 0.7));
    this.svg.style.setProperty('--dur', `${dur}ms`);
  }
}

// Atalhos de teclado para o player com que o usuário interagiu por último.
document.addEventListener('keydown', e => {
  const p = StepPlayer.active;
  if (!p || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
  if (e.key === ' ' && e.target.closest?.('button')) return; // o próprio botão já trata o espaço
  const actions = { ' ': 'toggle', ArrowRight: 'next', ArrowLeft: 'prev', Home: 'first', End: 'last' };
  const act = actions[e.key];
  if (!act) return;
  e.preventDefault();
  if (act !== 'toggle') p.pause();
  p[act]();
});
