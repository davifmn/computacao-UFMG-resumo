// Algoritmo de leilão (Bertsekas) para o problema da atribuição.
// Versão 0 — sequencial (Gauss-Seidel): um trabalhador livre por vez dá o seu lance.
// É a referência de tempo e de resultado para as versões paralelas.

#include <iostream>
#include <vector>
#include <limits>
#include <chrono>
#include <iomanip>
#include "geradores.h"

using namespace std;

pair<vector<int>, vector<double>> auction_algorithm(
        const vector<vector<double>>& cost, double epsilon = 1e-3)
{
    int n = cost.size();

    vector<double> prices(n, 0.0);
    vector<int> assignment(n, -1);
    vector<int> task_owner(n, -1);

    bool done = false;

    while (true) {
        bool all_assigned = true;

        for (int worker = 0; worker < n; worker++) {
            if (assignment[worker] != -1) continue;
            all_assigned = false;

            double best_value = -numeric_limits<double>::infinity();
            double second_best = -numeric_limits<double>::infinity();
            int best_task = -1;

            // calcula valores líquidos
            for (int task = 0; task < n; task++) {
                double net = cost[worker][task] - prices[task];

                if (net > best_value) {
                    second_best = best_value;
                    best_value = net;
                    best_task = task;
                } else if (net > second_best) {
                    second_best = net;
                }
            }

            double bid = (best_value - second_best) + epsilon;

            // atualiza o preço
            prices[best_task] += bid;

            int prev_worker = task_owner[best_task];
            if (prev_worker != -1) {
                assignment[prev_worker] = -1;
            }

            assignment[worker] = best_task;
            task_owner[best_task] = worker;
        }

        if (all_assigned) break;
    }

    return {assignment, prices};
}

int run_baseline() {

    //usar tamanho fixo
    for(int iter = 0; iter < 15; iter++){
        int n = 5000;

        // gera matriz base com inteiros e converte para double
        vector<vector<int>> cost_int = gerador_matrizes_permutacao(n);
        vector<vector<double>> cost(n, vector<double>(n));
        for (int i = 0; i < n; ++i) {
            for (int j = 0; j < n; ++j) {
                cost[i][j] = static_cast<double>(cost_int[i][j]);
            }
        }

        auto start = chrono::high_resolution_clock::now();
        auto result = auction_algorithm(cost);
        auto end = chrono::high_resolution_clock::now();

        double ms = chrono::duration<double, milli>(end - start).count();

        cout << "n = " << n <<"\n\nExecution time: " << ms << " ms\n";
    }
    return 0;
}
