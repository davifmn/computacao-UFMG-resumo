"""Busca com informação: usa a heurística h = distância de Manhattan até a comida."""
from ..base import buscar
from .planejador import Planejador


class Gulosa(Planejador):
    """Expande quem parece mais perto da comida (menor h), ignorando o custo até ali."""
    nome, rotulo = "Gulosa (só h)", "Gulosa"

    def planejar(self, j, idx):
        return buscar(j, "gulosa", idx=idx)


class AEstrela(Planejador):
    """Expande o menor f = g + h. Com h admissível, acha o caminho mais curto."""
    nome, rotulo = "A* (g + h)", "A*"

    def planejar(self, j, idx):
        return buscar(j, "astar", idx=idx)
