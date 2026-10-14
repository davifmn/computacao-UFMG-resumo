// Inferência de tipos de Hindley-Milner (algoritmo W) para um mini-ML:
//   fn x => e | e1 e2 | let x = e1 in e2 | let rec f = e1 in e2 | if e then e else e
//   inteiros, true/false, + - * < =, pares (a, b), listas [] e ::, e as primitivas
//   hd, tl, null, fst, snd.
// Cada atribuição de tipo e cada passo da unificação viram um "passo" da animação.

// ---------- Tipos ----------
// { t: 'var', id } | { t: 'con', name: 'int'|'bool'|'->'|'list'|'*', args: [...] }

const tv = id => ({ t: 'var', id });
const con = (name, ...args) => ({ t: 'con', name, args });
export const INT = con('int'), BOOL = con('bool');
export const fn = (a, b) => con('->', a, b);
export const list = a => con('list', a);
export const pair = (a, b) => con('*', a, b);

/** Nome bonito para a variável de número k: 'a, 'b, …, 'z, 'a1, … */
export const varName = k => `'${String.fromCharCode(97 + (k % 26))}${k >= 26 ? Math.floor(k / 26) : ''}`;

export function showType(t, names = null) {
  const nm = id => (names ? (names.has(id) ? names.get(id) : (names.set(id, varName(names.size)), names.get(id))) : `t${id}`);
  const go = (t, prec) => {
    if (t.t === 'var') return nm(t.id);
    if (t.name === '->') { const s = `${go(t.args[0], 2)} -> ${go(t.args[1], 1)}`; return prec > 1 ? `(${s})` : s; }
    if (t.name === '*') { const s = `${go(t.args[0], 3)} * ${go(t.args[1], 3)}`; return prec > 2 ? `(${s})` : s; }
    if (t.name === 'list') return `${go(t.args[0], 4)} list`;
    return t.name;
  };
  return go(t, 0);
}

// ---------- Parser ----------

const KEYWORDS = new Set(['fn', 'let', 'rec', 'in', 'if', 'then', 'else', 'true', 'false']);

function tokenize(src) {
  const toks = [];
  const re = /(\s+)|(=>|::|\[\]|[()+\-*<=,])|(\d+)|([A-Za-z_][A-Za-z0-9_']*)/y;
  let line = 1, pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) throw new Error(`linha ${line}: caractere inesperado "${src[pos]}"`);
    pos = re.lastIndex;
    if (m[1]) { line += (m[1].match(/\n/g) || []).length; continue; }
    toks.push({ v: m[0], line, kind: m[2] ? 'op' : m[3] ? 'num' : KEYWORDS.has(m[0]) ? 'kw' : 'id' });
  }
  return toks;
}

