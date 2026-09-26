// Passos de um vetor dinâmico (como std::vector) crescendo com push_back.
// Compara duas políticas de crescimento: dobrar a capacidade × somar 1.

import { lineFinder } from '../../../engine/highlight.js';

const code = grow => `template <typename T>
class Vetor {
    T* dados = nullptr;
    size_t tam = 0, cap = 0;
public:
    void push_back(const T& x) {
        if (tam == cap) {                 // cheio: precisa crescer
            size_t novaCap = ${grow};
            T* novo = new T[novaCap];
            for (size_t i = 0; i < tam; i++)
                novo[i] = dados[i];       // copia tudo
            delete[] dados;
            dados = novo;
            cap = novaCap;
        }
        dados[tam++] = x;
    }
};`;

export const CODES = {
  dobra: code('cap == 0 ? 1 : 2 * cap'),
  soma1: code('cap + 1'),
};

export function vectorSteps(n, policy = 'dobra') {
  const L = lineFinder(CODES[policy]);
  const steps = [];
  let blocks = [];          // { id, cap, cells, state }
  let dados = null;         // id do bloco atual
  let tam = 0, cap = 0, nextId = 0;
  let copies = 0;
  const costs = [];         // custo (1 + cópias) de cada push_back já feito
  let current = 0;          // custo do push em andamento

  const snap = (line, msg, extra = {}) => steps.push({
    line, msg, ...extra,
    blocks: blocks.map(b => ({ ...b, cells: [...b.cells] })),
    dados, tam, cap, copies, costs: [...costs], policy,
    vars: { tam, cap, 'cópias (total)': copies, ...(extra.vars ?? {}) },
  });

  snap(L('class Vetor'), `Vetor vazio: <code>dados = nullptr</code>, tam = cap = 0. Vamos fazer <b>${n}</b> chamadas de <code>push_back</code> com a política <b>${policy === 'dobra' ? 'dobrar a capacidade' : 'somar 1 à capacidade'}</b>.`);
  for (let k = 0; k < n; k++) {
    const x = (k + 1) * 10;
    current = 1;
    snap(L('void push_back'), `<code>push_back(${x})</code>.`, { vars: { x } });
    if (tam === cap) {
      const novaCap = policy === 'dobra' ? (cap === 0 ? 1 : 2 * cap) : cap + 1;
      snap(L('if (tam == cap)'), `tam == cap == ${cap}: <b>não cabe</b>. Um vetor não pode simplesmente "esticar": o espaço seguinte na memória pode estar ocupado.`, { vars: { x } });
      const novo = { id: nextId++, cap: novaCap, cells: Array(novaCap).fill(null), state: 'new' };
      blocks.push(novo);
      snap(L('T* novo = new T'), `Aloca um bloco <b>novo</b> com capacidade ${novaCap}.`, { vars: { x, novaCap } });
      const old = blocks.find(b => b.id === dados);
      for (let i = 0; i < tam; i++) {
        novo.cells[i] = old.cells[i];
        copies++; current++;
        snap(L('novo[i] = dados[i]'), `Copia dados[${i}] = ${old.cells[i]} para o bloco novo.`, { copy: [old.id, novo.id, i], vars: { x, novaCap, i } });
      }
      if (old) {
        old.state = 'freed';
        snap(L('delete[] dados'), `Libera o bloco antigo (capacidade ${old.cap}).`, { vars: { x, novaCap } });
        blocks = blocks.filter(b => b.id !== old.id);
      } else {
        snap(L('delete[] dados'), '<code>delete[] nullptr</code> não faz nada (é seguro).', { vars: { x, novaCap } });
      }
      novo.state = 'active';
      dados = novo.id;
      cap = novaCap;
      snap(L('cap = novaCap'), `<code>dados</code> passa a apontar para o bloco novo; cap = ${cap}.`, { vars: { x, novaCap } });
    }
    const blk = blocks.find(b => b.id === dados);
    blk.cells[tam] = x;
    tam++;
    costs.push(current);
    snap(L('dados[tam++] = x'), `Escreve ${x} em dados[${tam - 1}]. Este push custou <b>${current}</b> operação(ões) de escrita.`, { wrote: tam - 1, vars: { x } });
  }
  const total = costs.reduce((a, b) => a + b, 0);
  snap(L('};'), policy === 'dobra'
    ? `Total: ${total} escritas para ${n} inserções, <b>${(total / n).toFixed(2)} por push</b>. Dobrando, as cópias somam 1 + 2 + 4 + … &lt; 2n: custo <b>amortizado O(1)</b>. É o que o std::vector faz (fator 2 no GCC, 1,5 no MSVC).`
    : `Total: ${total} escritas para ${n} inserções, <b>${(total / n).toFixed(2)} por push</b>, e crescendo! Somando 1, as cópias são 0 + 1 + 2 + … + (n−1) ≈ n²/2: <b>O(n) por push</b>, O(n²) no total.`,
  { vars: { total } });
  return steps;
}
