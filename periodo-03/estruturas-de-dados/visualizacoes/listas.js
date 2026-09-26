// Lista simplesmente encadeada: cada operação gera os passos da animação e
// devolve a lista resultante. Os nós têm `id` estável para a animação mostrar
// o nó *se movendo* quando a lista muda.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  inicio: `void Lista::insereInicio(int x) {
    No* novo = new No{x, cabeca};   // novo aponta para o antigo primeiro
    cabeca = novo;                  // e passa a ser o primeiro
}`,
  fim: `void Lista::insereFim(int x) {
    No* novo = new No{x, nullptr};
    if (cabeca == nullptr) {        // lista vazia
        cabeca = novo;
        return;
    }
    No* atual = cabeca;
    while (atual->prox != nullptr)  // anda até o último
        atual = atual->prox;
    atual->prox = novo;
}`,
  ordenado: `void Lista::insereOrdenado(int x) {
    No* novo = new No{x, nullptr};
    No* anterior = nullptr;
    No* atual = cabeca;
    while (atual != nullptr && atual->valor < x) {
        anterior = atual;
        atual = atual->prox;
    }
    novo->prox = atual;
    if (anterior == nullptr) cabeca = novo;
    else anterior->prox = novo;
}`,
  busca: `bool Lista::busca(int x) {
    No* atual = cabeca;
    while (atual != nullptr) {
        if (atual->valor == x)
            return true;
        atual = atual->prox;
    }
    return false;
}`,
  remove: `void Lista::remove(int x) {
    No* anterior = nullptr;
    No* atual = cabeca;
    while (atual != nullptr && atual->valor != x) {
        anterior = atual;
        atual = atual->prox;
    }
    if (atual == nullptr) return;          // não achou
    if (anterior == nullptr)
        cabeca = atual->prox;              // era o primeiro
    else
        anterior->prox = atual->prox;      // "pula" o nó
    delete atual;
}`,
};

export const LABELS = { inicio: 'Inserir no início', fim: 'Inserir no fim', ordenado: 'Inserir ordenado', busca: 'Buscar', remove: 'Remover' };

let nextId = 1;
export const resetIds = (n = 1) => { nextId = n; };

/** Cria o estado de lista a partir de valores (útil para exemplos e testes). */
export function fromValues(values) {
  const nodes = values.map(v => ({ id: nextId++, valor: v, prox: null }));
  nodes.forEach((n, i) => { n.prox = nodes[i + 1]?.id ?? null; });
  return { nodes, cabeca: nodes[0]?.id ?? null };
}

/** Valores na ordem da lista (seguindo os ponteiros a partir da cabeça). */
export function toValues(list) {
  const byId = new Map(list.nodes.map(n => [n.id, n]));
  const out = [];
  let cur = list.cabeca, guard = 0;
  while (cur != null && guard++ < 1000) { out.push(byId.get(cur).valor); cur = byId.get(cur).prox; }
  return out;
}

/**
 * Executa a operação `op` com o valor x sobre `list` (não a altera).
 * Retorna { steps, list: nova lista, result }.
 */
export function run(op, list, x) {
  const L = lineFinder(CODES[op]);
  const nodes = new Map(list.nodes.map(n => [n.id, { ...n }]));
  let cabeca = list.cabeca;
  const ptr = {};                // atual, anterior, novo → id do nó (ou null)
  const steps = [];
  const snap = (line, msg, extra = {}) => steps.push({
    op, line, msg,
    nodes: [...nodes.values()].map(n => ({ ...n })),
    cabeca, ptr: { ...ptr }, ...extra,
    vars: {
      x,
      ...Object.fromEntries(Object.entries(ptr).map(([k, v]) => [k, v == null ? 'nullptr' : `nó(${nodes.get(v)?.valor})`])),
    },
  });
  const val = id => nodes.get(id)?.valor;
  let result = null;

  if (op === 'inicio') {
    const novo = { id: nextId++, valor: x, prox: cabeca, state: 'new' };
    nodes.set(novo.id, novo);
    ptr.novo = novo.id;
    snap(L('No* novo = new'), `Aloca um nó com valor <b>${x}</b> cujo <code>prox</code> aponta para o atual primeiro (${cabeca == null ? 'nullptr' : val(cabeca)}). Nada mais precisa mudar de lugar!`);
    cabeca = novo.id;
    novo.state = null;
    snap(L('cabeca = novo'), `A cabeça passa a apontar para o novo nó. Custo: <b>O(1)</b>, independente do tamanho da lista.`);
  }

  if (op === 'fim') {
    const novo = { id: nextId++, valor: x, prox: null, state: 'new' };
    nodes.set(novo.id, novo);
    ptr.novo = novo.id;
    snap(L('No* novo = new'), `Aloca o nó ${x} com <code>prox = nullptr</code> (ele será o último).`);
    snap(L('if (cabeca == nullptr)'), cabeca == null ? 'A lista está vazia.' : 'A lista não está vazia: precisamos achar o último nó.');
    if (cabeca == null) {
      cabeca = novo.id; novo.state = null;
      snap(L('cabeca = novo;'), 'O novo nó vira a cabeça.');
    } else {
      ptr.atual = cabeca;
      snap(L('No* atual = cabeca'), `<code>atual</code> começa na cabeça (${val(cabeca)}).`);
      let k = 0;
      while (nodes.get(ptr.atual).prox != null) {
        snap(L('while (atual->prox'), `atual->prox ≠ nullptr: ainda não é o último.`);
        ptr.atual = nodes.get(ptr.atual).prox;
        k++;
        snap(L('atual = atual->prox'), `Avança para ${val(ptr.atual)}.`);
      }
      snap(L('while (atual->prox'), `atual->prox == nullptr: <b>${val(ptr.atual)}</b> é o último. Foram ${k} passo(s): <b>O(n)</b>. (Guardar um ponteiro para a cauda deixaria isso O(1).)`);
      nodes.get(ptr.atual).prox = novo.id;
      novo.state = null;
      snap(L('atual->prox = novo'), `O último passa a apontar para o novo nó.`);
    }
  }

  if (op === 'ordenado') {
    const novo = { id: nextId++, valor: x, prox: null, state: 'new' };
    nodes.set(novo.id, novo);
    ptr.novo = novo.id; ptr.anterior = null; ptr.atual = cabeca;
    snap(L('No* novo = new'), `Aloca o nó ${x}. Vamos procurar a primeira posição com valor ≥ ${x}.`);
    snap(L('No* atual = cabeca'), '<code>anterior</code> começa em nullptr e <code>atual</code> na cabeça.');
    while (ptr.atual != null && val(ptr.atual) < x) {
      snap(L('while (atual != nullptr'), `${val(ptr.atual)} < ${x}: continua andando.`);
      ptr.anterior = ptr.atual;
      ptr.atual = nodes.get(ptr.atual).prox;
      snap(L('atual = atual->prox'), `anterior = ${val(ptr.anterior)}, atual = ${ptr.atual == null ? 'nullptr' : val(ptr.atual)}.`);
    }
    snap(L('while (atual != nullptr'), ptr.atual == null ? 'Chegou ao fim: o novo nó vai no final.' : `${val(ptr.atual)} ≥ ${x}: o novo nó entra <b>antes</b> dele.`);
    novo.prox = ptr.atual;
    snap(L('novo->prox = atual'), `Primeiro ligamos o novo nó ao resto da lista (a ordem importa: se mudássemos antes o ponteiro de <code>anterior</code>, perderíamos o resto).`);
    novo.state = null;
    if (ptr.anterior == null) { cabeca = novo.id; snap(L('if (anterior == nullptr)'), 'Sem anterior: o novo nó vira a cabeça.'); }
    else { nodes.get(ptr.anterior).prox = novo.id; snap(L('else anterior->prox'), `O nó ${val(ptr.anterior)} passa a apontar para o novo.`); }
  }

  if (op === 'busca') {
    ptr.atual = cabeca;
    snap(L('No* atual = cabeca'), `Busca sequencial por <b>${x}</b>: numa lista encadeada não há acesso por índice, só dá para seguir os ponteiros.`);
    result = false;
    while (true) {
      snap(L('while (atual != nullptr)'), ptr.atual == null ? 'atual == nullptr: fim da lista.' : `atual aponta para ${val(ptr.atual)}.`);
      if (ptr.atual == null) break;
      if (val(ptr.atual) === x) {
        snap(L('if (atual->valor == x)'), `${val(ptr.atual)} == ${x}? <b>Sim!</b>`, { found: ptr.atual });
        snap(L('return true'), 'Encontrado.', { found: ptr.atual });
        result = true;
        break;
      }
      snap(L('if (atual->valor == x)'), `${val(ptr.atual)} == ${x}? Não.`);
      ptr.atual = nodes.get(ptr.atual).prox;
    }
    if (!result) snap(L('return false'), `${x} não está na lista. Pior caso: <b>O(n)</b>.`);
  }

  if (op === 'remove') {
    ptr.anterior = null; ptr.atual = cabeca;
    snap(L('No* atual = cabeca'), `Remover <b>${x}</b>. Precisamos do nó <b>anterior</b> para religar a lista.`);
    while (ptr.atual != null && val(ptr.atual) !== x) {
      snap(L('while (atual != nullptr'), `${val(ptr.atual)} ≠ ${x}: avança.`);
      ptr.anterior = ptr.atual;
      ptr.atual = nodes.get(ptr.atual).prox;
      snap(L('atual = atual->prox'), `anterior = ${val(ptr.anterior)}, atual = ${ptr.atual == null ? 'nullptr' : val(ptr.atual)}.`);
    }
    if (ptr.atual == null) {
      snap(L('if (atual == nullptr) return'), `${x} não está na lista: nada a remover.`);
    } else {
      snap(L('while (atual != nullptr'), `Achou o nó ${x}.`, { found: ptr.atual });
      const alvo = nodes.get(ptr.atual);
      if (ptr.anterior == null) {
        cabeca = alvo.prox;
        snap(L('cabeca = atual->prox'), 'Era o primeiro: a cabeça pula para o segundo.', { found: alvo.id, detached: alvo.id });
      } else {
        nodes.get(ptr.anterior).prox = alvo.prox;
        snap(L('anterior->prox = atual->prox'), `O nó ${val(ptr.anterior)} passa a apontar para ${alvo.prox == null ? 'nullptr' : val(alvo.prox)}: o nó ${x} saiu da corrente.`, { found: alvo.id, detached: alvo.id });
      }
      alvo.state = 'deleted';
      snap(L('delete atual'), '<code>delete</code> devolve a memória do nó. Sem ele, a memória vazaria.', { detached: alvo.id });
      nodes.delete(alvo.id);
      delete ptr.atual;
      result = true;
    }
  }

  delete ptr.novo;
  snap(null, `Pronto. Lista: [${toValuesFrom(nodes, cabeca).join(', ')}]`);
  const out = { nodes: [...nodes.values()].map(n => ({ id: n.id, valor: n.valor, prox: n.prox })), cabeca };
  return { steps, list: out, result };
}

function toValuesFrom(nodes, cabeca) {
  const out = [];
  let cur = cabeca;
  while (cur != null) { out.push(nodes.get(cur).valor); cur = nodes.get(cur).prox; }
  return out;
}
