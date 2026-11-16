"""Mapas de obstáculos (a mesma geometria da versão web; os sorteados usam o random do Python).

Cada mapa é uma função (w, h) -> (obstáculos, comida inicial ou None).
"""
from __future__ import annotations

import random


def vazio(w, h):
    return set(), None


def pilares(w, h):
    return {y * w + x for y in range(1, h - 1, 3) for x in range(1, w - 1, 3)}, None


def corredores(w, h):
    o = set()
    for k, x in enumerate(range(3, w - 2, 4)):
        for y in range(h):
            porta = y >= h - 2 if k % 2 else y <= 1           # portas alternadas: em cima, embaixo
            if not porta:
                o.add(y * w + x)
    return o, None


def armadilha(w, h):
    """U aberto para a cobra, com a comida atrás do fundo: a gulosa entra no U."""
    x0, cy, alt = w // 2 + 2, h // 2, max(2, int(h * 0.3))
    o = {y * w + x0 for y in range(cy - alt, cy + alt + 1)}
    for x in range(x0 - 4, x0):
        o |= {(cy - alt) * w + x, (cy + alt) * w + x}
    return o, cy * w + min(w - 1, x0 + 3)


def sala(w, h):
    """Uma sala com uma única porta e a comida lá dentro."""
    x0, x1, y0, y1, porta = w // 2 + 2, w - 2, 1, h - 2, h // 2 - 2
    o = set()
    for x in range(x0, x1 + 1):
        o |= {y0 * w + x, y1 * w + x}
    for y in range(y0, y1 + 1):
        o.add(y * w + x1)
        if y != porta:
            o.add(y * w + x0)
    return o, ((y0 + y1) // 2) * w + (x0 + x1) // 2


def labirinto(w, h, semente=3):
    """Labirinto perfeito por DFS aleatória, com 20% das paredes derrubadas (para haver ciclos)."""
    r = random.Random(semente)
    parede = [True] * (w * h)
    W, H = (w + 1) // 2, (h + 1) // 2
    vis = {(0, 0)}
    pilha = [(0, 0)]
    parede[0] = False
    while pilha:
        cx, cy = pilha[-1]
        viz = [(cx + dx, cy + dy, dx, dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
               if 0 <= cx + dx < W and 0 <= cy + dy < H and (cx + dx, cy + dy) not in vis]
        if not viz:
            pilha.pop()
            continue
        nx, ny, dx, dy = r.choice(viz)
        vis.add((nx, ny))
        parede[(2 * cy + dy) * w + 2 * cx + dx] = False
        parede[2 * ny * w + 2 * nx] = False
        pilha.append((nx, ny))
    return {v for v in range(w * h) if parede[v] and r.random() >= 0.2}, None


def aleatorio(w, h, semente=5):
    r = random.Random(semente)
    return {v for v in range(w * h) if r.random() < 0.12}, None


MAPAS = {
    "sem obstáculos": vazio,
    "pilares": pilares,
    "corredores": corredores,
    "armadilha em U": armadilha,
    "sala com uma porta": sala,
    "labirinto": labirinto,
    "aleatório (12%)": aleatorio,
}
