// Compiladores: análise léxica com um AFD explícito, gramáticas (FIRST,
// FOLLOW, tabela LL(1), autômato LR(0) e tabela SLR), análise preditiva e
// de empilha-reduz, e geração de código de três endereços / máquina de pilha.

import { lineFinder } from '../../../engine/highlight.js';

// =====================================================================
// 1. Análise léxica
// =====================================================================

export const KEYWORDS = new Set(['if', 'else', 'while', 'int', 'return', 'print']);

// Classes de caracteres usadas nas transições
export const charClass = c => (c == null ? 'fim' : /[A-Za-z_]/.test(c) ? 'letra' : /[0-9]/.test(c) ? 'dígito' : c === '\n' ? '\\n' : /\s/.test(c) ? 'espaço' : c);

/**
 * AFD do analisador léxico. Cada estado: { nome, aceita: tipo do token ou null, pos: [x, y] }.
 * delta(estado, classe) → próximo estado ou undefined.
 */
export const DFA = {
  states: {
    ini: { nome: 'início', aceita: null, pos: [90, 230] },
    id: { nome: 'ident', aceita: 'ID', pos: [300, 70] },
    num: { nome: 'número', aceita: 'NUM', pos: [300, 160] },
    lt: { nome: '<', aceita: 'OP', pos: [300, 250] },
    le: { nome: '<=', aceita: 'OP', pos: [470, 250] },
    eq: { nome: '=', aceita: 'ATRIB', pos: [300, 330] },
    eqeq: { nome: '==', aceita: 'OP', pos: [470, 330] },
    op: { nome: 'op', aceita: 'OP', pos: [300, 410] },
    barra: { nome: '/', aceita: 'OP', pos: [470, 410] },
    com: { nome: '//…', aceita: 'COMENTÁRIO', pos: [640, 410] },
    ws: { nome: 'espaço', aceita: 'ESPAÇO', pos: [90, 400] },
    pont: { nome: 'pont.', aceita: 'PONT', pos: [470, 160] },
  },
  edges: [
    ['ini', 'id', 'letra'], ['id', 'id', 'letra, dígito'], ['ini', 'num', 'dígito'], ['num', 'num', 'dígito'],
    ['ini', 'lt', '< > !'], ['lt', 'le', '='], ['ini', 'eq', '='], ['eq', 'eqeq', '='],
    ['ini', 'op', '+ - *'], ['ini', 'barra', '/'], ['barra', 'com', '/'], ['com', 'com', '≠ \\n'],
    ['ini', 'ws', 'espaço \\n'], ['ws', 'ws', 'espaço \\n'], ['ini', 'pont', '( ) { } ;'],
  ],
  delta(s, cls) {
    switch (s) {
      case 'ini':
        if (cls === 'letra') return 'id';
        if (cls === 'dígito') return 'num';
        if (cls === '<' || cls === '>' || cls === '!') return 'lt';
        if (cls === '=') return 'eq';
        if (cls === '+' || cls === '-' || cls === '*') return 'op';
        if (cls === '/') return 'barra';
        if (cls === 'espaço' || cls === '\\n') return 'ws';
        if ('(){};'.includes(cls) && cls.length === 1) return 'pont';
        return undefined;
      case 'id': return cls === 'letra' || cls === 'dígito' ? 'id' : undefined;
      case 'num': return cls === 'dígito' ? 'num' : undefined;
      case 'lt': return cls === '=' ? 'le' : undefined;
      case 'eq': return cls === '=' ? 'eqeq' : undefined;
      case 'barra': return cls === '/' ? 'com' : undefined;
      case 'com': return cls !== '\\n' && cls !== 'fim' ? 'com' : undefined;
      case 'ws': return cls === 'espaço' || cls === '\\n' ? 'ws' : undefined;
      default: return undefined;
    }
  },
};

export const LEX_CODE = `def proximo_token(fonte, i):
    estado, j = "inicio", i
    ultimo_aceito = None                     # maior prefixo válido até agora
    while j < len(fonte):
        prox = delta(estado, classe(fonte[j]))
        if prox is None:
            break                            # o AFD travou
        estado, j = prox, j + 1
        if aceita(estado):
            ultimo_aceito = (estado, j)      # regra do maior casamento
    if ultimo_aceito is None:
        erro_lexico(fonte[i])
    estado, j = ultimo_aceito
    lexema = fonte[i:j]
    if estado == "ident" and lexema in palavras_reservadas:
        return ("PALAVRA", lexema), j        # a tabela decide, não o AFD
    return (tipo(estado), lexema), j`;

