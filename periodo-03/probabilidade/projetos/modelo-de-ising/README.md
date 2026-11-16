# Modelo de Ising com o algoritmo de Metropolis

**Projeto extra ligado a Probabilidade** · Python · numpy · Jupyter

Simulação Monte Carlo do **modelo de Ising 2D**, o modelo mais simples de um ímã: uma rede
$L \times L$ de spins $s_i = \pm 1$ com energia

$$E = -\sum_{\langle i,j \rangle} s_i s_j$$

(soma sobre pares de vizinhos, contorno periódico, $J = k_B = 1$). Em temperatura baixa os
spins se alinham (fase **ferromagnética**); em temperatura alta o calor desordena tudo
(fase **paramagnética**). A transição acontece em $T_c = 2/\ln(1 + \sqrt 2) \approx 2{,}269$
(solução exata de Onsager).

A ponte com Probabilidade é o **algoritmo de Metropolis**: uma cadeia de Markov cuja
distribuição estacionária é a de Boltzmann, $\pi(\sigma) \propto e^{-E(\sigma)/T}$, sem
nunca calcular a constante de normalização (que somaria $2^{L^2}$ termos).

## O notebook

`ising.ipynb` tem duas atividades:

1. **Dinâmica:** energia e magnetização ao longo dos passos de Monte Carlo, mostrando a
   termalização a partir de uma rede aleatória.
2. **Termodinâmica:** para $L = 32$ e 20 temperaturas entre 0,4 e 3,0 (1 000 varreduras de
   termalização e 1 000 de medida), as médias de energia por spin, magnetização por spin,
   calor específico e susceptibilidade, seguidas das respostas às perguntas do enunciado
   (escolha de parâmetros, comportamento das grandezas, efeito do tamanho, erros
   estatísticos, fases e estimativa de $T_c$).

```bash
pip install numpy matplotlib jupyter
jupyter notebook ising.ipynb
```

## Notas de revisão

O notebook foi mantido como entregue. Dois pontos merecem correção para quem for usá-lo
como referência (ambos já estão corretos na visualização interativa):

- **Fórmulas de flutuação.** O notebook calcula `E2_mean = mean(E**2) / N` e
  `E_mean = mean(E) / N` e faz `E2_mean - E_mean**2`, o que mistura escalas ($1/N$ contra
  $1/N^2$). O correto é
  $c = \dfrac{\langle E^2\rangle - \langle E\rangle^2}{N T^2}$ e
  $\chi = \dfrac{\langle M^2\rangle - \langle |M|\rangle^2}{N T}$.
  O mesmo vale para a susceptibilidade, que misturava $\langle |M| \rangle$ por spin com
  $\langle M^2 \rangle$ por spin.
- **Energia por spin.** A resposta 2 diz que a energia "tende a diminuir com a
  temperatura". É o contrário: ela **cresce**, de $-2$ (todos alinhados) em direção a $0$.

## Veja também

- Visualização: [Modelo de Ising e Metropolis](https://davifmn.github.io/computacao-UFMG-resumo/periodo-03/probabilidade/visualizacoes/ising.html), com cada tentativa de Metropolis passo a passo, uma rede de 16 384 spins ao vivo e as curvas em função de T
- Teoria de cadeias de Markov e simulação: [README de Probabilidade](../../README.md)

---
Autor: Davi Fraga · migrado de [`davifmn/monteCarlo_ising`](https://github.com/davifmn/monteCarlo_ising)
