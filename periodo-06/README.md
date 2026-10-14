# 6º período

O sexto semestre é o mais "de sistemas" do curso: o programa que gerencia todos os outros
(**Sistemas Operacionais**), o programa que traduz todos os outros (**Compiladores I**) e
o que é preciso para construir software de verdade, em equipe e por anos
(**Engenharia de Software**).

| Disciplina | Código | CH | Páginas interativas |
|---|---|---|---|
| [Sistemas Operacionais](sistemas-operacionais/) | DCC605 | 60h | [Escalonamento](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/sistemas-operacionais/visualizacoes/escalonamento.html) · [Concorrência](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/sistemas-operacionais/visualizacoes/concorrencia.html) · [Banqueiro](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/sistemas-operacionais/visualizacoes/banqueiro.html) · [Substituição de páginas](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/sistemas-operacionais/visualizacoes/paginacao.html) |
| [Compiladores I](compiladores-1/) | DCC053 | 60h | [Análise léxica](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/compiladores-1/visualizacoes/analise-lexica.html) · [LL(1)](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/compiladores-1/visualizacoes/analise-ll1.html) · [SLR](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/compiladores-1/visualizacoes/analise-slr.html) · [Geração de código](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/compiladores-1/visualizacoes/geracao-de-codigo.html) |
| [Engenharia de Software](engenharia-de-software/) | DCCXXX* | 60h | [Git por dentro](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/engenharia-de-software/visualizacoes/git.html) · [Testes e cobertura](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/engenharia-de-software/visualizacoes/testes.html) · [Processos (tutorial)](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/engenharia-de-software/tutoriais/processos.html) · [Projeto (tutorial)](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/engenharia-de-software/tutoriais/projeto.html) |

\* Na grade de 2024 o código de Engenharia de Software ainda aparece como "DCCXXX", e a disciplina é marcada como conteúdo extensionista.

## Dicas de quem já passou por aqui

- **Sistemas Operacionais:** os trabalhos são em C, com threads e às vezes dentro de um núcleo didático (xv6). Aprenda a usar `gdb` e o `-fsanitize=thread` antes de precisar. Nas provas, refaça à mão os gráficos de Gantt, as tabelas de páginas e o banqueiro: é conta, não decoreba.
- **Compiladores I:** o trabalho prático é um compilador inteiro, entregue em etapas (léxico, sintático, semântico, código). Comece cedo e escreva testes para cada etapa; um erro no léxico aparece como um bug misterioso três etapas depois. Revise FTC antes.
- **Engenharia de Software:** o livro do prof. Marco Tulio (gratuito) cobre a disciplina inteira. O trabalho em grupo é o próprio conteúdo: use Git com ramos e pull requests, escreva testes e combine uma "definição de pronto" no primeiro dia.
