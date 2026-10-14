"""Um compilador pequeno e completo para o mini-C das visualizações:

  léxico (expressões regulares) → gramáticas (FIRST, FOLLOW, LL(1), SLR)
  → parser descendente recursivo → AST → dobramento de constantes
  → código de três endereços → interpretador do código gerado.

Execute:  python3 compilador.py
"""
import random
import re

# =====================================================================
# Léxico
# =====================================================================

TOKENS = [
    ("COMENTARIO", r"//[^\n]*"), ("ESPACO", r"\s+"),
    ("NUM", r"\d+"), ("ID", r"[A-Za-z_]\w*"),
    ("OP", r"<=|>=|==|!=|[<>+\-*/]"), ("ATRIB", r"="), ("PONT", r"[(){};]"),
]
PALAVRAS = {"if", "else", "while", "print", "int", "return"}
LEXER = re.compile("|".join(f"(?P<{n}>{p})" for n, p in TOKENS))


def lexico(fonte):
    """Lista de (tipo, lexema). A ordem das alternativas na regex dá prioridade; <= vem antes de <."""
    out, i = [], 0
    while i < len(fonte):
        m = LEXER.match(fonte, i)
        if not m:
            raise SyntaxError(f"caractere inválido {fonte[i]!r} na posição {i}")
        tipo, lex = m.lastgroup, m.group()
        if tipo == "ID" and lex in PALAVRAS:
            tipo = "PALAVRA"
        if tipo not in ("ESPACO", "COMENTARIO"):
            out.append((tipo, lex))
        i = m.end()
    return out


# =====================================================================
# Gramáticas: FIRST, FOLLOW, LL(1) e SLR
# =====================================================================

EPS = "ε"


def le_gramatica(texto):
    prods = []
    for linha in texto.strip().splitlines():
        lhs, rhs = linha.split("->")
        for alt in rhs.split("|"):
            prods.append((lhs.strip(), tuple(s for s in alt.split() if s != EPS)))
    nts = list(dict.fromkeys(p[0] for p in prods))
    return prods, nts


def first(prods, nts):
    F = {A: set() for A in nts}
    mudou = True
    while mudou:
        mudou = False
        for A, rhs in prods:
            novo = first_seq(rhs, F, nts)
            if not novo <= F[A]:
                F[A] |= novo
                mudou = True
    return F


def first_seq(seq, F, nts):
    out = set()
    for X in seq:
        if X not in nts:
            return out | {X}
        out |= F[X] - {EPS}
        if EPS not in F[X]:
            return out
    return out | {EPS}


def follow(prods, nts, F):
    FO = {A: set() for A in nts}
    FO[nts[0]].add("$")
    mudou = True
    while mudou:
        mudou = False
        for A, rhs in prods:
            for k, B in enumerate(rhs):
                if B not in nts:
                    continue
                resto = first_seq(rhs[k + 1:], F, nts)
                novo = (resto - {EPS}) | (FO[A] if EPS in resto else set())
                if not novo <= FO[B]:
                    FO[B] |= novo
                    mudou = True
    return FO


def tabela_ll1(prods, nts):
    F = first(prods, nts)
    FO = follow(prods, nts, F)
    M, conflitos = {}, []
    for i, (A, rhs) in enumerate(prods):
        f = first_seq(rhs, F, nts)
        alvos = (f - {EPS}) | (FO[A] if EPS in f else set())
        for a in alvos:
            if (A, a) in M and M[A, a] != i:
                conflitos.append((A, a))
            else:
                M[A, a] = i
    return M, conflitos


def analisa_ll1(prods, nts, M, tokens):
    pilha, toks, i, usadas = ["$", nts[0]], list(tokens) + ["$"], 0, []
    while pilha[-1] != "$":
        X = pilha.pop()
        if X == toks[i]:
            i += 1
        elif X not in nts or (X, toks[i]) not in M:
            return None
        else:
            p = M[X, toks[i]]
            usadas.append(p)
            pilha.extend(reversed(prods[p][1]))
    return usadas if toks[i] == "$" else None


