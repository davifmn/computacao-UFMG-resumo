// Algoritmos de grafos: BFS, DFS com ordenação topológica, Dijkstra,
// Bellman-Ford, Kruskal (união-busca) e Prim, testados nos exemplos do CLRS.
// Compile: g++ -std=c++17 -Wall -Wextra grafos.cpp -o grafos && ./grafos
#include <algorithm>
#include <cassert>
#include <climits>
#include <functional>
#include <iostream>
#include <list>
#include <numeric>
#include <queue>
#include <random>
#include <tuple>
#include <vector>

using namespace std;
const long long INF = LLONG_MAX / 4;

struct Grafo {
    int n;
    bool direcionado;
    vector<vector<pair<int, int>>> adj;           // adj[u] = {(v, peso)}
    vector<tuple<int, int, int>> arestas;         // (u, v, peso)

    Grafo(int n, bool dir) : n(n), direcionado(dir), adj(n) {}
    void aresta(int u, int v, int w = 1) {
        adj[u].push_back({v, w});
        if (!direcionado) adj[v].push_back({u, w});
        arestas.push_back({u, v, w});
    }
};

vector<int> bfs(const Grafo& g, int s) {
    vector<int> dist(g.n, -1);
    queue<int> fila;
    dist[s] = 0;
    fila.push(s);
    while (!fila.empty()) {
        int u = fila.front(); fila.pop();
        for (auto [v, w] : g.adj[u])
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                fila.push(v);
            }
    }
    return dist;
}

// Devolve a ordenação topológica (vazia se houver ciclo).
vector<int> ordenacaoTopologica(const Grafo& g) {
    enum Cor { BRANCO, CINZA, PRETO };
    vector<Cor> cor(g.n, BRANCO);
    list<int> ordem;
    bool ciclo = false;
    function<void(int)> dfs = [&](int u) {
        cor[u] = CINZA;
        for (auto [v, w] : g.adj[u]) {
            if (cor[v] == CINZA) ciclo = true;     // aresta de retorno
            if (cor[v] == BRANCO) dfs(v);
        }
        cor[u] = PRETO;
        ordem.push_front(u);
    };
    for (int u = 0; u < g.n; u++)
        if (cor[u] == BRANCO) dfs(u);
    if (ciclo) return {};
    return vector<int>(ordem.begin(), ordem.end());
}

vector<long long> dijkstra(const Grafo& g, int s) {
    vector<long long> dist(g.n, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
    dist[s] = 0;
    pq.push({0, s});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;                 // entrada velha
        for (auto [v, w] : g.adj[u])
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
    }
    return dist;
}

