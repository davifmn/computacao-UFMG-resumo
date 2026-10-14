# Compila e executa os exemplos:  make test
CC      ?= cc
CFLAGS  ?= -std=c11 -Wall -Wextra -O2 -pthread

all: concorrencia

concorrencia: concorrencia.c
	$(CC) $(CFLAGS) $< -o $@

test: all
	./concorrencia
	python3 so.py

clean:
	rm -f concorrencia

.PHONY: all test clean
