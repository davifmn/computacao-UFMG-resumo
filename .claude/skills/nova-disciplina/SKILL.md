---
name: nova-disciplina
description: Receita para adicionar ao Resumão CC um período, uma disciplina ou uma página nova (visualização ou tutorial), com todos os arquivos que precisam ser tocados. Use antes de criar qualquer conteúdo em periodo-XX/ para não precisar explorar o repositório de novo.
---

# Adicionar período / disciplina / página

Detalhes da API (StepPlayer, Scene, quiz, plot, tutoriais) estão em `CONTRIBUTING.md`; leia só a seção que precisar. Não releia o repositório inteiro: copie **uma** página irmã parecida como modelo.

## Arquivos a tocar (checklist)

1. `periodo-XX/<disciplina-kebab>/`
   - `README.md` — seções: `# Nome · CÓDIGO`, `## 🎬 Visualizações`, `## 📚 Resumo teórico` (### 1., ### 2., …), `## 💻 Código`, `## ✍️ Exercícios` (gabarito em `<details>`), `## 🔗 Para ir além`. Modelo: `periodo-04/algebra-a/README.md`.
   - `codigo/` — C++ (com Makefile) ou Python, **executado e testado** antes do commit.
   - `visualizacoes/<tema>.js` (lógica pura, sem DOM, testável no Node) + `<tema>.html`.
   - ou `tutoriais/<nome>.html` para páginas-tutorial.
2. `periodo-XX/README.md` — intro do período, tabela `| Disciplina | Código | CH | Páginas interativas |` com links **absolutos do GitHub Pages** (`https://davifmn.github.io/computacao-UFMG-resumo/periodo-XX/...`), e "Dicas de quem já passou por aqui".
3. `README.md` (raiz) — bloco `### Nº período` com a tabela `| Disciplina · código | Visualizações | Código |`.
4. `catalogo.js` — objeto do período:
   ```js
   { numero: N, id: 'periodo-0N', disciplinas: [
     { id: 'curto', codigo: 'DCC123', nome: '...', cor: 'blue|green|purple|teal|...', pasta: 'periodo-0N/<disciplina>',
       resumo: '...', visualizacoes: [ { titulo, arquivo: 'x.html', descricao /*, tipo: 'tutorial' */ } ] } ] }
   ```
   Remova a disciplina de `planejadas` do período quando ela for publicada.
5. `tests/<disciplina>.test.js` — `node:test` + `assert/strict`, importando `../periodo-0N/<disc>/visualizacoes/<x>.js`. `tests/catalogo.test.js` já confere que cada página do catálogo e cada README existem.

## Trabalhos práticos e optativas

- TP entregue: `<disciplina>/trabalhos/<kebab>/` (projeto pessoal: `projetos/`), com README (problema, solução, como executar, testes, "O que mudou na migração"). Registrar em `trabalhos: [{ titulo, pasta, descricao, tags, extra? }]` da disciplina no `catalogo.js`, na seção `## 🧪 Trabalhos práticos` do README da disciplina, na tabela "Trabalhos práticos" do README do período e na do README raiz. Testes sem infraestrutura entram no job `trabalhos` do `ci.yml`.
- Optativa: `optativas/<disciplina>/` (mesma profundidade de 3 níveis), no bloco `{ id: 'optativas', titulo: 'Optativas', disciplinas: [...] }` do catálogo, breadcrumbs `index.html#optativas`; listar também em `optativas/README.md`.
- Nunca copiar `.env`, `node_modules/`, dados grandes ou material do professor.

## Página `.html` (boilerplate)

Copie o `<head>`/`topbar` de `periodo-04/algebra-a/visualizacoes/grupos.html`: favicon, KaTeX 0.16.11 via jsDelivr, `engine/theme.css`, breadcrumbs `index.html#periodo-0N` → `index.html#<id-da-disciplina>` → título; depois `main.page` com `.eyebrow`, `h1`, `p.lead`, `.toolbar`. Caminhos relativos: 3 níveis (`../../../`) em `periodo-XX/<disc>/visualizacoes/`; 4 níveis em Redes (`periodo-07/redes-de-computadores/modulo-N/...`).

## Convenções

- pt-BR, terminologia da UFMG; narração explica o **porquê**.
- Desktop (≥1280px); não gastar esforço em layout mobile. Autor: Davi Fraga.
- Animação ou tutorial: escolha o que ensina melhor.
- Use `lineFinder(CODE)` em vez de números de linha fixos.
- Sem build, sem dependências. Códigos das disciplinas: grade oficial do DCC (versão 2024).
- Problemas de livro resolvidos: confira os números com o código.

## Verificar e publicar

```bash
npm test
# navegador: python http.server é bloqueado pelo sandbox; use um servidor Node estático
node -e "const h=require('http'),f=require('fs'),p=require('path');h.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';f.readFile(p.join('.',u),(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[p.extname(u)]||'application/octet-stream'});r.end(d)})}).listen(8000)"
```

Commit direto na `main` (publica no GitHub Pages). Nunca commitar `redes/` (prints do cronograma, não rastreados). Antes do push: `echo $GH_ACCOUNT` e `git config user.email` devem ser da conta pessoal `davifmn`.
