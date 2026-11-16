// Snake como laboratório de busca: as regras do jogo (puras, sem DOM) e duas
// famílias de agentes.
//
//  • Determinísticos: a mesma partida produz sempre as mesmas decisões
//    (BFS, DFS, custo uniforme, gulosa, A* e variações, ciclo hamiltoniano).
//  • Não determinísticos: usam sorteios, então a mesma partida pode terminar
//    diferente (passeio aleatório, subida de encosta estocástica, têmpera
//    simulada, Monte Carlo, MCTS e algoritmo genético).
//
// Cada agente devolve, além da direção, o seu "pensamento" (células
// expandidas, fronteira, caminho planejado, simulações...) para a página desenhar.
// Espelha o projeto em Python de ../projetos/snake-algoritmos-de-busca/.

import { rng, normal } from '../../../engine/random.js';
export { rng };

// =====================================================================
// Regras do jogo
// =====================================================================

export const DIRS = [
  { dx: 0, dy: -1, nome: 'cima', seta: '↑' },
  { dx: 1, dy: 0, nome: 'direita', seta: '→' },
  { dx: 0, dy: 1, nome: 'baixo', seta: '↓' },
  { dx: -1, dy: 0, nome: 'esquerda', seta: '←' },
];
export const oposta = d => (d + 2) % 4;

export const TAMANHOS = {
  pequeno: { w: 12, h: 8, nome: '12 × 8' },
  medio: { w: 18, h: 12, nome: '18 × 12' },
  grande: { w: 24, h: 16, nome: '24 × 16' },
};

/** Estado inicial: cobra de 3 células no centro, virada para a direita. */
export function novoJogo({ w = 18, h = 12, comidas = 1, toroidal = false, semente = 1 } = {}) {
  const cx = w >> 1, cy = h >> 1, c = cy * w + cx;
  const j = {
    w, h, toroidal, corpo: [c, c - 1, c - 2], dir: 1, comidas: [],
    rngComida: rng(semente), passos: 0, fome: 0, comidos: 0,
    vivo: true, venceu: false, motivo: null, limiteFome: 2 * w * h, simulacao: false,
  };
  for (let i = 0; i < comidas; i++) sortearComida(j);
  return j;
}

/** Cópia para simulação: na simulação, comida comida não reaparece (o futuro é desconhecido). */
export const clonar = j => ({ ...j, corpo: j.corpo.slice(), comidas: j.comidas.slice(), simulacao: true });

function sortearComida(j) {
  const ocupado = new Uint8Array(j.w * j.h);
  for (const v of j.corpo) ocupado[v] = 1;
  for (const v of j.comidas) ocupado[v] = 1;
  const livres = [];
  for (let v = 0; v < ocupado.length; v++) if (!ocupado[v]) livres.push(v);
  if (livres.length) j.comidas.push(livres[Math.floor(j.rngComida() * livres.length)]);
}

/** Célula vizinha de v na direção d (−1 se sair da grade sem bordas toroidais). */
export function vizinho(j, v, d) {
  const { w, h } = j;
  let x = (v % w) + DIRS[d].dx, y = Math.floor(v / w) + DIRS[d].dy;
  if (j.toroidal) { x = (x + w) % w; y = (y + h) % h; }
  else if (x < 0 || y < 0 || x >= w || y >= h) return -1;
  return y * w + x;
}

/** Distância de Manhattan; no toro, "dando a volta" quando é mais curto. Admissível nos dois casos. */
export function distancia(j, a, b) {
  let dx = Math.abs((a % j.w) - (b % j.w)), dy = Math.abs(Math.floor(a / j.w) - Math.floor(b / j.w));
  if (j.toroidal) { dx = Math.min(dx, j.w - dx); dy = Math.min(dy, j.h - dy); }
  return dx + dy;
}
const distComida = (j, v) => j.comidas.reduce((m, c) => Math.min(m, distancia(j, v, c)), Infinity);

/** Avança um passo. Virar 180° é ignorado (a cobra segue em frente), como no jogo. */
export function passo(j, d) {
  if (!j.vivo) return j;
  if (d == null || d === oposta(j.dir)) d = j.dir;
  j.dir = d;
  j.passos++; j.fome++;
  const nv = vizinho(j, j.corpo[0], d);
  if (nv < 0) return morrer(j, 'parede');
  const k = j.comidas.indexOf(nv);
  // a cauda sai do lugar neste passo, a menos que a cobra coma (aí ela cresce)
  const limite = k >= 0 ? j.corpo.length : j.corpo.length - 1;
  const bate = j.corpo.indexOf(nv);
  if (bate >= 0 && bate < limite) return morrer(j, 'corpo');
  j.corpo.unshift(nv);
  if (k < 0) j.corpo.pop();
  else {
    j.comidos++; j.fome = 0;
    j.comidas.splice(k, 1);
    if (j.corpo.length === j.w * j.h) { j.vivo = false; j.venceu = true; j.motivo = 'venceu'; return j; }
    if (!j.simulacao) sortearComida(j);
  }
  if (j.fome > j.limiteFome) return morrer(j, 'fome');
  return j;
}
function morrer(j, motivo) { j.vivo = false; j.motivo = motivo; return j; }

