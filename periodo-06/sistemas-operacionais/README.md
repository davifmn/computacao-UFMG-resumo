# Sistemas Operacionais · DCC605

> 6º período · 60h · Departamento de Ciência da Computação · pré-requisito: Organização de Computadores I.

O sistema operacional é o programa que faz um computador com uma CPU, uma memória e um
disco parecer muitos computadores, um para cada programa, e que impede que esses
programas se atrapalhem. A disciplina estuda as abstrações que ele cria (**processos,
threads, memória virtual, arquivos**) e os algoritmos por trás delas: escalonamento,
sincronização, alocação de memória e de disco.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| ⏱️ | [Escalonamento de CPU](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/sistemas-operacionais/visualizacoes/escalonamento.html) | FCFS, SJF, SRTF, prioridade e Round-Robin unidade a unidade: fila de prontos, preempções, gráfico de Gantt e as esperas médias de todas as políticas lado a lado |
| 🧵 | [Concorrência](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/sistemas-operacionais/visualizacoes/concorrencia.html) | Você escolhe qual thread executa cada instrução: perca atualizações num contador, proteja-o com mutex, rode o produtor-consumidor com semáforos e provoque um deadlock; depois veja todas as intercalações possíveis |
| 🏦 | [Deadlock e banqueiro](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/sistemas-operacionais/visualizacoes/banqueiro.html) | O algoritmo do banqueiro testando a segurança do estado, com pedidos que são concedidos, que esperam por falta de recursos e que esperam por levarem a um estado inseguro |
| 📄 | [Substituição de páginas](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/sistemas-operacionais/visualizacoes/paginacao.html) | FIFO, LRU, ótimo e relógio na tabela clássica de quadros × referências, e o gráfico de faltas × quadros que mostra a anomalia de Belady |

## 📚 Resumo teórico

### 1. Visão geral

- Modo usuário × **modo núcleo**; **chamadas de sistema** e interrupções; núcleo monolítico × micronúcleo.
- O SO como gerente de recursos e como "máquina estendida" (abstrações).

### 2. Processos e threads

- **Processo** = programa em execução: espaço de endereços, registradores, arquivos abertos. Estados: novo, pronto, executando, bloqueado, terminado. **PCB** e **troca de contexto**.
- `fork`/`exec`/`wait` no Unix; comunicação entre processos (pipes, memória compartilhada, mensagens).
- **Threads** compartilham o espaço de endereços: criação barata, comunicação fácil, e todos os problemas de concorrência.

### 3. Escalonamento de CPU

- Métricas: utilização, vazão, tempo de retorno, espera, resposta.
- FCFS (efeito comboio), SJF (ótimo para a espera média; estimativa por média exponencial), SRTF, prioridade (inanição e envelhecimento), Round-Robin (escolha do quantum), filas multinível com realimentação; escalonamento em multiprocessadores e de tempo real.

### 4. Sincronização

- **Condição de corrida** e **região crítica**: exclusão mútua, progresso, espera limitada. Algoritmo de Peterson; instruções atômicas (test-and-set, compare-and-swap).
- **Mutex**, **semáforos** (contadores e binários), **monitores** e **variáveis de condição**.
- Problemas clássicos: produtor-consumidor, leitores-escritores, jantar dos filósofos.

### 5. Deadlock

- Condições de Coffman: exclusão mútua, posse e espera, não preempção, espera circular. Grafo de alocação de recursos.
- Prevenção (negar uma condição), **evitação** (estado seguro, algoritmo do banqueiro), detecção e recuperação, ou ignorar.

### 6. Memória

- Endereços lógicos × físicos, MMU; alocação contígua (first/best/worst fit) e fragmentação externa.
- **Paginação**: tabela de páginas (multinível, invertida), **TLB**; segmentação.
- **Memória virtual**: paginação sob demanda, falta de página, **substituição** (FIFO, ótimo, LRU, relógio), anomalia de Belady, conjunto de trabalho e **thrashing**.

### 7. Armazenamento e arquivos

- Escalonamento de disco (FCFS, SSTF, SCAN, C-SCAN); SSDs.
- Sistemas de arquivos: diretórios, i-nodes, alocação contígua/encadeada/indexada, journaling; RAID.

## 💻 Código

```bash
cd codigo && make test
```

| Arquivo | Conteúdo |
|---|---|
| [`concorrencia.c`](codigo/concorrencia.c) | POSIX threads: o contador perdendo milhões de atualizações sem trava, o mesmo contador correto com mutex e o produtor-consumidor com buffer limitado (mutex + variáveis de condição), conferido item a item |
| [`so.py`](codigo/so.py) | Simuladores de escalonamento, banqueiro, substituição de páginas e escalonamento de disco, conferidos com os exemplos do Silberschatz; LRU e ótimo sem anomalia de Belady em 300 sequências aleatórias |

## ✍️ Exercícios

1. Processos P1 a P4 chegam em t = 0 com rajadas 6, 8, 7 e 3. Calcule a espera média com FCFS e com SJF.
2. Com Round-Robin (quantum 4) e os mesmos processos, desenhe o gráfico de Gantt.
3. Duas threads executam `x = x + 1` 100 vezes cada, com x = 0. Qual o menor valor final possível?
4. Para a sequência 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 com 3 quadros, quantas faltas têm FIFO, LRU e ótimo?
5. No exemplo do banqueiro (disponível (3, 3, 2)), o pedido de P1 por (1, 0, 2) pode ser atendido? E, depois dele, o de P0 por (0, 2, 0)?
6. Por que o algoritmo do relógio é usado em vez do LRU exato?
7. Fila de pedidos de disco 98 183 37 122 14 124 65 67, cabeça no cilindro 53: quantos cilindros o braço percorre com FCFS e com SSTF?

<details>
<summary>Gabarito</summary>

1. FCFS: esperas 0, 6, 14, 21, média **10,25**. SJF (ordem P4, P1, P3, P2): esperas 3, 16, 9, 0, média **7**.
2. P1 0–4, P2 4–8, P3 8–12, P4 12–15, P1 15–17, P2 17–21, P3 21–24.
3. **2**. T1 lê 0 e é interrompida; T2 faz 99 incrementos; T1 escreve 1; T2 lê 1 e é interrompida; T1 termina as suas 99; T2 escreve 2. (Não é 1, nem 100!)
4. FIFO **15**, LRU **12**, ótimo **9**.
5. Sim: após conceder, disponível = (2, 3, 0) e a sequência P1, P3, P4, P0, P2 continua possível. Depois, P0 (0, 2, 0) **não**: o estado resultante, com disponível (2, 1, 0), é inseguro.
6. LRU exato exigiria registrar o instante de cada acesso à memória (ou manter uma pilha), caro demais em hardware. O relógio só precisa do bit de referência, que a MMU já liga a cada acesso.
7. FCFS: **640** cilindros. SSTF (53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183): **236**.

</details>

## 🔗 Para ir além

- *Fundamentos de Sistemas Operacionais*, Silberschatz, Galvin e Gagne: o livro-texto (os exemplos desta página são dele).
- *Sistemas Operacionais Modernos*, Andrew Tanenbaum.
- [*Operating Systems: Three Easy Pieces*](https://pages.cs.wisc.edu/~remzi/OSTEP/), Arpaci-Dusseau: gratuito, didático, com capítulos curtos sobre virtualização, concorrência e persistência.
- [xv6](https://github.com/mit-pdos/xv6-riscv): um Unix pequeno do MIT, em RISC-V, para ler o código de um núcleo de verdade.
