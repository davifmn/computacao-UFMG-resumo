"""Regras do Snake, sem pygame (para os agentes simularem e os testes rodarem sem tela).

Células são inteiros ``v = y * w + x``. O corpo é uma lista da cabeça (índice 0) até a
cauda. As mesmas regras da versão web (visualizacoes/snake.js).
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field

# (dx, dy, nome, seta) — a ordem importa: é a ordem em que a DFS tenta os vizinhos
DIRS = [(0, -1, "cima", "↑"), (1, 0, "direita", "→"), (0, 1, "baixo", "↓"), (-1, 0, "esquerda", "←")]


def oposta(d: int) -> int:
    return (d + 2) % 4


@dataclass
class Jogo:
    w: int = 18
    h: int = 12
    n_comidas: int = 1
    toroidal: bool = False
    semente: int = 1
    corpo: list[int] = field(default_factory=list)
    comidas: list[int] = field(default_factory=list)
    dir: int = 1
    passos: int = 0
    fome: int = 0
    comidos: int = 0
    vivo: bool = True
    venceu: bool = False
    motivo: str | None = None
    simulacao: bool = False
    rng_comida: random.Random | None = None

    def __post_init__(self):
        if not self.corpo:
            cx, cy = self.w // 2, self.h // 2
            c = cy * self.w + cx
            self.corpo = [c, c - 1, c - 2]
        self.limite_fome = 2 * self.w * self.h
        if self.rng_comida is None:
            self.rng_comida = random.Random(self.semente)
            for _ in range(self.n_comidas):
                self._sortear_comida()

    @property
    def cabeca(self) -> int:
        return self.corpo[0]

    def clonar(self) -> "Jogo":
        """Cópia para simulação: lá, comida comida não reaparece (o futuro é desconhecido)."""
        c = Jogo(self.w, self.h, self.n_comidas, self.toroidal, self.semente, self.corpo[:], self.comidas[:],
                 self.dir, self.passos, self.fome, self.comidos, self.vivo, self.venceu, self.motivo, True,
                 self.rng_comida)
        return c

    def _sortear_comida(self):
        ocupado = set(self.corpo) | set(self.comidas)
        livres = [v for v in range(self.w * self.h) if v not in ocupado]
        if livres:
            self.comidas.append(livres[int(self.rng_comida.random() * len(livres))])

    # ------------------------------------------------------------------ geometria
    def vizinho(self, v: int, d: int) -> int:
        """Célula vizinha de v na direção d, ou −1 se sair da grade (sem toro)."""
        dx, dy = DIRS[d][0], DIRS[d][1]
        x, y = v % self.w + dx, v // self.w + dy
        if self.toroidal:
            x, y = x % self.w, y % self.h
        elif not (0 <= x < self.w and 0 <= y < self.h):
            return -1
        return y * self.w + x

    def distancia(self, a: int, b: int) -> int:
        """Manhattan; no toro, dando a volta quando é mais curto (continua admissível)."""
        dx, dy = abs(a % self.w - b % self.w), abs(a // self.w - b // self.w)
        if self.toroidal:
            dx, dy = min(dx, self.w - dx), min(dy, self.h - dy)
        return dx + dy

    def dist_comida(self, v: int) -> float:
        return min((self.distancia(v, c) for c in self.comidas), default=float("inf"))

    def dir_para(self, de: int, para: int) -> int | None:
        for d in range(4):
            if self.vizinho(de, d) == para:
                return d
        return None

    # ------------------------------------------------------------------ dinâmica
    def passo(self, d: int | None) -> "Jogo":
        """Avança um passo. Meia-volta é ignorada (a cobra segue em frente)."""
        if not self.vivo:
            return self
        if d is None or d == oposta(self.dir):
            d = self.dir
        self.dir = d
        self.passos += 1
        self.fome += 1
        nv = self.vizinho(self.cabeca, d)
        if nv < 0:
            return self._morrer("parede")
        come = nv in self.comidas
        # a cauda sai do lugar neste passo, a menos que a cobra coma (aí ela cresce)
        limite = len(self.corpo) if come else len(self.corpo) - 1
        if nv in self.corpo[:limite]:
            return self._morrer("corpo")
        self.corpo.insert(0, nv)
        if not come:
            self.corpo.pop()
        else:
            self.comidos += 1
            self.fome = 0
            self.comidas.remove(nv)
            if len(self.corpo) == self.w * self.h:
                self.vivo, self.venceu, self.motivo = False, True, "venceu"
                return self
            if not self.simulacao:
                self._sortear_comida()
        if self.fome > self.limite_fome:
            return self._morrer("fome")
        return self

    def _morrer(self, motivo: str) -> "Jogo":
        self.vivo, self.motivo = False, motivo
        return self

    # ------------------------------------------------------------------ ocupação
    def indice(self) -> list[int]:
        """idx[v] = posição de v no corpo (0 = cabeça), −1 se livre."""
        idx = [-1] * (self.w * self.h)
        for i, v in enumerate(self.corpo):
            if idx[v] < 0:
                idx[v] = i
        return idx


def livre_em(idx: list[int], L: int, v: int, k: int, ciente_tempo: bool = False) -> bool:
    """A célula v estará livre quando a cabeça chegar lá no passo k?

    O segmento i sai do lugar depois de L − i passos. O modelo simples ("corpo é parede")
    só libera a cauda; o ciente do tempo libera cada segmento na hora certa.
    """
    i = idx[v]
    return i < 0 or (k >= L - i if ciente_tempo else i == L - 1)


def seguros(j: Jogo, idx: list[int] | None = None) -> list[int]:
    """Direções que não matam no próximo passo."""
    idx = idx or j.indice()
    L, out = len(j.corpo), []
    for d in range(4):
        if L > 1 and d == oposta(j.dir):
            continue
        nv = j.vizinho(j.cabeca, d)
        if nv >= 0 and livre_em(idx, L, nv, 1):
            out.append(d)
    return out


def area_livre(j: Jogo, idx: list[int] | None = None) -> tuple[int, bool]:
    """Inunda a partir da cabeça: (células livres alcançáveis, alcança a cauda?)."""
    idx = idx or j.indice()
    L = len(j.corpo)
    visto = {j.cabeca}
    pilha, area = [j.cabeca], 0
    while pilha:
        v = pilha.pop()
        for d in range(4):
            u = j.vizinho(v, d)
            if u < 0 or u in visto or not livre_em(idx, L, u, 1):
                continue
            visto.add(u)
            area += 1
            pilha.append(u)
    return area, L > 1 and j.corpo[-1] in visto


def escapa(j: Jogo, idx: list[int] | None = None) -> bool:
    """A cabeça tem rota de fuga? BFS ciente do tempo: chegar a uma célula do corpo depois
    que aquele segmento saiu é seguir o rastro da cobra, que nunca acaba."""
    idx = idx or j.indice()
    L = len(j.corpo)
    prof = {j.cabeca: 0}
    fila = [j.cabeca]
    for v in fila:
        for d in range(4):
            u = j.vizinho(v, d)
            if u < 0 or u in prof:
                continue
            k = prof[v] + 1
            if idx[u] > 0:
                if k >= L - idx[u]:
                    return True
                continue
            if idx[u] == 0:
                continue
            prof[u] = k
            fila.append(u)
    return False