/** idx[v] = posição de v no corpo (0 = cabeça), −1 se livre. */
export function indiceNoCorpo(j) {
  const idx = new Int32Array(j.w * j.h).fill(-1);
  j.corpo.forEach((v, i) => { if (idx[v] < 0) idx[v] = i; });
  return idx;
}

/**
 * A célula v estará livre quando a cabeça chegar lá no passo k?
 * O segmento i sai do lugar depois de L − i passos. O modelo simples ("corpo é
 * parede") só libera a cauda; o modelo ciente do tempo libera cada segmento na hora certa.
 */
export const livreEm = (idx, L, v, k, cienteTempo = false) =>
  idx[v] < 0 || (cienteTempo ? k >= L - idx[v] : idx[v] === L - 1);

/** Direções que não matam no próximo passo. */
export function seguros(j, idx = indiceNoCorpo(j)) {
  const out = [], L = j.corpo.length;
  for (let d = 0; d < 4; d++) {
    if (L > 1 && d === oposta(j.dir)) continue;
    const nv = vizinho(j, j.corpo[0], d);
    if (nv >= 0 && livreEm(idx, L, nv, 1)) out.push(d);
  }
  return out;
}

/** Inunda a partir da cabeça: quantas células livres ela alcança, e se alcança a cauda. */
export function areaLivre(j, idx = indiceNoCorpo(j)) {
  const L = j.corpo.length, n = j.w * j.h, visto = new Uint8Array(n);
  const pilha = [j.corpo[0]];
  visto[j.corpo[0]] = 1;
  let area = 0;
  while (pilha.length) {
    const v = pilha.pop();
    for (let d = 0; d < 4; d++) {
      const u = vizinho(j, v, d);
      if (u < 0 || visto[u] || !livreEm(idx, L, u, 1)) continue;
      visto[u] = 1; area++; pilha.push(u);
    }
  }
  return { area, cauda: L > 1 && !!visto[j.corpo[L - 1]] };
}

/**
 * A cabeça consegue "escapar"? Busca em largura ciente do tempo: chegar a uma célula
 * do corpo depois que aquele segmento saiu de lá significa seguir o rastro da cobra,
 * que nunca acaba (alcançar a cauda é o caso particular do último segmento).
 */
export function escapa(j, idx = indiceNoCorpo(j)) {
  const L = j.corpo.length, prof = new Int32Array(j.w * j.h).fill(-1);
  const fila = [j.corpo[0]];
  prof[j.corpo[0]] = 0;
  for (let i = 0; i < fila.length; i++) {
    const v = fila[i];
    for (let d = 0; d < 4; d++) {
      const u = vizinho(j, v, d);
      if (u < 0 || prof[u] >= 0) continue;
      const k = prof[v] + 1;
      if (idx[u] > 0) { if (k >= L - idx[u]) return true; continue; }
      if (idx[u] === 0) continue;
      prof[u] = k; fila.push(u);
    }
  }
  return false;
}

const dirPara = (j, de, para) => { for (let d = 0; d < 4; d++) if (vizinho(j, de, d) === para) return d; return null; };

// =====================================================================
// Busca genérica na grade (a cabeça é o estado inicial, as comidas, o objetivo)
// =====================================================================

class Heap {
  constructor(menor) { this.a = []; this.menor = menor; }
  get size() { return this.a.length; }
  push(x) {
    const a = this.a; a.push(x);
    for (let i = a.length - 1; i > 0;) { const p = (i - 1) >> 1; if (!this.menor(a[i], a[p])) break; [a[i], a[p]] = [a[p], a[i]]; i = p; }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && this.menor(a[l], a[m])) m = l;
        if (r < a.length && this.menor(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]]; i = m;
      }
    }
    return top;
  }
}

/**
 * tipo: 'bfs' (fila), 'dfs' (pilha), 'ucs' (menor g), 'gulosa' (menor h), 'astar' (menor g + h).
 * Teste de objetivo na remoção da fronteira, como no livro (garante otimalidade da UCS e do A*).
 * Devolve { caminho (sem a cabeça), expandidos (em ordem), fronteira, custo }.
 */
