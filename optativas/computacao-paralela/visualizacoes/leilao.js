// Algoritmo de leilão de Bertsekas para o problema da atribuição (maximizar o
// benefício total de n trabalhadores em n tarefas). Duas variantes, como no TP
// (optativas/computacao-paralela/trabalhos/leilao-paralelo):
//   Gauss-Seidel: um trabalhador livre por vez dá o lance (versão sequencial v0);
//   Jacobi: todos os livres dão lance ao mesmo tempo, com os preços do início da
//           rodada (é o que dá para paralelizar; base das versões v3 e v4).
// Funções puras, testadas em tests/computacao-paralela.test.js.

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  gs: `// Gauss-Seidel: um trabalhador livre por vez (v0_sequencial.cpp)
while (existe trabalhador livre) {
    int w = proximo_livre();
    // valor líquido de cada tarefa = benefício - preço
    int melhor = -1; double v1 = -INF, v2 = -INF;
    for (int t = 0; t < n; t++) {
        double v = c[w][t] - preco[t];
        if (v > v1) { v2 = v1; v1 = v; melhor = t; }
        else if (v > v2) v2 = v;
    }
    double lance = (v1 - v2) + eps;   // quanto w aceita pagar a mais
    preco[melhor] += lance;
    if (dono[melhor] != -1)
        tarefa[dono[melhor]] = -1;    // o antigo dono volta a ficar livre
    tarefa[w] = melhor;
    dono[melhor] = w;
}`,
  jacobi: `// Jacobi: todos os livres dão lance na mesma rodada (v4_busca_paralela.cpp)
while (existe trabalhador livre) {
    #pragma omp parallel for          // fase 1: busca em paralelo
    for (int w : livres)
        calcula melhor[w], v1[w], v2[w] com os preços atuais;
    vector<double> p0 = preco;        // preços do início da rodada
    for (int w : livres) {            // fase 2: resolve os lances
        int t = melhor[w];
        double oferta = p0[t] + (v1[w] - v2[w]) + eps;
        if (oferta <= preco[t]) continue;  // perdeu para um lance maior
        preco[t] = oferta;
        if (dono[t] != -1) tarefa[dono[t]] = -1;
        tarefa[w] = t;
        dono[t] = w;
    }
}`,
  soma: `// Versão original da v4: os incrementos se SOMAM
while (existe trabalhador livre) {
    #pragma omp parallel for          // fase 1: busca em paralelo
    for (int w : livres)
        calcula melhor[w], v1[w], v2[w] com os preços atuais;
    for (int w : livres) {            // fase 2: aplica na ordem
        int t = melhor[w];
        preco[t] += (v1[w] - v2[w]) + eps;  // soma ao preço JÁ aumentado
        if (dono[t] != -1) tarefa[dono[t]] = -1;
        tarefa[w] = t;
        dono[t] = w;
    }
}`,
};

/** Instância em que a versão original da v4 (lances somados) termina abaixo do ótimo. */
export const EXEMPLO = [[9, 3, 2, 3], [8, 6, 2, 7], [4, 4, 5, 2], [6, 8, 6, 9]];

export const beneficio = (c, tarefa) => tarefa.reduce((s, t, w) => s + (t >= 0 ? c[w][t] : 0), 0);

/** Ótimo por força bruta (n! atribuições; só para n pequeno). */
export function otimo(c) {
  const n = c.length, usada = Array(n).fill(false), atual = [];
  let melhor = { valor: -Infinity, tarefa: [] };
  (function rec(w, s) {
    if (w === n) { if (s > melhor.valor) melhor = { valor: s, tarefa: atual.slice() }; return; }
    for (let t = 0; t < n; t++) if (!usada[t]) { usada[t] = true; atual.push(t); rec(w + 1, s + c[w][t]); atual.pop(); usada[t] = false; }
  })(0, 0);
  return melhor;
}

function melhores(c, w, preco) {
  let melhor = -1, v1 = -Infinity, v2 = -Infinity;
  const liq = c[w].map((x, t) => x - preco[t]);
  liq.forEach((v, t) => { if (v > v1) { v2 = v1; v1 = v; melhor = t; } else if (v > v2) v2 = v; });
  return { melhor, v1, v2, liq };
}

const fmt = x => (Number.isInteger(x) ? String(x) : x.toFixed(2));

