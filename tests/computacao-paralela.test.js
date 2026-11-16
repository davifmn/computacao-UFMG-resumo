import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../engine/random.js';
import { lineFinder } from '../engine/highlight.js';
import { CODES, EXEMPLO, beneficio, otimo, passosGaussSeidel, passosJacobi } from '../optativas/computacao-paralela/visualizacoes/leilao.js';

const aleatoria = (n, r) => Array.from({ length: n }, () => Array.from({ length: n }, () => 1 + Math.floor(r() * 9)));
const perfeita = t => new Set(t).size === t.length && t.every(x => x >= 0);

test('força bruta', () => {
  assert.equal(otimo([[1, 2], [3, 1]]).valor, 5);
  assert.deepEqual(otimo([[1, 2], [3, 1]]).tarefa, [1, 0]);
});

test('Gauss-Seidel e Jacobi chegam ao ótimo com ε < 1/n', () => {
  const r = rng(7);
  for (let k = 0; k < 300; k++) {
    const n = 2 + (k % 4), c = aleatoria(n, r), eps = 1 / (n + 1), o = otimo(c).valor;
    for (const passos of [passosGaussSeidel(c, eps), passosJacobi(c, eps)]) {
      const fim = passos.at(-1);
      assert.ok(perfeita(fim.tarefa));
      assert.equal(beneficio(c, fim.tarefa), o, JSON.stringify(c));
    }
  }
});

test('o exemplo mostra o bug da soma de lances', () => {
  const eps = 1 / 5;
  const ruim = passosJacobi(EXEMPLO, eps, { soma: true }).at(-1);
  assert.ok(perfeita(ruim.tarefa));
  assert.ok(beneficio(EXEMPLO, ruim.tarefa) < otimo(EXEMPLO).valor);
});

test('ε grande pode errar, mas no máximo n·ε', () => {
  const r = rng(3);
  for (let k = 0; k < 200; k++) {
    const c = aleatoria(4, r), eps = 2;
    const b = beneficio(c, passosGaussSeidel(c, eps).at(-1).tarefa);
    assert.ok(b >= otimo(c).valor - 4 * eps);
  }
});

test('todas as linhas referenciadas existem', () => {
  for (const code of Object.values(CODES)) assert.ok(lineFinder(code)('while (existe trabalhador livre)') > 0);
  for (const p of [...passosGaussSeidel(EXEMPLO, 0.2), ...passosJacobi(EXEMPLO, 0.2), ...passosJacobi(EXEMPLO, 0.2, { soma: true })]) assert.ok(p.line > 0);
});
