# BarberFlow · secretaria virtual para barbearias

**Engenharia de Software · UFMG** · Node.js · Express · MongoDB · Jest

O BarberFlow automatiza o agendamento numa barbearia: o cliente vê os serviços, escolhe o
barbeiro e um horário livre na agenda dele, e confirma, sem precisar de alguém para
atender o telefone.

| Papel | Pessoa |
|---|---|
| Full-stack, back-end e integração de IA | Davi Fraga |
| Front-end, Product Owner e QA | Nadezhda Tarubarova |

## Histórias de usuário

1. Como cliente, quero ver a lista de serviços (corte, barba) e os preços.
2. Como cliente, quero escolher um barbeiro específico.
3. Como cliente, quero escolher data e hora num calendário.
4. Como cliente, quero ver meus agendamentos futuros.
5. Como barbeiro, quero ver minha agenda do dia.
6. Como dono, quero cadastrar serviços e preços.
7. Como dono, quero cancelar ou remarcar horários.
8. Como administrador, quero um resumo dos agendamentos do mês.

## Arquitetura

```
navegador (HTML/CSS/JS)                API (Express)                 MongoDB (Mongoose)
auth/welcome, sign_in, sign_up  ──▶   POST /api/auth/register         ──▶  User
                                       POST /api/auth/login
main/home, appointment, confirm ──▶   GET  /api/workers               ──▶  Worker { name, specialties, board }
                                       POST /api/workers/board            Board: semana × horários (livre/ocupado)
                                       POST /api/workers/book
```

| Pasta | Conteúdo |
|---|---|
| `server.js` | aplicação Express, CORS, conexão com o MongoDB |
| `routes/` | rotas de autenticação e de barbeiros, com testes de integração (supertest) |
| `packages/` | modelos (`User`, `Worker`) e a agenda (`Board`), com testes de unidade |
| `auth/`, `main/` | telas: boas-vindas, login, cadastro, início, agendamento e confirmação |
| `seed.js` | popula o banco com 15 barbeiros fictícios e agendas aleatórias |
| `assets/` | imagem de fundo compartilhada pelas telas |

## Como executar

```bash
npm install
cp .env.example .env        # e preencha MONGO_URI (MongoDB local ou Atlas)
npm run seed                # opcional: barbeiros de exemplo
npm start                   # API em http://localhost:3000
```

As telas são HTML estático: abra `index.html` com qualquer servidor local
(`npx serve .`) com a API rodando.

## Testes

```bash
npm test
```

14 testes (Jest + supertest + `mongodb-memory-server`, que sobe um MongoDB em memória, sem
precisar de banco instalado), com meta de 80% de cobertura:

```
File            | % Stmts | % Branch | % Funcs | % Lines
All files       |   90.62 |      100 |     100 |      90
```

## Limitações conhecidas

- **Senhas em texto puro.** `User` guarda a senha como veio, e o login compara direto. Em
  produção, use `bcrypt` (ou `argon2`) para guardar só o hash, e devolva um token de sessão
  (JWT ou cookie) no login.
- `routes/workerRoutes.js` está fora da meta de cobertura (`jest.config.js`).

## O que mudou na migração

- **Removido o `.env` com a string de conexão do MongoDB Atlas** (usuário e senha), que
  estava versionado no repositório original; entrou um `.env.example` e um `.gitignore`.
  A credencial antiga continua no histórico público do repositório original e precisa ser
  trocada no Atlas.
- Removidos `node_modules/` (146 MB), `coverage/`, arquivos `.DS_Store` e um CSS duplicado
  (`sign)in.css`); as seis cópias idênticas de `bg1.jpg` viraram uma só em `assets/`.
- `package.json` com nome, descrição, autores e o script `seed`.

---
Migrado de [`davifmn/Eng_Software`](https://github.com/davifmn/Eng_Software)
