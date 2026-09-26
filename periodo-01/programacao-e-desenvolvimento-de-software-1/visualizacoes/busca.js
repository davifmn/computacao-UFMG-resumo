// Passos da busca sequencial e da busca binária.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  sequencial: `int buscaSequencial(int v[], int n, int x) {
    for (int i = 0; i < n; i++) {
        if (v[i] == x)
            return i;          // achou!
    }
    return -1;                 // não está no vetor
}`,
  binaria: `int buscaBinaria(int v[], int n, int x) {
    int ini = 0, fim = n - 1;
    while (ini <= fim) {
        int meio = (ini + fim) / 2;
        if (v[meio] == x)
            return meio;       // achou!
        else if (v[meio] < x)
            ini = meio + 1;    // descarta a metade esquerda
        else
            fim = meio - 1;    // descarta a metade direita
    }
    return -1;                 // não está no vetor
}`,
};

export function sequencialSteps(v, x) {
  const L = lineFinder(CODES.sequencial);
  const steps = [];
  let comps = 0;
  const snap = (line, msg, s) => steps.push({ line, msg, v, x, comps, ...s, vars: { x, ...s.vars, 'comparações': comps } });
  snap(L('int buscaSequencial'), `Procurar <b>${x}</b> olhando um elemento de cada vez, da esquerda para a direita.`, { discarded: [], vars: {} });
  for (let i = 0; i < v.length; i++) {
    comps++;
    const disc = [...Array(i).keys()];
    if (v[i] === x) {
      snap(L('if (v[i] == x)'), `v[${i}] = ${v[i]} é igual a ${x}? <b>Sim!</b>`, { i, discarded: disc, vars: { i } });
      snap(L('return i;'), `Encontrado na posição <b>${i}</b> após ${comps} comparação(ões).`, { i, found: i, discarded: disc, vars: { i } });
      return steps;
    }
    snap(L('if (v[i] == x)'), `v[${i}] = ${v[i]} é igual a ${x}? Não.`, { i, discarded: disc, vars: { i } });
  }
  snap(L('return -1'), `Percorremos os ${v.length} elementos e ${x} não apareceu: retorna <b>−1</b>.`, { found: -1, discarded: [...v.keys()], vars: {} });
  return steps;
}

export function binariaSteps(v, x) {
  const L = lineFinder(CODES.binaria);
  const steps = [];
  let comps = 0;
  const range = (a, b) => [...v.keys()].filter(k => k < a || k > b);
  const snap = (line, msg, s) => steps.push({ line, msg, v, x, ...s, vars: { x, ...s.vars, 'comparações': comps } });
  let ini = 0, fim = v.length - 1;
  snap(L('int buscaBinaria'), `Procurar <b>${x}</b>. O vetor está <b>ordenado</b>, então podemos descartar metade a cada comparação.`, { discarded: [], vars: {} });
  snap(L('int ini = 0'), `O intervalo de busca começa sendo o vetor inteiro: [${ini}, ${fim}].`, { ini, fim, discarded: [], vars: { ini, fim } });
  while (true) {
    if (ini > fim) {
      snap(L('while (ini <= fim)'), `ini (${ini}) > fim (${fim}): o intervalo ficou vazio.`, { ini, fim, discarded: [...v.keys()], vars: { ini, fim } });
      snap(L('return -1'), `${x} não está no vetor. Foram só <b>${comps}</b> comparações (≈ log₂ ${v.length} = ${Math.log2(v.length).toFixed(1)}).`, { found: -1, discarded: [...v.keys()], vars: { ini, fim } });
      return steps;
    }
    snap(L('while (ini <= fim)'), `Intervalo [${ini}, ${fim}] com ${fim - ini + 1} elemento(s).`, { ini, fim, discarded: range(ini, fim), vars: { ini, fim } });
    const meio = Math.floor((ini + fim) / 2);
    snap(L('int meio'), `meio = (${ini} + ${fim}) / 2 = <b>${meio}</b> (divisão inteira).`, { ini, fim, meio, discarded: range(ini, fim), vars: { ini, fim, meio } });
    comps++;
    if (v[meio] === x) {
      snap(L('if (v[meio] == x)'), `v[${meio}] = ${v[meio]} == ${x}? <b>Sim!</b>`, { ini, fim, meio, discarded: range(ini, fim), vars: { ini, fim, meio } });
      snap(L('return meio'), `Encontrado na posição <b>${meio}</b> com ${comps} comparação(ões).`, { ini, fim, meio, found: meio, discarded: range(meio, meio), vars: { ini, fim, meio } });
      return steps;
    }
    if (v[meio] < x) {
      snap(L('else if (v[meio] < x)'), `v[${meio}] = ${v[meio]} < ${x}: o alvo, se existir, está à <b>direita</b>.`, { ini, fim, meio, discarded: range(ini, fim), vars: { ini, fim, meio } });
      const antigo = ini;
      ini = meio + 1;
      snap(L('ini = meio + 1'), `Descarta v[${antigo}..${meio}]: ini = ${ini}.`, { ini, fim, discarded: range(ini, fim), vars: { ini, fim, meio } });
    } else {
      snap(L('else if (v[meio] < x)'), `v[${meio}] = ${v[meio]} > ${x}: o alvo, se existir, está à <b>esquerda</b>.`, { ini, fim, meio, discarded: range(ini, fim), vars: { ini, fim, meio } });
      const antigo = fim;
      fim = meio - 1;
      snap(L('fim = meio - 1'), `Descarta v[${meio}..${antigo}]: fim = ${fim}.`, { ini, fim, discarded: range(ini, fim), vars: { ini, fim, meio } });
    }
  }
}
