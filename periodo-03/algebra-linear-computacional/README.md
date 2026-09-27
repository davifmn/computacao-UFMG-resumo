# Álgebra Linear Computacional · DCC639

> 3º período · 60h · Pré-requisito: GAAL · Leva a Ciência dos Dados, Aprendizado de Máquina e Computação Gráfica.

GAAL ensinou o que são matrizes e vetores. Esta disciplina ensina a **calcular** com eles
num computador, com números de ponto flutuante, matrizes enormes e esparsas, e a
preocupação constante com precisão e custo.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 📉 | [Mínimos quadrados](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/algebra-linear-computacional/visualizacoes/minimos-quadrados.html) | Arraste pontos e veja o ajuste polinomial pelas equações normais, os resíduos e o sobreajuste com grau alto |
| 🌐 | [PageRank](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/algebra-linear-computacional/visualizacoes/pagerank.html) | Crie links entre páginas e acompanhe o método das potências convergindo para o autovetor dominante da matriz do Google |
| 🖼️ | [Compressão com SVD](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/algebra-linear-computacional/visualizacoes/svd.html) | Uma imagem (inclusive a sua) reconstruída com as k primeiras camadas da SVD, o espectro de valores singulares e as primeiras camadas de posto 1 |

## 📚 Resumo teórico

### 1. Aritmética de ponto flutuante e condicionamento

- Erro de arredondamento: ε da máquina ≈ $2{,}2 \times 10^{-16}$ em `double`.
- **Número de condição** $\kappa(A) = \|A\|\,\|A^{-1}\|$: quanto um erro relativo em $b$ pode ser ampliado em $x$. Com $\kappa \approx 10^k$, perdem-se cerca de $k$ dígitos.
- Estabilidade: preferir algoritmos que não amplificam erros (pivoteamento, ortogonalização).

### 2. Sistemas lineares

- Eliminação de Gauss com **pivoteamento parcial**: $O(n^3)$.
- **Fatoração LU** ($PA = LU$): fatore uma vez e resolva vários lados direitos em $O(n^2)$ cada.
- **Cholesky** ($A = LL^T$) para matrizes simétricas definidas positivas: metade do custo.
- Métodos **iterativos** (Jacobi, Gauss-Seidel, gradientes conjugados) para matrizes grandes e esparsas.

### 3. Mínimos quadrados e ortogonalidade

- Equações normais $A^TA\vec x = A^T\vec b$: simples, mas pioram o condicionamento ($\kappa(A^TA) = \kappa(A)^2$).
- **QR** (Gram-Schmidt, Householder): $A = QR$, e então $R\vec x = Q^T\vec b$. É o método numericamente estável.
- Projeções: $P = A(A^TA)^{-1}A^T$.

### 4. Autovalores

- **Método das potências:** converge para o autovetor dominante com taxa $|\lambda_2/\lambda_1|$.
- Potência inversa (com deslocamento) para achar autovalores específicos; algoritmo **QR** para todos.
- Aplicações: PageRank, cadeias de Markov, centralidade em grafos, vibrações.

### 5. SVD

- $A = U\Sigma V^T$ existe para **toda** matriz. Os $\sigma_i$ medem "quanto" $A$ estica em cada direção.
- **Eckart–Young:** a truncagem $A_k$ é a melhor aproximação de posto $k$.
- Pseudo-inversa $A^+ = V\Sigma^+U^T$, posto numérico, PCA, compressão, sistemas de recomendação.

## 💻 Código

[`codigo/alc.py`](codigo/alc.py): Gauss com pivoteamento, mínimos quadrados, método das
potências e PageRank em Python puro. As visualizações usam um SVD por **Jacobi
unilateral** implementado em [`visualizacoes/numerico.js`](visualizacoes/numerico.js).

## ✍️ Exercícios

1. Por que trocar linhas para usar o maior pivô disponível melhora a precisão?
2. Ajuste uma reta aos pontos (0, 1), (1, 2), (2, 2) por mínimos quadrados.
3. Se $\lambda_1 = 1$ e $|\lambda_2| = 0{,}85$, quantas iterações do método das potências reduzem o erro por um fator de $10^{-6}$?
4. Uma imagem 800 × 600 aproximada com posto 40 guarda quantos números? Qual a taxa de compressão?

<details>
<summary>Gabarito</summary>

1. Dividir por um pivô pequeno gera multiplicadores grandes, que amplificam os erros de arredondamento. O maior pivô mantém os multiplicadores com $|m| \le 1$.
2. $A = [[1,0],[1,1],[1,2]]$, $A^TA = [[3,3],[3,5]]$, $A^Tb = [5, 6]$ ⇒ $c_0 = 7/6$, $c_1 = 1/2$: $y = 1{,}17 + 0{,}5x$.
3. $0{,}85^k = 10^{-6} \Rightarrow k = \frac{6}{-\log_{10} 0{,}85} \approx 85$.
4. $40 \cdot (800 + 600 + 1) = 56.040$ números, contra $480.000$: ≈ 8,6 : 1.

</details>

## 🔗 Para ir além

- *Numerical Linear Algebra*, Trefethen & Bau — o clássico da área.
- [Computational Linear Algebra (fast.ai)](https://github.com/fastai/numerical-linear-algebra) — curso prático com Python.
