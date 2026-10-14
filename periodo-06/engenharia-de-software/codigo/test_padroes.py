"""Testes dos padrões, incluindo dublês (mocks) para a dependência externa.

Execute:  python3 -m unittest -v test_padroes
"""
import unittest
from unittest.mock import Mock

from padroes import (AdaptadorGateway, EnviaEmail, Estoque, FreteComSeguro, FreteExpresso,
                     FreteNormal, GatewayAntigo, Item, Pedido, Quadrado, Retangulo,
                     RetiradaNaLoja, cria_frete, dobra_largura)


def pedido_exemplo(frete=None):
    p = Pedido(frete=frete or FreteNormal())
    p.adicionar(Item("livro", 50.0, 1.0, qtd=2))
    p.adicionar(Item("caneca", 30.0, 0.5))
    return p


class TestStrategy(unittest.TestCase):
    def test_total_com_cada_frete(self):
        # subtotal 130, peso 2,5 kg, 100 km
        self.assertEqual(pedido_exemplo(FreteNormal()).total(100), 130 + 10 + 1.25 + 1)
        self.assertEqual(pedido_exemplo(FreteExpresso()).total(100), 130 + 2 * 12.25 + 15)
        self.assertEqual(pedido_exemplo(RetiradaNaLoja()).total(100), 130)

    def test_factory(self):
        self.assertIsInstance(cria_frete("expresso"), FreteExpresso)
        with self.assertRaises(ValueError):
            cria_frete("drone")


class TestObserver(unittest.TestCase):
    def test_pagar_notifica_todos(self):
        servidor = Mock()                                   # dublê: nenhum e-mail de verdade
        estoque = Estoque()
        p = pedido_exemplo()
        p.assinar(estoque)
        p.assinar(EnviaEmail(servidor))
        p.pagar()
        self.assertEqual(p.status, "pago")
        self.assertEqual(estoque.baixas, 1)
        servidor.enviar.assert_called_once_with("Seu pedido foi pago! Valor: R$ 130.00")

    def test_pedido_vazio(self):
        with self.assertRaises(ValueError):
            Pedido().pagar()


class TestAdapterDecorator(unittest.TestCase):
    def test_adaptador_converte_para_centavos(self):
        antigo = Mock(wraps=GatewayAntigo())
        pag = AdaptadorGateway(antigo)
        self.assertTrue(pag.cobrar(19.90, "4111"))
        antigo.efetuar_cobranca.assert_called_once_with(1990, "4111")
        self.assertFalse(pag.cobrar(10, "5500"))

    def test_seguro_soma_ao_frete_base(self):
        f = FreteComSeguro(FreteNormal(), taxa=0.1, valor_declarado=200)
        self.assertAlmostEqual(f.custo(2, 100), FreteNormal().custo(2, 100) + 20)
        # decorators se empilham
        g = FreteComSeguro(f, taxa=0.1, valor_declarado=100)
        self.assertAlmostEqual(g.custo(2, 100), FreteNormal().custo(2, 100) + 30)


class TestLiskov(unittest.TestCase):
    def test_retangulo_cumpre_o_contrato(self):
        self.assertTrue(dobra_largura(Retangulo(2, 3)))

    def test_quadrado_quebra_o_contrato(self):
        # Quadrado "é um" retângulo na geometria, mas não no comportamento
        self.assertFalse(dobra_largura(Quadrado(2)))


if __name__ == "__main__":
    unittest.main()
