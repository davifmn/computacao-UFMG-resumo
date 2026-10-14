// Mini-Prolog: termos, unificação e resolução SLD em profundidade com
// retrocesso, registrando a árvore de busca passo a passo.
//
// Termos: { t: 'var', name } | { t: 'num', v } | { t: 'cmp', f, args: [...] }
// (átomos são compostos sem argumentos; listas usam '.'(H, T) e '[]').

const OPS = ['=', '\\=', 'is', '<', '>', '=<', '>='];
const atom = f => ({ t: 'cmp', f, args: [] });
const NIL = atom('[]');
const cons = (h, t) => ({ t: 'cmp', f: '.', args: [h, t] });

// ---------- Parser ----------

function tokenize(src) {
  const toks = [];
  const re = /(\s+|%[^\n]*)|(:-|\\=|=<|>=|[()[\]|,.=<>+\-*])|(\d+)|([A-Z_][A-Za-z0-9_]*)|([a-z][A-Za-z0-9_]*)/y;
  let pos = 0, line = 1;
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) throw new Error(`linha ${line}: caractere inesperado "${src[pos]}"`);
    pos = re.lastIndex;
    if (m[1]) { line += (m[1].match(/\n/g) || []).length; continue; }
    toks.push({ v: m[0], line, kind: m[2] ? 'p' : m[3] ? 'num' : m[4] ? 'var' : 'atom' });
  }
  return toks;
}

function parser(toks) {
  let i = 0;
  const peek = () => toks[i]?.v;
  const eat = v => { if (toks[i]?.v !== v) throw new Error(`linha ${toks[i]?.line ?? toks.at(-1)?.line ?? 1}: esperava "${v}"${toks[i] ? `, achou "${toks[i].v}"` : ' no fim'}`); i++; };
  function t700() {
    const l = t500();
    if (OPS.includes(peek())) { const f = toks[i++].v; return { t: 'cmp', f, args: [l, t500()] }; }
    return l;
  }
  function t500() {
    let l = t400();
    while (peek() === '+' || peek() === '-') { const f = toks[i++].v; l = { t: 'cmp', f, args: [l, t400()] }; }
    return l;
  }
  function t400() {
    let l = primary();
    while (peek() === '*') { i++; l = { t: 'cmp', f: '*', args: [l, primary()] }; }
    return l;
  }
  function primary() {
    const tk = toks[i];
    if (!tk) throw new Error('termo incompleto');
    if (tk.kind === 'num') { i++; return { t: 'num', v: +tk.v }; }
    if (tk.kind === 'var') { i++; return { t: 'var', name: tk.v }; }
    if (tk.kind === 'atom' && tk.v !== 'is') {
      i++;
      if (peek() === '(') {
        i++;
        const args = [t700()];
        while (peek() === ',') { i++; args.push(t700()); }
        eat(')');
        return { t: 'cmp', f: tk.v, args };
      }
      return atom(tk.v);
    }
    if (tk.v === '[') {
      i++;
      if (peek() === ']') { i++; return NIL; }
      const items = [t700()];
      while (peek() === ',') { i++; items.push(t700()); }
      let tail = NIL;
      if (peek() === '|') { i++; tail = t700(); }
      eat(']');
      return items.reduceRight((acc, h) => cons(h, acc), tail);
    }
    if (tk.v === '(') { i++; const e = t700(); eat(')'); return e; }
    throw new Error(`linha ${tk.line}: não esperava "${tk.v}"`);
  }
  function body() {
    const gs = [t700()];
    while (peek() === ',') { i++; gs.push(t700()); }
    return gs;
  }
  return { t700, body, eat, peek, done: () => i >= toks.length, line: () => toks[i]?.line };
}

export function parseProgram(src) {
  const toks = tokenize(src);
  const p = parser(toks);
  const clauses = [];
  while (!p.done()) {
    const line = p.line();
    const head = p.t700();
    if (head.t !== 'cmp') throw new Error(`linha ${line}: a cabeça de uma cláusula tem que ser um átomo ou termo composto`);
    let body = [];
    if (p.peek() === ':-') { p.eat(':-'); body = p.body(); }
    p.eat('.');
    clauses.push({ head, body, line });
  }
  return clauses;
}

