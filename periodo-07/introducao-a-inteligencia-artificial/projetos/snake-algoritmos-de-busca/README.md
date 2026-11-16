# Snake e algoritmos de busca

**Projeto extra ligado a Introdução à IA** · Python · pygame

O jogo da cobrinha como laboratório de busca: 15 agentes em duas famílias, cada um mostrando
o que **pensa** antes de cada passo (células expandidas, fronteira, caminho planejado,
simulações). A mesma coisa roda no navegador, sem instalar nada:
**[Snake: quinze maneiras de pensar](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/snake.html)**.

## As duas famílias

Um algoritmo é **determinístico** quando a mesma entrada produz sempre a mesma saída. Com a
mesma semente da comida, a partida se repete passo a passo (tecla `R` no jogo). Os
**não determinísticos** sorteiam; cada um recebe um `random.Random` com semente própria, então
mudar a semente do agente muda a partida.

> No Russell e Norvig, "ambiente *não determinístico*" é outra coisa: é quando a **ação** pode
> ter vários resultados, e a resposta é a busca E-OU. Aqui o ambiente é determinístico (só a
> comida nova é sorteada); quem sorteia é o **algoritmo**, ou seja, um algoritmo aleatorizado.

### Determinísticos (`cobra/algoritmos/deterministicos/`)

| Grupo | Algoritmo | Ideia |
|---|---|---|
| Busca cega | Largura (BFS) | fila: a primeira comida tirada está no menor número de passos |
| | Profundidade (DFS) | pilha: mergulha em ↑, →, ↓, ← e volta quando trava; caminhos sinuosos |
| | Custo uniforme (com risco) | menor $g$, com custo $1 + 2\times$(vizinhos bloqueados): foge de paredes |
| Busca informada | Gulosa | menor $h$ (Manhattan) |
| | A* | menor $f = g + h$; ótimo, pois $h$ é admissível |
| A* adaptado à cobra | A* + caixeiro viajante | com 3 comidas, testa as $3! = 6$ ordens de visita *(do projeto original)* |
| | A* ciente do tempo | o segmento a $k$ posições da cauda sai em $k$ passos *(o `A_NEW_STAR` original)* |
| | A* seguro (com fantasma) | simula a cobra comendo e só vai se ela ainda tiver rota de fuga |
| Sem busca | Ciclo hamiltoniano | percorre um ciclo por todas as células: vence sempre, devagar |

### Não determinísticos (`cobra/algoritmos/nao_deterministicos/`)

| Grupo | Algoritmo | Ideia |
|---|---|---|
| Linha de base | Passeio aleatório | sorteia entre os movimentos que não matam já |
| Busca local | Subida de encosta estocástica | sorteia entre os vizinhos mais perto da comida |
| | Têmpera simulada | aceita pioras com probabilidade $e^{\Delta/T}$, $T = T_0\,\alpha^{\text{fome}}$ |
| Simulação | Monte Carlo | 20 partidas aleatórias de 30 passos por movimento; melhor média |
| | MCTS (UCT) | árvore guiada pela UCB1, $\bar Q_i + c\sqrt{\ln N / n_i}$; 250 iterações |
| Evolução | Algoritmo genético | evolui 5 pesos de uma função que dá nota a cada movimento |

O genético é um caso curioso: o **treino** é aleatório (população, cruzamento, mutação), mas o
agente treinado joga de forma determinística (maior nota).

## O que os resultados mostram

`python3 torneio.py -n 3` (18 × 12, mesmas sementes para todos):

| Algoritmo | Comida média | Lição |
|---|---:|---|
| BFS / A* | ≈ 57 | mesmo caminho, mas o A* expande menos nós por decisão (7,5 × 9,4) |
| A* ciente do tempo | ≈ 64 | modelo melhor do presente, mas ainda sem olhar além da comida |
| A* seguro | ≈ 112 | olhar além do objetivo imediato muda tudo |
| Ciclo hamiltoniano | 213 (vence) | garantia sem busca, ao custo de até $W \cdot H$ passos por comida |
| Subida de encosta / têmpera | ≈ 25 / 16 | aleatoriedade não ajuda quando o perigo não é um ótimo local |
| Monte Carlo / MCTS | ≈ 61 / 54 | estimar o futuro por amostragem funciona, mas custa ~6 e ~19 ms por decisão |
| Genético | ≈ 79 | pesos evoluídos valorizam espaço livre e rota de fuga |

