# Equações Diferenciais C · MAT040

> 5º período · 60h · Departamento de Matemática · pré-requisito: Cálculo Diferencial e Integral II.

Uma equação diferencial relaciona uma função com suas derivadas: a lei de resfriamento,
o crescimento de uma população, a mola, o circuito, a epidemia. Esta disciplina ensina a
**resolver** as equações clássicas (de 1ª ordem, lineares de 2ª ordem, sistemas lineares,
por séries e pela transformada de Laplace) e, tão importante quanto, a **entender o
comportamento** das soluções sem resolvê-las. Para quem faz computação, é o primeiro
contato com simulação numérica, controle e modelagem de sistemas dinâmicos.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🧭 | [Campo de direções](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/equacoes-diferenciais-c/visualizacoes/campo-de-direcoes.html) | O campo de inclinações de seis EDOs (linear, logística, explosão em tempo finito, falta de unicidade…); clique para escolher a condição inicial e compare Euler, Heun e RK4 com a solução exata, com a tabela que mede a ordem de cada método |
| 🪀 | [Oscilador massa-mola](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/equacoes-diferenciais-c/visualizacoes/oscilador.html) | A massa balançando ao lado do gráfico de y(t): regimes sub, crítico e superamortecido, envelope exponencial, força periódica, batimentos, ressonância e a curva de resposta A(ω) |
| 🎯 | [Treino para as provas](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/equacoes-diferenciais-c/visualizacoes/treino.html) | Trilhas teoria → exemplo resolvido → exercícios (estilo Responde Aí), questões infinitas no formato das quatro listas com a fórmula digitada corrigida na hora, folha de fórmulas ao lado (ocultável), cores que acompanham cada objeto do enunciado à resposta (estilo integral-calculator), níveis de domínio no estilo Khan Academy, simulado intercalado e revisão espaçada |
| 📝 | [Guia da prova](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/equacoes-diferenciais-c/tutoriais/guia-da-prova.html) | O que cai em cada prova (mapa das listas), o fluxograma "qual método?", uma receita por tipo de questão e as listas 1 a 4 resolvidas e conferidas no computador, com a errata dos gabaritos das listas 3 e 4 |
| 🌀 | [Plano de fase](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/equacoes-diferenciais-c/visualizacoes/plano-de-fase.html) | Partículas seguindo x' = Ax, autovetores, selas, nós, espirais e centros, e o ponto (traço, determinante) andando no diagrama de classificação |

## 🧭 Como estudar para as provas

As quatro listas do professor (1ª ordem, 2ª ordem, Laplace e sistemas lineares) definem o que cai.
O [guia da prova](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/equacoes-diferenciais-c/tutoriais/guia-da-prova.html)
traz o mapa e as listas resolvidas; o [treino](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/equacoes-diferenciais-c/visualizacoes/treino.html)
aplica o que a pesquisa em aprendizagem mostra que funciona:

| Princípio | Referência | No treino |
|---|---|---|
| Domínio por níveis | Khan Academy (Tentado → Familiar → Proficiente → Dominado) | rodadas de 5 questões; 100% = Proficiente |
| Testar a memória e espaçar | Dunlosky et al. (2013): as duas técnicas mais bem avaliadas entre dez | revisão em 1, 2, 4 e 8 dias |
| Prática intercalada | Rohrer et al. (2020): 61% × 38% num teste surpresa um mês depois | simulado misturado e "Qual método?" |
| Exemplos resolvidos que somem aos poucos | Renkl e Atkinson (2003) | exemplo resolvido e dicas de um passo por vez |
| Sessão = teoria curta + exemplo + prática | MIT 18.03SC; Responde Aí (teoria e questões em sequência) | botão **Aprender** e a trilha da lista |
| Cores como placeholders | integral-calculator.com (cada parte do passo tem uma cor fixa) | $\mu$, $\lambda_1$, $\mathbf v_1$, cada parcela de $f(t)$… mantêm a cor até a resposta |
| Consulta rápida | folha de fórmulas | painel 📐 ao lado da questão (tecla F) |

## 📚 Resumo teórico

### 1. EDOs de 1ª ordem

- **Separáveis**: $y' = g(t)h(y) \Rightarrow \int dy/h(y) = \int g(t)\,dt$.
- **Lineares**: $y' + p(t)y = q(t)$, fator integrante $\mu = e^{\int p}$: $(\mu y)' = \mu q$.
- **Exatas** ($M\,dx + N\,dy = 0$ com $M_y = N_x$) e fatores integrantes; **Bernoulli** ($y' + py = qy^n$, troca $v = y^{1-n}$); homogêneas ($y' = F(y/t)$).
- **Existência e unicidade** (Picard): $f$ e $f_y$ contínuas ⇒ solução única local. Explosão em tempo finito; falta de unicidade.
- **Autônomas** $y' = g(y)$: equilíbrios, estabilidade pelo sinal de $g'$, linha de fase. Modelos: crescimento exponencial, logístico, resfriamento de Newton, misturas.

### 2. Lineares de 2ª ordem

- Homogênea com coeficientes constantes: $ay'' + by' + cy = 0$, equação característica $ar^2 + br + c = 0$. Raízes reais distintas, repetida ($te^{rt}$) ou complexas ($e^{\alpha t}\cos\beta t$, $e^{\alpha t}\,\text{sen}\,\beta t$).
- **Wronskiano** e independência linear; princípio da superposição; redução de ordem.
- Não homogênea: solução geral = homogênea + particular. **Coeficientes a determinar** (com a regra do fator $t$ quando o chute resolve a homogênea) e **variação de parâmetros**.
- **Vibrações mecânicas e elétricas**: amortecimento, ressonância, batimentos; o análogo RLC.

