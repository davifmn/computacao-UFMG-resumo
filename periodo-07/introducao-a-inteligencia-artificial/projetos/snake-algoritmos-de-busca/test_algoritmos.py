import random
import statistics
import unittest

from cobra.algoritmos import FAMILIAS
from cobra.algoritmos.base import buscar
from cobra.algoritmos.deterministicos import (AEstrela, AEstrelaSeguro, CicloHamiltoniano, DETERMINISTICOS,
                                              ciclo_hamiltoniano)
from cobra.algoritmos.nao_deterministicos import (MCTS, NAO_DETERMINISTICOS, Genetico, MonteCarlo,
                                                  PasseioAleatorio, SubidaEncosta, TemperaSimulada, evoluir)
from cobra.algoritmos.torneio import jogar_partida
from cobra.jogo import Jogo, livre_em


def media(C, n=4, **kw):
    return statistics.mean(jogar_partida(C, semente=k, semente_agente=k, **kw)["comidos"] for k in range(1, n + 1))


class TestBusca(unittest.TestCase):
    def test_bfs_e_astar_otimos_e_caminhos_validos(self):
        rng = random.Random(5)
        for it in range(40):
            j = Jogo(14, 10, semente=it + 1, toroidal=it % 3 == 0)
            ag = AEstrela()
            for _ in range(rng.randrange(120)):
                if not j.vivo:
                    break
                j.passo(ag.decidir(j).dir)
            if not j.vivo:
                continue
            idx = j.indice()
            res = {t: buscar(j, t, idx=idx) for t in ("bfs", "dfs", "ucs", "gulosa", "astar")}
            self.assertEqual(res["bfs"].caminho is None, res["astar"].caminho is None)
            if res["bfs"].caminho is None:
                continue
            self.assertEqual(len(res["astar"].caminho), len(res["bfs"].caminho), "A* é ótimo")
            self.assertLessEqual(len(res["astar"].expandidos), len(res["bfs"].expandidos))
            for t, r in res.items():
                self.assertGreaterEqual(len(r.caminho), len(res["bfs"].caminho), t)
                v = j.cabeca
                for k, u in enumerate(r.caminho):
                    self.assertIsNotNone(j.dir_para(v, u), f"{t}: passo contíguo")
                    self.assertTrue(livre_em(idx, len(j.corpo), u, k + 1), f"{t}: célula livre")
                    v = u
                self.assertIn(v, j.comidas)

    def test_a_estrela_ciente_do_tempo(self):
        # o corpo cerca a comida em (2,2); a única entrada é o penúltimo segmento
        j = Jogo(7, 5)
        c = lambda x, y: y * 7 + x  # noqa: E731
        j.corpo = [c(1, 1), c(2, 1), c(3, 1), c(3, 2), c(3, 3), c(2, 3), c(1, 3), c(1, 2), c(0, 2)]
        j.dir, j.comidas = 3, [c(2, 2)]
        self.assertIsNone(buscar(j, "astar").caminho)
        r = buscar(j, "astar", ciente_tempo=True)
        self.assertEqual(r.caminho, [c(0, 1), c(0, 2), c(1, 2), c(2, 2)])
        for v in r.caminho:
            j.passo(j.dir_para(j.cabeca, v))
        self.assertTrue(j.vivo)
        self.assertEqual(j.comidos, 1)

    def test_ciclo_hamiltoniano(self):
        for w, h in [(4, 4), (6, 4), (5, 4), (4, 5), (18, 12)]:
            ciclo = ciclo_hamiltoniano(w, h)
            self.assertEqual(len(set(ciclo)), w * h)
            j = Jogo(w, h)
            for a, b in zip(ciclo, ciclo[1:] + ciclo[:1]):
                self.assertEqual(j.distancia(a, b), 1)
        self.assertIsNone(ciclo_hamiltoniano(5, 5))
        r = jogar_partida(CicloHamiltoniano, w=8, h=6, semente=4)
        self.assertTrue(r["venceu"])


class TestFamilias(unittest.TestCase):
    def test_catalogo(self):
        self.assertEqual(len(DETERMINISTICOS), 9)
        self.assertEqual(len(NAO_DETERMINISTICOS), 6)
        self.assertEqual(list(FAMILIAS), ["Determinísticos", "Não determinísticos"])

    def test_deterministicos_repetem_a_partida(self):
        for _, C in DETERMINISTICOS:
            a = jogar_partida(C, w=12, h=8, semente=9, semente_agente=1, passos_max=3000)
            b = jogar_partida(C, w=12, h=8, semente=9, semente_agente=2, passos_max=3000)
            self.assertEqual((a["comidos"], a["passos"], a["motivo"]), (b["comidos"], b["passos"], b["motivo"]), C.nome)

    def test_nao_deterministicos_dependem_da_semente(self):
        for C in (PasseioAleatorio, SubidaEncosta, TemperaSimulada):
            a = jogar_partida(C, w=12, h=8, semente=9, semente_agente=1)
            b = jogar_partida(C, w=12, h=8, semente=9, semente_agente=1)
            self.assertEqual((a["comidos"], a["passos"]), (b["comidos"], b["passos"]), "mesma semente, mesma partida")
            outros = {jogar_partida(C, w=12, h=8, semente=9, semente_agente=s)["passos"] for s in range(2, 6)}
            self.assertTrue(outros - {a["passos"]}, f"{C.nome}: outra semente, outra partida")

    def test_quem_pensa_no_depois_vive_mais(self):
        aleatorio = media(PasseioAleatorio)
        self.assertLess(aleatorio, 5)
        self.assertGreater(media(AEstrelaSeguro, 6), media(AEstrela, 6) + 20)
        self.assertGreater(media(Genetico), 50)
        self.assertGreater(media(MonteCarlo, 1, w=12, h=8), aleatorio + 10)
        mcts = lambda rng: MCTS(rng, iteracoes=120)  # noqa: E731
        self.assertGreater(media(mcts, 1, w=12, h=8), aleatorio + 10)

    def test_genetico_melhora(self):
        gs = list(evoluir(pop=8, geracoes=4, jogos=1, semente=3, w=8, h=6, passos_max=400))
        self.assertEqual([g["geracao"] for g in gs], [1, 2, 3, 4])
        self.assertGreater(gs[-1]["media"], gs[0]["media"], "a população melhora")


if __name__ == "__main__":
    unittest.main()
