"""Equações diferenciais em Python puro: Euler, Heun e Runge-Kutta 4 com as
ordens de convergência medidas, o oscilador massa-mola (livre e forçado),
classificação de sistemas 2×2 e a transformada de Laplace conferida numericamente.

Execute:  python3 edo.py
"""
import cmath
import math


# ---------- Métodos de passo único ----------

def euler(f, t, y, h):
    return y + h * f(t, y)


def heun(f, t, y, h):
    k1 = f(t, y)
    k2 = f(t + h, y + h * k1)
    return y + h / 2 * (k1 + k2)


def rk4(f, t, y, h):
    k1 = f(t, y)
    k2 = f(t + h / 2, y + h / 2 * k1)
    k3 = f(t + h / 2, y + h / 2 * k2)
    k4 = f(t + h, y + h * k3)
    return y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)


def resolve(f, t0, y0, t1, n, passo=rk4):
    h, t, y = (t1 - t0) / n, t0, y0
    for _ in range(n):
        y = passo(f, t, y, h)
        t += h
    return y


def ordem_observada(f, exata, t0, y0, t1, passo, n=20):
    """log2(erro(h) / erro(h/2)): deve dar a ordem do método."""
    e1 = abs(resolve(f, t0, y0, t1, n, passo) - exata(t1))
    e2 = abs(resolve(f, t0, y0, t1, 2 * n, passo) - exata(t1))
    return math.log2(e1 / e2)


# ---------- Sistemas (vetores como listas) ----------

def rk4_sistema(F, t0, Y0, t1, n):
    h, t, Y = (t1 - t0) / n, t0, list(Y0)
    soma = lambda A, B, s: [a + s * b for a, b in zip(A, B)]
    traj = [(t, Y)]
    for _ in range(n):
        k1 = F(t, Y)
        k2 = F(t + h / 2, soma(Y, k1, h / 2))
        k3 = F(t + h / 2, soma(Y, k2, h / 2))
        k4 = F(t + h, soma(Y, k3, h))
        Y = [y + h / 6 * (a + 2 * b + 2 * c + d) for y, a, b, c, d in zip(Y, k1, k2, k3, k4)]
        t += h
        traj.append((t, Y))
    return traj


def oscilador(m, c, k, F0=0.0, w=0.0, y0=1.0, v0=0.0, T=10.0, n=4000):
    F = lambda t, Y: [Y[1], (F0 * math.cos(w * t) - c * Y[1] - k * Y[0]) / m]
    return rk4_sistema(F, 0.0, [y0, v0], T, n)


def homogenea(m, c, k, y0, v0):
    """Solução exata de m y'' + c y' + k y = 0 pelas raízes características."""
    disc = c * c - 4 * m * k
    if disc > 0:
        r1, r2 = (-c + math.sqrt(disc)) / (2 * m), (-c - math.sqrt(disc)) / (2 * m)
        B = (v0 - r1 * y0) / (r2 - r1)
        return lambda t: (y0 - B) * math.exp(r1 * t) + B * math.exp(r2 * t)
    if disc == 0:
        r = -c / (2 * m)
        return lambda t: (y0 + (v0 - r * y0) * t) * math.exp(r * t)
    a, b = -c / (2 * m), math.sqrt(-disc) / (2 * m)
    return lambda t: math.exp(a * t) * (y0 * math.cos(b * t) + (v0 - a * y0) / b * math.sin(b * t))


def amplitude(m, c, k, F0, w):
    return F0 / math.hypot(k - m * w * w, c * w)


def classifica(A):
    (a, b), (c, d) = A
    tr, det = a + d, a * d - b * c
    disc = tr * tr - 4 * det
    if det < 0:
        return "sela"
    if det == 0:
        return "degenerado"
    if tr == 0:
        return "centro"
    est = "estável" if tr < 0 else "instável"
    if disc < 0:
        return f"espiral {est}"
    if disc == 0:
        return f"nó degenerado {est}"
    return f"nó {est}"


def autovalores(A):
    (a, b), (c, d) = A
    tr, det = a + d, a * d - b * c
    s = cmath.sqrt(tr * tr - 4 * det)
    return (tr + s) / 2, (tr - s) / 2


# ---------- Laplace numérica ----------

def laplace(f, s, T=60.0, n=60000):
    """∫₀^T f(t) e^{-st} dt pela regra de Simpson (T grande o bastante para s > 0)."""
    h = T / n
    soma = f(0) + f(T) * math.exp(-s * T)
    for i in range(1, n):
        soma += (4 if i % 2 else 2) * f(i * h) * math.exp(-s * i * h)
    return soma * h / 3


