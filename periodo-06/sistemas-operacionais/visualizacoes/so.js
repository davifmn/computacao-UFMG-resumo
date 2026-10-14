// Sistemas operacionais: escalonamento de CPU, intercalação de threads
// (condições de corrida, mutex e semáforos), algoritmo do banqueiro e
// substituição de páginas.

import { lineFinder } from '../../../engine/highlight.js';

// ---------- Escalonamento de CPU ----------

export const SCHED_CODE = `def escalona(processos, politica, quantum):
    t, prontos, atual = 0, [], None
    while not todos_terminaram():
        prontos += chegam_em(t)                  # novos vão para a fila
        if atual and atual.restante == 0:
            termina(atual, t); atual = None      # libera a CPU
        elif atual and politica == "RR" and fatia == quantum:
            prontos.append(atual); atual = None  # fim do quantum: fim da fila
        elif atual and preemptiva and melhor(prontos) < atual:
            prontos.append(atual); atual = None  # alguém mais prioritário chegou
        if atual is None and prontos:
            atual = escolhe(prontos, politica)   # troca de contexto
            fatia = 0
        executa(atual, 1); t += 1; fatia += 1`;

export const POLICIES = {
  fcfs: { nome: 'FCFS', desc: 'primeiro a chegar, primeiro a ser servido', preemptiva: false },
  sjf: { nome: 'SJF', desc: 'menor tarefa primeiro (não preemptivo)', preemptiva: false },
  srtf: { nome: 'SRTF', desc: 'menor tempo restante primeiro (SJF preemptivo)', preemptiva: true },
  prio: { nome: 'Prioridade', desc: 'menor número = maior prioridade (preemptivo)', preemptiva: true },
  rr: { nome: 'Round-Robin', desc: 'fatias de tempo (quantum) em fila circular', preemptiva: true },
};

/**
 * processos: [{ nome, chegada, duracao, prioridade }]
 * Convenção do RR: quem chega no instante t entra na fila antes de quem teve o quantum esgotado em t.
 */
