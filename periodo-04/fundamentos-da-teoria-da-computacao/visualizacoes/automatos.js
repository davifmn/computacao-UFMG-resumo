// Autômatos finitos (AFD/AFN com ε), construção de subconjuntos, minimização,
// expressões regulares → AFN (Thompson), autômato de pilha e máquina de Turing.
// Tudo puro: devolve estados e passos para as páginas desenharem.

export const EPS = 'ε';

// ---------- Autômatos finitos ----------
// { states: ['q0', ...], start: 'q0', accept: ['q2'], alphabet: ['0', '1'],
//   delta: { q0: { '0': ['q0'], '1': ['q0', 'q1'], 'ε': [...] } }, pos: { q0: [x, y] } }

export const FA_PRESETS = {
  mod3: {
    nome: 'Binário múltiplo de 3 (AFD)', alphabet: ['0', '1'], start: 'q0', accept: ['q0'],
    states: ['q0', 'q1', 'q2'], pos: { q0: [110, 200], q1: [300, 200], q2: [490, 200] },
    delta: { q0: { 0: ['q0'], 1: ['q1'] }, q1: { 0: ['q2'], 1: ['q0'] }, q2: { 0: ['q1'], 1: ['q2'] } },
    exemplo: '1001',
  },
  par: {
    nome: "Nº par de a's e de b's (AFD)", alphabet: ['a', 'b'], start: 'pp', accept: ['pp'],
    states: ['pp', 'ip', 'pi', 'ii'], pos: { pp: [140, 100], ip: [420, 100], pi: [140, 320], ii: [420, 320] },
    delta: { pp: { a: ['ip'], b: ['pi'] }, ip: { a: ['pp'], b: ['ii'] }, pi: { a: ['ii'], b: ['pp'] }, ii: { a: ['pi'], b: ['ip'] } },
    exemplo: 'abbaabab',
  },
  termina01: {
    nome: 'Termina em 01 (AFN)', alphabet: ['0', '1'], start: 'q0', accept: ['q2'],
    states: ['q0', 'q1', 'q2'], pos: { q0: [110, 200], q1: [300, 200], q2: [490, 200] },
    delta: { q0: { 0: ['q0', 'q1'], 1: ['q0'] }, q1: { 1: ['q2'] }, q2: {} },
    exemplo: '1101',
  },
  terceiro: {
    nome: '3º símbolo do fim é 1 (AFN)', alphabet: ['0', '1'], start: 'q0', accept: ['q3'],
    states: ['q0', 'q1', 'q2', 'q3'], pos: { q0: [90, 200], q1: [240, 200], q2: [390, 200], q3: [540, 200] },
    delta: { q0: { 0: ['q0'], 1: ['q0', 'q1'] }, q1: { 0: ['q2'], 1: ['q2'] }, q2: { 0: ['q3'], 1: ['q3'] }, q3: {} },
    exemplo: '0100',
  },
  epsilon: {
    nome: 'a*b* ∪ c (AFN com ε)', alphabet: ['a', 'b', 'c'], start: 's', accept: ['q1', 'q3'],
    states: ['s', 'q0', 'q1', 'q2', 'q3'], pos: { s: [80, 200], q0: [240, 110], q1: [430, 110], q2: [240, 300], q3: [430, 300] },
    delta: { s: { ε: ['q0', 'q2'] }, q0: { a: ['q0'], ε: ['q1'] }, q1: { b: ['q1'] }, q2: { c: ['q3'] }, q3: {} },
    exemplo: 'aab',
  },
  redundante: {
    nome: 'AFD com estados equivalentes', alphabet: ['0', '1'], start: 'A', accept: ['C', 'D', 'E'],
    states: ['A', 'B', 'C', 'D', 'E', 'F'], pos: { A: [80, 200], B: [220, 90], C: [220, 310], D: [380, 90], E: [380, 310], F: [530, 200] },
    delta: { A: { 0: ['B'], 1: ['C'] }, B: { 0: ['A'], 1: ['D'] }, C: { 0: ['E'], 1: ['F'] }, D: { 0: ['E'], 1: ['F'] }, E: { 0: ['E'], 1: ['F'] }, F: { 0: ['F'], 1: ['F'] } },
    exemplo: '010',
  },
};

