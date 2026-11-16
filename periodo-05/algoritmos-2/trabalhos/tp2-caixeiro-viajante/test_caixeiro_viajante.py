"""Testes do TP2: o branch and bound acha o ótimo e as aproximações respeitam a garantia.

    python3 -m unittest test_caixeiro_viajante.py
"""

import unittest

from caixeiro_viajante import (branch_and_bound, christofides, custo, forca_bruta,
                               grafo_completo, pontos_aleatorios, twice_around_the_tree)


class TestCaixeiroViajante(unittest.TestCase):
    def instancias(self):
        for semente in range(25):
            for n in (4, 6, 8):
                yield grafo_completo(pontos_aleatorios(n, semente * 10 + n))

    def test_rotas_sao_ciclos_hamiltonianos(self):
        for g in self.instancias():
            for metodo in (branch_and_bound, twice_around_the_tree, christofides):
                rota = metodo(g)
                self.assertEqual(sorted(rota), list(range(g.number_of_nodes())), metodo.__name__)

    def test_branch_and_bound_e_otimo(self):
        for g in self.instancias():
            self.assertAlmostEqual(custo(g, branch_and_bound(g)), custo(g, forca_bruta(g)))

    def test_garantias_de_aproximacao(self):
        for g in self.instancias():
            otimo = custo(g, forca_bruta(g))
            self.assertLessEqual(custo(g, twice_around_the_tree(g)), 2 * otimo + 1e-9)
            self.assertLessEqual(custo(g, christofides(g)), 1.5 * otimo + 1e-9)


if __name__ == "__main__":
    unittest.main()
