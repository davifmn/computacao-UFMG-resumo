# TP3 · Mapeamento com grade de ocupação

**Robótica Móvel · UFMG** · Python · CoppeliaSim · numpy · matplotlib

Um robô Kobuki com um laser Hokuyo anda pela sala desviando de obstáculos e constrói um
**mapa de ocupação**: a sala vira uma grade, e cada célula guarda a probabilidade de estar
ocupada, atualizada pela regra de Bayes a cada leitura do laser.

## Como funciona

1. **Coleta (`main.py`).** A simulação roda em modo síncrono (`sim.setStepping(True)`)
   por 120 s. A cada passo, o script lê os alcances e ângulos do laser e a pose do robô.
   O controle é reativo: se algo está a menos de 0,6 m no cone frontal (±45°), gira no
   lugar; senão, segue em frente.
2. **Mapeamento (em lote, depois da simulação).** Para 1 a cada 5 leituras, cada ponto do
   laser recebe ruído gaussiano (σ = 2 cm na distância, 0,5° no ângulo), é levado ao
   referencial do mundo com a pose do robô e alimenta a grade.
3. **Grade (`occupancy_grid.py`).** Cada célula guarda o **log-odds** $l = \ln\frac{p}{1-p}$.
   A célula onde o feixe bateu soma $l_{occ} = \ln\frac{0{,}85}{0{,}15}$; as células
   atravessadas (traçadas com **Bresenham**) somam $l_{free} = -l_{occ}$. O valor fica
   limitado a $[-5, 5]$ e no fim vira probabilidade com $p = 1 - 1/(1 + e^{l})$.
4. **Imagem (`visualize_map.py`).** Salva `occupancy_map.png`: preto = ocupado, branco = livre.

## Como executar

```bash
pip install coppeliasim-zmqremoteapi-client numpy matplotlib
# abra o CoppeliaSim e carregue cenas/cena-tp3-estatico.ttt (ou a dinâmica, com pessoas andando)
python3 teste_movimento.py    # confere motores e laser (o robô anda alguns segundos)
python3 main.py               # 120 s de exploração; gera occupancy_map.png
python3 -m unittest test_occupancy_grid.py   # não precisa do simulador
```

O script espera os objetos `/kobuki`, `/kobuki_leftMotor`, `/kobuki_rightMotor` e
`/kobuki/fastHokuyo`, e os sinais `hokuyo_range_data` e `hokuyo_angle_data` publicados pelo
script do laser na cena. Para mudar a resolução da grade, edite `MAP_RESOLUTION` em `main.py`.

## O que mudou na migração

**Bug corrigido no modelo do sensor.** `update` somava $l_{occ}$ na célula do obstáculo e
depois chamava `bresenham_line`, que marcava como livre **todo** o segmento, inclusive a
última célula. Como $l_{occ} + l_{free} = 0$ exatamente, as paredes ficavam em $p = 0{,}5$
(desconhecidas) e o mapa só mostrava o espaço livre. Agora o Bresenham para antes da
célula final. O teste `test_um_feixe_marca_livre_no_caminho_e_ocupado_no_fim` cobre isso.

Também: `teste.py` virou `teste_movimento.py`, entrou `test_occupancy_grid.py`, e saíram
o `__pycache__` e a imagem `test_map.png`, que era só um mapa sintético gerado pelo
exemplo de `visualize_map.py` (não um resultado do TP). O README original citava um
`sim_integration.py` com opções de linha de comando que não existe no repositório; as
instruções acima descrevem os scripts que existem.

## Veja também

- Visualização: [mapa de ocupação passo a passo](https://davifmn.github.io/computacao-UFMG-resumo/optativas/robotica-movel/visualizacoes/mapa-de-ocupacao.html), com o botão que reproduz o bug original

---
Autor: Davi Fraga · migrado de [`davifmn/robotica_tp3`](https://github.com/davifmn/robotica_tp3)
