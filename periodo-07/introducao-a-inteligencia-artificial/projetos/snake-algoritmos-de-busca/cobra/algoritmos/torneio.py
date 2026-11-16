"""Partidas sem tela, para comparar agentes e para o treino do genético."""
from __future__ import annotations

import random
import time

from ..jogo import Jogo


def jogar_partida(criar, w: int = 18, h: int = 12, comidas: int = 1, toroidal: bool = False, semente: int = 1,
                  semente_agente: int = 1, passos_max: int = 50_000) -> dict:
    """``criar(rng)`` devolve um agente novo. Devolve comidos, passos, motivo, nós e tempo."""
    j = Jogo(w, h, comidas, toroidal, semente)
    ag = criar(random.Random(semente_agente))
    nos = decisoes = 0
    t0 = time.perf_counter()
    while j.vivo and j.passos < passos_max:
        dec = ag.decidir(j)
        nos += dec.nos
        decisoes += 1
        j.passo(dec.dir)
    return {"comidos": j.comidos, "passos": j.passos, "motivo": j.motivo if not j.vivo else "limite",
            "venceu": j.venceu, "nos": nos, "decisoes": decisoes, "s": time.perf_counter() - t0}
