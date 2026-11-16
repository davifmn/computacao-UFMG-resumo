"""Agente que planeja um caminho até a comida e o segue, replanejando quando precisa."""
from __future__ import annotations

from ...jogo import Jogo, livre_em
from ..base import Agente, Decisao, ResultadoBusca, sobreviver


class Planejador(Agente):
    """Base dos agentes de busca: subclasses só dizem como ``planejar``.

    O plano continua válido enquanto o próximo passo estiver livre e o caminho terminar
    numa comida: como o corpo só sai do lugar até a cobra comer, o plano não envelhece.
    """

    rotulo = "?"

    def __init__(self, rng=None):
        self.plano: list[int] = []
        self.ultima: ResultadoBusca | None = None

    def planejar(self, j: Jogo, idx: list[int]) -> ResultadoBusca:  # pragma: no cover - interface
        raise NotImplementedError

    def decidir(self, j: Jogo) -> Decisao:
        idx, L = j.indice(), len(j.corpo)
        valido = (bool(self.plano) and j.dir_para(j.cabeca, self.plano[0]) is not None
                  and livre_em(idx, L, self.plano[0], 1) and self.plano[-1] in j.comidas)
        nos = 0
        if not valido:
            self.ultima = self.planejar(j, idx)
            self.plano = list(self.ultima.caminho or [])
            nos = len(self.ultima.expandidos)
        u = self.ultima
        if not self.plano:
            d, area = sobreviver(j)
            return Decisao(d, f"{self.rotulo}: não há caminho até a comida. Vou para o lado com mais espaço ({area} células).",
                           nos, u.expandidos, u.fronteira, None, replanejou=not valido)
        prox = self.plano.pop(0)
        texto = (f"{self.rotulo}: seguindo o plano (faltam {len(self.plano) + 1} passos)." if valido else
                 f"{self.rotulo}: expandi {nos} células e achei um caminho de {len(self.plano) + 1} passos.")
        return Decisao(j.dir_para(j.cabeca, prox), texto, nos, u.expandidos, u.fronteira, [prox, *self.plano],
                       replanejou=not valido)
