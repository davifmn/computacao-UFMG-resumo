"""Cálculo lambda não tipado: substituição sem captura, redução em ordem normal
e aplicativa, codificações de Church e o combinador Y.

Execute:  python3 lambda_calculo.py
"""
from dataclasses import dataclass
import re


@dataclass(frozen=True)
class Var:
    nome: str


@dataclass(frozen=True)
class Lam:
    v: str
    corpo: object


@dataclass(frozen=True)
class App:
    f: object
    a: object


# ---------- Parser: λx.e (ou \x.e), aplicação à esquerda, parênteses ----------

def parse(src, defs=None):
    defs = defs or {}
    toks = re.findall(r"λ|\\|\.|\(|\)|[A-Za-z_][A-Za-z0-9_']*|\d+", src)
    pos = 0

    def peek():
        return toks[pos] if pos < len(toks) else None

    def termo():
        nonlocal pos
        if peek() in ("λ", "\\"):
            pos += 1
            vs = []
            while peek() not in (".", None):
                vs.append(toks[pos])
                pos += 1
            pos += 1  # '.'
            corpo = termo()
            for v in reversed(vs):
                corpo = Lam(v, corpo)
            return corpo
        f = atomo()
        while peek() not in (None, ")"):
            f = App(f, termo() if peek() in ("λ", "\\") else atomo())
        return f

    def atomo():
        nonlocal pos
        t = toks[pos]
        pos += 1
        if t == "(":
            e = termo()
            pos += 1  # ')'
            return e
        if t.isdigit():
            return numeral(int(t))
        if t in defs:
            return defs[t]
        return Var(t)

    e = termo()
    assert pos == len(toks), f"sobrou {toks[pos:]}"
    return e


def numeral(n):
    corpo = Var("x")
    for _ in range(n):
        corpo = App(Var("f"), corpo)
    return Lam("f", Lam("x", corpo))


def livres(t):
    if isinstance(t, Var):
        return {t.nome}
    if isinstance(t, App):
        return livres(t.f) | livres(t.a)
    return livres(t.corpo) - {t.v}


def subst(t, x, s):
    """t[x := s] sem capturar as variáveis livres de s."""
    if isinstance(t, Var):
        return s if t.nome == x else t
    if isinstance(t, App):
        return App(subst(t.f, x, s), subst(t.a, x, s))
    if t.v == x:
        return t
    if t.v in livres(s) and x in livres(t.corpo):
        novo = t.v + "'"
        while novo in livres(s) | livres(t.corpo):
            novo += "'"
        return Lam(novo, subst(subst(t.corpo, t.v, Var(novo)), x, s))
    return Lam(t.v, subst(t.corpo, x, s))


def passo_normal(t):
    """Um passo em ordem normal (redex mais à esquerda, mais externo) ou None."""
    if isinstance(t, App):
        if isinstance(t.f, Lam):
            return subst(t.f.corpo, t.f.v, t.a)
        r = passo_normal(t.f)
        if r is not None:
            return App(r, t.a)
        r = passo_normal(t.a)
        return None if r is None else App(t.f, r)
    if isinstance(t, Lam):
        r = passo_normal(t.corpo)
        return None if r is None else Lam(t.v, r)
    return None


def passo_aplicativo(t):
    """Um passo em ordem aplicativa (mais à esquerda, mais interno) ou None."""
    if isinstance(t, App):
        r = passo_aplicativo(t.f)
        if r is not None:
            return App(r, t.a)
        r = passo_aplicativo(t.a)
        if r is not None:
            return App(t.f, r)
        if isinstance(t.f, Lam):
            return subst(t.f.corpo, t.f.v, t.a)
        return None
    if isinstance(t, Lam):
        r = passo_aplicativo(t.corpo)
        return None if r is None else Lam(t.v, r)
    return None


def normaliza(t, passo=passo_normal, limite=5000):
    for n in range(limite):
        r = passo(t)
        if r is None:
            return t, n
        t = r
    return None, limite