/** Nós: { k, line, ... , id } com k ∈ num, bool, var, fn, app, let, letrec, if, op, pair, nil, cons. */
export function parse(src) {
  const toks = tokenize(src);
  let i = 0, nid = 0;
  const peek = () => toks[i]?.v;
  const line = () => toks[Math.min(i, toks.length - 1)]?.line ?? 1;
  const eat = v => { if (toks[i]?.v !== v) throw new Error(`linha ${line()}: esperava "${v}"${toks[i] ? `, achou "${toks[i].v}"` : ' no fim'}`); return toks[i++]; };
  const node = (k, ln, rest) => ({ k, line: ln, id: nid++, ...rest });
  const ident = () => { const t = toks[i]; if (t?.kind !== 'id') throw new Error(`linha ${line()}: esperava um nome`); i++; return t.v; };

  function expr() {
    const ln = line();
    if (peek() === 'fn') { i++; const x = ident(); eat('=>'); return node('fn', ln, { x, body: expr() }); }
    if (peek() === 'let') {
      i++;
      const rec = peek() === 'rec' ? (i++, true) : false;
      const x = ident(); eat('='); const e1 = expr(); eat('in'); const e2 = expr();
      return node(rec ? 'letrec' : 'let', ln, { x, e1, e2 });
    }
    if (peek() === 'if') { i++; const c = expr(); eat('then'); const a = expr(); eat('else'); return node('if', ln, { c, a, b: expr() }); }
    return cons();
  }
  function cons() {
    const l = cmp();
    if (peek() === '::') { const ln = line(); i++; return node('cons', ln, { l, r: cons() }); }
    return l;
  }
  function cmp() {
    let l = add();
    while (peek() === '<' || peek() === '=') { const ln = line(); const op = toks[i++].v; l = node('op', ln, { op, l, r: add() }); }
    return l;
  }
  function add() {
    let l = mul();
    while (peek() === '+' || peek() === '-') { const ln = line(); const op = toks[i++].v; l = node('op', ln, { op, l, r: mul() }); }
    return l;
  }
  function mul() {
    let l = app();
    while (peek() === '*') { const ln = line(); i++; l = node('op', ln, { op: '*', l, r: app() }); }
    return l;
  }
  const atomStart = () => { const t = toks[i]; return t && (t.kind === 'num' || t.kind === 'id' || t.v === '(' || t.v === '[]' || t.v === 'true' || t.v === 'false'); };
  function app() {
    let f = atom();
    while (atomStart()) { const ln = line(); f = node('app', ln, { f, a: atom() }); }
    return f;
  }
  function atom() {
    const t = toks[i], ln = line();
    if (!t) throw new Error('expressão incompleta');
    if (t.kind === 'num') { i++; return node('num', ln, { v: +t.v }); }
    if (t.v === 'true' || t.v === 'false') { i++; return node('bool', ln, { v: t.v === 'true' }); }
    if (t.v === '[]') { i++; return node('nil', ln, {}); }
    if (t.kind === 'id') { i++; return node('var', ln, { x: t.v }); }
    if (t.v === '(') {
      i++;
      const e = expr();
      if (peek() === ',') { i++; const e2 = expr(); eat(')'); return node('pair', ln, { l: e, r: e2 }); }
      eat(')');
      return e;
    }
    throw new Error(`linha ${ln}: não esperava "${t.v}"`);
  }
  const e = expr();
  if (i < toks.length) throw new Error(`linha ${toks[i].line}: sobrou "${toks[i].v}"`);
  return e;
}

export function children(n) {
  switch (n.k) {
    case 'fn': return [n.body];
    case 'app': return [n.f, n.a];
    case 'let': case 'letrec': return [n.e1, n.e2];
    case 'if': return [n.c, n.a, n.b];
    case 'op': case 'cons': case 'pair': return [n.l, n.r];
    default: return [];
  }
}

export function label(n) {
  switch (n.k) {
    case 'num': return String(n.v);
    case 'bool': return String(n.v);
    case 'var': return n.x;
    case 'fn': return `fn ${n.x}`;
    case 'app': return 'aplica';
    case 'let': return `let ${n.x}`;
    case 'letrec': return `let rec ${n.x}`;
    case 'if': return 'if';
    case 'op': return n.op;
    case 'cons': return '::';
    case 'pair': return '( , )';
    case 'nil': return '[]';
  }
}

// ---------- Algoritmo W com registro de passos ----------

export class TypeError_ extends Error {}

