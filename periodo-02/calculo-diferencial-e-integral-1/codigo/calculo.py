"""Cálculo numérico básico: derivada, integral e raízes de funções.

Execute:  python3 calculo.py
"""
import math


def derivada(f, x, h=1e-5):
    """Diferença central: erro O(h²), bem melhor que (f(x+h) - f(x)) / h, que é O(h)."""
    return (f(x + h) - f(x - h)) / (2 * h)


def riemann(f, a, b, n, metodo="meio"):
    dx = (b - a) / n
    if metodo == "esquerda":
        pontos = (a + i * dx for i in range(n))
    elif metodo == "direita":
        pontos = (a + (i + 1) * dx for i in range(n))
    else:
        pontos = (a + (i + 0.5) * dx for i in range(n))
    return sum(f(x) for x in pontos) * dx


def trapezio(f, a, b, n):
    dx = (b - a) / n
    return dx * (f(a) / 2 + sum(f(a + i * dx) for i in range(1, n)) + f(b) / 2)


def simpson(f, a, b, n=100):
    """Aproxima f por parábolas: erro O(1/n⁴). n precisa ser par."""
    if n % 2:
        n += 1
    h = (b - a) / n
    s = f(a) + f(b)
    s += 4 * sum(f(a + i * h) for i in range(1, n, 2))
    s += 2 * sum(f(a + i * h) for i in range(2, n, 2))
    return s * h / 3


def bissecao(f, a, b, tol=1e-12):
    """Raiz de f em [a, b], se f(a) e f(b) têm sinais opostos (Teorema do Valor Intermediário)."""
    if f(a) * f(b) > 0:
        raise ValueError("f(a) e f(b) precisam ter sinais opostos")
    while b - a > tol:
        m = (a + b) / 2
        if f(a) * f(m) <= 0:
            b = m
        else:
            a = m
    return (a + b) / 2


def newton(f, x0, df=None, tol=1e-12, max_iter=50):
    """Método de Newton: segue a reta tangente até o eixo x. Converge quadraticamente."""
    df = df or (lambda x: derivada(f, x))
    x = x0
    for _ in range(max_iter):
        passo = f(x) / df(x)
        x -= passo
        if abs(passo) < tol:
            return x
    raise RuntimeError("Newton não convergiu")


if __name__ == "__main__":
    assert abs(derivada(math.sin, 0) - 1) < 1e-9
    assert abs(derivada(lambda x: x ** 3, 2) - 12) < 1e-6

    f = lambda x: x ** 2
    exata = 8 / 3
    print("∫₀² x² dx =", exata)
    for n in (10, 100, 1000):
        erros = {m: abs(riemann(f, 0, 2, n, m) - exata) for m in ("esquerda", "meio")}
        print(f"  n = {n:4}: esquerda erra {erros['esquerda']:.1e}, ponto médio erra {erros['meio']:.1e}")
    assert abs(trapezio(f, 0, 2, 1000) - exata) < 1e-5
    assert abs(simpson(math.sin, 0, math.pi) - 2) < 1e-7

    raiz2 = newton(lambda x: x * x - 2, 1.0)
    assert abs(raiz2 - math.sqrt(2)) < 1e-12
    assert abs(bissecao(lambda x: x ** 3 - x - 2, 1, 2) - 1.5213797068) < 1e-9
    print("√2 por Newton:", raiz2)
    print("Todos os testes passaram.")
