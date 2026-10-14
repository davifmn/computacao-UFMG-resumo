"""Simuladores de sistemas operacionais: escalonamento de CPU, algoritmo do
banqueiro, substituição de páginas e escalonamento de disco, conferidos com
os exemplos do Silberschatz.

Execute:  python3 so.py
"""
from collections import deque


# ---------- Escalonamento de CPU (passo de 1 unidade de tempo) ----------

def escalona(procs, politica, quantum=2):
    """procs: lista de (nome, chegada, duração, prioridade). Devolve (gantt, espera_média)."""
    rest = {p[0]: p[2] for p in procs}
    cheg = {p[0]: p[1] for p in procs}
    dur = {p[0]: p[2] for p in procs}
    prio = {p[0]: p[3] for p in procs}
    ordem = {p[0]: i for i, p in enumerate(procs)}
    chave = {"sjf": lambda n: dur[n], "srtf": lambda n: rest[n], "prio": lambda n: prio[n]}.get(politica)
    melhor = lambda fila: min(fila, key=lambda n: (chave(n), cheg[n], ordem[n]))
    t, atual, fatia, fila, fim, gantt = 0, None, 0, [], {}, []
    while len(fim) < len(procs):
        fila += [p[0] for p in procs if p[1] == t]
        if atual and rest[atual] == 0:
            fim[atual], atual = t, None
        elif atual and politica == "rr" and fatia == quantum:
            fila.append(atual); atual = None
        elif atual and politica in ("srtf", "prio") and fila and chave(melhor(fila)) < chave(atual):
            fila.append(atual); atual = None
        if atual is None and fila:
            atual = fila[0] if politica in ("fcfs", "rr") else melhor(fila)
            fila.remove(atual)
            fatia = 0
        if len(fim) == len(procs):
            break
        if atual:
            rest[atual] -= 1
            fatia += 1
        if gantt and gantt[-1][0] == atual:
            gantt[-1][2] = t + 1
        else:
            gantt.append([atual, t, t + 1])
        t += 1
    espera = sum(fim[n] - cheg[n] - dur[n] for n in fim) / len(fim)
    return [tuple(g) for g in gantt], espera


# ---------- Banqueiro ----------

def seguro(disp, aloc, maximo):
    n = len(aloc)
    nec = [[m - a for m, a in zip(maximo[i], aloc[i])] for i in range(n)]
    trab, fim, seq = list(disp), [False] * n, []
    while len(seq) < n:
        for i in range(n):
            if not fim[i] and all(x <= y for x, y in zip(nec[i], trab)):
                trab = [x + y for x, y in zip(trab, aloc[i])]
                fim[i] = True
                seq.append(i)
                break
        else:
            return None
    return seq


def pedido(disp, aloc, maximo, i, req):
    nec = [m - a for m, a in zip(maximo[i], aloc[i])]
    if any(r > x for r, x in zip(req, nec)):
        raise ValueError("pediu mais que o máximo declarado")
    if any(r > d for r, d in zip(req, disp)):
        return None                                   # espera: não há recursos
    disp2 = [d - r for d, r in zip(disp, req)]
    aloc2 = [list(a) for a in aloc]
    aloc2[i] = [a + r for a, r in zip(aloc[i], req)]
    return (disp2, aloc2) if seguro(disp2, aloc2, maximo) else None


# ---------- Substituição de páginas ----------

def faltas(refs, quadros, alg):
    mem, f = [], 0
    uso, bit, ponteiro = {}, {}, 0
    for i, p in enumerate(refs):
        uso[p] = i
        if p in mem:
            bit[p] = 1
            continue
        f += 1
        if len(mem) < quadros:
            mem.append(p)
            bit[p] = 1
            continue
        if alg == "fifo":
            mem.pop(0)                                # mem fica em ordem de chegada
            mem.append(p)
        elif alg == "lru":
            mem.remove(min(mem, key=lambda q: uso[q] if q != p else i))
            mem.append(p)
        elif alg == "otimo":
            prox = lambda q: refs.index(q, i + 1) if q in refs[i + 1:] else float("inf")
            mem[mem.index(max(mem, key=prox))] = p
        elif alg == "relogio":
            while bit[mem[ponteiro]]:
                bit[mem[ponteiro]] = 0
                ponteiro = (ponteiro + 1) % quadros
            mem[ponteiro] = p
            ponteiro = (ponteiro + 1) % quadros
        bit[p] = 1
    return f


