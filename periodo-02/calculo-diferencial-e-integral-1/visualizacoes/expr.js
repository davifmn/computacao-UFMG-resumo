// Expressões matemáticas em x: análise sintática, avaliação, derivada simbólica,
// simplificação e conversão para TeX. Sem eval() — tudo sobre a árvore sintática.
//
//   const f = parse('x^2 sin(x)');
//   evaluate(f, 2)           → 3.637...
//   toTex(derive(f))         → '2x\\sin x + x^{2}\\cos x'

const FUNCS = ['sin', 'cos', 'tan', 'exp', 'ln', 'log', 'sqrt', 'abs', 'arctan'];
const CONSTS = { pi: Math.PI, e: Math.E };

// ---------- Análise léxica e sintática ----------

function tokenize(src) {
  const toks = [];
  const re = /\s*(?:(\d+\.?\d*|\.\d+)|([a-zA-Zπ]+)|(\*\*|[-+*/^()]))/y;
  let m;
  re.lastIndex = 0;
  while (re.lastIndex < src.length) {
    const start = re.lastIndex;
    if (/^\s*$/.test(src.slice(start))) break;
    m = re.exec(src);
    if (!m) throw new SyntaxError(`Símbolo inesperado "${src[start]}"`);
    if (m[1]) toks.push({ t: 'num', v: parseFloat(m[1]) });
    else if (m[2]) {
      // separa sequências como "xsin" ou "pix" em identificadores conhecidos
      let word = m[2].replace('π', 'pi').toLowerCase();
      while (word) {
        const f = [...FUNCS, ...Object.keys(CONSTS), 'x'].sort((a, b) => b.length - a.length).find(k => word.startsWith(k));
        if (!f) throw new SyntaxError(`Nome desconhecido "${word}". Use x, pi, e, ${FUNCS.join(', ')}`);
        toks.push({ t: 'id', v: f });
        word = word.slice(f.length);
      }
    } else toks.push({ t: 'op', v: m[3] === '**' ? '^' : m[3] });
  }
  return toks;
}

export function parse(src) {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i];
  const isOp = v => peek()?.t === 'op' && peek().v === v;
  const startsAtom = () => peek() && (peek().t === 'num' || peek().t === 'id' || isOp('('));

  function expr() {
    let a = term();
    while (isOp('+') || isOp('-')) {
      const op = toks[i++].v;
      a = { t: op === '+' ? 'add' : 'sub', a, b: term() };
    }
    return a;
  }
  function term() {
    let a = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) { const op = toks[i++].v; a = { t: op === '*' ? 'mul' : 'div', a, b: unary() }; }
      else if (startsAtom()) a = { t: 'mul', a, b: power() };   // multiplicação implícita: 2x, x sin(x)
      else return a;
    }
  }
  function unary() {
    if (isOp('-')) { i++; return { t: 'neg', a: unary() }; }
    if (isOp('+')) { i++; return unary(); }
    return power();
  }
  function power() {
    const base = atom();
    if (isOp('^')) { i++; return { t: 'pow', a: base, b: unary() }; }  // associa à direita
    return base;
  }
  function atom() {
    const tk = toks[i++];
    if (!tk) throw new SyntaxError('A expressão terminou antes do esperado');
    if (tk.t === 'num') return { t: 'num', v: tk.v };
    if (tk.t === 'id') {
      if (tk.v === 'x') return { t: 'x' };
      if (tk.v in CONSTS) return { t: 'const', name: tk.v };
      if (isOp('(')) { i++; const a = expr(); expect(')'); return { t: 'fn', name: tk.v, a }; }
      return { t: 'fn', name: tk.v, a: power() };                  // "sin x" sem parênteses
    }
    if (tk.v === '(') { const a = expr(); expect(')'); return a; }
    throw new SyntaxError(`Não esperava "${tk.v}"`);
  }
  function expect(v) { if (!isOp(v)) throw new SyntaxError(`Faltou "${v}"`); i++; }

  if (!toks.length) throw new SyntaxError('Digite uma função de x');
  const tree = expr();
  if (i < toks.length) throw new SyntaxError(`Sobrou "${toks[i].v}" no fim`);
  return tree;
}

// ---------- Avaliação ----------

const F = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, ln: Math.log, log: Math.log10,
  sqrt: Math.sqrt, abs: Math.abs, arctan: Math.atan,
};

