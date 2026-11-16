import unittest

from cobra.jogo import Jogo, area_livre, escapa, livre_em


class TestRegras(unittest.TestCase):
    def test_come_e_cresce(self):
        j = Jogo(8, 6, semente=3)
        self.assertNotIn(j.comidas[0], j.corpo)
        j.comidas = [j.cabeca + 1]
        j.passo(1)
        self.assertEqual((len(j.corpo), j.comidos, len(j.comidas)), (4, 1, 1))

    def test_meia_volta_ignorada(self):
        j = Jogo(8, 6)
        j.passo(3)
        self.assertEqual(j.dir, 1)
        self.assertTrue(j.vivo)

    def test_pode_entrar_na_celula_da_cauda(self):
        j = Jogo(8, 6)
        j.corpo, j.dir, j.comidas = [2 * 8 + 3, 2 * 8 + 2, 3 * 8 + 2, 3 * 8 + 3], 3, [0]
        j.passo(2)
        self.assertTrue(j.vivo)

    def test_parede_e_toro(self):
        j = Jogo(8, 6)
        j.comidas = [0]
        for _ in range(4):
            j.passo(1)
        self.assertEqual(j.motivo, "parede")
        t = Jogo(8, 6, toroidal=True)
        t.comidas = [0]
        for _ in range(6):
            t.passo(1)
        self.assertTrue(t.vivo)
        self.assertEqual(t.cabeca % 8, (4 + 6) % 8)
        self.assertEqual(t.distancia(0, 7), 1)

    def test_fome(self):
        j = Jogo(4, 4, toroidal=True)
        j.comidas = []
        for _ in range(j.limite_fome + 1):
            j.passo(1)
        self.assertEqual(j.motivo, "fome")

    def test_simulacao_nao_sorteia_comida(self):
        j = Jogo(8, 6)
        j.comidas = [j.cabeca + 1]
        s = j.clonar().passo(1)
        self.assertEqual(s.comidas, [])
        self.assertEqual(j.comidas, [j.cabeca + 1], "o original não muda")

    def test_modelos_de_obstaculo(self):
        idx, L = [0, 1, 2, -1], 3
        self.assertFalse(livre_em(idx, L, 1, 1))
        self.assertTrue(livre_em(idx, L, 2, 1), "a cauda sai no próximo passo")
        self.assertFalse(livre_em(idx, L, 1, 1, ciente_tempo=True))
        self.assertTrue(livre_em(idx, L, 1, 2, ciente_tempo=True), "o segmento 1 sai em L − 1 = 2 passos")

    def test_area_e_fuga(self):
        j = Jogo(8, 6)
        area, cauda = area_livre(j)
        self.assertEqual(area, 8 * 6 - 3 + 1)    # todas as livres + a cauda
        self.assertTrue(cauda)
        self.assertTrue(escapa(j))


if __name__ == "__main__":
    unittest.main()
