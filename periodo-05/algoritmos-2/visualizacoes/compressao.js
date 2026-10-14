// Compressão sem perdas: código de Huffman (árvore construída com fila de
// prioridade) e LZW (dicionário que cresce enquanto lê).

import { lineFinder } from '../../../engine/highlight.js';

export const CODES = {
  huffman: `struct No { int freq; char c; No *esq, *dir; };
struct Cmp { bool operator()(No* a, No* b) { return a->freq > b->freq; } };

No* huffman(map<char, int> freq) {
    priority_queue<No*, vector<No*>, Cmp> fila;   // menor freq no topo
    for (auto [c, f] : freq) fila.push(new No{f, c, nullptr, nullptr});
    while (fila.size() > 1) {
        No* a = fila.top(); fila.pop();           // as duas menores
        No* b = fila.top(); fila.pop();
        fila.push(new No{a->freq + b->freq, 0, a, b});
    }
    return fila.top();
}

void codigos(No* r, string pre, map<char, string>& cod) {
    if (!r->esq) { cod[r->c] = pre.empty() ? "0" : pre; return; }
    codigos(r->esq, pre + "0", cod);              // esquerda = 0
    codigos(r->dir, pre + "1", cod);              // direita = 1
}`,
  lzw: `vector<int> lzw(string s) {
    map<string, int> dic;
    for (int c = 0; c < 256; c++) dic[string(1, c)] = c;
    string w;
    vector<int> saida;
    for (char c : s) {
        if (dic.count(w + c)) w += c;             // ainda está no dicionário
        else {
            saida.push_back(dic[w]);              // emite o maior conhecido
            int novo = dic.size();
            dic[w + c] = novo;                    // aprende w + c
            w = string(1, c);
        }
    }
    if (!w.empty()) saida.push_back(dic[w]);
    return saida;
}`,
};

export function frequencies(s) {
  const f = new Map();
  for (const c of s) f.set(c, (f.get(c) ?? 0) + 1);
  return [...f.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

const show = c => (c === ' ' ? '␣' : c === '\n' ? '↵' : c);

/**
 * Huffman passo a passo. Empates na fila: menor frequência e, entre iguais, o
 * nó criado primeiro (folhas em ordem alfabética), para a árvore ser reprodutível.
 */
export function huffmanSteps(s) {
  const L = lineFinder(CODES.huffman);
  const nodes = [];   // { id, freq, c, esq, dir, ord }
  const mk = (freq, c, esq, dir) => { const nd = { id: nodes.length, freq, c, esq, dir }; nodes.push(nd); return nd; };
  let queue = frequencies(s).map(([c, f]) => mk(f, c, null, null));
  const steps = [];
  const sortQ = () => queue.sort((a, b) => a.freq - b.freq || a.id - b.id);
  sortQ();
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, roots: queue.map(n => n.id), nodes: nodes.map(n => ({ ...n })), vars: { 'fila (freq)': queue.map(n => n.freq).join(' '), ...extra.vars }, ...extra });
  snap(L('fila.push(new No{f, c'), `Uma folha por símbolo, com sua frequência em "${s.length > 30 ? s.slice(0, 30) + '…' : s}". A fila de prioridade deixa a <b>menor frequência</b> no topo.`);
  while (queue.length > 1) {
    const a = queue.shift(), b = queue.shift();
    snap(L('No* a = fila.top()'), `Retira as duas menores: <b>${a.freq}</b> e <b>${b.freq}</b>. Símbolos raros vão ficar no fundo da árvore, com códigos longos.`, { pick: [a.id, b.id], roots: [a.id, b.id, ...queue.map(n => n.id)] });
    const p = mk(a.freq + b.freq, null, a.id, b.id);
    queue.push(p);
    sortQ();
    snap(L('fila.push(new No{a->freq + b->freq'), `Junta as duas sob um nó de peso ${a.freq} + ${b.freq} = <b>${p.freq}</b> e devolve à fila. Restam ${queue.length} árvore(s).`, { made: p.id });
  }
  const root = queue[0];
  const codes = {};
  const walk = (id, pre) => {
    const nd = nodes[id];
    if (nd.esq == null) { codes[nd.c] = pre || '0'; return; }
    walk(nd.esq, pre + '0'); walk(nd.dir, pre + '1');
  };
  walk(root.id, '');
  const bits = [...s].reduce((acc, c) => acc + codes[c].length, 0);
  steps.push({
    line: L('void codigos'), msg: `Os códigos são os caminhos da raiz até cada folha (esquerda = 0, direita = 1). Nenhum código é prefixo de outro, porque só as folhas têm símbolos. Total: <b>${bits} bits</b>, contra ${8 * s.length} em ASCII (${(100 * bits / (8 * s.length)).toFixed(0)}%) e ${s.length * Math.max(1, Math.ceil(Math.log2(frequencies(s).length)))} num código de tamanho fixo.`,
    roots: [root.id], nodes: nodes.map(n => ({ ...n })), codes, bits, done: true,
    vars: { bits, 'bits/símbolo': (bits / s.length).toFixed(3) },
  });
  return steps;
}

