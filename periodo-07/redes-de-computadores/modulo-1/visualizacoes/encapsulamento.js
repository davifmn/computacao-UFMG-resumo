// Roteiro da visualização de encapsulamento: uma mensagem desce a pilha do
// host A (cada camada acrescenta seu cabeçalho), atravessa um roteador (que só
// sobe até a camada de rede) e sobe a pilha do host B (cada camada retira o seu).

export const LAYERS = [
  { key: 'app', tcpip: 'Aplicação', osi: '7 Aplicação · 6 Apresentação · 5 Sessão', pdu: 'mensagem', hdr: null, color: 'yellow', ex: 'HTTP, SMTP, DNS' },
  { key: 'tra', tcpip: 'Transporte', osi: '4 Transporte', pdu: 'segmento', hdr: 'TCP', color: 'green', ex: 'TCP, UDP' },
  { key: 'net', tcpip: 'Rede (Internet)', osi: '3 Rede', pdu: 'pacote', hdr: 'IP', color: 'blue', ex: 'IP, ICMP' },
  { key: 'lnk', tcpip: 'Enlace', osi: '2 Enlace de dados', pdu: 'quadro', hdr: 'Eth', trailer: 'CRC', color: 'purple', ex: 'Ethernet, 802.11' },
  { key: 'phy', tcpip: 'Física', osi: '1 Física', pdu: 'bits', hdr: null, color: 'pink', ex: 'cabo, fibra, rádio' },
];

export const CODE = `# O que cada camada faz com o que recebe de cima
def envia(dados, camada):
    if camada == APLICACAO:  pdu = dados              # mensagem
    if camada == TRANSPORTE: pdu = [TCP] + dados      # segmento (portas, nº de sequência)
    if camada == REDE:       pdu = [IP] + dados       # pacote (endereços IP de origem/destino)
    if camada == ENLACE:     pdu = [ETH] + dados + [CRC]  # quadro (endereços MAC, detecção de erros)
    if camada == FISICA:     transmite_bits(dados)    # sinais elétricos, ópticos ou de rádio
    envia(pdu, camada - 1)

def recebe(pdu, camada):     # do lado de lá: cada camada tira o SEU cabeçalho
    dados = remove_cabecalho(pdu, camada)
    recebe(dados, camada + 1)`;

/**
 * Passos: cada um diz onde a unidade de dados está (máquina e camada) e quais
 * "caixas" (cabeçalhos) ela tem.
 *   where: 'A' | 'R' | 'B' | 'wire1' | 'wire2';  layer: índice em LAYERS
 */
export function encapsulationSteps() {
  const S = [];
  const stack = hdrs => hdrs;
  const add = (where, layer, parts, msg, line) => S.push({ where, layer, parts: stack(parts), msg, line });
  const M = { k: 'M', label: 'dados (mensagem HTTP)', color: 'yellow' };
  const TCP = { k: 'TCP', label: 'TCP', color: 'green' };
  const IP = { k: 'IP', label: 'IP', color: 'blue' };
  const ETH = { k: 'ETH', label: 'Eth', color: 'purple' };
  const CRC = { k: 'CRC', label: 'CRC', color: 'purple' };
  const ETH2 = { k: 'ETH2', label: 'Eth\'', color: 'orange' };
  const CRC2 = { k: 'CRC2', label: 'CRC\'', color: 'orange' };
  add('A', 0, [M], 'O navegador (camada de <b>aplicação</b>) no host A quer enviar uma requisição HTTP ao servidor B. Para ela, basta "entregar a mensagem": ela não sabe nada de cabos, rotas ou perdas.', 2);
  add('A', 1, [TCP, M], 'A camada de <b>transporte</b> (TCP) acrescenta seu cabeçalho: portas de origem e destino (qual <i>processo</i>), número de sequência e confirmação (para a entrega confiável). O resultado é um <b>segmento</b>.', 4);
  add('A', 2, [IP, TCP, M], 'A camada de <b>rede</b> (IP) acrescenta o cabeçalho IP com os endereços de origem e destino (qual <i>máquina</i>, em qualquer lugar do mundo). Agora é um <b>pacote</b>. Para o IP, tudo que veio de cima é só "carga útil".', 5);
  add('A', 3, [ETH, IP, TCP, M, CRC], 'A camada de <b>enlace</b> monta o <b>quadro</b>: cabeçalho com endereços MAC (quem é o próximo salto <i>neste enlace</i>) e um trailer com o CRC para detectar erros de transmissão.', 6);
  add('A', 4, [ETH, IP, TCP, M, CRC], 'A camada <b>física</b> transforma o quadro em sinais (tensões num cabo, luz numa fibra, ondas de rádio). Ela só enxerga <b>bits</b>.', 7);
  add('wire1', 4, [ETH, IP, TCP, M, CRC], 'Os bits atravessam o meio físico até o roteador.', 7);
  add('R', 4, [ETH, IP, TCP, M, CRC], 'O roteador recebe os bits…', 12);
  add('R', 3, [ETH, IP, TCP, M, CRC], '…a camada de enlace do roteador confere o CRC (se houver erro, descarta o quadro) e retira o cabeçalho e o trailer de enlace.', 12);
  add('R', 2, [IP, TCP, M], 'A camada de <b>rede</b> do roteador lê o endereço IP de destino e consulta sua tabela de roteamento para decidir por qual enlace sair. O roteador <b>não sobe</b> até o transporte: ele não sabe nada de TCP nem de HTTP.', 12);
  add('R', 3, [ETH2, IP, TCP, M, CRC2], 'O pacote é encapsulado num <b>novo quadro</b>, com novos endereços MAC e possivelmente outra tecnologia (ex.: entrou por Wi-Fi e sai por fibra). O cabeçalho IP segue o mesmo (a menos do TTL e do checksum).', 6);
  add('R', 4, [ETH2, IP, TCP, M, CRC2], 'De volta à camada física, agora no segundo enlace.', 7);
  add('wire2', 4, [ETH2, IP, TCP, M, CRC2], 'Os bits atravessam o segundo enlace até o host B.', 7);
  add('B', 4, [ETH2, IP, TCP, M, CRC2], 'O host B recebe os bits.', 12);
  add('B', 3, [IP, TCP, M], 'Enlace: confere o CRC e retira o cabeçalho e o trailer do quadro.', 12);
  add('B', 2, [TCP, M], 'Rede: confere que o pacote é para esta máquina e entrega a carga útil ao protocolo indicado no cabeçalho (TCP).', 12);
  add('B', 1, [M], 'Transporte: usa a porta de destino para achar o <b>processo</b> certo (o servidor web), coloca os dados em ordem, confirma o recebimento e retira seu cabeçalho.', 12);
  add('B', 0, [M], 'A aplicação no host B recebe exatamente a mensagem que foi enviada. Cada camada conversou com sua <b>camada par</b> do outro lado (comunicação virtual), mas os dados de fato só desceram e subiram (comunicação real).', 13);
  return S;
}
