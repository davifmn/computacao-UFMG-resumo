# 7º período

O sétimo semestre leva a computação para fora de uma única máquina: como os computadores
conversam (**Redes de Computadores**), como coordenar muitos processadores e muitas
máquinas (**Fundamentos de Sistemas Paralelos e Distribuídos**) e como um programa pode
decidir e aprender (**Introdução à Inteligência Artificial**).

| Disciplina | Código | CH | Páginas interativas |
|---|---|---|---|
| [Redes de Computadores](redes-de-computadores/) · Módulo 1 | DCC023 | 60h | Caps. 1 a 4 do Tanenbaum: introdução, camada física, enlace, subcamada MAC. [Revisão da prova 1](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-1/tutoriais/revisao-prova-1.html) |
| [Redes de Computadores](redes-de-computadores/) · Módulo 2 | DCC023 | | Caps. 5 a 8: rede, transporte, aplicação, segurança. [Revisão da prova 2](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/tutoriais/revisao-prova-2.html) · [Roteamento](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/roteamento.html) · [Endereçamento IP](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/enderecamento-ip.html) · [TCP](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/tcp.html) · [DNS](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/dns.html) · [Criptografia](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/redes-de-computadores/modulo-2/visualizacoes/criptografia.html) |
| [Fundamentos de Sistemas Paralelos e Distribuídos](fundamentos-de-sistemas-paralelos-e-distribuidos/) | DCC641 | 30h | [Speedup e DAGs](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/visualizacoes/speedup.html) · [Relógios lógicos](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/visualizacoes/relogios.html) · [Eleição de líder](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/visualizacoes/eleicao.html) · [MapReduce](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos/visualizacoes/mapreduce.html) |
| [Introdução à Inteligência Artificial](introducao-a-inteligencia-artificial/) | DCC642 | 30h | [Busca](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/busca.html) · [Minimax e alfa-beta](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/minimax.html) · [Decisões sob incerteza](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/mdp.html) · [Perceptron e redes neurais](https://davifmn.github.io/computacao-UFMG-resumo/periodo-07/introducao-a-inteligencia-artificial/visualizacoes/redes-neurais.html) |

Ética na Computação (DCC636, 30h) aparece como planejada em [`catalogo.js`](../catalogo.js).

## Dicas de quem já passou por aqui

- **Redes:** as provas são de contas (roteamento, endereçamento, janelas, temporizadores) e de conceitos. Refaça os exercícios resolvidos dos guias e use os simulados; para a prova 2, domine CIDR, maior prefixo, fragmentação, vetor de distância e o controle de congestionamento do TCP.
- **Sistemas Paralelos e Distribuídos:** a disciplina é curta e conceitual. Desenhe diagramas espaço-tempo à mão e treine os relógios de Lamport e vetoriais; pense sempre "e se essa mensagem se perder ou esse processo cair?".
- **Introdução à IA:** simule à mão A* (com a fronteira ordenada), minimax com alfa-beta e algumas iterações de valor: são as questões clássicas de prova.
