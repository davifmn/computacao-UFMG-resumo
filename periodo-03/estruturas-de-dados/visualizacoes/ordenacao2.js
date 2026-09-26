// Ordenação O(n log n): merge sort, quicksort e heapsort, passo a passo.
// Os elementos têm `id` estável para a animação mostrar cada barra se movendo.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  merge: `void mergeSort(int v[], int ini, int fim) {   // ordena v[ini..fim)
    if (fim - ini <= 1) return;
    int meio = (ini + fim) / 2;
    mergeSort(v, ini, meio);                   // ordena a metade esquerda
    mergeSort(v, meio, fim);                   // ordena a metade direita
    intercala(v, ini, meio, fim);              // junta as duas
}

void intercala(int v[], int ini, int meio, int fim) {
    vector<int> aux;
    int i = ini, j = meio;
    while (i < meio && j < fim)                // pega o menor das duas frentes
        aux.push_back(v[i] <= v[j] ? v[i++] : v[j++]);
    while (i < meio) aux.push_back(v[i++]);
    while (j < fim) aux.push_back(v[j++]);
    for (int k = 0; k < aux.size(); k++)
        v[ini + k] = aux[k];
}`,
  quick: `void quickSort(int v[], int ini, int fim) {   // ordena v[ini..fim]
    if (ini >= fim) return;
    int p = particiona(v, ini, fim);
    quickSort(v, ini, p - 1);
    quickSort(v, p + 1, fim);
}

int particiona(int v[], int ini, int fim) {
    int pivo = v[fim];
    int i = ini - 1;                  // v[ini..i] <= pivo
    for (int j = ini; j < fim; j++)
        if (v[j] <= pivo)
            swap(v[++i], v[j]);
    swap(v[i + 1], v[fim]);           // pivô vai para o lugar final
    return i + 1;
}`,
  heap: `void heapSort(int v[], int n) {
    for (int i = n / 2 - 1; i >= 0; i--)
        desce(v, n, i);               // 1) transforma o vetor num heap
    for (int fim = n - 1; fim > 0; fim--) {
        swap(v[0], v[fim]);           // 2) o maior vai para o fim
        desce(v, fim, 0);             //    e o heap é consertado
    }
}