export function schedule(procs, policy, quantum = 2) {
  const L = lineFinder(SCHED_CODE);
  const P = procs.map((p, i) => ({ ...p, id: i, restante: p.duracao, inicio: null, fim: null }));
  const key = p => (policy === 'sjf' ? p.duracao : policy === 'srtf' ? p.restante : policy === 'prio' ? p.prioridade : 0);
  const pickBest = q => q.reduce((b, p) => (key(p) < key(b) || (key(p) === key(b) && (p.chegada < b.chegada || (p.chegada === b.chegada && p.id < b.id))) ? p : b));
  let t = 0, atual = null, fatia = 0, trocas = 0;
  const prontos = [], gantt = [], steps = [];
  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, t, atual: atual?.id ?? null, prontos: prontos.map(p => p.id), gantt: gantt.map(g => ({ ...g })),
    restante: P.map(p => p.restante), fim: P.map(p => p.fim), vars: { t, CPU: atual ? atual.nome : 'ociosa', fila: prontos.map(p => p.nome).join(' ') || '—' }, ...extra,
  });
  const nm = p => `<b>${p.nome}</b>`;
  let guard = 0;
  while (P.some(p => p.fim == null) && guard++ < 500) {
    const novos = P.filter(p => p.chegada === t);
    prontos.push(...novos);
    const ev = [];
    if (novos.length) ev.push(`${novos.map(nm).join(', ')} chega${novos.length > 1 ? 'm' : ''} e entra${novos.length > 1 ? 'm' : ''} na fila de prontos.`);
    let line = novos.length ? L('prontos += chegam_em(t)') : null;
    if (atual && atual.restante === 0) {
      atual.fim = t;
      ev.push(`${nm(atual)} termina em t = ${t} (retorno = ${t} − ${atual.chegada} = ${t - atual.chegada}).`);
      atual = null; line = L('termina(atual, t)');
    } else if (atual && policy === 'rr' && fatia === quantum) {
      prontos.push(atual);
      ev.push(`O quantum de ${nm(atual)} acabou (${quantum} unidades): ele volta para o <b>fim</b> da fila.`);
      atual = null; line = L('fim do quantum');
    } else if (atual && POLICIES[policy].preemptiva && policy !== 'rr' && prontos.length && key(pickBest(prontos)) < key(atual)) {
      const b = pickBest(prontos);
      ev.push(`${nm(b)} tem ${policy === 'srtf' ? `tempo restante ${b.restante} &lt; ${atual.restante}` : `prioridade ${b.prioridade} &lt; ${atual.prioridade}`}: <b>preempção</b>, ${nm(atual)} volta para a fila.`);
      prontos.push(atual); atual = null; line = L('alguém mais prioritário');
    }
    if (!atual && prontos.length) {
      const b = policy === 'fcfs' || policy === 'rr' ? prontos[0] : pickBest(prontos);
      prontos.splice(prontos.indexOf(b), 1);
      if (gantt.length && gantt.at(-1).p !== b.id && gantt.at(-1).p != null) trocas++;
      atual = b; fatia = 0;
      if (b.inicio == null) b.inicio = t;
      const why = { fcfs: 'é o primeiro da fila', rr: 'é o primeiro da fila', sjf: `tem a menor duração (${b.duracao})`, srtf: `tem o menor tempo restante (${b.restante})`, prio: `tem a maior prioridade (${b.prioridade})` }[policy];
      ev.push(`${nm(b)} ganha a CPU porque ${why}.`);
      line = L('atual = escolhe(prontos, politica)');
    }
    if (!P.some(p => p.fim == null)) { snap(line, ev.join(' ')); break; }
    if (atual) {
      atual.restante--; fatia++;
      if (gantt.length && gantt.at(-1).p === atual.id && gantt.at(-1).end === t) gantt.at(-1).end = t + 1;
      else gantt.push({ p: atual.id, start: t, end: t + 1 });
    } else {
      if (gantt.length && gantt.at(-1).p == null && gantt.at(-1).end === t) gantt.at(-1).end = t + 1;
      else gantt.push({ p: null, start: t, end: t + 1 });
      ev.push('Ninguém pronto: CPU ociosa.');
    }
    snap(line ?? L('executa(atual, 1)'), ev.length ? ev.join(' ') : `${atual ? nm(atual) : 'CPU'} executa de ${t} a ${t + 1}.`);
    t++;
  }
  const metrics = P.map(p => ({ nome: p.nome, retorno: p.fim - p.chegada, espera: p.fim - p.chegada - p.duracao, resposta: p.inicio - p.chegada }));
  const avg = k => metrics.reduce((s, m) => s + m[k], 0) / metrics.length;
  steps.push({ ...steps.at(-1), line: null, done: true, metrics, trocas,
    msg: `Fim em t = ${t}. Médias: espera <b>${avg('espera').toFixed(2)}</b>, retorno <b>${avg('retorno').toFixed(2)}</b>, resposta <b>${avg('resposta').toFixed(2)}</b>; ${trocas} troca(s) de contexto entre processos.` });
  return { steps, gantt, metrics, avg: { espera: avg('espera'), retorno: avg('retorno'), resposta: avg('resposta') }, trocas };
}

export const SCHED_EXAMPLES = {
  silberschatz: { nome: 'Silberschatz (5 processos)', procs: [
    { nome: 'P1', chegada: 0, duracao: 10, prioridade: 3 }, { nome: 'P2', chegada: 1, duracao: 1, prioridade: 1 },
    { nome: 'P3', chegada: 2, duracao: 2, prioridade: 4 }, { nome: 'P4', chegada: 3, duracao: 1, prioridade: 5 },
    { nome: 'P5', chegada: 4, duracao: 5, prioridade: 2 }] },
  comboio: { nome: 'Efeito comboio', procs: [
    { nome: 'A', chegada: 0, duracao: 12, prioridade: 2 }, { nome: 'B', chegada: 1, duracao: 2, prioridade: 1 },
    { nome: 'C', chegada: 1, duracao: 2, prioridade: 3 }, { nome: 'D', chegada: 2, duracao: 1, prioridade: 1 }] },
  srtf: { nome: 'Preempção (SRTF)', procs: [
    { nome: 'P1', chegada: 0, duracao: 8, prioridade: 2 }, { nome: 'P2', chegada: 1, duracao: 4, prioridade: 1 },
    { nome: 'P3', chegada: 2, duracao: 9, prioridade: 3 }, { nome: 'P4', chegada: 3, duracao: 5, prioridade: 2 }] },
};

