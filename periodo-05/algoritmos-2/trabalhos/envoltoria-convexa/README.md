# Envoltória convexa: Graham e Jarvis

**Algoritmos II (DCC207) · UFMG** · Python · matplotlib

Dado um conjunto de pontos no plano, a envoltória convexa é o menor polígono convexo que
contém todos eles. Os dois algoritmos usam um único teste, o produto vetorial
`cruz(o, a, b)`, que diz se `o → a → b` vira à esquerda (> 0), à direita (< 0) ou se os
pontos são colineares (= 0).

| Algoritmo | Ideia | Complexidade |
|---|---|---|
| **Jarvis** (embrulho para presente) | a partir do ponto mais à esquerda, escolhe sempre o próximo ponto que deixa todos os outros à esquerda | O(n · h), h = vértices da envoltória |
| **Graham** | ordena os pontos por ângulo em torno do ponto inicial e varre com uma pilha, descartando quem faz uma curva à direita | O(n log n) |

## Como executar

```bash
pip install matplotlib
python3 main.py        # 100 pontos aleatórios: anima Jarvis e depois Graham
python3 main.py 30     # 30 pontos
python3 -m unittest test_envoltoria.py
```

## Testes

`test_envoltoria.py` compara os dois algoritmos com uma envoltória por força bruta (O(n³))
em instâncias aleatórias e confere que o Graham devolve os vértices em ordem anti-horária.
Na migração, os dois também foram rodados em 4 500 nuvens de pontos densas numa grade
pequena, com muitos pontos colineares, sem nenhuma divergência.

## O que mudou na migração

- **Bug corrigido no Graham:** quando havia pontos colineares no **último** lado (entre o
  topo da pilha e o ponto inicial), o ponto do meio entrava na envoltória, porque a
  varredura nunca compara o último ponto com o primeiro. Agora a pilha é limpa no fim.
- Módulos renomeados para `snake_case` (`GrahamScan.py` → `graham_scan.py` etc.), `main.py`
  aceita o número de pontos e deixou de usar variáveis globais.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `geometria.py` | produto vetorial e distância ao quadrado |
| `jarvis_march.py` | ponto inicial e embrulho para presente |
| `graham_scan.py` | ordenação angular e varredura com pilha |
| `visualizacao.py` | gráficos e animação com matplotlib |
| `main.py` | sorteia os pontos e anima os dois algoritmos |
| `test_envoltoria.py` | testes contra força bruta |

## Veja também

- Teoria de geometria computacional: [README de Algoritmos II](../../README.md)
- Visualização: [envoltória convexa passo a passo (Andrew e Jarvis), com o código ao lado](https://davifmn.github.io/computacao-UFMG-resumo/periodo-05/algoritmos-2/visualizacoes/envoltoria-convexa.html)

---
Autor: Davi Fraga · migrado de [`davifmn/fecho_convexo_minimo`](https://github.com/davifmn/fecho_convexo_minimo)
