"""Testes do mapa de ocupação (não precisam do CoppeliaSim).

    python3 -m unittest test_occupancy_grid.py
"""

import unittest

import numpy as np

from occupancy_grid import OccupancyGrid


class TestOccupancyGrid(unittest.TestCase):
    def setUp(self):
        self.grade = OccupancyGrid(0, 10, 0, 10, resolution=1.0)

    def test_comeca_desconhecido(self):
        self.assertTrue(np.allclose(self.grade.get_probability_map(), 0.5))

    def test_um_feixe_marca_livre_no_caminho_e_ocupado_no_fim(self):
        self.grade.update((0.5, 5.5, 0.0), [(6.5, 5.5)])  # parede em x = 6
        p = self.grade.get_probability_map()
        for i in range(0, 6):
            self.assertLess(p[i, 5], 0.5, f"célula ({i}, 5) deveria estar livre")
        # o fim do feixe é o obstáculo: só recebe l_occ (antes da correção recebia também
        # l_free e os dois se anulavam, deixando as paredes em 0,5)
        self.assertAlmostEqual(p[6, 5], 0.85)
        self.assertAlmostEqual(p[7, 5], 0.5)  # além da parede: nunca observado

    def test_log_odds_saturam(self):
        for _ in range(100):
            self.grade.update((0.5, 0.5, 0.0), [(3.5, 0.5)])
        self.assertLessEqual(self.grade.grid.max(), self.grade.l_max)
        self.assertGreaterEqual(self.grade.grid.min(), self.grade.l_min)

    def test_bresenham_diagonal(self):
        self.grade.bresenham_line(0, 0, 4, 4)
        livres = {(i, j) for i in range(10) for j in range(10) if self.grade.grid[i, j] < 0}
        self.assertEqual(livres, {(k, k) for k in range(4)})  # a célula final (4, 4) fica de fora


if __name__ == "__main__":
    unittest.main()
