// Redes, módulo 2 (Tanenbaum, caps. 5 a 8): roteamento (Dijkstra, vetor de
// distância e contagem ao infinito), endereçamento IPv4 (CIDR, maior prefixo,
// alocação de blocos, fragmentação), TCP (congestionamento e RTT), DNS e
// criptografia (Diffie-Hellman e RSA).

import { lineFinder } from '../../../../engine/highlight.js';

// =====================================================================
// Roteamento
// =====================================================================

/** G = { names, pos, edges: [[u, v, custo]] } (não dirigido). */
export const adj = G => {
  const a = G.names.map(() => []);
  for (const [u, v, w] of G.edges) { a[u].push([v, w]); a[v].push([u, w]); }
  return a;
};

export const DIJKSTRA_CODE = `def dijkstra(rede, origem):
    dist = {v: INF for v in rede}; dist[origem] = 0
    anterior = {}
    permanentes = set()
    atual = origem
    while atual is not None:
        permanentes.add(atual)               # o rótulo de atual vira permanente
        for viz, custo in rede[atual]:
            if viz not in permanentes and dist[atual] + custo < dist[viz]:
                dist[viz] = dist[atual] + custo  # rótulo provisório melhorou
                anterior[viz] = atual
        candidatos = [v for v in rede if v not in permanentes and dist[v] < INF]
        atual = min(candidatos, key=dist.get, default=None)
    return dist, anterior`;

export function dijkstraSteps(G, s) {
  const L = lineFinder(DIJKSTRA_CODE);
  const n = G.names.length, A = adj(G);
  const dist = Array(n).fill(Infinity), prev = Array(n).fill(null), perm = Array(n).fill(false);
  dist[s] = 0;
  const steps = [];
  const nm = i => G.names[i];
  const label = i => (dist[i] === Infinity ? '(∞, −)' : `(${dist[i]}, ${prev[i] == null ? '−' : nm(prev[i])})`);
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, dist: [...dist], prev: [...prev], perm: [...perm], vars: Object.fromEntries(G.names.map((x, i) => [x, label(i) + (perm[i] ? ' ✔' : '')])), ...extra });
  snap(L('dist[origem] = 0'), `Cada nó recebe um rótulo (distância, nó anterior). A origem ${nm(s)} começa com 0; os outros, ∞.`, { cur: s });
  let cur = s;
  while (cur != null) {
    perm[cur] = true;
    snap(L('permanentes.add(atual)'), `${nm(cur)} tem o menor rótulo provisório (${dist[cur]}): ele se torna <b>permanente</b>. Nenhum caminho por outro nó pode ser mais curto, porque todos os outros já custam pelo menos isso.`, { cur });
    for (const [v, w] of A[cur]) {
      if (perm[v]) continue;
      const nd = dist[cur] + w;
      if (nd < dist[v]) {
        const old = dist[v];
        dist[v] = nd; prev[v] = cur;
        snap(L('dist[viz] = dist[atual] + custo'), `Por ${nm(cur)}, ${nm(v)} custa ${dist[cur]} + ${w} = <b>${nd}</b> (antes: ${old === Infinity ? '∞' : old}). Novo rótulo provisório ${label(v)}.`, { cur, edge: [cur, v] });
      } else {
        snap(L('if viz not in permanentes'), `Por ${nm(cur)}, ${nm(v)} custaria ${nd}, que não melhora ${dist[v]}.`, { cur, edge: [cur, v] });
      }
    }
    let nx = null;
    for (let v = 0; v < n; v++) if (!perm[v] && dist[v] < Infinity && (nx == null || dist[v] < dist[nx])) nx = v;
    cur = nx;
  }
  snap(L('return dist, anterior'), `Todos os rótulos são permanentes. Seguindo os "anteriores" de trás para frente obtém-se a <b>árvore de escoamento</b> (sink tree) com os caminhos mais curtos a partir de ${nm(s)}.`, { done: true });
  return steps;
}

export function pathTo(prev, t) {
  const p = [];
  for (let v = t; v != null; v = prev[v]) p.unshift(v);
  return p;
}

/**
 * Vetor de distância síncrono: a cada rodada todos trocam vetores com os vizinhos.
 * Devolve as tabelas após cada rodada: table[r][u][d] = { cost, via }.
 */
