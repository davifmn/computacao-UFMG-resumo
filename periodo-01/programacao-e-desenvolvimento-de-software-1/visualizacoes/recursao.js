// Passos de funções recursivas: pilha de chamadas + árvore de recursão.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  fatorial: `int fatorial(int n) {
    if (n <= 1)
        return 1;                  // caso base
    return n * fatorial(n - 1);    // passo recursivo
}`,
  fib: `int fib(int n) {
    if (n < 2)
        return n;                  // casos base: fib(0)=0, fib(1)=1
    return fib(n - 1) + fib(n - 2);
}`,
  fibMemo: `long long memo[100];  // inicializado com -1

long long fib(int n) {
    if (n < 2)
        return n;
    if (memo[n] != -1)
        return memo[n];            // já calculado: reaproveita!
    memo[n] = fib(n - 1) + fib(n - 2);
    return memo[n];
}`,
};

export const LIMITS = { fatorial: 10, fib: 7, fibMemo: 12 };

export function recursionSteps(kind, n) {
  const code = CODES[kind];
  const L = lineFinder(code);
  const fname = kind === 'fatorial' ? 'fatorial' : 'fib';
  const nodes = [];
  const stack = [];
  const memo = kind === 'fibMemo' ? Array(n + 1).fill(null) : null;
  const steps = [];

  const snap = (line, msg) => {
    const top = stack[stack.length - 1];
    steps.push({
      line, msg,
      nodes: nodes.map(x => ({ ...x })),
      stack: stack.map(f => ({ ...f })),
      memo: memo && [...memo],
      vars: {
        ...(top ? { n: top.n } : {}),
        'chamadas feitas': nodes.length,
        'altura da pilha': stack.length,
      },
    });
  };

  const sig = kind === 'fibMemo' ? L('long long fib(int n)') : L(`${fname}(int n)`);

  function call(n, parent) {
    const id = nodes.length;
    const node = { id, parent, n, status: 'active', ret: null };
    nodes.push(node);
    if (parent != null) nodes[parent].status = 'waiting';
    const frame = { id, n, note: '' };
    stack.push(frame);
    snap(sig, `Chamada <b>${fname}(${n})</b>: um novo quadro com sua própria cópia de <code>n = ${n}</code> é empilhado.`);

    const ret = BODIES[kind](n, node, frame);

    snap(steps[steps.length - 1].line, `${fname}(${n}) termina e devolve <b>${ret}</b>. Seu quadro é <b>desempilhado</b>.`);
    stack.pop();
    if (node.status !== 'memo') node.status = 'done';
    if (parent != null) nodes[parent].status = 'active';
    return ret;
  }

  const finish = (node, ret) => { node.ret = ret; if (node.status !== 'memo') node.status = 'ret'; return ret; };

  const BODIES = {
    fatorial(n, node, frame) {
      snap(L('if (n <= 1)'), `n = ${n} ≤ 1? <b>${n <= 1 ? 'Sim' : 'Não'}</b>.`);
      if (n <= 1) {
        finish(node, 1);
        snap(L('return 1;'), `Caso base! Aqui a recursão para de descer.`);
        return 1;
      }
      frame.note = `${n} × fatorial(${n - 1})`;
      snap(L('return n * fatorial'), `Para calcular ${n} × fatorial(${n - 1}) precisamos primeiro de fatorial(${n - 1}). Este quadro fica <b>esperando</b>.`);
      const r = call(n - 1, node.id);
      frame.note = `${n} × ${r}`;
      finish(node, n * r);
      snap(L('return n * fatorial'), `fatorial(${n - 1}) devolveu ${r}. Agora dá para multiplicar: ${n} × ${r} = <b>${n * r}</b>.`);
      return n * r;
    },

    fib(n, node, frame) {
      snap(L('if (n < 2)'), `n = ${n} < 2? <b>${n < 2 ? 'Sim' : 'Não'}</b>.`);
      if (n < 2) {
        finish(node, n);
        snap(L('return n;'), `Caso base: fib(${n}) = ${n}.`);
        return n;
      }
      frame.note = `fib(${n - 1}) + fib(${n - 2})`;
      snap(L('return fib(n - 1)'), `Primeiro calcula fib(${n - 1}).`);
      const a = call(n - 1, node.id);
      frame.note = `${a} + fib(${n - 2})`;
      snap(L('return fib(n - 1)'), `fib(${n - 1}) = ${a}. Agora calcula fib(${n - 2}).`);
      const b = call(n - 2, node.id);
      frame.note = `${a} + ${b}`;
      finish(node, a + b);
      snap(L('return fib(n - 1)'), `fib(${n - 2}) = ${b}. Soma: ${a} + ${b} = <b>${a + b}</b>.`);
      return a + b;
    },

    fibMemo(n, node, frame) {
      snap(L('if (n < 2)'), `n = ${n} < 2? <b>${n < 2 ? 'Sim' : 'Não'}</b>.`);
      if (n < 2) {
        finish(node, n);
        snap(L('return n;'), `Caso base: fib(${n}) = ${n}.`);
        return n;
      }
      const cached = memo[n] != null;
      snap(L('if (memo[n] != -1)'), cached ? `memo[${n}] = ${memo[n]} <b>já foi calculado</b>!` : `memo[${n}] ainda vale −1: precisa calcular.`);
      if (cached) {
        node.status = 'memo';
        finish(node, memo[n]);
        snap(L('return memo[n];'), `Reaproveita o valor guardado — a subárvore inteira de fib(${n}) é <b>poupada</b>.`);
        return memo[n];
      }
      const line = L('memo[n] = fib');
      frame.note = `fib(${n - 1}) + fib(${n - 2})`;
      snap(line, `Primeiro calcula fib(${n - 1}).`);
      const a = call(n - 1, node.id);
      frame.note = `${a} + fib(${n - 2})`;
      snap(line, `fib(${n - 1}) = ${a}. Agora fib(${n - 2}) — provavelmente já está na memória.`);
      const b = call(n - 2, node.id);
      memo[n] = a + b;
      frame.note = `${a} + ${b}`;
      snap(line, `Guarda <b>memo[${n}] = ${a + b}</b> para nunca mais recalcular.`);
      finish(node, a + b);
      snap(L('return memo[n];', line), `Retorna ${a + b}.`);
      return a + b;
    },
  };

  const result = call(n, null);
  const total = nodes.length;
  const extra = kind === 'fib'
    ? ` Repare quantas vezes o mesmo valor foi recalculado: o número de chamadas cresce exponencialmente (≈ 1,6ⁿ). Compare com a versão com memoização!`
    : kind === 'fibMemo' ? ` Com memoização, cada fib(k) é calculado uma única vez: O(n).` : ` São n chamadas empilhadas: tempo e memória O(n).`;
  steps.push({
    ...steps[steps.length - 1],
    nodes: nodes.map(x => ({ ...x })),   // estado após o último desempilhamento
    stack: [],
    vars: { 'chamadas feitas': total, 'altura da pilha': 0, resultado: result },
    line: null,
    msg: `Resultado final: <b>${fname}(${n}) = ${result}</b>, com ${total} chamadas no total.${extra}`,
  });
  return steps;
}

/**
 * Posiciona os nós da árvore de recursão: folhas lado a lado (na ordem das
 * chamadas) e cada pai centralizado sobre os filhos.
 * Retorna { pos: Map(id → {x, depth}), leaves, depth }.
 */
export function layoutTree(nodes) {
  const children = new Map(nodes.map(nd => [nd.id, []]));
  for (const nd of nodes) if (nd.parent != null) children.get(nd.parent).push(nd.id);
  const pos = new Map();
  let leaf = 0;
  let maxDepth = 0;
  const visit = (id, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    const kids = children.get(id);
    if (!kids.length) {
      pos.set(id, { x: leaf++, depth });
      return;
    }
    for (const k of kids) visit(k, depth + 1);
    const xs = kids.map(k => pos.get(k).x);
    pos.set(id, { x: (Math.min(...xs) + Math.max(...xs)) / 2, depth });
  };
  if (nodes.length) visit(0, 0);
  return { pos, leaves: leaf, depth: maxDepth };
}
