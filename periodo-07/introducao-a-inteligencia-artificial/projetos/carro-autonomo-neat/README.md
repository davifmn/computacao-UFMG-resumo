# Carro autônomo com NEAT

**Projeto extra ligado a Introdução à IA** · Python · pygame · neat-python

Você desenha uma pista; uma população de redes neurais aprende a dirigir nela por
**neuroevolução**. O NEAT (*NeuroEvolution of Augmenting Topologies*) evolui ao mesmo
tempo os pesos e a **estrutura** das redes: começa com redes mínimas e acrescenta neurônios
e conexões por mutação, protegendo inovações recentes com especiação.

## O agente

| | |
|---|---|
| Entradas (8) | 5 sensores de distância até a borda da pista (raios em ângulos fixos), velocidade, ângulo do carro e distância até a chegada, todos normalizados |
| Saídas (2) | direção (< 0,4 vira à esquerda, > 0,6 vira à direita) e acelerar (> 0,5) |
| Ativação | ReLU |
| População | 50 genomas por geração |
| Aptidão | distância percorrida, −0,8 por quadro parado, −1 000 se bater, +10 000 se cruzar a chegada; cada episódio dura até 10 s |

## Como executar

Rode de dentro desta pasta (os caminhos de `assets/` são relativos):

```bash
pip install pygame neat-python
python3 main.py
```

```
[0] Desenhar nova pista      salva assets/pista.png e assets/pista.json (largada e chegada)
[1] Jogar manualmente        A/D viram, espaço acelera
[2] Treinar IA               40 rodadas de 50 gerações, retomando de checkpoints do NEAT
[3] Testar melhor rede       carrega best.pickle e mostra o carro dirigindo
```

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `main.py` | menu e modo manual |
| `carro.py` | física do carro, sensores (*ray casting* na imagem da pista), colisão e chegada |
| `pista/pista.py` | editor de pista com o mouse |
| `ia/simulation.py` | avaliação dos genomas, treino com checkpoints e teste da melhor rede |
| `ia/config.txt` | parâmetros do NEAT |
| `assets/` | pista de exemplo e sprite do carro |
| `best.pickle` | melhor genoma treinado (aptidão ≈ 23 400, 36 conexões) |

## O que mudou na migração

O repositório original guardava nove arquivos `best_checkpoint_<i>.pickle`, um por rodada de
treino, mas a opção 3 do menu lê `best.pickle`, que não existia. Ficou só o último campeão
(o da rodada 8), salvo como `best.pickle`, para a opção 3 funcionar. Também saíram os
`__pycache__` e um rascunho antigo do `main.py` (`outras ideias.txt`).

## Veja também

- Visualização: [perceptron e redes neurais](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/redes-neurais.html)
- Outro projeto: [Snake jogado por A\*](../snake-a-estrela-e-neat/)

---
Autor: Davi Fraga · migrado de [`davifmn/CAR_draw_and_-IA-RUN`](https://github.com/davifmn/CAR_draw_and_-IA-RUN)
