"""Algoritmos não determinísticos: decidem com sorteios, então a mesma partida pode
terminar de outro jeito. Cada um recebe um ``random.Random`` com semente, para que uma
partida possa ser repetida exatamente quando se quer (testes, comparação)."""
from .busca_local import PasseioAleatorio, SubidaEncosta, TemperaSimulada
from .genetico import CARACTERISTICAS, PESOS_CAMPEAO, Genetico, caracteristicas, evoluir
from .monte_carlo import MCTS, MonteCarlo, simular

NAO_DETERMINISTICOS = [
    ("Linha de base", PasseioAleatorio),
    ("Busca local", SubidaEncosta),
    ("Busca local", TemperaSimulada),
    ("Simulação", MonteCarlo),
    ("Simulação", MCTS),
    ("Evolução", Genetico),
]

__all__ = ["NAO_DETERMINISTICOS", "PasseioAleatorio", "SubidaEncosta", "TemperaSimulada", "MonteCarlo", "MCTS",
           "Genetico", "evoluir", "simular", "caracteristicas", "CARACTERISTICAS", "PESOS_CAMPEAO"]
