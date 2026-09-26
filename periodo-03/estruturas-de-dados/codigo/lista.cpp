// Lista simplesmente encadeada com gerenciamento correto de memória.
// Compile: g++ -std=c++17 -Wall -Wextra lista.cpp -o lista && ./lista
#include <cassert>
#include <initializer_list>
#include <iostream>
#include <vector>

class Lista {
    struct No {
        int valor;
        No* prox;
    };
    No* cabeca = nullptr;
    int tamanho_ = 0;

public:
    Lista() = default;
    Lista(std::initializer_list<int> valores) {
        for (int v : valores) insereFim(v);
    }
    Lista(const Lista& outra) {                 // cópia profunda
        for (No* p = outra.cabeca; p != nullptr; p = p->prox) insereFim(p->valor);
    }
    Lista& operator=(Lista outra) {             // copy-and-swap
        std::swap(cabeca, outra.cabeca);
        std::swap(tamanho_, outra.tamanho_);
        return *this;
    }
    ~Lista() {                                  // libera todos os nós
        while (cabeca != nullptr) {
            No* prox = cabeca->prox;
            delete cabeca;
            cabeca = prox;
        }
    }

    void insereInicio(int x) {
        cabeca = new No{x, cabeca};
        tamanho_++;
    }

    void insereFim(int x) {
        No* novo = new No{x, nullptr};
        tamanho_++;
        if (cabeca == nullptr) { cabeca = novo; return; }
        No* atual = cabeca;
        while (atual->prox != nullptr) atual = atual->prox;
        atual->prox = novo;
    }

    void insereOrdenado(int x) {
        No* novo = new No{x, nullptr};
        No* anterior = nullptr;
        No* atual = cabeca;
        while (atual != nullptr && atual->valor < x) {
            anterior = atual;
            atual = atual->prox;
        }
        novo->prox = atual;
        if (anterior == nullptr) cabeca = novo;
        else anterior->prox = novo;
        tamanho_++;
    }

    bool busca(int x) const {
        for (No* atual = cabeca; atual != nullptr; atual = atual->prox)
            if (atual->valor == x) return true;
        return false;
    }

    bool remove(int x) {
        No* anterior = nullptr;
        No* atual = cabeca;
        while (atual != nullptr && atual->valor != x) {
            anterior = atual;
            atual = atual->prox;
        }
        if (atual == nullptr) return false;
        if (anterior == nullptr) cabeca = atual->prox;
        else anterior->prox = atual->prox;
        delete atual;
        tamanho_--;
        return true;
    }

    void inverte() {                            // clássico de prova: O(n), O(1) de memória
        No* anterior = nullptr;
        while (cabeca != nullptr) {
            No* prox = cabeca->prox;
            cabeca->prox = anterior;
            anterior = cabeca;
            cabeca = prox;
        }
        cabeca = anterior;
    }

    int tamanho() const { return tamanho_; }

    std::vector<int> valores() const {
        std::vector<int> v;
        for (No* p = cabeca; p != nullptr; p = p->prox) v.push_back(p->valor);
        return v;
    }
};

int main() {
    Lista l;
    for (int x : {15, 3, 23, 8}) l.insereOrdenado(x);
    assert((l.valores() == std::vector<int>{3, 8, 15, 23}));
    l.insereInicio(1);
    l.insereFim(30);
    assert(l.tamanho() == 6 && l.busca(23) && !l.busca(7));

    assert(l.remove(1) && l.remove(30) && l.remove(15) && !l.remove(99));
    assert((l.valores() == std::vector<int>{3, 8, 23}));

    Lista copia = l;                            // não pode compartilhar nós
    copia.insereFim(99);
    assert(l.tamanho() == 3 && copia.tamanho() == 4);

    Lista r = {1, 2, 3, 4};
    r.inverte();
    assert((r.valores() == std::vector<int>{4, 3, 2, 1}));

    std::cout << "Todos os testes passaram.\n";
    return 0;
}
