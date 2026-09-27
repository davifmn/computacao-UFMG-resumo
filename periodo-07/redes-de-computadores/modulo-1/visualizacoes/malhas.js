// Malhas de comutação (switching fabrics): roteamento em redes de múltiplos
// estágios (Omega/Banyan), bloqueio na cabeça da fila (HOL), redes de Clos e
// comutação temporal (TSI). Funções puras, testadas em tests/redes-modulo-1.test.js.

/** Embaralhamento perfeito de n bits: rotação à esquerda (0bABC → 0bBCA). */
export const shuffle = (pos, n) => ((pos << 1) | (pos >> (n - 1))) & ((1 << n) - 1);

/**
 * Rede Omega N×N (N = 2^n): n estágios de N/2 comutadores 2×2, cada um precedido de
 * um embaralhamento perfeito. Autorroteamento: no estágio i, o bit i do destino
 * (do mais significativo) escolhe a saída de cima (0) ou de baixo (1).
 * Devolve a posição (fio) ocupada na saída de cada estágio e o comutador usado.
 */
export function omegaRoute(src, dst, n) {
  const hops = [];
  let pos = src;
  for (let i = 0; i < n; i++) {
    pos = shuffle(pos, n);
    const bit = (dst >> (n - 1 - i)) & 1;
    const sw = pos >> 1;
    pos = (pos & ~1) | bit;
    hops.push({ stage: i, sw, out: pos, bit });
  }
  return hops;                       // hops[n-1].out === dst
}

/**
 * Roteia vários pacotes ao mesmo tempo. Dois pacotes que precisam do mesmo fio de
 * saída num estágio colidem (bloqueio interno, ou disputa pela porta de saída no
 * último estágio): o de menor entrada passa e o outro é bloqueado ali.
 */
export function omegaRouteAll(pairs, n) {
  const routes = pairs.map(([s, d]) => ({ src: s, dst: d, hops: omegaRoute(s, d, n), blockedAt: null }));
  for (let i = 0; i < n; i++) {
    const used = new Map();
    for (const r of routes) {
      if (r.blockedAt != null) continue;
      const w = r.hops[i].out;
      if (used.has(w)) r.blockedAt = i;
      else used.set(w, r);
    }
  }
  return routes;
}

/** Ordena pelo destino (rede de Batcher) antes da Banyan: evita o bloqueio interno em permutações. */
export function batcherThenBanyan(pairs, n) {
  const sorted = [...pairs].sort((a, b) => a[1] - b[1]).map(([, d], i) => [i, d]);
  return omegaRouteAll(sorted, n);
}

/**
 * Comutador com filas na entrada, saturado (sempre há pacote para enviar), destinos
 * uniformes. Em cada slot, cada saída atende um dos pacotes de cabeça de fila que a
 * disputam; os demais esperam, e o pacote de trás fica preso atrás deles (HOL).
 * Devolve a vazão por porta (tende a 2 − √2 ≈ 0,586 quando N cresce).
 */
export function holThroughput(r, N, slots) {
  const head = Array.from({ length: N }, () => Math.floor(r() * N));
  let served = 0;
  for (let t = 0; t < slots; t++) {
    const want = Array.from({ length: N }, () => []);
    head.forEach((d, i) => want[d].push(i));
    for (const list of want) {
      if (!list.length) continue;
      const winner = list[Math.floor(r() * list.length)];
      head[winner] = Math.floor(r() * N);
      served++;
    }
  }
  return served / (N * slots);
}

/** Vazão de saturação com HOL (Karol, Hluchyj e Morgan, 1987). */
export const HOL_TABLE = { 1: 1, 2: 0.75, 3: 0.6825, 4: 0.6553, 5: 0.6399, 6: 0.6302, 7: 0.6234, 8: 0.6184, Infinity: 2 - Math.SQRT2 };

/** Pontos de cruzamento: barra cruzada N² × Clos de 3 estágios (k = N/n comutadores n×m na entrada). */
export const crossbarPoints = N => N * N;
export function closPoints(N, n, m) {
  const k = N / n;
  return 2 * k * n * m + m * k * k;
}
/** Clos estritamente sem bloqueio: m ≥ 2n − 1; rearranjável: m ≥ n. */
export const closNonBlocking = (n, m) => m >= 2 * n - 1;

/**
 * TSI (Time Slot Interchanger): o quadro TDM de entrada é escrito na memória em
 * ordem e lido na ordem da permutação. perm[j] = de qual slot de entrada vem o slot j de saída.
 */
export function tsi(frame, perm) {
  const mem = [...frame];                       // escrita sequencial
  return perm.map(j => mem[j]);                 // leitura permutada
}

/** Limite de memória compartilhada: cada pacote é escrito e lido uma vez → 2 acessos. */
export const sharedMemoryMaxRate = accessesPerSecond => accessesPerSecond / 2;
