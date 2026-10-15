"""Redes, módulo 2 (Tanenbaum, caps. 5 a 8) em Python puro.

Cada função resolve um tipo de exercício dos guias de estudo, e o bloco final
confere os números citados nas páginas. Execute:  python3 redes2.py
"""
import heapq
import ipaddress
import random
from math import ceil, log2


# ---------- Capítulo 5: roteamento ----------

def dijkstra(arestas, origem):
    adj = {}
    for u, v, w in arestas:
        adj.setdefault(u, []).append((v, w))
        adj.setdefault(v, []).append((u, w))
    dist, ant, fila = {origem: 0}, {}, [(0, origem)]
    while fila:
        d, u = heapq.heappop(fila)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            if d + w < dist.get(v, float("inf")):
                dist[v], ant[v] = d + w, u
                heapq.heappush(fila, (d + w, v))
    return dist, ant


def caminho(ant, destino):
    p = [destino]
    while p[-1] in ant:
        p.append(ant[p[-1]])
    return "".join(reversed(p))


def atualiza_vetor(nomes, eu, vetores, custo_enlace):
    """Nova tabela de um roteador a partir dos vetores dos vizinhos: (custo, saída)."""
    tab = {}
    for k, d in enumerate(nomes):
        if d == eu:
            tab[d] = (0, "-")
            continue
        tab[d] = min((custo_enlace[v] + vet[k], v) for v, vet in vetores.items())
    return tab


def contagem_ao_infinito(trocas=8):
    """Linha A-B-C-D-E, A cai. Distâncias de B..E até A após cada troca."""
    d, hist = [1, 2, 3, 4], [[1, 2, 3, 4]]
    for _ in range(trocas):
        d = [min(d[k - 1] if k else float("inf"), d[k + 1] if k < 3 else float("inf")) + 1 for k in range(4)]
        hist.append(d)
    return hist


