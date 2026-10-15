"""Sistemas paralelos e distribuídos em Python: speedup medido com
multiprocessing, MapReduce de contagem de palavras em vários processos,
relógios de Lamport e vetoriais, e eleições do valentão e em anel.

Execute:  python3 fspd.py
"""
import os
import random
import time
from collections import Counter
from multiprocessing import Pool


# ---------- Speedup ----------

def amdahl(s, p):
    return 1 / (s + (1 - s) / p)


def gustafson(s, p):
    return p - s * (p - 1)


def trabalho(n):
    """Tarefa de CPU pura (soma de quadrados), para medir speedup real."""
    return sum(i * i for i in range(n))


# ---------- MapReduce ----------

def mapeia(pedaco):
    c = Counter()                        # combinador local: soma antes de enviar
    for palavra in pedaco.split():
        c[palavra] += 1
    return c


def map_reduce(texto, processos):
    linhas = texto.splitlines()
    pedacos = ["\n".join(linhas[k::processos]) for k in range(processos)]
    with Pool(processos) as pool:
        parciais = pool.map(mapeia, pedacos)          # fase map, em paralelo
    total = Counter()
    for c in parciais:                               # embaralhamento + reduce
        total.update(c)
    return total


# ---------- Relógios lógicos ----------

def relogios(n, eventos):
    """eventos: (processo, 'local' | 'send' | 'recv', índice do send) em ordem viável."""
    L, V, out = [0] * n, [[0] * n for _ in range(n)], []
    for p, tipo, msg in eventos:
        if tipo == "recv":
            lt, vt = out[msg]
            L[p] = max(L[p], lt) + 1
            V[p] = [max(a, b) for a, b in zip(V[p], vt)]
            V[p][p] += 1
        else:
            L[p] += 1
            V[p][p] += 1
        out.append((L[p], list(V[p])))
    return out


def antes(va, vb):
    return all(a <= b for a, b in zip(va, vb)) and va != vb


# ---------- Eleições ----------

def valentao(n, mortos, quem):
    msgs, fila, iniciados = 0, [quem], set()
    while fila:
        p = fila.pop(0)
        if p in iniciados:
            continue
        iniciados.add(p)
        maiores = range(p + 1, n + 1)
        msgs += len(maiores)                              # ELEIÇÃO
        vivos = [q for q in maiores if q not in mortos]
        if not vivos:
            vencedor = p
            break
        msgs += len(vivos)                                # OK
        fila.extend(vivos)
    msgs += sum(1 for q in range(1, n + 1) if q != vencedor and q not in mortos)   # COORDENADOR
    return vencedor, msgs


def anel(n, mortos, quem):
    vivos = [q for q in range(1, n + 1) if q not in mortos]
    return max(vivos), 2 * len(vivos)


if __name__ == "__main__":
    assert round(amdahl(0.1, 10), 3) == 5.263 and abs(amdahl(0.05, 10**9) - 20) < 1e-6
    assert gustafson(0.1, 10) == 9.1

    rnd = random.Random(0)
    vocab = "o rato roeu a roupa do rei de roma e riu".split()
    texto = "\n".join(" ".join(rnd.choice(vocab) for _ in range(40)) for _ in range(20000))
    seq = mapeia(texto)
    for p in (1, 2, 4):
        assert map_reduce(texto, p) == seq
    print(f"MapReduce: contagem igual à sequencial com 1, 2 e 4 processos ({sum(seq.values())} palavras)")

    cpus = os.cpu_count() or 1
    tarefas = [2_000_000] * 8
    t0 = time.perf_counter()
    r1 = [trabalho(n) for n in tarefas]
    t1 = time.perf_counter() - t0
    with Pool(min(4, cpus)) as pool:
        t0 = time.perf_counter()
        r4 = pool.map(trabalho, tarefas)
        t4 = time.perf_counter() - t0
    assert r1 == r4
    print(f"speedup medido com {min(4, cpus)} processos: {t1 / t4:.2f}× (depende da máquina; Amdahl com 5% serial daria {amdahl(0.05, min(4, cpus)):.2f}×)")

    ev = [(0, "local", None), (0, "send", None), (1, "local", None), (1, "recv", 1), (1, "send", None),
          (2, "local", None), (2, "recv", 4), (2, "send", None), (0, "local", None), (0, "recv", 7)]
    r = relogios(3, ev)
    assert [x[0] for x in r] == [1, 2, 1, 3, 4, 1, 5, 6, 3, 7]
    assert r[9][1] == [4, 3, 3]
    # propriedade de Lamport: a → b implica L(a) < L(b), conferida em todos os pares
    for i in range(len(r)):
        for j in range(len(r)):
            if antes(r[i][1], r[j][1]):
                assert r[i][0] < r[j][0]
    assert not antes(r[2][1], r[1][1]) and not antes(r[1][1], r[2][1])   # concorrentes
    print("relógios: Lamport e vetores conferidos; a → b implica L(a) < L(b) em todos os pares")

    assert valentao(6, {6}, 2) == (5, 20)
    assert valentao(6, {6}, 5) == (5, 5)
    assert anel(6, {6}, 2) == (5, 10)
    print("eleições: valentão (começando em 2) 20 mensagens, anel 10; ambos elegem o 5")
