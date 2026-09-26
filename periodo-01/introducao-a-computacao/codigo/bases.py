"""Representação de números: bases, complemento de dois e IEEE 754.

Execute:  python3 bases.py
"""
import struct

DIGITOS = "0123456789ABCDEF"


def converte(n, base):
    """Decimal -> base b, por divisões sucessivas."""
    resultado = ""
    while n > 0:
        resto = n % base
        resultado = DIGITOS[resto] + resultado
        n = n // base
    return resultado or "0"


def para_decimal(s, base):
    """Base b -> decimal, pelo método de Horner."""
    valor = 0
    for c in s.upper():
        d = DIGITOS.index(c)
        if d >= base:
            raise ValueError(f"'{c}' não é dígito da base {base}")
        valor = valor * base + d
    return valor


def complemento_de_dois(x, n):
    """Bits (string) de x em complemento de dois com n bits."""
    if not -(2 ** (n - 1)) <= x < 2 ** (n - 1):
        raise OverflowError(f"{x} não cabe em {n} bits com sinal")
    return format(x % (2 ** n), f"0{n}b")      # -x é guardado como 2^n - x


def de_complemento_de_dois(bits):
    n = len(bits)
    u = int(bits, 2)
    return u - 2 ** n if bits[0] == "1" else u


def soma_com_overflow(a, b, n):
    """Soma em n bits: devolve (resultado com sinal, houve_overflow)."""
    bruto = (a + b) % (2 ** n)
    r = de_complemento_de_dois(format(bruto, f"0{n}b"))
    return r, r != a + b


def float32_bits(x):
    """Os 32 bits de um float (sinal | expoente | fração)."""
    (u,) = struct.unpack(">I", struct.pack(">f", x))
    b = format(u, "032b")
    return b[0], b[1:9], b[9:]


def float32_valor(x):
    """O valor que realmente fica guardado quando x vira float de 32 bits."""
    (y,) = struct.unpack(">f", struct.pack(">f", x))
    return y


if __name__ == "__main__":
    assert converte(13, 2) == "1101"
    assert converte(255, 16) == "FF"
    assert converte(0, 2) == "0"
    assert para_decimal("1101", 2) == 13
    assert para_decimal("ff", 16) == 255
    for n in range(0, 1000, 7):
        for b in (2, 3, 8, 16):
            assert para_decimal(converte(n, b), b) == n

    assert complemento_de_dois(-1, 8) == "11111111"
    assert complemento_de_dois(-128, 8) == "10000000"
    assert de_complemento_de_dois("11111011") == -5
    assert soma_com_overflow(100, 50, 8) == (-106, True)
    assert soma_com_overflow(100, -50, 8) == (50, False)

    s, e, f = float32_bits(-2.5)
    assert (s, int(e, 2) - 127) == ("1", 1)
    print("0.1 como float32 vale", repr(float32_valor(0.1)))
    print("0.1 + 0.2 == 0.3 ?", 0.1 + 0.2 == 0.3, "| diferença:", 0.1 + 0.2 - 0.3)
    assert float32_valor(16777217) == 16777216
    print("Todos os testes passaram.")
