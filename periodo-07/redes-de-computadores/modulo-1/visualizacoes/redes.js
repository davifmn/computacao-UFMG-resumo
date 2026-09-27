// Redes de Computadores — Módulo 1 (Tanenbaum, cap. 1 a 4).
// Funções puras usadas pelas visualizações e testadas em tests/redes-modulo-1.test.js.

// ======================================================================
// Capítulo 2 — Camada física
// ======================================================================

/**
 * Série de Fourier de um sinal binário periódico (período = 1, bits de igual duração),
 * na forma do livro: g(t) = c/2 + Σ aₙ sen(2πnt) + Σ bₙ cos(2πnt).
 */
export function fourier(bits, H) {
  const N = bits.length;
  let c = 0;
  const a = [0], b = [0];
  bits.forEach(v => { c += 2 * v / N; });
  for (let n = 1; n <= H; n++) {
    let an = 0, bn = 0;
    bits.forEach((v, k) => {
      if (!v) return;
      const t0 = k / N, t1 = (k + 1) / N;
      an += (v / (Math.PI * n)) * (Math.cos(2 * Math.PI * n * t0) - Math.cos(2 * Math.PI * n * t1));
      bn += (v / (Math.PI * n)) * (Math.sin(2 * Math.PI * n * t1) - Math.sin(2 * Math.PI * n * t0));
    });
    a.push(an); b.push(bn);
  }
  const at = t => { let s = c / 2; for (let n = 1; n <= H; n++) s += a[n] * Math.sin(2 * Math.PI * n * t) + b[n] * Math.cos(2 * Math.PI * n * t); return s; };
  const rms = Array.from({ length: H + 1 }, (_, n) => (n === 0 ? 0 : Math.hypot(a[n], b[n])));
  return { c, a, b, at, rms };
}

/** Teorema de Nyquist (canal sem ruído): taxa máxima = 2B log₂V bps. */
export const nyquist = (B, V) => 2 * B * Math.log2(V);
/** Teorema de Shannon (canal com ruído): taxa máxima = B log₂(1 + S/N) bps. */
export const shannon = (B, snrDb) => B * Math.log2(1 + 10 ** (snrDb / 10));
export const dbToRatio = db => 10 ** (db / 10);
export const ratioToDb = r => 10 * Math.log10(r);

export const FOUR_B_FIVE_B = {
  '0000': '11110', '0001': '01001', '0010': '10100', '0011': '10101', '0100': '01010', '0101': '01011', '0110': '01110', '0111': '01111',
  '1000': '10010', '1001': '10011', '1010': '10110', '1011': '10111', '1100': '11010', '1101': '11011', '1110': '11100', '1111': '11101',
};

/**
 * Códigos de linha: devolve os níveis em meios-períodos de bit (2 por bit),
 * para desenhar a forma de onda. Níveis: +1, 0 ou −1.
 */
export function lineCode(bits, code) {
  const out = [];
  if (code === 'nrz') bits.forEach(b => out.push(b ? 1 : -1, b ? 1 : -1));
  if (code === 'nrzi') { let lv = -1; bits.forEach(b => { if (b) lv = -lv; out.push(lv, lv); }); }
  if (code === 'manchester') bits.forEach(b => out.push(...(b ? [1, -1] : [-1, 1])));   // convenção do livro (Fig. 2-20): 0 = baixo→alto, 1 = alto→baixo (o IEEE 802.3 usa a oposta)
  if (code === 'ami') { let last = -1; bits.forEach(b => { if (b) { last = -last; out.push(last, last); } else out.push(0, 0); }); }
  if (code === 'mlt3') { const cyc = [0, 1, 0, -1]; let i = 0; bits.forEach(b => { if (b) i = (i + 1) % 4; out.push(cyc[i], cyc[i]); }); }
  return out;
}

/** 4B/5B: cada grupo de 4 bits vira 5 (garante transições), depois NRZI. */
export function encode4b5b(bits) {
  const s = bits.join('').padEnd(Math.ceil(bits.length / 4) * 4, '0');
  let out = '';
  for (let i = 0; i < s.length; i += 4) out += FOUR_B_FIVE_B[s.slice(i, i + 4)];
  return out.split('').map(Number);
}

