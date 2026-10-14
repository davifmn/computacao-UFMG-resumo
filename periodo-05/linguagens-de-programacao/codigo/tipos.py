"""Inferência de tipos de Hindley-Milner (algoritmo W) para um mini-ML com
fn, aplicação, let polimórfico, let rec, if, inteiros, booleanos, pares e listas.

Execute:  python3 tipos.py
"""
import re
from itertools import count


class ErroDeTipo(Exception):
    pass


# Tipos: ("var", n) ou (construtor, arg1, arg2, ...) com construtor em int, bool, ->, list, *
INT, BOOL = ("int",), ("bool",)


def seta(a, b):
    return ("->", a, b)


def lista(a):
    return ("list", a)


# ---------- Parser (mesma gramática da visualização) ----------

def tokens(src):
    return re.findall(r"=>|::|\[\]|[()+\-*<=,]|\d+|[A-Za-z_][A-Za-z0-9_']*", src)


def parse(src):
    toks, pos = tokens(src), 0

    def peek():
        return toks[pos] if pos < len(toks) else None

    def eat(t=None):
        nonlocal pos
        tok = toks[pos]
        assert t is None or tok == t, f"esperava {t}, achou {tok}"
        pos += 1
        return tok

    def expr():
        if peek() == "fn":
            eat(); x = eat(); eat("=>")
            return ("fn", x, expr())
        if peek() == "let":
            eat()
            rec = peek() == "rec"
            if rec:
                eat()
            x = eat(); eat("=")
            e1 = expr(); eat("in")
            return ("letrec" if rec else "let", x, e1, expr())
        if peek() == "if":
            eat(); c = expr(); eat("then"); a = expr(); eat("else")
            return ("if", c, a, expr())
        return cons()

    def cons():
        l = cmp()
        if peek() == "::":
            eat()
            return ("cons", l, cons())
        return l

    def binario(prox, ops):
        def f():
            l = prox()
            while peek() in ops:
                op = eat()
                l = ("op", op, l, prox())
            return l
        return f

    def comeca_atomo():
        t = peek()
        return t is not None and (t.isdigit() or t in ("(", "[]") or (re.match(r"[A-Za-z_]", t) and t not in ("in", "then", "else", "fn", "let", "if")))

    def app():
        f = atomo()
        while comeca_atomo():
            f = ("app", f, atomo())
        return f

    def atomo():
        t = eat()
        if t.isdigit():
            return ("num", int(t))
        if t in ("true", "false"):
            return ("bool", t == "true")
        if t == "[]":
            return ("nil",)
        if t == "(":
            e = expr()
            if peek() == ",":
                eat()
                e2 = expr(); eat(")")
                return ("pair", e, e2)
            eat(")")
            return e
        return ("var", t)

    mul = binario(app, ("*",))
    add = binario(mul, ("+", "-"))
    cmp = binario(add, ("<", "="))
    e = expr()
    assert pos == len(toks), f"sobrou {toks[pos:]}"
    return e


# ---------- Algoritmo W ----------

