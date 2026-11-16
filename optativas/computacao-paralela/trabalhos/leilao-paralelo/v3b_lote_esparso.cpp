// Algoritmo de leilão (Bertsekas) para o problema da atribuição.
// Versão 3b — igual à 3, mas o buffer local guarda o número da rodada em cada lance
// (dispensa limpar o buffer) e cada thread anota só as tarefas que tocou (redução esparsa).

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

// Estrutura de Bid com "timestamp" da rodada para evitar limpeza de memória
struct BidEntry {
    double value;
    int worker;
    int round_id; // Identificador da rodada em que este bid foi feito
};

pair<vector<int>, vector<double>> auction_algorithm_batched_opt(
    const vector<vector<double>>& cost,
    double epsilon = 1e-3,
    int num_threads = 8,
    BenchStats* stats = nullptr)
{
    int n = (int)cost.size();
    if (n == 0) return {{}, {}};

    vector<double> prices(n, 0.0);
    vector<int> assignment(n, -1);
    vector<int> task_owner(n, -1);
    int unassigned_count = n;

    // Buffer local por thread: [thread_id][task_id]
    // Inicializa round_id com -1
    vector<vector<BidEntry>> local_bids(num_threads, vector<BidEntry>(n, {-numeric_limits<double>::infinity(), -1, -1}));
    
    // Listas esparsas: quais tarefas cada thread modificou nesta rodada
    vector<vector<int>> touched_tasks(num_threads);
    for(auto& v : touched_tasks) v.reserve(n / num_threads);

    int round = 0;
    
    while (unassigned_count > 0) {
        ++round;
        if (stats) stats->rounds = round;

        // NÃO limpamos local_bids. Usamos 'round' para validar os dados.

        // 1. Fase de Propostas Paralela
        #pragma omp parallel num_threads(num_threads)
        {
            int tid = omp_get_thread_num();
            // Limpa apenas a lista de índices (muito rápido)
            touched_tasks[tid].clear(); 

            // Divisão estática simples dos workers
            #pragma omp for schedule(static) nowait
            for (int worker = 0; worker < n; ++worker) {
                if (assignment[worker] != -1) continue;

                double best_value = -numeric_limits<double>::infinity();
                double second_best = -numeric_limits<double>::infinity();
                int best_task = -1;

                // Busca
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

                // Atualiza buffer local (Lazy Clear Logic)
                BidEntry& entry = local_bids[tid][best_task];
                
                if (entry.round_id != round) {
                    // Primeiro acesso nesta rodada: sobrescreve e marca como tocada
                    entry.value = bid;
                    entry.worker = worker;
                    entry.round_id = round;
                    touched_tasks[tid].push_back(best_task);
                } else {
                    // Já visitada nesta rodada, apenas melhora o bid se necessário
                    if (bid > entry.value) {
                        entry.value = bid;
                        entry.worker = worker;
                    }
                }
            }
        } // Fim parallel workers

        // 2. Fase de Redução Esparsa (Single thread é geralmente mais rápido que parallel reduction complexo para listas esparsas pequenas)
        // Como o número de threads é baixo (8-16), iterar sobre T listas é rápido.
        
        int accepted_this_round = 0;

        // Precisamos consolidar as tarefas tocadas para não processar a mesma tarefa 2x se threads colidirem
        // Usamos um vetor de flags resetável para garantir unicidade na redução
        // Otimização: Apenas iteramos sobre as listas "touched"
        
        // Como podemos ter colisão (Task A em touched[0] e touched[1]), 
        // a maneira mais simples sem alocação é iterar sobre as listas e usar um array "last_seen_round" na tarefa global.
        
        // Vamos iterar sobre todas as listas de threads
        for (int t = 0; t < num_threads; ++t) {
            for (int task : touched_tasks[t]) {
                // Verifica se este é o melhor lance GLOBAL para esta tarefa nesta rodada
                // Precisamos comparar com os lances das outras threads para a MESMA tarefa
                
                // Para evitar processar a mesma tarefa múltiplas vezes no loop principal,
                // podemos fazer um check rápido:
                // Mas aqui vamos fazer a redução "in-place" simples:
                
                double best_bid_val = local_bids[t][task].value;
                int best_bid_worker = local_bids[t][task].worker;
                
                // Olha vizinhos (outras threads) que também tocaram nesta tarefa NESTA RODADA
                // Como sabemos quem tocou? O acesso aleatório é rápido.
                for (int other_t = t + 1; other_t < num_threads; ++other_t) {
                     if (local_bids[other_t][task].round_id == round) {
                         if (local_bids[other_t][task].value > best_bid_val) {
                             best_bid_val = local_bids[other_t][task].value;
                             best_bid_worker = local_bids[other_t][task].worker;
                         }
                         // Marca como processado para o futuro? 
                         // Truque: setar round_id para -1 no 'other_t' evitaria reprocessamento, 
                         // mas suja a memória.
                         // Melhor: Apenas processe se 't' for o índice MENOR que tocou na tarefa.
                         // Se other_t < t tocou, já processamos.
                     }
                }
                
                // Checagem reversa: Alguém com índice < t tocou nessa tarefa? Se sim, pule (já foi processado)
                bool handled_already = false;
                for (int prev_t = 0; prev_t < t; ++prev_t) {
                    if (local_bids[prev_t][task].round_id == round) {
                        handled_already = true; 
                        break;
                    }
                }
                if (handled_already) continue;

                // Aplica a atribuição (Só chegamos aqui 1 vez por tarefa por rodada)
                prices[task] += best_bid_val;
                int prev_owner = task_owner[task];
                
                if (prev_owner != -1) {
                    assignment[prev_owner] = -1;
                    unassigned_count++; // Incrementa temporariamente
                }
                
                task_owner[task] = best_bid_worker;
                assignment[best_bid_worker] = task;
                unassigned_count--; // Decrementa pois atribuímos um worker
                
                if (stats) stats->accepted++;
            }
        }
    }

    if (stats) stats->rounds = round;
    return {assignment, prices};
}

int run_prll3_opt() {
    for(int iter = 0; iter < 15; iter++){
        int n = 5000;
        int num_threads = 8;
        
        cout << "PRLL3 OPT (Lazy Batched) - n=" << n << " threads=" << num_threads << "\n";

        vector<vector<int>> cost_int = gerador_matrizes_permutacao(n);
        vector<vector<double>> cost(n, vector<double>(n));
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                cost[i][j] = static_cast<double>(cost_int[i][j]);

        BenchStats stats;

        auto t0 = chrono::high_resolution_clock::now();
        auto sol = auction_algorithm_batched_opt(cost, 1e-3, num_threads, &stats);
        auto t1 = chrono::high_resolution_clock::now();
        double ms = chrono::duration<double, milli>(t1 - t0).count();

        cout << fixed << setprecision(3);
        cout << "Time (ms): " << ms << "\n";
        cout << "Rounds: " << stats.rounds << "\n";
    }
    return 0;
}

