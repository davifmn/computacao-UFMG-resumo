// Geometria computacional e aproximação: envoltória convexa (Andrew e Jarvis),
// interseção de segmentos, cobertura por vértices e caixeiro viajante métrico,
// comparados com força bruta.
// Compile: g++ -std=c++17 -Wall -Wextra geometria.cpp -o geometria && ./geometria
#include <algorithm>
#include <cassert>
#include <cmath>
#include <functional>
#include <iostream>
#include <random>
#include <vector>

using namespace std;
const double INF = 1e18;

struct P { long long x, y; bool operator<(P o) const { return x < o.x || (x == o.x && y < o.y); } };
bool operator==(P a, P b) { return a.x == b.x && a.y == b.y; }

// > 0: o→a→b vira à esquerda; < 0: à direita; 0: colineares
long long cruz(P o, P a, P b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}
long long dist2(P a, P b) { return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y); }
double dist(P a, P b) { return sqrt((double)dist2(a, b)); }

vector<P> envoltoria(vector<P> p) {
    sort(p.begin(), p.end());                         // por x, depois y
    int n = p.size(), k = 0;
    vector<P> h(2 * n);
    for (int i = 0; i < n; i++) {                     // cadeia de baixo
        while (k >= 2 && cruz(h[k - 2], h[k - 1], p[i]) <= 0) k--;
        h[k++] = p[i];
    }
    for (int i = n - 2, t = k + 1; i >= 0; i--) {     // cadeia de cima
        while (k >= t && cruz(h[k - 2], h[k - 1], p[i]) <= 0) k--;
        h[k++] = p[i];
    }
    h.resize(k - 1);                                  // o 1º ponto apareceu 2 vezes
    return h;
}

vector<P> embrulho(vector<P> p) {
    int n = p.size();
    int ini = min_element(p.begin(), p.end()) - p.begin();  // mais à esquerda
    vector<P> h;
    int a = ini;
    do {
        h.push_back(p[a]);
        int b = (a + 1) % n;                          // candidato inicial
        for (int i = 0; i < n; i++) {
            long long c = cruz(p[a], p[b], p[i]);
            if (c < 0 || (c == 0 && dist2(p[a], p[i]) > dist2(p[a], p[b])))
                b = i;                                // i está à direita de a→b
        }
        a = b;
    } while (a != ini);
    return h;
}

// Força bruta: p é vértice da envoltória se os vetores q − p (q ≠ p) cabem num
// semiplano aberto, isto é, se a maior lacuna entre seus ângulos passa de π.
size_t verticesForcaBruta(const vector<P>& p) {
    size_t cont = 0;
    for (size_t a = 0; a < p.size(); a++) {
        vector<double> ang;
        for (size_t i = 0; i < p.size(); i++)
            if (i != a) ang.push_back(atan2((double)(p[i].y - p[a].y), (double)(p[i].x - p[a].x)));
        sort(ang.begin(), ang.end());
        double lacuna = ang[0] + 2 * M_PI - ang.back();
        for (size_t i = 1; i < ang.size(); i++) lacuna = max(lacuna, ang[i] - ang[i - 1]);
        if (lacuna > M_PI + 1e-9) cont++;
    }
    return cont;
}

bool cruzam(P a, P b, P c, P d) {
    auto sg = [](long long v) { return (v > 0) - (v < 0); };
    auto sobre = [](P p, P q, P r) {
        return min(p.x, q.x) <= r.x && r.x <= max(p.x, q.x) && min(p.y, q.y) <= r.y && r.y <= max(p.y, q.y);
    };
    int o1 = sg(cruz(a, b, c)), o2 = sg(cruz(a, b, d)), o3 = sg(cruz(c, d, a)), o4 = sg(cruz(c, d, b));
    if (o1 != o2 && o3 != o4) return true;
    return (o1 == 0 && sobre(a, b, c)) || (o2 == 0 && sobre(a, b, d)) || (o3 == 0 && sobre(c, d, a)) || (o4 == 0 && sobre(c, d, b));
}

// ---------- Aproximação ----------

vector<int> coberturaAprox(int n, vector<pair<int, int>>& arestas) {
    vector<bool> na(n, false);
    vector<int> C;
    for (auto [u, v] : arestas)
        if (!na[u] && !na[v]) {               // aresta ainda descoberta
            na[u] = na[v] = true;             // leva as DUAS pontas
            C.push_back(u); C.push_back(v);
        }
    // as arestas escolhidas não têm ponta em comum (emparelhamento):
    // qualquer cobertura precisa de 1 vértice por aresta => |C| <= 2 * ótimo
    return C;
}

