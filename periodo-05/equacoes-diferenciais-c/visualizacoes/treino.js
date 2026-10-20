// Treino para as provas de EDO C: geradores infinitos de questões no formato das
// listas da disciplina, correção automática de respostas digitadas como fórmula
// e as regras de domínio (níveis no estilo Khan Academy + revisão espaçada).
//
// Lógica pura, sem DOM: tudo aqui roda no Node e é conferido em
// tests/equacoes-diferenciais.test.js.

// ---------- Expressões digitadas pelo aluno ----------
// Gramática (com multiplicação implícita, como numa calculadora científica):
//   expr  := termo (('+' | '-') termo)*
//   termo := unario (('*' | '/' | implícito) unario)*
//   unario:= '-' unario | pot
//   pot   := prim ('^' unario)?
//   prim  := número | variável | e | pi | '(' expr ')' | função argumento | u_c(t)

const FUNCS = {
  sen: Math.sin, sin: Math.sin, cos: Math.cos, tg: Math.tan, tan: Math.tan,
  sec: x => 1 / Math.cos(x), cossec: x => 1 / Math.sin(x), csc: x => 1 / Math.sin(x),
  cotg: x => 1 / Math.tan(x), cot: x => 1 / Math.tan(x),
  senh: Math.sinh, sinh: Math.sinh, cosh: Math.cosh, tgh: Math.tanh, tanh: Math.tanh,
  arctg: Math.atan, arctan: Math.atan, atan: Math.atan, arcsen: Math.asin, arcsin: Math.asin, arccos: Math.acos,
  exp: Math.exp, ln: Math.log, log: Math.log, sqrt: Math.sqrt, raiz: Math.sqrt, abs: Math.abs,
  u: x => (x >= 0 ? 1 : 0),
};
const FTEX = {
  sen: '\\operatorname{sen}', sin: '\\operatorname{sen}', cos: '\\cos', tg: '\\operatorname{tg}', tan: '\\operatorname{tg}',
  sec: '\\sec', cossec: '\\operatorname{cossec}', csc: '\\operatorname{cossec}', cotg: '\\operatorname{cotg}', cot: '\\operatorname{cotg}',
  senh: '\\operatorname{senh}', sinh: '\\operatorname{senh}', cosh: '\\cosh', tgh: '\\operatorname{tgh}', tanh: '\\operatorname{tgh}',
  arctg: '\\operatorname{arctg}', arctan: '\\operatorname{arctg}', atan: '\\operatorname{arctg}',
  arcsen: '\\operatorname{arcsen}', arcsin: '\\operatorname{arcsen}', arccos: '\\arccos', ln: '\\ln', log: '\\ln',
};
// nomes mais longos primeiro, para "cossec" não virar "cos" + "sec"
const NAMES = [...Object.keys(FUNCS), 'pi'].sort((a, b) => b.length - a.length);

function tokenize(src) {
  const s = src.replace(/·|×/g, '*').replace(/−/g, '-').replace(/π/g, 'pi');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const sp = i > 0 && /\s/.test(s[i - 1]);
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c) || (c === ',' && /[0-9]/.test(s[i + 1] ?? '') && /[0-9]/.test(s[i - 1] ?? ''))) {
      let j = i;
      while (j < s.length && (/[0-9.]/.test(s[j]) || (s[j] === ',' && /[0-9]/.test(s[j + 1] ?? '')))) j++;
      const v = Number(s.slice(i, j).replace(',', '.'));
      if (!Number.isFinite(v)) throw new Error(`número inválido "${s.slice(i, j)}"`);
      out.push({ k: 'num', v, sp });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      const name = NAMES.find(n => s.startsWith(n, i));
      if (name) { out.push({ k: name === 'pi' ? 'pi' : 'fn', v: name, sp }); i += name.length; }
      else { out.push({ k: 'id', v: c, sp }); i++; }
      continue;
    }
    if ('+-*/^()_[]{}='.includes(c)) {
      const k = c === '[' || c === '{' ? '(' : c === ']' || c === '}' ? ')' : c;
      out.push({ k, sp });
      i++;
      continue;
    }
    throw new Error(`caractere inesperado "${c}"`);
  }
  return out;
}

/** Converte o texto digitado numa árvore. `vars` são as variáveis permitidas. */
export function parse(src, vars = ['t']) {
  const text = String(src).split('=')[0]; // "ψ(x, y) = C": vale o lado esquerdo
  const toks = tokenize(text);
  if (!toks.length) throw new Error('resposta vazia');
  let p = 0;
  const peek = () => toks[p];
  const eat = k => { const t = toks[p]; if (!t || t.k !== k) throw new Error(k === ')' ? 'falta fechar parêntese' : `esperava "${k}"`); p++; return t; };
  const startsPrimary = t => t && (t.k === 'num' || t.k === 'id' || t.k === 'pi' || t.k === 'fn' || t.k === '(');

  function expr() {
    let a = term();
    while (peek() && (peek().k === '+' || peek().k === '-')) {
      const op = toks[p++].k;
      a = { op, a, b: term() };
    }
    return a;
  }
  function term() {
    let a = unary();
    for (;;) {
      const t = peek();
      if (t && (t.k === '*' || t.k === '/')) { p++; a = { op: t.k, a, b: unary() }; }
      else if (startsPrimary(t)) a = { op: '*', a, b: power() };
      else return a;
    }
  }
  function unary() {
    if (peek()?.k === '-') { p++; return { op: 'neg', a: unary() }; }
    if (peek()?.k === '+') { p++; return unary(); }
    return power();
  }
  function exponent(base) {
    // e^2t e e^-3x: número colado numa variável fica todo no expoente (só com base e)
    if (base.op !== 'const' || base.v !== 'e') return unary();
    const t0 = toks[p], t1 = toks[p + 1], t2 = toks[p + 2];
    if (t0?.k === 'num' && t1?.k === 'id' && !t1.sp && vars.includes(t1.v)) { p += 2; return { op: '*', a: { op: 'num', v: t0.v }, b: { op: 'var', v: t1.v } }; }
    if (t0?.k === '-' && t1?.k === 'num' && t2?.k === 'id' && !t2.sp && vars.includes(t2.v)) { p += 3; return { op: 'neg', a: { op: '*', a: { op: 'num', v: t1.v }, b: { op: 'var', v: t2.v } } }; }
    return unary();
  }
  function power() {
    const base = primary();
    if (peek()?.k === '^') { p++; return { op: '^', a: base, b: exponent(base) }; }
    return base;
  }
  // argumento de função sem parênteses: "sen 2t" = sen(2t), mas "sen t cos t" = sen(t)·cos(t)
  function bareArg() {
    let a = power();
    while (peek() && (peek().k === 'num' || peek().k === 'id' || peek().k === 'pi')) a = { op: '*', a, b: power() };
    return a;
  }
  function primary() {
    const t = toks[p++];
    if (!t) throw new Error('expressão incompleta');
    if (t.k === 'num') return { op: 'num', v: t.v };
    if (t.k === 'pi') return { op: 'const', v: 'pi' };
    if (t.k === 'id') {
      if (t.v === 'e' && !vars.includes('e')) return { op: 'const', v: 'e' };
      if (!vars.includes(t.v)) throw new Error(`"${t.v}" não é uma variável desta questão (use ${vars.join(', ')})`);
      return { op: 'var', v: t.v };
    }
    if (t.k === '(') { const a = expr(); eat(')'); return a; }
    if (t.k === 'fn') {
      const name = t.v;
      if (name === 'u') {
        // u_c(t) = degrau em t = c; u(t - c) também vale
        let c = null;
        if (peek()?.k === '_') { p++; c = primary(); }
        eat('(');
        const arg = expr();
        eat(')');
        return { op: 'H', arg, c };
      }
      let pw = null;
      if (peek()?.k === '^') { p++; pw = unary(); } // sen^2 x
      const arg = peek()?.k === '(' ? (p++, (() => { const a = expr(); eat(')'); return a; })()) : bareArg();
      const node = name === 'exp' ? { op: '^', a: { op: 'const', v: 'e' }, b: arg } : { op: 'fn', v: name, a: arg };
      return pw ? { op: '^', a: node, b: pw } : node;
    }
    throw new Error(t.k === ')' ? 'parêntese fechado sem abrir' : `"${t.k}" fora do lugar`);
  }

  const ast = expr();
  if (p < toks.length) throw new Error(toks[p].k === ')' ? 'parêntese fechado sem abrir' : `"${toks[p].v ?? toks[p].k}" fora do lugar`);
  return ast;
}

/** Valor numérico da árvore; env = { t: 1.3 } ou { x: 0.5, y: 2 }. */
export function evaluate(n, env) {
  switch (n.op) {
    case 'num': return n.v;
    case 'const': return n.v === 'pi' ? Math.PI : Math.E;
    case 'var': return env[n.v];
    case '+': return evaluate(n.a, env) + evaluate(n.b, env);
    case '-': return evaluate(n.a, env) - evaluate(n.b, env);
    case '*': return evaluate(n.a, env) * evaluate(n.b, env);
    case '/': return evaluate(n.a, env) / evaluate(n.b, env);
    case '^': return Math.pow(evaluate(n.a, env), evaluate(n.b, env));
    case 'neg': return -evaluate(n.a, env);
    case 'fn': return FUNCS[n.v](evaluate(n.a, env));
    case 'H': return evaluate(n.arg, env) - (n.c ? evaluate(n.c, env) : 0) >= 0 ? 1 : 0;
  }
  throw new Error(`nó desconhecido ${n.op}`);
}

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 };
const prec = n => PREC[n.op] ?? 5;

/** TeX da árvore, para o aluno ver como o que digitou foi entendido. */
export function toTex(n) {
  const wrap = (c, min) => (prec(c) < min ? `\\left(${toTex(c)}\\right)` : toTex(c));
  switch (n.op) {
    case 'num': return String(n.v).replace('.', '{,}');
    case 'const': return n.v === 'pi' ? '\\pi' : 'e';
    case 'var': return n.v;
    case '+': return `${toTex(n.a)} + ${wrap(n.b, 1)}`;
    case '-': return `${toTex(n.a)} - ${wrap(n.b, 2)}`;
    case '*': {
      const l = wrap(n.a, 2), r = wrap(n.b, 2);
      const dot = n.b.op === 'num' || (n.b.op === 'neg') || (n.b.op === '^' && n.b.a.op === 'num') || (n.a.op === 'num' && n.b.op === 'num');
      return dot ? `${l} \\cdot ${r}` : `${l}\\,${r}`;
    }
    case '/': return `\\frac{${toTex(n.a)}}{${toTex(n.b)}}`;
    case 'neg': return `-${wrap(n.a, 3)}`;
    case '^': return `${wrap(n.a, 5)}^{${toTex(n.b)}}`;
    case 'fn':
      if (n.v === 'sqrt' || n.v === 'raiz') return `\\sqrt{${toTex(n.a)}}`;
      if (n.v === 'abs') return `\\left|${toTex(n.a)}\\right|`;
      return `${FTEX[n.v]}\\left(${toTex(n.a)}\\right)`;
    case 'H': return n.c ? `u_{${toTex(n.c)}}\\left(${toTex(n.arg)}\\right)` : `u\\left(${toTex(n.arg)}\\right)`;
  }
  return '?';
}

// ---------- Correção ----------

const finite = x => Number.isFinite(x) && Math.abs(x) < 1e9;
const close = (a, b, rel = 1e-6) => Math.abs(a - b) <= rel * (1 + Math.abs(a) + Math.abs(b));

/** Pontos de amostragem: domínio { t: [a, b] } ou { x: [..], y: [..] }; evita descontinuidades em `avoid`. */
function samples(domain, n, avoid = []) {
  const keys = Object.keys(domain);
  const pts = [];
  for (let i = 0; pts.length < n && i < n * 20; i++) {
    const env = {};
    for (const k of keys) {
      const [a, b] = domain[k];
      // quase uniforme (determinístico) com uma perturbação irracional
      env[k] = a + (b - a) * ((((i + 1) * 0.6180339887 + keys.indexOf(k) * 0.3141592) % 1) * 0.94 + 0.03);
    }
    if (avoid.some(c => Math.abs(env[keys[0]] - c) < 0.02 * (domain[keys[0]][1] - domain[keys[0]][0]))) continue;
    pts.push(env);
  }
  return pts;
}

/** Duas funções coincidem em (quase) todo ponto do domínio? */
export function sameFunction(f, g, domain, { avoid = [], n = 16, rel = 1e-6 } = {}) {
  let used = 0;
  for (const env of samples(domain, n, avoid)) {
    const a = f(env), b = g(env);
    if (!finite(b)) continue;
    if (!finite(a)) return false;
    if (!close(a, b, rel)) return false;
    used++;
  }
  return used >= Math.min(6, n);
}

/** Resíduo de a2 y'' + a1 y' + a0 y = g ao longo do domínio, com derivadas por diferenças centrais. */
export function satisfiesOde(y, { a, g, v = 'x', domain, avoid = [] }) {
  let used = 0;
  for (const env of samples(domain, 14, avoid)) {
    const x = env[v], h = 1e-3 * Math.max(1, Math.abs(x));
    const at = s => y({ ...env, [v]: s });
    const y0 = at(x), yp = at(x + h), ym = at(x - h);
    if (![y0, yp, ym].every(finite)) return false;
    const d1 = (yp - ym) / (2 * h), d2 = (yp - 2 * y0 + ym) / (h * h);
    const lhs = a[0] * d2 + a[1] * d1 + a[2] * y0, rhs = g(x);
    if (!finite(rhs)) continue;
    const scale = 1 + Math.abs(rhs) + Math.abs(a[0] * d2) + Math.abs(a[2] * y0);
    if (Math.abs(lhs - rhs) > 2e-4 * scale) return false;
    used++;
  }
  return used >= 8;
}

/**
 * Corrige a resposta `input` de uma questão. Tipos de `ans`:
 *   expr      { f(env), vars, domain, avoid? }        → igualdade de funções
 *   ode       { a, g, v, domain }                      → qualquer solução particular serve
 *   potential { f(env), domain }                       → ψ a menos de constante (aceita aψ + b)
 *   number    { value }                                → aceita expressões ("e^2/4")
 *   choice    { options, correct, accept? }            → input = índice escolhido
 *   vec       { fs: [x, y], vars, domain }              → input = [x(t), y(t)]
 */
export function check(ans, input) {
  if (ans.kind === 'choice') {
    const ok = input === ans.correct || (ans.accept ?? []).includes(input);
    return { ok };
  }
  if (ans.kind === 'vec') {
    const parts = ans.fs.map((g, i) => check({ kind: 'expr', vars: ans.vars, f: g, domain: ans.domain }, input[i] ?? ''));
    const err = parts.find(p => p.error);
    if (err) return { ok: false, error: err.error, parts };
    return { ok: parts.every(p => p.ok), parts };
  }
  let ast;
  const vars = ans.kind === 'number' ? [] : ans.vars;
  try { ast = parse(input, vars); }
  catch (e) { return { ok: false, error: e.message }; }
  const f = env => evaluate(ast, env);
  if (ans.kind === 'number') {
    const v = f({});
    return { ok: finite(v) && close(v, ans.value, 1e-4) };
  }
  if (ans.kind === 'expr') return { ok: sameFunction(f, ans.f, ans.domain, { avoid: ans.avoid }) };
  if (ans.kind === 'ode') return { ok: satisfiesOde(f, ans) };
  if (ans.kind === 'potential') {
    // aceita a·ψ + b (mesmas curvas de nível) com a ≠ 0
    const pts = samples(ans.domain, 14).filter(e => finite(ans.f(e)));
    const [p, q] = [pts[0], pts.find(e => !close(ans.f(e), ans.f(pts[0]), 1e-3))];
    if (!q) return { ok: false };
    const sa = (f(q) - f(p)) / (ans.f(q) - ans.f(p)), sb = f(p) - sa * ans.f(p);
    if (!finite(sa) || Math.abs(sa) < 1e-9) return { ok: false };
    return { ok: pts.every(e => finite(f(e)) && close(f(e), sa * ans.f(e) + sb, 1e-6)) };
  }
  throw new Error(`tipo de resposta desconhecido ${ans.kind}`);
}

// ---------- Frações e montagem de fórmulas em TeX ----------

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

export class Q {
  constructor(n, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`fração inválida ${n}/${d}`);
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    this.n = n / g; this.d = d / g;
  }
  static of(x) { return x instanceof Q ? x : new Q(x); }
  add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = Q.of(o); return new Q(this.n * o.d, this.d * o.n); }
  neg() { return new Q(-this.n, this.d); }
  get v() { return this.n / this.d; }
  isZero() { return this.n === 0; }
  isOne() { return this.n === 1 && this.d === 1; }
  tex() { return this.d === 1 ? String(this.n) : `${this.n < 0 ? '-' : ''}\\frac{${Math.abs(this.n)}}{${this.d}}`; }
}
const q = (n, d = 1) => (n instanceof Q ? n : new Q(n, d));

/** "k·v" em TeX: 2t, -t, t, \frac{3}{2}t; k = 0 → "0". */
export function kv(k, v) {
  k = q(k);
  if (k.isZero()) return '0';
  if (k.isOne()) return v;
  if (k.n === -1 && k.d === 1) return `-${v}`;
  return `${k.tex()}${v}`;
}
/** e^{k v} (v pode ser "(t-2)": vira e^{t-2} ou e^{2(t-2)}). */
export const ex = (k, v = 't') => {
  k = q(k);
  if (k.isOne() && v.startsWith('(')) return `e^{${v.slice(1, -1)}}`;
  return `e^{${kv(k, v)}}`;
};
const arg = (k, v) => (q(k).isOne() ? (v.startsWith('(') ? v : ` ${v}`) : `(${kv(k, v)})`);
export const sen = (k, v = 't') => `\\operatorname{sen}${arg(k, v)}`;
export const cos = (k, v = 't') => `\\cos${arg(k, v)}`;

/**
 * Combinação linear: termos [coef, corpoTeX, fn, cor?]; devolve { tex, f(x) }.
 * Coeficientes zero somem, 1 e -1 viram sinais, frações viram \frac.
 * `cor` (uma função de pinta) colore o termo, deixando o sinal de fora.
 */
export function lin(terms) {
  const live = terms.filter(([c]) => !q(c).isZero());
  let tex = '';
  live.forEach(([c, body, , paint], i) => {
    c = q(c);
    const neg = c.n < 0, a = neg ? c.neg() : c;
    const s0 = body ? (a.isOne() ? body : `${a.tex()}${/^[\d\\]/.test(body) && a.d === 1 ? '\\,' : ''}${body}`) : a.tex();
    const s = paint ? paint(s0) : s0;
    tex += i === 0 ? `${neg ? '-' : ''}${s}` : ` ${neg ? '-' : '+'} ${s}`;
  });
  const f = x => live.reduce((acc, [c, , fn]) => acc + q(c).v * (fn ? fn(x) : 1), 0);
  return { tex: tex || '0', f };
}

/** Polinômio c0 v^n + c1 v^{n-1} + ... em TeX (coeficientes inteiros ou Q). */
export function poly(cs, v = 's') {
  const n = cs.length - 1;
  return lin(cs.map((c, i) => {
    const e = n - i;
    return [c, e === 0 ? '' : e === 1 ? v : `${v}^{${e}}`];
  })).tex;
}

// ---------- Utilidades dos geradores ----------

const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pk = (r, arr) => arr[Math.floor(r() * arr.length)];
const nz = (r, a, b) => { let k; do k = ri(r, a, b); while (k === 0); return k; };
const T = s => `$${s}$`;
const fact = n => (n <= 1 ? 1 : n * fact(n - 1));

// ---------- Cores (como no integral-calculator) ----------
// Cada objeto tem uma cor fixa do enunciado à resposta. Quando um símbolo é trocado pelo
// seu valor (μ → e^{2x}, a parcela de f(t) → sua transformada, λ₁ → e^{λ₁t}v₁), o valor
// herda a cor do símbolo, como um placeholder que foi preenchido.
export const CORES = { azul: '#58c4dd', verde: '#83c167', amarelo: '#f4d35e', roxo: '#b189f5', laranja: '#ff9f43', rosa: '#f78fb3' };
export const pinta = cor => s => `\\textcolor{${CORES[cor]}}{${s}}`;
const AZ = pinta('azul'), VD = pinta('verde'), AM = pinta('amarelo'), RX = pinta('roxo'), LR = pinta('laranja'), RS = pinta('rosa');
/** Legenda das cores de uma questão: leg(['azul', 'p(x)'], ...). */
const leg = (...pares) => pares.map(([cor, tex]) => ({ cor: CORES[cor], tex }));
/** Envolve em parênteses se começar com sinal de menos (para produtos). */
const par = s => (String(s).startsWith('-') ? `\\left(${s}\\right)` : s);