export function huffmanCodes(s) {
  return huffmanSteps(s).at(-1).codes;
}

/** Entropia em bits por símbolo: o limite inferior de Shannon. */
export function entropy(s) {
  return frequencies(s).reduce((h, [, f]) => { const p = f / s.length; return h - p * Math.log2(p); }, 0);
}

export function lzwSteps(s) {
  const L = lineFinder(CODES.lzw);
  const dic = new Map();   // só as entradas novas (≥ 256); as de 1 caractere são o código ASCII
  const code = w => (w.length === 1 ? w.charCodeAt(0) : dic.get(w));
  const has = w => w.length === 1 || dic.has(w);
  const out = [], steps = [];
  let w = '';
  const snap = (line, msg, extra = {}) => steps.push({ line, msg, s, w, out: [...out], dic: [...dic.entries()], vars: { w: `"${w}"`, saída: out.length }, ...extra });
  snap(L('for (int c = 0; c < 256'), `O dicionário começa com os 256 caracteres de 1 byte (códigos 0–255). As sequências novas recebem 256, 257, … — e o decodificador consegue reconstruir o mesmo dicionário sozinho, sem que ele seja transmitido.`, { pos: -1 });
  [...s].forEach((c, pos) => {
    if (has(w + c)) {
      snap(L('if (dic.count(w + c))'), `"${show(w + c)}" já está no dicionário: continua crescendo w.`, { pos });
      w += c;
    } else {
      out.push({ code: code(w), str: w });
      const novo = 256 + dic.size;
      dic.set(w + c, novo);
      snap(L('dic[w + c] = novo'), `"${show(w + c)}" é novo: emite o código de "${show(w)}" = <b>${code(w)}</b> e aprende "${show(w + c)}" = <b>${novo}</b>.`, { pos, learned: w + c });
      w = c;
    }
  });
  if (w) out.push({ code: code(w), str: w });
  const bits = out.length * Math.max(9, Math.ceil(Math.log2(256 + dic.size)));
  snap(L('if (!w.empty())'), `Fim: ${s.length} caracteres viraram <b>${out.length} códigos</b>. Com códigos de ${Math.max(9, Math.ceil(Math.log2(256 + dic.size)))} bits: ${bits} bits contra ${8 * s.length}. Quanto mais repetitivo o texto, mais longas as entradas do dicionário.`, { pos: s.length, done: true, bits });
  return steps;
}

export function lzwEncode(s) {
  return lzwSteps(s).at(-1).out.map(o => o.code);
}

/** Decodificador LZW, incluindo o caso especial em que o código ainda não existe (cScSc). */
export function lzwDecode(codes) {
  const dic = new Map();
  const get = k => (k < 256 ? String.fromCharCode(k) : dic.get(k));
  let prev = get(codes[0]);
  let out = prev;
  for (const k of codes.slice(1)) {
    const cur = k < 256 || dic.has(k) ? get(k) : prev + prev[0];
    dic.set(256 + dic.size, prev + cur[0]);
    out += cur;
    prev = cur;
  }
  return out;
}
