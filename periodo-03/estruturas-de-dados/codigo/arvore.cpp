// Árvore AVL: inserção, remoção, busca e percursos.
// Compile: g++ -std=c++17 -Wall -Wextra arvore.cpp -o arvore && ./arvore
#include <algorithm>
#include <cassert>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <set>
#include <vector>

class AVL {
    struct No {
        int chave;
        int altura = 1;
        No* esq = nullptr;
        No* dir = nullptr;
        explicit No(int c) : chave(c) {}
    };
    No* raiz = nullptr;

    static int altura(No* n) { return n ? n->altura : 0; }
    static void atualiza(No* n) { n->altura = 1 + std::max(altura(n->esq), altura(n->dir)); }
    static int fb(No* n) { return altura(n->esq) - altura(n->dir); }

    static No* rotacaoDireita(No* y) {
        No* x = y->esq;
        y->esq = x->dir;
        x->dir = y;
        atualiza(y);
        atualiza(x);
        return x;
    }
    static No* rotacaoEsquerda(No* x) {
        No* y = x->dir;
        x->dir = y->esq;
        y->esq = x;
        atualiza(x);
        atualiza(y);
        return y;
    }

    static No* balanceia(No* n) {
        atualiza(n);
        if (fb(n) > 1) {
            if (fb(n->esq) < 0) n->esq = rotacaoEsquerda(n->esq);   // LR
            return rotacaoDireita(n);                               // LL
        }
        if (fb(n) < -1) {
            if (fb(n->dir) > 0) n->dir = rotacaoDireita(n->dir);    // RL
            return rotacaoEsquerda(n);                              // RR
        }
        return n;
    }

    static No* insere(No* n, int x) {
        if (n == nullptr) return new No(x);
        if (x < n->chave) n->esq = insere(n->esq, x);
        else if (x > n->chave) n->dir = insere(n->dir, x);
        else return n;
        return balanceia(n);
    }

    static No* remove(No* n, int x) {
        if (n == nullptr) return nullptr;
        if (x < n->chave) n->esq = remove(n->esq, x);
        else if (x > n->chave) n->dir = remove(n->dir, x);
        else {
            if (n->esq == nullptr || n->dir == nullptr) {
                No* filho = n->esq ? n->esq : n->dir;
                delete n;
                return filho;
            }
            No* suc = n->dir;
            while (suc->esq) suc = suc->esq;
            n->chave = suc->chave;
            n->dir = remove(n->dir, suc->chave);
        }
        return balanceia(n);
    }

    static void libera(No* n) {        // pós-ordem: filhos antes do pai
        if (!n) return;
        libera(n->esq);
        libera(n->dir);
        delete n;
    }

    static bool valida(No* n, long lo, long hi, int& h) {
        if (!n) { h = 0; return true; }
        int he, hd;
        if (n->chave <= lo || n->chave >= hi) return false;
        if (!valida(n->esq, lo, n->chave, he) || !valida(n->dir, n->chave, hi, hd)) return false;
        h = 1 + std::max(he, hd);
        return std::abs(he - hd) <= 1 && n->altura == h;
    }

public:
    AVL() = default;
    AVL(const AVL&) = delete;            // para simplificar, sem cópia
    AVL& operator=(const AVL&) = delete;
    ~AVL() { libera(raiz); }

    void insere(int x) { raiz = insere(raiz, x); }
    void remove(int x) { raiz = remove(raiz, x); }
    bool busca(int x) const {
        for (No* n = raiz; n; n = x < n->chave ? n->esq : n->dir)
            if (n->chave == x) return true;
        return false;
    }
    int altura() const { return altura(raiz); }
    bool valida() const { int h; return valida(raiz, -2147483649L, 2147483648L, h); }

    std::vector<int> emOrdem() const {
        std::vector<int> out;
        std::function<void(No*)> rec = [&](No* n) {
            if (!n) return;
            rec(n->esq);
            out.push_back(n->chave);
            rec(n->dir);
        };
        rec(raiz);
        return out;
    }
};

int main() {
    AVL t;
    for (int i = 1; i <= 1000; i++) t.insere(i);   // em ordem: o pior caso de uma ABB comum
    assert(t.valida());
    assert(t.altura() <= 11);                        // 1,44·log2(1000) ≈ 14; na prática 10
    std::cout << "1000 chaves inseridas em ordem: altura " << t.altura() << "\n";

    std::srand(42);
    AVL u;
    std::set<int> ref;
    for (int op = 0; op < 20000; op++) {
        int x = std::rand() % 500;
        if (std::rand() % 3) { u.insere(x); ref.insert(x); }
        else { u.remove(x); ref.erase(x); }
    }
    assert(u.valida());
    assert(u.emOrdem() == std::vector<int>(ref.begin(), ref.end()));
    assert(u.busca(*ref.begin()) && !u.busca(-1));

    std::cout << "Todos os testes passaram.\n";
    return 0;
}
