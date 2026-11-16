"""Testes ponta a ponta: compila programas, aloca registradores, executa e confere o valor.

    python3 -m unittest test_compilador.py

Os programas aleatórios usam muitas variáveis vivas ao mesmo tempo para forçar o
alocador a despejar (spill) valores na memória, já que só há 4 registradores livres.
"""

import random
import unittest

import Asm as AsmModule
from Lexer import Lexer
from Parser import Parser
from Visitor import GenVisitor
from driver import perform_register_allocation, rename_variables


def compilar_e_executar(fonte):
    exp = rename_variables(Parser(Lexer(fonte).tokens()).parse())
    prog = AsmModule.Program(1000, {}, [])
    resposta = exp.accept(GenVisitor(), prog)
    alocador = perform_register_allocation(prog)
    prog.reset_env()
    prog.eval()
    return alocador.get_val(resposta)


def programa_aleatorio(rnd, profundidade, escopo):
    """Devolve (código-fonte, valor esperado) de uma expressão inteira aleatória."""
    if profundidade == 0 or rnd.random() < 0.2:
        if escopo and rnd.random() < 0.6:
            nome = rnd.choice(sorted(escopo))
            return nome, escopo[nome]
        n = rnd.randint(0, 9)
        return str(n), n
    tipo = rnd.choice(["let", "let", "+", "-", "*"])
    if tipo == "let":
        nome = f"v{len(escopo)}"
        fonte_def, valor_def = programa_aleatorio(rnd, profundidade - 1, escopo)
        corpo, valor = programa_aleatorio(rnd, profundidade - 1, {**escopo, nome: valor_def})
        return f"let {nome} <- {fonte_def} in {corpo} end", valor
    (a, va), (b, vb) = (programa_aleatorio(rnd, profundidade - 1, escopo) for _ in range(2))
    valor = {"+": va + vb, "-": va - vb, "*": va * vb}[tipo]
    return f"({a} {tipo} {b})", valor


class TestCompilador(unittest.TestCase):
    def test_exemplos(self):
        casos = {
            "2 + 3 * 4": 14,
            "let x <- 3 in x * 2 end": 6,
            "let x <- 10 in let x <- x + 1 in x * x end end": 121,  # sombreamento
            "17 / 5": 3,
            "~4 + 10": 6,
            "let a <- 3 in a < 4 end": 1,
            "let a <- 4 in a <= 3 end": 0,
            "not (2 = 2)": 0,
            "let a <- 1 in let b <- 2 in let c <- 3 in let d <- 4 in let e <- 5 in "
            "a + b + c + d + e end end end end end": 15,  # 5 vivas > 4 registradores
        }
        for fonte, esperado in casos.items():
            self.assertEqual(int(compilar_e_executar(fonte)), esperado, fonte)

    def test_programas_aleatorios(self):
        rnd = random.Random(2024)
        for _ in range(300):
            fonte, esperado = programa_aleatorio(rnd, 5, {})
            self.assertEqual(compilar_e_executar(fonte), esperado, fonte)


if __name__ == "__main__":
    unittest.main()
