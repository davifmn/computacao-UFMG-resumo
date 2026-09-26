#include <cmath>
#include <memory>
#include <stdexcept>
#include <vector>

#include "circulo.hpp"
#include "retangulo.hpp"
#include "teste.hpp"

TESTE(area_do_circulo) {
    Circulo c(2.0);
    VERIFICA_PROXIMO(c.area(), 4 * PI);
    VERIFICA_PROXIMO(c.perimetro(), 4 * PI);
}

TESTE(area_do_retangulo) {
    Retangulo r(2.0, 3.0);
    VERIFICA_PROXIMO(r.area(), 6.0);
    VERIFICA_PROXIMO(r.perimetro(), 10.0);
    VERIFICA(!r.eh_quadrado());
    VERIFICA(Retangulo(4, 4).eh_quadrado());
}

TESTE(construtores_validam_entrada) {
    VERIFICA_EXCECAO(Circulo(0), std::invalid_argument);
    VERIFICA_EXCECAO(Circulo(-3), std::invalid_argument);
    VERIFICA_EXCECAO(Retangulo(1, -1), std::invalid_argument);
}

TESTE(polimorfismo_escolhe_o_metodo_certo) {
    std::vector<std::unique_ptr<Forma>> formas;
    formas.push_back(std::make_unique<Circulo>(1.0));
    formas.push_back(std::make_unique<Retangulo>(2.0, 3.0));
    VERIFICA(formas[0]->nome() == "círculo");
    VERIFICA(formas[1]->nome() == "forma");  // herdado de Forma
    VERIFICA_PROXIMO(formas[1]->area(), 6.0);
}

TESTE(descricao_usa_os_metodos_virtuais) {
    Retangulo r(1, 2);
    VERIFICA(r.descricao() == "forma (área 2, perímetro 6)");
}

int main() { return teste::roda_todos(); }
