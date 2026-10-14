# Compiladores I · DCC053

> 6º período · 60h · Departamento de Ciência da Computação · pré-requisito: Fundamentos da Teoria da Computação.

Um compilador traduz um programa de uma linguagem para outra, e é o lugar onde a teoria de
FTC vira ferramenta: expressões regulares e autômatos fazem a **análise léxica**;
gramáticas livres de contexto e autômatos de pilha fazem a **análise sintática**. Depois
vêm a análise semântica, a geração de código intermediário e as otimizações. O trabalho
prático costuma ser escrever um compilador inteiro para uma linguagem pequena.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔤 | [Análise léxica](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/compiladores-1/visualizacoes/analise-lexica.html) | O AFD do analisador lendo um programa caractere a caractere, o maior casamento, palavras reservadas × identificadores, comentários descartados e erros léxicos |
| 🌲 | [Análise LL(1)](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/compiladores-1/visualizacoes/analise-ll1.html) | Edite uma gramática e veja FIRST, FOLLOW e a tabela preditiva (com conflitos), depois a pilha e a árvore de derivação crescendo de cima para baixo |
| 🧱 | [Análise SLR](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/compiladores-1/visualizacoes/analise-slr.html) | Os itens LR(0), a tabela ACTION/GOTO e a análise empilha-reduz construindo a árvore de baixo para cima, com a célula da tabela usada a cada passo |
| ⚙️ | [Geração de código](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/compiladores-1/visualizacoes/geracao-de-codigo.html) | A árvore sintática abstrata virando código de três endereços ou de máquina de pilha, com rótulos para if/while e dobramento de constantes; o código gerado é executado para conferir |

## 📚 Resumo teórico

### 1. Estrutura de um compilador

- **Vanguarda** (front-end: léxico, sintático, semântico, código intermediário) e **retaguarda** (back-end: otimização, geração de código). Uma linguagem intermediária comum (LLVM IR) permite combinar $m$ linguagens com $n$ máquinas com $m + n$ componentes em vez de $m \cdot n$.
- Compilador × interpretador × compilação JIT.

### 2. Análise léxica

- Tokens, lexemas e padrões; expressões regulares → AFN (Thompson) → AFD (subconjuntos) → AFD mínimo.
- Maior casamento, prioridade entre regras, palavras reservadas, tratamento de erros; geradores (`lex`/`flex`).

### 3. Análise sintática

- Gramáticas livres de contexto, derivações mais à esquerda/direita, árvores, **ambiguidade** (precedência, associatividade, else pendente).
- **Descendente**: recursiva, preditiva LL(1) com FIRST/FOLLOW; eliminação de recursão à esquerda e fatoração.
- **Ascendente**: empilha-reduz, handles, itens LR(0), **SLR**, LR(1) canônico, **LALR(1)** (`yacc`/`bison`); conflitos empilha/reduz e reduz/reduz.
- Recuperação de erros (modo pânico).

### 4. Análise semântica

- **Tabela de símbolos** e escopos; verificação de tipos, coerções; definições dirigidas pela sintaxe e atributos sintetizados/herdados.

### 5. Código intermediário e geração de código

- Árvore sintática abstrata, **código de três endereços** (quádruplas), máquina de pilha, **SSA**.
- Tradução de expressões, atribuições, desvios (rótulos, curto-circuito), laços e chamadas de procedimento.
- Ambientes de execução: registros de ativação (veja LP), heap.
- Noções de otimização (dobramento e propagação de constantes, código morto, subexpressões comuns) e de alocação de registradores.

## 💻 Código

```bash
python3 codigo/compilador.py
```

| Arquivo | Conteúdo |
|---|---|
| [`compilador.py`](codigo/compilador.py) | Um compilador completo do mini-C desta página: léxico com expressões regulares, gerador de tabelas LL(1) e SLR (conferidos nos exemplos do livro do Dragão), parser descendente recursivo, gerador de código de três endereços com dobramento de constantes e um interpretador que confere o código gerado contra a avaliação direta da árvore em centenas de programas aleatórios |

## ✍️ Exercícios

1. Quantos tokens tem `if(x>=10)y=y+1;`? Liste-os.
2. Calcule FIRST e FOLLOW de $S \to aSb \mid \varepsilon$. A gramática é LL(1)?
3. Elimine a recursão à esquerda de $A \to A\,c \mid A\,d \mid b$.
4. Mostre que $E \to E + E \mid \text{id}$ é ambígua.
5. Gere código de três endereços para `x = (a + b) * (a + b) - c;`. Que otimização reduziria o número de instruções?
6. Gere código de três endereços para `while (i < n) { i = i + 2; }`.

<details>
<summary>Gabarito</summary>

1. **12**: PALAVRA(if), PONT((), ID(x), OP(>=), NUM(10), PONT()), ID(y), ATRIB(=), ID(y), OP(+), NUM(1), PONT(;). O `>=` é um token só, pelo maior casamento.
2. FIRST(S) = {a, ε}, FOLLOW(S) = {b, $}. M[S, a] = S → aSb; M[S, b] = M[S, $] = S → ε. Sem conflitos: é LL(1).
3. $A \to b\,A'$, $A' \to c\,A' \mid d\,A' \mid \varepsilon$.
4. `id + id + id` tem duas árvores: $(\text{id} + \text{id}) + \text{id}$ e $\text{id} + (\text{id} + \text{id})$.
5. `t1 = a + b`, `t2 = a + b`, `t3 = t1 * t2`, `t4 = t3 - c`, `x = t4`. **Eliminação de subexpressões comuns** troca `t2` por `t1` e economiza uma soma.
6. `L1:` · `if i >= n goto L2` · `t1 = i + 2` · `i = t1` · `goto L1` · `L2:`.

</details>

## 🔗 Para ir além

- *Compiladores: Princípios, Técnicas e Ferramentas*, Aho, Lam, Sethi e Ullman (o "livro do Dragão"): os exemplos de FIRST/FOLLOW e da tabela SLR desta página são dele.
- *Engineering a Compiler*, Cooper e Torczon: mais moderno e prático.
- [*Crafting Interpreters*](https://craftinginterpreters.com/), Robert Nystrom: gratuito, constrói um interpretador e uma máquina virtual de pilha passo a passo.
- [Compiler Explorer](https://godbolt.org/): veja o assembly que GCC e Clang geram para o seu código.
