// Tutorial de SQL: carrega o SQLite (sql.js, WebAssembly) e transforma cada
// <div class="sqlbox" data-sql="..."> num editor executável. Os exercícios vêm
// de exercicios-sql.json e são corrigidos comparando os resultados.

import { $, $$, h, buildToc } from '../../../engine/page.js';
import { escapeHtml } from '../../../engine/highlight.js';

buildToc($('#toc'), $('#content'));

const SQLJS = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/';
let SQL = null, seed = '';

/** Banco novo a cada execução: um exemplo nunca afeta o outro. */
function freshDb() {
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  db.exec(seed);
  return db;
}

function runAll(db, sql) {
  const t0 = performance.now();
  const results = db.exec(sql);   // executa todas as instruções; devolve o resultado de cada SELECT
  return { results, ms: performance.now() - t0, changes: db.getRowsModified() };
}

function renderResults({ results, ms, changes }) {
  if (!results.length) return `<div class="meta">Executado em ${ms.toFixed(1)} ms · ${changes} linha(s) modificada(s) pela última instrução.</div>`;
  return results.map(r => `
    <div class="table-wrap" style="margin-bottom:8px"><table class="data">
      <tr>${r.columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr>
      ${r.values.slice(0, 200).map(row => `<tr>${row.map(v => `<td${v === null ? ' class="c-faint"' : ''}>${v === null ? 'NULL' : escapeHtml(v)}</td>`).join('')}</tr>`).join('')}
    </table></div>
    <div class="meta">${r.values.length} linha(s)${r.values.length > 200 ? ' (mostrando 200)' : ''} · ${ms.toFixed(1)} ms</div>`).join('');
}

function makeBox(box, initial, { onRun } = {}) {
  const ta = h('textarea', { spellcheck: 'false', rows: Math.max(2, initial.split('\n').length) });
  ta.value = initial;
  const out = h('div', { class: 'out' });
  const run = () => {
    try {
      const db = freshDb();
      const res = runAll(db, ta.value);
      out.innerHTML = renderResults(res);
      onRun?.(res, ta.value, out);
      db.close();
    } catch (e) {
      out.innerHTML = `<div class="err">Erro: ${escapeHtml(e.message)}</div>`;
    }
  };
  ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
  const bar = h('div', { class: 'bar' },
    h('button', { class: 'btn primary small', onclick: run }, '▶ Executar'),
    h('button', { class: 'btn small', onclick: () => { ta.value = initial; out.innerHTML = ''; } }, 'Restaurar'),
    h('span', { class: 'hint' }, 'Ctrl+Enter'));
  box.replaceChildren(ta, bar, out);
  return { ta, out, run };
}

/** Compara resultados: mesmas colunas (em quantidade) e mesmas linhas (como multiconjunto, salvo se ordenado). */
export function sameResult(a, b, ordered = false) {
  if (!a || !b) return false;
  if (a.columns.length !== b.columns.length || a.values.length !== b.values.length) return false;
  const norm = v => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v);
  const key = row => JSON.stringify(row.map(norm));
  const ka = a.values.map(key), kb = b.values.map(key);
  if (!ordered) { ka.sort(); kb.sort(); }
  return ka.every((k, i) => k === kb[i]);
}

async function mountExercises() {
  const list = await (await fetch('exercicios-sql.json')).json();
  const root = $('#exercises');
  let right = 0;
  const score = h('div', { class: 'score', style: 'margin-bottom:8px' }, `0 / ${list.length} resolvidos`);
  root.append(score);
  const solved = new Set();
  list.forEach((ex, i) => {
    const card = h('div', { class: 'ex' });
    const box = h('div', { class: 'sqlbox', style: 'margin:8px 0 0' });
    const fb = h('div', { class: 'fb' });
    card.append(h('div', { class: 'q', html: `<b>${i + 1}.</b> ${ex.enunciado}` }), box, fb);
    root.append(card);
    const { ta, out } = makeBox(box, '-- sua consulta aqui\nSELECT ');
    const check = h('button', { class: 'btn small' }, 'Verificar');
    const show = h('button', { class: 'btn small' }, 'Ver uma resposta');
    box.querySelector('.bar').insertBefore(check, box.querySelector('.hint'));
    box.querySelector('.bar').insertBefore(show, box.querySelector('.hint'));
    check.addEventListener('click', () => {
      try {
        const db = freshDb();
        const got = db.exec(ta.value).at(-1);
        const exp = db.exec(ex.resposta).at(-1);
        db.close();
        out.innerHTML = renderResults({ results: got ? [got] : [], ms: 0, changes: 0 });
        if (sameResult(got, exp, ex.ordenado)) {
          fb.innerHTML = '<b class="c-green">Correto!</b>';
          if (!solved.has(ex.id)) { solved.add(ex.id); right++; score.textContent = `${right} / ${list.length} resolvidos`; }
        } else {
          const why = !got ? 'a consulta não devolveu nenhuma tabela.'
            : got.columns.length !== exp.columns.length ? `o esperado tem ${exp.columns.length} coluna(s) e o seu tem ${got.columns.length}.`
              : got.values.length !== exp.values.length ? `o esperado tem ${exp.values.length} linha(s) e o seu tem ${got.values.length}.`
                : 'o número de linhas bate, mas os valores não.';
          fb.innerHTML = `<b class="c-red">Ainda não:</b> ${why}`;
        }
      } catch (e) { fb.innerHTML = `<span class="err">Erro: ${escapeHtml(e.message)}</span>`; }
    });
    show.addEventListener('click', () => { fb.innerHTML = `Uma resposta possível: <code>${escapeHtml(ex.resposta)}</code>`; });
  });
}

async function init() {
  try {
    SQL = await window.initSqlJs({ locateFile: f => SQLJS + f });
    seed = await (await fetch('universidade.sql')).text();
    $$('.sqlbox[data-sql]').forEach(box => makeBox(box, box.dataset.sql));
    await mountExercises();
    $('#loading').textContent = 'Banco carregado ✓';
    $('#loading').className = 'c-green';
  } catch (e) {
    $('#loading').innerHTML = `<span class="c-red">Não foi possível carregar o SQLite (${escapeHtml(e.message)}). Você está sem internet? Os exemplos continuam legíveis.</span>`;
    $$('.sqlbox[data-sql]').forEach(box => { box.innerHTML = `<pre class="codeblock" style="margin:0"><code>${escapeHtml(box.dataset.sql)}</code></pre>`; });
  }
}
init();
