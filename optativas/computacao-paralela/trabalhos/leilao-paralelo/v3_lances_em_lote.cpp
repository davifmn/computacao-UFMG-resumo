// Algoritmo de leilão (Bertsekas) para o problema da atribuição.
// Versão 3 — leilão de Jacobi em lote (OpenMP): numa rodada, cada thread guarda o
// maior lance que viu para cada tarefa num buffer local; depois uma redução escolhe o
// vencedor de cada tarefa. Sem travas na fase de lances.

#include <iostream>
#include <vector>
#include <limits>
#include <chrono>
#include <iomanip>
#include <omp.h>
#include "geradores.h"

using namespace std;

struct BenchStats {
    long long rounds = 0;
    long long proposals = 0;
    long long accepted = 0;
};

pair<vector<int>, vector<double>> auction_algorithm_batched(
    const vector<vector<double>>& cost,
    double epsilon = 1e-3,
    int num_threads = 8,
    BenchStats* stats = nullptr)
{
    int n = (int)cost.size();
    if (n == 0) return {{}, {}};

    // Shared global state
    vector<double> prices(n, 0.0);       // preço de cada tarefa
    vector<int> assignment(n, -1);       // worker -> task
    vector<int> task_owner(n, -1);       // task -> worker

    // contador de não-atribuídos
    int unassigned_count = n;

    // Para cada thread teremos um buffer local de propostas:
    // local_best_bid[t][task]  - maior bid para 'task' feito por thread t no round
    // local_best_worker[t][task] - quem (worker) fez esse bid
    int T = num_threads;
    vector<vector<double>> local_best_bid(T, vector<double>(n, -numeric_limits<double>::infinity()));
    vector<vector<int>>    local_best_worker(T, vector<int>(n, -1));

    // Partition de workers por thread: [start[t], end[t])
    vector<int> start(T), end(T);
    for (int t = 0; t < T; ++t) {
        start[t] = (n * t) / T;
        end[t]   = (n * (t + 1)) / T;
    }

    // Rounds até todos atribuídos
    int round = 0;
    while (unassigned_count > 0) {
        ++round;
        if (stats) stats->rounds = round;

        // 1) Limpa buffers locais (cada thread limpe sua linha)
        #pragma omp parallel for num_threads(T) schedule(static)
        for (int t = 0; t < T; ++t) {
            for (int j = 0; j < n; ++j) {
                local_best_bid[t][j] = -numeric_limits<double>::infinity();
                local_best_worker[t][j] = -1;
            }
        }

        // 2) Cada thread processa seu bloco de workers e escreve UMA proposta por worker
        #pragma omp parallel num_threads(T)
        {
            int tid = omp_get_thread_num();
            int s = start[tid];
            int e = end[tid];

            long long local_proposals = 0;

            for (int worker = s; worker < e; ++worker) {
                // se já atribuído, pula
                if (assignment[worker] != -1) continue;

                // calcula best e second best (leitura de prices)
                double best_value = -numeric_limits<double>::infinity();
                double second_best = -numeric_limits<double>::infinity();
                int best_task = -1;

                for (int task = 0; task < n; ++task) {
                    double net = cost[worker][task] - prices[task];
                    if (net > best_value) {
                        second_best = best_value;
                        best_value = net;
                        best_task = task;
                    } else if (net > second_best) {
                        second_best = net;
                    }
                }

                if (best_task == -1) continue;

                double bid = (best_value - second_best) + epsilon;

                // Guarda a melhor proposta daquela thread para a tarefa
                if (bid > local_best_bid[tid][best_task]) {
                    local_best_bid[tid][best_task] = bid;
                    local_best_worker[tid][best_task] = worker;
                }
                ++local_proposals;
            }

            if (stats) {
                #pragma omp atomic
                stats->proposals += local_proposals;
            }
        } // fim parallel workers

        // 3) Redução: para cada tarefa, escolher a melhor proposta entre as threads
        //    Esse loop pode ser paralelo sobre tarefas porque cada tarefa atualiza indices distintos.
        int accepted_this_round = 0;
        #pragma omp parallel for num_threads(T) reduction(+:accepted_this_round) schedule(static)
        for (int task = 0; task < n; ++task) {
            double best_bid = -numeric_limits<double>::infinity();
            int  best_worker = -1;
            int  best_thread = -1;

            // encontra a melhor proposta para esta tarefa entre threads
            for (int t = 0; t < T; ++t) {
                double b = local_best_bid[t][task];
                if (b > best_bid) {
                    best_bid = b;
                    best_worker = local_best_worker[t][task];
                    best_thread = t;
                }
            }

            // se não há proposta, pula
            if (best_worker == -1) continue;

            // aplica a atualização globalmente (preço, dono, assignment)
            prices[task] += best_bid;

            int prev_owner = task_owner[task];
            if (prev_owner != -1) {
                // libera o worker anterior
                assignment[prev_owner] = -1;
            } else {
                // tarefa estava livre antes; vamos reduzir o contador global depois (no região serial)
            }

            // atribui a nova owner
            task_owner[task] = best_worker;

            // marca o worker como atribuído à tarefa (se ele já não estiver atribuído a outra)
            assignment[best_worker] = task;

            ++accepted_this_round;
        } // fim parallel reduction

        // 4) Atualiza o unassigned_count de forma consistente:
        //    recalculamos de maneira simples (poderia ser otimizado)
        int new_unassigned = 0;
        for (int w = 0; w < n; ++w) if (assignment[w] == -1) ++new_unassigned;
        unassigned_count = new_unassigned;

        if (stats) stats->accepted += accepted_this_round;

        // Nota: este modelo garante que cada worker faz no máximo 1 proposta por round,
        // e assim não ocorre que o mesmo worker seja atribuído a mais de uma tarefa no mesmo round.
        // A sincronização ocorre implicitamente na fase de redução.
    } // fim while

    if (stats) {
        stats->rounds = round;
    }

    return {assignment, prices};
}

int run_prll3(int n = 5000, int num_threads = -1) {
    for(int iter = 0; iter < 15; iter++){
        if (num_threads <= 0) {
            num_threads = omp_get_max_threads();
            if (num_threads <= 0) num_threads = 8;
        }

        cout << "Batched Auction - n=" << n << " threads=" << num_threads << "\n";

        vector<vector<int>> cost_int = gerador_matrizes_permutacao(n);
        vector<vector<double>> cost(n, vector<double>(n));
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                cost[i][j] = static_cast<double>(cost_int[i][j]);

        BenchStats stats;

        auto t0 = chrono::high_resolution_clock::now();
        auto sol = auction_algorithm_batched(cost, 1e-3, num_threads, &stats);
        auto t1 = chrono::high_resolution_clock::now();
        double ms = chrono::duration<double, milli>(t1 - t0).count();

        cout << fixed << setprecision(3);
        cout << "Time (ms): " << ms << "\n";
        cout << "Rounds: " << stats.rounds << "\n";
        cout << "Proposals (approx): " << stats.proposals << "\n";
        cout << "Accepted (per round total): " << stats.accepted << "\n";

        vector<int> freq(n, 0);
        for (int i = 0; i < n; ++i) {
            int a = sol.first[i];
            if (a >= 0 && a < n) freq[a]++;
        }
        int collisions = 0;
        for (int j = 0; j < n; ++j) if (freq[j] != 1) collisions++;
        cout << "non-unique tasks count (should be 0): " << collisions << "\n";
    }
    return 0;
}

/// ------------------ main para bench ------------------