export function lexSteps(src) {
  const L = lineFinder(LEX_CODE);
  const tokens = [], steps = [];
  let i = 0;
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, src, tokens: tokens.map(t => ({ ...t })), vars: { i: extra.i ?? i, j: extra.j ?? '—', estado: extra.state ? DFA.states[extra.state].nome : '—' }, ...extra });
  snap(L('def proximo_token'), 'O analisador léxico lê o programa caractere a caractere num AFD. Cada chamada devolve o <b>maior</b> prefixo que forma um token.');
  let guard = 0;
  while (i < src.length && guard++ < 2000) {
    let s = 'ini', j = i, last = null;
    snap(L('estado, j = "inicio", i'), `Novo token a partir da posição ${i} ('${show(src[i])}').`, { state: s, i, j });
    while (j < src.length) {
      const cls = charClass(src[j]);
      const nx = DFA.delta(s, cls);
      if (nx == null) {
        snap(L('break'), `Do estado <b>${DFA.states[s].nome}</b> não há transição com '${show(src[j])}': o AFD para.`, { state: s, i, j, stuck: j });
        break;
      }
      const from = s;
      s = nx; j++;
      if (DFA.states[s].aceita) last = { s, j };
      snap(L('estado, j = prox, j + 1'), `'${show(src[j - 1])}'${cls.length > 1 ? ` (${cls})` : ''} leva ao estado <b>${DFA.states[s].nome}</b>${DFA.states[s].aceita ? `, que aceita (${DFA.states[s].aceita})` : ''}.`, { state: s, i, j, from });
    }
    if (!last) {
      tokens.push({ tipo: 'ERRO', lexema: src[i], ini: i, fim: i + 1 });
      snap(L('erro_lexico'), `Nenhum token começa com '${show(src[i])}': <b>erro léxico</b>. Pulamos o caractere.`, { i, j: i + 1, error: true });
      i++;
      continue;
    }
    const lex = src.slice(i, last.j);
    let tipo = DFA.states[last.s].aceita;
    const kw = last.s === 'id' && KEYWORDS.has(lex);
    if (kw) tipo = 'PALAVRA';
    if (tipo !== 'ESPAÇO' && tipo !== 'COMENTÁRIO') tokens.push({ tipo, lexema: lex, ini: i, fim: last.j });
    snap(L(kw ? 'return ("PALAVRA"' : 'return (tipo(estado)'), tipo === 'ESPAÇO' || tipo === 'COMENTÁRIO' ? `"${show(lex)}" é ${tipo === 'ESPAÇO' ? 'espaço em branco' : 'comentário'}: reconhecido e <b>descartado</b>.` : `Token <b>${tipo}</b> "${lex}"${kw ? ': casou com o AFD de identificadores, mas está na tabela de palavras reservadas' : ''}.`, { i, j: last.j, state: last.s, tok: [i, last.j] });
    i = last.j;
  }
  snap(null, `Fim: ${tokens.filter(t => t.tipo !== 'ERRO').length} tokens. O analisador sintático nunca vê espaços e comentários.`, { done: true, i: src.length });
  return steps;
}

const show = c => (c === '\n' ? '\\n' : c === ' ' ? '␣' : c);

export function tokenize(src) {
  return lexSteps(src).at(-1).tokens;
}

// =====================================================================
// 2. Gramáticas: FIRST, FOLLOW, LL(1)
// =====================================================================

export const EPS = 'ε';

/** "E -> T E'\nE' -> + T E' | ε" → { start, prods: [{ lhs, rhs }], nts, ts } */
export function parseGrammar(text) {
  const prods = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(\S+)\s*(->|→)\s*(.*)$/);
    if (!m) throw new Error(`linha mal formada: "${line}" (use A -> α | β)`);
    for (const alt of m[3].split('|')) {
      const rhs = alt.trim().split(/\s+/).filter(x => x && x !== EPS && x !== 'eps');
      prods.push({ lhs: m[1], rhs });
    }
  }
  if (!prods.length) throw new Error('gramática vazia');
  const nts = [...new Set(prods.map(p => p.lhs))];
  const ts = [...new Set(prods.flatMap(p => p.rhs).filter(x => !nts.includes(x)))];
  return { start: prods[0].lhs, prods, nts, ts };
}

export const showProd = p => `${p.lhs} → ${p.rhs.length ? p.rhs.join(' ') : EPS}`;

export function first(G) {
  const F = Object.fromEntries(G.nts.map(A => [A, new Set()]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of G.prods) {
      const f = firstOfSeq(G, F, p.rhs);
      for (const x of f) if (!F[p.lhs].has(x)) { F[p.lhs].add(x); changed = true; }
    }
  }
  return F;
}

