import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../engine/random.js';
import { lineFinder } from '../engine/highlight.js';
import { CODE, MUNDO, L_OCC, L_FREE, raycast, bresenham, novaGrade, atualiza, prob, trajetoria, passosMapeamento, celula, dentro } from '../optativas/robotica-movel/visualizacoes/robotica.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);

test('raycast acha a primeira parede', () => {
  close(raycast(1, 1, 0, MUNDO.segs, 20), 3);            // parede interna em x = 4
  close(raycast(1, 1, Math.PI, MUNDO.segs, 20), 1);      // parede externa em x = 0
  close(raycast(1, 4, 0, MUNDO.segs, 20), 5.6 - 0.45);   // passa pela porta e bate no pilar
  assert.equal(raycast(1, 1, 0, MUNDO.segs, 2), null);    // fora do alcance
});

test('bresenham: vizinhança 8, sem buracos, fim opcional', () => {
  const c = bresenham(0, 0, 7, 3, true);
  assert.deepEqual(c[0], [0, 0]);
  assert.deepEqual(c.at(-1), [7, 3]);
  for (let k = 1; k < c.length; k++) assert.ok(Math.max(Math.abs(c[k][0] - c[k - 1][0]), Math.abs(c[k][1] - c[k - 1][1])) === 1);
  assert.equal(bresenham(0, 0, 7, 3).length, c.length - 1);
});

test('log-odds: ocupado e livre são simétricos, e é por isso que o bug anulava as paredes', () => {
  close(L_OCC + L_FREE, 0);
  close(prob(L_OCC), 0.85);
  const g = novaGrade(MUNDO, 0.5), pose = { x: 1, y: 1, th: 0 };
  atualiza(g, pose, [{ ang: 0, d: 3 }], { alcance: 5 });
  const [i, j] = celula(g, 4, 1);
  close(prob(g.l[j * g.nx + i]), 0.85);
  const g2 = novaGrade(MUNDO, 0.5);
  atualiza(g2, pose, [{ ang: 0, d: 3 }], { alcance: 5, corrigido: false });
  close(g2.l[j * g2.nx + i], 0);
});

test('trajetória fica dentro da sala e longe das paredes', () => {
  for (const p of trajetoria(80)) {
    assert.ok(p.x > 0.5 && p.x < MUNDO.W - 0.5 && p.y > 0.5 && p.y < MUNDO.H - 0.5);
    for (let a = 0; a < 2 * Math.PI; a += 0.2) assert.ok((raycast(p.x, p.y, a, MUNDO.segs, 99) ?? 99) > 0.15, `pose (${p.x}, ${p.y}) encosta numa parede`);
  }
});

test('o mapa corrigido acha as paredes; o original não acha nenhuma', () => {
  const ult = o => o.at(-1).vars['paredes achadas'];
  const bom = passosMapeamento({ r: rng(1) }), ruim = passosMapeamento({ r: rng(1), corrigido: false });
  assert.ok(parseInt(ult(bom)) >= 50, ult(bom));
  assert.equal(ult(ruim), '0%');
  const L = lineFinder(CODE);
  for (const p of bom) assert.ok(p.line > 0);
  assert.ok(L('break') > 0);
});

test('ruído não quebra o mapeamento', () => {
  const p = passosMapeamento({ r: rng(4), ruido: 0.05 }).at(-1);
  assert.ok(parseInt(p.vars['paredes achadas']) >= 40, p.vars['paredes achadas']);
  assert.ok(p.l.every(Number.isFinite));
  assert.ok(dentro({ nx: 2, ny: 2 }, 1, 1) && !dentro({ nx: 2, ny: 2 }, 2, 0));
});