// ---------- Threads: intercalação de instruções ----------
// Instruções: ['load', reg, var] ['add', reg, k] ['store', var, reg] ['lock', m] ['unlock', m]
//             ['wait', s] ['signal', s] ['produce'] ['consume']

export const PROGRAMS = {
  corrida: {
    nome: 'Condição de corrida: x = x + 1',
    shared: { x: 0 },
    threads: [0, 1].map(k => ({ nome: `T${k + 1}`, code: [['load', 'r', 'x'], ['add', 'r', 1], ['store', 'x', 'r'], ['load', 'r', 'x'], ['add', 'r', 1], ['store', 'x', 'r']] })),
    expect: s => `x = ${s.vars.x} (esperado: 4)`,
  },
  mutex: {
    nome: 'Com mutex (região crítica)',
    shared: { x: 0 }, locks: { m: null },
    threads: [0, 1].map(k => ({ nome: `T${k + 1}`, code: [['lock', 'm'], ['load', 'r', 'x'], ['add', 'r', 1], ['store', 'x', 'r'], ['unlock', 'm'], ['lock', 'm'], ['load', 'r', 'x'], ['add', 'r', 1], ['store', 'x', 'r'], ['unlock', 'm']] })),
    expect: s => `x = ${s.vars.x} (esperado: 4)`,
  },
  produtor: {
    nome: 'Produtor-consumidor com semáforos',
    shared: {}, sems: { vazio: 2, cheio: 0, mutex: 1 }, buffer: 2,
    threads: [
      { nome: 'Produtor', code: [['wait', 'vazio'], ['wait', 'mutex'], ['produce'], ['signal', 'mutex'], ['signal', 'cheio'], ['wait', 'vazio'], ['wait', 'mutex'], ['produce'], ['signal', 'mutex'], ['signal', 'cheio'], ['wait', 'vazio'], ['wait', 'mutex'], ['produce'], ['signal', 'mutex'], ['signal', 'cheio']] },
      { nome: 'Consumidor', code: [['wait', 'cheio'], ['wait', 'mutex'], ['consume'], ['signal', 'mutex'], ['signal', 'vazio'], ['wait', 'cheio'], ['wait', 'mutex'], ['consume'], ['signal', 'mutex'], ['signal', 'vazio'], ['wait', 'cheio'], ['wait', 'mutex'], ['consume'], ['signal', 'mutex'], ['signal', 'vazio']] },
    ],
    expect: s => `consumidos: ${s.consumed.join(', ') || '—'}`,
  },
  deadlock: {
    nome: 'Deadlock: dois mutexes em ordem trocada',
    shared: { x: 0 }, locks: { A: null, B: null },
    threads: [
      { nome: 'T1', code: [['lock', 'A'], ['lock', 'B'], ['add', 'r', 1], ['unlock', 'B'], ['unlock', 'A']] },
      { nome: 'T2', code: [['lock', 'B'], ['lock', 'A'], ['add', 'r', 1], ['unlock', 'A'], ['unlock', 'B']] },
    ],
    expect: () => 'as duas terminaram',
  },
};

export const showInstr = ins => {
  const [op, a, b] = ins;
  return { load: `${a} = ${b}`, add: `${a} = ${a} + ${b}`, store: `${a} = ${b}`, lock: `lock(${a})`, unlock: `unlock(${a})`, wait: `wait(${a})`, signal: `signal(${a})`, produce: 'insere item', consume: 'remove item' }[op];
};

