# Linguagens de Programação · DCC024

> 5º período · 60h · Departamento de Ciência da Computação · pré-requisito: Estruturas de Dados.

Até aqui você *usou* linguagens. Esta disciplina estuda como elas são **definidas e
implementadas**: sintaxe, nomes e escopo, tipos, como as chamadas de função funcionam por
dentro e os grandes paradigmas, o **funcional** (ML, com o cálculo lambda por trás) e o
**lógico** (Prolog). Depois dela, aprender uma linguagem nova vira "ver como ela responde
a estas perguntas".

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| λ | [Cálculo lambda](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/linguagens-de-programacao/visualizacoes/calculo-lambda.html) | Digite um termo e acompanhe cada redução β, com a função e o argumento do redex destacados, em ordem normal ou aplicativa; numerais de Church, booleanos, PRED, Y e o fatorial |
| 🧩 | [Inferência de tipos](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/linguagens-de-programacao/visualizacoes/inferencia-de-tipos.html) | Hindley-Milner sobre a árvore de um programa mini-ML: variáveis de tipo, equações, unificação, generalização no `let` e os erros (occurs check, int ≠ bool) |
| 📚 | [Escopo e parâmetros](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/linguagens-de-programacao/visualizacoes/escopo-e-parametros.html) | A pilha de registros de ativação com elos estáticos e dinâmicos; o mesmo programa em escopo estático e dinâmico, e com passagem por valor, referência, valor-resultado e nome |
| 🦉 | [Prolog](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/linguagens-de-programacao/visualizacoes/prolog.html) | A árvore de busca SLD crescendo: unificação, renomeação de variáveis, retrocesso, `append` ao contrário, aritmética com `is` e o laço da recursão à esquerda |

## 📚 Resumo teórico

### 1. Sintaxe e semântica

- **Gramáticas livres de contexto** (BNF), árvores de derivação, **ambiguidade** (o `else` pendente, precedência e associatividade de operadores).
- **Sintaxe abstrata** × concreta; **semântica operacional** (regras de inferência que dizem como um programa executa), denotacional e axiomática.

### 2. Nomes, escopo e vinculação

- **Vinculação** (binding) e seu tempo: projeto da linguagem, compilação, ligação, execução.
- **Escopo estático** (léxico) × **dinâmico**; blocos, sombreamento, espaço de nomes.
- **Tempo de vida**: estático, pilha (variáveis locais), heap (alocação explícita ou implícita).

### 3. Tipos

- Tipos primitivos, produtos (tuplas, registros), somas (uniões, tipos algébricos), funções, recursivos (listas, árvores).
- Tipagem **estática** × **dinâmica**, **forte** × **fraca**; equivalência por nome × por estrutura; coerções.
- **Polimorfismo**: paramétrico (`'a list`), de subtipos (herança), ad hoc (sobrecarga, classes de tipos).
- **Inferência** de Hindley-Milner: geração de restrições + unificação; tipo principal; `let` polimórfico.

### 4. Subprogramas e implementação

- **Registro de ativação**: parâmetros, variáveis locais, endereço de retorno, **elo dinâmico** e **elo estático** (ou display).
- **Passagem de parâmetros**: valor, referência, valor-resultado, nome (e necessidade, a versão preguiçosa).
- **Funções de primeira classe** e **closures**: o ambiente é capturado junto com o código, e por isso registros às vezes precisam viver no heap.
- **Gerência de memória**: contagem de referências (falha com ciclos), marcar-e-varrer, cópia (semiespaços), coleta geracional.

### 5. Programação funcional

- **Cálculo lambda**: variáveis livres e ligadas, α, β, η, substituição sem captura; ordem normal × aplicativa; Church-Rosser; codificações de Church; combinador Y.
- **ML**: valores imutáveis, recursão, casamento de padrões, tipos algébricos, funções de alta ordem (`map`, `foldl`, `filter`), currying.
- Avaliação **estrita** × **preguiçosa**.

### 6. Programação lógica

- Fatos, regras, consultas; **unificação** (com e sem occurs check); **resolução SLD** com busca em profundidade e retrocesso.
- Listas e recursão, aritmética com `is`, **cut** e negação por falha; a ordem das cláusulas importa.