if __name__ == "__main__":
    # Ordens de convergência em y' = t − y, y(0) = 2, exata y = t − 1 + 3e^{−t}
    f = lambda t, y: t - y
    exata = lambda t: t - 1 + 3 * math.exp(-t)
    for nome, passo, ordem in [("Euler", euler, 1), ("Heun", heun, 2), ("RK4", rk4, 4)]:
        p = ordem_observada(f, exata, 0, 2, 2, passo)
        assert abs(p - ordem) < 0.15, (nome, p)
        print(f"{nome:5}: ordem observada {p:.3f} (teórica {ordem})")

    # Logística: y(t) = 1 / (1 + 9 e^{−t}) com y(0) = 0,1
    log = lambda t, y: y * (1 - y)
    assert abs(resolve(log, 0, 0.1, 5, 200) - 1 / (1 + 9 * math.exp(-5))) < 1e-9

    # Oscilador livre nos três regimes: RK4 contra a fórmula fechada
    for m, c, k, regime in [(1, 0.5, 4, "subamortecido"), (1, 4, 4, "crítico"), (1, 5, 4, "superamortecido"), (2, 0, 8, "sem atrito")]:
        y = homogenea(m, c, k, 1.0, 0.5)
        erro = max(abs(Y[0] - y(t)) for t, Y in oscilador(m, c, k, y0=1.0, v0=0.5))
        assert erro < 1e-8, (regime, erro)
        print(f"oscilador {regime:16}: erro máximo do RK4 = {erro:.1e}")

    # Forçado: o regime permanente tem a amplitude da fórmula
    traj = oscilador(1, 0.5, 4, F0=1, w=1.5, y0=0, v0=0, T=80, n=16000)
    num = max(abs(Y[0]) for t, Y in traj if t > 60)
    assert abs(num - amplitude(1, 0.5, 4, 1, 1.5)) < 1e-3
    print(f"forçado: amplitude permanente {num:.4f} = F0/√((k−mω²)² + (cω)²) = {amplitude(1, 0.5, 4, 1, 1.5):.4f}")

    # Ressonância sem atrito: y'' + 4y = cos 2t, y = (t/4) sen 2t
    traj = oscilador(1, 0, 4, F0=1, w=2, y0=0, v0=0, T=20, n=8000)
    assert max(abs(Y[0] - t / 4 * math.sin(2 * t)) for t, Y in traj) < 1e-8
    print("ressonância: y'' + 4y = cos 2t tem y = (t/4) sen 2t, que cresce sem limite")

    # Plano de fase
    casos = {((1, 1), (4, 1)): "sela", ((-3, 1), (1, -3)): "nó estável", ((-0.5, -2), (2, -0.5)): "espiral estável",
             ((0, 1), (-4, 0)): "centro", ((-2, 1), (0, -2)): "nó degenerado estável", ((0.3, -1), (1, 0.3)): "espiral instável"}
    for A, esperado in casos.items():
        assert classifica(A) == esperado, (A, classifica(A))
    print("classificação:", ", ".join(f"{classifica(A)} {tuple(round(l.real, 2) + round(l.imag, 2) * 1j for l in autovalores(A))}" for A in casos))

    # Laplace: L{e^{at}} = 1/(s − a), L{sen bt} = b/(s² + b²), L{t} = 1/s²
    s = 2.0
    assert abs(laplace(lambda t: math.exp(-t), s) - 1 / (s + 1)) < 1e-8
    assert abs(laplace(lambda t: math.sin(3 * t), s) - 3 / (s * s + 9)) < 1e-8
    assert abs(laplace(lambda t: t, s) - 1 / s ** 2) < 1e-8
    # y'' + 3y' + 2y = 0, y(0) = 1, y'(0) = 0  →  Y(s) = (s + 3)/((s + 1)(s + 2)) = 2/(s+1) − 1/(s+2)
    y = homogenea(1, 3, 2, 1, 0)
    assert all(abs(y(t) - (2 * math.exp(-t) - math.exp(-2 * t))) < 1e-12 for t in [0, 0.5, 1, 3])
    assert abs(laplace(y, s) - (s + 3) / ((s + 1) * (s + 2))) < 1e-8
    print("Laplace: tabela conferida por integração numérica; y'' + 3y' + 2y = 0 → y = 2e^{-t} − e^{-2t}")
