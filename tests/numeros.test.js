import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toBaseSteps, toDecimalSteps, isValidInBase, toBits, interpretations, addBits, negateTwos,
  floatToBits, decodeFloat, exactDecimal,
} from '../periodo-01/introducao-a-computacao/visualizacoes/numeros.js';

test('conversão de base ida e volta', () => {
  for (let n = 0; n <= 600; n += 13) {
    for (const b of [2, 3, 8, 12, 16]) {
      const s = toBaseSteps(n, b).at(-1).result;
      assert.equal(s, n.toString(b).toUpperCase());
      assert.equal(toDecimalSteps(s, b).at(-1).valor, n);
    }
  }
});

test('validação de dígitos por base', () => {
  assert.ok(isValidInBase('1011', 2));
  assert.ok(!isValidInBase('102', 2));
  assert.ok(isValidInBase('ff', 16));
  assert.ok(!isValidInBase('', 10));
});

test('interpretações de 8 bits', () => {
  const it = interpretations([1, 1, 1, 1, 1, 1, 1, 1]);
  assert.equal(it.unsigned, 255);
  assert.equal(it.twosComplement, -1);
  assert.equal(it.signMagnitude, -127);
  assert.ok(Object.is(it.onesComplement, -0));
  assert.equal(interpretations(toBits(-128, 8)).twosComplement, -128);
});

test('negação em complemento de 2', () => {
  for (let x = -127; x <= 127; x++) {
    assert.equal(interpretations(negateTwos(toBits(x, 8)).sum).twosComplement, -x || 0);
  }
  // o menor valor é o próprio oposto
  assert.equal(interpretations(negateTwos(toBits(-128, 8)).sum).twosComplement, -128);
});

test('soma e detecção de overflow', () => {
  for (let a = -128; a < 128; a += 7) {
    for (let b = -128; b < 128; b += 11) {
      const r = addBits(toBits(a, 8), toBits(b, 8));
      const got = interpretations(r.sum).twosComplement;
      const real = a + b;
      assert.equal(r.overflow, real < -128 || real > 127, `${a} + ${b}`);
      if (!r.overflow) assert.equal(got, real);
    }
  }
});

test('IEEE 754: campos e valor exato', () => {
  const d = decodeFloat(floatToBits(-2.5));
  assert.equal(d.sign, 1);
  assert.equal(d.e - 127, 1);
  assert.equal(d.exact, '-2,5');
  assert.equal(decodeFloat(floatToBits(0.1)).exact, '0,100000001490116119384765625');
  assert.equal(decodeFloat(floatToBits(16777217)).value, 16777216);
  assert.equal(decodeFloat(floatToBits(Infinity)).kind, 'infinito');
  assert.equal(decodeFloat(floatToBits(NaN)).kind, 'NaN');
  assert.equal(decodeFloat(floatToBits(1e-45)).kind, 'subnormal');
});

test('expansão decimal exata', () => {
  assert.equal(exactDecimal(1n, -1), '0,5');
  assert.equal(exactDecimal(3n, -3), '0,375');
  assert.equal(exactDecimal(5n, 2), '20');
});
