# TP1 de Pesquisa Operacional (DCC035/UFMG): problema da clique máxima como
# programa linear inteiro, resolvido com JuMP + HiGHS.
#
#   max  Σ x_i
#   s.a. x_i + x_j <= 1   para todo par (i, j) que NÃO é aresta
#        x_i ∈ {0, 1}
#
# Uso: julia clique_maxima.jl instancias/exemplo.txt
# Formato da instância (separado por tabulação): "n<TAB>num_vertices" e uma linha
# "e<TAB>u<TAB>v" por aresta, com vértices numerados de 1 a n.

using JuMP
using HiGHS

mutable struct CliqueData
    n::Int                      # número de vértices
    ma::Array{Array{Int64}}     # matriz de adjacências
end

function readData(file)
    n = 0
    ma = [[]]
    for l in eachline(file)
        q = split(l, '\t')
        if q[1] == "n"
            n = parse(Int64, q[2])
            ma = [[0 for i=1:n] for j=1:n]
        elseif q[1] == "e"
            u = parse(Int64, q[2])
			v = parse(Int64, q[3])
            ma[u][v] = 1
            ma[v][u] = 1
        end
    end
    return CliqueData(n, ma)
end

model = Model(HiGHS.Optimizer)

file = open(ARGS[1], "r")

data = readData(file)

# Variáveis de decisão
@variable(model, x[i=1:data.n], Bin) # =1, se o vértice i faz parte da clique máxima

# Restrições
for i=1:data.n
    for j=i+1:data.n
        if data.ma[i][j] == 0
            @constraint(model, x[i] + x[j] <= 1) # vértices que não são vizinhos não participam da mesma clique
        end
    end
end

# Função objetivo
@objective(model, Max, sum(x[i] for i=1:data.n))

optimize!(model)
sol = objective_value(model)
println("Tamanho da clique máxima: ", round(Int, sol))
println("Vértices: ", [i for i in 1:data.n if value(x[i]) > 0.5])