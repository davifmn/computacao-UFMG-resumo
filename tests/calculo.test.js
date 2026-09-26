import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, compile, derive, simplify, toTex, numericDerivative, riemann, simpson } from '../periodo-02/calculo-diferencial-e-integral-1/visualizacoes/expr.js';

const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

test('parser: precedência, multiplicação implícita e funções', () => {
  close(compile(parse('2x^2 + 3'))(2), 11);
  close(compile(parse('-x^2'))(3), -9);
  close(compile(parse('2^3^2'))(0), 512);
  close(compile(parse('sin(pi/2)'))(0), 1);
  close(compile(parse('x sin x'))(Math.PI / 2), Math.PI / 2);
  close(compile(parse('e^x'))(1), Math.E);
  close(compile(parse('x^(1/3)'))(-8), -2);
  assert.throws(() => parse('x +* 2'));
  assert.throws(() => parse('foo(x)'), /desconhecido/);
  assert.throws(() => parse('(x + 1'), /Faltou/);
});

test('derivada simbólica confere com a numérica', () => {
  const fs = ['x^2', 'x^3 - 3x', 'sin(x)', 'x^2 sin(x)', 'e^x', 'exp(x^2)', 'ln(x)', '1/x', 'sqrt(x)', 'sin(x)/x',
    'x^x', '2^x', 'cos(3x+1)', 'tan x', 'x^(1/3)', 'arctan(x)', 'ln(x^2+1)', 'sqrt(x^2 + 1)', 'x e^x', 'log(x)'];
  for (const src of fs) {
    const f = compile(parse(src)), d = compile(simplify(derive(parse(src))));
    for (const x of [0.4, 1.1, 2.3]) close(d(x), numericDerivative(f, x), 1e-4);
  }
});

test('simplificação deixa resultados legíveis', () => {
  const dtex = s => toTex(simplify(derive(parse(s))));
  assert.equal(dtex('x^2'), '2 x');
  assert.equal(dtex('3x^2 + 2x + 1'), '6 x + 2');
  assert.equal(dtex('1/x'), '-\\frac{1}{x^{2}}');
  assert.equal(dtex('sin(x)'), '\\cos x');
  assert.equal(dtex('tan x'), '\\frac{1}{\\left(\\cos x\\right)^{2}}');
  assert.equal(dtex('sqrt(x^2+1)'), '\\frac{x}{\\sqrt{x^{2} + 1}}');
  assert.ok(!toTex(parse('pi x')).includes('\\pix'));
});

test('somas de Riemann convergem com as ordens esperadas', () => {
  const f = x => x * x, exact = 8 / 3;
  const err = (n, m) => Math.abs(riemann(f, 0, 2, n, m).sum - exact);
  close(err(100, 'esquerda') / err(200, 'esquerda'), 2, 0.05);
  close(err(100, 'meio') / err(200, 'meio'), 4, 0.05);
  close(err(100, 'trapezio') / err(200, 'trapezio'), 4, 0.05);
  close(simpson(Math.sin, 0, Math.PI), 2, 1e-8);
});
