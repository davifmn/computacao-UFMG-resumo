// Benchmark das versões do algoritmo de leilão.
//
//   ./leilao <versao>        versao: v0 v1 v1b v2 v3 v3b v4 ou "todas"
//
// Cada versão roda 15 vezes com n = 5000 (matrizes de permutação aleatórias) e
// imprime o tempo de cada execução; v3 e v4 aceitam n e o número de threads:
//   ./leilao v4 2000 8

#include <cstdlib>
#include <functional>
#include <iostream>
#include <map>
#include <string>

using namespace std;

int run_baseline();
int run_prll1();
int run_prll1_opt();
int run_prll2();
int run_prll3(int n = 5000, int num_threads = -1);
int run_prll3_opt();
int run_prll4(int n = 5000, int num_threads = -1);

int main(int argc, char** argv) {
    int n = argc >= 3 ? atoi(argv[2]) : 5000;
    int threads = argc >= 4 ? atoi(argv[3]) : -1;

    const map<string, pair<string, function<int()>>> versoes = {
        {"v0",  {"sequencial", [] { return run_baseline(); }}},
        {"v1",  {"OpenMP, mutex por tarefa", [] { return run_prll1(); }}},
        {"v1b", {"OpenMP, spinlock alinhado", [] { return run_prll1_opt(); }}},
        {"v2",  {"threads + CAS atômico", [] { return run_prll2(); }}},
        {"v3",  {"lances em lote (Jacobi)", [=] { return run_prll3(n, threads); }}},
        {"v3b", {"lote com redução esparsa", [] { return run_prll3_opt(); }}},
        {"v4",  {"busca paralela", [=] { return run_prll4(n, threads); }}},
    };

    string escolha = argc >= 2 ? argv[1] : "";
    if (escolha != "todas" && !versoes.count(escolha)) {
        cerr << "uso: " << argv[0] << " <versao> [n] [threads]\nversões:";
        for (auto& [nome, v] : versoes) cerr << "\n  " << nome << "  " << v.first;
        cerr << "\n  todas\n";
        return 1;
    }
    for (auto& [nome, v] : versoes) {
        if (escolha != "todas" && escolha != nome) continue;
        cout << "\n=== " << nome << ": " << v.first << " ===\n";
        v.second();
    }
    return 0;
}
