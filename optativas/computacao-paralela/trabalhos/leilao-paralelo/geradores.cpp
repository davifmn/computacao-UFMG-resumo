#include "geradores.h"
#include <iostream>
#include <random>
#include <algorithm>
#include <cmath>

using namespace std;

int random_between_1_and_n(int n) {
    static random_device rd;
    static mt19937 gen(rd());
    uniform_int_distribution<> dist(1, n);
    return dist(gen);
}



vector<vector<int>> gerar_matriz_base(int n) {
    static random_device rd;
    static mt19937 gen(rd());
    uniform_int_distribution<> dist(1, n);

    vector<vector<int>> cost(n, vector<int>(n));

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cost[i][j] = dist(gen);   // qualquer número entre 1 e n
        }
    }

    return cost;
}




// Novo gerador de matriz PERMUTACAO
vector<vector<int>> gerador_matrizes_permutacao(int n) {
    static random_device rd;
    static mt19937 gen(rd());

    vector<vector<int>> cost(n, vector<int>(n));

    for (int i = 0; i < n; i++) {
        // cria lista 1..num_tasks
        vector<int> linha(n);
        for (int j = 0; j < n; j++) {
            linha[j] = j + 1;
        }

        // embaralha para gerar ranking aleatório único por trabalhador
        shuffle(linha.begin(), linha.end(), gen);

        // salva na matriz
        cost[i] = linha;
    }

    //3 1 5 2 4
    //2 5 4 1 3
    //1 3 2 4 5
    return cost;
}


vector<vector<double>> gerar_matriz_custo_reverso(int n) {
    vector<vector<double>> cost(n, vector<double>(n));

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            // distância até a anti-diagonal
            cost[i][j] = abs(j - (n - 1 - i)) + 1;
        }
    }

    //4 3 2 1
    //3 2 1 2
    //2 1 2 3
    //1 2 3 4
    return cost;
}


vector<vector<int>> gerar_matriz_triangular(int n) {
    vector<vector<int>> cost(n, vector<int>(n));

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cost[i][j] = abs(i - j);   // distância entre trabalhador e tarefa (já é int)
        }
    }

    //0 1 2 3
    //1 0 1 2
    //2 1 0 1
    //3 2 1 0
    return cost;
}


vector<vector<int>> gerar_matriz_quase_empatada(int n) {
    static random_device rd;
    static mt19937 gen(rd());
    // ruído ~5% de n; vamos gerar em double e arredondar para int
    uniform_real_distribution<double> ruido(-0.05 * n, 0.05 * n);

    vector<vector<int>> cost(n, vector<int>(n));

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            double val = n + ruido(gen); 
            cost[i][j] = static_cast<int>(std::round(val));
        }
    }

    return cost;
}
