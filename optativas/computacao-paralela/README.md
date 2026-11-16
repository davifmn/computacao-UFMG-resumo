# Computação Paralela · optativa

> Optativa do DCC · C/C++ com OpenMP, `std::thread` e atômicos.

Desde meados dos anos 2000 os processadores não ficam mais rápidos por núcleo na mesma
proporção: ficam com **mais núcleos**. Para um programa aproveitar isso, alguém precisa
dividir o trabalho, coordenar quem escreve onde e medir se a divisão compensou. A
disciplina trata de paralelismo em memória compartilhada: modelos de programação,
sincronização, desempenho e os erros clássicos (corridas, impasses, falso compartilhamento).

> A disciplina obrigatória [Fundamentos de Sistemas Paralelos e Distribuídos](../../periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/)
> cobre o lado distribuído (relógios lógicos, eleição, MapReduce) e as leis de speedup.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔨 | [Algoritmo de leilão](https://davifmn.github.io/computacao-UFMG-resumo/optativas/computacao-paralela/visualizacoes/leilao.html) | Trabalhadores dando lances por tarefas numa matriz de benefícios, os preços subindo e a atribuição convergindo ao ótimo. Compara a versão sequencial (Gauss-Seidel) com a paralelizável (Jacobi) e mostra o bug dos lances somados |

## 🧪 Trabalhos práticos

| Trabalho | Tema | Tecnologias |
|---|---|---|
| [Leilão paralelo para o problema da atribuição](trabalhos/leilao-paralelo/) | Sete versões do algoritmo de Bertsekas com estratégias de sincronização diferentes, benchmark com $n = 5000$ e verificador de corretude | C++17, OpenMP, atômicos |

## 📚 Resumo teórico

### 1. Desempenho

- **Speedup** $S_p = T_1 / T_p$ e **eficiência** $E_p = S_p / p$.
- **Amdahl**: com fração serial $f$, $S_p \le \frac{1}{f + (1 - f)/p} \to 1/f$. **Gustafson**: se o problema cresce com $p$, $S_p = p - f(p - 1)$.
- Escalabilidade **forte** (problema fixo) e **fraca** (problema cresce junto com $p$).
- O que come o speedup: trechos seriais, sincronização, desbalanceamento de carga, tráfego de memória.

### 2. Memória compartilhada e caches

- Coerência de cache (MESI): uma escrita invalida a linha nas outras caches.
- **Falso compartilhamento**: variáveis independentes na mesma linha de cache (64 bytes) fazem as caches brigarem. Correção: *padding* ou `alignas(64)`.
- **Modelo de memória**: sem sincronização, outra thread pode ver as escritas fora de ordem. Ordens de `std::atomic`: `relaxed`, `acquire`/`release`, `seq_cst`.

### 3. OpenMP

- `#pragma omp parallel for` divide as iterações; `schedule(static | dynamic, k | guided)` controla a divisão.
- Variáveis `shared` × `private`; `reduction(+:soma)` para acumular sem corrida.
- `critical`, `atomic`, `barrier`, `single`, `nowait`; tarefas (`task`) para paralelismo irregular.

### 4. Sincronização

- **Condição de corrida**: o resultado depende da intercalação. Seção crítica com **mutex**; **spinlock** quando a espera é curta.
- **Atômicos e CAS** (*compare-and-swap*): base das estruturas sem trava; cuidado com o problema ABA e com a disputa (backoff).
- **Impasse** (deadlock): espera circular; evita-se com ordem global de aquisição das travas.
- Granularidade: uma trava global é simples e serializa; uma por elemento escala, mas custa memória e cuidado.

### 5. Padrões

- Mapa, redução, *scan* (soma de prefixos), estêncil, divisão e conquista, pipeline.
- **Gauss-Seidel × Jacobi**: atualizar usando os valores mais novos (sequencial, converge mais rápido) ou os da iteração anterior (paralelizável, precisa de buffer).

## ✍️ Exercícios

1. Um programa tem 90% do tempo paralelizável. Qual o speedup máximo com 8 threads? E com infinitas?
2. Duas threads incrementam `cont[0]` e `cont[1]` de um `int cont[2]` um bilhão de vezes cada. Por que fica mais lento que uma thread só? Como corrigir?
3. O que está errado em `#pragma omp parallel for` seguido de `for (i...) soma += v[i];`? Corrija.
4. No algoritmo de leilão, um trabalhador vê valores líquidos $(5, 3, 4)$ com $\varepsilon = 0{,}5$. Qual tarefa e qual lance?
5. Por que a versão de Jacobi do leilão precisa comparar lances da mesma rodada em vez de simplesmente somá-los ao preço?

<details>
<summary>Gabarito</summary>

1. $S_8 = 1/(0{,}1 + 0{,}9/8) = 1/0{,}2125 \approx 4{,}7$. Com infinitas threads, $1/0{,}1 = 10$.
2. Falso compartilhamento: as duas posições estão na mesma linha de cache, e cada escrita invalida a cópia da outra thread. Separe os contadores em linhas diferentes (`struct alignas(64) { int v; } cont[2];`) ou acumule numa variável local e escreva uma vez no fim.
3. `soma += v[i]` é uma corrida (ler, somar, escrever não é atômico). Use `#pragma omp parallel for reduction(+:soma)`: cada thread acumula numa cópia privada e as cópias são somadas no fim.
4. Tarefa de valor 5; lance $= (5 - 4) + 0{,}5 = 1{,}5$ (a segunda melhor é 4, não 3).
5. Cada lance foi calculado com o preço do início da rodada e representa o máximo que aquele trabalhador aceita pagar. Somar dois lances cobra do vencedor mais do que ele ofereceu, quebra a $\varepsilon$-folga complementar e pode terminar fora do ótimo. O preço novo deve ser o **maior** lance.

</details>

## 🔗 Para ir além

- *An Introduction to Parallel Programming*, Peter Pacheco.
- *The Art of Multiprocessor Programming*, Herlihy e Shavit: sincronização e estruturas sem trava.
- *Network Optimization: Continuous and Discrete Models*, Dimitri Bertsekas: o algoritmo de leilão.
- [Especificação do OpenMP](https://www.openmp.org/specifications/).
