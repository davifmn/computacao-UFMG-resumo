// Processamento de cadeias: casamento de padrões (força bruta, KMP, Horspool)
// e compressão (Huffman e LZW, com o decodificador), conferidos contra a força bruta.
// Compile: g++ -std=c++17 -Wall -Wextra cadeias.cpp -o cadeias && ./cadeias
#include <cassert>
#include <iostream>
#include <map>
#include <queue>
#include <random>
#include <string>
#include <vector>

using namespace std;

// ---------- Casamento de padrões ----------

vector<int> forcaBruta(string t, string p) {
    int n = t.size(), m = p.size();
    vector<int> ocorr;
    for (int s = 0; s <= n - m; s++) {        // cada alinhamento possível
        int j = 0;
        while (j < m && t[s + j] == p[j]) j++;
        if (j == m) ocorr.push_back(s);       // casou o padrão inteiro
    }
    return ocorr;
}

vector<int> falha(string p) {
    int m = p.size();
    vector<int> f(m, 0);   // f[i] = maior borda própria de p[0..i]
    for (int i = 1, k = 0; i < m; i++) {
        while (k > 0 && p[i] != p[k]) k = f[k - 1];
        if (p[i] == p[k]) k++;
        f[i] = k;
    }
    return f;
}

vector<int> kmp(string t, string p) {
    vector<int> f = falha(p), ocorr;
    int m = p.size();
    for (int i = 0, q = 0; i < (int)t.size(); i++) {
        while (q > 0 && t[i] != p[q]) q = f[q - 1];  // desliza o padrão
        if (t[i] == p[q]) q++;
        if (q == m) { ocorr.push_back(i - m + 1); q = f[q - 1]; }
    }
    return ocorr;
}

vector<int> horspool(string t, string p) {
    int n = t.size(), m = p.size();
    vector<int> salto(256, m), ocorr;
    for (int j = 0; j < m - 1; j++)
        salto[(unsigned char)p[j]] = m - 1 - j;   // distância até o fim
    int s = 0;
    while (s <= n - m) {
        int j = m - 1;
        while (j >= 0 && p[j] == t[s + j]) j--;   // da direita para a esquerda
        if (j < 0) ocorr.push_back(s);
        s += salto[(unsigned char)t[s + m - 1]];  // último caractere da janela
    }
    return ocorr;
}

// ---------- Huffman ----------

struct No { int freq; char c; No *esq, *dir; };
struct Cmp { bool operator()(No* a, No* b) { return a->freq > b->freq; } };

No* huffman(map<char, int> freq) {
    priority_queue<No*, vector<No*>, Cmp> fila;   // menor freq no topo
    for (auto [c, f] : freq) fila.push(new No{f, c, nullptr, nullptr});
    while (fila.size() > 1) {
        No* a = fila.top(); fila.pop();           // as duas menores
        No* b = fila.top(); fila.pop();
        fila.push(new No{a->freq + b->freq, 0, a, b});
    }
    return fila.top();
}

void codigos(No* r, string pre, map<char, string>& cod) {
    if (!r->esq) { cod[r->c] = pre.empty() ? "0" : pre; return; }
    codigos(r->esq, pre + "0", cod);              // esquerda = 0
    codigos(r->dir, pre + "1", cod);              // direita = 1
}

string decodificaHuffman(No* raiz, const string& bits) {
    string out;
    No* r = raiz;
    for (char b : bits) {
        if (raiz->esq) r = b == '0' ? r->esq : r->dir;
        if (!r->esq) { out += r->c; r = raiz; }
    }
    return out;
}

// ---------- LZW ----------

vector<int> lzw(string s) {
    map<string, int> dic;
    for (int c = 0; c < 256; c++) dic[string(1, c)] = c;
    string w;
    vector<int> saida;
    for (char c : s) {
        if (dic.count(w + c)) w += c;             // ainda está no dicionário
        else {
            saida.push_back(dic[w]);              // emite o maior conhecido
            int novo = dic.size();
            dic[w + c] = novo;                    // aprende w + c
            w = string(1, c);
        }
    }
    if (!w.empty()) saida.push_back(dic[w]);
    return saida;
}

string lzwDecodifica(const vector<int>& cod) {
    map<int, string> dic;
    for (int c = 0; c < 256; c++) dic[c] = string(1, c);
    string ant = dic[cod[0]], out = ant;
    for (size_t i = 1; i < cod.size(); i++) {
        // código ainda desconhecido: só acontece no padrão cScSc, e vale ant + ant[0]
        string cur = dic.count(cod[i]) ? dic[cod[i]] : ant + ant[0];
        int novo = dic.size();
        dic[novo] = ant + cur[0];
        out += cur;
        ant = cur;
    }
    return out;
}

int main() {
    // Exemplo do CLRS (fig. 32.10)
    string t = "ABABDABACDABABCABAB", p = "ABABCABAB";
    assert(kmp(t, p) == vector<int>{10});
    assert((falha("ABABCABAB") == vector<int>{0, 0, 1, 2, 0, 1, 2, 3, 4}));
    assert((falha("AABAACAABAA") == vector<int>{0, 1, 0, 1, 2, 0, 1, 2, 3, 4, 5}));

    // Os três concordam em 20 mil casos aleatórios (alfabeto pequeno = muitas repetições)
    mt19937 rng(42);
    for (int it = 0; it < 20000; it++) {
        string tt, pp;
        int n = rng() % 30 + 1, m = rng() % 5 + 1, sigma = rng() % 3 + 2;
        for (int i = 0; i < n; i++) tt += char('a' + rng() % sigma);
        for (int i = 0; i < m; i++) pp += char('a' + rng() % sigma);
        auto r = forcaBruta(tt, pp);
        assert(kmp(tt, pp) == r);
        assert(horspool(tt, pp) == r);
    }
    cout << "casamento: forca bruta, KMP e Horspool concordam em 20000 casos\n";

    // Huffman: ABRACADABRA = 23 bits; decodifica de volta
    for (string s : {string("ABRACADABRA"), string("o rato roeu a roupa do rei de roma")}) {
        map<char, int> freq;
        for (char c : s) freq[c]++;
        No* r = huffman(freq);
        map<char, string> cod;
        codigos(r, "", cod);
        string bits;
        for (char c : s) bits += cod[c];
        assert(decodificaHuffman(r, bits) == s);
        cout << "huffman \"" << s << "\": " << bits.size() << " bits (ASCII: " << 8 * s.size() << ")\n";
        if (s == "ABRACADABRA") assert(bits.size() == 23);
    }

    // LZW: exemplo clássico e o caso especial cScSc
    vector<int> esperado = {84, 79, 66, 69, 79, 82, 78, 79, 84, 256, 258, 260, 265, 259, 261, 263};
    assert(lzw("TOBEORNOTTOBEORTOBEORNOT") == esperado);
    for (string s : {string("TOBEORNOTTOBEORTOBEORNOT"), string("abababababab"), string("aaaaaaaaaa"), string("x")})
        assert(lzwDecodifica(lzw(s)) == s);
    cout << "lzw: TOBEORNOT... -> " << esperado.size() << " codigos; decodificacao confere\n";
}
