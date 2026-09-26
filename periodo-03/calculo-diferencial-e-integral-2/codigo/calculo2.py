"""Cálculo II em Python: séries de Taylor, derivadas parciais, gradiente,
descida do gradiente e integral dupla.   Execute:  python3 calculo2.py
"""
import math


def taylor_exp(x, n):
    """e^x ≈ Σ_{k=0}^{n} x^k / k!"""
    return sum(x ** k / math.factorial(k) for k in range(n + 1))


def taylor_sin(x, n):
    """sin x ≈ x − x³/3! + x⁵/5! − …  (termos até o grau n)"""
    return sum((-1) ** (k // 2) * x ** k / math.factorial(k) for k in range(1, n + 1, 2))


def gradiente(f, x, y, h=1e-6):
    """Derivadas parciais por diferença central."""
    return ((f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h))


def descida_gradiente(f, inicio, eta=0.1, passos=1000, tol=1e-10):
    x, y = inicio
    for k in range(passos):
        gx, gy = gradiente(f, x, y)
        x, y = x - eta * gx, y - eta * gy
        if math.hypot(eta * gx, eta * gy) < tol:
            return (x, y), k + 1
    return (x, y), passos


def integral_dupla(f, a, b, c, d, n=200):
    """∬ f dA sobre [a,b]×[c,d] pela regra do ponto médio."""
    hx, hy = (b - a) / n, (d - c) / n
    return sum(f(a + (i + 0.5) * hx, c + (j + 0.5) * hy) for i in range(n) for j in range(n)) * hx * hy


if __name__ == "__main__":
    assert abs(taylor_exp(1, 15) - math.e) < 1e-12
    assert abs(taylor_sin(math.pi / 6, 9) - 0.5) < 1e-7
    print("e ≈", taylor_exp(1, 10), "| sen(30°) ≈", taylor_sin(math.pi / 6, 5))

    f = lambda x, y: x ** 2 * y + math.sin(y)
    gx, gy = gradiente(f, 1.0, 2.0)
    assert abs(gx - 4) < 1e-6 and abs(gy - (1 + math.cos(2))) < 1e-6

    tigela = lambda x, y: (x - 1) ** 2 + 2 * (y + 3) ** 2
    (x, y), iters = descida_gradiente(tigela, (5, 5), eta=0.1)
    assert abs(x - 1) < 1e-6 and abs(y + 3) < 1e-6
    print(f"Descida do gradiente chegou em ({x:.4f}, {y:.4f}) em {iters} passos")

    vol = integral_dupla(lambda x, y: x * y, 0, 1, 0, 2)   # = ∫₀¹x dx · ∫₀²y dy = 1/2 · 2 = 1
    assert abs(vol - 1) < 1e-9
    print("Todos os testes passaram.")
