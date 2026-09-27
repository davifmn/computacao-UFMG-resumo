"""Redes de Computadores, módulo 1 (Tanenbaum, caps. 2 a 4) em Python puro.

Capacidade de canal, CDMA, enquadramento, Hamming, CRC, checksum da Internet,
janela deslizante e ALOHA. Os testes no final conferem os exemplos e
exercícios do livro.

Execute:  python3 redes.py
"""
import math
import random

# ---------------------------------------------------------------- cap. 2


def nyquist(banda_hz, niveis):
    """Taxa máxima de um canal sem ruído: 2B log2 V."""
    return 2 * banda_hz * math.log2(niveis)


def shannon(banda_hz, snr_db):
    """Capacidade com ruído térmico: B log2(1 + S/N), com S/N dado em dB."""
    return banda_hz * math.log2(1 + 10 ** (snr_db / 10))


CHIPS = {  # Fig. 2-28 do livro
    "A": [-1, -1, -1, +1, +1, -1, +1, +1],
    "B": [-1, -1, +1, -1, +1, +1, +1, -1],
    "C": [-1, +1, -1, +1, +1, +1, -1, -1],
    "D": [-1, +1, -1, -1, -1, -1, +1, -1],
}


def cdma_soma(envios):
    """envios: {estação: 1, 0 ou None}. Bit 1 envia S, bit 0 envia -S; o canal soma."""
    sinal = [0] * 8
    for est, bit in envios.items():
        if bit is None:
            continue
        for i, c in enumerate(CHIPS[est]):
            sinal[i] += c if bit else -c
    return sinal


def cdma_decodifica(sinal):
    """Produto interno normalizado: +1 = enviou 1, -1 = enviou 0, 0 = não transmitiu."""
    return {est: sum(s * c for s, c in zip(sinal, chip)) / len(chip) for est, chip in CHIPS.items()}


# ---------------------------------------------------------------- cap. 3: enquadramento


def bit_stuffing(bits):
    """Insere um 0 depois de cada cinco 1s seguidos (a flag 01111110 nunca aparece)."""
    saida, uns = [], 0
    for b in bits:
        saida.append(b)
        uns = uns + 1 if b == "1" else 0
        if uns == 5:
            saida.append("0")
            uns = 0
    return "".join(saida)


def bit_unstuffing(bits):
    saida, uns, pular = [], 0, False
    for b in bits:
        if pular:          # descarta o 0 inserido
            pular, uns = False, 0
            continue
        saida.append(b)
        uns = uns + 1 if b == "1" else 0
        if uns == 5:
            pular = True
    return "".join(saida)


def byte_stuffing(tokens):
    """ESC antes de cada FLAG ou ESC dos dados; FLAG no início e no fim."""
    saida = ["FLAG"]
    for t in tokens:
        if t in ("FLAG", "ESC"):
            saida.append("ESC")
        saida.append(t)
    return saida + ["FLAG"]


# ---------------------------------------------------------------- cap. 3: códigos


def hamming_bits_verificacao(m):
    """Menor r com (m + r + 1) <= 2^r."""
    r = 0
    while m + r + 1 > 2 ** r:
        r += 1
    return r


def hamming_codifica(dados):
    """Paridade par; bits de verificação nas posições 1, 2, 4, 8… (numeradas a partir de 1)."""
    m = len(dados)
    n = m + hamming_bits_verificacao(m)
    palavra = [0] * (n + 1)
    it = iter(dados)
    for i in range(1, n + 1):
        if i & (i - 1):                 # não é potência de 2: bit de dados
            palavra[i] = int(next(it))
    p = 1
    while p <= n:
        palavra[p] = sum(palavra[i] for i in range(1, n + 1) if i & p and i != p) % 2
        p <<= 1
    return "".join(map(str, palavra[1:]))


def hamming_sindrome(palavra):
    """Soma das posições das verificações que falham = posição do bit errado (0 = ok)."""
    n, w = len(palavra), [0] + [int(b) for b in palavra]
    sindrome, p = 0, 1
    while p <= n:
        if sum(w[i] for i in range(1, n + 1) if i & p) % 2:
            sindrome += p
        p <<= 1
    return sindrome


def hamming_dados(palavra):
    """Corrige (até 1 erro) e extrai os bits de dados."""
    w = list(palavra)
    s = hamming_sindrome(palavra)
    if 1 <= s <= len(w):
        w[s - 1] = "1" if w[s - 1] == "0" else "0"
    return "".join(b for i, b in enumerate(w, 1) if i & (i - 1))


def crc_resto(quadro, gerador):
    """Divisão módulo 2 de quadro·x^r por G(x); r = grau do gerador."""
    r = len(gerador) - 1
    trabalho = [int(b) for b in quadro] + [0] * r
    g = [int(b) for b in gerador]
    for i in range(len(quadro)):
        if trabalho[i]:
            for j in range(len(g)):
                trabalho[i + j] ^= g[j]
    return "".join(map(str, trabalho[-r:]))


def crc_verifica(recebido, gerador):
    """Resto da divisão do quadro recebido (zero = nenhum erro detectado)."""
    trabalho, g = [int(b) for b in recebido], [int(b) for b in gerador]
    for i in range(len(recebido) - len(g) + 1):
        if trabalho[i]:
            for j in range(len(g)):
                trabalho[i + j] ^= g[j]
    return "".join(map(str, trabalho[-(len(g) - 1):]))