/** Raízes da equação característica e a solução homogênea geral em TeX. */
function homogTex(roots, v = 'x') {
  if (roots.type === 'reais') return lin([[1, roots.r1 === 0 ? 'c_1' : `c_1${ex(roots.r1, v)}`], [1, roots.r2 === 0 ? 'c_2' : `c_2${ex(roots.r2, v)}`]]).tex;
  if (roots.type === 'dupla') return `(c_1 + c_2${v})${ex(roots.r, v)}`;
  const e = roots.a === 0 ? '' : ex(roots.a, v);
  return `${e}\\left(c_1${cos(roots.b, v)} + c_2${sen(roots.b, v)}\\right)`;
}
function rootsTex(roots) {
  if (roots.type === 'reais') return `r_1 = ${q(roots.r1).tex()},\\ r_2 = ${q(roots.r2).tex()}`;
  if (roots.type === 'dupla') return `r = ${q(roots.r).tex()}\\ \\text{(dupla)}`;
  return `r = ${roots.a === 0 ? '' : `${roots.a} `}\\pm ${roots.b === 1 ? '' : roots.b}i`;
}
/** Versões coloridas: raízes r₁ (ou α) azul, r₂ (ou β) verde; c₁ roxo, c₂ laranja. */
function homogTexC(roots, v = 'x') {
  const E = (r0, paint) => (r0 === 0 ? '' : `e^{${paint(kv(r0, v))}}`);
  if (roots.type === 'reais') return `${RX('c_1')}${E(roots.r1, AZ)} + ${LR('c_2')}${E(roots.r2, VD)}`;
  if (roots.type === 'dupla') return `(${RX('c_1')} + ${LR('c_2')}${v})e^{${AZ(kv(roots.r, v))}}`;
  const b = VD(kv(roots.b, v));
  return `${E(roots.a, AZ)}\\left(${RX('c_1')}\\cos(${b}) + ${LR('c_2')}\\operatorname{sen}(${b})\\right)`;
}
function rootsTexC(roots) {
  if (roots.type === 'reais') return `${AZ(`r_1 = ${q(roots.r1).tex()}`)},\\ ${VD(`r_2 = ${q(roots.r2).tex()}`)}`;
  if (roots.type === 'dupla') return `${AZ(`r = ${q(roots.r).tex()}`)}\\ \\text{(dupla)}`;
  return `r = ${roots.a === 0 ? '' : `${AZ(roots.a)} `}\\pm ${VD(roots.b === 1 ? '' : roots.b)}${roots.b === 1 ? VD('i') : 'i'}`;
}
/** Coeficientes [a, b, c] da equação característica a partir das raízes (mônica, ou 4r² para raiz dupla p/2). */
function charPoly(roots) {
  if (roots.type === 'reais') return [1, -(roots.r1 + roots.r2), roots.r1 * roots.r2];
  if (roots.type === 'dupla') {
    const r = q(roots.r);
    if (r.d === 2) return [4, -4 * r.n, r.n * r.n];
    return [1, -2 * r.n, r.n * r.n];
  }
  return [1, -2 * roots.a, roots.a * roots.a + roots.b * roots.b];
}
/** Lado esquerdo a y'' + b y' + c y em TeX. */
function odeLhs([a, b, c], v = 'y') {
  return lin([[a, `${v}''`], [b, `${v}'`], [c, v]]).tex;
}

// ---------- P1: equações de 1ª ordem ----------

function genLinear1(r) {
  if (r() < 0.55) {
    // y' + a y = b e^{cx}, y(0) = y0  →  y = K e^{cx} + (y0 − K) e^{−ax}, K = b/(a + c)
    const a = pk(r, [1, 2, 3, -1, -2]);
    let c; do c = pk(r, [1, 2, 3, -1, -2, -3, 0]); while (a + c === 0);
    const K = nz(r, -3, 3), b = K * (a + c), y0 = ri(r, -3, 4);
    const forc = c === 0 ? String(b) : lin([[b, ex(c, 'x')]]).tex;
    const eq = `y'${lin([[1, ''], [a, 'y']]).tex.slice(1)} = ${forc}`;
    const y = lin([[K, c === 0 ? '' : ex(c, 'x'), c === 0 ? null : x => Math.exp(c * x)], [y0 - K, ex(-a, 'x'), x => Math.exp(-a * x)]]);
    const yC = lin([[K, c === 0 ? '' : ex(c, 'x')], [y0 - K, ex(-a, 'x'), null, RX]]).tex;
    const mu = AM(ex(a, 'x'));
    const eqC = `y' ${a < 0 ? '-' : '+'} ${AZ(kv(Math.abs(a), 'y'))} = ${VD(forc)},\\quad y(0) = ${RS(y0)}`;
    return {
      skill: 'linear1', metodos: c === 0 ? ['linear', 'separavel'] : ['linear'],
      eq: `${eq},\\quad y(0) = ${y0}`,
      q: `Resolva o PVI por fator integrante: ${T(eqC)}`,
      legend: leg(['azul', 'p(x)'], ['verde', 'q(x)'], ['amarelo', '\\mu(x)'], ['roxo', 'C'], ['rosa', 'y(0)']),
      steps: [
        `Já está na forma padrão $y' + ${AZ('p(x)')}\\,y = ${VD('q(x)')}$, com $${AZ('p(x)')} = ${AZ(a)}$ e $${VD('q(x)')} = ${VD(forc)}$.`,
        `Fator integrante: $${AM('\\mu(x)')} = e^{\\int ${AZ('p')}\\,dx} = e^{\\int ${AZ(a)}\\,dx} = ${mu}$.`,
        `Multiplique a equação por $${AM('\\mu')}$: o lado esquerdo vira a derivada de um produto, $\\left(${mu}\\,y\\right)' = ${mu}\\cdot ${VD(par(forc))} = ${lin([[b, ex(a + c, 'x')]]).tex}$.`,
        `Integre os dois lados: $${mu}\\,y = ${lin([[K, ex(a + c, 'x')]]).tex} + ${RX('C')}$. Dividindo por $${AM('\\mu')}$: $y = ${lin([[K, c === 0 ? '' : ex(c, 'x')]]).tex} + ${RX('C')}\\,${ex(-a, 'x')}$.`,
        `Condição inicial: $y(0) = ${K} + ${RX('C')} = ${RS(y0)}$, então $${RX('C')} = ${RX(y0 - K)}$.`,
        `$y(x) = ${yC}$`,
      ],
      ans: { kind: 'expr', vars: ['x'], f: e => y.f(e.x), domain: { x: [-1, 1.5] }, tex: y.tex },
      spec: { type: 'ode1', f: (x, yy) => b * Math.exp(c * x) - a * yy, x0: 0, y0, sol: y.f },
    };
  }
  // y' + (k/x) y = x^m, y(1) = y0  →  y = x^{m+1}/D + (y0 − 1/D) x^{−k}, D = m + k + 1
  const k = pk(r, [1, 2, 3]), m = pk(r, [0, 1, 2]), D = m + k + 1, y0 = ri(r, -2, 3);
  const C = q(y0).sub(q(1, D));
  const y = lin([[q(1, D), m + 1 === 1 ? 'x' : `x^{${m + 1}}`, x => x ** (m + 1)], [C, `x^{-${k}}`, x => x ** -k]]);
  const xm = m === 0 ? '1' : m === 1 ? 'x' : `x^{${m}}`;
  const premult = r() < 0.5;
  const eq = premult ? `x\\,y' + ${k === 1 ? '' : k}y = ${m + 1 === 1 ? 'x' : `x^{${m + 1}}`}` : `y' + \\frac{${k}}{x}\\,y = ${xm}`;
  const mu0 = k === 1 ? 'x' : `x^{${k}}`, mu = AM(mu0);
  const pT = AZ(`\\frac{${k}}{x}`);
  const xm1 = m + 1 === 1 ? 'x' : `x^{${m + 1}}`;
  const eqC = premult ? `x\\,y' + ${AZ(`${k === 1 ? '' : k}y`)} = ${VD(xm1)}` : `y' + ${pT}\\,y = ${VD(xm)}`;
  const yC = lin([[q(1, D), xm1], [C, `x^{-${k}}`, null, RX]]).tex;
  return {
    skill: 'linear1', metodos: ['linear'],
    eq: `${eq},\\quad y(1) = ${y0},\\ x > 0`,
    q: `Resolva o PVI e escreva $y(x)$ explicitamente: ${T(`${eqC},\\quad y(1) = ${RS(y0)},\\quad x > 0`)}`,
    legend: leg(['azul', 'p(x)'], ['verde', 'q(x)'], ['amarelo', '\\mu(x)'], ['roxo', 'C'], ['rosa', 'y(1)']),
    steps: [
      premult ? `Divida por $x$ para chegar à forma padrão: $y' + ${pT}\\,y = ${VD(xm)}$, ou seja, $${AZ('p(x)')} = ${pT}$ e $${VD('q(x)')} = ${VD(xm)}$.` : `Já está na forma padrão, com $${AZ('p(x)')} = ${pT}$ e $${VD('q(x)')} = ${VD(xm)}$.`,
      `Fator integrante: $${AM('\\mu')} = e^{\\int ${pT}\\,dx} = e^{${k === 1 ? '' : k}\\ln x} = ${mu}$ (vale para $x > 0$).`,
      `$\\left(${mu}\\,y\\right)' = ${mu}\\cdot ${VD(xm)} = x^{${m + k}}$.`,
      `Integre: $${mu}\\,y = \\frac{x^{${D}}}{${D}} + ${RX('C')}$, então $y = \\frac{${xm1}}{${D}} + \\frac{${RX('C')}}{${mu}}$.`,
      `$y(1) = \\frac{1}{${D}} + ${RX('C')} = ${RS(y0)}$, logo $${RX('C')} = ${RX(C.tex())}$.`,
      `$y(x) = ${yC}$, definida em $(0, \\infty)$.`,
    ],
    ans: { kind: 'expr', vars: ['x'], f: e => y.f(e.x), domain: { x: [0.3, 2.5] }, tex: y.tex },
    spec: { type: 'ode1', f: (x, yy) => x ** m - (k / x) * yy, x0: 1, y0, sol: y.f },
  };
}

function genSeparavel(r) {
  const kind = pk(r, ['exp', 'raiz', 'quadrado', 'expo']);
  if (kind === 'exp') {
    // y' = k x^n y → y = y0 e^{k x^{n+1}/(n+1)}
    const k = pk(r, [1, 2, 3, -1, -2, 4]), n = pk(r, [1, 2]), y0 = nz(r, -3, 3);
    const c = q(k, n + 1);
    const xn = n === 1 ? 'x' : `x^{${n}}`;
    const eq = `y' = ${kv(k, xn)}\\,y`;
    const expo = ex(c, `x^{${n + 1}}`);
    const y = lin([[y0, expo, x => Math.exp(c.v * x ** (n + 1))]]);
    const g = AZ(kv(k, xn)), expoC = `e^{${AZ(kv(c, `x^{${n + 1}}`))}}`;
    return {
      skill: 'separavel', metodos: ['separavel', 'linear'],
      eq: `${eq},\\quad y(0) = ${y0}`,
      q: `Resolva por separação de variáveis: ${T(`y' = ${g}\\,${VD('y')},\\quad y(0) = ${RS(y0)}`)}`,
      legend: leg(['azul', 'g(x)'], ['verde', 'h(y)'], ['roxo', 'C,\\ A'], ['rosa', 'y(0)']),
      steps: [
        `É da forma $y' = ${AZ('g(x)')}\\,${VD('h(y)')}$ com $${AZ('g(x)')} = ${g}$ e $${VD('h(y)')} = ${VD('y')}$. Separe: $\\frac{dy}{${VD('y')}} = ${g}\\,dx$ (a solução constante $y = 0$ não satisfaz a condição inicial).`,
        `Integre os dois lados: $\\ln|y| = ${AZ(kv(c, `x^{${n + 1}}`))} + ${RX('C')}$.`,
        `Exponencie: $y = ${RX('A')}\\,${expoC}$, com $${RX('A')} = \\pm e^{${RX('C')}}$.`,
        `$y(0) = ${RX('A')} = ${RS(y0)}$.`,
        `$y(x) = ${RX(y0 === 1 ? '' : y0 === -1 ? '-' : y0)}${expoC}$`,
      ],
      ans: { kind: 'expr', vars: ['x'], f: e => y.f(e.x), domain: { x: [-1, 1] }, tex: y.tex },
      spec: { type: 'ode1', f: (x, yy) => k * x ** n * yy, x0: 0, y0, sol: y.f },
    };
  }
  if (kind === 'raiz') {
    // y' = a x / y, y(x0) = y0 > 0 → y = sqrt(a x² + y0² − a x0²)
    const a = pk(r, [1, 2, 3]), x0 = pk(r, [0, 1, 2]), y0 = pk(r, [1, 2, 3]);
    const C = y0 * y0 - a * x0 * x0;
    if (C === 0) return genSeparavel(r);
    const rad = lin([[a, 'x^2'], [C, '']]).tex;
    const ytex = `\\sqrt{${rad}}`;
    const f = x => Math.sqrt(a * x * x + C);
    const lo = C > 0 ? x0 - 1 : x0 + 0.05, hi = x0 + 1.5;
    const eq = `y' = \\frac{${kv(a, 'x')}}{y}`;
    const g = AZ(kv(a, 'x'));
    return {
      skill: 'separavel', metodos: ['separavel'],
      eq: `${eq},\\quad y(${x0}) = ${y0}`,
      q: `Resolva o PVI e dê $y(x)$ explícita: ${T(`y' = \\frac{${g}}{${VD('y')}},\\quad y(${x0}) = ${RS(y0)}`)}`,
      legend: leg(['azul', 'g(x)'], ['verde', 'h(y) = 1/y'], ['roxo', 'K'], ['rosa', 'y(x_0)']),
      steps: [
        `Separe (o ${VD('y')} do denominador passa multiplicando): $${VD('y')}\\,dy = ${g}\\,dx$.`,
        `Integre: $\\frac{y^2}{2} = ${AZ(kv(q(a, 2), 'x^2'))} + C$, isto é, $y^2 = ${AZ(kv(a, 'x^2'))} + ${RX('K')}$.`,
        `Condição inicial: $${RS(y0)}^2 = ${a * x0 * x0} + ${RX('K')}$, logo $${RX('K')} = ${RX(C)}$.`,
        `Como $y(${x0}) = ${RS(y0)} > 0$, fica a raiz positiva: $y(x) = \\sqrt{${AZ(kv(a, 'x^2'))} ${C < 0 ? '-' : '+'} ${RX(Math.abs(C))}}$.`,
        C > 0 ? `O radicando é sempre positivo: a solução vale em todo $\\mathbb{R}$.` : `Ela vale enquanto ${T(`${rad} > 0`)} no lado que contém $x_0 = ${x0}$.`,
      ],
      ans: { kind: 'expr', vars: ['x'], f: e => f(e.x), domain: { x: [lo, hi] }, tex: ytex },
      spec: { type: 'ode1', f: (x, yy) => (a * x) / yy, x0, y0, sol: f },
    };
  }
  if (kind === 'quadrado') {
    // y' = k x y², y(0) = y0 → y = 2y0 / (2 − k y0 x²)
    const k = pk(r, [1, 2, 3, -1, -2]), y0 = nz(r, -2, 3);
    let N = 2 * y0, A = 2, B = k * y0;
    const g = gcd(gcd(N, A), B);
    N /= g; A /= g; B /= g;
    const den = lin([[A, ''], [-B, 'x^2']]).tex;
    const ytex = `\\frac{${N}}{${den}}`;
    const f = x => N / (A - B * x * x);
    const lim = B > 0 ? Math.sqrt(A / B) * 0.8 : 1.2;
    const eq = `y' = ${kv(k, 'x')}\\,y^2`;
    return {
      skill: 'separavel', metodos: ['separavel'],
      eq: `${eq},\\quad y(0) = ${y0}`,
      q: `Resolva o PVI: ${T(`y' = ${AZ(kv(k, 'x'))}\\,${VD('y^2')},\\quad y(0) = ${RS(y0)}`)}`,
      legend: leg(['azul', 'g(x)'], ['verde', 'h(y)'], ['roxo', 'C'], ['rosa', 'y(0)']),
      steps: [
        `Separe: $\\frac{dy}{${VD('y^2')}} = ${AZ(kv(k, 'x'))}\\,dx$.`,
        `Integre: $-\\frac{1}{y} = ${AZ(kv(q(k, 2), 'x^2'))} + ${RX('C')}$.`,
        `$y(0) = ${RS(y0)}$: $-\\frac{1}{${RS(y0)}} = ${RX('C')}$, logo $${RX('C')} = ${RX(q(-1, y0).tex())}$.`,
        `Isolando $y$: $y(x) = ${ytex}$.`,
        B > 0 ? `Atenção: o denominador zera em $x = \\pm\\sqrt{${q(A, B).tex()}}$; a solução explode ali e só vale entre esses pontos.` : `O denominador nunca zera: vale em todo $\\mathbb{R}$.`,
      ],
      ans: { kind: 'expr', vars: ['x'], f: e => f(e.x), domain: { x: [-lim, lim] }, tex: ytex },
      spec: { type: 'ode1', f: (x, yy) => k * x * yy * yy, x0: 0, y0, sol: f },
    };
  }
  // y' = e^{ax − y}, y(0) = 0 → y = ln((e^{ax} + a − 1)/a)
  const a = pk(r, [2, 3, 4]);
  const ytex = `\\ln\\left(\\frac{${ex(a, 'x')} + ${a - 1}}{${a}}\\right)`;
  const f = x => Math.log((Math.exp(a * x) + a - 1) / a);
  const eq = `y' = e^{${a}x - y}`;
  return {
    skill: 'separavel', metodos: ['separavel'],
    eq: `${eq},\\quad y(0) = 0`,
    q: `Resolva o PVI: ${T(`${eq},\\quad y(0) = ${RS(0)}`)}`,
    legend: leg(['azul', 'g(x)'], ['verde', 'h(y)'], ['roxo', 'C'], ['rosa', 'y(0)']),
    steps: [
      `Use $e^{${a}x - y} = ${AZ(ex(a, 'x'))}\\,${VD('e^{-y}')}$ e separe: $\\frac{dy}{${VD('e^{-y}')}} = e^{y}\\,dy = ${AZ(ex(a, 'x'))}\\,dx$.`,
      `Integre: $e^{y} = \\frac{${AZ(ex(a, 'x'))}}{${a}} + ${RX('C')}$.`,
      `$y(0) = ${RS(0)}$: $1 = \\frac{1}{${a}} + ${RX('C')}$, logo $${RX('C')} = ${RX(`\\frac{${a - 1}}{${a}}`)}$.`,
      `$y(x) = ${ytex}$ (o argumento do log é sempre positivo: vale em todo $\\mathbb{R}$).`,
    ],
    ans: { kind: 'expr', vars: ['x'], f: e => f(e.x), domain: { x: [-1.5, 1.5] }, tex: ytex },
    spec: { type: 'ode1', f: (x, yy) => Math.exp(a * x - yy), x0: 0, y0: 0, sol: f },
  };
}