export function distanceVector(G, { rounds = 20, infinity = 16, init = null } = {}) {
  const n = G.names.length, A = adj(G);
  let T = init ?? G.names.map((_, u) => G.names.map((_, d) => (u === d ? { cost: 0, via: null } : { cost: Infinity, via: null })));
  const hist = [T.map(r => r.map(c => ({ ...c })))];
  for (let r = 0; r < rounds; r++) {
    const N = T.map((row, u) => row.map((_, d) => {
      if (u === d) return { cost: 0, via: null };
      let best = { cost: Infinity, via: null };
      for (const [v, w] of A[u]) {
        const c = Math.min(infinity, w + T[v][d].cost);
        if (c < best.cost) best = { cost: c, via: v };
      }
      return best.cost >= infinity ? { cost: Infinity, via: null } : best;
    }));
    const changed = N.some((row, u) => row.some((c, d) => c.cost !== T[u][d].cost || c.via !== T[u][d].via));
    T = N;
    hist.push(T.map(row => row.map(c => ({ ...c }))));
    if (!changed) break;
  }
  return hist;
}

/** Atualização de um roteador a partir dos vetores recebidos dos vizinhos (o exercício clássico do roteador C). */
export function dvUpdate(names, vectors, linkCost, self = null) {
  return names.map((d, k) => {
    if (d === self) return { cost: 0, via: '—' };
    let best = { cost: Infinity, via: null };
    for (const [nb, vec] of Object.entries(vectors)) {
      const c = linkCost[nb] + vec[k];
      if (c < best.cost) best = { cost: c, via: nb };
    }
    return best;
  });
}

/**
 * Contagem ao infinito na linha A-B-C-D-E (custos 1): A cai e as rodadas mostram
 * as distâncias até A subindo de 1 em 1.
 */
export function countToInfinity(n = 5, rounds = 8) {
  // distâncias até A dos nós B..E, antes da queda
  let d = Array.from({ length: n - 1 }, (_, k) => k + 1);
  const hist = [[...d]];
  for (let r = 0; r < rounds; r++) {
    // B só ouve C (A caiu); os demais ouvem os dois vizinhos
    d = d.map((_, k) => {
      const left = k === 0 ? Infinity : d[k - 1];
      const right = k === d.length - 1 ? Infinity : d[k + 1];
      return Math.min(left, right) + 1;
    });
    hist.push([...d]);
  }
  return hist;
}

export const NETWORKS = {
  dijkstra: {
    nome: 'Exemplo de Dijkstra do livro (A a H)',
    names: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    pos: [[70, 210], [210, 90], [470, 90], [640, 210], [270, 210], [430, 230], [200, 340], [500, 350]],
    edges: [[0, 1, 2], [0, 6, 6], [1, 2, 7], [1, 4, 2], [2, 3, 3], [2, 5, 3], [3, 7, 2], [4, 5, 2], [4, 6, 1], [5, 7, 2], [6, 7, 4]],
  },
  rede: {
    nome: 'Rede de 6 roteadores',
    names: ['A', 'B', 'C', 'D', 'E', 'F'],
    pos: [[80, 200], [230, 80], [230, 320], [420, 80], [420, 320], [590, 200]],
    edges: [[0, 1, 4], [0, 2, 2], [1, 2, 1], [1, 3, 5], [2, 4, 8], [3, 4, 2], [3, 5, 6], [4, 5, 3], [2, 3, 10]],
  },
};

// =====================================================================
// IPv4
// =====================================================================

export const parseIP = s => {
  const p = s.trim().split('.').map(Number);
  if (p.length !== 4 || p.some(x => !Number.isInteger(x) || x < 0 || x > 255)) throw new Error(`endereço inválido: ${s}`);
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
};
export const ipStr = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');
export const maskOf = len => (len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0);
export const bin = (n, sep = '.') => [24, 16, 8, 0].map(s => ((n >>> s) & 255).toString(2).padStart(8, '0')).join(sep);

export function parseCIDR(s) {
  const [ip, len] = s.trim().split('/');
  const L = len == null ? 32 : +len;
  if (!Number.isInteger(L) || L < 0 || L > 32) throw new Error(`prefixo inválido: /${len}`);
  return { ip: parseIP(ip), len: L };
}

