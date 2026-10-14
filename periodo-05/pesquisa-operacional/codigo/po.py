"""Pesquisa operacional em Python puro: simplex de duas fases (com frações
exatas), dualidade, branch and bound e fluxo máximo de Edmonds-Karp.

Execute:  python3 po.py
"""
from collections import deque
from fractions import Fraction as F
from itertools import product
import math


class Inviavel(Exception):
    pass


class Ilimitado(Exception):
    pass


def pivoteia(T, i, j):
    p = T[i][j]
    T[i] = [v / p for v in T[i]]                       # pivô vira 1
    for r in range(len(T)):
        if r != i and T[r][j] != 0:
            f = T[r][j]
            T[r] = [a - f * b for a, b in zip(T[r], T[i])]   # zera a coluna


def simplex_tableau(T, base, colunas):
    """Itera até o ótimo. Linha 0 = custos reduzidos (minimização de T[0])."""
    while True:
        cand = [k for k in colunas if T[0][k] < 0]
        if not cand:
            return
        j = min(cand)                                  # regra de Bland: evita ciclagem
        razoes = [(T[i][-1] / T[i][j], base[i - 1], i) for i in range(1, len(T)) if T[i][j] > 0]
        if not razoes:
            raise Ilimitado
        _, _, i = min(razoes)
        pivoteia(T, i, j)
        base[i - 1] = j


def resolve_pl(c, A, ops, b, sentido="max"):
    """max/min c·x s.a. A x (<=, >=, =) b, x >= 0. Devolve (z, x, y) com y = duais."""
    m, n = len(A), len(c)
    A = [[F(v) for v in linha] for linha in A]
    b, c = [F(v) for v in b], [F(v) for v in c]
    ops = list(ops)
    for i in range(m):                                 # b >= 0
        if b[i] < 0:
            A[i], b[i] = [-v for v in A[i]], -b[i]
            ops[i] = {"<=": ">=", ">=": "<=", "=": "="}[ops[i]]
    # colunas: x (n) | folgas/excessos (m) | artificiais (m)
    ncol = n + 2 * m
    T = [[F(0)] * (ncol + 1) for _ in range(m + 1)]
    base = []
    for i in range(m):
        T[i + 1][:n] = A[i]
        T[i + 1][-1] = b[i]
        if ops[i] == "<=":
            T[i + 1][n + i] = F(1)
            base.append(n + i)
        else:
            if ops[i] == ">=":
                T[i + 1][n + i] = F(-1)
            T[i + 1][n + m + i] = F(1)
            base.append(n + m + i)
    # Fase 1: minimizar a soma das artificiais
    arts = [n + m + i for i in range(m) if ops[i] != "<="]
    if arts:
        T[0] = [F(0)] * (ncol + 1)
        for a in arts:
            T[0][a] = F(1)
        for i, bi in enumerate(base):
            if bi in arts:
                T[0] = [x - y for x, y in zip(T[0], T[i + 1])]
        simplex_tableau(T, base, range(ncol))
        if T[0][-1] != 0:
            raise Inviavel
        for i, bi in enumerate(base):                  # tira artificiais que ficaram na base com valor 0
            if bi in arts:
                j = next((k for k in range(n + m) if T[i + 1][k] != 0), None)
                if j is not None:
                    pivoteia(T, i + 1, j)
                    base[i] = j
    # Fase 2: objetivo original (minimização de -c para max)
    sinal = 1 if sentido == "max" else -1
    T[0] = [F(0)] * (ncol + 1)
    for j in range(n):
        T[0][j] = -sinal * c[j]
    for i, bi in enumerate(base):
        if T[0][bi] != 0:
            f = T[0][bi]
            T[0] = [x - f * y for x, y in zip(T[0], T[i + 1])]
    simplex_tableau(T, base, range(n + m))
    x = [F(0)] * n
    for i, bi in enumerate(base):
        if bi < n:
            x[bi] = T[i + 1][-1]
    z = sum(ci * xi for ci, xi in zip(c, x))
    # duais: custo reduzido da folga de cada linha (com o sinal da restrição)
    y = []
    for i in range(m):
        col = n + i if ops[i] != "=" else n + m + i
        yi = T[0][col] * sinal
        y.append(-yi if ops[i] == ">=" else yi)
    return z, x, y


def branch_and_bound(c, A, ops, b, sentido="max"):
    melhor = [None, None]
    sinal = 1 if sentido == "max" else -1
    nos = [0]

    def visita(A, ops, b):
        nos[0] += 1
        try:
            z, x, _ = resolve_pl(c, A, ops, b, sentido)
        except Inviavel:
            return
        if melhor[0] is not None and sinal * z <= sinal * melhor[0]:
            return                                     # poda por limite
        frac = next((j for j, v in enumerate(x) if v.denominator != 1), None)
        if frac is None:
            melhor[:] = [z, x]
            return
        e = [0] * len(c)
        e[frac] = 1
        visita(A + [e], ops + ["<="], b + [math.floor(x[frac])])
        visita(A + [e], ops + [">="], b + [math.ceil(x[frac])])

    visita([list(r) for r in A], list(ops), list(b))
    return melhor[0], melhor[1], nos[0]


