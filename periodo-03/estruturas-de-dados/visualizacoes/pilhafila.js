// Pilha (vetor + topo), fila circular (vetor + início/fim) e a aplicação
// clássica de pilha: verificar se parênteses estão balanceados.

import { lineFinder } from '../../../engine/highlight.js';

export const MAX = 8;

export const CODES = {
  pilha: `class Pilha {
    int itens[MAX];
    int topo = -1;                       // índice do elemento do topo
public:
    void empilha(int x) {
        if (topo == MAX - 1) throw overflow_error("pilha cheia");
        itens[++topo] = x;
    }
    int desempilha() {
        if (topo == -1) throw underflow_error("pilha vazia");
        return itens[topo--];
    }
};`,
  fila: `class Fila {
    int itens[MAX];
    int inicio = 0, fim = 0, tamanho = 0;
public:
    void enfileira(int x) {
        if (tamanho == MAX) throw overflow_error("fila cheia");
        itens[fim] = x;
        fim = (fim + 1) % MAX;           // dá a volta no vetor
        tamanho++;
    }
    int desenfileira() {
        if (tamanho == 0) throw underflow_error("fila vazia");
        int x = itens[inicio];
        inicio = (inicio + 1) % MAX;
        tamanho--;
        return x;
    }
};`,
  parenteses: `bool balanceado(const string& s) {
    stack<char> p;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{')
            p.push(c);                   // abre: guarda na pilha
        else if (c == ')' || c == ']' || c == '}') {
            if (p.empty() || !casa(p.top(), c))
                return false;            // fecha sem par correspondente
            p.pop();
        }
    }
    return p.empty();                    // sobrou alguém aberto?
}`,
};

let nextId = 1;

export const emptyStack = () => ({ items: Array(MAX).fill(null), topo: -1 });
export const emptyQueue = () => ({ items: Array(MAX).fill(null), inicio: 0, fim: 0, tamanho: 0 });

const cloneItems = items => items.map(it => (it ? { ...it } : null));

export function stackOp(state, op, x) {
  const L = lineFinder(CODES.pilha);
  const st = { items: cloneItems(state.items), topo: state.topo };
  const steps = [];
  const snap = (line, msg, extra = {}) => steps.push({ kind: 'pilha', line, msg, items: cloneItems(st.items), topo: st.topo, ...extra, vars: { topo: st.topo, ...(extra.vars ?? {}) } });
  let out = null, error = null;
  if (op === 'noop') {                 // só mostra o estado atual
    snap(null, '');
    return { steps, state: st, out: null, error: null };
  }
  if (op === 'push') {
    snap(L('void empilha'), `<code>empilha(${x})</code>.`, { vars: { x } });
    if (st.topo === MAX - 1) {
      error = 'pilha cheia';
      snap(L('if (topo == MAX - 1)'), `topo = ${MAX - 1}: a pilha está <b>cheia</b> (overflow). Lança exceção.`, { error, vars: { x } });
    } else {
      snap(L('if (topo == MAX - 1)'), `topo = ${st.topo} &lt; ${MAX - 1}: há espaço.`, { vars: { x } });
      st.topo++;
      const item = { id: nextId++, v: x };
      st.items[st.topo] = item;
      snap(L('itens[++topo] = x'), `Incrementa o topo para ${st.topo} e guarda ${x} ali. <b>O(1)</b>.`, { hot: item.id, vars: { x } });
    }
  } else {
    snap(L('int desempilha'), '<code>desempilha()</code>.');
    if (st.topo === -1) {
      error = 'pilha vazia';
      snap(L('if (topo == -1)'), 'topo = −1: a pilha está <b>vazia</b> (underflow). Lança exceção.', { error });
    } else {
      snap(L('if (topo == -1)'), `topo = ${st.topo}: há elemento.`);
      out = st.items[st.topo];
      st.items[st.topo] = null;
      st.topo--;
      snap(L('return itens[topo--]'), `Devolve ${out.v} (o <b>último</b> que entrou) e decrementa o topo para ${st.topo}. LIFO: <i>last in, first out</i>.`, { out, vars: { retorno: out.v } });
    }
  }
  return { steps, state: { items: st.items, topo: st.topo }, out: out?.v ?? null, error };
}

