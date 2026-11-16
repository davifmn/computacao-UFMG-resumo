"""O que todo agente tem em comum, e a busca genérica na grade usada pelos determinísticos.

Um agente expõe ``decidir(jogo) -> Decisao``. A decisão traz a direção e o
"pensamento" (células expandidas, fronteira, caminho, simulações...), que a interface
desenha por cima do tabuleiro.
"""
from __future__ import annotations

import heapq
from dataclasses import dataclass, field

from ..jogo import Jogo, area_livre, livre_em, seguros


@dataclass
class Decisao:
    dir: int
    texto: str = ""
    nos: int = 0                                    # nós expandidos / passos simulados nesta decisão
    expandidos: list[int] = field(default_factory=list)
    fronteira: list[int] = field(default_factory=list)
    caminho: list[int] | None = None
    fantasma: list[int] | None = None               # cobra imaginada depois de comer (A* seguro)
    rollouts: list[tuple[int, list[int]]] = field(default_factory=list)   # (direção, células) simuladas
    candidatos: list[tuple[int, float, str]] = field(default_factory=list)  # (direção, valor, rótulo)
    perigo: bool = False
    replanejou: bool = True


class Agente:
    nome = "?"

    def decidir(self, j: Jogo) -> Decisao:  # pragma: no cover - interface
        raise NotImplementedError


@dataclass
class ResultadoBusca:
    caminho: list[int] | None
    expandidos: list[int]
    fronteira: list[int]
    custo: float


def buscar(j: Jogo, tipo: str = "astar", alvos: list[int] | None = None, ciente_tempo: bool = False,
           custo=None, idx: list[int] | None = None) -> ResultadoBusca:
    """Busca da cabeça até a comida mais próxima (ou até ``alvos``).

    tipo: 'bfs' (fila), 'dfs' (pilha), 'ucs' (menor g), 'gulosa' (menor h), 'astar' (menor g + h).
    Teste de objetivo ao tirar da fronteira, como no Russell e Norvig: é o que garante a
    otimalidade da UCS e do A*.
    """
    alvos = j.comidas if alvos is None else alvos
    idx = idx or j.indice()
    L, cabeca = len(j.corpo), j.cabeca
    alvo = set(alvos)

    def h(v):
        return min((j.distancia(v, a) for a in alvos), default=float("inf"))

    g: dict[int, float] = {}
    pai: dict[int, int] = {}
    fechado: set[int] = set()
    expandidos: list[int] = []
    seq = 0

    def entrada(v, p, gv, k):
        nonlocal seq
        hv = h(v) if tipo in ("gulosa", "astar") else 0
        pr = gv if tipo == "ucs" else hv if tipo == "gulosa" else gv + hv
        seq += 1
        # (prioridade, desempate por h só no A*, ordem de chegada) — tudo determinístico
        return (pr, hv if tipo == "astar" else 0, seq, v, p, gv, k)

    fila = [entrada(cabeca, -1, 0, 0)]
    inicio_fila = 0                                  # a BFS usa a lista como fila
    visto = {cabeca}
    melhor_g = {cabeca: 0}
    achou = None
    while True:
        if tipo == "bfs":
            if inicio_fila >= len(fila):
                break
            e = fila[inicio_fila]
            inicio_fila += 1
        elif tipo == "dfs":
            if not fila:
                break
            e = fila.pop()
        else:
            if not fila:
                break
            e = heapq.heappop(fila)
        _, _, _, v, p, gv, k = e
        if v in fechado:
            continue
        fechado.add(v)
        pai[v], g[v] = p, gv
        expandidos.append(v)
        if v in alvo and v != cabeca:
            achou = v
            break
        filhos = []
        for d in range(4):
            u = j.vizinho(v, d)
            if u < 0 or u in fechado or not livre_em(idx, L, u, k + 1, ciente_tempo):
                continue
            if tipo == "bfs":
                if u in visto:
                    continue
                visto.add(u)
            gu = gv + (custo(u) if custo else 1)
            if tipo not in ("bfs", "dfs"):
                if gu >= melhor_g.get(u, float("inf")):
                    continue
                melhor_g[u] = gu
            filhos.append(entrada(u, v, gu, k + 1))
        if tipo == "dfs":
            filhos.reverse()                         # tenta primeiro ↑, depois →, ↓, ←
        for f in filhos:
            if tipo in ("bfs", "dfs"):
                fila.append(f)
            else:
                heapq.heappush(fila, f)
    resto = fila[inicio_fila:] if tipo == "bfs" else fila
    fronteira = list(dict.fromkeys(e[3] for e in resto if e[3] not in fechado))
    if achou is None:
        return ResultadoBusca(None, expandidos, fronteira, float("inf"))
    caminho = []
    v = achou
    while v != cabeca:
        caminho.append(v)
        v = pai[v]
    caminho.reverse()
    return ResultadoBusca(caminho, expandidos, fronteira, g[achou])


def custo_risco(j: Jogo, idx: list[int]):
    """Entrar numa célula colada em parede ou corpo custa mais: 1 + 2 por vizinho bloqueado."""
    L = len(j.corpo)

    def c(v):
        b = 0
        for d in range(4):
            u = j.vizinho(v, d)
            if u < 0 or 0 <= idx[u] < L - 1:
                b += 1
        return 1 + 2 * b
    return c


def sobreviver(j: Jogo) -> tuple[int, int]:
    """Sem caminho: vai para o lado com mais espaço livre (adiar a morte). Devolve (dir, área)."""
    melhor = None
    for d in seguros(j):
        s = j.clonar().passo(d)
        if not s.vivo and not s.venceu:
            continue
        area, _ = area_livre(s)
        if melhor is None or area > melhor[1]:
            melhor = (d, area)
    return melhor or (j.dir, 0)
