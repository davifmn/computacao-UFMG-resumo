# Projeto "formas": make | make run | make test | make clean
CXX      ?= g++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -pedantic -g
CPPFLAGS := -Iinclude
BUILD    := build

# Todos os .cpp de src/ menos o main viram a "biblioteca" usada pelo programa e pelos testes.
LIB_SRCS := $(filter-out src/main.cpp,$(wildcard src/*.cpp))
LIB_OBJS := $(LIB_SRCS:src/%.cpp=$(BUILD)/%.o)

all: $(BUILD)/programa

$(BUILD)/programa: $(LIB_OBJS) $(BUILD)/main.o
	$(CXX) $(CXXFLAGS) $^ -o $@

$(BUILD)/testes: $(LIB_OBJS) $(BUILD)/teste_formas.o
	$(CXX) $(CXXFLAGS) $^ -o $@

# -MMD gera arquivos .d com as dependências de cada .cpp (quais .hpp ele inclui):
# se um cabeçalho mudar, só o que depende dele é recompilado.
$(BUILD)/%.o: src/%.cpp | $(BUILD)
	$(CXX) $(CXXFLAGS) $(CPPFLAGS) -MMD -MP -c $< -o $@

$(BUILD)/%.o: tests/%.cpp | $(BUILD)
	$(CXX) $(CXXFLAGS) $(CPPFLAGS) -MMD -MP -c $< -o $@

$(BUILD):
	mkdir -p $@

run: $(BUILD)/programa
	./$(BUILD)/programa

test: $(BUILD)/testes
	./$(BUILD)/testes

clean:
	rm -rf $(BUILD)

-include $(wildcard $(BUILD)/*.d)

.PHONY: all run test clean
