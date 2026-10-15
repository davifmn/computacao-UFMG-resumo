// Sistemas paralelos e distribuídos: leis de Amdahl e Gustafson, trabalho e
// caminho crítico de um DAG com escalonamento guloso, relógios de Lamport e
// vetoriais, eleição de líder (valentão e anel) e MapReduce.

import { lineFinder } from '../../../engine/highlight.js';

// ---------- Speedup ----------

/** Amdahl: fração serial s, p processadores. */
export const amdahl = (s, p) => 1 / (s + (1 - s) / p);
/** Gustafson: o problema cresce com p; s é a fração serial medida na execução paralela. */
export const gustafson = (s, p) => p - s * (p - 1);
export const efficiency = (speedup, p) => speedup / p;

// ---------- DAG: trabalho, caminho crítico e escalonamento guloso ----------

/** dag = { nodes: [{ id, label, cost }], edges: [[de, para]] } */
export function workSpan(dag) {
  const n = dag.nodes.length;
  const preds = Array.from({ length: n }, () => []);
  for (const [a, b] of dag.edges) preds[b].push(a);
  const finish = Array(n).fill(null);
  const f = v => { if (finish[v] == null) finish[v] = dag.nodes[v].cost + Math.max(0, ...preds[v].map(f)); return finish[v]; };
  for (let v = 0; v < n; v++) f(v);
  const work = dag.nodes.reduce((s, x) => s + x.cost, 0);
  const span = Math.max(...finish);
  // caminho crítico
  let v = finish.indexOf(span);
  const crit = [v];
  while (preds[v].length) { v = preds[v].reduce((a, b) => (finish[a] >= finish[b] ? a : b)); crit.unshift(v); }
  return { work, span, parallelism: work / span, crit, finish };
}

/** Escalonamento guloso em p processadores (custos unitários ou inteiros), passo a passo. */
export function greedySchedule(dag, p) {
  const n = dag.nodes.length;
  const preds = Array.from({ length: n }, () => []);
  for (const [a, b] of dag.edges) preds[b].push(a);
  const done = Array(n).fill(false), left = dag.nodes.map(x => x.cost), start = Array(n).fill(null), end = Array(n).fill(null);
  const running = new Set();
  const steps = [];
  let t = 0;
  while (done.some(d => !d) && t < 10000) {
    const ready = [...Array(n).keys()].filter(v => !done[v] && !running.has(v) && preds[v].every(u => done[u]));
    while (running.size < p && ready.length) { const v = ready.shift(); running.add(v); if (start[v] == null) start[v] = t; }
    const busy = [...running];
    steps.push({ t, busy, idle: p - busy.length, ready: ready.length });
    for (const v of busy) { left[v]--; if (left[v] === 0) { done[v] = true; end[v] = t + 1; running.delete(v); } }
    t++;
  }
  return { T: t, steps, start, end };
}

/** DAG de uma redução (soma) em árvore com n folhas. */
export function reductionDAG(n) {
  const nodes = [], edges = [];
  let level = [];
  for (let i = 0; i < n; i++) { nodes.push({ id: nodes.length, label: `x${i}`, cost: 1 }); level.push(nodes.length - 1); }
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 === level.length) { next.push(level[i]); continue; }
      const id = nodes.length;
      nodes.push({ id, label: '+', cost: 1 });
      edges.push([level[i], id], [level[i + 1], id]);
      next.push(id);
    }
    level = next;
  }
  return { nodes, edges };
}

/** DAG de "divide e conquista" desbalanceado: uma cadeia serial seguida de um leque paralelo. */
export function forkJoinDAG(serial, width, depth) {
  const nodes = [], edges = [];
  let prev = null;
  for (let i = 0; i < serial; i++) { nodes.push({ id: nodes.length, label: `s${i}`, cost: 1 }); if (prev != null) edges.push([prev, nodes.length - 1]); prev = nodes.length - 1; }
  const join = [];
  for (let w = 0; w < width; w++) {
    let last = prev;
    for (let d = 0; d < depth; d++) { nodes.push({ id: nodes.length, label: `p${w}`, cost: 1 }); if (last != null) edges.push([last, nodes.length - 1]); last = nodes.length - 1; }
    join.push(last);
  }
  nodes.push({ id: nodes.length, label: 'fim', cost: 1 });
  for (const j of join) edges.push([j, nodes.length - 1]);
  return { nodes, edges };
}

