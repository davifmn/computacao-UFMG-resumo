# Probabilidade · EST032

> 3º período · 60h · Departamento de Estatística · Leva a Introdução à Ciência dos Dados.

A matemática da incerteza. Na computação, ela está em algoritmos aleatorizados, análise
de caso médio, redes (filas, perdas de pacotes), aprendizado de máquina, criptografia e
simulações de Monte Carlo.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 📈 | [Distribuições](visualizacoes/distribuicoes.html) | Binomial, geométrica, Poisson, uniforme, exponencial e normal: parâmetros, área de P(a ≤ X ≤ b), média, variância e amostragem sobre a curva teórica |
| 🎯 | [Teorema Central do Limite](visualizacoes/limite-central.html) | Tábua de Galton animada, médias de amostras de distribuições bem diferentes da normal virando um sino, e a Lei dos Grandes Números |
| 🩺 | [Bayes e Monty Hall](visualizacoes/bayes.html) | Teste diagnóstico com 1000 pessoas (falácia da taxa-base) e o problema de Monty Hall jogável e simulado |

## 📚 Resumo teórico

### 1. Fundamentos

- Espaço amostral $\Omega$, eventos e axiomas de Kolmogorov: $P(\Omega) = 1$, $P(A) \ge 0$ e aditividade para eventos disjuntos.
- $P(A \cup B) = P(A) + P(B) - P(A \cap B)$ e $P(\bar A) = 1 - P(A)$.
- **Condicional:** $P(A \mid B) = P(A \cap B)/P(B)$. **Independência:** $P(A \cap B) = P(A)P(B)$.
- **Probabilidade total:** $P(B) = \sum_i P(B \mid A_i) P(A_i)$.
- **Bayes:** $P(A \mid B) = \dfrac{P(B \mid A)P(A)}{P(B)}$.

### 2. Variáveis aleatórias

- Discretas (função de massa $p(x)$) e contínuas (densidade $f(x)$, com $P(a \le X \le b) = \int_a^b f$).
- Função de distribuição acumulada $F(x) = P(X \le x)$.
- **Esperança** $E[X] = \sum x\,p(x)$ (ou $\int x f$), linear: $E[aX + bY] = aE[X] + bE[Y]$, **sempre**, mesmo sem independência.
- **Variância** $\text{Var}(X) = E[X^2] - E[X]^2$; $\text{Var}(aX + b) = a^2 \text{Var}(X)$. Para X e Y independentes, $\text{Var}(X+Y) = \text{Var}(X) + \text{Var}(Y)$.

### 3. Distribuições importantes

| | Distribuição | $E[X]$ | $\text{Var}(X)$ |
|---|---|---|---|
| Discretas | Bernoulli(p) | $p$ | $p(1-p)$ |
| | Binomial(n, p) | $np$ | $np(1-p)$ |
| | Geométrica(p) | $1/p$ | $(1-p)/p^2$ |
| | Poisson(λ) | $\lambda$ | $\lambda$ |
| Contínuas | Uniforme(a, b) | $(a+b)/2$ | $(b-a)^2/12$ |
| | Exponencial(λ) | $1/\lambda$ | $1/\lambda^2$ |
| | Normal(μ, σ²) | $\mu$ | $\sigma^2$ |

Padronização: $Z = (X - \mu)/\sigma \sim N(0, 1)$.

### 4. Teoremas-limite

- **Desigualdade de Chebyshev:** $P(|X - \mu| \ge k\sigma) \le 1/k^2$.
- **Lei dos Grandes Números:** $\bar X_n \to \mu$.
- **Teorema Central do Limite:** $\bar X_n \approx N(\mu, \sigma^2/n)$ para $n$ grande, qualquer que seja a distribuição original (com variância finita).

## 💻 Código

[`codigo/probabilidade.py`](codigo/probabilidade.py): fmp e fda em Python puro, Bayes,
simulação de Monty Hall e verificação do TCL. Execute com `python3 codigo/probabilidade.py`.

## ✍️ Exercícios

1. Lança-se um dado duas vezes. Qual a probabilidade de a soma ser 7?
2. 3% das peças de uma fábrica são defeituosas. Numa caixa de 100, qual a probabilidade (aproximada, Poisson) de nenhuma ser defeituosa?
3. $X \sim N(70, 10^2)$ (notas). Qual a fração de alunos com nota acima de 90?
4. Uma moeda honesta é lançada 400 vezes. Aproximadamente, qual a probabilidade de sair mais de 220 caras?
5. Um filtro de spam marca 95% dos spams e 2% dos e-mails legítimos. 30% dos e-mails são spam. Se um e-mail foi marcado, qual a chance de ser spam?

<details>
<summary>Gabarito</summary>

1. 6 pares entre 36: $1/6$.
2. $\lambda = 3$: $P(X = 0) = e^{-3} \approx 0{,}05$.
3. $Z = (90 - 70)/10 = 2$: $P(Z > 2) \approx 2{,}3\%$.
4. $\mu = 200$, $\sigma = \sqrt{400 \cdot 0{,}25} = 10$: $P(Z > 2) \approx 2{,}3\%$ (TCL).
5. $\frac{0{,}95 \cdot 0{,}3}{0{,}95 \cdot 0{,}3 + 0{,}02 \cdot 0{,}7} = \frac{0{,}285}{0{,}299} \approx 95{,}3\%$.

</details>

## 🔗 Para ir além

- *Probabilidade: Um Curso em Nível Intermediário*, Barry James (IMPA).
- [Seeing Theory](https://seeing-theory.brown.edu/) — mais visualizações de probabilidade.
- 3Blue1Brown: [Bayes theorem](https://www.youtube.com/watch?v=HZGCoVF3YvM) e [Central limit theorem](https://www.youtube.com/watch?v=zeJD6dqJ5lo).