# ---------- Escalonamento de disco ----------

def disco(pedidos, cabeca, alg, cilindros=200):
    """Distância total percorrida pelo braço (SCAN indo primeiro para cilindros maiores... ou menores)."""
    pend, pos, total, ordem = list(pedidos), cabeca, 0, []
    if alg == "fcfs":
        seq = pend
    elif alg == "sstf":
        seq = []
        while pend:
            prox = min(pend, key=lambda c: abs(c - pos))
            pend.remove(prox)
            seq.append(prox)
            pos = prox
        pos = cabeca
    elif alg == "scan":                               # desce até 0 e depois sobe
        seq = sorted([c for c in pend if c <= cabeca], reverse=True) + [0] + sorted(c for c in pend if c > cabeca)
    elif alg == "cscan":                              # sobe até o fim, volta ao 0 e continua subindo
        seq = sorted(c for c in pend if c >= cabeca) + [cilindros - 1, 0] + sorted(c for c in pend if c < cabeca)
    for c in seq:
        total += abs(c - pos)
        pos = c
        ordem.append(c)
    return total


if __name__ == "__main__":
    # Silberschatz: 5 processos chegando em 0, rajadas 10, 1, 2, 1, 5 e prioridades 3, 1, 4, 5, 2
    ps = [("P1", 0, 10, 3), ("P2", 0, 1, 1), ("P3", 0, 2, 4), ("P4", 0, 1, 5), ("P5", 0, 5, 2)]
    esperado = {"fcfs": 9.6, "sjf": 3.2, "prio": 8.2, "rr": 5.4}
    for pol, w in esperado.items():
        _, e = escalona(ps, pol, quantum=1)
        assert abs(e - w) < 1e-9, (pol, e)
    print("escalonamento (Silberschatz): espera média FCFS 9,6 · SJF 3,2 · prioridade 8,2 · RR(q=1) 5,4")
    srtf = [("P1", 0, 8, 0), ("P2", 1, 4, 0), ("P3", 2, 9, 0), ("P4", 3, 5, 0)]
    g, e = escalona(srtf, "srtf")
    assert e == 6.5 and [x[0] for x in g] == ["P1", "P2", "P4", "P1", "P3"]
    print("SRTF: espera média 6,5 com o gráfico P1 P2 P4 P1 P3")

    disp, aloc, mx = [3, 3, 2], [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]], [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]]
    assert seguro(disp, aloc, mx) is not None
    disp, aloc = pedido(disp, aloc, mx, 1, [1, 0, 2])        # concedido
    assert pedido(disp, aloc, mx, 4, [3, 3, 0]) is None      # não há recursos
    assert pedido(disp, aloc, mx, 0, [0, 2, 0]) is None      # seria inseguro
    print("banqueiro: P1 (1,0,2) concedido; depois P4 (3,3,0) espera (sem recursos) e P0 (0,2,0) espera (inseguro)")

    refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]
    assert (faltas(refs, 3, "fifo"), faltas(refs, 3, "lru"), faltas(refs, 3, "otimo")) == (15, 12, 9)
    belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
    assert faltas(belady, 3, "fifo") == 9 and faltas(belady, 4, "fifo") == 10
    # LRU e ótimo são algoritmos de pilha: mais quadros nunca aumentam as faltas
    import random
    rnd = random.Random(3)
    for _ in range(300):
        r = [rnd.randint(1, 6) for _ in range(25)]
        for alg in ("lru", "otimo"):
            fs = [faltas(r, q, alg) for q in range(1, 7)]
            assert all(a >= b for a, b in zip(fs, fs[1:])), (alg, r, fs)
        assert faltas(r, 3, "otimo") <= min(faltas(r, 3, a) for a in ("fifo", "lru", "relogio"))
    print("páginas: FIFO 15, LRU 12, ótimo 9; Belady com FIFO: 3 quadros = 9 faltas, 4 quadros = 10")

    fila, cab = [98, 183, 37, 122, 14, 124, 65, 67], 53
    assert (disco(fila, cab, "fcfs"), disco(fila, cab, "sstf"), disco(fila, cab, "scan")) == (640, 236, 236)
    print("disco (fila 98 183 37 122 14 124 65 67, cabeça 53): FCFS 640, SSTF 236, SCAN 236 cilindros")
