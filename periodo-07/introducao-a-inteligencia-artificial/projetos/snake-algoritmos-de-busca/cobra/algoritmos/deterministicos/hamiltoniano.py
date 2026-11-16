"""Ciclo hamiltoniano: nenhuma busca, e mesmo assim a cobra nunca morre."""
from __future__ import annotations

from ...jogo import Jogo
from ..base import Agente, Decisao, sobreviver


def ciclo_hamiltoniano(w: int, h: int) -> list[int] | None:
    """Ciclo que passa por todas as células uma vez. Existe se w ou h é par.

    Linha 0 da esquerda para a direita; as demais em zigue-zague sem a coluna 0; a coluna 0
    é o caminho de volta, de baixo para cima.
    """
    def monta(W, H, cel):
        s = [cel(x, 0) for x in range(W)]
        for y in range(1, H):
            xs = range(W - 1, 0, -1) if y % 2 else range(1, W)
            s += [cel(x, y) for x in xs]
        s += [cel(0, y) for y in range(H - 1, 0, -1)]
        return s
    if h % 2 == 0 and w >= 2:
        return monta(w, h, lambda x, y: y * w + x)
    if w % 2 == 0 and h >= 2:
        return monta(h, w, lambda x, y: x * w + y)
    return None


class CicloHamiltoniano(Agente):
    """Segue sempre o mesmo ciclo. A cauda está sempre à frente, então nunca há colisão;
    o preço é até w·h passos por comida."""
    nome = "Ciclo hamiltoniano"

    def __init__(self, rng=None):
        self.suc: dict[int, int] | None = None
        self.ciclo: list[int] | None = None

    def decidir(self, j: Jogo) -> Decisao:
        if self.suc is None:
            self.ciclo = None if j.obstaculos else ciclo_hamiltoniano(j.w, j.h)
            if self.ciclo is None:
                d, _ = sobreviver(j)
                return Decisao(d, "Com obstáculos não há ciclo pronto (achar um ciclo hamiltoniano numa grade qualquer "
                                  "é NP-difícil): só sobrevivo." if j.obstaculos else
                               "Grade com lados ímpares: não existe ciclo hamiltoniano.")
            n = len(self.ciclo)
            self.suc = {v: self.ciclo[(i + 1) % n] for i, v in enumerate(self.ciclo)}
            # percorre no sentido em que o próximo passo não é o pescoço
            if len(j.corpo) > 1 and self.suc[j.cabeca] == j.corpo[1]:
                self.ciclo.reverse()
                self.suc = {v: self.ciclo[(i + 1) % n] for i, v in enumerate(self.ciclo)}
        caminho, v = [], self.suc[j.cabeca]
        while len(caminho) < len(self.ciclo):
            caminho.append(v)
            if v in j.comidas:
                break
            v = self.suc[v]
        return Decisao(j.dir_para(j.cabeca, caminho[0]),
                       f"Ciclo hamiltoniano: só o próximo passo do ciclo. A comida está a {len(caminho)} passos por ele.",
                       0, caminho=caminho)
