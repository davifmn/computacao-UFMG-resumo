// Lógica proposicional: analisador de fórmulas, avaliação, tabela-verdade,
// formas normais canônicas e geração de exercícios. Sem dependências de DOM.

import { lineFinder } from '../../../engine/highlight.js';

export const SYMBOLS = { not: '¬', and: '∧', or: '∨', xor: '⊕', imp: '→', iff: '↔' };
export const NAMES = { not: 'negação', and: 'conjunção', or: 'disjunção', xor: 'ou exclusivo', imp: 'implicação', iff: 'bicondicional' };

// ---------- Análise léxica e sintática ----------

const TOKENS = [
  [/^(<->|<=>|↔)/, 'iff'],
  [/^(->|=>|→)/, 'imp'],
  [/^(¬|~|!)/, 'not'],
  [/^(∧|&&?|\^)/, 'and'],
  [/^(∨|\|\|?)/, 'or'],
  [/^(⊕)/, 'xor'],
  [/^(⊤|1)/, 'true'],
  [/^(⊥|0)/, 'false'],
  [/^\(/, '('],
  [/^\)/, ')'],
  [/^[a-z][a-z0-9_]*/i, 'var'],
];

export function tokenize(src) {
  const out = [];
  let s = src;
  let pos = 0;
  while (s.length) {
    const ws = s.match(/^\s+/);
    if (ws) { s = s.slice(ws[0].length); pos += ws[0].length; continue; }
    let hit = null;
    for (const [re, type] of TOKENS) {
      const m = s.match(re);
      if (m) { hit = { type, text: m[0], pos }; break; }
    }
    if (!hit) throw new SyntaxError(`Símbolo inesperado "${s[0]}" na posição ${pos + 1}`);
    out.push(hit);
    s = s.slice(hit.text.length);
    pos += hit.text.length;
  }
  return out;
}

/**
 * Gramática (da menor para a maior precedência):
 *   iff  := imp ('↔' imp)*
 *   imp  := or ('→' imp)?          ← associa à direita: p → q → r = p → (q → r)
 *   or   := and (('∨' | '⊕') and)*
 *   and  := un ('∧' un)*
 *   un   := '¬' un | atom
 *   atom := var | ⊤ | ⊥ | '(' iff ')'
 */
export function parse(src) {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i]?.type;
  const eat = type => {
    if (peek() !== type) {
      const got = toks[i] ? `"${toks[i].text}"` : 'o fim da fórmula';
      throw new SyntaxError(`Esperava ${type === ')' ? '")"' : 'uma fórmula'} mas encontrei ${got}`);
    }
    return toks[i++];
  };
  const bin = (type, a, b) => ({ type, a, b });

  function iff() {
    let f = imp();
    while (peek() === 'iff') { i++; f = bin('iff', f, imp()); }
    return f;
  }
  function imp() {
    const f = or();
    if (peek() === 'imp') { i++; return bin('imp', f, imp()); }
    return f;
  }
  function or() {
    let f = and();
    while (peek() === 'or' || peek() === 'xor') { const t = toks[i++].type; f = bin(t, f, and()); }
    return f;
  }
  function and() {
    let f = un();
    while (peek() === 'and') { i++; f = bin('and', f, un()); }
    return f;
  }
  function un() {
    if (peek() === 'not') { i++; return { type: 'not', a: un() }; }
    return atom();
  }
  function atom() {
    const t = peek();
    if (t === 'var') return { type: 'var', name: toks[i++].text };
    if (t === 'true' || t === 'false') { i++; return { type: 'const', value: t === 'true' }; }
    if (t === '(') { i++; const f = iff(); eat(')'); return f; }
    eat('formula');
  }

  if (!toks.length) throw new SyntaxError('Digite uma fórmula');
  const f = iff();
  if (i < toks.length) throw new SyntaxError(`Sobrou "${toks[i].text}" na posição ${toks[i].pos + 1}. Faltou um operador?`);
  number(f);
  return f;
}

/** Numera os nós em pré-ordem (id) — usado para desenhar e animar. */
function number(f) {
  let id = 0;
  const visit = n => { n.id = id++; if (n.a) visit(n.a); if (n.b) visit(n.b); };
  visit(f);
}

// ---------- Impressão ----------

export function show(f) {
  switch (f.type) {
    case 'var': return f.name;
    case 'const': return f.value ? '⊤' : '⊥';
    case 'not': return SYMBOLS.not + (f.a.a && f.a.type !== 'not' ? `(${show(f.a)})` : show(f.a));
    default: {
      const side = (c, right) => {
        if (!c.b) return show(c);
        // Para facilitar a leitura, só omitimos parênteses em cadeias de ∧ ou de ∨.
        const chain = c.type === f.type && (f.type === 'and' || f.type === 'or') && !right;
        return chain ? show(c) : `(${show(c)})`;
      };
      return `${side(f.a, false)} ${SYMBOLS[f.type]} ${side(f.b, true)}`;
    }
  }
}