/** Constelações: QPSK, QAM-16 e QAM-64 (pontos em grade, com código de Gray). */
export function constellation(kind) {
  const gray = n => n ^ (n >> 1);
  if (kind === 'bpsk') return [{ x: -1, y: 0, bits: '0' }, { x: 1, y: 0, bits: '1' }];
  const side = { qpsk: 2, qam16: 4, qam64: 8 }[kind];
  const k = Math.log2(side);
  const pts = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) {
    const x = 2 * i - (side - 1), y = 2 * j - (side - 1);
    pts.push({ x, y, bits: gray(i).toString(2).padStart(k, '0') + gray(j).toString(2).padStart(k, '0') });
  }
  return pts;
}

/** Sequências de chips do livro (Fig. 2-28). */
export const CHIPS = {
  A: [-1, -1, -1, 1, 1, -1, 1, 1],
  B: [-1, -1, 1, -1, 1, 1, 1, -1],
  C: [-1, 1, -1, 1, 1, 1, -1, -1],
  D: [-1, 1, -1, -1, -1, -1, 1, -1],
};
export const dot = (s, t) => s.reduce((acc, v, i) => acc + v * t[i], 0) / s.length;

/** CDMA: cada estação envia 1 (chips), 0 (−chips) ou fica em silêncio (null). */
export function cdmaCombine(sends, chips = CHIPS) {
  const m = Object.values(chips)[0].length;
  const sum = Array(m).fill(0);
  for (const [st, bit] of Object.entries(sends)) {
    if (bit == null) continue;
    chips[st].forEach((c, i) => { sum[i] += bit ? c : -c; });
  }
  return sum;
}
/** Decodifica: produto interno normalizado = +1 (bit 1), −1 (bit 0) ou 0 (silêncio). */
export const cdmaDecode = (signal, chips = CHIPS) => Object.fromEntries(Object.entries(chips).map(([st, c]) => [st, dot(signal, c)]));

/**
 * Comutação de circuitos × pacotes (problema 2.38): x bits, k saltos, setup s,
 * propagação d por salto, pacotes de p bits, taxa b.
 */
export function switchingDelay({ x, k, s, d, p, b, h = 0 }) {
  const circuit = s + x / b + k * d;
  const n = Math.ceil(x / p);
  const packet = (n * (p + h)) / b + (k - 1) * ((p + h) / b) + k * d;   // pipeline: o último pacote ainda atravessa k−1 saltos
  return { circuit, packet, packets: n };
}

// ======================================================================
// Capítulo 3 — Camada de enlace
// ======================================================================

/** Enquadramento por contagem de caracteres (o 1º byte diz o tamanho do quadro). */
export const byteCount = frames => frames.flatMap(f => [f.length + 1, ...f]);

/** Inserção de bytes: ESC antes de cada FLAG ou ESC no conteúdo; FLAG no início e no fim. */
export function byteStuff(tokens) {
  const out = ['FLAG'];
  const inserted = [];
  for (const t of tokens) {
    if (t === 'FLAG' || t === 'ESC') { inserted.push(out.length); out.push('ESC'); }
    out.push(t);
  }
  out.push('FLAG');
  return { out, inserted };
}

export function byteUnstuff(stuffed) {
  const body = stuffed.slice(1, -1), out = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i] === 'ESC') i++;
    out.push(body[i]);
  }
  return out;
}

/** Inserção de bits: depois de cinco 1s seguidos, insere um 0. Flag = 01111110. */
export function bitStuff(bits) {
  const out = [], inserted = [];
  let ones = 0;
  for (const b of bits) {
    out.push(b);
    if (b === 1) {
      ones++;
      if (ones === 5) { inserted.push(out.length); out.push(0); ones = 0; }
    } else ones = 0;
  }
  return { out, inserted };
}

export function bitUnstuff(bits) {
  const out = [];
  let ones = 0;
  for (let i = 0; i < bits.length; i++) {
    const b = bits[i];
    out.push(b);
    if (b === 1) {
      ones++;
      if (ones === 5) { i++; ones = 0; }     // pula o 0 inserido
    } else ones = 0;
  }
  return out;
}

/** Número mínimo de bits de verificação para corrigir 1 erro: (m + r + 1) ≤ 2ʳ. */
export function hammingCheckBits(m) {
  let r = 0;
  while (m + r + 1 > 2 ** r) r++;
  return r;
}

/**
 * Código de Hamming (paridade par): bits de verificação nas posições potência de 2
 * (numeradas a partir de 1, da esquerda). Devolve a palavra e quem cobre quem.
 */
