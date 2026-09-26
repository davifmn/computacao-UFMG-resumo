// Roteiro da visualização de ponteiros: cada linha do programa altera o
// "mapa da memória" (pilha e heap). Os endereços são simplificados para
// facilitar a leitura (um int ocupa 4 bytes; um ponteiro, 8).

import { lineFinder } from '../../../engine/highlight.js';

export const CODE = `int main() {
    int x = 10;
    int y = 20;
    int *p = &x;          // p guarda o endereço de x
    *p = 30;              // altera x através de p
    p = &y;               // agora p aponta para y
    *p = *p + 5;          // y = y + 5
    int v[3] = {1, 2, 3};
    int *q = v;           // v "vira" &v[0]
    q++;                  // avança sizeof(int) = 4 bytes
    *q = 99;              // v[1] = 99
    int *h = new int(7);  // aloca um int no heap
    delete h;             // libera... mas h ainda guarda o endereço!
    h = nullptr;          // boa prática: nada de ponteiro pendente
    return 0;
}`;

const hex = n => `0x${n.toString(16).toUpperCase()}`;

export function pointerSteps() {
  const L = lineFinder(CODE);
  const cells = new Map(); // chave → célula
  const steps = [];

  const decl = (key, name, addr, value, extra = {}) =>
    cells.set(key, { key, name, addr: hex(addr), value, kind: 'int', region: 'stack', target: null, state: 'normal', ...extra });
  const set = (key, patch) => cells.set(key, { ...cells.get(key), ...patch });

  const varsNow = () => {
    const vars = {};
    for (const c of cells.values()) {
      if (c.region !== 'stack') continue;
      vars[c.name] = c.kind === 'ptr' ? (c.target ? `${c.value} (→ ${cells.get(c.target)?.name ?? '?'})` : c.value) : c.value;
    }
    return vars;
  };

  const snap = (line, msg, { touched = [], deref = null } = {}) => {
    steps.push({
      line, msg, touched, deref,
      cells: [...cells.values()].map(c => ({ ...c })),
      vars: varsNow(),
    });
  };

  snap(L('int main()'), 'O programa começa. As variáveis locais de <code>main</code> vão morar na <b>pilha</b> (stack).');

  decl('x', 'x', 0x100, 10);
  snap(L('int x = 10'), 'Reserva 4 bytes no endereço <b>0x100</b> para <code>x</code> e guarda 10.', { touched: ['x'] });

  decl('y', 'y', 0x104, 20);
  snap(L('int y = 20'), '<code>y</code> ocupa os 4 bytes seguintes: 0x104.', { touched: ['y'] });

  decl('p', 'p', 0x108, hex(0x100), { kind: 'ptr', target: 'x' });
  snap(L('int *p = &x'), '<code>&x</code> é o <b>endereço</b> de x (0x100). Um ponteiro é só uma variável que guarda um endereço — por isso desenhamos uma seta.', { touched: ['p'] });

  set('x', { value: 30 });
  snap(L('*p = 30'), '<code>*p</code> significa "o lugar para onde p aponta". Escrever em <code>*p</code> muda <b>x</b>, mesmo sem citar x!', { touched: ['x'], deref: 'p' });

  set('p', { value: hex(0x104), target: 'y' });
  snap(L('p = &y'), 'Sem o <code>*</code>, mudamos o próprio ponteiro: agora p guarda 0x104 e aponta para <b>y</b>.', { touched: ['p'] });

  set('y', { value: 25 });
  snap(L('*p = *p + 5'), 'Lê <code>*p</code> (20), soma 5 e escreve de volta em <code>*p</code>: y vira <b>25</b>.', { touched: ['y'], deref: 'p' });

  decl('v0', 'v[0]', 0x110, 1);
  decl('v1', 'v[1]', 0x114, 2);
  decl('v2', 'v[2]', 0x118, 3);
  snap(L('int v[3]'), 'Um vetor ocupa posições <b>contíguas</b>: v[0], v[1] e v[2] estão a 4 bytes de distância um do outro.', { touched: ['v0', 'v1', 'v2'] });

  decl('q', 'q', 0x120, hex(0x110), { kind: 'ptr', target: 'v0' });
  snap(L('int *q = v'), 'Em uma expressão, o nome do vetor vira o endereço do primeiro elemento: <code>q = &v[0]</code>.', { touched: ['q'] });

  set('q', { value: hex(0x114), target: 'v1' });
  snap(L('q++'), '<b>Aritmética de ponteiros</b>: <code>q++</code> não soma 1 byte, e sim <code>sizeof(int)</code> = 4. Agora q aponta para v[1]. É por isso que <code>v[i]</code> equivale a <code>*(v + i)</code>.', { touched: ['q'] });

  set('v1', { value: 99 });
  snap(L('*q = 99'), 'Escrever em <code>*q</code> altera <b>v[1]</b>.', { touched: ['v1'], deref: 'q' });

  cells.set('heap', { key: 'heap', name: '(sem nome)', addr: hex(0x5a0), value: 7, kind: 'int', region: 'heap', target: null, state: 'normal' });
  decl('h', 'h', 0x128, hex(0x5a0), { kind: 'ptr', target: 'heap' });
  snap(L('new int(7)'), '<code>new</code> reserva memória no <b>heap</b>, que não some quando a função termina. O bloco não tem nome: só é acessível pelo ponteiro h.', { touched: ['heap', 'h'] });

  set('heap', { state: 'freed', value: '???' });
  set('h', { state: 'dangling' });
  snap(L('delete h'), '<code>delete</code> devolve o bloco ao sistema. Mas <b>h continua guardando 0x5A0</b>: é um <b>ponteiro pendente</b> (dangling). Usar <code>*h</code> agora é comportamento indefinido!', { touched: ['heap', 'h'] });

  cells.delete('heap');
  set('h', { value: 'nullptr', target: null, state: 'null' });
  snap(L('h = nullptr'), 'Atribuir <code>nullptr</code> deixa explícito que h não aponta para nada. Um <code>if (h != nullptr)</code> agora protege o acesso.', { touched: ['h'] });

  snap(L('return 0'), 'Ao sair de <code>main</code>, todo o quadro da pilha é descartado de uma vez. (Se tivéssemos esquecido o <code>delete</code>, o bloco do heap vazaria: <b>memory leak</b>.)');
  return steps;
}
