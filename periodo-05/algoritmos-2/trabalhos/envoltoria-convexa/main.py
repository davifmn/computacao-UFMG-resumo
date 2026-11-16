"""Sorteia pontos no plano e anima a envoltória convexa calculada por Jarvis e por Graham.

Uso:
    python3 main.py            # 100 pontos
    python3 main.py 40         # 40 pontos
"""

import random
import sys

import graham_scan
import jarvis_march
import visualizacao


def sortear_pontos(n, lo=5, hi=195, semente=None):
    """Devolve n pontos inteiros distintos no quadrado [lo, hi]²."""
    rnd = random.Random(semente)
    pontos = set()
    while len(pontos) < n:
        pontos.add((rnd.randint(lo, hi), rnd.randint(lo, hi)))
    return pontos


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    pontos = sortear_pontos(n)

    inicio = jarvis_march.ponto_inicial(pontos)
    visualizacao.plot_fecho_convexo_animado(pontos, jarvis_march.jarvis_march(pontos, inicio))

    visualizacao.plot_fecho_convexo_animado(pontos, graham_scan.graham_scan(list(pontos)))


if __name__ == "__main__":
    main()
