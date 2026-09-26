<div align="center">

# Resumão de Ciência da Computação · UFMG

**A graduação inteira, para ver funcionando.**

Visualizações interativas, código real e exercícios para cada disciplina do
[Bacharelado em Ciência da Computação da UFMG](https://dcc.ufmg.br/estrutura-curricular-do-bacharelado-em-ciencia-da-computacao/),
no espírito do [3Blue1Brown](https://www.youtube.com/@3blue1brown).

[![CI](https://github.com/davifmn/computacao-UFMG-resumo/actions/workflows/ci.yml/badge.svg)](https://github.com/davifmn/computacao-UFMG-resumo/actions/workflows/ci.yml)

**[▶ Abrir o site](https://davifmn.github.io/computacao-UFMG-resumo/)**

</div>

---

## A ideia

Ler "a busca binária descarta metade do vetor a cada passo" é uma coisa. **Ver** o
intervalo encolhendo, com a linha do código acendendo e as variáveis `ini`, `fim` e
`meio` mudando, é outra. Cada tópico deste repositório tem três camadas:

| Camada | O que é | Onde fica |
|---|---|---|
| **Visualização** | Página interativa: animação + código com a linha em execução + variáveis + narração. Avance, volte, pause (<kbd>←</kbd> <kbd>→</kbd> <kbd>espaço</kbd>). | `periodo-XX/<disciplina>/visualizacoes/` |
| **Tutorial** | Para temas que pedem texto guiado em vez de animação (ex.: montar um projeto C++, teorias da administração), com código real embutido e exercícios. | `periodo-XX/<disciplina>/tutoriais/` |
| **Resumo teórico** | O essencial da disciplina: definições, fórmulas, intuições e armadilhas. | `periodo-XX/<disciplina>/README.md` |
| **Código e exercícios** | Implementações em C++/Python que compilam e se testam sozinhas, exercícios com gabarito e geradores de questões. | `codigo/` e o próprio README |

## Como usar

**Online:** **https://davifmn.github.io/computacao-UFMG-resumo/**, sem instalar nada.

O site foi feito para telas de computador.

**Localmente** (não há nada para instalar, são só arquivos estáticos):

```bash
git clone https://github.com/davifmn/computacao-UFMG-resumo.git
cd computacao-UFMG-resumo
python3 -m http.server 8000     # ou: npx serve
# abra http://localhost:8000
```

> As páginas usam módulos JavaScript (`import`), que o navegador bloqueia quando o
> arquivo é aberto direto do disco (`file://`). Por isso é preciso um servidor local,
> e qualquer um serve.

## Conteúdo

### 1º período

| Disciplina | Visualizações | Código |
|---|---|---|
| [Programação e Desenvolvimento de Software I](periodo-01/programacao-e-desenvolvimento-de-software-1/) · DCC203 | Ordenação · Busca binária · Recursão · Ponteiros | C++ |
| [Introdução à Lógica Computacional](periodo-01/introducao-a-logica-computacional/) · DCC638 | Tabela-verdade e árvore sintática | Python (inclui SAT/DPLL) |
| [Introdução à Computação](periodo-01/introducao-a-computacao/) | Mudança de base · Complemento de dois · Ponto flutuante | Python |
| [Geometria Analítica e Álgebra Linear](periodo-01/geometria-analitica-e-algebra-linear/) · MAT038 | Transformações lineares · Vetores · Eliminação gaussiana | Python |
| [Introdução à Economia](periodo-01/introducao-a-economia/) · ECN140 | Oferta, demanda e intervenções | — |

### 2º período

| Disciplina | Páginas interativas | Código |
|---|---|---|
| [Programação e Desenvolvimento de Software II](periodo-02/programacao-e-desenvolvimento-de-software-2/) · DCC219 | Polimorfismo e vtable · `std::vector` por dentro · **Tutorial:** projeto C++ do zero | C++ (projeto com Makefile e testes) |
| [Introdução a Sistemas Lógicos](periodo-02/introducao-a-sistemas-logicos/) · DCC114 | Simulador de circuitos · Mapa de Karnaugh · Circuitos sequenciais | Python |
| [Matemática Discreta](periodo-02/matematica-discreta/) · DCC216 | Euclides → RSA · Relações e Warshall · Contagem e Pascal · Indução (Hanói) | Python |
| [Cálculo Diferencial e Integral I](periodo-02/calculo-diferencial-e-integral-1/) · MAT001 | Limites ε-δ · Derivada (com derivação simbólica) · Integral de Riemann | Python |
| [Administração TGA](periodo-02/administracao-tga/) · CAD103 | **Tutorial:** escolas da administração | — |

### 3º período

| Disciplina | Páginas interativas | Código |
|---|---|---|
| [Estruturas de Dados](periodo-03/estruturas-de-dados/) · DCC221 | Listas · Pilhas e filas · Árvores e AVL · Ordenação O(n log n) · Hash | C++ |
| [Introdução a Bancos de Dados](periodo-03/introducao-a-bancos-de-dados/) · DCC222 | **Tutorial:** SQL no navegador · JOINs | Python + SQLite |
| [Álgebra Linear Computacional](periodo-03/algebra-linear-computacional/) · DCC639 | Mínimos quadrados · PageRank · SVD | Python |
| [Cálculo Diferencial e Integral II](periodo-03/calculo-diferencial-e-integral-2/) · MAT039 | Taylor · Superfícies 3D · Descida do gradiente | Python |
| [Probabilidade](periodo-03/probabilidade/) · EST032 | Distribuições · TCL e Galton · Bayes e Monty Hall | Python |

### Próximos períodos

Os períodos 4 a 10 estão listados em [`catalogo.js`](catalogo.js) e aparecem como
"em construção" no site. Ideias já planejadas: grafos, BFS/DFS e Dijkstra (Algoritmos I), autômatos (FTC), escalonamento de processos (SO)...

## Estrutura do repositório

```
.
├── index.html                  # página inicial (gerada a partir do catálogo)
├── catalogo.js                 # lista de períodos, disciplinas e visualizações
├── engine/                     # o "motor" compartilhado por todas as visualizações
│   ├── player.js               #   player passo a passo (código + animação + variáveis)
│   ├── scene.js                #   cena SVG com animação automática entre estados
│   ├── plot.js                 #   plano cartesiano e gráficos de funções
│   ├── highlight.js            #   realce de sintaxe C++/Python
│   ├── quiz.js                 #   exercícios e geradores de exercícios
│   ├── page.js                 #   utilitários (KaTeX, DOM, formatação)
│   └── theme.css               #   identidade visual
├── periodo-01/
│   ├── README.md
│   └── <disciplina>/
│       ├── README.md           #   resumo teórico + exercícios
│       ├── codigo/             #   implementações testáveis (C++/Python)
│       ├── visualizacoes/      #   páginas .html + lógica .js (pura e testada)
│       └── tutoriais/          #   páginas-tutorial (quando fizer mais sentido que animação)
└── tests/                      # testes automatizados da lógica das visualizações
```

## Como funciona o motor

Um algoritmo vira uma **lista de passos**, e cada passo é uma "fotografia" do estado:

```js
steps.push({
  line: L('if (v[j] > v[j + 1])'),     // linha do código em execução (achada pelo texto)
  msg: 'Compara <b>v[2]</b> com <b>v[3]</b>',
  vars: { i, j },                      // painel de variáveis
  items: vetor.map(x => ({ ...x })),   // estado que o render vai desenhar
});
```

A função `render(step, scene)` descreve **como a tela deve estar** naquele passo. A
cena compara com o quadro anterior pela chave de cada forma e anima sozinha o que
mudou, no mesmo modelo do React. Por isso a lógica de cada visualização é uma função
pura, fácil de testar, e o desenho é declarativo. Veja o [guia de contribuição](CONTRIBUTING.md)
para criar uma visualização nova em ~100 linhas.

## Testes

```bash
npm test            # testes da lógica das visualizações (node --test, sem dependências)
make -C periodo-01/programacao-e-desenvolvimento-de-software-1/codigo test   # exemplos C++
python3 periodo-01/introducao-a-logica-computacional/codigo/logica.py        # exemplos Python
```

A integração contínua (`.github/workflows/ci.yml`) roda tudo isso a cada push.

## Publicando no GitHub Pages

1. Crie o repositório no GitHub e envie o código (`git push`).
2. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
3. O workflow `.github/workflows/pages.yml` publica o site a cada push na `main`.
4. Preencha `REPO` em [`catalogo.js`](catalogo.js) com a URL do repositório, para que os
   links "resumo teórico" e "código-fonte" do site apontem para o GitHub.

## Contribuindo

Contribuições de alunos e ex-alunos são muito bem-vindas: correções, novas
visualizações, exercícios, disciplinas optativas. Leia o [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

Código sob a [licença MIT](LICENSE) © Davi Fraga. Textos e explicações podem ser
reutilizados com atribuição.
