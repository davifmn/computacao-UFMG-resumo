"""Confere Graham e Jarvis contra uma envoltória por força bruta.

    python3 -m unittest test_envoltoria.py
"""

import itertools
import unittest

from geometria import produto_vetorial
from graham_scan import graham_scan
from jarvis_march import jarvis_march, ponto_inicial
from main import sortear_pontos


def envoltoria_forca_bruta(pontos):
    """Um ponto é vértice se existe uma reta por ele e outro ponto com todos os demais de um lado só,
    e ele não está no meio de um segmento colinear da borda. O(n³), só para testar."""
    pontos = list(pontos)
    vertices = set()
    for a, b in itertools.permutations(pontos, 2):
        lados = [produto_vetorial(a, b, c) for c in pontos if c not in (a, b)]
        if all(s >= 0 for s in lados):
            # pontos colineares com a-b na borda: só os extremos são vértices
            colineares = [c for c in pontos if produto_vetorial(a, b, c) == 0]
            extremos = (min(colineares), max(colineares))
            vertices.update(extremos)
    return vertices


class TestEnvoltoria(unittest.TestCase):
    def test_quadrado_com_ponto_interno(self):
        pontos = [(0, 0), (4, 0), (4, 4), (0, 4), (2, 2), (1, 3)]
        esperado = {(0, 0), (4, 0), (4, 4), (0, 4)}
        self.assertEqual(set(graham_scan(pontos)), esperado)
        self.assertEqual(set(jarvis_march(pontos, ponto_inicial(pontos))), esperado)

    def test_aleatorio_contra_forca_bruta(self):
        for semente in range(40):
            pontos = sortear_pontos(25, lo=0, hi=30, semente=semente)
            esperado = envoltoria_forca_bruta(pontos)
            self.assertEqual(set(graham_scan(list(pontos))), esperado, f"Graham, semente {semente}")
            self.assertEqual(set(jarvis_march(pontos, ponto_inicial(pontos))), esperado, f"Jarvis, semente {semente}")

    def test_graham_anti_horario(self):
        h = graham_scan(list(sortear_pontos(60, semente=7)))
        for a, b, c in zip(h, h[1:] + h[:1], h[2:] + h[:2]):
            self.assertGreater(produto_vetorial(a, b, c), 0)


if __name__ == "__main__":
    unittest.main()