// termos de ψ(x, y) com suas derivadas: [coef, corpo]
const PSI = [
  { psi: 'x^2y', f: (x, y) => x * x * y, fM: (x, y) => 2 * x * y, fN: x => x * x, M: [2, 'xy'], N: [1, 'x^2'], My: [2, 'x'], Nx: [2, 'x'] },
  { psi: 'xy^2', f: (x, y) => x * y * y, fM: (x, y) => y * y, fN: (x, y) => 2 * x * y, M: [1, 'y^2'], N: [2, 'xy'], My: [2, 'y'], Nx: [2, 'y'] },
  { psi: 'xy', f: (x, y) => x * y, fM: (x, y) => y, fN: x => x, M: [1, 'y'], N: [1, 'x'], My: [1, ''], Nx: [1, ''] },
  { psi: 'x^2y^2', f: (x, y) => x * x * y * y, fM: (x, y) => 2 * x * y * y, fN: (x, y) => 2 * x * x * y, M: [2, 'xy^2'], N: [2, 'x^2y'], My: [4, 'xy'], Nx: [4, 'xy'] },
  { psi: 'e^x\\cos y', f: (x, y) => Math.exp(x) * Math.cos(y), fM: (x, y) => Math.exp(x) * Math.cos(y), fN: (x, y) => -Math.exp(x) * Math.sin(y), M: [1, 'e^x\\cos y'], N: [-1, 'e^x\\operatorname{sen} y'], My: [-1, 'e^x\\operatorname{sen} y'], Nx: [-1, 'e^x\\operatorname{sen} y'] },
  { psi: 'e^{xy}', f: (x, y) => Math.exp(x * y), fM: (x, y) => y * Math.exp(x * y), fN: (x, y) => x * Math.exp(x * y), M: [1, 'ye^{xy}'], N: [1, 'xe^{xy}'], My: [1, '(1 + xy)e^{xy}'], Nx: [1, '(1 + xy)e^{xy}'] },
  { psi: '\\operatorname{sen}(xy)', f: (x, y) => Math.sin(x * y), fM: (x, y) => y * Math.cos(x * y), fN: (x, y) => x * Math.cos(x * y), M: [1, 'y\\cos(xy)'], N: [1, 'x\\cos(xy)'], My: [1, '\\left(\\cos(xy) - xy\\operatorname{sen}(xy)\\right)'], Nx: [1, '\\left(\\cos(xy) - xy\\operatorname{sen}(xy)\\right)'] },
  { psi: 'x\\operatorname{sen} y', f: (x, y) => x * Math.sin(y), fM: (x, y) => Math.sin(y), fN: (x, y) => x * Math.cos(y), M: [1, '\\operatorname{sen} y'], N: [1, 'x\\cos y'], My: [1, '\\cos y'], Nx: [1, '\\cos y'] },
  { psi: 'ye^x', f: (x, y) => y * Math.exp(x), fM: (x, y) => y * Math.exp(x), fN: x => Math.exp(x), M: [1, 'ye^x'], N: [1, 'e^x'], My: [1, 'e^x'], Nx: [1, 'e^x'] },
];
const PSI_X = [
  { psi: 'x^3', f: x => x ** 3, fM: x => 3 * x * x, M: [3, 'x^2'] },
  { psi: 'x^2', f: x => x * x, fM: x => 2 * x, M: [2, 'x'] },
  { psi: 'e^{x}', f: x => Math.exp(x), fM: x => Math.exp(x), M: [1, 'e^{x}'] },
];
const PSI_Y = [
  { psi: 'y^2', f: y => y * y, fN: y => 2 * y, N: [2, 'y'] },
  { psi: 'y^3', f: y => y ** 3, fN: y => 3 * y * y, N: [3, 'y^2'] },
  { psi: '\\cos y', f: y => Math.cos(y), fN: y => -Math.sin(y), N: [-1, '\\operatorname{sen} y'] },
];

function genExata(r) {
  // ψ = c1·misto1 + c2·misto2 + c3·(só x) + c4·(só y)
  const mixed = [];
  while (mixed.length < 2) { const t = pk(r, PSI); if (!mixed.includes(t)) mixed.push(t); }
  const tx = pk(r, PSI_X), ty = pk(r, PSI_Y);
  const coef = () => pk(r, [1, 1, 2, 3, -1, -2]);
  const cs = [coef(), coef(), r() < 0.7 ? coef() : 0, r() < 0.7 ? coef() : 0];
  const exact = r() < 0.75;
  // equação não exata: perturba o coeficiente de N de um termo misto
  const bad = exact ? 1 : 2;
  const Mterms = [[cs[0] * mixed[0].M[0], mixed[0].M[1]], [cs[1] * mixed[1].M[0], mixed[1].M[1]], [cs[2] * tx.M[0], tx.M[1]]];
  const Nterms = [[cs[0] * mixed[0].N[0] * bad, mixed[0].N[1]], [cs[1] * mixed[1].N[0], mixed[1].N[1]], [cs[3] * ty.N[0], ty.N[1]]];
  const My = lin([[cs[0] * mixed[0].My[0], mixed[0].My[1]], [cs[1] * mixed[1].My[0], mixed[1].My[1]]]).tex;
  const Nx = lin([[cs[0] * mixed[0].Nx[0] * bad, mixed[0].Nx[1]], [cs[1] * mixed[1].Nx[0], mixed[1].Nx[1]]]).tex;
  const M = lin(Mterms).tex, N = lin(Nterms).tex;
  const eq = `\\left(${M}\\right)dx + \\left(${N}\\right)dy = 0`;
  const psi = lin([[cs[0], mixed[0].psi], [cs[1], mixed[1].psi], [cs[2], tx.psi], [cs[3], ty.psi]]).tex;
  const fpsi = (x, y) => cs[0] * mixed[0].f(x, y) + cs[1] * mixed[1].f(x, y) + cs[2] * tx.f(x) + cs[3] * ty.f(y);
  const intM = lin([[cs[0], mixed[0].psi], [cs[1], mixed[1].psi], [cs[2], tx.psi]]).tex;
  const hy = cs[3] ? lin([[cs[3], ty.psi]]).tex : '0';
  const hp = cs[3] ? lin([[cs[3] * ty.N[0], ty.N[1]]]).tex : '0';
  const base = { skill: 'exata', metodos: ['exata'], eq, legend: leg(['azul', 'M'], ['verde', 'N'], ['amarelo', '\\psi'], ['roxo', 'h(y)']) };
  const eqC = `\\left(${AZ(M)}\\right)dx + \\left(${VD(N)}\\right)dy = 0`;
  const psiC = hy === '0' ? AM(intM) : `${AM(intM)} ${hy.startsWith('-') ? `- ${RX(hy.slice(1))}` : `+ ${RX(hy)}`}`;
  if (!exact || r() < 0.25) {
    return {
      ...base, metodos: exact ? ['exata'] : ['nenhum'],
      q: `A equação abaixo é exata? ${T(eqC)}`,
      steps: [
        `Teste de exatidão: com $${AZ('M')}\\,dx + ${VD('N')}\\,dy = 0$, a equação é exata se e só se $${AZ('M_y')} = ${VD('N_x')}$.`,
        `$${AZ('M_y')} = \\frac{\\partial}{\\partial y}\\left(${AZ(M)}\\right) = ${AZ(My)}$`,
        `$${VD('N_x')} = \\frac{\\partial}{\\partial x}\\left(${VD(N)}\\right) = ${VD(Nx)}$`,
        exact ? `São iguais: <b>é exata</b>, e $${AM('\\psi(x, y)')} = ${psiC} = C$.` : `São diferentes: <b>não é exata</b> (seria preciso um fator integrante).`,
      ],
      ans: { kind: 'choice', options: ['Sim, é exata', 'Não é exata'], correct: exact ? 0 : 1 },
    };
  }
  return {
    ...base,
    q: `Verifique que a equação é exata e encontre $\\psi(x, y)$ tal que a solução seja $\\psi(x, y) = C$: ${T(eqC)}<br><span class="c-muted">Digite só $\\psi$ (a constante não importa).</span>`,
    steps: [
      `$${AZ('M')} = ${AZ(M)}$ e $${VD('N')} = ${VD(N)}$.`,
      `$${AZ('M_y')} = ${AZ(My)} = ${VD('N_x')}$: é exata, então existe $${AM('\\psi')}$ com $${AM('\\psi')}_x = ${AZ('M')}$ e $${AM('\\psi')}_y = ${VD('N')}$.`,
      `Integre ${T(AZ('M'))} em $x$ (com $y$ fixo): $${AM('\\psi')} = \\int ${AZ('M')}\\,dx = ${AM(intM)} + ${RX('h(y)')}$.`,
      `Derive em $y$ e iguale a ${T(VD('N'))}: tudo bate, menos $${RX("h'(y)")} = ${RX(hp)}$, logo $${RX('h(y)')} = ${RX(hy)}$.`,
      `$${AM('\\psi(x, y)')} = ${psiC} = C$`,
    ],
    ans: { kind: 'potential', vars: ['x', 'y'], f: e => fpsi(e.x, e.y), domain: { x: [0.2, 1.6], y: [-1.2, 1.4] }, tex: psi },
    spec: {
      type: 'exact', psi: fpsi,
      M: (x, y) => cs[0] * mixed[0].fM(x, y) + cs[1] * mixed[1].fM(x, y) + cs[2] * tx.fM(x),
      N: (x, y) => cs[0] * mixed[0].fN(x, y) + cs[1] * mixed[1].fN(x, y) + cs[3] * ty.fN(y),
    },
  };
}

// pedaços com singularidades para o Teorema de Existência e Unicidade
const fmtNum = v => {
  if (v === Infinity) return '\\infty';
  if (v === -Infinity) return '-\\infty';
  const k = Math.round(v / (Math.PI / 2));
  if (Math.abs(v - k * Math.PI / 2) < 1e-9 && k !== 0 && Math.abs(v) > 1.4) {
    const fr = q(k, 2);
    const s = fr.d === 1 ? `${fr.n === 1 ? '' : fr.n === -1 ? '-' : fr.n}\\pi` : `${fr.n < 0 ? '-' : ''}\\frac{${Math.abs(fr.n) === 1 ? '' : Math.abs(fr.n)}\\pi}{2}`;
    return s;
  }
  return String(v);
};
function teuPiece(r) {
  const a = nz(r, -3, 3);
  return pk(r, [
    { tex: `\\frac{1}{x ${a < 0 ? '+' : '-'} ${Math.abs(a)}}`, sing: [a], why: `$x = ${a}$ zera o denominador` },
    { tex: '\\operatorname{tg} x', sing: [-3, -1, 1, 3].map(k => (k * Math.PI) / 2), why: '$\\operatorname{tg} x$ não existe em $x = \\pm\\frac{\\pi}{2}, \\pm\\frac{3\\pi}{2}, \\dots$' },
    { tex: `\\ln(x ${a < 0 ? '+' : '-'} ${Math.abs(a)})`, from: a, why: `$\\ln$ exige $x > ${a}$` },
    { tex: `\\frac{1}{x^2 - ${a * a}}`, sing: [-Math.abs(a), Math.abs(a)], why: `$x = \\pm ${Math.abs(a)}$ zera o denominador` },
    { tex: `\\sqrt{${a} - x}`, upTo: a, why: `a raiz exige $x \\le ${a}$ (e no extremo a derivada não existe)` },
  ]);
}
const SMOOTH = ['e^x', 'x^2', '\\cos x', '3', 'x'];

function genTeu(r) {
  if (r() < 0.3) {
    // não linear: f e ∂f/∂y no ponto inicial
    const kind = pk(r, [
      { f: 'y^{1/3}', fy: '\\frac{1}{3}y^{-2/3}', bad: 0 },
      { f: '\\sqrt{y}', fy: '\\frac{1}{2\\sqrt{y}}', bad: 0, onlyPos: true },
      { f: '3|y|^{2/3}', fy: '2\\,\\text{sgn}(y)|y|^{-1/3}', bad: 0 },
      { f: 'x\\,y^{2/3}', fy: '\\frac{2x}{3}y^{-1/3}', bad: 0 },
      { f: 'y^2 + x', fy: '2y', bad: null },
    ]);
    const y0 = kind.bad === null ? ri(r, -2, 2) : r() < 0.6 ? 0 : pk(r, [1, 2, 4, 8]);
    const x0 = ri(r, -1, 2);
    const ok = kind.bad === null || y0 !== kind.bad;
    const eq = `y' = ${kind.f},\\quad y(${x0}) = ${y0}`;
    return {
      skill: 'teu', metodos: [],
      eq,
      q: `O Teorema de Existência e Unicidade garante solução <b>única</b> para ${T(`y' = ${AZ(kind.f)},\\quad y(${RS(x0)}) = ${RS(y0)}`)}?`,
      legend: leg(['azul', 'f(x, y)'], ['verde', '\\partial f/\\partial y'], ['rosa', '(x_0, y_0)']),
      steps: [
        `O teorema pede $${AZ('f(x, y)')}$ e $${VD('\\frac{\\partial f}{\\partial y}')}$ contínuas num retângulo em volta de $(x_0, y_0) = (${RS(x0)}, ${RS(y0)})$.`,
        `$${AZ('f')} = ${AZ(kind.f)}$ é contínua${kind.onlyPos ? ' (onde está definida, $y \\ge 0$)' : ''}; $${VD('\\frac{\\partial f}{\\partial y}')} = ${VD(kind.fy)}$.`,
        ok ? `Em $y_0 = ${RS(y0)}$ as duas são contínuas: <b>existe e é única</b> (localmente).`
          : `Em $y_0 = ${RS(0)}$ a ${T(VD('\\partial f/\\partial y'))} explode: o teorema <b>não garante unicidade</b>. De fato, $y \\equiv 0$ é solução e há outras que saem do equilíbrio.`,
      ],
      ans: { kind: 'choice', options: ['Sim: $f$ e $\\partial f/\\partial y$ são contínuas perto do ponto inicial', 'Não: $\\partial f/\\partial y$ não é contínua no ponto inicial, então a unicidade não é garantida', 'Não: $f$ não é contínua no ponto inicial, então nem a existência é garantida'], correct: ok ? 0 : 1, shuffle: false },
    };
  }
  // linear: y' + p(x) y = q(x); o intervalo é o maior aberto em volta de x0 onde p e q são contínuas
  const P = teuPiece(r);
  let Qp = r() < 0.5 ? teuPiece(r) : { tex: pk(r, SMOOTH) };
  const cuts = [], pieces = [P, Qp];
  let lo0 = -Infinity, hi0 = Infinity;
  for (const pc of pieces) {
    if (pc.sing) cuts.push(...pc.sing);
    if (pc.from !== undefined) lo0 = Math.max(lo0, pc.from);
    if (pc.upTo !== undefined) hi0 = Math.min(hi0, pc.upTo);
  }
  if (lo0 >= hi0) return genTeu(r);
  // pontos de corte dentro do domínio
  const pts = [...new Set([lo0, ...cuts.filter(c => c > lo0 && c < hi0), hi0])].sort((a, b) => a - b);
  const comps = [];
  for (let i = 0; i + 1 < pts.length; i++) comps.push([pts[i], pts[i + 1]]);
  const usable = comps.filter(([a, b]) => b - a > 0.3);
  if (!usable.length) return genTeu(r);
  const [ca, cb] = pk(r, usable);
  // x0: inteiro dentro do componente (ou meio do intervalo)
  const ints = [];
  for (let k = Math.ceil(Math.max(ca, -4) + 1e-9); k <= Math.floor(Math.min(cb, 4) - 1e-9); k++) if (k > ca && k < cb) ints.push(k);
  const x0 = ints.length ? pk(r, ints) : null;
  if (x0 === null) return genTeu(r);
  const y0 = ri(r, -2, 3);
  const iv = ([a, b]) => `(${fmtNum(a)}, ${fmtNum(b)})`;
  const right = iv([ca, cb]);
  const opts = new Set([right]);
  for (const c of comps) opts.add(iv(c));
  opts.add('(-\\infty, \\infty)');
  if (ca !== -Infinity) opts.add(iv([-Infinity, cb]));
  if (cb !== Infinity) opts.add(iv([ca, Infinity]));
  const options = [...opts].slice(0, 4);
  if (!options.includes(right)) options[3] = right;
  const eq = `y' + ${P.tex}\\,y = ${Qp.tex},\\quad y(${x0}) = ${y0}`;
  const why = pieces.filter(pc => pc.why).map(pc => pc.why).join('; ');
  return {
    skill: 'teu', metodos: ['linear'],
    eq,
    q: `Sem resolver, qual é o maior intervalo em que o TEU garante que o PVI tem solução única? ${T(`y' + ${AZ(P.tex)}\\,y = ${VD(Qp.tex)},\\quad y(${RS(x0)}) = ${y0}`)}`,
    legend: leg(['azul', 'p(x)'], ['verde', 'q(x)'], ['rosa', 'x_0'], ['amarelo', '\\text{intervalo}']),
    steps: [
      `Para a linear $y' + ${AZ('p(x)')}\\,y = ${VD('q(x)')}$, a solução existe e é única no <b>maior intervalo aberto que contém $x_0$</b> onde ${T(AZ('p'))} e ${T(VD('q'))} são contínuas.`,
      `Onde $${AZ('p')} = ${AZ(P.tex)}$ e $${VD('q')} = ${VD(Qp.tex)}$ deixam de ser contínuas: ${why}.`,
      `Esses pontos picam a reta em intervalos; o que contém $x_0 = ${RS(x0)}$ é $${AM(right)}$.`,
    ],
    ans: { kind: 'choice', options: options.map(o => `$${o}$`), correct: options.indexOf(right) },
  };
}

function genAutonoma(r) {
  let a = ri(r, -3, 2), b = ri(r, -2, 3);
  if (a === b) b = a + 2;
  const semi = r() < 0.3, s = pk(r, [1, -1]);
  const g = y => (semi ? (y - a) ** 2 * (y - b) : s * (y - a) * (y - b));
  const fa = y => `\\left(y ${y < 0 ? '+' : '-'} ${Math.abs(y)}\\right)`.replace('\\left(y - 0\\right)', 'y').replace('\\left(y + 0\\right)', 'y');
  const rhs = semi ? `${fa(a)}^2${fa(b)}` : `${s < 0 ? '-' : ''}${fa(a)}${fa(b)}`;
  const eqs = [a, b].sort((u, v) => u - v);
  const cE = e => (e === eqs[0] ? AZ : VD);
  const rhsC = semi ? `${cE(a)(fa(a))}^2${cE(b)(fa(b))}` : `${s < 0 ? '-' : ''}${cE(a)(fa(a))}${cE(b)(fa(b))}`;
  const E0 = AZ(eqs[0]), E1 = VD(eqs[1]);
  const cls = e => {
    const L = Math.sign(g(e - 1e-3)), R = Math.sign(g(e + 1e-3));
    return L > 0 && R < 0 ? 'estável' : L < 0 && R > 0 ? 'instável' : 'semiestável';
  };
  const signs = [eqs[0] - 1, (eqs[0] + eqs[1]) / 2, eqs[1] + 1].map(y => (g(y) > 0 ? '+' : '-'));
  const lines = `sinal de $g(y)$: ${signs[0]} abaixo de $${E0}$, ${signs[1]} entre $${E0}$ e $${E1}$, ${signs[2]} acima de $${E1}$`;
  if (r() < 0.5) {
    const right = `$y = ${E0}$ ${cls(eqs[0])}, $y = ${E1}$ ${cls(eqs[1])}`;
    const all = ['estável', 'instável', 'semiestável'];
    const options = new Set([right]);
    while (options.size < 4) options.add(`$y = ${E0}$ ${pk(r, all)}, $y = ${E1}$ ${pk(r, all)}`);
    const list = [...options];
    return {
      skill: 'autonoma', metodos: ['separavel'],
      eq: `y' = ${rhs}`,
      q: `Classifique os equilíbrios de ${T(`y' = ${rhsC}`)}`,
      legend: leg(['azul', `y = ${eqs[0]}`], ['verde', `y = ${eqs[1]}`]),
      steps: [
        `Equilíbrios: cada fator que zera dá um, $y = ${E0}$ e $y = ${E1}$.`,
        `Faça a linha de fase: ${lines}.`,
        `Setas apontando para o equilíbrio dos dois lados: estável; saindo dos dois lados: instável; uma entra e outra sai: semiestável.`,
        `Resposta: ${right}.`,
      ],
      ans: { kind: 'choice', options: list, correct: list.indexOf(right) },
    };
  }
  const y0 = pk(r, [eqs[0] - 1, (eqs[0] + eqs[1]) / 2, eqs[1] + 1]);
  const gy = g(y0);
  const lim = gy > 0 ? (y0 < eqs[0] ? eqs[0] : y0 < eqs[1] ? eqs[1] : Infinity) : (y0 > eqs[1] ? eqs[1] : y0 > eqs[0] ? eqs[0] : -Infinity);
  const opt = [`$${E0}$`, `$${E1}$`, '$+\\infty$', '$-\\infty$'];
  const correct = lim === eqs[0] ? 0 : lim === eqs[1] ? 1 : lim === Infinity ? 2 : 3;
  const y0t = String(y0).replace('.', '{,}');
  return {
    skill: 'autonoma', metodos: ['separavel'],
    eq: `y' = ${rhs}`,
    q: `Para ${T(`y' = ${rhsC},\\quad y(0) = ${RS(y0t)}`)}, o que acontece com $y(t)$ quando $t$ cresce?`,
    legend: leg(['azul', `y = ${eqs[0]}`], ['verde', `y = ${eqs[1]}`], ['rosa', 'y_0']),
    steps: [
      `Equilíbrios: $y = ${E0}$ e $y = ${E1}$. As soluções não podem cruzá-los (unicidade).`,
      `${lines[0].toUpperCase()}${lines.slice(1)}.`,
      `Em $y_0 = ${RS(y0t)}$ temos $g(y_0) ${gy > 0 ? '> 0' : '< 0'}$: $y$ ${gy > 0 ? 'cresce' : 'decresce'} ${Number.isFinite(lim) ? `e se aproxima de $${cE(lim)(lim)}$ sem nunca alcançá-lo` : `sem limite (${lim > 0 ? '+' : '-'}∞; pode até explodir em tempo finito)`}.`,
    ],
    ans: { kind: 'choice', options: opt, correct, shuffle: false },
  };
}