const targets = (A, q, a) => A.delta[q]?.[a] ?? [];
export const isDFA = A => A.states.every(q => A.alphabet.every(a => targets(A, q, a).length === 1) && !targets(A, q, EPS).length);

export function epsClosure(A, set) {
  const out = new Set(set), stack = [...set];
  while (stack.length) for (const r of targets(A, stack.pop(), EPS)) if (!out.has(r)) { out.add(r); stack.push(r); }
  return [...out].sort((x, y) => A.states.indexOf(x) - A.states.indexOf(y));
}

export function move(A, set, a) {
  const out = new Set();
  for (const q of set) for (const r of targets(A, q, a)) out.add(r);
  return [...out];
}

/** Simula o autômato (AFD ou AFN) símbolo a símbolo: o conjunto de estados ativos. */
export function simulate(A, input) {
  const steps = [];
  let cur = epsClosure(A, [A.start]);
  const acc = s => s.some(q => A.accept.includes(q));
  steps.push({ pos: 0, active: cur, msg: cur.length > 1 ? `Início: ${A.start} e tudo o que se alcança dele por ε: {${cur.join(', ')}}.` : `Começa em ${A.start}.` });
  for (let i = 0; i < input.length; i++) {
    const a = input[i];
    if (!A.alphabet.includes(a)) { steps.push({ pos: i, active: [], msg: `'${a}' não está no alfabeto {${A.alphabet.join(', ')}}: rejeita.`, dead: true, result: false }); return steps; }
    const moved = move(A, cur, a);
    const next = epsClosure(A, moved);
    const edges = cur.flatMap(q => targets(A, q, a).map(r => [q, r, a]));
    const msg = next.length === 0
      ? `Lendo '<b>${a}</b>': nenhum estado ativo tem transição com '${a}'. O autômato <b>morre</b> e rejeita.`
      : isDFA(A)
        ? `Lendo '<b>${a}</b>': δ(${cur[0]}, ${a}) = <b>${next[0]}</b>.`
        : `Lendo '<b>${a}</b>': de {${cur.join(', ')}} vamos para {${moved.join(', ')}}${next.length > moved.length ? `, e com o fecho-ε, {${next.join(', ')}}` : ''}. Um AFN está em <b>vários estados ao mesmo tempo</b>.`;
    cur = next;
    steps.push({ pos: i + 1, active: cur, edges, msg, read: a });
    if (!cur.length) { steps.at(-1).result = false; return steps; }
  }
  const ok = acc(cur);
  steps.push({ pos: input.length, active: cur, result: ok, msg: `Fim da entrada. ${ok ? `Algum estado ativo é de aceitação: <b>aceita</b> "${input}".` : `Nenhum estado ativo é de aceitação: <b>rejeita</b> "${input || 'ε'}".`}` });
  return steps;
}

export const accepts = (A, w) => simulate(A, w).at(-1).result === true;

