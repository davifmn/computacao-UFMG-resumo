# Redes de Computadores · Módulo 2 (prova 2)

> Tanenbaum & Wetherall, *Computer Networks*, 5ª ed., capítulos 5 a 8.

**Comece pela [revisão da prova 2](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/tutoriais/revisao-prova-2.html)**: mapa das aulas
depois da prova 1, folha de fórmulas, pegadinhas e um simulado com questões numéricas infinitas.

## 📖 Guias de estudo (um por capítulo)

| Capítulo | Conteúdo | Exercícios resolvidos |
|---|---|---|
| [5 · Camada de rede](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/tutoriais/cap5-camada-de-rede.html) | Datagramas × circuitos virtuais, otimalidade, Dijkstra, inundação, vetor de distância, estado de enlace, hierárquico, difusão; congestionamento (ECN, RED); QoS (baldes, WFQ, IntServ, DiffServ); interconexão, túneis e fragmentação; IPv4, CIDR, NAT, IPv6, ICMP, ARP, DHCP, OSPF, BGP, MPLS | Vetor de distância do roteador C, banda do roteamento, hierarquia de 4800 roteadores, descarte, baldes de fichas, M/M/1, fragmentação em 3 enlaces, identificação, endereços e máscaras, alocação em 198.16.0.0, agregação, maior prefixo, NAT, ARP, IPv6 |
| [6 · Camada de transporte](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/tutoriais/cap6-camada-de-transporte.html) | Serviço, duplicatas atrasadas e abertura em três vias, encerramento, controle de fluxo, AIMD, UDP, RPC, RTP, TCP (cabeçalho, conexão, Nagle, temporizadores, Karn, congestionamento), desempenho | Carga máxima, janela × banda × atraso, ciclo dos números de sequência, RTT suavizado, janela após timeout, RPC em fibra, três vias, ACKs duplicados |
| [7 · Camada de aplicação](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/tutoriais/cap7-camada-de-aplicacao.html) | DNS, correio (SMTP, MIME, IMAP), Web (HTTP, conexões persistentes, cache, cookies), áudio e vídeo, CDNs e P2P | Conexões persistentes e pipelining, DNS sobre UDP, base64 |
| [8 · Segurança](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/tutoriais/cap8-seguranca.html) | Criptografia clássica, chave única, AES e modos, RSA, assinaturas e hashes, certificados, IPsec, firewalls, autenticação, PGP, TLS | RSA de SUZANNE, Diffie-Hellman (47, 3, 8, 10), ECB, chave reutilizada, homem no meio, aniversário |

> Os exercícios são identificados pelo assunto, com enunciados resumidos. Todos os números
> das respostas são conferidos por [`codigo/redes2.py`](codigo/redes2.py).

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🧭 | [Roteamento](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/roteamento.html) | Dijkstra passo a passo (rótulos provisórios e permanentes, árvore de escoamento), vetor de distância rodada a rodada e a contagem ao infinito |
| 🏷️ | [Endereçamento IP](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/enderecamento-ip.html) | Calculadora CIDR em binário, encaminhamento pelo maior prefixo, alocação de blocos alinhados e fragmentação ao longo de um caminho |
| 🤝 | [TCP](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/tcp.html) | Abertura em três vias e encerramento com os estados, janela de congestionamento com perdas clicáveis (Tahoe × Reno) e o estimador de RTT |
| 📒 | [DNS](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/dns.html) | Resolução iterativa × recursiva de www.dcc.ufmg.br, com e sem cache |
| 🔐 | [Criptografia](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/criptografia.html) | Diffie-Hellman com o que Trudy vê, e RSA letra a letra com os números do livro |

## 💻 Código

[`codigo/redes2.py`](codigo/redes2.py): Dijkstra, vetor de distância, contagem ao infinito,
hierarquia ótima, baldes de fichas, M/M/1, alocação CIDR, maior prefixo, fragmentação,
RTT, janela de congestionamento, RSA e Diffie-Hellman. Rode `python3 redes2.py`.
