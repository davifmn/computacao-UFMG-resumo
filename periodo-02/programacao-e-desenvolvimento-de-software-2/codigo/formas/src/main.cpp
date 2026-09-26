#include <iostream>
#include <memory>
#include <vector>

#include "circulo.hpp"
#include "retangulo.hpp"

int main() {
    // unique_ptr chama delete sozinho quando o vetor é destruído (RAII).
    std::vector<std::unique_ptr<Forma>> formas;
    formas.push_back(std::make_unique<Circulo>(1.0));
    formas.push_back(std::make_unique<Retangulo>(2.0, 3.0));

    double total = 0;
    for (const auto &f : formas) {
        std::cout << f->descricao() << "\n";  // polimorfismo: cada uma responde do seu jeito
        total += f->area();
    }
    std::cout << "Área total: " << total << "\n";

    try {
        Circulo invalido(-1);
    } catch (const std::invalid_argument &e) {
        std::cout << "Erro esperado: " << e.what() << "\n";
    }
    return 0;
}