export function hammingEncode(data) {
  const m = data.length, r = hammingCheckBits(m), n = m + r;
  const word = Array(n + 1).fill(0);   // índice 1..n
  const isCheck = i => (i & (i - 1)) === 0;
  let k = 0;
  for (let i = 1; i <= n; i++) if (!isCheck(i)) word[i] = data[k++];
  const coverage = {};
  for (let p = 1; p <= n; p <<= 1) {
    coverage[p] = [];
    let parity = 0;
    for (let i = 1; i <= n; i++) if (i & p) { coverage[p].push(i); if (i !== p) parity ^= word[i]; }
    word[p] = parity;
  }
  return { word: word.slice(1), r, n, coverage };
}

/** Decodifica: a síndrome (soma das posições dos bits de verificação que falharam) aponta o bit errado. */
export function hammingDecode(word) {
  const n = word.length;
  const w = [0, ...word];
  let syndrome = 0;
  const failed = [];
  for (let p = 1; p <= n; p <<= 1) {
    let parity = 0;
    for (let i = 1; i <= n; i++) if (i & p) parity ^= w[i];
    if (parity) { syndrome += p; failed.push(p); }
  }
  const corrected = [...word];
  if (syndrome >= 1 && syndrome <= n) corrected[syndrome - 1] ^= 1;
  const data = [];
  for (let i = 1; i <= n; i++) if ((i & (i - 1)) !== 0) data.push(corrected[i - 1]);
  return { syndrome, failed, corrected, data };
}

/**
 * CRC por divisão polinomial módulo 2, com os passos da "divisão longa".
 * Devolve o resto (r bits), o quadro transmitido e as linhas da conta.
 */
export function crc(frame, gen) {
  const r = gen.length - 1;
  const work = [...frame, ...Array(r).fill(0)];
  const rows = [];
  for (let i = 0; i <= work.length - gen.length; i++) {
    const lead = work[i];
    const sub = lead ? gen : Array(gen.length).fill(0);
    const before = work.slice(i, i + gen.length);
    for (let j = 0; j < gen.length; j++) work[i + j] ^= sub[j];
    rows.push({ pos: i, before, sub, after: work.slice(i, i + gen.length), quotientBit: lead });
  }
  const remainder = work.slice(work.length - r);
  return { remainder, transmitted: [...frame, ...remainder], rows, quotient: rows.map(x => x.quotientBit) };
}

/** Verificação no receptor: resto de dividir o quadro recebido pelo gerador (tudo 0 = sem erro detectado). */
export function crcCheck(received, gen) {
  const w = [...received];
  for (let i = 0; i <= w.length - gen.length; i++) if (w[i]) for (let j = 0; j < gen.length; j++) w[i + j] ^= gen[j];
  return w.slice(w.length - (gen.length - 1));
}

export const polyToBits = exps => { const deg = Math.max(...exps); return Array.from({ length: deg + 1 }, (_, i) => (exps.includes(deg - i) ? 1 : 0)); };
export const bitsToPoly = bits => bits.map((b, i) => (b ? bits.length - 1 - i : null)).filter(e => e != null).map(e => (e === 0 ? '1' : e === 1 ? 'x' : `x^${e}`)).join(' + ');

/** Checksum da Internet: soma em complemento de 1 de palavras de w bits, depois complementa. */
export function internetChecksum(words, w = 16) {
  const mask = 2 ** w - 1;
  let sum = 0;
  const steps = [];
  for (const x of words) {
    sum += x;
    const carry = sum > mask;
    if (carry) sum = (sum & mask) + 1;          // "vai-um" volta para o bit menos significativo
    steps.push({ add: x, sum, carry });
  }
  return { sum, checksum: ~sum & mask, steps };
}

/** Paridade 2D: bit de paridade par por linha e por coluna (e o do canto). */
export function parity2d(rows) {
  const rowP = rows.map(r => r.reduce((a, b) => a ^ b, 0));
  const colP = rows[0].map((_, j) => rows.reduce((a, r) => a ^ r[j], 0));
  const corner = rowP.reduce((a, b) => a ^ b, 0);
  return { rowP, colP, corner };
}

/** Eficiência (utilização) de janela deslizante: U = W·t_f / (t_f + 2·t_prop), limitada a 1. */
export function utilization({ W, frameBits, rate, prop }) {
  const tf = frameBits / rate;
  return Math.min(1, (W * tf) / (tf + 2 * prop));
}

/** Janela mínima para utilização de 100%: W ≥ 2·BD + 1 (BD = produto banda-atraso em quadros). */
export function windowFor100({ frameBits, rate, prop }) {
  const BD = (rate * prop) / frameBits;
  return Math.ceil(2 * BD + 1);
}

