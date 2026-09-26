# Introdução à Lógica Computacional · DCC638

> 1º período · 60h · Pré-requisito de Introdução a Sistemas Lógicos e de Matemática Discreta.

A lógica é a linguagem da computação: condições de `if`, circuitos digitais,
especificação e verificação de programas, bancos de dados e inteligência artificial
se apoiam nela. Esta disciplina ensina a **escrever**, **avaliar** e **provar**
afirmações de forma rigorosa.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🌲 | [Tabela-verdade e árvore sintática](visualizacoes/tabela-verdade.html) | Digite qualquer fórmula: o parser monta a árvore, a avaliação recursiva percorre os nós linha a linha da tabela, e a página classifica a fórmula, mostra as formas normais e gera exercícios infinitos |

## 📚 Resumo teórico

### 1. Sintaxe da lógica proposicional

Fórmulas são construídas a partir de **variáveis proposicionais** ($p, q, r, \dots$) e
dos conectivos:

| Conectivo | Símbolo | Lê-se | Precedência |
|---|---|---|---|
| negação | $\neg p$ | não $p$ | 1 (mais forte) |
| conjunção | $p \land q$ | $p$ e $q$ | 2 |
| disjunção | $p \lor q$ | $p$ ou $q$ | 3 |
| implicação | $p \to q$ | se $p$ então $q$ | 4 |
| bicondicional | $p \leftrightarrow q$ | $p$ se e somente se $q$ | 5 |

Toda fórmula tem uma **árvore sintática**: as folhas são variáveis e os nós internos
são conectivos. É exatamente a estrutura que um compilador constrói para uma
expressão. A precedência decide o formato da árvore ($\neg p \land q$ é $(\neg p) \land q$), e a
implicação associa à direita: $p \to q \to r$ é $p \to (q \to r)$.

### 2. Semântica: valorações e tabelas-verdade

Uma **valoração** atribui V ou F a cada variável. O valor de uma fórmula é calculado
**de baixo para cima** na árvore, que é justamente a função recursiva `avalia` da
visualização. Com $n$ variáveis há $2^n$ valorações.

O ponto que mais confunde: **$p \to q$ só é falso quando $p$ é V e $q$ é F.** Com premissa
falsa, a implicação é verdadeira "por vacuidade".

### 3. Classificação

- **Tautologia**: V em todas as valorações. **Contradição**: F em todas. **Contingência**: nem uma nem outra.
- **Satisfatível**: V em pelo menos uma. $\varphi$ é tautologia $\iff$ $\neg\varphi$ é insatisfatível.

### 4. Equivalência e consequência lógica

$\varphi \equiv \psi$ se têm a mesma tabela-verdade ($\varphi \leftrightarrow \psi$ é tautologia).
$\Gamma \models \varphi$ (consequência lógica) se toda valoração que satisfaz todas as
fórmulas de $\Gamma$ também satisfaz $\varphi$.

| Lei | Equivalência |
|---|---|
| De Morgan | $\neg(p \land q) \equiv \neg p \lor \neg q$, $\quad \neg(p \lor q) \equiv \neg p \land \neg q$ |
| Implicação material | $p \to q \equiv \neg p \lor q$ |
| Contrapositiva | $p \to q \equiv \neg q \to \neg p$ |
| Distributividade | $p \land (q \lor r) \equiv (p \land q) \lor (p \land r)$ |
| Dupla negação | $\neg\neg p \equiv p$ |
| Exportação | $(p \land q) \to r \equiv p \to (q \to r)$ |

⚠️ A **recíproca** $q \to p$ **não** é equivalente a $p \to q$. Confundir as duas é a falácia de afirmar o consequente.

### 5. Formas normais

- **FND** (disjuntiva): disjunção de conjunções de literais. Lê-se das linhas **verdadeiras** da tabela.
- **FNC** (conjuntiva): conjunção de disjunções (cláusulas). Lê-se das linhas **falsas**.

Toda fórmula tem as duas. Portanto $\{\neg, \land, \lor\}$ é um conjunto **completo** de
conectivos (e até $\{\neg, \land\}$ ou só o NAND são completos, o que importa em circuitos!).

### 6. Sistemas de prova

Tabelas-verdade não escalam ($2^{50}$ linhas é inviável). Os sistemas dedutivos
constroem provas manipulando a **sintaxe**:

- **Dedução natural**: regras de introdução e eliminação para cada conectivo
  (ex.: *modus ponens* — de $p$ e $p \to q$, conclua $q$; prova por absurdo; prova condicional).
- **Resolução**: sobre cláusulas em FNC, de $(p \lor C)$ e $(\neg p \lor D)$ deduz-se $(C \lor D)$.
  Base dos resolvedores SAT e do Prolog.
- **Corretude e completude:** tudo que se prova é válido, e tudo que é válido pode ser provado.

### 7. Lógica de predicados (primeira ordem)

Adiciona **predicados** ($P(x)$), **quantificadores** ($\forall x$, $\exists x$) e
**funções**. Permite escrever "todo número par maior que 2 é soma de dois primos".
Negação de quantificadores: $\neg\forall x\, P(x) \equiv \exists x\, \neg P(x)$ e
$\neg\exists x\, P(x) \equiv \forall x\, \neg P(x)$.

### 8. SAT: o problema que conecta tudo

Decidir se uma fórmula é satisfatível é o **SAT**, o primeiro problema provado
**NP-completo** (Cook–Levin, 1971). Mesmo assim, resolvedores modernos baseados em
**DPLL/CDCL** resolvem instâncias com milhões de variáveis. Eles são usados em
verificação de hardware, escalonamento e até em provas matemáticas.

## 💻 Código

[`codigo/logica.py`](codigo/logica.py): avaliação recursiva, tabela-verdade,
classificação, teste de equivalência e um resolvedor **SAT com DPLL** (propagação
unitária + backtracking), com testes. Execute com `python3 codigo/logica.py`.

## ✍️ Exercícios

1. Classifique $(p \to q) \lor (q \to p)$.
2. Mostre que $p \to (q \to r) \equiv (p \land q) \to r$.
3. Escreva a FND canônica de $p \oplus q$.
4. Negue: "Todo aluno que estuda passa em alguma disciplina."
5. O argumento "Se chove, a rua fica molhada. A rua está molhada. Logo, choveu." é válido?

<details>
<summary>Gabarito</summary>

1. **Tautologia**: se $q$ é V, o primeiro termo é V; se $q$ é F, o segundo é V.
2. $p \to (q \to r) \equiv \neg p \lor \neg q \lor r \equiv \neg(p \land q) \lor r \equiv (p \land q) \to r$. Confira na visualização!
3. $(p \land \neg q) \lor (\neg p \land q)$.
4. "Existe um aluno que estuda e não passa em nenhuma disciplina": $\exists x\,(E(x) \land \forall d\, \neg P(x, d))$.
5. **Inválido** (afirmar o consequente): $((c \to m) \land m) \to c$ não é tautologia. O contraexemplo é $c = F$, $m = V$.

</details>

## 🔗 Para ir além

- *Lógica para Ciência da Computação*, J. N. Souza — livro-texto em português.
- [Logic and Proof (Lean)](https://leanprover.github.io/logic_and_proof/) — lógica com um assistente de provas.
- [SAT solvers: MiniSat](http://minisat.se/) — o clássico resolvedor SAT.
