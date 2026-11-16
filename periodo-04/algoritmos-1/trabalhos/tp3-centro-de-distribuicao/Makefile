CXX      ?= g++
CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra

centro_distribuicao: centro_distribuicao.cpp
	$(CXX) $(CXXFLAGS) -o $@ $<

# Roda cada entrada de testes/entradas e compara com a saída esperada.
test: centro_distribuicao
	@ok=0; falhou=0; \
	for in in testes/entradas/*.txt; do \
		esperado="testes/saidas/$$(basename $$in .txt).sol"; \
		if ./centro_distribuicao < "$$in" | diff -q - "$$esperado" > /dev/null; then ok=$$((ok + 1)); \
		else echo "FALHOU: $$in"; ./centro_distribuicao < "$$in" | diff - "$$esperado"; falhou=$$((falhou + 1)); fi; \
	done; \
	echo "$$ok casos passaram, $$falhou falharam"; test $$falhou -eq 0

clean:
	rm -f centro_distribuicao

.PHONY: test clean