export function cidrInfo(s) {
  const { ip, len } = parseCIDR(s);
  const mask = maskOf(len);
  const net = (ip & mask) >>> 0, bcast = (net | (~mask >>> 0)) >>> 0;
  const size = 2 ** (32 - len);
  return { ip, len, mask, net, bcast, size, hosts: len >= 31 ? (len === 31 ? 2 : 1) : size - 2, first: len >= 31 ? net : net + 1, last: len >= 31 ? bcast : bcast - 1, aligned: ip === net };
}

/** Encaminhamento pelo maior prefixo. table: [{ prefix: 'a.b.c.d/n' | 'default', hop }] */
export function longestPrefix(table, addr) {
  const a = parseIP(addr);
  let best = null;
  const checks = table.map(e => {
    if (e.prefix === 'default') return { ...e, len: 0, match: true };
    const { ip, len } = parseCIDR(e.prefix);
    const m = maskOf(len);
    return { ...e, len, match: ((a & m) >>> 0) === ((ip & m) >>> 0) };
  });
  for (const c of checks) if (c.match && (!best || c.len > best.len)) best = c;
  return { best, checks };
}

/** Aloca blocos em ordem, cada um no primeiro endereço alinhado ao seu tamanho (potência de 2). */
export function allocate(start, requests) {
  let cur = parseIP(start);
  return requests.map(({ nome, n }) => {
    const bits = Math.ceil(Math.log2(n));
    const size = 2 ** bits;
    const base = Math.ceil(cur / size) * size;
    const gap = base - cur;
    cur = base + size;
    return { nome, n, size, len: 32 - bits, first: base, last: base + size - 1, gap };
  });
}

/** Tenta agregar prefixos num só (eles precisam formar exatamente um bloco alinhado). */
export function aggregate(prefixes) {
  const ps = prefixes.map(parseCIDR);
  const lo = Math.min(...ps.map(p => p.ip)), hi = Math.max(...ps.map(p => p.ip + 2 ** (32 - p.len) - 1));
  const total = ps.reduce((s, p) => s + 2 ** (32 - p.len), 0);
  const size = hi - lo + 1;
  const len = 32 - Math.log2(size);
  const ok = Number.isInteger(len) && lo % size === 0 && total === size;
  return ok ? `${ipStr(lo)}/${len}` : null;
}

/**
 * Fragmentação ao longo de um caminho. mtus = capacidade de carga útil IP de cada enlace (bytes).
 * Devolve, para cada enlace, os fragmentos { total, offset (em unidades de 8 bytes), mf }.
 */
export function fragmentPath(dataBytes, mtus, header = 20) {
  let frags = [{ data: dataBytes, offset: 0, mf: false }];
  return mtus.map(mtu => {
    const maxData = Math.floor((mtu - header) / 8) * 8;
    const next = [];
    for (const f of frags) {
      if (f.data + header <= mtu) { next.push(f); continue; }
      let off = 0;
      while (off < f.data) {
        const d = Math.min(maxData, f.data - off);
        const last = off + d >= f.data;
        next.push({ data: d, offset: f.offset + off / 8, mf: last ? f.mf : true });
        off += d;
      }
    }
    frags = next;
    return frags.map(f => ({ total: f.data + header, data: f.data, offset: f.offset, mf: f.mf }));
  });
}

// =====================================================================
// TCP
// =====================================================================

/**
 * Janela de congestionamento por rodada de transmissão (em MSS).
 * events: { [rodada]: 'timeout' | '3dup' }. variant: 'tahoe' | 'reno'.
 */
export function congestion({ rounds = 26, ssthresh = 32, events = {}, variant = 'reno', rwnd = Infinity } = {}) {
  let cwnd = 1, th = ssthresh;
  const out = [];
  for (let r = 1; r <= rounds; r++) {
    const ev = events[r];
    const phase = cwnd < th ? 'partida lenta' : 'prevenção de congestionamento';
    out.push({ r, cwnd, th, phase, ev, sent: Math.min(cwnd, rwnd) });
    if (ev === 'timeout') { th = Math.max(2, Math.floor(cwnd / 2)); cwnd = 1; }
    else if (ev === '3dup') { th = Math.max(2, Math.floor(cwnd / 2)); cwnd = variant === 'reno' ? th : 1; }
    else if (cwnd < th) cwnd = Math.min(cwnd * 2, th);
    else cwnd += 1;
  }
  return out;
}

