"""Algoritmo genético: evolui os pesos de uma função que dá nota a cada movimento.

O treino é aleatório (população sorteada, cruzamento, mutação); o agente treinado joga
de forma determinística (maior nota).
"""
from __future__ import annotations

import random

from ...jogo import DIRS, Jogo, area_livre, livre_em, oposta
from ..base import Agente, Decisao

CARACTERISTICAS = ["morre", "distância à comida", "espaço livre", "alcança a cauda", "aperto"]

# Mesmos pesos do campeão da versão web (evoluir(semente=7) em JavaScript, grade 12 × 8).
PESOS_CAMPEAO = [-2.26, -1.2, 0.92, 0.64, 0.16]


def caracteristicas(j: Jogo, d: int) -> list[float]:
    """Características de um movimento, todas em [0, 1]."""
    nv = j.vizinho(j.cabeca, d)
    if d == oposta(j.dir) or nv < 0 or not livre_em(j.indice(), len(j.corpo), nv, 1):
        return [1, 0, 0, 0, 0]
    dist = j.dist_comida(nv) / (j.w + j.h)
    s = j.clonar().passo(d)
    if s.venceu:
        return [0, 0, 1, 1, 0]
    sidx = s.indice()
    area, cauda = area_livre(s, sidx)
    livres = max(1, s.w * s.h - len(s.corpo))
    aperto = sum(1 for k in range(4) if (u := s.vizinho(nv, k)) < 0 or not livre_em(sidx, len(s.corpo), u, 1))
    return [0, dist if dist != float("inf") else 0, area / livres, 1 if cauda else 0, aperto / 4]


class Genetico(Agente):
    nome = "Algoritmo genético"

    def __init__(self, rng=None, pesos: list[float] | None = None):
        self.pesos = list(pesos or PESOS_CAMPEAO)

    def decidir(self, j):
        cands = []
        for d in range(4):
            if len(j.corpo) > 1 and d == oposta(j.dir):
                continue
            f = caracteristicas(j, d)
            v = sum(x * w for x, w in zip(f, self.pesos))
            cands.append((d, v, f"nota {v:.2f}"))
        best = max(cands, key=lambda c: c[1])
        return Decisao(best[0], f"Genético: nota = Σ peso × característica; {DIRS[best[0]][3]} teve a maior nota.",
                       len(cands), candidatos=cands)


def evoluir(pop: int = 24, geracoes: int = 15, jogos: int = 2, semente: int = 7, w: int = 12, h: int = 8,
            passos_max: int = 1500):
    """Gerador: uma geração por iteração. Aptidão = 100 por comida + 0,05 por passo vivo."""
    from ..torneio import jogar_partida  # evita import circular

    rng = random.Random(semente)
    nf = len(CARACTERISTICAS)
    popu = [[rng.gauss(0, 1) for _ in range(nf)] for _ in range(pop)]
    for ger in range(1, geracoes + 1):
        sementes = [1000 * ger + k + 1 for k in range(jogos)]
        apt = []
        for p in popu:
            tot = 0.0
            for s in sementes:
                r = jogar_partida(lambda _rng, p=p: Genetico(pesos=p), w=w, h=h, semente=s, passos_max=passos_max)
                tot += 100 * r["comidos"] + 0.05 * r["passos"]
            apt.append(tot / jogos)
        ordem = sorted(range(pop), key=lambda i: -apt[i])
        yield {"geracao": ger, "melhor": apt[ordem[0]], "media": sum(apt) / pop, "pesos": popu[ordem[0]][:]}

        def torneio():
            b = int(rng.random() * pop)
            for _ in range(2):
                c = int(rng.random() * pop)
                if apt[c] > apt[b]:
                    b = c
            return popu[b]

        nova = [popu[ordem[0]][:], popu[ordem[1]][:]]                       # elitismo
        while len(nova) < pop:
            a, b = torneio(), torneio()
            nova.append([(x if rng.random() < 0.5 else y) + (0.4 * rng.gauss(0, 1) if rng.random() < 0.3 else 0)
                         for x, y in zip(a, b)])                             # cruzamento uniforme + mutação
        popu = nova
