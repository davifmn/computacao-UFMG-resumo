# Cálculo Diferencial e Integral I · MAT001

> 2º período · 90h · Departamento de Matemática · Leva a Cálculo II, Probabilidade e Equações Diferenciais.

O Cálculo estuda **mudança** (derivadas) e **acumulação** (integrais), e mostra que as
duas são operações inversas. Para quem é da computação ele está em todo lugar: análise
de algoritmos (limites e crescimento de funções), otimização, aprendizado de máquina
(gradientes), gráficos, física de jogos e métodos numéricos.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🎯 | [Limites (ε-δ)](visualizacoes/limites.html) | O jogo do épsilon e do delta: você escolhe δ e o gráfico mostra se funcionou; casos com buraco, salto e oscilação |
| 📈 | [Derivada](visualizacoes/derivada.html) | A secante girando até virar tangente quando h → 0, o gráfico de f′ sendo traçado e a **derivada simbólica** de qualquer função que você digitar |
| 📊 | [Integral](visualizacoes/integral.html) | Somas de Riemann (esquerda, direita, ponto médio, trapézio) com n crescente e uma tabela mostrando a ordem de convergência de cada método |

> O motor por trás das páginas ([`visualizacoes/expr.js`](visualizacoes/expr.js)) faz análise sintática de expressões e as **deriva simbolicamente**, aplicando as regras abaixo recursivamente sobre a árvore da expressão.

## 📚 Resumo teórico

### 1. Limites e continuidade

$\lim_{x \to a} f(x) = L \iff \forall \varepsilon > 0\ \exists \delta > 0:\ 0 < |x - a| < \delta \Rightarrow |f(x) - L| < \varepsilon$.

- Limites laterais, limites no infinito e limites infinitos (assíntotas).
- Indeterminações ($\frac00$, $\frac\infty\infty$, $0 \cdot \infty$…): fatorar, racionalizar ou usar L'Hôpital.
- **Limites fundamentais:** $\lim_{x\to0} \frac{\sin x}{x} = 1$ e $\lim_{x\to\infty}(1 + \frac1x)^x = e$.
- **Continuidade:** $\lim_{x\to a} f(x) = f(a)$. **Teorema do Valor Intermediário** (base do método da bisseção) e **de Weierstrass** (máximo e mínimo em intervalo fechado).

### 2. Derivadas

$f'(x) = \lim_{h\to0} \frac{f(x+h) - f(x)}{h}$: a inclinação da tangente, ou taxa de variação instantânea.

| Regra | Fórmula |
|---|---|
| Potência | $(x^n)' = n x^{n-1}$ |
| Produto / quociente | $(uv)' = u'v + uv'$, $\ (u/v)' = (u'v - uv')/v^2$ |
| Cadeia | $(f \circ g)'(x) = f'(g(x))\, g'(x)$ |
| Exponencial e log | $(e^x)' = e^x$, $(a^x)' = a^x \ln a$, $(\ln x)' = 1/x$ |
| Trigonométricas | $(\sin x)' = \cos x$, $(\cos x)' = -\sin x$, $(\tan x)' = \sec^2 x$ |
| Inversas | $(\arctan x)' = \frac{1}{1+x^2}$, $(\arcsin x)' = \frac{1}{\sqrt{1-x^2}}$ |

Também: derivação implícita e taxas relacionadas.

### 3. Aplicações da derivada

- **Pontos críticos** ($f' = 0$ ou inexistente); testes da 1ª e da 2ª derivada; concavidade e pontos de inflexão.
- **Otimização:** maximizar ou minimizar sujeito a restrições (a latinha de volume fixo com menor área).
- **Teorema do Valor Médio:** existe $c$ com $f'(c) = \frac{f(b) - f(a)}{b - a}$.
- **L'Hôpital:** $\lim \frac fg = \lim \frac{f'}{g'}$ em indeterminações $\frac00$ ou $\frac\infty\infty$.
- **Aproximação linear** e **método de Newton**: $x_{k+1} = x_k - f(x_k)/f'(x_k)$.
- **Esboço de gráficos:** domínio, interceptos, assíntotas, crescimento e concavidade.

### 4. Integrais

- **Integral definida** = limite das somas de Riemann = área com sinal.
- **Teorema Fundamental do Cálculo:** $\frac{d}{dx}\int_a^x f(t)\,dt = f(x)$ e $\int_a^b f = F(b) - F(a)$.
- **Técnicas:** substituição ($u = g(x)$), integração por partes ($\int u\,dv = uv - \int v\,du$), frações parciais e substituição trigonométrica.
- **Aplicações:** área entre curvas, volumes de revolução, comprimento de arco, valor médio.
- **Integrais impróprias:** $\int_1^\infty \frac{1}{x^p}dx$ converge $\iff p > 1$.

## 💻 Código

[`codigo/calculo.py`](codigo/calculo.py): derivada numérica (diferença central), somas de
Riemann, trapézio, Simpson, bisseção e método de Newton, com testes. Execute com
`python3 codigo/calculo.py` e compare os erros de cada método.

## ✍️ Exercícios

1. Calcule $\lim_{x\to0} \frac{1 - \cos x}{x^2}$.
2. Derive $f(x) = x^2 e^{\sin x}$.
3. Uma caixa sem tampa é feita de uma folha 12 × 12 cortando quadrados de lado $x$ nos cantos. Qual $x$ maximiza o volume?
4. Calcule $\int_0^1 x e^{x}\,dx$.
5. Quantas iterações do método da bisseção são necessárias para achar uma raiz em $[0, 1]$ com erro menor que $10^{-6}$?

<details>
<summary>Gabarito</summary>

1. $\frac12$ (L'Hôpital duas vezes, ou use $1 - \cos x = 2\sin^2(x/2)$).
2. $f'(x) = 2x e^{\sin x} + x^2 \cos x\, e^{\sin x}$. Digite `x^2 e^(sin(x))` na [página da derivada](visualizacoes/derivada.html) para conferir.
3. $V = x(12 - 2x)^2$, $V' = (12 - 2x)(12 - 6x) = 0 \Rightarrow x = 2$ (volume 128).
4. Por partes: $[x e^x - e^x]_0^1 = 1$.
5. O erro cai pela metade a cada passo: $2^{-k} < 10^{-6} \Rightarrow k \ge 20$.

</details>

## 🔗 Para ir além

- [**Essence of Calculus**](https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr) (3Blue1Brown) — 12 vídeos que mudam a forma de ver a disciplina.
- *Cálculo*, James Stewart — Vol. 1.
- [Desmos](https://www.desmos.com/calculator) — para explorar gráficos rapidamente.
