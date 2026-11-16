"""Três adaptações do A* ao Snake. As duas primeiras vêm do projeto original
(A_STAR com caixeiro viajante e A_NEW_STAR); a terceira olha além da comida."""
from __future__ import annotations

from itertools import permutations

from ...jogo import Jogo, area_livre, escapa, seguros
from ..base import Agente, Decisao, ResultadoBusca, buscar, sobreviver
from .planejador import Planejador


class AEstrelaCaixeiro(Planejador):
    """Com várias comidas, testa todas as ordens de visita (3! = 6 com três) com custos
    dados pelo A* e segue o primeiro trecho da melhor. Com uma comida, é o A*."""
    nome, rotulo = "A* + caixeiro viajante", "A* + caixeiro"

    def planejar(self, j: Jogo, idx):
        if len(j.comidas) <= 1:
            return buscar(j, "astar", idx=idx)
        cache: dict[tuple[int, int], ResultadoBusca] = {}
        expandidos: list[int] = []

        def trecho(de, para):
            if (de, para) not in cache:
                # depois da 1ª comida, o corpo de agora como obstáculo (aproximação do original)
                s = j if de == j.cabeca else Jogo(j.w, j.h, 0, j.toroidal, 0, [de, *j.corpo[1:]], j.comidas[:],
                                                   rng_comida=j.rng_comida)
                r = buscar(s, "astar", alvos=[para], idx=idx)
                expandidos.extend(r.expandidos)
                cache[(de, para)] = r
            return cache[(de, para)]

        melhor = None
        for ordem in permutations(j.comidas):
            total, de, primeiro = 0, j.cabeca, None
            for c in ordem:
                r = trecho(de, c)
                if r.caminho is None:
                    total = float("inf")
                    break
                primeiro = primeiro or r
                total += len(r.caminho)
                de = c
            if total < (melhor[0] if melhor else float("inf")):
                melhor = (total, primeiro)
        if melhor is None:
            return ResultadoBusca(None, expandidos, [], float("inf"))
        p = melhor[1]
        return ResultadoBusca(p.caminho, expandidos, p.fronteira, p.custo)


class AEstrelaTempo(Planejador):
    """A* ciente do tempo: um segmento a k posições da cauda sai do lugar em k passos.
    Se a cabeça chega depois disso, a célula não é obstáculo."""
    nome, rotulo = "A* ciente do tempo", "A* ciente do tempo"

    def planejar(self, j, idx):
        return buscar(j, "astar", ciente_tempo=True, idx=idx)


class AEstrelaSeguro(Agente):
    """Simula a cobra comendo (o "fantasma"). Só vai se, depois, ela ainda tiver rota de
    fuga; senão, dá um passo que mantém a rota de fuga e se aproxima da comida."""
    nome = "A* seguro (com fantasma)"

    def __init__(self, rng=None):
        pass

    def decidir(self, j: Jogo) -> Decisao:
        idx = j.indice()
        r = buscar(j, "astar", idx=idx)
        nos = len(r.expandidos)
        if r.caminho:
            s = j.clonar()
            for v in r.caminho:
                s.passo(s.dir_para(s.cabeca, v))
            if s.venceu or (s.vivo and escapa(s)):
                return Decisao(j.dir_para(j.cabeca, r.caminho[0]),
                               f"A* seguro: o caminho de {len(r.caminho)} passos é seguro: depois de comer, o fantasma ainda tem rota de fuga.",
                               nos, r.expandidos, r.fronteira, r.caminho, fantasma=s.corpo)
        # plano B: entre os passos que mantêm rota de fuga, o que mais se aproxima da comida;
        # com fome demais (laço seguro que nunca chega à comida), o de maior espaço livre
        melhor = None
        for d in seguros(j, idx):
            s = j.clonar().passo(d)
            if not s.vivo and not s.venceu:
                continue
            nos += 1
            if not escapa(s):
                continue
            area, _ = area_livre(s)
            dist = j.dist_comida(s.cabeca)
            chave = (-area, dist) if j.fome > j.w * j.h / 2 else (dist, -area)
            if melhor is None or chave < melhor[0]:
                melhor = (chave, d)
        if melhor:
            texto = ("A* seguro: ir à comida agora me encurralaria (o fantasma ficaria sem rota de fuga). Dou um passo seguro."
                     if r.caminho else "A* seguro: a comida está inalcançável agora; dou um passo que mantém uma rota de fuga.")
            return Decisao(melhor[1], texto, nos, r.expandidos, r.fronteira, r.caminho, perigo=True)
        d, _ = sobreviver(j)
        return Decisao(d, "A* seguro: nenhum movimento mantém rota de fuga; vou para o lado com mais espaço.", nos, r.expandidos)
