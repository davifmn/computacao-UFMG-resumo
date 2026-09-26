// Modelo linear de oferta e demanda (funções puras, testadas em tests/).
//
//   Demanda (inversa): P = A − B·Q     (A = preço máximo que alguém pagaria)
//   Oferta  (inversa): P = C + D·Q     (C = preço mínimo para alguém produzir)
//
// Política: { type: 'none' } | { type: 'tax', t } | { type: 'ceiling', p } | { type: 'floor', p }

export const demandP = (m, q) => m.A - m.B * q;
export const supplyP = (m, q) => m.C + m.D * q;
export const demandQ = (m, p) => Math.max(0, (m.A - p) / m.B);
export const supplyQ = (m, p) => Math.max(0, (p - m.C) / m.D);

export function equilibrium(m) {
  const Q = Math.max(0, (m.A - m.C) / (m.B + m.D));
  return { Q, P: demandP(m, Q) };
}

const tri = pts => {
  // Área de polígono (fórmula do cadarço), sempre positiva.
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
};

export function market(m, policy = { type: 'none' }) {
  const eq = equilibrium(m);
  const out = {
    eq, Q: eq.Q, Pc: eq.P, Ps: eq.P,
    polys: { cs: [], ps: [], tax: [], dwl: [] },
    gap: null, binding: false,
  };
  const { polys } = out;

  if (policy.type === 'tax' && policy.t > 0) {
    const t = policy.t;
    const Q = Math.max(0, (m.A - m.C - t) / (m.B + m.D));
    const Pc = demandP(m, Q), Ps = Pc - t;
    Object.assign(out, { Q, Pc, Ps, binding: true });
    polys.cs = [[0, m.A], [0, Pc], [Q, Pc]];
    polys.ps = [[0, m.C], [0, Ps], [Q, Ps]];
    polys.tax = [[0, Ps], [0, Pc], [Q, Pc], [Q, Ps]];
    polys.dwl = [[Q, Pc], [eq.Q, eq.P], [Q, Ps]];
  } else if (policy.type === 'ceiling' && policy.p < eq.P) {
    const p = policy.p;
    const Qs = supplyQ(m, p), Qd = demandQ(m, p);
    const Q = Qs;
    Object.assign(out, { Q, Pc: p, Ps: p, binding: true, gap: { kind: 'escassez', Qs, Qd, p } });
    polys.cs = [[0, m.A], [Q, demandP(m, Q)], [Q, p], [0, p]];
    polys.ps = [[0, m.C], [Q, p], [0, p]];
    polys.dwl = [[Q, demandP(m, Q)], [eq.Q, eq.P], [Q, p]];
  } else if (policy.type === 'floor' && policy.p > eq.P) {
    const p = policy.p;
    const Qs = supplyQ(m, p), Qd = demandQ(m, p);
    const Q = Qd;
    Object.assign(out, { Q, Pc: p, Ps: p, binding: true, gap: { kind: 'excedente', Qs, Qd, p } });
    polys.cs = [[0, m.A], [0, p], [Q, p]];
    polys.ps = [[0, m.C], [Q, supplyP(m, Q)], [Q, p], [0, p]];
    polys.dwl = [[Q, p], [eq.Q, eq.P], [Q, supplyP(m, Q)]];
  } else {
    polys.cs = [[0, m.A], [0, eq.P], [eq.Q, eq.P]];
    polys.ps = [[0, m.C], [0, eq.P], [eq.Q, eq.P]];
  }
  out.CS = tri(polys.cs);
  out.PS = tri(polys.ps);
  out.T = polys.tax.length ? tri(polys.tax) : 0;
  out.DWL = polys.dwl.length ? tri(polys.dwl) : 0;
  out.total = out.CS + out.PS + out.T;
  // Elasticidades-preço no equilíbrio original (ponto): ε = (dQ/dP)·(P/Q)
  out.Ed = eq.Q > 0 ? -(1 / m.B) * (eq.P / eq.Q) : -Infinity;
  out.Es = eq.Q > 0 ? (1 / m.D) * (eq.P / eq.Q) : Infinity;
  // Incidência do imposto: Pc = A − B·Q com Q = (A − C − t)/(B + D), logo dPc/dt = B/(B + D).
  // Demanda mais íngreme (B grande = consumidor inelástico) ⇒ consumidor paga mais.
  out.consumerShare = m.B / (m.B + m.D);
  return out;
}
