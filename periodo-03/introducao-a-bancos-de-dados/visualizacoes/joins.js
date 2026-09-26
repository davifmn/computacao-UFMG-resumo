// Junções (JOIN) pelo algoritmo de laços aninhados, passo a passo.

import { lineFinder } from '../../../engine/highlight.js';

export const CODE = `# SELECT ... FROM A <tipo> JOIN B ON A.prof = B.id
resultado = []
casados_B = set()
for a in A:                          # laço externo
    achou = False
    for b in B:                      # laço interno
        if a.prof == b.id:           # condição do ON
            resultado.append(a + b)
            achou = True
            casados_B.add(b)
    if not achou and tipo in ("LEFT", "FULL"):
        resultado.append(a + NULLs)  # A sem par
if tipo in ("RIGHT", "FULL"):
    for b in B:
        if b not in casados_B:
            resultado.append(NULLs + b)  # B sem par`;

export const A = [
  { codigo: 'DCC203', nome: 'PDS I', prof: 'P01' },
  { codigo: 'DCC221', nome: 'Estruturas de Dados', prof: 'P04' },
  { codigo: 'DCC129', nome: 'FTC', prof: null },
  { codigo: 'DCC219', nome: 'PDS II', prof: 'P01' },
  { codigo: 'DCC605', nome: 'Sist. Operacionais', prof: 'P04' },
];
export const B = [
  { id: 'P01', nome: 'Márcia' },
  { id: 'P03', nome: 'Helena' },
  { id: 'P04', nome: 'Carlos' },
];

export function joinSteps(type = 'INNER', a = A, b = B) {
  const L = lineFinder(CODE);
  const result = [];
  const matched = new Set();
  const steps = [];
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, type, result: result.map(r => ({ ...r })), matched: [...matched], ...extra, vars: { tipo: type, 'linhas no resultado': result.length, ...(extra.vars ?? {}) } });
  snap(L('resultado = []'), `<b>${type} JOIN</b> entre disciplinas (A) e professores (B), com a condição A.prof = B.id. O jeito mais simples de executar: comparar <b>cada par</b> de linhas.`);
  a.forEach((ra, i) => {
    let achou = false;
    snap(L('for a in A:'), `Linha ${i + 1} de A: <b>${ra.nome}</b> (prof = ${ra.prof ?? 'NULL'}).`, { ai: i, vars: { 'a.prof': ra.prof ?? 'NULL' } });
    b.forEach((rb, j) => {
      const eq = ra.prof != null && ra.prof === rb.id;
      snap(L('if a.prof == b.id'), `${ra.prof ?? 'NULL'} = ${rb.id}? <b>${eq ? 'Sim' : 'Não'}</b>${ra.prof == null ? ' (NULL nunca é igual a nada, nem a outro NULL!)' : ''}.`, { ai: i, bj: j, eq, vars: { 'a.prof': ra.prof ?? 'NULL', 'b.id': rb.id } });
      if (eq) {
        result.push({ a: i, b: j, kind: 'match' });
        achou = true;
        matched.add(j);
        snap(L('resultado.append(a + b)'), `Combina: a linha (${ra.nome}, ${rb.nome}) entra no resultado.`, { ai: i, bj: j, eq, fresh: result.length - 1 });
      }
    });
    if (!achou && (type === 'LEFT' || type === 'FULL')) {
      result.push({ a: i, b: null, kind: 'leftonly' });
      snap(L('resultado.append(a + NULLs)'), `${ra.nome} não casou com ninguém, mas no ${type} JOIN ela entra mesmo assim, com NULL nas colunas de B.`, { ai: i, fresh: result.length - 1 });
    } else if (!achou) {
      snap(L('if not achou'), `${ra.nome} não casou com ninguém e, no ${type} JOIN, é descartada.`, { ai: i });
    }
  });
  if (type === 'RIGHT' || type === 'FULL') {
    b.forEach((rb, j) => {
      if (matched.has(j)) return;
      result.push({ a: null, b: j, kind: 'rightonly' });
      snap(L('resultado.append(NULLs + b)'), `${rb.nome} (${rb.id}) não apareceu em nenhum par: entra com NULL nas colunas de A.`, { bj: j, fresh: result.length - 1 });
    });
  }
  snap(null, `Fim: ${result.length} linha(s). Custo do laço aninhado: |A| × |B| = ${a.length * b.length} comparações. Bancos reais usam <b>índices</b> ou <b>hash join</b> para evitar isso.`, { done: true });
  return steps;
}
