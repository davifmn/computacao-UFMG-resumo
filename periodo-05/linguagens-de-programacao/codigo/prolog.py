"""Mini-Prolog: unificação com occurs check e resolução SLD em profundidade
(com retrocesso), implementada com geradores do Python.

Execute:  python3 prolog.py
"""
import re
from itertools import count

# Termos: ("var", nome) | ("num", n) | (functor, arg1, ...)  — átomos são (functor,)
NIL = ("[]",)
OPS = ("=", "\\=", "is", "<", ">", "=<", ">=")


def cons(h, t):
    return (".", h, t)


# ---------- Parser ----------

def tokens(src):
    src = re.sub(r"%[^\n]*", "", src)
    return re.findall(r":-|\\=|=<|>=|[()\[\]|,.=<>+\-*]|\d+|[A-Za-z_][A-Za-z0-9_]*", src)


class Parser:
    def __init__(self, src):
        self.t, self.i = tokens(src), 0

    def peek(self):
        return self.t[self.i] if self.i < len(self.t) else None

    def eat(self, v=None):
        tok = self.t[self.i]
        assert v is None or tok == v, f"esperava {v}, achou {tok}"
        self.i += 1
        return tok

    def t700(self):
        l = self.t500()
        if self.peek() in OPS:
            return (self.eat(), l, self.t500())
        return l

    def t500(self):
        l = self.t400()
        while self.peek() in ("+", "-"):
            l = (self.eat(), l, self.t400())
        return l

    def t400(self):
        l = self.prim()
        while self.peek() == "*":
            self.eat()
            l = ("*", l, self.prim())
        return l

    def prim(self):
        tok = self.eat()
        if tok.isdigit():
            return ("num", int(tok))
        if tok[0].isupper() or tok[0] == "_":
            return ("var", tok)
        if tok == "(":
            e = self.t700()
            self.eat(")")
            return e
        if tok == "[":
            if self.peek() == "]":
                self.eat()
                return NIL
            itens = [self.t700()]
            while self.peek() == ",":
                self.eat()
                itens.append(self.t700())
            cauda = NIL
            if self.peek() == "|":
                self.eat()
                cauda = self.t700()
            self.eat("]")
            for h in reversed(itens):
                cauda = cons(h, cauda)
            return cauda
        if self.peek() == "(":
            self.eat()
            args = [self.t700()]
            while self.peek() == ",":
                self.eat()
                args.append(self.t700())
            self.eat(")")
            return (tok, *args)
        return (tok,)

    def corpo(self):
        gs = [self.t700()]
        while self.peek() == ",":
            self.eat()
            gs.append(self.t700())
        return gs


def programa(src):
    p, cls = Parser(src), []
    while p.peek() is not None:
        cab = p.t700()
        corpo = []
        if p.peek() == ":-":
            p.eat()
            corpo = p.corpo()
        p.eat(".")
        cls.append((cab, corpo))
    return cls


# ---------- Unificação ----------

def anda(t, s):
    while t[0] == "var" and t[1] in s:
        t = s[t[1]]
    return t


def resolve(t, s):
    t = anda(t, s)
    if t[0] in ("var", "num") or len(t) == 1:
        return t
    return (t[0],) + tuple(resolve(a, s) for a in t[1:])


def ocorre(v, t, s):
    t = anda(t, s)
    if t[0] == "var":
        return t[1] == v
    return t[0] != "num" and any(ocorre(v, a, s) for a in t[1:])


def unifica(a, b, s):
    a, b = anda(a, s), anda(b, s)
    if a == b:
        return s
    if a[0] == "var" or b[0] == "var":
        v, t = (a, b) if a[0] == "var" else (b, a)
        if ocorre(v[1], t, s):
            return None
        return {**s, v[1]: t}
    if a[0] == "num" or b[0] == "num" or a[0] != b[0] or len(a) != len(b):
        return None
    for x, y in zip(a[1:], b[1:]):
        s = unifica(x, y, s)
        if s is None:
            return None
    return s


def renomeia(t, suf):
    if t[0] == "var":
        return ("var", t[1] + suf)
    if t[0] == "num" or len(t) == 1:
        return t
    return (t[0],) + tuple(renomeia(a, suf) for a in t[1:])


def aritmetica(t, s):
    t = anda(t, s)
    if t[0] == "num":
        return t[1]
    if t[0] == "var":
        raise ValueError(f"{t[1]} não instanciada")
    x, y = aritmetica(t[1], s), aritmetica(t[2], s)
    return {"+": x + y, "-": x - y, "*": x * y}[t[0]]


# ---------- Resolução SLD ----------

