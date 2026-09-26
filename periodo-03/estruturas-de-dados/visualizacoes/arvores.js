// Árvore binária de busca (ABB) e árvore AVL, passo a passo.
// A árvore é { root, nodes: Map(id → {id, key, left, right, h}) }; os ids são
// estáveis, então uma rotação AVL aparece como nós *trocando de lugar*.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  insere: `No* insere(No* no, int x) {
    if (no == nullptr)
        return new No(x);                  // lugar vazio: vira folha
    if (x < no->chave)
        no->esq = insere(no->esq, x);      // menor: esquerda
    else if (x > no->chave)
        no->dir = insere(no->dir, x);      // maior: direita
    else
        return no;                         // já existe
    return no;
}`,
  insereAVL: `No* insere(No* no, int x) {
    if (no == nullptr) return new No(x);
    if (x < no->chave) no->esq = insere(no->esq, x);
    else if (x > no->chave) no->dir = insere(no->dir, x);
    else return no;
    atualizaAltura(no);
    int fb = altura(no->esq) - altura(no->dir);   // fator de balanço
    if (fb > 1 && x < no->esq->chave)             // caso LL
        return rotacaoDireita(no);
    if (fb < -1 && x > no->dir->chave)            // caso RR
        return rotacaoEsquerda(no);
    if (fb > 1) {                                 // caso LR
        no->esq = rotacaoEsquerda(no->esq);
        return rotacaoDireita(no);
    }
    if (fb < -1) {                                // caso RL
        no->dir = rotacaoDireita(no->dir);
        return rotacaoEsquerda(no);
    }
    return no;
}`,
  busca: `No* busca(No* no, int x) {
    if (no == nullptr || no->chave == x)
        return no;                         // achou (ou não existe)
    if (x < no->chave)
        return busca(no->esq, x);
    return busca(no->dir, x);
}`,
  remove: `No* remove(No* no, int x) {
    if (no == nullptr) return nullptr;             // não achou
    if (x < no->chave) no->esq = remove(no->esq, x);
    else if (x > no->chave) no->dir = remove(no->dir, x);
    else {
        if (no->esq == nullptr || no->dir == nullptr) {  // 0 ou 1 filho
            No* filho = no->esq ? no->esq : no->dir;
            delete no;
            return filho;
        }
        No* suc = minimo(no->dir);                 // 2 filhos: sucessor
        no->chave = suc->chave;
        no->dir = remove(no->dir, suc->chave);
    }
    return no;                  // (na AVL: rebalanceia aqui, como na inserção)
}`,
  preOrdem: `void preOrdem(No* no) {
    if (no == nullptr) return;
    visita(no);                 // raiz primeiro
    preOrdem(no->esq);
    preOrdem(no->dir);
}`,
  emOrdem: `void emOrdem(No* no) {
    if (no == nullptr) return;
    emOrdem(no->esq);
    visita(no);                 // raiz no meio: sai ORDENADO!
    emOrdem(no->dir);
}`,
  posOrdem: `void posOrdem(No* no) {
    if (no == nullptr) return;
    posOrdem(no->esq);
    posOrdem(no->dir);
    visita(no);                 // raiz por último
}`,
  largura: `void largura(No* raiz) {
    queue<No*> fila;
    if (raiz) fila.push(raiz);
    while (!fila.empty()) {
        No* no = fila.front(); fila.pop();
        visita(no);
        if (no->esq) fila.push(no->esq);
        if (no->dir) fila.push(no->dir);
    }
}`,
};

let nextId = 1;
const h = (T, id) => (id == null ? 0 : T.nodes.get(id).h);
const upd = (T, id) => { const n = T.nodes.get(id); n.h = 1 + Math.max(h(T, n.left), h(T, n.right)); };
export const balance = (T, id) => h(T, T.nodes.get(id).left) - h(T, T.nodes.get(id).right);

export function emptyTree() { return { root: null, nodes: new Map() }; }
export function cloneTree(T) { return { root: T.root, nodes: new Map([...T.nodes].map(([k, v]) => [k, { ...v }])) }; }

export function inorderKeys(T) {
  const out = [];
  const rec = id => { if (id == null) return; const n = T.nodes.get(id); rec(n.left); out.push(n.key); rec(n.right); };
  rec(T.root);
  return out;
}

export function height(T) { return h(T, T.root); }

/** Verifica as invariantes (ordem de ABB, alturas e, se avl, balanço). */
export function check(T, avl = false) {
  let ok = true;
  const rec = (id, lo, hi) => {
    if (id == null) return 0;
    const n = T.nodes.get(id);
    if (!(n.key > lo && n.key < hi)) ok = false;
    const hl = rec(n.left, lo, n.key), hr = rec(n.right, n.key, hi);
    if (n.h !== 1 + Math.max(hl, hr)) ok = false;
    if (avl && Math.abs(hl - hr) > 1) ok = false;
    return 1 + Math.max(hl, hr);
  };
  rec(T.root, -Infinity, Infinity);
  return ok;
}

function recorder(T, codeKey) {
  const L = lineFinder(CODES[codeKey]);
  const steps = [];
  const snap = (line, msg, hl = {}, extra = {}) => steps.push({
    line, msg, hl, ...extra,
    root: T.root,
    nodes: [...T.nodes.values()].map(n => ({ ...n })),
    vars: { ...(extra.vars ?? {}) },
  });
  return { L, steps, snap };
}

// ---------- Rotações ----------
function rotRight(T, y) {
  const Y = T.nodes.get(y); const x = Y.left; const X = T.nodes.get(x);
  Y.left = X.right; X.right = y;
  upd(T, y); upd(T, x);
  return x;
}
function rotLeft(T, x) {
  const X = T.nodes.get(x); const y = X.right; const Y = T.nodes.get(y);
  X.right = Y.left; Y.left = x;
  upd(T, x); upd(T, y);
  return y;
}

/** Rebalanceia o nó `id` (se precisar), registrando os passos. Devolve a nova raiz da subárvore. */
function rebalance(T, id, snap, L, setChild, x = null) {
  upd(T, id);
  const n = T.nodes.get(id);
  const fb = balance(T, id);
  const lines = L ? {
    upd: L('atualizaAltura(no)'), fb: L('int fb ='), ll: L('return rotacaoDireita(no);'), rr: L('return rotacaoEsquerda(no);'),
    lr: L('no->esq = rotacaoEsquerda'), rl: L('no->dir = rotacaoDireita'), ret: L('return no;', L('if (fb < -1) {')),
  } : {};
  snap(lines.upd ?? null, `Na volta da recursão: altura de ${n.key} = ${n.h}, fator de balanço = ${fb > 0 ? '+' : ''}${fb}.`, { cur: id, unbalanced: Math.abs(fb) > 1 ? id : null });
  if (Math.abs(fb) <= 1) return id;
  const left = fb > 1;
  const child = left ? n.left : n.right;
  const cfb = balance(T, child);
  // Na inserção decide pela chave inserida; na remoção, pelo balanço do filho.
  const outer = x != null ? (left ? x < T.nodes.get(child).key : x > T.nodes.get(child).key) : (left ? cfb >= 0 : cfb <= 0);
  const caso = left ? (outer ? 'LL' : 'LR') : (outer ? 'RR' : 'RL');
  snap(lines.fb ?? null, `|fb| = ${Math.abs(fb)} &gt; 1: <b>desbalanceado</b>! Caso <b>${caso}</b>.`, { cur: id, unbalanced: id });
  let newRoot;
  if (caso === 'LL') {
    newRoot = rotRight(T, id); setChild(newRoot);
    snap(lines.ll ?? null, `Rotação simples à <b>direita</b> em ${n.key}: o filho esquerdo sobe e ${n.key} desce para a direita.`, { cur: newRoot, rotated: [id, newRoot] });
  } else if (caso === 'RR') {
    newRoot = rotLeft(T, id); setChild(newRoot);
    snap(lines.rr ?? null, `Rotação simples à <b>esquerda</b> em ${n.key}: o filho direito sobe.`, { cur: newRoot, rotated: [id, newRoot] });
  } else if (caso === 'LR') {
    n.left = rotLeft(T, n.left);
    snap(lines.lr ?? null, `Caso LR (zigue-zague): primeiro uma rotação à esquerda no filho, transformando em LL…`, { cur: n.left, rotated: [n.left] });
    newRoot = rotRight(T, id); setChild(newRoot);
    snap(lines.lr != null ? lines.lr + 1 : null, `…depois rotação à direita em ${n.key}. Rotação <b>dupla</b>.`, { cur: newRoot, rotated: [id, newRoot] });
  } else {
    n.right = rotRight(T, n.right);
    snap(lines.rl ?? null, `Caso RL: primeiro rotação à direita no filho…`, { cur: n.right, rotated: [n.right] });
    newRoot = rotLeft(T, id); setChild(newRoot);
    snap(lines.rl != null ? lines.rl + 1 : null, `…depois rotação à esquerda em ${n.key}. Rotação <b>dupla</b>.`, { cur: newRoot, rotated: [id, newRoot] });
  }
  return newRoot;
}

// ---------- Inserção ----------
export function insert(T0, x, { avl = false } = {}) {
  const T = cloneTree(T0);
  const { L, steps, snap } = recorder(T, avl ? 'insereAVL' : 'insere');
  const path = [];
  const rec = (id, setChild) => {
    if (id == null) {
      const nid = nextId++;
      T.nodes.set(nid, { id: nid, key: x, left: null, right: null, h: 1 });
      setChild(nid);
      snap(L(avl ? 'if (no == nullptr) return new' : 'return new No(x)'), `Posição vazia: <b>${x}</b> entra aqui como folha.`, { cur: nid, path: [...path], created: nid });
      return nid;
    }
    const n = T.nodes.get(id);
    path.push(id);
    if (x === n.key) {
      snap(L(avl ? 'else return no;' : 'return no;'), `${x} já está na árvore: nada a fazer.`, { cur: id, path: [...path] });
      return id;
    }
    const goLeft = x < n.key;
    snap(L(avl ? (goLeft ? 'if (x < no->chave) no->esq' : 'else if (x > no->chave) no->dir') : (goLeft ? 'if (x < no->chave)' : 'else if (x > no->chave)')),
      `${x} ${goLeft ? '&lt;' : '&gt;'} ${n.key}: desce para a <b>${goLeft ? 'esquerda' : 'direita'}</b>.`, { cur: id, path: [...path] });
    rec(goLeft ? n.left : n.right, c => { if (goLeft) n.left = c; else n.right = c; });
    path.pop();
    if (avl) return rebalance(T, id, snap, L, setChild, x);
    upd(T, id);
    return id;
  };
  snap(L(avl ? 'No* insere' : 'No* insere'), `Inserir <b>${x}</b>${avl ? ' numa AVL' : ''}. Começa pela raiz e desce: menores à esquerda, maiores à direita.`);
  rec(T.root, c => { T.root = c; });
  snap(null, avl ? `Pronto. A AVL mantém a altura em O(log n): altura = ${height(T)} com ${T.nodes.size} nó(s).` : `Pronto. Altura da árvore: ${height(T)}.`, {});
  return { steps, tree: T };
}

// ---------- Busca ----------
export function search(T, x) {
  const { L, steps, snap } = recorder(T, 'busca');
  const path = [];
  let id = T.root, found = null;
  snap(L('No* busca'), `Buscar <b>${x}</b>. Cada comparação descarta uma subárvore inteira.`);
  while (true) {
    if (id == null) { snap(L('if (no == nullptr'), `Chegou a nullptr: <b>${x} não está</b> na árvore. ${path.length} comparação(ões).`, { path: [...path] }); break; }
    const n = T.nodes.get(id);
    path.push(id);
    if (n.key === x) { found = id; snap(L('return no;'), `${n.key} == ${x}: <b>achou</b> após ${path.length} comparação(ões).`, { cur: id, path: [...path], found: id }); break; }
    const goLeft = x < n.key;
    snap(L(goLeft ? 'return busca(no->esq' : 'return busca(no->dir'), `${x} ${goLeft ? '&lt;' : '&gt;'} ${n.key}: vai para a ${goLeft ? 'esquerda' : 'direita'}.`, { cur: id, path: [...path] });
    id = goLeft ? n.left : n.right;
  }
  return { steps, found };
}

// ---------- Remoção ----------
export function remove(T0, x, { avl = false } = {}) {
  const T = cloneTree(T0);
  const { L, steps, snap } = recorder(T, 'remove');
  const rec = (id, key, setChild) => {
    if (id == null) { snap(L('if (no == nullptr) return nullptr'), `${key} não está na árvore.`); return null; }
    const n = T.nodes.get(id);
    if (key < n.key || key > n.key) {
      const goLeft = key < n.key;
      snap(L(goLeft ? 'if (x < no->chave)' : 'else if (x > no->chave)'), `${key} ${goLeft ? '&lt;' : '&gt;'} ${n.key}: desce para a ${goLeft ? 'esquerda' : 'direita'}.`, { cur: id });
      rec(goLeft ? n.left : n.right, key, c => { if (goLeft) n.left = c; else n.right = c; });
    } else if (n.left == null || n.right == null) {
      const filho = n.left ?? n.right;
      snap(L('if (no->esq == nullptr ||'), n.left == null && n.right == null
        ? `Achou ${key}: é uma <b>folha</b>. Basta removê-la.`
        : `Achou ${key}: tem <b>um filho</b> (${T.nodes.get(filho).key}), que sobe para o lugar dele.`, { cur: id, deleting: id });
      T.nodes.delete(id);
      setChild(filho);
      snap(L('return filho'), `Nó ${key} removido.`, { cur: filho });
      return filho;
    } else {
      let s = n.right;
      while (T.nodes.get(s).left != null) s = T.nodes.get(s).left;
      const sk = T.nodes.get(s).key;
      snap(L('No* suc = minimo'), `Achou ${key}, com <b>dois filhos</b>. Não dá para simplesmente tirá-lo. Pegamos o <b>sucessor</b>: o menor da subárvore direita (${sk}).`, { cur: id, succ: s });
      n.key = sk;
      snap(L('no->chave = suc->chave'), `Copia ${sk} para cá. A ordem continua válida: ${sk} é maior que tudo à esquerda e menor que o resto da direita.`, { cur: id, succ: s });
      snap(L('no->dir = remove(no->dir'), `Agora removemos o ${sk} original da subárvore direita (ele tem no máximo um filho).`, { cur: s });
      rec(n.right, sk, c => { n.right = c; });
    }
    if (!T.nodes.has(id)) return null;
    if (avl) return rebalance(T, id, snap, null, setChild, null);
    upd(T, id);
    return id;
  };
  snap(L('No* remove'), `Remover <b>${x}</b>.`);
  rec(T.root, x, c => { T.root = c; });
  snap(null, `Pronto. Altura: ${height(T)}.`);
  return { steps, tree: T };
}

// ---------- Percursos ----------
export function traversal(T, kind) {
  const { L, steps, snap } = recorder(T, kind);
  const output = [];
  const visit = id => { output.push(id); snap(L('visita(no)'), `Visita <b>${T.nodes.get(id).key}</b>.`, { cur: id, visited: [...output] }, { output: output.map(i => T.nodes.get(i).key) }); };
  const NAMES = { preOrdem: 'pré-ordem', emOrdem: 'em ordem', posOrdem: 'pós-ordem', largura: 'largura (por níveis)' };
  snap(L(`void ${kind}`), `Percurso em <b>${NAMES[kind]}</b>.`, {}, { output: [] });
  if (kind === 'largura') {
    const queue = T.root != null ? [T.root] : [];
    while (queue.length) {
      const id = queue.shift();
      snap(L('No* no = fila.front()'), `Tira ${T.nodes.get(id).key} da fila. Fila: [${queue.map(i => T.nodes.get(i).key).join(', ')}]`, { cur: id, visited: [...output], queue: [...queue] }, { output: output.map(i => T.nodes.get(i).key) });
      visit(id);
      const n = T.nodes.get(id);
      if (n.left != null) queue.push(n.left);
      if (n.right != null) queue.push(n.right);
    }
  } else {
    const rec = id => {
      if (id == null) return;
      const n = T.nodes.get(id);
      if (kind === 'preOrdem') { visit(id); rec(n.left); rec(n.right); }
      if (kind === 'emOrdem') { rec(n.left); visit(id); rec(n.right); }
      if (kind === 'posOrdem') { rec(n.left); rec(n.right); visit(id); }
    };
    rec(T.root);
  }
  const keys = output.map(i => T.nodes.get(i).key);
  snap(null, `Resultado: <b>${keys.join(', ')}</b>${kind === 'emOrdem' ? ' (ordenado!)' : ''}.`, { visited: [...output] }, { output: keys });
  return { steps, output: keys };
}

/** Constrói uma árvore inserindo as chaves em ordem (sem gerar passos intermediários). */
export function build(keys, { avl = false } = {}) {
  let T = emptyTree();
  for (const k of keys) T = insert(T, k, { avl }).tree;
  return T;
}

/** Posição de cada nó para desenhar: x pela ordem simétrica, y pela profundidade. */
export function layout(snapshot) {
  const byId = new Map(snapshot.nodes.map(n => [n.id, n]));
  const pos = new Map();
  let i = 0, depth = 0;
  const rec = (id, d) => {
    if (id == null) return;
    const n = byId.get(id);
    rec(n.left, d + 1);
    pos.set(id, { i: i++, d });
    depth = Math.max(depth, d);
    rec(n.right, d + 1);
  };
  rec(snapshot.root, 0);
  return { pos, count: i, depth };
}
