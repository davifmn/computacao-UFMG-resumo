# Introdução à Inteligência Artificial · DCC642

> 7º período · 30h · Departamento de Ciência da Computação.

O que é um agente inteligente e como ele decide o que fazer? A disciplina percorre as ideias
centrais da IA: **busca** (planejar uma sequência de ações), **jogos** (decidir contra um
adversário), **decisões sob incerteza** (quando as ações falham) e **aprendizado** (quando
o agente aprende a partir de exemplos em vez de ser programado), com o livro de Russell e
Norvig como referência.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🧭 | [Busca](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/busca.html) | Largura, profundidade, custo uniforme, gulosa e A* numa grade com paredes e lama (que você desenha), mostrando a ordem das expansões, a fronteira e o custo do caminho |
| ♟️ | [Minimax e alfa-beta](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/minimax.html) | A árvore do livro com α e β em cada nó e os ramos podados; e um jogo da velha contra a IA perfeita, com a avaliação de cada lance |
| 🤖 | [Decisões sob incerteza](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/mdp.html) | Iteração de valor no mundo 4×3: as utilidades se espalhando a partir das saídas e a política ótima mudando com a recompensa por passo |
| 🧠 | [Perceptron e redes neurais](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/redes-neurais.html) | Regiões de decisão sendo aprendidas: o perceptron resolve o separável e falha no XOR; a rede com camada escondida resolve |

## 📚 Resumo teórico

### 1. Agentes

- Agente = percepções → ações; medida de desempenho, racionalidade. Ambientes: observável ou não, determinístico ou estocástico, episódico ou sequencial, estático ou dinâmico, discreto ou contínuo, um ou vários agentes.

### 2. Busca

- Formulação: estados, estado inicial, ações, modelo de transição, teste de objetivo, custo.
- **Sem informação**: largura, custo uniforme, profundidade, aprofundamento iterativo. Completude, otimalidade, tempo e espaço em função de $b$ (ramificação) e $d$ (profundidade).
- **Com informação**: gulosa ($h$) e **A*** ($g + h$); heurísticas **admissíveis** e **consistentes**; projetar heurísticas por problemas relaxados.
- **Busca local**: subida de encosta, têmpera simulada, algoritmos genéticos. **Satisfação de restrições** (CSP): retrocesso, propagação, heurísticas MRV.

### 3. Jogos

- **Minimax**, **poda alfa-beta** ($O(b^{m/2})$ com boa ordenação), funções de avaliação e corte, jogos com sorte (expectiminimax), busca em árvore de Monte Carlo.

### 4. Incerteza e decisão

- Probabilidade, regra de Bayes, redes bayesianas (noções).
- **MDPs**: utilidade, equação de Bellman, **iteração de valor** e de política; **aprendizado por reforço** (Q-learning).

### 5. Aprendizado de máquina

- Supervisionado (classificação, regressão), não supervisionado, por reforço. Treino, validação e teste; sobreajuste.
- Árvores de decisão, k-NN, regressão linear e logística, **perceptron**, **redes neurais** e **retropropagação**; noções de aprendizado profundo.

## 💻 Código

```bash
python3 codigo/ia.py
```

| Arquivo | Conteúdo |
|---|---|
| [`ia.py`](codigo/ia.py) | A* contra custo uniforme em 200 grades aleatórias (mesmo custo, menos expansões); alfa-beta contra minimax em 300 árvores; o jogo da velha (empate com jogo perfeito, 5478 posições legais); iteração de valor com as utilidades do livro; perceptron e uma rede que aprende o XOR com retropropagação |

## ✍️ Exercícios

1. Numa árvore com fator de ramificação $b = 10$ e solução na profundidade $d = 5$, quantos nós a busca em largura gera, no pior caso?
2. A distância em linha reta é admissível para achar a menor rota rodoviária? E o dobro dela?
3. Calcule o minimax de [[3, 12, 8], [2, 4, 6], [14, 5, 2]] e diga quais folhas a alfa-beta não avalia.
4. No mundo 4×3 com R = −0,04, por que a política em (3, 1) aponta para a esquerda?
5. Mostre que nenhuma reta separa o XOR.
6. Por que uma rede com várias camadas mas sem funções de ativação não lineares não resolve o XOR?

<details>
<summary>Gabarito</summary>

1. $b + b^2 + \dots + b^d = 10 + 100 + \dots + 10^5 = 111\,110$ nós.
2. Sim: nenhuma estrada é mais curta que a linha reta, então ela nunca superestima. O dobro não é admissível: pode superestimar, e o A* perde a garantia de otimalidade.
3. Os MIN valem 3, 2 e 2; a raiz vale **3**. No segundo MIN, depois do 2 (≤ α = 3), as folhas **4 e 6** são podadas.
4. Subir dali para (3, 2) e depois ir à direita passa ao lado do buraco: um escorregão (probabilidade 0,1 em cada passo) leva a −1. Com o custo por passo pequeno (−0,04), vale mais a pena dar a volta longa pela esquerda.
5. Uma reta $w_1 x + w_2 y + b = 0$ teria $b \le 0$ (para (0,0) dar 0), $w_1 + b > 0$ e $w_2 + b > 0$ (para (1,0) e (0,1) darem 1), e $w_1 + w_2 + b \le 0$ (para (1,1) dar 0). Somando as duas do meio: $w_1 + w_2 + 2b > 0$, ou seja, $w_1 + w_2 + b > -b \ge 0$, contradição.
6. A composição de funções lineares é linear: a rede inteira equivale a um único perceptron, que não separa o XOR.

</details>

## 🔗 Para ir além

- *Inteligência Artificial: Uma Abordagem Moderna*, Russell e Norvig: o livro-texto (o mundo 4×3 e a árvore de minimax são dele).
- [*Reinforcement Learning: An Introduction*](http://incompleteideas.net/book/the-book-2nd.html), Sutton e Barto (gratuito).
- [3Blue1Brown, "Neural networks"](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi): redes neurais e retropropagação visualmente.
