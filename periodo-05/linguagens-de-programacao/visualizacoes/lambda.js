// Cálculo lambda não tipado: parser, substituição sem captura, redução β em
// ordem normal e aplicativa, e as codificações de Church (booleanos, números, pares, Y).
//
// Termos: { t: 'var', name } | { t: 'lam', v, body } | { t: 'app', f, a } | { t: 'macro', name }
// Macros (nomes em MAIÚSCULAS e números) são definições expandidas sob demanda (passo δ).

export const DEFS = {
  I: 'λx.x',
  K: 'λx.λy.x',
  S: 'λx.λy.λz.x z (y z)',
  TRUE: 'λt.λf.t',
  FALSE: 'λt.λf.f',
  IF: 'λb.λt.λe.b t e',
  NOT: 'λp.p FALSE TRUE',
  AND: 'λp.λq.p q p',
  OR: 'λp.λq.p p q',
  SUCC: 'λn.λf.λx.f (n f x)',
  PLUS: 'λm.λn.λf.λx.m f (n f x)',
  MULT: 'λm.λn.λf.m (n f)',
  POW: 'λb.λe.e b',
  PRED: 'λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)',
  SUB: 'λm.λn.n PRED m',
  ISZERO: 'λn.n (λx.FALSE) TRUE',
  PAIR: 'λx.λy.λp.p x y',
  FST: 'λp.p TRUE',
  SND: 'λp.p FALSE',
  Y: 'λf.(λx.f (x x)) (λx.f (x x))',
  OMEGA: '(λx.x x) (λx.x x)',
  FACT: 'Y (λr.λn.IF (ISZERO n) 1 (MULT n (r (PRED n))))',
};

export const isMacro = name => /^\d+$/.test(name) || Object.hasOwn(DEFS, name);

// ---------- Parser ----------