// ---------- P2: lineares de 2ª ordem ----------

function genWronskiano(r) {
  const kind = pk(r, ['exps', 'dupla', 'trig', 'pot', 'amort', 'ld']);
  let y1, y2, f1, f2, W, fW, why, d1 = null, d2 = null;
  const dE = a => (a === 0 ? '0' : kv(a, ex(a, 'x')));
  if (kind === 'exps') {
    const a = ri(r, -3, 3); let b; do b = ri(r, -3, 3); while (b === a);
    y1 = a === 0 ? '1' : ex(a, 'x'); y2 = b === 0 ? '1' : ex(b, 'x'); f1 = x => Math.exp(a * x); f2 = x => Math.exp(b * x);
    d1 = dE(a); d2 = dE(b);
    ({ tex: W } = lin([[b - a, a + b === 0 ? '' : ex(a + b, 'x')]])); fW = x => (b - a) * Math.exp((a + b) * x);
    why = `$W = ${y1}\\cdot ${kv(b, ex(b, 'x'))} - ${kv(a, ex(a, 'x'))}\\cdot ${y2}$`;
  } else if (kind === 'dupla') {
    const a = nz(r, -3, 3);
    y1 = ex(a, 'x'); y2 = `x${ex(a, 'x')}`; f1 = x => Math.exp(a * x); f2 = x => x * Math.exp(a * x);
    d1 = dE(a); d2 = `(1 ${a < 0 ? '-' : '+'} ${kv(Math.abs(a), 'x')})${ex(a, 'x')}`;
    W = ex(2 * a, 'x'); fW = x => Math.exp(2 * a * x);
    why = `$y_2' = (1 + ${kv(a, 'x')})${ex(a, 'x')}$, então $W = ${y1}(1 + ${kv(a, 'x')})${ex(a, 'x')} - ${kv(a, ex(a, 'x'))}\\cdot x${ex(a, 'x')}$`;
  } else if (kind === 'trig') {
    const k = pk(r, [1, 2, 3, 4]);
    y1 = cos(k, 'x'); y2 = sen(k, 'x'); f1 = x => Math.cos(k * x); f2 = x => Math.sin(k * x);
    d1 = kv(-k, sen(k, 'x')); d2 = kv(k, cos(k, 'x'));
    W = String(k); fW = () => k;
    why = `$W = ${y1}\\cdot ${kv(k, cos(k, 'x'))} + ${kv(k, sen(k, 'x'))}\\cdot ${y2} = ${k}(\\cos^2 + \\operatorname{sen}^2)$`;
  } else if (kind === 'pot') {
    const m = pk(r, [1, 2, 3]); let n; do n = pk(r, [2, 3, 4, -1]); while (n === m);
    const px = e => (e === 1 ? 'x' : `x^{${e}}`);
    y1 = px(m); y2 = px(n); f1 = x => x ** m; f2 = x => x ** n;
    d1 = m === 1 ? '1' : kv(m, px(m - 1)); d2 = n === 1 ? '1' : kv(n, px(n - 1));
    const e = m + n - 1;
    W = lin([[n - m, e === 0 ? '' : px(e)]]).tex; fW = x => (n - m) * x ** e;
    why = `$y_1y_2' - y_1'y_2 = ${n}x^{${e}} - ${m}x^{${e}}$`;
  } else if (kind === 'amort') {
    const a = nz(r, -2, 2), b = pk(r, [1, 2, 3]);
    y1 = `${ex(a, 'x')}${cos(b, 'x')}`; y2 = `${ex(a, 'x')}${sen(b, 'x')}`;
    f1 = x => Math.exp(a * x) * Math.cos(b * x); f2 = x => Math.exp(a * x) * Math.sin(b * x);
    W = lin([[b, ex(2 * a, 'x')]]).tex; fW = x => b * Math.exp(2 * a * x);
    why = `Fatorando $e^{${2 * a}x}$, sobra o Wronskiano de $${cos(b, 'x')}$ e $${sen(b, 'x')}$, que é $${b}$`;
  } else {
    const a = nz(r, -3, 3), c = pk(r, [2, 3, -1, 5]);
    y1 = ex(a, 'x'); y2 = lin([[c, ex(a, 'x')]]).tex; f1 = x => Math.exp(a * x); f2 = x => c * Math.exp(a * x);
    d1 = dE(a); d2 = lin([[c * a, ex(a, 'x')]]).tex;
    W = '0'; fW = () => 0;
    why = `$y_2 = ${c}\\,y_1$: uma é múltipla da outra, então as colunas do determinante são proporcionais`;
  }
  return {
    skill: 'wronskiano', metodos: [],
    eq: `y_1 = ${y1},\\ y_2 = ${y2}`,
    q: `Calcule o Wronskiano $W(y_1, y_2)(x)$ de ${T(`${AZ('y_1')} = ${AZ(y1)}`)} e ${T(`${VD('y_2')} = ${VD(y2)}`)}. Elas são linearmente independentes?`,
    legend: leg(['azul', 'y_1,\\ y_1\''], ['verde', 'y_2,\\ y_2\''], ['amarelo', 'W']),
    steps: [
      `Definição: $${AM('W')} = \\begin{vmatrix} ${AZ('y_1')} & ${VD('y_2')} \\\\ ${AZ("y_1'")} & ${VD("y_2'")} \\end{vmatrix} = ${AZ('y_1')}${VD("y_2'")} - ${AZ("y_1'")}${VD('y_2')}$.`,
      d1 !== null
        ? `Derive e preencha: $${AM('W')} = \\begin{vmatrix} ${AZ(y1)} & ${VD(y2)} \\\\ ${AZ(d1)} & ${VD(d2)} \\end{vmatrix} = ${AZ(par(y1))}\\cdot ${VD(par(d2))} - ${AZ(par(d1))}\\cdot ${VD(par(y2))}$.`
        : `${why}.`,
      `$${AM('W(x)')} = ${AM(W)}$. ${W === '0' ? 'Como $W \\equiv 0$, são <b>linearmente dependentes</b>.' : 'Como $W \\ne 0$, são <b>linearmente independentes</b> (formam um conjunto fundamental).'}`,
    ],
    ans: { kind: 'expr', vars: ['x'], f: e => fW(e.x), domain: { x: [0.2, 1.5] }, tex: W },
    spec: { type: 'wronskian', f1, f2, W: fW },
  };
}

function randomRoots(r, allowHalf = true) {
  const t = pk(r, ['reais', 'reais', 'dupla', 'complexas', 'complexas']);
  if (t === 'reais') { const r1 = ri(r, -4, 3); let r2; do r2 = ri(r, -4, 4); while (r2 === r1); return { type: 'reais', r1, r2 }; }
  if (t === 'dupla') return { type: 'dupla', r: allowHalf && r() < 0.3 ? q(pk(r, [3, -3, 1, -1, 5]), 2) : q(nz(r, -3, 3)) };
  return { type: 'complexas', a: ri(r, -3, 2), b: pk(r, [1, 2, 3]) };
}

function genHomogenea2(r) {
  const roots = randomRoots(r);
  const cp = charPoly(roots);
  const eqL = odeLhs(cp);
  if (r() < 0.3) {
    // forma da solução geral (múltipla escolha)
    const alt = [
      roots,
      roots.type === 'reais' ? { type: 'dupla', r: q(roots.r1) } : roots.type === 'dupla' ? { type: 'reais', r1: roots.r.n, r2: -roots.r.n } : { type: 'reais', r1: roots.a, r2: roots.b },
      roots.type === 'complexas' ? { type: 'complexas', a: roots.b, b: Math.abs(roots.a) || 1 } : { type: 'complexas', a: 0, b: roots.type === 'reais' ? Math.abs(roots.r1) || 1 : Math.abs(roots.r.n) },
      roots.type === 'reais' ? { type: 'reais', r1: -roots.r1, r2: -roots.r2 } : roots.type === 'dupla' ? { type: 'dupla', r: roots.r.neg() } : { type: 'complexas', a: -roots.a, b: roots.b },
    ];
    const options = [...new Set(alt.map(x => `$y = ${homogTex(x)}$`))];
    if (options.length < 3) return genHomogenea2(r);
    return {
      skill: 'homogenea2', metodos: ['caracteristica'],
      eq: `${eqL} = 0`,
      q: `Qual é a solução geral de ${T(`${eqL} = 0`)}?`,
      legend: leg(['azul', roots.type === 'complexas' ? '\\alpha' : 'r_1'], ['verde', roots.type === 'complexas' ? '\\beta' : 'r_2']),
      steps: [
        `Tente $y = e^{rx}$: chega-se à equação característica $${poly(cp, 'r')} = 0$.`,
        `Raízes: $${rootsTexC(roots)}$.`,
        roots.type === 'reais' ? `Duas raízes reais distintas: $c_1e^{${AZ('r_1')}x} + c_2e^{${VD('r_2')}x}$.` : roots.type === 'dupla' ? `Raiz dupla: $(c_1 + c_2x)e^{${AZ('r')}x}$; a segunda solução ganha um fator $x$.` : `Raízes $${AZ('\\alpha')} \\pm ${VD('\\beta')} i$: $e^{${AZ('\\alpha')}x}(c_1\\cos ${VD('\\beta')}x + c_2\\operatorname{sen} ${VD('\\beta')}x)$.`,
        `$y = ${homogTexC(roots)}$`,
      ],
      ans: { kind: 'choice', options, correct: 0 },
    };
  }
  const y0 = ri(r, -2, 3), y1 = ri(r, -3, 3);
  let y, yC, consts;
  if (roots.type === 'reais') {
    const { r1, r2 } = roots;
    const c2 = q(y1 - r1 * y0, r2 - r1), c1 = q(y0).sub(c2);
    y = lin([[c1, r1 === 0 ? '' : ex(r1, 'x'), x => Math.exp(r1 * x)], [c2, r2 === 0 ? '' : ex(r2, 'x'), x => Math.exp(r2 * x)]]);
    yC = lin([[c1, r1 === 0 ? '' : `e^{${AZ(kv(r1, 'x'))}}`, null, RX], [c2, r2 === 0 ? '' : `e^{${VD(kv(r2, 'x'))}}`, null, LR]]).tex;
    consts = `$y(0) = ${RX('c_1')} + ${LR('c_2')} = ${RS(y0)}$ e $y'(0) = ${AZ(r1)}${RX('c_1')} + ${VD(par(r2))}${LR('c_2')} = ${RS(y1)}$, logo $${RX('c_1')} = ${RX(c1.tex())}$, $${LR('c_2')} = ${LR(c2.tex())}$.`;
  } else if (roots.type === 'dupla') {
    const rr = roots.r, c2 = q(y1).sub(rr.mul(y0));
    const inner = lin([[y0, '', null], [c2, 'x', x => x]]);
    const wrap = inner.tex.includes(' ') ? `\\left(${inner.tex}\\right)` : inner.tex;
    const tex = inner.tex === '0' ? '0' : inner.tex === '1' ? ex(rr, 'x') : `${wrap}${ex(rr, 'x')}`;
    y = { tex, f: x => inner.f(x) * Math.exp(rr.v * x) };
    const innerC = lin([[y0, '', null, RX], [c2, 'x', null, LR]]).tex;
    yC = innerC === '0' ? '0' : `\\left(${innerC}\\right)e^{${AZ(kv(rr, 'x'))}}`;
    consts = `$${RX('c_1')} = y(0) = ${RS(y0)}$ e $y'(0) = ${AZ(rr.tex())}${RX('c_1')} + ${LR('c_2')} = ${RS(y1)}$, logo $${LR('c_2')} = ${LR(c2.tex())}$.`;
  } else {
    const { a, b } = roots, c2 = q(y1 - a * y0, b);
    const inner = lin([[y0, cos(b, 'x'), x => Math.cos(b * x)], [c2, sen(b, 'x'), x => Math.sin(b * x)]]);
    const e = a === 0 ? '' : ex(a, 'x');
    const tex = inner.tex === '0' ? '0' : e ? `${e}\\left(${inner.tex}\\right)` : inner.tex;
    y = { tex, f: x => Math.exp(a * x) * inner.f(x) };
    const bb = VD(kv(b, 'x'));
    const innerC = lin([[y0, `\\cos(${bb})`, null, RX], [c2, `\\operatorname{sen}(${bb})`, null, LR]]).tex;
    yC = innerC === '0' ? '0' : a === 0 ? innerC : `e^{${AZ(kv(a, 'x'))}}\\left(${innerC}\\right)`;
    consts = `$${RX('c_1')} = y(0) = ${RS(y0)}$ e $y'(0) = ${AZ(a)}${RX('c_1')} + ${VD(b)}${LR('c_2')} = ${RS(y1)}$, logo $${LR('c_2')} = ${LR(c2.tex())}$.`;
  }
  const eq = `${eqL} = 0,\\quad y(0) = ${y0},\\ y'(0) = ${y1}`;
  return {
    skill: 'homogenea2', metodos: ['caracteristica'],
    eq,
    q: `Resolva o PVI: ${T(`${eqL} = 0,\\quad y(0) = ${RS(y0)},\\ y'(0) = ${RS(y1)}`)}`,
    legend: leg(['azul', roots.type === 'complexas' ? '\\alpha' : 'r_1'], ['verde', roots.type === 'complexas' ? '\\beta' : 'r_2'], ['roxo', 'c_1'], ['laranja', 'c_2'], ['rosa', 'y(0),\\ y\'(0)']),
    steps: [
      `Troque $y$ por $e^{rx}$: equação característica $${poly(cp, 'r')} = 0$.`,
      `Raízes: $${rootsTexC(roots)}$.`,
      `Solução geral: $y = ${homogTexC(roots)}$.`,
      consts,
      `$y(x) = ${yC}$`,
    ],
    ans: { kind: 'expr', vars: ['x'], f: e => y.f(e.x), domain: { x: [-1, 1.5] }, tex: y.tex },
    spec: { type: 'ode2', a: cp, g: () => 0, x0: 0, ic: [y0, y1], sol: y.f },
  };
}

function genCoefIndet(r) {
  // homogênea: raízes reais distintas não nulas ou imaginárias puras
  const hom = r() < 0.6 ? (() => { const r1 = nz(r, -3, 3); let r2; do r2 = nz(r, -3, 3); while (r2 === r1); return { type: 'reais', r1, r2 }; })()
    : { type: 'complexas', a: 0, b: pk(r, [1, 2, 3]) };
  const [, b, c] = charPoly(hom);
  const P = k => k * k + b * k + c;
  const kind = pk(r, ['poli', 'exp', 'exp', 'trig', 'trig']);
  let g, gtex, guess, guessWrong, yp, solve;
  if (kind === 'poli') {
    const deg = pk(r, [1, 2]);
    const g2 = deg === 2 ? nz(r, -3, 4) * Math.abs(c) : 0, g1 = ri(r, -3, 3) * Math.abs(c), g0 = ri(r, -4, 4);
    gtex = lin([[g2, 'x^2'], [g1, 'x'], [g0, '']]).tex;
    if (gtex === '0') return genCoefIndet(r);
    g = x => g2 * x * x + g1 * x + g0;
    const A = q(g2, c), B = q(g1).sub(A.mul(2 * b)).div(c), C = q(g0).sub(B.mul(b)).sub(A.mul(2)).div(c);
    yp = lin([[A, 'x^2', x => x * x], [B, 'x', x => x], [C, '', null]]);
    guess = deg === 2 ? 'Ax^2 + Bx + C' : 'Ax + B';
    guessWrong = [deg === 2 ? 'Ax^2' : 'Ax', deg === 2 ? 'x(Ax^2 + Bx + C)' : 'x(Ax + B)', 'Ae^{x}'];
    if (deg === 1) { const B1 = q(g1, c), C1 = q(g0).sub(B1.mul(b)).div(c); yp = lin([[B1, 'x', x => x], [C1, '', null]]); }
    solve = deg === 2
      ? `coeficientes de $x^2$, $x$ e constante: $${lin([[c, 'A']]).tex} = ${g2}$, $${lin([[c, 'B'], [2 * b, 'A']]).tex} = ${g1}$, $${lin([[c, 'C'], [b, 'B'], [2, 'A']]).tex} = ${g0}$`
      : `coeficientes de $x$ e constante: $${lin([[c, 'A']]).tex} = ${g1}$ e $${lin([[c, 'B'], [b, 'A']]).tex} = ${g0}$`;
  } else if (kind === 'exp') {
    const roots = hom.type === 'reais' ? [hom.r1, hom.r2] : [];
    const res = roots.length && r() < 0.45;
    const k = res ? pk(r, roots) : (() => { let kk; do kk = nz(r, -3, 3); while (roots.includes(kk)); return kk; })();
    const G = nz(r, -4, 6);
    gtex = lin([[G, ex(k, 'x')]]).tex;
    g = x => G * Math.exp(k * x);
    if (!res) {
      const A = q(G, P(k));
      yp = lin([[A, ex(k, 'x'), x => Math.exp(k * x)]]);
      guess = `A${ex(k, 'x')}`; guessWrong = [`Ax${ex(k, 'x')}`, `Ax^2${ex(k, 'x')}`, `A${cos(1, 'x')} + B${sen(1, 'x')}`];
      solve = `com $y_p = A${ex(k, 'x')}$ sobra $(k^2 + bk + c)A = G$, isto é, $${P(k)}A = ${G}$`;
    } else {
      const A = q(G, 2 * k + b);
      yp = lin([[A, `x${ex(k, 'x')}`, x => x * Math.exp(k * x)]]);
      guess = `Ax${ex(k, 'x')}`; guessWrong = [`A${ex(k, 'x')}`, `Ax^2${ex(k, 'x')}`, `(Ax + B)${ex(-k, 'x')}`];
      solve = `$${k}$ é raiz da característica, então $A${ex(k, 'x')}$ resolve a homogênea e o chute ganha um $x$. Substituindo, só sobra $(2k + b)A = ${2 * k + b}A = ${G}$`;
    }
  } else {
    const res = hom.type === 'complexas' && r() < 0.55;
    const k = res ? hom.b : (() => { let kk; do kk = pk(r, [1, 2, 3, 4]); while (hom.type === 'complexas' && kk === hom.b); return kk; })();
    const G = nz(r, -4, 6), isCos = r() < 0.5;
    gtex = lin([[G, isCos ? cos(k, 'x') : sen(k, 'x')]]).tex;
    g = x => G * (isCos ? Math.cos(k * x) : Math.sin(k * x));
    if (!res) {
      // (c − k²)A + bkB = Gc ; −bkA + (c − k²)B = Gs
      const Gc = isCos ? G : 0, Gs = isCos ? 0 : G, m = c - k * k, n = b * k, det = m * m + n * n;
      const A = q(Gc * m - n * Gs, det), B = q(m * Gs + n * Gc, det);
      yp = lin([[A, cos(k, 'x'), x => Math.cos(k * x)], [B, sen(k, 'x'), x => Math.sin(k * x)]]);
      guess = `A${cos(k, 'x')} + B${sen(k, 'x')}`; guessWrong = [isCos ? `A${cos(k, 'x')}` : `A${sen(k, 'x')}`, `x\\left(A${cos(k, 'x')} + B${sen(k, 'x')}\\right)`, `A${ex(k, 'x')}`];
      solve = `coeficientes de $\\cos$ e de $\\operatorname{sen}$: $${lin([[m, 'A'], [n, 'B']]).tex} = ${Gc}$ e $${lin([[-n, 'A'], [m, 'B']]).tex} = ${Gs}$`;
    } else {
      yp = isCos ? lin([[q(G, 2 * k), `x${sen(k, 'x')}`, x => x * Math.sin(k * x)]]) : lin([[q(-G, 2 * k), `x${cos(k, 'x')}`, x => x * Math.cos(k * x)]]);
      guess = `x\\left(A${cos(k, 'x')} + B${sen(k, 'x')}\\right)`; guessWrong = [`A${cos(k, 'x')} + B${sen(k, 'x')}`, isCos ? `A${cos(k, 'x')}` : `A${sen(k, 'x')}`, `Ax^2${cos(k, 'x')}`];
      solve = `ressonância ($${cos(k, 'x')}$ e $${sen(k, 'x')}$ já resolvem a homogênea, por isso o fator $x$); sobra $${2 * k}B = ${isCos ? G : 0}$ e $${-2 * k}A = ${isCos ? 0 : G}$`;
    }
  }
  const eqL = odeLhs([1, b, c]);
  const eq = `${eqL} = ${gtex}`;
  // A, B, C (incógnitas do chute) com cor própria em todo lugar onde aparecem
  const abc = str => str.replace(/(?<![A-Za-z\\])([ABC])(?![A-Za-z])/g, (m0, L) => ({ A: RX, B: LR, C: RS })[L](L));
  const base = {
    skill: 'coefIndet', metodos: ['coef', 'variacao'], eq,
    legend: leg(['azul', 'y_h'], ['verde', 'g(x)'], ['amarelo', 'y_p'], ['roxo', 'A'], ['laranja', 'B'], ['rosa', 'C']),
    steps: [
      `Homogênea: característica $${poly([1, b, c], 'r')} = 0$, raízes $${rootsTex(hom)}$, então $${AZ('y_h')} = ${AZ(homogTex(hom))}$.`,
      `Chute pela forma de $${VD('g(x)')} = ${VD(gtex)}$: $${AM('y_p')} = ${abc(guess)}$ (compare com $${AZ('y_h')}$: se algum termo do chute já resolve a homogênea, multiplique por $x$).`,
      `Substitua $${AM('y_p')}$ na equação e iguale a $${VD('g')}$: ${abc(solve)}.`,
      `$${AM('y_p')} = ${AM(yp.tex)}$`,
      `Solução geral: $y = ${AZ('y_h')} + ${AM('y_p')} = ${AZ(homogTex(hom))} ${yp.tex.startsWith('-') ? `- ${AM(yp.tex.slice(1))}` : `+ ${AM(yp.tex)}`}$.`,
    ],
  };
  if (r() < 0.35) {
    const options = [`$${guess}$`, ...guessWrong.map(w => `$${w}$`)];
    return {
      ...base,
      q: `Pelo método dos coeficientes a determinar, qual é a forma correta do chute para $y_p$ em ${T(`${eqL} = ${VD(gtex)}`)}?`,
      ans: { kind: 'choice', options, correct: 0 },
    };
  }
  return {
    ...base,
    q: `Encontre uma solução particular $y_p$ de ${T(`${eqL} = ${VD(gtex)}`)}`,
    ans: { kind: 'ode', vars: ['x'], a: [1, b, c], g, v: 'x', domain: { x: [-1, 1.5] }, tex: yp.tex },
    spec: { type: 'particular', a: [1, b, c], g, yp: yp.f },
  };
}

