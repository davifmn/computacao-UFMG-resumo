// Testes de unidade, cobertura de comandos e de ramos, e teste de mutação,
// sobre a função clássica de classificação de triângulos.

export const CODE = [
  'def classifica(a, b, c):',
  '    if a <= 0 or b <= 0 or c <= 0:',
  '        return "inválido"',
  '    if a + b <= c or a + c <= b or b + c <= a:',
  '        return "não é triângulo"',
  '    if a == b and b == c:',
  '        return "equilátero"',
  '    if a == b or b == c or a == c:',
  '        return "isósceles"',
  '    return "escaleno"',
];

// Comandos executáveis (linhas, base 1) e decisões (linha do if)
export const STATEMENTS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
export const DECISIONS = [2, 4, 6, 8];

export const MUTANTS = [
  { id: 'M1', line: 2, desc: 'a <= 0 → a < 0', code: '    if a < 0 or b <= 0 or c <= 0:' },
  { id: 'M2', line: 2, desc: 'c <= 0 → c <= 1', code: '    if a <= 0 or b <= 0 or c <= 1:' },
  { id: 'M3', line: 4, desc: 'a + b <= c → a + b < c', code: '    if a + b < c or a + c <= b or b + c <= a:' },
  { id: 'M4', line: 4, desc: 'b + c <= a → b - c <= a', code: '    if a + b <= c or a + c <= b or b - c <= a:' },
  { id: 'M5', line: 6, desc: 'and → or', code: '    if a == b or b == c:' },
  { id: 'M6', line: 8, desc: 'remove "or a == c"', code: '    if a == b or b == c:' },
  { id: 'M7', line: 10, desc: '"escaleno" → "isósceles"', code: '    return "isósceles"' },
  { id: 'M8', line: 2, desc: 'remove "or b <= 0"', code: '    if a <= 0 or c <= 0:' },
];

/** Executa a função (ou um mutante) registrando linhas e ramos percorridos. */
export function run(a, b, c, mutant = null) {
  const lines = new Set([1]), branches = new Set();
  const m = mutant;
  const dec = (line, cond) => { lines.add(line); branches.add(`${line}${cond ? 'V' : 'F'}`); return cond; };
  const ret = (line, v) => { lines.add(line); return { result: v, lines, branches }; };
  const c1 = m === 'M1' ? a < 0 || b <= 0 || c <= 0 : m === 'M2' ? a <= 0 || b <= 0 || c <= 1 : m === 'M8' ? a <= 0 || c <= 0 : a <= 0 || b <= 0 || c <= 0;
  if (dec(2, c1)) return ret(3, 'inválido');
  const c2 = m === 'M3' ? a + b < c || a + c <= b || b + c <= a : m === 'M4' ? a + b <= c || a + c <= b || b - c <= a : a + b <= c || a + c <= b || b + c <= a;
  if (dec(4, c2)) return ret(5, 'não é triângulo');
  const c3 = m === 'M5' ? a === b || b === c : a === b && b === c;
  if (dec(6, c3)) return ret(7, 'equilátero');
  const c4 = m === 'M6' ? a === b || b === c : a === b || b === c || a === c;
  if (dec(8, c4)) return ret(9, 'isósceles');
  return ret(10, m === 'M7' ? 'isósceles' : 'escaleno');
}

/** Avalia uma suíte: resultados, cobertura e mutantes mortos. */
export function evaluate(tests) {
  const results = tests.map(t => { const r = run(t.a, t.b, t.c); return { ...t, actual: r.result, pass: r.result === t.expected }; });
  const lines = new Set(), branches = new Set();
  for (const t of tests) { const r = run(t.a, t.b, t.c); r.lines.forEach(l => lines.add(l)); r.branches.forEach(b => branches.add(b)); }
  const stmtCov = STATEMENTS.filter(l => lines.has(l)).length / STATEMENTS.length;
  const branchCov = DECISIONS.flatMap(d => [`${d}V`, `${d}F`]).filter(b => branches.has(b)).length / (2 * DECISIONS.length);
  const mutants = MUTANTS.map(mu => {
    // um mutante morre se algum teste (que passa no original) dá resultado diferente
    const killer = tests.find(t => run(t.a, t.b, t.c).result === t.expected && run(t.a, t.b, t.c, mu.id).result !== t.expected);
    const equivalent = isEquivalent(mu.id);
    return { ...mu, killed: !!killer, killer: killer ?? null, equivalent };
  });
  const killable = mutants.filter(m => !m.equivalent);
  return { results, lines, branches, stmtCov, branchCov, mutants, score: killable.filter(m => m.killed).length / killable.length };
}

/** Testa exaustivamente em lados pequenos: um mutante é equivalente se nunca muda o resultado. */
export function isEquivalent(id) {
  for (let a = -1; a <= 6; a++) for (let b = -1; b <= 6; b++) for (let c = -1; c <= 6; c++) if (run(a, b, c).result !== run(a, b, c, id).result) return false;
  return true;
}

export const SUITES = {
  um: { nome: 'Um teste só', tests: [{ a: 3, b: 4, c: 5, expected: 'escaleno' }] },
  classes: { nome: 'Um teste por classe', tests: [
    { a: 0, b: 1, c: 1, expected: 'inválido' }, { a: 1, b: 2, c: 8, expected: 'não é triângulo' },
    { a: 2, b: 2, c: 2, expected: 'equilátero' }, { a: 2, b: 2, c: 3, expected: 'isósceles' }, { a: 3, b: 4, c: 5, expected: 'escaleno' }] },
  fronteira: { nome: 'Classes + fronteiras', tests: [
    { a: 0, b: 1, c: 1, expected: 'inválido' }, { a: 1, b: 1, c: 0, expected: 'inválido' }, { a: 1, b: 0, c: 1, expected: 'inválido' },
    { a: 1, b: 2, c: 3, expected: 'não é triângulo' }, { a: 5, b: 2, c: 3, expected: 'não é triângulo' },
    { a: 2, b: 2, c: 2, expected: 'equilátero' }, { a: 2, b: 2, c: 3, expected: 'isósceles' }, { a: 3, b: 2, c: 3, expected: 'isósceles' },
    { a: 3, b: 4, c: 5, expected: 'escaleno' }, { a: 1, b: 1, c: 1, expected: 'equilátero' }] },
};

export const CLASSES = ['inválido', 'não é triângulo', 'equilátero', 'isósceles', 'escaleno'];
