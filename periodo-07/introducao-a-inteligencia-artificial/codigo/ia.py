"""Introdução à IA em Python puro: busca (BFS, custo uniforme, A*), minimax e
alfa-beta, jogo da velha, iteração de valor no mundo 4×3 e redes neurais
(perceptron e retropropagação no XOR).

Execute:  python3 ia.py
"""
import heapq
import math
import random
from collections import deque
from functools import lru_cache


# ---------- Busca ----------

def vizinhos(grade, v):
    h, w = len(grade), len(grade[0])
    y, x = v
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and grade[ny][nx] != "#":
            yield (ny, nx), (5 if grade[ny][nx] == "~" else 1)


def bfs(grade, s, t):
    pai, fila = {s: None}, deque([s])
    while fila:
        v = fila.popleft()
        if v == t:
            break
        for u, _ in vizinhos(grade, v):
            if u not in pai:
                pai[u] = v
                fila.append(u)
    return len(pai)


def a_estrela(grade, s, t, heuristica=True):
    """Com heuristica=False é a busca de custo uniforme. Devolve (custo, expandidos)."""
    h = (lambda v: abs(v[0] - t[0]) + abs(v[1] - t[1])) if heuristica else (lambda v: 0)
    g, fila, fechados = {s: 0}, [(h(s), 0, s)], set()
    while fila:
        _, gv, v = heapq.heappop(fila)
        if v in fechados:
            continue
        fechados.add(v)
        if v == t:
            return gv, len(fechados)
        for u, c in vizinhos(grade, v):
            if gv + c < g.get(u, math.inf):
                g[u] = gv + c
                heapq.heappush(fila, (g[u] + h(u), g[u], u))
    return math.inf, len(fechados)


# ---------- Jogos ----------

def minimax(no, max_joga=True):
    if isinstance(no, (int, float)):
        return no, 1
    resultados = [minimax(f, not max_joga) for f in no]
    vals = [r[0] for r in resultados]
    return (max(vals) if max_joga else min(vals)), sum(r[1] for r in resultados)


def alfabeta(no, alfa=-math.inf, beta=math.inf, max_joga=True):
    """Devolve (valor, folhas avaliadas)."""
    if isinstance(no, (int, float)):
        return no, 1
    folhas = 0
    v = -math.inf if max_joga else math.inf
    for f in no:
        fv, n = alfabeta(f, alfa, beta, not max_joga)
        folhas += n
        if max_joga:
            v = max(v, fv)
            alfa = max(alfa, v)
        else:
            v = min(v, fv)
            beta = min(beta, v)
        if alfa >= beta:
            break
    return v, folhas


LINHAS = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]


def vencedor(b):
    for a, c, d in LINHAS:
        if b[a] != "." and b[a] == b[c] == b[d]:
            return b[a]
    return "empate" if "." not in b else None


@lru_cache(maxsize=None)
def velha(b, jogador):
    w = vencedor(b)
    if w:
        return {"X": 1, "O": -1, "empate": 0}[w]
    prox = "O" if jogador == "X" else "X"
    vals = [velha(b[:i] + jogador + b[i + 1:], prox) for i in range(9) if b[i] == "."]
    return max(vals) if jogador == "X" else min(vals)


def posicoes_legais():
    vistas, fila = {"." * 9}, ["." * 9]
    while fila:
        b = fila.pop()
        if vencedor(b):
            continue
        j = "X" if b.count("X") == b.count("O") else "O"
        for i in range(9):
            if b[i] == ".":
                n = b[:i] + j + b[i + 1:]
                if n not in vistas:
                    vistas.add(n)
                    fila.append(n)
    return len(vistas)


# ---------- MDP ----------

def iteracao_de_valor(R=-0.04, gamma=1.0, p=0.8, eps=1e-10):
    w, h, parede = 4, 3, (1, 1)
    terminais = {(3, 2): 1.0, (3, 1): -1.0}
    estados = [(x, y) for x in range(w) for y in range(h) if (x, y) != parede]
    acoes = {"↑": (0, 1), "↓": (0, -1), "←": (-1, 0), "→": (1, 0)}

    def move(s, a):
        n = (s[0] + a[0], s[1] + a[1])
        return n if 0 <= n[0] < w and 0 <= n[1] < h and n != parede else s

    def q(U, s, a):
        lados = [(a[1], a[0]), (-a[1], -a[0])]
        return p * U[move(s, a)] + (1 - p) / 2 * sum(U[move(s, l)] for l in lados)

    U = {s: 0.0 for s in estados}
    while True:
        N = {s: terminais[s] if s in terminais else R + gamma * max(q(U, s, a) for a in acoes.values()) for s in estados}
        if max(abs(N[s] - U[s]) for s in estados) < eps:
            U = N
            break
        U = N
    politica = {s: max(acoes, key=lambda nome: q(U, s, acoes[nome])) for s in estados if s not in terminais}
    return U, politica


