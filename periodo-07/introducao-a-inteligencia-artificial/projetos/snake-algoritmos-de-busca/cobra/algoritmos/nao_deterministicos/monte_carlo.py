"""Simulação: estimar o futuro jogando partidas aleatórias (rollouts)."""
from __future__ import annotations

import math
import random

from ...jogo import DIRS, Jogo, seguros
from ..base import Agente, Decisao


def simular(s: Jogo, rng: random.Random, prof: int, gama: float = 0.95, rastro: list[int] | None = None) -> float:
    """Joga ao acaso (só movimentos que não matam já) por até ``prof`` passos.

    Recompensa: +1 por comida, −1 na morte, descontadas por γ a cada passo; se terminar
    vivo, um bônus pequeno por estar perto da comida.
    """
    ret, desc = 0.0, 1.0
    for _ in range(prof):
        if not s.vivo:
            break
        ms = seguros(s)
        if not ms:
            ret -= desc
            s.vivo = False
            break
        antes = s.comidos
        s.passo(rng.choice(ms))
        if rastro is not None:
            rastro.append(s.cabeca)
        if s.comidos > antes:
            ret += desc
        desc *= gama
        if not s.comidas:
            break
    if s.vivo and s.comidas:
        ret += desc * 0.5 * (1 - s.dist_comida(s.cabeca) / (s.w + s.h))
    return ret


class MonteCarlo(Agente):
    """Para cada movimento, K partidas aleatórias de ``prof`` passos; fica com a melhor média."""
    nome = "Monte Carlo"

    def __init__(self, rng: random.Random, K: int = 20, prof: int = 30):
        self.rng, self.K, self.prof = rng, K, prof

    def decidir(self, j):
        ms = seguros(j)
        if not ms:
            return Decisao(j.dir, "Sem saída.")
        cands, rollouts, nos = [], [], 0
        for d in ms:
            soma = 0.0
            for k in range(self.K):
                s = j.clonar()
                antes = s.comidos
                s.passo(d)
                rastro = [s.cabeca] if k < 6 else None
                soma += (1 if s.comidos > antes else 0) + 0.95 * simular(s, self.rng, self.prof, 0.95, rastro)
                nos += s.passos - j.passos
                if rastro:
                    rollouts.append((d, rastro))
            cands.append((d, soma / self.K, f"média {soma / self.K:.2f}"))
        best = max(cands, key=lambda c: c[1])
        return Decisao(best[0], f"Monte Carlo: {self.K} partidas aleatórias de {self.prof} passos por movimento; "
                                f"{DIRS[best[0]][3]} teve a melhor média.", nos, rollouts=rollouts, candidatos=cands)


class _No:
    __slots__ = ("s", "recompensa", "filhos", "resta", "N", "Q", "terminal")

    def __init__(self, s: Jogo, recompensa: float):
        self.s, self.recompensa = s, recompensa
        self.filhos: dict[int, _No] = {}
        self.resta = seguros(s) if s.vivo else []
        self.N, self.Q, self.terminal = 0, 0.0, False


class MCTS(Agente):
    """Busca em árvore de Monte Carlo (UCT): seleção pela UCB1, expansão, simulação
    aleatória e retropropagação. Joga o movimento mais visitado."""
    nome = "MCTS (UCT)"

    def __init__(self, rng: random.Random, iteracoes: int = 250, prof: int = 20, c: float = 1.2, gama: float = 0.95):
        self.rng, self.iteracoes, self.prof, self.c, self.gama = rng, iteracoes, prof, c, gama
        self._nos = 0

    def _iterar(self, no: _No) -> float:
        if no.resta:                                         # expansão
            d = no.resta.pop(int(self.rng.random() * len(no.resta)))
            s = no.s.clonar()
            antes = s.comidos
            s.passo(d)
            f = _No(s, 1 if s.comidos > antes else 0 if s.vivo else -1)
            if not s.vivo or not s.comidas:
                f.resta, f.terminal = [], True
            no.filhos[d] = f
            sim = s.clonar()
            G = f.recompensa + (0 if f.terminal else self.gama * simular(sim, self.rng, self.prof, self.gama))
            self._nos += sim.passos - no.s.passos
            f.N += 1
            f.Q += G
            return G
        if no.filhos:                                        # seleção pela UCB1
            melhor = max(no.filhos.values(),
                         key=lambda f: f.Q / f.N + self.c * math.sqrt(math.log(no.N + 1) / f.N))
            G = melhor.recompensa if melhor.terminal else melhor.recompensa + self.gama * self._iterar(melhor)
            melhor.N += 1
            melhor.Q += G
            return G
        return 0.0 if no.terminal else -1.0                   # beco sem saída

    def decidir(self, j):
        raiz = _No(j.clonar(), 0)
        if not raiz.resta:
            return Decisao(j.dir, "Sem saída.")
        self._nos = 0
        for _ in range(self.iteracoes):
            G = self._iterar(raiz)
            raiz.N += 1
            raiz.Q += G
        cands = [(d, f.N, f"{f.N} visitas, Q = {f.Q / f.N:.2f}") for d, f in raiz.filhos.items()]
        best = max(cands, key=lambda c: c[1])
        pv, no = [], raiz.filhos[best[0]]                    # variação principal
        while no is not None and len(pv) < 40:
            pv.append(no.s.cabeca)
            no = max(no.filhos.values(), key=lambda f: f.N, default=None)
        return Decisao(best[0], f"MCTS: {self.iteracoes} iterações; jogo o mais visitado: {DIRS[best[0]][3]}.",
                       self._nos, caminho=pv, candidatos=cands)