export function initState(prog) {
  return {
    vars: { ...prog.shared }, locks: { ...(prog.locks ?? {}) }, sems: { ...(prog.sems ?? {}) },
    buf: [], produced: 0, consumed: [],
    th: prog.threads.map(() => ({ pc: 0, regs: { r: 0 } })),
    log: [],
  };
}

/** A thread k pode executar a próxima instrução agora? */
export function canRun(prog, st, k) {
  const t = st.th[k], ins = prog.threads[k].code[t.pc];
  if (!ins) return false;
  if (ins[0] === 'lock') return st.locks[ins[1]] == null || st.locks[ins[1]] === k;
  if (ins[0] === 'wait') return st.sems[ins[1]] > 0;
  return true;
}

export function step(prog, st, k) {
  const s = structuredClone(st);
  const t = s.th[k], ins = prog.threads[k].code[t.pc], nome = prog.threads[k].nome;
  const [op, a, b] = ins;
  let msg;
  switch (op) {
    case 'load': t.regs[a] = s.vars[b]; msg = `${nome} lê ${b} = ${s.vars[b]} para o seu registrador.`; break;
    case 'add': t.regs[a] += b; msg = `${nome} soma ${b} no registrador (agora ${t.regs[a]}), sem tocar na memória.`; break;
    case 'store': s.vars[a] = t.regs[b]; msg = `${nome} escreve ${a} = ${t.regs[b]} na memória.`; break;
    case 'lock': s.locks[a] = k; msg = `${nome} adquire o mutex ${a}.`; break;
    case 'unlock': s.locks[a] = null; msg = `${nome} libera o mutex ${a}.`; break;
    case 'wait': s.sems[a]--; msg = `${nome}: wait(${a}) decrementa para ${s.sems[a]}.`; break;
    case 'signal': s.sems[a]++; msg = `${nome}: signal(${a}) incrementa para ${s.sems[a]}.`; break;
    case 'produce': s.produced++; s.buf.push(s.produced); msg = `${nome} insere o item ${s.produced} no buffer.`; break;
    case 'consume': { const it = s.buf.shift(); s.consumed.push(it); msg = `${nome} remove o item ${it} do buffer.`; break; }
  }
  t.pc++;
  s.log.push({ k, pc: t.pc - 1, msg });
  return s;
}

export const finished = (prog, st) => st.th.every((t, k) => t.pc >= prog.threads[k].code.length);
export const deadlocked = (prog, st) => !finished(prog, st) && prog.threads.every((_, k) => !canRun(prog, st, k));

/** Explora todas as intercalações e conta os resultados finais (e deadlocks). */
export function exploreAll(prog, result = st => st.vars.x) {
  const counts = new Map();
  let total = 0, dead = 0;
  const rec = st => {
    if (finished(prog, st)) { total++; const r = result(st); counts.set(r, (counts.get(r) ?? 0) + 1); return; }
    let any = false;
    for (let k = 0; k < prog.threads.length; k++) if (canRun(prog, st, k)) { any = true; rec(step(prog, st, k)); }
    if (!any) { total++; dead++; }
  };
  rec(initState(prog));
  return { counts: [...counts.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)), total, dead };
}

// ---------- Algoritmo do banqueiro ----------

export const BANKER_CODE = `def seguro(disp, aloc, nec):
    trab = disp[:]                           # recursos livres agora
    fim = [False] * n
    seq = []
    while len(seq) < n:
        for i in range(n):
            if not fim[i] and nec[i] <= trab:     # Pi consegue terminar
                trab = trab + aloc[i]             # ... e devolve tudo
                fim[i] = True; seq.append(i)
                break
        else:
            return None                      # ninguém consegue: inseguro
    return seq                               # sequência segura

def pedido(i, req):
    if req > nec[i]: erro("pediu mais que o máximo")
    if req > disp: espera()                  # não há recursos agora
    finge_que_concede(i, req)
    if seguro(...) is None:
        desfaz(); espera()                   # concederia um estado inseguro
    else:
        concede()`;

