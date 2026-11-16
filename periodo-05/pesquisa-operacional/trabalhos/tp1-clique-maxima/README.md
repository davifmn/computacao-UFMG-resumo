# TP1 · Clique máxima por programação inteira

**Pesquisa Operacional (DCC035) · UFMG** · Julia · JuMP + HiGHS

Uma **clique** é um conjunto de vértices dois a dois adjacentes. Achar a maior clique de um
grafo é NP-difícil, mas o problema cabe numa formulação de programação linear inteira
muito curta, que um resolvedor de branch and bound resolve bem para grafos médios.

## Modelo

Uma variável binária por vértice, $x_i = 1$ se o vértice $i$ está na clique:

$$
\begin{aligned}
\max\ & \sum_{i=1}^{n} x_i \\
\text{s.a. } & x_i + x_j \le 1 && \text{para todo par } \{i, j\} \text{ que não é aresta} \\
& x_i \in \{0, 1\}
\end{aligned}
$$

Dois vértices não vizinhos não podem estar juntos na clique; fora isso, quanto mais
vértices, melhor. O número de restrições é o número de **não arestas**, então a
formulação é mais compacta em grafos densos.

> A relaxação linear dessa formulação é fraca (com $x_i = 1/2$ para todos, todas as
> restrições valem e o objetivo é $n/2$). Formulações mais fortes trocam as restrições de
> pares por uma restrição por **conjunto independente**, $\sum_{i \in I} x_i \le 1$.

## Como executar

Requer [Julia](https://julialang.org/downloads/) com os pacotes JuMP e HiGHS:

```bash
julia -e 'using Pkg; Pkg.add(["JuMP", "HiGHS"])'
julia clique_maxima.jl instancias/exemplo.txt
```

Formato da instância (campos separados por tabulação):

```
n	12
e	1	3
e	1	4
...
```

A instância `instancias/exemplo.txt` tem 12 vértices e 36 arestas, com uma clique de
tamanho 5 plantada. Por força bruta, a clique máxima tem **5** vértices, e há três delas:
{2, 5, 7, 9, 11}, {2, 7, 8, 9, 11} e {6, 7, 8, 9, 11}; o resolvedor deve imprimir
tamanho 5 e uma delas.

## O que mudou na migração

O modelo é o mesmo. O arquivo `tp1_<matrícula>.jl` virou `clique_maxima.jl`, a saída
deixou de imprimir a matrícula e passou a listar os vértices da clique, e foi incluída
uma instância de exemplo. O ambiente da migração não tinha Julia, então o arquivo não foi
reexecutado; o resultado esperado acima foi conferido por força bruta.

## Veja também

- Teoria de programação inteira e branch and bound: [README de Pesquisa Operacional](../../README.md)
- Visualização: [branch and bound no plano](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/pesquisa-operacional/visualizacoes/branch-and-bound.html)

---
Autor: Davi Fraga · migrado de [`davifmn/Maximum-Clique-Problem`](https://github.com/davifmn/Maximum-Clique-Problem)
