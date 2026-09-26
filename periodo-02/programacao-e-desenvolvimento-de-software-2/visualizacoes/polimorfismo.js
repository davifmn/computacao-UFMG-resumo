// Roteiro da visualização de polimorfismo dinâmico: como `f->area()` descobre,
// em tempo de execução, qual função chamar (ponteiro de vtable → tabela → função).

import { lineFinder } from '../../../engine/highlight.js';

export const CODE = `class Forma {
public:
    virtual double area() const = 0;          // abstrata
    virtual string nome() const { return "forma"; }
    virtual ~Forma() = default;
};

class Circulo : public Forma {
    double r;
public:
    Circulo(double r) : r(r) {}
    double area() const override { return 3.14159 * r * r; }
    string nome() const override { return "círculo"; }
};

class Retangulo : public Forma {
    double l, a;
public:
    Retangulo(double l, double a) : l(l), a(a) {}
    double area() const override { return l * a; }
    // nome() não foi sobrescrito: herda Forma::nome
};

int main() {
    vector<Forma*> formas;
    formas.push_back(new Circulo(1.0));
    formas.push_back(new Retangulo(2.0, 3.0));
    for (Forma* f : formas)
        cout << f->nome() << ": " << f->area() << endl;
    for (Forma* f : formas)
        delete f;                              // destrutor virtual!
}`;

/** Tabelas virtuais: uma por classe concreta, compartilhada por todos os objetos dela. */
export const VTABLES = {
  Circulo: [['area', 'Circulo::area'], ['nome', 'Circulo::nome'], ['~Forma', 'Circulo::~Circulo']],
  Retangulo: [['area', 'Retangulo::area'], ['nome', 'Forma::nome'], ['~Forma', 'Retangulo::~Retangulo']],
};

const SLOT = { area: 0, nome: 1, '~Forma': 2 };

