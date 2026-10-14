"""Testes de unidade com partição em classes de equivalência e valores-limite.

Execute:  python3 -m unittest -v test_triangulo
"""
import unittest

from triangulo import classifica


class TestClasses(unittest.TestCase):
    """Um representante de cada classe de equivalência."""

    def test_invalido(self):
        self.assertEqual(classifica(0, 1, 1), "inválido")

    def test_nao_triangulo(self):
        self.assertEqual(classifica(1, 2, 8), "não é triângulo")

    def test_equilatero(self):
        self.assertEqual(classifica(2, 2, 2), "equilátero")

    def test_isosceles(self):
        self.assertEqual(classifica(2, 2, 3), "isósceles")

    def test_escaleno(self):
        self.assertEqual(classifica(3, 4, 5), "escaleno")


class TestFronteiras(unittest.TestCase):
    """Os casos que matam os mutantes: lados nulos e a + b = c em cada posição."""

    def test_cada_lado_nulo(self):
        for lados in [(0, 1, 1), (1, 0, 1), (1, 1, 0)]:
            with self.subTest(lados=lados):
                self.assertEqual(classifica(*lados), "inválido")

    def test_lado_um_e_valido(self):
        self.assertEqual(classifica(1, 1, 1), "equilátero")

    def test_soma_igual_ao_terceiro(self):
        for lados in [(1, 2, 3), (1, 3, 2), (3, 1, 2), (5, 2, 3)]:
            with self.subTest(lados=lados):
                self.assertEqual(classifica(*lados), "não é triângulo")

    def test_isosceles_em_cada_posicao(self):
        for lados in [(2, 2, 3), (3, 2, 2), (2, 3, 2)]:
            with self.subTest(lados=lados):
                self.assertEqual(classifica(*lados), "isósceles")

    def test_ordem_nao_importa(self):
        from itertools import permutations
        for lados in [(3, 4, 5), (2, 2, 3), (1, 2, 3)]:
            resultados = {classifica(*p) for p in permutations(lados)}
            self.assertEqual(len(resultados), 1, lados)


if __name__ == "__main__":
    unittest.main()