/** Construção de subconjuntos (AFN → AFD). */
export function subsetConstruction(A) {
  const key = s => `{${s.join(',')}}`;
  const start = epsClosure(A, [A.start]);
  const dStates = [start], table = [], steps = [];
  const names = new Map([[key(start), key(start)]]);
  steps.push({ dStates: [...dStates], table: [], cur: null, msg: `O estado inicial do AFD é o fecho-ε do inicial do AFN: <b>${key(start)}</b>. Cada estado do AFD é um <b>conjunto</b> de estados do AFN.` });
  for (let i = 0; i < dStates.length; i++) {
    const S = dStates[i];
    const row = { from: key(S), to: {}, accept: S.some(q => A.accept.includes(q)) };
    table.push(row);
    for (const a of A.alphabet) {
      const T = epsClosure(A, move(A, S, a));
      const k = key(T);
      const isNew = !names.has(k);
      if (isNew) { names.set(k, k); dStates.push(T); }
      row.to[a] = k;
      steps.push({ dStates: [...dStates], table: table.map(r => ({ ...r, to: { ...r.to } })), cur: [i, a], newState: isNew ? k : null,
        msg: `De ${key(S)} lendo '${a}': ${T.length ? `vai para {${move(A, S, a).join(', ')}}${T.length > move(A, S, a).length ? `, fecho-ε ${k}` : ''}` : 'nenhum estado (o conjunto vazio ∅, um estado "morto")'}${isNew ? '. <b>Estado novo</b> no AFD.' : '. Esse conjunto já existe.'}` });
    }
  }
  const dfa = {
    alphabet: A.alphabet, states: table.map(r => r.from), start: key(start), accept: table.filter(r => r.accept).map(r => r.from),
    delta: Object.fromEntries(table.map(r => [r.from, Object.fromEntries(A.alphabet.map(a => [a, [r.to[a]]]))])),
  };
  steps.push({ dStates: [...dStates], table: table.map(r => ({ ...r, to: { ...r.to } })), cur: null, done: true,
    msg: `Pronto: ${table.length} estados no AFD (o AFN tem ${A.states.length}; no pior caso seriam 2<sup>${A.states.length}</sup> = ${2 ** A.states.length}). Os de aceitação são os conjuntos que contêm algum estado final do AFN.` });
  return { steps, dfa };
}

/** Minimização por refinamento de partições (Moore). Supõe AFD completo. */
export function minimize(A) {
  const reach = new Set([A.start]), stack = [A.start];
  while (stack.length) {
    const q = stack.pop();
    for (const a of A.alphabet) { const r = targets(A, q, a)[0]; if (r && !reach.has(r)) { reach.add(r); stack.push(r); } }
  }
  const states = A.states.filter(q => reach.has(q));
  const steps = [];
  let part = [states.filter(q => A.accept.includes(q)), states.filter(q => !A.accept.includes(q))].filter(b => b.length);
  const blockOf = (P, q) => P.findIndex(b => b.includes(q));
  const unreachable = A.states.filter(q => !reach.has(q));
  steps.push({ part: part.map(b => [...b]), msg: `${unreachable.length ? `Remove os inalcançáveis (${unreachable.join(', ')}). ` : ''}Partição inicial: finais × não finais. Estados em blocos diferentes são <b>distinguíveis</b> (a palavra vazia já os separa).` });
  for (let round = 1; ; round++) {
    const next = [];
    const splits = [];
    for (const b of part) {
      const groups = new Map();
      for (const q of b) {
        const sig = A.alphabet.map(a => blockOf(part, targets(A, q, a)[0])).join(',');
        if (!groups.has(sig)) groups.set(sig, []);
        groups.get(sig).push(q);
      }
      if (groups.size > 1) splits.push({ b, into: [...groups.values()] });
      next.push(...groups.values());
    }
    if (next.length === part.length) {
      steps.push({ part: part.map(b => [...b]), done: true, msg: `Rodada ${round}: nenhum bloco se divide. Cada bloco vira um estado: <b>${part.length}</b> estados no AFD mínimo (eram ${A.states.length}).` });
      break;
    }
    part = next;
    steps.push({ part: part.map(b => [...b]), splits, msg: `Rodada ${round}: dois estados continuam juntos só se, para cada símbolo, vão para o mesmo bloco. ${splits.map(s => `{${s.b.join(', ')}} se divide em ${s.into.map(g => `{${g.join(', ')}}`).join(' e ')}`).join('; ')}.` });
  }
  const name = b => b.join('');
  const final = steps.at(-1).part;
  const min = {
    alphabet: A.alphabet, states: final.map(name), start: name(final[blockOf(final, A.start)]),
    accept: final.filter(b => A.accept.includes(b[0])).map(name),
    delta: Object.fromEntries(final.map(b => [name(b), Object.fromEntries(A.alphabet.map(a => [a, [name(final[blockOf(final, targets(A, b[0], a)[0])])]]))])),
  };
  return { steps, min };
}

