# Introdução à Economia · ECN140

> 1º período · 60h · Faculdade de Ciências Econômicas (FACE).

Economia estuda como pessoas, empresas e governos **alocam recursos escassos**. Para
quem é da computação, ela aparece em sistemas de recomendação, leilões de anúncios,
precificação dinâmica, teoria dos jogos, mecanismos de consenso e na hora de avaliar
se um projeto vale o custo.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 📈 | [Oferta, demanda e intervenções](https://davifmn.github.io/computacao-UFMG-resumo/periodo-01/introducao-a-economia/visualizacoes/oferta-e-demanda.html) | Curvas ajustáveis, choques de mercado animados, imposto (cunha fiscal, incidência e peso morto), preço máximo (escassez) e mínimo (excedente), com todos os excedentes calculados |

## 📚 Resumo teórico

### 1. Conceitos fundamentais

- **Escassez**: recursos são limitados e desejos, não. Daí a necessidade de escolher.
- **Custo de oportunidade**: o valor da melhor alternativa de que se abre mão. O custo real de uma hora de videogame é a hora de estudo que não aconteceu.
- **Fronteira de Possibilidades de Produção (FPP)**: combinações máximas de dois bens que a economia pode produzir. Pontos dentro dela são ineficientes, e pontos fora são inatingíveis.
- **Vantagem comparativa** (Ricardo): mesmo quem é pior em tudo ganha com a troca se especializando naquilo em que seu custo de oportunidade é menor.
- **Micro × macro**: decisões de agentes e mercados individuais × agregados (PIB, inflação, desemprego).

### 2. Demanda e oferta

**Lei da demanda**: tudo mais constante, preço maior → quantidade demandada menor.
**Lei da oferta**: preço maior → quantidade ofertada maior.

| Desloca a **demanda** | Desloca a **oferta** |
|---|---|
| renda (bens normais × inferiores) | custo dos insumos |
| preço de substitutos e complementares | tecnologia |
| gostos e expectativas | número de vendedores |
| número de compradores | expectativas, clima, impostos |

⚠️ Uma mudança no **preço do próprio bem** move o mercado **ao longo** da curva. Todo o resto **desloca a curva**.

### 3. Equilíbrio

No equilíbrio $Q_d(P^*) = Q_s(P^*)$. Com curvas lineares $P = A - BQ$ e $P = C + DQ$:

$$ Q^* = \frac{A - C}{B + D}, \qquad P^* = A - BQ^* $$

Acima de $P^*$ há **excedente** (sobra produto, e o preço tende a cair); abaixo, há
**escassez** (o preço tende a subir).

### 4. Elasticidade

$$ \varepsilon_{P} = \frac{\%\Delta Q}{\%\Delta P} = \frac{dQ}{dP}\cdot\frac{P}{Q} $$

- $|\varepsilon| > 1$: **elástica**. Aumentar o preço **reduz** a receita total.
- $|\varepsilon| < 1$: **inelástica** (bens essenciais, sem substitutos). Aumentar o preço **aumenta** a receita.
- Outras: elasticidade-renda (bens normais têm $> 0$, inferiores $< 0$) e cruzada (substitutos $> 0$, complementares $< 0$).

### 5. Bem-estar

- **Excedente do consumidor**: área entre a demanda e o preço.
- **Excedente do produtor**: área entre o preço e a oferta.
- O equilíbrio competitivo **maximiza** a soma dos excedentes. Distorções geram **peso morto**.

### 6. Intervenções

| Política | Efeito |
|---|---|
| **Imposto** por unidade $t$ | Cria uma cunha $P_c - P_s = t$, reduz a quantidade e gera peso morto. Quem paga mais é o **lado menos elástico** (consumidores pagam $\frac{B}{B+D}$ de $t$). |
| **Preço máximo** (abaixo de $P^*$) | Escassez, filas, mercado negro. Ex.: tabelamento de aluguel. |
| **Preço mínimo** (acima de $P^*$) | Excedente. Ex.: salário mínimo no modelo simples, preço mínimo agrícola. |
| **Subsídio** | O inverso do imposto: aumenta a quantidade além do ótimo e também gera peso morto. |

### 7. Estruturas de mercado

Concorrência perfeita → concorrência monopolística → oligopólio → monopólio. Quanto
menos concorrência, maior o preço e menor a quantidade em relação ao ótimo social.
Monopólios naturais (água, energia) costumam ser regulados. Oligopólios são estudados
com **teoria dos jogos** (equilíbrio de Nash, dilema do prisioneiro).

### 8. Macroeconomia em uma página

- **PIB**: valor de todos os bens e serviços finais produzidos, com $Y = C + I + G + (X - M)$.
- **Inflação** (IPCA): o aumento generalizado de preços. O Banco Central a controla com a taxa **Selic**.
- **Desemprego**, **câmbio** e **balança comercial**. Política fiscal (gastos e impostos) × monetária (juros e moeda).

## ✍️ Exercícios

1. Demanda $Q_d = 120 - 2P$ e oferta $Q_s = 3P - 30$. Encontre o equilíbrio.
2. No item 1, um preço máximo de 20 é fixado. Qual a escassez?
3. O preço da gasolina sobe 10% e a quantidade cai 2%. A demanda é elástica ou inelástica? O que acontece com o gasto total?
4. Por que um imposto sobre cigarros arrecada muito e reduz pouco o consumo?
5. Você pode passar a tarde num estágio que paga R$ 150 ou num curso gratuito. Qual o custo de oportunidade do curso?

<details>
<summary>Gabarito</summary>

1. $120 - 2P = 3P - 30 \Rightarrow P^* = 30$, $Q^* = 60$.
2. Com $P = 20$: $Q_d = 80$ e $Q_s = 30$, então a escassez é de **50** unidades.
3. $|\varepsilon| = 2\%/10\% = 0{,}2 < 1$: **inelástica**. O gasto total **aumenta** (≈ $1{,}10 \times 0{,}98 = 1{,}078$, isto é, +7,8%).
4. A demanda é muito **inelástica** (vício, poucos substitutos): a quantidade cai pouco, então a base tributável se mantém. Pelo mesmo motivo, os consumidores arcam com a maior parte do imposto.
5. **R$ 150** (mais o que mais você deixaria de fazer). "Gratuito" não quer dizer sem custo.

</details>

## 🔗 Para ir além

- *Introdução à Economia*, N. Gregory Mankiw — o livro-texto clássico.
- [CORE Econ — The Economy](https://www.core-econ.org/) — livro-texto moderno e gratuito.
- [Explorable Explanations](https://explorabl.es/) — outras simulações interativas.