export function firstOfSeq(G, F, seq) {
  const out = new Set();
  for (const X of seq) {
    if (!G.nts.includes(X)) { out.add(X); return out; }
    for (const x of F[X]) if (x !== EPS) out.add(x);
    if (!F[X].has(EPS)) return out;
  }
  out.add(EPS);
  return out;
}

export function follow(G, F = first(G)) {
  const FO = Object.fromEntries(G.nts.map(A => [A, new Set()]));
  FO[G.start].add('$');
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of G.prods) p.rhs.forEach((B, k) => {
      if (!G.nts.includes(B)) return;
      const rest = firstOfSeq(G, F, p.rhs.slice(k + 1));
      const add = x => { if (!FO[B].has(x)) { FO[B].add(x); changed = true; } };
      for (const x of rest) if (x !== EPS) add(x);
      if (rest.has(EPS)) for (const x of FO[p.lhs]) add(x);
    });
  }
  return FO;
}

export function llTable(G) {
  const F = first(G), FO = follow(G, F);
  const M = {}, conflicts = [];
  for (const A of G.nts) M[A] = {};
  G.prods.forEach((p, i) => {
    const f = firstOfSeq(G, F, p.rhs);
    const targets = [...f].filter(x => x !== EPS);
    if (f.has(EPS)) targets.push(...FO[p.lhs]);
    for (const a of targets) {
      if (M[p.lhs][a] != null && M[p.lhs][a] !== i) conflicts.push({ A: p.lhs, a, prods: [M[p.lhs][a], i] });
      else M[p.lhs][a] = i;
    }
  });
  return { M, F, FO, conflicts };
}

/** Separa a entrada em terminais da gramática; palavras que não são terminais viram "id" (se existir). */
export function inputTokens(G, text) {
  const raw = text.match(/[A-Za-z_]\w*|\d+|\S/g) ?? [];
  return raw.map(w => {
    if (G.ts.includes(w)) return { t: w, lex: w };
    if (/^\w+$/.test(w) && G.ts.includes('id')) return { t: 'id', lex: w };
    if (/^\d+$/.test(w) && G.ts.includes('num')) return { t: 'num', lex: w };
    return { t: w, lex: w };
  });
}

export const LL_CODE = `def analisa_ll1(tabela, entrada):
    pilha = ["$", inicial]
    a = proximo(entrada)
    while pilha[-1] != "$":
        X = pilha.pop()
        if X == a:
            a = proximo(entrada)             # casa o terminal
        elif terminal(X):
            erro("esperava " + X)
        elif (X, a) not in tabela:
            erro("nada começa com " + a)
        else:
            A, alfa = tabela[X, a]           # produção prevista
            pilha.extend(reversed(alfa))     # empilha o lado direito ao contrário
    if a != "$":
        erro("sobrou entrada")
    return "aceita"`;

