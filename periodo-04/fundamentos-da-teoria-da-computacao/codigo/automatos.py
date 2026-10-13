"""Autômatos e computabilidade em Python puro.

Execute:  python3 automatos.py

- AFN com ε → AFD (construção de subconjuntos) → AFD mínimo (Moore)
- expressão regular → AFN (Thompson), conferida contra o módulo `re`
- autômato de pilha para aⁿbⁿ, conferido contra a definição
- máquina de Turing para aⁿbⁿcⁿ e o algoritmo CYK para gramáticas na forma normal de Chomsky
"""
import itertools
import re

EPS = ""


# ---------- AFN, AFD e minimização ----------

def fecho(delta, estados):
    pilha, vistos = list(estados), set(estados)
    while pilha:
        for r in delta.get((pilha.pop(), EPS), ()):
            if r not in vistos:
                vistos.add(r)
                pilha.append(r)
    return frozenset(vistos)


def afn_aceita(afn, w):
    inicial, finais, delta = afn
    atuais = fecho(delta, {inicial})
    for a in w:
        atuais = fecho(delta, {r for q in atuais for r in delta.get((q, a), ())})
    return bool(atuais & finais)


def subconjuntos(afn, alfabeto):
    inicial, finais, delta = afn
    q0 = fecho(delta, {inicial})
    estados, fila, d = {q0}, [q0], {}
    while fila:
        S = fila.pop()
        for a in alfabeto:
            T = fecho(delta, {r for q in S for r in delta.get((q, a), ())})
            d[S, a] = T
            if T not in estados:
                estados.add(T)
                fila.append(T)
    return estados, q0, {S for S in estados if S & finais}, d


def minimiza(estados, q0, finais, d, alfabeto):
    """Refinamento de partições: devolve o número de estados do AFD mínimo."""
    alcancaveis, pilha = {q0}, [q0]
    while pilha:
        q = pilha.pop()
        for a in alfabeto:
            if d[q, a] not in alcancaveis:
                alcancaveis.add(d[q, a])
                pilha.append(d[q, a])
    P = [b for b in (finais & alcancaveis, alcancaveis - finais) if b]
    while True:
        bloco = {q: i for i, b in enumerate(P) for q in b}
        novo = []
        for b in P:
            grupos = {}
            for q in b:
                grupos.setdefault(tuple(bloco[d[q, a]] for a in alfabeto), set()).add(q)
            novo += grupos.values()
        if len(novo) == len(P):
            return len(P)
        P = novo


# ---------- Thompson ----------

def thompson(expr):
    """Expressão com |, *, +, ?, parênteses → AFN (inicial, {final}, delta)."""
    delta, cont = {}, itertools.count()
    pos = 0

    def aresta(a, b, c=EPS):
        delta.setdefault((a, c), set()).add(b)

    def uniao():
        nonlocal pos
        ini, fim = concat()
        while pos < len(expr) and expr[pos] == "|":
            pos += 1
            i2, f2 = concat()
            s, t = next(cont), next(cont)
            aresta(s, ini); aresta(s, i2); aresta(fim, t); aresta(f2, t)
            ini, fim = s, t
        return ini, fim

    def concat():
        ini = fim = None
        while pos < len(expr) and expr[pos] not in "|)":
            i2, f2 = repeticao()
            if ini is None:
                ini, fim = i2, f2
            else:
                aresta(fim, i2)
                fim = f2
        if ini is None:
            ini = fim = next(cont)
        return ini, fim

    def repeticao():
        nonlocal pos
        ini, fim = atomo()
        while pos < len(expr) and expr[pos] in "*+?":
            op = expr[pos]; pos += 1
            s, t = next(cont), next(cont)
            aresta(s, ini); aresta(fim, t)
            if op != "?": aresta(fim, ini)
            if op != "+": aresta(s, t)
            ini, fim = s, t
        return ini, fim

    def atomo():
        nonlocal pos
        c = expr[pos]; pos += 1
        if c == "(":
            r = uniao()
            pos += 1          # ")"
            return r
        a, b = next(cont), next(cont)
        aresta(a, b, c)
        return a, b

    ini, fim = uniao()
    return ini, frozenset({fim}), delta


# ---------- Autômato de pilha, máquina de Turing e CYK ----------

def pilha_anbn(w):
    """AP determinístico: empilha A para cada a, desempilha para cada b."""
    pilha, fase = ["$"], 0
    for c in w:
        if c == "a" and fase == 0:
            pilha.append("A")
        elif c == "b" and pilha[-1] == "A":
            pilha.pop(); fase = 1
        else:
            return False
    return pilha == ["$"]


