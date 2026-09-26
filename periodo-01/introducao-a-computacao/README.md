# Introdução à Computação

> 1º período · 30h · Disciplina de ambientação ao curso, com um código DCC novo na grade de 2024.

Uma visão geral do que é Ciência da Computação e de como um computador funciona por
dentro. O coração técnico é a **representação da informação**: tudo no computador
(números, textos, imagens, instruções) é uma sequência de bits, e a interpretação
depende de convenções.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔢 | [Mudança de base](visualizacoes/bases.html) | Divisões sucessivas (decimal → base b) e método de Horner (base b → decimal), passo a passo, com gerador de exercícios |
| ⚙️ | [Complemento de dois](visualizacoes/inteiros.html) | Registrador de bits clicável, as quatro interpretações, a roda dos números e a detecção de overflow na soma |
| 🌊 | [Ponto flutuante (IEEE 754)](visualizacoes/ponto-flutuante.html) | Os 32 bits de um `float`, o valor **exato** armazenado e por que `0.1 + 0.2 != 0.3` |

## 📚 Resumo teórico

### 1. O que é computação?

**Algoritmo:** sequência finita e precisa de passos que resolve um problema.
**Computador:** máquina que executa algoritmos. A arquitetura de **von Neumann** guarda
programa e dados na mesma memória, com uma CPU que repete o ciclo *busca → decodifica →
executa*. As áreas do curso: teoria (o que é computável e a que custo), sistemas (SO,
redes, compiladores, bancos de dados), software (engenharia, linguagens) e aplicações
(IA, ciência de dados, computação gráfica).

### 2. Sistemas de numeração posicionais

$$ (d_k \dots d_1 d_0)_b = \sum_{i=0}^{k} d_i \cdot b^i $$

| Conversão | Método |
|---|---|
| decimal → base $b$ | **divisões sucessivas** por $b$; os restos, lidos de baixo para cima, são os dígitos |
| base $b$ → decimal | soma dos pesos, ou **Horner**: `valor = valor * b + dígito` |
| binário ↔ hexadecimal | agrupar de **4** em 4 bits ($16 = 2^4$) |
| binário ↔ octal | agrupar de **3** em 3 bits ($8 = 2^3$) |
| frações decimal → binário | multiplicações sucessivas por 2; as partes inteiras são os bits |

Unidades: 1 byte = 8 bits; 1 KiB = $2^{10}$ bytes = 1024 bytes (o "kilo" do SI é 1000).

### 3. Inteiros com sinal

Com $n$ bits:

| Representação | Como nega | Faixa | Observação |
|---|---|---|---|
| Sinal-magnitude | liga o bit de sinal | $\pm(2^{n-1}-1)$ | dois zeros |
| Complemento de 1 | inverte todos os bits | $\pm(2^{n-1}-1)$ | dois zeros |
| **Complemento de 2** | inverte e soma 1 | $-2^{n-1}$ a $2^{n-1}-1$ | **usado na prática** |

No complemento de 2, o bit mais significativo tem **peso negativo**:
$(b_{n-1} \dots b_0) = -b_{n-1}2^{n-1} + \sum_{i<n-1} b_i 2^i$. Somar é igual para números
com e sem sinal, e é tudo aritmética módulo $2^n$.

**Overflow com sinal** acontece quando dois operandos de mesmo sinal produzem resultado
de sinal oposto. Somar números de sinais diferentes nunca causa overflow.

### 4. Ponto flutuante (IEEE 754)

$$ \text{valor} = (-1)^s \times 1.f \times 2^{e - \text{viés}} $$

| Formato | Sinal | Expoente | Fração | Viés | Precisão |
|---|---|---|---|---|---|
| `float` (32 bits) | 1 | 8 | 23 | 127 | ~7 dígitos |
| `double` (64 bits) | 1 | 11 | 52 | 1023 | ~16 dígitos |

Casos especiais: expoente todo 0 → zero e subnormais; expoente todo 1 → $\pm\infty$ e NaN.
A consequência prática é que **a maioria dos decimais não é exata** ($0{,}1 = 0{,}0\overline{0011}_2$),
então nunca compare floats com `==`.

### 5. Representando outras coisas

- **Texto**: ASCII (7 bits: `'A'` = 65) e **Unicode/UTF-8** (1 a 4 bytes por caractere, compatível com ASCII).
- **Imagens**: matriz de pixels, cada um com 3 bytes (R, G, B).
- **Instruções**: a CPU também lê bits, e o **código de máquina** é um número que diz qual operação fazer.

## 💻 Código

[`codigo/bases.py`](codigo/bases.py): conversões de base, complemento de dois, soma com
detecção de overflow e inspeção de `float32` com `struct`. Tem testes: `python3 codigo/bases.py`.

## ✍️ Exercícios

> A página de [mudança de base](visualizacoes/bases.html) tem um **gerador infinito** de exercícios de conversão.

1. Converta $0{,}625$ para binário.
2. Qual o maior e o menor inteiro representável com 12 bits em complemento de 2?
3. Em 8 bits, calcule $-37$ em complemento de 2 e confira somando com $37$.
4. O que o padrão `0x3F800000` representa como `float`?
5. Um vídeo tem 1920×1080 pixels, 3 bytes por pixel e 30 quadros por segundo. Quantos MB por segundo, sem compressão?

<details>
<summary>Gabarito</summary>

1. $0{,}625 \times 2 = 1{,}25 \to 1$; $0{,}25 \times 2 = 0{,}5 \to 0$; $0{,}5 \times 2 = 1{,}0 \to 1$. Resultado: $0{,}101_2$.
2. De $-2^{11} = -2048$ até $2^{11} - 1 = 2047$.
3. $37 = 00100101$. Invertendo: $11011010$; somando 1: $11011011$. E $00100101 + 11011011 = 1\,00000000$: descartando o vai-um, dá 0. ✔
4. Sinal 0, expoente $01111111 = 127 \Rightarrow 2^0$, fração 0: o valor é **1,0**.
5. $1920 \cdot 1080 \cdot 3 \cdot 30 \approx 186{,}6 \times 10^6$ bytes/s, ou seja, ~187 MB/s. Por isso a compressão de vídeo é essencial.

</details>

## 🔗 Para ir além

- [*Code*, Charles Petzold](https://www.charlespetzold.com/code/) — do código Morse ao computador, sem pré-requisitos.
- [What Every Computer Scientist Should Know About Floating-Point](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) — o clássico sobre ponto flutuante.
- [float.exposed](https://float.exposed/) — outro explorador de ponto flutuante.