export function llSteps(G, text) {
  const L = lineFinder(LL_CODE);
  const { M } = llTable(G);
  const toks = [...inputTokens(G, text), { t: '$', lex: '$' }];
  const nodes = [{ id: 0, label: G.start, parent: null }];
  const stack = [{ sym: '$', node: null }, { sym: G.start, node: 0 }];
  let pos = 0;
  const steps = [];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, stack: stack.map(s => s.sym), pos, toks, nodes: nodes.map(n => ({ ...n })), vars: { pilha: stack.map(s => s.sym).join(' '), entrada: toks.slice(pos).map(t => t.lex).join(' ') }, ...extra });
  snap(L('pilha = ["$", inicial]'), `A pilha começa com $ e o símbolo inicial ${G.start}. O analisador <b>prevê</b> a produção olhando só o próximo token: é isso que o "1" de LL(1) quer dizer.`);
  let guard = 0;
  while (stack.at(-1).sym !== '$' && guard++ < 500) {
    const top = stack.pop(), a = toks[pos];
    if (top.sym === a.t) {
      pos++;
      if (top.node != null) nodes[top.node].lex = a.lex;
      snap(L('# casa o terminal'), `Topo ${top.sym} = token ${a.t}${a.lex !== a.t ? ` ("${a.lex}")` : ''}: <b>casa</b> e avança na entrada.`, { cur: top.node, match: true });
      continue;
    }
    if (!G.nts.includes(top.sym)) {
      stack.push(top);
      snap(L('erro("esperava "'), `<b>Erro sintático</b>: esperava ${top.sym}, veio ${a.t}.`, { done: true, error: true, cur: top.node });
      return steps;
    }
    const pi = M[top.sym][a.t];
    if (pi == null) {
      stack.push(top);
      snap(L('erro("nada começa com "'), `<b>Erro sintático</b>: M[${top.sym}, ${a.t}] está vazia; nenhuma produção de ${top.sym} começa com ${a.t}.`, { done: true, error: true, cur: top.node });
      return steps;
    }
    const p = G.prods[pi];
    const kids = p.rhs.length ? p.rhs.map(sym => { const n = { id: nodes.length, label: sym, parent: top.node }; nodes.push(n); return n; }) : [(() => { const n = { id: nodes.length, label: EPS, parent: top.node, eps: true }; nodes.push(n); return n; })()];
    for (let k = p.rhs.length - 1; k >= 0; k--) stack.push({ sym: p.rhs[k], node: kids[k].id });
    snap(L('pilha.extend(reversed(alfa))'), `M[${top.sym}, ${a.t}] = <b>${showProd(p)}</b>: troca ${top.sym} pelo lado direito${p.rhs.length ? ' (empilhado ao contrário, para o primeiro símbolo ficar no topo)' : ' (vazio: só desempilha)'}.`, { cur: top.node, prod: pi });
  }
  const ok = toks[pos].t === '$';
  snap(L(ok ? 'return "aceita"' : 'erro("sobrou entrada")'), ok ? 'Pilha e entrada chegaram ao $ juntas: a frase é <b>aceita</b>, e a árvore de derivação está completa (derivação mais à esquerda).' : `<b>Erro</b>: a pilha esvaziou, mas sobrou "${toks.slice(pos, -1).map(t => t.lex).join(' ')}".`, { done: true, error: !ok });
  return steps;
}

// =====================================================================
// 3. LR(0) e SLR
// =====================================================================

const itemKey = it => `${it.p}.${it.dot}`;

export function lr0(G) {
  const S2 = `${G.start}'`;
  const prods = [{ lhs: S2, rhs: [G.start] }, ...G.prods];
  const nts = [S2, ...G.nts];
  const closure = items => {
    const out = [...items], seen = new Set(out.map(itemKey));
    for (let k = 0; k < out.length; k++) {
      const it = out[k], X = prods[it.p].rhs[it.dot];
      if (!nts.includes(X)) continue;
      prods.forEach((p, i) => { if (p.lhs === X && !seen.has(`${i}.0`)) { seen.add(`${i}.0`); out.push({ p: i, dot: 0 }); } });
    }
    return out;
  };
  const goTo = (I, X) => closure(I.filter(it => prods[it.p].rhs[it.dot] === X).map(it => ({ p: it.p, dot: it.dot + 1 })));
  const states = [closure([{ p: 0, dot: 0 }])];
  const keyOf = I => I.map(itemKey).sort().join('|');
  const index = new Map([[keyOf(states[0]), 0]]);
  const trans = [];
  for (let s = 0; s < states.length; s++) {
    const syms = [...new Set(states[s].map(it => prods[it.p].rhs[it.dot]).filter(Boolean))];
    for (const X of syms) {
      const J = goTo(states[s], X), k = keyOf(J);
      if (!index.has(k)) { index.set(k, states.length); states.push(J); }
      trans.push([s, X, index.get(k)]);
    }
  }
  return { prods, nts, states, trans, S2 };
}

export const showItem = (prods, it) => {
  const p = prods[it.p];
  const r = [...p.rhs];
  r.splice(it.dot, 0, '•');
  return `${p.lhs} → ${r.join(' ')}`;
};

export function slrTable(G) {
  const A = lr0(G), FO = follow(G);
  const ACTION = A.states.map(() => ({})), GOTO = A.states.map(() => ({})), conflicts = [];
  const set = (s, a, v) => {
    const old = ACTION[s][a];
    if (old && (old.t !== v.t || old.n !== v.n)) conflicts.push({ s, a, acts: [old, v] });
    else ACTION[s][a] = v;
  };
  for (const [s, X, t] of A.trans) {
    if (A.nts.includes(X)) GOTO[s][X] = t; else set(s, X, { t: 's', n: t });
  }
  A.states.forEach((I, s) => {
    for (const it of I) {
      const p = A.prods[it.p];
      if (it.dot < p.rhs.length) continue;
      if (it.p === 0) { set(s, '$', { t: 'acc' }); continue; }
      for (const a of FO[p.lhs]) set(s, a, { t: 'r', n: it.p });
    }
  });
  return { ...A, ACTION, GOTO, FO, conflicts };
}