export function infer(src) {
  const ast = parse(src);
  let next = 0;
  const fresh = () => tv(next++);
  const S = new Map();           // substituição: id → tipo
  const nodeType = new Map();    // id do nó → tipo
  const steps = [];

  const resolve = t => {
    if (t.t === 'var') return S.has(t.id) ? resolve(S.get(t.id)) : t;
    return { t: 'con', name: t.name, args: t.args.map(resolve) };
  };
  const occurs = (id, t) => { t = resolve(t); return t.t === 'var' ? t.id === id : t.args.some(a => occurs(id, a)); };
  const ftv = (t, acc = new Set()) => { t = resolve(t); if (t.t === 'var') acc.add(t.id); else t.args.forEach(a => ftv(a, acc)); return acc; };

  // Nomes estáveis para as variáveis ao longo da animação
  const names = new Map();
  const sh = t => showType(resolve(t), names);
  const snapSubst = () => Object.fromEntries([...S.keys()].map(id => [showType(tv(id), names), sh(tv(id))]));
  const snapTypes = () => Object.fromEntries([...nodeType].map(([id, t]) => [id, sh(t)]));
  const snap = (n, msg, extra = {}) => steps.push({ line: n?.line, node: n?.id, msg, vars: snapSubst(), types: snapTypes(), ...extra });

  function unify(a, b, n, why) {
    const ra = resolve(a), rb = resolve(b);
    snap(n, `${why}: unifica <b>${sh(ra)}</b> com <b>${sh(rb)}</b>.`, { eq: [sh(ra), sh(rb)] });
    const go = (a, b) => {
      a = resolve(a); b = resolve(b);
      if (a.t === 'var' && b.t === 'var' && a.id === b.id) return;
      if (a.t === 'var' || b.t === 'var') {
        const [v, t] = a.t === 'var' ? [a, b] : [b, a];
        if (occurs(v.id, t)) throw new TypeError_(`${sh(v)} = ${sh(t)} criaria um tipo infinito (${sh(v)} aparece dentro de si mesmo: falha no <i>occurs check</i>)`);
        S.set(v.id, t);
        snap(n, `Substitui <b>${showType(v, names)} := ${sh(t)}</b>.`, { bind: showType(v, names) });
        return;
      }
      if (a.name !== b.name || a.args.length !== b.args.length) throw new TypeError_(`não dá para unificar <b>${sh(a)}</b> com <b>${sh(b)}</b>`);
      a.args.forEach((x, k) => go(x, b.args[k]));
    };
    go(a, b);
  }

  const generalize = (env, t) => {
    const envVars = new Set();
    for (const s of env.values()) { const inS = ftv(s.type); s.vars.forEach(v => inS.delete(v)); inS.forEach(v => envVars.add(v)); }
    return { vars: [...ftv(t)].filter(v => !envVars.has(v)), type: resolve(t) };
  };
  const instantiate = sc => {
    const m = new Map(sc.vars.map(v => [v, fresh()]));
    const go = t => (t.t === 'var' ? (m.get(t.id) ?? t) : { t: 'con', name: t.name, args: t.args.map(go) });
    return go(resolve(sc.type));
  };
  const showScheme = sc => {
    const t = resolve(sc.type);
    return sc.vars.length ? `∀${sc.vars.map(v => showType(tv(v), names)).join(' ')}. ${sh(t)}` : sh(t);
  };

  const prims = () => {
    const a = fresh(), b = fresh(), c = fresh();
    return new Map([
      ['hd', { vars: [a.id], type: fn(list(a), a) }],
      ['tl', { vars: [a.id], type: fn(list(a), list(a)) }],
      ['null', { vars: [a.id], type: fn(list(a), BOOL) }],
      ['fst', { vars: [b.id, c.id], type: fn(pair(b, c), b) }],
      ['snd', { vars: [b.id, c.id], type: fn(pair(b, c), c) }],
    ]);
  };

  function W(env, n) {
    let t;
    switch (n.k) {
      case 'num': t = INT; snap(n, `${n.v} é um inteiro: <b>int</b>.`); break;
      case 'bool': t = BOOL; snap(n, `${n.v} é <b>bool</b>.`); break;
      case 'nil': { const a = fresh(); t = list(a); nodeType.set(n.id, t); snap(n, `[] é uma lista de qualquer coisa: <b>${sh(t)}</b>, com ${sh(a)} nova.`); return t; }
      case 'var': {
        const sc = env.get(n.x);
        if (!sc) throw new TypeError_(`"${n.x}" não está definido`);
        t = instantiate(sc);
        nodeType.set(n.id, t);
        snap(n, sc.vars.length ? `${n.x} tem o esquema <b>${showScheme(sc)}</b>: cada uso ganha variáveis novas (é isso que permite usar uma função polimórfica com tipos diferentes): <b>${sh(t)}</b>.` : `${n.x} tem tipo <b>${sh(t)}</b> no ambiente.`);
        return t;
      }
      case 'fn': {
        const a = fresh();
        snap(n, `fn ${n.x} => …: o parâmetro ${n.x} ganha uma variável nova, <b>${sh(a)}</b>. Os usos de ${n.x} no corpo vão dizer o que ela é.`, { pending: n.id });
        const inner = new Map(env); inner.set(n.x, { vars: [], type: a });
        const tb = W(inner, n.body);
        t = fn(a, tb);
        nodeType.set(n.id, t);
        snap(n, `fn ${n.x} => … : <b>${sh(t)}</b>.`);
        return t;
      }
      case 'app': {
        const tf = W(env, n.f), ta = W(env, n.a), r = fresh();
        nodeType.set(n.id, r);
        unify(tf, fn(ta, r), n, `Aplicação: a função tem que aceitar ${sh(ta)} e devolver algo (${showType(r, names)})`);
        t = r;
        snap(n, `A aplicação tem tipo <b>${sh(t)}</b>.`);
        return t;
      }
      case 'let': {
        const t1 = W(env, n.e1);
        const sc = generalize(env, t1);
        snap(n, `let ${n.x}: generaliza ${sh(t1)} para <b>${showScheme(sc)}</b>. ${sc.vars.length ? 'As variáveis que não aparecem no ambiente viram "para todo": esse é o <b>polimorfismo do let</b>.' : 'Nada a generalizar.'}`);
        const inner = new Map(env); inner.set(n.x, sc);
        t = W(inner, n.e2);
        nodeType.set(n.id, t);
        snap(n, `let … in … tem o tipo do corpo: <b>${sh(t)}</b>.`);
        return t;
      }
      case 'letrec': {
        const a = fresh();
        snap(n, `let rec ${n.x}: a função recursiva ganha <b>${sh(a)}</b> antes de olharmos o corpo, para as chamadas recursivas terem tipo.`);
        const inner = new Map(env); inner.set(n.x, { vars: [], type: a });
        const t1 = W(inner, n.e1);
        unify(a, t1, n, `O tipo suposto de ${n.x} tem que bater com o da definição`);
        const sc = generalize(env, t1);
        snap(n, `Generaliza ${n.x}: <b>${showScheme(sc)}</b>.`);
        const inner2 = new Map(env); inner2.set(n.x, sc);
        t = W(inner2, n.e2);
        nodeType.set(n.id, t);
        snap(n, `let rec … in … : <b>${sh(t)}</b>.`);
        return t;
      }
      case 'if': {
        const tc = W(env, n.c);
        unify(tc, BOOL, n, 'A condição do if tem que ser bool');
        const ta = W(env, n.a), tb = W(env, n.b);
        unify(ta, tb, n, 'Os dois ramos do if têm que ter o mesmo tipo');
        t = ta;
        nodeType.set(n.id, t);
        snap(n, `if … : <b>${sh(t)}</b>.`);
        return t;
      }
      case 'op': {
        const tl = W(env, n.l), tr = W(env, n.r);
        if (n.op === '=') { unify(tl, tr, n, '= compara dois valores do mesmo tipo'); t = BOOL; }
        else {
          unify(tl, INT, n, `${n.op} opera sobre inteiros (lado esquerdo)`);
          unify(tr, INT, n, `${n.op} opera sobre inteiros (lado direito)`);
          t = n.op === '<' ? BOOL : INT;
        }
        nodeType.set(n.id, t);
        snap(n, `${n.op}: <b>${sh(t)}</b>.`);
        return t;
      }
      case 'cons': {
        const tl = W(env, n.l), tr = W(env, n.r);
        unify(tr, list(tl), n, `x :: xs exige que xs seja lista do tipo de x`);
        t = tr;
        nodeType.set(n.id, t);
        snap(n, `:: dá <b>${sh(t)}</b>.`);
        return t;
      }
      case 'pair': {
        const tl = W(env, n.l), tr = W(env, n.r);
        t = pair(tl, tr);
        nodeType.set(n.id, t);
        snap(n, `Par: <b>${sh(t)}</b>.`);
        return t;
      }
    }
    nodeType.set(n.id, t);
    return t;
  }

  let result = null, error = null;
  try {
    const t = W(prims(), ast);
    const final = new Map();
    result = showType(resolve(t), final);
    snap(null, `Tipo principal: <b>${result}</b>. É o tipo mais geral: qualquer outro tipo válido para a expressão é uma instância dele.`, { done: true });
  } catch (e) {
    if (!(e instanceof TypeError_)) throw e;
    error = e.message;
    snap(null, `<b>Erro de tipo:</b> ${e.message}. O programa é rejeitado antes de rodar.`, { done: true, error: true });
  }
  return { ast, steps, type: result, error };
}

export const EXAMPLES = {
  identidade: 'let id = fn x => x in\n(id 3, id true)',
  compose: 'fn f => fn g => fn x =>\n  f (g x)',
  map: 'let rec map = fn f => fn l =>\n  if null l then []\n  else f (hd l) :: map f (tl l)\nin map',
  soma: 'let rec soma = fn l =>\n  if null l then 0\n  else hd l + soma (tl l)\nin soma',
  twice: 'let twice = fn f => fn x => f (f x) in\ntwice (fn n => n * 2) 5',
  erro: 'fn x => x x',
  ramos: 'fn b => if b then 1 else false',
  lambdaMono: '(fn id => (id 3, id true))\n  (fn x => x)',
};
