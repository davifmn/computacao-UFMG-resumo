# Programação e Desenvolvimento de Software II · DCC219

> 2º período · 60h · Pré-requisito: PDS I · Leva a Estruturas de Dados.

Em PDS I você aprendeu a escrever programas. Em PDS II você aprende a escrever
**software**: código organizado em classes, dividido em vários arquivos, testado
automaticamente e mantido em equipe. A linguagem continua sendo **C++**, agora com
orientação a objetos e a biblioteca padrão.

## 🎬 Visualizações e tutoriais

| | Página | O que você vai ver |
|---|---|---|
| 🧬 | [Polimorfismo e vtable](visualizacoes/polimorfismo.html) | Como `f->area()` descobre em tempo de execução qual função chamar: objeto → vptr → vtable → função; e por que o destrutor precisa ser `virtual` |
| 📦 | [`std::vector` por dentro](visualizacoes/vetor.html) | Cada `push_back`, as realocações e cópias, e o gráfico de custo: dobrar a capacidade (O(1) amortizado) × somar 1 (O(n)) |
| 🛠️ | [Tutorial: projeto C++ do zero](tutoriais/projeto-cpp.html) | Estrutura de pastas, `.hpp` × `.cpp`, compilação separada, Makefile linha a linha, testes de unidade, RAII, depuração e git |

## 📚 Resumo teórico

### 1. Classes e encapsulamento

Uma classe junta **dados** (atributos) e **comportamento** (métodos). Os dados ficam
`private` e só são alterados por métodos que garantem a **invariante** da classe
(ex.: o raio de um círculo é sempre positivo).

```cpp
class Conta {
public:
    explicit Conta(double saldoInicial);   // construtor: estabelece a invariante
    void depositar(double valor);          // lança std::invalid_argument se valor <= 0
    double saldo() const { return saldo_; } // const: não altera o objeto
private:
    double saldo_;                          // invariante: saldo_ >= 0
};
```

- **Construtor** com lista de inicialização (`: saldo_(s)`) e **destrutor** (`~Conta()`).
- `const` em métodos, parâmetros (`const std::string&`) e objetos: o compilador impede alterações acidentais.
- `static`: pertence à classe, não a cada objeto.

### 2. Herança e polimorfismo

- `class Circulo : public Forma`: um círculo **é uma** forma (relação *is-a*). Se a relação é *has-a*, use **composição**.
- `virtual` + `override`: a versão chamada depende do tipo **do objeto**, não do ponteiro (ligação dinâmica, via vtable).
- `= 0`: método virtual puro, que torna a classe **abstrata** (uma interface).
- Destrutor `virtual` em toda classe base polimórfica.
- **Princípio de Liskov:** onde se espera uma `Forma`, qualquer filha deve funcionar sem surpresas.

### 3. Templates e a STL

Templates escrevem código genérico que o compilador especializa para cada tipo:
`template <typename T> T maximo(T a, T b)`.

| Estrutura | Uso típico | Acesso | Inserção |
|---|---|---|---|
| `std::vector` | lista dinâmica (padrão!) | O(1) por índice | O(1) amortizado no fim |
| `std::list` | inserções no meio com iterador | O(n) | O(1) |
| `std::map` | dicionário ordenado (árvore) | O(log n) | O(log n) |
| `std::unordered_map` | dicionário (hash) | O(1) médio | O(1) médio |
| `std::set` / `std::unordered_set` | conjunto sem repetição | O(log n) / O(1) | O(log n) / O(1) |
| `std::stack`, `std::queue`, `std::priority_queue` | adaptadores | topo/frente | O(1) / O(log n) |

Os **algoritmos** (`<algorithm>`) funcionam sobre iteradores: `std::sort`, `std::find`,
`std::count_if`, `std::accumulate`, frequentemente combinados com **lambdas**
(`[](int x) { return x > 0; }`).

### 4. Tratamento de erros: exceções

```cpp
try {
    conta.sacar(1000);
} catch (const SaldoInsuficiente& e) {   // capture por referência const
    std::cerr << e.what();
}
```

Lance exceções quando uma função **não consegue** cumprir seu contrato. Crie suas próprias
herdando de `std::exception` (ou de `std::runtime_error`). Graças ao RAII, os destrutores
rodam durante a propagação da exceção e nada vaza.

### 5. Gerenciamento de recursos

- **RAII:** o recurso é adquirido no construtor e liberado no destrutor.
- **Smart pointers:** `std::unique_ptr` (dono único, sem custo extra) e `std::shared_ptr` (contagem de referências).
- **Regra do zero / dos três / dos cinco:** se precisar escrever o destrutor, escreva também cópia e atribuição (e as versões de movimento).
- **Semântica de movimento** (`std::move`, `T&&`): transfere recursos em vez de copiar.

### 6. Qualidade de software

- **Testes de unidade** (doctest, ou o [`teste.hpp`](codigo/formas/include/teste.hpp) deste repositório) e **TDD**.
- **Princípios SOLID**, com destaque para a responsabilidade única e o aberto/fechado (estender sem modificar, via polimorfismo).
- **Modularização:** alta coesão dentro de cada classe, baixo acoplamento entre elas.
- **Ferramentas:** `make`, `git`, `gdb`/`lldb`, `valgrind` e `-fsanitize=address`.
- **Documentação:** README, comentários explicando o *porquê* e diagramas UML de classes.

## 💻 Código

```bash
cd codigo && make test
```

| Arquivo | Conteúdo |
|---|---|
| [`formas/`](codigo/formas/README.md) | Projeto completo: hierarquia `Forma`/`Circulo`/`Retangulo`, exceções, `unique_ptr`, Makefile com dependências automáticas e testes |
| [`vetor.cpp`](codigo/vetor.cpp) | `Vetor<T>` genérico com regra dos três, *copy-and-swap*, `at()` com exceção e iteradores |

## ✍️ Exercícios

1. O que imprime `Base* p = new Derivada; p->f();` se `f` **não** é virtual em `Base`?
2. Por que `std::vector<Forma>` (sem ponteiro) não funciona para guardar círculos e retângulos?
3. Quantas cópias de elementos um `std::vector` faz, no total, ao receber 1000 `push_back` começando vazio (fator 2)?
4. Escreva um template `trocar(T& a, T& b)`.
5. Qual a diferença entre `std::map` e `std::unordered_map`? Quando usar cada um?

<details>
<summary>Gabarito</summary>

1. Chama `Base::f()`: sem `virtual`, a ligação é estática, pelo tipo do ponteiro.
2. *Object slicing*: ao copiar um `Circulo` para uma `Forma` por valor, só a parte `Forma` é copiada e o polimorfismo se perde. Use `std::vector<std::unique_ptr<Forma>>`.
3. 1 + 2 + 4 + … + 512 = 1023 cópias (menos que 2n), mais as 1000 escritas.
4. `template <typename T> void trocar(T& a, T& b) { T tmp = std::move(a); a = std::move(b); b = std::move(tmp); }`
5. `map` é uma árvore balanceada: ordenado, O(log n). `unordered_map` é uma tabela hash: O(1) em média, sem ordem. Use `map` quando precisar percorrer em ordem ou buscar por faixa.

</details>

## 🔗 Para ir além

- [cppreference.com](https://en.cppreference.com/) e [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/).
- [doctest](https://github.com/doctest/doctest), framework de testes de um único cabeçalho.
- *Clean Code*, Robert C. Martin: nomes, funções pequenas e responsabilidade única.