export function parseQuery(src) {
  const toks = tokenize(src.replace(/^\s*\?-/, '').replace(/\.\s*$/, ''));
  const p = parser(toks);
  const gs = p.body();
  if (!p.done()) throw new Error('consulta mal formada');
  return gs;
}

// ---------- Impressão ----------

export function show(t) {
  if (t.t === 'var') return t.name;
  if (t.t === 'num') return String(t.v);
  if (t.f === '.' && t.args.length === 2) {
    const items = [];
    let c = t;
    while (c.t === 'cmp' && c.f === '.' && c.args.length === 2) { items.push(show(c.args[0])); c = c.args[1]; }
    return c.t === 'cmp' && c.f === '[]' ? `[${items.join(', ')}]` : `[${items.join(', ')} | ${show(c)}]`;
  }
  if (!t.args.length) return t.f;
  if (t.args.length === 2 && [...OPS, '+', '-', '*'].includes(t.f)) return `${show(t.args[0])} ${t.f} ${show(t.args[1])}`;
  return `${t.f}(${t.args.map(show).join(', ')})`;
}

// ---------- Unificação ----------

export function walk(t, s) {
  while (t.t === 'var' && s.has(t.name)) t = s.get(t.name);
  return t;
}
export function resolve(t, s) {
  t = walk(t, s);
  return t.t === 'cmp' && t.args.length ? { t: 'cmp', f: t.f, args: t.args.map(a => resolve(a, s)) } : t;
}
function occurs(name, t, s) {
  t = walk(t, s);
  return t.t === 'var' ? t.name === name : t.t === 'cmp' && t.args.some(a => occurs(name, a, s));
}

/** Unifica a e b sob s (sem alterar s). Devolve a nova substituição e as ligações feitas, ou null. */
export function unify(a, b, s, { occursCheck = true } = {}) {
  const s2 = new Map(s), binds = [];
  const go = (a, b) => {
    a = walk(a, s2); b = walk(b, s2);
    if (a.t === 'var' && b.t === 'var' && a.name === b.name) return true;
    if (a.t === 'var' || b.t === 'var') {
      const [v, t] = a.t === 'var' ? [a, b] : [b, a];
      if (occursCheck && occurs(v.name, t, s2)) return false;
      s2.set(v.name, t);
      binds.push([v.name, t]);
      return true;
    }
    if (a.t === 'num' || b.t === 'num') return a.t === b.t && a.v === b.v;
    return a.f === b.f && a.args.length === b.args.length && a.args.every((x, k) => go(x, b.args[k]));
  };
  return go(a, b) ? { s: s2, binds } : null;
}

function rename(t, suffix) {
  if (t.t === 'var') return { t: 'var', name: `${t.name}${suffix}` };
  if (t.t === 'cmp' && t.args.length) return { t: 'cmp', f: t.f, args: t.args.map(a => rename(a, suffix)) };
  return t;
}

function evalArith(t, s) {
  t = walk(t, s);
  if (t.t === 'num') return t.v;
  if (t.t === 'var') throw new Error(`${t.name} não está instanciada na expressão aritmética`);
  if (t.args.length === 2 && ['+', '-', '*'].includes(t.f)) {
    const [x, y] = t.args.map(a => evalArith(a, s));
    return t.f === '+' ? x + y : t.f === '-' ? x - y : x * y;
  }
  throw new Error(`${show(t)} não é uma expressão aritmética`);
}

// ---------- Resolução SLD ----------

function varsOf(t, acc = []) {
  if (t.t === 'var') { if (!acc.includes(t.name) && !t.name.startsWith('_')) acc.push(t.name); }
  else if (t.t === 'cmp') t.args.forEach(a => varsOf(a, acc));
  return acc;
}

/**
 * Roda a consulta e devolve { steps, nodes, answers, status }.
 * nodes: { id, parent, label, clause, status: 'aberto'|'sucesso'|'falha' }
 */
