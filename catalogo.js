// Catálogo do repositório: fonte única da página inicial.
// Para publicar uma página nova, adicione-a em `visualizacoes` da disciplina.
// Páginas com `tipo: 'tutorial'` ficam em <disciplina>/tutoriais/; as demais em <disciplina>/visualizacoes/.
// Grade: Bacharelado em Ciência da Computação — UFMG, versão 2024.

// URL do repositório no GitHub (ex.: 'https://github.com/usuario/resumao-cc').
// Usada para os links de "resumo teórico" e "código-fonte" na página inicial.
export const REPO = 'https://github.com/davifmn/computacao-UFMG-resumo';

export const PERIODOS = [
  {
    numero: 1,
    id: 'periodo-01',
    disciplinas: [
      {
        id: 'pds1', codigo: 'DCC203', nome: 'Programação e Desenvolvimento de Software I', cor: 'blue',
        pasta: 'periodo-01/programacao-e-desenvolvimento-de-software-1',
        resumo: 'Primeiros passos em C++: variáveis, controle de fluxo, funções, vetores, ponteiros, recursão e algoritmos clássicos.',
        visualizacoes: [
          { titulo: 'Ordenação', arquivo: 'ordenacao.html', descricao: 'Bubble, Selection e Insertion Sort, com cada comparação e troca sincronizadas com o código.' },
          { titulo: 'Busca binária', arquivo: 'busca.html', descricao: 'O intervalo de busca encolhendo pela metade, comparado com a busca sequencial.' },
          { titulo: 'Recursão', arquivo: 'recursao.html', descricao: 'Pilha de chamadas e árvore de recursão para fatorial e Fibonacci (com e sem memoização).' },
          { titulo: 'Ponteiros e memória', arquivo: 'ponteiros.html', descricao: 'Endereços, desreferência, aritmética de ponteiros, heap e ponteiro pendente.' },
        ],
      },
      {
        id: 'logica', codigo: 'DCC638', nome: 'Introdução à Lógica Computacional', cor: 'purple',
        pasta: 'periodo-01/introducao-a-logica-computacional',
        resumo: 'Lógica proposicional: sintaxe, semântica, tabelas-verdade, equivalências, formas normais e SAT.',
        visualizacoes: [
          { titulo: 'Tabela-verdade', arquivo: 'tabela-verdade.html', descricao: 'Digite qualquer fórmula e veja a árvore sintática ser avaliada, com FND/FNC e exercícios gerados.' },
        ],
      },
      {
        id: 'intro-comp', codigo: 'DCC · 30h', nome: 'Introdução à Computação', cor: 'teal',
        pasta: 'periodo-01/introducao-a-computacao',
        resumo: 'Como o computador representa informação: bases numéricas, inteiros com sinal e ponto flutuante.',
        visualizacoes: [
          { titulo: 'Mudança de base', arquivo: 'bases.html', descricao: 'Divisões sucessivas e método de Horner, passo a passo, com exercícios infinitos.' },
          { titulo: 'Complemento de dois', arquivo: 'inteiros.html', descricao: 'Registrador clicável, roda dos números e overflow na soma.' },
          { titulo: 'Ponto flutuante', arquivo: 'ponto-flutuante.html', descricao: 'IEEE 754 bit a bit e o valor exato guardado (por que 0,1 + 0,2 ≠ 0,3).' },
        ],
      },
      {
        id: 'gaal', codigo: 'MAT038', nome: 'Geometria Analítica e Álgebra Linear', cor: 'yellow',
        pasta: 'periodo-01/geometria-analitica-e-algebra-linear',
        resumo: 'Vetores, matrizes como transformações, determinantes, sistemas lineares e autovetores.',
        visualizacoes: [
          { titulo: 'Transformações lineares', arquivo: 'transformacoes.html', descricao: 'O plano inteiro se deformando: base, determinante como área e autovetores.' },
          { titulo: 'Vetores', arquivo: 'vetores.html', descricao: 'Arraste vetores: soma, produto escalar, projeção, combinação linear e span.' },
          { titulo: 'Eliminação gaussiana', arquivo: 'gauss.html', descricao: 'Gauss-Jordan com frações exatas e classificação SPD/SPI/SI.' },
        ],
      },
      {
        id: 'economia', codigo: 'ECN140', nome: 'Introdução à Economia', cor: 'pink',
        pasta: 'periodo-01/introducao-a-economia',
        resumo: 'Microeconomia básica: oferta, demanda, equilíbrio, elasticidade, excedentes e intervenções.',
        visualizacoes: [
          { titulo: 'Oferta e demanda', arquivo: 'oferta-e-demanda.html', descricao: 'Choques de mercado, impostos, preço máximo e mínimo, com excedentes e peso morto.' },
        ],
      },
    ],
  },
  {
    numero: 2,
    id: 'periodo-02',
    disciplinas: [
      {
        id: 'pds2', codigo: 'DCC219', nome: 'Programação e Desenvolvimento de Software II', cor: 'blue',
        pasta: 'periodo-02/programacao-e-desenvolvimento-de-software-2',
        resumo: 'Orientação a objetos em C++: classes, herança, polimorfismo, templates, exceções, RAII, testes e projetos com vários arquivos.',
        visualizacoes: [
          { titulo: 'Polimorfismo e vtable', arquivo: 'polimorfismo.html', descricao: 'Como f->area() descobre qual função chamar: vptr, vtable e o destrutor virtual.' },
          { titulo: 'std::vector por dentro', arquivo: 'vetor.html', descricao: 'Realocação e cópia a cada push_back: dobrar a capacidade × somar 1, com gráfico de custo amortizado.' },
          { titulo: 'Projeto C++ do zero', arquivo: 'projeto-cpp.html', tipo: 'tutorial', descricao: 'Estrutura de pastas, .hpp × .cpp, Makefile linha a linha, testes, RAII, depuração e git.' },
        ],
      },
      {
        id: 'sistemas-logicos', codigo: 'DCC114', nome: 'Introdução a Sistemas Lógicos', cor: 'green',
        pasta: 'periodo-02/introducao-a-sistemas-logicos',
        resumo: 'Álgebra booleana, portas lógicas, circuitos combinacionais, minimização e circuitos sequenciais.',
        visualizacoes: [
          { titulo: 'Simulador de circuitos', arquivo: 'circuitos.html', descricao: 'Clique nas entradas e veja o sinal atravessar portas, somadores, mux e decodificador.' },
          { titulo: 'Mapa de Karnaugh', arquivo: 'karnaugh.html', descricao: 'Clique nas células e veja os agrupamentos e a expressão mínima (Quine–McCluskey), com exercícios gerados.' },
          { titulo: 'Circuitos sequenciais', arquivo: 'sequenciais.html', descricao: 'Latch SR, latch D × flip-flop D num diagrama de tempo editável e contador síncrono.' },
        ],
      },
      {
        id: 'discreta', codigo: 'DCC216', nome: 'Matemática Discreta', cor: 'purple',
        pasta: 'periodo-02/matematica-discreta',
        resumo: 'Teoria dos números, aritmética modular, relações, contagem, indução e recorrências.',
        visualizacoes: [
          { titulo: 'De Euclides ao RSA', arquivo: 'teoria-dos-numeros.html', descricao: 'Euclides estendido como ladrilhamento, tabela mod n e um RSA de brinquedo que cifra sua mensagem.' },
          { titulo: 'Relações', arquivo: 'relacoes.html', descricao: 'Matriz × grafo, propriedades com contraexemplos e o fecho transitivo de Warshall passo a passo.' },
          { titulo: 'Contagem', arquivo: 'contagem.html', descricao: 'Os quatro modos de escolher com tudo listado, triângulo de Pascal (e Sierpinski) e exercícios.' },
          { titulo: 'Indução e recorrência', arquivo: 'inducao-e-recorrencia.html', descricao: 'Torre de Hanói com a pilha de chamadas, a recorrência T(n) = 2T(n−1) + 1 e sua prova por indução.' },
        ],
      },
      {
        id: 'calculo1', codigo: 'MAT001', nome: 'Cálculo Diferencial e Integral I', cor: 'yellow',
        pasta: 'periodo-02/calculo-diferencial-e-integral-1',
        resumo: 'Limites, continuidade, derivadas e suas aplicações, integrais e o Teorema Fundamental do Cálculo.',
        visualizacoes: [
          { titulo: 'Limites (ε-δ)', arquivo: 'limites.html', descricao: 'O jogo do épsilon e do delta: ache um δ que funcione (ou descubra que o limite não existe).' },
          { titulo: 'Derivada', arquivo: 'derivada.html', descricao: 'Secante virando tangente quando h → 0, gráfico de f′ e derivada simbólica de qualquer função.' },
          { titulo: 'Integral', arquivo: 'integral.html', descricao: 'Somas de Riemann (esquerda, direita, ponto médio, trapézio) e a velocidade de convergência de cada uma.' },
        ],
      },
      {
        id: 'tga', codigo: 'CAD103', nome: 'Administração TGA (EAD)', cor: 'orange',
        pasta: 'periodo-02/administracao-tga',
        resumo: 'Teoria Geral da Administração: escolas, processo administrativo, motivação e ferramentas de gestão.',
        visualizacoes: [
          { titulo: 'Escolas da administração', arquivo: 'escolas-da-administracao.html', tipo: 'tutorial', descricao: 'Linha do tempo interativa de Taylor à Contingência, PODC, PDCA, SWOT e motivação, com exercícios.' },
        ],
      },
    ],
  },
  {
    numero: 3,
    id: 'periodo-03',
    disciplinas: [
      {
        id: 'ed', codigo: 'DCC221', nome: 'Estruturas de Dados', cor: 'blue',
        pasta: 'periodo-03/estruturas-de-dados',
        resumo: 'Complexidade, TADs, listas, pilhas, filas, árvores de busca e AVL, heaps, ordenação e hashing.',
        visualizacoes: [
          { titulo: 'Listas encadeadas', arquivo: 'listas.html', descricao: 'Inserir, buscar e remover com os ponteiros cabeca, atual, anterior e novo se movendo linha a linha.' },
          { titulo: 'Pilhas e filas', arquivo: 'pilha-fila.html', descricao: 'Pilha em vetor, fila circular desenhada como anel e a checagem de parênteses balanceados.' },
          { titulo: 'Árvores de busca e AVL', arquivo: 'arvores.html', descricao: 'Inserção, remoção, percursos e as rotações da AVL, com os nós trocando de lugar.' },
          { titulo: 'Ordenação O(n log n)', arquivo: 'ordenacao-avancada.html', descricao: 'Merge sort com vetor auxiliar, quicksort com partição e heapsort com o heap em árvore.' },
          { titulo: 'Tabelas hash', arquivo: 'hash.html', descricao: 'Colisões, encadeamento × sondagem linear, agrupamento e marcas de remoção.' },
        ],
      },
      {
        id: 'bd', codigo: 'DCC222', nome: 'Introdução a Bancos de Dados', cor: 'teal',
        pasta: 'periodo-03/introducao-a-bancos-de-dados',
        resumo: 'Modelo ER e relacional, álgebra relacional, SQL, normalização, transações e índices.',
        visualizacoes: [
          { titulo: 'SQL na prática', arquivo: 'sql.html', tipo: 'tutorial', descricao: 'SQLite de verdade no navegador: exemplos executáveis e 12 exercícios corrigidos automaticamente.' },
          { titulo: 'Como um JOIN funciona', arquivo: 'joins.html', descricao: 'Laços aninhados passo a passo para INNER, LEFT, RIGHT e FULL JOIN, e o NULL.' },
        ],
      },
      {
        id: 'alc', codigo: 'DCC639', nome: 'Álgebra Linear Computacional', cor: 'yellow',
        pasta: 'periodo-03/algebra-linear-computacional',
        resumo: 'Condicionamento, fatorações, mínimos quadrados, autovalores e SVD no computador.',
        visualizacoes: [
          { titulo: 'Mínimos quadrados', arquivo: 'minimos-quadrados.html', descricao: 'Arraste pontos: ajuste polinomial pelas equações normais, resíduos e sobreajuste.' },
          { titulo: 'PageRank', arquivo: 'pagerank.html', descricao: 'Crie links entre páginas e veja o método das potências achar o autovetor do Google.' },
          { titulo: 'Compressão com SVD', arquivo: 'svd.html', descricao: 'Uma imagem (até a sua) reconstruída com as k primeiras camadas da SVD.' },
        ],
      },
      {
        id: 'calculo2', codigo: 'MAT039', nome: 'Cálculo Diferencial e Integral II', cor: 'purple',
        pasta: 'periodo-03/calculo-diferencial-e-integral-2',
        resumo: 'Séries, funções de várias variáveis, derivadas parciais, gradiente, otimização e integrais múltiplas.',
        visualizacoes: [
          { titulo: 'Séries de Taylor', arquivo: 'taylor.html', descricao: 'Polinômios de grau crescente imitando funções, e o raio de convergência.' },
          { titulo: 'Superfícies e derivadas parciais', arquivo: 'superficies.html', descricao: 'Superfícies 3D que giram com o mouse, cortes, plano tangente e gradiente.' },
          { titulo: 'Descida do gradiente', arquivo: 'gradiente.html', descricao: 'Trajetórias sobre curvas de nível, passo, momento e mínimos locais: como redes neurais aprendem.' },
        ],
      },
      {
        id: 'probabilidade', codigo: 'EST032', nome: 'Probabilidade', cor: 'pink',
        pasta: 'periodo-03/probabilidade',
        resumo: 'Probabilidade condicional, Bayes, variáveis aleatórias, distribuições e teoremas-limite.',
        visualizacoes: [
          { titulo: 'Distribuições', arquivo: 'distribuicoes.html', descricao: 'Seis distribuições com parâmetros, áreas, momentos e amostragem sobre a curva teórica.' },
          { titulo: 'Teorema Central do Limite', arquivo: 'limite-central.html', descricao: 'Tábua de Galton, médias virando uma normal e a Lei dos Grandes Números.' },
          { titulo: 'Bayes e Monty Hall', arquivo: 'bayes.html', descricao: 'O teste diagnóstico com 1000 pessoas e o problema das três portas, jogável.' },
        ],
      },
    ],
  },
  { numero: 4, id: 'periodo-04', planejadas: ['Algoritmos I', 'Organização de Computadores I', 'Fundamentos da Teoria da Computação', 'Álgebra A', 'Introdução à Ciência dos Dados'] },
  { numero: 5, id: 'periodo-05', planejadas: ['Algoritmos II', 'Linguagens de Programação', 'Pesquisa Operacional', 'Equações Diferenciais C'] },
  { numero: 6, id: 'periodo-06', planejadas: ['Engenharia de Software', 'Sistemas Operacionais', 'Compiladores I'] },
  { numero: 7, id: 'periodo-07', planejadas: ['Ética na Computação', 'Redes de Computadores', 'Fundamentos de Sistemas Paralelos e Distribuídos', 'Introdução à Inteligência Artificial'] },
  { numero: 8, id: 'periodo-08', planejadas: ['Computação e Sociedade'] },
  { numero: 9, id: 'periodo-09', planejadas: ['Projeto Orientado em Computação I'] },
  { numero: 10, id: 'periodo-10', planejadas: ['Projeto Orientado em Computação II'] },
];
