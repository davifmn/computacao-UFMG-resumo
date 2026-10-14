// Interpretador de uma pequena linguagem imperativa com procedimentos aninhados,
// para comparar escopo estático × dinâmico e os modos de passagem de parâmetros
// (valor, referência, valor-resultado e nome), mostrando os registros de ativação.
//
//   var x = 1          var v[3]          x = e          v[e] = e
//   proc p(a, b) { … }                    p(e1, e2)      print e

// ---------- Parser ----------

function tokenize(src) {
  const toks = [];
  const re = /([ \t]+|\/\/[^\n]*)|(\n)|(\d+)|([A-Za-z_]\w*)|([-+*()[\]{},=])/y;
  let pos = 0, line = 1;
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) throw new Error(`linha ${line}: caractere inesperado "${src[pos]}"`);
    pos = re.lastIndex;
    if (m[1]) continue;
    if (m[2]) { line++; continue; }
    toks.push({ v: m[0], line, kind: m[3] ? 'num' : m[4] ? 'id' : 'p' });
  }
  return toks;
}

export function parse(src) {
  const toks = tokenize(src);
  let i = 0;
  const peek = (k = 0) => toks[i + k]?.v;
  const eat = v => { if (toks[i]?.v !== v) throw new Error(`linha ${toks[i]?.line ?? '?'}: esperava "${v}"${toks[i] ? `, achou "${toks[i].v}"` : ''}`); return toks[i++]; };
  const ident = () => { if (toks[i]?.kind !== 'id') throw new Error(`linha ${toks[i]?.line ?? '?'}: esperava um nome`); return toks[i++].v; };

  function block() {
    const out = [];
    while (i < toks.length && peek() !== '}') out.push(stmt());
    return out;
  }
  function stmt() {
    const line = toks[i].line;
    if (peek() === 'var') {
      i++;
      const name = ident();
      if (peek() === '[') { i++; const n = +eat(toks[i].v).v; eat(']'); return { k: 'arr', name, n, line }; }
      eat('=');
      return { k: 'decl', name, e: expr(), line };
    }
    if (peek() === 'proc') {
      i++;
      const name = ident();
      eat('(');
      const params = [];
      if (peek() !== ')') { params.push(ident()); while (peek() === ',') { i++; params.push(ident()); } }
      eat(')'); eat('{');
      const body = block();
      const end = eat('}').line;
      return { k: 'proc', name, params, body, line, end };
    }
    if (peek() === 'print') { i++; return { k: 'print', e: expr(), line }; }
    const name = ident();
    if (peek() === '(') {
      i++;
      const args = [];
      if (peek() !== ')') { args.push(expr()); while (peek() === ',') { i++; args.push(expr()); } }
      eat(')');
      return { k: 'call', name, args, line };
    }
    let target = { k: 'name', name };
    if (peek() === '[') { i++; target = { k: 'index', name, idx: expr() }; eat(']'); }
    eat('=');
    return { k: 'assign', target, e: expr(), line };
  }
  function expr() {
    let l = term();
    while (peek() === '+' || peek() === '-') { const op = toks[i++].v; l = { k: 'bin', op, l, r: term() }; }
    return l;
  }
  function term() {
    let l = factor();
    while (peek() === '*') { i++; l = { k: 'bin', op: '*', l, r: factor() }; }
    return l;
  }
  function factor() {
    const t = toks[i];
    if (!t) throw new Error('expressão incompleta');
    if (t.kind === 'num') { i++; return { k: 'num', v: +t.v }; }
    if (t.v === '(') { i++; const e = expr(); eat(')'); return e; }
    const name = ident();
    if (peek() === '[') { i++; const idx = expr(); eat(']'); return { k: 'index', name, idx }; }
    return { k: 'name', name };
  }
  const prog = block();
  if (i < toks.length) throw new Error(`linha ${toks[i].line}: "}" sem par`);
  return prog;
}

export const showExpr = e => (e.k === 'num' ? String(e.v) : e.k === 'name' ? e.name : e.k === 'index' ? `${e.name}[${showExpr(e.idx)}]` : `${showExpr(e.l)} ${e.op} ${showExpr(e.r)}`);

// ---------- Interpretador ----------
// Uma "célula" é { v } (um inteiro) e pertence a um registro de ativação.
// Ligações num registro: { cell } | { arr: [cells] } | { proc, def } | { thunk: expr, env } (passagem por nome)

export const MODES = { valor: 'valor', referencia: 'referência', 'valor-resultado': 'valor-resultado', nome: 'nome' };