export const showAct = a => (!a ? '' : a.t === 's' ? `s${a.n}` : a.t === 'r' ? `r${a.n}` : 'acc');

export const LR_CODE = `def analisa_slr(ACTION, GOTO, entrada):
    pilha = [0]                              # pilha de estados
    a = proximo(entrada)
    while True:
        s = pilha[-1]
        acao = ACTION[s].get(a)
        if acao is None:
            erro("token inesperado " + a)
        elif acao.tipo == "empilha":
            pilha.append(acao.estado)        # shift
            a = proximo(entrada)
        elif acao.tipo == "reduz":
            A, alfa = producoes[acao.prod]   # handle no topo
            del pilha[len(pilha) - len(alfa):]
            pilha.append(GOTO[pilha[-1]][A]) # desvio pelo não-terminal
        else:
            return "aceita"`;

export function slrSteps(G, text) {
  const L = lineFinder(LR_CODE);
  const T = slrTable(G);
  const toks = [...inputTokens(G, text), { t: '$', lex: '$' }];
  const stack = [{ s: 0, sym: null, node: null }];
  const nodes = [];
  let pos = 0;
  const steps = [];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, stack: stack.map(x => ({ s: x.s, sym: x.sym })), pos, toks, nodes: nodes.map(n => ({ ...n })), roots: stack.filter(x => x.node != null).map(x => x.node), vars: { estados: stack.map(x => x.s).join(' '), símbolos: stack.slice(1).map(x => x.sym).join(' ') || '—', entrada: toks.slice(pos).map(t => t.lex).join(' ') }, state: stack.at(-1).s, ...extra });
  snap(L('pilha = [0]'), 'A análise ascendente lê da esquerda para a direita e constrói a árvore <b>de baixo para cima</b>: empilha tokens até reconhecer no topo o lado direito de uma produção (um <b>handle</b>) e então o reduz.');
  for (let guard = 0; guard < 500; guard++) {
    const s = stack.at(-1).s, a = toks[pos];
    const act = T.ACTION[s][a.t];
    if (!act) { snap(L('erro("token inesperado "'), `<b>Erro sintático</b>: ACTION[${s}, ${a.t}] vazia.`, { done: true, error: true, act: null, look: a.t }); return steps; }
    if (act.t === 's') {
      const n = { id: nodes.length, label: a.t, lex: a.lex, kids: [] };
      nodes.push(n);
      stack.push({ s: act.n, sym: a.t, node: n.id });
      pos++;
      snap(L('pilha.append(acao.estado)'), `ACTION[${s}, ${a.t}] = <b>s${act.n}</b>: empilha ${a.t}${a.lex !== a.t ? ` ("${a.lex}")` : ''} e vai para o estado ${act.n}.`, { act: showAct(act), look: a.t, from: s });
    } else if (act.t === 'r') {
      const p = T.prods[act.n];
      const popped = p.rhs.length ? stack.splice(stack.length - p.rhs.length) : [];
      const n = { id: nodes.length, label: p.lhs, kids: popped.map(x => x.node) };
      if (!p.rhs.length) { const e = { id: nodes.length + 1, label: EPS, kids: [], eps: true }; n.kids = [e.id]; nodes.push(n, e); } else nodes.push(n);
      const g = T.GOTO[stack.at(-1).s][p.lhs];
      stack.push({ s: g, sym: p.lhs, node: n.id });
      snap(L('pilha.append(GOTO[pilha[-1]][A])'), `ACTION[${s}, ${a.t}] = <b>r${act.n}</b>: o topo ${p.rhs.join(' ') || EPS} é o handle de <b>${showProd(p)}</b> (${a.t} ∈ FOLLOW(${p.lhs})). Desempilha ${p.rhs.length}, e GOTO[${stack.at(-2).s}, ${p.lhs}] = ${g}.`, { act: showAct(act), look: a.t, from: s, reduced: n.id });
    } else {
      snap(L('return "aceita"'), 'ACTION = <b>acc</b>: a entrada inteira foi reduzida ao símbolo inicial. Lendo as reduções de trás para frente, temos a <b>derivação mais à direita</b>.', { done: true, act: 'acc', look: '$' });
      return steps;
    }
  }
  return steps;
}

// =====================================================================
// 4. Geração de código
// =====================================================================

