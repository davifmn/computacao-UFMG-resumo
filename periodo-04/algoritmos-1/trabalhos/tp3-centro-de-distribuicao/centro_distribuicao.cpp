// TP3 de Algoritmos I (DCC206/UFMG) — Centro de distribuição.
//
// Problema: o centro de distribuição dispõe de k tipos de ligas metálicas, cada
// tipo com um tamanho fixo e estoque ilimitado. Para atender a uma demanda D, quer
// usar o MENOR número de ligas cuja soma dos tamanhos seja exatamente D.
// É o problema do troco com moedas ilimitadas, resolvido por programação dinâmica.
//
// Entrada: T casos; cada caso tem "k D" seguido dos k tamanhos.
// Saída:   para cada caso, o número mínimo de ligas.
//
// Complexidade: O(k·D) de tempo e de memória (pseudopolinomial: cresce com o VALOR
// de D, não com o número de bits da entrada).

#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

const int INF = 0x3f3f3f3f;

class LigasMetalicas {
public:
    explicit LigasMetalicas(vector<int> tamanhos) : ligas(std::move(tamanhos)) {}

    // cortes[i][j] = menor número de ligas, usando só os i primeiros tipos,
    // cuja soma é exatamente j (INF se impossível).
    int minimoDeLigas(int demanda) const {
        int k = ligas.size();
        vector<vector<int>> cortes(k + 1, vector<int>(demanda + 1, INF));
        for (int i = 0; i <= k; i++)
            cortes[i][0] = 0;  // demanda zero: nenhuma liga

        for (int i = 1; i <= k; i++) {
            for (int j = 1; j <= demanda; j++) {
                cortes[i][j] = cortes[i - 1][j];  // não usa o tipo i
                if (ligas[i - 1] <= j)            // usa mais uma liga do tipo i
                    // mesma linha i: o tipo i pode ser usado de novo (estoque ilimitado)
                    cortes[i][j] = min(cortes[i][j], cortes[i][j - ligas[i - 1]] + 1);
            }
        }
        return cortes[k][demanda];
    }

private:
    vector<int> ligas;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int casos;
    cin >> casos;
    while (casos--) {
        int k, demanda;
        cin >> k >> demanda;
        vector<int> tamanhos(k);
        for (int& t : tamanhos) cin >> t;
        cout << LigasMetalicas(tamanhos).minimoDeLigas(demanda) << '\n';
    }
    return 0;
}
