// Algoritmos de ordenação elementares — O(n²).
// Compile: g++ -std=c++17 -Wall -Wextra ordenacao.cpp -o ordenacao && ./ordenacao
#include <cassert>
#include <iostream>
#include <utility>  // std::swap

void bubbleSort(int v[], int n) {
    for (int i = 0; i < n - 1; i++) {
        bool trocou = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (v[j] > v[j + 1]) {
                std::swap(v[j], v[j + 1]);
                trocou = true;
            }
        }
        if (!trocou) break;  // nenhuma troca: já está ordenado
    }
}

void selectionSort(int v[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int menor = i;
        for (int j = i + 1; j < n; j++) {
            if (v[j] < v[menor])
                menor = j;
        }
        std::swap(v[i], v[menor]);
    }
}

void insertionSort(int v[], int n) {
    for (int i = 1; i < n; i++) {
        int chave = v[i];
        int j = i - 1;
        while (j >= 0 && v[j] > chave) {
            v[j + 1] = v[j];  // empurra para a direita
            j--;
        }
        v[j + 1] = chave;
    }
}

bool ordenado(const int v[], int n) {
    for (int i = 1; i < n; i++)
        if (v[i - 1] > v[i]) return false;
    return true;
}

void imprime(const int v[], int n) {
    for (int i = 0; i < n; i++) std::cout << v[i] << (i + 1 < n ? ", " : "\n");
}

int main() {
    void (*algoritmos[])(int[], int) = {bubbleSort, selectionSort, insertionSort};
    const char *nomes[] = {"bubble", "selection", "insertion"};

    for (int a = 0; a < 3; a++) {
        int v[] = {38, 27, 43, 3, 9, 82, 10, 21};
        int n = sizeof(v) / sizeof(v[0]);
        algoritmos[a](v, n);
        assert(ordenado(v, n));
        std::cout << nomes[a] << ": ";
        imprime(v, n);

        int vazio[1] = {42};
        algoritmos[a](vazio, 1);          // n = 1 não pode quebrar
        int iguais[] = {5, 5, 5};
        algoritmos[a](iguais, 3);
        assert(ordenado(iguais, 3));
    }
    std::cout << "Todos os testes passaram.\n";
    return 0;
}
