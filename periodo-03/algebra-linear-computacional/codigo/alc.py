"""Álgebra linear numérica em Python puro: eliminação com pivoteamento,
mínimos quadrados, método das potências e PageRank.   Execute:  python3 alc.py
(Na prática: numpy.linalg.solve, numpy.linalg.lstsq, numpy.linalg.svd.)
"""


def resolve(A, b):
    """Gauss com pivoteamento parcial (troca pelo maior pivô para reduzir erros)."""
    n = len(A)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda i: abs(M[i][c]))
        M[c], M[p] = M[p], M[c]
        for i in range(c + 1, n):
            k = M[i][c] / M[c][c]
            M[i] = [a - k * b for a, b in zip(M[i], M[c])]
    x = [0.0] * n
    for i in reversed(range(n)):
        x[i] = (M[i][n] - sum(M[i][j] * x[j] for j in range(i + 1, n))) / M[i][i]
    return x


def transposta(A):
    return [list(c) for c in zip(*A)]


def mult(A, B):
    return [[sum(a * b for a, b in zip(linha, col)) for col in zip(*B)] for linha in A]


def minimos_quadrados(pontos, grau):
    """Resolve as equações normais AᵀA c = Aᵀy."""
    A = [[x ** k for k in range(grau + 1)] for x, _ in pontos]
    y = [[yy] for _, yy in pontos]
    At = transposta(A)
    return resolve(mult(At, A), [v[0] for v in mult(At, y)])


def metodo_potencias(A, iteracoes=100):
    x = [1.0] * len(A)
    for _ in range(iteracoes):
        y = [sum(a * b for a, b in zip(linha, x)) for linha in A]
        norma = max(abs(v) for v in y)
        x = [v / norma for v in y]
    Ax = [sum(a * b for a, b in zip(linha, x)) for linha in A]
    autovalor = sum(a * b for a, b in zip(x, Ax)) / sum(v * v for v in x)
    return autovalor, x


def pagerank(n, links, d=0.85, iteracoes=100):
    saida = [0] * n
    for j, _ in links:
        saida[j] += 1
    r = [1 / n] * n
    for _ in range(iteracoes):
        novo = [(1 - d) / n] * n
        for j in range(n):
            if saida[j] == 0:                 # beco sem saída: distribui para todos
                for i in range(n):
                    novo[i] += d * r[j] / n
        for j, i in links:
            novo[i] += d * r[j] / saida[j]
        r = novo
    return r


if __name__ == "__main__":
    assert [round(v, 9) for v in resolve([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3])] == [2, 3, -1]

    c = minimos_quadrados([(0, 1), (1, 3), (2, 7), (3, 13)], 2)   # y = x² + x + 1 exatamente
    assert all(abs(a - b) < 1e-9 for a, b in zip(c, [1, 1, 1]))
    c = minimos_quadrados([(0, 0), (1, 1), (2, 1), (3, 3)], 1)
    print(f"Reta de mínimos quadrados: y = {c[0]:.2f} + {c[1]:.2f}x")

    lam, v = metodo_potencias([[2, 1], [1, 2]])
    assert abs(lam - 3) < 1e-9
    print("Autovalor dominante de [[2,1],[1,2]]:", round(lam, 6))

    r = pagerank(4, [(0, 1), (0, 2), (1, 2), (2, 0), (3, 2)])
    assert abs(sum(r) - 1) < 1e-12
    print("PageRank:", [round(x, 4) for x in r])
    print("Todos os testes passaram.")