export function polymorphismSteps() {
  const L = lineFinder(CODE);
  const steps = [];
  const slots = [];         // conteúdo do vector<Forma*>
  const objects = [];       // objetos no heap
  const output = [];
  let pending = '';         // linha de saída sendo montada

  const snap = (line, msg, hl = {}, vars = {}) => steps.push({
    line, msg, hl,
    slots: slots.map(s => ({ ...s })),
    objects: objects.map(o => ({ ...o, fields: { ...o.fields } })),
    output: [...output, ...(pending ? [pending] : [])],
    vars,
  });

  snap(L('int main()'), 'Três classes: <b>Forma</b> (abstrata, com funções <code>virtual</code>) e duas filhas. À direita estão as <b>vtables</b>: uma tabela de ponteiros para funções por classe, criada pelo compilador.');
  snap(L('vector<Forma*> formas'), 'Um vetor de <b>ponteiros para Forma</b>. Ele pode guardar o endereço de qualquer objeto de uma classe filha: é isso que permite tratar formas diferentes de maneira uniforme.');

  objects.push({ id: 'c', cls: 'Circulo', addr: '0x7A0', fields: { r: '1.0' }, state: 'alive' });
  slots.push({ target: 'c' });
  snap(L('new Circulo(1.0)'), '<code>new Circulo</code> cria o objeto no heap. Além do campo <code>r</code>, ele ganha um campo escondido: o <b>vptr</b>, que aponta para a vtable de <b>Circulo</b>.', { obj: 'c', vptr: 'c' }, { 'formas.size()': 1 });

  objects.push({ id: 'r', cls: 'Retangulo', addr: '0x7C0', fields: { l: '2.0', a: '3.0' }, state: 'alive' });
  slots.push({ target: 'r' });
  snap(L('new Retangulo(2.0, 3.0)'), 'O mesmo para o retângulo: o vptr dele aponta para a vtable de <b>Retangulo</b>. Repare na tabela: a linha <code>nome</code> aponta para <b>Forma::nome</b>, porque Retangulo não sobrescreveu esse método.', { obj: 'r', vptr: 'r' }, { 'formas.size()': 2 });

  const call = (i, method, result) => {
    const o = objects[i];
    const fn = VTABLES[o.cls][SLOT[method]][1];
    const vars = { f: `${o.addr} (Forma*)` };
    snap(L('f->nome()'), `<code>f->${method}()</code>: o tipo declarado de <code>f</code> é <code>Forma*</code>, então o compilador <b>não sabe</b> se é círculo ou retângulo. Ele gera código que <b>segue o vptr</b> do objeto…`, { slot: i, obj: o.id, vptr: o.id }, vars);
    snap(L('f->nome()'), `…até a vtable de <b>${o.cls}</b> e pega a entrada <code>${method}</code> (posição ${SLOT[method]}, fixa em todas as tabelas). Ela aponta para <b>${fn}</b>.`, { slot: i, obj: o.id, vptr: o.id, vt: [o.cls, SLOT[method]] }, vars);
    const line = fn === 'Forma::nome' ? L('virtual string nome()') : fn === 'Circulo::nome' ? L('string nome() const override') : fn === 'Circulo::area' ? L('return 3.14159') : L('return l * a');
    snap(line, `Executa <b>${fn}</b> e devolve <b>${result}</b>.${fn === 'Forma::nome' ? ' Esta é a versão herdada da classe base.' : ''}`, { slot: i, obj: o.id, vt: [o.cls, SLOT[method]], fn }, { ...vars, retorno: result });
  };

  // Iteração 1
  snap(L('for (Forma* f : formas)'), '1ª iteração: <code>f</code> recebe o endereço guardado em <code>formas[0]</code>.', { slot: 0, obj: 'c' }, { f: '0x7A0 (Forma*)' });
  call(0, 'nome', '"círculo"');
  pending = 'círculo: ';
  call(0, 'area', '3.14159');
  output.push('círculo: 3.14159'); pending = '';
  snap(L('f->nome()'), 'A linha é impressa. A mesma instrução de máquina chamou funções diferentes dependendo do objeto: isso é <b>polimorfismo dinâmico</b> (ligação tardia, ou <i>late binding</i>).', { slot: 0, obj: 'c' }, { f: '0x7A0 (Forma*)' });

  // Iteração 2
  snap(L('for (Forma* f : formas)'), '2ª iteração: <code>f</code> agora aponta para o retângulo.', { slot: 1, obj: 'r' }, { f: '0x7C0 (Forma*)' });
  call(1, 'nome', '"forma"');
  pending = 'forma: ';
  call(1, 'area', '6');
  output.push('forma: 6'); pending = '';
  snap(L('f->nome()'), 'Impresso: <code>forma: 6</code>. O nome veio da classe base, mas a área veio do Retangulo.', { slot: 1, obj: 'r' }, { f: '0x7C0 (Forma*)' });

  // Destruição
  for (const [i, o] of objects.entries()) {
    const fn = VTABLES[o.cls][2][1];
    snap(L('delete f;'), `<code>delete f</code> também passa pela vtable: como o destrutor é <b>virtual</b>, chama <b>${fn}</b> (e depois o de Forma). Sem o <code>virtual</code>, só o destrutor de Forma rodaria e a parte ${o.cls} do objeto não seria destruída corretamente.`, { slot: i, obj: o.id, vptr: o.id, vt: [o.cls, 2], fn }, { f: `${o.addr} (Forma*)` });
    o.state = 'freed';
    snap(L('delete f;'), `Memória de ${o.addr} liberada.`, { slot: i, obj: o.id }, { f: `${o.addr} (Forma*)` });
  }
  snap(L('}', L('delete f;')), 'Fim. Custo do polimorfismo: um ponteiro extra por objeto (o vptr) e uma indireção a mais por chamada. Em troca, podemos adicionar novas formas <b>sem mudar</b> o laço de <code>main</code> (princípio aberto/fechado).', {}, {});
  return steps;
}