def tabela_slr(prods, nts):
    S2 = nts[0] + "'"
    P = [(S2, (nts[0],))] + prods
    N = [S2] + nts

    def fecho(itens):
        itens = set(itens)
        fila = list(itens)
        while fila:
            p, d = fila.pop()
            if d < len(P[p][1]) and P[p][1][d] in N:
                for q, (A, _) in enumerate(P):
                    if A == P[p][1][d] and (q, 0) not in itens:
                        itens.add((q, 0))
                        fila.append((q, 0))
        return frozenset(itens)

    def desvio(I, X):
        return fecho({(p, d + 1) for p, d in I if d < len(P[p][1]) and P[p][1][d] == X})

    estados = [fecho({(0, 0)})]
    trans = {}
    k = 0
    while k < len(estados):
        I = estados[k]
        for X in {P[p][1][d] for p, d in I if d < len(P[p][1])}:
            J = desvio(I, X)
            if J not in estados:
                estados.append(J)
            trans[k, X] = estados.index(J)
        k += 1
    F = first(prods, nts)
    FO = follow(prods, nts, F)
    ACTION, GOTO, conflitos = {}, {}, []

    def poe(s, a, acao):
        if (s, a) in ACTION and ACTION[s, a] != acao:
            conflitos.append((s, a, ACTION[s, a], acao))
        else:
            ACTION[s, a] = acao

    for (s, X), t in trans.items():
        if X in N:
            GOTO[s, X] = t
        else:
            poe(s, X, ("s", t))
    for s, I in enumerate(estados):
        for p, d in I:
            if d == len(P[p][1]):
                if p == 0:
                    poe(s, "$", ("acc",))
                else:
                    for a in FO[P[p][0]]:
                        poe(s, a, ("r", p))
    return P, estados, ACTION, GOTO, conflitos


def analisa_slr(P, ACTION, GOTO, tokens):
    pilha, toks, i, reducoes = [0], list(tokens) + ["$"], 0, []
    while True:
        acao = ACTION.get((pilha[-1], toks[i]))
        if acao is None:
            return None
        if acao[0] == "s":
            pilha.append(acao[1])
            i += 1
        elif acao[0] == "r":
            A, rhs = P[acao[1]]
            if rhs:
                del pilha[-len(rhs):]
            pilha.append(GOTO[pilha[-1], A])
            reducoes.append(acao[1])
        else:
            return reducoes


# =====================================================================
# Parser, AST, otimização e geração de código
# =====================================================================

class Parser:
    def __init__(self, fonte):
        self.t, self.i = lexico(fonte), 0

    def peek(self):
        return self.t[self.i][1] if self.i < len(self.t) else None

    def eat(self, v=None):
        tipo, lex = self.t[self.i]
        if v is not None and lex != v:
            raise SyntaxError(f"esperava {v!r}, achou {lex!r}")
        self.i += 1
        return tipo, lex

    def programa(self):
        ss = []
        while self.i < len(self.t):
            ss.append(self.comando())
        return ("seq", ss)

    def bloco(self):
        self.eat("{")
        ss = []
        while self.peek() != "}":
            ss.append(self.comando())
        self.eat("}")
        return ("seq", ss)

    def comando(self):
        if self.peek() == "while":
            self.eat(); self.eat("(")
            c = self.condicao(); self.eat(")")
            return ("while", c, self.bloco())
        if self.peek() == "if":
            self.eat(); self.eat("(")
            c = self.condicao(); self.eat(")")
            a = self.bloco()
            b = None
            if self.peek() == "else":
                self.eat()
                b = self.bloco()
            return ("if", c, a, b)
        if self.peek() == "print":
            self.eat()
            e = self.expr(); self.eat(";")
            return ("print", e)
        _, x = self.eat()
        self.eat("=")
        e = self.expr(); self.eat(";")
        return ("atrib", x, e)

    def condicao(self):
        l = self.expr()
        _, op = self.eat()
        return ("rel", op, l, self.expr())

    def expr(self):
        l = self.termo()
        while self.peek() in ("+", "-"):
            _, op = self.eat()
            l = ("bin", op, l, self.termo())
        return l

    def termo(self):
        l = self.fator()
        while self.peek() in ("*", "/"):
            _, op = self.eat()
            l = ("bin", op, l, self.fator())
        return l

    def fator(self):
        tipo, lex = self.eat()
        if lex == "(":
            e = self.expr()
            self.eat(")")
            return e
        if tipo == "NUM":
            return ("num", int(lex))
        return ("var", lex)


OPS = {"+": lambda a, b: a + b, "-": lambda a, b: a - b, "*": lambda a, b: a * b,
       "/": lambda a, b: int(a / b)}
REL = {"<": lambda a, b: a < b, "<=": lambda a, b: a <= b, ">": lambda a, b: a > b,
       ">=": lambda a, b: a >= b, "==": lambda a, b: a == b, "!=": lambda a, b: a != b}
NEG = {"<": ">=", "<=": ">", ">": "<=", ">=": "<", "==": "!=", "!=": "=="}


