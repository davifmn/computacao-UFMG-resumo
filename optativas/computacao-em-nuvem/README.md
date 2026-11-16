# Computação em Nuvem · optativa

> Optativa do DCC · Docker, Kubernetes e Argo CD num cluster da disciplina.

"Nuvem" é rodar software em infraestrutura alugada e elástica, sem cuidar de máquinas
físicas. Na prática, isso significa empacotar aplicações em **contêineres**, deixar um
**orquestrador** (Kubernetes) decidir onde elas rodam e reiniciá-las quando caem, e
descrever o estado desejado em arquivos versionados que um sistema de **GitOps** aplica
sozinho.

## 🧪 Trabalhos práticos

| Trabalho | Tema | Tecnologias |
|---|---|---|
| [Recomendador de playlists](trabalhos/recomendador-de-playlists/) | Regras de associação (FP-Growth) treinadas num Job, servidas por uma API que recarrega o modelo sem reiniciar, com implantação contínua | Python, Flask, Docker, Kubernetes, Argo CD |

## 📚 Resumo teórico

### 1. Modelos de serviço e virtualização

- **IaaS** (máquinas virtuais), **PaaS** (plataforma gerenciada), **SaaS** (aplicação pronta); *serverless* (funções cobradas por execução).
- **Máquina virtual** × **contêiner**: a VM emula um computador inteiro com seu kernel; o contêiner é um processo isolado (namespaces e cgroups do Linux) que compartilha o kernel do hospedeiro, por isso sobe em milissegundos.
- Elasticidade: escalar horizontalmente (mais réplicas) é mais fácil quando a aplicação **não guarda estado** em memória local.

### 2. Contêineres

- **Imagem** (camadas somente leitura, descritas por um `Dockerfile`) × **contêiner** (instância em execução, com uma camada gravável).
- Volumes para dados que precisam sobreviver ao contêiner; variáveis de ambiente para configuração (os *twelve-factor apps*).

### 3. Kubernetes

- **Pod**: um ou mais contêineres que compartilham rede e volumes; a menor unidade agendada.
- **Deployment** (réplicas idênticas e sem estado, atualização gradual), **StatefulSet** (identidade e disco estáveis), **Job**/**CronJob** (tarefas que terminam), **DaemonSet** (um por nó).
- **Service** dá um endereço estável a um conjunto de pods (ClusterIP, NodePort, LoadBalancer); **Ingress** roteia HTTP.
- **PersistentVolumeClaim**: pedido de armazenamento; o modo de acesso importa (`ReadWriteOnce` × `ReadWriteMany`).
- *Probes*: **liveness** (reinicia se travou) e **readiness** (só recebe tráfego quando estiver pronto).
- Tudo é declarativo: você descreve o estado desejado e os controladores reconciliam o estado real.

### 4. Entrega contínua e GitOps

- O repositório Git é a fonte da verdade dos manifestos; o **Argo CD** compara o cluster com o Git e sincroniza (com `selfHeal`, desfaz mudanças manuais).
- *Hooks* de sincronização rodam Jobs (migrações, treino de modelos) a cada implantação.
- Estratégias de atualização: *rolling update*, *blue-green*, *canary*.

### 5. Regras de associação (o domínio do TP)

- **Suporte** $s(A) = $ fração das cestas que contêm $A$; **confiança** $c(A \Rightarrow B) = s(A \cup B)/s(A)$; **lift** $= c(A \Rightarrow B)/s(B)$ (> 1: aparecem juntos mais que por acaso).
- **Apriori** gera candidatos nível a nível (todo subconjunto de um conjunto frequente é frequente); **FP-Growth** comprime as cestas numa árvore de prefixos e minera sem gerar candidatos.

## ✍️ Exercícios

1. Em 1 000 playlists, a música A aparece em 200, a B em 250 e as duas juntas em 150. Calcule suporte, confiança e lift de $A \Rightarrow B$.
2. Que objeto do Kubernetes usar para treinar o modelo uma vez a cada implantação? E para servir a API?
3. Por que o volume do modelo no TP precisa ser `ReadWriteMany`?
4. Alguém muda à mão (`kubectl edit`) o número de réplicas de um Deployment gerenciado pelo Argo CD com `selfHeal`. O que acontece?
5. Qual a diferença entre *liveness* e *readiness probe*? O que daria errado usando só a primeira numa API que demora 30 s carregando o modelo?

<details>
<summary>Gabarito</summary>

1. Suporte $= 150/1000 = 0{,}15$; confiança $= 150/200 = 0{,}75$; lift $= 0{,}75/0{,}25 = 3$: quem tem A tem B três vezes mais que a média.
2. Um **Job** (no TP, como *hook* de sincronização do Argo CD) para o treino; um **Deployment** com um **Service** para a API.
3. O Job escreve o modelo e as 4 réplicas da API o leem, possivelmente em nós diferentes ao mesmo tempo; `ReadWriteOnce` só permite montar o volume para escrita num nó.
4. O Argo CD detecta a diferença com o Git e volta ao número de réplicas do manifesto. Para mudar de verdade, faça um commit.
5. *Liveness* responde "está vivo?" (se falhar, o pod é reiniciado); *readiness* responde "pode receber tráfego?" (se falhar, o pod sai do Service). Só com liveness, o Service mandaria requisições durante o carregamento (erros), e uma liveness agressiva poderia até reiniciar o pod antes de ele terminar de carregar.

</details>

## 🔗 Para ir além

- *Kubernetes in Action*, Marko Lukša.
- *Designing Data-Intensive Applications*, Martin Kleppmann.
- [Documentação do Kubernetes](https://kubernetes.io/pt-br/docs/home/) e do [Argo CD](https://argo-cd.readthedocs.io/).
- *Mining of Massive Datasets*, Leskovec, Rajaraman e Ullman, cap. 6: itens frequentes.