export function buscar(j, { tipo = 'astar', alvos = j.comidas, cienteTempo = false, custo = null, idx = indiceNoCorpo(j) } = {}) {
  const n = j.w * j.h, L = j.corpo.length, cabeca = j.corpo[0];
  const alvo = new Uint8Array(n);
  for (const a of alvos) alvo[a] = 1;
  const h = v => alvos.reduce((m, a) => Math.min(m, distancia(j, v, a)), Infinity);
  const g = new Float64Array(n).fill(Infinity), pai = new Int32Array(n).fill(-1), fechado = new Uint8Array(n);
  const expandidos = [];
  let seq = 0;
  // entrada da fronteira: [célula, pai, g, profundidade (passos), prioridade, desempate, ordem]
  const entrada = (v, p, gv, k) => {
    const hv = tipo === 'gulosa' || tipo === 'astar' ? h(v) : 0;
    const pr = tipo === 'ucs' ? gv : tipo === 'gulosa' ? hv : gv + hv;
    return [v, p, gv, k, pr, tipo === 'astar' ? hv : 0, seq++];
  };
  let fr;
  if (tipo === 'bfs' || tipo === 'dfs') fr = [];
  else fr = new Heap((a, b) => (a[4] - b[4] || a[5] - b[5] || a[6] - b[6]) < 0);
  let cabecaFila = 0;                                     // a BFS usa o array como fila
  const vazio = () => (fr instanceof Heap ? fr.size === 0 : tipo === 'bfs' ? cabecaFila >= fr.length : fr.length === 0);
  const tirar = () => (fr instanceof Heap ? fr.pop() : tipo === 'bfs' ? fr[cabecaFila++] : fr.pop());
  const visto = new Uint8Array(n);                        // BFS: não enfileira duas vezes
  fr.push(entrada(cabeca, -1, 0, 0)); visto[cabeca] = 1;
  let achou = -1;
  while (!vazio()) {
    const [v, p, gv, k] = tirar();
    if (fechado[v]) continue;
    fechado[v] = 1; pai[v] = p; g[v] = gv;
    expandidos.push(v);
    if (alvo[v] && v !== cabeca) { achou = v; break; }
    const filhos = [];
    for (let d = 0; d < 4; d++) {
      const u = vizinho(j, v, d);
      if (u < 0 || fechado[u] || !livreEm(idx, L, u, k + 1, cienteTempo)) continue;
      if (tipo === 'bfs') { if (visto[u]) continue; visto[u] = 1; }
      const gu = gv + (custo ? custo(u) : 1);
      if (fr instanceof Heap) { if (gu >= g[u]) continue; g[u] = gu; }
      filhos.push(entrada(u, v, gu, k + 1));
    }
    // DFS: empilha ao contrário para tentar primeiro ↑, depois →, ↓, ←
    if (tipo === 'dfs') filhos.reverse();
    for (const f of filhos) fr.push(f);
  }
  const resto = fr instanceof Heap ? fr.a : tipo === 'bfs' ? fr.slice(cabecaFila) : fr;
  const fronteira = [...new Set(resto.map(e => e[0]).filter(v => !fechado[v]))];
  if (achou < 0) return { caminho: null, expandidos, fronteira, custo: Infinity };
  const caminho = [];
  for (let v = achou; v !== cabeca; v = pai[v]) caminho.unshift(v);
  return { caminho, expandidos, fronteira, custo: g[achou] };
}

/** Custo de "risco": entrar numa célula colada em parede ou corpo custa mais. */
export function custoRisco(j, idx) {
  const L = j.corpo.length;
  return v => {
    let b = 0;
    for (let d = 0; d < 4; d++) { const u = vizinho(j, v, d); if (u < 0 || (idx[u] >= 0 && idx[u] < L - 1)) b++; }
    return 1 + 2 * b;
  };
}

/** Quando não há caminho: vai para o lado com mais espaço livre (adiar a morte). */
export function sobreviver(j) {
  let melhor = null;
  for (const d of seguros(j)) {
    const s = clonar(j); passo(s, d);
    if (!s.vivo && !s.venceu) continue;
    const { area } = areaLivre(s);
    if (!melhor || area > melhor.area) melhor = { dir: d, area };
  }
  return melhor ?? { dir: j.dir, area: 0 };
}

// =====================================================================
// Agentes determinísticos
// =====================================================================
// Todo agente é criado por criar(rng) e expõe decidir(jogo) → { dir, pensamento }.
// pensamento: { texto, nos, expandidos?, fronteira?, caminho?, fantasma?, cauda?,
//              rollouts?, candidatos?, temperatura?, ciclo? }

/** Planeja um caminho até a comida e o segue; replaneja quando o plano acaba ou fica inválido. */
function planejador(planejar, rotulo) {
  return () => {
    let plano = [], ultima = null;
    return {
      decidir(j) {
        const idx = indiceNoCorpo(j), L = j.corpo.length, cab = j.corpo[0];
        const valido = plano.length && dirPara(j, cab, plano[0]) != null && livreEm(idx, L, plano[0], 1)
          && j.comidas.includes(plano[plano.length - 1]);
        let nos = 0;
        if (!valido) { ultima = planejar(j, idx); plano = ultima.caminho ? ultima.caminho.slice() : []; nos = ultima.expandidos.length; }
        const base = { expandidos: ultima.expandidos, fronteira: ultima.fronteira, nos, replanejou: !valido };
        if (!plano.length) {
          const s = sobreviver(j);
          return { dir: s.dir, pensamento: { ...base, caminho: null, texto: `${rotulo}: não há caminho até a comida. Vou para o lado com mais espaço (${s.area} células).` } };
        }
        const prox = plano.shift();
        const texto = valido ? `${rotulo}: seguindo o plano (faltam ${plano.length + 1} passos).`
          : `${rotulo}: expandi ${nos} células e achei um caminho de ${plano.length + 1} passos.`;
        return { dir: dirPara(j, cab, prox), pensamento: { ...base, caminho: [prox, ...plano], texto } };
      },
    };
  };
}