### 3. Sistemas lineares

- $\mathbf{x}' = A\mathbf{x}$: solução por **autovalores e autovetores**; casos de autovalores complexos e repetidos (autovetor generalizado); matriz fundamental e $e^{At}$.
- **Plano de fase** 2×2 e o diagrama traço-determinante: sela, nó, espiral, centro.
- Uma EDO de ordem $n$ vira um sistema de $n$ equações de 1ª ordem.

### 4. Transformada de Laplace

- $\mathcal{L}\{f\}(s) = \int_0^\infty e^{-st}f(t)\,dt$. Linearidade, $\mathcal{L}\{f'\} = sF - f(0)$, $\mathcal{L}\{f''\} = s^2F - sf(0) - f'(0)$.
- Tabela: $1/s$, $1/(s - a)$, $n!/s^{n+1}$, $b/(s^2 + b^2)$, $s/(s^2 + b^2)$; deslocamentos em $s$ e em $t$.
- Degrau de Heaviside, delta de Dirac (impulso), **convolução**. Resolve PVIs com forçamentos descontínuos via frações parciais.

### 5. Séries e métodos numéricos

- Solução em série de potências perto de pontos ordinários; pontos singulares regulares (Frobenius); equações de Legendre e Bessel.
- **Euler** ($O(h)$), **Heun** ($O(h^2)$), **Runge-Kutta 4** ($O(h^4)$); estabilidade e escolha do passo.

## 💻 Código

```bash
python3 codigo/edo.py
```

| Arquivo | Conteúdo |
|---|---|
| [`treino-teoria.js`](visualizacoes/treino-teoria.js) | Teoria em pílulas (ideia, passo a passo, pegadinha) e folha de fórmulas de cada habilidade, com as mesmas cores dos passos |
| [`treino.js`](visualizacoes/treino.js) | Geradores das 20 habilidades do treino, leitor de fórmulas (com multiplicação implícita e degrau $u_c(t)$), correção por equivalência numérica e regras de domínio; os testes conferem centenas de questões sorteadas contra o próprio enunciado |
| [`edo.py`](codigo/edo.py) | Euler, Heun e RK4 com as ordens de convergência medidas (1, 2, 4); oscilador nos três regimes contra a fórmula fechada; amplitude do regime permanente; ressonância $y'' + 4y = \cos 2t$; classificação de sistemas 2×2; tabela de Laplace conferida por integração numérica |

## ✍️ Exercícios

1. Resolva $y' + 2y = 4$, $y(0) = 0$.
2. Resolva $y' = ty^2$, $y(0) = 1$. Em que intervalo a solução existe?
3. Ache a solução geral de $y'' - 5y' + 6y = 0$ e de $y'' + 2y' + 5y = 0$.
4. Ache uma solução particular de $y'' + y = 3\cos t$.
5. Uma massa de 1 kg numa mola com $k = 9$ N/m e atrito $c$: para que valor de $c$ o amortecimento é crítico?
6. Classifique a origem de $\mathbf{x}' = \begin{pmatrix} 1 & -2 \\ 3 & -4 \end{pmatrix}\mathbf{x}$.
7. Resolva $y'' + 3y' + 2y = 0$, $y(0) = 1$, $y'(0) = 0$ pela transformada de Laplace.
8. Com Euler e $h = 0{,}5$, estime $y(1)$ para $y' = y$, $y(0) = 1$. Compare com $e$.

Os exercícios das listas da disciplina estão resolvidos no [guia da prova](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/equacoes-diferenciais-c/tutoriais/guia-da-prova.html).

<details>
<summary>Gabarito</summary>

1. Fator integrante $e^{2t}$: $y = 2 - 2e^{-2t}$.
2. Separável: $-1/y = t^2/2 + C$, $C = -1$, então $y = 2/(2 - t^2)$. Existe em $-\sqrt 2 < t < \sqrt 2$ (explode nas pontas).
3. $r = 2, 3$: $y = c_1 e^{2t} + c_2 e^{3t}$. $r = -1 \pm 2i$: $y = e^{-t}(c_1\cos 2t + c_2\,\text{sen}\,2t)$.
4. $\cos t$ resolve a homogênea, então chute $t(A\cos t + B\,\text{sen}\,t)$: $y_p = \frac{3}{2}\,t\,\text{sen}\,t$.
5. $c^2 = 4mk = 36$: $c = 6$ kg/s.
6. tr = −3, det = −4 + 6 = 2, tr² − 4 det = 1 > 0: autovalores −1 e −2, **nó estável**.
7. $s^2Y - s + 3(sY - 1) + 2Y = 0 \Rightarrow Y = \frac{s + 3}{(s + 1)(s + 2)} = \frac{2}{s + 1} - \frac{1}{s + 2}$, logo $y = 2e^{-t} - e^{-2t}$.
8. $y_1 = 1 + 0{,}5 = 1{,}5$; $y_2 = 1{,}5 + 0{,}75 = 2{,}25$. O valor exato é $e \approx 2{,}718$: erro de 17%, típico de um método de ordem 1 com passo grande.

</details>

## 🔗 Para ir além

- *Equações Diferenciais Elementares e Problemas de Valores de Contorno*, Boyce e DiPrima: o livro-texto clássico do curso.
- *Equações Diferenciais*, Zill e Cullen: muitos exercícios resolvidos.
- *Nonlinear Dynamics and Chaos*, Steven Strogatz (e as aulas dele no YouTube): o plano de fase levado a sério.
- [3Blue1Brown, "Differential equations"](https://www.youtube.com/playlist?list=PLZHQObOWTQDNPOjrT6KVlfJuKtYTftqH6): a série que inspirou este repositório.