export function run(src, { scope = 'estatico', mode = 'valor', maxSteps = 400 } = {}) {
  const prog = parse(src);
  const steps = [], output = [];
  let nextFrame = 0, count = 0;
  const frames = [];                     // pilha de execução
  const newFrame = (name, staticLink, dynLink) => ({ id: nextFrame++, name, vars: new Map(), staticLink, dynLink });
  const main = newFrame('principal', null, null);
  frames.push(main);

  const chain = f => (scope === 'estatico' ? f.staticLink : f.dynLink);
  const lookup = (f, name) => {
    const path = [];
    for (let c = f; c; c = chain(c)) { path.push(c.id); if (c.vars.has(name)) return { frame: c, b: c.vars.get(name), path }; }
    throw new Error(`"${name}" não está declarado`);
  };

  function cellOf(f, target) {
    if (target.k === 'name') {
      const { b, frame, path } = lookup(f, target.name);
      if (b.thunk) return { ...cellOf(b.env, b.thunk), via: `${target.name} (por nome: ${showExpr(b.thunk)})`, path };
      if (!b.cell) throw new Error(`"${target.name}" não é uma variável simples`);
      return { cell: b.cell, frame, path, desc: target.name };
    }
    const idx = evalE(f, target.idx);
    const { b, path } = lookup(f, target.name);
    if (b.thunk) throw new Error('vetor passado por nome não é suportado');
    if (!b.arr) throw new Error(`"${target.name}" não é um vetor`);
    if (idx < 0 || idx >= b.arr.length) throw new Error(`índice ${idx} fora de ${target.name}[0..${b.arr.length - 1}]`);
    return { cell: b.arr[idx], path, desc: `${target.name}[${idx}]` };
  }
  function evalE(f, e) {
    if (e.k === 'num') return e.v;
    if (e.k === 'bin') { const a = evalE(f, e.l), b = evalE(f, e.r); return e.op === '+' ? a + b : e.op === '-' ? a - b : a * b; }
    if (e.k === 'name') {
      const { b } = lookup(f, e.name);
      if (b.thunk) return evalE(b.env, b.thunk);
      if (b.cell) return b.cell.v;
      throw new Error(`"${e.name}" não é um valor`);
    }
    return cellOf(f, e).cell.v;
  }

  const cellIds = new Map();
  const cellName = c => { if (!cellIds.has(c)) cellIds.set(c, cellIds.size); return cellIds.get(c); };
  function snapshot() {
    // Para cada ligação, descreve o valor e (se for apelido) a quem aponta
    const owner = new Map();
    for (const fr of frames) for (const [n, b] of fr.vars) {
      if (b.cell && !b.alias) owner.set(b.cell, `${n} de ${fr.name}`);
      if (b.arr) b.arr.forEach((c, k) => owner.set(c, `${n}[${k}] de ${fr.name}`));
    }
    return frames.map(fr => ({
      id: fr.id, name: fr.name, staticLink: fr.staticLink?.id ?? null, dynLink: fr.dynLink?.id ?? null,
      vars: [...fr.vars].map(([n, b]) => {
        if (b.proc) return { n, kind: 'proc', show: `proc (def. em ${b.def.name})` };
        if (b.arr) return { n, kind: 'arr', show: `[${b.arr.map(c => c.v).join(', ')}]` };
        if (b.thunk) return { n, kind: 'nome', show: `⟨${showExpr(b.thunk)}⟩ em ${b.env.name}` };
        if (b.alias) return { n, kind: 'ref', show: `→ ${owner.get(b.cell) ?? '?'} (${b.cell.v})`, cell: cellName(b.cell) };
        return { n, kind: 'val', show: String(b.cell.v), extra: b.copyBack ? `copia de volta para ${b.copyBack.desc}` : null };
      }),
    }));
  }
  const snap = (line, msg, extra = {}) => {
    if (++count > maxSteps) throw new Error('passos demais (laço de recursão?)');
    steps.push({ line, msg, frames: snapshot(), output: [...output], top: frames.at(-1).id, ...extra });
  };
  const where = (f, name, r) => (r.frame === f ? '' : ` — achado em <b>${r.frame.name}</b> seguindo o elo ${scope === 'estatico' ? 'estático' : 'dinâmico'}`);

  function exec(f, stmts) {
    for (const s of stmts) {
      switch (s.k) {
        case 'decl': { const v = evalE(f, s.e); f.vars.set(s.name, { cell: { v } }); snap(s.line, `Declara <b>${s.name} = ${v}</b> no registro de ${f.name}.`); break; }
        case 'arr': f.vars.set(s.name, { arr: Array.from({ length: s.n }, () => ({ v: 0 })) }); snap(s.line, `Declara o vetor ${s.name}[${s.n}], zerado.`); break;
        case 'proc': f.vars.set(s.name, { proc: s, def: f }); snap(s.line, `Declara o procedimento <b>${s.name}</b> dentro de ${f.name}. Ele "lembra" onde foi definido: é isso que o escopo estático usa.`); break;
        case 'print': {
          const v = evalE(f, s.e);
          output.push(v);
          let note = '';
          if (s.e.k === 'name') { const r = lookup(f, s.e.name); note = where(f, s.e.name, r); }
          snap(s.line, `print ${showExpr(s.e)} → <b>${v}</b>${note}.`, { path: s.e.k === 'name' ? lookup(f, s.e.name).path : null });
          break;
        }
        case 'assign': {
          const v = evalE(f, s.e);
          const c = cellOf(f, s.target);
          c.cell.v = v;
          const r = s.target.k === 'name' ? lookup(f, s.target.name) : null;
          const b = r?.b;
          let note = r ? where(f, s.target.name, r) : '';
          if (b?.alias) note += ' — é um <b>apelido</b>: a escrita vai direto para a variável do chamador';
          if (b?.thunk || c.via) note += ` — por nome: <code>${showExpr(b?.thunk ?? s.target)}</code> é reavaliado <b>agora</b>, no ambiente do chamador (${c.desc ?? ''})`;
          snap(s.line, `${showExpr(s.target)} = ${showExpr(s.e)} → <b>${v}</b>${note}.`, { path: r?.path });
          break;
        }
        case 'call': call(f, s); break;
      }
    }
  }

  function call(f, s) {
    const r = lookup(f, s.name);
    if (!r.b.proc) throw new Error(`"${s.name}" não é um procedimento`);
    const def = r.b.proc;
    if (def.params.length !== s.args.length) throw new Error(`${s.name} espera ${def.params.length} argumento(s)`);
    const staticLink = r.b.def;
    const nf = newFrame(s.name, staticLink, f);
    const copies = [];
    const desc = [];
    def.params.forEach((p, k) => {
      const a = s.args[k];
      const isLvalue = a.k === 'name' || a.k === 'index';
      if (mode === 'valor' || (!isLvalue && mode !== 'nome')) {
        nf.vars.set(p, { cell: { v: evalE(f, a) } });
        desc.push(`${p} = ${evalE(f, a)} (cópia)`);
      } else if (mode === 'referencia') {
        const c = cellOf(f, a);
        nf.vars.set(p, { cell: c.cell, alias: true });
        desc.push(`${p} é apelido de ${c.desc}`);
      } else if (mode === 'valor-resultado') {
        const c = cellOf(f, a);
        const b = { cell: { v: c.cell.v }, copyBack: { cell: c.cell, desc: c.desc } };
        nf.vars.set(p, b);
        copies.push([p, b]);
        desc.push(`${p} = ${c.cell.v} (cópia; volta para ${c.desc} no fim)`);
      } else {
        nf.vars.set(p, { thunk: a, env: f });
        desc.push(`${p} = ⟨${showExpr(a)}⟩, reavaliado a cada uso`);
      }
    });
    frames.push(nf);
    snap(s.line, `Chama <b>${s.name}</b>: novo registro de ativação no topo da pilha. Elo dinâmico → ${f.name} (quem chamou); elo estático → ${staticLink.name} (onde ${s.name} foi definido).${desc.length ? ` Parâmetros por ${MODES[mode]}: ${desc.join('; ')}.` : ''}`, { call: true });
    exec(nf, def.body);
    for (const [p, b] of copies) b.copyBack.cell.v = b.cell.v;
    snap(def.end, `Fim de ${s.name}.${copies.length ? ` Valor-resultado: copia ${copies.map(([p, b]) => `${p} = ${b.cell.v} → ${b.copyBack.desc}`).join(', ')}.` : ''} O registro é desempilhado.`, { leaving: nf.id });
    frames.pop();
  }

  let error = null;
  try {
    snap(null, `Começa a execução com o registro de ativação do programa principal. Escopo <b>${scope === 'estatico' ? 'estático' : 'dinâmico'}</b>, passagem por <b>${MODES[mode]}</b>.`);
    exec(main, prog);
    snap(null, `Fim. Saída: <b>${output.join(' ') || '(nada)'}</b>.`, { done: true });
  } catch (e) {
    error = e.message;
    steps.push({ line: null, msg: `<b>Erro:</b> ${e.message}.`, frames: snapshot(), output: [...output], top: frames.at(-1).id, done: true, error: true });
  }
  return { steps, output, error };
}

export const EXAMPLES = {
  escopo: {
    nome: 'Estático × dinâmico',
    src: `var x = 1
proc f() {
  print x
}
proc g() {
  var x = 2
  f()
}
g()
f()`,
  },
  aninhado: {
    nome: 'Procedimentos aninhados (cadeia estática)',
    src: `var a = 1
proc mostra() {
  print a
}
proc p() {
  var a = 2
  proc q() {
    var b = a + 10
    print b
    mostra()
  }
  q()
}
p()`,
  },
  passagem: {
    nome: 'Os 4 modos de passagem',
    src: `var a = 1
proc f(x) {
  x = x + 1
  a = a * 10
  print x
}
f(a)
print a`,
  },
  troca: {
    nome: 'troca(i, v[i]): por nome falha',
    src: `var i = 0
var v[3]
v[0] = 2
v[1] = 5
v[2] = 7
proc troca(x, y) {
  var t = x
  x = y
  y = t
}
troca(i, v[i])
print i
print v[0]
print v[2]`,
  },
};
