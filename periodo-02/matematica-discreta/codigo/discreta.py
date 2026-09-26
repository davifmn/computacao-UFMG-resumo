"""Matemática Discreta em Python: teoria dos números, RSA, relações, contagem e recorrências.

Execute:  python3 discreta.py
"""
from itertools import combinations, permutations, product
from math import comb, factorial


# ---------- Teoria dos números ----------
def euclides_estendido(a, b):
    """Devolve (d, s, t) com d = mdc(a, b) = a·s + b·t."""
    r0, s0, t0 = a, 1, 0
    r1, s1, t1 = b, 0, 1
    while r1 != 0:
        q = r0 // r1
        r0, r1 = r1, r0 - q * r1
        s0, s1 = s1, s0 - q * s1
        t0, t1 = t1, t0 - q * t1
    return r0, s0, t0


def inverso_modular(a, n):
    d, s, _ = euclides_estendido(a % n, n)
    if d != 1:
        raise ValueError(f"{a} não tem inverso módulo {n} (mdc = {d})")
    return s % n


def potencia_modular(base, exp, n):
    """Quadrados sucessivos: O(log exp) multiplicações (o mesmo que pow(base, exp, n))."""
    resultado, base = 1, base % n
    while exp > 0:
        if exp & 1:
            resultado = resultado * base % n
        base = base * base % n
        exp >>= 1
    return resultado


def rsa_chaves(p, q, e=65537):
    n, phi = p * q, (p - 1) * (q - 1)
    d = inverso_modular(e, phi)
    return (n, e), (n, d)


# ---------- Relações ----------
def fecho_transitivo(M):
    """Algoritmo de Warshall sobre a matriz booleana M (lista de listas)."""
    M = [linha[:] for linha in M]
    n = len(M)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if M[i][k] and M[k][j]:
                    M[i][j] = 1
    return M


def eh_equivalencia(M):
    n = len(M)
    reflexiva = all(M[i][i] for i in range(n))
    simetrica = all(M[i][j] == M[j][i] for i in range(n) for j in range(n))
    return reflexiva and simetrica and fecho_transitivo(M) == M


# ---------- Recorrências ----------
def hanoi(n, origem="A", destino="C", aux="B", movimentos=None):
    movimentos = [] if movimentos is None else movimentos
    if n > 0:
        hanoi(n - 1, origem, aux, destino, movimentos)
        movimentos.append((origem, destino))
        hanoi(n - 1, aux, destino, origem, movimentos)
    return movimentos


if __name__ == "__main__":
    d, s, t = euclides_estendido(240, 46)
    assert (d, 240 * s + 46 * t) == (2, 2)
    assert inverso_modular(3, 11) == 4
    assert potencia_modular(4, 13, 497) == pow(4, 13, 497) == 445

    publica, privada = rsa_chaves(61, 53, e=17)
    assert privada[1] == 2753
    mensagem = [ord(c) for c in "UFMG"]
    cifrada = [potencia_modular(m, publica[1], publica[0]) for m in mensagem]
    decifrada = "".join(chr(potencia_modular(c, privada[1], privada[0])) for c in cifrada)
    assert decifrada == "UFMG"
    print("RSA:", mensagem, "->", cifrada, "->", decifrada)

    sucessor = [[1 if j == i + 1 else 0 for j in range(4)] for i in range(4)]
    assert fecho_transitivo(sucessor) == [[0, 1, 1, 1], [0, 0, 1, 1], [0, 0, 0, 1], [0, 0, 0, 0]]
    mesma_paridade = [[1 if (i - j) % 2 == 0 else 0 for j in range(6)] for i in range(6)]
    assert eh_equivalencia(mesma_paridade)

    itens = "ABCD"
    assert len(list(product(itens, repeat=2))) == 4 ** 2          # ordem importa, com repetição
    assert len(list(permutations(itens, 2))) == factorial(4) // factorial(2)
    assert len(list(combinations(itens, 2))) == comb(4, 2) == 6

    for n in range(1, 11):
        assert len(hanoi(n)) == 2 ** n - 1                     # provado por indução!
    print("Hanói com 3 discos:", hanoi(3))
    print("Todos os testes passaram.")
