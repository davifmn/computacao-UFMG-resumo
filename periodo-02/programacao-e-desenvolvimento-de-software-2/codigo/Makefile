# Exemplos avulsos de PDS II + o projeto "formas":  make test
CXX      ?= g++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -pedantic -O2

test: vetor
	./vetor
	$(MAKE) -C formas test

vetor: vetor.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

clean:
	rm -f vetor
	$(MAKE) -C formas clean

.PHONY: test clean
