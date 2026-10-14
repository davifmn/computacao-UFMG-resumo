# Engenharia de Software

> 6º período · 60h · Departamento de Ciência da Computação · código ainda não definido na grade de 2024 (aparece como "DCCXXX") · conteúdo extensionista.

Programar sozinho um trabalho de faculdade e construir, em equipe, um sistema que vai ser
mantido por anos são atividades diferentes. A engenharia de software estuda a segunda:
**processos** (como organizar o trabalho), **requisitos** (o que construir), **projeto**
(como dividir o sistema para que ele continue fácil de mudar), **testes** (como ganhar
confiança), **controle de versões** e **manutenção**. No DCC, a referência é o livro
*Engenharia de Software Moderna*, do prof. Marco Tulio Valente.

## 🎬 Páginas

| | Página | O que você vai ver |
|---|---|---|
| 🌿 | [Git por dentro](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/engenharia-de-software/visualizacoes/git.html) | Um terminal Git de verdade (commit, branch, switch, merge, rebase, reset, revert) desenhando o grafo de commits, os ramos como ponteiros e o HEAD; cenários de merge de três vias, avanço rápido, rebase e desfazer |
| 🧪 | [Testes e cobertura](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/engenharia-de-software/visualizacoes/testes.html) | Monte uma suíte para a função de triângulos e veja cobertura de comandos e de ramos no código e o teste de mutação: 100% de cobertura com metade dos bugs sobrevivendo |
| 🔄 | [Processos de software](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/engenharia-de-software/tutoriais/processos.html) | **Tutorial:** cascata, Manifesto Ágil, Scrum, XP, Kanban e DevOps, com um gráfico de burndown interativo |
| 🧩 | [Projeto de software](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/engenharia-de-software/tutoriais/projeto.html) | **Tutorial:** coesão, acoplamento, SOLID, padrões de projeto (Strategy, Observer, Adapter, Decorator, Factory), code smells, refatoração e arquitetura, com o código testado |

## 📚 Resumo teórico

### 1. Processos

- Dificuldades essenciais × acidentais (Brooks); lei de Brooks.
- **Cascata**, espiral, Processo Unificado; **Manifesto Ágil**; **Scrum** (papéis, eventos, artefatos, histórias de usuário, pontos, velocidade, burndown); **XP** (pares, TDD, integração contínua, refatoração, YAGNI); **Kanban** (limite de WIP, lei de Little).

### 2. Requisitos

- Funcionais × não funcionais (desempenho, segurança, usabilidade); elicitação; histórias de usuário (INVEST) e critérios de aceitação; casos de uso; protótipos e MVP.

### 3. Modelagem

- UML: diagramas de **classes**, de **sequência**, de **casos de uso**, de **atividades** e de estados. Use para comunicar e esboçar, não como fim em si.

### 4. Projeto

- **Coesão**, **acoplamento**, ocultação de informação, integridade conceitual.
- **SOLID**, composição em vez de herança, lei de Demeter.
- **Padrões de projeto** (criacionais, estruturais, comportamentais).
- **Arquitetura**: camadas, MVC, microsserviços, orientada a eventos.

### 5. Testes

- Pirâmide de testes: unidade, integração, ponta a ponta. Testes de regressão, aceitação, desempenho.
- Caixa-preta (classes de equivalência, valor-limite) e caixa-branca (cobertura de comandos, ramos, caminhos); **teste de mutação**.
- Dublês (mocks, stubs), **TDD**, testabilidade.

### 6. Refatoração e manutenção

- Code smells e refatorações (extrair método/classe, mover método, substituir condicional por polimorfismo); dívida técnica; manutenção corretiva, adaptativa, evolutiva.

### 7. DevOps

- Controle de versões (Git: commits, ramos, merge, rebase); revisão de código e pull requests; **integração**, **entrega** e **implantação contínuas**; feature flags.

## 💻 Código

```bash
cd codigo
python3 -m unittest -v      # 18 testes
python3 git_objetos.py
```

| Arquivo | Conteúdo |
|---|---|
| [`triangulo.py`](codigo/triangulo.py) + [`test_triangulo.py`](codigo/test_triangulo.py) | A função da página de testes e uma suíte com classes de equivalência e valores-limite que mata todos os mutantes |
| [`padroes.py`](codigo/padroes.py) + [`test_padroes.py`](codigo/test_padroes.py) | Uma loja virtual com Strategy, Observer, Adapter, Decorator e Factory; o teste do Observer usa um `Mock` no lugar do servidor de e-mail; o caso Quadrado × Retângulo mostrando a violação de Liskov |
| [`git_objetos.py`](codigo/git_objetos.py) | Como o Git calcula o id de um arquivo (SHA-1 de `blob <tamanho>\0<conteúdo>`), conferido com `git hash-object` |

## ✍️ Exercícios

1. Escreva uma história de usuário (com critérios de aceitação) para "recuperar senha por e-mail".
2. Uma classe `Relatorio` lê dados do banco, calcula estatísticas e gera PDF. Que princípio ela viola? Como dividir?
3. Dê casos de teste por classes de equivalência e valores-limite para uma função que aceita idades de 18 a 65 anos.
4. Por que um teste com `assert True` no fim pode ter 100% de cobertura? O que detectaria o problema?
5. Você fez `git commit` três vezes na `main` local e percebeu que deveriam estar num ramo `feature`. Como consertar sem perder nada?
6. Qual padrão de projeto usar para: (a) trocar o algoritmo de ordenação em tempo de execução; (b) avisar várias telas quando um dado muda; (c) usar uma biblioteca de pagamento com interface diferente da sua?

<details>
<summary>Gabarito</summary>

1. "Como usuário que esqueceu a senha, quero receber um link por e-mail para criar uma nova senha, para voltar a acessar minha conta." Critérios: o link expira em 1 hora; só funciona uma vez; e-mails não cadastrados recebem a mesma mensagem genérica (para não revelar quem tem conta); a nova senha segue a política de senhas.
2. Responsabilidade única (e coesão). Separar em `RepositorioDeDados`, `Estatisticas` e `GeradorPdf`, com `Relatorio` só coordenando, de preferência recebendo as dependências por injeção.
3. Classes: < 18 (inválido), 18–65 (válido), > 65 (inválido). Valores-limite: 17, 18, 65, 66 (e talvez 0, valores negativos e não numéricos).
4. Cobertura mede o que é executado, não o que é verificado. O teste de mutação detectaria: nenhum mutante seria morto.
5. `git branch feature` (o ramo novo aponta para os 3 commits), `git reset --hard HEAD~3` (a `main` volta para trás), `git switch feature`. Se a `main` já tivesse sido publicada, seria melhor fazer `revert`.
6. (a) Strategy; (b) Observer; (c) Adapter.

</details>

## 🔗 Para ir além

- [*Engenharia de Software Moderna*](https://engsoftmoderna.info/), Marco Tulio Valente (DCC/UFMG): livro gratuito, base da disciplina.
- *Refatoração*, Martin Fowler; *Padrões de Projeto*, Gamma, Helm, Johnson e Vlissides.
- *O Mítico Homem-Mês*, Fred Brooks: os ensaios clássicos, incluindo "Não existe bala de prata".
- [*Pro Git*](https://git-scm.com/book/pt-br/v2), Scott Chacon: o livro oficial do Git, em português.