const le = (a, b) => a.every((x, j) => x <= b[j]);
const plus = (a, b) => a.map((x, j) => x + b[j]);
const minus = (a, b) => a.map((x, j) => x - b[j]);
const vec = v => `(${v.join(', ')})`;

export function bankerSafety(disp, aloc, max) {
  const L = lineFinder(BANKER_CODE);
  const n = aloc.length;
  const nec = max.map((m, i) => minus(m, aloc[i]));
  let trab = [...disp];
  const fim = Array(n).fill(false), seq = [], steps = [];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, trab: [...trab], fim: [...fim], seq: [...seq], nec, aloc, max, disp, vars: { trabalho: vec(trab), sequência: seq.map(i => `P${i}`).join(' ') || '—' }, ...extra });
  snap(L('trab = disp[:]'), `Necessidade = Máximo − Alocado. Começamos com trabalho = disponível = ${vec(disp)} e procuramos um processo cuja necessidade caiba nele.`);
  while (seq.length < n) {
    let found = -1;
    for (let i = 0; i < n; i++) {
      if (fim[i]) continue;
      const ok = le(nec[i], trab);
      snap(L('if not fim[i] and nec[i] <= trab'), ok ? `P${i}: necessidade ${vec(nec[i])} ≤ ${vec(trab)}. Ele consegue terminar!` : `P${i}: necessidade ${vec(nec[i])} não cabe em ${vec(trab)}.`, { cur: i, ok });
      if (ok) { found = i; break; }
    }
    if (found < 0) {
      snap(L('return None'), `Nenhum processo restante consegue terminar com ${vec(trab)}: o estado é <b>inseguro</b> (pode levar a deadlock).`, { done: true, safe: false });
      return { steps, seq: null };
    }
    trab = plus(trab, aloc[found]);
    fim[found] = true; seq.push(found);
    snap(L('trab = trab + aloc[i]'), `P${found} termina e devolve o que tinha ${vec(aloc[found])}: trabalho = <b>${vec(trab)}</b>.`, { cur: found, ok: true });
  }
  snap(L('return seq'), `Estado <b>seguro</b>: a sequência ${seq.map(i => `P${i}`).join(', ')} deixa todos terminarem, mesmo que cada um peça o seu máximo.`, { done: true, safe: true });
  return { steps, seq };
}

export function bankerRequest(disp, aloc, max, i, req) {
  const nec = max.map((m, k) => minus(m, aloc[k]));
  if (!le(req, nec[i])) return { granted: false, reason: 'excede a necessidade declarada' };
  if (!le(req, disp)) return { granted: false, reason: 'não há recursos disponíveis agora: o processo espera' };
  const aloc2 = aloc.map((a, k) => (k === i ? plus(a, req) : [...a]));
  const r = bankerSafety(minus(disp, req), aloc2, max);
  return r.seq ? { granted: true, seq: r.seq, disp: minus(disp, req), aloc: aloc2 } : { granted: false, reason: 'o estado resultante seria inseguro: o processo espera' };
}

export const BANKER_EXAMPLE = {
  // Silberschatz, Operating System Concepts, seção do algoritmo do banqueiro
  recursos: ['A', 'B', 'C'],
  disp: [3, 3, 2],
  aloc: [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]],
  max: [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]],
};

// ---------- Substituição de páginas ----------

export const PAGING_CODE = `def substitui(refs, quadros, algoritmo):
    memoria, faltas = [], 0
    for i, p in enumerate(refs):
        if p in memoria:
            acerto(p)                        # LRU: atualiza o uso; relógio: bit = 1
            continue
        faltas += 1                          # falta de página
        if len(memoria) < quadros:
            memoria.append(p)                # ainda há quadro livre
        else:
            v = vitima(memoria, algoritmo)   # FIFO, LRU, ótimo ou relógio
            memoria[memoria.index(v)] = p
    return faltas`;