const VP_LEGEND = leg(['azul', 'y_1'], ['verde', 'y_2'], ['amarelo', 'W'], ['rosa', 'g(x)'], ['roxo', 'u_1'], ['laranja', 'u_2']);

function genVariacao(r) {
  const kind = pk(r, ['sec', 'csc', 'tan', 'ln', 'x2']);
  const k = pk(r, [1, 1, 2, 3]);
  if (kind === 'ln' || kind === 'x2') {
    const a = pk(r, [1, 2, -1, 3]);
    const cp = [1, -2 * a, a * a];
    const eqL = odeLhs(cp);
    const E = ex(a, 'x');
    const g = kind === 'ln' ? x => Math.exp(a * x) / x : x => Math.exp(a * x) / (x * x);
    const gtex = kind === 'ln' ? `\\frac{${E}}{x}` : `\\frac{${E}}{x^2}`;
    const yp = kind === 'ln' ? { tex: `x${E}\\ln x`, f: x => x * Math.exp(a * x) * Math.log(x) } : { tex: `-${E}\\ln x`, f: x => -Math.exp(a * x) * Math.log(x) };
    return {
      skill: 'variacao', metodos: ['variacao'],
      eq: `${eqL} = ${gtex},\\ x > 0`,
      q: `Encontre uma solução particular de ${T(`${eqL} = ${RS(gtex)},\\quad x > 0`)}`,
      legend: VP_LEGEND,
      steps: [
        `$${RS('g(x)')} = ${RS(gtex)}$ não está na tabela dos coeficientes a determinar: use <b>variação de parâmetros</b>.`,
        `Característica com raiz dupla $r = ${a}$: $${AZ('y_1')} = ${AZ(E)}$, $${VD('y_2')} = ${VD(`x${E}`)}$, e $${AM('W')} = ${AM(ex(2 * a, 'x'))}$.`,
        `$${RX("u_1'")} = -\\frac{${VD('y_2')}\\,${RS('g')}}{${AM('W')}} = -\\frac{${VD(`x${E}`)}\\cdot ${RS(gtex)}}{${AM(ex(2 * a, 'x'))}} = ${RX(kind === 'ln' ? '-1' : '-\\frac{1}{x}')}$ e $${LR("u_2'")} = \\frac{${AZ('y_1')}\\,${RS('g')}}{${AM('W')}} = ${LR(kind === 'ln' ? '\\frac{1}{x}' : '\\frac{1}{x^2}')}$.`,
        `Integrando: $${RX('u_1')} = ${RX(kind === 'ln' ? '-x' : '-\\ln x')}$ e $${LR('u_2')} = ${LR(kind === 'ln' ? '\\ln x' : '-\\frac{1}{x}')}$.`,
        `$y_p = ${RX('u_1')}${AZ('y_1')} + ${LR('u_2')}${VD('y_2')} = ${RX(kind === 'ln' ? '(-x)' : '(-\\ln x)')}${AZ(E)} + ${LR(kind === 'ln' ? '\\ln x' : '\\left(-\\frac{1}{x}\\right)')}\\,${VD(`x${E}`)}$. O termo $${kind === 'ln' ? `-x${E}` : `-${E}`}$ resolve a homogênea e pode ser descartado: $y_p = ${yp.tex}$.`,
      ],
      ans: { kind: 'ode', vars: ['x'], a: cp, g, v: 'x', domain: { x: [0.2, 2.5] }, tex: yp.tex },
      spec: { type: 'particular', a: cp, g, yp: yp.f },
    };
  }
  const K = k * k, cp = [1, 0, K];
  const eqL = odeLhs(cp);
  const C = cos(k, 'x'), S = sen(k, 'x'), kx = kv(k, 'x');
  const k2 = q(1, K), k1 = q(1, k);
  let gtex, g, u1p, u2p, u1, u2, yp, dom;
  if (kind === 'sec') {
    gtex = `\\sec(${kx})`; g = x => 1 / Math.cos(k * x);
    u1p = `-\\frac{${S}\\sec(${kx})}{${k}} = -\\frac{\\operatorname{tg}(${kx})}{${k}}`; u2p = `\\frac{1}{${k}}`;
    u1 = `${kv(k2, `\\ln|${C.trim()}|`)}`; u2 = kv(k1, 'x');
    yp = lin([[k1, `x${S}`, x => x * Math.sin(k * x)], [k2, `${C}\\ln(${C.trim()})`, x => Math.cos(k * x) * Math.log(Math.cos(k * x))]]);
    dom = [-Math.PI / (2 * k) * 0.8, Math.PI / (2 * k) * 0.8];
  } else if (kind === 'csc') {
    gtex = `\\operatorname{cossec}(${kx})`; g = x => 1 / Math.sin(k * x);
    u1p = `-\\frac{1}{${k}}`; u2p = `\\frac{${C}}{${k}${S}}`;
    u1 = kv(k1.neg(), 'x'); u2 = kv(k2, `\\ln|${S.trim()}|`);
    yp = lin([[k1.neg(), `x${C}`, x => x * Math.cos(k * x)], [k2, `${S}\\ln(${S.trim()})`, x => Math.sin(k * x) * Math.log(Math.sin(k * x))]]);
    dom = [Math.PI / k * 0.1, Math.PI / k * 0.9];
  } else {
    gtex = `\\operatorname{tg}(${kx})`; g = x => Math.tan(k * x);
    u1p = `-\\frac{\\operatorname{sen}^2(${kx})}{${k}\\cos(${kx})}`; u2p = `\\frac{${S}}{${k}}`;
    u1 = `${kv(k2.neg(), `\\left(\\ln|\\sec(${kx}) + \\operatorname{tg}(${kx})| - ${S}\\right)`)}`; u2 = kv(k2.neg(), C);
    yp = lin([[k2.neg(), `${C}\\ln\\left(\\sec(${kx}) + \\operatorname{tg}(${kx})\\right)`, x => Math.cos(k * x) * Math.log(1 / Math.cos(k * x) + Math.tan(k * x))]]);
    dom = [-Math.PI / (2 * k) * 0.8, Math.PI / (2 * k) * 0.8];
  }
  return {
    skill: 'variacao', metodos: ['variacao'],
    eq: `${eqL} = ${gtex}`,
    q: `Encontre uma solução particular de ${T(`${eqL} = ${RS(gtex)}`)} (no intervalo em que $g$ é contínua e contém pontos perto de ${kind === 'csc' ? `$\\frac{\\pi}{${2 * k}}$` : '$0$'}).`,
    legend: VP_LEGEND,
    steps: [
      `$${RS('g(x)')} = ${RS(gtex)}$ não é polinômio, exponencial, seno ou cosseno: coeficientes a determinar não funciona. Use <b>variação de parâmetros</b>.`,
      `Da homogênea ($r = \\pm ${k === 1 ? '' : k}i$): $${AZ('y_1')} = ${AZ(C)}$, $${VD('y_2')} = ${VD(S)}$, $${AM('W')} = ${AZ(C)}\\cdot ${VD(kv(k, C))} - ${AZ(kv(-k, S))}\\cdot ${VD(S)} = ${AM(k)}$.`,
      `$${RX("u_1'")} = -\\frac{${VD('y_2')}\\,${RS('g')}}{${AM('W')}} = ${RX(u1p)}$ e $${LR("u_2'")} = \\frac{${AZ('y_1')}\\,${RS('g')}}{${AM('W')}} = ${LR(u2p)}$.`,
      `Integrando: $${RX('u_1')} = ${RX(u1)}$ e $${LR('u_2')} = ${LR(u2)}$.`,
      `$y_p = ${RX('u_1')}${AZ('y_1')} + ${LR('u_2')}${VD('y_2')} = ${RX(`\\left(${u1}\\right)`)}${AZ(C)} + ${LR(`\\left(${u2}\\right)`)}${VD(S)} = ${yp.tex}$${kind === 'tan' ? ' (os termos com sen·cos se cancelam)' : ''}.`,
    ],
    ans: { kind: 'ode', vars: ['x'], a: cp, g, v: 'x', domain: { x: dom }, tex: yp.tex },
    spec: { type: 'particular', a: cp, g, yp: yp.f, domain: dom },
  };
}

// ---------- P3: transformada de Laplace ----------

// pedaços de f(t) com F(s): { f, ftex, F, Ftex, a (abscissa) }
function lapPiece(r, kind) {
  const c = pk(r, [1, 2, 3, -1, 4, 5, -2]);
  const sgn = (n, tex) => ({ neg: n < 0, tex });
  switch (kind) {
    case 'const': return { f: () => c, ftex: [c, ''], F: s => c / s, Ftex: sgn(c, `\\frac{${Math.abs(c)}}{s}`), a: 0, table: '$\\mathcal{L}\\{1\\} = \\frac{1}{s}$' };
    case 'pot': { const n = pk(r, [1, 2, 3]); return { f: t => c * t ** n, ftex: [c, n === 1 ? 't' : `t^{${n}}`], F: s => (c * fact(n)) / s ** (n + 1), Ftex: sgn(c, `\\frac{${Math.abs(c * fact(n))}}{s^{${n + 1}}}`), a: 0, table: `$\\mathcal{L}\\{t^n\\} = \\frac{n!}{s^{n+1}}$` }; }
    case 'exp': { const a = nz(r, -3, 4); return { f: t => c * Math.exp(a * t), ftex: [c, ex(a)], F: s => c / (s - a), Ftex: sgn(c, `\\frac{${Math.abs(c)}}{s ${a < 0 ? '+' : '-'} ${Math.abs(a)}}`), a, table: '$\\mathcal{L}\\{e^{at}\\} = \\frac{1}{s - a}$' }; }
    case 'sen': { const b = pk(r, [1, 2, 3, 4]); return { f: t => c * Math.sin(b * t), ftex: [c, sen(b)], F: s => (c * b) / (s * s + b * b), Ftex: sgn(c, `\\frac{${Math.abs(c * b)}}{s^2 + ${b * b}}`), a: 0, table: '$\\mathcal{L}\\{\\operatorname{sen} bt\\} = \\frac{b}{s^2 + b^2}$' }; }
    case 'cos': { const b = pk(r, [1, 2, 3, 4]); return { f: t => c * Math.cos(b * t), ftex: [c, cos(b)], F: s => (c * s) / (s * s + b * b), Ftex: sgn(c, `\\frac{${kv(Math.abs(c), 's')}}{s^2 + ${b * b}}`), a: 0, table: '$\\mathcal{L}\\{\\cos bt\\} = \\frac{s}{s^2 + b^2}$' }; }
    case 'expsen': { const a = nz(r, -2, 3), b = pk(r, [1, 2, 3]); const den = `(s ${a < 0 ? '+' : '-'} ${Math.abs(a)})^2 + ${b * b}`; return { f: t => c * Math.exp(a * t) * Math.sin(b * t), ftex: [c, `${ex(a)}${sen(b)}`], F: s => (c * b) / ((s - a) ** 2 + b * b), Ftex: sgn(c, `\\frac{${Math.abs(c * b)}}{${den}}`), a, table: 'deslocamento em $s$: $\\mathcal{L}\\{e^{at}f(t)\\} = F(s - a)$' }; }
    case 'expcos': { const a = nz(r, -2, 3), b = pk(r, [1, 2, 3]); const sa = `s ${a < 0 ? '+' : '-'} ${Math.abs(a)}`; return { f: t => c * Math.exp(a * t) * Math.cos(b * t), ftex: [c, `${ex(a)}${cos(b)}`], F: s => (c * (s - a)) / ((s - a) ** 2 + b * b), Ftex: sgn(c, `\\frac{${Math.abs(c) === 1 ? '' : Math.abs(c)}(${sa})}{(${sa})^2 + ${b * b}}`), a, table: 'deslocamento em $s$: $\\mathcal{L}\\{e^{at}f(t)\\} = F(s - a)$' }; }
    case 'texp': { const a = nz(r, -3, 3); return { f: t => c * t * Math.exp(a * t), ftex: [c, `t${ex(a)}`], F: s => c / (s - a) ** 2, Ftex: sgn(c, `\\frac{${Math.abs(c)}}{(s ${a < 0 ? '+' : '-'} ${Math.abs(a)})^2}`), a, table: '$\\mathcal{L}\\{t\\,e^{at}\\} = \\frac{1}{(s - a)^2}$' }; }
    case 'sen2': { const b = pk(r, [1, 2, 3]); return { f: t => c * Math.sin(b * t) ** 2, ftex: [c, `\\operatorname{sen}^2(${kv(b, 't')})`], F: s => c * (1 / (2 * s) - s / (2 * (s * s + 4 * b * b))), Ftex: sgn(c, `${Math.abs(c) === 1 ? '' : Math.abs(c)}\\left(\\frac{1}{2s} - \\frac{s}{2(s^2 + ${4 * b * b})}\\right)`), a: 0, table: `$\\operatorname{sen}^2(${kv(b, 't')}) = \\frac{1 - \\cos(${kv(2 * b, 't')})}{2}$ (identidade antes da tabela!)` }; }
    case 'degrau': { const k = pk(r, [1, 2, 3]); return { f: t => (t >= k ? c : 0), ftex: [c, `u_{${k}}(t)`], F: s => (c * Math.exp(-k * s)) / s, Ftex: sgn(c, `\\frac{${Math.abs(c) === 1 ? '' : Math.abs(c)}${eks(k)}}{s}`), a: 0, jump: k, table: '$\\mathcal{L}\\{u_c(t)\\} = \\frac{e^{-cs}}{s}$' }; }
    case 'rampa': { const k = pk(r, [1, 2, 3]); return { f: t => (t >= k ? c * (t - k) : 0), ftex: [c, `u_{${k}}(t)\\,(t - ${k})`], F: s => (c * Math.exp(-k * s)) / (s * s), Ftex: sgn(c, `\\frac{${Math.abs(c) === 1 ? '' : Math.abs(c)}${eks(k)}}{s^2}`), a: 0, jump: k, table: '$\\mathcal{L}\\{u_c(t)f(t - c)\\} = e^{-cs}F(s)$' }; }
    case 'delta': { const k = pk(r, [1, 2, 3, 4]); return { f: null, ftex: [c, `\\delta(t - ${k})`], F: s => c * Math.exp(-k * s), Ftex: sgn(c, `${Math.abs(c) === 1 ? '' : Math.abs(c)}${eks(k)}`), a: 0, table: '$\\mathcal{L}\\{\\delta(t - c)\\} = e^{-cs}$' }; }
  }
}
const eks = k => `e^{-${k === 1 ? '' : k}s}`;
const sumTex = parts => parts.map((p, i) => (i === 0 ? (p.neg ? '-' : '') + p.tex : ` ${p.neg ? '-' : '+'} ${p.tex}`)).join('');

function genLaplaceDireta(r) {
  const kinds = ['const', 'pot', 'exp', 'sen', 'cos', 'expsen', 'expcos', 'texp', 'sen2', 'degrau', 'rampa', 'delta'];
  const k1 = pk(r, kinds); let k2; do k2 = pk(r, kinds); while (k2 === k1 || (k1 === 'delta' && k2 === 'delta'));
  const ps = [lapPiece(r, k1), lapPiece(r, k2)];
  const ftex = lin(ps.map(p => [p.ftex[0], p.ftex[1]])).tex;
  const a = Math.max(...ps.map(p => p.a));
  const F = s => ps[0].F(s) + ps[1].F(s);
  const Ftex = sumTex(ps.map(p => p.Ftex));
  const cor = [AZ, VD];
  const ftexC = lin(ps.map((p, i) => [p.ftex[0], p.ftex[1], null, cor[i]])).tex;
  const FtexC = sumTex(ps.map((p, i) => ({ neg: p.Ftex.neg, tex: cor[i](p.Ftex.tex) })));
  return {
    skill: 'laplaceDireta', metodos: [],
    eq: `f(t) = ${ftex}`,
    q: `Calcule a transformada de Laplace $F(s) = \\mathcal{L}\\{f\\}(s)$ de ${T(`f(t) = ${ftexC}`)}<br><span class="c-muted">Use <code>e^(-2s)</code> para exponenciais em $s$.</span>`,
    legend: leg(['azul', '1^a\\ \\text{parcela e sua transformada}'], ['verde', '2^a\\ \\text{parcela e sua transformada}']),
    steps: [
      `A transformada é linear: transforme cada parcela e some. Cada cor acompanha uma parcela até virar a sua transformada.`,
      ...ps.map((p, i) => `$${lin([[p.ftex[0], p.ftex[1], null, cor[i]]]).tex}$: ${p.table} $\\Rightarrow ${sumTex([{ neg: p.Ftex.neg, tex: cor[i](p.Ftex.tex) }])}$.`),
      `$F(s) = ${FtexC}$, para $s > ${a}$.`,
    ],
    ans: { kind: 'expr', vars: ['s'], f: e => F(e.s), domain: { s: [a + 1, a + 5] }, tex: Ftex },
    spec: { type: 'laplace', pieces: ps, F, a },
  };
}

