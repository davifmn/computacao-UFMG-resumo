# Introdução a Sistemas Lógicos · DCC114

> 2º período · 60h · Pré-requisito: Introdução à Lógica Computacional · Leva a Organização de Computadores I.

Como transformar lógica em **hardware**. A disciplina parte da álgebra booleana,
passa por portas lógicas e circuitos combinacionais (somadores, multiplexadores,
decodificadores) e chega aos circuitos **sequenciais**, que têm memória: latches,
flip-flops, registradores, contadores e máquinas de estados.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔌 | [Simulador de circuitos](visualizacoes/circuitos.html) | Clique nas entradas e veja o sinal se propagar nível a nível: portas, meio-somador, somador completo, somador de 4 bits, mux, decodificador e "tudo com NAND" |
| 🗺️ | [Mapa de Karnaugh](visualizacoes/karnaugh.html) | Clique nas células (0, 1, X) e veja os grupos e a soma de produtos **mínima** (Quine–McCluskey exato), com gerador de exercícios |
| ⏱️ | [Circuitos sequenciais](visualizacoes/sequenciais.html) | Latch SR com realimentação, latch D × flip-flop D num diagrama de tempo que você desenha, contador síncrono com diagrama de estados |

## 📚 Resumo teórico

### 1. Álgebra booleana

Variáveis valem 0 ou 1; operações: $A \cdot B$ (E), $A + B$ (OU), $\bar A$ (NÃO).

| Lei | Forma |
|---|---|
| Identidade / nulo | $A + 0 = A$, $A \cdot 1 = A$, $A + 1 = 1$, $A \cdot 0 = 0$ |
| Idempotência / complemento | $A + A = A$, $A + \bar A = 1$, $A \cdot \bar A = 0$ |
| Absorção | $A + AB = A$, $A(A + B) = A$ |
| De Morgan | $\overline{A B} = \bar A + \bar B$, $\overline{A + B} = \bar A \bar B$ |
| Distributivas | $A(B + C) = AB + AC$, $A + BC = (A + B)(A + C)$ |

**Formas canônicas:** soma de mintermos $\sum m(\dots)$ e produto de maxtermos $\prod M(\dots)$.

### 2. Portas lógicas

AND, OR, NOT, NAND, NOR, XOR e XNOR. **NAND e NOR são universais**: qualquer circuito pode
ser feito só com uma delas. XOR é a "soma sem vai-um" e o detector de diferença.

### 3. Minimização

Menos literais significam menos portas, menos área, menos consumo e menos atraso.

- **Mapa de Karnaugh** (até 4–5 variáveis): agrupe 1s adjacentes (ordem de Gray) em retângulos de $2^k$ células, os maiores possíveis, com o menor número de grupos.
- **Don't cares (X)**: combinações que nunca ocorrem e podem entrar nos grupos.
- **Quine–McCluskey:** a versão algorítmica (implicantes primos + cobertura), usada pelas ferramentas de síntese.

### 4. Blocos combinacionais

| Bloco | Função |
|---|---|
| Meio-somador | $S = A \oplus B$, $C = AB$ |
| Somador completo | $S = A \oplus B \oplus C_{in}$, $C_{out} = AB + C_{in}(A \oplus B)$ |
| Somador ripple-carry | $n$ somadores completos em cadeia; atraso $O(n)$ |
| Carry-lookahead | calcula os vai-uns em paralelo; atraso $O(\log n)$ |
| Multiplexador $2^n:1$ | escolhe uma entrada com $n$ bits de seleção |
| Decodificador $n \to 2^n$ | ativa exatamente uma saída (seleção de endereço na memória) |
| Comparador, codificador, ULA | combinações dos anteriores |

### 5. Circuitos sequenciais

- **Latch SR** (duas NOR realimentadas): o menor elemento de memória. S = R = 1 é proibido.
- **Latch D:** transparente enquanto o clock está em 1.
- **Flip-flop D:** captura D só na **borda** do clock. É a base dos registradores.
- **Flip-flops T e JK:** T inverte o valor; JK combina set, reset e inversão.
- **Registradores** ($n$ flip-flops D), **registradores de deslocamento** e **contadores**.
- **Máquinas de estados finitos:** modelo de **Moore** (a saída depende só do estado) ou de **Mealy** (a saída depende do estado e da entrada). O projeto segue a sequência: diagrama → tabela de transição → codificação dos estados → equações dos flip-flops → circuito.

### 6. Temporização

O **atraso de propagação** das portas limita a frequência. O período do clock deve
superar o caminho crítico mais os tempos de *setup* e *hold* do flip-flop. Circuitos
**síncronos** mudam todos juntos na borda do clock e evitam condições de corrida.

## 💻 Código

[`codigo/circuitos.py`](codigo/circuitos.py): portas como funções, meio-somador,
somador completo, somador ripple de n bits, mux e contador com flip-flops T, com testes
que verificam todas as combinações. Execute com `python3 codigo/circuitos.py`.

## ✍️ Exercícios

1. Simplifique $F = \bar A B + A B + A \bar B$.
2. Minimize $F(A, B, C) = \sum m(0, 2, 4, 5, 6)$.
3. Construa um XOR usando apenas portas NAND. Quantas são necessárias?
4. Quantos flip-flops tem um contador que vai de 0 a 99?
5. Qual a frequência máxima de um circuito cujo caminho crítico tem 5 portas de 200 ps (ignore *setup*/*hold*)?

<details>
<summary>Gabarito</summary>

1. $\bar A B + AB = B$, e então $B + A\bar B = A + B$.
2. $\bar C + A \bar B$. Confira no [mapa de Karnaugh](visualizacoes/karnaugh.html): os mintermos 0, 2, 4 e 6 formam $\bar C$ (grupo que dá a volta), e 4, 5 formam $A\bar B$.
3. Quatro: $N_1 = \text{NAND}(A,B)$, $N_2 = \text{NAND}(A, N_1)$, $N_3 = \text{NAND}(B, N_1)$, $\text{XOR} = \text{NAND}(N_2, N_3)$.
4. $\lceil \log_2 100 \rceil = 7$ (ou 8, se usar dois dígitos BCD de 4 bits).
5. Caminho crítico de 1 ns ⇒ 1 GHz.

</details>

## 🔗 Para ir além

- [Nand2Tetris](https://www.nand2tetris.org/) — construa um computador inteiro a partir de portas NAND.
- [Logisim-evolution](https://github.com/logisim-evolution/logisim-evolution) — simulador de circuitos usado em muitas disciplinas.
- *Digital Design and Computer Architecture*, Harris & Harris.
