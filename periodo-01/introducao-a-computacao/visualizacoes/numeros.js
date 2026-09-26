// Representação de números: mudança de base, inteiros com sinal e IEEE 754.
// Funções puras (sem DOM) — testadas em tests/numeros.test.js.

import { lineFinder } from '../../../engine/highlight.js';

export const DIGITS = '0123456789ABCDEF';

// ======================================================================
// Mudança de base
// ======================================================================

export const TO_BASE_CODE = `def converte(n, base):
    digitos = "0123456789ABCDEF"
    resultado = ""
    while n > 0:
        resto = n % base
        resultado = digitos[resto] + resultado
        n = n // base
    return resultado or "0"`;

export const TO_DEC_CODE = `def para_decimal(s, base):
    valor = 0
    for c in s:
        d = int(c, base)            # valor do dígito
        valor = valor * base + d    # "desloca" e soma
    return valor`;

/** Divisões sucessivas: decimal → base b. */
export function toBaseSteps(n, base) {
  const L = lineFinder(TO_BASE_CODE);
  const steps = [];
  const rows = [];
  let res = '';
  const snap = (line, msg, extra = {}) => steps.push({
    mode: 'toBase', line, msg, base, n0: n, rows: rows.map(r => ({ ...r })), result: res, ...extra,
    vars: { n: extra.n ?? cur, base, resultado: `"${res}"`, ...(extra.resto != null ? { resto: extra.resto } : {}) },
  });
  let cur = n;
  snap(L('def converte'), `Converter <b>${n}</b> para a base <b>${base}</b> pelo método das <b>divisões sucessivas</b>: dividimos por ${base} até o quociente chegar a zero; os restos são os dígitos.`);
  while (cur > 0) {
    snap(L('while n > 0'), `n = ${cur} > 0, então continuamos.`);
    const q = Math.floor(cur / base), r = cur % base;
    rows.push({ n: cur, q, r, digit: DIGITS[r] });
    snap(L('resto = n % base'), `${cur} ÷ ${base} = ${q}, resto <b>${r}</b>${base > 10 && r > 9 ? ` (dígito <b>${DIGITS[r]}</b>)` : ''}.`, { resto: r, active: rows.length - 1 });
    res = DIGITS[r] + res;
    snap(L('resultado = digitos'), `O resto entra na <b>frente</b> do resultado: o primeiro resto é o dígito <b>menos significativo</b>.`, { resto: r, active: rows.length - 1 });
    cur = q;
    snap(L('n = n // base'), `n = ${q} (divisão inteira).`, { n: q });
  }
  snap(L('while n > 0'), `n = 0: acabou.`);
  res = res || '0';
  snap(L('return resultado'), `Lendo os restos <b>de baixo para cima</b>: ${n}₁₀ = <b>${res}</b>₍${base}₎.`, { done: true });
  return steps;
}

/** Método de Horner: base b → decimal. */
export function toDecimalSteps(s, base) {
  const L = lineFinder(TO_DEC_CODE);
  const steps = [];
  const digits = s.toUpperCase().split('');
  let valor = 0;
  const partial = [];
  const snap = (line, msg, extra = {}) => steps.push({
    mode: 'toDec', line, msg, base, digits, valor, partial: [...partial], ...extra,
    vars: { base, valor, ...(extra.c != null ? { c: `"${extra.c}"`, d: extra.d } : {}) },
  });
  snap(L('def para_decimal'), `Converter <b>${s.toUpperCase()}</b>₍${base}₎ para decimal. Em notação posicional, cada casa vale ${base} vezes a casa à sua direita.`);
  snap(L('valor = 0'), 'Começamos com valor = 0.');
  digits.forEach((c, i) => {
    const d = DIGITS.indexOf(c);
    snap(L('for c in s'), `Próximo dígito: <b>${c}</b>.`, { i, c, d });
    snap(L('d = int(c, base)'), `O dígito ${c} vale ${d}.`, { i, c, d });
    const antes = valor;
    valor = valor * base + d;
    partial.push({ antes, d, valor });
    snap(L('valor = valor * base + d'), `valor = ${antes} × ${base} + ${d} = <b>${valor}</b>. Multiplicar por ${base} "empurra" tudo uma casa para a esquerda.`, { i, c, d });
  });
  snap(L('return valor'), `Resultado: ${s.toUpperCase()}₍${base}₎ = <b>${valor}</b>₁₀.`, { done: true });
  return steps;
}

export function isValidInBase(s, base) {
  return s.length > 0 && [...s.toUpperCase()].every(c => { const d = DIGITS.indexOf(c); return d >= 0 && d < base; });
}

/** Expansão posicional: "1011", 2 → [{digit:'1', value:1, power:3}, ...] */
export function positional(s, base) {
  const ds = s.toUpperCase().split('');
  return ds.map((c, i) => ({ digit: c, value: DIGITS.indexOf(c), power: ds.length - 1 - i, weight: base ** (ds.length - 1 - i) }));
}

// ======================================================================
// Inteiros com sinal (bits[0] é o bit MAIS significativo)
// ======================================================================