export const PAGING = { fifo: 'FIFO', lru: 'LRU', otimo: 'Ótimo (OPT)', relogio: 'Relógio (2ª chance)' };

export function paging(refs, nf, alg) {
  const L = lineFinder(PAGING_CODE);
  const frames = Array(nf).fill(null);
  const loaded = Array(nf).fill(-1), used = Array(nf).fill(-1), bit = Array(nf).fill(0);
  let hand = 0, faults = 0, fifoPtr = 0;
  const steps = [], cols = [];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, frames: [...frames], bit: [...bit], hand, faults, cols: cols.map(c => ({ ...c, frames: [...c.frames] })), vars: { faltas: faults, quadros: frames.map(f => f ?? '·').join(' ') }, ...extra });
  refs.forEach((p, i) => {
    const at = frames.indexOf(p);
    if (at >= 0) {
      used[at] = i; bit[at] = 1;
      cols.push({ p, frames: [...frames], fault: false, slot: at });
      snap(L('acerto(p)'), `Página ${p} já está no quadro ${at}: <b>acerto</b>.${alg === 'lru' ? ' Vira a mais recentemente usada.' : alg === 'relogio' ? ' Seu bit de referência vai para 1.' : ''}`, { i, hit: at });
      return;
    }
    faults++;
    let slot = frames.indexOf(null), why;
    if (slot >= 0) {
      why = `quadro ${slot} livre`;
    } else if (alg === 'fifo') {
      slot = fifoPtr; why = `FIFO tira a que está há mais tempo na memória (página ${frames[slot]}, carregada no passo ${loaded[slot] + 1})`;
    } else if (alg === 'lru') {
      slot = used.indexOf(Math.min(...used)); why = `LRU tira a usada há mais tempo (página ${frames[slot]}, último uso no passo ${used[slot] + 1})`;
    } else if (alg === 'otimo') {
      const next = frames.map(f => { const n = refs.indexOf(f, i + 1); return n < 0 ? Infinity : n; });
      slot = next.indexOf(Math.max(...next));
      why = next[slot] === Infinity ? `o ótimo tira a página ${frames[slot]}, que nunca mais será usada` : `o ótimo tira a página ${frames[slot]}, que só volta a ser usada no passo ${next[slot] + 1} (a mais distante)`;
    } else {
      const passed = [];
      while (bit[hand]) { bit[hand] = 0; passed.push(frames[hand]); hand = (hand + 1) % nf; }
      slot = hand; hand = (hand + 1) % nf;
      why = `${passed.length ? `o ponteiro dá segunda chance a ${passed.join(', ')} (zera o bit) e ` : ''}o relógio tira a página ${frames[slot]}, com bit 0`;
    }
    const victim = frames[slot];
    frames[slot] = p; loaded[slot] = i; used[slot] = i; bit[slot] = 1;
    if (alg === 'fifo' && victim != null) fifoPtr = (fifoPtr + 1) % nf;   // os quadros enchem em ordem, então a fila começa no 0
    if (alg === 'relogio' && victim == null) hand = (slot + 1) % nf;
    cols.push({ p, frames: [...frames], fault: true, slot, victim });
    snap(L(victim == null ? 'memoria.append(p)' : 'v = vitima'), `Página ${p}: <b>falta</b> (${faults}ª). ${victim == null ? `Vai para o ${why}.` : `Substituição: ${why}.`}`, { i, fault: slot, victim });
  });
  snap(L('return faltas'), `Fim: <b>${faults} faltas</b> em ${refs.length} referências (taxa de ${(100 * faults / refs.length).toFixed(0)}%).`, { done: true });
  return { steps, faults };
}

export const faultsOf = (refs, nf, alg) => paging(refs, nf, alg).faults;

export const REF_EXAMPLES = {
  silberschatz: { nome: 'Silberschatz (20 referências)', refs: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], frames: 3 },
  belady: { nome: 'Anomalia de Belady', refs: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], frames: 3 },
  laco: { nome: 'Laço maior que a memória', refs: [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4], frames: 3 },
};