export function evaluate(n, x) {
  switch (n.t) {
    case 'num': return n.v;
    case 'x': return x;
    case 'const': return CONSTS[n.name];
    case 'neg': return -evaluate(n.a, x);
    case 'add': return evaluate(n.a, x) + evaluate(n.b, x);
    case 'sub': return evaluate(n.a, x) - evaluate(n.b, x);
    case 'mul': return evaluate(n.a, x) * evaluate(n.b, x);
    case 'div': return evaluate(n.a, x) / evaluate(n.b, x);
    case 'pow': {
      const b = evaluate(n.a, x), e = evaluate(n.b, x);
      // raiz ímpar de negativo: (-8)^(1/3) = -2
      if (b < 0 && !Number.isInteger(e)) {
        const inv = 1 / e;
        if (Number.isInteger(Math.round(inv)) && Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2) return -((-b) ** e);
      }
      return b ** e;
    }
    case 'fn': return F[n.name](evaluate(n.a, x));
  }
  throw new Error(`Nó desconhecido ${n.t}`);
}

export const compile = tree => x => evaluate(tree, x);

// ---------- Derivada simbólica ----------

const num = v => ({ t: 'num', v });
const hasX = n => n.t === 'x' || (n.a && hasX(n.a)) || (n.b && hasX(n.b));

export function derive(n) {
  const d = derive;
  switch (n.t) {
    case 'num': case 'const': return num(0);
    case 'x': return num(1);
    case 'neg': return { t: 'neg', a: d(n.a) };
    case 'add': return { t: 'add', a: d(n.a), b: d(n.b) };
    case 'sub': return { t: 'sub', a: d(n.a), b: d(n.b) };
    case 'mul':  // regra do produto
      return { t: 'add', a: { t: 'mul', a: d(n.a), b: n.b }, b: { t: 'mul', a: n.a, b: d(n.b) } };
    case 'div':  // regra do quociente
      return { t: 'div', a: { t: 'sub', a: { t: 'mul', a: d(n.a), b: n.b }, b: { t: 'mul', a: n.a, b: d(n.b) } }, b: { t: 'pow', a: n.b, b: num(2) } };
    case 'pow': {
      const u = n.a, v = n.b;
      if (!hasX(v)) // regra da potência (com cadeia): (u^c)' = c·u^(c−1)·u'
        return { t: 'mul', a: { t: 'mul', a: v, b: { t: 'pow', a: u, b: { t: 'sub', a: v, b: num(1) } } }, b: d(u) };
      if (!hasX(u)) // exponencial: (a^v)' = a^v · ln a · v'
        return { t: 'mul', a: { t: 'mul', a: n, b: { t: 'fn', name: 'ln', a: u } }, b: d(v) };
      // caso geral: u^v = e^(v ln u)
      return { t: 'mul', a: n, b: { t: 'add', a: { t: 'mul', a: d(v), b: { t: 'fn', name: 'ln', a: u } }, b: { t: 'div', a: { t: 'mul', a: v, b: d(u) }, b: u } } };
    }
    case 'fn': {
      const u = n.a, du = d(u);
      const outer = {
        sin: () => ({ t: 'fn', name: 'cos', a: u }),
        cos: () => ({ t: 'neg', a: { t: 'fn', name: 'sin', a: u } }),
        tan: () => ({ t: 'div', a: num(1), b: { t: 'pow', a: { t: 'fn', name: 'cos', a: u }, b: num(2) } }),
        exp: () => ({ t: 'fn', name: 'exp', a: u }),
        ln: () => ({ t: 'div', a: num(1), b: u }),
        log: () => ({ t: 'div', a: num(1), b: { t: 'mul', a: u, b: { t: 'fn', name: 'ln', a: num(10) } } }),
        sqrt: () => ({ t: 'div', a: num(1), b: { t: 'mul', a: num(2), b: { t: 'fn', name: 'sqrt', a: u } } }),
        abs: () => ({ t: 'div', a: u, b: { t: 'fn', name: 'abs', a: u } }),
        arctan: () => ({ t: 'div', a: num(1), b: { t: 'add', a: num(1), b: { t: 'pow', a: u, b: num(2) } } }),
      }[n.name]();
      return { t: 'mul', a: outer, b: du };   // regra da cadeia
    }
  }
  throw new Error(`Nó desconhecido ${n.t}`);
}

// ---------- Simplificação (algébrica leve, só para deixar o resultado legível) ----------

