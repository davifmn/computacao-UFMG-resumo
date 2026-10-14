# Pesquisa Operacional · DCC035

> 5º período · 60h · Departamento de Ciência da Computação · pré-requisito: Álgebra Linear Computacional.

Pesquisa operacional é a matemática das **decisões ótimas**: quanto produzir, como
distribuir, quem alocar a qual tarefa. A disciplina ensina a **modelar** um problema como
programação linear (ou inteira) e a **resolvê-lo**: o método simplex, a dualidade (que
transforma "quanto vale um recurso" numa pergunta de otimização), o branch and bound e os
problemas de redes. É a base dos resolvedores usados em logística, energia, finanças e
escalonamento.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 📐 | [Método gráfico](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/pesquisa-operacional/visualizacoes/metodo-grafico.html) | A região viável, as curvas de nível e o gradiente; mexa nos lucros e nos recursos e veja o ótimo pular de vértice, as folgas e os preços-sombra |
| 🧮 | [Simplex](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/pesquisa-operacional/visualizacoes/simplex.html) | O tableau passo a passo (quem entra, teste da razão, pivoteamento) ao lado do caminho de vértice em vértice no plano, terminando nos preços-sombra |
| 🌳 | [Branch and bound](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/pesquisa-operacional/visualizacoes/branch-and-bound.html) | A árvore de ramificação crescendo junto com a região viável sendo fatiada, as podas por limite, inviabilidade e integralidade, e por que arredondar falha |
| 🚰 | [Fluxo máximo](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/pesquisa-operacional/visualizacoes/fluxo-maximo.html) | Edmonds-Karp com caminhos aumentantes, gargalos, arestas usadas ao contrário e o corte mínimo no final |

## 📚 Resumo teórico

### 1. Modelagem

- Variáveis de decisão, função objetivo, restrições. Problemas clássicos: mix de produção, dieta, transporte, designação, mistura, escalonamento de pessoal.
- Hipóteses da PL: proporcionalidade, aditividade, divisibilidade, certeza.
- Forma **padrão** (igualdades + $x \ge 0$): folgas para $\le$, excessos para $\ge$, $x = x^+ - x^-$ para variáveis livres.

### 2. Geometria e o método simplex

- Região viável = **poliedro convexo**; se há ótimo, há ótimo num **vértice** (solução básica viável).
- **Simplex**: base, custos reduzidos, variável que entra, **teste da razão**, pivoteamento. Regra de Bland contra ciclagem.
- Origem inviável: **duas fases** ou **M grande**. Detecção de inviabilidade, ilimitação e múltiplos ótimos.
- Complexidade: exponencial no pior caso (Klee-Minty), rápido na prática; pontos interiores são polinomiais.

### 3. Dualidade e sensibilidade

- Dual de $\max\{c^\top x : Ax \le b, x \ge 0\}$: $\min\{b^\top y : A^\top y \ge c, y \ge 0\}$. Tabela de conversão de sinais de restrições ↔ variáveis.
- **Dualidade fraca** ($c^\top x \le b^\top y$) e **forte** (igualdade no ótimo). **Folgas complementares**: $y_i \cdot (b - Ax)_i = 0$ e $x_j \cdot (A^\top y - c)_j = 0$.
- **Preços-sombra**: $\partial z^* / \partial b_i = y_i^*$, válido no intervalo em que a base ótima não muda. Análise de sensibilidade de $c$ e de $b$; simplex dual.

### 4. Programação inteira

- Variáveis inteiras e binárias: mochila, localização de facilidades, custo fixo ("big M"), restrições lógicas (ou/se-então).
- **Branch and bound**: relaxação linear como limite, ramificação em variável fracionária, podas. **Planos de corte** (Gomory). NP-difícil em geral.

### 5. Problemas em redes

