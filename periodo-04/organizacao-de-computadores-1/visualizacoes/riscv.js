// Um RISC-V (RV32I) de brinquedo: montador, codificação binária, simulador
// monociclo com os sinais de controle e o caminho de dados ativo de cada
// instrução, e o escalonamento no pipeline de 5 estágios.

export const DATA_BASE = 0x400;   // .data começa aqui (cabe no imediato de 12 bits do addi)
export const STACK_TOP = 0x7f0;

export const ABI = ['zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
  's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6'];
const REG = new Map([...ABI.map((n, i) => [n, i]), ...ABI.map((_, i) => [`x${i}`, i]), ['fp', 8]]);

// formato, opcode, funct3, funct7
export const ISA = {
  add: ['R', 0b0110011, 0, 0], sub: ['R', 0b0110011, 0, 0b0100000], sll: ['R', 0b0110011, 1, 0], slt: ['R', 0b0110011, 2, 0],
  sltu: ['R', 0b0110011, 3, 0], xor: ['R', 0b0110011, 4, 0], srl: ['R', 0b0110011, 5, 0], sra: ['R', 0b0110011, 5, 0b0100000],
  or: ['R', 0b0110011, 6, 0], and: ['R', 0b0110011, 7, 0],
  addi: ['I', 0b0010011, 0], slti: ['I', 0b0010011, 2], xori: ['I', 0b0010011, 4], ori: ['I', 0b0010011, 6], andi: ['I', 0b0010011, 7],
  slli: ['I', 0b0010011, 1, 0], srli: ['I', 0b0010011, 5, 0], srai: ['I', 0b0010011, 5, 0b0100000],
  lw: ['I', 0b0000011, 2], sw: ['S', 0b0100011, 2],
  beq: ['B', 0b1100011, 0], bne: ['B', 0b1100011, 1], blt: ['B', 0b1100011, 4], bge: ['B', 0b1100011, 5],
  jal: ['J', 0b1101111], jalr: ['I', 0b1100111, 0], lui: ['U', 0b0110111],
};

/** Classe da instrução para o controle e o caminho de dados. */
export function kindOf(op) {
  if (ISA[op][0] === 'R') return 'R';
  if (op === 'lw') return 'load';
  if (op === 'sw') return 'store';
  if (ISA[op][0] === 'B') return 'branch';
  if (op === 'jal') return 'jal';
  if (op === 'jalr') return 'jalr';
  if (op === 'lui') return 'lui';
  return 'I';
}

// ---------- Montador ----------

const reg = (tok, line) => {
  const r = REG.get(String(tok).trim());
  if (r == null) throw new Error(`linha ${line}: registrador inválido "${tok}"`);
  return r;
};

function num(tok, labels, line) {
  const t = String(tok).trim();
  if (labels && labels.has(t)) return labels.get(t);
  const v = Number(t);
  if (!Number.isInteger(v) && !/^-?0x[0-9a-f]+$/i.test(t)) throw new Error(`linha ${line}: número ou rótulo inválido "${t}"`);
  return Number.isInteger(v) ? v : parseInt(t, 16);
}

/**
 * Monta o programa. Aceita .data/.text, .word, rótulos, comentários com # e as
 * pseudoinstruções li, la, mv, j, ret, nop, call (= jal ra).
 */