// ---------- Relógios lógicos ----------
// events: [{ p, kind: 'local' | 'send' | 'recv', msg? }] em ordem de geração (cada processo em ordem).
// Um recv referencia o índice do send correspondente em `msg`.

export function clocks(nproc, events) {
  const L = Array(nproc).fill(0), V = Array.from({ length: nproc }, () => Array(nproc).fill(0));
  const out = [];
  const pending = [...events.keys()];
  const doneSet = new Set();
  // processa respeitando: um recv só depois do seu send
  let guard = 0;
  while (pending.length && guard++ < 10000) {
    const k = pending.findIndex(i => events[i].kind !== 'recv' || doneSet.has(events[i].msg));
    const i = pending.splice(k, 1)[0];
    const e = events[i];
    if (e.kind === 'recv') {
      const s = out[e.msg];
      L[e.p] = Math.max(L[e.p], s.lamport) + 1;
      V[e.p] = V[e.p].map((x, j) => Math.max(x, s.vector[j]));
      V[e.p][e.p]++;
    } else { L[e.p]++; V[e.p][e.p]++; }
    out[i] = { ...e, lamport: L[e.p], vector: [...V[e.p]] };
    doneSet.add(i);
  }
  return out;
}

/** Relação entre dois eventos pelos vetores: '→' (a antes de b), '←', ou '∥' (concorrentes). */
export function relation(va, vb) {
  const le = va.every((x, k) => x <= vb[k]), ge = va.every((x, k) => x >= vb[k]);
  if (le && !ge) return '→';
  if (ge && !le) return '←';
  if (le && ge) return '=';
  return '∥';
}

export const CLOCK_EXAMPLES = {
  classico: {
    nome: 'Três processos trocando mensagens',
    n: 3,
    events: [
      { p: 0, kind: 'local' }, { p: 0, kind: 'send' }, { p: 1, kind: 'local' }, { p: 1, kind: 'recv', msg: 1 },
      { p: 1, kind: 'send' }, { p: 2, kind: 'local' }, { p: 2, kind: 'recv', msg: 4 }, { p: 2, kind: 'send' },
      { p: 0, kind: 'local' }, { p: 0, kind: 'recv', msg: 7 }, { p: 1, kind: 'local' }, { p: 2, kind: 'local' },
    ],
  },
  concorrencia: {
    nome: 'Lamport não detecta concorrência',
    n: 3,
    events: [
      { p: 0, kind: 'local' }, { p: 0, kind: 'local' }, { p: 0, kind: 'local' }, { p: 0, kind: 'send' },
      { p: 1, kind: 'local' }, { p: 1, kind: 'recv', msg: 3 },
      { p: 2, kind: 'local' }, { p: 2, kind: 'local' },
    ],
  },
};

// ---------- Eleição de líder ----------

export const BULLY_CODE = `# Algoritmo do valentão (Garcia-Molina)
def inicia_eleicao(eu):
    maiores = [p for p in vivos_conhecidos if p > eu]
    for p in maiores:
        envia(p, "ELEIÇÃO")
    if ninguem_respondeu(maiores):
        for p in todos:
            envia(p, "COORDENADOR", eu)       # eu venci
def ao_receber_eleicao(eu, de):
    envia(de, "OK")                          # eu assumo daqui
    inicia_eleicao(eu)`;

