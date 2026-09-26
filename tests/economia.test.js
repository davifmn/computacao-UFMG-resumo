import { test } from 'node:test';
import assert from 'node:assert/strict';
import { market, equilibrium } from '../periodo-01/introducao-a-economia/visualizacoes/mercado.js';

const m = { A: 100, B: 1, C: 10, D: 1 };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test('equilíbrio de mercado', () => {
  const eq = equilibrium(m);
  close(eq.Q, 45);
  close(eq.P, 55);
});

test('livre mercado: sem peso morto, excedentes corretos', () => {
  const r = market(m);
  close(r.CS, 0.5 * 45 * 45);
  close(r.PS, 0.5 * 45 * 45);
  close(r.DWL, 0);
});

test('imposto: cunha, arrecadação e peso morto', () => {
  const r = market(m, { type: 'tax', t: 20 });
  close(r.Q, 35);
  close(r.Pc - r.Ps, 20);
  close(r.T, 20 * 35);
  close(r.DWL, 0.5 * 20 * 10);
  // conservação: bem-estar com imposto + peso morto = bem-estar sem imposto
  close(r.total + r.DWL, market(m).total);
});

test('preço máximo gera escassez; mínimo gera excedente', () => {
  const c = market(m, { type: 'ceiling', p: 40 });
  assert.equal(c.gap.kind, 'escassez');
  close(c.gap.Qd - c.gap.Qs, 60 - 30);
  const f = market(m, { type: 'floor', p: 70 });
  assert.equal(f.gap.kind, 'excedente');
  close(f.gap.Qs - f.gap.Qd, 60 - 30);
  assert.equal(market(m, { type: 'ceiling', p: 80 }).binding, false);
});

test('incidência: lado menos elástico paga mais', () => {
  // Demanda íngreme (B = 3): consumidores inelásticos pagam 3/3,5 do imposto.
  const r = market({ A: 200, B: 3, C: 10, D: 0.5 }, { type: 'tax', t: 10 });
  close(r.consumerShare, 3 / 3.5);
  const semImposto = market({ A: 200, B: 3, C: 10, D: 0.5 });
  close((r.Pc - semImposto.Pc) / 10, r.consumerShare);  // confere com o preço efetivamente pago
});
