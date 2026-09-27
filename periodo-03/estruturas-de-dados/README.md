# Estruturas de Dados · DCC221

> 3º período · 60h · Pré-requisito: PDS II · Leva a Algoritmos I e II.

Como organizar dados na memória para que as operações que importam sejam rápidas.
É a disciplina que transforma "programar" em "programar bem": a mesma tarefa pode levar
um milissegundo ou uma hora dependendo da estrutura escolhida.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔗 | [Listas encadeadas](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/estruturas-de-dados/visualizacoes/listas.html) | Inserir no início, no fim e de forma ordenada, buscar e remover, com os ponteiros `cabeca`, `atual`, `anterior` e `novo` se movendo linha a linha |
| 📚 | [Pilhas e filas](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/estruturas-de-dados/visualizacoes/pilha-fila.html) | Pilha em vetor, fila circular desenhada como um anel (com o "mesmo vetor na memória") e a verificação de parênteses balanceados |
| 🌳 | [Árvores de busca e AVL](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/estruturas-de-dados/visualizacoes/arvores.html) | Inserção, busca, remoção (3 casos), os 4 percursos e as **rotações da AVL**: os nós trocam de lugar na tela. Compare ABB × AVL inserindo 1…7 em ordem |
| 📊 | [Ordenação O(n log n)](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/estruturas-de-dados/visualizacoes/ordenacao-avancada.html) | Merge sort (com o vetor auxiliar), quicksort (pivô e partição) e heapsort (o heap desenhado como árvore sobre o vetor) |
| #️⃣ | [Tabelas hash](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/estruturas-de-dados/visualizacoes/hash.html) | Função de hash, colisões, encadeamento separado × sondagem linear, agrupamento e a marca de "removido" |

## 📚 Resumo teórico

### 1. Análise de complexidade

- Conte operações em função do tamanho $n$ da entrada e fique com o termo dominante.
- $O$ (limite superior), $\Omega$ (inferior) e $\Theta$ (justo). Formalmente, $f = O(g)$ se $f(n) \le c\,g(n)$ para todo $n \ge n_0$.
- Hierarquia: $1 < \log n < n < n \log n < n^2 < 2^n < n!$.
- Pior caso, caso médio e **análise amortizada** (ex.: `push_back` do vetor dinâmico: $O(1)$ amortizado).

### 2. Tipos Abstratos de Dados (TADs)

O TAD define **o que** (operações e comportamento) e esconde **como** (a representação). Exemplo: a pilha tem `empilha`, `desempilha`, `topo` e `vazia`, e pode ser feita com vetor ou com lista.

### 3. Listas, pilhas e filas

| Estrutura | Acesso | Inserção/remoção nas pontas | No meio |
|---|---|---|---|
| Vetor | $O(1)$ por índice | fim $O(1)$ amortizado; início $O(n)$ | $O(n)$ |
| Lista encadeada | $O(n)$ | $O(1)$ (com ponteiro para a cauda) | $O(1)$ com o nó em mãos |
| Pilha (LIFO) | só o topo | $O(1)$ | — |
| Fila (FIFO) circular | só a frente | $O(1)$ | — |

Variações: lista duplamente encadeada, circular e com nó sentinela.

### 4. Árvores

- **Árvore binária de busca:** esquerda < nó < direita. Busca, inserção e remoção em $O(h)$.
- A altura $h$ vai de $\log_2 n$ (balanceada) até $n$ (degenerada).
- **AVL:** fator de balanço $\in \{-1, 0, 1\}$ em todo nó, garantido por rotações simples (LL, RR) e duplas (LR, RL). Isso dá $h = O(\log n)$.
- **Percursos:** pré-ordem, em ordem (ordenado!), pós-ordem e largura (com fila).
- **Heap:** árvore completa em vetor (filhos de $i$ em $2i+1$ e $2i+2$). Inserir e remover o máximo em $O(\log n)$, construir em $O(n)$. É a base da **fila de prioridade**.
- Outras: rubro-negra, árvore B/B+ (bancos de dados), trie (prefixos).

