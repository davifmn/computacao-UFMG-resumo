// Roteiro do tutorial de sockets: um servidor TCP de eco e um cliente,
// executados lado a lado. Cada passo diz qual chamada está rodando, o estado
// de cada lado e os segmentos TCP que ela provoca na rede.

import { lineFinder } from '../../../../engine/highlight.js';

export const CODE = `from socket import socket, AF_INET, SOCK_STREAM

# ---------------- SERVIDOR ----------------
s = socket(AF_INET, SOCK_STREAM)  # SOCKET
s.bind(("0.0.0.0", 5000))    # BIND
s.listen(5)                  # LISTEN
while True:
    c, endereco = s.accept()   # ACCEPT
    dados = c.recv(1024)       # RECEIVE
    c.sendall(dados.upper())   # SEND
    c.close()                  # CLOSE

# ---------------- CLIENTE -----------------
k = socket(AF_INET, SOCK_STREAM)  # SOCKET
k.connect(("servidor", 5000))  # CONNECT
k.sendall(b"ola, redes")       # SEND
resposta = k.recv(1024)        # RECEIVE
k.close()                      # CLOSE`;

const L = lineFinder(CODE);

/**
 * Passos. Campos:
 *   srv / cli: estado de cada lado ('—', 'criado', 'ligado', 'ouvindo', 'bloqueado', 'conectado', 'fechado')
 *   seg: segmentos na rede neste passo: [{ de: 'cli'|'srv', txt }]
 *   sockets: descritores existentes no servidor (mostra que o accept cria um novo)
 */
export function socketSteps() {
  const S = [];
  const add = (line, srv, cli, msg, extra = {}) => S.push({ line, srv, cli, msg, seg: [], sockets: ['s'], ...extra });
  add(L('# SOCKET'), 'criado', '—', '<b>SOCKET</b> cria um ponto de comunicação (um descritor, como o de um arquivo). <code>AF_INET</code> = IPv4, <code>SOCK_STREAM</code> = fluxo de bytes confiável (TCP). Ainda não tem endereço.', { sockets: ['s'] });
  add(L('# BIND'), 'ligado', '—', '<b>BIND</b> associa um endereço local ao socket: IP e <b>porta 5000</b>. É assim que os clientes sabem onde encontrar o servidor. <code>0.0.0.0</code> = todas as interfaces da máquina.');
  add(L('# LISTEN'), 'ouvindo', '—', '<b>LISTEN</b> avisa que o socket aceita conexões e reserva uma fila para até 5 pedidos pendentes. <b>Não bloqueia</b>: só muda o estado do socket.');
  add(L('c, endereco = s.accept()'), 'bloqueado em accept', '—', '<b>ACCEPT</b> bloqueia o servidor até chegar um pedido de conexão.');
  add(L('k = socket(AF_INET'), 'bloqueado em accept', 'criado', 'No cliente, <b>SOCKET</b> também cria o ponto de comunicação. O cliente <b>não precisa de BIND</b>: o sistema escolhe uma porta efêmera qualquer, porque o endereço do cliente não importa para ninguém.');
  add(L('k.connect'), 'bloqueado em accept', 'conectando…', '<b>CONNECT</b> inicia ativamente a conexão e <b>bloqueia</b> o cliente até ela se completar. Na rede, o TCP faz o <i>three-way handshake</i> (cap. 6): SYN, SYN+ACK, ACK.', { seg: [{ de: 'cli', txt: 'SYN' }, { de: 'srv', txt: 'SYN + ACK' }, { de: 'cli', txt: 'ACK' }] });
  add(L('c, endereco = s.accept()'), 'conectado (socket c)', 'conectado', 'A conexão está estabelecida. O <b>ACCEPT retorna um socket novo</b> (<code>c</code>) só para esta conexão; o socket original <code>s</code> continua ouvindo novos clientes. Os dois lados são desbloqueados.', { sockets: ['s', 'c'] });
  add(L('k.sendall(b"ola'), 'conectado (socket c)', 'enviando', 'O cliente envia 10 bytes com <b>SEND</b>. A conexão é full-duplex: os dois lados podem enviar e receber.', { sockets: ['s', 'c'], seg: [{ de: 'cli', txt: 'dados: "ola, redes"' }, { de: 'srv', txt: 'ACK' }] });
  add(L('dados = c.recv(1024)'), 'recebeu 10 bytes', 'enviando', '<b>RECEIVE</b> no servidor devolve <b>até</b> 1024 bytes do que já chegou. O TCP é um <b>fluxo de bytes</b>: não preserva fronteiras de mensagens, então um <code>recv</code> pode trazer menos (ou mais) do que um <code>send</code> mandou. Protocolos reais precisam delimitar mensagens.', { sockets: ['s', 'c'] });
  add(L('c.sendall(dados.upper())'), 'enviando resposta', 'bloqueado em recv', 'O servidor responde com <b>SEND</b> ("OLA, REDES").', { sockets: ['s', 'c'], seg: [{ de: 'srv', txt: 'dados: "OLA, REDES"' }, { de: 'cli', txt: 'ACK' }] });
  add(L('resposta = k.recv(1024)'), 'enviando resposta', 'recebeu a resposta', 'O cliente recebe a resposta com <b>RECEIVE</b>.', { sockets: ['s', 'c'] });
  add(L('c.close()'), 'fechou c; s segue ouvindo', 'recebeu a resposta', '<b>CLOSE</b> no servidor libera só a conexão com este cliente (socket <code>c</code>). A liberação é <b>simétrica</b>: a conexão só termina quando os dois lados fecharem.', { sockets: ['s'], seg: [{ de: 'srv', txt: 'FIN' }, { de: 'cli', txt: 'ACK' }] });
  add(L('k.close()'), 'ouvindo', 'fechado', 'O cliente também fecha, e a conexão é liberada. O servidor volta ao <code>accept</code> para o próximo cliente (um servidor real atenderia vários ao mesmo tempo com threads, processos ou <code>select</code>).', { sockets: ['s'], seg: [{ de: 'cli', txt: 'FIN' }, { de: 'srv', txt: 'ACK' }] });
  return S;
}