/**
 * Simulador de eventos discretos dos protocolos de janela deslizante.
 *   proto: 'sw' (parar-e-esperar, protocolo 3), 'gbn' (volta-N, protocolo 5), 'sr' (repetição seletiva, protocolo 6)
 * O tempo é medido em "tempos de quadro" (t_f = 1). ACKs têm tamanho desprezível.
 * lostData / lostAck: índices de quadros cuja 1ª transmissão (ou 1º ACK) se perde.
 */
export function simulateArq({ proto = 'gbn', N = 8, W = 4, seqBits = 3, D = 2, timeout = 8, lostData = [], lostAck = [] }) {
  if (proto === 'sw') W = 1;
  const M = proto === 'sw' ? 2 : 2 ** seqBits;
  const lostD = new Set(lostData), lostA = new Set(lostAck);
  const tx = [], acks = [], timeouts = [], deliveries = [], discards = [];
  const attempts = Array(N).fill(0);
  const ackAttempts = Array(N).fill(0);
  const acked = Array(N).fill(false);
  const sentAt = Array(N).fill(null);      // horário do último envio (para o temporizador)
  let base = 0, next = 0, linkFree = 0;
  let expected = 0;                        // receptor
  const rbuf = new Set();
  const resend = [];                       // fila de retransmissões pendentes
  const events = [];                       // { t, kind, ... }
  const push = e => { events.push(e); events.sort((x, y) => x.t - y.t || x.order - y.order); };
  let order = 0;
  let finish = null;

  const armTimer = (i, t) => push({ t: t + timeout, kind: 'timeout', i, stamp: t, order: order++ });

  const trySend = t => {
    while (true) {
      let i = null;
      if (resend.length) i = resend.shift();
      else if (next < N && next < base + W) i = next++;
      if (i == null) return;
      if (acked[i]) continue;
      const start = Math.max(t, linkFree);
      const lost = attempts[i] === 0 && lostD.has(i);
      const rec = { kind: 'data', i, seq: i % M, t0: start, t1: start + 1 + D, attempt: attempts[i], lost };
      attempts[i]++;
      tx.push(rec);
      linkFree = start + 1;
      sentAt[i] = start;
      if (!lost) push({ t: start + 1 + D, kind: 'arrive', i, order: order++ });
      if (proto === 'sr' || i === base || proto === 'gbn' || proto === 'sw') armTimer(i, start);
      t = start;
    }
  };

  const sendAck = (t, ackIdx, forIdx) => {
    // ackIdx: número do quadro reconhecido (cumulativo em sw/gbn, individual em sr)
    if (ackIdx < 0) return;
    const lost = ackAttempts[forIdx] === 0 && lostA.has(forIdx);
    ackAttempts[forIdx]++;
    const rec = { kind: 'ack', ack: ackIdx, seq: ackIdx % M, t0: t, t1: t + D, lost };
    acks.push(rec);
    if (!lost) push({ t: t + D, kind: 'ackArrive', ack: ackIdx, order: order++ });
  };

  trySend(0);
  let guard = 0;
  while (events.length && guard++ < 5000) {
    const e = events.shift();
    const t = e.t;
    if (e.kind === 'arrive') {
      if (proto === 'sr') {
        if (e.i >= expected && e.i < expected + W) {
          if (!rbuf.has(e.i)) rbuf.add(e.i);
          while (rbuf.has(expected)) { rbuf.delete(expected); deliveries.push({ t, i: expected }); expected++; }
        } else discards.push({ t, i: e.i, dup: e.i < expected });
        sendAck(t, e.i, e.i);
      } else {
        if (e.i === expected) { deliveries.push({ t, i: e.i }); expected++; }
        else discards.push({ t, i: e.i, dup: e.i < expected });
        sendAck(t, expected - 1, e.i);
      }
    } else if (e.kind === 'ackArrive') {
      if (proto === 'sr') acked[e.ack] = true;
      else for (let j = 0; j <= e.ack; j++) acked[j] = true;
      while (base < N && acked[base]) base++;
      if (base >= N && finish == null) finish = t;
      trySend(t);
    } else if (e.kind === 'timeout') {
      if (acked[e.i] || sentAt[e.i] !== e.stamp) continue;     // temporizador velho (já reconhecido ou reenviado)
      if (proto !== 'sr' && e.i !== base) continue;             // em sw/gbn só vale o do quadro mais antigo
      timeouts.push({ t, i: e.i });
      if (proto === 'sr') resend.push(e.i);
      else { for (let j = base; j < next; j++) if (!acked[j] && !resend.includes(j)) resend.push(j); }
      trySend(t);
    }
  }
  const total = finish ?? Math.max(...tx.map(x => x.t1), ...acks.map(a => a.t1));
  return { tx, acks, timeouts, deliveries, discards, finish: total, M, W, utilization: N / total, retransmissions: tx.length - N };
}

