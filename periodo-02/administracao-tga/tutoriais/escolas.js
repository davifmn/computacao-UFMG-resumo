// Dados das escolas (abordagens) da Teoria Geral da Administração.
// Datas aproximadas de surgimento e auge, segundo a divisão clássica de Chiavenato.

export const ENFASES = {
  tarefas: { nome: 'Tarefas', cor: 'orange' },
  estrutura: { nome: 'Estrutura', cor: 'blue' },
  pessoas: { nome: 'Pessoas', cor: 'green' },
  ambiente: { nome: 'Ambiente', cor: 'purple' },
  tecnologia: { nome: 'Tecnologia', cor: 'pink' },
};

export const ESCOLAS = [
  {
    id: 'cientifica', nome: 'Administração Científica', inicio: 1903, fim: 1930, enfase: ['tarefas'],
    autores: ['Frederick Taylor', 'Henry Ford', 'Henry Gantt', 'Frank e Lillian Gilbreth'],
    marco: 'Princípios da Administração Científica (Taylor, 1911)',
    ideias: [
      'Estudo de tempos e movimentos: existe "a melhor maneira" (the one best way) de fazer cada tarefa.',
      'Divisão do trabalho e especialização do operário; separação entre quem planeja e quem executa.',
      'Incentivo salarial por produção (o "homo economicus": as pessoas são motivadas por dinheiro).',
      'Padronização de ferramentas e métodos; linha de montagem de Ford (1913).',
    ],
    criticas: 'Visão mecanicista do ser humano, superespecialização e trabalho monótono; ignora a organização informal.',
    computacao: 'Métricas de produtividade, gráfico de Gantt em gestão de projetos, e a ideia de medir para otimizar. Cuidado: medir desenvolvedores por "linhas de código" é taylorismo mal aplicado.',
  },
  {
    id: 'classica', nome: 'Teoria Clássica', inicio: 1916, fim: 1940, enfase: ['estrutura'],
    autores: ['Henri Fayol', 'Luther Gulick', 'Lyndall Urwick'],
    marco: 'Administração Industrial e Geral (Fayol, 1916)',
    ideias: [
      'Visão de cima para baixo: a organização como um todo, a partir da direção.',
      'Funções do administrador (POCCC): prever, organizar, comandar, coordenar e controlar.',
      '14 princípios: divisão do trabalho, autoridade e responsabilidade, unidade de comando, cadeia escalar…',
      'As seis funções da empresa: técnicas, comerciais, financeiras, de segurança, contábeis e administrativas.',
    ],
    criticas: 'Abordagem prescritiva e normativa, organização vista como sistema fechado, "princípios" pouco testados empiricamente.',
    computacao: 'Organogramas e hierarquia; a "unidade de comando" ecoa no princípio de responsabilidade única do software.',
  },
  {
    id: 'relacoes', nome: 'Relações Humanas', inicio: 1932, fim: 1950, enfase: ['pessoas'],
    autores: ['Elton Mayo', 'Kurt Lewin', 'Mary Parker Follett'],
    marco: 'Experiência de Hawthorne (Western Electric, 1927–1932)',
    ideias: [
      'O nível de produção depende da integração social do grupo, não só de condições físicas.',
      'Existe uma organização informal (grupos, normas, lideranças não oficiais).',
      'O "homem social": as pessoas são motivadas por reconhecimento e pertencimento.',
      'Importância da liderança, da comunicação e da dinâmica de grupo.',
    ],
    criticas: 'Oposição ingênua à Teoria Clássica, visão romântica do trabalhador, pouca atenção à estrutura.',
    computacao: 'Times, cultura de engenharia, segurança psicológica (Projeto Aristotle, do Google), o "fator humano" em gestão de projetos.',
  },
  {
    id: 'burocratica', nome: 'Teoria da Burocracia', inicio: 1940, fim: 1960, enfase: ['estrutura'],
    autores: ['Max Weber', 'Robert Merton', 'Philip Selznick'],
    marco: 'Economia e Sociedade (Weber, publicado em 1922)',
    ideias: [
      'Burocracia como a forma mais racional e eficiente de organização: regras escritas, impessoalidade.',
      'Hierarquia de autoridade, rotinas padronizadas, divisão sistemática do trabalho.',
      'Competência técnica e meritocracia na escolha das pessoas.',
      'Tipos de autoridade: tradicional, carismática e racional-legal.',
    ],
    criticas: 'Disfunções (Merton): apego às regras, excesso de papelada, resistência a mudanças, despersonalização.',
    computacao: 'Processos formais, documentação, compliance e controle de acesso por papéis (RBAC). E as disfunções: burocracia que trava entregas.',
  },
  {
    id: 'estruturalista', nome: 'Teoria Estruturalista', inicio: 1947, fim: 1970, enfase: ['estrutura', 'ambiente'],
    autores: ['Amitai Etzioni', 'Peter Blau', 'Richard Scott'],
    marco: 'Organizações Modernas (Etzioni, 1964)',
    ideias: [
      'Síntese entre a Teoria Clássica (formal) e a de Relações Humanas (informal).',
      'Organizações como unidades sociais complexas que interagem com o ambiente e com outras organizações.',
      'O conflito é inevitável e pode ser fonte de mudança.',
      'O "homem organizacional", que desempenha vários papéis.',
    ],
    criticas: 'Mais descritiva que prática; tipologias de organizações pouco aplicáveis.',
    computacao: 'Organizações como sistemas sociotécnicos; a Lei de Conway: a arquitetura do software espelha a estrutura de comunicação da organização.',
  },
  {
    id: 'neoclassica', nome: 'Teoria Neoclássica', inicio: 1954, fim: 1975, enfase: ['estrutura'],
    autores: ['Peter Drucker', 'Ernest Dale', 'Harold Koontz'],
    marco: 'A Prática da Administração (Drucker, 1954)',
    ideias: [
      'Retoma a Teoria Clássica com ênfase na prática e nos resultados.',
      'Processo administrativo PODC: planejamento, organização, direção e controle.',
      'Administração por Objetivos (APO): metas negociadas entre chefe e subordinado.',
      'Centralização × descentralização; departamentalização (por função, produto, região, projeto).',
    ],
    criticas: 'Ecletismo; a APO pode virar controle rígido de metas.',
    computacao: 'OKRs (usados por Intel e Google) são herdeiros diretos da APO; departamentalização por produto ≈ squads.',
  },
  {
    id: 'comportamental', nome: 'Teoria Comportamental', inicio: 1947, fim: 1975, enfase: ['pessoas'],
    autores: ['Herbert Simon', 'Abraham Maslow', 'Douglas McGregor', 'Frederick Herzberg', 'Chester Barnard'],
    marco: 'O Comportamento Administrativo (Simon, 1947)',
    ideias: [
      'Organizações são sistemas de decisões; racionalidade limitada: decidimos com informação incompleta ("satisfazer" em vez de otimizar).',
      'Hierarquia das necessidades de Maslow (fisiológicas → segurança → sociais → estima → autorrealização).',
      'Teoria X × Teoria Y de McGregor: pessoas preguiçosas que precisam de controle × pessoas que buscam responsabilidade.',
      'Fatores higiênicos × motivacionais de Herzberg: salário evita insatisfação, mas não motiva por si só.',
    ],
    criticas: 'Tendência a explicar tudo pelo comportamento individual; teorias motivacionais difíceis de comprovar.',
    computacao: 'Herbert Simon também é um dos pais da Inteligência Artificial (Nobel de Economia em 1978, Prêmio Turing em 1975). A racionalidade limitada inspira heurísticas.',
  },
  {
    id: 'sistemas', nome: 'Teoria de Sistemas', inicio: 1960, fim: 1980, enfase: ['ambiente'],
    autores: ['Ludwig von Bertalanffy', 'Daniel Katz', 'Robert Kahn'],
    marco: 'Teoria Geral dos Sistemas (Bertalanffy, 1968); Psicologia Social das Organizações (Katz e Kahn, 1966)',
    ideias: [
      'A organização é um sistema aberto: entradas → processamento → saídas, com retroalimentação (feedback).',
      'O todo é maior que a soma das partes (sinergia); homeostase e entropia.',
      'Equifinalidade: um mesmo resultado pode ser atingido por caminhos diferentes.',
      'Subsistemas interdependentes; mudança em um afeta os outros.',
    ],
    criticas: 'Abstrata demais para orientar decisões práticas.',
    computacao: 'Pensamento sistêmico, feedback loops (DevOps, métricas, observabilidade) e cibernética. O vocabulário entrada/processamento/saída é o da própria computação.',
  },
  {
    id: 'contingencia', nome: 'Teoria da Contingência', inicio: 1961, fim: 1985, enfase: ['ambiente', 'tecnologia'],
    autores: ['Tom Burns e G. M. Stalker', 'Joan Woodward', 'Paul Lawrence e Jay Lorsch', 'Alfred Chandler'],
    marco: 'The Management of Innovation (Burns e Stalker, 1961); Organization and Environment (Lawrence e Lorsch, 1967)',
    ideias: [
      'Não existe uma única melhor maneira de organizar: "tudo depende" do ambiente e da tecnologia.',
      'Organizações mecanísticas (estáveis, hierárquicas) × orgânicas (flexíveis, adaptáveis).',
      'A estrutura segue a estratégia (Chandler).',
      'A tecnologia de produção influencia a estrutura (Woodward).',
    ],
    criticas: 'Pode justificar qualquer escolha ("depende"); relativismo.',
    computacao: 'Escolher o processo pelo contexto: cascata para requisitos estáveis e regulados, métodos ágeis para ambientes incertos. Organização orgânica ≈ times ágeis.',
  },
];

/** Exercício: dado um autor ou ideia, qual a escola? */
export function randomQuestion(rand = Math.random) {
  const e = ESCOLAS[Math.floor(rand() * ESCOLAS.length)];
  const byAuthor = rand() < 0.5;
  const prompt = byAuthor
    ? `A qual abordagem está associado(a) <b>${e.autores[Math.floor(rand() * e.autores.length)]}</b>?`
    : `A ideia "<i>${e.ideias[Math.floor(rand() * e.ideias.length)]}</i>" pertence a qual abordagem?`;
  const others = ESCOLAS.filter(x => x.id !== e.id).sort(() => rand() - 0.5).slice(0, 3);
  return { q: prompt, options: [e.nome, ...others.map(x => x.nome)], answer: 0, explain: `${e.nome} (${e.marco}).`, escola: e.id };
}
