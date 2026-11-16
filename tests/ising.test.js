import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../engine/random.js';
import { TC, criarRede, deltaE, energia, magnetizacao, varredura, medir, mExata, passosMetropolis, CODE } from '../periodo-03/probabilidade/visualizacoes/ising.js';
import { lineFinder } from '../engine/highlight.js';

test('energia e ΔE batem com a definição', () => {
  const L = 6, r = rng(3), s = criarRede(L, r);
  for (let k = 0; k < 50; k++) {
    const i = k % L, j = (k * 7) % L;
    const antes = energia(s, L), d = deltaE(s, L, i, j);
    s[i * L + j] *= -1;
    assert.equal(energia(s, L) - antes, d);
  }
  const cima = criarRede(L, r, 'cima');
  assert.equal(energia(cima, L), -2 * L * L); // estado fundamental: 2 ligações por spin
  assert.equal(magnetizacao(cima), L * L);
});

test('temperatura crítica de Onsager', () => {
  assert.ok(Math.abs(TC - 2.269185) < 1e-5);
  assert.equal(mExata(3), 0);
  assert.ok(mExata(1.5) > 0.98 && mExata(2.2) < 0.8);
});

test('frio ordena, quente desordena', () => {
  const r = rng(11);
  const frio = medir(12, 1.5, { termalizacao: 150, medidas: 150, r });
  const quente = medir(12, 4.0, { termalizacao: 150, medidas: 150, r });
  assert.ok(frio.m > 0.95, `m(1,5) = ${frio.m}`);
  assert.ok(quente.m < 0.3, `m(4) = ${quente.m}`);
  assert.ok(frio.e < quente.e, 'a energia por spin CRESCE com a temperatura');
  assert.ok(Math.abs(frio.e - -2) < 0.1);
});

test('calor específico tem pico perto de Tc', () => {
  const r = rng(5);
  const Ts = [1.5, 2.0, 2.3, 2.6, 3.2];
  const cs = Ts.map(T => medir(12, T, { termalizacao: 200, medidas: 400, r }).c);
  const pico = Ts[cs.indexOf(Math.max(...cs))];
  assert.ok(pico >= 2.0 && pico <= 2.6, `pico em ${pico}: ${cs.map(c => c.toFixed(2))}`);
});

test('varredura aceita mais viradas no quente', () => {
  const r = rng(9), L = 16;
  const a = criarRede(L, r, 'cima'), b = criarRede(L, r);
  assert.ok(varredura(a, L, 1.0, r) < varredura(b, L, 5.0, r));
});

test('passos de Metropolis: linhas existem e estados são consistentes', () => {
  const L = lineFinder(CODE);
  assert.ok(L('dE = 2 * S * vizinhos') > 0 && L('lattice[i, j] = -S') > 0);
  const passos = passosMetropolis(6, 2.0, 40, rng(2));
  for (const p of passos) assert.equal(p.E, energia(p.rede, 6));
  assert.ok(passos.some(p => p.aceito === false) && passos.some(p => p.aceito === true));
});
