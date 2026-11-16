"""TP2 de Algoritmos II (DCC207/UFMG): três abordagens para o caixeiro viajante.

O problema: dado um conjunto de cidades e as distâncias entre elas, achar o ciclo
hamiltoniano (visita cada cidade uma vez e volta à origem) de menor custo. É
NP-difícil, então o trabalho compara um método exato com duas aproximações para o
caso métrico (distâncias que respeitam a desigualdade triangular):

    branch_and_bound        exato; exponencial no pior caso, viável até ~12 cidades
    twice_around_the_tree   2-aproximação a partir da árvore geradora mínima
    christofides            1,5-aproximação: árvore + emparelhamento perfeito mínimo

Uso:
    python3 caixeiro_viajante.py            # compara os três em instâncias aleatórias
    python3 caixeiro_viajante.py --grafico  # e desenha as rotas (requer matplotlib)

Requer networkx (árvore geradora, emparelhamento e circuito euleriano).
"""

import math
import random
import sys
import time

import networkx as nx


# ---------------------------------------------------------------------------
# Instâncias
# ---------------------------------------------------------------------------

def pontos_aleatorios(n, semente=None):
    """n cidades no quadrado unitário."""
    rnd = random.Random(semente)
    return [(rnd.random(), rnd.random()) for _ in range(n)]


def grafo_completo(pontos):
    """Grafo completo com peso = distância euclidiana (logo, métrico)."""
    g = nx.Graph()
    for i, p in enumerate(pontos):
        for j in range(i + 1, len(pontos)):
            g.add_edge(i, j, weight=math.dist(p, pontos[j]))
    return g


def custo(g, rota):
    """Custo do ciclo que visita `rota` em ordem e volta ao início."""
    return sum(g[a][b]["weight"] for a, b in zip(rota, rota[1:] + rota[:1]))


def _atalhos(circuito):
    """Transforma um circuito euleriano em ciclo hamiltoniano pulando vértices repetidos.
    Pela desigualdade triangular, cada atalho nunca aumenta o custo."""
    rota, vistos = [], set()
    for u, _ in circuito:
        if u not in vistos:
            vistos.add(u)
            rota.append(u)
    return rota


# ---------------------------------------------------------------------------
# 2-aproximação: twice around the tree
# ---------------------------------------------------------------------------

def twice_around_the_tree(g):
    """1. árvore geradora mínima T (Prim);  2. duplica cada aresta de T, o que deixa
    todos os graus pares;  3. circuito euleriano;  4. atalhos.
    custo(T) <= ótimo (tirar uma aresta do ciclo ótimo dá uma árvore), e o passeio
    custa 2·custo(T), logo a rota custa no máximo 2·ótimo."""
    arvore = nx.minimum_spanning_tree(g, algorithm="prim")
    dobrada = nx.MultiGraph()
    dobrada.add_edges_from(arvore.edges(data=True))
    dobrada.add_edges_from(arvore.edges(data=True))  # multigrafo: as cópias não se fundem
    return _atalhos(nx.eulerian_circuit(dobrada, source=0))


# ---------------------------------------------------------------------------
# 1,5-aproximação: Christofides
# ---------------------------------------------------------------------------

def christofides(g):
    """1. árvore geradora mínima T;  2. vértices de grau ímpar em T (são em número par);
    3. emparelhamento perfeito de peso MÍNIMO M entre eles;  4. T + M tem todos os
    graus pares: circuito euleriano;  5. atalhos.
    custo(M) <= ótimo/2, então a rota custa no máximo custo(T) + ótimo/2 <= 1,5·ótimo."""
    arvore = nx.minimum_spanning_tree(g, algorithm="prim")
    impares = [v for v, grau in arvore.degree() if grau % 2 == 1]
    emparelhamento = nx.min_weight_matching(g.subgraph(impares))
    euleriano = nx.MultiGraph()
    euleriano.add_edges_from(arvore.edges(data=True))
    euleriano.add_edges_from((u, v, g[u][v]) for u, v in emparelhamento)
    return _atalhos(nx.eulerian_circuit(euleriano, source=0))


