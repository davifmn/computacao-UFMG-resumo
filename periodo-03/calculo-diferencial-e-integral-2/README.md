# Cálculo Diferencial e Integral II · MAT039

> 3º período · 60h · Departamento de Matemática · Pré-requisito: Cálculo I.

Séries e funções de várias variáveis: o cálculo em mais dimensões. É a matemática por trás
da otimização (e, portanto, do treino de redes neurais), da computação gráfica e da física.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 〰️ | [Séries de Taylor](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/calculo-diferencial-e-integral-2/visualizacoes/taylor.html) | Polinômios de grau crescente "grudando" em sin, cos, eˣ, ln(1+x), 1/(1−x) e √(1+x), com o raio de convergência |
| 🏔️ | [Superfícies e derivadas parciais](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/calculo-diferencial-e-integral-2/visualizacoes/superficies.html) | Superfícies 3D que giram com o mouse, cortes nas direções x e y, retas tangentes, plano tangente, curvas de nível e gradiente |
| ⛷️ | [Descida do gradiente](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/calculo-diferencial-e-integral-2/visualizacoes/gradiente.html) | Trajetórias sobre curvas de nível, efeito do passo η (converge × diverge), zigue-zague em vales, momento, Rosenbrock e mínimos locais |

## 📚 Resumo teórico

### 1. Sequências e séries

- Uma série $\sum a_n$ converge se as somas parciais convergem. Condição necessária: $a_n \to 0$ (a harmônica $\sum 1/n$ mostra que não é suficiente).
- Testes: comparação, razão ($\lim |a_{n+1}/a_n| < 1$), raiz, integral e séries alternadas (Leibniz).
- A série geométrica $\sum r^n = \frac{1}{1-r}$ para $|r| < 1$; a série $p$, $\sum 1/n^p$, converge se e somente se $p > 1$.

### 2. Séries de potências e de Taylor

- $\sum c_n (x-a)^n$ converge em $|x - a| < R$ (raio de convergência, pelo teste da razão).
- **Taylor:** $f(x) = \sum \frac{f^{(n)}(a)}{n!}(x-a)^n$. Com $a = 0$, é a série de Maclaurin.
- O **resto de Lagrange** $R_n = \frac{f^{(n+1)}(c)}{(n+1)!}(x-a)^{n+1}$ limita o erro.

### 3. Funções de várias variáveis

- Domínio, gráfico, **curvas de nível** $f(x,y) = c$, limites e continuidade (o limite tem que ser o mesmo por todos os caminhos).
- **Derivadas parciais** $f_x, f_y$ e o teorema de Schwarz: $f_{xy} = f_{yx}$.
- **Regra da cadeia:** $\frac{dz}{dt} = f_x \frac{dx}{dt} + f_y \frac{dy}{dt}$.
- **Gradiente** $\nabla f$: direção de maior crescimento, perpendicular às curvas de nível. **Derivada direcional** $D_{\vec u} f = \nabla f \cdot \vec u$.
- **Plano tangente:** $z = f(a,b) + f_x(a,b)(x-a) + f_y(a,b)(y-b)$.

### 4. Otimização

- Pontos críticos: $\nabla f = 0$. Classificação pela Hessiana: $D = f_{xx}f_{yy} - f_{xy}^2$. Se $D > 0$ e $f_{xx} > 0$, mínimo; se $D > 0$ e $f_{xx} < 0$, máximo; se $D < 0$, sela.
- **Multiplicadores de Lagrange** para otimizar sob a restrição $g = c$: $\nabla f = \lambda \nabla g$.
- Método numérico: descida do gradiente $\vec x \leftarrow \vec x - \eta\nabla f$.

### 5. Integrais múltiplas

- Integral dupla como volume e o teorema de Fubini (integrais iteradas em qualquer ordem, em regiões retangulares).
- Mudança para **coordenadas polares**: $dA = r\,dr\,d\theta$ (e o famoso $\int_{-\infty}^{\infty} e^{-x^2}dx = \sqrt\pi$).
- Integrais triplas; coordenadas cilíndricas e esféricas; o jacobiano na mudança de variáveis.

## 💻 Código

[`codigo/calculo2.py`](codigo/calculo2.py): Taylor, gradiente numérico, descida do gradiente e integral dupla, com testes.

## ✍️ Exercícios

1. Encontre o raio de convergência de $\sum \frac{x^n}{n \, 2^n}$.
2. Calcule o polinômio de Taylor de grau 2 de $\ln x$ em torno de $a = 1$.
3. Para $f(x,y) = x^2 y - y^3$, calcule $\nabla f(1, 2)$ e a derivada direcional na direção $(3, 4)/5$.
4. Encontre e classifique os pontos críticos de $f(x, y) = x^3 - 3x + y^2$.
5. Calcule $\iint_R xy\,dA$ com $R = [0,1] \times [0,2]$.

<details>
<summary>Gabarito</summary>

1. Pelo teste da razão, $\lim \frac{|x|}{2}\frac{n}{n+1} = \frac{|x|}{2} < 1 \Rightarrow R = 2$.
2. $(x - 1) - \frac{(x-1)^2}{2}$.
3. $\nabla f = (2xy, x^2 - 3y^2) = (4, -11)$; $D_u f = \frac{3 \cdot 4 + 4 \cdot (-11)}{5} = -6{,}4$.
4. $\nabla f = (3x^2 - 3, 2y) = 0 \Rightarrow (\pm 1, 0)$. Em $(1, 0)$: $D = 6 \cdot 2 > 0$ com $f_{xx} > 0$, mínimo. Em $(-1, 0)$: $D < 0$, sela.
5. $\int_0^1 x\,dx \cdot \int_0^2 y\,dy = \frac12 \cdot 2 = 1$.

</details>

## 🔗 Para ir além

- *Cálculo*, James Stewart — Vol. 2.
- [Khan Academy: Multivariable Calculus](https://www.khanacademy.org/math/multivariable-calculus), com vídeos de Grant Sanderson (o próprio 3Blue1Brown).
