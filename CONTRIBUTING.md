# Guia de contribuição

Obrigado por querer ajudar! Este guia mostra como criar uma visualização nova do zero.

## Princípios

1. **Código ao lado da animação.** Sempre que houver um algoritmo, mostre o código e
   destaque a linha em execução. O aluno precisa ligar o desenho ao programa.
2. **Lógica pura, desenho declarativo.** O arquivo `.js` da visualização só calcula os
   passos e não toca no DOM, para poder ser testado no Node. O `.html` só desenha.
3. **Sem build e sem dependências.** HTML, CSS e módulos ES. KaTeX vem de CDN. Qualquer
   pessoa deve conseguir clonar e abrir.
4. **Explique o porquê.** A narração de cada passo deve dizer *por que* aquilo acontece,
   não só *o que* acontece.
5. **Português do Brasil**, com a terminologia usada nas disciplinas da UFMG.

## Anatomia de uma visualização

```
periodo-XX/<disciplina>/visualizacoes/
├── minha-viz.js     # gera os passos (puro, testável)
└── minha-viz.html   # página: toolbar + player + texto + exercícios
```

### 1. Gere os passos (`minha-viz.js`)

```js
import { lineFinder } from '../../../engine/highlight.js';

export const CODE = `int soma(int v[], int n) {
    int s = 0;
    for (int i = 0; i < n; i++)
        s += v[i];
    return s;
}`;

export function somaSteps(v) {
  const L = lineFinder(CODE);       // acha linhas pelo texto: L('s += v[i]') → 4
  const steps = [];
  let s = 0;
  steps.push({ line: L('int s = 0'), msg: 'Começamos com s = 0.', vars: { s }, v, i: null });
  for (let i = 0; i < v.length; i++) {
    s += v[i];
    steps.push({ line: L('s += v[i]'), msg: `Soma v[${i}] = ${v[i]}: s = <b>${s}</b>.`, vars: { i, s }, v, i });
  }
  steps.push({ line: L('return s'), msg: `Resultado: ${s}.`, vars: { s }, v, i: null });
  return steps;
}
```

Use `lineFinder` em vez de números de linha: se alguém editar o código exibido, os
testes acusam o trecho que sumiu, em vez de a animação ficar silenciosamente errada.

### 2. Desenhe (`minha-viz.html`)

Copie o cabeçalho de qualquer página existente e monte o player:

```js
import { StepPlayer } from '../../../engine/player.js';
import { COLORS } from '../../../engine/scene.js';
import { CODE, somaSteps } from './minha-viz.js';

const player = new StepPlayer(document.querySelector('#player'), {
  code: CODE, lang: 'cpp', width: 900, height: 300,
  render(step, s) {
    step.v.forEach((x, k) => {
      const ativo = k === step.i;
      s.rect(`c${k}`, { x: 100 + k * 70, y: 120, w: 60, h: 60, stroke: ativo ? COLORS.yellow : COLORS.border });
      s.text(`t${k}`, x, { x: 130 + k * 70, y: 150, size: 20, mono: true });
    });
  },
});
player.load(somaSteps([3, 1, 4, 1, 5]));
```

**A regra de ouro da cena:** cada forma tem uma **chave**. Se a chave existe no quadro
anterior, a forma é reaproveitada e as mudanças de posição e cor são animadas. Se é
nova, aparece com fade-in. Se sumiu, some com fade-out. Para uma barra "andar" numa
troca, dê a ela uma chave ligada ao **elemento** (`bar${item.id}`), não à posição.

API da cena: `rect`, `circle`, `text`, `path`, `line` (com `arrow: true` para setas) e
`add` para qualquer outro elemento SVG. Para animações contínuas (arrastar,
interpolar matrizes), use `scene.setAnimated(false)` e redesenhe a cada quadro com `tween`.

### 3. Exercícios

```js
import { mountQuiz, mountGenerator } from '../../../engine/quiz.js';

mountQuiz(el, [{ q: 'Pergunta', options: ['certa', 'errada'], answer: 0, explain: 'Por quê.' }]);

mountGenerator(el, {           // gera uma questão nova a cada clique
  generate: () => ({ q: 'Quanto é 2 + 2?', input: true, answer: '4', explain: '...' }),
});
```

Fórmulas entre `$...$` são renderizadas com KaTeX.

### 4. Teste e registre

- Crie `tests/<disciplina>.test.js` testando a lógica (`npm test`).
- Adicione a visualização em [`catalogo.js`](catalogo.js) para ela aparecer na página inicial.
- Adicione o link no README da disciplina.

## Páginas-tutorial

Nem todo assunto pede animação. Para temas que pedem um passo a passo em texto (montar um
projeto, uma ferramenta, uma disciplina teórica), crie `<disciplina>/tutoriais/<nome>.html`
e registre-o no catálogo com `tipo: 'tutorial'`. O motor oferece:

- **Blocos de código realçados** com botão "copiar": `<pre><code data-lang="cpp">…</code></pre>`
  (linguagens: `cpp`, `python`, `bash`, `make`).
- **Código carregado do arquivo real**, para o tutorial nunca ficar desatualizado:
  `<pre data-src="../codigo/formas/Makefile"><code data-lang="make"></code></pre>`.
- **Sumário lateral** que acompanha a rolagem: `<div class="with-toc"><nav class="toc" id="toc"></nav><article class="prose" id="content">…</article></div>`
  e `buildToc($('#toc'), $('#content'))`.
- Lista numerada de passos: `<ol class="step-list">`.

## Gráficos de funções

Para Cálculo e afins, use `engine/plot.js` sobre uma `Scene`:

```js
import { Plot } from '../../../engine/plot.js';
const plot = new Plot(scene, { x: [-5, 5], y: [-3, 3] });
plot.clip(['edges', 'nodes']);            // recorta curvas que saem da janela
scene.frame(s => { plot.axes(s); plot.fn(s, 'f', Math.sin, { stroke: COLORS.blue }); });
```

`plot.X(x)`, `plot.Y(y)` e `plot.invX(px)` convertem entre coordenadas do gráfico e da tela.

## Nova disciplina ou novo período

Crie `periodo-XX/<nome-da-disciplina-em-kebab-case>/` com `README.md`, `codigo/` e
`visualizacoes/`. Siga a estrutura dos READMEs do 1º período: ementa, resumo por
tópicos, visualizações, código e exercícios com gabarito em `<details>`.

## Checklist do pull request

- [ ] `npm test` passa (inclui um teste que confere se tudo que está no catálogo existe)
- [ ] Os controles funcionam pelo teclado
- [ ] A narração explica o *porquê*
- [ ] A visualização foi adicionada ao `catalogo.js` e ao README da disciplina
