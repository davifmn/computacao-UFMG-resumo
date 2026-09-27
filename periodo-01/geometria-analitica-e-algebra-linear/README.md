# Geometria Analítica e Álgebra Linear · MAT038

> 1º período · 60h · Departamento de Matemática · Pré-requisito de Álgebra Linear Computacional.

Álgebra linear é a matemática de **computação gráfica, aprendizado de máquina,
otimização e processamento de sinais**. A chave para entendê-la é geométrica: vetores
são setas, e matrizes são **transformações do espaço**.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🌀 | [Transformações lineares](https://davifmn.github.io/computacao-UFMG-resumo/periodo-01/geometria-analitica-e-algebra-linear/visualizacoes/transformacoes.html) | O plano inteiro se deformando: $\hat\imath$ e $\hat\jmath$ indo para as colunas da matriz, o determinante como área e os autovetores parados na própria reta |
| ➡️ | [Vetores](https://davifmn.github.io/computacao-UFMG-resumo/periodo-01/geometria-analitica-e-algebra-linear/visualizacoes/vetores.html) | Arraste vetores e veja soma, subtração, produto escalar, ângulo, projeção, combinação linear e span |
| 🧮 | [Eliminação gaussiana](https://davifmn.github.io/computacao-UFMG-resumo/periodo-01/geometria-analitica-e-algebra-linear/visualizacoes/gauss.html) | Gauss-Jordan passo a passo com frações exatas, trocas de linha animadas e a classificação SPD/SPI/SI |

## 📚 Resumo teórico

### 1. Vetores

Um vetor em $\mathbb{R}^n$ é uma lista de $n$ números, ou geometricamente uma seta
a partir da origem.

- **Soma** $\vec u + \vec v$: regra do paralelogramo. **Multiplicação por escalar** $k\vec v$: estica, encolhe ou inverte.
- **Norma**: $\|\vec v\| = \sqrt{v_1^2 + \dots + v_n^2}$. Vetor unitário: $\vec v / \|\vec v\|$.
- **Produto escalar**: $\vec u \cdot \vec v = \sum u_i v_i = \|\vec u\|\|\vec v\|\cos\theta$. É zero se e somente se os vetores são ortogonais.
- **Projeção**: $\text{proj}_{\vec v}\vec u = \frac{\vec u \cdot \vec v}{\|\vec v\|^2}\vec v$.
- **Produto vetorial** (só em $\mathbb{R}^3$): $\vec u \times \vec v$ é perpendicular aos dois, e sua norma é a área do paralelogramo.

### 2. Retas e planos

- Reta: $X = P + t\,\vec d$ (forma paramétrica).
- Plano: $ax + by + cz = d$, em que $(a, b, c)$ é o **vetor normal**.
- Distância de ponto a plano: $\dfrac{|ax_0 + by_0 + cz_0 - d|}{\sqrt{a^2 + b^2 + c^2}}$.

### 3. Matrizes como transformações

Uma matriz $A$ ($m \times n$) define $T(\vec x) = A\vec x$, uma transformação
**linear**: $T(\alpha\vec u + \beta\vec v) = \alpha T(\vec u) + \beta T(\vec v)$.
**As colunas de $A$ são as imagens dos vetores da base.**

- **Produto de matrizes = composição**: $AB$ significa "aplique $B$, depois $A$". Em geral $AB \ne BA$.
- **Inversa** $A^{-1}$: desfaz a transformação e só existe se $\det A \ne 0$.
- **Transposta** $A^T$: troca linhas por colunas, e $(AB)^T = B^T A^T$.

### 4. Sistemas lineares

$A\vec x = \vec b$ é resolvido por **eliminação de Gauss(-Jordan)** com operações elementares
nas linhas. O **posto** (número de pivôs) decide tudo:

| Situação | Classificação |
|---|---|
| $\text{posto}(A) < \text{posto}([A\mid b])$ | **SI**: impossível |
| $\text{posto}(A) = \text{posto}([A\mid b]) = n$ | **SPD**: solução única |
| $\text{posto}(A) = \text{posto}([A\mid b]) < n$ | **SPI**: infinitas, com $n - \text{posto}$ variáveis livres |

### 5. Determinante

$\det A$ é o **fator pelo qual as áreas (ou volumes) são multiplicadas**, e o sinal indica
se a orientação foi invertida.

- $2\times 2$: $\det\begin{bmatrix}a&b\\c&d\end{bmatrix} = ad - bc$. Para $3\times 3$ use Sarrus ou expansão de Laplace.
- $\det(AB) = \det A \cdot \det B$, $\quad \det A^{-1} = 1/\det A$, $\quad \det A^T = \det A$.
- $\det A = 0 \iff$ $A$ não é invertível $\iff$ as colunas são linearmente dependentes $\iff$ $A\vec x = \vec 0$ tem solução não trivial.

### 6. Espaços vetoriais

- **Combinação linear**: $\alpha_1\vec v_1 + \dots + \alpha_k\vec v_k$. **Span**: o conjunto de todas elas.
- **Linearmente independentes**: nenhum vetor é combinação dos outros.
- **Base**: conjunto LI que gera o espaço, e **dimensão** é o número de vetores de uma base.
- **Núcleo** $N(A) = \{\vec x : A\vec x = \vec 0\}$ e **imagem** (espaço-coluna). Teorema do núcleo e da imagem: $\dim N(A) + \text{posto}(A) = n$.

### 7. Autovalores e autovetores

$A\vec v = \lambda\vec v$ com $\vec v \ne \vec 0$: direções que a transformação apenas estica.
Os autovalores são as raízes de $\det(A - \lambda I) = 0$ (polinômio característico). Se há
$n$ autovetores LI, $A = PDP^{-1}$ (**diagonalização**), o que torna fácil calcular $A^k$. É
a base do PageRank do Google, de PCA e da análise de estabilidade.

## 💻 Código

[`codigo/gauss.py`](codigo/gauss.py): Gauss-Jordan com `fractions.Fraction` (sem erro
de arredondamento) e classificação do sistema, com testes. Na prática, use
`numpy.linalg.solve`, `numpy.linalg.det` e `numpy.linalg.eig`.

## ✍️ Exercícios

1. Encontre a matriz que gira o plano 90° no sentido horário.
2. Calcule o ângulo entre $(1, 1, 0)$ e $(1, 0, 1)$.
3. Para quais $k$ o sistema $\{x + ky = 1;\ kx + y = 1\}$ tem solução única?
4. Encontre os autovalores de $\begin{bmatrix}2 & 1\\1 & 2\end{bmatrix}$.
5. Se $\det A = 3$ ($3\times 3$), quanto vale $\det(2A)$?

<details>
<summary>Gabarito</summary>

1. $\hat\imath \mapsto (0, -1)$ e $\hat\jmath \mapsto (1, 0)$, logo $\begin{bmatrix}0 & 1\\-1 & 0\end{bmatrix}$.
2. $\cos\theta = \frac{1}{\sqrt2\sqrt2} = \frac12 \Rightarrow \theta = 60^\circ$.
3. $\det = 1 - k^2 \ne 0 \iff k \ne \pm 1$. (Com $k = 1$, SPI; com $k = -1$, SI.)
4. $\det\begin{bmatrix}2-\lambda & 1\\1 & 2-\lambda\end{bmatrix} = (2-\lambda)^2 - 1 = 0 \Rightarrow \lambda = 1$ ou $\lambda = 3$, com autovetores $(1,-1)$ e $(1,1)$. Teste na visualização!
5. $\det(2A) = 2^3 \det A = 24$: cada uma das 3 dimensões é esticada por 2.

</details>

## 🔗 Para ir além

- [**Essence of Linear Algebra**](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab) (3Blue1Brown) — a inspiração deste repositório. Obrigatório.
- *Um Curso de Geometria Analítica e Álgebra Linear*, Reginaldo Santos (UFMG) — [livro gratuito](https://regijs.github.io/) usado na disciplina.
- *Introduction to Linear Algebra*, Gilbert Strang, e as aulas do MIT 18.06.