export const toBits = (x, n) => Array.from({ length: n }, (_, i) => ((BigInt.asUintN(n, BigInt(x)) >> BigInt(n - 1 - i)) & 1n) === 1n ? 1 : 0);
export const unsigned = bits => bits.reduce((acc, b) => acc * 2 + b, 0);

export function interpretations(bits) {
  const n = bits.length;
  const u = unsigned(bits);
  const rest = unsigned(bits.slice(1));
  const neg = bits[0] === 1;
  return {
    unsigned: u,
    signMagnitude: neg ? -rest : rest,                       // tem +0 e −0
    onesComplement: neg ? -(2 ** n - 1 - u) : u,              // tem +0 e −0
    twosComplement: neg ? u - 2 ** n : u,                     // um único zero
    hex: u.toString(16).toUpperCase().padStart(Math.ceil(n / 4), '0'),
  };
}

export function range(n) {
  return {
    unsigned: [0, 2 ** n - 1],
    signMagnitude: [-(2 ** (n - 1) - 1), 2 ** (n - 1) - 1],
    twosComplement: [-(2 ** (n - 1)), 2 ** (n - 1) - 1],
  };
}

/** Soma binária coluna a coluna. Retorna bits da soma, vai-uns e flags. */
export function addBits(a, b) {
  const n = a.length;
  const sum = Array(n).fill(0);
  const carries = Array(n + 1).fill(0); // carries[i] = vai-um QUE ENTRA na coluna i (n = fora)
  let c = 0;
  for (let i = n - 1; i >= 0; i--) {
    carries[i + 1] = c;
    const s = a[i] + b[i] + c;
    sum[i] = s & 1;
    c = s >> 1;
  }
  carries[0] = c;
  const carryOut = c;
  // Overflow em complemento de 2: operandos com o mesmo sinal e resultado com sinal diferente.
  const overflow = a[0] === b[0] && sum[0] !== a[0];
  return { sum, carries, carryOut, overflow };
}

export function negateTwos(bits) {
  const inverted = bits.map(b => 1 - b);
  const one = bits.map((_, i) => (i === bits.length - 1 ? 1 : 0));
  return { inverted, ...addBits(inverted, one) };
}

// ======================================================================
// IEEE 754 — precisão simples (32 bits)
// ======================================================================

export function floatToBits(x) {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setFloat32(0, x);
  return toBits(dv.getUint32(0), 32);
}

export function bitsToFloat(bits) {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setUint32(0, unsigned(bits));
  return dv.getFloat32(0);
}

/** Decompõe os 32 bits nos campos e calcula o valor EXATO armazenado. */
export function decodeFloat(bits) {
  const sign = bits[0];
  const expBits = bits.slice(1, 9);
  const fracBits = bits.slice(9);
  const e = unsigned(expBits);
  const f = unsigned(fracBits);
  let kind, exponent, mantissa; // valor = (−1)^s × mantissa × 2^(exponent − 23), mantissa inteira de 24 bits
  if (e === 255) kind = f === 0 ? 'infinito' : 'NaN';
  else if (e === 0) { kind = f === 0 ? 'zero' : 'subnormal'; exponent = -126; mantissa = f; }
  else { kind = 'normal'; exponent = e - 127; mantissa = 2 ** 23 + f; }
  const exact = kind === 'normal' || kind === 'subnormal' || kind === 'zero'
    ? (sign ? '-' : '') + exactDecimal(BigInt(mantissa), exponent - 23)
    : kind === 'NaN' ? 'NaN' : (sign ? '-∞' : '+∞');
  return { sign, expBits, fracBits, e, f, kind, exponent, bias: 127, mantissa, value: bitsToFloat(bits), exact };
}

/** m × 2^k escrito em decimal sem arredondar nada (usa BigInt). */
export function exactDecimal(m, k) {
  if (m === 0n) return '0';
  if (k >= 0) return (m << BigInt(k)).toString();
  const digits = -k;                       // m × 2^k = m × 5^(−k) / 10^(−k)
  const s = (m * 5n ** BigInt(digits)).toString().padStart(digits + 1, '0');
  const int = s.slice(0, s.length - digits);
  const frac = s.slice(s.length - digits).replace(/0+$/, '');
  return frac ? `${int},${frac}` : int;
}

/**
 * "Minifloat" didático: 1 bit de sinal, `eb` bits de expoente, `mb` bits de mantissa.
 * Lista todos os valores positivos finitos — para mostrar como os floats se
 * espalham na reta (densos perto do zero, esparsos longe dele).
 */
export function minifloatValues(eb = 3, mb = 2) {
  const bias = 2 ** (eb - 1) - 1;
  const vals = [];
  for (let e = 0; e < 2 ** eb - 1; e++) {
    for (let f = 0; f < 2 ** mb; f++) {
      const v = e === 0 ? (f / 2 ** mb) * 2 ** (1 - bias) : (1 + f / 2 ** mb) * 2 ** (e - bias);
      vals.push({ e, f, v, sub: e === 0 });
    }
  }
  return vals;
}