# ---------- Redes neurais ----------

def perceptron(dados, epocas=1000, eta=0.1):
    w = [0.0, 0.0, 0.0]
    for e in range(epocas):
        erros = 0
        for x, y, t in dados:
            out = 1 if w[0] * x + w[1] * y + w[2] > 0 else 0
            if out != t:
                erros += 1
                w = [w[0] + eta * (t - out) * x, w[1] + eta * (t - out) * y, w[2] + eta * (t - out)]
        if erros == 0:
            return w, e + 1
    return w, None


def treina_xor(oculto=4, epocas=4000, eta=0.5, semente=1):
    rnd = random.Random(semente)
    W1 = [[rnd.uniform(-1, 1) for _ in range(2)] for _ in range(oculto)]
    b1 = [rnd.uniform(-1, 1) for _ in range(oculto)]
    W2 = [rnd.uniform(-1, 1) for _ in range(oculto)]
    b2 = 0.0
    dados = [((0, 0), 0), ((0, 1), 1), ((1, 0), 1), ((1, 1), 0)]
    sig = lambda z: 1 / (1 + math.exp(-z))
    for _ in range(epocas):
        for (x1, x2), t in dados:
            h = [math.tanh(W1[k][0] * x1 + W1[k][1] * x2 + b1[k]) for k in range(oculto)]
            y = sig(sum(W2[k] * h[k] for k in range(oculto)) + b2)
            d = y - t                                         # gradiente da entropia cruzada
            for k in range(oculto):
                dh = d * W2[k] * (1 - h[k] ** 2)              # retropropagação
                W2[k] -= eta * d * h[k]
                W1[k][0] -= eta * dh * x1
                W1[k][1] -= eta * dh * x2
                b1[k] -= eta * dh
            b2 -= eta * d

    def prever(x1, x2):
        h = [math.tanh(W1[k][0] * x1 + W1[k][1] * x2 + b1[k]) for k in range(oculto)]
        return sig(sum(W2[k] * h[k] for k in range(oculto)) + b2)
    return [round(prever(*x), 3) for x, _ in dados]


if __name__ == "__main__":
    rnd = random.Random(4)
    for _ in range(200):
        grade = ["".join(rnd.choice("..........#~") for _ in range(15)) for _ in range(10)]
        grade[0] = "." + grade[0][1:]
        grade[9] = grade[9][:14] + "."
        cu, eu = a_estrela(grade, (0, 0), (9, 14), heuristica=False)
        ca, ea = a_estrela(grade, (0, 0), (9, 14))
        assert cu == ca and ea <= eu, (cu, ca)
    print("A* (Manhattan) acha o mesmo custo que o custo uniforme e expande no máximo os mesmos nós (200 grades)")

    livro = [[3, 12, 8], [2, 4, 6], [14, 5, 2]]
    assert minimax(livro) == (3, 9) and alfabeta(livro) == (3, 7)
    def arvore(d):
        return rnd.randint(-9, 9) if d == 0 else [arvore(d - 1) for _ in range(rnd.randint(2, 3))]
    for _ in range(300):
        t = arvore(4)
        (v1, f1), (v2, f2) = minimax(t), alfabeta(t)
        assert v1 == v2 and f2 <= f1
    print("alfa-beta = minimax em 300 árvores; no exemplo do livro avalia 7 das 9 folhas")

    assert velha("." * 9, "X") == 0
    assert posicoes_legais() == 5478
    print("jogo da velha: com jogo perfeito é empate; 5478 posições legais")

    U, pol = iteracao_de_valor()
    livro_U = {(0, 0): 0.705, (0, 1): 0.762, (0, 2): 0.812, (1, 0): 0.655, (1, 2): 0.868,
               (2, 0): 0.611, (2, 1): 0.660, (2, 2): 0.918, (3, 0): 0.388}
    assert all(abs(U[s] - v) < 0.0015 for s, v in livro_U.items())
    assert pol[(2, 0)] == "←" and pol[(3, 0)] == "←" and pol[(2, 1)] == "↑"
    print("mundo 4×3: utilidades e política iguais às do Russell e Norvig")

    sep = [(x, y, 1 if y > 0.4 * x - 0.1 else 0) for x, y in ((rnd.uniform(-1, 1), rnd.uniform(-1, 1)) for _ in range(100))]
    assert perceptron(sep)[1] is not None
    xor = [(0, 0, 0), (0, 1, 1), (1, 0, 1), (1, 1, 0)]
    assert perceptron(xor)[1] is None
    saida = treina_xor()
    assert saida[0] < 0.1 and saida[1] > 0.9 and saida[2] > 0.9 and saida[3] < 0.1
    print(f"perceptron converge em dados separáveis e falha no XOR; a rede com camada escondida dá {saida}")