def checksum_internet(palavras, w=16):
    """Soma em complemento de 1 (o vai-um volta ao bit menos significativo) e complementa."""
    mascara, soma = (1 << w) - 1, 0
    for x in palavras:
        soma += x
        if soma > mascara:
            soma = (soma & mascara) + 1
    return ~soma & mascara


# ---------------------------------------------------------------- cap. 3: janela deslizante


def utilizacao(janela, bits_quadro, taxa, propagacao):
    """U = min(1, w / (1 + 2BD)), BD = taxa·propagação / bits do quadro."""
    bd = taxa * propagacao / bits_quadro
    return min(1.0, janela / (1 + 2 * bd))


def janela_para_100(bits_quadro, taxa, propagacao):
    return math.ceil(2 * taxa * propagacao / bits_quadro + 1)


# ---------------------------------------------------------------- cap. 4


def aloha_puro(G):
    return G * math.exp(-2 * G)


def aloha_slots(G):
    return G * math.exp(-G)


def aloha_slots_simulado(n, p, slots, rng):
    """Fração de slots com exatamente uma transmissão."""
    sucessos = 0
    for _ in range(slots):
        transmitem = sum(rng.random() < p for _ in range(n))
        sucessos += transmitem == 1
    return sucessos / slots


def quadro_minimo_bits(comprimento_m, velocidade, taxa):
    """O quadro precisa durar a ida e volta (2τ) para a colisão ser detectada."""
    return 2 * comprimento_m / velocidade * taxa


def eficiencia_ethernet(taxa, comprimento_m, velocidade, quadro_bytes):
    return 1 / (1 + 2 * taxa * comprimento_m * math.e / (velocidade * quadro_bytes * 8))


if __name__ == "__main__":
    # Cap. 2
    assert round(shannon(4000, 30)) == 39869                     # problema 2.2
    assert nyquist(6e6, 4) == 24e6                               # problema 2.3
    assert min(nyquist(3000, 2), shannon(3000, 20)) == 6000      # problema 2.4
    assert cdma_soma({"A": 0, "B": 0, "C": 0}) == [3, 1, 1, -1, -3, -1, -1, 1]      # problema 2.44
    dec = cdma_decodifica([-1, +1, -3, +1, -1, -3, +1, +1])     # problema 2.46
    assert dec == {"A": 1, "B": -1, "C": 0, "D": 1}
    print("CDMA (2.46): A=1, B=0, C em silêncio, D=1")

    # Cap. 3: enquadramento
    assert bit_stuffing("0111101111101111110") == "011110111110011111010"         # problema 3.6
    assert bit_stuffing("011011111111111111110010") == "011011111011111011111010010"  # Fig. 3-5
    for s in ("0111101111101111110", "1" * 40, "0101111110"):
        assert bit_unstuffing(bit_stuffing(s)) == s
    assert byte_stuffing("A B ESC C ESC FLAG FLAG D".split())[1:-1] == \
        "A B ESC ESC C ESC ESC ESC FLAG ESC FLAG D".split()               # problema 3.3

    # Cap. 3: códigos
    assert hamming_codifica("1000001") == "00100001001"          # "A" da Fig. 3-6
    assert hamming_sindrome("00101001001") == 5                  # bit 5 invertido
    assert hamming_bits_verificacao(16) == 5                     # problema 3.9
    assert hamming_codifica("1101001100110101") == "011110110011001110101"
    assert hamming_dados("111001001111") == "10101111"           # problema 3.10: 0xE4F → 0xAF
    assert crc_resto("1101011111", "10011") == "0010"            # Fig. 3-9
    assert crc_resto("10100001", "1001") == "111"                # problema 3.16
    t = "10011101" + crc_resto("10011101", "1001")               # problema 3.17
    assert t == "10011101100" and crc_verifica(t, "1001") == "000"
    assert crc_verifica("10111101100", "1001") != "000"          # 3º bit invertido: detectado
    assert checksum_internet([0b1001, 0b1100, 0b1010, 0b0011], w=4) == 0b1011   # problema 3.15
    print("Hamming, CRC e checksum conferem com o livro.")

    # Cap. 3: janela deslizante
    assert janela_para_100(1000, 50e3, 0.25) == 26               # exemplo do satélite (seção 3.4)
    assert janela_para_100(512, 1.544e6, 0.018) == 110           # problema 3.22 → 7 bits
    assert abs(utilizacao(1, 32 * 1024 * 8, 64e6, 300) - 6.83e-6) < 1e-7          # problema 3.27
    vazoes = [min(64e3, w * 4096 / 0.604) for w in (1, 7, 15, 127)]                 # problema 3.34
    assert [round(v) for v in vazoes] == [6781, 47470, 64000, 64000]

    # Cap. 4
    assert abs(aloha_puro(0.5) - 1 / (2 * math.e)) < 1e-12 and abs(aloha_slots(1) - 1 / math.e) < 1e-12
    rng = random.Random(1)
    sim = aloha_slots_simulado(20, 1 / 20, 20000, rng)
    teoria = 20 * (1 / 20) * (1 - 1 / 20) ** 19
    print(f"ALOHA com slots, N = 20, p = 1/N: simulado {sim:.3f}, teoria {teoria:.3f}")
    assert abs(sim - teoria) < 0.02
    assert round(quadro_minimo_bits(2500, 2e8, 10e6)) == 250      # sem repetidores; com eles, ~500 → 512
    assert abs(eficiencia_ethernet(10e6, 2500, 2e8, 1024) - 0.93) < 0.01
    assert abs(1 / (1 + 512 * math.e / (1024 * 8)) - 0.855) < 0.001      # exemplo do livro: 2τ = 51,2 μs → 85%
    print("Todos os testes passaram.")
