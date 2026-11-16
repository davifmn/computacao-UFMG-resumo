# Optativas

Disciplinas fora da grade obrigatória do Bacharelado em Ciência da Computação que fiz ao
longo do curso. Seguem o mesmo formato das obrigatórias: resumo teórico, exercícios com
gabarito, visualizações e os trabalhos práticos entregues, revisados e documentados.

| Disciplina | Páginas interativas | Trabalhos práticos |
|---|---|---|
| [Robótica Móvel](robotica-movel/) | [Mapa de ocupação](https://davifmn.github.io/computacao-UFMG-resumo/optativas/robotica-movel/visualizacoes/mapa-de-ocupacao.html) | TP1 · transformações e cena · TP3 · mapa de ocupação · trabalho final · robô garçom |
| [Computação Paralela](computacao-paralela/) | [Algoritmo de leilão](https://davifmn.github.io/computacao-UFMG-resumo/optativas/computacao-paralela/visualizacoes/leilao.html) | Leilão paralelo para o problema da atribuição (OpenMP) |
| [Computação em Nuvem](computacao-em-nuvem/) | — | Recomendador de playlists no Kubernetes |

## Dicas

- As optativas de robótica usam o CoppeliaSim: instale a versão Edu logo no começo e teste a
  API remota antes do primeiro TP, porque cada versão muda um pouco os nomes dos modelos.
- Em paralelismo, **meça antes de otimizar** e confira a corretude contra a versão
  sequencial: uma versão rápida e errada é fácil de escrever (o verificador do TP de leilão
  achou duas).
- Na nuvem, guarde manifestos e Dockerfiles no Git desde o primeiro dia; com GitOps, o
  histórico do repositório vira o histórico do cluster.
