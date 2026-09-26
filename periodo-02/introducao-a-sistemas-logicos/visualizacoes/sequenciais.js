// Circuitos sequenciais: latch SR, latch D × flip-flop D e contador síncrono.
// Funções puras; o "tempo" é discreto (uma lista de instantes).

/**
 * Latch SR com duas portas NOR em realimentação:  Q = NOR(R, Q̄),  Q̄ = NOR(S, Q).
 * Itera até estabilizar a partir do estado anterior (é a memória!).
 */
export function srLatch(S, R, prevQ) {
  let q = prevQ, qn = prevQ ^ 1;
  for (let i = 0; i < 4; i++) {
    const nq = (R | qn) ^ 1;
    const nqn = (S | q) ^ 1;
    if (nq === q && nqn === qn) break;
    q = nq; qn = nqn;
  }
  const state = S && R ? 'proibido' : S ? 'set' : R ? 'reset' : 'mantém';
  return { Q: q, Qn: qn, state };
}

/** Relógio quadrado: `period` instantes por ciclo, começando em 0. */
export const clock = (length, period = 8) => Array.from({ length }, (_, t) => (t % period >= period / 2 ? 1 : 0));

/**
 * Latch D (sensível ao NÍVEL): transparente enquanto clk = 1 (Q segue D), guarda quando clk = 0.
 * Flip-flop D (sensível à BORDA de subida): Q só muda no instante em que clk passa de 0 para 1.
 */
export function timing(clk, d, q0 = 0) {
  const latch = [], ff = [];
  let ql = q0, qf = q0;
  for (let t = 0; t < clk.length; t++) {
    if (clk[t]) ql = d[t];
    if (clk[t] && (t === 0 ? 0 : clk[t - 1]) === 0) qf = d[t];
    latch.push(ql);
    ff.push(qf);
  }
  return { latch, ff };
}

/**
 * Contador síncrono de n bits com flip-flops T: o bit i inverte quando
 * todos os bits abaixo dele valem 1  (T0 = 1, T1 = Q0, T2 = Q0·Q1, ...).
 */
export function counterNext(q, { down = false } = {}) {
  const n = q.length;               // q[0] é o bit menos significativo
  const T = [];
  let all = 1;
  for (let i = 0; i < n; i++) {
    T.push(all);
    all &= down ? q[i] ^ 1 : q[i];  // contagem regressiva: inverte quando os de baixo são 0
  }
  return { next: q.map((b, i) => b ^ T[i]), T };
}

export const bitsToInt = q => q.reduce((acc, b, i) => acc + (b << i), 0);
