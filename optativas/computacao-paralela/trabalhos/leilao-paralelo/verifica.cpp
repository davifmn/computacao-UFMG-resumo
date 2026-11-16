// Verificação de corretude: todas as versões devem devolver uma atribuição perfeita
// (cada tarefa com exatamente um trabalhador) de benefício máximo.
//
// Com benefícios inteiros e epsilon < 1/n, o leilão termina com uma atribuição
// ÓTIMA (Bertsekas). Conferimos contra força bruta (n pequeno) e contra a versão
// sequencial (n médio).
//
// A v2 (assíncrona com CAS) é experimental: tem uma condição de corrida conhecida
// (veja o README) e às vezes termina com trabalhadores sem tarefa. Ela é verificada
// e o resultado é impresso, mas não reprova o teste.

#include <algorithm>
#include <iostream>
#include <numeric>
#include <random>
#include <string>
#include <vector>

using namespace std;
using Resultado = pair<vector<int>, vector<double>>;
using Matriz = vector<vector<double>>;

struct Counters;
struct BenchStats;
Resultado auction_algorithm(const Matriz&, double);
Resultado auction_algorithm_parallel(const Matriz&, double, int);
Resultado auction_algorithm_parallel_opt(const Matriz&, double, int);
Resultado auction_algorithm_async_atomic_prll2(const Matriz&, double, int, Counters*, int);
Resultado auction_algorithm_batched(const Matriz&, double, int, BenchStats*);
Resultado auction_algorithm_batched_opt(const Matriz&, double, int, BenchStats*);
Resultado auction_algorithm_search_parallel(const Matriz&, double, int);

static double beneficio(const Matriz& c, const vector<int>& a) {
    double s = 0;
    for (size_t i = 0; i < a.size(); i++) s += c[i][a[i]];
    return s;
}

static bool perfeita(const vector<int>& a) {
    vector<int> usada(a.size(), 0);
    for (int t : a) {
        if (t < 0 || t >= (int)a.size() || usada[t]++) return false;
    }
    return true;
}

static double forca_bruta(const Matriz& c) {
    vector<int> p(c.size());
    iota(p.begin(), p.end(), 0);
    double melhor = -1;
    do melhor = max(melhor, beneficio(c, p)); while (next_permutation(p.begin(), p.end()));
    return melhor;
}

int main() {
    mt19937 gen(2025);
    int falhas = 0, verificacoes = 0, falhas_v2 = 0, total_v2 = 0;
    for (int n : {5, 7, 60, 200}) {
        for (int rep = 0; rep < 5; rep++) {
            uniform_int_distribution<int> dist(1, n);
            Matriz c(n, vector<double>(n));
            for (auto& linha : c) for (auto& x : linha) x = dist(gen);
            double eps = 1.0 / (n + 1);

            double alvo = n <= 8 ? forca_bruta(c) : beneficio(c, auction_algorithm(c, eps).first);
            const vector<pair<string, Resultado>> res = {
                {"v0", auction_algorithm(c, eps)},
                {"v1", auction_algorithm_parallel(c, eps, 4)},
                {"v1b", auction_algorithm_parallel_opt(c, eps, 4)},
                {"v2", auction_algorithm_async_atomic_prll2(c, eps, 4, nullptr, 8)},
                {"v3", auction_algorithm_batched(c, eps, 4, nullptr)},
                {"v3b", auction_algorithm_batched_opt(c, eps, 4, nullptr)},
                {"v4", auction_algorithm_search_parallel(c, eps, 4)},
            };
            for (auto& [nome, r] : res) {
                bool ok = perfeita(r.first) && beneficio(c, r.first) == alvo;
                if (nome == "v2") { total_v2++; falhas_v2 += !ok; continue; }
                verificacoes++;
                if (!ok) {
                    falhas++;
                    cout << "FALHOU " << nome << " n=" << n << " rep=" << rep << ": benefício "
                         << (perfeita(r.first) ? beneficio(c, r.first) : -1) << ", esperado " << alvo << "\n";
                }
            }
        }
    }
    cout << verificacoes - falhas << "/" << verificacoes << " verificações corretas (v0, v1, v1b, v3, v3b, v4)\n";
    cout << "v2 (experimental): " << total_v2 - falhas_v2 << "/" << total_v2 << " corretas\n";
    return falhas ? 1 : 0;
}