/** Valentão: ids 1..n, `down` = conjunto dos que caíram, `starter` percebeu a falha. */
export function bullySteps(n, down, starter) {
  const L = lineFinder(BULLY_CODE);
  const alive = id => !down.has(id);
  const steps = [], msgs = [];
  let count = 0;
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, msgs: [...msgs], count, vars: { mensagens: count }, ...extra });
  snap(null, `O processo ${starter} percebe que o coordenador (${n}) não responde e começa uma eleição. Ids maiores têm prioridade.`, { active: [starter] });
  const queue = [starter];
  const started = new Set();
  let winner = null;
  while (queue.length) {
    const p = queue.shift();
    if (started.has(p)) continue;
    started.add(p);
    const bigger = [];
    for (let q = p + 1; q <= n; q++) bigger.push(q);
    for (const q of bigger) { msgs.push({ from: p, to: q, kind: 'ELEIÇÃO', ok: alive(q) }); count++; }
    snap(L('envia(p, "ELEIÇÃO")'), bigger.length ? `${p} envia ELEIÇÃO a todos os maiores: ${bigger.join(', ')}.` : `${p} é o maior id: não há a quem perguntar.`, { active: [p] });
    const answer = bigger.filter(alive);
    if (!answer.length) { winner = p; break; }
    for (const q of answer) { msgs.push({ from: q, to: p, kind: 'OK', ok: true }); count++; }
    snap(L('envia(de, "OK")'), `${answer.join(', ')} ${answer.length > 1 ? 'respondem' : 'responde'} OK: ${p} desiste e espera. Cada um que respondeu começa a própria eleição.`, { active: answer });
    queue.push(...answer.sort((a, b) => a - b));
  }
  for (let q = 1; q <= n; q++) if (q !== winner && alive(q)) { msgs.push({ from: winner, to: q, kind: 'COORDENADOR', ok: true }); count++; }
  snap(L('envia(p, "COORDENADOR", eu)'), `Ninguém maior respondeu a ${winner}: ele se declara <b>coordenador</b> e avisa todos. Total: <b>${count}</b> mensagens (no pior caso, quando o menor começa, $O(n^2)$).`, { active: [winner], winner, done: true });
  return steps;
}

export const RING_CODE = `# Eleição em anel (Chang-Roberts simplificado)
def inicia(eu):
    envia(proximo_vivo(eu), "ELEIÇÃO", [eu])
def ao_receber(eu, lista):
    if eu in lista:                          # deu a volta
        lider = max(lista)
        envia(proximo_vivo(eu), "COORDENADOR", lider)
    else:
        envia(proximo_vivo(eu), "ELEIÇÃO", lista + [eu])`;

export function ringSteps(n, down, starter) {
  const L = lineFinder(RING_CODE);
  const alive = id => !down.has(id);
  const next = id => { let q = id; do { q = (q % n) + 1; } while (!alive(q)); return q; };
  const steps = [], msgs = [];
  let count = 0, cur = starter, list = [starter];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, msgs: [...msgs], count, list: [...list], vars: { lista: list.join(' '), mensagens: count }, ...extra });
  snap(L('def inicia'), `${starter} percebe a falha e manda uma mensagem ELEIÇÃO com a lista [${starter}] ao próximo vivo do anel (pulando os que caíram).`, { active: [starter] });
  for (let guard = 0; guard < 3 * n; guard++) {
    const q = next(cur);
    msgs.push({ from: cur, to: q, kind: 'ELEIÇÃO', ok: true }); count++;
    if (list.includes(q)) {
      snap(L('if eu in lista'), `A mensagem voltou a ${q}, que está na lista [${list.join(', ')}]: todos os vivos participaram.`, { active: [q] });
      cur = q;
      break;
    }
    list.push(q);
    snap(L('envia(proximo_vivo(eu), "ELEIÇÃO", lista + [eu])'), `${q} acrescenta seu id: [${list.join(', ')}].`, { active: [q] });
    cur = q;
  }
  const leader = Math.max(...list);
  let q = cur;
  do { const r = next(q); msgs.push({ from: q, to: r, kind: 'COORDENADOR', ok: true }); count++; q = r; } while (q !== cur);
  snap(L('lider = max(lista)'), `O maior da lista, <b>${leader}</b>, é o líder. Uma volta de COORDENADOR avisa todos. Total: <b>${count}</b> mensagens ($2n$ com $n$ vivos).`, { active: [leader], winner: leader, done: true });
  return steps;
}

// ---------- MapReduce ----------

export function mapReduce(text, nMappers = 3, nReducers = 2) {
  const words = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]+/g) ?? [];
  const per = Math.ceil(words.length / nMappers);
  const splits = Array.from({ length: nMappers }, (_, k) => words.slice(k * per, (k + 1) * per));
  const mapped = splits.map(ws => ws.map(w => [w, 1]));
  const hash = w => [...w].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % nReducers;
  // cada mapeador particiona sua saída por redutor (shuffle)
  const partitions = Array.from({ length: nReducers }, () => new Map());
  mapped.forEach(pairs => pairs.forEach(([w]) => { const m = partitions[hash(w)]; m.set(w, (m.get(w) ?? []).concat(1)); }));
  const reduced = partitions.map(m => [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([w, ones]) => [w, ones.length]));
  return { words, splits, mapped, partitions: partitions.map(m => [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))), reduced, hash };
}
