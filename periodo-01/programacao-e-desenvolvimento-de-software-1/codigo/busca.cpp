// Busca sequencial O(n) e busca binária O(log n).
// Compile: g++ -std=c++17 -Wall -Wextra busca.cpp -o busca && ./busca
#include <cassert>
#include <iostream>

int buscaSequencial(const int v[], int n, int x) {
    for (int i = 0; i < n; i++) {
        if (v[i] == x)
            return i;  // achou!
    }
    return -1;  // não está no vetor
}

// Pré-condição: v está em ordem crescente.
int buscaBinaria(const int v[], int n, int x) {
    int ini = 0, fim = n - 1;
    while (ini <= fim) {
        int meio = ini + (fim - ini) / 2;  // evita overflow de (ini + fim)
        if (v[meio] == x)
            return meio;
        else if (v[meio] < x)
            ini = meio + 1;  // descarta a metade esquerda
        else
            fim = meio - 1;  // descarta a metade direita
    }
    return -1;
}

// A mesma ideia, escrita de forma recursiva.
int buscaBinariaRec(const int v[], int ini, int fim, int x) {
    if (ini > fim) return -1;
    int meio = ini + (fim - ini) / 2;
    if (v[meio] == x) return meio;
    if (v[meio] < x) return buscaBinariaRec(v, meio + 1, fim, x);
    return buscaBinariaRec(v, ini, meio - 1, x);
}

int main() {
    int v[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int n = sizeof(v) / sizeof(v[0]);

    for (int i = 0; i < n; i++) {
        assert(buscaSequencial(v, n, v[i]) == i);
        assert(buscaBinaria(v, n, v[i]) == i);
        assert(buscaBinariaRec(v, 0, n - 1, v[i]) == i);
    }
    for (int x : {0, 3, 100}) {
        assert(buscaSequencial(v, n, x) == -1);
        assert(buscaBinaria(v, n, x) == -1);
        assert(buscaBinariaRec(v, 0, n - 1, x) == -1);
    }
    std::cout << "23 está na posição " << buscaBinaria(v, n, 23) << "\n";
    std::cout << "Todos os testes passaram.\n";
    return 0;
}
