// Algoritmo de leilão (Bertsekas) para o problema da atribuição.
// Versão 4 — paraleliza só a busca do melhor e do segundo melhor objeto de cada
// trabalhador livre; a aplicação dos lances continua sequencial (sem disputa).

#include <iostream>
#include <vector>
#include <limits>
#include <chrono>
#include <iomanip>
#include <omp.h>
#include "geradores.h"

using namespace std;

pair<vector<int>, vector<double>> auction_algorithm_search_parallel(
    const vector<vector<double>>& cost,
    double epsilon = 1e-3,
    int num_threads = 8)
{
    int n = (int)cost.size();
    if (n == 0) return {{}, {}};

    vector<double> prices(n, 0.0);       // preço de cada tarefa
    vector<int> assignment(n, -1);       // worker -> task
    vector<int> task_owner(n, -1);       // task -> worker

    // buffers usados por round (prealocados)
    vector<int> best_task(n, -1);
    vector<double> best_value(n, -numeric_limits<double>::infinity());
    vector<double> second_best_value(n, -numeric_limits<double>::infinity());
    vector<double> bid_value(n, 0.0);

    bool all_assigned_global = false;
    int round = 0;

    while (true) {
        ++round;
        // 1) snapshot: paraleliza a busca do melhor e segundo melhor para cada worker livre
        // Inicializa buffers
        #pragma omp parallel for num_threads(num_threads) schedule(static)
        for (int w = 0; w < n; ++w) {
            best_task[w] = -1;
            best_value[w] = -numeric_limits<double>::infinity();
            second_best_value[w] = -numeric_limits<double>::infinity();
            bid_value[w] = 0.0;
        }

        // Indica se ainda há workers livres; reduzido depois
        bool any_unassigned = false;

        // Parallel search: cada thread calcula best/second-best para seus workers
        #pragma omp parallel for num_threads(num_threads) schedule(dynamic, 16)
        for (int worker = 0; worker < n; ++worker) {
            if (assignment[worker] != -1) continue; // já atribuído

            // marca que existe trabalhador livre
            #pragma omp atomic write
            any_unassigned = true;

            double bval = -numeric_limits<double>::infinity();
            double sval = -numeric_limits<double>::infinity();
            int btask = -1;

            // leitura de prices ocasionalmente consistente (snapshot read)
            for (int task = 0; task < n; ++task) {
                double net = cost[worker][task] - prices[task];
                if (net > bval) {
                    sval = bval;
                    bval = net;
                    btask = task;
                } else if (net > sval) {
                    sval = net;
                }
            }

            best_task[worker] = btask;
            best_value[worker] = bval;
            second_best_value[worker] = sval;
            bid_value[worker] = (bval - sval) + epsilon;
        }

        // Se nenhum worker livre, terminamos
        if (!any_unassigned) break;

        // 2) Aplicação dos bids: seqüencial para manter consistência (sem locks)
        //    (poderia ser parcialmente paralelizável com locks, mas aqui mantemos simples)
        const vector<double> preco_inicio = prices;
        for (int worker = 0; worker < n; ++worker) {
            if (assignment[worker] != -1) continue; // já atribuído (pode ter sido atribuído em rounds anteriores)

            int bt = best_task[worker];
            if (bt == -1) continue;

            // Leilão de Jacobi: todos os lances da rodada foram calculados com os preços
            // do início da rodada, então o preço oferecido é p_antigo + lance =
            // benefício - segundo_melhor + epsilon. Se dois trabalhadores disputam a
            // mesma tarefa, vence o maior lance (o preço NÃO soma os dois incrementos;
            // somar, como na versão original, quebrava a epsilon-folga complementar e
            // podia terminar numa atribuição abaixo do ótimo).
            double novo_preco = preco_inicio[bt] + bid_value[worker];
            if (novo_preco <= prices[bt]) continue;  // perdeu para um lance maior desta rodada
            prices[bt] = novo_preco;

            // desaloca dono anterior, se houver
            int prev = task_owner[bt];
            if (prev != -1) {
                assignment[prev] = -1;
            }

            // atribui
            assignment[worker] = bt;
            task_owner[bt] = worker;
        }

        // 3) verifica condição de término
        bool done = true;
        for (int w = 0; w < n; ++w) {
            if (assignment[w] == -1) { done = false; break; }
        }
        if (done) break;

        // evitar loops infinitos (salto de segurança - raramente necessário)
        if (round > 300000) {
            cerr << "Exceeded max rounds, aborting\n";
            break;
        }
    } // fim while

    return {assignment, prices};
}

int run_prll4(int n = 5000, int num_threads = -1) {
    for(int iter = 0; iter < 15; iter++){
        if (num_threads <= 0) {
            num_threads = omp_get_max_threads();
            if (num_threads <= 0) num_threads = 8;
        }

        cout << "Auction (search-parallel) n=" << n << " threads=" << num_threads << "\n";

        vector<vector<int>> cost_int = gerador_matrizes_permutacao(n);
        vector<vector<double>> cost(n, vector<double>(n));
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                cost[i][j] = static_cast<double>(cost_int[i][j]);

        auto t0 = chrono::high_resolution_clock::now();
        auto sol = auction_algorithm_search_parallel(cost, 1e-3, num_threads);
        auto t1 = chrono::high_resolution_clock::now();

        double ms = chrono::duration<double, milli>(t1 - t0).count();

        cout << fixed << setprecision(3);
        cout << "Time (ms): " << ms << "\n";

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