function genLaplaceInversa(r) {
  const kind = pk(r, ['fracoes', 'fracoes', 'quadrado', 'quadrado', 'potencia', 'deslocamento', 'deslocamento']);
  const sa = a => (a === 0 ? 's' : `s ${a < 0 ? '+' : '-'} ${Math.abs(a)}`);
  if (kind === 'fracoes') {
    const r1 = ri(r, -3, 3); let r2; do r2 = ri(r, -4, 3); while (r2 === r1);
    const A = nz(r, -4, 5), B = nz(r, -4, 5);
    const al = A + B, be = -(A * r2 + B * r1);
    if (al === 0 && be === 0) return genLaplaceInversa(r);
    const num = poly([al, be], 's'), den = poly([1, -(r1 + r2), r1 * r2], 's');
    const f = lin([[A, r1 === 0 ? '' : ex(r1), t => Math.exp(r1 * t)], [B, r2 === 0 ? '' : ex(r2), t => Math.exp(r2 * t)]]);
    const Ftex = `\\frac{${num}}{${den}}`;
    return {
      skill: 'laplaceInversa', metodos: ['fracoes'], eq: `F(s) = ${Ftex}`,
      q: `Encontre $f(t) = \\mathcal{L}^{-1}\\{F\\}$ para ${T(`F(s) = ${Ftex}`)}`,
      legend: leg(['azul', `\\frac{A}{${sa(r1)}} \\to Ae^{${r1}t}`], ['verde', `\\frac{B}{${sa(r2)}} \\to Be^{${r2}t}`]),
      steps: [
        `Fatore o denominador: $${den} = (${AZ(sa(r1))})(${VD(sa(r2))})$ (raízes reais distintas → frações parciais).`,
        `$\\frac{${num}}{(${AZ(sa(r1))})(${VD(sa(r2))})} = \\frac{${AZ('A')}}{${AZ(sa(r1))}} + \\frac{${VD('B')}}{${VD(sa(r2))}}$. Cubra cada fator (Heaviside): $${AZ('A')} = \\left.\\frac{${num}}{${VD(sa(r2))}}\\right|_{s = ${r1}} = ${AZ(A)}$, $${VD('B')} = \\left.\\frac{${num}}{${AZ(sa(r1))}}\\right|_{s = ${r2}} = ${VD(B)}$.`,
        `Tabela: $\\mathcal{L}^{-1}\\left\\{\\frac{1}{s - a}\\right\\} = e^{at}$, termo a termo: $\\frac{${AZ(A)}}{${AZ(sa(r1))}} \\to ${AZ(lin([[A, r1 === 0 ? '' : ex(r1)]]).tex)}$ e $\\frac{${VD(B)}}{${VD(sa(r2))}} \\to ${VD(lin([[B, r2 === 0 ? '' : ex(r2)]]).tex)}$.`,
        `$f(t) = ${lin([[A, r1 === 0 ? '' : ex(r1), null, AZ], [B, r2 === 0 ? '' : ex(r2), null, VD]]).tex}$`,
      ],
      ans: { kind: 'expr', vars: ['t'], f: e => f.f(e.t), domain: { t: [0.1, 2.5] }, tex: f.tex },
      spec: { type: 'inverse', F: s => (al * s + be) / ((s - r1) * (s - r2)), f: f.f, a: Math.max(r1, r2) },
    };
  }
  if (kind === 'quadrado') {
    const p = ri(r, -2, 2), qq = pk(r, [1, 2, 3]), al = ri(r, 0, 3), C = ri(r, -2, 3);
    if (al === 0 && C === 0) return genLaplaceInversa(r);
    const be = C * qq - al * p;
    const num = poly([al, be], 's'), den = poly([1, -2 * p, p * p + qq * qq], 's');
    const inner = lin([[al, cos(qq), t => Math.cos(qq * t)], [C, sen(qq), t => Math.sin(qq * t)]]);
    const one = al === 0 || C === 0;
    const tex = p === 0 ? inner.tex : one ? lin([[al || C, `${ex(p)}${al ? cos(qq) : sen(qq)}`]]).tex : `${ex(p)}\\left(${inner.tex}\\right)`;
    const f = t => Math.exp(p * t) * inner.f(t);
    const Ftex = `\\frac{${num}}{${den}}`;
    return {
      skill: 'laplaceInversa', metodos: ['quadrado'], eq: `F(s) = ${Ftex}`,
      q: `Encontre $f(t) = \\mathcal{L}^{-1}\\{F\\}$ para ${T(`F(s) = ${Ftex}`)}`,
      legend: leg(['laranja', `\\text{deslocamento } ${p}`], ['azul', '\\text{parte } \\cos'], ['verde', '\\text{parte } \\operatorname{sen}']),
      steps: [
        `O denominador não tem raízes reais ($\\Delta < 0$): complete o quadrado, $${den} = (${LR(sa(p))})^2 + ${qq * qq}$.`,
        `Escreva o numerador em função de $${LR(sa(p))}$: $${num} = ${lin([[al, `(${LR(sa(p))})`, null, AZ], [C * qq, '', null, VD]]).tex}$.`,
        `$F(s) = ${lin([[al, `\\frac{${LR(sa(p))}}{(${LR(sa(p))})^2 + ${qq * qq}}`, null, AZ], [C, `\\frac{${qq}}{(${LR(sa(p))})^2 + ${qq * qq}}`, null, VD]]).tex}$.`,
        `Tabela, com o deslocamento em $s$ ($F(s - a) \\leftrightarrow e^{at}f(t)$): o ${T(LR(sa(p)))} vira o fator $${LR(p === 0 ? '1' : ex(p))}$, a parte azul vira $\\cos ${qq === 1 ? '' : qq}t$ e a verde, $\\operatorname{sen} ${qq === 1 ? '' : qq}t$.`,
        `$f(t) = ${p === 0 ? '' : LR(ex(p))}${p === 0 ? '' : '\\left('}${lin([[al, cos(qq), null, AZ], [C, sen(qq), null, VD]]).tex}${p === 0 ? '' : '\\right)'}$`,
      ],
      ans: { kind: 'expr', vars: ['t'], f: e => f(e.t), domain: { t: [0.1, 2.5] }, tex },
      spec: { type: 'inverse', F: s => (al * s + be) / ((s - p) ** 2 + qq * qq), f, a: p },
    };
  }
  if (kind === 'potencia') {
    const p = nz(r, -3, 3), n = pk(r, [2, 3]), c = pk(r, [1, 2, 3, 4, 6]);
    const co = q(c, fact(n - 1));
    const f = lin([[co, `t${n - 1 === 1 ? '' : `^{${n - 1}}`}${ex(p)}`, t => t ** (n - 1) * Math.exp(p * t)]]);
    const Ftex = `\\frac{${c}}{(${sa(p)})^{${n}}}`;
    return {
      skill: 'laplaceInversa', metodos: ['fracoes'], eq: `F(s) = ${Ftex}`,
      q: `Encontre $f(t) = \\mathcal{L}^{-1}\\{F\\}$ para ${T(`F(s) = ${Ftex}`)}`,
      legend: leg(['laranja', `s \\to ${sa(p)}`], ['azul', `\\frac{1}{s^{${n}}}`]),
      steps: [
        `$\\mathcal{L}\\{t^{n}\\} = \\frac{n!}{s^{n+1}}$, logo $\\mathcal{L}^{-1}\\left\\{${AZ(`\\frac{1}{s^{${n}}}`)}\\right\\} = ${AZ(`\\frac{t^{${n - 1}}}{${fact(n - 1)}}`)}$.`,
        `Deslocamento em $s$: trocar $s$ por $${LR(sa(p))}$ multiplica a inversa por $${LR(ex(p))}$.`,
        `$f(t) = ${co.isOne() ? '' : co.tex()}${AZ(`t${n - 1 === 1 ? '' : `^{${n - 1}}`}`)}${LR(ex(p))}$`,
      ],
      ans: { kind: 'expr', vars: ['t'], f: e => f.f(e.t), domain: { t: [0.1, 2.5] }, tex: f.tex },
      spec: { type: 'inverse', F: s => c / (s - p) ** n, f: f.f, a: p },
    };
  }
  // e^{-ks} G(s) → u_k(t) g(t − k)
  const k = pk(r, [1, 2, 3, 4]);
  const tk = `(t - ${k})`;
  const G = pk(r, [
    () => { const c = pk(r, [1, 2, 3]); return { G: `\\frac{${c}}{s}`, Gf: s => c / s, g: lin([[c, '', null]]), gf: () => c, base: `$${c}$` }; },
    () => ({ G: '\\frac{1}{s^2}', Gf: s => 1 / (s * s), g: { tex: tk }, gf: t => t, base: '$t$' }),
    () => { const b = pk(r, [1, 2, 3]); return { G: `\\frac{${b}}{s^2 + ${b * b}}`, Gf: s => b / (s * s + b * b), g: { tex: sen(b, tk) }, gf: t => Math.sin(b * t), base: `$${sen(b)}$` }; },
    () => { const b = pk(r, [1, 2, 3]); return { G: `\\frac{s}{s^2 + ${b * b}}`, Gf: s => s / (s * s + b * b), g: { tex: cos(b, tk) }, gf: t => Math.cos(b * t), base: `$${cos(b)}$` }; },
    () => { const a = nz(r, -2, 3); return { G: `\\frac{1}{${sa(a)}}`, Gf: s => 1 / (s - a), g: { tex: ex(a, tk) }, gf: t => Math.exp(a * t), base: `$${ex(a)}$` }; },
  ])();
  const ftex = G.g.tex === tk ? `u_{${k}}(t)\\,${tk}` : `u_{${k}}(t)\\,${G.g.tex}`;
  const f = t => (t >= k ? G.gf(t - k) : 0);
  const Ftex = `${eks(k)}\\,${G.G}`;
  return {
    skill: 'laplaceInversa', metodos: ['deslocamento'], eq: `F(s) = ${Ftex}`,
    q: `Encontre $f(t) = \\mathcal{L}^{-1}\\{F\\}$ para ${T(`F(s) = ${LR(eks(k))}\\,${AZ(G.G)}`)}<br><span class="c-muted">Digite o degrau como <code>u_${k}(t)</code> ou <code>u(t-${k})</code>.</span>`,
    legend: leg(['laranja', `e^{-cs} \\to u_c(t),\\ t \\to t - c`], ['azul', 'G(s) \\to g']),
    steps: [
      `O fator $${LR(eks(k))}$ indica deslocamento em $t$: $\\mathcal{L}^{-1}\\{${LR('e^{-cs}')}${AZ('G(s)')}\\} = ${LR('u_c(t)')}\\,${AZ('g')}(${LR('t - c')})$, aqui com $c = ${LR(k)}$.`,
      `Sem o fator: $${AZ('g(t)')} = \\mathcal{L}^{-1}\\left\\{${AZ(G.G)}\\right\\} = $ ${G.base.replace(/^\$(.*)\$$/, (m0, x) => `$${AZ(x)}$`)}.`,
      `Troque $t$ por $${LR(`t - ${k}`)}$ e ligue o degrau: $f(t) = ${LR(`u_{${k}}(t)`)}\\,${AZ(G.g.tex)}$.`,
    ],
    ans: { kind: 'expr', vars: ['t'], f: e => f(e.t), domain: { t: [0.1, k + 2.5] }, avoid: [k], tex: ftex },
    spec: { type: 'inverse', F: s => Math.exp(-k * s) * G.Gf(s), f, a: 1 },
  };
}

/**
 * Respostas ao impulso h = L⁻¹{A/P} e ao degrau g = L⁻¹{A/(sP)} do polinômio mônico P de raízes `roots`,
 * em TeX na variável v (que pode ser "(t - 2)").
 */
function responses(roots, v, A = 1) {
  if (roots.type === 'reais') {
    const { r1, r2 } = roots;
    const h = lin([[q(A, r1 - r2), ex(r1, v), t => Math.exp(r1 * t)], [q(A, r2 - r1), ex(r2, v), t => Math.exp(r2 * t)]]);
    const g = lin([[q(A, r1 * r2), '', null], [q(A, r1 * (r1 - r2)), ex(r1, v), t => Math.exp(r1 * t)], [q(A, r2 * (r2 - r1)), ex(r2, v), t => Math.exp(r2 * t)]]);
    return { h, g, hName: 'frações parciais', P: `(${sOf(r1)})(${sOf(r2)})` };
  }
  if (roots.type === 'dupla') {
    const rr = roots.r.v;
    const h = lin([[A, `${v}${ex(rr, v)}`, t => t * Math.exp(rr * t)]]);
    const g = lin([[q(A, rr * rr), '', null], [q(-A, rr * rr), ex(rr, v), t => Math.exp(rr * t)], [q(A, rr), `${v}${ex(rr, v)}`, t => t * Math.exp(rr * t)]]);
    return { h, g, hName: 'tabela: $\\frac{1}{(s - r)^2} \\leftrightarrow te^{rt}$', P: `(${sOf(rr)})^2` };
  }
  const { a, b } = roots, w2 = a * a + b * b;
  const e = a === 0 ? '' : ex(a, v);
  const h = lin([[q(A, b), `${e}${sen(b, v)}`, t => Math.exp(a * t) * Math.sin(b * t)]]);
  const inner = lin([[1, cos(b, v), t => Math.cos(b * t)], [q(-a, b), sen(b, v), t => Math.sin(b * t)]]);
  const c = q(A, w2);
  const g = {
    tex: `${c.isOne() ? '' : c.tex()}\\left(1 - ${e}${a === 0 ? inner.tex : `\\left(${inner.tex}\\right)`}\\right)`,
    f: t => c.v * (1 - Math.exp(a * t) * inner.f(t)),
  };
  return {
    h, g,
    hName: a === 0 ? 'tabela: $\\frac{b}{s^2 + b^2} \\leftrightarrow \\operatorname{sen} bt$' : 'completar quadrado + deslocamento em $s$',
    P: a === 0 ? `s^2 + ${b * b}` : `(${sOf(a)})^2 + ${b * b}`,
  };
}
const sOf = a => (a === 0 ? 's' : `s ${a < 0 ? '+' : '-'} ${Math.abs(a)}`);

function genLaplacePvi(r) {
  const kind = pk(r, ['hom', 'delta', 'delta', 'degrau', 'degrau', 'exp']);
  if (kind === 'hom') {
    const q0 = genHomogenea2(r);
    if (q0.ans.kind !== 'expr') return genLaplacePvi(r);
    const [, b, c] = q0.spec.a;
    if (q0.spec.a[0] !== 1) return genLaplacePvi(r);
    const [y0, y1] = q0.spec.ic;
    const eq = q0.eq.replace(/x/g, 't');
    const sol = q0.ans.tex.replace(/x/g, 't');
    const numY = poly([y0, y1 + b * y0], 's');
    return {
      skill: 'laplacePvi', metodos: ['laplace'], eq,
      q: `Resolva usando a transformada de Laplace: ${T(`${odeLhs([1, b, c])} = 0,\\quad y(0) = ${RS(y0)},\\ y'(0) = ${RS(y1)}`)}`,
      legend: leg(['amarelo', 'Y(s)'], ['rosa', 'y(0),\\ y\'(0)']),
      steps: [
        `Transforme com $\\mathcal{L}\\{y''\\} = s^2${AM('Y')} - s\\,${RS("y(0)")} - ${RS("y'(0)")}$ e $\\mathcal{L}\\{y'\\} = s${AM('Y')} - ${RS('y(0)')}$: as condições iniciais (rosa) entram já na transformada.`,
        `Agrupe: $(${poly([1, b, c], 's')})${AM('Y')} = ${RS(numY)}$, logo $${AM('Y(s)')} = ${AM(`\\frac{${RS(numY)}}{${poly([1, b, c], 's')}}`)}$.`,
        `Inverta com frações parciais ou completando o quadrado, conforme as raízes de $${poly([1, b, c], 's')}$.`,
        `$y(t) = ${sol}$`,
      ],
      ans: { kind: 'expr', vars: ['t'], f: e => q0.spec.sol(e.t), domain: { t: [0, 2] }, tex: sol },
      spec: { type: 'ode2', a: q0.spec.a, g: () => 0, x0: 0, ic: [y0, y1], sol: q0.spec.sol },
    };
  }
  if (kind === 'exp') {
    const r1 = ri(r, -3, 2); let r2; do r2 = ri(r, -3, 3); while (r2 === r1);
    let a; do a = nz(r, -2, 3); while (a === r1 || a === r2);
    const A = pk(r, [1, 2, 3, 6]);
    const b = -(r1 + r2), c = r1 * r2;
    const terms = [[q(A, (a - r1) * (a - r2)), ex(a), t => Math.exp(a * t)], [q(A, (r1 - a) * (r1 - r2)), r1 === 0 ? '' : ex(r1), t => Math.exp(r1 * t)], [q(A, (r2 - a) * (r2 - r1)), r2 === 0 ? '' : ex(r2), t => Math.exp(r2 * t)]];
    const y = lin(terms);
    const eq = `${odeLhs([1, b, c])} = ${lin([[A, ex(a)]]).tex},\\quad y(0) = 0,\\ y'(0) = 0`;
    return {
      skill: 'laplacePvi', metodos: ['laplace', 'coef'], eq,
      q: `Resolva usando a transformada de Laplace: ${T(`${odeLhs([1, b, c])} = ${RS(lin([[A, ex(a)]]).tex)},\\quad y(0) = 0,\\ y'(0) = 0`)}`,
      legend: leg(['amarelo', 'Y(s)'], ['rosa', '\\text{forçamento}'], ['azul', `(${sOf(r1)})`], ['verde', `(${sOf(r2)})`]),
      steps: [
        `Com condições iniciais nulas: $(${poly([1, b, c], 's')})${AM('Y')} = ${RS(`\\frac{${A}}{${sOf(a)}}`)}$.`,
        `$${AM('Y(s)')} = \\frac{${A}}{(${RS(sOf(a))})(${AZ(sOf(r1))})(${VD(sOf(r2))})}$.`,
        `Frações parciais (cubra cada fator): $\\frac{${RS(terms[0][0].tex())}}{${RS(sOf(a))}} + \\frac{${AZ(terms[1][0].tex())}}{${AZ(sOf(r1))}} + \\frac{${VD(terms[2][0].tex())}}{${VD(sOf(r2))}}$.`,
        `Cada fração vira uma exponencial da mesma cor: $y(t) = ${lin([[terms[0][0], terms[0][1], null, RS], [terms[1][0], terms[1][1], null, AZ], [terms[2][0], terms[2][1], null, VD]]).tex}$`,
      ],
      ans: { kind: 'expr', vars: ['t'], f: e => y.f(e.t), domain: { t: [0, 2] }, tex: y.tex },
      spec: { type: 'ode2', a: [1, b, c], g: t => A * Math.exp(a * t), x0: 0, ic: [0, 0], sol: y.f },
    };
  }
  // impulso ou degrau em t = k, condições nulas
  let roots;
  do roots = randomRoots(r, false); while (roots.type === 'reais' && (roots.r1 === 0 || roots.r2 === 0) || (roots.type === 'dupla' && roots.r.v === 0));
  if (roots.type === 'complexas' && r() < 0.5) roots = { type: 'complexas', a: 0, b: roots.b };
  if (roots.type === 'dupla') roots = { type: 'dupla', r: q(roots.r.n) };
  const cp = charPoly(roots);
  const k = pk(r, [1, 2, 3]), A = pk(r, [1, 2, 3, 4]);
  const tk = `(t - ${k})`;
  const R = responses(roots, tk, A), R0 = responses(roots, 't');
  const isDelta = kind === 'delta';
  const resp = isDelta ? R.h : R.g;
  const respTex = resp.tex.includes(' ') ? `\\left[${resp.tex}\\right]` : resp.tex;
  const ytex = `u_{${k}}(t)\\,${respTex}`;
  const y = t => (t >= k ? resp.f(t - k) : 0);
  const den = isDelta ? R.P : `s\\left[${R.P}\\right]`;
  const forc = isDelta ? `${A === 1 ? '' : A}\\delta(t - ${k})` : `${A === 1 ? '' : A}u_{${k}}(t)`;
  const eq = `${odeLhs(cp)} = ${forc},\\quad y(0) = 0,\\ y'(0) = 0`;
  return {
    skill: 'laplacePvi', metodos: ['laplace'], eq,
    q: `Resolva usando a transformada de Laplace: ${T(`${odeLhs(cp)} = ${RS(forc)},\\quad y(0) = 0,\\ y'(0) = 0`)}<br><span class="c-muted">Digite o degrau como <code>u_${k}(t)</code> ou <code>u(t-${k})</code>.</span>`,
    legend: leg(['rosa', '\\text{forçamento}'], ['amarelo', 'Y(s)'], ['laranja', `e^{-${k}s} \\to u_{${k}}(t),\\ t \\to t - ${k}`], ['azul', isDelta ? 'h(t)' : 'g(t)']),
    steps: [
      `Condições iniciais nulas: $\\mathcal{L}\\{${odeLhs(cp)}\\} = (${poly(cp, 's')})${AM('Y')}$ e $\\mathcal{L}\\{${RS(forc)}\\} = ${RS(`${A === 1 ? '' : A}${isDelta ? '' : '\\frac{'}${LR(eks(k))}${isDelta ? '' : '}{s}'}`)}$.`,
      `$${AM('Y(s)')} = ${A === 1 ? '' : A}${LR(eks(k))}\\cdot ${AZ(`\\frac{1}{${den}}`)}$, com $${poly(cp, 's')} = ${R.P}$.`,
      `Sem o $${LR(eks(k))}$: $\\mathcal{L}^{-1}\\left\\{${AZ(`\\frac{1}{${den}}`)}\\right\\} = ${AZ((isDelta ? R0.h : R0.g).tex)}$ (${isDelta ? R0.hName : 'frações parciais, agora com o fator extra $1/s$'}).`,
      `Deslocamento em $t$ ($${LR('e^{-cs}')}F(s) \\leftrightarrow ${LR('u_c(t)')}f(${LR('t - c')})$): troque $t$ por $${LR(`t - ${k}`)}$ e ligue o degrau: $y(t) = ${LR(`u_{${k}}(t)`)}\\,${AZ(respTex)}$.`,
      isDelta ? `Confira: $y$ é contínua em $t = ${k}$ e $y'$ salta $${A}$ ali (o impulso dá um "chute" na velocidade).` : `Confira: antes de $t = ${k}$ nada acontece, porque o sistema está em repouso.`,
    ],
    ans: { kind: 'expr', vars: ['t'], f: e => y(e.t), domain: { t: [0.1, k + 2.5] }, avoid: [k], tex: ytex },
    spec: { type: 'ode2', a: cp, forcing: { kind: kind, A, k }, x0: 0, ic: [0, 0], sol: y },
  };
}

