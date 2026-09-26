// Tabelas hash: encadeamento separado × endereçamento aberto (sondagem linear).

import { lineFinder } from '../../../engine/highlight.js';

export const VAZIO = null;
export const REMOVIDO = '†';

export const CODES = {
  encadeamento: `// tabela: vetor de M listas
void insere(int k) {
    int i = k % M;                    // função de hash
    for (int x : tabela[i])
        if (x == k) return;           // já existe
    tabela[i].push_front(k);          // colisão? só cresce a lista
}

bool busca(int k) {
    int i = k % M;
    for (int x : tabela[i])           // percorre só a lista da posição i
        if (x == k) return true;
    return false;
}

void remove(int k) {
    int i = k % M;
    tabela[i].remove(k);
}`,
  linear: `// tabela: vetor de M posições (VAZIO, REMOVIDO ou uma chave)
void insere(int k) {
    int i = k % M;
    for (int t = 0; t < M; t++) {
        if (tabela[i] == VAZIO || tabela[i] == REMOVIDO) {
            tabela[i] = k;
            return;
        }
        if (tabela[i] == k) return;   // já existe
        i = (i + 1) % M;              // colisão: tenta a próxima
    }
    throw overflow_error("tabela cheia");
}

bool busca(int k) {
    int i = k % M;
    for (int t = 0; t < M && tabela[i] != VAZIO; t++) {
        if (tabela[i] == k) return true;   // REMOVIDO não para a busca!
        i = (i + 1) % M;
    }
    return false;
}

void remove(int k) {
    // busca como acima; ao achar: tabela[i] = REMOVIDO
}`,
};

export function emptyTable(M, strategy) {
  return { M, strategy, slots: strategy === 'encadeamento' ? Array.from({ length: M }, () => []) : Array(M).fill(VAZIO) };
}

const clone = T => ({ ...T, slots: T.strategy === 'encadeamento' ? T.slots.map(l => [...l]) : [...T.slots] });

export function count(T) {
  return T.strategy === 'encadeamento' ? T.slots.reduce((s, l) => s + l.length, 0) : T.slots.filter(x => x !== VAZIO && x !== REMOVIDO).length;
}

export function op(T0, kind, k) {
  const T = clone(T0);
  const L = lineFinder(CODES[T.strategy]);
  const steps = [];
  let probes = 0, result = null;
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, M: T.M, strategy: T.strategy, slots: T.strategy === 'encadeamento' ? T.slots.map(l => [...l]) : [...T.slots],
    k, h: k % T.M, ...extra, vars: { k, 'i': extra.i ?? k % T.M, 'sondagens': probes, 'fator de carga α': (count(T) / T.M).toFixed(2) },
  });
  const h = ((k % T.M) + T.M) % T.M;
  const fn = kind === 'insere' ? 'void insere' : kind === 'busca' ? 'bool busca' : 'void remove';
  const scan = kind === 'insere' ? 'void insere' : 'bool busca';   // a remoção começa com uma busca
  snap(L(fn), `<code>${kind}(${k})</code>.`);
  snap(L('int i = k % M', L(scan)), `Função de hash: ${k} mod ${T.M} = <b>${h}</b>. Vamos direto para a posição ${h}, sem percorrer a tabela.`, { i: h, hot: h });

  if (T.strategy === 'encadeamento') {
    const list = T.slots[h];
    for (let p = 0; p < list.length; p++) {
      probes++;
      const hit = list[p] === k;
      snap(L('if (x == k)', L(scan)), `Compara com ${list[p]} na lista da posição ${h}: ${hit ? '<b>é igual</b>' : 'diferente'}.`, { i: h, hot: h, chainHot: p });
      if (hit) {
        if (kind === 'insere') { snap(L('if (x == k) return;'), `${k} já existe.`, { i: h, hot: h }); result = false; }
        if (kind === 'busca') { snap(L('if (x == k) return true'), `<b>Encontrado</b> com ${probes} comparação(ões).`, { i: h, hot: h, chainHot: p, found: true }); result = true; }
        if (kind === 'remove') { list.splice(p, 1); snap(L('tabela[i].remove(k)'), `Removido da lista.`, { i: h, hot: h }); result = true; }
        return { steps, table: T, result, probes };
      }
    }
    if (kind === 'insere') {
      list.unshift(k);
      snap(L('tabela[i].push_front(k)'), list.length > 1 ? `<b>Colisão</b>: a posição ${h} já tinha ${list.length - 1} chave(s). No encadeamento, basta pôr ${k} no início da lista.` : `${k} entra na lista da posição ${h}.`, { i: h, hot: h, chainHot: 0 });
      result = true;
    } else {
      snap(kind === 'remove' ? L('tabela[i].remove(k)') : L('return false', L(scan)), `Fim da lista: ${k} não está na tabela.`, { i: h, hot: h });
      result = false;
    }
    return { steps, table: T, result, probes };
  }

  // Sondagem linear
  let i = h;
  for (let t = 0; t < T.M; t++) {
    probes++;
    const cur = T.slots[i];
    if (kind === 'insere') {
      if (cur === VAZIO || cur === REMOVIDO) {
        T.slots[i] = k;
        snap(L('tabela[i] = k;'), t === 0 ? `Posição ${i} ${cur === REMOVIDO ? 'marcada como removida' : 'vazia'}: ${k} entra aqui.` : `Depois de ${t} colisão(ões), ${k} entra na posição ${i}. Repare no <b>agrupamento</b>: as chaves formam blocos contíguos.`, { i, hot: i, probe: t });
        result = true;
        return { steps, table: T, result, probes };
      }
      if (cur === k) { snap(L('if (tabela[i] == k) return;'), `${k} já existe.`, { i, hot: i }); result = false; return { steps, table: T, result, probes }; }
      snap(L('i = (i + 1) % M', L(scan)), `Posição ${i} ocupada por ${cur}: <b>colisão</b>. Tenta a próxima.`, { i, hot: i, probe: t, collide: i });
    } else {
      if (cur === VAZIO) { snap(L('tabela[i] != VAZIO', L(scan)), `Posição ${i} vazia: se ${k} existisse, estaria aqui ou antes. <b>Não está</b> na tabela.`, { i, hot: i }); result = false; return { steps, table: T, result, probes }; }
      if (cur === k) {
        if (kind === 'busca') snap(L('if (tabela[i] == k) return true'), `<b>Encontrado</b> na posição ${i} após ${probes} sondagem(ns).`, { i, hot: i, found: true });
        else { T.slots[i] = REMOVIDO; snap(L('tabela[i] = REMOVIDO'), `Achou ${k} na posição ${i}. Não podemos simplesmente esvaziá-la: isso "quebraria" a busca de chaves que colidiram e foram para depois. Marcamos como <b>REMOVIDO</b> (${REMOVIDO}).`, { i, hot: i }); }
        result = true;
        return { steps, table: T, result, probes };
      }
      snap(L('i = (i + 1) % M', L(scan)), `Posição ${i} tem ${cur === REMOVIDO ? `${REMOVIDO} (removido): a busca <b>continua</b>` : `${cur} ≠ ${k}: continua`}.`, { i, hot: i, probe: t });
    }
    i = (i + 1) % T.M;
  }
  snap(null, kind === 'insere' ? '<b>Tabela cheia!</b>' : `Percorreu a tabela inteira: ${k} não está.`, { error: kind === 'insere' });
  return { steps, table: T, result: false, probes };
}
