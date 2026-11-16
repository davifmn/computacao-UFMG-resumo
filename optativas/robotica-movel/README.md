# Robótica Móvel · optativa

> Optativa do DCC · simulações no [CoppeliaSim](https://www.coppeliarobotics.com/) com a API remota em Python.

Um robô móvel precisa responder a três perguntas: **onde estou?** (localização), **como é o
mundo à minha volta?** (mapeamento) e **como chego lá?** (planejamento e controle). A
disciplina constrói as ferramentas para isso: referenciais e transformações, modelos de
movimento, sensores com ruído, mapas probabilísticos e navegação.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🗺️ | [Mapa de ocupação](https://davifmn.github.io/computacao-UFMG-resumo/optativas/robotica-movel/visualizacoes/mapa-de-ocupacao.html) | Um robô percorre uma sala disparando um laser, e a grade de log-odds vai desenhando paredes, espaço livre e regiões nunca vistas, com o código do TP3 ao lado. Um botão reproduz o bug original, em que as paredes nunca apareciam |

## 🧪 Trabalhos práticos

| Trabalho | Tema | Tecnologias |
|---|---|---|
| [TP1 · Transformações e cena](trabalhos/tp1-transformacoes-e-cena/) | Cena montada por script; referenciais de todos os objetos e as matrizes homogêneas entre eles; pontos do laser levados ao mundo | Python, CoppeliaSim, Jupyter |
| [TP3 · Mapa de ocupação](trabalhos/tp3-mapa-de-ocupacao/) | Kobuki com laser Hokuyo explorando a sala e construindo a grade de ocupação | Python, numpy, CoppeliaSim |
| [Trabalho final · Robô garçom](trabalhos/tp-final-robo-garcom/) | Base diferencial seguindo um caminho até as mesas e braço UR5 com cinemática inversa pelo jacobiano | Python, sympy, CoppeliaSim |

## 📚 Resumo teórico

### 1. Referenciais e transformações

- **Pose** no plano: $(x, y, \theta)$. No espaço: posição + orientação (matriz de rotação, ângulos de Euler, quatérnios).
- **Transformação homogênea** ${}^{A}T_{B} = \begin{bmatrix} R & t \\ 0 & 1 \end{bmatrix}$ leva coordenadas do referencial $B$ para o $A$. Composição: ${}^{A}T_{C} = {}^{A}T_{B}\,{}^{B}T_{C}$. Inversa: $\begin{bmatrix} R^T & -R^T t \\ 0 & 1 \end{bmatrix}$.
- Um sensor montado no robô mede no **seu** referencial: ${}^{W}p = {}^{W}T_{R}\,{}^{R}T_{S}\,{}^{S}p$.

### 2. Cinemática de robôs com rodas

- **Acionamento diferencial** (rodas de raio $r$ separadas por $L$): $v = \frac{r(\omega_r + \omega_l)}{2}$, $\omega = \frac{r(\omega_r - \omega_l)}{L}$. É **não holonômico**: não anda de lado.
- Modelo de movimento: $\dot x = v\cos\theta$, $\dot y = v\sin\theta$, $\dot\theta = \omega$. Integrar as velocidades das rodas é a **odometria**, cujo erro cresce sem limite.
- Robôs **omnidirecionais** (rodas suecas) são holonômicos.

### 3. Controle e navegação

- **Controle de posição**: erro em distância $\rho$ e ângulo $\alpha$ até o alvo; leis proporcionais $v = k_\rho \rho$, $\omega = k_\alpha \alpha$.
- **Seguimento de caminho**: perseguir um ponto que avança sobre o caminho (*pure pursuit*).
- **Campos potenciais**: o alvo atrai, os obstáculos repelem; simples, mas tem mínimos locais.
- **Planejamento global**: grade + A\* ou Dijkstra; *roadmaps* (visibilidade, Voronoi) e amostragem (PRM, RRT) em espaços de configuração maiores.
- **Comportamentos reativos** (desviar se há obstáculo à frente), como no TP3.

### 4. Sensores e incerteza

- Laser (LIDAR), sonar, câmeras, IMU, encoders. Toda medida tem ruído; modela-se $p(z \mid x, m)$.
- **Modelo inverso do sensor** $p(m_i \mid z, x)$: o que uma leitura diz sobre cada célula do mapa.

### 5. Mapeamento com grade de ocupação

- Cada célula $m_i$ guarda $p(m_i \mid z_{1:t}, x_{1:t})$, supondo células independentes e mundo estático.
- Em **log-odds**, Bayes vira soma: $l_t = l_{t-1} + \text{logit}\,p(m_i \mid z_t) - l_0$.
- Células atravessadas pelo feixe (Bresenham) ficam mais livres; a célula atingida, mais ocupada. Saturar $l$ deixa o mapa se adaptar a mudanças.

### 6. Localização e SLAM

- **Filtro de Kalman** (e o estendido, EKF): crença gaussiana; predição pelo modelo de movimento, correção pela medida.
- **Filtro de partículas** (localização Monte Carlo): crença representada por amostras, reamostradas pelo peso $p(z \mid x)$; lida com crenças multimodais.
- **SLAM**: estimar pose e mapa ao mesmo tempo; o fechamento de laço corrige o erro acumulado.

### 7. Manipuladores

- Cinemática direta por **Denavit-Hartenberg**; **jacobiano** $\dot p = J(\theta)\dot\theta$.
- Cinemática inversa diferencial: $\Delta\theta = J^{-1}\Delta p$ (ou a pseudo-inversa amortecida perto de singularidades), iterada até o efetuador chegar ao alvo.

## ✍️ Exercícios

1. Um robô está em $(2, 1)$ com $\theta = 90°$. O laser vê um obstáculo em $(1, 0)$ no referencial do robô. Onde ele está no mundo?
2. Um Kobuki ($r = 3{,}5$ cm, $L = 23$ cm) gira a roda direita a 10 rad/s e a esquerda a 0. Quais $v$ e $\omega$?
3. Com $l_{occ} = \ln(0{,}85/0{,}15)$ e $l_{free} = -l_{occ}$, uma célula foi vista ocupada 2 vezes e livre 1 vez. Qual a probabilidade de estar ocupada?
4. Calcule a inversa de ${}^{A}T_{B}$ com $\theta = 90°$ e $t = (1, 2)$ e confira que ela leva $(1, 2)$ à origem.
5. Por que a odometria sozinha não basta para mapear um prédio grande?

<details>
<summary>Gabarito</summary>

1. $R(90°)\,(1, 0) = (0, 1)$; somando a posição: $(2, 2)$.
2. $v = \frac{0{,}035 \cdot (10 + 0)}{2} = 0{,}175$ m/s e $\omega = \frac{0{,}035 \cdot (10 - 0)}{0{,}23} \approx 1{,}52$ rad/s (gira para a esquerda).
3. $l = 2 l_{occ} - l_{occ} = l_{occ}$, então $p = 0{,}85$.
4. $R^T = \begin{bmatrix} 0 & 1 \\ -1 & 0 \end{bmatrix}$ e $-R^T t = (-2, 1)$, logo ${}^{B}T_{A} = \begin{bmatrix} 0 & 1 & -2 \\ -1 & 0 & 1 \\ 0 & 0 & 1 \end{bmatrix}$. Aplicando a $(1, 2)$: $(0 + 2 - 2,\ -1 + 0 + 1) = (0, 0)$.
5. O erro da odometria se acumula (deslizamento, raio de roda impreciso): depois de uma volta, o robô "acha" que está em outro lugar e o mapa fica torto. É preciso corrigir a pose com as próprias medidas (localização ou SLAM).

</details>

## 🔗 Para ir além

- *Probabilistic Robotics*, Thrun, Burgard e Fox: grade de ocupação, filtros e SLAM.
- *Introduction to Autonomous Mobile Robots*, Siegwart, Nourbakhsh e Scaramuzza.
- *Robotics, Vision and Control*, Peter Corke (com código).
- [Manual da API remota ZMQ do CoppeliaSim](https://manual.coppeliarobotics.com/en/zmqRemoteApiOverview.htm).
