// Gera os passos dos algoritmos de ordenação elementares.
// Cada passo guarda uma cópia do vetor; cada elemento tem um `id` estável para
// que a animação mostre a barra *se movendo* quando há troca.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  bubble: `void bubbleSort(int v[], int n) {
    for (int i = 0; i < n - 1; i++) {
        bool trocou = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (v[j] > v[j + 1]) {
                swap(v[j], v[j + 1]);
                trocou = true;
            }
        }
        if (!trocou) break;  // nenhuma troca: já está ordenado
    }
}`,
  selection: `void selectionSort(int v[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int menor = i;
        for (int j = i + 1; j < n; j++) {
            if (v[j] < v[menor])
                menor = j;
        }
        swap(v[i], v[menor]);
    }
}`,
  insertion: `void insertionSort(int v[], int n) {
    for (int i = 1; i < n; i++) {
        int chave = v[i];
        int j = i - 1;
        while (j >= 0 && v[j] > chave) {
            v[j + 1] = v[j];   // empurra para a direita
            j--;
        }
        v[j + 1] = chave;
    }
}`,
};

export const NAMES = { bubble: 'Bubble Sort', selection: 'Selection Sort', insertion: 'Insertion Sort' };

function recorder(code, values) {
  const L = lineFinder(code);
  const slots = values.map((v, id) => ({ id, v }));
  const steps = [];
  const st = { comps: 0, moves: 0, sorted: new Set(), float: null };
  const snap = (line, msg, vars = {}, marks = {}) => steps.push({
    line, msg, marks,
    vars: { n: values.length, ...vars, 'comparações': st.comps, 'movimentos': st.moves },
    items: slots.map(x => (x ? { ...x } : null)),
    float: st.float ? { ...st.float } : null,
    sorted: [...st.sorted],
  });
  const last = code.split('\n').length;
  return { L, last, slots, steps, st, snap };
}

const val = x => x.v;

export function bubbleSteps(values) {
  const { L, last, slots: a, steps, st, snap } = recorder(CODES.bubble, values);
  const n = a.length;
  snap(L('void bubbleSort'), `Vamos ordenar <b>${n}</b> números. A ideia: comparar vizinhos e trocar se estiverem fora de ordem — os maiores "borbulham" para o fim.`);
  let i = 0;
  for (; i < n - 1; i++) {
    let trocou = false;
    snap(L('for (int i'), `Início da <b>passada ${i + 1}</b>. Os últimos ${i} elementos já estão no lugar certo.`, { i, trocou });
    for (let j = 0; j < n - 1 - i; j++) {
      st.comps++;
      const bigger = val(a[j]) > val(a[j + 1]);
      snap(L('if (v[j] > v[j + 1])'),
        `Compara <b>v[${j}] = ${val(a[j])}</b> com <b>v[${j + 1}] = ${val(a[j + 1])}</b>: ${bigger ? 'estão fora de ordem.' : 'já estão em ordem, segue.'}`,
        { i, j, trocou }, { [j]: 'cmp', [j + 1]: 'cmp' });
      if (bigger) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        st.moves++;
        trocou = true;
        snap(L('swap('), `Troca! Agora v[${j}] = ${val(a[j])} e v[${j + 1}] = ${val(a[j + 1])}.`, { i, j, trocou }, { [j]: 'swap', [j + 1]: 'swap' });
      }
    }
    st.sorted.add(n - 1 - i);
    if (!trocou) {
      for (let k = 0; k < n; k++) st.sorted.add(k);
      snap(L('if (!trocou)'), `Nenhuma troca nesta passada ⇒ o vetor <b>já está ordenado</b>. O <code>break</code> economiza as passadas restantes.`, { i, trocou });
      break;
    }
    snap(L('if (!trocou)'), `Fim da passada: o maior dos restantes (${val(a[n - 1 - i])}) chegou à posição ${n - 1 - i}.`, { i, trocou });
  }
  for (let k = 0; k < n; k++) st.sorted.add(k);
  snap(last, `Pronto! ${st.comps} comparações e ${st.moves} trocas. No pior caso o Bubble Sort faz ~n²/2 comparações: <b>O(n²)</b>.`);
  return steps;
}

export function selectionSteps(values) {
  const { L, last, slots: a, steps, st, snap } = recorder(CODES.selection, values);
  const n = a.length;
  snap(L('void selectionSort'), `A ideia: para cada posição <b>i</b>, <b>selecionar</b> o menor elemento do resto do vetor e colocá-lo ali.`);
  for (let i = 0; i < n - 1; i++) {
    let menor = i;
    snap(L('int menor = i'), `Posição ${i}: por enquanto o menor é v[${i}] = ${val(a[i])}.`, { i, menor }, { [i]: 'cur', [menor]: 'min' });
    for (let j = i + 1; j < n; j++) {
      st.comps++;
      const less = val(a[j]) < val(a[menor]);
      snap(L('if (v[j] < v[menor])'), `v[${j}] = ${val(a[j])} é menor que o menor atual (${val(a[menor])})? <b>${less ? 'Sim' : 'Não'}</b>.`,
        { i, j, menor }, { [i]: 'cur', [menor]: 'min', [j]: 'cmp' });
      if (less) {
        menor = j;
        snap(L('menor = j;'), `Novo menor: v[${j}] = ${val(a[j])}.`, { i, j, menor }, { [i]: 'cur', [menor]: 'min' });
      }
    }
    [a[i], a[menor]] = [a[menor], a[i]];
    if (menor !== i) st.moves++;
    st.sorted.add(i);
    snap(L('swap(v[i], v[menor])'), menor === i
      ? `O menor já estava na posição ${i}; a troca não muda nada.`
      : `Troca v[${i}] com v[${menor}]: o ${val(a[i])} vai para a posição ${i}, definitiva.`,
    { i, menor }, { [i]: 'swap', [menor]: 'swap' });
  }
  for (let k = 0; k < n; k++) st.sorted.add(k);
  snap(last, `Pronto! ${st.comps} comparações (sempre n(n−1)/2, mesmo se já estiver ordenado) e só ${st.moves} trocas.`);
  return steps;
}

export function insertionSteps(values) {
  const { L, last, slots: a, steps, st, snap } = recorder(CODES.insertion, values);
  const n = a.length;
  st.sorted.add(0);
  snap(L('void insertionSort'), `Como organizar cartas na mão: pegamos a próxima carta e a <b>inserimos</b> no lugar certo entre as já ordenadas.`);
  for (let i = 1; i < n; i++) {
    const chave = a[i];
    a[i] = null;
    st.float = { ...chave, pos: i };
    snap(L('int chave = v[i]'), `Retira a chave = <b>${chave.v}</b> da posição ${i}. A parte v[0..${i - 1}] já está ordenada.`, { i, chave: chave.v });
    let j = i - 1;
    snap(L('int j = i - 1'), `Começa a comparar com o vizinho da esquerda, j = ${j}.`, { i, chave: chave.v, j });
    while (true) {
      if (j < 0) {
        snap(L('while (j >= 0'), `j = −1: chegamos ao início do vetor.`, { i, chave: chave.v, j });
        break;
      }
      st.comps++;
      const greater = val(a[j]) > chave.v;
      snap(L('while (j >= 0'), `v[${j}] = ${val(a[j])} > ${chave.v}? <b>${greater ? 'Sim' : 'Não'}</b>.`, { i, chave: chave.v, j }, { [j]: 'cmp' });
      if (!greater) break;
      a[j + 1] = a[j];
      a[j] = null;
      st.float.pos = j;
      st.moves++;
      snap(L('v[j + 1] = v[j]'), `Empurra o ${val(a[j + 1])} uma casa para a direita, abrindo espaço.`, { i, chave: chave.v, j }, { [j + 1]: 'swap' });
      j--;
      snap(L('j--'), `j = ${j}.`, { i, chave: chave.v, j });
    }
    a[j + 1] = chave;
    st.float = null;
    st.moves++;
    for (let k = 0; k <= i; k++) st.sorted.add(k);
    snap(L('v[j + 1] = chave'), `Insere a chave ${chave.v} na posição ${j + 1}. Agora v[0..${i}] está ordenado.`, { i, chave: chave.v, j }, { [j + 1]: 'key' });
  }
  snap(last, `Pronto! ${st.comps} comparações. Em um vetor quase ordenado o Insertion Sort é rapidíssimo: <b>O(n)</b> no melhor caso.`);
  return steps;
}

export const GENERATORS = { bubble: bubbleSteps, selection: selectionSteps, insertion: insertionSteps };
