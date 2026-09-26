// Modelo de circuitos combinacionais: portas, fios, avaliação e tabela-verdade.
//
// Um circuito é { nodes, wires }:
//   node: { id, type, x, y, label? }       type ∈ IN, OUT, AND, OR, NOT, NAND, NOR, XOR, XNOR, FA
//   wire: { from: [nodeId, outPort], to: [nodeId, inPort], mid?, via? }
// As coordenadas são do desenho (viewBox 900 × 520).

export const GATES = {
  AND: { ins: 2, outs: 1, f: ([a, b]) => [a & b] },
  OR: { ins: 2, outs: 1, f: ([a, b]) => [a | b] },
  NOT: { ins: 1, outs: 1, f: ([a]) => [a ^ 1] },
  NAND: { ins: 2, outs: 1, f: ([a, b]) => [(a & b) ^ 1] },
  NOR: { ins: 2, outs: 1, f: ([a, b]) => [(a | b) ^ 1] },
  XOR: { ins: 2, outs: 1, f: ([a, b]) => [a ^ b] },
  XNOR: { ins: 2, outs: 1, f: ([a, b]) => [(a ^ b) ^ 1] },
  // Somador completo como caixa-preta: entradas a, b, cin → saídas s, cout
  FA: { ins: 3, outs: 2, f: ([a, b, c]) => [a ^ b ^ c, (a & b) | (c & (a ^ b))] },
  IN: { ins: 0, outs: 1 },
  OUT: { ins: 1, outs: 0 },
};

/**
 * Avalia o circuito. `inputs` mapeia id de cada IN para 0/1.
 * Retorna { out: Map("id:porta" → bit), level: Map(id → profundidade) }.
 * A profundidade (nível lógico) é usada para animar a propagação do sinal.
 */
export function evaluate(circuit, inputs) {
  const byId = new Map(circuit.nodes.map(n => [n.id, n]));
  const incoming = new Map(circuit.nodes.map(n => [n.id, []]));
  for (const w of circuit.wires) incoming.get(w.to[0]).push(w);
  const out = new Map();
  const level = new Map();
  const visiting = new Set();

  const valueOf = id => {
    if (level.has(id)) return;
    if (visiting.has(id)) throw new Error(`Ciclo no circuito passando por ${id} (circuitos combinacionais não têm realimentação)`);
    visiting.add(id);
    const n = byId.get(id);
    const g = GATES[n.type];
    if (n.type === 'IN') {
      out.set(`${id}:0`, inputs[id] ? 1 : 0);
      level.set(id, 0);
    } else {
      const ins = Array(g.ins).fill(0);
      let lv = 0;
      for (const w of incoming.get(id)) {
        valueOf(w.from[0]);
        ins[w.to[1]] = out.get(`${w.from[0]}:${w.from[1]}`);
        lv = Math.max(lv, level.get(w.from[0]) + 1);
      }
      if (n.type === 'OUT') out.set(`${id}:in`, ins[0]);
      else g.f(ins).forEach((v, p) => out.set(`${id}:${p}`, v));
      level.set(id, lv);
    }
    visiting.delete(id);
  };
  for (const n of circuit.nodes) valueOf(n.id);
  return { out, level };
}

export const inputIds = c => c.nodes.filter(n => n.type === 'IN').map(n => n.id);
export const outputIds = c => c.nodes.filter(n => n.type === 'OUT').map(n => n.id);

/** Tabela-verdade completa: linhas na ordem binária crescente das entradas. */
export function truthTable(circuit) {
  const ins = inputIds(circuit), outs = outputIds(circuit);
  const rows = [];
  for (let k = 0; k < 2 ** ins.length; k++) {
    const inputs = Object.fromEntries(ins.map((id, i) => [id, (k >> (ins.length - 1 - i)) & 1]));
    const { out } = evaluate(circuit, inputs);
    rows.push({ inputs, outputs: Object.fromEntries(outs.map(id => [id, out.get(`${id}:in`)])) });
  }
  return { ins, outs, rows };
}