def dobra(n):
    k = n[0]
    if k == "bin":
        l, r = dobra(n[2]), dobra(n[3])
        if l[0] == r[0] == "num" and not (n[1] == "/" and r[1] == 0):
            return ("num", OPS[n[1]](l[1], r[1]))
        return ("bin", n[1], l, r)
    if k == "rel":
        return ("rel", n[1], dobra(n[2]), dobra(n[3]))
    if k == "seq":
        return ("seq", [dobra(s) for s in n[1]])
    if k == "atrib":
        return ("atrib", n[1], dobra(n[2]))
    if k == "print":
        return ("print", dobra(n[1]))
    if k == "while":
        return ("while", dobra(n[1]), dobra(n[2]))
    if k == "if":
        return ("if", dobra(n[1]), dobra(n[2]), n[3] and dobra(n[3]))
    return n


def gera_tac(ast):
    code, cont = [], {"t": 0, "L": 0}

    def novo(p):
        cont[p] += 1
        return f"{p}{cont[p]}"

    def ex(n):
        if n[0] == "num":
            return str(n[1])
        if n[0] == "var":
            return n[1]
        a, b = ex(n[2]), ex(n[3])
        t = novo("t")
        code.append(f"{t} = {a} {n[1]} {b}")
        return t

    def st(n):
        k = n[0]
        if k == "seq":
            for s in n[1]:
                st(s)
        elif k == "atrib":
            code.append(f"{n[1]} = {ex(n[2])}")
        elif k == "print":
            code.append(f"print {ex(n[1])}")
        elif k == "if":
            l_else = novo("L")
            l_fim = novo("L") if n[3] else l_else
            _, op, l, r = n[1]
            code.append(f"if {ex(l)} {NEG[op]} {ex(r)} goto {l_else}")
            st(n[2])
            if n[3]:
                code.append(f"goto {l_fim}")
                code.append(f"{l_else}:")
                st(n[3])
            code.append(f"{l_fim}:")
        elif k == "while":
            l_topo, l_fim = novo("L"), novo("L")
            code.append(f"{l_topo}:")
            _, op, l, r = n[1]
            code.append(f"if {ex(l)} {NEG[op]} {ex(r)} goto {l_fim}")
            st(n[2])
            code.append(f"goto {l_topo}")
            code.append(f"{l_fim}:")

    st(ast)
    return code


def executa_tac(code, env=None, limite=200000):
    vars_, out = dict(env or {}), []
    rot = {ins[:-1]: k for k, ins in enumerate(code) if ins.endswith(":")}
    val = lambda x: int(x) if re.fullmatch(r"-?\d+", x) else vars_.get(x, 0)
    pc = passos = 0
    while pc < len(code):
        passos += 1
        if passos > limite:
            raise RuntimeError("laço infinito?")
        ins = code[pc]
        pc += 1
        if ins.endswith(":"):
            continue
        p = ins.split()
        if p[0] == "goto":
            pc = rot[p[1]]
        elif p[0] == "if":
            if REL[p[2]](val(p[1]), val(p[3])):
                pc = rot[p[5]]
        elif p[0] == "print":
            out.append(val(p[1]))
        elif len(p) == 5:
            vars_[p[0]] = OPS[p[3]](val(p[2]), val(p[4]))
        else:
            vars_[p[0]] = val(p[2])
    return {k: v for k, v in vars_.items() if not re.fullmatch(r"t\d+", k)}, out


def avalia(ast, env=None):
    vars_, out = dict(env or {}), []

    def ex(n):
        if n[0] == "num":
            return n[1]
        if n[0] == "var":
            return vars_.get(n[1], 0)
        return OPS[n[1]](ex(n[2]), ex(n[3]))

    def st(n):
        k = n[0]
        if k == "seq":
            for s in n[1]:
                st(s)
        elif k == "atrib":
            vars_[n[1]] = ex(n[2])
        elif k == "print":
            out.append(ex(n[1]))
        elif k == "if":
            st(n[2] if REL[n[1][1]](ex(n[1][2]), ex(n[1][3])) else n[3] or ("seq", []))
        elif k == "while":
            while REL[n[1][1]](ex(n[1][2]), ex(n[1][3])):
                st(n[2])

    st(ast)
    return vars_, out


