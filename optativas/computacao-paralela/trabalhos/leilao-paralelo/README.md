# Algoritmo de leilão paralelo para o problema da atribuição

**Computação Paralela · UFMG** · C++17 · OpenMP · `std::thread` · atômicos

O **problema da atribuição**: $n$ trabalhadores, $n$ tarefas e um benefício $c_{wt}$ para
cada par; escolher uma tarefa por trabalhador maximizando o benefício total. O
**algoritmo de leilão** de Bertsekas resolve isso como um mercado, e é naturalmente
paralelo: cada trabalhador livre lê os preços, escolhe a tarefa de maior valor líquido
$c_{wt} - p_t$ e dá um lance $(v_1 - v_2) + \varepsilon$ que aumenta o preço dela. O
trabalho implementa a versão sequencial e seis estratégias paralelas e compara os tempos
com $n = 5000$.

## As versões

| Arquivo | Estratégia | Sincronização |
|---|---|---|
| `v0_sequencial.cpp` | Gauss-Seidel: um trabalhador livre por vez | — |
| `v1_mutex_por_tarefa.cpp` | busca paralela (OpenMP) e atualização direta | um `std::mutex` por tarefa |
| `v1b_spinlock_alinhado.cpp` | igual à v1 | spinlocks com `alignas(64)`, uma linha de cache cada, contra falso compartilhamento |
| `v2_atomico_cas.cpp` | assíncrona com `std::thread` | CAS em `atomic<double>`, backoff exponencial, mutex de reserva |
| `v3_lances_em_lote.cpp` | Jacobi: cada thread acumula lances num buffer local; uma redução escolhe o vencedor por tarefa | nenhuma trava na fase de lances |
| `v3b_lote_esparso.cpp` | igual à v3, com rodada carimbada em cada lance (sem limpar o buffer) e lista esparsa das tarefas tocadas | idem |
| `v4_busca_paralela.cpp` | só a busca do melhor/segundo melhor é paralela; os lances são aplicados em sequência | nenhuma |
| `geradores.cpp` | matrizes de benefício: aleatória, permutação por linha, custo reverso, triangular, quase empatada | |

## Como executar

Precisa de um compilador com OpenMP. No macOS, o clang da Apple não tem; use o GCC do
Homebrew (`brew install gcc`).

```bash
make CXX=g++-15            # no Linux: make
./leilao v0                # 15 execuções com n = 5000
./leilao v4 2000 8         # v3 e v4 aceitam n e o número de threads
./leilao todas
make test CXX=g++-15       # verificador de corretude (v0, v1, v1b, v3, v3b, v4)
./verifica --v2            # inclui a v2 experimental (pode não terminar)
```

## Verificação de corretude

`verifica.cpp` roda todas as versões em matrizes inteiras aleatórias com $n \in \{5, 7, 60, 200\}$
e $\varepsilon = 1/(n+1)$. Com benefícios inteiros e $\varepsilon < 1/n$, o leilão
termina no **ótimo**, então cada versão precisa devolver uma atribuição perfeita com o mesmo
benefício da força bruta ($n \le 8$) ou da versão sequencial.

```
$ ./verifica --v2
120/120 verificações corretas (v0, v1, v1b, v3, v3b, v4)
v2 (experimental): 7/20 corretas      # varia entre execuções (7 a 11 de 20 nos testes)
```

## O que mudou na migração

- **Bug corrigido na v4.** A fase de aplicação fazia `preco[t] += lance` para cada lance
  em sequência. Os lances de uma rodada são calculados com os preços do **início** da
  rodada; quando dois trabalhadores disputavam a mesma tarefa, os dois incrementos se
  somavam e o vencedor pagava mais do que tinha oferecido. Isso quebra a $\varepsilon$-folga
  complementar, e a v4 terminava abaixo do ótimo em parte das instâncias do verificador
  (inclusive em matrizes 7 × 7). Agora o preço é $p_t^{\text{início}} + \text{lance}$ e vence o maior
  lance, como no leilão de Jacobi.
- **Mesma correção, versão assíncrona, na v1 e na v1b.** O lance era calculado com o
  preço lido sem trava e, já com a trava, somado ao preço **atual**, que outra thread
  podia ter aumentado nesse meio-tempo. Agora o preço oferecido é
  $p_t^{\text{lido}} + \text{lance}$; se não supera o preço atual, o lance perde e o
  trabalhador tenta de novo na rodada seguinte. Antes, a v1 errava de forma intermitente
  (cerca de 1 execução do verificador em 4); depois, 25 execuções seguidas sem falha.
- **v2 marcada como experimental, sem correção.** Ela tem uma condição de corrida de
  projeto: a cada 32 iterações, cada thread faz uma "varredura completa" de **todos** os
  trabalhadores, então duas threads podem processar o mesmo trabalhador ao mesmo tempo. Ele
  dá dois lances, só uma atribuição vinga, e o contador de livres chega a zero com
  trabalhadores ainda sem tarefa (ou, se o contador desandar para o outro lado, as threads
  giram para sempre). Por isso ela fica fora do `make test`. Corrigir exige reservar o trabalhador antes do lance (por
  exemplo, um CAS em `assignment[w]` de −1 para "ocupado"), o que muda o desenho da versão.
- Arquivos renomeados (`prll1_opt.cpp` → `v1b_spinlock_alinhado.cpp` etc.), cabeçalhos
  descrevendo cada estratégia, `main.cpp` com seleção da versão pela linha de comando,
  `Makefile` e o verificador.

## Veja também

- Visualização: [algoritmo de leilão passo a passo](https://davifmn.github.io/computacao-UFMG-resumo/optativas/computacao-paralela/visualizacoes/leilao.html), com Gauss-Seidel, Jacobi e o bug da v4 numa instância 4 × 4
- Teoria: [README de Computação Paralela](../../README.md)

---
Autor: Davi Fraga · migrado de [`davifmn/parallelism_assignment-problem_auction-algorithm`](https://github.com/davifmn/parallelism_assignment-problem_auction-algorithm)
