"""Probabilidade em Python puro: distribuições, simulação, TCL, Bayes e Monty Hall.

Execute:  python3 probabilidade.py
(Em projetos reais, use scipy.stats e numpy.random.)
"""
import math
import random
import statistics


def binomial_pmf(k, n, p):
    return math.comb(n, k) * p ** k * (1 - p) ** (n - k)


def poisson_pmf(k, lam):
    return lam ** k * math.exp(-lam) / math.factorial(k)


def normal_cdf(x, mu=0.0, sigma=1.0):
    return 0.5 * (1 + math.erf((x - mu) / (sigma * math.sqrt(2))))


def bayes_teste(prevalencia, sensibilidade, especificidade):
    """P(doente | teste positivo)."""
    p_pos = sensibilidade * prevalencia + (1 - especificidade) * (1 - prevalencia)
    return sensibilidade * prevalencia / p_pos


def monty_hall(jogos, trocar, rng):
    vitorias = 0
    for _ in range(jogos):
        carro, escolha = rng.randrange(3), rng.randrange(3)
        aberta = rng.choice([p for p in range(3) if p not in (carro, escolha)])
        if trocar:
            escolha = next(p for p in range(3) if p not in (escolha, aberta))
        vitorias += escolha == carro
    return vitorias / jogos


def medias_amostrais(amostra, n, repeticoes, rng):
    """Teorema Central do Limite: médias de n observações."""
    return [statistics.fmean(amostra(rng) for _ in range(n)) for _ in range(repeticoes)]


if __name__ == "__main__":
    rng = random.Random(42)

    assert abs(sum(binomial_pmf(k, 20, 0.3) for k in range(21)) - 1) < 1e-12
    assert abs(sum(poisson_pmf(k, 4) for k in range(100)) - 1) < 1e-12
    assert abs(normal_cdf(1.96) - normal_cdf(-1.96) - 0.95) < 1e-3

    post = bayes_teste(0.01, 0.99, 0.95)
    print(f"Teste 99% sensível, 95% específico, doença com 1% de prevalência: P(D|+) = {post:.1%}")
    assert abs(post - 1 / 6) < 1e-9

    fica, troca = monty_hall(20000, False, rng), monty_hall(20000, True, rng)
    print(f"Monty Hall: ficando ganha {fica:.1%}, trocando ganha {troca:.1%}")
    assert abs(fica - 1 / 3) < 0.02 and abs(troca - 2 / 3) < 0.02

    exp = lambda r: r.expovariate(1.0)             # média 1, desvio 1
    medias = medias_amostrais(exp, 25, 4000, rng)
    dp = statistics.stdev(medias)
    print(f"TCL: desvio das médias com n = 25 é {dp:.3f} (teoria: 1/√25 = 0.200)")
    assert abs(statistics.fmean(medias) - 1) < 0.02 and abs(dp - 0.2) < 0.02
    print("Todos os testes passaram.")
