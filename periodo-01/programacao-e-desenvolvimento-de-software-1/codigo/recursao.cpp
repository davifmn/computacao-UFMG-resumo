// Recursão: fatorial, Fibonacci ingênuo e Fibonacci com memoização.
// Compile: g++ -std=c++17 -Wall -Wextra recursao.cpp -o recursao && ./recursao
#include <cassert>
#include <iostream>
#include <vector>

long long chamadas = 0;  // conta quantas vezes as funções foram chamadas

long long fatorial(int n) {
    chamadas++;
    if (n <= 1)
        return 1;                // caso base
    return n * fatorial(n - 1);  // passo recursivo
}

long long fib(int n) {
    chamadas++;
    if (n < 2)
        return n;  // casos base: fib(0)=0, fib(1)=1
    return fib(n - 1) + fib(n - 2);
}

long long fibMemo(int n, std::vector<long long> &memo) {
    chamadas++;
    if (n < 2)
        return n;
    if (memo[n] != -1)
        return memo[n];  // já calculado: reaproveita!
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    return memo[n];
}

// Versão iterativa: mesma resposta, O(n) de tempo e O(1) de memória.
long long fibIterativo(int n) {
    long long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        long long c = a + b;
        a = b;
        b = c;
    }
    return a;
}

int main() {
    assert(fatorial(0) == 1);
    assert(fatorial(5) == 120);
    assert(fatorial(20) == 2432902008176640000LL);

    for (int n : {10, 20, 30}) {
        chamadas = 0;
        long long r1 = fib(n);
        long long ingenuo = chamadas;

        chamadas = 0;
        std::vector<long long> memo(n + 1, -1);
        long long r2 = fibMemo(n, memo);
        long long memoizado = chamadas;

        assert(r1 == r2 && r2 == fibIterativo(n));
        std::cout << "fib(" << n << ") = " << r1 << " | chamadas: ingênuo = " << ingenuo
                  << ", com memoização = " << memoizado << "\n";
    }
    std::cout << "Todos os testes passaram.\n";
    return 0;
}
