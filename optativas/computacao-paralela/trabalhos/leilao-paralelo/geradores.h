#pragma once

// Geradores de matrizes de benefício usadas nos experimentos.

#include <vector>

int random_between_1_and_n(int n);

std::vector<std::vector<int>> gerar_matriz_base(int n);
std::vector<std::vector<int>> gerador_matrizes_permutacao(int n);
std::vector<std::vector<double>> gerar_matriz_custo_reverso(int n);
std::vector<std::vector<int>> gerar_matriz_triangular(int n);
std::vector<std::vector<int>> gerar_matriz_quase_empatada(int n);