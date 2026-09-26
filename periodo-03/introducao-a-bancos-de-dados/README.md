# Introdução a Bancos de Dados · DCC222

> 3º período · 60h · Pré-requisito: PDS II.

Quase todo sistema de verdade guarda seus dados num banco: modelar bem, consultar bem e
garantir a integridade é uma habilidade que você vai usar em todo estágio e emprego.

## 🎬 Páginas interativas

| | Página | O que você vai ver |
|---|---|---|
| 🛢️ | [Tutorial: SQL na prática](tutoriais/sql.html) | Um **SQLite de verdade rodando no navegador**: SELECT, filtros, agregação, JOINs, subconsultas, transações, criação de tabelas e índices, com 12 exercícios corrigidos automaticamente |
| 🔀 | [Como um JOIN funciona](visualizacoes/joins.html) | O algoritmo de laços aninhados passo a passo para INNER, LEFT, RIGHT e FULL JOIN, com o tratamento de NULL |

O banco de exemplo ([`tutoriais/universidade.sql`](tutoriais/universidade.sql)) também pode ser aberto no `sqlite3`, no DB Browser for SQLite ou no Python.

## 📚 Resumo teórico

### 1. Por que um SGBD?

Em vez de arquivos soltos, um sistema gerenciador de banco de dados oferece: independência
entre dados e programas, consultas declarativas, controle de concorrência, recuperação de
falhas, integridade e segurança. **Arquitetura em três níveis:** externo (visões), conceitual
(esquema lógico) e interno (armazenamento).

### 2. Modelagem conceitual: Entidade-Relacionamento

- **Entidades** (retângulos), **atributos** (elipses; chave sublinhada) e **relacionamentos** (losangos).
- Cardinalidades 1:1, 1:N e N:M; participação total ou parcial; entidades fracas; especialização/generalização.

### 3. Modelo relacional

- Relação (tabela), tupla (linha) e atributo (coluna) com domínio.
- **Chaves:** superchave, chave candidata, chave primária e chave estrangeira.
- **Restrições de integridade:** de domínio, de entidade (PK não nula) e referencial (FK aponta para algo que existe).
- **Mapeamento ER → relacional:** N:M vira uma tabela própria (como `matriculas`); 1:N vira uma FK do lado N.

### 4. Álgebra relacional

Seleção $\sigma$, projeção $\pi$, produto cartesiano $\times$, junção $\bowtie$, união $\cup$,
diferença $-$, renomeação $\rho$ e divisão $\div$. SQL é (quase) uma versão
declarativa da álgebra relacional, e o otimizador traduz a consulta para um plano algébrico.

### 5. SQL

- **DDL:** `CREATE TABLE`, `ALTER`, `DROP`, restrições (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL`).
- **DML:** `SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY`, `INSERT`, `UPDATE`, `DELETE`.
- JOINs, subconsultas (`IN`, `EXISTS`, correlacionadas), visões (`CREATE VIEW`) e a lógica de três valores com `NULL`.

### 6. Normalização

Evita redundância e anomalias de inserção, remoção e atualização.
- **Dependência funcional** $X \to Y$: X determina Y.
- **1FN:** atributos atômicos. **2FN:** sem dependências parciais da chave. **3FN:** sem dependências transitivas. **FNBC:** todo determinante é superchave.

### 7. Transações e índices

- **ACID** e controle de concorrência (bloqueios em duas fases); recuperação por log.
- **Índices** (árvore B+, hash) aceleram consultas ao custo de espaço e de escritas mais lentas.

## 💻 Código

[`codigo/consultas.py`](codigo/consultas.py): SQLite no Python com **consultas
parametrizadas** (proteção contra SQL injection) e verificação automática das respostas
de todos os exercícios do tutorial.

## ✍️ Exercícios

1. Modele: um aluno cursa várias disciplinas e uma disciplina tem vários alunos, e cada matrícula tem nota e semestre. Quais tabelas surgem?
2. A tabela `Pedido(num, cliente_id, cliente_nome, produto, preco)` com `cliente_id → cliente_nome` está em 3FN? Normalize.
3. Qual a diferença entre `WHERE` e `HAVING`?
4. Por que `SELECT * FROM t WHERE x = NULL` nunca devolve linhas?
5. Escreva em álgebra relacional: nomes dos alunos que cursaram DCC221.

<details>
<summary>Gabarito</summary>

1. `alunos`, `disciplinas` e `matriculas(aluno, disciplina, semestre, nota)`, com PK composta e duas FKs. É o relacionamento N:M com atributos.
2. Não: há uma dependência que não parte da chave (`cliente_id → cliente_nome`). Separe em `Cliente(id, nome)` e `Pedido(num, cliente_id, produto, preco)`.
3. `WHERE` filtra linhas antes do agrupamento; `HAVING` filtra grupos depois, e pode usar agregações.
4. Comparar com NULL dá *desconhecido*, que não é verdadeiro. Use `x IS NULL`.
5. $\pi_{nome}(\text{alunos} \bowtie \sigma_{codigo='DCC221'}(\text{matriculas}))$.

</details>

## 🔗 Para ir além

- *Sistemas de Banco de Dados*, Elmasri & Navathe.
- [SQLBolt](https://sqlbolt.com/) e [SQL Murder Mystery](https://mystery.knightlab.com/) — mais prática de SQL.
- [Use The Index, Luke](https://use-the-index-luke.com/) — índices explicados para desenvolvedores.