O motivo de o A* puro morrer é o centro da página: ele é ótimo no **modelo** em que buscou
(o corpo é parede fixa e nada importa depois da comida), não no jogo.

## Como executar

```bash
pip install pygame
python3 jogar.py                     # menu com as duas famílias
python3 torneio.py                   # tabela comparativa, sem tela
python3 torneio.py --familia det -n 10 --tamanho 24x16 --toro
python3 torneio.py --evoluir         # treina o genético e mostra as gerações
python3 -m unittest -v               # testes (não precisam de pygame)
```

No jogo: `Espaço` pausa · `N` um passo · `T` mostra/esconde o pensamento · `+`/`−` velocidade ·
`R` mesma partida · `S` outra partida · `B` bordas (paredes/toro) · `Esc` menu. Em "Você joga",
setas ou WASD.

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `cobra/jogo.py` | regras puras (sem pygame): passo, colisões, comida com semente, modelos de obstáculo, inundação e rota de fuga |
| `cobra/algoritmos/base.py` | `Decisao` (direção + pensamento), a busca genérica (BFS, DFS, UCS, gulosa, A*) e o plano de sobrevivência |
| `cobra/algoritmos/deterministicos/` | `planejador.py` (segue e replaneja), `busca_cega.py`, `busca_informada.py`, `a_estrela_cobra.py`, `hamiltoniano.py` |
| `cobra/algoritmos/nao_deterministicos/` | `busca_local.py`, `monte_carlo.py` (Monte Carlo e MCTS), `genetico.py` |
| `cobra/algoritmos/torneio.py` | uma partida sem tela (usada pelo torneio, pelo genético e pelos testes) |
| `jogar.py` | interface pygame: menu, tabuleiro e painel com o pensamento |
| `torneio.py` | comparação na linha de comando |
| `test_jogo.py`, `test_algoritmos.py` | regras; otimalidade da BFS e do A*; caminhos válidos; ciclo hamiltoniano; determinismo × semente; quem pensa no depois vive mais |

## O que mudou na migração

Na migração, removidos os `__pycache__` e o `current_best.pickle` do NEAT, que estava vazio.

Na refatoração (novembro de 2026), o projeto foi reescrito em torno das duas famílias:

- **Regras separadas da tela.** O jogo virou `cobra/jogo.py`, sem pygame, para os agentes
  simularem partidas e os testes rodarem na CI. As regras continuam as do original (meia-volta
  ignorada, cauda liberando espaço), agora com morte por parede (opcional: bordas toroidais,
  como no original) e por fome (laços infinitos).
- **A\* original preservado e corrigido.** O `A_STAR` não atravessava as bordas, mas o jogo
  atravessava, então às vezes escolhia caminhos mais longos que o necessário; agora a busca
  usa a mesma geometria do jogo. O caixeiro viajante sobre as 3 comidas virou o agente
  "A* + caixeiro viajante" e o `A_NEW_STAR` virou "A* ciente do tempo".
- **NEAT substituído.** O agente NEAT nunca foi implementado (a função de aptidão só fazia
  `fitness -= 1`) e dependia do `neat-python`. No lugar, um algoritmo genético em Python puro,
  que de fato aprende (≈ 79 comidas por partida).
- **Novos agentes**: BFS, DFS, custo uniforme com risco, gulosa, A* seguro e ciclo hamiltoniano
  (determinísticos); passeio aleatório, subida de encosta, têmpera simulada, Monte Carlo e MCTS
  (não determinísticos).
- **Pensamento visível**: cada agente devolve o que considerou, e a interface desenha.
- A pasta mudou de `snake-a-estrela-e-neat` para `snake-algoritmos-de-busca`.

## Veja também

- Visualização: [Snake: quinze maneiras de pensar](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/snake.html) (os mesmos agentes em JavaScript, com corrida e treino do genético no navegador)
- Visualização: [busca em grade com BFS, custo uniforme, gulosa e A\*](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/busca.html)
- Outro projeto com neuroevolução: [carro autônomo com NEAT](../carro-autonomo-neat/)

---
Autor: Davi Fraga · migrado de [`davifmn/snake`](https://github.com/davifmn/snake)
