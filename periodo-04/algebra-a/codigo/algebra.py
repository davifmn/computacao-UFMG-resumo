"""Álgebra A em Python: aritmética modular, grupos finitos, permutações e o TCR.

Execute:  python3 algebra.py
"""
from itertools import permutations
from math import gcd, lcm, prod


def euclides_estendido(a, b):
    """Devolve (g, x, y) com a·x + b·y = g = mdc(a, b)."""
    x0, x1, y0, y1 = 1, 0, 0, 1
    while b:
        q, a, b = a // b, b, a % b
        x0, x1 = x1, x0 - q * x1
        y0, y1 = y1, y0 - q * y1
    return a, x0, y0


def inverso(a, n):
    g, x, _ = euclides_estendido(a % n, n)
    if g != 1:
        raise ValueError(f"{a} não é invertível módulo {n}")
    return x % n


def tcr(congruencias):
    """Teorema Chinês do Resto para módulos quaisquer: [(a1, m1), ...] → (x, M) ou None."""
    x, M = 0, 1
    for a, m in congruencias:
        g, p, _ = euclides_estendido(M, m)
        if (a - x) % g:
            return None
        x = (x + M * ((a - x) // g * p % (m // g))) % lcm(M, m)
        M = lcm(M, m)
    return x, M


def phi(n):
    r, p = n, 2
    while p * p <= n:
        if n % p == 0:
            while n % p == 0:
                n //= p
            r -= r // p
        p += 1
    return r - r // n if n > 1 else r


# ---------- Grupos ----------

class Grupo:
    """Grupo finito dado pelos elementos e pela operação."""

    def __init__(self, elementos, op):
        self.G = list(elementos)
        self.op = op
        self.e = next(e for e in self.G if all(op(e, g) == g == op(g, e) for g in self.G))

    def verifica_axiomas(self):
        S = set(self.G)
        assert all(self.op(a, b) in S for a in self.G for b in self.G), "não é fechado"
        assert all(self.op(self.op(a, b), c) == self.op(a, self.op(b, c)) for a in self.G for b in self.G for c in self.G), "não é associativo"
        assert all(any(self.op(a, b) == self.e for b in self.G) for a in self.G), "falta inverso"

    def ordem(self, g):
        x, k = g, 1
        while x != self.e:
            x, k = self.op(x, g), k + 1
        return k

    def gerado(self, geradores):
        H, fronteira = {self.e}, [self.e]
        while fronteira:
            novos = [self.op(h, g) for h in fronteira for g in geradores]
            fronteira = [x for x in novos if x not in H]
            H.update(fronteira)
        return frozenset(H)

    def subgrupos(self):
        return {self.gerado([a, b]) for a in self.G for b in self.G}

    def classes_laterais(self, H):
        return {frozenset(self.op(g, h) for h in H) for g in self.G}

    def abeliano(self):
        return all(self.op(a, b) == self.op(b, a) for a in self.G for b in self.G)


def compoe(p, q):
    """(p ∘ q)(i) = p(q(i)): permutações como tuplas."""
    return tuple(p[i] for i in q)


def ciclos(p):
    vistos, out = set(), []
    for i in range(len(p)):
        if i not in vistos:
            c, j = [], i
            while j not in vistos:
                vistos.add(j); c.append(j); j = p[j]
            out.append(c)
    return out


def ordem_perm(p):
    return lcm(*(len(c) for c in ciclos(p)))


def out_shuffle(cartas):
    n = cartas // 2
    return tuple(2 * i if i < n else 2 * (i - n) + 1 for i in range(cartas))


def diedral(n):
    rot = [tuple((i + k) % n for i in range(n)) for k in range(n)]
    ref = [tuple((-(i + k)) % n for i in range(n)) for k in range(n)]
    return Grupo(rot + ref, compoe)


if __name__ == "__main__":
    # Aritmética modular
    assert euclides_estendido(240, 46) == (2, -9, 47)
    assert inverso(17, 3120) == 2753                    # o d do exemplo clássico de RSA
    assert tcr([(2, 3), (3, 5), (2, 7)]) == (23, 105)   # Sunzi
    assert tcr([(2, 4), (4, 6)]) == (10, 12) and tcr([(1, 4), (2, 6)]) is None
    for m in range(2, 40):
        for n in range(2, 40):
            if gcd(m, n) == 1:
                assert phi(m * n) == phi(m) * phi(n)
                # o mapa x ↦ (x mod m, x mod n) é bijetor
                assert len({(x % m, x % n) for x in range(m * n)}) == m * n
    for n in range(2, 200):
        for a in range(1, n):
            if gcd(a, n) == 1:
                assert pow(a, phi(n), n) == 1             # Euler (Fermat quando n é primo)
    print("Euclides, inversos, TCR e Euler: ok")

    # RSA pequeno, decifrando com o TCR
    p, q, e = 61, 53, 17
    n, d = p * q, inverso(e, (p - 1) * (q - 1))
    msg = 65
    c = pow(msg, e, n)
    mp, mq = pow(c, d % (p - 1), p), pow(c, d % (q - 1), q)
    assert tcr([(mp, p), (mq, q)])[0] == msg == pow(c, d, n)
    print(f"RSA: {msg} → {c} → {msg} (decifrado módulo {p} e {q} e juntado pelo TCR)")

    # Grupos: axiomas e Lagrange em todos os subgrupos
    grupos = {
        "Z12": Grupo(range(12), lambda a, b: (a + b) % 12),
        "Z15x": Grupo([k for k in range(15) if gcd(k, 15) == 1], lambda a, b: a * b % 15),
        "D4": diedral(4),
        "D5": diedral(5),
        "S4": Grupo(permutations(range(4)), compoe),
    }
    for nome, G in grupos.items():
        G.verifica_axiomas()
        subs = G.subgrupos()
        for H in subs:
            assert len(G.G) % len(H) == 0                                    # Lagrange
            assert sum(len(cl) for cl in G.classes_laterais(H)) == len(G.G)  # partição
        assert all(len(G.G) % G.ordem(g) == 0 for g in G.G)
        print(f"{nome:5} |G| = {len(G.G):2}  {'abeliano' if G.abeliano() else 'não abeliano':12}  {len(subs)} subgrupos (todos com ordem dividindo |G|)")
    assert len(grupos["D4"].subgrupos()) == 10 and len(grupos["S4"].subgrupos()) == 30

    # Permutações e embaralhamentos
    assert ordem_perm(out_shuffle(52)) == 8
    assert max(ordem_perm(p) for p in permutations(range(7))) == 12
    print("Embaralhamento perfeito de 52 cartas: ordem 8; maior ordem em S7: 12")
    print("Todos os testes passaram.")