const isNum = (n, v) => n.t === 'num' && (v === undefined || n.v === v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Números racionais exatos: inteiro, p/q ou −(p/q) viram [p, q] para somar frações sem arredondar.
const gcdInt = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
function rat(n) {
  if (n.t === 'num' && Number.isInteger(n.v)) return [n.v, 1];
  if (n.t === 'neg') { const r = rat(n.a); return r && [-r[0], r[1]]; }
  if (n.t === 'div' && isNum(n.a) && isNum(n.b) && Number.isInteger(n.a.v) && Number.isInteger(n.b.v) && n.b.v !== 0) return [n.a.v, n.b.v];
  return null;
}
function mkRat(p, q) {
  if (q < 0) { p = -p; q = -q; }
  const g = gcdInt(p, q);
  p /= g; q /= g;
  if (q === 1) return num(p);
  const frac = { t: 'div', a: num(Math.abs(p)), b: num(q) };
  return p < 0 ? { t: 'neg', a: frac } : frac;
}
const leftmostIsNum = n => (n.t === 'num' ? true : ['mul', 'div'].includes(n.t) ? leftmostIsNum(n.a) : n.t === 'neg');

function simp1(n) {
  if (n.a) n = { ...n, a: simp1(n.a) };
  if (n.b) n = { ...n, b: simp1(n.b) };
  const { a, b } = n;
  const ra = a && rat(a), rb = b && rat(b);
  if (ra && rb && ['add', 'sub', 'mul', 'div'].includes(n.t)) {
    const [p, q] = ra, [r, t] = rb;
    const res = { add: [p * t + r * q, q * t], sub: [p * t - r * q, q * t], mul: [p * r, q * t], div: [p * t, q * r] }[n.t];
    if (res[1] !== 0) { const out = mkRat(...res); if (!same(out, n)) return out; }
  }
  switch (n.t) {
    case 'neg':
      if (isNum(a)) return num(-a.v);
      if (a.t === 'neg') return a.a;
      return n;
    case 'add':
      if (isNum(a) && isNum(b)) return num(a.v + b.v);
      if (isNum(a, 0)) return b;
      if (isNum(b, 0)) return a;
      if (b.t === 'neg') return { t: 'sub', a, b: b.a };
      if (isNum(b) && b.v < 0) return { t: 'sub', a, b: num(-b.v) };
      if (same(a, b)) return { t: 'mul', a: num(2), b: a };
      return n;
    case 'sub':
      if (isNum(a) && isNum(b)) return num(a.v - b.v);
      if (isNum(b, 0)) return a;
      if (isNum(a, 0)) return { t: 'neg', a: b };
      if (same(a, b)) return num(0);
      if (b.t === 'neg') return { t: 'add', a, b: b.a };
      return n;
    case 'mul':
      if (isNum(a) && isNum(b)) return num(a.v * b.v);
      if (isNum(a, 0) || isNum(b, 0)) return num(0);
      if (isNum(a, 1)) return b;
      if (isNum(b, 1)) return a;
      if (isNum(a, -1)) return { t: 'neg', a: b };
      if (isNum(b, -1)) return { t: 'neg', a };
      if (isNum(b) && !isNum(a)) return { t: 'mul', a: b, b: a };               // número na frente
      if (isNum(a) && b.t === 'mul' && isNum(b.a)) return { t: 'mul', a: num(a.v * b.a.v), b: b.b };
      if (!isNum(a) && b.t === 'mul' && isNum(b.a)) return { t: 'mul', a: b.a, b: { t: 'mul', a: b.b, b: a } };
      if (a.t === 'neg') return { t: 'neg', a: { t: 'mul', a: a.a, b } };
      if (b.t === 'neg') return { t: 'neg', a: { t: 'mul', a, b: b.a } };
      if (same(a, b)) return { t: 'pow', a, b: num(2) };
      if (a.t === 'x' && b.t === 'pow' && b.a.t === 'x' && isNum(b.b)) return { t: 'pow', a: a, b: num(b.b.v + 1) };
      if (b.t === 'div' && isNum(b.a, 1)) return { t: 'div', a, b: b.b };        // a · (1/b) = a/b
      if (isNum(a) && b.t === 'div') return { t: 'div', a: { t: 'mul', a, b: b.a }, b: b.b };  // 2 · (u/v) = 2u/v
      if (a.t === 'div' && isNum(a.a, 1)) return { t: 'div', a: b, b: a.b };
      return n;
    case 'div':
      if (isNum(a, 0)) return num(0);
      if (isNum(b, 1)) return a;
      if (isNum(a) && isNum(b) && Number.isInteger(a.v / b.v)) return num(a.v / b.v);
      if (same(a, b)) return num(1);
      if (a.t === 'neg') return { t: 'neg', a: { t: 'div', a: a.a, b } };
      if (isNum(a) && a.v < 0) return { t: 'neg', a: { t: 'div', a: num(-a.v), b } };
      {
        // cancela coeficientes numéricos: (6u)/(4w) = 3u/(2w)
        const coef = m => (isNum(m) ? [m.v, null] : m.t === 'mul' && isNum(m.a) ? [m.a.v, m.b] : [1, m]);
        const [p, u] = coef(a), [q, w] = coef(b);
        if (Number.isInteger(p) && Number.isInteger(q) && (p !== 1 || q !== 1)) {
          const g = gcdInt(p, q);
          if (g > 1) {
            const top = u ? { t: 'mul', a: num(p / g), b: u } : num(p / g);
            const bot = w ? { t: 'mul', a: num(q / g), b: w } : num(q / g);
            return { t: 'div', a: top, b: bot };
          }
        }
      }
      return n;
    case 'pow':
      if (isNum(b, 0)) return num(1);
      if (isNum(b, 1)) return a;
      if (isNum(a) && isNum(b)) return num(a.v ** b.v);
      if (a.t === 'pow' && isNum(a.b) && isNum(b)) return { t: 'pow', a: a.a, b: num(a.b.v * b.v) };
      return n;
    case 'fn':
      if (n.name === 'ln' && a.t === 'const' && a.name === 'e') return num(1);
      if (n.name === 'ln' && isNum(a, 1)) return num(0);
      return n;
  }
  return n;
}

export function simplify(n) {
  let cur = n, prev;
  for (let k = 0; k < 20; k++) {
    prev = JSON.stringify(cur);
    cur = simp1(cur);
    if (JSON.stringify(cur) === prev) break;
  }
  return cur;
}

// ---------- TeX ----------

const PREC = { add: 1, sub: 1, neg: 2, mul: 3, div: 3, pow: 5, fn: 6, num: 7, x: 7, const: 7 };
const fmtNum = v => {
  const r = Math.round(v * 1e6) / 1e6;
  return String(r).replace('.', '{,}');
};

export function toTex(n, parentPrec = 0) {
  const p = PREC[n.t];
  const wrap = s => (p < parentPrec ? `\\left(${s}\\right)` : s);
  switch (n.t) {
    case 'num': return n.v < 0 && parentPrec > 1 ? `\\left(${fmtNum(n.v)}\\right)` : fmtNum(n.v);
    case 'x': return 'x';
    case 'const': return n.name === 'pi' ? '\\pi' : 'e';
    case 'neg': return wrap(`-${toTex(n.a, 3)}`);
    case 'add': return wrap(`${toTex(n.a, 1)} + ${toTex(n.b, 1)}`);
    case 'sub': return wrap(`${toTex(n.a, 1)} - ${toTex(n.b, 2)}`);
    case 'mul': {
      const left = toTex(n.a, 3), right = toTex(n.b, n.b.t === 'mul' ? 3 : 3.5);
      // Justapõe (2x, x sin x, 3(x+1)); usa "·" quando juntar confundiria:
      // número à direita (x·2), função à esquerda (sin x · x) ou sinal negativo.
      const needsDot = leftmostIsNum(n.b) || n.b.t === 'neg' || n.a.t === 'fn' || (n.a.t === 'div') || (n.b.t === 'pow' && n.b.a.t === 'num');
      return wrap(needsDot ? `${left} \\cdot ${right}` : `${left}${n.b.t === 'fn' ? '\\,' : ' '}${right}`);
    }
    case 'div': return `\\frac{${toTex(n.a)}}{${toTex(n.b)}}`;
    case 'pow':
      if (n.a.t === 'const' && n.a.name === 'e') return `e^{${toTex(n.b)}}`;
      if (isNum(n.b, 0.5)) return `\\sqrt{${toTex(n.a)}}`;
      return wrap(`${toTex(n.a, 7)}^{${toTex(n.b)}}`);   // (cos x)^2, nunca cos x^2
    case 'fn': {
      const inner = toTex(n.a);
      if (n.name === 'sqrt') return `\\sqrt{${inner}}`;
      if (n.name === 'abs') return `\\left|${inner}\\right|`;
      if (n.name === 'exp') return `e^{${inner}}`;
      const name = { sin: '\\sin', cos: '\\cos', tan: '\\tan', ln: '\\ln', log: '\\log', arctan: '\\arctan' }[n.name];
      const simple = n.a.t === 'x' || n.a.t === 'num';
      return wrap(simple ? `${name} ${inner}` : `${name}\\left(${inner}\\right)`);
    }
  }
  return '?';
}

/** Derivada numérica (diferença central), usada para conferir a simbólica. */
export const numericDerivative = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);

/** Somas de Riemann e regra do trapézio. */
export function riemann(f, a, b, n, method = 'meio') {
  const dx = (b - a) / n;
  let s = 0;
  const rects = [];
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx, x1 = x0 + dx;
    if (method === 'trapezio') {
      const y0 = f(x0), y1 = f(x1);
      s += ((y0 + y1) / 2) * dx;
      rects.push({ x0, x1, y0, y1 });
    } else {
      const xs = method === 'esquerda' ? x0 : method === 'direita' ? x1 : (x0 + x1) / 2;
      const y = f(xs);
      s += y * dx;
      rects.push({ x0, x1, y0: y, y1: y, xs });
    }
  }
  return { sum: s, rects, dx };
}

/** Integral "exata" por Simpson composto com muitos pontos (referência para o erro). */
export function simpson(f, a, b, n = 2000) {
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
