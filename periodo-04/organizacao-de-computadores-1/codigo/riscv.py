"""Mini RISC-V (RV32I) em Python: codificação de instruções, simulador e cache.

Execute:  python3 riscv.py

O montador aceita um subconjunto do RV32I (add, sub, and, or, xor, slt, sll, srl, sra,
addi, andi, ori, xori, slti, slli, srli, srai, lw, sw, beq, bne, blt, bge, jal, jalr, lui)
e as pseudoinstruções li, mv, j, ret, nop. Para ferramentas reais, use o RARS ou o
Ripes (que também desenha o pipeline).
"""
import re

ABI = ["zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2", "s0", "s1", "a0", "a1", "a2", "a3", "a4", "a5",
       "a6", "a7", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "t3", "t4", "t5", "t6"]
REG = {n: i for i, n in enumerate(ABI)} | {f"x{i}": i for i in range(32)}

# instrução: (formato, opcode, funct3, funct7)
ISA = {
    "add": ("R", 0x33, 0, 0x00), "sub": ("R", 0x33, 0, 0x20), "sll": ("R", 0x33, 1, 0), "slt": ("R", 0x33, 2, 0),
    "xor": ("R", 0x33, 4, 0), "srl": ("R", 0x33, 5, 0), "sra": ("R", 0x33, 5, 0x20), "or": ("R", 0x33, 6, 0),
    "and": ("R", 0x33, 7, 0),
    "addi": ("I", 0x13, 0, 0), "slti": ("I", 0x13, 2, 0), "xori": ("I", 0x13, 4, 0), "ori": ("I", 0x13, 6, 0),
    "andi": ("I", 0x13, 7, 0), "slli": ("I", 0x13, 1, 0), "srli": ("I", 0x13, 5, 0), "srai": ("I", 0x13, 5, 0x20),
    "lw": ("I", 0x03, 2, 0), "jalr": ("I", 0x67, 0, 0), "sw": ("S", 0x23, 2, 0),
    "beq": ("B", 0x63, 0, 0), "bne": ("B", 0x63, 1, 0), "blt": ("B", 0x63, 4, 0), "bge": ("B", 0x63, 5, 0),
    "jal": ("J", 0x6F, 0, 0), "lui": ("U", 0x37, 0, 0),
}


def s32(x):
    """Interpreta x como inteiro de 32 bits com sinal."""
    x &= 0xFFFFFFFF
    return x - (1 << 32) if x & 0x80000000 else x


def bits(x, hi, lo):
    return (x >> lo) & ((1 << (hi - lo + 1)) - 1)


def encode(op, rd=0, rs1=0, rs2=0, imm=0):
    fmt, opc, f3, f7 = ISA[op]
    imm &= 0xFFFFFFFF
    if fmt == "R":
        w = f7 << 25 | rs2 << 20 | rs1 << 15 | f3 << 12 | rd << 7 | opc
    elif fmt == "I":
        im = (f7 << 5 | imm & 31) if op in ("slli", "srli", "srai") else imm & 0xFFF
        w = im << 20 | rs1 << 15 | f3 << 12 | rd << 7 | opc
    elif fmt == "S":
        w = bits(imm, 11, 5) << 25 | rs2 << 20 | rs1 << 15 | f3 << 12 | bits(imm, 4, 0) << 7 | opc
    elif fmt == "B":
        w = (bits(imm, 12, 12) << 31 | bits(imm, 10, 5) << 25 | rs2 << 20 | rs1 << 15 | f3 << 12
             | bits(imm, 4, 1) << 8 | bits(imm, 11, 11) << 7 | opc)
    elif fmt == "U":
        w = (imm & 0xFFFFF) << 12 | rd << 7 | opc
    else:  # J
        w = (bits(imm, 20, 20) << 31 | bits(imm, 10, 1) << 21 | bits(imm, 11, 11) << 20
             | bits(imm, 19, 12) << 12 | rd << 7 | opc)
    return w & 0xFFFFFFFF


def decode(w):
    """O caminho inverso: da palavra de 32 bits de volta aos campos (o que o hardware faz no ID)."""
    opc, rd, f3, rs1, rs2, f7 = bits(w, 6, 0), bits(w, 11, 7), bits(w, 14, 12), bits(w, 19, 15), bits(w, 24, 20), bits(w, 31, 25)
    for op, (fmt, o, ff3, ff7) in ISA.items():
        if o != opc or (fmt not in ("U", "J") and ff3 != f3):
            continue
        if fmt == "R" and ff7 != f7:
            continue
        if op in ("srli", "srai") and ff7 != f7:
            continue
        if fmt == "I":
            imm = s32(bits(w, 31, 20) << 20) >> 20
            if op in ("slli", "srli", "srai"):
                imm &= 31
            return op, rd, rs1, 0, imm
        if fmt == "S":
            return op, 0, rs1, rs2, s32((bits(w, 31, 25) << 5 | bits(w, 11, 7)) << 20) >> 20
        if fmt == "B":
            imm = bits(w, 31, 31) << 12 | bits(w, 7, 7) << 11 | bits(w, 30, 25) << 5 | bits(w, 11, 8) << 1
            return op, 0, rs1, rs2, s32(imm << 19) >> 19
        if fmt == "J":
            imm = bits(w, 31, 31) << 20 | bits(w, 19, 12) << 12 | bits(w, 20, 20) << 11 | bits(w, 30, 21) << 1
            return op, rd, 0, 0, s32(imm << 11) >> 11
        if fmt == "U":
            return op, rd, 0, 0, bits(w, 31, 12)
        return op, rd, rs1, rs2, 0
    raise ValueError(f"instrução desconhecida {w:#010x}")


