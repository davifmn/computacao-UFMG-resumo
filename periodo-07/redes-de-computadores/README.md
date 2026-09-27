# Redes de Computadores · DCC023

> 7º período · 60h · Livro-texto: A. S. Tanenbaum e D. J. Wetherall, *Computer Networks*, 5ª ed. (2011).

Como os computadores conversam: dos sinais elétricos e ópticos até as aplicações.
O material segue o livro capítulo por capítulo e foi dividido pelas duas provas:

| Módulo | Capítulos | Pasta |
|---|---|---|
| **1 · Prova 1** | 1 Introdução · 2 Camada física · 3 Camada de enlace · 4 Subcamada MAC | [`modulo-1/`](modulo-1/) |
| **2 · Prova 2** | 5 Camada de rede · 6 Transporte · 7 Aplicação · 8 Segurança | [`modulo-2/`](modulo-2/) *(em construção)* |

Cada módulo tem:

- **`tutoriais/`**: um guia de estudo por capítulo, com a teoria em português, fórmulas, os
  exercícios do livro resolvidos (os mais prováveis de cair marcados com 📌) e um quiz.
- **`visualizacoes/`**: páginas interativas no espírito do 3Blue1Brown, com exercícios gerados
  automaticamente. A lógica fica em `redes.js`, testada em `tests/redes-modulo-1.test.js`.
- **`codigo/`**: implementações em Python puro que conferem os exemplos do livro.