/** Gauss-Seidel: dois passos por lance (busca e atualização). */
export function passosGaussSeidel(c, eps) {
  const L = lineFinder(CODES.gs);
  const n = c.length, preco = Array(n).fill(0), tarefa = Array(n).fill(-1), dono = Array(n).fill(-1);
  const passos = [];
  const snap = (line, msg, extra = {}) => passos.push({ line, msg, preco: preco.slice(), tarefa: tarefa.slice(), dono: dono.slice(), ...extra,
    vars: { eps: fmt(eps), 'benefício': beneficio(c, tarefa), livres: tarefa.filter(t => t < 0).length, ...(extra.vars ?? {}) } });
  snap(L('while (existe trabalhador livre)'), `Todos os preços começam em 0 e ninguém tem tarefa. Cada trabalhador quer a tarefa de maior <b>valor líquido</b> (benefício − preço). Quando duas pessoas querem a mesma coisa, o preço sobe.`);
  for (let rodadas = 0; rodadas < 500; rodadas++) {
    const w = tarefa.indexOf(-1);
    if (w < 0) break;
    const { melhor, v1, v2, liq } = melhores(c, w, preco);
    const lance = v1 - v2 + eps;
    snap(L('double v = c[w][t] - preco[t]'), `Trabalhador <b>${w}</b> está livre. Valores líquidos: ${liq.map((v, t) => `${t}: ${fmt(v)}`).join(', ')}. Melhor: tarefa ${melhor} (${fmt(v1)}); segunda melhor vale ${fmt(v2)}.`, { w, liq, melhor, vars: { w, melhor, v1: fmt(v1), v2: fmt(v2) } });
    const ant = dono[melhor];
    preco[melhor] += lance;
    if (ant >= 0) tarefa[ant] = -1;
    tarefa[w] = melhor; dono[melhor] = w;
    snap(L('preco[melhor] += lance'), `Lance = (${fmt(v1)} − ${fmt(v2)}) + ε = <b>${fmt(lance)}</b>: é o máximo que ${w} pode pagar a mais e ainda achar a tarefa ${melhor} pelo menos tão boa quanto a segunda opção. Preço da tarefa ${melhor} vai a ${fmt(preco[melhor])}.${ant >= 0 ? ` O trabalhador ${ant} perde a tarefa e volta para a fila.` : ''}`,
      { w, melhor, lance, expulso: ant, vars: { w, lance: fmt(lance) } });
  }
  const o = otimo(c);
  snap(L('dono[melhor] = w'), `Todos atribuídos. Benefício total = <b>${beneficio(c, tarefa)}</b>; ótimo (força bruta) = ${o.valor}. Com benefícios inteiros e ε < 1/n, o leilão sempre termina no ótimo.`, { fim: true, otimo: o });
  return passos;
}

/** Jacobi: um passo de busca e um de resolução por rodada. `soma = true` reproduz o bug da v4 original. */
export function passosJacobi(c, eps, { soma = false } = {}) {
  const codigo = soma ? CODES.soma : CODES.jacobi;
  const L = lineFinder(codigo);
  const n = c.length, preco = Array(n).fill(0), tarefa = Array(n).fill(-1), dono = Array(n).fill(-1);
  const passos = [];
  const snap = (line, msg, extra = {}) => passos.push({ line, msg, preco: preco.slice(), tarefa: tarefa.slice(), dono: dono.slice(), ...extra,
    vars: { eps: fmt(eps), 'benefício': beneficio(c, tarefa), livres: tarefa.filter(t => t < 0).length, ...(extra.vars ?? {}) } });
  snap(L('while (existe trabalhador livre)'), `Na versão de Jacobi, <b>todos</b> os trabalhadores livres calculam o lance ao mesmo tempo, olhando os mesmos preços. Isso é paralelizável; o cuidado está em resolver as disputas.`);
  for (let rodada = 1; rodada <= 200; rodada++) {
    const livres = [...Array(n).keys()].filter(w => tarefa[w] < 0);
    if (!livres.length) break;
    const lances = livres.map(w => { const m = melhores(c, w, preco); return { w, t: m.melhor, lance: m.v1 - m.v2 + eps }; });
    snap(L('calcula melhor[w]'), `Rodada ${rodada}: ${livres.length} livre(s) buscam em paralelo. Lances: ${lances.map(b => `${b.w} → tarefa ${b.t} (+${fmt(b.lance)})`).join('; ')}.`, { lances, vars: { rodada } });
    const p0 = preco.slice();
    const log = [];
    for (const { w, t, lance } of lances) {
      if (soma) {
        preco[t] += lance;
      } else {
        const oferta = p0[t] + lance;
        if (oferta <= preco[t]) { log.push(`${w} perde a tarefa ${t} (ofereceu ${fmt(oferta)} ≤ ${fmt(preco[t])})`); continue; }
        preco[t] = oferta;
      }
      if (dono[t] >= 0) tarefa[dono[t]] = -1;
      log.push(`${w} leva a tarefa ${t} por ${fmt(preco[t])}${dono[t] >= 0 && dono[t] !== w ? ` (tira de ${dono[t]})` : ''}`);
      tarefa[w] = t; dono[t] = w;
    }
    snap(soma ? L('preco[t] += (v1[w] - v2[w]) + eps') : L('if (oferta <= preco[t]) continue'), `Resolução: ${log.join('; ')}.${soma && new Set(lances.map(b => b.t)).size < lances.length ? ' <b>Atenção:</b> dois lances na mesma tarefa somaram os dois incrementos; o vencedor paga mais do que ofereceu.' : ''}`, { lances, vars: { rodada } });
  }
  const o = otimo(c), b = beneficio(c, tarefa);
  snap(L('dono[t] = w'), `Fim. Benefício = <b>${b}</b>; ótimo = ${o.valor}. ${b === o.valor ? 'Chegou ao ótimo.' : `<b>Ficou ${o.valor - b} abaixo do ótimo.</b> Ao somar os lances, o preço pago passou do que o trabalhador achava justo, e a condição de ε-folga complementar (cada um com uma tarefa no máximo ε pior que a melhor) deixou de valer.`}`, { fim: true, otimo: o });
  return passos;
}