/** Número de portas (sem contar entradas, saídas e blocos). */
export const gateCount = c => c.nodes.filter(n => !['IN', 'OUT', 'FA'].includes(n.type)).length;

// ======================================================================
// Circuitos prontos
// ======================================================================

const W = (from, to, extra = {}) => ({ from: Array.isArray(from) ? from : [from, 0], to, ...extra });

export const PRESETS = {
  portas: {
    titulo: 'Portas lógicas',
    descricao: 'As mesmas entradas A e B alimentam cada tipo de porta. Clique nas entradas e compare as saídas.',
    nodes: [
      { id: 'A', type: 'IN', x: 90, y: 180 }, { id: 'B', type: 'IN', x: 90, y: 340 },
      ...['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'].map((t, i) => ({ id: `g${t}`, type: t, x: 430, y: 60 + i * 72 })),
      ...['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'].map((t, i) => ({ id: `o${t}`, type: 'OUT', x: 620, y: 60 + i * 72, label: t })),
      { id: 'gNOT', type: 'NOT', x: 430, y: 490 }, { id: 'oNOT', type: 'OUT', x: 620, y: 490, label: 'NOT A' },
    ],
    wires: [
      ...['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'].flatMap((t, i) => [
        W('A', [`g${t}`, 0], { mid: 250 + i * 12 }), W('B', [`g${t}`, 1], { mid: 330 - i * 12 }), W(`g${t}`, [`o${t}`, 0]),
      ]),
      W('A', ['gNOT', 0], { mid: 180 }), W('gNOT', ['oNOT', 0]),
    ],
  },

  meio: {
    titulo: 'Meio-somador',
    descricao: 'Soma dois bits: S = A ⊕ B é o bit da soma e C = A · B é o "vai-um". 1 + 1 = 10 em binário.',
    nodes: [
      { id: 'A', type: 'IN', x: 110, y: 170 }, { id: 'B', type: 'IN', x: 110, y: 340 },
      { id: 'x', type: 'XOR', x: 450, y: 170 }, { id: 'a', type: 'AND', x: 450, y: 340 },
      { id: 'S', type: 'OUT', x: 700, y: 170, label: 'S (soma)' }, { id: 'C', type: 'OUT', x: 700, y: 340, label: 'C (vai-um)' },
    ],
    wires: [
      W('A', ['x', 0], { mid: 300 }), W('B', ['x', 1], { mid: 260 }),
      W('A', ['a', 0], { mid: 260 }), W('B', ['a', 1], { mid: 300 }),
      W('x', ['S', 0]), W('a', ['C', 0]),
    ],
  },

  completo: {
    titulo: 'Somador completo',
    descricao: 'Soma três bits (A, B e o vai-um de entrada). Dois meios-somadores e uma porta OR: é a célula básica de toda ULA.',
    nodes: [
      { id: 'A', type: 'IN', x: 105, y: 120 }, { id: 'B', type: 'IN', x: 105, y: 220 }, { id: 'Cin', type: 'IN', x: 105, y: 400, label: 'Cin' },
      { id: 'x1', type: 'XOR', x: 280, y: 150 }, { id: 'x2', type: 'XOR', x: 540, y: 180 },
      { id: 'a1', type: 'AND', x: 280, y: 300 }, { id: 'a2', type: 'AND', x: 540, y: 340 },
      { id: 'o', type: 'OR', x: 700, y: 330 },
      { id: 'S', type: 'OUT', x: 820, y: 180, label: 'S' }, { id: 'Cout', type: 'OUT', x: 820, y: 330, label: 'Cout' },
    ],
    wires: [
      W('A', ['x1', 0], { mid: 180 }), W('B', ['x1', 1], { mid: 150 }),
      W('A', ['a1', 0], { mid: 150 }), W('B', ['a1', 1], { mid: 180 }),
      W('x1', ['x2', 0], { mid: 410 }), W('Cin', ['x2', 1], { mid: 440 }),
      W('x1', ['a2', 0], { mid: 380 }), W('Cin', ['a2', 1], { mid: 470 }),
      W('a1', ['o', 1], { mid: 620 }), W('a2', ['o', 0], { mid: 620 }),
      W('x2', ['S', 0]), W('o', ['Cout', 0]),
    ],
  },

  ripple: {
    titulo: 'Somador de 4 bits',
    // Com 9 entradas a tabela teria 512 linhas: mostramos a conta em decimal.
    readout(inputs, outputs) {
      const num = (p, n = 4) => [...Array(n).keys()].reduce((acc, i) => acc + ((p(i) ? 1 : 0) << i), 0);
      const a = num(i => inputs[`A${i}`]), b = num(i => inputs[`B${i}`]), c = inputs.C0 ? 1 : 0;
      const sum = num(i => outputs[`S${i}`]) + (outputs.C4 ? 16 : 0);
      const bin = (x, n) => x.toString(2).padStart(n, '0');
      return { a, b, c, sum, text: `${bin(a, 4)} + ${bin(b, 4)} + ${c} = ${bin(sum, 5)}`, dec: `${a} + ${b} + ${c} = ${sum}` };
    },
    descricao: 'Quatro somadores completos em cadeia (ripple-carry): o vai-um de cada bit entra no próximo. Soma A₃A₂A₁A₀ + B₃B₂B₁B₀. Repare no atraso: o último bit só fica certo depois que o vai-um atravessa a cadeia.',
    nodes: [
      ...[0, 1, 2, 3].flatMap(i => {
        const x = 760 - i * 190;
        return [
          { id: `A${i}`, type: 'IN', x: x - 30, y: 90, label: `A${i}`, port: 'bottom' },
          { id: `B${i}`, type: 'IN', x: x + 30, y: 90, label: `B${i}`, port: 'bottom' },
          { id: `FA${i}`, type: 'FA', x, y: 260 },
          { id: `S${i}`, type: 'OUT', x, y: 430, label: `S${i}`, port: 'top' },
        ];
      }),
      { id: 'C0', type: 'IN', x: 850, y: 380, label: 'Cin', port: 'left' },
      { id: 'C4', type: 'OUT', x: 90, y: 430, label: 'Cout', port: 'top' },
    ],
    wires: [
      ...[0, 1, 2, 3].flatMap(i => [
        W(`A${i}`, [`FA${i}`, 0], { via: 'v' }), W(`B${i}`, [`FA${i}`, 1], { via: 'v' }),
        W([`FA${i}`, 0], [`S${i}`, 0], { via: 'v' }),
        i < 3 ? W([`FA${i}`, 1], [`FA${i + 1}`, 2]) : W([`FA${i}`, 1], ['C4', 0], { via: 'h' }),
      ]),
      W('C0', ['FA0', 2]),
    ],
  },

  mux: {
    titulo: 'Multiplexador 2:1',
    descricao: 'Um "if" em hardware: se S = 0 a saída copia I₀; se S = 1, copia I₁. Y = S̄·I₀ + S·I₁.',
    nodes: [
      { id: 'I0', type: 'IN', x: 110, y: 110, label: 'I0' }, { id: 'I1', type: 'IN', x: 110, y: 250, label: 'I1' },
      { id: 'S', type: 'IN', x: 110, y: 420, label: 'S' },
      { id: 'n', type: 'NOT', x: 270, y: 420 },
      { id: 'a0', type: 'AND', x: 480, y: 140 }, { id: 'a1', type: 'AND', x: 480, y: 300 },
      { id: 'o', type: 'OR', x: 660, y: 220 }, { id: 'Y', type: 'OUT', x: 820, y: 220, label: 'Y' },
    ],
    wires: [
      W('I0', ['a0', 0], { mid: 300 }), W('I1', ['a1', 0], { mid: 300 }),
      W('S', ['n', 0]), W('n', ['a0', 1], { mid: 380 }), W('S', ['a1', 1], { mid: 190 }),
      W('a0', ['o', 0], { mid: 570 }), W('a1', ['o', 1], { mid: 570 }), W('o', ['Y', 0]),
    ],
  },

  decoder: {
    titulo: 'Decodificador 2→4',
    descricao: 'Ativa exatamente uma das quatro saídas, a de número (A₁A₀)₂. É assim que a memória escolhe qual endereço ler.',
    nodes: [
      { id: 'A1', type: 'IN', x: 105, y: 130, label: 'A1' }, { id: 'A0', type: 'IN', x: 105, y: 330, label: 'A0' },
      { id: 'n1', type: 'NOT', x: 230, y: 190 }, { id: 'n0', type: 'NOT', x: 230, y: 390 },
      ...[0, 1, 2, 3].map(k => ({ id: `d${k}`, type: 'AND', x: 560, y: 70 + k * 120 })),
      ...[0, 1, 2, 3].map(k => ({ id: `Y${k}`, type: 'OUT', x: 760, y: 70 + k * 120, label: `Y${k}` })),
    ],
    wires: [
      W('A1', ['n1', 0], { mid: 150 }), W('A0', ['n0', 0], { mid: 150 }),
      // d_k recebe A1 (ou ¬A1) e A0 (ou ¬A0) conforme os bits de k
      ...[0, 1, 2, 3].flatMap(k => [
        W((k >> 1) & 1 ? 'A1' : 'n1', [`d${k}`, 0], { mid: 380 + k * 14 }),
        W(k & 1 ? 'A0' : 'n0', [`d${k}`, 1], { mid: 470 - k * 14 }),
        W(`d${k}`, [`Y${k}`, 0]),
      ]),
    ],
  },

  nand: {
    titulo: 'Tudo com NAND',
    descricao: 'NAND é universal: NOT, AND e OR podem ser montados só com portas NAND. Por isso fábricas de chips conseguem produzir quase tudo a partir de uma única célula.',
    nodes: [
      { id: 'A', type: 'IN', x: 100, y: 130 }, { id: 'B', type: 'IN', x: 100, y: 360 },
      { id: 'n1', type: 'NAND', x: 330, y: 60 }, { id: 'oNOT', type: 'OUT', x: 790, y: 60, label: 'NOT A' },
      { id: 'n2', type: 'NAND', x: 330, y: 200 }, { id: 'n3', type: 'NAND', x: 520, y: 200 }, { id: 'oAND', type: 'OUT', x: 790, y: 200, label: 'A AND B' },
      { id: 'n4', type: 'NAND', x: 330, y: 340 }, { id: 'n5', type: 'NAND', x: 330, y: 450 }, { id: 'n6', type: 'NAND', x: 580, y: 395 },
      { id: 'oOR', type: 'OUT', x: 790, y: 395, label: 'A OR B' },
    ],
    wires: [
      W('A', ['n1', 0], { mid: 200 }), W('A', ['n1', 1], { mid: 215 }), W('n1', ['oNOT', 0]),
      W('A', ['n2', 0], { mid: 230 }), W('B', ['n2', 1], { mid: 245 }),
      W('n2', ['n3', 0], { mid: 430 }), W('n2', ['n3', 1], { mid: 445 }), W('n3', ['oAND', 0]),
      W('A', ['n4', 0], { mid: 185 }), W('A', ['n4', 1], { mid: 260 }),
      W('B', ['n5', 0], { mid: 200 }), W('B', ['n5', 1], { mid: 275 }),
      W('n4', ['n6', 0], { mid: 460 }), W('n5', ['n6', 1], { mid: 460 }), W('n6', ['oOR', 0]),
    ],
  },
};