def hierarquia_otima(n_roteadores=4800):
    """Três níveis: k1 clusters × k2 regiões × k3 roteadores. Entradas = k3 + (k2 − 1) + (k1 − 1)."""
    melhor = None
    for k1 in range(1, n_roteadores + 1):
        if n_roteadores % k1:
            continue
        for k2 in range(1, n_roteadores // k1 + 1):
            if (n_roteadores // k1) % k2:
                continue
            k3 = n_roteadores // (k1 * k2)
            entradas = k3 + (k2 - 1) + (k1 - 1)
            if melhor is None or entradas < melhor[0]:
                melhor = (entradas, k1, k2, k3)
    return melhor


# ---------- Capítulo 5: qualidade de serviço e desempenho ----------

def balde_de_fichas_rajada(capacidade_bits, taxa_fichas_bps, taxa_maxima_bps):
    """Duração máxima de uma rajada na taxa máxima: S = C / (M − ρ)."""
    return capacidade_bits / (taxa_maxima_bps - taxa_fichas_bps)


def mm1_atraso(chegadas, servico):
    """Tempo no roteador (fila + serviço) de uma fila M/M/1."""
    return 1 / (servico - chegadas)


def descarte(p):
    """Hospedeiro → R1 → R2 → hospedeiro; cada roteador descarta com probabilidade p."""
    saltos_por_tentativa = 1 + (1 - p) + (1 - p) ** 2
    tentativas = 1 / (1 - p) ** 2
    return saltos_por_tentativa, tentativas, saltos_por_tentativa * tentativas


# ---------- Capítulo 5: IPv4 ----------

def aloca(inicio, pedidos):
    atual = int(ipaddress.IPv4Address(inicio))
    out = []
    for nome, n in pedidos:
        tam = 2 ** ceil(log2(n))
        base = -(-atual // tam) * tam
        atual = base + tam
        out.append((nome, str(ipaddress.IPv4Address(base)), str(ipaddress.IPv4Address(base + tam - 1)), 32 - int(log2(tam))))
    return out


def maior_prefixo(tabela, endereco):
    a = ipaddress.IPv4Address(endereco)
    casam = [(ipaddress.IPv4Network(p).prefixlen if p != "default" else 0, saida)
             for p, saida in tabela if p == "default" or a in ipaddress.IPv4Network(p)]
    return max(casam)[1]


def fragmenta(dados, cargas_maximas, cab=20):
    frags = [(dados, 0, 0)]            # (dados, deslocamento em unidades de 8, MF)
    por_enlace = []
    for mtu in cargas_maximas:
        maxd = (mtu - cab) // 8 * 8
        novos = []
        for d, off, mf in frags:
            if d + cab <= mtu:
                novos.append((d, off, mf))
                continue
            pos = 0
            while pos < d:
                t = min(maxd, d - pos)
                ultimo = pos + t >= d
                novos.append((t, off + pos // 8, mf if ultimo else 1))
                pos += t
        frags = novos
        por_enlace.append([(d + cab, off, mf) for d, off, mf in frags])
    return por_enlace


# ---------- Capítulo 6: transporte ----------

def suaviza_rtt(srtt, amostras, alfa=0.9):
    for r in amostras:
        srtt = alfa * srtt + (1 - alfa) * r
    return srtt


def janela_apos_timeout(janela_kb, mss_kb, rajadas):
    limiar, cw = janela_kb / 2, mss_kb
    for _ in range(rajadas):
        cw = min(cw * 2, limiar) if cw < limiar else cw + mss_kb
    return cw


# ---------- Capítulo 8: segurança ----------

def rsa(p, q, d):
    n, z = p * q, (p - 1) * (q - 1)
    e = pow(d, -1, z)
    return n, z, e


if __name__ == "__main__":
    # Dijkstra no exemplo do livro (A a H)
    arestas = [("A", "B", 2), ("A", "G", 6), ("B", "C", 7), ("B", "E", 2), ("C", "D", 3), ("C", "F", 3),
               ("D", "H", 2), ("E", "F", 2), ("E", "G", 1), ("F", "H", 2), ("G", "H", 4)]
    dist, ant = dijkstra(arestas, "A")
    assert dist["D"] == 10 and caminho(ant, "D") == "ABEFHD"
    print("Dijkstra: A → D por ABEFHD, custo 10")

    nomes = "ABCDEF"
    tab = atualiza_vetor(nomes, "C", {"B": (5, 0, 8, 12, 6, 2), "D": (16, 12, 6, 0, 9, 10), "E": (7, 6, 3, 9, 0, 4)},
                         {"B": 6, "D": 3, "E": 5})
    assert [tab[d] for d in nomes] == [(11, "B"), (6, "B"), (0, "-"), (3, "D"), (5, "E"), (8, "B")]
    print("vetor de distância do roteador C:", ", ".join(f"{d}: {c} via {v}" for d, (c, v) in tab.items()))

    assert contagem_ao_infinito()[1:5] == [[3, 2, 3, 4], [3, 4, 3, 4], [5, 4, 5, 4], [5, 6, 5, 6]]
    assert 50 * 8 * 2 == 800                      # 50 custos de 8 bits, 2 vezes por segundo, por enlace
    e, k1, k2, k3 = hierarquia_otima()
    assert sorted((k1, k2, k3)) == [15, 16, 20] and e == 49
    print(f"hierarquia para 4800 roteadores: {k1} × {k2} × {k3}, {e} entradas na tabela")

    # Qualidade de serviço
    taxa = 48 * 8 / 5e-6
    assert round(taxa / 1e6, 1) == 76.8                     # balde de fichas: 1 ficha a cada 5 μs, 48 bytes
    assert balde_de_fichas_rajada(8e6, 1e6, 6e6) == 1.6      # 8 Mb de balde, 1 Mbps de fichas, 6 Mbps de linha
    assert round(10 * mm1_atraso(1.5e6, 2e6) * 1e6, 6) == 20  # 10 roteadores M/M/1: 20 μs
    s, t, h = descarte(0.1)
    sim = random.Random(1)
    tot = 0
    for _ in range(200000):                       # simulação: repete até o pacote chegar
        while True:
            tot += 1                              # hospedeiro → R1
            if sim.random() < 0.1:
                continue                          # R1 descartou: nova tentativa
            tot += 1                              # R1 → R2
            if sim.random() < 0.1:
                continue
            tot += 1                              # R2 → hospedeiro
            break
    assert abs(tot / 200000 - h) < 0.02
    print(f"descarte com p = 0,1: {s:.3f} saltos por tentativa, {t:.3f} tentativas, {h:.3f} saltos por pacote entregue (simulação: {tot / 200000:.3f})")

    # IPv4
    assert str(ipaddress.IPv4Address(0xC22F1582)) == "194.47.21.130"
    assert ipaddress.IPv4Network("0.0.0.0/20").num_addresses - 2 == 4094
    assert 2 ** (20 - 2) == 262144                          # classe B com 20 bits de rede (prefixo 10 fixo)
    assert aloca("198.16.0.0", [("A", 4000), ("B", 2000), ("C", 4000), ("D", 8000)]) == [
        ("A", "198.16.0.0", "198.16.15.255", 20), ("B", "198.16.16.0", "198.16.23.255", 21),
        ("C", "198.16.32.0", "198.16.47.255", 20), ("D", "198.16.64.0", "198.16.95.255", 19)]
    blocos = [ipaddress.IPv4Network(b) for b in ["57.6.96.0/21", "57.6.104.0/21", "57.6.112.0/21", "57.6.120.0/21"]]
    assert list(ipaddress.collapse_addresses(blocos)) == [ipaddress.IPv4Network("57.6.96.0/19")]
    tabela = [("135.46.56.0/22", "Interface 0"), ("135.46.60.0/22", "Interface 1"), ("192.53.40.0/23", "Roteador 1"), ("default", "Roteador 2")]
    assert [maior_prefixo(tabela, a) for a in ["135.46.63.10", "135.46.57.14", "135.46.52.2", "192.53.40.7", "192.53.56.7"]] == \
        ["Interface 1", "Interface 0", "Roteador 2", "Roteador 1", "Roteador 2"]
    assert fragmenta(920, [1010, 504, 500]) == [[(940, 0, 0)], [(500, 0, 1), (460, 60, 0)], [(500, 0, 1), (460, 60, 0)]]
    assert round(2 ** 16 * 1024 * 8 / 10 / 1e6, 1) == 53.7   # ID de 16 bits, pacotes de 1024 bytes vivendo 10 s
    anos = 2 ** 128 / 1e18 / (365.25 * 24 * 3600)
    assert 1e13 < anos < 1.1e13           # ≈ 1,08 × 10^13 anos
    print(f"IPv4: alocação, agregação em /19, maior prefixo e fragmentação conferidos; IPv6 a 10^18 endereços/s dura {anos:.1e} anos")

    # Capítulo 6
    assert 65535 - 20 - 20 == 65495                          # maior carga útil de um segmento TCP
    assert round(65535 * 8 / 0.020 / 1e6, 1) == 26.2         # janela de 64 KB, RTT de 20 ms
    assert round(2 ** 32 / 125e6, 1) == 34.4                 # números de sequência a 1 Gbps
    assert round(2 ** 32 * 8 / 120 / 1e6) == 286             # tempo de vida de 120 s
    assert round(suaviza_rtt(30, [26, 32, 24]), 3) == 29.256
    assert janela_apos_timeout(18, 1, 4) == 9
    print("transporte: carga máxima 65 495 B, 26,2 Mbps com janela de 64 KB, RTT suavizado 29,256 ms, janela 9 KB após timeout")

    # Capítulo 7
    assert 44100 * 16 * 2 == 1411200                         # áudio de CD: 1,411 Mbps

    # Capítulo 8
    n, z, e = rsa(3, 11, 7)
    assert (n, z, e) == (33, 20, 3)
    cifrado = [pow(ord(c) - 64, e, n) for c in "SUZANNE"]
    assert cifrado == [28, 21, 20, 1, 5, 5, 26]
    assert "".join(chr(pow(c, 7, n) + 64) for c in cifrado) == "SUZANNE"
    A, B = pow(3, 8, 47), pow(3, 10, 47)
    assert (A, B, pow(B, 8, 47), pow(A, 10, 47)) == (28, 17, 4, 4)
    pad = bytes(random.Random(5).randrange(256) for _ in range(5))
    c = bytes(a ^ b for a, b in zip(b"redes", pad))
    assert bytes(a ^ b for a, b in zip(c, pad)) == b"redes"
    print("segurança: RSA (p=3, q=11, d=7) cifra SUZANNE em 28 21 20 1 5 5 26; Diffie-Hellman (47, 3, 8, 10) dá a chave 4")
