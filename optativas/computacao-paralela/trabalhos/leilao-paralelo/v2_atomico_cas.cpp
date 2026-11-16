// Algoritmo de leilão (Bertsekas) para o problema da atribuição.
// Versão 2 — assíncrona com std::thread e atômicos: preço e dono de cada tarefa são
// atualizados por compare-and-swap, com backoff exponencial e mutex de reserva quando
// o CAS falha muitas vezes. Inclui contadores de disputa.

#include <iostream>
#include <vector>
#include <atomic>
#include <thread>
#include <random>
#include <chrono>
#include <limits>
#include <iomanip>
#include <mutex>
#include <algorithm>
#include "geradores.h" 

using namespace std;

// Instrumentation counters
struct Counters {
    atomic<long long> price_cas_attempts{0};
    atomic<long long> price_cas_failures{0};
    atomic<long long> price_mutex_updates{0};
    atomic<long long> owner_exchanges{0};
    atomic<long long> assignments_made{0};
};

static inline void backoff_sleep(int attempt, std::mt19937 &rng) {
    // exponential backoff base in microseconds, with jitter
    int base = 4; // microseconds
    int max_shift = 12; // max backoff ~ base * 2^12 ~ 16384 us (~16ms)
    int shift = std::min(attempt, max_shift);
    int upper = base << shift;
    std::uniform_int_distribution<int> d(0, upper);
    int sleep_us = d(rng);
    if (sleep_us > 0) std::this_thread::sleep_for(std::chrono::microseconds(sleep_us));
}

pair<vector<int>, vector<double>> auction_algorithm_async_atomic_prll2(
    const vector<vector<double>>& cost,
    double epsilon = 1e-3,
    int num_threads = 8,
    Counters* counters = nullptr,
    int max_cas_attempts = 8)
{
    int n = (int)cost.size();

    // atomics principais
    vector<atomic<double>> prices(n);
    for (int i = 0; i < n; ++i) prices[i].store(0.0);

    vector<atomic<int>> assignment(n); // worker -> task (or -1)
    for (int i = 0; i < n; ++i) assignment[i].store(-1);

    vector<atomic<int>> task_owner(n); // task -> worker (or -1)
    for (int i = 0; i < n; ++i) task_owner[i].store(-1);

    // Mutexes para fallback (quando CAS falha repetidamente)
    vector<mutex> price_mutex(n);

    atomic<int> unassigned_count(n);

    auto worker_thread = [&](int tid) {
        // rng per thread
        std::mt19937 rng((unsigned)chrono::high_resolution_clock::now().time_since_epoch().count() + tid*997);
        // construir lista de tasks e embaralhar para reduzir hotspots
        vector<int> tasks(n);
        for (int i = 0; i < n; ++i) tasks[i] = i;
        // small initial shuffle to vary work per thread
        std::shuffle(tasks.begin(), tasks.end(), rng);

        // distribuir workers por blocos mas também permitir round-robin se necessário
        int start = (n * tid) / num_threads;
        int end = (n * (tid + 1)) / num_threads;
        if (start == end) { // caso poucos workers
            start = 0; end = n;
        }

        int iteration = 0;
        while (unassigned_count.load(memory_order_acquire) > 0) {
            bool progressed = false;
            iteration++;

            // Alternar entre percorrer bloco local e percorrer tarefas embaralhadas completas
            bool full_scan = (iteration & 31) == 0; // a cada 32 iterações faça full scan com shuffle

            if (full_scan) {
                std::shuffle(tasks.begin(), tasks.end(), rng);
            }

            int w_begin = start;
            int w_end = end;
            if (full_scan) { w_begin = 0; w_end = n; }

            for (int worker = w_begin; worker < w_end; ++worker) {
                // ler de uma vez e reutilizar
                if (assignment[worker].load(memory_order_relaxed) != -1) continue;

                int remaining = unassigned_count.load(memory_order_acquire);
                if (remaining <= 0) break;

                // logo antes de calcular best/second_best para os workers deste thread:
                vector<double> local_prices(n);
                for (int t = 0; t < n; ++t) {
                    local_prices[t] = prices[t].load(memory_order_relaxed);
                }

                // calcula best e second best localmente (lendo preços atomically)
                double best_value = -numeric_limits<double>::infinity();
                double second_best = -numeric_limits<double>::infinity();
                int best_task = -1;

                if (full_scan) {
                    // percorrer tasks na ordem embaralhada
                    for (int idx = 0; idx < n; ++idx) {
                        int task = tasks[idx];
                        double p = local_prices[task];
                        double net = cost[worker][task] - p;
                        if (net > best_value) {
                            second_best = best_value;
                            best_value = net;
                            best_task = task;
                        } else if (net > second_best) {
                            second_best = net;
                        }
                    }
                } else {
                    // varredura normal por task (0..n-1)
                    for (int task = 0; task < n; ++task) {
                        double p = local_prices[task];
                        double net = cost[worker][task] - p;
                        if (net > best_value) {
                            second_best = best_value;
                            best_value = net;
                            best_task = task;
                        } else if (net > second_best) {
                            second_best = net;
                        }
                    }
                }

                if (best_task == -1) continue;

                double bid = (best_value - second_best) + epsilon;

                // tenta incrementar o preço com CAS (loop) com backoff
                bool price_updated = false;
                int attempt = 0;
                while (!price_updated && attempt < max_cas_attempts) {
                    ++attempt;
                    if (counters) counters->price_cas_attempts.fetch_add(1, memory_order_relaxed);

                    double oldp = prices[best_task].load(memory_order_acquire);
                    double newp = oldp + bid;

                    if (prices[best_task].compare_exchange_weak(oldp, newp, memory_order_acq_rel, memory_order_acquire)) {
                        price_updated = true;
                    } else {
                        if (counters) counters->price_cas_failures.fetch_add(1, memory_order_relaxed);
                        // backoff antes de tentar de novo
                        backoff_sleep(attempt, rng);
                    }
                }

                if (!price_updated) {
                    // Fallback seguro: pegar mutex da task para atualizar preço (camada com lock)
                    // Isso garante progresso quando a contenção é alta.
                    std::unique_lock<std::mutex> lk(price_mutex[best_task]);
                    // ler e atualizar diretamente
                    double oldp = prices[best_task].load(memory_order_acquire);
                    double newp = oldp + bid;
                    prices[best_task].store(newp, memory_order_release);
                    if (counters) counters->price_mutex_updates.fetch_add(1, memory_order_relaxed);
                    // mutex liberado ao sair do escopo
                }

                // agora tente assumir a propriedade da tarefa com exchange (atômico)
                int prev = task_owner[best_task].exchange(worker, memory_order_acq_rel);
                if (counters) counters->owner_exchanges.fetch_add(1, memory_order_relaxed);

                // se havia dono anterior, marque ele como desempregado
                if (prev != -1) {
                    assignment[prev].store(-1, memory_order_release);
                }

                // tente atribuir para si mesmo (caso ninguém nos atribuiu no meio-tempo)
                int expected = -1;
                if (assignment[worker].compare_exchange_strong(expected, best_task, memory_order_acq_rel)) {
                    // atribuição bem sucedida
                    if (prev == -1) {
                        unassigned_count.fetch_sub(1, memory_order_acq_rel);
                    }
                    if (counters) counters->assignments_made.fetch_add(1, memory_order_relaxed);
                } else {
                    // outro thread atribuiu esse worker no meio tempo
                    // Para evitar inconsistências, se prev == -1 e assignment falhou, precisamos tentar
                    // devolver a propriedade da tarefa para -1 (se ainda estivermos apontando)
                    if (prev == -1) {
                        int cur_owner = task_owner[best_task].load(memory_order_acquire);
                        // se ainda somos o owner (cur_owner == worker) e assignment[worker] != best_task,
                        // tentamos revertê-lo para -1 para preservar invariantes.
                        if (cur_owner == worker) {
                            // tentar trocar de volta para -1 - se falhar, outro thread entrou e é dono agora
                            task_owner[best_task].compare_exchange_strong(cur_owner, -1, memory_order_acq_rel);
                        }
                    }
                    // não decrementamos unassigned_count porque não mudamos uma atribuição efetiva
                }

                progressed = true;
            } // end for workers

            if (!progressed) {
                // evitar spinning agressivo
                std::this_thread::yield();
            }
        } // while unassigned_count
    };

    vector<thread> threads;
    threads.reserve(num_threads);
    for (int t = 0; t < num_threads; ++t) {
        threads.emplace_back(worker_thread, t);
    }
    for (auto &th : threads) th.join();

    vector<int> final_assign(n);
    vector<double> final_prices(n);
    for (int i = 0; i < n; ++i) {
        final_assign[i] = assignment[i].load(memory_order_acquire);
        final_prices[i] = prices[i].load(memory_order_acquire);
    }

    return {final_assign, final_prices};
}

