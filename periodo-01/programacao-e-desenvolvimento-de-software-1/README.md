# Programação e Desenvolvimento de Software I · DCC203

> 1º período · 60h · Pré-requisito de PDS II, que por sua vez leva a Estruturas de Dados.

A disciplina em que você aprende a **pensar como um computador executa**: cada
variável ocupa memória, cada linha muda o estado e cada função ganha seu próprio
espaço na pilha. A linguagem é **C++**, usada num estilo próximo de C.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 📊 | [Ordenação](https://davifmn.github.io/computacao-UFMG-resumo/periodo-01/programacao-e-desenvolvimento-de-software-1/visualizacoes/ordenacao.html) | Bubble, Selection e Insertion Sort com cada comparação e troca, lado a lado com o código |
| 🔍 | [Busca binária](https://davifmn.github.io/computacao-UFMG-resumo/periodo-01/programacao-e-desenvolvimento-de-software-1/visualizacoes/busca.html) | O intervalo `[ini, fim]` encolhendo pela metade, comparado com a busca sequencial |
| 🌳 | [Recursão](https://davifmn.github.io/computacao-UFMG-resumo/periodo-01/programacao-e-desenvolvimento-de-software-1/visualizacoes/recursao.html) | Pilha de chamadas e árvore de recursão para fatorial e Fibonacci (com e sem memoização) |
| 🧠 | [Ponteiros e memória](https://davifmn.github.io/computacao-UFMG-resumo/periodo-01/programacao-e-desenvolvimento-de-software-1/visualizacoes/ponteiros.html) | Endereços, `*` e `&`, aritmética de ponteiros, `new`/`delete` e ponteiro pendente |

> Para abrir localmente, rode `python3 -m http.server` na raiz do repositório (veja o [README principal](../../README.md)).

## 📚 Resumo teórico

### 1. Do código ao programa

```
código-fonte (.cpp) ──compilador──▶ código objeto ──ligador──▶ executável
```

C++ é **compilada** e **estaticamente tipada**: o tipo de cada variável é fixo e
verificado antes de o programa rodar.

```bash
g++ -std=c++17 -Wall -Wextra programa.cpp -o programa && ./programa
```

Ligue sempre `-Wall -Wextra`: os avisos do compilador pegam metade dos bugs de iniciante.

### 2. Tipos, variáveis e expressões

| Tipo | Tamanho típico | Faixa / uso |
|---|---|---|
| `bool` | 1 byte | `true` / `false` |
| `char` | 1 byte | um caractere (na verdade, um inteiro pequeno) |
| `int` | 4 bytes | $-2^{31}$ a $2^{31}-1$ |
| `long long` | 8 bytes | $\approx \pm 9{,}2 \times 10^{18}$ |
| `double` | 8 bytes | ponto flutuante com ~16 dígitos |

Armadilhas clássicas:
- **Divisão inteira:** `7 / 2 == 3`. Para obter 3,5 escreva `7.0 / 2`.
- **Overflow:** `int x = 2147483647; x + 1` é comportamento indefinido.
- **Comparação de `double` com `==`**: use uma tolerância (veja [Ponto flutuante](https://davifmn.github.io/computacao-UFMG-resumo/periodo-01/introducao-a-computacao/visualizacoes/ponto-flutuante.html)).
- **`=` × `==`**: `if (x = 0)` atribui e é sempre falso.

### 3. Controle de fluxo

`if`/`else`, `switch`, `while`, `do-while` e `for`. Todo laço deveria ter uma
**invariante** (algo que é verdade no início de cada iteração) e uma **medida
que diminui** (que garante o término). Por exemplo, na busca binária: "se `x` está no
vetor, está em `v[ini..fim]`", e `fim - ini` diminui a cada iteração.

### 4. Funções e modularização

- **Passagem por valor** (padrão): a função recebe uma **cópia**.
- **Passagem por referência** (`int &x`) ou **por ponteiro** (`int *x`): a função pode alterar a variável original.
- Cada chamada cria um **quadro na pilha** com parâmetros e variáveis locais, que é destruído no `return`.

Divida o programa em funções pequenas, com um único propósito e nomes que dizem o que
fazem. Separe a declaração (`.h`) da implementação (`.cpp`) e compile com `make`.

### 5. Vetores e matrizes

`int v[5]` são 5 inteiros **contíguos** na memória. Os índices vão de `0` a `4`, e
acessar `v[5]` **não dá erro de compilação**: lê lixo ou derruba o programa. Matrizes
`int m[3][4]` são guardadas linha após linha (*row-major*). Ao passar um vetor para uma
função, passa-se o endereço do primeiro elemento, então a função **altera o original**.

### 6. Ponteiros e alocação dinâmica

| Expressão | Significado |
|---|---|
| `&x` | endereço de `x` |
| `int *p = &x;` | `p` guarda o endereço de `x` |
| `*p` | o valor no endereço guardado em `p` |
| `p + i` | endereço `i` elementos à frente (`i * sizeof(*p)` bytes) |
| `v[i]` | açúcar sintático para `*(v + i)` |
| `new T` / `delete p` | aloca / libera um `T` no **heap** |
| `new T[n]` / `delete[] p` | aloca / libera um vetor no heap |

Os três pecados: **vazamento** (esquecer o `delete`), **ponteiro pendente** (usar depois
do `delete`) e **liberação dupla**. Depois do `delete`, faça `p = nullptr`.

### 7. Recursão

Uma função recursiva precisa de **caso base** e de **passo recursivo** que se aproxima
dele. A pilha de chamadas guarda cada chamada pendente, então a profundidade da
recursão consome memória. Recursões que recalculam os mesmos subproblemas (Fibonacci
ingênuo) têm custo exponencial, e a **memoização** resolve isso guardando os resultados.

### 8. Ordenação e busca

| Algoritmo | Tempo (pior caso) | Ideia |
|---|---|---|
| Busca sequencial | $O(n)$ | olha um por um |
| Busca binária | $O(\log n)$ | descarta metade (exige vetor ordenado) |
| Bubble Sort | $O(n^2)$ | troca vizinhos fora de ordem |
| Selection Sort | $O(n^2)$ | seleciona o menor e o põe no lugar |
| Insertion Sort | $O(n^2)$, $O(n)$ se quase ordenado | insere cada elemento na parte ordenada |

### 9. Structs, TADs e boas práticas

`struct` agrupa dados relacionados (`struct Aluno { string nome; double nota; };`). Um
**Tipo Abstrato de Dados** esconde a representação atrás de operações. Essa é a ponte
para as classes e a orientação a objetos de PDS II. Teste seu código com casos
pequenos, casos-limite (vetor vazio, 1 elemento, repetidos) e `assert`.

## 💻 Código

Todos os programas compilam com `-Wall -Wextra -pedantic` sem avisos e se testam com `assert`:

```bash
cd codigo && make test
```

| Arquivo | Conteúdo |
|---|---|
| [`ordenacao.cpp`](codigo/ordenacao.cpp) | Bubble, Selection e Insertion Sort + testes |
| [`busca.cpp`](codigo/busca.cpp) | Busca sequencial, binária iterativa e recursiva |
| [`recursao.cpp`](codigo/recursao.cpp) | Fatorial, Fibonacci ingênuo × memoizado × iterativo (conta as chamadas!) |
| [`ponteiros.cpp`](codigo/ponteiros.cpp) | O programa da visualização, `troca` por ponteiro e por referência, vetores no heap |

## ✍️ Exercícios

1. Qual a saída de `int a = 5, *p = &a, **pp = &p; **pp = 10; cout << a;`?
2. Escreva `int maximo(int v[], int n)` recursiva.
3. Quantas comparações o Selection Sort faz para $n = 100$? E o Bubble Sort (com `trocou`) num vetor já ordenado?
4. Por que `int *f() { int x = 3; return &x; }` é um erro grave?
5. Modifique a busca binária para devolver a **primeira** ocorrência de `x` num vetor com repetidos.

<details>
<summary>Gabarito</summary>

1. `10`: `pp` aponta para `p`, que aponta para `a`, e `**pp` é o próprio `a`.
2. ```cpp
   int maximo(int v[], int n) {
       if (n == 1) return v[0];
       int m = maximo(v, n - 1);
       return v[n - 1] > m ? v[n - 1] : m;
   }
   ```
3. Selection: $\frac{100 \cdot 99}{2} = 4950$, sempre. Bubble com `trocou` num vetor ordenado: $n - 1 = 99$.
4. `x` é local: vive no quadro de `f` na pilha, que é destruído no `return`. O ponteiro devolvido fica pendente.
5. Quando `v[meio] == x`, guarde `resp = meio` e continue procurando à esquerda (`fim = meio - 1`). Ao final, devolva `resp`.

</details>

## 🔗 Para ir além

- [C++ Reference](https://en.cppreference.com/) — a documentação de referência.
- [VisuAlgo](https://visualgo.net/) — mais visualizações de algoritmos.
- [Python Tutor](https://pythontutor.com/cpp.html) — executa C++ passo a passo mostrando a memória.
