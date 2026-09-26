// Merge sort, quicksort e heapsort, comparados com std::sort.
// Compile: g++ -std=c++17 -O2 -Wall -Wextra ordenacao.cpp -o ordenacao && ./ordenacao
#include <algorithm>
#include <cassert>
#include <chrono>
#include <iostream>
#include <random>
#include <vector>

void intercala(std::vector<int>& v, int ini, int meio, int fim, std::vector<int>& aux) {
    int i = ini, j = meio, k = 0;
    while (i < meio && j < fim) aux[k++] = v[i] <= v[j] ? v[i++] : v[j++];
    while (i < meio) aux[k++] = v[i++];
    while (j < fim) aux[k++] = v[j++];
    std::copy(aux.begin(), aux.begin() + k, v.begin() + ini);
}

void mergeSort(std::vector<int>& v, int ini, int fim, std::vector<int>& aux) {
    if (fim - ini <= 1) return;
    int meio = (ini + fim) / 2;
    mergeSort(v, ini, meio, aux);
    mergeSort(v, meio, fim, aux);
    intercala(v, ini, meio, fim, aux);
}

void mergeSort(std::vector<int>& v) {
    std::vector<int> aux(v.size());
    mergeSort(v, 0, v.size(), aux);
}

int particiona(std::vector<int>& v, int ini, int fim, std::mt19937& rng) {
    std::swap(v[fim], v[std::uniform_int_distribution<int>(ini, fim)(rng)]);   // pivô aleatório
    int pivo = v[fim], i = ini - 1;
    for (int j = ini; j < fim; j++)
        if (v[j] <= pivo) std::swap(v[++i], v[j]);
    std::swap(v[i + 1], v[fim]);
    return i + 1;
}

void quickSort(std::vector<int>& v, int ini, int fim, std::mt19937& rng) {
    while (ini < fim) {                    // recursão só no lado menor: pilha O(log n)
        int p = particiona(v, ini, fim, rng);
        if (p - ini < fim - p) { quickSort(v, ini, p - 1, rng); ini = p + 1; }
        else { quickSort(v, p + 1, fim, rng); fim = p - 1; }
    }
}

void quickSort(std::vector<int>& v) {
    std::mt19937 rng(123);
    quickSort(v, 0, (int)v.size() - 1, rng);
}

void desce(std::vector<int>& v, int n, int i) {
    while (true) {
        int maior = i, e = 2 * i + 1, d = 2 * i + 2;
        if (e < n && v[e] > v[maior]) maior = e;
        if (d < n && v[d] > v[maior]) maior = d;
        if (maior == i) return;
        std::swap(v[i], v[maior]);
        i = maior;
    }
}

void heapSort(std::vector<int>& v) {
    int n = v.size();
    for (int i = n / 2 - 1; i >= 0; i--) desce(v, n, i);
    for (int fim = n - 1; fim > 0; fim--) {
        std::swap(v[0], v[fim]);
        desce(v, fim, 0);
    }
}

template <typename F>
double mede(F ordena, std::vector<int> v) {
    auto t0 = std::chrono::steady_clock::now();
    ordena(v);
    auto t1 = std::chrono::steady_clock::now();
    assert(std::is_sorted(v.begin(), v.end()));
    return std::chrono::duration<double, std::milli>(t1 - t0).count();
}

int main() {
    std::mt19937 rng(7);
    for (int n : {0, 1, 2, 3, 10, 100, 1000}) {
        std::vector<int> v(n);
        for (int& x : v) x = rng() % 50;   // com muitas repetições
        for (auto f : {mergeSort, quickSort, heapSort}) {
            std::vector<int> w = v, ref = v;
            void (*g)(std::vector<int>&) = f;
            g(w);
            std::sort(ref.begin(), ref.end());
            assert(w == ref);
        }
    }

    std::vector<int> grande(1'000'000);
    for (int& x : grande) x = rng();
    std::vector<int> ordenado = grande;
    std::sort(ordenado.begin(), ordenado.end());
    std::cout << "1 milhão de inteiros (ms):\n";
    std::cout << "  merge sort : " << mede([](auto& v) { mergeSort(v); }, grande) << "\n";
    std::cout << "  quicksort  : " << mede([](auto& v) { quickSort(v); }, grande) << "\n";
    std::cout << "  heapsort   : " << mede([](auto& v) { heapSort(v); }, grande) << "\n";
    std::cout << "  std::sort  : " << mede([](auto& v) { std::sort(v.begin(), v.end()); }, grande) << "\n";
    std::cout << "  quicksort em vetor já ordenado (pivô aleatório evita o n²): "
              << mede([](auto& v) { quickSort(v); }, ordenado) << "\n";
    std::cout << "Todos os testes passaram.\n";
    return 0;
}
