# Snake jogado por A*

**Projeto extra ligado a Introdução à IA** · Python · pygame

O jogo da cobrinha, com três modos no menu: o jogador humano e duas IAs de **busca A\***
que escolhem o caminho até a comida.

| Modo | O que faz |
|---|---|
| `JOGAR` | você controla a cobra com as setas |
| `A_STAR` | A\* com distância de Manhattan; o corpo da cobra é obstáculo fixo |
| `A_NEW_STAR` | A\* em **grade toroidal** (atravessa as bordas) e **ciente do tempo**: um segmento do corpo que estará fora do caminho quando a cabeça chegar lá deixa de ser obstáculo |
| `NEAT` | esboço de neuroevolução (ainda não implementado) |

Há sempre 3 comidas na tela. As duas IAs resolvem um pequeno **caixeiro viajante** por
cima do A\*: testam as 3! = 6 ordens de visita, com o custo de cada trecho dado pelo A\*
(com cache), e seguem o caminho até a primeira comida da melhor ordem.

## A ideia do A\* ciente do tempo

Se a cabeça chega a uma célula em $g$ passos e aquele segmento do corpo está a $k$
posições da cauda, a cauda já terá saído dali quando $g \ge k$. Tratar o corpo como parede
fixa (o `A_STAR`) faz a IA desistir de caminhos que estariam livres e se encurralar mais
cedo. A heurística na grade toroidal é a Manhattan "dando a volta":

$$h(a, b) = \min(|r_a - r_b|,\ R - |r_a - r_b|) + \min(|c_a - c_b|,\ C - |c_a - c_b|)$$

que continua **admissível** (nunca superestima), então o A\* continua ótimo.

## Como executar

```bash
pip install pygame
python3 main.py
```

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `main.py` | laço do jogo, colisões, troca de modo |
| `menu.py`, `grid.py`, `snake.py`, `food.py`, `user.py` | menu, grade, cobra, comida e controle pelo teclado |
| `ALGO_PLAYS/A_STAR.py` | A\* clássico |
| `ALGO_PLAYS/A_NEW_STAR.py` | A\* toroidal e ciente do tempo |
| `ALGO_PLAYS/NEAT/` | esboço do agente NEAT e sua configuração |

## O que mudou na migração

Removidos os `__pycache__` e o `current_best.pickle` do NEAT, que estava vazio (0 bytes) e
faria o `pickle.load` falhar ao abrir o modo NEAT.

## Veja também

- Visualização: [busca em grade com BFS, custo uniforme, gulosa e A\*](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/busca.html)
- Outro projeto com neuroevolução: [carro autônomo com NEAT](../carro-autonomo-neat/)

---
Autor: Davi Fraga · migrado de [`davifmn/snake`](https://github.com/davifmn/snake)
