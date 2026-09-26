// Utilitários comuns às páginas: fórmulas (KaTeX), construção de DOM, números,
// blocos de código realçados e sumário lateral (páginas-tutorial).

import { highlightLine } from './highlight.js';

/** Renderiza $...$ e $$...$$ com KaTeX (se o script estiver carregado). */
export function renderMath(el = document.body) {
  const run = () => window.renderMathInElement?.(el, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false,
  });
  if (window.renderMathInElement) run();
  else window.addEventListener('load', run, { once: true });
}

/** Renderiza uma única expressão TeX dentro de `el`. */
export function tex(el, src, displayMode = false) {
  if (window.katex) window.katex.render(src, el, { throwOnError: false, displayMode });
  else el.textContent = src;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** h('div', { class: 'x', onclick: fn }, 'texto', filho) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null) el.append(c);
  return el;
}

/** Formata número com vírgula decimal (padrão brasileiro). */
export function fmt(x, digits = 2) {
  if (!Number.isFinite(x)) return String(x);
  const r = Math.round(x * 10 ** digits) / 10 ** digits;
  return (Object.is(r, -0) ? 0 : r).toLocaleString('pt-BR', { maximumFractionDigits: digits });
}

export const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Realça todos os <pre><code data-lang="cpp|python|bash|make"> da página e
 * adiciona um botão "copiar". O conteúdo do <code> deve estar com HTML escapado,
 * ou vir de um arquivo: <pre data-src="../codigo/x.cpp"><code data-lang="cpp"></code></pre>.
 */
export async function highlightBlocks(root = document) {
  for (const code of root.querySelectorAll('pre > code[data-lang]')) {
    if (code.dataset.done) continue;
    code.dataset.done = '1';
    const lang = code.dataset.lang;
    const pre0 = code.parentElement;
    // <pre data-src="arquivo"> carrega o arquivo real, mantendo o tutorial sincronizado com o código.
    if (pre0.dataset.src) {
      try {
        const res = await fetch(pre0.dataset.src);
        if (!res.ok) throw new Error(res.status);
        code.textContent = await res.text();
        if (!pre0.dataset.file) pre0.dataset.file = pre0.dataset.src.replace(/^(\.\.\/)+/, '');
      } catch {
        code.textContent = `// não foi possível carregar ${pre0.dataset.src}`;
      }
    }
    const text = code.textContent.replace(/^\n/, '').replace(/\s+$/, '');
    code.innerHTML = text.split('\n').map(l => highlightLine(l, lang) || ' ').join('\n');
    const pre = code.parentElement;
    pre.classList.add('codeblock');
    if (pre.dataset.file) pre.insertAdjacentHTML('afterbegin', `<div class="cb-file">${pre.dataset.file}</div>`);
    const btn = h('button', { class: 'cb-copy', type: 'button' }, 'copiar');
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); btn.textContent = 'copiado ✓'; }
      catch { btn.textContent = 'erro'; }
      setTimeout(() => { btn.textContent = 'copiar'; }, 1500);
    });
    pre.append(btn);
  }
}

/** Monta um sumário com os <h2> de `content` dentro de `nav`, destacando a seção visível. */
export function buildToc(nav, content = document) {
  const heads = [...content.querySelectorAll('h2')];
  heads.forEach((hd, i) => { if (!hd.id) hd.id = `secao-${i + 1}`; });
  nav.replaceChildren(h('div', { class: 'toc-title' }, 'Nesta página'),
    ...heads.map(hd => h('a', { href: `#${hd.id}` }, hd.textContent)));
  const links = [...nav.querySelectorAll('a')];
  const obs = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    }
  }, { rootMargin: '-20% 0px -70% 0px' });
  heads.forEach(hd => obs.observe(hd));
}

renderMath();
highlightBlocks();