/** Parser descendente recursivo do mini-C: atribuições, if/else, while, print. */
export function parseProgram(src) {
  const toks = tokenize(src).filter(t => t.tipo !== 'ERRO');
  const bad = tokenize(src).find(t => t.tipo === 'ERRO');
  if (bad) throw new Error(`caractere inválido "${bad.lexema}"`);
  let i = 0, nid = 0;
  const peek = () => toks[i]?.lexema;
  const eat = v => { if (toks[i]?.lexema !== v) throw new Error(`esperava "${v}"${toks[i] ? `, achou "${toks[i].lexema}"` : ' no fim'}`); return toks[i++]; };
  const node = (k, o) => ({ k, id: nid++, ...o });
  function block() { eat('{'); const ss = []; while (peek() !== '}') { if (i >= toks.length) throw new Error('faltou "}"'); ss.push(stmt()); } eat('}'); return node('seq', { ss }); }
  function stmt() {
    if (peek() === 'while') { i++; eat('('); const c = cond(); eat(')'); return node('while', { c, body: block() }); }
    if (peek() === 'if') { i++; eat('('); const c = cond(); eat(')'); const a = block(); let b = null; if (peek() === 'else') { i++; b = block(); } return node('if', { c, a, b }); }
    if (peek() === 'print') { i++; const e = expr(); eat(';'); return node('print', { e }); }
    const t = toks[i];
    if (t?.tipo !== 'ID') throw new Error(`comando inesperado "${t?.lexema ?? 'fim'}"`);
    i++; eat('=');
    const e = expr(); eat(';');
    return node('assign', { x: t.lexema, e });
  }
  function cond() { const l = expr(); const op = toks[i]; if (!['<', '<=', '>', '>=', '==', '!='].includes(op?.lexema)) throw new Error('esperava um operador relacional'); i++; return node('rel', { op: op.lexema, l, r: expr() }); }
  function expr() { let l = term(); while (peek() === '+' || peek() === '-') { const op = toks[i++].lexema; l = node('bin', { op, l, r: term() }); } return l; }
  function term() { let l = factor(); while (peek() === '*' || peek() === '/') { const op = toks[i++].lexema; l = node('bin', { op, l, r: factor() }); } return l; }
  function factor() {
    const t = toks[i];
    if (!t) throw new Error('expressão incompleta');
    if (t.lexema === '(') { i++; const e = expr(); eat(')'); return e; }
    if (t.tipo === 'NUM') { i++; return node('num', { v: +t.lexema }); }
    if (t.tipo === 'ID') { i++; return node('var', { x: t.lexema }); }
    throw new Error(`não esperava "${t.lexema}"`);
  }
  const ss = [];
  while (i < toks.length) ss.push(stmt());
  return node('seq', { ss });
}

const OPS = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => Math.trunc(a / b) };

/** Dobramento de constantes: 2 * 3 vira 6 em tempo de compilação. */
export function fold(n) {
  if (n.k === 'bin') {
    const l = fold(n.l), r = fold(n.r);
    if (l.k === 'num' && r.k === 'num' && !(n.op === '/' && r.v === 0)) return { ...n, k: 'num', v: OPS[n.op](l.v, r.v), folded: true, l: undefined, r: undefined };
    return { ...n, l, r };
  }
  if (n.k === 'rel') return { ...n, l: fold(n.l), r: fold(n.r) };
  if (n.k === 'assign' || n.k === 'print') return { ...n, e: fold(n.e) };
  if (n.k === 'seq') return { ...n, ss: n.ss.map(fold) };
  if (n.k === 'while') return { ...n, c: fold(n.c), body: fold(n.body) };
  if (n.k === 'if') return { ...n, c: fold(n.c), a: fold(n.a), b: n.b && fold(n.b) };
  return n;
}

const NEG = { '<': '>=', '<=': '>', '>': '<=', '>=': '<', '==': '!=', '!=': '==' };

