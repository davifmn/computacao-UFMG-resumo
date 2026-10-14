# Algoritmos II · DCC207

> 5º período · 60h · Departamento de Ciência da Computação · pré-requisito: Algoritmos I.

Algoritmos I ensinou as técnicas (guloso, divisão e conquista, programação dinâmica) sobre
grafos. Algoritmos II as aplica a outros domínios, como **cadeias de caracteres** (busca
e compressão) e **geometria computacional**, e encara os problemas para os quais não se
conhece algoritmo eficiente: **NP-completude**, e o que fazer depois de provar que um
problema é difícil (**algoritmos aproximativos**).

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔎 | [Casamento de padrões](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/algoritmos-2/visualizacoes/casamento-de-padroes.html) | Força bruta, KMP e Horspool sobre o mesmo texto, com o padrão deslizando, a função de falha sendo construída (bordas destacadas), a tabela de saltos e o número de comparações de cada um |
| 🗜️ | [Compressão](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/algoritmos-2/visualizacoes/compressao.html) | A floresta de Huffman se fundindo até virar a árvore de códigos, comparada com a entropia; e o dicionário do LZW crescendo enquanto o texto é lido |
| 📐 | [Envoltória convexa](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/algoritmos-2/visualizacoes/envoltoria-convexa.html) | Cadeia monótona de Andrew (pilha e testes de orientação) e embrulho para presente de Jarvis; clique para acrescentar pontos |
| 🧭 | [NP-completude e aproximação](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/algoritmos-2/visualizacoes/aproximacao.html) | 2-aproximações para cobertura por vértices (emparelhamento maximal) e caixeiro viajante métrico (árvore geradora + pré-ordem), comparadas com o ótimo por força bruta |

## 📚 Resumo teórico

### 1. Casamento de padrões

- **Força bruta**: $O((n - m + 1)m)$. Rápida em texto comum, quadrática em $t = a^n$, $p = a^{m-1}b$.
- **KMP**: a **função de falha** $f[i]$ = maior borda própria (prefixo que também é sufixo) de $p[0..i]$. Ao falhar com $q$ caracteres casados, o padrão continua de $f[q-1]$, sem recuar no texto. $O(n + m)$ por análise amortizada.
- **Boyer-Moore / Horspool**: compara da direita para a esquerda e salta pelo último caractere da janela (Horspool) ou pelas regras do "mau caractere" e do "bom sufixo" (BM). Sublinear no caso médio.
- **Rabin-Karp**: hash de janela deslizante, $O(n + m)$ esperado; bom para vários padrões.
- **Tries, árvores e vetores de sufixos**: indexam o texto; cada busca custa $O(m)$ (+ $\log n$ no vetor de sufixos). O vetor de sufixos se constrói em $O(n \log n)$ por duplicação de prefixos.

### 2. Compressão

- **Códigos de prefixo** ↔ árvores binárias. Custo $\sum f(c) \cdot \text{prof}(c)$.
- **Huffman**: junta sempre as duas menores frequências. Ótimo (prova por escolha gulosa + subestrutura ótima). $H \le \bar L < H + 1$, com $H$ a entropia.
- **LZ77** (janela deslizante, base do DEFLATE/gzip) e **LZ78/LZW** (dicionário implícito, GIF). O decodificador reconstrói o dicionário sozinho.
- Nenhum método sem perdas comprime todas as entradas (casa dos pombos).

### 3. Geometria computacional

- **Orientação**: $\text{cruz}(o, a, b) = (a - o) \times (b - o)$, exato com inteiros. Base para interseção de segmentos e ponto em polígono.
- **Envoltória convexa**: Graham/Andrew $O(n \log n)$, Jarvis $O(nh)$, Chan $O(n \log h)$; limite inferior $\Omega(n \log n)$ por redução da ordenação.
- **Varredura (sweep line)**: interseções de $n$ segmentos em $O((n + k) \log n)$ (Bentley-Ottmann); **par de pontos mais próximos** por divisão e conquista em $O(n \log n)$.

### 4. NP-completude

- Classes **P** e **NP** (verificação polinomial de certificados); **reduções polinomiais** $A \le_p B$.
- **NP-completo** = em NP + NP-difícil. Cook-Levin: SAT. Cadeia clássica: SAT → 3-SAT → Clique → Cobertura por vértices; 3-SAT → Ciclo hamiltoniano → Caixeiro; 3-SAT → Soma de subconjuntos → Mochila; 3-coloração.
- P = NP? Se um único NP-completo estiver em P, todos estão.

