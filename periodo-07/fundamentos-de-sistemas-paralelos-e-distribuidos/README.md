# Fundamentos de Sistemas Paralelos e Distribuídos · DCC641

> 7º período · 30h · Departamento de Ciência da Computação.

Um computador moderno tem vários núcleos, e um serviço moderno roda em muitas máquinas.
Esta disciplina dá os fundamentos dos dois mundos: no **paralelo**, quanto dá para ganhar
e como medir (Amdahl, trabalho e caminho crítico); no **distribuído**, o que muda quando
não há memória nem relógio compartilhados (ordem causal, eleição, consenso, falhas) e os
modelos de programação que escondem essa complexidade (MapReduce).

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🚀 | [Speedup e DAGs](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/visualizacoes/speedup.html) | Curvas de Amdahl e Gustafson; um DAG de tarefas com trabalho, caminho crítico e o escalonamento guloso passo a passo em p processadores (limite de Brent) |
| 🕰️ | [Relógios lógicos](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/visualizacoes/relogios.html) | Diagrama espaço-tempo com relógios de Lamport e vetoriais; clique em dois eventos para ver se um aconteceu antes do outro ou se são concorrentes; acrescente eventos e mensagens |
| 👑 | [Eleição de líder](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/visualizacoes/eleicao.html) | Algoritmo do valentão × eleição em anel, escolhendo quem caiu e quem percebe, contando mensagens |
| 🗺️ | [MapReduce](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/visualizacoes/mapreduce.html) | Contagem de palavras fase a fase: divisão, map, embaralhamento por chave e reduce |

## 📚 Resumo teórico

### 1. Arquiteturas e modelos

- Taxonomia de Flynn (SISD, SIMD, MIMD); memória compartilhada (multicore, coerência de cache) × memória distribuída (clusters, troca de mensagens); GPUs.
- Programação: threads/OpenMP (memória compartilhada), MPI (mensagens), CUDA (GPU), MapReduce/Spark (dados).

### 2. Desempenho

- Speedup $S_p = T_1/T_p$, eficiência $S_p/p$; **Amdahl** ($S \le 1/s$) e **Gustafson** ($S = p - s(p-1)$); escalabilidade forte e fraca.
- **Trabalho** $T_1$, **caminho crítico** $T_\infty$, paralelismo $T_1/T_\infty$; teorema de **Brent**: $T_p \le T_1/p + T_\infty$ para escalonadores gulosos.
- Custos de comunicação, balanceamento de carga, granularidade.

### 3. Sistemas distribuídos

- Características: concorrência, ausência de relógio global, falhas independentes. Modelos síncrono × assíncrono; falhas por parada × bizantinas.
- **Tempo**: sincronização de relógios físicos (Cristian, Berkeley, NTP); **relógios lógicos** de Lamport e **vetoriais**; ordem causal e total.
- **Exclusão mútua** distribuída (centralizada, Ricart-Agrawala, anel com token); **eleição** (valentão, anel).
- **Consenso**: o resultado de impossibilidade FLP; Paxos e Raft (líder, mandatos, maiorias, replicação de log); **teorema CAP**.
- **Replicação e consistência**: forte, sequencial, causal, eventual; quóruns.
- **Comunicação**: RPC, mensagens, publish/subscribe.

## 💻 Código

```bash
python3 codigo/fspd.py
```

| Arquivo | Conteúdo |
|---|---|
| [`fspd.py`](codigo/fspd.py) | MapReduce de contagem de palavras com `multiprocessing` (igual ao sequencial com 1, 2 e 4 processos), speedup medido de uma tarefa de CPU, relógios de Lamport e vetoriais (com a propriedade conferida em todos os pares) e as duas eleições |

## ✍️ Exercícios

1. Um programa gasta 20% do tempo numa parte serial. Qual o speedup com 8 processadores? E o máximo?
2. Uma soma de $n$ números em árvore: qual o trabalho, o caminho crítico e o paralelismo?
3. P1 envia uma mensagem a P2 com relógio de Lamport 5; o relógio de P2 está em 3. Qual o relógio do evento de recebimento?
4. Os vetores [3, 1, 0] e [2, 2, 1] correspondem a eventos relacionados ou concorrentes?
5. No algoritmo do valentão com processos 1 a 5, o 5 caiu e o 1 percebe. Quantas mensagens são trocadas?
6. Por que o MapReduce consegue simplesmente reexecutar tarefas de máquinas que falharam?

<details>
<summary>Gabarito</summary>

1. $1 / (0{,}2 + 0{,}8/8) = 1/0{,}3 \approx$ **3,33×**; máximo $1/0{,}2 = $ **5×**.
2. Trabalho $n - 1$ somas, caminho $\lceil \log_2 n \rceil$, paralelismo $\approx n / \log_2 n$.
3. $\max(3, 5) + 1 = $ **6**.
4. **Concorrentes**: 3 > 2 na primeira componente, mas 1 &lt; 2 na segunda.
5. ELEIÇÃO: 1→{2,3,4,5} (4), 2→{3,4,5} (3), 3→{4,5} (2), 4→{5} (1) = 10; OK: 3 + 2 + 1 = 6; COORDENADOR de 4 para 1, 2, 3 = 3. Total **19**.
6. Porque map e reduce são determinísticos e sem efeitos colaterais: rodar de novo dá o mesmo resultado, e as saídas parciais só são aceitas uma vez.

</details>

## 🔗 Para ir além

- *Sistemas Distribuídos: Princípios e Paradigmas*, Tanenbaum e van Steen (gratuito em [distributed-systems.net](https://www.distributed-systems.net/)).
- *Designing Data-Intensive Applications*, Martin Kleppmann: replicação, consistência e consenso na prática.
- [The Raft Consensus Algorithm](https://raft.github.io/): o artigo e uma visualização interativa do Raft.
- Dean e Ghemawat, "MapReduce: Simplified Data Processing on Large Clusters" (OSDI 2004).
