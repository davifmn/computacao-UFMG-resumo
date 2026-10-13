# Algoritmos I · DCC206

> 4º período · 60h · Pré-requisito: Estruturas de Dados · Leva a Algoritmos II.

Estruturas de Dados ensinou a guardar dados; Algoritmos I ensina a **projetar** soluções e
a **provar** que estão certas e são eficientes. Metade do curso é sobre grafos (o modelo
de quase tudo: redes, mapas, dependências, estados de um programa) e a outra metade sobre
os grandes paradigmas: guloso, divisão e conquista e programação dinâmica.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🌊 | [BFS, DFS e ordenação topológica](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/algoritmos-1/visualizacoes/busca-em-grafos.html) | A fila da BFS e a pilha de chamadas da DFS, as cores branco/cinza/preto, tempos de descoberta/término, classificação das arestas (árvore, retorno, avanço, cruzamento) e a ordem de se vestir |
| 🛣️ | [Caminhos mínimos](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/algoritmos-1/visualizacoes/caminhos-minimos.html) | Dijkstra com a fila de prioridade e Bellman-Ford rodada a rodada; o grafo em que Dijkstra **erra** por causa de uma aresta negativa e a detecção de ciclo negativo |
| 🌲 | [Árvore geradora mínima](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/algoritmos-1/visualizacoes/arvore-geradora.html) | Kruskal com os conjuntos da união-busca coloridos e Prim crescendo a partir da raiz, no exemplo do CLRS (peso 37) |
| 🧮 | [Programação dinâmica](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/algoritmos-1/visualizacoes/programacao-dinamica.html) | Mochila 0/1, LCS e distância de edição: a tabela preenchida célula a célula, as dependências de cada célula e a reconstrução da solução |
| 🌳 | [Teorema mestre](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/algoritmos-1/visualizacoes/divisao-e-conquista.html) | A árvore de recursão de $T(n) = aT(n/b) + n^c$ e o custo de cada nível: raiz, folhas ou empate (merge sort, Karatsuba, Strassen) |

## 📚 Resumo teórico

### 1. Prova de corretude e análise

- **Invariante de laço**: vale antes da primeira iteração (inicialização), cada iteração o preserva (manutenção) e, ao final, implica o resultado (término).
- **Indução** para algoritmos recursivos; **argumento de troca** para gulosos ("dada uma solução ótima que não usa minha escolha, troco e não pioro").
- Recorrências: árvore de recursão, substituição e o **teorema mestre** para $T(n) = aT(n/b) + f(n)$.

### 2. Grafos: representação e busca

- **Lista de adjacência** ($O(V + E)$ de memória, ideal para grafos esparsos) × **matriz de adjacência** ($O(V^2)$, testa aresta em $O(1)$).
- **BFS** (fila): distâncias em número de arestas, $O(V + E)$. Testa se o grafo é **bipartido** (2-coloração por níveis).
- **DFS** (pilha/recursão): tempos $d[u]$ e $f[u]$, teorema dos parênteses, classificação de arestas. Existe aresta de retorno ⇔ existe ciclo.
- **Ordenação topológica** de um DAG: ordem decrescente de $f$ na DFS, ou algoritmo de Kahn (remove vértices de grau de entrada 0).
- **Componentes fortemente conexas**: Kosaraju (DFS no grafo, DFS no transposto em ordem decrescente de $f$) ou Tarjan, ambos $O(V + E)$.

### 3. Caminhos mínimos

| Algoritmo | Problema | Restrição | Custo |
|---|---|---|---|
| BFS | uma origem | sem pesos | $O(V + E)$ |
| Dijkstra | uma origem | pesos ≥ 0 | $O((V + E) \log V)$ com heap |
| Bellman-Ford | uma origem | detecta ciclo negativo | $O(VE)$ |
| DAG (ordem topológica) | uma origem | grafo acíclico | $O(V + E)$ |
| Floyd-Warshall | todos os pares | sem ciclo negativo | $O(V^3)$ |

Todos se baseiam no **relaxamento**: `if (dist[u] + w < dist[v]) dist[v] = dist[u] + w`.

### 4. Árvore geradora mínima

- **Propriedade do corte**: a aresta mais leve que cruza um corte está em alguma MST. **Propriedade do ciclo**: a mais pesada de um ciclo não está em nenhuma (com pesos distintos).
- **Kruskal**: arestas em ordem crescente, aceita se não formar ciclo (união-busca com compressão de caminho e união por posto, $O(\alpha(n))$ amortizado). $O(E \log E)$.
- **Prim**: cresce uma árvore pela aresta mais leve que sai dela. $O(E \log V)$ com heap.