# ---------------------------------------------------------------------------
# Exato: branch and bound
# ---------------------------------------------------------------------------

def branch_and_bound(g):
    """Busca em profundidade sobre rotas parciais que começam em 0 (num ciclo, o ponto
    de partida não importa). Um ramo é podado quando
        custo parcial + limite inferior do que falta >= melhor rota já encontrada.
    Limite inferior: cada cidade ainda não visitada, e a volta para 0, precisam de
    pelo menos uma aresta saindo delas, de custo >= a sua aresta mais barata."""
    n = g.number_of_nodes()
    w = [[0.0 if i == j else g[i][j]["weight"] for j in range(n)] for i in range(n)]
    mais_barata = [min(w[i][j] for j in range(n) if j != i) for i in range(n)]

    # Solução inicial (boa) para a poda já começar forte: vizinho mais próximo.
    rota = [0]
    while len(rota) < n:
        u = rota[-1]
        rota.append(min((v for v in range(n) if v not in rota), key=lambda v: w[u][v]))
    melhor = [custo(g, rota), rota]

    def explora(rota, visitados, parcial, falta):
        if len(rota) == n:
            total = parcial + w[rota[-1]][0]
            if total < melhor[0]:
                melhor[0], melhor[1] = total, rota[:]
            return
        if parcial + falta >= melhor[0]:
            return  # poda: nem no melhor caso esse ramo vence
        u = rota[-1]
        for v in sorted(range(n), key=lambda v: w[u][v]):  # vizinhos próximos primeiro
            if v not in visitados and parcial + w[u][v] < melhor[0]:
                visitados.add(v)
                rota.append(v)
                explora(rota, visitados, parcial + w[u][v], falta - mais_barata[v])
                rota.pop()
                visitados.remove(v)

    # Ainda faltam: sair de 0 (já contado ao escolher o 1º passo) e sair de cada outra cidade.
    explora([0], {0}, 0.0, sum(mais_barata[1:]))
    return melhor[1]


def forca_bruta(g):
    """Testa as (n-1)! rotas. Só para conferir os outros métodos em instâncias pequenas."""
    from itertools import permutations
    n = g.number_of_nodes()
    return min(([0, *p] for p in permutations(range(1, n))), key=lambda r: custo(g, r))


# ---------------------------------------------------------------------------
# Comparação
# ---------------------------------------------------------------------------

METODOS = {
    "branch and bound": branch_and_bound,
    "twice around the tree": twice_around_the_tree,
    "Christofides": christofides,
}


def comparar(n, semente):
    g = grafo_completo(pontos_aleatorios(n, semente))
    linhas = []
    for nome, metodo in METODOS.items():
        t0 = time.perf_counter()
        rota = metodo(g)
        linhas.append((nome, custo(g, rota), (time.perf_counter() - t0) * 1000, rota))
    return g, linhas


def main():
    print(f"{'n':>3}  {'método':<22} {'custo':>8} {'/ótimo':>7} {'tempo (ms)':>11}")
    for n in (6, 8, 10, 12):
        g, linhas = comparar(n, semente=n)
        otimo = linhas[0][1]
        for nome, c, ms, _ in linhas:
            print(f"{n:>3}  {nome:<22} {c:8.4f} {c / otimo:7.3f} {ms:11.2f}")
        print()

    if "--grafico" in sys.argv:
        import matplotlib.pyplot as plt
        pontos = pontos_aleatorios(10, semente=10)
        g, linhas = comparar(10, semente=10)
        fig, eixos = plt.subplots(1, 3, figsize=(15, 5))
        for eixo, (nome, c, _, rota) in zip(eixos, linhas):
            xs = [pontos[v][0] for v in rota + rota[:1]]
            ys = [pontos[v][1] for v in rota + rota[:1]]
            eixo.plot(xs, ys, "-o")
            eixo.set_title(f"{nome}: {c:.3f}")
        plt.show()


if __name__ == "__main__":
    main()