/** Estimador de Jacobson/Karels: SRTT, RTTVAR e RTO = SRTT + 4·RTTVAR (RFC 6298). */
export function rttEstimates(samples, { alpha = 1 / 8, beta = 1 / 4, srtt0 = null } = {}) {
  let srtt = srtt0, rttvar = srtt0 == null ? null : srtt0 / 2;
  return samples.map(m => {
    if (srtt == null) { srtt = m; rttvar = m / 2; }
    else { rttvar = (1 - beta) * rttvar + beta * Math.abs(srtt - m); srtt = (1 - alpha) * srtt + alpha * m; }
    return { m, srtt, rttvar, rto: srtt + 4 * rttvar };
  });
}

/** Média exponencial simples do livro: SRTT = α·SRTT + (1 − α)·R. */
export const smoothRTT = (srtt, samples, alpha = 0.9) => samples.reduce((s, r) => alpha * s + (1 - alpha) * r, srtt);

export const HANDSHAKE = [
  { from: 0, label: 'SYN, seq = x', estadoA: 'SYN SENT', estadoB: 'LISTEN', msg: 'O cliente escolhe um número de sequência inicial x (aleatório, para não confundir com conexões antigas) e envia SYN.' },
  { from: 1, label: 'SYN, ACK, seq = y, ack = x + 1', estadoA: 'SYN SENT', estadoB: 'SYN RCVD', msg: 'O servidor confirma x (ack = x + 1: o SYN "consome" um número de sequência) e envia o seu próprio inicial y.' },
  { from: 0, label: 'ACK, seq = x + 1, ack = y + 1', estadoA: 'ESTABLISHED', estadoB: 'ESTABLISHED', msg: 'O cliente confirma y. Os dois lados conhecem o número inicial do outro: conexão estabelecida. (Este ACK já pode levar dados.)' },
  { from: 0, label: 'dados (seq = x + 1, 1000 bytes)', estadoA: 'ESTABLISHED', estadoB: 'ESTABLISHED', msg: 'Transferência: cada byte tem um número de sequência; os ACKs são cumulativos e dizem o próximo byte esperado.' },
  { from: 1, label: 'ACK, ack = x + 1001', estadoA: 'ESTABLISHED', estadoB: 'ESTABLISHED', msg: 'O servidor confirma todos os bytes até x + 1000.' },
  { from: 0, label: 'FIN, seq = x + 1001', estadoA: 'FIN WAIT 1', estadoB: 'CLOSE WAIT', msg: 'O cliente não tem mais o que enviar: FIN fecha a sua direção. A outra direção continua aberta (encerramento simétrico).' },
  { from: 1, label: 'ACK, ack = x + 1002', estadoA: 'FIN WAIT 2', estadoB: 'CLOSE WAIT', msg: 'O servidor confirma o FIN. Ele ainda pode mandar dados.' },
  { from: 1, label: 'FIN, seq = y + 1', estadoA: 'TIME WAIT', estadoB: 'LAST ACK', msg: 'O servidor também termina e envia o seu FIN.' },
  { from: 0, label: 'ACK, ack = y + 2', estadoA: 'TIME WAIT', estadoB: 'CLOSED', msg: 'O cliente confirma e espera 2 × o tempo de vida máximo do segmento (TIME WAIT), para o caso de esse último ACK se perder e o FIN ser reenviado.' },
];

// =====================================================================
// DNS
// =====================================================================

export const DNS_SERVERS = ['host', 'resolvedor local', 'raiz (.)', 'TLD .br', 'ufmg.br'];