def assemble(src):
    """Duas passadas: primeiro os rótulos, depois os operandos. Devolve a lista de palavras."""
    linhas, labels = [], {}
    for raw in src.splitlines():
        s = raw.split("#")[0].strip()
        while (m := re.match(r"^(\w+):\s*", s)):
            labels[m.group(1)] = 4 * len(linhas)
            s = s[m.end():]
        if not s:
            continue
        op, _, rest = s.partition(" ")
        args = [a.strip() for a in rest.split(",") if a.strip()]
        pseudo = {"li": lambda: ("addi", [args[0], "zero", args[1]]), "mv": lambda: ("addi", args + ["0"]),
                  "j": lambda: ("jal", ["zero"] + args), "ret": lambda: ("jalr", ["zero", "0(ra)"]),
                  "nop": lambda: ("addi", ["zero", "zero", "0"])}
        linhas.append(pseudo[op]() if op in pseudo else (op, args))
    words = []
    for k, (op, a) in enumerate(linhas):
        fmt = ISA[op][0]
        addr = 4 * k
        imm_of = lambda t: labels[t] - addr if t in labels else int(t, 0)
        mem = lambda t: (lambda m: (int(m.group(1) or 0), REG[m.group(2)]))(re.match(r"(-?\d+)?\((\w+)\)", t))
        if fmt == "R":
            words.append(encode(op, REG[a[0]], REG[a[1]], REG[a[2]]))
        elif op in ("lw", "jalr"):
            imm, rs1 = mem(a[1])
            words.append(encode(op, REG[a[0]], rs1, 0, imm))
        elif fmt == "I":
            words.append(encode(op, REG[a[0]], REG[a[1]], 0, int(a[2], 0)))
        elif fmt == "S":
            imm, rs1 = mem(a[1])
            words.append(encode(op, 0, rs1, REG[a[0]], imm))
        elif fmt == "B":
            words.append(encode(op, 0, REG[a[0]], REG[a[1]], imm_of(a[2])))
        elif fmt == "J":
            words.append(encode(op, REG[a[0]], 0, 0, imm_of(a[1])))
        else:
            words.append(encode(op, REG[a[0]], 0, 0, int(a[1], 0)))
    return words