- **Transporte** e **designação** (com matrizes totalmente unimodulares, a PL já dá solução inteira; método húngaro).
- **Caminho mínimo** e **árvore geradora** como PL; **fluxo máximo** (Ford-Fulkerson, Edmonds-Karp) e o teorema do **fluxo máximo / corte mínimo**; fluxo de custo mínimo.

## 💻 Código

```bash
python3 codigo/po.py
```

| Arquivo | Conteúdo |
|---|---|
| [`po.py`](codigo/po.py) | Simplex de duas fases com frações exatas (devolve também os duais), dualidade forte no Wyndor, branch and bound conferido por força bruta, Edmonds-Karp conferido contra o corte mínimo por força bruta em 300 redes aleatórias. Os resultados também foram conferidos com o `scipy.optimize` |

## ✍️ Exercícios

1. Resolva graficamente: $\max\ 3x_1 + 2x_2$ s.a. $x_1 + x_2 \le 4$, $x_1 + 3x_2 \le 6$, $x_1 \le 3$, $x \ge 0$.
2. Escreva o dual do problema 1 e confira que os valores ótimos coincidem.
3. No problema 1, quanto vale uma unidade a mais do recurso da primeira restrição?
4. Resolva por branch and bound: $\max\ 5x + 4y$ s.a. $6x + 4y \le 24$, $x + 2y \le 6$, $x, y \ge 0$ inteiros.
5. Um fluxo de valor 12 e um corte de capacidade 15 foram encontrados. O fluxo máximo pode ser 14? E 16?
6. Modele: 3 fábricas (ofertas 20, 30, 25) e 2 clientes (demandas 40, 35), custo unitário $c_{ij}$. Minimize o custo de transporte.

<details>
<summary>Gabarito</summary>

1. Vértices: (0, 0), (3, 0), (3, 1), (3/2, 5/2), (0, 2). Valores: 0, 9, **11**, 9,5, 4. Ótimo em **(3, 1)** com $z = 11$.
2. Dual: $\min\ 4y_1 + 6y_2 + 3y_3$ s.a. $y_1 + y_2 + y_3 \ge 3$, $y_1 + 3y_2 \ge 2$, $y \ge 0$. As restrições ativas no primal são a 1ª e a 3ª, então $y_2 = 0$ (folga complementar); de $y_1 = 2$ e $y_1 + y_3 = 3$: $y = (2, 0, 1)$, valor $8 + 3 = 11$ ✓.
3. O preço-sombra $y_1 = 2$: $z$ sobe 2 por unidade (enquanto a base não muda).
4. Relaxação: (3; 1,5), $z = 21$. Ramo $y \le 1$: (3,33; 1), $z = 20,67$ → $x \le 3$: (3, 1), $z = 19$ (incumbente); $x \ge 4$: (4, 0), $z = 20$ (nova incumbente). Ramo $y \ge 2$: a 2ª restrição força $x \le 2$, e a relaxação dá (2, 2) com $z = 18 \le 20$: poda por limite. **Ótimo (4, 0), z = 20.**
5. Fluxo máximo ≤ qualquer corte, logo ≤ 15 e ≥ 12: **14 pode**, 16 não.
6. $\min \sum_{i,j} c_{ij} x_{ij}$ s.a. $\sum_j x_{ij} \le s_i$ (oferta de cada fábrica), $\sum_i x_{ij} \ge d_j$ (demanda de cada cliente), $x \ge 0$. A oferta total (75) é igual à demanda total (75), então as desigualdades viram igualdades.

</details>

## 🔗 Para ir além

- *Introdução à Pesquisa Operacional*, Hillier e Lieberman: o livro-texto clássico (o problema Wyndor Glass é dele).
- *Pesquisa Operacional*, Hamdy Taha; *Linear Programming*, Vašek Chvátal: o simplex e a dualidade com mais rigor.
- [HiGHS](https://highs.dev/) e [PuLP](https://coin-or.github.io/pulp/): resolvedores livres para modelar em Python.
