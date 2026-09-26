"""Circuitos combinacionais em Python: portas, somadores e um contador.

Execute:  python3 circuitos.py
"""


def NOT(a): return 1 - a
def AND(a, b): return a & b
def OR(a, b): return a | b
def XOR(a, b): return a ^ b
def NAND(a, b): return NOT(AND(a, b))


def meio_somador(a, b):
    return XOR(a, b), AND(a, b)                  # (soma, vai-um)


def somador_completo(a, b, cin):
    s1, c1 = meio_somador(a, b)
    s, c2 = meio_somador(s1, cin)
    return s, OR(c1, c2)


def somador_ripple(A, B, cin=0):
    """Soma dois números de n bits (listas com o bit menos significativo primeiro)."""
    S, c = [], cin
    for a, b in zip(A, B):
        s, c = somador_completo(a, b, c)
        S.append(s)
    return S, c


def bits(x, n):
    return [(x >> i) & 1 for i in range(n)]


def valor(bs):
    return sum(b << i for i, b in enumerate(bs))


def mux(i0, i1, s):
    return OR(AND(i0, NOT(s)), AND(i1, s))


def contador(n_bits, pulsos):
    """Contador síncrono com flip-flops T: o bit i inverte quando todos abaixo dele valem 1."""
    q = [0] * n_bits
    estados = [valor(q)]
    for _ in range(pulsos):
        t, todos = [], 1
        for b in q:
            t.append(todos)
            todos &= b
        q = [b ^ ti for b, ti in zip(q, t)]
        estados.append(valor(q))
    return estados


if __name__ == "__main__":
    # NAND é universal
    for a in (0, 1):
        assert NAND(a, a) == NOT(a)
        for b in (0, 1):
            assert NAND(NAND(a, b), NAND(a, b)) == AND(a, b)
            assert NAND(NAND(a, a), NAND(b, b)) == OR(a, b)

    print(" a b cin | s cout")
    for a in (0, 1):
        for b in (0, 1):
            for c in (0, 1):
                s, cout = somador_completo(a, b, c)
                assert 2 * cout + s == a + b + c
                print(f" {a} {b}  {c}  | {s}  {cout}")

    for x in range(16):
        for y in range(16):
            S, c = somador_ripple(bits(x, 4), bits(y, 4))
            assert valor(S) + 16 * c == x + y

    assert [mux(0, 1, s) for s in (0, 1)] == [0, 1]
    assert contador(3, 9) == [0, 1, 2, 3, 4, 5, 6, 7, 0, 1]
    print("Todos os testes passaram.")