def turing(delta, inicial, aceita, w, limite=10_000):
    fita, cab, q = dict(enumerate(w)), 0, inicial
    for _ in range(limite):
        if q == aceita:
            return True
        t = delta.get((q, fita.get(cab, "_")))
        if t is None:
            return False
        q, fita[cab], mov = t
        cab += 1 if mov == "D" else -1
    raise RuntimeError("não parou dentro do limite")


ANBNCN = {
    ("q0", "a"): ("q1", "X", "D"), ("q0", "Y"): ("q4", "Y", "D"), ("q0", "_"): ("ok", "_", "D"),
    ("q1", "a"): ("q1", "a", "D"), ("q1", "Y"): ("q1", "Y", "D"), ("q1", "b"): ("q2", "Y", "D"),
    ("q2", "b"): ("q2", "b", "D"), ("q2", "Z"): ("q2", "Z", "D"), ("q2", "c"): ("q3", "Z", "E"),
    **{("q3", s): ("q3", s, "E") for s in "abYZ"}, ("q3", "X"): ("q0", "X", "D"),
    ("q4", "Y"): ("q4", "Y", "D"), ("q4", "Z"): ("q4", "Z", "D"), ("q4", "_"): ("ok", "_", "D"),
}


def cyk(gramatica, inicial, w):
    """Gramática na FNC: {A: [("B", "C"), ("a",)]}. Programação dinâmica O(n³)."""
    n = len(w)
    if n == 0:
        return False
    T = [[set() for _ in range(n)] for _ in range(n)]   # T[i][j]: variáveis que geram w[i..j]
    for i, c in enumerate(w):
        T[i][i] = {A for A, regras in gramatica.items() if (c,) in regras}
    for tam in range(2, n + 1):
        for i in range(n - tam + 1):
            j = i + tam - 1
            for k in range(i, j):
                for A, regras in gramatica.items():
                    for r in regras:
                        if len(r) == 2 and r[0] in T[i][k] and r[1] in T[k + 1][j]:
                            T[i][j].add(A)
    return inicial in T[0][n - 1]


def palavras(alfabeto, ate):
    for n in range(ate + 1):
        for t in itertools.product(alfabeto, repeat=n):
            yield "".join(t)


if __name__ == "__main__":
    # AFN "terceiro símbolo do fim é 1": o AFD mínimo tem 2³ = 8 estados
    d = {("q0", "0"): {"q0"}, ("q0", "1"): {"q0", "q1"}, ("q1", "0"): {"q2"}, ("q1", "1"): {"q2"},
         ("q2", "0"): {"q3"}, ("q2", "1"): {"q3"}}
    afn = ("q0", frozenset({"q3"}), d)
    afd = subconjuntos(afn, "01")
    for w in palavras("01", 8):
        assert afn_aceita(afn, w) == (len(w) >= 3 and w[-3] == "1")
    print(f"3º do fim é 1: AFD com {len(afd[0])} estados, mínimo {minimiza(*afd, '01')}")
    assert minimiza(*afd, "01") == 8

    # Thompson × módulo re em todas as palavras curtas
    for expr in ["(a|b)*abb", "a*b*", "(ab|c)+", "a?b", "((a|b)(a|b))*", "(a|bc)*c?"]:
        n = thompson(expr)
        for w in palavras("abc", 6):
            assert afn_aceita(n, w) == bool(re.fullmatch(expr, w)), (expr, w)
        estados, q0, finais, dd = subconjuntos(n, "abc")
        print(f"{expr:16} AFN → AFD com {len(estados)} estados → mínimo com {minimiza(estados, q0, finais, dd, 'abc')} (alfabeto abc, contando o estado morto)")
    assert minimiza(*subconjuntos(thompson("(a|b)*abb"), "ab"), "ab") == 4   # o AFD clássico do livro do dragão

    for w in palavras("ab", 10):
        k = len(w) // 2
        assert pilha_anbn(w) == (w == "a" * k + "b" * k)
    for w in palavras("abc", 7):
        k = len(w) // 3
        assert turing(ANBNCN, "q0", "ok", w) == (w == "a" * k + "b" * k + "c" * k)
    print("Autômato de pilha (aⁿbⁿ) e máquina de Turing (aⁿbⁿcⁿ) conferidos em todas as palavras curtas")

    # CYK: parênteses balanceados na FNC  (S → SS | LR | LB,  B → SR,  L → (,  R → ))
    G = {"S": [("S", "S"), ("L", "R"), ("L", "B")], "B": [("S", "R")], "L": [("(",)], "R": [(")",)]}
    def balanceado(w):
        nivel = 0
        for c in w:
            nivel += 1 if c == "(" else -1
            if nivel < 0:
                return False
        return nivel == 0
    for w in palavras("()", 10):
        if w:
            assert cyk(G, "S", w) == balanceado(w), w
    print("CYK reconhece parênteses balanceados")
    print("Todos os testes passaram.")