// ---------- Semântica ----------

export function evaluate(f, v) {
  switch (f.type) {
    case 'var': return v[f.name];
    case 'const': return f.value;
    case 'not': return !evaluate(f.a, v);
    case 'and': return evaluate(f.a, v) && evaluate(f.b, v);
    case 'or': return evaluate(f.a, v) || evaluate(f.b, v);
    case 'xor': return evaluate(f.a, v) !== evaluate(f.b, v);
    case 'imp': return !evaluate(f.a, v) || evaluate(f.b, v);
    case 'iff': return evaluate(f.a, v) === evaluate(f.b, v);
  }
  throw new Error(`Nó desconhecido: ${f.type}`);
}

export function variables(f) {
  const set = new Set();
  const visit = n => { if (n.type === 'var') set.add(n.name); if (n.a) visit(n.a); if (n.b) visit(n.b); };
  visit(f);
  return [...set].sort();
}

/** Subfórmulas em pós-ordem (filhos antes dos pais), sem repetição. */
export function subformulas(f) {
  const seen = new Map();
  const visit = n => {
    if (n.a) visit(n.a);
    if (n.b) visit(n.b);
    const s = show(n);
    if (!seen.has(s)) seen.set(s, n);
  };
  visit(f);
  return [...seen.values()];
}

/** Valorações na ordem usual dos livros: começa com tudo V e termina com tudo F. */
export function valuations(vars) {
  const rows = [];
  const k = vars.length;
  for (let i = 0; i < 2 ** k; i++) {
    const v = {};
    vars.forEach((name, j) => { v[name] = ((i >> (k - 1 - j)) & 1) === 0; });
    rows.push(v);
  }
  return rows;
}

export function truthTable(f) {
  const vars = variables(f);
  const cols = subformulas(f).filter(n => n.type !== 'var');
  const rows = valuations(vars).map(v => ({ v, values: cols.map(c => evaluate(c, v)), result: evaluate(f, v) }));
  return { vars, cols, rows };
}

export function classify(f) {
  const { rows } = truthTable(f);
  const trues = rows.filter(r => r.result).length;
  if (trues === rows.length) return 'tautologia';
  if (trues === 0) return 'contradição';
  return 'contingência';
}

export function equivalent(f, g) {
  const vars = [...new Set([...variables(f), ...variables(g)])].sort();
  return valuations(vars).every(v => evaluate(f, v) === evaluate(g, v));
}

/** Forma Normal Disjuntiva canônica: um "mintermo" por linha verdadeira. */
export function canonicalDNF(f) {
  const { vars, rows } = truthTable(f);
  const terms = rows.filter(r => r.result)
    .map(r => vars.map(x => (r.v[x] ? x : `¬${x}`)).join(' ∧ '));
  if (!terms.length) return '⊥';
  if (!vars.length) return '⊤';
  return terms.map(t => (vars.length > 1 && terms.length > 1 ? `(${t})` : t)).join(' ∨ ');
}

/** Forma Normal Conjuntiva canônica: um "maxtermo" por linha falsa. */
export function canonicalCNF(f) {
  const { vars, rows } = truthTable(f);
  const clauses = rows.filter(r => !r.result)
    .map(r => vars.map(x => (r.v[x] ? `¬${x}` : x)).join(' ∨ '));
  if (!clauses.length) return '⊤';
  if (!vars.length) return '⊥';
  return clauses.map(c => (vars.length > 1 && clauses.length > 1 ? `(${c})` : c)).join(' ∧ ');
}

// ---------- Passos da avaliação (para o player) ----------

export const EVAL_CODE = `def avalia(f, v):
    if f.tipo == "var":
        return v[f.nome]            # consulta a valoração
    if f.tipo == "¬":
        return not avalia(f.filho, v)
    a = avalia(f.esq, v)            # avalia os dois lados
    b = avalia(f.dir, v)
    if f.tipo == "∧": return a and b
    if f.tipo == "∨": return a or b
    if f.tipo == "⊕": return a != b
    if f.tipo == "→": return (not a) or b
    if f.tipo == "↔": return a == b`;

const L = lineFinder(EVAL_CODE);
const LINE = {
  var: L('return v[f.nome]'), const: L('def avalia'), not: L('return not avalia'),
  and: L('"∧"'), or: L('"∨"'), xor: L('"⊕"'), imp: L('"→"'), iff: L('"↔"'),
};