export function queueOp(state, op, x) {
  const L = lineFinder(CODES.fila);
  const q = { ...state, items: cloneItems(state.items) };
  const steps = [];
  const snap = (line, msg, extra = {}) => steps.push({ kind: 'fila', line, msg, items: cloneItems(q.items), inicio: q.inicio, fim: q.fim, tamanho: q.tamanho, ...extra, vars: { inicio: q.inicio, fim: q.fim, tamanho: q.tamanho, ...(extra.vars ?? {}) } });
  let out = null, error = null;
  if (op === 'noop') {
    snap(null, '');
    return { steps, state: q, out: null, error: null };
  }
  if (op === 'push') {
    snap(L('void enfileira'), `<code>enfileira(${x})</code>.`, { vars: { x } });
    if (q.tamanho === MAX) {
      error = 'fila cheia';
      snap(L('if (tamanho == MAX)'), 'A fila está <b>cheia</b>. Repare que início == fim tanto com a fila cheia quanto vazia: por isso guardamos o tamanho.', { error, vars: { x } });
    } else {
      snap(L('if (tamanho == MAX)'), `tamanho = ${q.tamanho} &lt; ${MAX}: há espaço.`, { vars: { x } });
      const item = { id: nextId++, v: x };
      q.items[q.fim] = item;
      snap(L('itens[fim] = x'), `Coloca ${x} na posição fim = ${q.fim}.`, { hot: item.id, vars: { x } });
      const old = q.fim;
      q.fim = (q.fim + 1) % MAX;
      snap(L('fim = (fim + 1) % MAX'), old === MAX - 1 ? `fim = (${old} + 1) % ${MAX} = <b>0</b>: <b>deu a volta</b>! As posições do começo, liberadas pelas remoções, são reaproveitadas.` : `fim avança para ${q.fim}.`, { hot: item.id, vars: { x } });
      q.tamanho++;
      snap(L('tamanho++'), `tamanho = ${q.tamanho}. Tudo em <b>O(1)</b>, sem deslocar ninguém.`, { vars: { x } });
    }
  } else {
    snap(L('int desenfileira'), '<code>desenfileira()</code>.');
    if (q.tamanho === 0) {
      error = 'fila vazia';
      snap(L('if (tamanho == 0)'), 'A fila está <b>vazia</b>. Lança exceção.', { error });
    } else {
      snap(L('if (tamanho == 0)'), `tamanho = ${q.tamanho}: há elemento.`);
      out = q.items[q.inicio];
      snap(L('int x = itens[inicio]'), `Pega ${out.v}, o <b>primeiro</b> que entrou. FIFO: <i>first in, first out</i>.`, { hot: out.id, vars: { x: out.v } });
      q.items[q.inicio] = null;
      const old = q.inicio;
      q.inicio = (q.inicio + 1) % MAX;
      snap(L('inicio = (inicio + 1) % MAX'), old === MAX - 1 ? `início dá a volta para 0.` : `início avança para ${q.inicio}. Numa fila com vetor "reto", teríamos que deslocar todos os elementos: O(n).`, { out, vars: { x: out.v } });
      q.tamanho--;
      snap(L('tamanho--'), `tamanho = ${q.tamanho}. Devolve ${out.v}.`, { out, vars: { retorno: out.v } });
    }
  }
  return { steps, state: q, out: out?.v ?? null, error };
}

const PAIRS = { ')': '(', ']': '[', '}': '{' };

export function balancedSteps(s) {
  const L = lineFinder(CODES.parenteses);
  const stack = [];
  const steps = [];
  const snap = (line, msg, extra = {}) => steps.push({ kind: 'parenteses', line, msg, s, stack: stack.map(x => ({ ...x })), ...extra, vars: { 'p.size()': stack.length, ...(extra.vars ?? {}) } });
  snap(L('bool balanceado'), `Verificar <code>${s || '(vazia)'}</code>. Cada fechamento precisa casar com a abertura <b>mais recente</b> ainda aberta: é exatamente o comportamento de uma pilha.`);
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if ('([{'.includes(c)) {
      stack.push({ id: `c${i}`, c, i });
      snap(L('p.push(c)'), `'${c}' abre: empilha.`, { i, vars: { c } });
    } else if (')]}'.includes(c)) {
      const top = stack[stack.length - 1];
      if (!top || top.c !== PAIRS[c]) {
        snap(L('if (p.empty()'), top ? `'${c}' fecha, mas o topo é '${top.c}': não casam!` : `'${c}' fecha, mas a pilha está vazia: não há quem feche.`, { i, bad: i, vars: { c } });
        snap(L('return false;'), '<b class="c-red">Não balanceada.</b>', { i, bad: i, done: false });
        return steps;
      }
      snap(L('if (p.empty()'), `'${c}' fecha e o topo é '${top.c}': casam.`, { i, match: [top.i, i], vars: { c } });
      stack.pop();
      snap(L('p.pop()'), 'Desempilha o par resolvido.', { i, match: [top.i, i], vars: { c } });
    } else {
      snap(L('for (char c : s)'), `'${c}' não é parêntese: ignora.`, { i, vars: { c } });
    }
  }
  const ok = stack.length === 0;
  snap(L('return p.empty()'), ok ? '<b class="c-green">Balanceada!</b> A pilha terminou vazia.' : `<b class="c-red">Não balanceada:</b> sobraram ${stack.length} abertura(s) sem fechamento.`, { done: ok });
  return steps;
}

export const isBalanced = s => balancedSteps(s).at(-1).done === true;