// ---------- Expressões regulares → AFN (Thompson) ----------

/** Analisa a expressão: união |, concatenação, *, +, ?, parênteses e ε. */
export function parseRegex(src) {
  const s = src.replace(/\s+/g, '');
  let i = 0;
  const peek = () => s[i];
  const fail = msg => { throw new Error(`${msg} (posição ${i + 1})`); };
  function union() {
    let left = concat();
    while (peek() === '|') { i++; left = { t: 'union', a: left, b: concat() }; }
    return left;
  }
  function concat() {
    const parts = [];
    while (i < s.length && peek() !== '|' && peek() !== ')') parts.push(repeat());
    if (!parts.length) return { t: 'eps' };
    return parts.reduce((a, b) => ({ t: 'concat', a, b }));
  }
  function repeat() {
    let x = atom();
    while ('*+?'.includes(peek() ?? '§')) { const op = s[i++]; x = { t: { '*': 'star', '+': 'plus', '?': 'opt' }[op], a: x }; }
    return x;
  }
  function atom() {
    const c = s[i];
    if (c === '(') { i++; const x = union(); if (s[i] !== ')') fail('falta ")"'); i++; return x; }
    if (c === EPS) { i++; return { t: 'eps' }; }
    if (c && /[a-z0-9]/i.test(c)) { i++; return { t: 'sym', c }; }
    fail(c ? `símbolo inesperado "${c}"` : 'expressão incompleta');
  }
  const ast = union();
  if (i < s.length) fail(`símbolo inesperado "${s[i]}"`);
  return ast;
}

export function regexToString(n) {
  const p = (x, ctx) => {
    const str = regexToString(x);
    const need = (ctx === 'concat' && x.t === 'union') || (ctx === 'rep' && (x.t === 'union' || x.t === 'concat'));
    return need ? `(${str})` : str;
  };
  switch (n.t) {
    case 'sym': return n.c;
    case 'eps': return EPS;
    case 'union': return `${regexToString(n.a)}|${regexToString(n.b)}`;
    case 'concat': return `${p(n.a, 'concat')}${p(n.b, 'concat')}`;
    default: return `${p(n.a, 'rep')}${{ star: '*', plus: '+', opt: '?' }[n.t]}`;
  }
}

/**
 * Thompson: cada nó da árvore vira um fragmento com um início e um fim.
 * Também calcula um desenho (largura × altura em "unidades") pela própria
 * estrutura: concatenação lado a lado, união empilhada, fecho com uma volta.
 */
