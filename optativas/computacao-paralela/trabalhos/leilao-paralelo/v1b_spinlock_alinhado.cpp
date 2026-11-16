// Algoritmo de leilão (Bertsekas) para o problema da atribuição.
// Versão 1b — igual à 1, mas troca std::mutex por spinlocks alinhados em 64 bytes
// (uma linha de cache por trava) para evitar falso compartilhamento.

#include <iostream>
#include <vector>
#include <limits>
#include <chrono>
#include <iomanip>
#include <atomic>
#include <omp.h>
#include <thread>
#include "geradores.h"

using namespace std;

// --- OTIMIZAÇÃO: Spinlock alinhado para evitar False Sharing ---
struct alignas(64) PaddedSpinlock {
    std::atomic_flag flag = ATOMIC_FLAG_INIT;

    void acquire() {
        while (flag.test_and_set(std::memory_order_acquire)) {
            // Dica para a CPU que estamos num loop de espera (spin-wait)
            #if defined(__x86_64__) || defined(_M_X64)
                __builtin_ia32_pause(); 
            #elif defined(__aarch64__)
                asm volatile("yield");
            #else
                std::this_thread::yield();
            #endif
        }
    }

    void release() {
        flag.clear(std::memory_order_release);
    }
};

pair<vector<int>, vector<double>> auction_algorithm_parallel_opt(
        const vector<vector<double>>& cost, double epsilon = 1e-3, int num_threads = 8)
{
    int n = cost.size();

    vector<double> prices(n, 0.0);
    vector<int> assignment(n, -1);
    vector<int> task_owner(n, -1);

    // Substituindo vector<mutex> por vector<PaddedSpinlock>
    vector<PaddedSpinlock> task_locks(n);

    // Variável atômica para checar convergência sem locks pesados
    atomic<bool> all_assigned;

    while (true) {
        all_assigned.store(true, memory_order_relaxed);

        #pragma omp parallel for num_threads(num_threads) schedule(dynamic, 64)
        for (int worker = 0; worker < n; worker++) {
            // Leitura relaxada é segura aqui (double check optimization)
            if (assignment[worker] != -1) continue;

            all_assigned.store(false, memory_order_relaxed);

            double best_value = -numeric_limits<double>::infinity();
            double second_best = -numeric_limits<double>::infinity();
            int best_task = -1;

            // Fase de Busca (livre de locks)
            for (int task = 0; task < n; task++) {
                // Leitura de prices pode ser relaxada (snapshot inconsistente é tolerável no Auction)
                double cur_price = prices[task];
                double net = cost[worker][task] - cur_price;

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

            // Fase de Atualização (Lock Fino e Rápido)
            task_locks[best_task].acquire();

            // O lance foi calculado com o preço lido SEM trava, que outra thread pode ter
            // aumentado desde então. O preço oferecido é preço_lido + lance =
            // benefício - segundo_melhor + epsilon; se ele não supera o preço atual, o
            // lance perdeu e o trabalhador tenta de novo na próxima rodada. Somar o lance
            // ao preço atual (versão original) cobrava a mais e às vezes saía do ótimo.
            double oferta = cost[worker][best_task] - best_value + bid;
            if (oferta <= prices[best_task]) { task_locks[best_task].release(); continue; }
            prices[best_task] = oferta;
            int prev_worker = task_owner[best_task];
            
            task_owner[best_task] = worker;
            assignment[worker] = best_task;
            
            if (prev_worker != -1) {
                assignment[prev_worker] = -1;
            }

            task_locks[best_task].release();
        }

        if (all_assigned.load(memory_order_relaxed)) break;
    }

    return {assignment, prices};
}

int run_prll1_opt() {
    // Loop de benchmark reduzido para teste rápido
    for(int iter = 0; iter < 15; iter++){
        int n = 5000;
        int num_threads = 8;

        vector<vector<int>> cost_int = gerador_matrizes_permutacao(n);
        vector<vector<double>> cost(n, vector<double>(n));
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                cost[i][j] = cost_int[i][j];

        auto start = chrono::high_resolution_clock::now();
        auto result = auction_algorithm_parallel_opt(cost, 1e-3, num_threads);
        auto end = chrono::high_resolution_clock::now();

        double ms = chrono::duration<double, milli>(end - start).count();

        cout << "PRLL1 OPT (Spinlock) n=" << n << ": " << ms << " ms\n";
    }
    return 0;
}