### 5. Ordenação

| Algoritmo | Tempo | Memória | Estável |
|---|---|---|---|
| Insertion | $O(n^2)$ ($O(n)$ se quase ordenado) | $O(1)$ | sim |
| Merge sort | $O(n \log n)$ sempre | $O(n)$ | sim |
| Quicksort | $O(n \log n)$ médio, $O(n^2)$ pior | $O(\log n)$ | não |
| Heapsort | $O(n \log n)$ sempre | $O(1)$ | não |
| Counting/Radix | $O(n + k)$ | $O(n + k)$ | sim |

Limite inferior para ordenação por comparação: $\Omega(n \log n)$.

### 6. Pesquisa

Busca sequencial $O(n)$, binária $O(\log n)$, árvores balanceadas $O(\log n)$ e **hashing** $O(1)$ em média.
- Colisões: encadeamento separado ou endereçamento aberto (linear, quadrático, hash duplo).
- Fator de carga $\alpha = n/M$, com redimensionamento quando $\alpha$ passa de um limite.

## 💻 Código

```bash
cd codigo && make test
```

| Arquivo | Conteúdo |
|---|---|
| [`lista.cpp`](codigo/lista.cpp) | Lista encadeada com regra dos três, inserção ordenada, remoção e **inversão em O(1) de memória** |
| [`arvore.cpp`](codigo/arvore.cpp) | AVL completa (inserção e remoção com rebalanceamento), validada contra `std::set` em 20 mil operações |
| [`ordenacao.cpp`](codigo/ordenacao.cpp) | Merge, quick (pivô aleatório, recursão no lado menor) e heapsort, com **benchmark** de 1 milhão de números contra `std::sort` |
| [`hash.cpp`](codigo/hash.cpp) | Tabela hash com sondagem linear, hash polinomial de strings, marcas de remoção e redimensionamento |

## ✍️ Exercícios

1. Qual a complexidade de inverter uma lista encadeada? E de achar o seu k-ésimo elemento a partir do fim?
2. Insira 50, 30, 20, 40, 45 numa AVL vazia. Quais rotações acontecem?
3. Qual a altura mínima de uma árvore binária com 1000 nós? E a máxima?
4. Por que o quicksort com pivô = último elemento é $O(n^2)$ num vetor já ordenado?
5. Numa tabela hash com sondagem linear, $M = 7$, $h(k) = k \bmod 7$, insira 10, 17, 24, 3. Onde fica cada chave?

<details>
<summary>Gabarito</summary>

1. Inverter: $O(n)$ de tempo e $O(1)$ de memória (veja `inverte()` em `lista.cpp`). k-ésimo a partir do fim: $O(n)$, com dois ponteiros separados por k nós.
2. Inserir 20 desbalanceia o 50 (caso LL): rotação à direita em 50, e a raiz vira 30. Inserir 45 desbalanceia o 50 com 45 à esquerda de 50 e à direita de 40 (caso LR): rotação à esquerda em 40 e depois à direita em 50. Confira no [simulador](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/estruturas-de-dados/visualizacoes/arvores.html).
3. Mínima: $\lceil \log_2 1001 \rceil = 10$. Máxima: 1000 (uma lista).
4. Cada partição separa só o pivô (o maior) do resto: $n + (n-1) + \dots = O(n^2)$.
5. 10 → posição 3; 17 → 3 ocupada → 4; 24 → 3, 4 ocupadas → 5; 3 → 3, 4, 5 ocupadas → 6. Um exemplo típico de agrupamento primário.

</details>

## 🔗 Para ir além

- *Projeto de Algoritmos*, Nivio Ziviani (UFMG), o livro-texto clássico da disciplina.
- [VisuAlgo](https://visualgo.net/) e [Data Structure Visualizations (USF)](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html).
