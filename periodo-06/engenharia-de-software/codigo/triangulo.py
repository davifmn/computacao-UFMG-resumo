"""A função da página de testes. Veja test_triangulo.py."""


def classifica(a, b, c):
    if a <= 0 or b <= 0 or c <= 0:
        return "inválido"
    if a + b <= c or a + c <= b or b + c <= a:
        return "não é triângulo"
    if a == b and b == c:
        return "equilátero"
    if a == b or b == c or a == c:
        return "isósceles"
    return "escaleno"