int run_prll2() {
    for(int iter = 0; iter < 15; iter++){
        int n = 5000;
        int num_threads = 8;
        if (num_threads == 0) num_threads = 8;

        cout << "n=" << n << " threads=" << num_threads << "\n";

        vector<vector<int>> cost_int = gerador_matrizes_permutacao(n);
        vector<vector<double>> cost(n, vector<double>(n));
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                cost[i][j] = static_cast<double>(cost_int[i][j]);

        Counters counters;

        auto t0 = chrono::high_resolution_clock::now();
        auto sol = auction_algorithm_async_atomic_prll2(cost, 1e-3, num_threads, &counters, 10);
        auto t1 = chrono::high_resolution_clock::now();

        double ms = chrono::duration<double, milli>(t1 - t0).count();

        cout << fixed << setprecision(3);
        cout << "Time (ms): " << ms << "\n";
        cout << "price cas attempts: " << counters.price_cas_attempts.load() << "\n";
        cout << "price cas failures: " << counters.price_cas_failures.load() << "\n";
        cout << "price mutex updates (fallbacks): " << counters.price_mutex_updates.load() << "\n";
        cout << "owner exchanges: " << counters.owner_exchanges.load() << "\n";
        cout << "assignments made: " << counters.assignments_made.load() << "\n";

        vector<int> freq(n, 0);
        for (int i = 0; i < n; ++i) {
            int a = sol.first[i];
            if (a >= 0 && a < n) freq[a]++;
        }
        //int collisions = 0;
        //for (int j = 0; j < n; ++j) if (freq[j] != 1) collisions++;
        //cout << "non-unique tasks count (should be 0): " << collisions << "\n";
    }
    return 0;
}


