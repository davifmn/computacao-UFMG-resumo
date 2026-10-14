// Casamento de padrões: força bruta, Knuth-Morris-Pratt (com a função de falha)
// e Boyer-Moore-Horspool, contando cada comparação de caracteres.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  forca: `vector<int> forcaBruta(string t, string p) {
    int n = t.size(), m = p.size();
    vector<int> ocorr;
    for (int s = 0; s <= n - m; s++) {        // cada alinhamento possível
        int j = 0;
        while (j < m && t[s + j] == p[j]) j++;
        if (j == m) ocorr.push_back(s);       // casou o padrão inteiro
    }
    return ocorr;
}`,
  kmp: `vector<int> falha(string p) {
    int m = p.size();
    vector<int> f(m, 0);   // f[i] = maior borda própria de p[0..i]
    for (int i = 1, k = 0; i < m; i++) {
        while (k > 0 && p[i] != p[k]) k = f[k - 1];
        if (p[i] == p[k]) k++;
        f[i] = k;
    }
    return f;
}

vector<int> kmp(string t, string p) {
    vector<int> f = falha(p), ocorr;
    int m = p.size();
    for (int i = 0, q = 0; i < (int)t.size(); i++) {
        while (q > 0 && t[i] != p[q]) q = f[q - 1];  // desliza o padrão
        if (t[i] == p[q]) q++;
        if (q == m) { ocorr.push_back(i - m + 1); q = f[q - 1]; }
    }
    return ocorr;
}`,
  horspool: `vector<int> horspool(string t, string p) {
    int n = t.size(), m = p.size();
    vector<int> salto(256, m), ocorr;
    for (int j = 0; j < m - 1; j++)
        salto[(unsigned char)p[j]] = m - 1 - j;   // distância até o fim
    int s = 0;
    while (s <= n - m) {
        int j = m - 1;
        while (j >= 0 && p[j] == t[s + j]) j--;   // da direita para a esquerda
        if (j < 0) ocorr.push_back(s);
        s += salto[(unsigned char)t[s + m - 1]];  // último caractere da janela
    }
    return ocorr;
}`,
};

/** Função de falha (tabela de prefixos) do KMP. */
export function failure(p) {
  const f = Array(p.length).fill(0);
  for (let i = 1, k = 0; i < p.length; i++) {
    while (k > 0 && p[i] !== p[k]) k = f[k - 1];
    if (p[i] === p[k]) k++;
    f[i] = k;
  }
  return f;
}

/** Tabela de saltos de Horspool, só com os caracteres do padrão (os demais saltam m). */
export function shiftTable(p) {
  const m = p.length, t = {};
  for (let j = 0; j < m - 1; j++) t[p[j]] = m - 1 - j;
  return t;
}

export function naiveSteps(t, p) {
  const L = lineFinder(CODES.forca);
  const n = t.length, m = p.length, steps = [], found = [];
  let comps = 0;
  const snap = (line, msg, extra) => steps.push({ line, msg, t, p, found: [...found], comps, vars: { s: extra.s, j: extra.j ?? '—', comparações: comps }, ...extra });
  for (let s = 0; s <= n - m; s++) {
    let j = 0;
    snap(L('for (int s = 0'), `Alinha o padrão na posição <b>${s}</b> do texto.`, { s, j: null });
    while (j < m) {
      comps++;
      const eq = t[s + j] === p[j];
      snap(L('while (j < m'), eq ? `t[${s + j}] = p[${j}] = '${p[j]}': casa, avança j.` : `t[${s + j}] = '${t[s + j]}' ≠ p[${j}] = '${p[j]}': desiste deste alinhamento. Tudo o que já foi lido é <b>jogado fora</b>.`, { s, j, cmp: eq ? 'eq' : 'neq' });
      if (!eq) break;
      j++;
    }
    if (j === m) {
      found.push(s);
      snap(L('if (j == m)'), `Ocorrência na posição <b>${s}</b>.`, { s, j: null, hit: true });
    }
  }
  snap(L('return ocorr'), `Fim: ${found.length} ocorrência(s) com <b>${comps}</b> comparações. No pior caso (t = aaaa…a, p = aa…ab) a força bruta faz $(n - m + 1)\\,m$ comparações.`, { s: null, j: null, done: true });
  return steps;
}

export function kmpSteps(t, p) {
  const L = lineFinder(CODES.kmp);
  const n = t.length, m = p.length, steps = [], found = [];
  const f = Array(m).fill(null);
  let comps = 0;
  const snap = (line, msg, extra) => steps.push({ line, msg, t, p, found: [...found], comps, f: [...f], ...extra });

  // 1. Função de falha
  f[0] = 0;
  snap(L('vector<int> f(m, 0)'), `Primeiro, a <b>função de falha</b>: f[i] = tamanho da maior <b>borda</b> de p[0..i] (prefixo que também é sufixo, sem ser a string inteira). Ela diz para onde voltar no padrão quando um caractere não casa, sem nunca recuar no texto.`, { phase: 'falha', vars: { i: '—', k: 0 } });
  for (let i = 1, k = 0; i < m; i++) {
    while (k > 0 && p[i] !== p[k]) {
      snap(L('while (k > 0 && p[i] != p[k])'), `p[${i}] = '${p[i]}' ≠ p[${k}] = '${p[k]}': a borda de tamanho ${k} não se estende. Tenta a próxima borda menor, f[${k - 1}] = ${f[k - 1]}.`, { phase: 'falha', fi: i, fk: k, vars: { i, k } });
      k = f[k - 1];
    }
    if (p[i] === p[k]) k++;
    f[i] = k;
    snap(L('f[i] = k'), k ? `p[0..${k - 1}] = "${p.slice(0, k)}" é prefixo e sufixo de "${p.slice(0, i + 1)}": f[${i}] = <b>${k}</b>.` : `"${p.slice(0, i + 1)}" não tem borda: f[${i}] = <b>0</b>.`, { phase: 'falha', fi: i, fk: k, vars: { i, k } });
  }

  // 2. Busca
  for (let i = 0, q = 0; i < n; i++) {
    for (;;) {
      comps++;
      const eq = t[i] === p[q];
      if (!eq && q > 0) {
        snap(L('while (q > 0 && t[i] != p[q])'), `t[${i}] = '${t[i]}' ≠ p[${q}] = '${p[q]}'. Os ${q} caracteres anteriores casaram, e a maior borda deles tem tamanho f[${q - 1}] = <b>${f[q - 1]}</b>: o padrão desliza ${q - f[q - 1]} casas e o texto <b>não volta</b>.`, { phase: 'busca', s: i - q, j: q, cmp: 'neq', vars: { i, q, comparações: comps } });
        q = f[q - 1];
        continue;
      }
      if (eq) q++;
      snap(L('if (t[i] == p[q])'), eq ? `t[${i}] = p[${q - 1}] = '${t[i]}': casa (q = ${q}).` : `t[${i}] = '${t[i]}' ≠ p[0]: nenhum prefixo casa; avança no texto.`, { phase: 'busca', s: i - (eq ? q - 1 : 0), j: eq ? q - 1 : 0, cmp: eq ? 'eq' : 'neq', vars: { i, q, comparações: comps } });
      break;
    }
    if (q === m) {
      found.push(i - m + 1);
      snap(L('if (q == m)'), `Ocorrência na posição <b>${i - m + 1}</b>. Continua de q = f[${m - 1}] = ${f[m - 1]}, aproveitando a borda (ocorrências podem se sobrepor).`, { phase: 'busca', s: i - m + 1, j: null, hit: true, vars: { i, q: f[m - 1], comparações: comps } });
      q = f[q - 1];
    }
  }
  snap(L('return ocorr'), `Fim: ${found.length} ocorrência(s) com <b>${comps}</b> comparações. O índice i nunca volta, e cada recuo de q é pago por um avanço anterior: no máximo $2n$ comparações na busca, $O(n + m)$ no total.`, { phase: 'busca', s: null, done: true, vars: { comparações: comps } });
  return steps;
}

export function horspoolSteps(t, p) {
  const L = lineFinder(CODES.horspool);
  const n = t.length, m = p.length, steps = [], found = [];
  const table = shiftTable(p);
  let comps = 0;
  const snap = (line, msg, extra) => steps.push({ line, msg, t, p, found: [...found], comps, table, ...extra });
  snap(L('salto[(unsigned char)p[j]]'), `Tabela de saltos: para cada caractere c, quanto deslocar quando c é o <b>último caractere da janela</b>. É a distância da última ocorrência de c em p[0..m−2] até o fim; caracteres que não estão no padrão saltam m = ${m} inteiro.`, { s: 0, j: null, vars: { m } });
  let s = 0;
  while (s <= n - m) {
    let j = m - 1;
    snap(L('int j = m - 1'), `Janela t[${s}..${s + m - 1}]. Compara da <b>direita para a esquerda</b>.`, { s, j: null, vars: { s, j, comparações: comps } });
    while (j >= 0) {
      comps++;
      const eq = p[j] === t[s + j];
      snap(L('while (j >= 0 && p[j] == t[s + j])'), eq ? `p[${j}] = t[${s + j}] = '${p[j]}': casa.` : `p[${j}] = '${p[j]}' ≠ t[${s + j}] = '${t[s + j]}'.`, { s, j, cmp: eq ? 'eq' : 'neq', vars: { s, j, comparações: comps } });
      if (!eq) break;
      j--;
    }
    if (j < 0) {
      found.push(s);
      snap(L('if (j < 0)'), `Ocorrência na posição <b>${s}</b>.`, { s, j: null, hit: true, vars: { s, comparações: comps } });
    }
    const c = t[s + m - 1], d = table[c] ?? m;
    snap(L('s += salto'), `O último caractere da janela é '${c}', ${table[c] ? `que aparece no padrão a ${d} casa(s) do fim` : 'que <b>não aparece</b> no padrão (fora a última posição)'}: salta <b>${d}</b>.`, { s, j: null, last: s + m - 1, vars: { s: s + d, salto: d, comparações: comps } });
    s += d;
  }
  snap(L('return ocorr'), `Fim: ${found.length} ocorrência(s) com <b>${comps}</b> comparações. Com alfabeto grande e padrão longo, a maioria dos saltos é m: o Horspool lê só uma fração do texto (sublinear no caso médio), embora o pior caso seja $O(nm)$.`, { s: null, done: true, vars: { comparações: comps } });
  return steps;
}

/** Ocorrências de p em t (para conferir os três algoritmos). */
export function occurrences(t, p) {
  const r = [];
  for (let s = 0; s + p.length <= t.length; s++) if (t.slice(s, s + p.length) === p) r.push(s);
  return r;
}

export const comparisons = steps => steps.at(-1).comps;