// false se houver ciclo negativo alcançável a partir de s.
bool bellmanFord(const Grafo& g, int s, vector<long long>& dist) {
    dist.assign(g.n, INF);
    dist[s] = 0;
    for (int i = 1; i <= g.n - 1; i++)
        for (auto [u, v, w] : g.arestas)
            if (dist[u] != INF && dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    for (auto [u, v, w] : g.arestas)
        if (dist[u] != INF && dist[u] + w < dist[v]) return false;
    return true;
}

struct UniaoBusca {
    vector<int> pai, posto;
    explicit UniaoBusca(int n) : pai(n), posto(n, 0) { iota(pai.begin(), pai.end(), 0); }
    int achar(int x) { return pai[x] == x ? x : pai[x] = achar(pai[x]); }   // compressão de caminho
    bool unir(int a, int b) {
        a = achar(a); b = achar(b);
        if (a == b) return false;
        if (posto[a] < posto[b]) swap(a, b);                               // união por posto
        pai[b] = a;
        if (posto[a] == posto[b]) posto[a]++;
        return true;
    }
};

long long kruskal(const Grafo& g) {
    auto arestas = g.arestas;
    sort(arestas.begin(), arestas.end(), [](auto& x, auto& y) { return get<2>(x) < get<2>(y); });
    UniaoBusca ub(g.n);
    long long total = 0;
    for (auto [u, v, w] : arestas)
        if (ub.unir(u, v)) total += w;
    return total;
}

long long prim(const Grafo& g, int s = 0) {
    vector<bool> naArvore(g.n, false);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;
    pq.push({0, s});
    long long total = 0;
    while (!pq.empty()) {
        auto [w, u] = pq.top(); pq.pop();
        if (naArvore[u]) continue;
        naArvore[u] = true;
        total += w;
        for (auto [v, peso] : g.adj[u])
            if (!naArvore[v]) pq.push({peso, v});
    }
    return total;
}

int main() {
    // BFS (grafo não direcionado da visualização)
    Grafo b(8, false);
    for (auto [u, v] : vector<pair<int, int>>{{0, 1}, {0, 2}, {0, 4}, {1, 3}, {2, 3}, {2, 5}, {4, 5}, {3, 6}, {5, 6}, {3, 7}, {6, 7}}) b.aresta(u, v);
    assert((bfs(b, 0) == vector<int>{0, 1, 1, 2, 1, 2, 3, 3}));

    // Ordenação topológica: vestir-se (CLRS, fig. 22.7)
    Grafo r(9, true);   // 0 cueca, 1 calça, 2 cinto, 3 camisa, 4 gravata, 5 paletó, 6 meias, 7 sapatos, 8 relógio
    for (auto [u, v] : vector<pair<int, int>>{{0, 1}, {0, 7}, {1, 2}, {1, 7}, {3, 2}, {3, 4}, {4, 5}, {2, 5}, {6, 7}}) r.aresta(u, v);
    auto ordem = ordenacaoTopologica(r);
    vector<int> pos(9);
    for (int i = 0; i < 9; i++) pos[ordem[i]] = i;
    for (auto [u, v, w] : r.arestas) assert(pos[u] < pos[v]);
    r.aresta(5, 3);                                     // paletó → camisa cria um ciclo
    assert(ordenacaoTopologica(r).empty());
    cout << "BFS e ordenação topológica: ok\n";

    // Dijkstra e Bellman-Ford (CLRS, fig. 24.6)
    Grafo d(5, true);   // s t x y z
    for (auto [u, v, w] : vector<tuple<int, int, int>>{{0, 1, 10}, {0, 3, 5}, {1, 2, 1}, {1, 3, 2}, {2, 4, 4}, {3, 1, 3}, {3, 2, 9}, {3, 4, 2}, {4, 0, 7}, {4, 2, 6}}) d.aresta(u, v, w);
    assert((dijkstra(d, 0) == vector<long long>{0, 8, 9, 5, 7}));
    vector<long long> dist;
    assert(bellmanFord(d, 0, dist) && dist == dijkstra(d, 0));

    Grafo neg(4, true);
    neg.aresta(0, 1, 4); neg.aresta(1, 2, -2); neg.aresta(2, 3, 1); neg.aresta(3, 1, -1); neg.aresta(0, 3, 5);
    assert(!bellmanFord(neg, 0, dist));                // B → C → D → B soma −2
    cout << "Dijkstra e Bellman-Ford: ok\n";

    // Dijkstra × Bellman-Ford em grafos aleatórios com pesos >= 0
    mt19937 rng(42);
    for (int t = 0; t < 300; t++) {
        int n = 2 + rng() % 12;
        Grafo g(n, true);
        for (int k = 0; k < 3 * n; k++) g.aresta(rng() % n, rng() % n, rng() % 20);
        assert(bellmanFord(g, 0, dist) && dist == dijkstra(g, 0));
    }

    // MST (CLRS, fig. 23.1): peso 37
    Grafo m(9, false);  // a b c d e f g h i
    for (auto [u, v, w] : vector<tuple<int, int, int>>{{0, 1, 4}, {0, 7, 8}, {1, 2, 8}, {1, 7, 11}, {2, 3, 7}, {2, 8, 2}, {2, 5, 4}, {3, 4, 9}, {3, 5, 14}, {4, 5, 10}, {5, 6, 2}, {6, 7, 1}, {6, 8, 6}, {7, 8, 7}}) m.aresta(u, v, w);
    assert(kruskal(m) == 37 && prim(m) == 37);
    for (int t = 0; t < 300; t++) {                    // Kruskal e Prim sempre concordam
        int n = 2 + rng() % 15;
        Grafo g(n, false);
        for (int v = 1; v < n; v++) g.aresta(rng() % v, v, rng() % 50);   // garante conexo
        for (int k = 0; k < 2 * n; k++) g.aresta(rng() % n, rng() % n, rng() % 50);
        assert(kruskal(g) == prim(g, rng() % n));
    }
    cout << "Kruskal e Prim (peso 37 no exemplo do CLRS): ok\n";
    cout << "Todos os testes passaram.\n";
}
