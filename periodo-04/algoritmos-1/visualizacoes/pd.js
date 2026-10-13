// Programação dinâmica: mochila 0/1, maior subsequência comum (LCS) e distância
// de edição, preenchendo a tabela célula a célula e reconstruindo a solução.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  mochila: `int mochila(vector<int>& p, vector<int>& v, int W) {
    int n = p.size();
    // T[i][c] = melhor valor com os itens 1..i e capacidade c
    vector<vector<int>> T(n + 1, vector<int>(W + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int c = 0; c <= W; c++) {
            T[i][c] = T[i - 1][c];                  // não leva o item i
            if (p[i - 1] <= c)                      // cabe?
                T[i][c] = max(T[i][c], T[i - 1][c - p[i - 1]] + v[i - 1]);
        }
    return T[n][W];
}`,
  lcs: `int lcs(string a, string b) {
    int n = a.size(), m = b.size();
    // T[i][j] = LCS entre a[0..i) e b[0..j)
    vector<vector<int>> T(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            if (a[i - 1] == b[j - 1])
                T[i][j] = T[i - 1][j - 1] + 1;           // casa: diagonal + 1
            else
                T[i][j] = max(T[i - 1][j], T[i][j - 1]); // descarta um dos dois
    return T[n][m];
}`,
  edicao: `int edicao(string a, string b) {
    int n = a.size(), m = b.size();
    // T[i][j] = operações para transformar a[0..i) em b[0..j)
    vector<vector<int>> T(n + 1, vector<int>(m + 1));
    for (int i = 0; i <= n; i++) T[i][0] = i;   // apaga tudo
    for (int j = 0; j <= m; j++) T[0][j] = j;   // insere tudo
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            T[i][j] = min({ T[i - 1][j] + 1,                         // remove a[i-1]
                            T[i][j - 1] + 1,                         // insere b[j-1]
                            T[i - 1][j - 1] + (a[i - 1] != b[j - 1]) // troca (ou mantém)
                          });
    return T[n][m];
}`,
};

const copy = T => T.map(r => [...r]);

/** Mochila 0/1. items = [{ nome, p (peso), v (valor) }]. */
export function knapsackSteps(items, W) {
  const L = lineFinder(CODES.mochila);
  const n = items.length;
  const T = Array.from({ length: n + 1 }, (_, i) => Array(W + 1).fill(i === 0 ? 0 : null));   // null = ainda não calculada
  const steps = [];
  const rows = ['∅', ...items.map(it => it.nome)], cols = [...Array(W + 1).keys()].map(String);
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, T: copy(T), rows, cols, ...extra });
  snap(L('vector<vector<int>> T'), `Tabela $T[i][c]$: o melhor valor usando só os i primeiros itens numa mochila de capacidade c. A linha ∅ (nenhum item) vale 0, e cada célula depende só da linha de cima.`);
  for (let i = 1; i <= n; i++) {
    const { p, v, nome } = items[i - 1];
    for (let c = 0; c <= W; c++) {
      const sem = T[i - 1][c];
      if (p <= c) {
        const com = T[i - 1][c - p] + v;
        T[i][c] = Math.max(sem, com);
        snap(L('T[i][c] = max'), `Item <b>${nome}</b> (peso ${p}, valor ${v}), capacidade ${c}: sem ele = ${sem}; com ele = T[${i - 1}][${c - p}] + ${v} = ${com}. Fica <b>${T[i][c]}</b>.`,
          { cell: [i, c], deps: [[i - 1, c], [i - 1, c - p]], vars: { i, c, sem, com, 'T[i][c]': T[i][c] } });
      } else {
        T[i][c] = sem;
        snap(L('T[i][c] = T[i - 1][c]'), `${nome} pesa ${p} > ${c}: não cabe. Copia de cima: ${sem}.`, { cell: [i, c], deps: [[i - 1, c]], vars: { i, c, sem, 'T[i][c]': T[i][c] } });
      }
    }
  }
  // reconstrução
  const chosen = [], path = [];
  let c = W;
  for (let i = n; i >= 1; i--) {
    path.push([i, c]);
    if (T[i][c] !== T[i - 1][c]) { chosen.unshift(i - 1); c -= items[i - 1].p; }
  }
  snap(L('return T[n][W]'), `Valor máximo: <b>${T[n][W]}</b>. Voltando pela tabela (onde o valor muda em relação à linha de cima, o item foi levado): ${chosen.map(k => items[k].nome).join(', ') || 'nada'}. Custo $O(nW)$, pseudo-polinomial.`,
    { path, chosen, vars: { resposta: T[n][W] }, done: true });
  return steps;
}

export function lcsSteps(a, b) {
  const L = lineFinder(CODES.lcs);
  const n = a.length, m = b.length;
  const T = Array.from({ length: n + 1 }, (_, i) => Array(m + 1).fill(null).map((_, j) => (i === 0 || j === 0 ? 0 : null)));
  const steps = [];
  const rows = ['', ...a], cols = ['', ...b];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, T: copy(T), rows, cols, ...extra });
  snap(L('vector<vector<int>> T'), `$T[i][j]$ = tamanho da maior subsequência comum entre os i primeiros caracteres de "${a}" e os j primeiros de "${b}". A linha e a coluna 0 (prefixo vazio) valem 0.`);
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    if (a[i - 1] === b[j - 1]) {
      T[i][j] = T[i - 1][j - 1] + 1;
      snap(L('T[i][j] = T[i - 1][j - 1] + 1'), `a[${i - 1}] = b[${j - 1}] = '<b>${a[i - 1]}</b>': essa letra entra na subsequência. Diagonal + 1 = ${T[i][j]}.`, { cell: [i, j], deps: [[i - 1, j - 1]], match: true, vars: { i, j, 'a[i-1]': a[i - 1], 'b[j-1]': b[j - 1], 'T[i][j]': T[i][j] } });
    } else {
      T[i][j] = Math.max(T[i - 1][j], T[i][j - 1]);
      snap(L('T[i][j] = max(T[i - 1][j]'), `'${a[i - 1]}' ≠ '${b[j - 1]}': uma das duas letras fica de fora. max(cima ${T[i - 1][j]}, esquerda ${T[i][j - 1]}) = ${T[i][j]}.`, { cell: [i, j], deps: [[i - 1, j], [i, j - 1]], vars: { i, j, 'a[i-1]': a[i - 1], 'b[j-1]': b[j - 1], 'T[i][j]': T[i][j] } });
    }
  }
  const path = [];
  let i = n, j = m, out = '';
  while (i > 0 && j > 0) {
    path.push([i, j]);
    if (a[i - 1] === b[j - 1]) { out = a[i - 1] + out; i--; j--; }
    else if (T[i - 1][j] >= T[i][j - 1]) i--;
    else j--;
  }
  snap(L('return T[n][m]'), `LCS tem tamanho <b>${T[n][m]}</b>: "<b>${out}</b>". Reconstrução: da célula final, suba pela diagonal quando as letras casam; senão vá para o vizinho de maior valor. Custo $O(nm)$. É o que o <code>diff</code> usa.`,
    { path, result: out, vars: { resposta: T[n][m], lcs: out }, done: true });
  return steps;
}

export function editSteps(a, b) {
  const L = lineFinder(CODES.edicao);
  const n = a.length, m = b.length;
  const T = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));
  const steps = [];
  const rows = ['', ...a], cols = ['', ...b];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, T: copy(T), rows, cols, ...extra });
  for (let i = 0; i <= n; i++) T[i][0] = i;
  snap(L('T[i][0] = i'), `Transformar os i primeiros caracteres de "${a}" na string vazia custa i remoções.`);
  for (let j = 0; j <= m; j++) T[0][j] = j;
  snap(L('T[0][j] = j'), `E transformar a string vazia nos j primeiros de "${b}" custa j inserções.`);
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const rem = T[i - 1][j] + 1, ins = T[i][j - 1] + 1, tro = T[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0);
    T[i][j] = Math.min(rem, ins, tro);
    const which = T[i][j] === tro ? (a[i - 1] === b[j - 1] ? `mantém '${a[i - 1]}' (diagonal, custo 0)` : `troca '${a[i - 1]}'→'${b[j - 1]}' (diagonal + 1)`) : T[i][j] === rem ? `remove '${a[i - 1]}' (cima + 1)` : `insere '${b[j - 1]}' (esquerda + 1)`;
    snap(L('T[i][j] = min'), `remove ${rem}, insere ${ins}, ${a[i - 1] === b[j - 1] ? 'mantém' : 'troca'} ${tro}. Melhor: <b>${T[i][j]}</b>, ${which}.`, { cell: [i, j], deps: [[i - 1, j], [i, j - 1], [i - 1, j - 1]], match: a[i - 1] === b[j - 1], vars: { i, j, remove: rem, insere: ins, troca: tro, 'T[i][j]': T[i][j] } });
  }
  const path = [[n, m]], ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && T[i][j] === T[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)) { if (a[i - 1] !== b[j - 1]) ops.unshift(`troca ${a[i - 1]}→${b[j - 1]}`); i--; j--; }
    else if (i > 0 && T[i][j] === T[i - 1][j] + 1) { ops.unshift(`remove ${a[i - 1]}`); i--; }
    else { ops.unshift(`insere ${b[j - 1]}`); j--; }
    path.push([i, j]);
  }
  snap(L('return T[n][m]'), `Distância de edição (Levenshtein) = <b>${T[n][m]}</b>: ${ops.join(', ') || 'as strings são iguais'}. É o que o corretor ortográfico usa para sugerir palavras próximas.`,
    { path, ops, vars: { resposta: T[n][m] }, done: true });
  return steps;
}

// ---------- Divisão e conquista: teorema mestre ----------

/**
 * T(n) = a·T(n/b) + n^c. Devolve o caso do teorema mestre, a resposta em Θ
 * e o custo de cada nível da árvore de recursão para um n concreto.
 */
export function master(a, b, c, n = 2 ** 10) {
  const crit = Math.log(a) / Math.log(b);         // log_b a
  const eps = 1e-9;
  let caso, theta;
  const fmtExp = x => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2).replace('.', '{,}'));
  const pow = e => (Math.abs(e) < eps ? '1' : Math.abs(e - 1) < eps ? 'n' : `n^{${fmtExp(e)}}`);
  if (c < crit - eps) { caso = 1; theta = pow(crit); }
  else if (Math.abs(c - crit) < eps) { caso = 2; theta = Math.abs(c) < eps ? '\\log n' : `${pow(c)} \\log n`; }
  else { caso = 3; theta = pow(c); }
  const depth = Math.floor(Math.log(n) / Math.log(b) + 1e-9);
  const levels = [];
  for (let k = 0; k <= depth; k++) {
    const nodes = a ** k, size = n / b ** k;
    levels.push({ k, nodes, size, cost: nodes * size ** c });
  }
  return { caso, theta, crit, levels, total: levels.reduce((s, l) => s + l.cost, 0) };
}
