# Matemática Discreta · DCC216

> 2º período · 60h · Pré-requisito: Introdução à Lógica Computacional · Leva a Fundamentos da Teoria da Computação e a Algoritmos.

A matemática dos objetos **contáveis**, que é exatamente com o que um computador trabalha.
É aqui que você aprende a **provar** coisas (indução, contradição, contraposição) e ganha as
ferramentas para contar, analisar recorrências e raciocinar sobre relações e números inteiros.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔐 | [De Euclides ao RSA](visualizacoes/teoria-dos-numeros.html) | Euclides estendido como ladrilhamento de um retângulo por quadrados, tabela de multiplicação mod n (quem tem inverso) e um RSA de brinquedo que cifra a sua mensagem |
| 🕸️ | [Relações](visualizacoes/relacoes.html) | Matriz ↔ grafo dirigido, propriedades com contraexemplos, classes de equivalência e o fecho transitivo (Warshall) passo a passo |
| 🔢 | [Contagem](visualizacoes/contagem.html) | Os quatro modos de escolher (ordem × repetição) com todas as possibilidades listadas, triângulo de Pascal interativo (e Sierpinski!) e exercícios gerados |
| 🗼 | [Indução e recorrência](visualizacoes/inducao-e-recorrencia.html) | Torre de Hanói com a pilha de chamadas, a recorrência $T(n) = 2T(n-1) + 1$ e a prova por indução de que $T(n) = 2^n - 1$ |

## 📚 Resumo teórico

### 1. Técnicas de prova

| Técnica | Para provar $P \Rightarrow Q$ | Exemplo |
|---|---|---|
| Direta | assuma $P$, deduza $Q$ | soma de pares é par |
| Contraposição | assuma $\neg Q$, deduza $\neg P$ | se $n^2$ é par, $n$ é par |
| Contradição | assuma $P \land \neg Q$, chegue a um absurdo | $\sqrt 2$ é irracional; há infinitos primos |
| Indução | base + passo | $1 + \dots + n = n(n+1)/2$ |
| Contraexemplo | (para refutar um "para todo") | $n^2 + n + 41$ não é sempre primo ($n = 40$) |

### 2. Conjuntos, funções e cardinalidade

- Operações: $\cup, \cap, \setminus$, complemento, produto cartesiano, conjunto das partes ($|\mathcal P(A)| = 2^{|A|}$).
- Funções **injetoras**, **sobrejetoras** e **bijetoras**; composição e inversa.
- **Cardinalidade:** $\mathbb N$, $\mathbb Z$ e $\mathbb Q$ são enumeráveis; $\mathbb R$ não é (diagonal de Cantor). Isso volta em Teoria da Computação: existem problemas que nenhum programa resolve.

### 3. Relações

Propriedades: reflexiva, simétrica, antissimétrica, transitiva.
- **Equivalência** (R + S + T) ⇒ partição em classes. Exemplo: congruência módulo $n$.
- **Ordem parcial** (R + A + T), com diagrama de Hasse, elementos minimal e maximal, e ordenação topológica.
- **Fechos** reflexivo, simétrico e transitivo (Warshall, $O(n^3)$).

### 4. Teoria dos números

- **Divisibilidade**, primos, **Teorema Fundamental da Aritmética** (fatoração única).
- $\text{mdc}$ pelo **algoritmo de Euclides**: $\text{mdc}(a, b) = \text{mdc}(b, a \bmod b)$, em $O(\log n)$ passos.
- **Bézout:** $\text{mdc}(a,b) = as + bt$, com $s, t$ achados pelo Euclides estendido.
- **Congruências:** $a \equiv b \pmod n$. $a$ tem inverso mod $n$ $\iff$ $\text{mdc}(a, n) = 1$.
- **Pequeno Teorema de Fermat:** $a^{p-1} \equiv 1 \pmod p$. Euler: $a^{\varphi(n)} \equiv 1 \pmod n$.
- **RSA:** $n = pq$, $ed \equiv 1 \pmod{\varphi(n)}$, cifra $c = m^e$, decifra $m = c^d$.
- **Teorema Chinês do Resto:** sistemas de congruências com módulos coprimos têm solução única módulo o produto.

### 5. Contagem

| | Sem repetição | Com repetição |
|---|---|---|
| **Ordem importa** | $\frac{n!}{(n-k)!}$ (arranjo) | $n^k$ |
| **Ordem não importa** | $\binom{n}{k}$ (combinação) | $\binom{n+k-1}{k}$ (estrelas e barras) |

Também: princípios aditivo e multiplicativo, permutações com repetição ($\frac{n!}{n_1! n_2! \cdots}$),
**inclusão-exclusão**, **casa dos pombos** e o binômio de Newton.

### 6. Indução e recorrências

- **Indução fraca, forte e estrutural.** Um algoritmo recursivo correto *é* uma prova por indução.
- **Recorrências lineares homogêneas:** equação característica ($a_n = c_1 a_{n-1} + c_2 a_{n-2} \Rightarrow r^2 = c_1 r + c_2$).
- **Resolução por substituição / árvore de recursão:** $T(n) = 2T(n/2) + n = \Theta(n \log n)$ (o Teorema Mestre vem em Algoritmos I).

### 7. Grafos (introdução)

Vértices e arestas, grau (soma dos graus $= 2|E|$), caminhos, ciclos, conexidade, árvores
($|E| = |V| - 1$), grafos bipartidos, caminhos eulerianos (todos os vértices com grau par) e
hamiltonianos. Grafos são aprofundados em Algoritmos I.

## 💻 Código

[`codigo/discreta.py`](codigo/discreta.py): Euclides estendido, inverso e potência modular,
RSA completo, Warshall, teste de equivalência, contagem com `itertools` e Hanói, com testes.

## ✍️ Exercícios

1. Prove por indução que $3 \mid (n^3 - n)$ para todo $n \ge 0$.
2. Calcule $7^{-1} \bmod 26$.
3. Quantas senhas de 8 caracteres usam letras minúsculas e dígitos e têm **pelo menos um dígito**?
4. A relação $a \mathrel{R} b \iff |a - b| \le 1$ sobre $\mathbb Z$ é de equivalência?
5. Resolva $a_n = 5a_{n-1} - 6a_{n-2}$ com $a_0 = 1$, $a_1 = 4$.

<details>
<summary>Gabarito</summary>

1. Base: $0$. Passo: $(n+1)^3 - (n+1) = (n^3 - n) + 3n^2 + 3n$. O primeiro termo é múltiplo de 3 pela hipótese, e o resto também.
2. $7 \cdot 15 = 105 = 4 \cdot 26 + 1$, logo $7^{-1} \equiv 15$.
3. Complemento: $36^8 - 26^8 \approx 2{,}61 \times 10^{12}$.
4. Não: é reflexiva e simétrica, mas não transitiva ($1 R 2$, $2 R 3$, mas não $1 R 3$).
5. $r^2 = 5r - 6 \Rightarrow r \in \{2, 3\}$. Com $a_n = \alpha 2^n + \beta 3^n$: $\alpha + \beta = 1$ e $2\alpha + 3\beta = 4$ ⇒ $\beta = 2$, $\alpha = -1$. Logo $a_n = 2\cdot 3^n - 2^n$.

</details>

## 🔗 Para ir além

- *Matemática Discreta e suas Aplicações*, Kenneth Rosen — o livro-texto clássico.
- [Mathematics for Computer Science](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf) (MIT, gratuito) — Lehman, Leighton e Meyer.
- [Project Euler](https://projecteuler.net/) — problemas de matemática discreta para resolver programando.