/** Código de três endereços, um passo por instrução emitida. */
export function tacSteps(ast) {
  const code = [], steps = [];
  let nt = 0, nl = 0;
  const temp = () => `t${++nt}`, label = () => `L${++nl}`;
  const emit = (ins, node, msg) => { code.push(ins); steps.push({ code: [...code], node: node.id, msg, emitted: code.length - 1 }); };
  const ex = n => {
    if (n.k === 'num') return String(n.v);
    if (n.k === 'var') return n.x;
    const a = ex(n.l), b = ex(n.r), t = temp();
    emit(`${t} = ${a} ${n.op} ${b}`, n, `Pós-ordem: os dois operandos já estão em <b>${a}</b> e <b>${b}</b>; o resultado vai para um temporário novo, ${t}.`);
    return t;
  };
  const st = n => {
    switch (n.k) {
      case 'seq': n.ss.forEach(st); break;
      case 'assign': { const v = ex(n.e); emit(`${n.x} = ${v}`, n, `Atribuição: copia ${v} para ${n.x}.`); break; }
      case 'print': { const v = ex(n.e); emit(`print ${v}`, n, `Imprime ${v}.`); break; }
      case 'if': {
        const lElse = label(), lEnd = n.b ? label() : lElse;
        const a = ex(n.c.l), b = ex(n.c.r);
        emit(`if ${a} ${NEG[n.c.op]} ${b} goto ${lElse}`, n, `if: testa a condição <b>negada</b> (${NEG[n.c.op]}) e pula para ${lElse} se ela falhar; senão cai no bloco do then.`);
        st(n.a);
        if (n.b) { emit(`goto ${lEnd}`, n, `Fim do then: pula o else.`); emit(`${lElse}:`, n, `Rótulo do else.`); st(n.b); }
        emit(`${lEnd}:`, n, `Rótulo do fim do if.`);
        break;
      }
      case 'while': {
        const lTop = label(), lEnd = label();
        emit(`${lTop}:`, n, `while: rótulo no topo do laço, para voltar a testar a condição.`);
        const a = ex(n.c.l), b = ex(n.c.r);
        emit(`if ${a} ${NEG[n.c.op]} ${b} goto ${lEnd}`, n, `Se a condição falhar (${a} ${NEG[n.c.op]} ${b}), sai do laço.`);
        st(n.body);
        emit(`goto ${lTop}`, n, `Fim do corpo: volta para o teste.`);
        emit(`${lEnd}:`, n, `Rótulo de saída do laço.`);
        break;
      }
    }
  };
  st(ast);
  return { steps, code };
}

/** Código para máquina de pilha (como a JVM ou o WebAssembly). */
export function stackSteps(ast) {
  const code = [], steps = [];
  let nl = 0;
  const label = () => `L${++nl}`;
  const emit = (ins, node, msg) => { code.push(ins); steps.push({ code: [...code], node: node.id, msg, emitted: code.length - 1 }); };
  const OPN = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' };
  const JMP = { '<': 'jge', '<=': 'jgt', '>': 'jle', '>=': 'jlt', '==': 'jne', '!=': 'jeq' };
  const ex = n => {
    if (n.k === 'num') return emit(`push ${n.v}`, n, `Constante: empilha ${n.v}.`);
    if (n.k === 'var') return emit(`load ${n.x}`, n, `Variável: empilha o valor de ${n.x}.`);
    ex(n.l); ex(n.r);
    emit(OPN[n.op], n, `Os dois operandos estão no topo da pilha: <b>${OPN[n.op]}</b> desempilha os dois e empilha o resultado. Sem temporários nem registradores.`);
  };
  const st = n => {
    switch (n.k) {
      case 'seq': n.ss.forEach(st); break;
      case 'assign': ex(n.e); emit(`store ${n.x}`, n, `Desempilha o valor e guarda em ${n.x}.`); break;
      case 'print': ex(n.e); emit('print', n, 'Desempilha e imprime.'); break;
      case 'if': {
        const lElse = label(), lEnd = n.b ? label() : lElse;
        ex(n.c.l); ex(n.c.r);
        emit(`${JMP[n.c.op]} ${lElse}`, n, `Compara os dois do topo e pula para ${lElse} se a condição for falsa.`);
        st(n.a);
        if (n.b) { emit(`jmp ${lEnd}`, n, 'Pula o else.'); emit(`${lElse}:`, n, 'Rótulo do else.'); st(n.b); }
        emit(`${lEnd}:`, n, 'Fim do if.');
        break;
      }
      case 'while': {
        const lTop = label(), lEnd = label();
        emit(`${lTop}:`, n, 'Topo do laço.');
        ex(n.c.l); ex(n.c.r);
        emit(`${JMP[n.c.op]} ${lEnd}`, n, 'Sai do laço se a condição for falsa.');
        st(n.body);
        emit(`jmp ${lTop}`, n, 'Volta ao teste.');
        emit(`${lEnd}:`, n, 'Saída do laço.');
        break;
      }
    }
  };
  st(ast);
  return { steps, code };
}