export function thompson(ast) {
  let n = 0;
  const states = [], edges = [], steps = [];
  const newState = () => { const id = `s${n++}`; states.push(id); return id; };
  function build(node) {
    let f;
    switch (node.t) {
      case 'sym': case 'eps': {
        const a = newState(), b = newState();
        edges.push([a, b, node.t === 'sym' ? node.c : EPS]);
        f = { start: a, end: b, w: 2, h: 1, place: (x, y, P) => { P[a] = [x, y]; P[b] = [x + 1, y]; } };
        break;
      }
      case 'concat': {
        const A = build(node.a), B = build(node.b);
        // o fim de A e o início de B viram o mesmo estado
        for (const e of edges) { if (e[0] === B.start) e[0] = A.end; if (e[1] === B.start) e[1] = A.end; }
        states.splice(states.indexOf(B.start), 1);
        const h = Math.max(A.h, B.h);
        f = { start: A.start, end: B.end, w: A.w + B.w - 1, h, place: (x, y, P) => { A.place(x, y + (h - A.h) / 2, P); B.place(x + A.w - 1, y + (h - B.h) / 2, P); P[B.start] = P[A.end]; } };
        break;
      }
      case 'union': {
        const s = newState(), A = build(node.a), B = build(node.b), t = newState();
        edges.push([s, A.start, EPS], [s, B.start, EPS], [A.end, t, EPS], [B.end, t, EPS]);
        const w = Math.max(A.w, B.w) + 2;
        f = { start: s, end: t, w, h: A.h + B.h, place: (x, y, P) => { P[s] = [x, y + (A.h + B.h - 1) / 2]; A.place(x + 1 + (w - 2 - A.w) / 2, y, P); B.place(x + 1 + (w - 2 - B.w) / 2, y + A.h, P); P[t] = [x + w - 1, y + (A.h + B.h - 1) / 2]; } };
        break;
      }
      case 'star': case 'plus': case 'opt': {
        const s = newState(), A = build(node.a), t = newState();
        edges.push([s, A.start, EPS], [A.end, t, EPS]);
        // o 4º campo diz ao desenho para curvar a aresta por baixo (volta) ou por cima (pulo) da peça
        if (node.t !== 'opt') edges.push([A.end, A.start, EPS, { kind: 'volta', rows: A.h }]);   // repetir
        if (node.t !== 'plus') edges.push([s, t, EPS, { kind: 'pulo', rows: A.h }]);            // zero vezes
        const mid = y => y + 0.5 + (A.h - 1) / 2;
        f = { start: s, end: t, w: A.w + 2, h: A.h + 1, place: (x, y, P) => { P[s] = [x, mid(y)]; A.place(x + 1, y + 0.5, P); P[t] = [x + A.w + 1, mid(y)]; } };
        break;
      }
    }
    steps.push({ states: [...states], edges: edges.map(e => [...e]), node: regexToString(node), start: f.start, end: f.end, kind: node.t });
    return f;
  }
  const F = build(ast);
  const P = {};
  F.place(0, 0, P);
  const nfa = {
    states: [...states], start: F.start, accept: [F.end], alphabet: [...new Set(edges.filter(e => e[2] !== EPS).map(e => e[2]))].sort(),
    delta: {}, edges,
  };
  for (const q of states) nfa.delta[q] = {};
  for (const [a, b, c] of edges) (nfa.delta[a][c] ??= []).push(b);
  return { nfa, steps, layout: P, w: F.w, h: F.h };
}

// ---------- Autômato de pilha ----------
// transições: [estado, lê (ou ε), desempilha (ou ε), novo estado, empilha (string, topo à esquerda)]

export const PDA_PRESETS = {
  anbn: {
    nome: 'aⁿbⁿ', start: 'qi', accept: ['qf'], exemplo: 'aaabbb',
    rules: [['qi', EPS, EPS, 'q0', '$'], ['q0', 'a', EPS, 'q0', 'A'], ['q0', 'b', 'A', 'q1', ''], ['q1', 'b', 'A', 'q1', ''], ['q1', EPS, '$', 'qf', ''], ['q0', EPS, '$', 'qf', '']],
    descr: "Empilha um A para cada a; desempilha um A para cada b. Aceita se a pilha voltar ao fundo ($) exatamente quando a entrada acaba.",
  },
  parenteses: {
    nome: 'Parênteses balanceados', start: 'qi', accept: ['qf'], exemplo: '(()(()))',
    rules: [['qi', EPS, EPS, 'q', '$'], ['q', '(', EPS, 'q', 'X'], ['q', ')', 'X', 'q', ''], ['q', EPS, '$', 'qf', '']],
    descr: 'Cada ( empilha um X, cada ) desempilha um. Um ) com a pilha no fundo não tem transição: rejeita.',
  },
  wcw: {
    nome: 'w c wᴿ (palíndromo com centro marcado)', start: 'qi', accept: ['qf'], exemplo: 'abbcbba',
    rules: [['qi', EPS, EPS, 'q0', '$'], ['q0', 'a', EPS, 'q0', 'a'], ['q0', 'b', EPS, 'q0', 'b'], ['q0', 'c', EPS, 'q1', ''], ['q1', 'a', 'a', 'q1', ''], ['q1', 'b', 'b', 'q1', ''], ['q1', EPS, '$', 'qf', '']],
    descr: 'Empilha a primeira metade; depois do c, cada símbolo precisa casar com o topo. A pilha inverte a ordem: é por isso que reconhece wᴿ.',
  },
};