int coberturaOtima(int n, vector<pair<int, int>>& arestas) {
    int best = n;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool ok = true;
        for (auto [u, v] : arestas) if (!((mask >> u) & 1) && !((mask >> v) & 1)) { ok = false; break; }
        if (ok) best = min(best, __builtin_popcount(mask));
    }
    return best;
}

vector<int> tspAprox(vector<P>& p) {
    int n = p.size();
    vector<double> d(n, INF);
    vector<int> pai(n, -1);
    vector<bool> na(n, false);
    vector<vector<int>> filhos(n);
    d[0] = 0;
    for (int it = 0; it < n; it++) {          // 1. árvore geradora mínima (Prim)
        int u = -1;
        for (int v = 0; v < n; v++) if (!na[v] && (u < 0 || d[v] < d[u])) u = v;
        na[u] = true;
        if (pai[u] >= 0) filhos[pai[u]].push_back(u);
        for (int v = 0; v < n; v++)
            if (!na[v] && dist(p[u], p[v]) < d[v]) { d[v] = dist(p[u], p[v]); pai[v] = u; }
    }
    vector<int> rota;                         // 2. pré-ordem = passeio com atalhos
    function<void(int)> dfs = [&](int u) {
        rota.push_back(u);
        for (int v : filhos[u]) dfs(v);
    };
    dfs(0);
    return rota;                              // custo <= 2 * MST <= 2 * ótimo
}

double custo(vector<P>& p, const vector<int>& r) {
    double s = 0;
    for (size_t i = 0; i < r.size(); i++) s += dist(p[r[i]], p[r[(i + 1) % r.size()]]);
    return s;
}

double tspOtimo(vector<P>& p) {
    vector<int> r(p.size());
    for (size_t i = 0; i < r.size(); i++) r[i] = i;
    double best = INF;
    do best = min(best, custo(p, r)); while (next_permutation(r.begin() + 1, r.end()));
    return best;
}

int main() {
    mt19937 rng(7);
    for (int it = 0; it < 3000; it++) {
        int n = 3 + rng() % 25;
        vector<P> p;
        while ((int)p.size() < n) {
            P q{(long long)(rng() % 30), (long long)(rng() % 30)};
            if (find(p.begin(), p.end(), q) == p.end()) p.push_back(q);
        }
        bool degenerado = true;   // todos colineares
        for (int i = 2; i < n; i++) if (cruz(p[0], p[1], p[i]) != 0) degenerado = false;
        if (degenerado) continue;
        auto h1 = envoltoria(p), h2 = embrulho(p);
        assert(h1.size() == h2.size());
        for (size_t i = 0; i < h1.size(); i++) assert(h1[i] == h2[i]);   // mesma ordem, anti-horária
        assert(h1.size() == verticesForcaBruta(p));
        for (size_t i = 0; i < h1.size(); i++)                            // convexo
            assert(cruz(h1[i], h1[(i + 1) % h1.size()], h1[(i + 2) % h1.size()]) > 0);
    }
    cout << "envoltoria: Andrew = Jarvis = forca bruta em 3000 nuvens de pontos\n";

    assert(cruzam({0, 0}, {4, 4}, {0, 4}, {4, 0}));
    assert(!cruzam({0, 0}, {1, 1}, {2, 2}, {3, 3}));
    assert(cruzam({0, 0}, {2, 2}, {1, 1}, {3, 3}));
    assert(!cruzam({0, 0}, {4, 0}, {1, 1}, {3, 2}));

    double pior = 0;
    for (int it = 0; it < 500; it++) {
        int n = 4 + rng() % 9;
        vector<pair<int, int>> e;
        for (int u = 0; u < n; u++) for (int v = u + 1; v < n; v++) if (rng() % 3 == 0) e.push_back({u, v});
        if (e.empty()) continue;
        double r = (double)coberturaAprox(n, e).size() / coberturaOtima(n, e);
        assert(r <= 2.0);
        pior = max(pior, r);
    }
    cout << "cobertura por vertices: pior razao observada = " << pior << " (garantia: 2)\n";

    pior = 0;
    for (int it = 0; it < 200; it++) {
        int n = 4 + rng() % 5;
        vector<P> p;
        for (int i = 0; i < n; i++) p.push_back({(long long)(rng() % 100), (long long)(rng() % 100)});
        auto r = tspAprox(p);
        double ra = custo(p, r) / tspOtimo(p);
        assert(ra <= 2.0 + 1e-9);
        pior = max(pior, ra);
    }
    cout << "caixeiro metrico: pior razao observada = " << pior << " (garantia: 2)\n";
}