/** Interpreta código de três endereços (para conferir a tradução). */
export function runTAC(code, env = {}) {
  const vars = { ...env }, out = [];
  const labels = {};
  code.forEach((ins, k) => { const m = ins.match(/^(L\d+):$/); if (m) labels[m[1]] = k; });
  const val = x => (/^-?\d+$/.test(x) ? +x : (vars[x] ?? 0));
  const REL = { '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b, '==': (a, b) => a === b, '!=': (a, b) => a !== b };
  for (let pc = 0, guard = 0; pc < code.length && guard < 100000; pc++, guard++) {
    const ins = code[pc];
    let m;
    if (/^L\d+:$/.test(ins)) continue;
    if ((m = ins.match(/^goto (L\d+)$/))) { pc = labels[m[1]]; continue; }
    if ((m = ins.match(/^if (\S+) (\S+) (\S+) goto (L\d+)$/))) { if (REL[m[2]](val(m[1]), val(m[3]))) pc = labels[m[4]]; continue; }
    if ((m = ins.match(/^print (\S+)$/))) { out.push(val(m[1])); continue; }
    if ((m = ins.match(/^(\w+) = (\S+) ([-+*/]) (\S+)$/))) { vars[m[1]] = OPS[m[3]](val(m[2]), val(m[4])); continue; }
    if ((m = ins.match(/^(\w+) = (\S+)$/))) { vars[m[1]] = val(m[2]); continue; }
    throw new Error(`instrução desconhecida: ${ins}`);
  }
  return { vars, out };
}

/** Interpreta a árvore diretamente (semântica de referência). */
export function evalAST(ast, env = {}) {
  const vars = { ...env }, out = [];
  const ev = n => (n.k === 'num' ? n.v : n.k === 'var' ? (vars[n.x] ?? 0) : OPS[n.op](ev(n.l), ev(n.r)));
  const REL = { '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b, '==': (a, b) => a === b, '!=': (a, b) => a !== b };
  let guard = 0;
  const st = n => {
    if (++guard > 100000) throw new Error('laço infinito?');
    if (n.k === 'seq') n.ss.forEach(st);
    else if (n.k === 'assign') vars[n.x] = ev(n.e);
    else if (n.k === 'print') out.push(ev(n.e));
    else if (n.k === 'if') { if (REL[n.c.op](ev(n.c.l), ev(n.c.r))) st(n.a); else if (n.b) st(n.b); }
    else if (n.k === 'while') while (REL[n.c.op](ev(n.c.l), ev(n.c.r))) st(n.body);
  };
  st(ast);
  return { vars, out };
}

export const astLabel = n => ({ seq: 'bloco', assign: `${n.x} =`, print: 'print', if: 'if', while: 'while', rel: n.op, bin: n.op, num: String(n.v), var: n.x }[n.k]);
export function astChildren(n) {
  switch (n.k) {
    case 'seq': return n.ss;
    case 'assign': case 'print': return [n.e];
    case 'if': return [n.c, n.a, ...(n.b ? [n.b] : [])];
    case 'while': return [n.c, n.body];
    case 'rel': case 'bin': return [n.l, n.r];
    default: return [];
  }
}

// =====================================================================
// Exemplos
// =====================================================================

export const GRAMMARS = {
  expr_ll: { nome: 'Expressões sem recursão à esquerda (LL(1))', text: "E -> T E'\nE' -> + T E' | ε\nT -> F T'\nT' -> * F T' | ε\nF -> ( E ) | id", input: 'a + b * c' },
  expr_lr: { nome: 'Expressões com recursão à esquerda', text: 'E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id', input: 'a + b * c' },
  stmt: { nome: 'if-then-else pendente (ambígua)', text: 'S -> if E then S S2 | x\nS2 -> else S | ε\nE -> b', input: 'if b then if b then x else x' },
  parenteses: { nome: 'Parênteses balanceados', text: 'S -> ( S ) S | ε', input: '( ( ) ) ( )' },
};

export const LEX_EXAMPLES = {
  basico: 'while (i <= 10) {\n  soma = soma + i; // acumula\n  i = i + 1;\n}',
  palavras: 'if (iffy == 42) print iffy;',
  erro: 'x = 3 # 4;',
};

export const PROGRAMS = {
  expr: { nome: 'Expressão', src: 'x = a * (b + c) - 2 * 3;', env: { a: 7, b: 3, c: 4 } },
  laco: { nome: 'Laço while', src: 's = 0;\ni = 1;\nwhile (i <= 5) {\n  s = s + i * i;\n  i = i + 1;\n}\nprint s;', env: {} },
  max: { nome: 'if / else', src: 'if (a < b) {\n  m = b;\n} else {\n  m = a;\n}\nprint m;', env: { a: 7, b: 3 } },
  mdc: { nome: 'MDC (Euclides por subtração)', src: 'while (a != b) {\n  if (a > b) {\n    a = a - b;\n  } else {\n    b = b - a;\n  }\n}\nprint a;', env: { a: 84, b: 36 } },
};