export function solve(program, query, { maxNodes = 70, maxDepth = 24, maxAnswers = 8 } = {}) {
  const qvars = query.flatMap(g => varsOf(g)).filter((v, k, a) => a.indexOf(v) === k);
  const nodes = [], steps = [], answers = [];
  let renameCount = 0, stop = null;
  const goalsLabel = (gs, s) => (gs.length ? gs.map(g => show(resolve(g, s))).join(', ') : '□');
  const bindingsOf = s => Object.fromEntries(qvars.map(v => [v, show(resolve({ t: 'var', name: v }, s))]));
  const snap = (node, msg, extra = {}) => steps.push({ node: node.id, line: extra.line ?? null, msg, upto: nodes.length, status: nodes.map(n => n.status), vars: bindingsOf(node.s), ...extra });
  const mk = (parent, goals, s, clause, depth) => {
    const n = { id: nodes.length, parent: parent?.id ?? null, label: goalsLabel(goals, s), clause, status: 'aberto', goals, s, depth };
    nodes.push(n);
    return n;
  };

  function run(node) {
    if (stop) return;
    if (!node.goals.length) {
      node.status = 'sucesso';
      answers.push(bindingsOf(node.s));
      snap(node, `Não sobrou objetivo: <b>sucesso</b>! ${qvars.length ? `Resposta: ${qvars.map(v => `${v} = ${show(resolve({ t: 'var', name: v }, node.s))}`).join(', ')}.` : 'A resposta é <b>yes</b>.'} ${answers.length < maxAnswers ? 'Como num <code>;</code> no interpretador, continuamos procurando: retrocede.' : ''}`, { answer: true });
      if (answers.length >= maxAnswers) stop = `parou após ${maxAnswers} respostas`;
      return;
    }
    if (node.depth >= maxDepth) { stop = `profundidade ${maxDepth} atingida: a busca provavelmente não termina`; node.status = 'falha'; snap(node, `<b>A busca desceu ${maxDepth} níveis sem terminar.</b> O Prolog real entraria em laço infinito (ou estouraria a pilha).`); return; }
    if (nodes.length >= maxNodes) { stop = `limite de ${maxNodes} nós`; snap(node, `Limite de ${maxNodes} nós da visualização atingido.`); return; }
    const [g0, ...rest] = node.goals;
    const g = resolve(g0, node.s);

    // Predicados embutidos
    if (g.t === 'cmp' && g.args.length === 2 && OPS.includes(g.f)) {
      let res = null, why = '';
      try {
        if (g.f === '=') { res = unify(g.args[0], g.args[1], node.s); why = res ? 'unificam' : 'não unificam'; }
        else if (g.f === '\\=') { res = unify(g.args[0], g.args[1], node.s) ? null : { s: node.s, binds: [] }; why = res ? 'não unificam, então \\= vale' : 'unificam, então \\= falha'; }
        else if (g.f === 'is') { const v = evalArith(g.args[1], node.s); res = unify(g.args[0], { t: 'num', v }, node.s); why = `${show(g.args[1])} vale ${v}`; }
        else {
          const [x, y] = g.args.map(a => evalArith(a, node.s));
          const ok = { '<': x < y, '>': x > y, '=<': x <= y, '>=': x >= y }[g.f];
          res = ok ? { s: node.s, binds: [] } : null;
          why = `${x} ${g.f} ${y} é ${ok ? 'verdadeiro' : 'falso'}`;
        }
      } catch (e) { why = `erro: ${e.message}`; res = null; }
      if (res) {
        const child = mk(node, rest, res.s, null, node.depth + 1);
        snap(child, `Predicado embutido <code>${show(g)}</code>: ${why}.`);
        run(child);
      } else {
        node.status = 'falha';
        snap(node, `Predicado embutido <code>${show(g)}</code>: ${why}. <b>Falha</b>: retrocede.`);
      }
      return;
    }
    if (g.t === 'cmp' && g.f === 'true' && !g.args.length) { const child = mk(node, rest, node.s, null, node.depth + 1); snap(child, '<code>true</code> sempre vale.'); run(child); return; }

    const cands = program.map((c, k) => ({ c, k })).filter(({ c }) => c.head.f === g.f && c.head.args.length === g.args.length);
    if (!cands.length) {
      node.status = 'falha';
      snap(node, `Não há cláusula para <code>${g.f}/${g.args.length}</code>: <b>falha</b>.`);
      return;
    }
    let any = false;
    for (const [idx, { c, k }] of cands.entries()) {
      if (stop) return;
      const suf = `_${++renameCount}`;
      const head = rename(c.head, suf), body = c.body.map(b => rename(b, suf));
      const u = unify(g, head, node.s);
      const cl = `cláusula ${k + 1} (linha ${c.line})`;
      if (!u) {
        snap(node, `Objetivo <code>${show(g)}</code> × ${cl}, <code>${show(head)}</code>: <b>não unifica</b>.`, { line: c.line, tried: k });
        continue;
      }
      any = true;
      const child = mk(node, [...body, ...rest], u.s, k, node.depth + 1);
      const theta = u.binds.map(([v, t]) => `${v} = ${show(resolve(t, u.s))}`).join(', ') || 'nenhuma ligação';
      snap(child, `Objetivo <code>${show(g)}</code> × ${cl}: unifica com θ = {${theta}}. ${body.length ? `O objetivo é trocado pelo corpo da cláusula.` : 'É um fato: o objetivo some.'} (Variáveis da cláusula renomeadas com ${suf} para não colidirem.)`, { line: c.line });
      run(child);
      if (stop) return;
      if (idx < cands.length - 1) snap(node, `<b>Retrocede</b> até <code>${show(g)}</code> e tenta a próxima cláusula.`);
    }
    if (!any) { node.status = 'falha'; snap(node, `Nenhuma cláusula unifica com <code>${show(g)}</code>: <b>falha</b>, retrocede.`); }
  }

  const root = mk(null, query, new Map(), null, 0);
  snap(root, `Consulta: <code>?- ${query.map(show).join(', ')}.</code> O Prolog sempre resolve o <b>primeiro objetivo</b> da lista com as cláusulas <b>na ordem do programa</b> (busca em profundidade).`);
  run(root);
  const last = nodes[0];
  steps.push({ node: last.id, line: null, upto: nodes.length, status: nodes.map(n => n.status), vars: {}, done: true,
    msg: stop ? `Busca interrompida: ${stop}. Respostas encontradas: ${answers.length}.` : `Árvore explorada por completo: <b>${answers.length}</b> resposta(s)${answers.length ? '' : ' (o Prolog responde <b>no</b>)'}.` });
  return { steps, nodes: nodes.map(({ id, parent, label, clause, depth }) => ({ id, parent, label, clause, depth })), answers, status: stop ? 'interrompida' : 'completa' };
}

