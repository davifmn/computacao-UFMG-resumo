# Trabalho final · Robô garçom

**Robótica Móvel · UFMG** · Python · CoppeliaSim · sympy · numpy

Um restaurante simulado: uma **base móvel** com rodas diferenciais leva pedidos às mesas
e um **braço UR5** com garra montado nela coloca copos nas mesas ou recolhe os vazios. O
script executa uma sequência de 5 pedidos (3 entregas e 2 recolhimentos).

## Componentes

**Base móvel (`Cart`).** Segue um caminho definido na cena (`Path`) perseguindo um alvo
que anda sobre ele (*pure pursuit* simplificado). O controle é proporcional: velocidade
linear $v = \text{clip}(d, -0{,}5, 0{,}5)$ e angular $\omega = 3\varphi$, onde $d$ e
$\varphi$ são a distância e o ângulo até o alvo no referencial do robô; a cinemática
diferencial converte em velocidades de roda $v_{r,l} = v \pm \frac{L}{2}\omega$, divididas
pelo raio da roda.

**Braço (`Manipulator`).** Cinemática direta do UR5 pelos parâmetros de Denavit-Hartenberg
($d_1, d_4, d_5, d_6, a_2, a_3$) e **cinemática inversa diferencial**: o jacobiano $6 \times 6$
é escrito simbolicamente com sympy e, a cada iteração, o erro de posição $\Delta p$
(limitado a 10 cm) vira um passo nas juntas

$$\Delta\theta = J(\theta)^{-1}\,\Delta p,$$

também limitado (0,05 rad), até a garra chegar ao alvo. Perto de singularidades
$J$ fica mal condicionado; a pseudo-inversa amortecida $J^T(JJ^T + \lambda^2 I)^{-1}$ é a
correção usual.

**Garra (`Gripper`).** Abre, fecha e troca o "pai" do objeto na cena (garra → mesa ou
carrinho), para o copo acompanhar quem o segura.

## Como executar

```bash
pip install coppeliasim-zmqremoteapi-client numpy sympy
# abra o CoppeliaSim e carregue cenas/restaurante.ttt
python3 main.py
```

## O que mudou na migração

Código idêntico ao entregue; a cena `Diner4.ttt` virou `cenas/restaurante.ttt`.
Observação para quem for estender: em `_compute_reqd_velocity`, os nomes das rodas
esquerda e direita estão trocados duas vezes (no cálculo e no retorno), e os dois erros se
cancelam; o robô anda certo.

---
Autor: Davi Fraga · migrado de [`davifmn/robotica_final`](https://github.com/davifmn/robotica_final)