def inteiro(t):
    """Numeral de Church → int (ou None)."""
    if not (isinstance(t, Lam) and isinstance(t.corpo, Lam)):
        return None
    f, x, c, n = t.v, t.corpo.v, t.corpo.corpo, 0
    while f != x and isinstance(c, App) and c.f == Var(f):   # se f == x, o x de dentro esconde o f
        c, n = c.a, n + 1
    return n if c == Var(x) else None


def mostra(t):
    if isinstance(t, Var):
        return t.nome
    if isinstance(t, Lam):
        return f"λ{t.v}.{mostra(t.corpo)}"
    f = f"({mostra(t.f)})" if isinstance(t.f, Lam) else mostra(t.f)
    a = f"({mostra(t.a)})" if isinstance(t.a, (App, Lam)) else mostra(t.a)
    return f"{f} {a}"


DEFS = {}
for nome, src in [
    ("TRUE", "λt.λf.t"), ("FALSE", "λt.λf.f"), ("IF", "λb.λt.λe.b t e"),
    ("NOT", "λp.p FALSE TRUE"), ("AND", "λp.λq.p q p"), ("OR", "λp.λq.p p q"),
    ("SUCC", "λn.λf.λx.f (n f x)"), ("PLUS", "λm.λn.λf.λx.m f (n f x)"),
    ("MULT", "λm.λn.λf.m (n f)"), ("POW", "λb.λe.e b"),
    ("PRED", "λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)"), ("SUB", "λm.λn.n PRED m"),
    ("ISZERO", "λn.n (λx.FALSE) TRUE"), ("Y", "λf.(λx.f (x x)) (λx.f (x x))"),
    ("OMEGA", "(λx.x x) (λx.x x)"), ("K", "λx.λy.x"), ("I", "λx.x"),
    ("FACT", "Y (λr.λn.IF (ISZERO n) 1 (MULT n (r (PRED n))))"),
]:
    DEFS[nome] = parse(src, DEFS)


def avalia(src, passo=passo_normal, limite=5000):
    return normaliza(parse(src, DEFS), passo, limite)


if __name__ == "__main__":
    for a in range(5):
        for b in range(5):
            assert inteiro(avalia(f"PLUS {a} {b}")[0]) == a + b
            assert inteiro(avalia(f"MULT {a} {b}")[0]) == a * b
            assert inteiro(avalia(f"SUB {a} {b}")[0]) == max(0, a - b)
            if b > 0:  # POW a 0 = λx.x, que é 1 só a menos de η
                assert inteiro(avalia(f"POW {a} {b}")[0]) == a ** b
    print("aritmética de Church: PLUS, MULT, SUB, POW conferidos para 0..4 (POW com expoente ≥ 1)")

    verdade = avalia("TRUE")[0]
    assert avalia("AND TRUE (NOT FALSE)")[0] == verdade
    assert avalia("ISZERO 0")[0] == verdade and avalia("ISZERO 3")[0] == avalia("FALSE")[0]

    for n, f in [(0, 1), (1, 1), (2, 2), (3, 6)]:
        t, passos = avalia(f"FACT {n}")
        assert inteiro(t) == f
        print(f"FACT {n} = {f} em {passos} passos de redução (ordem normal, já com as definições expandidas)")

    # Ordem normal acha a forma normal quando ela existe; a aplicativa pode não terminar
    t, _ = avalia("K I OMEGA")
    assert mostra(t) == "λx.x"
    assert avalia("K I OMEGA", passo_aplicativo, 200)[0] is None
    assert avalia("FACT 2", passo_aplicativo, 60)[0] is None   # Y em ordem aplicativa diverge (o termo só cresce)
    print("K I Ω: ordem normal → λx.x; ordem aplicativa não termina (o mesmo com Y)")

    # Substituição sem captura
    assert mostra(normaliza(parse("(λx.λy.x y) y"))[0]) == "λy'.y y'"
    print("captura evitada: (λx.λy.x y) y → λy'.y y'")
