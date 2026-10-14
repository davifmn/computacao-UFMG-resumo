# Compila e executa todos os exemplos:  make test
CXX      ?= g++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -pedantic -O2
SRCS     := $(wildcard *.cpp)
BINS     := $(SRCS:.cpp=)

all: $(BINS)

%: %.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

test: all
	@for b in $(BINS); do echo "== $$b"; ./$$b || exit 1; done

clean:
	rm -f $(BINS)

.PHONY: all test clean
