"""Lógica proposicional em Python puro: fórmulas, tabela-verdade e SAT.

Execute:  python3 logica.py
"""
from itertools import product


# ---------- Representação: cada fórmula é uma tupla (operador, filhos...) ----------
def Var(nome):  return ("var", nome)
def Nao(a):     return ("¬", a)
def E(a, b):    return ("∧", a, b)
def Ou(a, b):   return ("∨", a, b)
def Imp(a, b):  return ("→", a, b)
def Sse(a, b):  return ("↔", a, b)


def avalia(f, v):
    """Valor de verdade de f na valoração v (dicionário nome -> bool)."""
    tipo = f[0]
    if tipo == "var":
        return v[f[1]]
    if tipo == "¬":
        return not avalia(f[1], v)
    a = avalia(f[1], v)
    b = avalia(f[2], v)
    if tipo == "∧": return a and b
    if tipo == "∨": return a or b
    if tipo == "→": return (not a) or b
    if tipo == "↔": return a == b
    raise ValueError(f"operador desconhecido: {tipo}")


def variaveis(f):
    if f[0] == "var":
        return {f[1]}
    return set().union(*(variaveis(filho) for filho in f[1:]))


def texto(f):
    if f[0] == "var":
        return f[1]
    if f[0] == "¬":
        return "¬" + texto(f[1])
    return f"({texto(f[1])} {f[0]} {texto(f[2])})"


def tabela_verdade(f):
    """Lista de (valoração, resultado) — começa com tudo V, como nos livros."""
    vs = sorted(variaveis(f))
    linhas = []
    for valores in product([True, False], repeat=len(vs)):
        v = dict(zip(vs, valores))
        linhas.append((v, avalia(f, v)))
    return linhas


def classifica(f):
    resultados = [r for _, r in tabela_verdade(f)]
    if all(resultados):
        return "tautologia"
    if not any(resultados):
        return "contradição"
    return "contingência"


def equivalentes(f, g):
    return classifica(Sse(f, g)) == "tautologia"


def imprime_tabela(f):
    vs = sorted(variaveis(f))
    print(" | ".join(vs + [texto(f)]))
    for v, r in tabela_verdade(f):
        print(" | ".join(["V" if v[x] else "F" for x in vs] + ["V" if r else "F"]))


# ---------- SAT com o algoritmo DPLL ----------
# Uma fórmula em FNC é uma lista de cláusulas; cada cláusula é um conjunto de
# literais inteiros (3 = x3 verdadeiro, -3 = x3 falso) — o formato DIMACS.

def dpll(clausulas, atrib=None):
    """Devolve uma atribuição que satisfaz todas as cláusulas, ou None."""
    atrib = dict(atrib or {})
    clausulas = [set(c) for c in clausulas]
    while True:
        # Propagação unitária: cláusula com um só literal força seu valor.
        unit = next((c for c in clausulas if len(c) == 1), None)
        if unit is None:
            break
        lit = next(iter(unit))
        atrib[abs(lit)] = lit > 0
        clausulas = simplifica(clausulas, lit)
        if clausulas is None:
            return None
    if not clausulas:
        return atrib                      # todas satisfeitas
    lit = next(iter(clausulas[0]))        # escolhe uma variável e tenta os dois valores
    for escolha in (lit, -lit):
        resto = simplifica(clausulas, escolha)
        if resto is not None:
            r = dpll(resto, {**atrib, abs(escolha): escolha > 0})
            if r is not None:
                return r
    return None


def simplifica(clausulas, lit):
    """Assume `lit` verdadeiro: remove cláusulas satisfeitas e o literal oposto."""
    novas = []
    for c in clausulas:
        if lit in c:
            continue
        c = c - {-lit}
        if not c:
            return None                   # cláusula vazia: conflito
        novas.append(c)
    return novas


if __name__ == "__main__":
    p, q, r = Var("p"), Var("q"), Var("r")

    modus_ponens = Imp(E(Imp(p, q), p), q)
    imprime_tabela(modus_ponens)
    assert classifica(modus_ponens) == "tautologia"
    assert classifica(E(p, Nao(p))) == "contradição"
    assert classifica(Imp(p, q)) == "contingência"

    # De Morgan e contrapositiva
    assert equivalentes(Nao(E(p, q)), Ou(Nao(p), Nao(q)))
    assert equivalentes(Imp(p, q), Imp(Nao(q), Nao(p)))
    assert not equivalentes(Imp(p, q), Imp(q, p))   # a recíproca NÃO é equivalente

    # (x1 ∨ x2) ∧ (¬x1 ∨ x3) ∧ (¬x2 ∨ ¬x3) ∧ (¬x3 ∨ x1)
    sat = dpll([{1, 2}, {-1, 3}, {-2, -3}, {-3, 1}])
    assert sat is not None
    print("\nDPLL encontrou:", sat)
    assert dpll([{1}, {-1}]) is None                 # x1 ∧ ¬x1 é insatisfatível
    print("Todos os testes passaram.")