### 7. Orientação a objetos

- Encapsulamento, herança, **despacho dinâmico** (tabelas virtuais), subtipos e o princípio de Liskov; covariância e contravariância.

## 💻 Código

```bash
cd codigo
python3 lambda_calculo.py
python3 tipos.py
python3 prolog.py
```

| Arquivo | Conteúdo |
|---|---|
| [`lambda_calculo.py`](codigo/lambda_calculo.py) | Redutor de cálculo lambda em ordem normal e aplicativa; aritmética de Church conferida para 0..4, fatorial com Y, K I Ω e a substituição sem captura |
| [`tipos.py`](codigo/tipos.py) | Algoritmo W completo (let polimórfico, let rec, listas, pares), testado em 11 programas, incluindo os 3 que devem ser rejeitados |
| [`prolog.py`](codigo/prolog.py) | Interpretador Prolog com geradores do Python: unificação com occurs check, resolução SLD, `is` e comparações; append, fatorial, member e a recursão à esquerda que não termina |

As visualizações têm implementações próprias em JavaScript; os testes do repositório
conferem que as duas versões dão as mesmas respostas.

## ✍️ Exercícios

1. Reduza $(\lambda x.\lambda y.\,y\,x)\,a\,(\lambda z.z)$ até a forma normal.
2. Mostre que $\text{NOT}\,\text{TRUE} \to^* \text{FALSE}$.
3. Infira o tipo de `fn f => fn x => fn y => f y x`.
4. Por que `fn x => (x 1, x true)` não tipa, mas `let f = fn x => x in (f 1, f true)` tipa?
5. Com o programa abaixo, o que é impresso em escopo estático e em escopo dinâmico?
   ```
   var n = 10
   proc mostra() { print n }
   proc p() { var n = 20  mostra() }
   p()
   mostra()
   ```
6. Escreva em Prolog `ultimo(X, L)`, verdadeiro se `X` é o último elemento de `L`.
7. Dê o resultado de `?- append([1], X, [1, 2, 3]).` e de `?- append(X, [3], [1, 2, 3]).`

<details>
<summary>Gabarito</summary>

1. $(\lambda x.\lambda y.\,y\,x)\,a \to \lambda y.\,y\,a$; aplicado a $\lambda z.z$: $(\lambda z.z)\,a \to a$.
2. $\text{NOT}\,\text{TRUE} = (\lambda p.\,p\,\text{FALSE}\,\text{TRUE})\,\text{TRUE} \to \text{TRUE}\,\text{FALSE}\,\text{TRUE} = (\lambda t.\lambda f.\,t)\,\text{FALSE}\,\text{TRUE} \to^2 \text{FALSE}$.
3. `('a -> 'b -> 'c) -> 'b -> 'a -> 'c` (é o `flip`).
4. Parâmetros de `fn` são monomórficos: `x` tem um único tipo `'a` no corpo, e as duas aplicações forçam `'a = int -> 'b` e `'a = bool -> 'c`, logo `int = bool`. O `let` generaliza `f` para `∀'a. 'a -> 'a`, e cada uso é instanciado com variáveis novas.
5. Estático: `10 10` (o `n` de `mostra` é sempre o global). Dinâmico: `20 10` (na primeira chamada, quem chamou `mostra` foi `p`, que tem seu próprio `n`).
6. `ultimo(X, [X]).` e `ultimo(X, [_ | T]) :- ultimo(X, T).`
7. `X = [2, 3]`; `X = [1, 2]`.

</details>

## 🔗 Para ir além

- *Modern Programming Languages: A Practical Introduction*, Adam Webber: o livro-texto usado no DCC, com ML, Java e Prolog.
- *Conceitos de Linguagens de Programação*, Robert Sebesta: o panorama clássico de escopo, tipos e subprogramas.
- *Types and Programming Languages*, Benjamin Pierce: para ir fundo em cálculo lambda e sistemas de tipos.
- [Material do prof. Fernando Pereira (DCC/UFMG)](https://homepages.dcc.ufmg.br/~fernando/classes/dcc024/): aulas de LP com ML, Python e Prolog.
- [SWI-Prolog](https://www.swi-prolog.org/) e [SML/NJ](https://www.smlnj.org/) para experimentar.
