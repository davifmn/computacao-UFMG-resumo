// Vetor dinâmico genérico: template, regra dos três, exceções e crescimento amortizado.
// Compile: g++ -std=c++17 -Wall -Wextra vetor.cpp -o vetor && ./vetor
#include <cassert>
#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>

template <typename T>
class Vetor {
public:
    Vetor() = default;

    // Regra dos três: quem gerencia memória precisa definir cópia, atribuição e destrutor.
    Vetor(const Vetor &outro) : dados_(new T[outro.cap_]), tam_(outro.tam_), cap_(outro.cap_) {
        for (std::size_t i = 0; i < tam_; i++) dados_[i] = outro.dados_[i];
    }

    Vetor &operator=(Vetor outro) {  // idioma copy-and-swap: seguro contra autoatribuição
        std::swap(dados_, outro.dados_);
        std::swap(tam_, outro.tam_);
        std::swap(cap_, outro.cap_);
        return *this;
    }

    ~Vetor() { delete[] dados_; }

    void push_back(const T &x) {
        if (tam_ == cap_) {
            std::size_t nova = cap_ == 0 ? 1 : 2 * cap_;  // dobra: O(1) amortizado
            T *novo = new T[nova];
            for (std::size_t i = 0; i < tam_; i++) novo[i] = std::move(dados_[i]);
            delete[] dados_;
            dados_ = novo;
            cap_ = nova;
            realocacoes_++;
        }
        dados_[tam_++] = x;
    }

    void pop_back() {
        if (tam_ == 0) throw std::out_of_range("pop_back em vetor vazio");
        tam_--;
    }

    T &operator[](std::size_t i) { return dados_[i]; }  // sem verificação (rápido)
    const T &operator[](std::size_t i) const { return dados_[i]; }

    T &at(std::size_t i) {  // com verificação
        if (i >= tam_) throw std::out_of_range("índice " + std::to_string(i) + " fora do vetor");
        return dados_[i];
    }

    std::size_t size() const { return tam_; }
    std::size_t capacity() const { return cap_; }
    int realocacoes() const { return realocacoes_; }

    T *begin() { return dados_; }  // permite usar em for (auto x : v)
    T *end() { return dados_ + tam_; }

private:
    T *dados_ = nullptr;
    std::size_t tam_ = 0, cap_ = 0;
    int realocacoes_ = 0;
};

int main() {
    Vetor<int> v;
    for (int i = 0; i < 1000; i++) v.push_back(i * i);
    assert(v.size() == 1000);
    assert(v.capacity() == 1024);
    assert(v.realocacoes() == 11);  // 1, 2, 4, ..., 1024
    assert(v[31] == 961);

    Vetor<int> copia = v;  // construtor de cópia: cópia profunda
    copia[0] = -1;
    assert(v[0] == 0);

    Vetor<std::string> nomes;
    nomes.push_back("Ada");
    nomes.push_back("Turing");
    Vetor<std::string> &mesmo = nomes;
    nomes = mesmo;  // autoatribuição (via referência) não pode quebrar
    std::string junto;
    for (const std::string &s : nomes) junto += s;
    assert(junto == "AdaTuring");

    bool lancou = false;
    try {
        nomes.at(5);
    } catch (const std::out_of_range &e) {
        lancou = true;
        std::cout << "Exceção esperada: " << e.what() << "\n";
    }
    assert(lancou);
    std::cout << "Todos os testes passaram.\n";
    return 0;
}
