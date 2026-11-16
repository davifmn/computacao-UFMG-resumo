# TP2 · Caixeiro viajante: exato × aproximado

**Algoritmos II (DCC207) · UFMG** · Python · networkx

O caixeiro viajante (TSP) pede o ciclo de menor custo que visita cada cidade uma vez. É
NP-difícil, então o trabalho compara três estratégias no caso **métrico** (distâncias
euclidianas, que respeitam a desigualdade triangular):

| Método | Tipo | Garantia | Custo |
|---|---|---|---|
| Branch and bound | exato | ótimo | exponencial no pior caso; viável até ~12 cidades |
| Twice around the tree | aproximação | ≤ 2 · ótimo | domina a árvore geradora mínima, O(n² log n) no grafo completo |
| Christofides | aproximação | ≤ 1,5 · ótimo | domina o emparelhamento perfeito mínimo, O(n³) |

## Como funciona

**Twice around the tree.** Árvore geradora mínima T (Prim) → duplica cada aresta, o que
deixa todos os graus pares → circuito euleriano → pula vértices repetidos (*atalhos*).
Como tirar uma aresta do ciclo ótimo dá uma árvore, custo(T) ≤ ótimo, e a rota custa no
máximo 2 · custo(T).

**Christofides.** Em vez de duplicar a árvore, corrige só os vértices de grau ímpar de T
com um **emparelhamento perfeito de peso mínimo** M entre eles. custo(M) ≤ ótimo/2, então
a rota custa no máximo 1,5 · ótimo.

**Branch and bound.** Busca em profundidade sobre rotas parciais que começam na cidade 0,
começando com a rota do vizinho mais próximo como limite superior. Um ramo é cortado
quando *custo parcial + limite inferior* ≥ *melhor rota*, com o limite inferior somando a
aresta mais barata que sai de cada cidade ainda não visitada.

## Como executar

```bash
pip install networkx            # e matplotlib, para o --grafico
python3 caixeiro_viajante.py            # tabela comparando os três métodos
python3 caixeiro_viajante.py --grafico  # desenha as três rotas
python3 -m unittest test_caixeiro_viajante.py
```

Saída típica:

```
  n  método                    custo  /ótimo  tempo (ms)
 12  branch and bound         2.7979   1.000      172.10
 12  twice around the tree    3.1085   1.111        0.45
 12  Christofides             2.8686   1.025        0.49
```

Na prática as aproximações ficam bem abaixo do pior caso garantido, e o branch and bound
explode rápido: cada cidade a mais multiplica o tempo.

## Testes

`test_caixeiro_viajante.py` gera 75 instâncias aleatórias e confere que:
- os três métodos devolvem ciclos hamiltonianos;
- o branch and bound encontra o mesmo custo que a força bruta;
- twice around the tree ≤ 2 · ótimo e Christofides ≤ 1,5 · ótimo.

## O que mudou na migração

O trabalho original era um notebook. Ele virou um módulo com testes, e três erros do
notebook foram corrigidos:

1. **Christofides usava `max_weight_matching`**, o emparelhamento de peso **máximo**. A
   garantia de 1,5 depende do emparelhamento perfeito de peso **mínimo**
   (`min_weight_matching`).
2. **As arestas paralelas se perdiam.** Árvore + emparelhamento (e a árvore duplicada)
   eram montados num `nx.Graph`, que funde arestas repetidas; o grafo podia deixar de ser
   euleriano. Agora é um `nx.MultiGraph`.
3. **Twice around the tree rodava sobre o grafo completo**, não sobre a árvore duplicada,
   e imprimia um circuito euleriano do K₇ inteiro em vez de uma rota. Agora usa a árvore.

O branch and bound também deixou de recomeçar a busca de cada uma das n cidades (num
ciclo, o ponto de partida não importa) e ganhou um limite inferior de verdade.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `caixeiro_viajante.py` | os três métodos e a comparação |
| `test_caixeiro_viajante.py` | testes de corretude e das garantias de aproximação |
| `relatorio.pdf` | relatório entregue (dezembro de 2023) |

## Veja também

- Teoria de NP-completude e aproximação: [README de Algoritmos II](../../README.md)
- Visualização: [NP-completude e aproximação, com a 2-aproximação pela árvore passo a passo](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/algoritmos-2/visualizacoes/aproximacao.html)

---
Autor: Davi Fraga · migrado de [`davifmn/trabalho2_alg2`](https://github.com/davifmn/trabalho2_alg2)