/** A* com várias comidas: testa todas as ordens de visita (caixeiro viajante) com custos dados pelo A*. */
export function planoCaixeiro(j, idx) {
  if (j.comidas.length <= 1) return buscar(j, { tipo: 'astar', idx });
  const perms = a => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p])));
  const cabeca = j.corpo[0];
  const cache = new Map(), expandidos = [];
  const trecho = (de, para) => {
    const k = de + ',' + para;
    if (!cache.has(k)) {
      // trechos depois da 1ª comida: o corpo de agora como obstáculo (aproximação do projeto original)
      const s = de === cabeca ? j : { ...j, corpo: [de, ...j.corpo.slice(1)] };
      const r = buscar(s, { tipo: 'astar', alvos: [para], idx });
      expandidos.push(...r.expandidos);
      cache.set(k, r);
    }
    return cache.get(k);
  };
  let melhor = null;
  for (const ordem of perms(j.comidas)) {
    let total = 0, de = cabeca, primeiro = null;
    for (const c of ordem) {
      const r = trecho(de, c);
      if (!r.caminho) { total = Infinity; break; }
      if (!primeiro) primeiro = r;
      total += r.caminho.length; de = c;
    }
    if (total < (melhor?.total ?? Infinity)) melhor = { total, primeiro, ordem };
  }
  if (!melhor) return { caminho: null, expandidos, fronteira: [], custo: Infinity };
  return { ...melhor.primeiro, expandidos, ordem: melhor.ordem, total: melhor.total };
}

/** A* seguro: só vai à comida se, depois de comer, a cabeça ainda alcança a cauda. */
function aEstrelaSeguro() {
  return {
    decidir(j) {
      const idx = indiceNoCorpo(j);
      const r = buscar(j, { tipo: 'astar', idx });
      let nos = r.expandidos.length;
      if (r.caminho) {
        const s = clonar(j);
        for (const v of r.caminho) passo(s, dirPara(s, s.corpo[0], v));
        const ok = s.venceu || (s.vivo && escapa(s));
        if (ok) return { dir: dirPara(j, j.corpo[0], r.caminho[0]), pensamento: { ...r, nos, fantasma: s.corpo, texto: `A* seguro: o caminho de ${r.caminho.length} passos é seguro: depois de comer, o fantasma ainda tem rota de fuga (alcança o rastro do próprio corpo).` } };
      }
      // Plano B: entre os movimentos depois dos quais a cauda continua alcançável (a cauda
      // sempre sai do lugar, então quem a alcança não está preso), o que mais se aproxima da comida.
      let melhor = null;
      for (const d of seguros(j, idx)) {
        const s = clonar(j); passo(s, d);
        if (!s.vivo && !s.venceu) continue;
        const a = areaLivre(s);
        nos++;
        if (!escapa(s)) continue;
        const dist = distComida(j, s.corpo[0]);
        // com fome demais (laço seguro que nunca chega à comida), troca de critério: o maior espaço livre
        const chave = j.fome > j.w * j.h / 2 ? [-a.area, dist] : [dist, -a.area];
        if (!melhor || chave[0] < melhor.chave[0] || (chave[0] === melhor.chave[0] && chave[1] < melhor.chave[1])) melhor = { dir: d, chave, cabeca: s.corpo[0] };
      }
      if (melhor) {
        const L = j.corpo.length, cauda = [melhor.cabeca];
        const rc = buscar({ ...j, corpo: [melhor.cabeca, ...j.corpo.slice(0, L - 1)] }, { tipo: 'bfs', alvos: [j.corpo[L - 2]] });
        if (rc.caminho) cauda.push(...rc.caminho);
        return { dir: melhor.dir, pensamento: { expandidos: r.expandidos, fronteira: r.fronteira, caminho: r.caminho, perigo: true, cauda, nos, texto: r.caminho ? 'A* seguro: ir à comida agora me encurralaria (o fantasma ficaria sem rota de fuga). Dou um passo que mantém uma rota de fuga e me aproxima da comida.' : 'A* seguro: a comida está inalcançável agora; dou um passo que mantém uma rota de fuga.' } };
      }
      const s = sobreviver(j);
      return { dir: s.dir, pensamento: { expandidos: r.expandidos, nos, texto: 'A* seguro: nenhum movimento mantém rota de fuga; vou para o lado com mais espaço.' } };
    },
  };
}

/** Ciclo que passa por todas as células uma vez (existe se w ou h é par). */
export function cicloHamiltoniano(w, h) {
  const monta = (W, H, cel) => {
    const s = [];
    for (let x = 0; x < W; x++) s.push(cel(x, 0));
    for (let y = 1; y < H; y++) {
      if (y % 2) for (let x = W - 1; x >= 1; x--) s.push(cel(x, y));
      else for (let x = 1; x < W; x++) s.push(cel(x, y));
    }
    for (let y = H - 1; y >= 1; y--) s.push(cel(0, y));
    return s;
  };
  if (h % 2 === 0 && w >= 2) return monta(w, h, (x, y) => y * w + x);
  if (w % 2 === 0 && h >= 2) return monta(h, w, (x, y) => x * w + y);
  return null;
}

function hamiltoniano() {
  let suc = null, ciclo = null;
  return {
    decidir(j) {
      if (!suc) {
        ciclo = cicloHamiltoniano(j.w, j.h);
        if (!ciclo) { const s = sobreviver(j); return { dir: s.dir, pensamento: { nos: 0, texto: 'Grade com lados ímpares: não existe ciclo hamiltoniano.' } }; }
        const n = ciclo.length;
        suc = new Int32Array(j.w * j.h);
        ciclo.forEach((v, i) => { suc[v] = ciclo[(i + 1) % n]; });
        // percorre no sentido em que o próximo passo não é o pescoço
        if (j.corpo.length > 1 && suc[j.corpo[0]] === j.corpo[1]) { ciclo.reverse(); ciclo.forEach((v, i) => { suc[v] = ciclo[(i + 1) % n]; }); }
      }
      const caminho = [];
      for (let v = suc[j.corpo[0]]; caminho.length < ciclo.length; v = suc[v]) { caminho.push(v); if (j.comidas.includes(v)) break; }
      return { dir: dirPara(j, j.corpo[0], caminho[0]), pensamento: { caminho, ciclo, nos: 0, texto: `Ciclo hamiltoniano: nenhuma busca, só o próximo passo do ciclo. A comida está a ${caminho.length} passos por ele.` } };
    },
  };
}