export function runText(programSrc, querySrc, opts) {
  return solve(parseProgram(programSrc), parseQuery(querySrc), opts);
}

export const EXAMPLES = {
  familia: {
    nome: 'Família (regra com variável intermediária)',
    prog: 'pai(abraao, isaque).\npai(isaque, jaco).\npai(isaque, esau).\npai(jaco, jose).\n\navo(X, Z) :- pai(X, Y), pai(Y, Z).',
    query: 'avo(abraao, Q)',
  },
  append: {
    nome: 'append: uma relação, várias direções',
    prog: 'append([], L, L).\nappend([H|T], L, [H|R]) :- append(T, L, R).',
    query: 'append(X, Y, [1, 2, 3])',
  },
  fatorial: {
    nome: 'Fatorial (aritmética com is)',
    prog: 'fat(0, 1).\nfat(N, F) :- N > 0, N1 is N - 1, fat(N1, F1), F is N * F1.',
    query: 'fat(3, F)',
  },
  membro: {
    nome: 'member e não determinismo',
    prog: 'membro(X, [X|_]).\nmembro(X, [_|T]) :- membro(X, T).\n\ncor(vermelho).\ncor(azul).\ncor(verde).',
    query: 'membro(C, [verde, preto, azul]), cor(C)',
  },
  esquerda: {
    nome: 'Recursão à esquerda (não termina)',
    prog: 'pai(a, b).\npai(b, c).\n\nanc(X, Y) :- anc(X, Z), pai(Z, Y).\nanc(X, Y) :- pai(X, Y).',
    query: 'anc(a, c)',
  },
};
