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
  {
    numero: 4,
    id: 'periodo-04',
    disciplinas: [
      {
        id: 'alg1', codigo: 'DCC206', nome: 'Algoritmos I', cor: 'blue',
        pasta: 'periodo-04/algoritmos-1',
        resumo: 'Grafos (buscas, caminhos mínimos, árvore geradora), algoritmos gulosos, divisão e conquista e programação dinâmica.',
        visualizacoes: [
          { titulo: 'BFS, DFS e ordenação topológica', arquivo: 'busca-em-grafos.html', descricao: 'A fila da BFS e a pilha da DFS, tempos d/f, classificação de arestas e a ordem de se vestir.' },
          { titulo: 'Caminhos mínimos', arquivo: 'caminhos-minimos.html', descricao: 'Dijkstra com a fila de prioridade, Bellman-Ford rodada a rodada e o grafo em que Dijkstra erra.' },
          { titulo: 'Árvore geradora mínima', arquivo: 'arvore-geradora.html', descricao: 'Kruskal com a união-busca colorida e Prim crescendo a partir da raiz.' },
          { titulo: 'Programação dinâmica', arquivo: 'programacao-dinamica.html', descricao: 'Mochila 0/1, LCS e distância de edição: a tabela, as dependências e a reconstrução.' },
          { titulo: 'Teorema mestre', arquivo: 'divisao-e-conquista.html', descricao: 'A árvore de recursão de aT(n/b) + nᶜ e o custo de cada nível: raiz, folhas ou empate.' },
        ],
      },
      {
        id: 'oc1', codigo: 'DCC006', nome: 'Organização de Computadores I', cor: 'green',
        pasta: 'periodo-04/organizacao-de-computadores-1',
        resumo: 'Linguagem de máquina RISC-V, caminho de dados e controle, pipeline e hierarquia de memória.',
        visualizacoes: [
          { titulo: 'Caminho de dados RISC-V', arquivo: 'caminho-de-dados.html', descricao: 'Simulador monociclo: fios e sinais de controle de cada instrução, registradores, memória e codificação.' },
          { titulo: 'Pipeline', arquivo: 'pipeline.html', descricao: 'Diagrama de ciclos com bolhas, adiantamento, load-use e descarte depois de desvios.' },
          { titulo: 'Memória cache', arquivo: 'cache.html', descricao: 'Tag, índice e deslocamento; acertos e faltas em caches diretas e associativas, LRU e os 3 Cs.' },
        ],
      },
      {
        id: 'ftc', codigo: 'DCC129', nome: 'Fundamentos da Teoria da Computação', cor: 'purple',
        pasta: 'periodo-04/fundamentos-da-teoria-da-computacao',
        resumo: 'Autômatos finitos, expressões regulares, gramáticas e autômatos de pilha, máquinas de Turing e indecidibilidade.',
        visualizacoes: [
          { titulo: 'Autômatos finitos', arquivo: 'automatos-finitos.html', descricao: 'AFD e AFN lendo palavras, construção de subconjuntos e minimização.' },
          { titulo: 'Expressões regulares', arquivo: 'expressoes-regulares.html', descricao: 'A construção de Thompson peça por peça e o AFN resultante testando palavras.' },
          { titulo: 'Autômato de pilha', arquivo: 'automato-de-pilha.html', descricao: 'aⁿbⁿ, parênteses balanceados e wcwᴿ com a pilha crescendo e encolhendo.' },
          { titulo: 'Máquina de Turing', arquivo: 'maquina-de-turing.html', descricao: 'Fita, cabeçote e tabela de transições para incremento binário, aⁿbⁿcⁿ e palíndromos.' },
        ],
      },
      {
        id: 'algebra', codigo: 'MAT034', nome: 'Álgebra A', cor: 'yellow',
        pasta: 'periodo-04/algebra-a',
        resumo: 'Inteiros e congruências, Teorema Chinês do Resto, grupos, subgrupos, Lagrange, permutações, anéis e corpos.',
        visualizacoes: [
          { titulo: 'Grupos e simetrias', arquivo: 'grupos.html', descricao: 'Tabelas de Cayley de ℤₙ, ℤₙ×, Dₙ e Sₙ, subgrupos, classes laterais e o polígono girando.' },
          { titulo: 'Permutações', arquivo: 'permutacoes.html', descricao: 'Composição, ciclos, ordem, sinal e o embaralhamento perfeito que volta em 8 passos.' },
          { titulo: 'Teorema Chinês do Resto', arquivo: 'teorema-chines.html', descricao: 'A trilha de x ↦ (x mod m, x mod n) cobrindo a grade, a solução e φ(mn) = φ(m)φ(n).' },
        ],
      },
      {
        id: 'icd', codigo: 'DCC212', nome: 'Introdução à Ciência dos Dados', cor: 'teal',
        pasta: 'periodo-04/introducao-a-ciencia-dos-dados',
        resumo: 'Análise exploratória, bootstrap, testes de hipótese, regressão, classificação e sobreajuste.',
        visualizacoes: [
          { titulo: 'Bootstrap', arquivo: 'bootstrap.html', descricao: 'Reamostras com reposição formando a distribuição da média e o intervalo de confiança.' },
          { titulo: 'Teste A/B por permutação', arquivo: 'teste-ab.html', descricao: 'Rótulos embaralhados, a distribuição sob H₀, valor-p, erro tipo I e poder.' },
          { titulo: 'Correlação e regressão', arquivo: 'correlacao.html', descricao: 'O paradoxo de Simpson e o quarteto de Anscombe.' },
          { titulo: 'k vizinhos e sobreajuste', arquivo: 'knn.html', descricao: 'Regiões de decisão do k-NN e a curva de acurácia de treino × teste.' },
        ],
      },
    ],
  },
  {
    numero: 5,
    id: 'periodo-05',
    disciplinas: [
      {
        id: 'alg2', codigo: 'DCC207', nome: 'Algoritmos II', cor: 'blue',
        pasta: 'periodo-05/algoritmos-2',
        resumo: 'Processamento de cadeias (casamento de padrões e compressão), geometria computacional, NP-completude e algoritmos aproximativos.',
        visualizacoes: [
          { titulo: 'Casamento de padrões', arquivo: 'casamento-de-padroes.html', descricao: 'Força bruta, KMP com a função de falha e Horspool com a tabela de saltos, contando comparações.' },
          { titulo: 'Compressão', arquivo: 'compressao.html', descricao: 'A floresta de Huffman se fundindo em árvore de códigos e o dicionário do LZW crescendo.' },
          { titulo: 'Envoltória convexa', arquivo: 'envoltoria-convexa.html', descricao: 'Cadeia monótona de Andrew e embrulho de Jarvis, com o teste de orientação; clique para pôr pontos.' },
          { titulo: 'NP-completude e aproximação', arquivo: 'aproximacao.html', descricao: '2-aproximações para cobertura por vértices e caixeiro métrico, comparadas com o ótimo.' },
        ],
      },
      {
        id: 'lp', codigo: 'DCC024', nome: 'Linguagens de Programação', cor: 'purple',
        pasta: 'periodo-05/linguagens-de-programacao',
        resumo: 'Sintaxe e semântica, escopo e registros de ativação, tipos e inferência, programação funcional (cálculo lambda, ML) e lógica (Prolog).',
        visualizacoes: [
          { titulo: 'Cálculo lambda', arquivo: 'calculo-lambda.html', descricao: 'Reduções β passo a passo em ordem normal e aplicativa, numerais de Church e o combinador Y.' },
          { titulo: 'Inferência de tipos', arquivo: 'inferencia-de-tipos.html', descricao: 'Hindley-Milner na árvore do programa: variáveis de tipo, unificação e let polimórfico.' },
          { titulo: 'Escopo e parâmetros', arquivo: 'escopo-e-parametros.html', descricao: 'Pilha de registros com elos estático e dinâmico; passagem por valor, referência, valor-resultado e nome.' },
          { titulo: 'Prolog', arquivo: 'prolog.html', descricao: 'A árvore de busca SLD com unificação, retrocesso, append ao contrário e recursão à esquerda.' },
        ],
      },
      {
        id: 'po', codigo: 'DCC035', nome: 'Pesquisa Operacional', cor: 'green',
        pasta: 'periodo-05/pesquisa-operacional',
        resumo: 'Modelagem e programação linear, método simplex, dualidade e sensibilidade, programação inteira e fluxos em redes.',
        visualizacoes: [
          { titulo: 'Método gráfico', arquivo: 'metodo-grafico.html', descricao: 'Região viável, curvas de nível e preços-sombra: mexa nos lucros e recursos e veja o ótimo pular.' },
          { titulo: 'Simplex', arquivo: 'simplex.html', descricao: 'O tableau pivô a pivô ao lado do caminho de vértice em vértice.' },
          { titulo: 'Branch and bound', arquivo: 'branch-and-bound.html', descricao: 'A árvore de ramificação e a região fatiada, com as três podas.' },
          { titulo: 'Fluxo máximo', arquivo: 'fluxo-maximo.html', descricao: 'Edmonds-Karp com caminhos aumentantes, arestas ao contrário e o corte mínimo.' },
        ],
      },
      {
        id: 'edc', codigo: 'MAT040', nome: 'Equações Diferenciais C', cor: 'yellow',
        pasta: 'periodo-05/equacoes-diferenciais-c',
        resumo: 'EDOs de 1ª ordem, lineares de 2ª ordem, vibrações, sistemas lineares, transformada de Laplace e métodos numéricos.',
        visualizacoes: [
          { titulo: 'Campo de direções', arquivo: 'campo-de-direcoes.html', descricao: 'Inclinações, existência e unicidade, e Euler × Heun × RK4 com a ordem de convergência medida.' },
          { titulo: 'Oscilador massa-mola', arquivo: 'oscilador.html', descricao: 'Amortecimento sub, crítico e super, batimentos, ressonância e a curva de resposta A(ω).' },
          { titulo: 'Plano de fase', arquivo: 'plano-de-fase.html', descricao: 'Partículas seguindo x\' = Ax, autovetores e o diagrama traço-determinante.' },
          { titulo: 'Treino para as provas', arquivo: 'treino.html', descricao: 'Trilhas teoria → exemplo → exercícios, questões infinitas com correção de fórmulas, folha de fórmulas ao lado, cores que acompanham cada objeto, níveis de domínio e simulado.' },
          { titulo: 'Guia da prova', arquivo: 'guia-da-prova.html', tipo: 'tutorial', descricao: 'O que cai em cada prova, receitas por tipo de questão e as listas 1 a 4 resolvidas e conferidas.' },
        ],
      },
    ],
  },
  {
    numero: 6,
    id: 'periodo-06',
    disciplinas: [
      {
        id: 'so', codigo: 'DCC605', nome: 'Sistemas Operacionais', cor: 'blue',
        pasta: 'periodo-06/sistemas-operacionais',
        resumo: 'Processos e threads, escalonamento, sincronização, deadlock, memória virtual e sistemas de arquivos.',
        visualizacoes: [
          { titulo: 'Escalonamento de CPU', arquivo: 'escalonamento.html', descricao: 'FCFS, SJF, SRTF, prioridade e Round-Robin com a fila de prontos e o gráfico de Gantt.' },
          { titulo: 'Concorrência', arquivo: 'concorrencia.html', descricao: 'Você escolhe a intercalação: condição de corrida, mutex, semáforos, deadlock e todas as execuções possíveis.' },
          { titulo: 'Deadlock e banqueiro', arquivo: 'banqueiro.html', descricao: 'O teste de estado seguro passo a passo e pedidos concedidos, adiados ou recusados.' },
          { titulo: 'Substituição de páginas', arquivo: 'paginacao.html', descricao: 'FIFO, LRU, ótimo e relógio, e o gráfico de faltas que mostra a anomalia de Belady.' },
        ],
      },
      {
        id: 'comp', codigo: 'DCC053', nome: 'Compiladores I', cor: 'purple',
        pasta: 'periodo-06/compiladores-1',
        resumo: 'Análise léxica e sintática (LL e LR), análise semântica, código intermediário e noções de otimização.',
        visualizacoes: [
          { titulo: 'Análise léxica', arquivo: 'analise-lexica.html', descricao: 'O AFD do scanner lendo o programa, maior casamento e palavras reservadas.' },
          { titulo: 'Análise LL(1)', arquivo: 'analise-ll1.html', descricao: 'FIRST, FOLLOW, tabela preditiva com conflitos e a árvore crescendo de cima para baixo.' },
          { titulo: 'Análise SLR', arquivo: 'analise-slr.html', descricao: 'Itens LR(0), tabela ACTION/GOTO e empilha-reduz construindo a árvore de baixo para cima.' },
          { titulo: 'Geração de código', arquivo: 'geracao-de-codigo.html', descricao: 'Da árvore sintática a código de três endereços ou de pilha, com dobramento de constantes.' },
        ],
      },
      {
        id: 'es', codigo: 'DCC · 60h', nome: 'Engenharia de Software', cor: 'green',
        pasta: 'periodo-06/engenharia-de-software',
        resumo: 'Processos ágeis, requisitos, projeto (SOLID e padrões), testes, refatoração, Git e DevOps.',
        visualizacoes: [
          { titulo: 'Git por dentro', arquivo: 'git.html', descricao: 'Um terminal Git desenhando o grafo de commits: ramos, HEAD, merge, rebase, reset e revert.' },
          { titulo: 'Testes e cobertura', arquivo: 'testes.html', descricao: 'Monte uma suíte e veja cobertura de comandos e ramos e quantos mutantes ela mata.' },
          { titulo: 'Processos de software', arquivo: 'processos.html', tipo: 'tutorial', descricao: 'Cascata, Manifesto Ágil, Scrum, XP, Kanban e DevOps, com um burndown interativo.' },
          { titulo: 'Projeto de software', arquivo: 'projeto.html', tipo: 'tutorial', descricao: 'Coesão, acoplamento, SOLID, padrões de projeto e refatoração, com código testado.' },
        ],
      },
    ],
  },
  {
    numero: 7,
    id: 'periodo-07',
    disciplinas: [
      {
        id: 'redes1', codigo: 'DCC023', nome: 'Redes de Computadores · Módulo 1 (prova 1)', cor: 'blue',
        pasta: 'periodo-07/redes-de-computadores/modulo-1',
        resumo: 'Tanenbaum, caps. 1 a 4: modelos de camadas, camada física, enlace (enquadramento, erros, janela deslizante) e subcamada MAC (ALOHA, CSMA, Ethernet, 802.11, pontes).',
        visualizacoes: [
          { titulo: 'Revisão da prova 1', arquivo: 'revisao-prova-1.html', tipo: 'tutorial', descricao: 'Mapa do cronograma, folha de fórmulas, pegadinhas e simulado com questões numéricas infinitas.' },
          { titulo: 'Cap. 1 · Introdução', arquivo: 'cap1-introducao.html', tipo: 'tutorial', descricao: 'Usos, hardware e software de rede, OSI × TCP/IP, métricas; exercícios do livro resolvidos.' },
          { titulo: 'Cap. 2 · Camada física', arquivo: 'cap2-camada-fisica.html', tipo: 'tutorial', descricao: 'Nyquist, Shannon, meios, modulação, multiplexação, telefonia, comutação; exercícios resolvidos.' },
          { titulo: 'Cap. 3 · Camada de enlace', arquivo: 'cap3-camada-de-enlace.html', tipo: 'tutorial', descricao: 'Enquadramento, Hamming, CRC, parar-e-esperar, Go-Back-N, repetição seletiva, PPP; exercícios resolvidos.' },
          { titulo: 'Cap. 4 · Subcamada MAC', arquivo: 'cap4-subcamada-mac.html', tipo: 'tutorial', descricao: 'ALOHA, CSMA/CD, Ethernet, 802.11, pontes, spanning tree e VLANs; exercícios resolvidos.' },
          { titulo: 'Sockets', arquivo: 'sockets.html', tipo: 'tutorial', descricao: 'socket, bind, listen, accept, connect passo a passo, com segmentos TCP; C e Python (aula 13).' },
          { titulo: 'Encapsulamento', arquivo: 'encapsulamento.html', descricao: 'Uma mensagem descendo e subindo as camadas de dois hosts e um roteador.' },
          { titulo: 'Sinais, Nyquist e Shannon', arquivo: 'sinais.html', descricao: 'A letra "b" reconstruída por Fourier, o canal telefônico e calculadoras de capacidade.' },
          { titulo: 'Codificação e modulação', arquivo: 'codificacao.html', descricao: 'NRZ, NRZI, Manchester, AMI, MLT-3, 4B/5B, ASK/FSK/PSK e constelações QAM.' },
          { titulo: 'Multiplexação e CDMA', arquivo: 'multiplexacao.html', descricao: 'FDM, TDM e CDMA passo a passo com os chips do livro.' },
          { titulo: 'Circuitos × pacotes', arquivo: 'comutacao.html', descricao: 'Linhas do tempo de store-and-forward e o tamanho ótimo de pacote.' },
          { titulo: 'Enquadramento', arquivo: 'enquadramento.html', descricao: 'Contagem de bytes (e a perda de sincronismo), byte stuffing e bit stuffing.' },
          { titulo: 'Detecção de erros', arquivo: 'deteccao-erros.html', descricao: 'Hamming com síndrome, divisão longa do CRC, checksum e paridade 2D; clique para errar bits.' },
          { titulo: 'Janela deslizante', arquivo: 'janela-deslizante.html', descricao: 'Diagramas de tempo de parar-e-esperar, Go-Back-N e repetição seletiva com perdas clicáveis.' },
          { titulo: 'Acesso múltiplo', arquivo: 'acesso-multiplo.html', descricao: 'Vazão de ALOHA e CSMA, simulador, recuo exponencial, contagem regressiva e árvore.' },
          { titulo: 'Ethernet e Wi-Fi', arquivo: 'ethernet-wifi.html', descricao: 'Quadro e enchimento, quadro mínimo, eficiência e terminais oculto/exposto.' },
          { titulo: 'Malhas de comutação', arquivo: 'malhas-de-comutacao.html', descricao: 'Barra cruzada, Omega/Banyan com autorroteamento, bloqueio HOL, Clos e TSI (aula 16).' },
          { titulo: 'Pontes e spanning tree', arquivo: 'pontes.html', descricao: 'Aprendizado reverso na Fig. 4-41 (problema 4.38) e árvore geradora 802.1D.' },
        ],
      },
      {
        id: 'redes2', codigo: 'DCC023', nome: 'Redes de Computadores · Módulo 2 (prova 2)', cor: 'teal',
        pasta: 'periodo-07/redes-de-computadores/modulo-2',
        resumo: 'Tanenbaum, caps. 5 a 8: roteamento, congestionamento e QoS, IP (CIDR, NAT, IPv6, ICMP), TCP e UDP, DNS, Web e correio, e segurança.',
        visualizacoes: [
          { titulo: 'Revisão da prova 2', arquivo: 'revisao-prova-2.html', tipo: 'tutorial', descricao: 'Mapa das aulas depois da prova 1, folha de fórmulas, pegadinhas e simulado infinito.' },
          { titulo: 'Cap. 5 · Camada de rede', arquivo: 'cap5-camada-de-rede.html', tipo: 'tutorial', descricao: 'Roteamento, congestionamento, QoS, interconexão e IP; exercícios do capítulo resolvidos.' },
          { titulo: 'Cap. 6 · Camada de transporte', arquivo: 'cap6-camada-de-transporte.html', tipo: 'tutorial', descricao: 'Conexões, UDP, RPC, TCP, temporizadores, congestionamento e desempenho; exercícios resolvidos.' },
          { titulo: 'Cap. 7 · Camada de aplicação', arquivo: 'cap7-camada-de-aplicacao.html', tipo: 'tutorial', descricao: 'DNS, correio, Web, mídia e entrega de conteúdo; exercícios resolvidos.' },
          { titulo: 'Cap. 8 · Segurança', arquivo: 'cap8-seguranca.html', tipo: 'tutorial', descricao: 'Criptografia simétrica e de chave pública, assinaturas, certificados, TLS; exercícios resolvidos.' },
          { titulo: 'Roteamento', arquivo: 'roteamento.html', descricao: 'Dijkstra passo a passo, vetor de distância rodada a rodada e a contagem ao infinito.' },
          { titulo: 'Endereçamento IP', arquivo: 'enderecamento-ip.html', descricao: 'CIDR em binário, maior prefixo, alocação de blocos e fragmentação.' },
          { titulo: 'TCP', arquivo: 'tcp.html', descricao: 'Abertura em três vias, janela de congestionamento (Tahoe × Reno) e estimativa de RTT.' },
          { titulo: 'DNS', arquivo: 'dns.html', descricao: 'Resolução iterativa × recursiva de www.dcc.ufmg.br, com e sem cache.' },
          { titulo: 'Criptografia', arquivo: 'criptografia.html', descricao: 'Diffie-Hellman e RSA com os números do livro.' },
        ],
      },
      {
        id: 'fspd', codigo: 'DCC641', nome: 'Fundamentos de Sistemas Paralelos e Distribuídos', cor: 'orange',
        pasta: 'periodo-07/fundamentos-de-sistemas-paralelos-e-distribuidos',
        resumo: 'Speedup, trabalho e caminho crítico, relógios lógicos, eleição, consenso, consistência e MapReduce.',
        visualizacoes: [
          { titulo: 'Speedup e DAGs', arquivo: 'speedup.html', descricao: 'Amdahl × Gustafson e o escalonamento guloso de um DAG com o limite de Brent.' },
          { titulo: 'Relógios lógicos', arquivo: 'relogios.html', descricao: 'Lamport e vetoriais num diagrama espaço-tempo clicável: causalidade e concorrência.' },
          { titulo: 'Eleição de líder', arquivo: 'eleicao.html', descricao: 'Valentão × anel, escolhendo quem caiu e contando mensagens.' },
          { titulo: 'MapReduce', arquivo: 'mapreduce.html', descricao: 'Contagem de palavras fase a fase: divisão, map, embaralhamento e reduce.' },
        ],
      },
      {
        id: 'ia', codigo: 'DCC642', nome: 'Introdução à Inteligência Artificial', cor: 'pink',
        pasta: 'periodo-07/introducao-a-inteligencia-artificial',
        resumo: 'Agentes, busca com e sem informação, jogos, decisões sob incerteza e aprendizado de máquina.',
        visualizacoes: [
          { titulo: 'Busca', arquivo: 'busca.html', descricao: 'BFS, DFS, custo uniforme, gulosa e A* numa grade que você desenha.' },
          { titulo: 'Minimax e alfa-beta', arquivo: 'minimax.html', descricao: 'A árvore do livro com as podas, e um jogo da velha contra a IA perfeita.' },
          { titulo: 'Decisões sob incerteza', arquivo: 'mdp.html', descricao: 'Iteração de valor no mundo 4×3 e a política mudando com a recompensa.' },
          { titulo: 'Perceptron e redes neurais', arquivo: 'redes-neurais.html', descricao: 'Regiões de decisão aprendidas: o perceptron falha no XOR, a rede escondida resolve.' },
        ],
      },
    ],
    planejadas: ['Ética na Computação'],
  },
  { numero: 8, id: 'periodo-08', planejadas: ['Computação e Sociedade'] },
  { numero: 9, id: 'periodo-09', planejadas: ['Projeto Orientado em Computação I'] },
  { numero: 10, id: 'periodo-10', planejadas: ['Projeto Orientado em Computação II'] },
];
