"""Princípios e padrões de projeto em Python, no exemplo de uma loja virtual.

Cada classe aqui é usada no tutorial "Projeto de software" e testada em
test_padroes.py.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Strategy: famílias de algoritmos intercambiáveis (aberto/fechado)
# ---------------------------------------------------------------------------

class Frete(ABC):
    @abstractmethod
    def custo(self, peso_kg: float, distancia_km: float) -> float: ...


class FreteNormal(Frete):
    def custo(self, peso_kg, distancia_km):
        return 10 + 0.5 * peso_kg + 0.01 * distancia_km


class FreteExpresso(Frete):
    def custo(self, peso_kg, distancia_km):
        return 2 * FreteNormal().custo(peso_kg, distancia_km) + 15


class RetiradaNaLoja(Frete):
    def custo(self, peso_kg, distancia_km):
        return 0.0


# ---------------------------------------------------------------------------
# Observer: avisar interessados sem conhecê-los (baixo acoplamento)
# ---------------------------------------------------------------------------

class Observador(ABC):
    @abstractmethod
    def notificar(self, evento: str, dados: dict) -> None: ...


@dataclass
class Item:
    nome: str
    preco: float
    peso_kg: float
    qtd: int = 1


@dataclass
class Pedido:
    itens: list = field(default_factory=list)
    frete: Frete = field(default_factory=FreteNormal)   # injeção de dependência
    observadores: list = field(default_factory=list)
    status: str = "aberto"

    def adicionar(self, item: Item):
        self.itens.append(item)

    def subtotal(self):
        return sum(i.preco * i.qtd for i in self.itens)

    def peso(self):
        return sum(i.peso_kg * i.qtd for i in self.itens)

    def total(self, distancia_km):
        return round(self.subtotal() + self.frete.custo(self.peso(), distancia_km), 2)

    def assinar(self, obs: Observador):
        self.observadores.append(obs)

    def pagar(self):
        if not self.itens:
            raise ValueError("pedido vazio")
        self.status = "pago"
        for obs in self.observadores:
            obs.notificar("pago", {"subtotal": self.subtotal()})


class Estoque(Observador):
    def __init__(self):
        self.baixas = 0

    def notificar(self, evento, dados):
        self.baixas += 1


class EnviaEmail(Observador):
    def __init__(self, servidor):
        self.servidor = servidor            # dependência externa: nos testes, um mock

    def notificar(self, evento, dados):
        self.servidor.enviar(f"Seu pedido foi {evento}! Valor: R$ {dados['subtotal']:.2f}")


# ---------------------------------------------------------------------------
# Adapter: encaixar uma interface que não conversa com a nossa
# ---------------------------------------------------------------------------

class GatewayAntigo:
    """Biblioteca de terceiros: valores em centavos e nomes diferentes."""

    def efetuar_cobranca(self, valor_centavos: int, cartao: str) -> dict:
        return {"ok": cartao.startswith("4"), "valor": valor_centavos}


class Pagamento(ABC):
    @abstractmethod
    def cobrar(self, reais: float, cartao: str) -> bool: ...


class AdaptadorGateway(Pagamento):
    def __init__(self, antigo: GatewayAntigo):
        self.antigo = antigo

    def cobrar(self, reais, cartao):
        return self.antigo.efetuar_cobranca(round(reais * 100), cartao)["ok"]


# ---------------------------------------------------------------------------
# Decorator: acrescentar responsabilidades sem herança
# ---------------------------------------------------------------------------

class FreteComSeguro(Frete):
    def __init__(self, base: Frete, taxa=0.05, valor_declarado=0.0):
        self.base, self.taxa, self.valor = base, taxa, valor_declarado

    def custo(self, peso_kg, distancia_km):
        return self.base.custo(peso_kg, distancia_km) + self.taxa * self.valor


# ---------------------------------------------------------------------------
# Factory: centralizar a criação
# ---------------------------------------------------------------------------

def cria_frete(tipo: str) -> Frete:
    tipos = {"normal": FreteNormal, "expresso": FreteExpresso, "loja": RetiradaNaLoja}
    if tipo not in tipos:
        raise ValueError(f"frete desconhecido: {tipo}")
    return tipos[tipo]()


# ---------------------------------------------------------------------------
# Liskov: o clássico quadrado × retângulo
# ---------------------------------------------------------------------------

class Retangulo:
    def __init__(self, largura, altura):
        self._l, self._a = largura, altura

    def set_largura(self, v):
        self._l = v

    def set_altura(self, v):
        self._a = v

    def area(self):
        return self._l * self._a


class Quadrado(Retangulo):
    """Viola o princípio de Liskov: mudar a largura muda a altura."""

    def __init__(self, lado):
        super().__init__(lado, lado)

    def set_largura(self, v):
        self._l = self._a = v

    def set_altura(self, v):
        self._l = self._a = v


def dobra_largura(r: Retangulo):
    """Código cliente que confia no contrato de Retangulo."""
    area_antes = r.area()
    r.set_largura(r._l * 2)
    return r.area() == 2 * area_antes