def run(words, mem=None, max_steps=10_000):
    """Executa o código de máquina (decodificando cada palavra, como o hardware)."""
    regs = [0] * 32
    regs[2] = 0x7F0
    mem = dict(mem or {})
    pc, executed = 0, 0
    while 0 <= pc < 4 * len(words) and executed < max_steps:
        op, rd, rs1, rs2, imm = decode(words[pc // 4])
        a, b = regs[rs1], regs[rs2]
        nxt, val = pc + 4, None
        if op in ("add", "addi"): val = a + (b if op == "add" else imm)
        elif op == "sub": val = a - b
        elif op in ("and", "andi"): val = a & (b if op == "and" else imm)
        elif op in ("or", "ori"): val = a | (b if op == "or" else imm)
        elif op in ("xor", "xori"): val = a ^ (b if op == "xor" else imm)
        elif op in ("slt", "slti"): val = int(a < (b if op == "slt" else imm))
        elif op in ("sll", "slli"): val = a << ((b if op == "sll" else imm) & 31)
        elif op in ("srl", "srli"): val = (a & 0xFFFFFFFF) >> ((b if op == "srl" else imm) & 31)
        elif op in ("sra", "srai"): val = a >> ((b if op == "sra" else imm) & 31)
        elif op == "lui": val = imm << 12
        elif op == "lw": val = mem.get(a + imm, 0)
        elif op == "sw": mem[a + imm] = b
        elif op in ("beq", "bne", "blt", "bge"):
            if {"beq": a == b, "bne": a != b, "blt": a < b, "bge": a >= b}[op]:
                nxt = pc + imm
        elif op == "jal": val, nxt = pc + 4, pc + imm
        elif op == "jalr": val, nxt = pc + 4, (a + imm) & ~1
        if val is not None and rd != 0:
            regs[rd] = s32(val)
        pc = nxt
        executed += 1
    return regs, mem, executed


def cache(enderecos, linhas=8, bloco=16, vias=1):
    """Cache LRU; devolve (acertos, faltas, {compulsória, capacidade, conflito})."""
    conjuntos = linhas // vias
    sets = [[] for _ in range(conjuntos)]   # cada conjunto: blocos do menos ao mais recente
    total, vistos = [], set()
    acertos, tipos = 0, {"compulsoria": 0, "capacidade": 0, "conflito": 0}
    for e in enderecos:
        b = e // bloco
        s = sets[b % conjuntos]
        hit_total = b in total
        if hit_total:
            total.remove(b)
        total.append(b)
        if len(total) > linhas:
            total.pop(0)
        if b in s:
            acertos += 1
            s.remove(b)
        else:
            tipos["compulsoria" if b not in vistos else "conflito" if hit_total else "capacidade"] += 1
            if len(s) == vias:
                s.pop(0)
        s.append(b)
        vistos.add(b)
    return acertos, len(enderecos) - acertos, tipos


if __name__ == "__main__":
    # Codificações conferidas com o manual do RISC-V (e com o RARS)
    casos = {
        "addi x1, x0, 5": 0x00500093, "add x3, x1, x2": 0x002081B3, "lw x5, 8(x2)": 0x00812283,
        "sw x5, 8(x2)": 0x00512423, "beq x1, x2, 8": 0x00208463, "jal x1, 16": 0x010000EF,
        "lui x5, 0x12345": 0x123452B7, "sub x1, x2, x3": 0x403100B3, "srai x1, x1, 3": 0x4030D093,
        "jalr x0, 0(x1)": 0x00008067,
    }
    for asm, esperado in casos.items():
        w = assemble(asm)[0]
        assert w == esperado, f"{asm}: {w:#010x} != {esperado:#010x}"
    # decodificar(codificar(x)) = x, inclusive imediatos negativos
    for op, args in [("addi", (5, 6, 0, -7)), ("sw", (0, 2, 9, -12)), ("bne", (0, 1, 2, -4)), ("jal", (1, 0, 0, -2048)), ("srai", (3, 3, 0, 31))]:
        assert decode(encode(op, *args)) == (op, *args), op
    print("Codificação e decodificação: ok")

    soma = """
            li   t0, 1024
            li   t1, 5
            li   a0, 0
    laco:   beq  t1, zero, fim
            lw   t2, 0(t0)
            add  a0, a0, t2
            addi t0, t0, 4
            addi t1, t1, -1
            j    laco
    fim:    sw   a0, 20(t0)
    """
    vetor = {1024 + 4 * i: v for i, v in enumerate([3, 1, 4, 1, 5])}
    regs, mem, n = run(assemble(soma), vetor)
    assert regs[REG["a0"]] == 14 and mem[1024 + 40] == 14
    print(f"Soma do vetor [3, 1, 4, 1, 5] = {regs[REG['a0']]} em {n} instruções")

    funcao = """
    main:   li   a0, 4
            li   a1, 5
            jal  ra, dobro_soma
            mv   s0, a0
            j    fim
    dobro_soma:
            add  a0, a0, a1
            slli a0, a0, 1
            ret
    fim:    nop
    """
    regs, _, _ = run(assemble(funcao))
    assert regs[REG["s0"]] == 18
    regs, _, _ = run(assemble("li t0, -8\nsrai t1, t0, 1\nsrli t2, t0, 28\nslt t3, t0, zero"))
    assert regs[REG["t1"]] == -4 and regs[REG["t2"]] == 15 and regs[REG["t3"]] == 1
    print("Chamada de função e deslocamentos com sinal: ok")

    # Cache: vetor percorrido com blocos de 16 bytes acerta 3 em 4
    assert cache(range(0, 64, 4), linhas=8, bloco=16) == (12, 4, {"compulsoria": 4, "capacidade": 0, "conflito": 0})
    conflito = [0, 128, 0, 128, 0, 128, 256, 0]
    assert cache(conflito, 8, 16, 1)[2] == {"compulsoria": 3, "capacidade": 0, "conflito": 5}
    assert cache(conflito, 8, 16, 2)[0] == 4
    # matriz 32x32 de inteiros: por linhas × por colunas numa cache de 64 linhas de 32 bytes
    linhas = [4 * (32 * i + j) for i in range(32) for j in range(32)]
    colunas = [4 * (32 * i + j) for j in range(32) for i in range(32)]
    a_l, _, _ = cache(linhas, 64, 32, 1)
    a_c, _, _ = cache(colunas, 64, 32, 1)
    print(f"Matriz 32x32: por linhas {a_l / 1024:.0%} de acertos, por colunas {a_c / 1024:.0%}")
    assert a_l / 1024 == 7 / 8 and a_c < a_l
    print("Todos os testes passaram.")
