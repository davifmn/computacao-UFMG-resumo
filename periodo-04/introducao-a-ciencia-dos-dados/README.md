# Introdução à Ciência dos Dados · DCC212

> 4º período · 60h · Pré-requisitos: Probabilidade e Cálculo I.

O ciclo completo de uma análise de dados: coletar e limpar tabelas, explorar com
gráficos, estimar com incerteza, testar hipóteses e fazer previsões, tudo em Python
(pandas, numpy, scipy, matplotlib e scikit-learn). A ênfase está em **pensar com dados**:
quanto confiar num número, quando uma diferença é real e por que um modelo que acerta
tudo no treino pode ser inútil.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🎲 | [Bootstrap](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/introducao-a-ciencia-dos-dados/visualizacoes/bootstrap.html) | Reamostras com reposição destacadas sobre a amostra, o histograma das médias (ou medianas, ou percentis) se formando e o intervalo de confiança comparado com $s/\sqrt n$ |
| 🅰️ | [Teste A/B por permutação](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/introducao-a-ciencia-dos-dados/visualizacoes/teste-ab.html) | Os rótulos A/B sendo embaralhados, a distribuição da diferença sob a hipótese nula e o valor-p; controles de efeito e tamanho da amostra para sentir erro tipo I e poder |
| 📉 | [Correlação e regressão](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/introducao-a-ciencia-dos-dados/visualizacoes/correlacao.html) | O paradoxo de Simpson (a reta sobe no geral e desce em todo grupo) e o quarteto de Anscombe |
| 🧭 | [k vizinhos e sobreajuste](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/introducao-a-ciencia-dos-dados/visualizacoes/knn.html) | Regiões de decisão do k-NN, os vizinhos de um ponto clicado e a curva de acurácia de treino × teste em função de k |

## 📚 Resumo teórico

### 1. Dados tabulares

- **Tidy data**: cada linha é uma observação, cada coluna uma variável. Em pandas: `read_csv`, filtros booleanos, `groupby` + `agg`, `merge` (os JOINs de [Bancos de Dados](../../periodo-03/introducao-a-bancos-de-dados/)), `pivot_table`, valores ausentes (`isna`, `fillna`).
- Variáveis numéricas × categóricas; escalas e unidades; vazamento de dados.

### 2. Exploração e visualização

- Resumos: média × mediana (robustez a outliers), desvio padrão, quantis, boxplot.
- Histogramas, gráficos de dispersão, séries temporais. **Sempre desenhe os dados** (Anscombe).
- Correlação de Pearson ($r$, linear) e de Spearman (postos, monotônica). **Correlação não é causalidade**; cuidado com variáveis de confusão (Simpson).

### 3. Inferência

- População × amostra; a média amostral varia, com erro padrão $\sigma/\sqrt n$ (Teorema Central do Limite, de [Probabilidade](../../periodo-03/probabilidade/)).
- **Bootstrap**: reamostragem com reposição para estimar a distribuição de qualquer estatística; intervalos de confiança por percentis.
- **Testes de hipótese**: hipótese nula, estatística de teste, valor-p, nível de significância, erros tipo I e II, poder. **Teste de permutação** (não paramétrico) e teste t.
- Múltiplas comparações e "p-hacking"; tamanho de efeito.

### 4. Modelos

- **Regressão linear** por mínimos quadrados: $a = r\,s_y/s_x$. Resíduos, $R^2$. Regressão múltipla e a interpretação dos coeficientes. Ajuste também por descida do gradiente.
- **Classificação**: k-NN, regressão logística. Matriz de confusão, acurácia, precisão e revocação.
- **Generalização**: treino/teste, validação cruzada, **viés × variância**, sobreajuste, regularização. Normalização das variáveis.

## 💻 Código

```bash
python3 codigo/icd.py
```

| Arquivo | Conteúdo |
|---|---|
| [`icd.py`](codigo/icd.py) | Bootstrap (com a **cobertura** do intervalo de 95% medida em 300 experimentos), teste de permutação (com a taxa de erro tipo I medida sob H₀), regressão no quarteto de Anscombe e k-NN com validação cruzada, só com a biblioteca padrão |

Equivalentes com bibliotecas: `scipy.stats.bootstrap`, `scipy.stats.permutation_test`, `scipy.stats.linregress`, `sklearn.neighbors.KNeighborsClassifier` com `sklearn.model_selection.cross_val_score`.

## ✍️ Exercícios

1. Uma amostra de 100 tempos de resposta tem média 2,3 s e desvio padrão 0,8 s. Dê um intervalo de 95% aproximado para a média.
2. Por que a mediana é preferível à média para descrever salários?
3. Num teste A/B, o valor-p foi 0,20. Seu chefe conclui: "então há 80% de chance de o layout novo ser melhor". Explique o erro.
4. Uma regressão de nota final em horas de estudo tem $r = 0{,}6$. Que fração da variância das notas a reta explica?
5. Um modelo tem 98% de acurácia num problema em que 98% dos exemplos são da classe "negativo". Ele é bom?

<details>
<summary>Gabarito</summary>

1. Erro padrão $\approx 0{,}8/\sqrt{100} = 0{,}08$; IC $\approx 2{,}3 \pm 1{,}96 \times 0{,}08 = [2{,}14;\ 2{,}46]$ s.
2. Salários são muito assimétricos: poucos valores enormes puxam a média para cima, e a mediana descreve melhor o "salário típico".
3. O valor-p é $P(\text{dados tão extremos} \mid H_0)$, não $P(H_0 \mid \text{dados})$. Um valor-p de 0,20 só diz que a diferença observada é comum quando não há efeito: os dados não permitem concluir nada.
4. $r^2 = 0{,}36$: 36%.
5. Não necessariamente: um modelo que sempre responde "negativo" tem os mesmos 98%. Em classes desbalanceadas, olhe a matriz de confusão, a revocação da classe rara e a precisão.

</details>

## 🔗 Para ir além

- *Computational and Inferential Thinking* (Berkeley, [inferentialthinking.com](https://inferentialthinking.com)), que ensina inferência com bootstrap e permutação no lugar das fórmulas.
- *Python for Data Analysis*, Wes McKinney (o criador do pandas).
- *An Introduction to Statistical Learning*, James, Witten, Hastie e Tibshirani (livre on-line).