def resolver(prog, objetivos, s=None, prof=0, contador=None, limite=200):
    """Gera cada substituição que satisfaz a lista de objetivos (ordem do Prolog)."""
    s = {} if s is None else s
    contador = contador or count(1)
    if not objetivos:
        yield s
        return
    if prof > limite:
        raise RecursionError("profundidade demais")
    g, resto = resolve(objetivos[0], s), objetivos[1:]
    if g[0] in OPS and len(g) == 3:
        if g[0] == "=":
            s2 = unifica(g[1], g[2], s)
        elif g[0] == "\\=":
            s2 = s if unifica(g[1], g[2], s) is None else None
        elif g[0] == "is":
            s2 = unifica(g[1], ("num", aritmetica(g[2], s)), s)
        else:
            x, y = aritmetica(g[1], s), aritmetica(g[2], s)
            ok = {"<": x < y, ">": x > y, "=<": x <= y, ">=": x >= y}[g[0]]
            s2 = s if ok else None
        if s2 is not None:
            yield from resolver(prog, resto, s2, prof + 1, contador, limite)
        return
    for cab, corpo in prog:
        if cab[0] != g[0] or len(cab) != len(g):
            continue
        suf = f"_{next(contador)}"
        s2 = unifica(g, renomeia(cab, suf), s)
        if s2 is not None:
            yield from resolver(prog, [renomeia(c, suf) for c in corpo] + resto, s2, prof + 1, contador, limite)


def mostra(t):
    if t[0] == "var":
        return t[1]
    if t[0] == "num":
        return str(t[1])
    if t[0] == "." and len(t) == 3:
        itens = []
        while t[0] == "." and len(t) == 3:
            itens.append(mostra(t[1]))
            t = t[2]
        return f"[{', '.join(itens)}]" if t == NIL else f"[{', '.join(itens)} | {mostra(t)}]"
    if len(t) == 1:
        return t[0]
    return f"{t[0]}({', '.join(mostra(a) for a in t[1:])})"


def consulta(src_prog, src_q, variaveis):
    prog = programa(src_prog)
    q = Parser(src_q).corpo()
    return [tuple(mostra(resolve(("var", v), s)) for v in variaveis) for s in resolver(prog, q)]


FAMILIA = """pai(abraao, isaque). pai(isaque, jaco). pai(isaque, esau). pai(jaco, jose).
avo(X, Z) :- pai(X, Y), pai(Y, Z)."""
APPEND = "append([], L, L). append([H|T], L, [H|R]) :- append(T, L, R)."
FAT = "fat(0, 1). fat(N, F) :- N > 0, N1 is N - 1, fat(N1, F1), F is N * F1."
MEMBRO = "membro(X, [X|_]). membro(X, [_|T]) :- membro(X, T). cor(vermelho). cor(azul). cor(verde)."
ESQUERDA = "pai(a, b). pai(b, c). anc(X, Y) :- anc(X, Z), pai(Z, Y). anc(X, Y) :- pai(X, Y)."
DIREITA = "pai(a, b). pai(b, c). anc(X, Y) :- pai(X, Y). anc(X, Y) :- pai(X, Z), anc(Z, Y)."

if __name__ == "__main__":
    assert consulta(FAMILIA, "avo(abraao, Q)", ["Q"]) == [("jaco",), ("esau",)]
    assert consulta(FAMILIA, "avo(A, jose)", ["A"]) == [("isaque",)]
    print("avo(abraao, Q): Q = jaco ; Q = esau")

    divs = consulta(APPEND, "append(X, Y, [1, 2, 3])", ["X", "Y"])
    assert divs == [("[]", "[1, 2, 3]"), ("[1]", "[2, 3]"), ("[1, 2]", "[3]"), ("[1, 2, 3]", "[]")]
    assert consulta(APPEND, "append([1, 2], [3], Z)", ["Z"]) == [("[1, 2, 3]",)]
    print("append(X, Y, [1,2,3]):", "; ".join(f"X = {x}, Y = {y}" for x, y in divs))

    for n, f in [(0, 1), (3, 6), (5, 120)]:
        assert consulta(FAT, f"fat({n}, F)", ["F"]) == [(str(f),)]
    print("fat(5, F): F = 120")

    assert consulta(MEMBRO, "membro(C, [verde, preto, azul]), cor(C)", ["C"]) == [("verde",), ("azul",)]

    # unificação sem occurs check criaria X = f(X); com ele, falha
    assert unifica(("var", "X"), ("f", ("var", "X")), {}) is None

    # A ordem das cláusulas e dos objetivos importa: recursão à esquerda não termina
    assert consulta(DIREITA, "anc(a, c)", []) == [()]
    try:
        consulta(ESQUERDA, "anc(a, c)", [])
        raise AssertionError("deveria divergir")
    except RecursionError:
        print("anc com recursão à esquerda: não termina; com recursão à direita: yes")