export function assemble(src) {
  const lines = src.split('\n');
  const text = [], data = [], labels = new Map();
  let section = 'text';
  // 1ª passada: rótulos e expansão de pseudoinstruções
  const pending = [];
  lines.forEach((raw, k) => {
    const line = k + 1;
    let s = raw.replace(/#.*/, '').trim();
    while (/^[A-Za-z_]\w*:/.test(s)) {
      const lab = s.slice(0, s.indexOf(':'));
      labels.set(lab, section === 'text' ? text.length * 4 : DATA_BASE + data.length * 4);
      s = s.slice(s.indexOf(':') + 1).trim();
    }
    if (!s) return;
    if (s === '.data') { section = 'data'; return; }
    if (s === '.text') { section = 'text'; return; }
    if (s.startsWith('.word')) {
      for (const w of s.slice(5).split(',')) data.push(num(w, null, line) | 0);
      return;
    }
    if (section === 'data') throw new Error(`linha ${line}: só .word é aceito em .data`);
    const sp = s.search(/\s/);
    const op = (sp < 0 ? s : s.slice(0, sp)).toLowerCase();
    const args = sp < 0 ? [] : s.slice(sp).split(',').map(a => a.trim()).filter(Boolean);
    const push = (o, a) => { text.push({ op: o, args: a, line, src: raw.replace(/#.*/, '').trim().replace(/^[A-Za-z_]\w*:\s*/, '') }); };
    switch (op) {
      case 'li': push('addi', [args[0], 'zero', args[1]]); break;
      case 'la': push('addi', [args[0], 'zero', args[1]]); pending.push(text.length - 1); break;
      case 'mv': push('addi', [args[0], args[1], '0']); break;
      case 'j': push('jal', ['zero', args[0]]); break;
      case 'call': push('jal', ['ra', args[0]]); break;
      case 'ret': push('jalr', ['zero', '0(ra)']); break;
      case 'nop': push('addi', ['zero', 'zero', '0']); break;
      default:
        if (!ISA[op]) throw new Error(`linha ${line}: instrução desconhecida "${op}"`);
        push(op, args);
    }
  });
  // 2ª passada: resolve operandos
  const instrs = text.map((t, idx) => {
    const { op, args, line } = t;
    const addr = idx * 4;
    const [fmt] = ISA[op];
    const ins = { op, line, addr, src: t.src, rd: 0, rs1: 0, rs2: 0, imm: 0 };
    const memArg = a => {
      const m = /^(-?\w+)?\((\w+)\)$/.exec(a.replace(/\s/g, ''));
      if (!m) throw new Error(`linha ${line}: esperado deslocamento(registrador), veio "${a}"`);
      return [m[1] ? num(m[1], labels, line) : 0, reg(m[2], line)];
    };
    if (fmt === 'R') { ins.rd = reg(args[0], line); ins.rs1 = reg(args[1], line); ins.rs2 = reg(args[2], line); }
    else if (op === 'lw' || op === 'jalr') {
      ins.rd = reg(args[0], line);
      if (args.length === 3) { ins.rs1 = reg(args[1], line); ins.imm = num(args[2], labels, line); }
      else [ins.imm, ins.rs1] = memArg(args[1]);
    } else if (fmt === 'I') { ins.rd = reg(args[0], line); ins.rs1 = reg(args[1], line); ins.imm = num(args[2], labels, line); }
    else if (fmt === 'S') { ins.rs2 = reg(args[0], line); [ins.imm, ins.rs1] = memArg(args[1]); }
    else if (fmt === 'B') { ins.rs1 = reg(args[0], line); ins.rs2 = reg(args[1], line); ins.imm = labels.has(args[2]) ? labels.get(args[2]) - addr : num(args[2], null, line); }
    else if (fmt === 'J') { ins.rd = reg(args[0], line); ins.imm = labels.has(args[1]) ? labels.get(args[1]) - addr : num(args[1], null, line); }
    else if (fmt === 'U') { ins.rd = reg(args[0], line); ins.imm = num(args[1], labels, line); }
    const lim = fmt === 'B' ? 4096 : fmt === 'J' ? 1 << 20 : fmt === 'U' ? 1 << 20 : 2048;
    if ((fmt === 'U' && (ins.imm < 0 || ins.imm >= lim)) || (fmt !== 'U' && fmt !== 'R' && (ins.imm < -lim || ins.imm >= lim))) throw new Error(`linha ${line}: imediato ${ins.imm} fora do alcance`);
    ins.text = format(ins);
    return ins;
  });
  return { instrs, data, labels, pseudoLa: pending };
}

/** Texto canônico (sem pseudoinstruções) de uma instrução montada. */
export function format(i) {
  const r = x => ABI[x];
  switch (ISA[i.op][0]) {
    case 'R': return `${i.op} ${r(i.rd)}, ${r(i.rs1)}, ${r(i.rs2)}`;
    case 'S': return `${i.op} ${r(i.rs2)}, ${i.imm}(${r(i.rs1)})`;
    case 'B': return `${i.op} ${r(i.rs1)}, ${r(i.rs2)}, ${i.imm >= 0 ? '+' : ''}${i.imm}`;
    case 'J': return `${i.op} ${r(i.rd)}, ${i.imm >= 0 ? '+' : ''}${i.imm}`;
    case 'U': return `${i.op} ${r(i.rd)}, 0x${i.imm.toString(16)}`;
    default: return i.op === 'lw' || i.op === 'jalr' ? `${i.op} ${r(i.rd)}, ${i.imm}(${r(i.rs1)})` : `${i.op} ${r(i.rd)}, ${r(i.rs1)}, ${i.imm}`;
  }
}

// ---------- Codificação ----------

const bits = (x, hi, lo) => (x >>> lo) & ((1 << (hi - lo + 1)) - 1);

export function encode(i) {
  const [fmt, opc, f3 = 0, f7 = 0] = ISA[i.op];
  const imm = i.imm | 0;
  let w;
  switch (fmt) {
    case 'R': w = (f7 << 25) | (i.rs2 << 20) | (i.rs1 << 15) | (f3 << 12) | (i.rd << 7) | opc; break;
    case 'I': {
      const im = ['slli', 'srli', 'srai'].includes(i.op) ? (f7 << 5) | (imm & 31) : imm & 0xfff;
      w = (im << 20) | (i.rs1 << 15) | (f3 << 12) | (i.rd << 7) | opc; break;
    }
    case 'S': w = (bits(imm, 11, 5) << 25) | (i.rs2 << 20) | (i.rs1 << 15) | (f3 << 12) | (bits(imm, 4, 0) << 7) | opc; break;
    case 'B': w = (bits(imm, 12, 12) << 31) | (bits(imm, 10, 5) << 25) | (i.rs2 << 20) | (i.rs1 << 15) | (f3 << 12) | (bits(imm, 4, 1) << 8) | (bits(imm, 11, 11) << 7) | opc; break;
    case 'U': w = (imm << 12) | (i.rd << 7) | opc; break;
    case 'J': w = (bits(imm, 20, 20) << 31) | (bits(imm, 10, 1) << 21) | (bits(imm, 11, 11) << 20) | (bits(imm, 19, 12) << 12) | (i.rd << 7) | opc; break;
  }
  return w >>> 0;
}

/** Campos do formato, do bit 31 ao 0, para desenhar a instrução em binário. */
export function fields(i) {
  const w = encode(i);
  const F = (name, hi, lo, cls) => ({ name, hi, lo, cls, value: bits(w, hi, lo), bin: bits(w, hi, lo).toString(2).padStart(hi - lo + 1, '0') });
  switch (ISA[i.op][0]) {
    case 'R': return [F('funct7', 31, 25, 'f'), F('rs2', 24, 20, 'r'), F('rs1', 19, 15, 'r'), F('funct3', 14, 12, 'f'), F('rd', 11, 7, 'r'), F('opcode', 6, 0, 'o')];
    case 'I': return [F('imm[11:0]', 31, 20, 'i'), F('rs1', 19, 15, 'r'), F('funct3', 14, 12, 'f'), F('rd', 11, 7, 'r'), F('opcode', 6, 0, 'o')];
    case 'S': return [F('imm[11:5]', 31, 25, 'i'), F('rs2', 24, 20, 'r'), F('rs1', 19, 15, 'r'), F('funct3', 14, 12, 'f'), F('imm[4:0]', 11, 7, 'i'), F('opcode', 6, 0, 'o')];
    case 'B': return [F('imm[12|10:5]', 31, 25, 'i'), F('rs2', 24, 20, 'r'), F('rs1', 19, 15, 'r'), F('funct3', 14, 12, 'f'), F('imm[4:1|11]', 11, 7, 'i'), F('opcode', 6, 0, 'o')];
    case 'U': return [F('imm[31:12]', 31, 12, 'i'), F('rd', 11, 7, 'r'), F('opcode', 6, 0, 'o')];
    case 'J': return [F('imm[20|10:1|11|19:12]', 31, 12, 'i'), F('rd', 11, 7, 'r'), F('opcode', 6, 0, 'o')];
  }
}

export const hex = (w, n = 8) => `0x${(w >>> 0).toString(16).padStart(n, '0')}`;

// ---------- Controle e caminho de dados (monociclo) ----------

// Sinais de controle por classe (X = tanto faz). PCSrc: 0 = PC+4, 1 = desvio, 2 = ULA (jalr).
export const CONTROL = {
  R: { RegWrite: 1, ALUSrc: 0, MemRead: 0, MemWrite: 0, MemtoReg: 0, Branch: 0, ALUOp: '10' },
  I: { RegWrite: 1, ALUSrc: 1, MemRead: 0, MemWrite: 0, MemtoReg: 0, Branch: 0, ALUOp: '10' },
  load: { RegWrite: 1, ALUSrc: 1, MemRead: 1, MemWrite: 0, MemtoReg: 1, Branch: 0, ALUOp: '00' },
  store: { RegWrite: 0, ALUSrc: 1, MemRead: 0, MemWrite: 1, MemtoReg: 'X', Branch: 0, ALUOp: '00' },
  branch: { RegWrite: 0, ALUSrc: 0, MemRead: 0, MemWrite: 0, MemtoReg: 'X', Branch: 1, ALUOp: '01' },
  jal: { RegWrite: 1, ALUSrc: 'X', MemRead: 0, MemWrite: 0, MemtoReg: 'PC+4', Branch: 'J', ALUOp: 'X' },
  jalr: { RegWrite: 1, ALUSrc: 1, MemRead: 0, MemWrite: 0, MemtoReg: 'PC+4', Branch: 'J', ALUOp: '00' },
  lui: { RegWrite: 1, ALUSrc: 1, MemRead: 0, MemWrite: 0, MemtoReg: 0, Branch: 0, ALUOp: 'U' },
};

// Fios (e unidades) usados por cada classe. Os comuns a todas ficam em BASE.
const BASE = ['pc-im', 'pc-add4', 'im-ctrl'];
const SEQ = ['add4-mux', 'mux-pc'];
export const PATHS = {
  R: [...BASE, ...SEQ, 'im-reg', 'rs1-alu', 'rs2-mux', 'mux-alu', 'alu-wb', 'wb-reg'],
  I: [...BASE, ...SEQ, 'im-reg', 'im-imm', 'imm-mux', 'rs1-alu', 'mux-alu', 'alu-wb', 'wb-reg'],
  load: [...BASE, ...SEQ, 'im-reg', 'im-imm', 'imm-mux', 'rs1-alu', 'mux-alu', 'alu-dm', 'dm-wb', 'wb-reg'],
  store: [...BASE, ...SEQ, 'im-reg', 'im-imm', 'imm-mux', 'rs1-alu', 'mux-alu', 'alu-dm', 'rs2-dm'],
  branch: [...BASE, 'im-reg', 'rs1-alu', 'rs2-mux', 'mux-alu', 'im-imm', 'imm-badd', 'pc-badd', 'mux-pc'],
  jal: [...BASE, 'im-imm', 'imm-badd', 'pc-badd', 'badd-mux', 'mux-pc', 'pc4-wb', 'wb-reg'],
  jalr: [...BASE, 'im-reg', 'im-imm', 'imm-mux', 'rs1-alu', 'mux-alu', 'alu-pcmux', 'mux-pc', 'pc4-wb', 'wb-reg'],
  lui: [...BASE, ...SEQ, 'im-imm', 'imm-mux', 'mux-alu', 'alu-wb', 'wb-reg'],
};

function alu(op, a, b) {
  switch (op) {
    case 'add': case 'addi': case 'lw': case 'sw': case 'jalr': return (a + b) | 0;
    case 'sub': return (a - b) | 0;
    case 'and': case 'andi': return a & b;
    case 'or': case 'ori': return a | b;
    case 'xor': case 'xori': return a ^ b;
    case 'slt': case 'slti': return a < b ? 1 : 0;
    case 'sltu': return (a >>> 0) < (b >>> 0) ? 1 : 0;
    case 'sll': case 'slli': return a << (b & 31);
    case 'srl': case 'srli': return (a >>> (b & 31)) | 0;
    case 'sra': case 'srai': return a >> (b & 31);
    default: return 0;
  }
}

const OPSYM = { add: '+', sub: '−', and: '&', or: '|', xor: '^', slt: '<?', sltu: '<? (sem sinal)', sll: '<<', srl: '>>>', sra: '>>' };

const BRANCH = { beq: (a, b) => a === b, bne: (a, b) => a !== b, blt: (a, b) => a < b, bge: (a, b) => a >= b };

/**
 * Executa o programa (uma instrução por passo) e devolve o estado depois de
 * cada uma. `trace` é a sequência dinâmica de instruções, usada pelo pipeline.
 */
export function run(src, { maxSteps = 400 } = {}) {
  const prog = assemble(src);
  const regs = Array(32).fill(0);
  regs[2] = STACK_TOP;
  const mem = new Map(prog.data.map((w, k) => [DATA_BASE + 4 * k, w]));
  const steps = [], trace = [];
  const n = (x) => ABI[x];
  const memSnap = () => new Map(mem);
  steps.push({ pc: 0, regs: [...regs], mem: memSnap(), ins: null, line: prog.instrs[0]?.line, msg: `Programa montado: ${prog.instrs.length} instruções a partir do endereço 0, dados a partir de ${hex(DATA_BASE, 3)}. sp começa em ${hex(STACK_TOP, 3)}.` });
  let pc = 0, halted = false;
  for (let k = 0; k < maxSteps; k++) {
    const ins = prog.instrs[pc / 4];
    if (!ins) { halted = true; break; }
    const kind = kindOf(ins.op);
    const a = regs[ins.rs1], b = regs[ins.rs2];
    const src2 = CONTROL[kind].ALUSrc === 1 ? ins.imm : b;
    let res = null, next = pc + 4, taken = null, memAddr = null, memVal = null, msg, written = null;
    switch (kind) {
      case 'R': case 'I':
        res = alu(ins.op, a, src2); written = res;
        msg = `A ULA calcula ${n(ins.rs1)} (${a}) ${OPSYM[ins.op.replace(/i$/, '')] ?? ins.op} ${kind === 'R' ? `${n(ins.rs2)} (${b})` : `imediato ${ins.imm}`} = <b>${res}</b>, que volta para ${n(ins.rd)}.`;
        break;
      case 'lui':
        res = ins.imm << 12; written = res;
        msg = `lui coloca o imediato nos 20 bits de cima: ${n(ins.rd)} = ${hex(res)}.`;
        break;
      case 'load':
        res = memAddr = (a + ins.imm) | 0;
        if (memAddr % 4) throw new Error(`endereço desalinhado ${hex(memAddr)} na linha ${ins.line}`);
        memVal = mem.get(memAddr) ?? 0; written = memVal;
        msg = `A ULA soma base + deslocamento: ${a} + ${ins.imm} = ${hex(memAddr, 3)}. A memória de dados devolve <b>${memVal}</b>, que vai para ${n(ins.rd)}.`;
        break;
      case 'store':
        res = memAddr = (a + ins.imm) | 0;
        if (memAddr % 4) throw new Error(`endereço desalinhado ${hex(memAddr)} na linha ${ins.line}`);
        memVal = b; mem.set(memAddr, b);
        msg = `Endereço ${a} + ${ins.imm} = ${hex(memAddr, 3)}. O valor de ${n(ins.rs2)} (<b>${b}</b>) é escrito na memória. Nenhum registrador muda (RegWrite = 0).`;
        break;
      case 'branch':
        taken = BRANCH[ins.op](a, b);
        if (taken) next = pc + ins.imm;
        msg = `Compara ${n(ins.rs1)} (${a}) e ${n(ins.rs2)} (${b}): ${ins.op} ${taken ? `<b>desvia</b> para PC + ${ins.imm} = ${next}` : '<b>não desvia</b>, segue para PC + 4'}. O somador de desvio calculou o alvo de qualquer jeito.`;
        break;
      case 'jal':
        written = pc + 4; next = pc + ins.imm; taken = true;
        msg = `jal salta para PC + ${ins.imm} = ${next}${ins.rd ? ` e guarda o endereço de retorno PC + 4 = ${pc + 4} em ${n(ins.rd)}` : ' (rd = zero: é só um salto, o j)'}.`;
        break;
      case 'jalr':
        written = pc + 4; next = (a + ins.imm) & ~1; taken = true;
        msg = `jalr salta para ${n(ins.rs1)} + ${ins.imm} = ${next}${ins.rd ? `, guardando ${pc + 4} em ${n(ins.rd)}` : ' (é o ret: volta para quem chamou)'}.`;
        break;
    }
    if (CONTROL[kind].RegWrite && ins.rd !== 0) regs[ins.rd] = written;
    if (CONTROL[kind].RegWrite && ins.rd === 0 && kind !== 'jal' && kind !== 'jalr') msg += ' (Escrever em zero não tem efeito: x0 vale sempre 0.)';
    trace.push({ ins, taken: !!taken && kind === 'branch', jump: kind === 'jal' || kind === 'jalr', next });
    const path = kind === 'branch' ? [...PATHS.branch, taken ? 'badd-mux' : 'add4-mux'] : PATHS[kind];
    steps.push({
      pc, nextPc: next, ins, kind, line: ins.line, regs: [...regs], mem: memSnap(), changed: CONTROL[kind].RegWrite && ins.rd ? ins.rd : null,
      memAddr, memVal, memWrite: kind === 'store', aluRes: res, taken, path, control: CONTROL[kind], word: encode(ins),
      msg: `<code>${ins.text}</code>: ${msg}`,
    });
    pc = next;
  }
  if (!halted) steps.push({ ...steps.at(-1), msg: `Parei depois de ${maxSteps} instruções (laço infinito?).`, ins: null, path: [] });
  else steps.push({ ...steps.at(-1), pc, ins: null, path: [], line: null, msg: `PC = ${pc} passou do fim do programa: execução encerrada depois de ${trace.length} instruções.`, done: true });
  return { steps, trace, prog, regs, mem };
}

// ---------- Pipeline de 5 estágios ----------

export const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];

const readsOf = ins => {
  const k = kindOf(ins.op);
  if (k === 'R' || k === 'store' || k === 'branch') return [ins.rs1, ins.rs2];
  if (k === 'jal' || k === 'lui') return [];
  return [ins.rs1];
};
const writes = ins => (CONTROL[kindOf(ins.op)].RegWrite && ins.rd !== 0 ? ins.rd : null);

/**
 * Escalona a sequência dinâmica `trace` no pipeline clássico (IF ID EX MEM WB).
 * - Sem adiantamento: quem lê precisa estar em ID no ciclo do WB do produtor
 *   (escreve na 1ª metade, lê na 2ª) ou depois.
 * - Com adiantamento: valor da ULA chega ao EX seguinte; de um lw, só depois do MEM
 *   (1 bolha: o "load-use").
 * - Desvios e saltos resolvidos no EX com previsão "não desvia": se desviar,
 *   as 2 instruções buscadas depois são descartadas.
 * Devolve uma linha por instrução (inclusive as descartadas) com o estágio em cada ciclo.
 */
export function pipeline(trace, { forwarding = true, instrs = null } = {}) {
  const rows = [];
  const lastWriter = new Map();   // registrador → { EX, kind, row } do último produtor
  let prevIF = 0, prevIDstart = 1, prevEX = 2;   // instrução "anterior" fictícia: a 1ª entra no ciclo 1
  for (const t of trace) {
    const { ins } = t;
    const IF = Math.max(prevIF + 1, prevIDstart);   // o IF libera quando a anterior entra no ID
    const IDstart = Math.max(IF + 1, prevEX);       // o ID libera quando a anterior entra no EX
    const base = IDstart + 1;
    let EX = base;
    const producers = [];
    for (const r of new Set(readsOf(ins))) {
      const p = r ? lastWriter.get(r) : null;
      if (!p) continue;
      const need = !forwarding ? p.EX + 3 : p.kind === 'load' ? p.EX + 2 : p.EX + 1;
      producers.push({ r, p, need });
      EX = Math.max(EX, need);
    }
    const hazards = producers.filter(x => x.need > base).map(x => ({ reg: x.r, from: x.p.row, stall: x.need - base, load: x.p.kind === 'load' }));
    // adiantamento: o valor ainda não estaria no banco de registradores quando este lê (no ID, ciclo EX − 1)
    const forwards = forwarding ? producers.filter(x => EX - 1 < x.p.EX + 2).map(x => ({ reg: x.r, from: x.p.row, type: EX === x.p.EX + 1 ? 'EX/MEM → EX' : 'MEM/WB → EX' })) : [];
    rows.push({ ins, IF, ID: IDstart, EX, MEM: EX + 1, WB: EX + 2, stalls: EX - base, hazards, forwards, flushed: false });
    const w = writes(ins);
    if (w != null) lastWriter.set(w, { EX, kind: kindOf(ins.op), row: rows.length - 1 });
    prevIF = IF; prevIDstart = IDstart; prevEX = EX;
    if ((t.taken || t.jump) && instrs) {
      // previsão "não desvia": as duas instruções seguintes no endereço já entraram e são descartadas no fim do EX do desvio
      const w1 = instrs[ins.addr / 4 + 1], w2 = instrs[ins.addr / 4 + 2];
      if (w1) rows.push({ ins: w1, IF: IDstart, ID: EX, flushed: true, flushAt: EX, hazards: [], forwards: [] });
      if (w2) rows.push({ ins: w2, IF: EX, ID: null, flushed: true, flushAt: EX, hazards: [], forwards: [] });
      prevIF = EX; prevIDstart = EX + 1;   // a busca recomeça no alvo, no ciclo seguinte
    }
  }
  const real = rows.filter(r => !r.flushed);
  const cycles = real.length ? real.at(-1).WB : 0;
  return { rows, cycles, instructions: real.length, cpi: real.length ? cycles / real.length : 0, stalls: real.reduce((s, r) => s + r.stalls, 0), flushes: rows.filter(r => r.flushed).length };
}

/** Estágio ocupado pela linha `row` no ciclo `c` ('IF', 'ID', 'ID*' (bolha), ..., ou null). */
export function stageAt(row, c) {
  if (row.flushed) {
    if (row.ID != null && c === row.ID) return 'ID';
    if (c >= row.IF && c <= row.flushAt && (row.ID == null || c < row.ID)) return c === row.IF ? 'IF' : 'IF*';
    return null;
  }
  if (c < row.IF) return null;
  if (c < row.ID) return c === row.IF ? 'IF' : 'IF*';   // IF* = preso no IF (quem está à frente parou)
  if (c < row.EX - 1) return c === row.ID ? 'ID' : 'ID*';
  if (c === row.EX - 1) return row.EX - 1 === row.ID ? 'ID' : 'ID*';
  if (c === row.EX) return 'EX';
  if (c === row.MEM) return 'MEM';
  if (c === row.WB) return 'WB';
  return null;
}

// ---------- Programas de exemplo ----------

export const PROGRAMS = {
  soma: { nome: 'Soma de um vetor', src: `.data
vetor: .word 3, 1, 4, 1, 5
n:     .word 5
soma:  .word 0
.text
        la   t0, vetor        # t0 = &vetor[0]
        la   t1, n
        lw   t1, 0(t1)        # t1 = n
        li   a0, 0            # a0 = soma
laco:   beq  t1, zero, fim
        lw   t2, 0(t0)        # t2 = *t0
        add  a0, a0, t2
        addi t0, t0, 4        # próximo elemento (4 bytes)
        addi t1, t1, -1
        j    laco
fim:    la   t3, soma
        sw   a0, 0(t3)        # soma = a0` },
  fib: { nome: 'Fibonacci na memória', src: `.data
fib: .word 0, 1, 0, 0, 0, 0, 0, 0
.text
        la   s0, fib          # s0 = &fib[0]
        li   s1, 6            # quantos termos faltam
laco:   lw   t0, 0(s0)        # fib[i]
        lw   t1, 4(s0)        # fib[i+1]
        add  t2, t0, t1
        sw   t2, 8(s0)        # fib[i+2] = fib[i] + fib[i+1]
        addi s0, s0, 4
        addi s1, s1, -1
        bne  s1, zero, laco` },
  max: { nome: 'Máximo de um vetor', src: `.data
v:   .word 7, -2, 19, 4, 11
.text
        la   t0, v
        li   t1, 5            # n
        lw   a0, 0(t0)        # max = v[0]
        li   t2, 1            # i = 1
laco:   bge  t2, t1, fim
        slli t3, t2, 2        # t3 = i * 4
        add  t3, t0, t3       # t3 = &v[i]
        lw   t4, 0(t3)
        blt  t4, a0, prox     # if (v[i] < max) pula
        mv   a0, t4           # max = v[i]
prox:   addi t2, t2, 1
        j    laco
fim:    nop` },
  funcao: { nome: 'Chamada de função', src: `# main chama soma3(4, 5, 6) e guarda o resultado na pilha
.text
main:   addi sp, sp, -4
        li   a0, 4
        li   a1, 5
        li   a2, 6
        jal  ra, soma3        # ra = endereço de volta
        sw   a0, 0(sp)        # guarda o retorno na pilha
        j    fim
soma3:  add  a0, a0, a1
        add  a0, a0, a2
        jalr zero, 0(ra)      # ret
fim:    nop` },
};

// Programas curtos para o pipeline (a sequência dinâmica cabe na tela).
export const PIPE_PROGRAMS = {
  dependencias: { nome: 'Cadeia de dependências', src: `        li   t0, 10
        add  t1, t0, t0       # depende de t0
        sub  t2, t1, t0       # depende de t1
        and  t3, t2, t1
        or   t4, t0, t0       # independente do anterior
        add  t5, t4, t3` },
  loaduse: { nome: 'Load-use', src: `.data
x: .word 7, 8
.text
        la   t0, x
        lw   t1, 0(t0)
        add  t2, t1, t1       # usa t1 logo depois do lw
        lw   t3, 4(t0)
        addi t4, t0, 1        # instrução independente "esconde" a bolha
        add  t5, t3, t4` },
  laco: { nome: 'Laço com desvio', src: `        li   t0, 2
laco:   addi t1, t1, 5
        addi t0, t0, -1
        bne  t0, zero, laco
        add  t2, t1, t1
        sub  t3, t2, t1` },
};

// ---------- Memória cache ----------

/**
 * Simula uma cache com `lines` linhas, blocos de `blockBytes` bytes,
 * associatividade `ways` (1 = mapeamento direto; lines = totalmente associativa) e LRU.
 * Classifica cada falta nos 3 Cs: compulsória, de capacidade ou de conflito.
 */
export function cacheSim(addresses, { lines = 8, blockBytes = 4, ways = 1, addrBits = 12 } = {}) {
  const sets = lines / ways;
  const offBits = Math.log2(blockBytes), idxBits = Math.log2(sets), tagBits = addrBits - offBits - idxBits;
  const cache = Array.from({ length: sets }, () => Array.from({ length: ways }, () => ({ valid: false, tag: 0, last: -1, block: null })));
  const seen = new Set();
  const full = [];   // cache totalmente associativa de mesmo tamanho (para separar capacidade de conflito)
  const steps = [];
  let hits = 0, misses = 0;
  const counts = { compulsoria: 0, capacidade: 0, conflito: 0 };
  const snap = () => cache.map(set => set.map(l => ({ ...l })));
  steps.push({ cache: snap(), hits, misses, counts: { ...counts }, offBits, idxBits, tagBits, sets, msg: `Cache vazia: ${lines} linhas, blocos de ${blockBytes} bytes, ${ways === 1 ? 'mapeamento direto' : ways === lines ? 'totalmente associativa' : `${ways} vias`} (${sets} conjunto${sets > 1 ? 's' : ''}). Endereço de ${addrBits} bits = tag (${tagBits}) | índice (${idxBits}) | deslocamento (${offBits}).` });
  addresses.forEach((addr, t) => {
    const block = Math.floor(addr / blockBytes);
    const idx = block % sets, tag = Math.floor(block / sets), off = addr % blockBytes;
    const set = cache[idx];
    const way = set.findIndex(l => l.valid && l.tag === tag);
    // cache totalmente associativa LRU de referência
    const fi = full.indexOf(block);
    const fullHit = fi >= 0;
    if (fullHit) full.splice(fi, 1);
    full.push(block);
    if (full.length > lines) full.shift();
    const base = { addr, block, idx, tag, off, t };
    if (way >= 0) {
      hits++;
      set[way].last = t;
      steps.push({ ...base, cache: snap(), hit: true, way, hits, misses, counts: { ...counts }, offBits, idxBits, tagBits, sets, msg: `Endereço ${addr} → bloco ${block}: conjunto ${idx}, tag ${tag}. A via ${way} está válida com a mesma tag: <b>acerto</b>.` });
    } else {
      misses++;
      const kind = !seen.has(block) ? 'compulsoria' : !fullHit ? 'capacidade' : 'conflito';
      counts[kind]++;
      let victim = set.findIndex(l => !l.valid);
      let evicted = null;
      if (victim < 0) { victim = set.reduce((best, l, k) => (l.last < set[best].last ? k : best), 0); evicted = set[victim].block; }
      set[victim] = { valid: true, tag, last: t, block };
      const why = { compulsoria: 'compulsória (primeira vez que o bloco é usado)', capacidade: 'de capacidade (nem uma cache totalmente associativa do mesmo tamanho o teria guardado)', conflito: 'de <b>conflito</b> (uma cache totalmente associativa teria acertado: o bloco foi expulso por outro que disputa o mesmo conjunto)' }[kind];
      steps.push({ ...base, cache: snap(), hit: false, way: victim, evicted, kind, hits, misses, counts: { ...counts }, offBits, idxBits, tagBits, sets, msg: `Endereço ${addr} → bloco ${block}: conjunto ${idx}, tag ${tag}. <b>Falta</b> ${why}. O bloco vem da memória para a via ${victim}${evicted != null ? `, expulsando o bloco ${evicted} (o usado há mais tempo, LRU)` : ''}.` });
    }
    seen.add(block);
  });
  return { steps, hits, misses, counts };
}