const TF = b => (b ? 'V' : 'F');
const EXPLAIN = {
  and: (a, b) => `V somente se os dois lados forem V: ${TF(a)} ∧ ${TF(b)} = <b>${TF(a && b)}</b>.`,
  or: (a, b) => `V se pelo menos um lado for V: ${TF(a)} ∨ ${TF(b)} = <b>${TF(a || b)}</b>.`,
  xor: (a, b) => `V se os lados forem diferentes: ${TF(a)} ⊕ ${TF(b)} = <b>${TF(a !== b)}</b>.`,
  imp: (a, b) => `Só é F quando a premissa é V e a conclusão é F: ${TF(a)} → ${TF(b)} = <b>${TF(!a || b)}</b>${!a ? ' (premissa falsa ⇒ implicação verdadeira "por vacuidade")' : ''}.`,
  iff: (a, b) => `V quando os lados são iguais: ${TF(a)} ↔ ${TF(b)} = <b>${TF(a === b)}</b>.`,
};

/**
 * Para cada linha da tabela, avalia a árvore de baixo para cima.
 * Cada passo: { row, node, values: {id: bool}, line, msg }.
 */
export function evaluationSteps(f, { maxRows = Infinity } = {}) {
  const vars = variables(f);
  const rows = valuations(vars).slice(0, maxRows);
  const steps = [];
  rows.forEach((v, r) => {
    const values = {};
    const valStr = vars.map(x => `${x}=${TF(v[x])}`).join(', ');
    const visit = n => {
      if (n.a) visit(n.a);
      if (n.b) visit(n.b);
      const val = evaluate(n, v);
      values[n.id] = val;
      let msg;
      if (n.type === 'var') msg = `Folha <b>${n.name}</b>: na valoração atual, ${n.name} = <b>${TF(val)}</b>.`;
      else if (n.type === 'const') msg = `Constante ${show(n)}.`;
      else if (n.type === 'not') msg = `Negação inverte o valor: ¬${TF(!val)} = <b>${TF(val)}</b>.`;
      else msg = `${NAMES[n.type][0].toUpperCase() + NAMES[n.type].slice(1)}: ${EXPLAIN[n.type](values[n.a.id], values[n.b.id])}`;
      steps.push({
        row: r, node: n.id, values: { ...values }, line: LINE[n.type],
        msg: `<span class="c-muted">Linha ${r + 1} (${valStr}).</span> ${msg}`,
        vars: { ...Object.fromEntries(vars.map(x => [x, TF(v[x])])), 'subfórmula': show(n), valor: TF(val) },
        done: n === f,
      });
    };
    visit(f);
  });
  return steps;
}

// ---------- Exercícios ----------

const rand = n => Math.floor(Math.random() * n);

export function randomFormula(vars = ['p', 'q'], depth = 3) {
  if (depth === 0 || (depth < 3 && Math.random() < 0.3)) {
    const leaf = { type: 'var', name: vars[rand(vars.length)] };
    return Math.random() < 0.25 ? { type: 'not', a: leaf } : leaf;
  }
  if (Math.random() < 0.15) return { type: 'not', a: randomFormula(vars, depth - 1) };
  const ops = ['and', 'or', 'imp', 'imp', 'iff'];
  return { type: ops[rand(ops.length)], a: randomFormula(vars, depth - 1), b: randomFormula(vars, depth - 1) };
}

const BANK = {
  tautologia: ['p ∨ ¬p', '((p → q) ∧ p) → q', '((p → q) ∧ ¬q) → ¬p', '(p → q) ↔ (¬q → ¬p)', '¬(p ∧ q) ↔ (¬p ∨ ¬q)', '((p → q) ∧ (q → r)) → (p → r)', 'p → (q → p)'],
  'contradição': ['p ∧ ¬p', '¬(p → p)', '(p ↔ q) ∧ (p ↔ ¬q)', '¬(p ∨ ¬p)', '(p → q) ∧ p ∧ ¬q'],
};

/** Sorteia uma fórmula de uma das três classes (sorteada de modo uniforme). */
export function randomClassified() {
  const target = ['tautologia', 'contradição', 'contingência'][rand(3)];
  for (let t = 0; t < 400; t++) {
    const vars = Math.random() < 0.7 ? ['p', 'q'] : ['p', 'q', 'r'];
    const f = randomFormula(vars, 3);
    const s = show(f);
    if (s.length > 30) continue;
    if (classify(f) === target && (target !== 'contingência' || Math.random() < 0.5)) return { formula: parse(s), text: s, cls: target };
  }
  const list = BANK[target] ?? ['p → q', 'p ∧ (q ∨ r)', 'p ↔ q'];
  const text = list[rand(list.length)];
  return { formula: parse(text), text, cls: target };
}