### 5. Lidando com problemas difíceis

- **Aproximação** com garantia $\rho$: cobertura por vértices (2), caixeiro métrico (2 com MST; 1,5 com Christofides), cobertura de conjuntos ($\ln n$, guloso), mochila (FPTAS).
- **Inaproximabilidade**: caixeiro geral não admite fator constante, a menos que P = NP.
- **Algoritmos exatos exponenciais** (backtracking, branch and bound, Held-Karp $O(n^2 2^n)$) e **heurísticas** (busca local, 2-opt, metaheurísticas).

## 💻 Código

```bash
cd codigo && make test
```

| Arquivo | Conteúdo |
|---|---|
| [`cadeias.cpp`](codigo/cadeias.cpp) | Força bruta, KMP e Horspool conferidos entre si em 20 mil textos aleatórios; Huffman com decodificação; LZW com o decodificador (incluindo o caso cScSc) |
| [`geometria.cpp`](codigo/geometria.cpp) | Andrew e Jarvis comparados com uma envoltória por força bruta em 3000 nuvens de pontos, interseção de segmentos, 2-aproximações de cobertura por vértices e caixeiro métrico contra o ótimo |

## ✍️ Exercícios

1. Calcule a função de falha de `ABACABAB`.
2. Quantas comparações a força bruta faz para achar `AAAB` em `AAAAAAAAAA`? E o KMP?
3. Construa o código de Huffman para as frequências A = 45, B = 13, C = 12, D = 16, E = 9, F = 5 (exemplo do CLRS). Quantos bits por símbolo, em média?
4. Codifique `ABABABA` com LZW (dicionário inicial só com A = 0 e B = 1).
5. Mostre que, se $X \le_p Y$ e $Y \in$ P, então $X \in$ P.
6. Dê um grafo em que a 2-aproximação da cobertura por vértices devolve exatamente o dobro do ótimo.
7. Mostre que Clique $\le_p$ Cobertura por vértices. (Dica: complemento do grafo.)

<details>
<summary>Gabarito</summary>

1. `0 0 1 0 1 2 3 2`.
2. Força bruta: 7 alinhamentos × 4 comparações = **28**. KMP: a função de falha de `AAAB` é `0 1 2 0`. Os 3 primeiros `A` casam (3 comparações); daí em diante, cada um dos 7 caracteres restantes falha contra o `B`, recua para $q = f[2] = 2$ e casa com o `A`: 2 comparações cada. Total **3 + 14 = 17** (no máximo $2n = 20$).
3. A = 0, C = 100, B = 101, F = 1100, E = 1101, D = 111. Custo $45 \cdot 1 + (12 + 13 + 16) \cdot 3 + (5 + 9) \cdot 4 = 224$ bits por 100 símbolos: **2,24 bits/símbolo** (contra 3 num código fixo).
4. Saída `0 1 2 4`: emite A (aprende AB = 2), B (BA = 3), AB (ABA = 4), ABA. O último código é o caso cScSc.
5. Dada uma instância $x$ de $X$, calcule $f(x)$ em tempo $p(|x|)$ (logo $|f(x)| \le p(|x|)$) e rode o algoritmo de $Y$, que leva $q(|f(x)|) \le q(p(|x|))$: composição de polinômios é polinômio.
6. Um emparelhamento perfeito com $k$ arestas isoladas: o algoritmo leva $2k$ vértices, o ótimo, $k$. (Ou $K_{n,n}$ processado na ordem de um emparelhamento perfeito.)
7. $S$ é clique em $G$ ⇔ $S$ é conjunto independente em $\bar G$ ⇔ $V \setminus S$ é cobertura de $\bar G$. Logo $G$ tem clique de tamanho $k$ ⇔ $\bar G$ tem cobertura de tamanho $|V| - k$. Construir $\bar G$ é $O(|V|^2)$.

</details>

## 🔗 Para ir além

- *Algoritmos*, Cormen, Leiserson, Rivest e Stein (CLRS): caps. 32 (cadeias), 16.3 (Huffman), 33 (geometria), 34 (NP-completude) e 35 (aproximação).
- *Projeto de Algoritmos*, Nivio Ziviani (DCC/UFMG): processamento de cadeias e compressão, com a escola de recuperação de informação do DCC.
- *Algorithm Design*, Kleinberg e Tardos, caps. 8 e 11: as melhores explicações de reduções e de aproximação.
- *Computers and Intractability*, Garey e Johnson: o catálogo clássico de problemas NP-completos.