// ======================================================================
// Capítulo 4 — Subcamada MAC
// ======================================================================

export const alohaPure = G => G * Math.exp(-2 * G);
export const alohaSlotted = G => G * Math.exp(-G);
/** CSMA não persistente (Kleinrock e Tobagi), a = atraso de propagação / tempo do quadro. */
export const csmaNonPersistent = (G, a = 0.01) => (G * Math.exp(-a * G)) / (G * (1 + 2 * a) + Math.exp(-a * G));
/** CSMA 1-persistente (Kleinrock e Tobagi). */
export function csma1Persistent(G, a = 0.01) {
  const num = G * (1 + G + a * G * (1 + G + (a * G) / 2)) * Math.exp(-G * (1 + 2 * a));
  const den = G * (1 + 2 * a) - (1 - Math.exp(-a * G)) + (1 + a * G) * Math.exp(-G * (1 + a));
  return num / den;
}

/** ALOHA com slots: N estações, cada uma transmite com probabilidade p em cada slot. */
export function slottedAlohaSim(r, N, p, slots) {
  const out = [];
  for (let s = 0; s < slots; s++) {
    const who = [];
    for (let i = 0; i < N; i++) if (r() < p) who.push(i);
    out.push({ who, result: who.length === 0 ? 'vazio' : who.length === 1 ? 'sucesso' : 'colisão' });
  }
  return out;
}
export const slottedAlohaTheory = (N, p) => N * p * (1 - p) ** (N - 1);

/**
 * Recuo exponencial binário: após i colisões, cada estação sorteia um slot em [0, 2^min(i,10) − 1].
 * A disputa termina quando o menor slot sorteado é único.
 */
export function binaryBackoff(r, k, maxRounds = 16) {
  const rounds = [];
  for (let i = 1; i <= maxRounds; i++) {
    const range = 2 ** Math.min(i, 10);
    const picks = Array.from({ length: k }, () => Math.floor(r() * range));
    const min = Math.min(...picks);
    const winners = picks.filter(p => p === min).length;
    rounds.push({ i, range, picks, min, done: winners === 1, winner: winners === 1 ? picks.indexOf(min) : null });
    if (winners === 1) break;
  }
  return rounds;
}

/** Contagem regressiva binária: as estações transmitem seus endereços bit a bit (OU lógico no canal). */
export function binaryCountdown(ids, bits) {
  let alive = [...ids];
  const steps = [];
  for (let b = bits - 1; b >= 0; b--) {
    const ones = alive.filter(id => (id >> b) & 1);
    const channel = ones.length ? 1 : 0;
    const dropped = channel ? alive.filter(id => !((id >> b) & 1)) : [];
    steps.push({ bit: bits - 1 - b, channel, alive: [...alive], dropped });
    if (channel) alive = ones;
  }
  return { winner: alive[0], steps };
}

/**
 * Percurso adaptativo em árvore: estações 1..n são as folhas de uma árvore binária
 * (n potência de 2). Busca em profundidade: um slot por nó visitado; colisão desce
 * para os dois filhos, sucesso ou silêncio encerram aquele ramo.
 */
export function treeWalk(ready, n) {
  const slots = [];
  const visit = (lo, hi) => {
    const who = ready.filter(s => s >= lo && s <= hi);
    slots.push({ lo, hi, who, result: who.length === 0 ? 'vazio' : who.length === 1 ? 'sucesso' : 'colisão' });
    if (who.length > 1 && hi > lo) {
      const mid = Math.floor((lo + hi) / 2);
      visit(lo, mid);
      visit(mid + 1, hi);
    }
  };
  visit(1, n);
  return slots;
}

/** Tamanho mínimo de quadro para detectar colisão: 2τ·R bits (τ = atraso de ida). */
export const minFrameBits = ({ length, velocity, rate }) => (2 * length / velocity) * rate;