def programa_aleatorio(rnd, prof=0):
    """Gera programas que sempre terminam (laços com contador)."""
    def expr(d=0):
        if d > 2 or rnd.random() < 0.35:
            return rnd.choice([str(rnd.randint(0, 9)), rnd.choice("abcxy")])
        if rnd.random() < 0.3:                       # multiplica só por constante: sem números gigantes
            return f"({expr(d + 1)} * {rnd.randint(0, 3)})"
        return f"({expr(d + 1)} {rnd.choice('+-')} {expr(d + 1)})"
    ss = []
    for _ in range(rnd.randint(2, 5)):
        r = rnd.random()
        if r < 0.5 or prof > 1:
            ss.append(f"{rnd.choice('abcxy')} = {expr()};")
        elif r < 0.7:
            ss.append(f"if ({expr()} {rnd.choice(list(REL))} {expr()}) {{ {programa_aleatorio(rnd, prof + 1)} }} else {{ {programa_aleatorio(rnd, prof + 1)} }}")
        elif r < 0.85:
            v = f"k{prof}"
            ss.append(f"{v} = 0; while ({v} < {rnd.randint(1, 4)}) {{ {programa_aleatorio(rnd, prof + 1)} {v} = {v} + 1; }}")
        else:
            ss.append(f"print {expr()};")
    return " ".join(ss)


if __name__ == "__main__":
    toks = lexico("while (i <= 10) { soma = soma + i; // acumula\n i = i + 1; }")
    assert [t for t, _ in toks][:5] == ["PALAVRA", "PONT", "ID", "OP", "NUM"] and ("OP", "<=") in toks
    assert len(lexico("if(x>=10)y=y+1;")) == 12
    print("léxico: <= e >= são um token só; comentários e espaços somem")

    # Livro do Dragão: gramática de expressões
    prods, nts = le_gramatica("E -> T E'\nE' -> + T E' | ε\nT -> F T'\nT' -> * F T' | ε\nF -> ( E ) | id")
    F = first(prods, nts)
    FO = follow(prods, nts, F)
    assert F["E"] == F["T"] == F["F"] == {"(", "id"}
    assert FO["E"] == FO["E'"] == {")", "$"} and FO["T"] == {"+", ")", "$"} and FO["F"] == {"+", "*", ")", "$"}
    M, conf = tabela_ll1(prods, nts)
    assert not conf and analisa_ll1(prods, nts, M, "id + id * id".split()) is not None
    assert analisa_ll1(prods, nts, M, "id + * id".split()) is None
    print("LL(1): FIRST/FOLLOW iguais aos do livro do Dragão; id + id * id aceita, id + * id rejeitada")

    prods2, nts2 = le_gramatica("E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id")
    assert tabela_ll1(prods2, nts2)[1], "recursão à esquerda gera conflitos LL(1)"
    P, estados, ACTION, GOTO, conf = tabela_slr(prods2, nts2)
    assert len(estados) == 12 and not conf
    red = analisa_slr(P, ACTION, GOTO, "id + id * id".split())
    # reduções na ordem da derivação mais à direita invertida
    assert [f"{P[r][0]}->{' '.join(P[r][1])}" for r in red] == ["F->id", "T->F", "E->T", "F->id", "T->F", "F->id", "T->T * F", "E->E + T"]
    print("SLR: 12 estados, sem conflitos; reduções de id + id * id na ordem certa")

    pi, ni = le_gramatica("S -> if E then S S2 | x\nS2 -> else S | ε\nE -> b")
    assert tabela_ll1(pi, ni)[1] and tabela_slr(pi, ni)[4], "else pendente: conflito nas duas"
    print("if-then-else pendente: conflito em LL(1) e em SLR, como esperado de uma gramática ambígua")

    exemplos = {
        "x = a * (b + c) - 2 * 3;": ({"a": 7, "b": 3, "c": 4}, "x", 43),
        "s = 0; i = 1; while (i <= 5) { s = s + i * i; i = i + 1; }": ({}, "s", 55),
        "while (a != b) { if (a > b) { a = a - b; } else { b = b - a; } }": ({"a": 84, "b": 36}, "a", 12),
    }
    for fonte, (env, var, esperado) in exemplos.items():
        ast = Parser(fonte).programa()
        assert executa_tac(gera_tac(ast), env)[0][var] == avalia(ast, env)[0][var] == esperado
    ast = Parser("y = 2 * 3 + x;").programa()
    assert gera_tac(dobra(ast)) == ["t1 = 6 + x", "y = t1"]
    print("geração de código: exemplos conferidos; 2 * 3 + x dobrado para 6 + x")

    rnd = random.Random(2024)
    for _ in range(500):
        fonte = programa_aleatorio(rnd)
        ast = Parser(fonte).programa()
        env = {v: rnd.randint(-5, 9) for v in "abcxy"}
        esperado = avalia(ast, env)
        assert executa_tac(gera_tac(ast), env) == esperado, fonte
        assert executa_tac(gera_tac(dobra(ast)), env) == esperado, fonte
    print("500 programas aleatórios: o código de três endereços (com e sem dobramento) se comporta como a árvore")
