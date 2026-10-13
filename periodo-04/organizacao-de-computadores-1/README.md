# Organização de Computadores I · DCC006

> 4º período · 60h · Pré-requisito: Introdução a Sistemas Lógicos · Leva a Sistemas Operacionais.

A ponte entre o software e as portas lógicas: como uma linha de C vira instruções de
máquina, como o processador as executa e por que a memória é o gargalo. A disciplina
segue o *Organização e Projeto de Computadores* (Patterson e Hennessy), com a arquitetura
**RISC-V**.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔌 | [Caminho de dados RISC-V](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/organizacao-de-computadores-1/visualizacoes/caminho-de-dados.html) | Um simulador monociclo: cada instrução acende os fios e unidades que usa, com os sinais de controle, o banco de registradores, a memória de dados e a codificação binária. Programas prontos (soma de vetor, Fibonacci, máximo, chamada de função) ou o seu próprio assembly |
| 🏭 | [Pipeline](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/organizacao-de-computadores-1/visualizacoes/pipeline.html) | O diagrama de ciclos de 5 estágios com bolhas, adiantamento (setas), o load-use e o descarte de instruções depois de um desvio tomado, com e sem forwarding |
| 🗃️ | [Memória cache](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/organizacao-de-computadores-1/visualizacoes/cache.html) | Endereço dividido em tag, índice e deslocamento; acertos e faltas em caches diretas, associativas e totalmente associativas, com LRU e a classificação dos 3 Cs |

## 📚 Resumo teórico

### 1. Desempenho

$$\text{tempo de CPU} = \text{instruções} \times \text{CPI} \times \text{período do relógio}$$

- Compare máquinas pelo tempo de execução, não pela frequência. MIPS e frequência isolados enganam.
- **Lei de Amdahl:** acelerar uma parte que ocupa a fração $f$ do tempo por um fator $s$ dá ganho total $\dfrac{1}{(1 - f) + f/s}$. A parte não acelerada limita tudo.

### 2. A linguagem de máquina (RISC-V)

- 32 registradores de 32 bits (`x0` sempre vale 0). Arquitetura **load/store**: só `lw`/`sw` acessam a memória.
- Formatos R, I, S, B, U e J, todos de 32 bits, com rs1, rs2 e rd sempre nos mesmos bits.
- Endereçamento a byte, palavras de 4 bytes: `v[i]` está em `base + 4*i`.
- Desvios relativos ao PC (`beq`, `bne`, `blt`, `bge`), saltos `jal` (chama função, guarda o retorno em `ra`) e `jalr` (retorna).
- **Convenção de chamada**: argumentos em `a0`–`a7`, retorno em `a0`, `s0`–`s11` preservados pela função chamada, pilha crescendo para baixo a partir de `sp`.

### 3. Aritmética

- Complemento de dois, overflow (o RISC-V não gera exceção: o software testa), multiplicação por somas e deslocamentos, divisão por restauração.
- Ponto flutuante IEEE 754 (veja a visualização de [Introdução à Computação](../../periodo-01/introducao-a-computacao/)).

### 4. O processador

- **Monociclo**: tudo num ciclo, cujo período é ditado pela instrução mais lenta (`lw`). Unidade de controle gera RegWrite, ALUSrc, MemRead, MemWrite, MemtoReg, Branch e ALUOp a partir do opcode.
- **Pipeline** de 5 estágios (IF, ID, EX, MEM, WB) com registradores entre os estágios. Ideal: CPI = 1.
- **Conflitos**: estruturais, de dados (adiantamento; bolha no load-use) e de controle (previsão de desvio, descarte).
- Além do pipeline: superescalar (várias instruções por ciclo), execução fora de ordem, previsão dinâmica com contadores de 2 bits.

### 5. Hierarquia de memória

- Localidade temporal e espacial. Registradores → L1 → L2 → L3 → DRAM → disco, cada nível maior e mais lento.
- **Cache**: mapeamento direto, associativa por conjunto, totalmente associativa. Endereço = tag | índice | deslocamento.
- Faltas: compulsórias, de capacidade e de conflito (os 3 Cs). Substituição LRU. Escrita *write-through* (com buffer) ou *write-back* (com bit de sujo).
- Tempo médio de acesso = $t_\text{acerto}$ + taxa de faltas × penalidade.
- **Memória virtual**: páginas, tabela de páginas e TLB (uma cache da tabela de páginas). Detalhado em Sistemas Operacionais.

## 💻 Código

```bash
python3 codigo/riscv.py
```

| Arquivo | Conteúdo |
|---|---|
| [`riscv.py`](codigo/riscv.py) | Montador de duas passadas, codificador **e decodificador** (o simulador executa as palavras de 32 bits, como o hardware), simulador de cache LRU com os 3 Cs e a comparação de percorrer uma matriz por linhas × por colunas |

Para programar de verdade em assembly, use o [RARS](https://github.com/TheThirdOne/rars) ou o [Ripes](https://github.com/mortbopet/Ripes), que desenha o pipeline.

## ✍️ Exercícios

1. Um programa tem 30% de loads, 10% de stores, 50% de instruções de ULA e 10% de desvios. Num pipeline com adiantamento, metade dos loads é seguida de uma instrução que usa o resultado, e 40% dos desvios são tomados (penalidade de 2 ciclos). Qual o CPI?
2. Codifique `beq t0, t1, -8` em hexadecimal.
3. Traduza para RISC-V: `for (i = 0; i < n; i++) v[i] = 2 * v[i];` com `v` em `a0` e `n` em `a1`.
4. Uma cache de 32 KiB, 4 vias, blocos de 64 bytes, endereços de 32 bits. Quantos conjuntos? Quantos bits de tag?
5. Um programa gasta 80% do tempo em multiplicações. Quanto mais rápida a multiplicação precisa ficar para o programa rodar 4 vezes mais rápido? E 5 vezes?

<details>
<summary>Gabarito</summary>

1. CPI = 1 + 0,30 × 0,5 × 1 (load-use) + 0,10 × 0,4 × 2 (desvios) = 1 + 0,15 + 0,08 = **1,23**.
2. imm = −8 = ...1111000. imm[12] = 1, imm[10:5] = 111111, imm[4:1] = 1100, imm[11] = 1; rs2 = t1 = 6, rs1 = t0 = 5, funct3 = 000, opcode = 1100011. Resultado: `0xfe628ce3`.
3. Uma solução:
   ```
         li   t0, 0            # i
   laco: bge  t0, a1, fim
         slli t1, t0, 2        # i * 4
         add  t1, a0, t1       # &v[i]
         lw   t2, 0(t1)
         add  t2, t2, t2       # 2 * v[i]
         sw   t2, 0(t1)
         addi t0, t0, 1
         j    laco
   fim:
   ```
4. 32 KiB / 64 B = 512 linhas; / 4 vias = **128 conjuntos** (7 bits de índice). Deslocamento: 6 bits. Tag: 32 − 7 − 6 = **19 bits**.
5. $\frac{1}{0,2 + 0,8/s} = 4 \Rightarrow 0,8/s = 0,05 \Rightarrow s = 16$. Para 5 vezes: $0,2 + 0,8/s = 0,2$, impossível: é o limite de Amdahl.

</details>

## 🔗 Para ir além

- *Organização e Projeto de Computadores: a interface hardware/software* (edição RISC-V), Patterson e Hennessy.
- [Ripes](https://github.com/mortbopet/Ripes): simulador visual do pipeline RISC-V.
- *What Every Programmer Should Know About Memory*, Ulrich Drepper: caches na prática.