/** Ethernet: campos do quadro (DIX/802.3) e enchimento para chegar a 64 bytes (de destino a checksum). */
export function ethernetFrame(payloadBytes) {
  const pad = Math.max(0, 46 - payloadBytes);
  return {
    fields: [
      { nome: 'Preâmbulo + SOF', bytes: 8, fora: true },
      { nome: 'Destino', bytes: 6 }, { nome: 'Origem', bytes: 6 }, { nome: 'Tipo/Tamanho', bytes: 2 },
      { nome: 'Dados', bytes: payloadBytes }, { nome: 'Enchimento', bytes: pad }, { nome: 'Checksum (CRC-32)', bytes: 4 },
    ],
    pad,
    total: 14 + payloadBytes + pad + 4,
    ok: payloadBytes <= 1500,
  };
}

/**
 * Terminais oculto e exposto: estações numa reta; cada uma alcança quem estiver a até `range`.
 * transmissions: [[origem, destino], …] simultâneas. Diz quais receptores sofrem colisão.
 */
export function wirelessOutcome(pos, range, transmissions) {
  const hears = (a, b) => Math.abs(pos[a] - pos[b]) <= range + 1e-9;
  return transmissions.map(([src, dst]) => {
    const interferers = transmissions.filter(([s]) => s !== src && hears(s, dst)).map(([s]) => s);
    return { src, dst, reach: hears(src, dst), ok: hears(src, dst) && interferers.length === 0, interferers };
  });
}

/**
 * Ponte com aprendizado reverso (backward learning). topology:
 *   { bridges: { B1: { 1: 'L1', 2: 'L2', … } }, hosts: { A: 'L1', … } }
 * Envia um quadro de src para dst e registra por onde ele passou (atualiza as tabelas).
 */
export function bridgeSend(topology, tables, src, dst) {
  const hops = [];
  const lanOf = topology.hosts;
  const queue = [{ lan: lanOf[src], from: null }];
  const seen = new Set();
  while (queue.length) {
    const { lan, from } = queue.shift();
    if (seen.has(lan)) continue;
    seen.add(lan);
    for (const [bname, ports] of Object.entries(topology.bridges)) {
      if (bname === from) continue;
      const inPort = Object.keys(ports).find(p => ports[p] === lan);
      if (inPort == null) continue;
      const table = (tables[bname] ??= {});
      table[src] = inPort;                                  // aprende: src está atrás de inPort
      const known = table[dst];
      let out;
      if (known == null) out = Object.keys(ports).filter(p => p !== inPort);   // inunda
      else if (known === inPort) out = [];                                    // destino no mesmo lado: descarta
      else out = [known];
      hops.push({ bridge: bname, inPort, action: known == null ? 'inunda' : known === inPort ? 'descarta' : 'encaminha', out });
      for (const p of out) queue.push({ lan: ports[p], from: bname });
    }
  }
  return { hops, tables };
}

/**
 * Árvore geradora (spanning tree, IEEE 802.1D simplificado):
 * bridges: { id: [LANs em que está ligada] }. A raiz é a de menor ID; cada ponte escolhe a porta
 * raiz (menor custo em saltos, desempate pelo menor ID do vizinho); cada LAN escolhe a ponte
 * designada (mais perto da raiz, desempate por menor ID). As demais portas ficam bloqueadas.
 */
export function spanningTree(bridges) {
  const ids = Object.keys(bridges).map(Number).sort((a, b) => a - b);
  const root = ids[0];
  const dist = { [root]: 0 };
  const rootPort = {};
  let frontier = [root];
  while (frontier.length) {
    const nextF = [];
    for (const b of frontier.sort((x, y) => x - y)) {
      for (const lan of bridges[b]) {
        for (const nb of ids) {
          if (nb === b || !bridges[nb].includes(lan) || dist[nb] != null) continue;
          dist[nb] = dist[b] + 1;
          rootPort[nb] = lan;
          nextF.push(nb);
        }
      }
    }
    frontier = nextF;
  }
  const lans = [...new Set(Object.values(bridges).flat())].sort();
  const designated = {};
  for (const lan of lans) {
    const cands = ids.filter(b => bridges[b].includes(lan));
    cands.sort((x, y) => dist[x] - dist[y] || x - y);
    designated[lan] = cands[0];
  }
  const blocked = [];
  for (const b of ids) for (const lan of bridges[b]) {
    if (rootPort[b] === lan || designated[lan] === b) continue;
    blocked.push([b, lan]);
  }
  return { root, dist, rootPort, designated, blocked };
}