/** Troca a variável t (e só ela, não o t de \\operatorname) por outra expressão. */
const trocaT = (tex, por) => tex.replace(/(?<![A-Za-z\\\\])t(?![A-Za-z])/g, por);

function genConvolucao(r) {
  const k = pk(r, [1, 2, 3]), a = nz(r, -2, 3);
  let b; do b = nz(r, -3, 3); while (b === a);
  const K = k * k;
  const item = pk(r, [
    { F1: `\\frac{1}{s}`, F2: `\\frac{1}{s^2 + ${K}}`, F: `\\frac{1}{s(s^2 + ${K})}`, f1: '1', f2: lin([[q(1, k), sen(k)]]).tex, f: t => (1 - Math.cos(k * t)) / K, tex: lin([[q(1, K), ''], [q(-1, K), cos(k)]]).tex, Ff: s => 1 / (s * (s * s + K)), g1: () => 1, g2: t => Math.sin(k * t) / k },
    { F1: `\\frac{1}{s^2}`, F2: `\\frac{1}{s^2 + ${K}}`, F: `\\frac{1}{s^2(s^2 + ${K})}`, f1: 't', f2: lin([[q(1, k), sen(k)]]).tex, f: t => (k * t - Math.sin(k * t)) / k ** 3, tex: lin([[q(1, K), 't'], [q(-1, k ** 3), sen(k)]]).tex, Ff: s => 1 / (s * s * (s * s + K)), g1: t => t, g2: t => Math.sin(k * t) / k },
    { F1: `\\frac{s}{s^2 + ${K}}`, F2: `\\frac{1}{s^2 + ${K}}`, F: `\\frac{s}{(s^2 + ${K})^2}`, f1: cos(k), f2: lin([[q(1, k), sen(k)]]).tex, f: t => (t * Math.sin(k * t)) / (2 * k), tex: lin([[q(1, 2 * k), `t${sen(k)}`]]).tex, Ff: s => s / (s * s + K) ** 2, g1: t => Math.cos(k * t), g2: t => Math.sin(k * t) / k },
    { F1: `\\frac{1}{${sOf(a)}}`, F2: `\\frac{1}{${sOf(b)}}`, F: `\\frac{1}{(${sOf(a)})(${sOf(b)})}`, f1: ex(a), f2: ex(b), f: t => (Math.exp(a * t) - Math.exp(b * t)) / (a - b), tex: lin([[q(1, a - b), ex(a)], [q(-1, a - b), ex(b)]]).tex, Ff: s => 1 / ((s - a) * (s - b)), g1: t => Math.exp(a * t), g2: t => Math.exp(b * t) },
    { F1: `\\frac{1}{s}`, F2: `\\frac{1}{${sOf(a)}}`, F: `\\frac{1}{s(${sOf(a)})}`, f1: '1', f2: ex(a), f: t => (Math.exp(a * t) - 1) / a, tex: lin([[q(1, a), ex(a)], [q(-1, a), '']]).tex, Ff: s => 1 / (s * (s - a)), g1: () => 1, g2: t => Math.exp(a * t) },
    { F1: `\\frac{1}{s^2 + ${K}}`, F2: `\\frac{1}{s^2 + ${K}}`, F: `\\frac{1}{(s^2 + ${K})^2}`, f1: lin([[q(1, k), sen(k)]]).tex, f2: lin([[q(1, k), sen(k)]]).tex, f: t => (Math.sin(k * t) - k * t * Math.cos(k * t)) / (2 * k ** 3), tex: lin([[q(1, 2 * k ** 3), sen(k)], [q(-1, 2 * K), `t${cos(k)}`]]).tex, Ff: s => 1 / (s * s + K) ** 2, g1: t => Math.sin(k * t) / k, g2: t => Math.sin(k * t) / k },
  ]);
  return {
    skill: 'convolucao', metodos: item.F.includes(')^2}') ? ['convolucao'] : ['convolucao', 'fracoes'], eq: `F(s) = ${item.F}`,
    q: `Use o Teorema da Convolução para calcular ${T(`\\mathcal{L}^{-1}\\left\\{${item.F}\\right\\}`)}`,
    legend: leg(['azul', 'F_1 \\to f_1'], ['verde', 'F_2 \\to f_2'], ['amarelo', 'f_1 * f_2']),
    steps: [
      `Teorema: se $F = ${AZ('F_1')}${VD('F_2')}$, então $\\mathcal{L}^{-1}\\{F\\} = (${AZ('f_1')} * ${VD('f_2')})(t) = \\int_0^t ${AZ('f_1(\\tau)')}\\,${VD('f_2(t - \\tau)')}\\,d\\tau$.`,
      `Separe em dois fatores da tabela: $${item.F} = ${AZ(item.F1)}\\cdot ${VD(item.F2)}$, ou seja, $${AZ('f_1(t)')} = ${AZ(item.f1)}$ e $${VD('f_2(t)')} = ${VD(item.f2)}$.`,
      `Monte a integral trocando $t$ por $\\tau$ em ${T(AZ('f_1'))} e por $t - \\tau$ em ${T(VD('f_2'))}: $\\int_0^t ${AZ(trocaT(item.f1, '\\tau'))}\\cdot ${VD(par(trocaT(item.f2, '(t - \\tau)')))}\\,d\\tau$ (use identidades trigonométricas ou integre a exponencial).`,
      `$${AM('(f_1 * f_2)(t)')} = ${AM(item.tex)}$`,
    ],
    ans: { kind: 'expr', vars: ['t'], f: e => item.f(e.t), domain: { t: [0.1, 3] }, tex: item.tex },
    spec: { type: 'conv', g1: item.g1, g2: item.g2, f: item.f, F: item.Ff },
  };
}

// ---------- Lista 4: sistemas lineares X' = AX ----------

const mat = ([[a, b], [c, d]]) => `\\begin{pmatrix} ${q(a).tex()} & ${q(b).tex()} \\\\ ${q(c).tex()} & ${q(d).tex()} \\end{pmatrix}`;
const vec = (a, b) => `\\begin{pmatrix} ${q(a).tex()} \\\\ ${q(b).tex()} \\end{pmatrix}`;
const sysEq = A => `\\mathbf{X}' = ${mat(A)}\\mathbf{X}`;
const charSys = A => {
  const tr = q(A[0][0]).add(A[1][1]), det = q(A[0][0]).mul(A[1][1]).sub(q(A[0][1]).mul(A[1][0]));
  const rest = lin([[tr.neg(), '\\lambda'], [det, '']]).tex;
  return { tr, det, tex: `\\lambda^2${rest === '0' ? '' : rest.startsWith('-') ? ` - ${rest.slice(1)}` : ` + ${rest}`} = 0` };
};
/** A − λI em TeX, sem "A - -3I". */
const shift = l => (l === 0 ? 'A' : l < 0 ? `A + ${-l === 1 ? '' : -l}I` : `A - ${l === 1 ? '' : l}I`);
const shiftP = l => (l === 0 ? 'A' : `(${shift(l)})`);
/** Monta a resposta vetorial { x(t), y(t) } a partir das funções e do TeX de cada componente. */
function vecAns(fx, fy, xtex, ytex, domain = { t: [0, 1.5] }) {
  return { kind: 'vec', vars: ['t'], fs: [e => fx(e.t), e => fy(e.t)], labels: ['x(t)', 'y(t)'], domain, tex: [xtex, ytex] };
}
const pvi = (A, x0, y0) => `${sysEq(A)},\\quad \\mathbf{X}(0) = ${vec(x0, y0)}`;

function genSistemaReal(r) {
  // A = P D P⁻¹ com det P = ±1, para A inteira e autovetores inteiros
  let l1, l2;
  do { l1 = ri(r, -3, 3); l2 = r() < 0.3 ? 0 : ri(r, -3, 3); } while (l1 === l2);
  let p, qq, rr, s;
  do { [p, qq, rr, s] = [ri(r, -2, 2), ri(r, -2, 2), ri(r, -2, 2), ri(r, -2, 2)]; }
  while (Math.abs(p * s - qq * rr) !== 1 || (!p && !qq) || (!rr && !s) || (p === 0 && s === 0) || (qq === 0 && rr === 0));
  const D = p * s - qq * rr;
  // A = P diag(l1, l2) P⁻¹, P = [[p, rr], [qq, s]] (colunas v1, v2)
  const A = [
    [(l1 * p * s - l2 * rr * qq) / D, (-l1 * p * rr + l2 * rr * p) / D],
    [(l1 * qq * s - l2 * s * qq) / D, (-l1 * qq * rr + l2 * s * p) / D],
  ];
  const v1 = [p, qq], v2 = [rr, s];
  const ch = charSys(A);
  const E = l => (l === 0 ? '' : ex(l));
  const gen = `\\mathbf{X}(t) = c_1${E(l1)}${vec(...v1)} + c_2${E(l2)}${vec(...v2)}`;
  const EC = (l, paint) => (l === 0 ? '' : `e^{${paint(kv(l, 't'))}}`);
  const genC = `\\mathbf{X}(t) = ${RX('c_1')}${EC(l1, AZ)}${AZ(vec(...v1))} + ${LR('c_2')}${EC(l2, VD)}${VD(vec(...v2))}`;
  const legR = leg(['azul', '\\lambda_1,\\ \\mathbf v_1'], ['verde', '\\lambda_2,\\ \\mathbf v_2'], ['roxo', 'c_1'], ['laranja', 'c_2'], ['rosa', '\\mathbf X(0)']);
  if (r() < 0.3) {
    const opts = [
      gen,
      `\\mathbf{X}(t) = c_1${E(l1)}${vec(...v2)} + c_2${E(l2)}${vec(...v1)}`,
      `\\mathbf{X}(t) = c_1${E(-l1)}${vec(...v1)} + c_2${E(-l2)}${vec(...v2)}`,
      `\\mathbf{X}(t) = c_1${E(l1)}${vec(-v1[1], v1[0])} + c_2${E(l2)}${vec(-v2[1], v2[0])}`,
    ];
    if (new Set(opts).size < 4) return genSistemaReal(r);
    return {
      skill: 'sistemaReal', metodos: ['reais'], eq: sysEq(A), A,
      q: `Qual é a solução geral de ${T(sysEq(A))}?`,
      legend: legR.slice(0, 2),
      steps: [
        `Polinômio característico: $\\det(A - \\lambda I) = ${ch.tex}$, raízes $${AZ(`\\lambda_1 = ${l1}`)}$ e $${VD(`\\lambda_2 = ${l2}`)}$.`,
        `Autovetores, de $(A - \\lambda I)\\mathbf v = 0$: $${AZ('\\mathbf v_1')} = ${AZ(vec(...v1))}$ e $${VD('\\mathbf v_2')} = ${VD(vec(...v2))}$ (qualquer múltiplo serve).`,
        `Confira: $A${AZ('\\mathbf v_1')} = ${AZ(l1)}${AZ('\\mathbf v_1')}$. Cada autovetor anda junto com o <b>seu</b> autovalor (mesma cor); trocá-los é o erro mais comum.`,
        `$${genC}$`,
      ],
      ans: { kind: 'choice', options: opts.map(o => `$${o}$`), correct: 0 },
    };
  }
  const c1 = nz(r, -2, 2), c2 = nz(r, -2, 2);
  const x0 = c1 * p + c2 * rr, y0 = c1 * qq + c2 * s;
  const X = lin([[c1 * p, E(l1), t => Math.exp(l1 * t)], [c2 * rr, E(l2), t => Math.exp(l2 * t)]]);
  const Y = lin([[c1 * qq, E(l1), t => Math.exp(l1 * t)], [c2 * s, E(l2), t => Math.exp(l2 * t)]]);
  const eq = pvi(A, x0, y0);
  return {
    skill: 'sistemaReal', metodos: ['reais'], eq: sysEq(A), A,
    q: `Resolva o PVI ${T(`${sysEq(A)},\\quad \\mathbf{X}(0) = ${RS(vec(x0, y0))}`)}`,
    legend: legR,
    steps: [
      `Polinômio característico: $\\det(A - \\lambda I) = ${ch.tex}$ (traço ${ch.tr.tex()}, determinante ${ch.det.tex()}), com raízes $${AZ(`\\lambda_1 = ${l1}`)}$ e $${VD(`\\lambda_2 = ${l2}`)}$.${l1 === 0 || l2 === 0 ? ' Autovalor nulo: $\\det A = 0$ e a parcela dele é constante.' : ''}`,
      `Autovetores: $${shiftP(l1)}${AZ('\\mathbf v_1')} = 0 \\Rightarrow ${AZ('\\mathbf v_1')} = ${AZ(vec(...v1))}$; $${shiftP(l2)}${VD('\\mathbf v_2')} = 0 \\Rightarrow ${VD('\\mathbf v_2')} = ${VD(vec(...v2))}$.`,
      `Solução geral (cada autovalor com o seu autovetor): $${genC}$.`,
      `Em $t = 0$ as exponenciais valem 1: $${RX('c_1')}${AZ(vec(...v1))} + ${LR('c_2')}${VD(vec(...v2))} = ${RS(vec(x0, y0))}$, logo $${RX('c_1')} = ${RX(c1)}$ e $${LR('c_2')} = ${LR(c2)}$.`,
      `$x(t) = ${lin([[c1 * p, E(l1), null, AZ], [c2 * rr, E(l2), null, VD]]).tex}$ e $y(t) = ${lin([[c1 * qq, E(l1), null, AZ], [c2 * s, E(l2), null, VD]]).tex}$.`,
    ],
    ans: vecAns(X.f, Y.f, X.tex, Y.tex),
    spec: { type: 'system', A, X0: [x0, y0], sol: t => [X.f(t), Y.f(t)] },
  };
}

function genSistemaComplexo(r) {
  // λ = α ± βi: A = [[α + m, n], [−(β² + m²)/n, α − m]]
  const al = ri(r, -2, 2), be = pk(r, [1, 2, 3]), m = ri(r, -2, 2), N = be * be + m * m;
  const divs = []; for (let d = 1; d <= Math.min(N, 5); d++) if (N % d === 0) divs.push(d, -d);
  const n = pk(r, divs);
  const A = [[al + m, n], [-N / n, al - m]];
  let x0, y0; do { x0 = ri(r, -2, 3); y0 = ri(r, -2, 3); } while (!x0 && !y0);
  // X(t) = e^{αt}[cos βt X0 + sen βt (A − αI)X0/β]
  const px = q(m * x0 + n * y0, be), py = q((-N / n) * x0 - m * y0, be);
  const comp = (c0, cs) => {
    const inner = lin([[c0, cos(be), t => Math.cos(be * t)], [cs, sen(be), t => Math.sin(be * t)]]);
    const two = inner.tex.includes(' + ') || inner.tex.slice(1).includes(' - ');
    const tex = al === 0 ? inner.tex : inner.tex === '0' ? '0' : two ? `${ex(al)}\\left(${inner.tex}\\right)` : lin([[c0 || cs, `${ex(al)}${c0 ? cos(be) : sen(be)}`]]).tex;
    return { tex, f: t => Math.exp(al * t) * inner.f(t) };
  };
  const X = comp(x0, px), Y = comp(y0, py);
  const ch = charSys(A);
  const lam = `${al === 0 ? '' : `${al} `}\\pm ${be === 1 ? '' : be}i`;
  const lp = `${al === 0 ? '' : `${al} + `}${be === 1 ? '' : be}i`;
  const ea = al === 0 ? '' : `e^{${kv(al, 't')}}`;
  const eq = pvi(A, x0, y0);
  return {
    skill: 'sistemaComplexo', metodos: ['complexos'], eq: sysEq(A), A,
    q: `Resolva o PVI e escreva a solução com funções reais: ${T(`${sysEq(A)},\\quad \\mathbf{X}(0) = ${RS(vec(x0, y0))}`)}`,
    legend: leg(['amarelo', '\\lambda = \\alpha \\pm \\beta i'], ['azul', '\\mathbf a = \\operatorname{Re}\\mathbf v'], ['verde', '\\mathbf b = \\operatorname{Im}\\mathbf v'], ['roxo', 'c_1'], ['laranja', 'c_2'], ['rosa', '\\mathbf X(0)']),
    steps: [
      `Polinômio característico: $${ch.tex}$, raízes $${AM(`\\lambda = ${lam}`)}$.`,
      `Autovetor de $${AM(`\\lambda = ${lp}`)}$: da 1ª linha de $A - \\lambda I$, $(${m} - ${be === 1 ? '' : be}i)v_1 + ${n < 0 ? `(${n})` : n}v_2 = 0$, então $\\mathbf v = ${AZ(vec(n, -m))} + i${VD(vec(0, be))} = ${AZ('\\mathbf a')} + i${VD('\\mathbf b')}$.`,
      `Parte real e parte imaginária de $e^{${AM('\\lambda')} t}\\mathbf v$ são soluções reais: $\\mathbf u_1 = ${ea}(${AZ('\\mathbf a')}\\cos ${kv(be, 't')} - ${VD('\\mathbf b')}\\operatorname{sen} ${kv(be, 't')})$ e $\\mathbf u_2 = ${ea}(${AZ('\\mathbf a')}\\operatorname{sen} ${kv(be, 't')} + ${VD('\\mathbf b')}\\cos ${kv(be, 't')})$; $\\mathbf X = ${RX('c_1')}\\mathbf u_1 + ${LR('c_2')}\\mathbf u_2$.`,
      `Em $t = 0$ ($\\cos = 1$, $\\operatorname{sen} = 0$): $${RX('c_1')}${AZ('\\mathbf a')} + ${LR('c_2')}${VD('\\mathbf b')} = ${RS('\\mathbf X(0)')}$, logo $${RX('c_1')} = ${RX(q(x0, n).tex())}$ e $${LR('c_2')} = ${LR(q(y0).add(q(m * x0, n)).div(be).tex())}$.`,
      `Atalho que dá o mesmo: $\\mathbf X(t) = e^{\\alpha t}\\left[\\cos(\\beta t)\\,${RS('\\mathbf X(0)')} + \\operatorname{sen}(\\beta t)\\,\\frac{(A - \\alpha I)${RS('\\mathbf X(0)')}}{\\beta}\\right]$.`,
      `$x(t) = ${X.tex}$ e $y(t) = ${Y.tex}$.`,
    ],
    ans: vecAns(X.f, Y.f, X.tex, Y.tex),
    spec: { type: 'system', A, X0: [x0, y0], sol: t => [X.f(t), Y.f(t)] },
  };
}