def inferir(src):
    novo = count()
    S = {}

    def var():
        return ("var", next(novo))

    def resolve(t):
        if t[0] == "var":
            return resolve(S[t[1]]) if t[1] in S else t
        return (t[0],) + tuple(resolve(a) for a in t[1:])

    def ocorre(n, t):
        t = resolve(t)
        return t == ("var", n) if t[0] == "var" else any(ocorre(n, a) for a in t[1:])

    def unifica(a, b):
        a, b = resolve(a), resolve(b)
        if a == b:
            return
        if a[0] == "var" or b[0] == "var":
            v, t = (a, b) if a[0] == "var" else (b, a)
            if ocorre(v[1], t):
                raise ErroDeTipo("tipo infinito (occurs check)")
            S[v[1]] = t
            return
        if a[0] != b[0] or len(a) != len(b):
            raise ErroDeTipo(f"{mostra(a)} ≠ {mostra(b)}")
        for x, y in zip(a[1:], b[1:]):
            unifica(x, y)

    def livres(t):
        t = resolve(t)
        return {t[1]} if t[0] == "var" else set().union(*[livres(a) for a in t[1:]])

    def generaliza(env, t):
        no_env = set()
        for vs, s in env.values():
            no_env |= livres(s) - vs
        return (livres(t) - no_env, resolve(t))

    def instancia(esq):
        vs, t = esq
        m = {v: var() for v in vs}

        def go(t):
            t = resolve(t)
            if t[0] == "var":
                return m.get(t[1], t)
            return (t[0],) + tuple(go(a) for a in t[1:])
        return go(t)

    def mono(t):
        return (set(), t)

    def W(env, e):
        k = e[0]
        if k == "num":
            return INT
        if k == "bool":
            return BOOL
        if k == "nil":
            return lista(var())
        if k == "var":
            if e[1] not in env:
                raise ErroDeTipo(f"{e[1]} não definido")
            return instancia(env[e[1]])
        if k == "fn":
            a = var()
            return seta(a, W({**env, e[1]: mono(a)}, e[2]))
        if k == "app":
            tf, ta, r = W(env, e[1]), W(env, e[2]), var()
            unifica(tf, seta(ta, r))
            return r
        if k == "let":
            t1 = W(env, e[2])
            return W({**env, e[1]: generaliza(env, t1)}, e[3])
        if k == "letrec":
            a = var()
            t1 = W({**env, e[1]: mono(a)}, e[2])
            unifica(a, t1)
            return W({**env, e[1]: generaliza(env, t1)}, e[3])
        if k == "if":
            unifica(W(env, e[1]), BOOL)
            ta, tb = W(env, e[2]), W(env, e[3])
            unifica(ta, tb)
            return ta
        if k == "op":
            tl, tr = W(env, e[2]), W(env, e[3])
            if e[1] == "=":
                unifica(tl, tr)
                return BOOL
            unifica(tl, INT)
            unifica(tr, INT)
            return BOOL if e[1] == "<" else INT
        if k == "cons":
            tl, tr = W(env, e[1]), W(env, e[2])
            unifica(tr, lista(tl))
            return tr
        if k == "pair":
            return ("*", W(env, e[1]), W(env, e[2]))
        raise ValueError(k)

    a, b = var(), var()
    prim = {
        "hd": ({a[1]}, seta(lista(a), a)), "tl": ({a[1]}, seta(lista(a), lista(a))),
        "null": ({a[1]}, seta(lista(a), BOOL)),
        "fst": ({a[1], b[1]}, seta(("*", a, b), a)), "snd": ({a[1], b[1]}, seta(("*", a, b), b)),
    }
    return mostra(resolve(W(prim, parse(src))))


def mostra(t, nomes=None):
    nomes = {} if nomes is None else nomes

    def go(t, prec):
        if t[0] == "var":
            if t[1] not in nomes:
                nomes[t[1]] = "'" + chr(97 + len(nomes))
            return nomes[t[1]]
        if t[0] == "->":
            s = f"{go(t[1], 2)} -> {go(t[2], 1)}"
            return f"({s})" if prec > 1 else s
        if t[0] == "*":
            s = f"{go(t[1], 3)} * {go(t[2], 3)}"
            return f"({s})" if prec > 2 else s
        if t[0] == "list":
            return f"{go(t[1], 4)} list"
        return t[0]
    return go(t, 0)


CASOS = {
    "let id = fn x => x in (id 3, id true)": "int * bool",
    "fn f => fn g => fn x => f (g x)": "('a -> 'b) -> ('c -> 'a) -> 'c -> 'b",
    "let rec map = fn f => fn l => if null l then [] else f (hd l) :: map f (tl l) in map": "('a -> 'b) -> 'a list -> 'b list",
    "let rec soma = fn l => if null l then 0 else hd l + soma (tl l) in soma": "int list -> int",
    "let twice = fn f => fn x => f (f x) in twice (fn n => n * 2) 5": "int",
    "fn x => fn y => x": "'a -> 'b -> 'a",
    "fn p => (snd p, fst p)": "'a * 'b -> 'b * 'a",
    "let rec len = fn l => if null l then 0 else 1 + len (tl l) in (len [], len (true :: []))": "int * int",
    "fn x => x x": None,
    "fn b => if b then 1 else false": None,
    "(fn id => (id 3, id true)) (fn x => x)": None,   # parâmetro de fn é monomórfico
}

if __name__ == "__main__":
    for src, esperado in CASOS.items():
        try:
            obtido = inferir(src)
        except ErroDeTipo as e:
            obtido = None
            motivo = str(e)
        assert obtido == esperado, (src, obtido, esperado)
        print(f"{src[:60]:60}  :  {obtido if obtido else 'erro de tipo (' + motivo + ')'}")
