# Gerador de código e alocação de registradores

**Compiladores I (DCC053) · UFMG** · Python · RISC-V

Trabalho da sequência de exercícios (VPL) da disciplina: compilar uma linguagem de
expressões no estilo ML para um assembly RISC-V simplificado e depois **alocar
registradores**, já que o gerador de código usa quantas variáveis virtuais quiser e a
máquina só tem 4 registradores livres (`a0`–`a3`).

```
fonte ──Lexer──▶ tokens ──Parser──▶ AST ──RenameVisitor──▶ AST com nomes únicos
      ──GenVisitor──▶ assembly com variáveis virtuais ──RegAllocator──▶ assembly com a0..a3 + memória
```

## A linguagem

```sml
let x <- 4 in
  let y <- x * x in
    y - x / 2
  end
end                      (* resposta: 14 *)
```

Inteiros, `true`/`false`, `+ - * /`, `~` (menos unário), `=`, `<`, `<=`, `not` e
`let ... in ... end` com escopo aninhado e sombreamento. O parser já reconhece `if`,
`and`, `or` e `fn` das próximas etapas da disciplina, mas os nós correspondentes da AST
não fazem parte desta entrega.

## As etapas

| Arquivo | Papel |
|---|---|
| `Lexer.py` | autômato que transforma o texto em tokens (comentários `--` e `(* *)` são descartados) |
| `Parser.py` | descendente recursivo, um método por nível de precedência (`parse_or` → `parse_and` → comparações → `+ -` → `* /` → unários → valores) |
| `Expression.py` | nós da AST e o padrão *visitor* (`accept`) |
| `Visitor.py` | `RenameVisitor` (dá nomes únicos a cada `let`) e `GenVisitor` (gera o código) |
| `Asm.py` | instruções RISC-V (`addi`, `add`, `mul`, `slt`, `xori`, `lw`, `sw`, `beq`, `jal`...) e um interpretador para executar o programa |
| `Optimizer.py` | `RegAllocator`, a alocação de registradores |
| `driver.py` | lê o programa da entrada padrão, compila, aloca, executa e imprime a resposta |

**Alocação.** O alocador é local: cada variável virtual mora num endereço de memória, e
registradores só existem dentro de uma instrução. Antes de usar um operando, ele é
carregado (`lw`) num registrador livre; depois de calcular, o resultado volta para a
memória (`sw`). É a forma mais simples que funciona com **qualquer** número de variáveis
vivas, ao custo de muitos acessos à memória:

```
antes da alocação              depois
v1  = addi x0 4                a1 = addi x0 4      ; sw a1, 0(x0)
x_0 = addi v1 0                lw a1, 0(x0)  ; a1 = addi a1 0 ; sw a1, 1(x0)
v2  = addi x0 3                a1 = addi x0 3      ; sw a1, 2(x0)
v3  = mul x_0 v2               lw a1, 1(x0)  ; lw a2, 2(x0) ; a1 = mul a1 a2 ; sw a1, 3(x0)
```

Alocadores de verdade (coloração do grafo de interferência, *linear scan*) mantêm
variáveis em registradores enquanto estão vivas e só fazem *spill* quando faltam
registradores.

## Como executar

```bash
python3 driver.py < exemplos/potencia.txt     # Answer: 14
python3 driver.py < exemplos/spill.txt        # 5 variáveis vivas, 4 registradores: Answer: 15
echo "let x <- 3 in x * 2 end" | python3 driver.py
python3 -m unittest test_compilador.py
```

## Testes

`test_compilador.py` compila, aloca e executa:
- exemplos escritos à mão (precedência, divisão inteira, comparações, sombreamento, mais
  variáveis vivas do que registradores);
- 300 programas aleatórios com `let` aninhados, comparando com o valor calculado em
  Python. Na migração, rodaram também 20 000 programas aleatórios sem nenhuma divergência.

Os *doctests* espalhados pelos arquivos vêm do esqueleto da disciplina e incluem exemplos
de etapas anteriores (como um `EvalVisitor` que não existe aqui), então não servem como
suíte de testes desta etapa.

## O que mudou na migração

**Bug corrigido no `RenameVisitor`.** O nome único era `nome_<altura da pilha de escopos>`.
Dois `let` **irmãos** com o mesmo nome, como em

```sml
(let x <- 0 in x end) + (let x <- 3 in 3 end)
```

recebiam os dois o nome `x_0`, e o segundo sobrescrevia o primeiro (o programa dava 6 em
vez de 3). Agora o sufixo vem de um contador que só cresce. O bug aparecia em cerca de 5%
dos programas aleatórios.

## Veja também

- Teoria de geração de código e alocação de registradores: [README de Compiladores I](../../README.md)
- Visualização: [geração de código passo a passo](https://davifmn.github.io/computacao-UFMG-resumo/periodo-06/compiladores-1/visualizacoes/geracao-de-codigo.html)

---
Autor: Davi Fraga (sobre o esqueleto fornecido pela disciplina: `driver.py`, `Asm.py` e a
estrutura das classes) · migrado de [`davifmn/tpcompilers`](https://github.com/davifmn/tpcompilers)