/** Simula um autômato de pilha determinístico (prefere transições que leem a entrada). */
export function runPDA(M, input, maxSteps = 300) {
  let state = M.start, pos = 0;
  const stack = [];   // topo = último elemento
  const steps = [{ state, pos, stack: [], rule: null, msg: `Estado ${state}, pilha vazia, entrada "${input}".` }];
  for (let k = 0; k < maxSteps; k++) {
    const sym = input[pos];
    const top = stack.at(-1);
    const fits = r => r[0] === state && (r[2] === EPS || r[2] === top);
    const rule = M.rules.find(r => fits(r) && r[1] === sym && sym != null) ?? M.rules.find(r => fits(r) && r[1] === EPS);
    if (!rule) break;
    const [, read, pop, to, push] = rule;
    if (read !== EPS) pos++;
    if (pop !== EPS) stack.pop();
    for (const c of [...push].reverse()) stack.push(c);
    state = to;
    const ri = M.rules.indexOf(rule);
    steps.push({ state, pos, stack: [...stack], rule: ri,
      msg: `δ(${rule[0]}, ${read}, ${pop}) = (${to}, ${push || EPS}): ${read === EPS ? 'sem ler a entrada' : `lê '${read}'`}${pop === EPS ? '' : `, desempilha ${pop}`}${push ? `, empilha ${push}` : ''}.` });
  }
  const last = steps.at(-1);
  const ok = M.accept.includes(last.state) && last.pos === input.length;
  steps.push({ ...last, rule: null, result: ok, msg: ok ? `Entrada consumida e estado final ${last.state}: <b>aceita</b>.` : last.pos < input.length ? `Nenhuma transição para (${last.state}, '${input[last.pos]}', topo ${last.stack.at(-1) ?? 'vazio'}) e a entrada não acabou: <b>rejeita</b>.` : `A entrada acabou, mas ${last.state} não é final: <b>rejeita</b>.` });
  return steps;
}

// ---------- Máquina de Turing ----------
// δ: { estado: { símbolo: [novo estado, escreve, 'L' | 'R'] } }; '_' é o branco.

export const BLANK = '_';

