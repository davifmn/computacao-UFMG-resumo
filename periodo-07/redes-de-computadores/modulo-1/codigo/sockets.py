"""Sockets TCP e UDP em Python (Tanenbaum, seções 6.1.3 e 6.1.4).

Servidor TCP que atende vários clientes (uma thread por conexão), mensagens
delimitadas por um prefixo de 4 bytes com o tamanho (TCP é fluxo de bytes e
não preserva fronteiras) e um par cliente/servidor UDP.

Execute:  python3 sockets.py   (tudo roda em localhost e se testa sozinho)
"""
import socket
import struct
import threading


# ---------------------------------------------------------------- enquadramento das mensagens

def envia_msg(sock, dados):
    """Prefixo de 4 bytes (ordem de rede, big-endian) com o tamanho, depois os dados."""
    sock.sendall(struct.pack("!I", len(dados)) + dados)


def recebe_exato(sock, n):
    """recv pode devolver menos bytes do que o pedido: repete até juntar n bytes."""
    partes = []
    while n > 0:
        pedaco = sock.recv(n)
        if not pedaco:                      # o outro lado fechou a conexão
            raise ConnectionError("conexão fechada no meio da mensagem")
        partes.append(pedaco)
        n -= len(pedaco)
    return b"".join(partes)


def recebe_msg(sock):
    (tamanho,) = struct.unpack("!I", recebe_exato(sock, 4))
    return recebe_exato(sock, tamanho)


# ---------------------------------------------------------------- TCP

def servidor_tcp(pronto, porta_escolhida):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)            # SOCKET
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(("127.0.0.1", 0))                                          # BIND (porta 0 = o SO escolhe)
    s.listen(5)                                                       # LISTEN (não bloqueia)
    porta_escolhida.append(s.getsockname()[1])
    pronto.set()

    def atende(c):
        with c:
            while True:
                try:
                    msg = recebe_msg(c)                               # RECEIVE
                except ConnectionError:
                    return
                if msg == b"FIM":
                    return
                envia_msg(c, msg.upper())                             # SEND

    while True:
        c, _ = s.accept()                                             # ACCEPT: socket novo por conexão
        threading.Thread(target=atende, args=(c,), daemon=True).start()


def cliente_tcp(porta, mensagens):
    respostas = []
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as k:     # SOCKET (sem BIND)
        k.connect(("127.0.0.1", porta))                               # CONNECT
        for m in mensagens:
            envia_msg(k, m)
            respostas.append(recebe_msg(k))
        envia_msg(k, b"FIM")
    return respostas                                                  # CLOSE ao sair do with


# ---------------------------------------------------------------- UDP

def eco_udp(sock):
    """Sem conexão: cada datagrama traz o endereço de quem enviou."""
    dados, origem = sock.recvfrom(2048)
    sock.sendto(dados[::-1], origem)


if __name__ == "__main__":
    pronto, porta = threading.Event(), []
    threading.Thread(target=servidor_tcp, args=(pronto, porta), daemon=True).start()
    pronto.wait(5)

    # vários clientes ao mesmo tempo, cada um na sua conexão (mesma porta do servidor)
    resultados = {}

    def roda(i):
        resultados[i] = cliente_tcp(porta[0], [f"cliente {i}: ola".encode(), b"x" * 100_000])

    threads = [threading.Thread(target=roda, args=(i,)) for i in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(10)
    for i in range(5):
        assert resultados[i][0] == f"CLIENTE {i}: OLA".encode()
        assert resultados[i][1] == b"X" * 100_000          # 100 KB chegam inteiros apesar dos recv parciais
    print(f"TCP: 5 clientes atendidos em paralelo na porta {porta[0]}")

    # UDP
    srv = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    srv.bind(("127.0.0.1", 0))
    t = threading.Thread(target=eco_udp, args=(srv,))
    t.start()
    cli = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    cli.settimeout(5)
    cli.sendto(b"redes", srv.getsockname())               # sem connect: o endereço vai em cada envio
    resposta, _ = cli.recvfrom(2048)
    t.join(5)
    srv.close()
    cli.close()
    assert resposta == b"redes"[::-1]                      # o servidor devolve invertido: b"seder"
    print(f"UDP: enviou b'redes', recebeu {resposta!r}")
    print("Todos os testes passaram.")