function tokenize(src) {
  const toks = [];
  const re = /\s*(?:(λ|\\)|(\.)|(\()|(\))|([A-Za-z_][A-Za-z0-9_']*|\d+))/y;
  let m, pos = 0;
  src = src.trim();
  while (pos < src.length) {
    re.lastIndex = pos;
    m = re.exec(src);
    if (!m) throw new Error(`caractere inesperado: "${src[pos]}"`);
    pos = re.lastIndex;
    toks.push(m[1] ? 'λ' : m[2] ? '.' : m[3] ? '(' : m[4] ? ')' : m[5]);
    while (pos < src.length && /\s/.test(src[pos])) pos++;
  }
  return toks;
}

export function parse(src, scope = new Set()) {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i];
  const eat = t => { if (toks[i] !== t) throw new Error(`esperava "${t}"${toks[i] ? `, achou "${toks[i]}"` : ' no fim'}`); i++; };
  const isAtomStart = t => t != null && t !== ')' && t !== '.';
  function term(sc) {
    if (peek() === 'λ') {
      i++;
      const vs = [];
      while (peek() && /^[a-z_][A-Za-z0-9_']*$/.test(peek())) vs.push(toks[i++]);
      if (!vs.length) throw new Error('depois de λ vem uma variável em minúsculas');
      eat('.');
      const inner = new Set(sc);
      vs.forEach(v => inner.add(v));
      let body = term(inner);
      for (const v of vs.reverse()) body = { t: 'lam', v, body };
      return body;
    }
    let f = atom(sc);
    while (isAtomStart(peek())) f = { t: 'app', f, a: peek() === 'λ' ? term(sc) : atom(sc) };
    return f;
  }
  function atom(sc) {
    const t = peek();
    if (t === '(') { i++; const e = term(sc); eat(')'); return e; }
    if (t == null || t === ')' || t === '.' || t === 'λ') throw new Error('termo incompleto');
    i++;
    if (sc.has(t)) return { t: 'var', name: t };
    if (isMacro(t)) return { t: 'macro', name: t };
    return { t: 'var', name: t };   // variável livre
  }
  const e = term(scope);
  if (i < toks.length) throw new Error(`sobrou "${toks[i]}"`);
  return e;
}

export function church(n) {
  let body = { t: 'var', name: 'x' };
  for (let k = 0; k < n; k++) body = { t: 'app', f: { t: 'var', name: 'f' }, a: body };
  return { t: 'lam', v: 'f', body: { t: 'lam', v: 'x', body } };
}

const defCache = new Map();
export function expand(name) {
  if (/^\d+$/.test(name)) return church(+name);
  if (!defCache.has(name)) defCache.set(name, parse(DEFS[name]));
  return clone(defCache.get(name));
}

const clone = t => (t.t === 'lam' ? { t: 'lam', v: t.v, body: clone(t.body) } : t.t === 'app' ? { t: 'app', f: clone(t.f), a: clone(t.a) } : { ...t });

// ---------- Substituição ----------

export function freeVars(t, acc = new Set()) {
  if (t.t === 'var') acc.add(t.name);
  else if (t.t === 'app') { freeVars(t.f, acc); freeVars(t.a, acc); }
  else if (t.t === 'lam') { const inner = freeVars(t.body); inner.delete(t.v); inner.forEach(v => acc.add(v)); }
  return acc;
}

/** t[x := s], renomeando ligadores para evitar captura. `log` recebe as renomeações (α). */
export function subst(t, x, s, log = []) {
  if (t.t === 'var') return t.name === x ? clone(s) : t;
  if (t.t === 'macro') return t;
  if (t.t === 'app') return { t: 'app', f: subst(t.f, x, s, log), a: subst(t.a, x, s, log) };
  if (t.v === x) return t;
  const fvS = freeVars(s);
  if (fvS.has(t.v) && freeVars(t.body).has(x)) {
    const avoid = new Set([...fvS, ...freeVars(t.body)]);
    let v2 = t.v + "'";
    while (avoid.has(v2)) v2 += "'";
    log.push(`${t.v} → ${v2}`);
    const body = subst(t.body, t.v, { t: 'var', name: v2 });
    return { t: 'lam', v: v2, body: subst(body, x, s, log) };
  }
  return { t: 'lam', v: t.v, body: subst(t.body, x, s, log) };
}

// ---------- Escolha do redex ----------

/** Ordem normal: redex mais à esquerda e mais externo. Macros só são expandidas na cabeça (ou no fim). */
function findNormal(t) {
  if (t.t === 'app') {
    if (t.f.t === 'lam') return { node: t, rule: 'β' };
    if (t.f.t === 'macro') return { node: t.f, rule: 'δ' };
    return findNormal(t.f) ?? findNormal(t.a);
  }
  if (t.t === 'lam') return findNormal(t.body);
  return null;
}
function findMacro(t) {
  if (t.t === 'macro') return { node: t, rule: 'δ' };
  if (t.t === 'app') return findMacro(t.f) ?? findMacro(t.a);
  if (t.t === 'lam') return findMacro(t.body);
  return null;
}
/** Ordem aplicativa: mais à esquerda e mais interno; argumentos são avaliados antes da β. */
function findApplicative(t) {
  if (t.t === 'macro') return { node: t, rule: 'δ' };
  if (t.t === 'app') {
    const inner = findApplicative(t.f) ?? findApplicative(t.a);
    if (inner) return inner;
    if (t.f.t === 'lam') return { node: t, rule: 'β' };
    return null;
  }
  if (t.t === 'lam') return findApplicative(t.body);
  return null;
}

export function findRedex(t, order = 'normal') {
  return order === 'normal' ? findNormal(t) ?? findMacro(t) : findApplicative(t);
}

function replace(t, node, by) {
  if (t === node) return by;
  if (t.t === 'app') { const f = replace(t.f, node, by), a = replace(t.a, node, by); return f === t.f && a === t.a ? t : { t: 'app', f, a }; }
  if (t.t === 'lam') { const body = replace(t.body, node, by); return body === t.body ? t : { t: 'lam', v: t.v, body }; }
  return t;
}

/** Um passo de redução: { term, rule, redex, alpha } ou null se está em forma normal. */
export function step(t, order = 'normal') {
  const r = findRedex(t, order);
  if (!r) return null;
  if (r.rule === 'δ') return { term: replace(t, r.node, expand(r.node.name)), rule: 'δ', redex: r.node, name: r.node.name, alpha: [] };
  const alpha = [];
  const res = subst(r.node.f.body, r.node.f.v, r.node.a, alpha);
  return { term: replace(t, r.node, res), rule: 'β', redex: r.node, alpha };
}

export function size(t) {
  return t.t === 'app' ? 1 + size(t.f) + size(t.a) : t.t === 'lam' ? 1 + size(t.body) : 1;
}

/** Reduz até a forma normal (ou até `max` passos / termo grande demais). */
export function reduce(t, { order = 'normal', max = 400, maxSize = 3000 } = {}) {
  const trace = [{ term: t }];
  let cur = t;
  for (let k = 0; k < max; k++) {
    const s = step(cur, order);
    if (!s) return { trace, normal: cur, status: 'normal' };
    trace.at(-1).redex = s.redex; trace.at(-1).rule = s.rule; trace.at(-1).alpha = s.alpha; trace.at(-1).name = s.name;
    cur = s.term;
    trace.push({ term: cur });
    if (size(cur) > maxSize) return { trace, normal: null, status: 'grande' };
  }
  return { trace, normal: null, status: 'limite' };
}

// ---------- Impressão ----------

/** Texto do termo. `mark(node)` pode devolver [abre, fecha] para destacar um nó. */
export function show(t, mark = () => null) {
  const go = t => {
    const m = mark(t);
    let s;
    if (t.t === 'var' || t.t === 'macro') s = t.name;
    else if (t.t === 'lam') s = `λ${t.v}.${go(t.body)}`;
    else {
      const f = t.f.t === 'lam' ? `(${go(t.f)})` : go(t.f);
      const a = t.a.t === 'app' || t.a.t === 'lam' ? `(${go(t.a)})` : go(t.a);
      s = `${f} ${a}`;
    }
    return m ? m[0] + s + m[1] : s;
  };
  return go(t);
}

/** Reconhece numerais de Church e booleanos na forma normal. */
export function interpret(t) {
  if (!t || t.t !== 'lam' || t.body.t !== 'lam') return null;
  const f = t.v, x = t.body.v;
  let b = t.body.body, n = 0;
  while (f !== x && b.t === 'app' && b.f.t === 'var' && b.f.name === f) { n++; b = b.a; }
  if (b.t === 'var' && b.name === x) return n === 1 ? '1 (= λf.λx.f x)' : n === 0 ? '0 ou FALSE' : String(n);
  if (f !== x && t.body.body.t === 'var' && t.body.body.name === f) return 'TRUE (ou K)';
  return null;
}

/** Numeral de Church → inteiro (ou null). */
export function toInt(t) {
  if (!t || t.t !== 'lam' || t.body.t !== 'lam') return null;
  let b = t.body.body, n = 0;
  while (t.v !== t.body.v && b.t === 'app' && b.f.t === 'var' && b.f.name === t.v) { n++; b = b.a; }
  return b.t === 'var' && b.name === t.body.v ? n : null;
}
