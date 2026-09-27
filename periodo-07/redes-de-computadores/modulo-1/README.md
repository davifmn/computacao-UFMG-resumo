# Redes de Computadores · Módulo 1 (prova 1)

> Tanenbaum & Wetherall, *Computer Networks*, 5ª ed., capítulos 1 a 4.

**Comece pela [revisão da prova 1](tutoriais/revisao-prova-1.html)**: mapa do cronograma,
folha de fórmulas, pegadinhas e um simulado com questões numéricas infinitas.

## 📖 Guias de estudo (um por capítulo)

| Capítulo | Conteúdo | Exercícios do livro resolvidos |
|---|---|---|
| [1 · Introdução](tutoriais/cap1-introducao.html) | Usos, hardware e software de rede, camadas, serviço × protocolo, OSI × TCP/IP, métricas | 1.1, 1.5, 1.6, 1.8–1.12, 1.15–1.17, 1.22, 1.23, 1.27/28 |
| [2 · Camada física](tutoriais/cap2-camada-fisica.html) | Fourier, Nyquist, Shannon, meios guiados e sem fio, satélites, códigos de linha, modulação, FDM/TDM/CDMA, telefonia (PCM, T1, SONET, ADSL), comutação, celular, cabo | 2.2–2.5, 2.7, 2.9, 2.10, 2.12, 2.13, 2.15, 2.16, 2.20, 2.22–2.28, 2.31, 2.34, 2.37–2.40, 2.42–2.49 |
| [3 · Camada de enlace](tutoriais/cap3-camada-de-enlace.html) | Serviços, enquadramento, Hamming, CRC, checksum, protocolos 1–6, janela deslizante, PPP, ADSL/ATM | 3.1–3.12, 3.15–3.18, 3.20, 3.22, 3.24, 3.27, 3.28, 3.31–3.38 |
| [4 · Subcamada MAC](tutoriais/cap4-subcamada-mac.html) | Alocação estática × dinâmica, ALOHA, CSMA/CD, livres de colisão, MACA, Ethernet (clássica a 10G), 802.11, pontes, spanning tree, VLANs | 4.1–4.4, 4.6–4.11, 4.13–4.20, 4.24, 4.25, 4.36–4.41 |

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 📦 | [Encapsulamento](visualizacoes/encapsulamento.html) | Uma requisição HTTP descendo as camadas de A, passando por um roteador e subindo em B |
| 〰️ | [Sinais, Nyquist e Shannon](visualizacoes/sinais.html) | O "b" da Fig. 2-1 reconstruído por harmônicas, o canal telefônico e calculadoras de capacidade |
| 📶 | [Codificação e modulação](visualizacoes/codificacao.html) | NRZ, NRZI, Manchester, AMI, MLT-3, 4B/5B, ASK/FSK/PSK e constelações |
| 🔀 | [Multiplexação e CDMA](visualizacoes/multiplexacao.html) | FDM × TDM × CDMA e a decodificação dos chips da Fig. 2-28 (problemas 2.44 e 2.46) |
| ⏱️ | [Circuitos × pacotes](visualizacoes/comutacao.html) | Linhas do tempo de store-and-forward e o tamanho ótimo de pacote (2.38, 2.39) |
| 🧱 | [Enquadramento](visualizacoes/enquadramento.html) | Contagem de bytes (perda de sincronismo), byte stuffing e bit stuffing |
| 🛡️ | [Detecção de erros](visualizacoes/deteccao-erros.html) | Hamming com síndrome, divisão longa do CRC, checksum e paridade 2D, com bits clicáveis |
| 🪟 | [Janela deslizante](visualizacoes/janela-deslizante.html) | Diagramas de tempo de parar-e-esperar, Go-Back-N e repetição seletiva, com perdas |
| 📡 | [Acesso múltiplo](visualizacoes/acesso-multiplo.html) | Vazão de ALOHA/CSMA, simulador, recuo exponencial, contagem regressiva e árvore |
| 🔌 | [Ethernet e Wi-Fi](visualizacoes/ethernet-wifi.html) | Quadro e enchimento, quadro mínimo, eficiência, terminais oculto e exposto |
| 🌉 | [Pontes e spanning tree](visualizacoes/pontes.html) | Aprendizado reverso na Fig. 4-41(b) (problema 4.38) e árvore geradora |

## 💻 Código

[`codigo/redes.py`](codigo/redes.py): Nyquist, Shannon, CDMA, bit e byte stuffing, Hamming,
CRC, checksum da Internet, janela deslizante, ALOHA e Ethernet em Python puro. Os testes no
final conferem os exemplos e exercícios do livro. Rode `python3 redes.py`.

## Convenções

- **Manchester** segue o livro (Fig. 2-20): 0 = baixo→alto, 1 = alto→baixo (o IEEE 802.3 usa o oposto).
- **Hamming**: bits numerados da esquerda a partir de 1, paridade par, verificação nas potências de 2.
- Nas simulações de janela deslizante, o tempo é medido em tempos de quadro e o produto banda-atraso é $BD = D$.
