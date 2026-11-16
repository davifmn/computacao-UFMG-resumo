"""Busca sem informação: não sabe onde a comida está, só a reconhece quando chega."""
from ..base import buscar, custo_risco
from .planejador import Planejador


class Largura(Planejador):
    """BFS: expande em ondas a partir da cabeça (fila). Ótima em número de passos."""
    nome, rotulo = "Largura (BFS)", "BFS"

    def planejar(self, j, idx):
        return buscar(j, "bfs", idx=idx)


class Profundidade(Planejador):
    """DFS: mergulha no primeiro vizinho (↑, →, ↓, ←) e só volta quando trava (pilha)."""
    nome, rotulo = "Profundidade (DFS)", "DFS"

    def planejar(self, j, idx):
        return buscar(j, "dfs", idx=idx)


class CustoUniforme(Planejador):
    """UCS com custo de risco: cada célula custa 1 + 2 por vizinho bloqueado.

    Com custos iguais, UCS e BFS dão o mesmo caminho; com este custo, o caminho mais
    barato foge de paredes e do corpo.
    """
    nome, rotulo = "Custo uniforme (com risco)", "Custo uniforme"

    def planejar(self, j, idx):
        return buscar(j, "ucs", custo=custo_risco(j, idx), idx=idx)
