// Ponteiros, aritmética de ponteiros e alocação dinâmica.
// Compile: g++ -std=c++17 -Wall -Wextra ponteiros.cpp -o ponteiros && ./ponteiros
#include <cassert>
#include <iostream>

// Passagem "por ponteiro": a função altera as variáveis de quem chamou.
void troca(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

// Em C++ também existe passagem por referência (sintaxe mais limpa).
void trocaRef(int &a, int &b) {
    int tmp = a;
    a = b;
    b = tmp;
}

// Aloca um vetor no heap: o tamanho só é conhecido em tempo de execução.
int *criaVetor(int n, int valorInicial) {
    int *v = new int[n];
    for (int i = 0; i < n; i++) v[i] = valorInicial + i;
    return v;  // o vetor sobrevive ao fim da função (está no heap)
}

int main() {
    int x = 10;
    int y = 20;
    int *p = &x;  // p guarda o endereço de x
    *p = 30;      // altera x através de p
    assert(x == 30);

    p = &y;       // agora p aponta para y
    *p = *p + 5;  // y = y + 5
    assert(y == 25);

    int v[3] = {1, 2, 3};
    int *q = v;   // v "vira" &v[0]
    q++;          // avança sizeof(int) bytes
    *q = 99;      // v[1] = 99
    assert(v[1] == 99);
    assert(*(v + 2) == v[2]);  // v[i] é açúcar sintático para *(v + i)

    std::cout << "endereço de v[0]: " << static_cast<void *>(&v[0]) << "\n";
    std::cout << "endereço de v[1]: " << static_cast<void *>(&v[1])
              << "  (diferença de " << sizeof(int) << " bytes)\n";

    troca(&x, &y);
    assert(x == 25 && y == 30);
    trocaRef(x, y);
    assert(x == 30 && y == 25);

    int *h = new int(7);  // aloca um int no heap
    assert(*h == 7);
    delete h;             // libera
    h = nullptr;          // evita ponteiro pendente

    int *w = criaVetor(5, 100);
    assert(w[4] == 104);
    delete[] w;           // vetores alocados com new[] usam delete[]

    std::cout << "Todos os testes passaram.\n";
    return 0;
}