export const TM_PRESETS = {
  incremento: {
    nome: 'Incremento binário', start: 'dir', accept: 'fim', exemplo: '1011',
    descr: 'Vai até o fim do número e soma 1: troca os 1s finais por 0 até achar um 0 (ou o branco) e escreve 1.',
    delta: {
      dir: { 0: ['dir', '0', 'R'], 1: ['dir', '1', 'R'], _: ['soma', '_', 'L'] },
      soma: { 1: ['soma', '0', 'L'], 0: ['fim', '1', 'L'], _: ['fim', '1', 'L'] },
    },
  },
  anbn: {
    nome: 'aⁿbⁿ', start: 'q0', accept: 'aceita', exemplo: 'aabb',
    descr: 'Marca um a com X, corre até o primeiro b e o marca com Y, volta e repete. Linguagem livre de contexto, decidida com a fita como memória.',
    delta: {
      q0: { a: ['q1', 'X', 'R'], Y: ['q3', 'Y', 'R'], _: ['aceita', '_', 'R'] },
      q1: { a: ['q1', 'a', 'R'], Y: ['q1', 'Y', 'R'], b: ['q2', 'Y', 'L'] },
      q2: { a: ['q2', 'a', 'L'], Y: ['q2', 'Y', 'L'], X: ['q0', 'X', 'R'] },
      q3: { Y: ['q3', 'Y', 'R'], _: ['aceita', '_', 'R'] },
    },
  },
  anbncn: {
    nome: 'aⁿbⁿcⁿ', start: 'q0', accept: 'aceita', exemplo: 'aabbcc',
    descr: 'Nenhum autômato de pilha reconhece aⁿbⁿcⁿ (não é livre de contexto), mas uma máquina de Turing sim: marca um a, um b e um c por volta.',
    delta: {
      q0: { a: ['q1', 'X', 'R'], Y: ['q4', 'Y', 'R'], _: ['aceita', '_', 'R'] },
      q1: { a: ['q1', 'a', 'R'], Y: ['q1', 'Y', 'R'], b: ['q2', 'Y', 'R'] },
      q2: { b: ['q2', 'b', 'R'], Z: ['q2', 'Z', 'R'], c: ['q3', 'Z', 'L'] },
      q3: { a: ['q3', 'a', 'L'], b: ['q3', 'b', 'L'], Y: ['q3', 'Y', 'L'], Z: ['q3', 'Z', 'L'], X: ['q0', 'X', 'R'] },
      q4: { Y: ['q4', 'Y', 'R'], Z: ['q4', 'Z', 'R'], _: ['aceita', '_', 'R'] },
    },
  },
  palindromo: {
    nome: 'Palíndromo binário', start: 'q0', accept: 'aceita', exemplo: '10101',
    descr: 'Apaga o primeiro símbolo lembrando-o no estado (q1 = era 0, q2 = era 1), corre até o fim e confere o último.',
    delta: {
      q0: { 0: ['q1', '_', 'R'], 1: ['q2', '_', 'R'], _: ['aceita', '_', 'R'] },
      q1: { 0: ['q1', '0', 'R'], 1: ['q1', '1', 'R'], _: ['q3', '_', 'L'] },
      q2: { 0: ['q2', '0', 'R'], 1: ['q2', '1', 'R'], _: ['q4', '_', 'L'] },
      q3: { 0: ['q5', '_', 'L'], _: ['aceita', '_', 'R'] },
      q4: { 1: ['q5', '_', 'L'], _: ['aceita', '_', 'R'] },
      q5: { 0: ['q5', '0', 'L'], 1: ['q5', '1', 'L'], _: ['q0', '_', 'R'] },
    },
  },
};

export function runTM(M, input, maxSteps = 2000) {
  const tape = new Map([...input].map((c, i) => [i, c]));
  let head = 0, state = M.start;
  const read = () => tape.get(head) ?? BLANK;
  const snap = () => ({ tape: new Map(tape), head, state });
  const steps = [{ ...snap(), msg: `Fita com "${input || ''}", cabeçote na posição 0, estado ${state}.` }];
  for (let k = 0; k < maxSteps; k++) {
    if (state === M.accept) break;
    const sym = read();
    const tr = M.delta[state]?.[sym];
    if (!tr) { steps.push({ ...snap(), halt: 'rejeita', msg: `Não há transição para (${state}, ${sym}): a máquina <b>para e rejeita</b>.` }); return steps; }
    const [to, write, dir] = tr;
    tape.set(head, write);
    const from = state;
    state = to; head += dir === 'R' ? 1 : -1;
    steps.push({ ...snap(), rule: [from, sym], msg: `δ(${from}, ${sym}) = (${to}, ${write}, ${dir === 'R' ? '→' : '←'}): escreve ${write}${write === sym ? ' (o mesmo)' : ''} e move ${dir === 'R' ? 'à direita' : 'à esquerda'}.` });
  }
  if (state === M.accept) steps.push({ ...snap(), halt: 'aceita', msg: `Chegou ao estado ${M.accept}: <b>aceita</b> depois de ${steps.length - 1} transições.` });
  else steps.push({ ...snap(), halt: 'limite', msg: `Parei depois de ${maxSteps} passos. (Uma máquina de Turing pode rodar para sempre, e não existe algoritmo que sempre detecte isso: o problema da parada.)` });
  return steps;
}

/** Conteúdo útil da fita (sem brancos nas pontas). */
export function tapeString(tape) {
  const idx = [...tape.keys()].filter(i => tape.get(i) !== BLANK);
  if (!idx.length) return '';
  let s = '';
  for (let i = Math.min(...idx); i <= Math.max(...idx); i++) s += tape.get(i) ?? BLANK;
  return s;
}