### 5. Algoritmos gulosos

Escolha localmente ótima, sem voltar atrás. Funciona quando há **escolha gulosa segura** e **subestrutura ótima**. Clássicos: seleção de atividades (pelo menor término), códigos de **Huffman**, troco com moedas canônicas, mochila fracionária, Kruskal, Prim, Dijkstra.

### 6. Divisão e conquista

Dividir, conquistar recursivamente, combinar. Merge sort, quicksort, busca binária, multiplicação de Karatsuba ($n^{1,585}$), Strassen ($n^{2,81}$), par de pontos mais próximos ($O(n \log n)$), contagem de inversões.

### 7. Programação dinâmica

Para problemas com **subestrutura ótima** e **subproblemas sobrepostos**. Defina o subproblema, escreva a recorrência, ache a ordem de preenchimento, reconstrua a solução. Clássicos: Fibonacci, mochila 0/1 ($O(nW)$, pseudo-polinomial), LCS e distância de edição ($O(nm)$), maior subsequência crescente ($O(n \log n)$), multiplicação de cadeia de matrizes ($O(n^3)$), Floyd-Warshall.

## 💻 Código

```bash
cd codigo && make test
```

| Arquivo | Conteúdo |
|---|---|
| [`grafos.cpp`](codigo/grafos.cpp) | BFS, ordenação topológica com detecção de ciclo, Dijkstra, Bellman-Ford, união-busca, Kruskal e Prim. Testados nos exemplos do CLRS e comparados entre si em centenas de grafos aleatórios |
| [`pd.cpp`](codigo/pd.cpp) | Mochila 0/1 (tabela 2D com reconstrução e versão $O(W)$ de memória), LCS e distância de edição, conferidas contra força bruta |

## ✍️ Exercícios

1. Mostre que um grafo é bipartido se e somente se não tem ciclo de comprimento ímpar, e use a BFS para testá-lo.
2. Dê um grafo com 3 vértices e uma aresta negativa em que Dijkstra devolve uma distância errada.
3. Como achar o caminho mínimo de uma origem num DAG com pesos negativos em $O(V + E)$?
4. Prove que, se todos os pesos são distintos, a MST é única.
5. Resolva $T(n) = 3T(n/3) + n$, $T(n) = 2T(n/4) + 1$ e $T(n) = T(n/2) + n$.
6. Escreva a recorrência para o número de maneiras de dar troco de $n$ centavos com moedas de 1, 5, 10, 25 e 50.

<details>
<summary>Gabarito</summary>

1. (⇒) Num bipartido, todo ciclo alterna lados, então tem comprimento par. (⇐) Faça BFS e pinte pela paridade da distância; se uma aresta ligar dois vértices de mesma cor, ela fecha um ciclo ímpar com os caminhos até o ancestral comum. Na prática: o grafo é bipartido se e somente se nenhuma aresta liga dois vértices cujas distâncias da BFS têm a mesma paridade.
2. A→B (2), A→C (3), C→B (−2). Dijkstra finaliza B com 2, mas A→C→B custa 1. (É o mesmo fenômeno do grafo "com aresta negativa" da visualização.)
3. Ordene topologicamente e relaxe as arestas de cada vértice nessa ordem: quando $u$ é processado, todos os caminhos até ele já foram considerados.
4. Suponha duas MSTs $T_1 \ne T_2$ e seja $e$ a aresta mais leve na diferença simétrica, digamos $e \in T_1$. $T_2 + e$ tem um ciclo com uma aresta $f \notin T_1$, e $w(f) > w(e)$ (pesos distintos e $e$ é a mais leve da diferença). Então $T_2 + e - f$ é uma árvore geradora mais leve que $T_2$: contradição.
5. $\Theta(n \log n)$ (caso 2), $\Theta(\sqrt n)$ (caso 1: $\log_4 2 = 1/2 > 0$) e $\Theta(n)$ (caso 3).
6. $C[i][v]$ = maneiras de formar $v$ com as $i$ primeiras moedas: $C[i][v] = C[i-1][v] + C[i][v - m_i]$, com $C[\cdot][0] = 1$. Mesma estrutura da mochila, mas "ilimitada" (a segunda parcela fica na mesma linha $i$).

</details>

## 🔗 Para ir além

- *Algoritmos: Teoria e Prática* (CLRS), caps. 15, 16, 22 a 25: os exemplos das visualizações são os do livro.
- *Algorithm Design*, Kleinberg e Tardos: a melhor fonte para gulosos e programação dinâmica.
- [VisuAlgo](https://visualgo.net/) e o [CP-Algorithms](https://cp-algorithms.com/) para implementações de referência.
