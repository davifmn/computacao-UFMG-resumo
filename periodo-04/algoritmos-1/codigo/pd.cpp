// Programação dinâmica: mochila 0/1, LCS e distância de edição, conferidas
// contra força bruta em entradas aleatórias.
// Compile: g++ -std=c++17 -Wall -Wextra pd.cpp -o pd && ./pd
#include <algorithm>
#include <cassert>
#include <iostream>
#include <random>
#include <string>
#include <vector>

using namespace std;

int mochila(const vector<int>& p, const vector<int>& v, int W, vector<int>* escolhidos = nullptr) {
    int n = p.size();
    vector<vector<int>> T(n + 1, vector<int>(W + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int c = 0; c <= W; c++) {
            T[i][c] = T[i - 1][c];
            if (p[i - 1] <= c) T[i][c] = max(T[i][c], T[i - 1][c - p[i - 1]] + v[i - 1]);
        }
    if (escolhidos) {                                  // reconstrução
        escolhidos->clear();
        for (int i = n, c = W; i >= 1; i--)
            if (T[i][c] != T[i - 1][c]) { escolhidos->insert(escolhidos->begin(), i - 1); c -= p[i - 1]; }
    }
    return T[n][W];
}

// Mochila com O(W) de memória: percorre c de trás para frente.
int mochila1D(const vector<int>& p, const vector<int>& v, int W) {
    vector<int> T(W + 1, 0);
    for (size_t i = 0; i < p.size(); i++)
        for (int c = W; c >= p[i]; c--) T[c] = max(T[c], T[c - p[i]] + v[i]);
    return T[W];
}

int mochilaForcaBruta(const vector<int>& p, const vector<int>& v, int W) {
    int n = p.size(), melhor = 0;
    for (int m = 0; m < (1 << n); m++) {
        int peso = 0, valor = 0;
        for (int i = 0; i < n; i++) if (m >> i & 1) { peso += p[i]; valor += v[i]; }
        if (peso <= W) melhor = max(melhor, valor);
    }
    return melhor;
}

string lcs(const string& a, const string& b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> T(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            T[i][j] = a[i - 1] == b[j - 1] ? T[i - 1][j - 1] + 1 : max(T[i - 1][j], T[i][j - 1]);
    string s;
    for (int i = n, j = m; i > 0 && j > 0;) {
        if (a[i - 1] == b[j - 1]) { s += a[i - 1]; i--; j--; }
        else if (T[i - 1][j] >= T[i][j - 1]) i--;
        else j--;
    }
    reverse(s.begin(), s.end());
    return s;
}

bool ehSubsequencia(const string& s, const string& t) {
    size_t k = 0;
    for (char c : t) if (k < s.size() && s[k] == c) k++;
    return k == s.size();
}

int edicao(const string& a, const string& b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> T(n + 1, vector<int>(m + 1));
    for (int i = 0; i <= n; i++) T[i][0] = i;
    for (int j = 0; j <= m; j++) T[0][j] = j;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            T[i][j] = min({T[i - 1][j] + 1, T[i][j - 1] + 1, T[i - 1][j - 1] + (a[i - 1] != b[j - 1])});
    return T[n][m];
}

// Versão recursiva direta da recorrência (exponencial): só para conferir.
int edicaoRecursiva(const string& a, const string& b, int i, int j) {
    if (i == 0) return j;
    if (j == 0) return i;
    return min({edicaoRecursiva(a, b, i - 1, j) + 1, edicaoRecursiva(a, b, i, j - 1) + 1,
                edicaoRecursiva(a, b, i - 1, j - 1) + (a[i - 1] != b[j - 1])});
}

int main() {
    vector<int> escolhidos;
    assert(mochila({1, 3, 4, 5}, {1, 4, 5, 7}, 7, &escolhidos) == 9);
    assert((escolhidos == vector<int>{1, 2}));
    assert(mochila({10, 20, 30}, {60, 100, 120}, 50) == 220);   // o guloso por valor/peso daria 160

    mt19937 rng(7);
    for (int t = 0; t < 500; t++) {
        int n = 1 + rng() % 10, W = rng() % 30;
        vector<int> p(n), v(n);
        for (int i = 0; i < n; i++) { p[i] = 1 + rng() % 12; v[i] = rng() % 20; }
        int bf = mochilaForcaBruta(p, v, W);
        assert(mochila(p, v, W) == bf && mochila1D(p, v, W) == bf);
    }
    cout << "Mochila 0/1 = força bruta em 500 casos: ok\n";

    assert(lcs("ABCBDAB", "BDCABA").size() == 4);
    for (int t = 0; t < 300; t++) {
        string a, b;
        for (int k = rng() % 9; k-- > 0;) a += char('a' + rng() % 3);
        for (int k = rng() % 9; k-- > 0;) b += char('a' + rng() % 3);
        string s = lcs(a, b);
        assert(ehSubsequencia(s, a) && ehSubsequencia(s, b));
        assert(edicao(a, b) == edicaoRecursiva(a, b, a.size(), b.size()));
        assert(edicao(a, b) == edicao(b, a));
    }
    assert(edicao("kitten", "sitting") == 3 && edicao("gato", "patos") == 2);
    cout << "LCS e distância de edição: ok (kitten → sitting = 3)\n";
    cout << "Todos os testes passaram.\n";
}
