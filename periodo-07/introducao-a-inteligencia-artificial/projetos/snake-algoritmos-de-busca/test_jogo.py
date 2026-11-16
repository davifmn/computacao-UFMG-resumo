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


    def test_obstaculos(self):
        w, h = 18, 12
        j = Jogo(w, h, obstaculos=frozenset({6 * w + 10, 0, 1, 2}))
        self.assertEqual(len(j.obstaculos), 3, "a célula à frente da cobra nunca vira obstáculo")
        self.assertEqual(j.vizinho(1 * w + 1, 0), -1)
        m = Jogo(w, h, obstaculos=frozenset({6 * w + 12}))
        m.comidas = [0]
        m.passo(1)
        m.passo(1)
        self.assertTrue(m.vivo)
        m.passo(1)
        self.assertEqual(m.motivo, "obstaculo")
        for s in range(1, 20):
            k = Jogo(w, h, semente=s, obstaculos=frozenset(range(0, w * h, 7)))
            self.assertNotIn(k.comidas[0], k.obstaculos)

    def test_mapas_tem_caminho_e_comida_inicial(self):
        from cobra.algoritmos.base import buscar
        from cobra.mapas import MAPAS
        for nome, gerar in MAPAS.items():
            for w, h in [(12, 8), (18, 12), (24, 16)]:
                obst, comida = gerar(w, h)
                j = Jogo(w, h, obstaculos=frozenset(obst), comida=comida)
                self.assertIsNotNone(buscar(j, "bfs").caminho, f"{nome} {w}x{h}")
                if comida is not None:
                    self.assertEqual(j.comidas[0], comida)
                for t in ("bfs", "dfs", "ucs", "gulosa", "astar"):
                    self.assertFalse(set(buscar(j, t).caminho) & j.obstaculos, t)


if __name__ == "__main__":
    unittest.main()