/** Mensagens da resolução de www.dcc.ufmg.br. mode: 'iterativa' | 'recursiva'. cache: nível já conhecido pelo resolvedor. */
export function dnsSteps(mode = 'iterativa', cache = 'nada') {
  const q = 'www.dcc.ufmg.br';
  const steps = [];
  const add = (from, to, label, msg, kind = 'q') => steps.push({ from, to, label, msg, kind });
  add(0, 1, `${q}?`, 'O host pergunta ao seu resolvedor local (configurado por DHCP). A consulta do host é sempre <b>recursiva</b>: ele quer a resposta final.');
  if (cache === 'tudo') {
    add(1, 0, `${q} = 150.164.0.10`, 'O resolvedor tinha a resposta em <b>cache</b> (dentro do TTL): responde na hora, sem perguntar a ninguém.', 'r');
    return steps;
  }
  const askRoot = cache === 'nada';
  const askTLD = cache !== 'ufmg';
  if (mode === 'iterativa') {
    if (askRoot) {
      add(1, 2, `${q}?`, 'O resolvedor começa pela raiz (conhece os 13 nomes de servidores raiz por configuração).');
      add(2, 1, 'pergunte a a.dns.br', 'A raiz não sabe o endereço, mas sabe quem cuida de .br: devolve uma <b>indicação</b> (referral). Isso é iterativo: a raiz não pergunta adiante.', 'r');
    }
    if (askTLD) {
      add(1, 3, `${q}?`, cache === 'tld' ? 'O servidor de .br já estava em cache: a raiz é pulada.' : 'O resolvedor pergunta ao servidor de .br.');
      add(3, 1, 'pergunte a ns.ufmg.br', 'O .br indica o servidor autoritativo de ufmg.br.', 'r');
    }
    add(1, 4, `${q}?`, cache === 'ufmg' ? 'O autoritativo de ufmg.br já estava em cache.' : 'O resolvedor pergunta ao servidor autoritativo de ufmg.br.');
    add(4, 1, `${q} = 150.164.0.10`, 'Resposta <b>autoritativa</b>, com um TTL que diz por quanto tempo ela pode ficar em cache.', 'r');
  } else {
    if (askRoot) {
      add(1, 2, `${q}?`, 'Resolução recursiva: cada servidor pergunta ao próximo em nome de quem o consultou.');
      add(2, 3, `${q}?`, 'A raiz encaminha ao .br (na prática, servidores raiz <b>não</b> aceitam recursão, por causa da carga).');
      add(3, 4, `${q}?`, 'O .br encaminha ao autoritativo de ufmg.br.');
      add(4, 3, '150.164.0.10', 'A resposta volta pelo mesmo caminho…', 'r');
      add(3, 2, '150.164.0.10', '…e cada servidor pode guardá-la em cache.', 'r');
      add(2, 1, '150.164.0.10', '', 'r');
    } else if (askTLD) {
      add(1, 3, `${q}?`, 'O servidor de .br já estava em cache: começa por ele.');
      add(3, 4, `${q}?`, 'O .br encaminha ao autoritativo.');
      add(4, 3, '150.164.0.10', '', 'r');
      add(3, 1, '150.164.0.10', '', 'r');
    } else {
      add(1, 4, `${q}?`, 'O autoritativo já estava em cache.');
      add(4, 1, '150.164.0.10', '', 'r');
    }
  }
  add(1, 0, `${q} = 150.164.0.10`, 'O resolvedor entrega a resposta ao host e guarda tudo o que aprendeu em cache.', 'r');
  return steps;
}

// =====================================================================
// Criptografia
// =====================================================================

export function modpow(b, e, m) {
  let r = 1n, x = BigInt(b) % BigInt(m), k = BigInt(e);
  const M = BigInt(m);
  while (k > 0n) { if (k & 1n) r = (r * x) % M; x = (x * x) % M; k >>= 1n; }
  return Number(r);
}

export function diffieHellman(n, g, x, y) {
  const A = modpow(g, x, n), B = modpow(g, y, n);
  return { A, B, kA: modpow(B, x, n), kB: modpow(A, y, n) };
}

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export function modinv(a, m) {
  let [r0, r1, s0, s1] = [a, m, 1, 0];
  while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; }
  if (r0 !== 1) return null;
  return ((s0 % m) + m) % m;
}

/** RSA de brinquedo. Se d for dado, e = d⁻¹ mod z (como no livro); senão d = e⁻¹. */
export function rsaKeys(p, q, { d = null, e = null } = {}) {
  const n = p * q, z = (p - 1) * (q - 1);
  if (d != null) e = modinv(d, z);
  else d = modinv(e, z);
  return { n, z, e, d };
}

export const isPrime = n => { if (n < 2) return false; for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return true; };
