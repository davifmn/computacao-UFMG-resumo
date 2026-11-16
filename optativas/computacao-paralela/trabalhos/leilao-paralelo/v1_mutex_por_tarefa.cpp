// Algoritmo de leilão (Bertsekas) para o problema da atribuição.
// Versão 1 — OpenMP com um mutex por tarefa: os trabalhadores livres buscam o melhor
// e o segundo melhor objeto em paralelo; a atualização de preço/dono de cada tarefa
// fica protegida pelo mutex daquela tarefa (granularidade fina).

#include <iostream>
#include <vector>
#include <limits>
#include <chrono>
#include <iomanip>
#include <mutex>
#include <omp.h>
#include "geradores.h"


using namespace std;

pair<vector<int>, vector<double>> auction_algorithm_parallel(
        const vector<vector<double>>& cost, double epsilon = 1e-3, int num_threads = 8)
{
    int n = cost.size();

    vector<double> prices(n, 0.0);
    vector<int> assignment(n, -1);
    vector<int> task_owner(n, -1);

    // 🔐 um mutex por tarefa → granulação fina de lock        

    vector<mutex> task_locks(n);

    bool done = false;

    while (true) {
        bool all_assigned = true;

        // 🧵 paralelizando os workers
        #pragma omp parallel for num_threads(num_threads) schedule(dynamic)
        for (int worker = 0; worker < n; worker++) {
            if (assignment[worker] != -1) continue;

            // Se algum worker desatribuído existe, o loop externo continua
            #pragma omp atomic write
            all_assigned = false;

            double best_value = -numeric_limits<double>::infinity();
            double second_best = -numeric_limits<double>::infinity();
            int best_task = -1;

            // 🔍 busca independente (thread-safe)
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

            // 🔐 lock fino: cada tarefa tem o seu próprio mutex
            {
                lock_guard<mutex> guard(task_locks[best_task]);

                // atualiza preço
                prices[best_task] += bid;

                // desaloca dono anterior, se existir
                int prev_worker = task_owner[best_task];
                if (prev_worker != -1) {
                    assignment[prev_worker] = -1;
                }

                // faz a nova atribuição
                assignment[worker] = best_task;
                task_owner[best_task] = worker;
            }
        }

        if (all_assigned) break;
    }

    return {assignment, prices};
}

int run_prll1() {
    for(int iter = 0; iter < 15; iter++){
        int n = 5000;
        int num_threads = 8;

        vector<vector<int>> cost_int = gerador_matrizes_permutacao(n);
        vector<vector<double>> cost(n, vector<double>(n));
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                cost[i][j] = cost_int[i][j];

        auto start = chrono::high_resolution_clock::now();
        auto result = auction_algorithm_parallel(cost, 1e-3, num_threads);
        auto end = chrono::high_resolution_clock::now();

        double ms = chrono::duration<double, milli>(end - start).count();

        cout << "n = " << n << " Execution time (parallel, " << num_threads << " threads): \n"
             << ms << " ms\n";
    }
    return 0;
}
