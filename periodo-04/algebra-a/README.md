# Álgebra A · MAT034

> 4º período · 60h · Departamento de Matemática.

A álgebra abstrata estuda **estruturas**: o que somar horas num relógio, girar um quadrado
e embaralhar cartas têm em comum. Para a computação, ela é a base da criptografia (RSA,
curvas elípticas, AES), dos códigos corretores de erros, do hashing e de boa parte da
teoria dos algoritmos aleatorizados.

## 🎬 Visualizações

| | Visualização | O que você vai ver |
|---|---|---|
| 🔷 | [Grupos e simetrias](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/algebra-a/visualizacoes/grupos.html) | Tabelas de Cayley de ℤₙ, ℤₙ×, Dₙ e Sₙ. Clique num elemento para ver o subgrupo gerado e as classes laterais colorindo a tabela (Lagrange), e num produto para ver o polígono girar e refletir |
| 🔀 | [Permutações](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/algebra-a/visualizacoes/permutacoes.html) | Composição em notação de duas linhas, ciclos, ordem e sinal; e o embaralhamento perfeito, em que 8 repetições devolvem um baralho de 52 cartas à ordem original |
| 🕰️ | [Teorema Chinês do Resto](https://davifmn.github.io/computacao-UFMG-resumo/periodo-04/algebra-a/visualizacoes/teorema-chines.html) | A trilha de x ↦ (x mod m, x mod n) cobrindo a grade, a solução por Euclides estendido e por que φ(mn) = φ(m)φ(n) |

## 📚 Resumo teórico

### 1. Inteiros

- **Divisão euclidiana**: $a = bq + r$, $0 \le r < |b|$. **Algoritmo de Euclides** e a identidade de Bézout: $\text{mdc}(a, b) = ax + by$.
- **Teorema fundamental da aritmética**: fatoração única em primos. Há infinitos primos (Euclides).
- **Congruências**: $a \equiv b \pmod n \iff n \mid a - b$. $a$ tem inverso módulo $n$ ⇔ $\text{mdc}(a, n) = 1$.
- **Teorema Chinês do Resto**: com módulos coprimos dois a dois, o sistema tem solução única módulo o produto.
- **Fermat**: $a^{p-1} \equiv 1 \pmod p$ ($p \nmid a$). **Euler**: $a^{\varphi(n)} \equiv 1 \pmod n$. **Wilson**: $(p-1)! \equiv -1 \pmod p$.

### 2. Grupos

- Axiomas: fechamento, associatividade, neutro, inversos. Abeliano se comutativo.
- Exemplos: $(\mathbb{Z}_n, +)$, $(\mathbb{Z}_n^\times, \cdot)$ com $\varphi(n)$ elementos, $D_n$ (ordem $2n$), $S_n$ (ordem $n!$), $GL_n(\mathbb{R})$.
- **Subgrupos**, subgrupo cíclico $\langle g \rangle$, **ordem** de um elemento.
- **Classes laterais** e o **Teorema de Lagrange**: $|H|$ divide $|G|$. Corolários: Fermat e Euler; grupos de ordem prima são cíclicos.
- **Subgrupos normais** e **grupos quociente** $G/N$. **Homomorfismos**, núcleo, imagem e o Teorema do Isomorfismo: $G/\ker f \cong \text{Im} f$.
- **Grupos cíclicos**: todo cíclico de ordem $n$ é isomorfo a $\mathbb{Z}_n$; $\mathbb{Z}_n^\times$ é cíclico para $n = 2, 4, p^k, 2p^k$ (raízes primitivas).

### 3. Permutações

- Ciclos disjuntos, ordem = mmc dos tamanhos dos ciclos, transposições, **sinal** e o grupo alternado $A_n$.
- **Teorema de Cayley**: todo grupo é um grupo de permutações.

### 4. Anéis e corpos

- **Anel**: soma (grupo abeliano) e produto associativo, com distributividade. $\mathbb{Z}$, $\mathbb{Z}_n$, polinômios $K[x]$, matrizes.
- **Domínio de integridade** (sem divisores de zero) e **corpo** (todo não nulo invertível). $\mathbb{Z}_n$ é corpo ⇔ $n$ é primo.
- **Ideais**, anel quociente; em $K[x]$, divisão com resto e mdc como nos inteiros; $K[x]/(p(x))$ é corpo quando $p$ é irredutível (é assim que se constroem os corpos finitos $\mathbb{F}_{p^k}$ do AES).

## 💻 Código

```bash
python3 codigo/algebra.py
```

| Arquivo | Conteúdo |
|---|---|
| [`algebra.py`](codigo/algebra.py) | Euclides estendido, inversos, TCR para módulos quaisquer, φ, Euler verificado para todo $n < 200$, RSA decifrando pelo TCR, uma classe `Grupo` que confere os axiomas e Lagrange em todos os subgrupos de ℤ₁₂, ℤ₁₅×, D₄, D₅ e S₄, e o embaralhamento perfeito |

## ✍️ Exercícios

1. Calcule $7^{222} \bmod 11$.
2. Ache o inverso de 17 módulo 3120.
3. Liste os subgrupos de $\mathbb{Z}_{12}$. Quantos são?
4. Mostre que todo grupo de ordem 4 é isomorfo a $\mathbb{Z}_4$ ou a $\mathbb{Z}_2 \times \mathbb{Z}_2$.
5. Resolva $x \equiv 3 \pmod 4$, $x \equiv 4 \pmod 5$, $x \equiv 1 \pmod 9$.
6. Escreva $(1\,2\,3\,4\,5)$ como produto de transposições. Ela é par ou ímpar?

<details>
<summary>Gabarito</summary>

1. Por Fermat, $7^{10} \equiv 1$. $222 = 22 \cdot 10 + 2$, então $7^{222} \equiv 7^2 = 49 \equiv 5 \pmod{11}$.
2. Euclides estendido: $17 \cdot 2753 - 3120 \cdot 15 = 1$, logo $17^{-1} \equiv 2753$. (É o expoente secreto do exemplo clássico de RSA com $p = 61$, $q = 53$.)
3. Um para cada divisor de 12: $\langle 0 \rangle$, $\langle 6 \rangle$, $\langle 4 \rangle$, $\langle 3 \rangle$, $\langle 2 \rangle$, $\langle 1 \rangle$. São 6 (subgrupos de cíclicos são cíclicos, e há exatamente um de cada ordem que divide $n$).
4. Pela Lagrange, os elementos têm ordem 1, 2 ou 4. Se algum tem ordem 4, o grupo é cíclico ($\cong \mathbb{Z}_4$). Senão, todos os $\ne e$ têm ordem 2, o grupo é abeliano ($ab = (ab)^{-1} = b^{-1}a^{-1} = ba$) e é o grupo de Klein $\mathbb{Z}_2 \times \mathbb{Z}_2$.
5. Das duas primeiras: $x \equiv 19 \pmod{20}$. Com a terceira: $19 + 20k \equiv 1 \pmod 9 \Rightarrow 1 + 2k \equiv 1 \Rightarrow k \equiv 0$. Logo $x \equiv 19 \pmod{180}$.
6. $(1\,2\,3\,4\,5) = (1\,5)(1\,4)(1\,3)(1\,2)$: 4 transposições, **par**.

</details>

## 🔗 Para ir além

- *Introdução à Álgebra*, Adilson Gonçalves (IMPA): o texto clássico dos cursos brasileiros.
- *Elementos de Aritmética*, Abramo Hefez; *Visual Group Theory*, Nathan Carter (com figuras como as desta página).
- [Group Explorer](https://nathancarter.github.io/group-explorer/): tabelas de Cayley e diagramas de muitos grupos.
