# TP3 · Centro de distribuição

**Algoritmos I (DCC206) · UFMG** · C++17 · programação dinâmica

Um centro de distribuição corta ligas metálicas de **k tamanhos fixos** (estoque ilimitado
de cada um) para atender a demanda **D** de um cliente. Qual é o **menor número de ligas**
cuja soma dos tamanhos dá exatamente D?

É o problema do troco com moedas ilimitadas: escolher gulosamente a maior liga pode falhar
(com tamanhos 1, 5, 10, 20, 25 e D = 40, o guloso usa 25 + 10 + 5 = 3 ligas, e 20 + 20 = 2).

## Solução

`cortes[i][j]` é o menor número de ligas, usando só os `i` primeiros tamanhos, que soma `j`:

$$
\text{cortes}[i][j] = \min\big(\underbrace{\text{cortes}[i-1][j]}_{\text{não usa o tamanho } i},\ \underbrace{\text{cortes}[i][j - t_i] + 1}_{\text{usa mais uma liga de tamanho } t_i}\big)
$$

com `cortes[i][0] = 0` e infinito quando a soma é impossível. A segunda opção fica na
**mesma linha** `i`, e é isso que permite repetir o mesmo tamanho.

| | Complexidade |
|---|---|
| Tempo | O(k · D) |
| Memória | O(k · D) (dá para reduzir a O(D) com um vetor só) |

O tempo é **pseudopolinomial**: cresce com o *valor* de D, que ocupa só log D bits na
entrada. O relatório discute por que a versão de decisão do problema é NP-completa por
redução da mochila, o que não contradiz um algoritmo O(k · D).

## Como executar

```bash
make                 # compila centro_distribuicao
make test            # roda os 7 casos de testes/entradas e compara com testes/saidas
./centro_distribuicao < testes/entradas/caso1.txt
```

Formato da entrada: número de casos `T`; para cada caso, `k D` e depois os `k` tamanhos.
A saída é o mínimo de ligas por caso.

```
entrada            saída
3
6 126
1 5 10 15 25 50    4
5 40
1 5 10 20 25       2
...
```

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `centro_distribuicao.cpp` | solução |
| `Makefile` | `make`, `make test`, `make clean` |
| `testes/entradas`, `testes/saidas` | 7 casos de teste com a saída esperada (até 605 linhas) |
| `relatorio.pdf` | documentação entregue: modelagem, complexidade e NP-completude |

## O que mudou na migração

Lógica idêntica à entregue. A matriz alocada com `new` (e nunca liberada) virou
`std::vector`, o Makefile ganhou o alvo `test` e os casos de teste foram renomeados.
Todos os 7 casos passam.

## Veja também

- Teoria de programação dinâmica e o problema do troco: [README de Algoritmos I](../../README.md)
- Visualização: [programação dinâmica preenchendo a tabela](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/algoritmos-1/visualizacoes/programacao-dinamica.html)

---
Autor: Davi Fraga · migrado de [`davifmn/ufmg-algoritmos-1`](https://github.com/davifmn/ufmg-algoritmos-1)
