"""Introdução à Ciência dos Dados com a biblioteca padrão: as ideias sem as bibliotecas.

Execute:  python3 icd.py

Na disciplina usa-se pandas, numpy, scipy, matplotlib e scikit-learn; aqui cada técnica é
escrita à mão (bootstrap, teste de permutação, regressão, validação cruzada, k-NN) e
conferida contra resultados conhecidos, para ficar claro o que as bibliotecas fazem.
"""
import math
import random
import statistics as st


def bootstrap(amostra, estatistica, B, rng):
    n = len(amostra)
    return [estatistica([amostra[rng.randrange(n)] for _ in range(n)]) for _ in range(B)]


def percentil(xs, q):
    s = sorted(xs)
    pos = (len(s) - 1) * q
    lo, hi = math.floor(pos), math.ceil(pos)
    return s[lo] + (s[hi] - s[lo]) * (pos - lo)


def teste_permutacao(a, b, B, rng):
    """Valor-p bilateral de H0: os rótulos A/B não importam."""
    obs = st.fmean(b) - st.fmean(a)
    todos, extremos = a + b, 0
    for _ in range(B):
        rng.shuffle(todos)
        d = st.fmean(todos[len(a):]) - st.fmean(todos[:len(a)])
        extremos += abs(d) >= abs(obs) - 1e-12
    return obs, extremos / B


def regressao(xs, ys):
    mx, my = st.fmean(xs), st.fmean(ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    a = sxy / sxx
    return a, my - a * mx, sxy / math.sqrt(sxx * syy)


def knn(treino, p, k):
    viz = sorted(treino, key=lambda q: (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2)[:k]
    votos = [q[2] for q in viz]
    return max(set(votos), key=lambda c: (votos.count(c), -votos.index(c)))


def acuracia(treino, teste, k):
    return st.fmean(knn(treino, p, k) == p[2] for p in teste)


def validacao_cruzada(dados, k, dobras=5):
    """Acurácia média de k-NN em validação cruzada com `dobras` partes."""
    accs = []
    for f in range(dobras):
        val = dados[f::dobras]
        tr = [p for i, p in enumerate(dados) if i % dobras != f]
        accs.append(acuracia(tr, val, k))
    return st.fmean(accs)


def meias_luas(n, ruido, rng):
    pts = []
    for i in range(n):
        c, t = i % 2, math.pi * rng.random()
        x, y = (math.cos(t), math.sin(t)) if c == 0 else (1 - math.cos(t), 0.5 - math.sin(t))
        pts.append((x + rng.gauss(0, ruido), y + rng.gauss(0, ruido), c))
    return pts


if __name__ == "__main__":
    rng = random.Random(42)

    # Bootstrap da média × fórmula s/√n
    amostra = [rng.expovariate(1 / 2) for _ in range(60)]
    medias = bootstrap(amostra, st.fmean, 4000, rng)
    ep_formula = st.stdev(amostra) / math.sqrt(len(amostra))
    print(f"Bootstrap: erro padrão {st.stdev(medias):.3f} (fórmula s/√n: {ep_formula:.3f}); "
          f"IC 95% = [{percentil(medias, 0.025):.2f}; {percentil(medias, 0.975):.2f}]")
    assert abs(st.stdev(medias) - ep_formula) / ep_formula < 0.1

    # Cobertura: um IC de 95% deve conter a média verdadeira (2) em ~95% dos experimentos
    cobre = 0
    for _ in range(300):
        am = [rng.expovariate(1 / 2) for _ in range(80)]
        bs = bootstrap(am, st.fmean, 400, rng)
        cobre += percentil(bs, 0.025) <= 2 <= percentil(bs, 0.975)
    print(f"Cobertura do IC de 95% em 300 experimentos: {cobre / 300:.0%}")
    assert 0.88 <= cobre / 300 <= 0.99

    # Teste de permutação: sob H0, valor-p < 0,05 em ~5% das vezes (erro do tipo I)
    rejeita = 0
    for _ in range(200):
        a = [rng.gauss(4, 1.4) for _ in range(25)]
        b = [rng.gauss(4, 1.4) for _ in range(25)]
        rejeita += teste_permutacao(a, b, 300, rng)[1] < 0.05
    print(f"Sob H0, o teste rejeitou em {rejeita / 200:.1%} das vezes (esperado ≈ 5%)")
    assert rejeita / 200 < 0.11
    a = [rng.gauss(4, 1.4) for _ in range(100)]
    b = [rng.gauss(5, 1.4) for _ in range(100)]
    assert teste_permutacao(a, b, 1000, rng)[1] < 0.01

    # Regressão: quarteto de Anscombe
    x = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5]
    for y in ([8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68],
              [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74]):
        a_, b_, r = regressao(x, y)
        assert abs(a_ - 0.5) < 0.01 and abs(b_ - 3) < 0.01 and abs(r - 0.816) < 0.002
    print("Anscombe: ŷ = 0,50x + 3,00 e r = 0,816 nos dois conjuntos testados")

    # k-NN: k = 1 decora o treino; validação cruzada escolhe um k melhor
    dados = meias_luas(300, 0.3, random.Random(1))
    random.Random(7).shuffle(dados)
    treino, teste = dados[:210], dados[210:]
    assert acuracia(treino, treino, 1) == 1
    cv = {k: validacao_cruzada(treino, k) for k in (1, 3, 5, 9, 15, 25, 51, 99)}
    melhor = max(cv, key=cv.get)
    print("Validação cruzada (k: acurácia):", ", ".join(f"{k}: {v:.2f}" for k, v in cv.items()))
    print(f"k escolhido = {melhor}; acurácia no teste: {acuracia(treino, teste, melhor):.2f} (k = 1: {acuracia(treino, teste, 1):.2f})")
    assert melhor > 1 and acuracia(treino, teste, melhor) > acuracia(treino, teste, 1)
    print("Todos os testes passaram.")
