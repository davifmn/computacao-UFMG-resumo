# Fundamentos da Teoria da Computação · DCC129

> 4º período · 60h · Pré-requisito: Matemática Discreta · Leva a Compiladores I.

O que um computador consegue fazer, com quanta memória e o que ele **nunca** vai conseguir.
A disciplina sobe a escada de modelos de computação, do autômato finito (memória fixa) à
máquina de Turing (memória ilimitada), e em cada degrau pergunta: que linguagens esse
modelo reconhece? A resposta acaba no problema da parada, o resultado mais famoso da
computação.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔁 | [Autômatos finitos](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/fundamentos-da-teoria-da-computacao/visualizacoes/automatos-finitos.html) | AFD e AFN (com ε) lendo uma palavra, com o conjunto de estados ativos; a construção de subconjuntos AFN → AFD como tabela; e a minimização por refinamento de partições |
| ✳️ | [Expressões regulares](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/fundamentos-da-teoria-da-computacao/visualizacoes/expressoes-regulares.html) | Digite uma expressão e veja o AFN de Thompson ser montado peça por peça; depois teste palavras nele |
| 📚 | [Autômato de pilha](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/fundamentos-da-teoria-da-computacao/visualizacoes/automato-de-pilha.html) | aⁿbⁿ, parênteses balanceados e wcwᴿ, com a pilha crescendo e encolhendo e a transição usada em cada passo |
| 📼 | [Máquina de Turing](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/fundamentos-da-teoria-da-computacao/visualizacoes/maquina-de-turing.html) | Fita, cabeçote e tabela de transições para incremento binário, aⁿbⁿ, aⁿbⁿcⁿ e palíndromos |

## 📚 Resumo teórico

### 1. Linguagens

Um **alfabeto** $\Sigma$ é um conjunto finito de símbolos; uma **palavra** é uma sequência finita deles; uma **linguagem** é um conjunto de palavras. Operações: união, concatenação, fecho de Kleene $L^*$, complemento. "Reconhecer $L$" = decidir, para cada palavra, se ela está em $L$.

### 2. Linguagens regulares

- **AFD** $(Q, \Sigma, \delta, q_0, F)$; **AFN** (com ε) reconhece o mesmo: construção de subconjuntos, até $2^n$ estados.
- **Expressões regulares** ↔ autômatos finitos (Teorema de Kleene): Thompson numa direção, eliminação de estados na outra.
- **Minimização**: o AFD mínimo é único; Myhill–Nerode caracteriza as regulares como as de índice finito.
- Fechadas por união, interseção, complemento, concatenação, fecho e reverso.
- **Lema do bombeamento**: se $L$ é regular, existe $p$ tal que toda $w \in L$ com $|w| \ge p$ se divide em $xyz$, $|xy| \le p$, $|y| \ge 1$, e $xy^iz \in L$ para todo $i \ge 0$. Use a contrapositiva para provar que $a^nb^n$, palíndromos e $\{a^{n^2}\}$ não são regulares.

### 3. Linguagens livres de contexto

- **Gramáticas livres de contexto** (GLC): regras $A \to \gamma$. Derivações, árvores de derivação, **ambiguidade**.
- **Formas normais**: Chomsky ($A \to BC \mid a$, base do algoritmo CYK, $O(n^3)$) e Greibach.
- **Autômatos de pilha** (não determinísticos) ≡ GLCs. Os determinísticos são mais fracos (não reconhecem $ww^R$) e são a base dos parsers LL/LR de Compiladores.
- Lema do bombeamento para LLCs ($w = uvxyz$, bombeando $v$ e $y$ juntos): $a^nb^nc^n$ e $ww$ não são livres de contexto.
- Fechadas por união, concatenação e fecho, mas **não** por interseção nem complemento.

### 4. Máquinas de Turing e computabilidade

- Fita infinita, leitura e escrita, movimento para os dois lados. Variantes (várias fitas, não determinismo) têm o mesmo poder.
- **Tese de Church–Turing**: "algoritmo" = máquina de Turing.
- **Decidível** (sempre para) × **Turing-reconhecível** (aceita as palavras da linguagem, pode não parar nas outras). $L$ é decidível ⇔ $L$ e $\overline{L}$ são reconhecíveis.
- **Máquina universal**: uma MT que simula qualquer outra a partir da descrição $\langle M \rangle$ (o computador de programa armazenado).
- **Problema da parada** é indecidível (diagonalização). **Reduções** espalham a indecidibilidade; **Teorema de Rice**: toda propriedade não trivial da linguagem de uma MT é indecidível.

### 5. Hierarquia de Chomsky

regulares ⊂ livres de contexto ⊂ sensíveis ao contexto ⊂ decidíveis ⊂ recursivamente enumeráveis.

## 💻 Código

```bash
python3 codigo/automatos.py
```

| Arquivo | Conteúdo |
|---|---|
| [`automatos.py`](codigo/automatos.py) | AFN com ε, subconjuntos, minimização, Thompson (conferido contra o módulo `re` em todas as palavras curtas), autômato de pilha, máquina de Turing para aⁿbⁿcⁿ e o algoritmo **CYK** |

## ✍️ Exercícios

1. Construa um AFD para as palavras binárias que não contêm `11`.
2. Converta para AFD o AFN "termina em 01" e minimize o resultado.
3. Prove que $L = \{ww : w \in \{a, b\}^*\}$ não é regular.
4. Escreva uma GLC para $\{a^ib^jc^k : i = j \text{ ou } j = k\}$. Ela é ambígua?
5. Mostre que é indecidível saber se uma MT $M$ aceita a palavra vazia.

<details>
<summary>Gabarito</summary>

1. Estados: $A$ (último símbolo não é 1, inicial), $B$ (último foi 1), $M$ (morto, já viu `11`). $\delta(A, 0) = A$, $\delta(A, 1) = B$, $\delta(B, 0) = A$, $\delta(B, 1) = M$, $M$ absorve tudo. Finais: $A$ e $B$.
2. Subconjuntos: $\{q_0\}$, $\{q_0, q_1\}$, $\{q_0, q_2\}$ (final). Já é mínimo: os três são distinguíveis (`1`, `01` e ε separam). Confira na [visualização](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/fundamentos-da-teoria-da-computacao/visualizacoes/automatos-finitos.html).
3. Suponha regular com constante $p$. Tome $w = a^pba^pb$. Como $|xy| \le p$, $y = a^k$ com $k \ge 1$, e $xy^2z = a^{p+k}ba^pb$ não é da forma $ww$. Contradição.
4. $S \to XC \mid AY$; $X \to aXb \mid \varepsilon$; $C \to cC \mid \varepsilon$; $A \to aA \mid \varepsilon$; $Y \to bYc \mid \varepsilon$. É ambígua: $a^nb^nc^n$ tem duas árvores (uma por $XC$, outra por $AY$). Na verdade, a linguagem é **inerentemente** ambígua.
5. Redução da parada: dado $\langle M, w \rangle$, construa $M'$ que ignora a entrada, roda $M$ em $w$ e aceita se $M$ parar. $M'$ aceita ε ⇔ $M$ para em $w$. Um decisor para "aceita ε" decidiria a parada. (Ou aplique Rice diretamente.)

</details>

## 🔗 Para ir além

- *Introdução à Teoria da Computação*, Michael Sipser: o livro-texto mais claro sobre o assunto.
- *Introdução à Teoria de Autômatos, Linguagens e Computação*, Hopcroft, Motwani e Ullman.
- [JFLAP](https://www.jflap.org/): desenhe e simule autômatos, gramáticas e máquinas de Turing.
