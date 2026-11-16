# Requer um compilador com OpenMP. No macOS, o clang da Apple não traz OpenMP:
#   brew install gcc   e depois   make CXX=g++-15
CXX      ?= g++
CXXFLAGS ?= -std=c++17 -O3 -fopenmp -Wall

VERSOES = v0_sequencial.cpp v1_mutex_por_tarefa.cpp v1b_spinlock_alinhado.cpp v2_atomico_cas.cpp \
          v3_lances_em_lote.cpp v3b_lote_esparso.cpp v4_busca_paralela.cpp geradores.cpp

leilao: main.cpp $(VERSOES)
	$(CXX) $(CXXFLAGS) -o $@ $^ -lpthread

verifica: verifica.cpp $(VERSOES)
	$(CXX) $(CXXFLAGS) -o $@ $^ -lpthread

test: verifica
	./verifica

clean:
	rm -f leilao verifica

.PHONY: test clean
