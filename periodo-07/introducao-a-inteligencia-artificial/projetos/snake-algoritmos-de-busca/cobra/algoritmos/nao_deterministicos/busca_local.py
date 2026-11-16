"""Busca local: olha só os vizinhos da cabeça, sem plano e sem memória.

A "altitude" de uma célula é −(distância até a comida mais próxima): subir é chegar perto.
"""
from __future__ import annotations

import math
import random

from ...jogo import DIRS, Jogo, seguros
from ..base import Agente, Decisao


def valor(j: Jogo, v: int) -> float:
    return -j.dist_comida(v)


class PasseioAleatorio(Agente):
    """Sorteia entre os movimentos que não matam já. A linha de base."""
    nome = "Passeio aleatório"

    def __init__(self, rng: random.Random):
        self.rng = rng

    def decidir(self, j):
        ms = seguros(j)
        if not ms:
            return Decisao(j.dir, "Sem saída.")
        d = self.rng.choice(ms)
        cands = [(m, 1 / len(ms), f"p = {1 / len(ms):.2f}") for m in ms]
        return Decisao(d, f"Passeio aleatório: sorteei {DIRS[d][3]} entre {len(ms)} movimentos que não matam agora.",
                       candidatos=cands)


class SubidaEncosta(Agente):
    """Subida de encosta estocástica: sorteia entre os vizinhos que chegam mais perto da
    comida. Sem nenhum (ótimo local), dá um passo aleatório."""
    nome = "Subida de encosta estocástica"

    def __init__(self, rng: random.Random):
        self.rng = rng

    def decidir(self, j):
        ms = seguros(j)
        if not ms:
            return Decisao(j.dir, "Sem saída.")
        atual = valor(j, j.cabeca)
        cands = [(d, valor(j, j.vizinho(j.cabeca, d))) for d in ms]
        sobe = [c for c in cands if c[1] > atual]
        d = self.rng.choice(sobe or cands)[0]
        texto = (f"Subida de encosta: {len(sobe)} vizinho(s) chegam mais perto da comida; sorteei um deles." if sobe else
                 "Subida de encosta: nenhum vizinho melhora (ótimo local). Dou um passo aleatório.")
        return Decisao(d, texto, candidatos=[(c[0], c[1], f"h = {-c[1]:g}") for c in cands])


class TemperaSimulada(Agente):
    """Sorteia um vizinho; melhora é aceita, piora é aceita com probabilidade e^(Δ/T).
    T = T0·α^fome: esfria a cada passo sem comer e reaquece ao comer."""
    nome = "Têmpera simulada"

    def __init__(self, rng: random.Random, T0: float = 1.0, alfa: float = 0.85):
        self.rng, self.T0, self.alfa = rng, T0, alfa

    def decidir(self, j):
        ms = seguros(j)
        if not ms:
            return Decisao(j.dir, "Sem saída.")
        T = self.T0 * self.alfa ** j.fome
        atual = valor(j, j.cabeca)
        cands = []
        for d in ms:
            delta = valor(j, j.vizinho(j.cabeca, d)) - atual
            cands.append((d, delta, 1.0 if delta > 0 else math.exp(delta / T)))
        ordem = cands[:]
        self.rng.shuffle(ordem)
        esc = next((c for c in ordem if self.rng.random() < c[2]), None) or max(cands, key=lambda c: c[1])
        texto = (f"Têmpera simulada (T = {T:.2f}): sorteio um vizinho; se piora, aceito com probabilidade e^(Δ/T). "
                 + ("Aceitei uma melhora." if esc[1] > 0 else "Aceitei uma piora!"))
        return Decisao(esc[0], texto, candidatos=[(d, p, f"Δ = {delta:+g}, p = {p:.2f}") for d, delta, p in cands])