void desce(int v[], int n, int i) {   // "peneira" v[i] para baixo
    while (true) {
        int maior = i, e = 2 * i + 1, d = 2 * i + 2;
        if (e < n && v[e] > v[maior]) maior = e;
        if (d < n && v[d] > v[maior]) maior = d;
        if (maior == i) return;
        swap(v[i], v[maior]);
        i = maior;
    }
}`,
};

export const NAMES = { merge: 'Merge Sort', quick: 'Quicksort', heap: 'Heapsort' };

function recorder(kind, values) {
  const L = lineFinder(CODES[kind]);
  const a = values.map((v, id) => ({ id, v }));
  const st = { comps: 0, moves: 0, sorted: new Set(), aux: [], depth: 0 };
  const steps = [];
  const snap = (line, msg, extra = {}) => steps.push({
    kind, line, msg, marks: {}, ...extra,
    items: a.map(x => (x ? { ...x } : null)),
    aux: st.aux.map(x => ({ ...x })),
    sorted: [...st.sorted],
    vars: { ...(extra.vars ?? {}), 'comparações': st.comps, 'movimentos': st.moves },
  });
  return { L, a, st, steps, snap };
}

export function mergeSteps(values) {
  const { L, a, st, steps, snap } = recorder('merge', values);
  const n = a.length;
  const rec = (ini, fim, depth) => {
    snap(L('void mergeSort'), `mergeSort(${ini}, ${fim}): ${fim - ini} elemento(s).`, { range: [ini, fim], depth, vars: { ini, fim } });
    if (fim - ini <= 1) { snap(L('if (fim - ini <= 1)'), 'Um elemento só: já está ordenado (caso base).', { range: [ini, fim], depth, vars: { ini, fim } }); return; }
    const meio = Math.floor((ini + fim) / 2);
    snap(L('int meio'), `Divide ao meio: [${ini}, ${meio}) e [${meio}, ${fim}).`, { range: [ini, fim], split: meio, depth, vars: { ini, meio, fim } });
    rec(ini, meio, depth + 1);
    rec(meio, fim, depth + 1);
    // intercala
    snap(L('intercala(v, ini, meio, fim)'), `As duas metades já estão ordenadas. Agora <b>intercala</b>.`, { range: [ini, fim], split: meio, depth, vars: { ini, meio, fim } });
    let i = ini, j = meio;
    st.aux = [];
    while (i < meio && j < fim) {
      st.comps++;
      const takeLeft = a[i].v <= a[j].v;
      snap(L('while (i < meio && j < fim)'), `Compara ${a[i].v} (esquerda) com ${a[j].v} (direita): o menor é <b>${takeLeft ? a[i].v : a[j].v}</b>.`, { range: [ini, fim], split: meio, depth, marks: { [i]: 'cmp', [j]: 'cmp' }, vars: { i, j } });
      const from = takeLeft ? i++ : j++;
      st.aux.push(a[from]); a[from] = null; st.moves++;
      snap(L('aux.push_back(v[i] <= v[j]'), 'Vai para o vetor auxiliar.', { range: [ini, fim], split: meio, depth, vars: { i, j } });
    }
    while (i < meio) { st.aux.push(a[i]); a[i] = null; i++; st.moves++; }
    while (j < fim) { st.aux.push(a[j]); a[j] = null; j++; st.moves++; }
    snap(L('while (i < meio) aux'), 'Uma das metades acabou: o resto da outra vai direto (já está em ordem).', { range: [ini, fim], split: meio, depth, vars: { i, j } });
    const aux = st.aux;
    for (let k = 0; k < aux.length; k++) { a[ini + k] = aux[k]; st.moves++; }
    st.aux = [];
    if (fim - ini === n) for (let k = 0; k < n; k++) st.sorted.add(k);
    snap(L('v[ini + k] = aux[k]'), `Copia de volta: v[${ini}..${fim}) está ordenado.`, { range: [ini, fim], depth, merged: [ini, fim], vars: { ini, fim } });
  };
  rec(0, n, 0);
  snap(null, `Pronto! ${st.comps} comparações. O merge sort faz sempre <b>O(n log n)</b>, mas precisa de <b>O(n) de memória extra</b> (o vetor auxiliar).`);
  return steps;
}

export function quickSteps(values) {
  const { L, a, st, steps, snap } = recorder('quick', values);
  const swap = (x, y) => { [a[x], a[y]] = [a[y], a[x]]; if (x !== y) st.moves++; };
  const rec = (ini, fim, depth) => {
    snap(L('void quickSort'), `quickSort(${ini}, ${fim}).`, { range: [ini, fim + 1], depth, vars: { ini, fim } });
    if (ini >= fim) {
      if (ini === fim) st.sorted.add(ini);
      snap(L('if (ini >= fim) return'), ini === fim ? `Um elemento só: v[${ini}] já está no lugar final.` : 'Intervalo vazio.', { depth, vars: { ini, fim } });
      return;
    }
    const pivo = a[fim].v;
    let i = ini - 1;
    snap(L('int pivo = v[fim]'), `Pivô = <b>${pivo}</b> (o último elemento). Vamos separar: menores ou iguais à esquerda, maiores à direita.`, { range: [ini, fim + 1], pivot: fim, depth, vars: { ini, fim, pivo, i } });
    for (let j = ini; j < fim; j++) {
      st.comps++;
      const le = a[j].v <= pivo;
      snap(L('if (v[j] <= pivo)'), `v[${j}] = ${a[j].v} ≤ ${pivo}? <b>${le ? 'Sim' : 'Não'}</b>.`, { range: [ini, fim + 1], pivot: fim, part: [ini, i, j], depth, marks: { [j]: 'cmp' }, vars: { pivo, i, j } });
      if (le) {
        i++;
        swap(i, j);
        snap(L('swap(v[++i], v[j])'), i === j ? `Já está na região dos menores (i = ${i}).` : `Troca com v[${i}]: a região dos ≤ ${pivo} cresce.`, { range: [ini, fim + 1], pivot: fim, part: [ini, i, j], depth, marks: { [i]: 'swap', [j]: 'swap' }, vars: { pivo, i, j } });
      }
    }
    swap(i + 1, fim);
    const p = i + 1;
    st.sorted.add(p);
    snap(L('swap(v[i + 1], v[fim])'), `O pivô ${pivo} vai para a posição ${p}: tudo à esquerda é ≤ e tudo à direita é &gt;. <b>Ele nunca mais sai daí.</b>`, { range: [ini, fim + 1], depth, marks: { [p]: 'key' }, vars: { pivo, p } });
    rec(ini, p - 1, depth + 1);
    rec(p + 1, fim, depth + 1);
  };
  rec(0, a.length - 1, 0);
  for (let k = 0; k < a.length; k++) st.sorted.add(k);
  snap(null, `Pronto! ${st.comps} comparações. O quicksort é O(n log n) em média e costuma ser o mais rápido na prática, mas o pior caso é O(n²): experimente um vetor já ordenado!`);
  return steps;
}

export function heapSteps(values) {
  const { L, a, st, steps, snap } = recorder('heap', values);
  const n = a.length;
  let heapSize = n;
  const swap = (x, y) => { [a[x], a[y]] = [a[y], a[x]]; st.moves++; };
  const desce = (i, size, phase) => {
    while (true) {
      const e = 2 * i + 1, d = 2 * i + 2;
      let maior = i;
      if (e < size) { st.comps++; if (a[e].v > a[maior].v) maior = e; }
      if (d < size) { st.comps++; if (a[d].v > a[maior].v) maior = d; }
      snap(L('int maior = i'), `Compara v[${i}] = ${a[i].v} com os filhos${e < size ? ` ${a[e].v}` : ''}${d < size ? ` e ${a[d].v}` : ''}.`, { heapSize: size, phase, marks: { [i]: 'key', ...(e < size ? { [e]: 'cmp' } : {}), ...(d < size ? { [d]: 'cmp' } : {}) }, vars: { i, e, d, maior } });
      if (maior === i) {
        snap(L('if (maior == i) return'), `${a[i].v} é maior que os filhos: a propriedade de heap vale aqui.`, { heapSize: size, phase, marks: { [i]: 'key' }, vars: { i } });
        return;
      }
      swap(i, maior);
      snap(L('swap(v[i], v[maior])'), `O filho ${a[i].v} é maior: troca e continua descendo.`, { heapSize: size, phase, marks: { [i]: 'swap', [maior]: 'swap' }, vars: { i, maior } });
      i = maior;
    }
  };
  snap(L('void heapSort'), 'Um <b>heap máximo</b> é uma árvore binária completa guardada no próprio vetor (filhos de i em 2i+1 e 2i+2) em que todo pai é ≥ seus filhos. Logo, o maior está sempre na raiz.', { heapSize: n, phase: 'build' });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    snap(L('desce(v, n, i)'), `Fase 1: conserta o heap a partir do nó ${i} (de baixo para cima; as folhas já são heaps).`, { heapSize: n, phase: 'build', marks: { [i]: 'key' }, vars: { i } });
    desce(i, n, 'build');
  }
  snap(L('for (int fim = n - 1'), `Heap construído em O(n): a raiz ${a[0].v} é o máximo.`, { heapSize: n, phase: 'sort' });
  for (let fim = n - 1; fim > 0; fim--) {
    swap(0, fim);
    st.sorted.add(fim);
    heapSize = fim;
    snap(L('swap(v[0], v[fim])'), `Fase 2: o máximo (${a[fim].v}) vai para a posição ${fim}, fora do heap. O heap encolhe.`, { heapSize, phase: 'sort', marks: { [0]: 'swap', [fim]: 'swap' }, vars: { fim } });
    desce(0, fim, 'sort');
  }
  for (let k = 0; k < n; k++) st.sorted.add(k);
  snap(null, `Pronto! ${st.comps} comparações. O heapsort é <b>O(n log n) no pior caso</b> e ordena <b>sem memória extra</b>, mas é menos amigável com a cache do que o quicksort.`, { heapSize: 0 });
  return steps;
}

export const GENERATORS = { merge: mergeSteps, quick: quickSteps, heap: heapSteps };
