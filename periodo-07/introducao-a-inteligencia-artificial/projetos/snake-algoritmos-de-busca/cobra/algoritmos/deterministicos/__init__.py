"""Algoritmos determinísticos: a mesma partida produz sempre as mesmas decisões."""
from .a_estrela_cobra import AEstrelaCaixeiro, AEstrelaSeguro, AEstrelaTempo
from .busca_cega import CustoUniforme, Largura, Profundidade
from .busca_informada import AEstrela, Gulosa
from .hamiltoniano import CicloHamiltoniano, ciclo_hamiltoniano

# (grupo, classe) na ordem em que aparecem no menu
DETERMINISTICOS = [
    ("Busca cega", Largura),
    ("Busca cega", Profundidade),
    ("Busca cega", CustoUniforme),
    ("Busca informada", Gulosa),
    ("Busca informada", AEstrela),
    ("A* adaptado à cobra", AEstrelaCaixeiro),
    ("A* adaptado à cobra", AEstrelaTempo),
    ("A* adaptado à cobra", AEstrelaSeguro),
    ("Sem busca", CicloHamiltoniano),
]

__all__ = ["DETERMINISTICOS", "Largura", "Profundidade", "CustoUniforme", "Gulosa", "AEstrela",
           "AEstrelaCaixeiro", "AEstrelaTempo", "AEstrelaSeguro", "CicloHamiltoniano", "ciclo_hamiltoniano"]
