"""Compara os agentes sem tela: as mesmas partidas (mesmas sementes da comida) para todos.

    python3 torneio.py                      # as duas famílias, 6 partidas cada, 18 × 12
    python3 torneio.py --familia det -n 10 --tamanho 24x16 --toro
    python3 torneio.py --evoluir            # treina o algoritmo genético e mostra as gerações
"""
from __future__ import annotations

import argparse
import statistics

from cobra.algoritmos import FAMILIAS
from cobra.algoritmos.nao_deterministicos import CARACTERISTICAS, evoluir
from cobra.algoritmos.torneio import jogar_partida

CAROS = {"MonteCarlo", "MCTS"}   # ~10 a 20 ms por decisão em Python: menos partidas


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--familia", choices=["det", "nd", "todas"], default="todas")
    ap.add_argument("-n", "--partidas", type=int, default=6)
    ap.add_argument("--tamanho", default="18x12", help="LxA, por exemplo 24x16")
    ap.add_argument("--toro", action="store_true", help="as bordas atravessam")
    ap.add_argument("--comidas", type=int, default=1)
    ap.add_argument("--evoluir", action="store_true", help="treina o algoritmo genético")
    a = ap.parse_args()
    w, h = map(int, a.tamanho.lower().split("x"))

    if a.evoluir:
        print("geração   melhor     média   pesos (" + ", ".join(CARACTERISTICAS) + ")")
        for g in evoluir(semente=7):
            print(f"{g['geracao']:7d} {g['melhor']:8.0f} {g['media']:9.0f}   " + " ".join(f"{p:+.2f}" for p in g["pesos"]))
        return

    familias = {"det": ["Determinísticos"], "nd": ["Não determinísticos"]}.get(a.familia, list(FAMILIAS))
    for nome in familias:
        print(f"\n== {nome} ({w} × {h}{', toro' if a.toro else ''}, {a.comidas} comida(s)) ==")
        print(f"{'algoritmo':32s} {'comida':>7s} {'desvio':>7s} {'melhor':>6s} {'vitórias':>8s}  parede·corpo·fome  {'nós/dec':>8s} {'ms/dec':>7s}")
        for _, C in FAMILIAS[nome]:
            n = min(a.partidas, 2) if C.__name__ in CAROS else a.partidas
            rs = [jogar_partida(C, w, h, a.comidas, a.toro, semente=100 + k, semente_agente=k) for k in range(1, n + 1)]
            com = [r["comidos"] for r in rs]
            dec = sum(r["decisoes"] for r in rs)
            conta = lambda m: sum(r["motivo"] == m for r in rs)  # noqa: E731
            print(f"{C.nome:32s} {statistics.mean(com):7.1f} {statistics.pstdev(com):7.1f} {max(com):6d} "
                  f"{conta('venceu'):5d}/{n:<2d}  {conta('parede'):6d}·{conta('corpo')}·{conta('fome'):<6d}"
                  f"  {sum(r['nos'] for r in rs) / dec:8.1f} {1000 * sum(r['s'] for r in rs) / dec:7.3f}")


if __name__ == "__main__":
    main()
