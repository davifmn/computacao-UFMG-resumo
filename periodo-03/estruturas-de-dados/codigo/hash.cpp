// Tabela hash com endereçamento aberto (sondagem linear), marcas de remoção
// e redimensionamento automático. Compile: g++ -std=c++17 -Wall -Wextra hash.cpp -o hash && ./hash
#include <cassert>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>

class TabelaHash {
    enum class Estado { Vazio, Ocupado, Removido };
    struct Slot {
        Estado estado = Estado::Vazio;
        std::string chave;
        int valor = 0;
    };
    std::vector<Slot> t;
    int n = 0, usados = 0;               // usados conta ocupados + removidos

    static size_t hash(const std::string& s) {   // hash polinomial (Horner)
        size_t h = 0;
        for (unsigned char c : s) h = h * 31 + c;
        return h;
    }

    void redimensiona() {
        std::vector<Slot> antigo = std::move(t);
        t.assign(antigo.size() * 2, Slot{});
        n = usados = 0;
        for (auto& s : antigo)
            if (s.estado == Estado::Ocupado) insere(s.chave, s.valor);
    }

public:
    explicit TabelaHash(int capacidade = 8) : t(capacidade) {}

    void insere(const std::string& k, int v) {
        if (2 * (usados + 1) > (int)t.size()) redimensiona();   // mantém α <= 0,5
        size_t i = hash(k) % t.size();
        int primeiroRemovido = -1;
        while (t[i].estado != Estado::Vazio) {
            if (t[i].estado == Estado::Ocupado && t[i].chave == k) { t[i].valor = v; return; }
            if (t[i].estado == Estado::Removido && primeiroRemovido < 0) primeiroRemovido = i;
            i = (i + 1) % t.size();
        }
        if (primeiroRemovido >= 0) i = primeiroRemovido;   // reaproveita a marca
        else usados++;
        t[i] = {Estado::Ocupado, k, v};
        n++;
    }

    const int* busca(const std::string& k) const {
        size_t i = hash(k) % t.size();
        while (t[i].estado != Estado::Vazio) {
            if (t[i].estado == Estado::Ocupado && t[i].chave == k) return &t[i].valor;
            i = (i + 1) % t.size();
        }
        return nullptr;
    }

    bool remove(const std::string& k) {
        size_t i = hash(k) % t.size();
        while (t[i].estado != Estado::Vazio) {
            if (t[i].estado == Estado::Ocupado && t[i].chave == k) {
                t[i].estado = Estado::Removido;
                n--;
                return true;
            }
            i = (i + 1) % t.size();
        }
        return false;
    }

    int tamanho() const { return n; }
    int capacidade() const { return t.size(); }
};

int main() {
    TabelaHash h;
    std::unordered_map<std::string, int> ref;
    for (int i = 0; i < 5000; i++) {
        std::string k = "chave" + std::to_string(i * 7 % 1000);
        if (i % 4 == 3) { h.remove(k); ref.erase(k); }
        else { h.insere(k, i); ref[k] = i; }
    }
    assert(h.tamanho() == (int)ref.size());
    for (auto& [k, v] : ref) assert(h.busca(k) && *h.busca(k) == v);
    assert(!h.busca("não existe"));
    std::cout << ref.size() << " chaves, capacidade " << h.capacidade() << "\n";
    std::cout << "Todos os testes passaram.\n";
    return 0;
}