function genSistemaRepetido(r) {
  // A = λI + N, N = s·(u, v)ᵀ(v, −u) é nilpotente (N² = 0): um único autovetor (u, v)
  const lam = ri(r, -2, 2);
  let u, v; do { u = ri(r, -2, 2); v = ri(r, -2, 2); } while ((!u && !v) || gcd(u, v) !== 1);
  if (u < 0 || (u === 0 && v < 0)) { u = -u; v = -v; } // N não muda (é quadrático em u, v)
  const s = pk(r, [1, -1, 2]);
  const Nm = [[s * u * v, -s * u * u], [s * v * v, -s * u * v]];
  const A = [[lam + Nm[0][0], Nm[0][1]], [Nm[1][0], lam + Nm[1][1]]];
  let x0, y0; do { x0 = ri(r, -2, 3); y0 = ri(r, -2, 3); } while (v * x0 - u * y0 === 0);
  const k = s * (v * x0 - u * y0); // N X0 = k (u, v)
  const w = v !== 0 ? [q(1, s * v), q(0)] : [q(0), q(-1, s * u)];
  const E = lam === 0 ? '' : ex(lam);
  const comp = (c, d) => {
    const inner = lin([[c, '', null], [d, 't', t => t]]);
    const two = inner.tex.includes(' ');
    const tex = inner.tex === '0' ? '0' : !E ? inner.tex : two ? `\\left(${inner.tex}\\right)${E}` : lin([[c || d, `${c ? '' : 't'}${E}`]]).tex;
    return { tex, f: t => Math.exp(lam * t) * inner.f(t) };
  };
  const X = comp(x0, k * u), Y = comp(y0, k * v);
  const compC = (c, d) => {
    const inner = lin([[c, '', null, RS], [d, 't', null, AZ]]).tex;
    return inner === '0' ? '0' : !E ? inner : `\\left(${inner}\\right)e^{${AM(kv(lam, 't'))}}`;
  };
  const ch = charSys(A);
  const eq = pvi(A, x0, y0);
  return {
    skill: 'sistemaRepetido', metodos: ['repetido'], eq: sysEq(A), A,
    q: `Resolva o PVI ${T(`${sysEq(A)},\\quad \\mathbf{X}(0) = ${RS(vec(x0, y0))}`)}`,
    legend: leg(['amarelo', '\\lambda'], ['azul', '\\mathbf v'], ['verde', '\\mathbf w'], ['rosa', '\\mathbf X(0)']),
    steps: [
      `Polinômio característico: $${ch.tex.replace(' = 0', '')} = ${lam === 0 ? '\\lambda^2' : `(\\lambda ${lam < 0 ? '+' : '-'} ${Math.abs(lam)})^2`}$: autovalor <b>repetido</b> $${AM(`\\lambda = ${lam}`)}$.`,
      `$${shift(lam)} = ${mat(Nm)}$ tem posto 1: só há um autovetor, $${AZ('\\mathbf v')} = ${AZ(vec(u, v))}$. Falta uma solução.`,
      `Autovetor generalizado: $(A - ${AM('\\lambda')} I)${VD('\\mathbf w')} = ${AZ('\\mathbf v')}$ dá, por exemplo, $${VD('\\mathbf w')} = ${VD(vec(w[0], w[1]))}$. Solução geral: $\\mathbf X = c_1e^{${AM('\\lambda')} t}${AZ('\\mathbf v')} + c_2e^{${AM('\\lambda')} t}(t${AZ('\\mathbf v')} + ${VD('\\mathbf w')})$.`,
      `Atalho: como $(A - \\lambda I)^2 = 0$, $\\mathbf X(t) = e^{${AM('\\lambda')} t}\\left[${RS('\\mathbf X(0)')} + t(A - \\lambda I)${RS('\\mathbf X(0)')}\\right]$, com $(A - \\lambda I)${RS('\\mathbf X(0)')} = ${AZ(vec(k * u, k * v))}$ (sempre um múltiplo de ${T(AZ('\\mathbf v'))}).`,
      `$x(t) = ${compC(x0, k * u)}$ e $y(t) = ${compC(y0, k * v)}$: a parte rosa vem de $\\mathbf X(0)$ e a azul, da direção ${T(AZ('\\mathbf v'))}.`,
    ],
    ans: vecAns(X.f, Y.f, X.tex, Y.tex),
    spec: { type: 'system', A, X0: [x0, y0], sol: t => [X.f(t), Y.f(t)] },
  };
}

// ---------- "Qual método?" (prática intercalada de reconhecimento) ----------

export const METODOS = {
  P1: { separavel: 'Separável', linear: 'Linear: fator integrante', exata: 'Exata', nenhum: 'Nenhum dos três (precisa de outra técnica)' },
  P2: { caracteristica: 'Homogênea: equação característica', coef: 'Coeficientes a determinar', variacao: 'Variação de parâmetros' },
  P3: { fracoes: 'Frações parciais (raízes reais)', quadrado: 'Completar quadrado', deslocamento: 'Deslocamento em t (fator $e^{-cs}$)', convolucao: 'Convolução' },
  P4: { reais: 'Reais distintos: $c_1e^{\\lambda_1t}\\mathbf v_1 + c_2e^{\\lambda_2t}\\mathbf v_2$', complexos: 'Complexos: partes real e imaginária de $e^{\\lambda t}\\mathbf v$', repetido: 'Repetido: $c_1e^{\\lambda t}\\mathbf v + c_2e^{\\lambda t}(t\\mathbf v + \\mathbf w)$' },
};
// equações das listas, com a pista que denuncia o método
const BANCO = {
  P1: [
    { eq: "y' + \\frac{2}{x}y = x^2", m: ['linear'], pista: 'É da forma $y\' + p(x)y = q(x)$ e não separa ($x^2$ somado).' },
    { eq: "y' + (\\operatorname{tg} x)y = \\operatorname{sen} x", m: ['linear'], pista: 'Linear em $y$; o termo $\\operatorname{sen} x$ somado impede separar.' },
    { eq: "ty' + 2y = \\frac{\\cos t}{t}", m: ['linear'], pista: 'Divida por $t$: linear.' },
    { eq: "t\\,y' + (1 + t)y = t^2", m: ['linear'], pista: 'Linear; $p(t) = \\frac{1 + t}{t}$.' },
    { eq: "x(\\ln x)y' + (1 + \\ln x)y = x(\\ln x)^2", m: ['linear'], pista: 'Linear; repare que o lado esquerdo já é $(x\\ln x\\,y)\'$.' },
    { eq: "\\frac{dy}{dx} = \\frac{xe^{x^2}}{1 + y^2}", m: ['separavel'], pista: 'Produto de função de $x$ por função de $y$.' },
    { eq: "\\frac{dy}{dx} = 4^{2x - y}", m: ['separavel'], pista: '$4^{2x - y} = 4^{2x}\\cdot 4^{-y}$ separa.' },
    { eq: "\\frac{dy}{dx} = \\frac{x(1 + y^2)}{y(1 + x^2)}", m: ['separavel'], pista: 'Tudo de $y$ de um lado, tudo de $x$ do outro.' },
    { eq: "y' = x(y - 1)^2(y + 2)", m: ['separavel'], pista: '$x$ vezes função de $y$.' },
    { eq: "(2xy + y^2)\\,dx + (x^2 + 2xy)\\,dy = 0", m: ['exata'], pista: 'Forma $M\\,dx + N\\,dy$ com $M_y = 2x + 2y = N_x$.' },
    { eq: "(e^x\\cos y - 2y)\\,dx + (-e^x\\operatorname{sen} y - 2x)\\,dy = 0", m: ['exata'], pista: '$M_y = -e^x\\operatorname{sen} y - 2 = N_x$.' },
    { eq: "(y + y\\cos(xy))\\,dx + (x + x\\cos(xy))\\,dy = 0", m: ['exata'], pista: '$M_y = N_x = 1 + \\cos(xy) - xy\\operatorname{sen}(xy)$.' },
    { eq: "y' = y^2 + x", m: ['nenhum'], pista: 'Não é linear ($y^2$), não separa (soma) e não vem como diferencial exata: é uma equação de Riccati.' },
    { eq: "y' = \\operatorname{sen}(x + y)", m: ['nenhum'], pista: 'Não separa nem é linear; precisaria da substituição $v = x + y$.' },
  ],
  P2: [
    { eq: "y'' + 4y' + 13y = 0", m: ['caracteristica'], pista: 'Homogênea com coeficientes constantes.' },
    { eq: "4y'' - 12y' + 9y = 0", m: ['caracteristica'], pista: 'Homogênea; raiz dupla $3/2$.' },
    { eq: "y'' + 4y = 8x^2", m: ['coef', 'variacao'], pista: 'Polinômio no lado direito: chute polinomial.' },
    { eq: "y'' - y' - 6y = 10e^{2x}", m: ['coef', 'variacao'], pista: 'Exponencial: chute $Ae^{2x}$ ($2$ não é raiz).' },
    { eq: "y'' + y = x", m: ['coef', 'variacao'], pista: 'Polinômio de grau 1.' },
    { eq: "y'' + y = \\sec x", m: ['variacao'], pista: '$\\sec x$ não está na tabela de chutes.' },
    { eq: "y'' + y = \\sec(2x)", m: ['variacao'], pista: '$\\sec$ só sai com variação de parâmetros.' },
    { eq: "y'' + 9y = \\operatorname{cossec}(3x)", m: ['variacao'], pista: '$\\operatorname{cossec}$: variação.' },
    { eq: "y'' - 4y' + 4y = \\frac{e^{2x}}{x}", m: ['variacao'], pista: 'A divisão por $x$ tira da tabela.' },
    { eq: "y'' + 4y = 3\\cos 2x", m: ['coef', 'variacao'], pista: 'Cosseno: chute com fator $x$ (ressonância).' },
  ],
  P3: [
    { eq: "\\frac{s + 3}{s^2 - 3s + 2}", m: ['fracoes'], pista: '$s^2 - 3s + 2 = (s - 1)(s - 2)$.' },
    { eq: "\\frac{s}{(s - 1)^2 + 4}", m: ['quadrado'], pista: 'Já vem com o quadrado completo.' },
    { eq: "\\frac{1}{s^2 - 4s + 5}", m: ['quadrado'], pista: '$\\Delta < 0$: $(s - 2)^2 + 1$.' },
    { eq: "\\frac{e^{-2s}}{s^2 + 1}", m: ['deslocamento'], pista: 'Fator $e^{-2s}$.' },
    { eq: "\\frac{1 - e^{-2s}}{s^2}", m: ['deslocamento'], pista: 'Separe: $\\frac{1}{s^2} - \\frac{e^{-2s}}{s^2}$.' },
    { eq: "\\frac{s}{(s^2 + 1)^2}", m: ['convolucao'], pista: 'Produto $\\frac{s}{s^2 + 1}\\cdot\\frac{1}{s^2 + 1}$ (fator repetido complexo).' },
    { eq: "\\frac{1}{s(s^2 + 4)}", m: ['convolucao', 'fracoes'], pista: 'Produto de $\\frac{1}{s}$ e $\\frac{1}{s^2 + 4}$; frações parciais também resolvem.' },
    { eq: "\\frac{2s + 5}{s^2 + 4s + 3}", m: ['fracoes'], pista: '$(s + 1)(s + 3)$.' },
  ],
  P4: [
    ['3 & -2 \\\\ 2 & -2', 'reais', 'tr 1, det −2: $\\Delta = 1 + 8 > 0$.'],
    ['1 & -2 \\\\ 3 & -4', 'reais', 'tr −3, det 2: $\\Delta = 9 - 8 > 0$.'],
    ['1 & 1 \\\\ 4 & -2', 'reais', 'tr −1, det −6: det negativo sempre dá reais (sela).'],
    ['4 & -3 \\\\ 8 & -6', 'reais', 'det 0: um autovalor nulo, o outro é o traço (−2).'],
    ['2 & 10 \\\\ -1 & -5', 'reais', 'det 0: autovalores 0 e −3.'],
    ['3 & -2 \\\\ 4 & -1', 'complexos', 'tr 2, det 5: $\\Delta = 4 - 20 < 0$.'],
    ['-1 & -4 \\\\ 1 & -1', 'complexos', 'tr −2, det 5: $\\Delta < 0$.'],
    ['1 & -1 \\\\ 5 & -3', 'complexos', 'tr −2, det 2: $\\Delta = 4 - 8 < 0$.'],
    ['3 & -4 \\\\ 1 & -1', 'repetido', 'tr 2, det 1: $\\Delta = 0$ e $A \\ne I$.'],
    ['4 & -2 \\\\ 8 & -4', 'repetido', 'tr 0, det 0: $\\lambda = 0$ duplo e $A \\ne 0$.'],
    ['-3 & \\frac{5}{2} \\\\ -\\frac{5}{2} & 2', 'repetido', 'tr −1, det 1/4: $\\Delta = 0$.'],
  ].map(([m, k, pista]) => ({ eq: `\\mathbf{X}' = \\begin{pmatrix} ${m} \\end{pmatrix}\\mathbf{X}`, m: [k], pista: `${pista}` })),
};

function genMetodo(prova) {
  return r => {
    const opts = METODOS[prova];
    let item;
    if (r() < 0.5) item = pk(r, BANCO[prova]);
    else {
      const gens = { P1: [genLinear1, genSeparavel, genExata], P2: [genHomogenea2, genCoefIndet, genVariacao], P3: [genLaplaceInversa, genConvolucao], P4: [genSistemaReal, genSistemaComplexo, genSistemaRepetido] }[prova];
      const g = pk(r, gens)(r);
      if (!g.metodos.length || g.metodos.includes('nenhum') || !g.metodos.every(m => m in opts)) return genMetodo(prova)(r);
      item = { eq: prova === 'P4' ? g.eq : g.eq.replace(/^F\(s\) = /, '').replace(/,\\quad.*$/, '').replace(/,\\ x > 0$/, ''), m: g.metodos, pista: prova === 'P4' ? 'Calcule traço e determinante: $\\Delta = \\text{tr}^2 - 4\\det$ decide (> 0 reais, < 0 complexos, = 0 repetido).' : 'Gerada pelo treino: compare com as receitas do guia.' };
    }
    const keys = Object.keys(opts);
    const what = prova === 'P3' ? `Qual técnica inverte ${T(`F(s) = ${item.eq}`)}?` : prova === 'P4' ? `Qual é a forma da solução geral de ${T(item.eq)}?` : `Qual método resolve ${T(item.eq)}?`;
    return {
      skill: `metodo${prova}`, metodos: item.m, eq: item.eq,
      q: what,
      steps: [`Pista: ${item.pista}`, `Resposta: <b>${opts[item.m[0]]}</b>${item.m.length > 1 ? ` (também funciona: ${item.m.slice(1).map(m => opts[m]).join(', ')})` : ''}.`],
      ans: { kind: 'choice', options: keys.map(k => opts[k]), correct: keys.indexOf(item.m[0]), accept: item.m.slice(1).map(m => keys.indexOf(m)), shuffle: false },
    };
  };
}

// ---------- Catálogo de habilidades ----------

export const SKILLS = [
  { id: 'linear1', prova: 'P1', nome: 'Linear de 1ª ordem', lista: 'L1 · 1–7', peso: 7, gen: genLinear1 },
  { id: 'separavel', prova: 'P1', nome: 'Separáveis', lista: 'L1 · 8, 10, 11, 13', peso: 4, gen: genSeparavel },
  { id: 'exata', prova: 'P1', nome: 'Exatas', lista: 'L1 · 14–19', peso: 6, gen: genExata },
  { id: 'teu', prova: 'P1', nome: 'Existência, unicidade e intervalo', lista: 'L1 · 3, 6, 7, 20–26', peso: 10, gen: genTeu },
  { id: 'autonoma', prova: 'P1', nome: 'Autônomas e equilíbrios', lista: 'L1 · 9, 12', peso: 2, gen: genAutonoma },
  { id: 'metodoP1', prova: 'P1', nome: 'Qual método? (1ª ordem)', lista: 'toda a L1', peso: 0, gen: genMetodo('P1') },
  { id: 'wronskiano', prova: 'P2', nome: 'Wronskiano e independência', lista: 'L2 · 1–4', peso: 4, gen: genWronskiano },
  { id: 'homogenea2', prova: 'P2', nome: 'Homogênea: equação característica', lista: 'L2 · 5–10', peso: 7, gen: genHomogenea2 },
  { id: 'coefIndet', prova: 'P2', nome: 'Coeficientes a determinar', lista: 'L2 · 11–13', peso: 3, gen: genCoefIndet },
  { id: 'variacao', prova: 'P2', nome: 'Variação de parâmetros', lista: 'L2 · 14–17', peso: 4, gen: genVariacao },
  { id: 'metodoP2', prova: 'P2', nome: 'Qual método? (2ª ordem)', lista: 'toda a L2', peso: 0, gen: genMetodo('P2') },
  { id: 'laplaceDireta', prova: 'P3', nome: 'Transformada direta (degrau, delta)', lista: 'L3 · 1, 4, 7', peso: 13, gen: genLaplaceDireta },
  { id: 'laplaceInversa', prova: 'P3', nome: 'Transformada inversa', lista: 'L3 · 2, 6', peso: 9, gen: genLaplaceInversa },
  { id: 'laplacePvi', prova: 'P3', nome: 'PVI por Laplace', lista: 'L3 · 3, 5, 8', peso: 12, gen: genLaplacePvi },
  { id: 'convolucao', prova: 'P3', nome: 'Convolução', lista: 'L3 · 9–11', peso: 7, gen: genConvolucao },
  { id: 'metodoP3', prova: 'P3', nome: 'Qual técnica? (inversa)', lista: 'toda a L3', peso: 0, gen: genMetodo('P3') },
  { id: 'sistemaReal', prova: 'P4', nome: 'Sistemas: autovalores reais (e nulo)', lista: 'L4 · 1, 2', peso: 10, gen: genSistemaReal },
  { id: 'sistemaComplexo', prova: 'P4', nome: 'Sistemas: autovalores complexos', lista: 'L4 · 3', peso: 4, gen: genSistemaComplexo },
  { id: 'sistemaRepetido', prova: 'P4', nome: 'Sistemas: autovalor repetido', lista: 'L4 · 4', peso: 4, gen: genSistemaRepetido },
  { id: 'metodoP4', prova: 'P4', nome: 'Qual caso? (sistemas)', lista: 'toda a L4', peso: 0, gen: genMetodo('P4') },
];
export const skillById = id => SKILLS.find(s => s.id === id);

/** Gera uma questão da habilidade `id` (r: gerador uniforme em [0, 1)). */
export function generate(id, r = Math.random) {
  for (let tries = 0; tries < 20; tries++) {
    try { return skillById(id).gen(r); }
    catch (e) { if (tries === 19) throw e; }
  }
}

/** Sequência intercalada: alterna habilidades sem repetir a mesma em seguida. */
export function interleave(ids, n, r = Math.random) {
  const out = [];
  let pool = [];
  while (out.length < n) {
    if (!pool.length) pool = [...ids].sort(() => r() - 0.5);
    const i = pool.findIndex(id => id !== out.at(-1));
    out.push(pool.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}

// ---------- Domínio (níveis no estilo Khan Academy) e revisão espaçada ----------

export const LEVELS = ['Não iniciado', 'Tentado', 'Familiar', 'Proficiente', 'Dominado'];
export const SESSION = 5; // questões por rodada de prática
// dias até a próxima revisão, por nível (Leitner): quanto mais sólido, mais espaçado
export const INTERVAL_DAYS = [0, 1, 2, 4, 8];

/** Nível depois de uma rodada de prática de uma habilidade (dica usada conta como erro). */
export function levelAfterPractice(level, right, total = SESSION) {
  const pct = right / total;
  if (pct === 1) return Math.max(level, 3);
  if (pct >= 0.7) return 2;
  return 1;
}

/** Nível depois de uma questão do simulado intercalado (o "teste da unidade"). */
export function levelAfterTest(level, ok) {
  if (ok) return level < 2 ? 2 : Math.min(4, level + 1);
  return Math.max(1, level - 1);
}

/** Habilidades vencidas para revisão (já praticadas e com o intervalo esgotado). */
export function dueSkills(state, now = Date.now()) {
  return Object.entries(state.skills ?? {})
    .filter(([, s]) => s.level > 0 && s.last && now - s.last >= INTERVAL_DAYS[s.level] * 864e5)
    .map(([id]) => id);
}
