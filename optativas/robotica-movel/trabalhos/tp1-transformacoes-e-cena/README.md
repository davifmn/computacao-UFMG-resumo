# TP1 · Transformações homogêneas numa cena do CoppeliaSim

**Robótica Móvel · UFMG** · Python · CoppeliaSim · numpy · matplotlib

Antes de mover um robô, é preciso saber **onde as coisas estão em relação a ele**. O TP
monta por script uma cena com um robô Pioneer 3DX, mesas, cadeiras, um notebook,
armários e duas pessoas, e calcula as transformações entre os referenciais de cada objeto.

## O que o notebook faz

| Questão | Conteúdo |
|---|---|
| 1 | Cria a cena inteira via API remota (ZMQ): carrega os modelos e os posiciona |
| 2 | Anexa um referencial a cada objeto e plota os eixos de todos no plano, com as relações entre eles |
| 3 | Monta as matrizes homogêneas $^{R}T_{o}$ de cada objeto $o$ no referencial **do robô** |
| 4 | Move o robô para outras três poses (com orientações diferentes) e confere que as transformações continuam certas |
| 5 | Troca o robô por um com laser e leva os pontos lidos do referencial do laser para o do mundo: $^{W}p = {}^{W}T_{R}\ {}^{R}T_{L}\ {}^{L}p$ |

Uma transformação homogênea no plano junta rotação e translação numa matriz só, e compor
referenciais vira multiplicar matrizes:

$$
{}^{A}T_{B} = \begin{bmatrix} \cos\theta & -\sin\theta & t_x \\ \sin\theta & \cos\theta & t_y \\ 0 & 0 & 1 \end{bmatrix},
\qquad {}^{A}T_{C} = {}^{A}T_{B}\ {}^{B}T_{C},
\qquad {}^{B}T_{A} = \left({}^{A}T_{B}\right)^{-1}
$$

## Como executar

1. Instale o [CoppeliaSim](https://www.coppeliarobotics.com/) (versão Edu 4.x) e o cliente da API:
   `pip install coppeliasim-zmqremoteapi-client numpy matplotlib jupyter`.
2. Abra o CoppeliaSim (ele sobe o servidor ZMQ sozinho).
3. No notebook, ajuste `coppelia_base_dir` para a pasta de instalação (a que contém `models/`).
4. Rode as células em ordem. A partir da questão 5 o notebook carrega `cenas/cena1_laser.ttt`.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `tp1_transformacoes.ipynb` | notebook com as 5 questões e os gráficos já renderizados |
| `cenas/cena1.ttt`, `cenas/cena1_laser.ttt` | cenas prontas (sem e com o laser) |
| `relatorio.docx` | relatório entregue |

## O que mudou na migração

Ficou só a versão final do notebook (`tp1_v2.ipynb`, renomeado); a versão intermediária
`tp1.ipynb` foi descartada. O caminho absoluto da instalação do CoppeliaSim, que apontava
para a máquina de um dos autores, virou um marcador para ajustar, e as cenas foram para
`cenas/`.

---
Autores: Alexis Duarte Guimarães Mariz e Davi Fraga · migrado de [`davifmn/robotica_movel`](https://github.com/davifmn/robotica_movel)