// =====================================================================
// Agentes não determinísticos
// =====================================================================

const sortear = (r, a) => a[Math.floor(r() * a.length)];
const valorPos = (j, v) => -distComida(j, v);   // a "altitude" da busca local: quanto mais perto da comida, mais alto

function aleatorio(r) {
  return {
    decidir(j) {
      const ms = seguros(j);
      if (!ms.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      const d = sortear(r, ms);
      return { dir: d, pensamento: { nos: 0, candidatos: ms.map(m => ({ dir: m, valor: 1 / ms.length, rotulo: `p = ${(1 / ms.length).toFixed(2)}` })), escolhido: d, texto: `Passeio aleatório: sorteei ${DIRS[d].seta} entre ${ms.length} movimentos que não matam agora.` } };
    },
  };
}

function subidaEncosta(r) {
  return {
    decidir(j) {
      const ms = seguros(j);
      if (!ms.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      const atual = valorPos(j, j.corpo[0]);
      const cands = ms.map(d => ({ dir: d, valor: valorPos(j, vizinho(j, j.corpo[0], d)) }));
      const sobe = cands.filter(c => c.valor > atual);
      const d = sobe.length ? sortear(r, sobe).dir : sortear(r, cands).dir;
      for (const c of cands) c.rotulo = `h = ${-c.valor}`;
      return { dir: d, pensamento: { nos: 0, candidatos: cands, escolhido: d, texto: sobe.length
        ? `Subida de encosta: ${sobe.length} vizinho(s) chegam mais perto da comida; sorteei um deles.`
        : 'Subida de encosta: nenhum vizinho melhora (ótimo local). Dou um passo aleatório para sair dele.' } };
    },
  };
}

function temperaSimulada(r, { T0 = 1, alfa = 0.85 } = {}) {
  return {
    decidir(j) {
      const ms = seguros(j);
      if (!ms.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      const T = T0 * alfa ** j.fome;                  // esfria a cada passo sem comer; reaquece ao comer
      const atual = valorPos(j, j.corpo[0]);
      const cands = ms.map(d => { const delta = valorPos(j, vizinho(j, j.corpo[0], d)) - atual; return { dir: d, delta, p: delta > 0 ? 1 : Math.exp(delta / T) }; });
      const ordem = cands.slice().sort(() => r() - 0.5);
      let esc = null;
      for (const c of ordem) if (r() < c.p) { esc = c; break; }
      if (!esc) esc = cands.reduce((a, b) => (b.delta > a.delta ? b : a));
      for (const c of cands) { c.valor = c.p; c.rotulo = `Δ = ${c.delta > 0 ? '+' : ''}${c.delta}, aceita com p = ${c.p.toFixed(2)}`; }
      return { dir: esc.dir, pensamento: { nos: 0, candidatos: cands, escolhido: esc.dir, temperatura: T, texto: `Têmpera simulada (T = ${T.toFixed(2)}): sorteio um vizinho; se piora, aceito com probabilidade e^(Δ/T). ${esc.delta > 0 ? 'Aceitei uma melhora.' : 'Aceitei uma piora!'}` } };
    },
  };
}

/** Joga aleatoriamente (só movimentos que não matam já) por até `prof` passos. Recompensa: +1 por comida, −1 na morte, descontada. */
export function simular(s, r, prof, gama = 0.95, rastro = null) {
  let ret = 0, desc = 1;
  for (let t = 0; t < prof && s.vivo; t++) {
    const ms = seguros(s);
    if (!ms.length) { ret -= desc; s.vivo = false; break; }
    const antes = s.comidos;
    passo(s, sortear(r, ms));
    if (rastro) rastro.push(s.corpo[0]);
    if (s.comidos > antes) ret += desc;
    desc *= gama;
    if (!s.comidas.length) break;
  }
  if (s.vivo && s.comidas.length) ret += desc * 0.5 * (1 - distComida(s, s.corpo[0]) / (s.w + s.h));
  return ret;
}

function monteCarlo(r, { K = 20, prof = 30 } = {}) {
  return {
    decidir(j) {
      const ms = seguros(j);
      if (!ms.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      const cands = [], rollouts = [];
      let nos = 0;
      for (const d of ms) {
        let soma = 0;
        for (let k = 0; k < K; k++) {
          const s = clonar(j), antes = s.comidos;
          passo(s, d);
          const rastro = k < 6 ? [s.corpo[0]] : null;
          const v = (s.comidos > antes ? 1 : 0) + 0.95 * simular(s, r, prof, 0.95, rastro);
          nos += s.passos - j.passos;
          soma += v;
          if (rastro) rollouts.push({ dir: d, celulas: rastro });
        }
        cands.push({ dir: d, valor: soma / K, rotulo: `média ${(soma / K).toFixed(2)}` });
      }
      const best = cands.reduce((a, b) => (b.valor > a.valor ? b : a));
      return { dir: best.dir, pensamento: { nos, candidatos: cands, escolhido: best.dir, rollouts, texto: `Monte Carlo: para cada movimento, ${K} partidas aleatórias de ${prof} passos. ${DIRS[best.dir].seta} teve a melhor média.` } };
    },
  };
}

function mcts(r, { iteracoes = 250, prof = 20, c = 1.2, gama = 0.95 } = {}) {
  const novo = (s, recompensa) => ({ s, recompensa, filhos: new Map(), resta: s.vivo ? seguros(s) : [], N: 0, Q: 0 });
  return {
    decidir(j) {
      const raiz = novo(clonar(j), 0);
      if (!raiz.resta.length) return { dir: j.dir, pensamento: { nos: 0, texto: 'Sem saída.' } };
      let nos = 0;
      const iterar = no => {
        let G;
        if (no.resta.length) {                                   // expansão: um filho novo, sorteado
          const i = Math.floor(r() * no.resta.length), d = no.resta.splice(i, 1)[0];
          const s = clonar(no.s), antes = s.comidos;
          passo(s, d);
          const f = novo(s, s.comidos > antes ? 1 : s.vivo ? 0 : -1);
          if (!s.vivo || !s.comidas.length) { f.resta = []; f.terminal = true; }
          no.filhos.set(d, f);
          const sim = clonar(s);
          G = f.recompensa + (f.terminal ? 0 : gama * simular(sim, r, prof, gama));
          nos += sim.passos - no.s.passos;
          f.N++; f.Q += G;
        } else if (no.filhos.size) {                            // seleção pela UCB1
          let melhor = null, mv = -Infinity;
          for (const f of no.filhos.values()) {
            const u = f.Q / f.N + c * Math.sqrt(Math.log(no.N + 1) / f.N);
            if (u > mv) { mv = u; melhor = f; }
          }
          G = melhor.terminal ? melhor.recompensa : melhor.recompensa + gama * iterar(melhor);
          melhor.N++; melhor.Q += G;
        } else G = no.terminal ? 0 : -1;                         // beco sem saída
        return G;
      };
      for (let it = 0; it < iteracoes; it++) { const G = iterar(raiz); raiz.N++; raiz.Q += G; }
      const cands = [...raiz.filhos].map(([d, f]) => ({ dir: d, valor: f.N, rotulo: `${f.N} visitas, Q = ${(f.Q / f.N).toFixed(2)}` }));
      const best = cands.reduce((a, b) => (b.valor > a.valor ? b : a));
      // variação principal: o caminho mais visitado
      const pv = [];
      for (let no = raiz.filhos.get(best.dir); no && pv.length < 40;) {
        pv.push(no.s.corpo[0]);
        let m = null;
        for (const f of no.filhos.values()) if (!m || f.N > m.N) m = f;
        no = m;
      }
      let tam = 0; const conta = no => { tam++; for (const f of no.filhos.values()) conta(f); }; conta(raiz);
      return { dir: best.dir, pensamento: { nos, candidatos: cands, escolhido: best.dir, caminho: pv, texto: `MCTS: ${iteracoes} iterações (seleção pela UCB1, expansão, simulação aleatória, retropropagação) construíram uma árvore de ${tam} nós. Jogo o mais visitado: ${DIRS[best.dir].seta}.` } };
    },
  };
}

// --- algoritmo genético: evolui os pesos de uma função de avaliação ---

export const CARACTERISTICAS = ['morre', 'distância à comida', 'espaço livre', 'alcança a cauda', 'aperto'];

/** Características de um movimento, todas em [0, 1]. */
export function caracteristicas(j, d) {
  const nv = vizinho(j, j.corpo[0], d);
  const idx = indiceNoCorpo(j);
  if (d === oposta(j.dir) || nv < 0 || !livreEm(idx, j.corpo.length, nv, 1)) return [1, 0, 0, 0, 0];
  const dist = distComida(j, nv) / (j.w + j.h);
  const s = clonar(j); passo(s, d);
  if (s.venceu) return [0, 0, 1, 1, 0];
  const sidx = indiceNoCorpo(s), { area, cauda } = areaLivre(s, sidx);
  const livres = Math.max(1, s.w * s.h - s.corpo.length);
  let aperto = 0;
  for (let k = 0; k < 4; k++) { const u = vizinho(s, nv, k); if (u < 0 || !livreEm(sidx, s.corpo.length, u, 1)) aperto++; }
  return [0, Number.isFinite(dist) ? dist : 0, area / livres, cauda ? 1 : 0, aperto / 4];
}

/** Pesos encontrados por evoluir({ semente: 7 }) em 12 × 8 (veja o teste); servem para qualquer tamanho de grade. */
export const PESOS_CAMPEAO = [-2.26, -1.2, 0.92, 0.64, 0.16];

export function agenteGenetico(pesos) {
  return () => ({
    decidir(j) {
      const cands = [];
      for (let d = 0; d < 4; d++) {
        if (j.corpo.length > 1 && d === oposta(j.dir)) continue;
        const f = caracteristicas(j, d);
        const valor = f.reduce((s, x, i) => s + x * pesos[i], 0);
        cands.push({ dir: d, valor, rotulo: `nota ${valor.toFixed(2)}`, f });
      }
      const best = cands.reduce((a, b) => (b.valor > a.valor ? b : a));
      return { dir: best.dir, pensamento: { nos: cands.length, candidatos: cands, escolhido: best.dir, texto: `Genético: a nota de cada movimento é Σ peso × característica, com pesos evoluídos. ${DIRS[best.dir].seta} teve a maior nota. (Jogar é determinístico; o sorteio está no treino.)` } };
    },
  });
}

/** Joga uma partida inteira sem desenhar. */
export function jogarPartida(criar, { w = 18, h = 12, comidas = 1, toroidal = false, semente = 1, sementeAgente = 1, passosMax = 50000 } = {}) {
  const j = novoJogo({ w, h, comidas, toroidal, semente });
  const ag = criar(rng(sementeAgente));
  let nos = 0, decisoes = 0;
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  while (j.vivo && j.passos < passosMax) {
    const { dir, pensamento } = ag.decidir(j);
    nos += pensamento?.nos ?? 0; decisoes++;
    passo(j, dir);
  }
  const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
  return { comidos: j.comidos, passos: j.passos, motivo: j.vivo ? 'limite' : j.motivo, venceu: j.venceu, nos, decisoes, ms, corpo: j.corpo.slice() };
}

/** Algoritmo genético (gerador: uma geração por next()). Aptidão = 100 por comida + 0,05 por passo vivo. */
export function* evoluir({ pop = 24, geracoes = 15, jogos = 2, semente = 7, w = 12, h = 8, passosMax = 1500 } = {}) {
  const r = rng(semente), nf = CARACTERISTICAS.length;
  let popu = Array.from({ length: pop }, () => Array.from({ length: nf }, () => normal(r)));
  for (let ger = 1; ger <= geracoes; ger++) {
    const sementes = Array.from({ length: jogos }, (_, k) => 1000 * ger + k + 1);
    const apt = popu.map(p => {
      let s = 0;
      for (const sem of sementes) { const res = jogarPartida(agenteGenetico(p), { w, h, semente: sem, passosMax }); s += 100 * res.comidos + 0.05 * res.passos; }
      return s / jogos;
    });
    const ordem = apt.map((a, i) => i).sort((a, b) => apt[b] - apt[a]);
    yield { geracao: ger, melhor: apt[ordem[0]], media: apt.reduce((a, b) => a + b, 0) / pop, pesos: popu[ordem[0]].slice(), aptidoes: ordem.map(i => apt[i]) };
    const torneio = () => { let b = Math.floor(r() * pop); for (let k = 0; k < 2; k++) { const c = Math.floor(r() * pop); if (apt[c] > apt[b]) b = c; } return popu[b]; };
    const nova = [popu[ordem[0]].slice(), popu[ordem[1]].slice()];           // elitismo
    while (nova.length < pop) {
      const a = torneio(), b = torneio();
      nova.push(a.map((x, i) => (r() < 0.5 ? x : b[i]) + (r() < 0.3 ? 0.4 * normal(r) : 0)));   // cruzamento uniforme + mutação gaussiana
    }
    popu = nova;
  }
}

// =====================================================================
// Catálogo
// =====================================================================

const plan = (tipo, rotulo, extra = {}) => planejador((j, idx) => buscar(j, { tipo, idx, ...extra }), rotulo);

export const ALGORITMOS = {
  deterministicos: [
    { id: 'bfs', nome: 'Largura (BFS)', grupo: 'Busca cega', criar: plan('bfs', 'BFS'),
      ideia: 'Expande em ondas a partir da cabeça (fila). A primeira comida tirada da fila está no menor número de passos.',
      completo: 'sim', otimo: 'sim (custos iguais)', morte: 'Trata o corpo como parede fixa e só olha até a comida: come e fica sem saída.' },
    { id: 'dfs', nome: 'Profundidade (DFS)', grupo: 'Busca cega', criar: plan('dfs', 'DFS'),
      ideia: 'Mergulha sempre no primeiro vizinho (↑, →, ↓, ←) e só volta quando trava (pilha). Acha um caminho, raramente o curto.',
      completo: 'sim, em grade finita', otimo: 'não', morte: 'Caminhos enormes e sinuosos: a cobra se enrola em si mesma.' },
    { id: 'ucs', nome: 'Custo uniforme (com risco)', grupo: 'Busca cega', criar: planejador((j, idx) => buscar(j, { tipo: 'ucs', idx, custo: custoRisco(j, idx) }), 'Custo uniforme'),
      ideia: 'Expande o menor custo acumulado g. Aqui cada célula custa 1 + 2 por vizinho bloqueado: o caminho mais barato foge de paredes e do corpo.',
      completo: 'sim', otimo: 'sim, no custo de risco', morte: 'Vive mais que a BFS em espaços abertos, mas também não pensa no depois.' },
    { id: 'gulosa', nome: 'Gulosa (só h)', grupo: 'Busca informada', criar: plan('gulosa', 'Gulosa'),
      ideia: 'Expande quem parece mais perto da comida pela distância de Manhattan h, ignorando o custo até ali.',
      completo: 'sim, em grade finita', otimo: 'não', morte: 'Poucas expansões; contorna obstáculos com desvios longos.' },
    { id: 'astar', nome: 'A* (g + h)', grupo: 'Busca informada', criar: plan('astar', 'A*'),
      ideia: 'Expande o menor f = g + h. Com h admissível (Manhattan nunca superestima), acha o caminho mais curto expandindo menos que a BFS.',
      completo: 'sim', otimo: 'sim', morte: 'O mesmo da BFS: o caminho ótimo até a comida pode ser uma armadilha.' },
    { id: 'caixeiro', nome: 'A* + caixeiro viajante', grupo: 'A* adaptado à cobra', criar: planejador(planoCaixeiro, 'A* + caixeiro'),
      ideia: 'Com várias comidas, testa todas as ordens de visita (3! = 6 com três) e segue o 1º trecho da melhor. Ideia do projeto original. Com uma comida, é o A*.',
      completo: 'sim', otimo: 'na ordem de visita, aproximado nos trechos', morte: 'Mais eficiente com 3 comidas, mas tão míope quanto o A*.' },
    { id: 'astar-tempo', nome: 'A* ciente do tempo', grupo: 'A* adaptado à cobra', criar: plan('astar', 'A* ciente do tempo', { cienteTempo: true }),
      ideia: 'Um segmento a k posições da cauda sai do lugar em k passos. Se a cabeça chega depois disso, a célula não é obstáculo: acha caminhos que o A* comum julga bloqueados.',
      completo: 'sim', otimo: 'sim, no modelo com tempo', morte: 'Modelo melhor do presente, mas continua sem olhar para depois da comida.' },
    { id: 'astar-seguro', nome: 'A* seguro (com fantasma)', grupo: 'A* adaptado à cobra', criar: aEstrelaSeguro,
      ideia: 'Antes de ir, simula a cobra comendo (o fantasma). Se depois ela não tem rota de fuga (chegar ao rastro do próprio corpo, que vai se liberando), não vai: dá um passo seguro e tenta de novo.',
      completo: '—', otimo: 'não, prefere sobreviver', morte: 'Vive bem mais que o A*; às vezes fica girando em segurança até morrer de fome.' },
    { id: 'hamiltoniano', nome: 'Ciclo hamiltoniano', grupo: 'Sem busca', criar: hamiltoniano,
      ideia: 'Percorre sempre o mesmo ciclo que passa por todas as células. Não planeja nada e mesmo assim nunca morre: a cauda está sempre à frente.',
      completo: 'vence sempre', otimo: 'não, muito lento', morte: 'Não morre; leva até w·h passos por comida.' },
  ],
  nao_deterministicos: [
    { id: 'aleatorio', nome: 'Passeio aleatório', grupo: 'Linha de base', criar: aleatorio,
      ideia: 'Sorteia entre os movimentos que não matam no próximo passo. A referência mínima: tudo deve ser melhor que isto.',
      completo: 'não', otimo: 'não', morte: 'Morre de fome ou se fecha num beco.' },
    { id: 'subida', nome: 'Subida de encosta estocástica', grupo: 'Busca local', criar: subidaEncosta,
      ideia: 'Só olha os vizinhos: sorteia entre os que chegam mais perto da comida. Sem memória e sem plano.',
      completo: 'não', otimo: 'não', morte: 'Ótimos locais: a comida atrás de uma parede de corpo vira um beco.' },
    { id: 'tempera', nome: 'Têmpera simulada', grupo: 'Busca local', criar: temperaSimulada,
      ideia: 'Sorteia um vizinho; melhora é aceita, piora é aceita com probabilidade e^(Δ/T). A temperatura cai a cada passo sem comer: começa explorando e termina gulosa.',
      completo: 'não', otimo: 'não', morte: 'Aqui a aleatoriedade quase não ajuda: o perigo não é um ótimo local, é o próprio corpo. Compare com a subida de encosta na corrida.' },
    { id: 'montecarlo', nome: 'Monte Carlo', grupo: 'Simulação', criar: monteCarlo,
      ideia: 'Para cada movimento, joga 20 partidas aleatórias de 30 passos e fica com a melhor média. O futuro é estimado por amostragem.',
      completo: 'não', otimo: 'converge com mais amostras', morte: 'Evita becos que as simulações revelam; perde comida longe.' },
    { id: 'mcts', nome: 'MCTS (UCT)', grupo: 'Simulação', criar: mcts,
      ideia: 'Constrói uma árvore de jogadas guiada pela UCB1: explora o promissor sem esquecer o pouco testado. É o algoritmo por trás do AlphaGo.',
      completo: 'não', otimo: 'converge com mais iterações', morte: 'Mais cuidadoso que o Monte Carlo simples; caro por decisão.' },
    { id: 'genetico', nome: 'Algoritmo genético', grupo: 'Evolução', criar: agenteGenetico(PESOS_CAMPEAO),
      ideia: 'Uma população de pesos evolui por seleção, cruzamento e mutação. Cada movimento recebe uma nota (morre? distância? espaço livre? alcança a cauda?).',
      completo: 'não', otimo: 'não', morte: 'Depende da evolução: bons pesos aprendem a valorizar espaço livre.' },
  ],
};
export const TODOS = [...ALGORITMOS.deterministicos, ...ALGORITMOS.nao_deterministicos];
export const porId = id => TODOS.find(a => a.id === id);
