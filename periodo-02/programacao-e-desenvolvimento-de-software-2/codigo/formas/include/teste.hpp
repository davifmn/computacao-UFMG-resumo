// Mini-framework de testes (~50 linhas) com a mesma cara do doctest:
//   TESTE(nome) { VERIFICA(expr); }
// Em projetos maiores, use o doctest (https://github.com/doctest/doctest).
#pragma once

#include <cmath>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

namespace teste {

struct Caso {
    std::string nome;
    std::function<void()> corpo;
};

struct Falha {
    std::string mensagem;
};

inline std::vector<Caso> &casos() {
    static std::vector<Caso> lista;  // inicializada no primeiro uso
    return lista;
}

struct Registra {
    Registra(const std::string &nome, std::function<void()> corpo) { casos().push_back({nome, corpo}); }
};

inline int roda_todos() {
    int falhas = 0;
    for (const Caso &c : casos()) {
        try {
            c.corpo();
            std::cout << "  ok     " << c.nome << "\n";
        } catch (const Falha &f) {
            falhas++;
            std::cout << "  FALHOU " << c.nome << "\n         " << f.mensagem << "\n";
        } catch (const std::exception &e) {
            falhas++;
            std::cout << "  ERRO   " << c.nome << ": exceção inesperada: " << e.what() << "\n";
        }
    }
    std::cout << casos().size() - falhas << "/" << casos().size() << " testes passaram.\n";
    return falhas == 0 ? 0 : 1;
}

}  // namespace teste

#define TESTE(nome)                                                  \
    static void nome();                                              \
    static teste::Registra registra_##nome(#nome, nome);             \
    static void nome()

#define VERIFICA(cond)                                                                        \
    do {                                                                                      \
        if (!(cond))                                                                          \
            throw teste::Falha{std::string(__FILE__) + ":" + std::to_string(__LINE__) + ": " #cond}; \
    } while (0)

#define VERIFICA_PROXIMO(a, b) VERIFICA(std::fabs((a) - (b)) < 1e-9)

#define VERIFICA_EXCECAO(expr, Tipo)                                                 \
    do {                                                                             \
        bool lancou = false;                                                         \
        try { (void)(expr); } catch (const Tipo &) { lancou = true; }                \
        if (!lancou) throw teste::Falha{std::string(#expr) + " deveria lançar " #Tipo}; \
    } while (0)
