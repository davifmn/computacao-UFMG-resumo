// Teoria em pílulas (para a trilha teoria → exemplo → exercício, no estilo Responde Aí)
// e a folha de fórmulas de cada habilidade. As cores são as mesmas dos passos gerados
// em treino.js: o objeto que é azul na fórmula é azul na solução.

import { pinta } from './treino.js';

const AZ = pinta('azul'), VD = pinta('verde'), AM = pinta('amarelo'), RX = pinta('roxo'), LR = pinta('laranja'), RS = pinta('rosa');
const $ = s => `$${s}$`;
const $$ = s => `$$${s}$$`;

const linear1 = {
  blocos: [
    { titulo: 'A ideia', html: `Na linear $y' + ${AZ('p(x)')}\\,y = ${VD('q(x)')}$, o lado esquerdo <b>quase</b> é a derivada de um produto. Multiplicando por um fator ${$(AM('\\mu(x)'))} bem escolhido, ele vira exatamente $(${AM('\\mu')}\\,y)'$, e aí basta integrar. ${$$(`${AM('\\mu')}' = ${AM('\\mu')}\\,${AZ('p')} \\Rightarrow ${AM('\\mu(x)')} = e^{\\int ${AZ('p(x)')}\\,dx}`)}` },
    { titulo: 'Passo a passo', html: `<ol><li><b>Forma padrão</b>: coeficiente de $y'$ igual a 1; leia ${$(AZ('p'))} e ${$(VD('q'))}.</li><li>${$(`${AM('\\mu')} = e^{\\int ${AZ('p')}\\,dx}`)}, sem constante.</li><li>${$(`(${AM('\\mu')}\\,y)' = ${AM('\\mu')}\\,${VD('q')}`)}; integre e <b>some ${$(RX('C'))} antes de dividir</b>.</li><li>Use a condição inicial para achar ${$(RX('C'))}.</li><li>Intervalo: o maior aberto com $x_0$ onde ${$(AZ('p'))} e ${$(VD('q'))} são contínuas.</li></ol>` },
    { titulo: 'Pegadinha', html: `Ler ${$(AZ('p'))} sem pôr na forma padrão. Em $t\\,y' + 2y = \\frac{\\cos t}{t}$, divida por $t$: ${$(`${AZ('p')} = ${AZ('\\frac{2}{t}')}`)}, não $2$. E o ${$(RX('+C'))} somado depois de dividir por ${$(AM('\\mu'))} é o erro de conta mais comum.` },
  ],
  formulas: [
    ['Forma padrão', `y' + ${AZ('p(x)')}\\,y = ${VD('q(x)')}`],
    ['Fator integrante', `${AM('\\mu(x)')} = e^{\\int ${AZ('p(x)')}\\,dx}`],
    ['Depois de multiplicar', `\\left(${AM('\\mu')}\\,y\\right)' = ${AM('\\mu')}\\,${VD('q')}`],
    ['Solução', `y = \\frac{1}{${AM('\\mu')}}\\left(\\int ${AM('\\mu')}\\,${VD('q')}\\,dx + ${RX('C')}\\right)`],
    ['Úteis', `e^{k\\ln x} = x^k,\\quad e^{\\int \\operatorname{tg} x} = \\sec x`],
  ],
};

const separavel = {
  blocos: [
    { titulo: 'A ideia', html: `Se $y' = ${AZ('g(x)')}\\,${VD('h(y)')}$, dá para pôr tudo de $y$ de um lado e tudo de $x$ do outro e integrar cada lado na sua variável: ${$$(`\\int \\frac{dy}{${VD('h(y)')}} = \\int ${AZ('g(x)')}\\,dx + ${RX('C')}`)}` },
    { titulo: 'Passo a passo', html: `<ol><li>Ache as <b>soluções constantes</b>: ${$(`${VD('h(y)')} = 0`)}. Dividir por ${$(VD('h'))} as perde.</li><li>Separe e integre (frações parciais se ${$(VD('h'))} for produto).</li><li>Condição inicial → ${$(RX('C'))}; isole $y$ escolhendo o sinal da raiz pelo $y_0$.</li><li>Intervalo: onde a fórmula faz sentido e que contém $x_0$.</li></ol>` },
    { titulo: 'Pegadinha', html: `$\\ln|y|$ com módulo, e o $\\pm$ da raiz: em $y^2 = x^2 + 3$ com $y(1) = 2$, fica $y = +\\sqrt{x^2 + 3}$. Em $y' = y^2$ a solução explode em tempo finito: o intervalo é limitado mesmo com a equação "bonita".` },
  ],
  formulas: [
    ['Forma', `y' = ${AZ('g(x)')}\\,${VD('h(y)')}`],
    ['Separação', `\\int \\frac{dy}{${VD('h(y)')}} = \\int ${AZ('g(x)')}\\,dx + ${RX('C')}`],
    ['Exponencial', `\\ln|y| = G(x) + ${RX('C')} \\Rightarrow y = ${RX('A')}\\,e^{G(x)}`],
    ['Frações parciais', `\\frac{1}{(y - a)(y - b)} = \\frac{1}{a - b}\\left(\\frac{1}{y - a} - \\frac{1}{y - b}\\right)`],
  ],
};

const exata = {
  blocos: [
    { titulo: 'A ideia', html: `Uma equação ${$(`${AZ('M')}\\,dx + ${VD('N')}\\,dy = 0`)} é exata quando ela é o diferencial de uma função ${$(AM('\\psi(x, y)'))}: ${$(`d${AM('\\psi')} = ${AM('\\psi')}_x\\,dx + ${AM('\\psi')}_y\\,dy`)}. Então a solução é simplesmente ${$(`${AM('\\psi(x, y)')} = C`)}. Isso só pode acontecer se as derivadas cruzadas baterem: ${$(`${AZ('M_y')} = ${VD('N_x')}`)}.` },
    { titulo: 'Passo a passo', html: `<ol><li><b>Teste</b>: calcule e escreva ${$(AZ('M_y'))} e ${$(VD('N_x'))}.</li><li>${$(`${AM('\\psi')} = \\int ${AZ('M')}\\,dx + ${RX('h(y)')}`)}, integrando em $x$ com $y$ fixo.</li><li>Derive em $y$ e iguale a ${$(VD('N'))}: sobra ${$(RX("h'(y)"))}.</li><li>Integre ${$(RX("h'"))} e escreva ${$(`${AM('\\psi')} = C`)}.</li></ol>` },
    { titulo: 'Pegadinha', html: `Somar duas vezes o termo misto: $x^2y$ aparece integrando ${$(AZ('M'))} <b>e</b> integrando ${$(VD('N'))}, mas entra em ${$(AM('\\psi'))} uma vez só. Se sobrar $x$ em ${$(RX("h'(y)"))}, houve erro de conta.` },
  ],
  formulas: [
    ['Forma', `${AZ('M(x, y)')}\\,dx + ${VD('N(x, y)')}\\,dy = 0`],
    ['Teste', `${AZ('M_y')} = ${VD('N_x')}`],
    ['Potencial', `${AM('\\psi')} = \\int ${AZ('M')}\\,dx + ${RX('h(y)')},\\quad ${AM('\\psi')}_y = ${VD('N')}`],
    ['Solução', `${AM('\\psi(x, y)')} = C`],
    ['Função implícita', `y = y(x) \\text{ perto de onde } ${AM('\\psi')}_y \\ne 0`],
  ],
};

const teu = {
  blocos: [
    { titulo: 'A ideia', html: `O teorema diz <b>quando</b> um PVI $y' = ${AZ('f(x, y)')}$, $y(x_0) = y_0$ tem solução única, sem resolvê-lo: basta ${$(AZ('f'))} e ${$(VD('\\partial f/\\partial y'))} serem contínuas num retângulo em volta de ${$(RS('(x_0, y_0)'))}. A garantia é <b>local</b>.` },
    { titulo: 'Passo a passo', html: `<ol><li><b>Linear</b>: liste onde ${$(AZ('p'))} e ${$(VD('q'))} falham (zeros de denominador, $\\operatorname{tg}$ em $\\pm\\frac{\\pi}{2}$, domínio de $\\ln$ e raiz).</li><li>Esses pontos picam a reta; o intervalo garantido é o pedaço que contém ${$(RS('x_0'))}.</li><li><b>Não linear</b>: calcule ${$(VD('f_y'))} e veja se é contínua em ${$(RS('(x_0, y_0)'))}.</li></ol>` },
    { titulo: 'Pegadinha', html: `"O teorema não se aplica" não é o mesmo que "não há solução única": ele só deixa de garantir. Em $y' = \\sqrt{y}$, $y(0) = 0$, a unicidade de fato falha: $y \\equiv 0$ e $y = x^2/4$ são duas soluções.` },
  ],
  formulas: [
    ['Hipóteses', `${AZ('f')},\\ ${VD('\\tfrac{\\partial f}{\\partial y}')} \\text{ contínuas perto de } ${RS('(x_0, y_0)')}`],
    ['Linear', `\\begin{gathered} y' + ${AZ('p(x)')}y = ${VD('q(x)')} \\\\ \\text{maior intervalo aberto com } ${RS('x_0')} \\\\ \\text{onde } ${AZ('p')} \\text{ e } ${VD('q')} \\text{ são contínuas} \\end{gathered}`],
    ['Picard (local)', `|x - x_0| \\le h = \\min\\left(a, \\tfrac{b}{K}\\right),\\ K = \\max_R |f|`],
    ['Falta de unicidade', `y' = 3|y|^{2/3}: \\ y \\equiv 0,\\ y = (x - a)^3 \\text{ para } x \\ge a`],
  ],
};

const autonoma = {
  blocos: [
    { titulo: 'A ideia', html: `Em $y' = g(y)$ a derivada só depende de $y$. Os zeros de $g$ são <b>equilíbrios</b> (soluções constantes) e, entre eles, o sinal de $g$ diz se $y$ sobe ou desce. Pela unicidade, nenhuma solução cruza um equilíbrio.` },
    { titulo: 'Passo a passo', html: `<ol><li>Equilíbrios: ${$(`g(y) = 0 \\Rightarrow ${AZ('y = a')},\\ ${VD('y = b')}`)}.</li><li>Linha de fase: sinal de $g$ em cada intervalo (setas para cima onde $g > 0$).</li><li>Estável: setas entram dos dois lados ($g' < 0$). Instável: saem. Semiestável: uma entra e outra sai.</li></ol>` },
    { titulo: 'Pegadinha', html: `Raiz dupla como $(y - 1)^2$ não muda o sinal de $g$: o equilíbrio é <b>semiestável</b>. E uma solução se aproxima do equilíbrio sem nunca alcançá-lo em tempo finito.` },
  ],
  formulas: [
    ['Equilíbrios', `g(${AZ('a')}) = g(${VD('b')}) = 0`],
    ['Estabilidade', `g'(y^*) < 0 \\text{ estável},\\quad g'(y^*) > 0 \\text{ instável}`],
    ['Comportamento', `y_0 \\text{ entre equilíbrios} \\Rightarrow y \\to \\text{o estável vizinho}`],
  ],
};

const metodo = (titulo, fluxo, pega) => ({
  blocos: [
    { titulo: 'A ideia', html: `A prova não diz qual método usar: reconhecer o tipo é metade da questão. Na pesquisa sobre prática intercalada, é exatamente essa habilidade de escolher o procedimento que mais melhora. ${titulo}` },
    { titulo: 'O fluxograma', html: fluxo },
    { titulo: 'Pegadinha', html: pega },
  ],
  formulas: [],
});

const metodoP1 = metodo('Aqui as opções são separável, linear e exata.',
  `<ol><li>Dá para escrever $y' = g(x)\\,h(y)$? → <b>separável</b>.</li><li>$y$ e $y'$ só na 1ª potência, sem produto entre eles? → <b>linear</b>.</li><li>Veio como $M\\,dx + N\\,dy = 0$ com $M_y = N_x$? → <b>exata</b>.</li></ol>`,
  `$y' = 2xy$ é separável <b>e</b> linear: as duas respostas servem. Já $y' = \\operatorname{sen}(x + y)$ não é nenhum dos três.`);
metodoP1.formulas = [['Separável', `y' = g(x)\\,h(y)`], ['Linear', `y' + p(x)y = q(x)`], ['Exata', `M\\,dx + N\\,dy = 0,\\ M_y = N_x`]];

const wronskiano = {
  blocos: [
    { titulo: 'A ideia', html: `Duas soluções de uma EDO linear de 2ª ordem formam um <b>conjunto fundamental</b> (geram todas as outras) se não forem múltiplas uma da outra. O Wronskiano ${$(AM('W'))} testa isso de uma vez: ${$(`${AM('W')} \\ne 0`)} ⇔ independentes.` },
    { titulo: 'Passo a passo', html: `<ol><li>Derive ${$(AZ('y_1'))} e ${$(VD('y_2'))}.</li><li>Monte ${$(`${AM('W')} = \\begin{vmatrix} ${AZ('y_1')} & ${VD('y_2')} \\\\ ${AZ("y_1'")} & ${VD("y_2'")} \\end{vmatrix} = ${AZ('y_1')}${VD("y_2'")} - ${AZ("y_1'")}${VD('y_2')}`)}.</li><li>Simplifique e conclua.</li></ol>` },
    { titulo: 'Pegadinha', html: `Pela fórmula de Abel, ${$(`${AM('W')} = Ce^{-\\int p\\,dx}`)}, com $p$ da <b>forma padrão</b>: ou ${$(AM('W'))} é identicamente zero ou nunca zera no intervalo. Na Lista 2 (q. 3), $p = -4/x$ dá ${$(`${AM('W')} = Cx^4`)}.` },
  ],
  formulas: [
    ['Definição', `${AM('W')} = ${AZ('y_1')}${VD("y_2'")} - ${AZ("y_1'")}${VD('y_2')}`],
    ['Abel', `${AM('W(x)')} = C\\,e^{-\\int p(x)\\,dx}`],
    ['Exponenciais', `W(e^{ax}, e^{bx}) = (b - a)e^{(a + b)x}`],
    ['Raiz dupla', `W(e^{rx}, xe^{rx}) = e^{2rx}`],
    ['Trigonométricas', `W(\\cos kx, \\operatorname{sen} kx) = k`],
    ['Potências', `W(x^m, x^n) = (n - m)x^{m + n - 1}`],
  ],
};

const homogenea2 = {
  blocos: [
    { titulo: 'A ideia', html: `Em $ay'' + by' + cy = 0$ teste $y = e^{rx}$: cada derivada só puxa um $r$, e sobra $e^{rx}(ar^2 + br + c) = 0$. Então $r$ tem que ser raiz da <b>equação característica</b>, e o tipo de raiz decide a forma da solução.` },
    { titulo: 'Passo a passo', html: `<ol><li>Característica $ar^2 + br + c = 0$ e suas raízes.</li><li>Escolha a forma:<br>reais: ${$(`${RX('c_1')}e^{${AZ('r_1')}x} + ${LR('c_2')}e^{${VD('r_2')}x}`)}<br>dupla: ${$(`(${RX('c_1')} + ${LR('c_2')}x)e^{${AZ('r')}x}`)}<br>complexas: ${$(`e^{${AZ('\\alpha')} x}(${RX('c_1')}\\cos ${VD('\\beta')} x + ${LR('c_2')}\\operatorname{sen} ${VD('\\beta')} x)`)}</li><li>Com ${$(RS("y(0), y'(0)"))}, monte o sistema 2×2 em ${$(RX('c_1'))}, ${$(LR('c_2'))}.</li></ol>` },
    { titulo: 'Pegadinha', html: `Derivar $e^{\\alpha x}(\\dots)$ exige a regra do produto. E se $x_0 \\ne 0$ (Lista 2, q. 10: $x_0 = \\pi/2$), calcule senos e cossenos no ponto <b>antes</b> de resolver o sistema.` },
  ],
  formulas: [
    ['Característica', `ar^2 + br + c = 0,\\quad r = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`],
    ['Reais distintas', `y = ${RX('c_1')}e^{${AZ('r_1')}x} + ${LR('c_2')}e^{${VD('r_2')}x}`],
    ['Raiz dupla', `y = (${RX('c_1')} + ${LR('c_2')}x)e^{${AZ('r')}x}`],
    ['Complexas', `y = e^{${AZ('\\alpha')} x}\\left(${RX('c_1')}\\cos ${VD('\\beta')} x + ${LR('c_2')}\\operatorname{sen} ${VD('\\beta')} x\\right)`],
    ['PVI', `y(0) = ${RS('y_0')},\\ y'(0) = ${RS('y_1')} \\to \\text{sistema em } ${RX('c_1')}, ${LR('c_2')}`],
  ],
};

const coefIndet = {
  blocos: [
    { titulo: 'A ideia', html: `Solução geral = ${$(AZ('y_h'))} + ${$(AM('y_p'))}. Para achar ${$(AM('y_p'))}, chute uma função da mesma "família" de ${$(VD('g(x)'))} (derivar polinômio, exponencial ou seno/cosseno não muda a família) com coeficientes ${$(`${RX('A')}, ${LR('B')}, \\dots`)} a determinar.` },
    { titulo: 'Passo a passo', html: `<ol><li>Resolva a homogênea: ${$(AZ('y_h'))}.</li><li>Chute pela tabela ao lado, olhando ${$(VD('g'))}.</li><li><b>Compare com ${$(AZ('y_h'))}</b>: se algum termo do chute já está em ${$(AZ('y_h'))}, multiplique o chute por $x$.</li><li>Substitua e iguale coeficientes.</li></ol>` },
    { titulo: 'Pegadinha (a que mais cai)', html: `Ressonância: em $y'' + 4y = 3\\cos 2x$, $\\cos 2x$ já resolve a homogênea, então ${$(`${AM('y_p')} = x(${RX('A')}\\cos 2x + ${LR('B')}\\operatorname{sen} 2x)`)}. E o chute de seno ou cosseno leva <b>sempre os dois</b>.` },
  ],
  formulas: [
    ['Solução geral', `y = ${AZ('y_h')} + ${AM('y_p')}`],
    ['Polinômio grau n', `${VD('g')} = P_n(x) \\to ${AM('y_p')} = ${RX('A_n')}x^n + \\dots + ${RX('A_0')}`],
    ['Exponencial', `${VD('g')} = Ge^{kx} \\to ${AM('y_p')} = ${RX('A')}e^{kx}`],
    ['Seno/cosseno', `${VD('g')} = G\\cos kx \\to ${AM('y_p')} = ${RX('A')}\\cos kx + ${LR('B')}\\operatorname{sen} kx`],
    ['Ressonância', `\\begin{gathered} \\text{termo do chute em } ${AZ('y_h')} \\\\ \\Rightarrow \\text{multiplique por } x\\ (x^2 \\text{ se raiz dupla}) \\end{gathered}`],
    ['Exp. com raiz simples', `${AM('y_p')} = \\frac{G}{2k + b}\\,xe^{kx}`],
  ],
};

const variacao = {
  blocos: [
    { titulo: 'A ideia', html: `Pegue a solução da homogênea, ${$(`c_1${AZ('y_1')} + c_2${VD('y_2')}`)}, e deixe as constantes <b>variarem</b>: ${$(`y_p = ${RX('u_1')}${AZ('y_1')} + ${LR('u_2')}${VD('y_2')}`)}. Impondo uma condição extra conveniente, sai um sistema cuja solução é sempre a mesma fórmula, com o Wronskiano ${$(AM('W'))} no denominador.` },
    { titulo: 'Passo a passo', html: `<ol><li><b>Forma padrão</b> (coeficiente de $y''$ igual a 1) e leia ${$(RS('g'))}.</li><li>${$(AZ('y_1'))}, ${$(VD('y_2'))} da homogênea e ${$(AM('W'))}.</li><li>${$(`${RX("u_1'")} = -\\frac{${VD('y_2')}\\,${RS('g')}}{${AM('W')}}`)}, ${$(`${LR("u_2'")} = \\frac{${AZ('y_1')}\\,${RS('g')}}{${AM('W')}}`)}; integre.</li><li>${$(`y_p = ${RX('u_1')}${AZ('y_1')} + ${LR('u_2')}${VD('y_2')}`)}.</li></ol>` },
    { titulo: 'Pegadinha', html: `O sinal de menos em ${$(RX("u_1'"))}, e esquecer de dividir pelo coeficiente de $y''$ antes de ler ${$(RS('g'))}. Termos de $y_p$ que são da homogênea podem ser descartados.` },
  ],
  formulas: [
    ['Fórmulas', `${RX("u_1'")} = -\\frac{${VD('y_2')}\\,${RS('g')}}{${AM('W')}},\\qquad ${LR("u_2'")} = \\frac{${AZ('y_1')}\\,${RS('g')}}{${AM('W')}}`],
    ['Solução particular', `y_p = ${RX('u_1')}${AZ('y_1')} + ${LR('u_2')}${VD('y_2')}`],
    ['Integrais', `\\begin{gathered} \\int \\operatorname{tg} kx = -\\tfrac{1}{k}\\ln|\\cos kx| \\\\ \\int \\operatorname{cotg} kx = \\tfrac{1}{k}\\ln|\\operatorname{sen} kx| \\end{gathered}`],
    ['Mais uma', `\\int \\sec x = \\ln|\\sec x + \\operatorname{tg} x|`],
  ],
};

const metodoP2 = metodo('Aqui as opções são equação característica, coeficientes a determinar e variação de parâmetros.',
  `<ol><li>$g = 0$ → <b>característica</b>.</li><li>$g$ é polinômio, exponencial, seno/cosseno ou produto deles → <b>coeficientes a determinar</b> (mais rápido).</li><li>$g$ com $\\sec$, $\\operatorname{tg}$, $\\operatorname{cossec}$, $\\ln$, divisão por $x$ → <b>variação de parâmetros</b>.</li></ol>`,
  `Variação de parâmetros funciona sempre, mas na prova custa tempo: se o chute existe, use coeficientes a determinar.`);
metodoP2.formulas = [['Homogênea', `g(x) = 0`], ['Coeficientes', `g \\in \\{P_n,\\ e^{kx},\\ \\cos,\\ \\operatorname{sen}\\}`], ['Variação', `g \\in \\{\\sec,\\ \\operatorname{tg},\\ \\ln,\\ 1/x, \\dots\\}`]];

const laplaceDireta = {
  blocos: [
    { titulo: 'A ideia', html: `${$(`\\mathcal{L}\\{f\\}(s) = \\int_0^\\infty e^{-st}f(t)\\,dt`)} troca derivadas por multiplicação por $s$. Na prática quase nunca se integra: a transformada é <b>linear</b>, então cada parcela de $f$ vai para a tabela e as respostas se somam. No treino, cada parcela tem uma cor e a sua transformada herda essa cor.` },
    { titulo: 'Passo a passo', html: `<ol><li>Quebre $f$ em parcelas: ${$(`f = ${AZ('f_1')} + ${VD('f_2')}`)}.</li><li>Função por partes? Escreva com degraus ${$(LR('u_c(t)'))}, já <b>deslocada</b> para $t - c$.</li><li>Tabela em cada parcela: ${$(`${AZ('f_1')} \\to ${AZ('F_1')}`)}, ${$(`${VD('f_2')} \\to ${VD('F_2')}`)}.</li><li>Some.</li></ol>` },
    { titulo: 'Pegadinha', html: `$\\operatorname{sen}^2(3t)$ não está na tabela: use $\\frac{1 - \\cos 6t}{2}$ primeiro. E ${$(`\\mathcal{L}\\{${LR('u_c(t)')}f(t)\\} \\ne e^{-cs}F(s)`)} se $f$ não estiver escrita em $t - c$.` },
  ],
  formulas: [
    ['Básicas', `1 \\to \\tfrac{1}{s},\\quad t^n \\to \\tfrac{n!}{s^{n+1}},\\quad e^{at} \\to \\tfrac{1}{s - a}`],
    ['Trigonométricas', `\\operatorname{sen} bt \\to \\tfrac{b}{s^2 + b^2},\\quad \\cos bt \\to \\tfrac{s}{s^2 + b^2}`],
    ['Deslocamento em s', `e^{${LR('a')}t}f(t) \\to F(s - ${LR('a')})`],
    ['Deslocamento em t', `${LR('u_c(t)')}\\,f(t - c) \\to ${LR('e^{-cs}')}F(s)`],
    ['Degrau e delta', `${LR('u_c(t)')} \\to \\tfrac{e^{-cs}}{s},\\quad \\delta(t - c) \\to e^{-cs}`],
    ['Delta com peso', `\\varphi(t)\\delta(t - c) = \\varphi(c)\\delta(t - c)`],
    ['Multiplicar por t', `t\\,f(t) \\to -F'(s)`],
  ],
};

const laplaceInversa = {
  blocos: [
    { titulo: 'A ideia', html: `Inverter é usar a tabela ao contrário. O trabalho é deixar $F(s)$ com cara de tabela: separar em frações simples, completar quadrado ou isolar o fator ${$(LR('e^{-cs}'))}.` },
    { titulo: 'Passo a passo', html: `<ol><li>Tem ${$(LR('e^{-cs}'))}? Tire-o, inverta o resto e no fim troque $t$ por $t - c$ e multiplique por ${$(LR('u_c(t)'))}.</li><li>Raízes reais: ${$(`\\frac{${AZ('A')}}{${AZ('s - r_1')}} + \\frac{${VD('B')}}{${VD('s - r_2')}}`)}, com ${$(`${AZ('A')} = (s - r_1)F(s)|_{s = r_1}`)} (atalho de Heaviside).</li><li>$\\Delta < 0$: complete o quadrado, ${$(`(${LR('s - p')})^2 + q^2`)}, e escreva o numerador como ${$(`${AZ('\\alpha')}(${LR('s - p')}) + ${VD('\\beta')}`)}.</li></ol>` },
    { titulo: 'Pegadinha', html: `Coeficiente de $s^2$ diferente de 1 (Lista 3, q. 2d: $2s^2 + 3$): divida antes. Cada fração simples vira uma exponencial <b>da mesma cor</b>: ${$(`\\frac{${AZ('A')}}{${AZ('s - r_1')}} \\to ${AZ('Ae^{r_1t}')}`)}.` },
  ],
  formulas: [
    ['Frações parciais', `\\frac{${AZ('A')}}{${AZ('s - r_1')}} + \\frac{${VD('B')}}{${VD('s - r_2')}} \\to ${AZ('Ae^{r_1t}')} + ${VD('Be^{r_2t}')}`],
    ['Heaviside', `${AZ('A')} = \\left.(s - r_1)F(s)\\right|_{s = r_1}`],
    ['Quadrado completo', `\\frac{${AZ('\\alpha')}(${LR('s - p')}) + ${VD('\\beta')}}{(${LR('s - p')})^2 + q^2} \\to ${LR('e^{pt}')}\\left(${AZ('\\alpha')}\\cos qt + \\tfrac{${VD('\\beta')}}{q}\\operatorname{sen} qt\\right)`],
    ['Polo repetido', `\\frac{1}{(s - p)^n} \\to \\frac{t^{n-1}}{(n - 1)!}e^{pt}`],
    ['Deslocamento', `${LR('e^{-cs}')}${AZ('G(s)')} \\to ${LR('u_c(t)')}\\,${AZ('g')}(${LR('t - c')})`],
  ],
};

const laplacePvi = {
  blocos: [
    { titulo: 'A ideia', html: `A transformada vira a EDO numa equação <b>algébrica</b> em ${$(AM('Y(s)'))}, com as condições iniciais ${$(RS("y(0), y'(0)"))} já embutidas. Forçamentos por partes (${$(LR('u_c'))}) ou impulsos ($\\delta$) não dão trabalho extra: viram fatores ${$(LR('e^{-cs}'))}.` },
    { titulo: 'Passo a passo', html: `<ol><li>Transforme a equação inteira com ${$(`\\mathcal{L}\\{y''\\} = s^2${AM('Y')} - s${RS('y(0)')} - ${RS("y'(0)")}`)}.</li><li>Isole ${$(AM('Y(s)'))}.</li><li>Inverta cada pedaço; com ${$(LR('e^{-cs}'))}, ache ${$(AZ('h'))} e escreva ${$(`${LR('u_c(t)')}\\,${AZ('h')}(${LR('t - c')})`)}.</li></ol>` },
    { titulo: 'Confira', html: `A solução é contínua. Com $\\delta(t - c)$, $y'$ salta (peso do impulso) ÷ (coeficiente de $y''$) em $t = c$. Com degrau, nada acontece antes de $t = c$ se o sistema começa em repouso.` },
  ],
  formulas: [
    ['Derivadas', `\\begin{gathered} \\mathcal{L}\\{y'\\} = s${AM('Y')} - ${RS('y(0)')} \\\\ \\mathcal{L}\\{y''\\} = s^2${AM('Y')} - s${RS('y(0)')} - ${RS("y'(0)")} \\end{gathered}`],
    ['Forma de Y', `${AM('Y(s)')} = \\frac{\\text{(cond. iniciais)} + ${RS('G(s)')}}{as^2 + bs + c}`],
    ['Impulso', `${RS('\\delta(t - c)')} \\to ${LR('e^{-cs}')}`],
    ['Degrau', `${RS('u_c(t)')} \\to \\tfrac{${LR('e^{-cs}')}}{s}`],
    ['Deslocamento', `${LR('e^{-cs}')}${AZ('H(s)')} \\to ${LR('u_c(t)')}\\,${AZ('h')}(${LR('t - c')})`],
    ['Útil', `\\frac{1}{(s^2 + a^2)^2} \\to \\frac{\\operatorname{sen} at - at\\cos at}{2a^3}`],
  ],
};

const convolucao = {
  blocos: [
    { titulo: 'A ideia', html: `Produto de transformadas não é transformada do produto: ${$(`\\mathcal{L}^{-1}\\{${AZ('F_1')}${VD('F_2')}\\}`)} é a <b>convolução</b> ${$(`(${AZ('f_1')} * ${VD('f_2')})(t) = \\int_0^t ${AZ('f_1(\\tau)')}\\,${VD('f_2(t - \\tau)')}\\,d\\tau`)}.` },
    { titulo: 'Passo a passo', html: `<ol><li>Escreva $F$ como produto de duas transformadas da tabela: ${$(`${AZ('F_1')}\\cdot ${VD('F_2')}`)}.</li><li>Inverta cada uma: ${$(AZ('f_1'))}, ${$(VD('f_2'))}.</li><li>Monte a integral com $\\tau$ em ${$(AZ('f_1'))} e $t - \\tau$ em ${$(VD('f_2'))}, e integre.</li></ol>` },
    { titulo: 'Truque', html: `Expanda $\\operatorname{sen}(t - \\tau) = \\operatorname{sen} t\\cos\\tau - \\cos t\\operatorname{sen}\\tau$: o que só depende de $t$ sai da integral. Exemplo clássico: $\\cos * \\operatorname{sen} = \\frac{t}{2}\\operatorname{sen} t$.` },
  ],
  formulas: [
    ['Definição', `(${AZ('f_1')} * ${VD('f_2')})(t) = \\int_0^t ${AZ('f_1(\\tau)')}\\,${VD('f_2(t - \\tau)')}\\,d\\tau`],
    ['Teorema', `\\mathcal{L}\\{${AZ('f_1')} * ${VD('f_2')}\\} = ${AZ('F_1')}\\,${VD('F_2')}`],
    ['PVI genérico', `\\begin{gathered} y'' + k^2y = g(t),\\ y(0) = y'(0) = 0 \\\\ y = \\tfrac{1}{k}\\int_0^t g(\\tau)\\operatorname{sen} k(t - \\tau)\\,d\\tau \\end{gathered}`],
    ['Clássicos', `1 * \\operatorname{sen} kt = \\tfrac{1 - \\cos kt}{k},\\quad \\cos t * \\operatorname{sen} t = \\tfrac{t}{2}\\operatorname{sen} t`],
  ],
};

const metodoP3 = metodo('Aqui a questão é qual técnica inverte $F(s)$.',
  `<ol><li>Tem $e^{-cs}$? → <b>deslocamento em $t$</b>.</li><li>Denominador com raízes reais → <b>frações parciais</b>.</li><li>$\\Delta < 0$ → <b>completar quadrado</b>.</li><li>Produto de duas transformadas ou fator complexo repetido → <b>convolução</b>.</li></ol>`,
  `$\\frac{1}{s(s^2 + 4)}$ sai por convolução <b>ou</b> por frações parciais: as duas valem.`);
metodoP3.formulas = [['Deslocamento', `e^{-cs}G(s)`], ['Frações', `(s - r_1)(s - r_2)`], ['Quadrado', `(s - p)^2 + q^2`], ['Convolução', `F_1(s)\\,F_2(s)`]];

const sistemaReal = {
  blocos: [
    { titulo: 'A ideia', html: `Em $\\mathbf X' = A\\mathbf X$, procure soluções ${$(`e^{${AZ('\\lambda')} t}${AZ('\\mathbf v')}`)}: substituindo, sobra $A\\mathbf v = \\lambda\\mathbf v$. Então ${$(AZ('\\lambda'))} é <b>autovalor</b> e ${$(AZ('\\mathbf v'))} é <b>autovetor</b>. Com dois autovalores reais diferentes, cada par dá uma solução, e a geral é a combinação.` },
    { titulo: 'Passo a passo', html: `<ol><li>$\\lambda^2 - (\\text{tr}\\,A)\\lambda + \\det A = 0$ → ${$(AZ('\\lambda_1'))}, ${$(VD('\\lambda_2'))}.</li><li>Autovetores: $(A - \\lambda I)\\mathbf v = 0$ (use uma linha só).</li><li>${$(`\\mathbf X = ${RX('c_1')}e^{${AZ('\\lambda_1')} t}${AZ('\\mathbf v_1')} + ${LR('c_2')}e^{${VD('\\lambda_2')} t}${VD('\\mathbf v_2')}`)}.</li><li>PVI: ${$(`${RX('c_1')}${AZ('\\mathbf v_1')} + ${LR('c_2')}${VD('\\mathbf v_2')} = ${RS('\\mathbf X(0)')}`)}.</li></ol>` },
    { titulo: 'Pegadinha', html: `Cada autovetor anda com o <b>seu</b> autovalor (por isso a mesma cor). Autovetores são definidos a menos de múltiplo: $(1/2, 1)$ e $(1, 2)$ são a mesma resposta. Com $\\det A = 0$, um autovalor é zero e a parcela dele é <b>constante</b>.` },
  ],
  formulas: [
    ['Característico', `\\lambda^2 - (\\text{tr}\\,A)\\lambda + \\det A = 0`],
    ['Autovetor', `(A - ${AZ('\\lambda')} I)${AZ('\\mathbf v')} = 0;\\ \\text{linha } (a\\ \\ b) \\Rightarrow ${AZ('\\mathbf v')} = (b, -a)`],
    ['Solução geral', `\\mathbf X = ${RX('c_1')}e^{${AZ('\\lambda_1')} t}${AZ('\\mathbf v_1')} + ${LR('c_2')}e^{${VD('\\lambda_2')} t}${VD('\\mathbf v_2')}`],
    ['PVI', `${RX('c_1')}${AZ('\\mathbf v_1')} + ${LR('c_2')}${VD('\\mathbf v_2')} = ${RS('\\mathbf X(0)')}`],
    ['Qual caso', `\\begin{gathered} \\Delta = (\\text{tr}\\,A)^2 - 4\\det A \\\\ > 0 \\text{ reais},\\ < 0 \\text{ complexos},\\ = 0 \\text{ repetido} \\end{gathered}`],
  ],
};

const sistemaComplexo = {
  blocos: [
    { titulo: 'A ideia', html: `Com ${$(AM('\\lambda = \\alpha \\pm \\beta i'))}, a solução $e^{\\lambda t}\\mathbf v$ é complexa. Mas a matriz é real, então a <b>parte real</b> e a <b>parte imaginária</b> dessa solução também são soluções, e são reais. Escreva ${$(`\\mathbf v = ${AZ('\\mathbf a')} + i${VD('\\mathbf b')}`)} e use Euler.` },
    { titulo: 'Passo a passo', html: `<ol><li>${$(AM('\\lambda = \\alpha + \\beta i'))} (basta um dos dois).</li><li>Autovetor complexo ${$(`\\mathbf v = ${AZ('\\mathbf a')} + i${VD('\\mathbf b')}`)}.</li><li>${$(`\\mathbf u_1 = e^{\\alpha t}(${AZ('\\mathbf a')}\\cos\\beta t - ${VD('\\mathbf b')}\\operatorname{sen}\\beta t)`)}, ${$(`\\mathbf u_2 = e^{\\alpha t}(${AZ('\\mathbf a')}\\operatorname{sen}\\beta t + ${VD('\\mathbf b')}\\cos\\beta t)`)}.</li><li>${$(`\\mathbf X = ${RX('c_1')}\\mathbf u_1 + ${LR('c_2')}\\mathbf u_2`)}.</li></ol>` },
    { titulo: 'Confira', html: `Substitua em <b>uma</b> equação num ponto fácil, como $t = 0$. Foi esse teste que mostrou os erros do gabarito da Lista 4 (3a e 3c).` },
  ],
  formulas: [
    ['Autovalores', `${AM('\\lambda')} = \\tfrac{\\text{tr}}{2} \\pm i\\sqrt{\\det - \\tfrac{\\text{tr}^2}{4}}`],
    ['Autovetor', `\\mathbf v = ${AZ('\\mathbf a')} + i${VD('\\mathbf b')}`],
    ['Soluções reais', `\\begin{gathered} \\mathbf u_1 = e^{\\alpha t}(${AZ('\\mathbf a')}\\cos\\beta t - ${VD('\\mathbf b')}\\operatorname{sen}\\beta t) \\\\ \\mathbf u_2 = e^{\\alpha t}(${AZ('\\mathbf a')}\\operatorname{sen}\\beta t + ${VD('\\mathbf b')}\\cos\\beta t) \\end{gathered}`],
    ['Atalho PVI', `\\mathbf X = e^{\\alpha t}\\left[\\cos\\beta t\\,${RS('\\mathbf X(0)')} + \\operatorname{sen}\\beta t\\,\\tfrac{(A - \\alpha I)${RS('\\mathbf X(0)')}}{\\beta}\\right]`],
  ],
};

const sistemaRepetido = {
  blocos: [
    { titulo: 'A ideia', html: `Com ${$(AM('\\lambda'))} duplo e $A \\ne \\lambda I$, há um só autovetor ${$(AZ('\\mathbf v'))}: falta uma solução. Ela vem com um $t$ na frente, como na raiz dupla da 2ª ordem, mais um vetor ${$(VD('\\mathbf w'))} de correção: ${$(`e^{${AM('\\lambda')} t}(t${AZ('\\mathbf v')} + ${VD('\\mathbf w')})`)}.` },
    { titulo: 'Passo a passo', html: `<ol><li>${$(AM('\\lambda = \\text{tr}/2'))}.</li><li>Autovetor ${$(AZ('\\mathbf v'))}.</li><li>Autovetor generalizado: ${$(`(A - ${AM('\\lambda')} I)${VD('\\mathbf w')} = ${AZ('\\mathbf v')}`)}.</li><li>${$(`\\mathbf X = c_1e^{${AM('\\lambda')} t}${AZ('\\mathbf v')} + c_2e^{${AM('\\lambda')} t}(t${AZ('\\mathbf v')} + ${VD('\\mathbf w')})`)}.</li></ol>` },
    { titulo: 'Pegadinha', html: `A 2ª solução não é só $te^{\\lambda t}\\mathbf v$ (falta ${$(VD('\\mathbf w'))}), e a equação de ${$(VD('\\mathbf w'))} tem ${$(AZ('\\mathbf v'))} do lado direito, não zero. Atalho de PVI: ${$(`\\mathbf X = e^{${AM('\\lambda')} t}[${RS('\\mathbf X(0)')} + t(A - \\lambda I)${RS('\\mathbf X(0)')}]`)}.` },
  ],
  formulas: [
    ['Autovalor', `\\Delta = 0 \\Rightarrow ${AM('\\lambda')} = \\tfrac{\\text{tr}\\,A}{2}`],
    ['Generalizado', `(A - ${AM('\\lambda')} I)${VD('\\mathbf w')} = ${AZ('\\mathbf v')}`],
    ['Solução geral', `\\mathbf X = c_1e^{${AM('\\lambda')} t}${AZ('\\mathbf v')} + c_2e^{${AM('\\lambda')} t}(t${AZ('\\mathbf v')} + ${VD('\\mathbf w')})`],
    ['Atalho PVI', `\\mathbf X = e^{${AM('\\lambda')} t}\\left[${RS('\\mathbf X(0)')} + t(A - ${AM('\\lambda')} I)${RS('\\mathbf X(0)')}\\right]`],
  ],
};

const metodoP4 = metodo('Aqui a questão é qual dos três casos de sistema 2×2 é.',
  `<ol><li>Calcule $\\text{tr}\\,A$, $\\det A$ e $\\Delta = \\text{tr}^2 - 4\\det$.</li><li>$\\Delta > 0$ → <b>reais distintos</b> ($\\det = 0$: um deles é zero).</li><li>$\\Delta < 0$ → <b>complexos</b>.</li><li>$\\Delta = 0$ → <b>repetido</b> (se $A \\ne \\lambda I$).</li></ol>`,
  `$\\det A < 0$ já garante autovalores reais de sinais opostos (sela), sem calcular $\\Delta$.`);
metodoP4.formulas = [['Discriminante', `\\Delta = (\\text{tr}\\,A)^2 - 4\\det A`], ['Sela', `\\det A < 0`], ['Nulo', `\\det A = 0 \\Rightarrow \\lambda = 0,\\ \\text{tr}\\,A`]];

export const TEORIA = {
  linear1, separavel, exata, teu, autonoma, metodoP1,
  wronskiano, homogenea2, coefIndet, variacao, metodoP2,
  laplaceDireta, laplaceInversa, laplacePvi, convolucao, metodoP3,
  sistemaReal, sistemaComplexo, sistemaRepetido, metodoP4,
};

/** A trilha de uma habilidade: teoria → exemplo resolvido → teoria → exercício → teoria → 2 exercícios. */
export function trilha(skill) {
  const t = TEORIA[skill];
  return [
    { tipo: 'teoria', skill, bloco: t.blocos[0] },
    { tipo: 'exemplo', skill },
    { tipo: 'teoria', skill, bloco: t.blocos[1] },
    { tipo: 'exercicio', skill },
    { tipo: 'teoria', skill, bloco: t.blocos[2] },
    { tipo: 'exercicio', skill },
    { tipo: 'exercicio', skill },
  ];
}