def edmonds_karp(n, arestas, s, t):
    cap = [[0] * n for _ in range(n)]
    for u, v, c in arestas:
        cap[u][v] += c
    fluxo = 0
    while True:
        pai = [None] * n
        pai[s] = s
        q = deque([s])
        while q and pai[t] is None:                    # BFS no grafo residual
            u = q.popleft()
            for v in range(n):
                if pai[v] is None and cap[u][v] > 0:
                    pai[v] = u
                    q.append(v)
        if pai[t] is None:
            return fluxo, {v for v in range(n) if pai[v] is not None}
        gargalo, v = math.inf, t
        while v != s:
            gargalo = min(gargalo, cap[pai[v]][v])
            v = pai[v]
        v = t
        while v != s:
            u = pai[v]
            cap[u][v] -= gargalo
            cap[v][u] += gargalo
            v = u
        fluxo += gargalo


def corte_minimo_forca_bruta(n, arestas, s, t):
    melhor = math.inf
    for lados in product([0, 1], repeat=n - 2):
        S = {s} | {v for v, l in zip([v for v in range(n) if v not in (s, t)], lados) if l}
        melhor = min(melhor, sum(c for u, v, c in arestas if u in S and v not in S))
    return melhor


def inteiro_forca_bruta(c, A, ops, b, sentido="max", R=40):
    melhor = None
    sinal = 1 if sentido == "max" else -1
    for x in product(range(R + 1), repeat=len(c)):
        ok = all({"<=": lhs <= bi, ">=": lhs >= bi, "=": lhs == bi}[op]
                 for lhs, op, bi in ((sum(a * v for a, v in zip(linha, x)), op, bi) for linha, op, bi in zip(A, ops, b)))
        if ok:
            z = sum(ci * v for ci, v in zip(c, x))
            if melhor is None or sinal * z > sinal * melhor:
                melhor = z
    return melhor


if __name__ == "__main__":
    # Wyndor Glass (Hillier & Lieberman): ótimo (2, 6), z = 36, duais (0, 3/2, 1)
    z, x, y = resolve_pl([3, 5], [[1, 0], [0, 2], [3, 2]], ["<="] * 3, [4, 12, 18])
    assert (z, x, y) == (36, [2, 6], [0, F(3, 2), 1])
    print(f"Wyndor: x = {[str(v) for v in x]}, z = {z}, preços-sombra = {[str(v) for v in y]}")

    # Dualidade forte: min b·y s.a. Aᵀy >= c tem o mesmo valor ótimo
    zd, yd, _ = resolve_pl([4, 12, 18], [[1, 0, 3], [0, 2, 2]], [">=", ">="], [3, 5], "min")
    assert zd == 36 and yd == [0, F(3, 2), 1]
    print(f"dual do Wyndor: y = {[str(v) for v in yd]}, valor = {zd} (= primal)")

    # Duas fases: restrições >= e = (problema de dieta)
    z, x, _ = resolve_pl([2, 3], [[1, 1], [1, 2], [1, -1]], [">=", ">=", "<="], [4, 6, 2], "min")
    assert z == 10 and x == [2, 2], (z, x)
    try:
        resolve_pl([1, 1], [[1, 1], [1, 1]], ["<=", ">="], [1, 2])
        raise AssertionError
    except Inviavel:
        pass
    try:
        resolve_pl([1, 1], [[1, -1]], ["<="], [1])
        raise AssertionError
    except Ilimitado:
        pass
    print("duas fases: dieta z = 10 em (2, 2); inviável e ilimitado detectados")

    # Branch and bound contra força bruta
    casos = [([1, 1], [[-2, 2], [16, -14]], ["<=", "<="], [1, 7]),
             ([5, 4], [[6, 4], [1, 2]], ["<=", "<="], [24, 6]),
             ([1, 5], [[1, 10], [1, 0]], ["<=", "<="], [20, 2]),
             ([8, 5], [[1, 1], [9, 5]], ["<=", "<="], [6, 45]),
             ([3, 2, 4], [[1, 1, 2], [2, 0, 3], [2, 1, 3]], ["<="] * 3, [4, 5, 7])]
    for c, A, ops, b in casos:
        z, x, nos = branch_and_bound(c, A, ops, b)
        assert z == inteiro_forca_bruta(c, A, ops, b, R=12), (c, z)
        print(f"B&B max {c}: x = {[int(v) for v in x]}, z = {z} ({nos} nós)")

    # Fluxo máximo = corte mínimo
    clrs = [(0, 1, 16), (0, 2, 13), (2, 1, 4), (1, 3, 12), (3, 2, 9), (2, 4, 14), (4, 3, 7), (3, 5, 20), (4, 5, 4)]
    f, S = edmonds_karp(6, clrs, 0, 5)
    assert f == 23 == corte_minimo_forca_bruta(6, clrs, 0, 5)
    print(f"CLRS 26.1: fluxo máximo = {f}, lado S do corte = {sorted(S)}")
    import random
    rnd = random.Random(1)
    for _ in range(300):
        n = rnd.randint(4, 8)
        ar = [(u, v, rnd.randint(1, 9)) for u in range(n) for v in range(n) if u != v and rnd.random() < 0.35]
        assert edmonds_karp(n, ar, 0, n - 1)[0] == corte_minimo_forca_bruta(n, ar, 0, n - 1)
    print("fluxo máximo = corte mínimo em 300 redes aleatórias")
