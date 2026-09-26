"""Eliminação de Gauss-Jordan com frações exatas + classificação do sistema.

Execute:  python3 gauss.py
"""
from fractions import Fraction


def achar_pivo(M, r, c):
    for i in range(r, len(M)):
        if M[i][c] != 0:
            return i
    return None


def gauss_jordan(M):
    """Leva a matriz aumentada M à forma escalonada reduzida (altera M)."""
    M[:] = [[Fraction(x) for x in linha] for linha in M]
    lin, col = len(M), len(M[0])
    r = 0                                        # linha do próximo pivô
    for c in range(col - 1):
        p = achar_pivo(M, r, c)
        if p is None:
            continue                             # coluna sem pivô: variável livre
        M[r], M[p] = M[p], M[r]                  # troca de linhas
        piv = M[r][c]
        M[r] = [x / piv for x in M[r]]           # pivô vira 1
        for i in range(lin):
            if i != r and M[i][c] != 0:
                k = M[i][c]
                M[i] = [a - k * b for a, b in zip(M[i], M[r])]  # zera o resto da coluna
        r += 1
        if r == lin:
            break
    return M


def classifica(R):
    """Recebe a matriz reduzida. Devolve ('SPD', solução), ('SPI', livres) ou ('SI', None)."""
    n = len(R[0]) - 1
    for linha in R:
        if all(x == 0 for x in linha[:n]) and linha[n] != 0:
            return "SI", None
    pivos = {}
    for linha in R:
        for j in range(n):
            if linha[j] != 0:
                pivos[j] = linha[n]
                break
    if len(pivos) == n:
        return "SPD", [pivos[j] for j in range(n)]
    return "SPI", [j for j in range(n) if j not in pivos]


def imprime(M):
    for linha in M:
        *coef, b = linha
        print("  [" + " ".join(f"{str(x):>6}" for x in coef) + f" | {str(b):>6} ]")


if __name__ == "__main__":
    M = [[2, 1, -1, 8],
         [-3, -1, 2, -11],
         [-2, 1, 2, -3]]
    R = gauss_jordan(M)
    imprime(R)
    assert classifica(R) == ("SPD", [2, 3, -1])

    assert classifica(gauss_jordan([[0, 2, 4], [3, 1, 5]])) == ("SPD", [1, 2])
    assert classifica(gauss_jordan([[1, 2, 3, 4], [2, 4, 6, 8]]))[0] == "SPI"
    assert classifica(gauss_jordan([[1, 1, 1], [1, 1, 2]])) == ("SI", None)
    tipo, sol = classifica(gauss_jordan([[Fraction(1, 2), Fraction(1, 3), 1], [1, -1, 0]]))
    assert tipo == "SPD" and sol == [Fraction(6, 5), Fraction(6, 5)]
    print("Todos os testes passaram.")
